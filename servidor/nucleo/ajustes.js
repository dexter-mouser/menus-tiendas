// Ajustes del negocio: valores del archivo del cliente + cambios hechos desde el panel
import { Router } from 'express';
import { requiereSesion } from './sesion.js';
import { ErrorValidacion, texto } from './validacion.js';

// Módulos que el administrador puede encender o apagar desde el panel
export const MODULOS_OPCIONALES = ['pedidos', 'cocina', 'resenas'];
const MONEDAS = ['COP', 'USD', 'MXN'];

export function crearAjustes(db, config) {
  db.exec('CREATE TABLE IF NOT EXISTS ajustes (clave TEXT PRIMARY KEY, valor TEXT NOT NULL)');
  const leerFila = db.prepare('SELECT valor FROM ajustes WHERE clave = ?');
  const escribirFila = db.prepare('INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor');

  function leerGuardado(clave, porDefecto) {
    const fila = leerFila.get(clave);
    if (!fila) return porDefecto;
    try {
      return JSON.parse(fila.valor);
    } catch {
      return porDefecto;
    }
  }

  // Módulos instalados (archivo) que no están apagados en el panel, respetando "requiere"
  function modulosActivos(modulosRegistrados = {}) {
    const apagados = new Set(leerGuardado('modulosApagados', []));
    const activos = new Set(config.cliente.modulos.filter((nombre) => !apagados.has(nombre)));
    let huboCambios = true;
    while (huboCambios) {
      huboCambios = false;
      for (const nombre of [...activos]) {
        const requiere = modulosRegistrados[nombre]?.requiere ?? [];
        if (requiere.some((otro) => !activos.has(otro))) {
          activos.delete(nombre);
          huboCambios = true;
        }
      }
    }
    return [...activos];
  }

  function leer() {
    const negocio = config.cliente.negocio;
    return {
      nombre: leerGuardado('nombre', config.cliente.nombre),
      moneda: leerGuardado('moneda', negocio.moneda),
      modoDemo: leerGuardado('modoDemo', config.cliente.modoDemo),
      modulosApagados: leerGuardado('modulosApagados', [])
    };
  }

  function guardar(cambios) {
    Object.entries(cambios).forEach(([clave, valor]) => escribirFila.run(clave, JSON.stringify(valor)));
  }

  return { leer, guardar, modulosActivos };
}

// Rutas: configuración pública (para la app) y edición desde el panel
export function rutasAjustes({ ajustes, config, sesion, modulosRegistrados }) {
  const router = Router();

  router.get('/publico', (req, res) => {
    const actuales = ajustes.leer();
    const { negocio, tema, logo } = config.cliente;
    res.json({
      nombre: actuales.nombre,
      logo,
      tema,
      moneda: actuales.moneda,
      localidad: negocio.localidad,
      porcentajeServicio: negocio.porcentajeServicio,
      maximoMesas: negocio.maximoMesas,
      estadosPedido: config.general.estadosPedido,
      modulos: ajustes.modulosActivos(modulosRegistrados),
      modoDemo: actuales.modoDemo,
      demo: actuales.modoDemo ? sesion.credencialesDemo() : null
    });
  });

  router.get('/', requiereSesion(sesion), (req, res) => {
    const actuales = ajustes.leer();
    res.json({
      nombre: actuales.nombre,
      moneda: actuales.moneda,
      modoDemo: actuales.modoDemo,
      monedas: MONEDAS,
      modulos: MODULOS_OPCIONALES
        .filter((nombre) => config.cliente.modulos.includes(nombre))
        .map((nombre) => ({ nombre, activo: !actuales.modulosApagados.includes(nombre) }))
    });
  });

  router.put('/', requiereSesion(sesion), (req, res) => {
    const cuerpo = req.body ?? {};
    const nombre = texto(cuerpo.nombre, { campo: 'nombre', maximo: config.general.limites.nombreNegocio });
    if (!MONEDAS.includes(cuerpo.moneda)) throw new ErrorValidacion('Moneda no válida.');
    if (typeof cuerpo.modoDemo !== 'boolean') throw new ErrorValidacion('Modo demo no válido.');
    const activos = cuerpo.modulos && typeof cuerpo.modulos === 'object' ? cuerpo.modulos : {};
    const modulosApagados = MODULOS_OPCIONALES.filter((modulo) => activos[modulo] === false);
    ajustes.guardar({ nombre, moneda: cuerpo.moneda, modoDemo: cuerpo.modoDemo, modulosApagados });
    res.json({ guardado: true });
  });

  return router;
}
