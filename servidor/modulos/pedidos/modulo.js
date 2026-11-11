// Módulo pedidos: el cliente envía y sigue su pedido; la cocina los ve y avanza su estado
import { randomBytes } from 'node:crypto';
import { requiereSesion } from '../../nucleo/sesion.js';
import { abrirFlujo } from '../../nucleo/eventos.js';
import { texto, entero, noEncontrado, ErrorValidacion } from '../../nucleo/validacion.js';
import { crearRepositorioPedidos } from './repositorio.js';
import { calcularTotales, siguienteEstado, agruparLineas } from './calculos.js';

const CODIGO_VALIDO = /^[a-f0-9]{24}$/;

export default {
  nombre: 'pedidos',
  requiere: ['menu'],

  iniciar({ db, config, router, servicios, eventos, sesion, ajustes }) {
    const repositorio = crearRepositorioPedidos(db);
    const { estadosPedido, limites } = config.general;
    const { porcentajeServicio, maximoMesas } = config.cliente.negocio;
    const [estadoInicial] = estadosPedido;

    function leerMesa(valor) {
      const mesa = entero(valor, { campo: 'mesa', minimo: 1, maximo: maximoMesas });
      const mesas = servicios.obtener('mesas');
      const mesasActivas = ajustes.modulosActivos().includes('mesas');
      if (mesas && mesasActivas && !mesas.existe(mesa)) throw new ErrorValidacion('Esta mesa no existe.');
      return mesa;
    }

    // Precios y nombres salen siempre de la carta del servidor, nunca del cliente
    function leerLineas(valor) {
      if (!Array.isArray(valor) || valor.length === 0) throw new ErrorValidacion('El pedido está vacío.');
      if (valor.length > limites.lineasPorPedido) throw new ErrorValidacion('El pedido tiene demasiados platos.');
      const menu = servicios.obtener('menu');
      const pedidas = agruparLineas(valor.map((linea) => ({
        platoId: entero(linea?.platoId, { campo: 'plato', minimo: 1, maximo: Number.MAX_SAFE_INTEGER }),
        cantidad: entero(linea?.cantidad, { campo: 'cantidad', minimo: 1, maximo: limites.cantidadPorLinea })
      })));
      return pedidas.map(({ platoId, cantidad }) => {
        const plato = menu?.plato(platoId);
        if (!plato || !plato.activo) throw new ErrorValidacion('Uno de los platos ya no está disponible.');
        return { platoId, nombre: plato.nombre, precio: plato.precio, cantidad };
      });
    }

    function leerCodigo(req) {
      if (!CODIGO_VALIDO.test(req.params.codigo)) throw noEncontrado('Pedido no encontrado.');
      const pedido = repositorio.porCodigo(req.params.codigo);
      if (!pedido) throw noEncontrado('Pedido no encontrado.');
      return pedido;
    }

    // Cliente: crear pedido
    router.post('/', (req, res) => {
      const cuerpo = req.body ?? {};
      const mesa = leerMesa(cuerpo.mesa);
      const lineas = leerLineas(cuerpo.lineas);
      const notas = texto(cuerpo.notas ?? '', { campo: 'notas', maximo: limites.notasPedido, requerido: false });
      const pedido = repositorio.crear({
        codigo: randomBytes(12).toString('hex'),
        mesa,
        estado: estadoInicial,
        notas,
        totales: calcularTotales(lineas, porcentajeServicio),
        lineas
      });
      eventos.emitir('pedido:cambio', pedido);
      res.status(201).json(pedido);
    });

    // Cocina (con sesión): pedidos activos, avanzar estado y flujo en vivo
    router.get('/cocina', requiereSesion(sesion), (req, res) => {
      res.json(repositorio.activos());
    });

    router.post('/cocina/:id/avanzar', requiereSesion(sesion), (req, res) => {
      const id = entero(req.params.id, { campo: 'pedido', minimo: 1, maximo: Number.MAX_SAFE_INTEGER });
      const pedido = repositorio.porId(id);
      if (!pedido) throw noEncontrado('Pedido no encontrado.');
      const estado = siguienteEstado(pedido.estado, estadosPedido);
      if (!estado) throw new ErrorValidacion('El pedido ya fue entregado.');
      repositorio.cambiarEstado(id, estado);
      const actualizado = repositorio.porId(id);
      eventos.emitir('pedido:cambio', actualizado);
      res.json(actualizado);
    });

    router.get('/cocina/eventos', requiereSesion(sesion), (req, res) => {
      const flujo = abrirFlujo(req, res);
      flujo.alCerrar(eventos.escuchar('pedido:cambio', (pedido) => flujo.enviar('pedido', pedido)));
    });

    // Cliente: seguir su pedido con el código secreto que recibió al crearlo
    router.get('/:codigo', (req, res) => {
      res.json(leerCodigo(req));
    });

    router.get('/:codigo/eventos', (req, res) => {
      const { id } = leerCodigo(req);
      const flujo = abrirFlujo(req, res);
      flujo.alCerrar(eventos.escuchar('pedido:cambio', (pedido) => {
        if (pedido.id === id) flujo.enviar('pedido', pedido);
      }));
    });
  }
};
