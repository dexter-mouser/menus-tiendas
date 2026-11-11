// Módulo menu: la carta pública y la edición de platos desde el panel
import { requiereSesion } from '../../nucleo/sesion.js';
import { texto, entero, noEncontrado, ErrorValidacion } from '../../nucleo/validacion.js';
import { crearRepositorioMenu } from './repositorio.js';

const PRECIO_MAXIMO = 10_000_000;

export default {
  nombre: 'menu',
  requiere: [],

  iniciar({ db, config, router, servicios, sesion }) {
    const repositorio = crearRepositorioMenu(db);
    repositorio.cargarCartaInicial(config.cliente.cartaInicial ?? []);
    const { limites } = config.general;

    // Otros módulos (pedidos) consultan precios a través de este servicio
    servicios.registrar('menu', { plato: (id) => repositorio.plato(id) });

    function leerPlato(cuerpo = {}) {
      const categoriaId = entero(cuerpo.categoriaId, { campo: 'categoría', minimo: 1, maximo: Number.MAX_SAFE_INTEGER });
      if (!repositorio.existeCategoria(categoriaId)) throw new ErrorValidacion('La categoría no existe.');
      return {
        categoriaId,
        nombre: texto(cuerpo.nombre, { campo: 'nombre', maximo: limites.nombrePlato }),
        descripcion: texto(cuerpo.descripcion ?? '', { campo: 'descripción', maximo: limites.descripcionPlato, requerido: false }),
        precio: entero(cuerpo.precio, { campo: 'precio', minimo: 1, maximo: PRECIO_MAXIMO }),
        activo: cuerpo.activo !== false
      };
    }

    router.get('/', (req, res) => {
      res.json(repositorio.carta({ soloActivos: true }).filter((categoria) => categoria.platos.length > 0));
    });

    router.get('/panel', requiereSesion(sesion), (req, res) => {
      res.json(repositorio.carta({ soloActivos: false }));
    });

    router.post('/platos', requiereSesion(sesion), (req, res) => {
      res.status(201).json(repositorio.crearPlato(leerPlato(req.body)));
    });

    router.put('/platos/:id', requiereSesion(sesion), (req, res) => {
      const id = entero(req.params.id, { campo: 'plato', minimo: 1, maximo: Number.MAX_SAFE_INTEGER });
      if (!repositorio.plato(id)) throw noEncontrado('El plato no existe.');
      res.json(repositorio.actualizarPlato(id, leerPlato(req.body)));
    });
  }
};
