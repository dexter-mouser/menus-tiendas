// Registro de módulos del servidor: carga los activos y monta sus rutas en /api/<modulo>
import { Router } from 'express';

// Módulos del servidor disponibles. Los que solo existen en la app (carrito, cocina) no aparecen aquí.
const CARGADORES = {
  menu: () => import('../modulos/menu/modulo.js'),
  pedidos: () => import('../modulos/pedidos/modulo.js'),
  resenas: () => import('../modulos/resenas/modulo.js'),
  mesas: () => import('../modulos/mesas/modulo.js')
};

// Contratos de los módulos de la app que no tienen parte de servidor
const SOLO_CLIENTE = {
  carrito: { nombre: 'carrito', requiere: ['menu', 'pedidos'] },
  cocina: { nombre: 'cocina', requiere: ['pedidos'] }
};

export async function cargarModulos(nombres) {
  const registrados = {};
  for (const nombre of nombres) {
    if (CARGADORES[nombre]) {
      const { default: modulo } = await CARGADORES[nombre]();
      registrados[nombre] = modulo;
    } else if (SOLO_CLIENTE[nombre]) {
      registrados[nombre] = SOLO_CLIENTE[nombre];
    } else {
      console.error(`Módulo desconocido en la configuración: ${nombre}`);
    }
  }
  return registrados;
}

// Inicia cada módulo y monta su router. Si el módulo está apagado en el panel, responde 404.
export function montarModulos(app, registrados, contexto) {
  Object.values(registrados).forEach((modulo) => {
    if (typeof modulo.iniciar !== 'function') return;
    const router = Router();
    modulo.iniciar({ ...contexto, router });
    app.use(`/api/${modulo.nombre}`, (req, res, siguiente) => {
      const activos = contexto.ajustes.modulosActivos(registrados);
      if (!activos.includes(modulo.nombre)) return res.status(404).json({ error: 'Función no disponible.' });
      siguiente();
    }, router);
  });
}
