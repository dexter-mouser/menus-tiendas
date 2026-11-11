// Aplicación Express: API, módulos, archivos de la app y página 404
import express from 'express';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { abrirBaseDatos } from './base-datos.js';
import { crearEventos } from './eventos.js';
import { crearSesion } from './sesion.js';
import { crearAjustes, rutasAjustes } from './ajustes.js';
import { cargarModulos, montarModulos } from './registro.js';

const RAIZ = resolve(import.meta.dirname, '../..');
const CARPETA_CLIENTE = resolve(RAIZ, 'cliente');
const CARPETA_COMPILADA = resolve(RAIZ, 'dist');
// Rutas que pertenecen a la app de React; todo lo demás es 404
const RUTAS_APP = /^\/($|mesa(\/|$)|panel(\/|$))/;

function crearServicios() {
  const servicios = new Map();
  return {
    registrar: (nombre, servicio) => servicios.set(nombre, servicio),
    obtener: (nombre) => servicios.get(nombre) ?? null
  };
}

function manejarErrores(error, req, res, siguiente) {
  if (res.headersSent) return siguiente(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Datos no válidos.' });
  if (error.esSeguro) return res.status(error.estado).json({ error: error.message });
  console.error(error);
  res.status(500).json({ error: 'Algo salió mal. Intenta de nuevo.' });
}

// En desarrollo, Vite sirve la app con recarga en caliente; en producción, la carpeta dist
async function montarApp(app, esProduccion) {
  if (esProduccion) {
    app.use(express.static(CARPETA_COMPILADA, { index: false }));
    const indice = await readFile(resolve(CARPETA_COMPILADA, 'index.html'), 'utf8');
    const pagina404 = await readFile(resolve(CARPETA_COMPILADA, '404.html'), 'utf8');
    app.get(/.*/, (req, res) => {
      if (RUTAS_APP.test(req.path)) return res.type('html').send(indice);
      res.status(404).type('html').send(pagina404);
    });
    return;
  }

  const { createServer } = await import('vite');
  const vite = await createServer({ root: CARPETA_CLIENTE, server: { middlewareMode: true }, appType: 'custom' });
  app.use(vite.middlewares);
  app.get(/.*/, async (req, res, siguiente) => {
    try {
      if (RUTAS_APP.test(req.path)) {
        const plantilla = await readFile(resolve(CARPETA_CLIENTE, 'index.html'), 'utf8');
        return res.type('html').send(await vite.transformIndexHtml(req.originalUrl, plantilla));
      }
      res.status(404).type('html').send(await readFile(resolve(CARPETA_CLIENTE, 'public/404.html'), 'utf8'));
    } catch (error) {
      siguiente(error);
    }
  });
}

export async function crearApp(config) {
  const db = abrirBaseDatos(config.entorno.baseDatos);
  const eventos = crearEventos();
  const servicios = crearServicios();
  const ajustes = crearAjustes(db, config);
  const sesion = crearSesion(db, config);
  const modulosRegistrados = await cargarModulos(config.cliente.modulos);

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  app.use(express.json({ limit: '50kb' }));

  app.use('/api/sesion', sesion.rutas());
  app.use('/api/ajustes', rutasAjustes({ ajustes, config, sesion, modulosRegistrados }));
  montarModulos(app, modulosRegistrados, { db, config, eventos, servicios, sesion, ajustes });
  app.use('/api', (req, res) => res.status(404).json({ error: 'No encontrado.' }));
  app.use(manejarErrores);

  await montarApp(app, config.entorno.esProduccion);
  app.use(manejarErrores);
  return { app, db };
}
