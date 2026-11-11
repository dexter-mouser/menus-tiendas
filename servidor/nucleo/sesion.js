// Usuarios del panel, contraseñas con scrypt y sesiones en cookie HttpOnly
import { Router } from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { ErrorValidacion } from './validacion.js';

const NOMBRE_COOKIE = 'mesaqr_sesion';
const LARGO_CLAVE_HASH = 64;
const MAXIMO_INTENTOS = 5;
const VENTANA_INTENTOS_MS = 15 * 60 * 1000;
const MS_POR_HORA = 60 * 60 * 1000;

function hashear(clave, sal = randomBytes(16).toString('hex')) {
  return { sal, hash: scryptSync(clave, sal, LARGO_CLAVE_HASH).toString('hex') };
}

function claveCorrecta(clave, usuario) {
  const { hash } = hashear(clave, usuario.sal);
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(usuario.hash, 'hex'));
}

function leerCookie(req, nombre) {
  const cabecera = req.headers.cookie ?? '';
  const par = cabecera.split(';').map((parte) => parte.trim()).find((parte) => parte.startsWith(`${nombre}=`));
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : null;
}

export function crearSesion(db, config) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY,
      correo TEXT NOT NULL UNIQUE,
      hash TEXT NOT NULL,
      sal TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sesiones (
      token TEXT PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      expira INTEGER NOT NULL
    );
  `);

  const { entorno, cliente, general } = config;
  const duracionMs = general.duracionSesionHoras * MS_POR_HORA;
  const intentos = new Map();

  // Administrador inicial: del .env o, en modo demo, de los datos de prueba
  function credencialesIniciales() {
    if (entorno.adminCorreo && entorno.adminClave) return { correo: entorno.adminCorreo, clave: entorno.adminClave };
    if (cliente.modoDemo && cliente.demo) return cliente.demo;
    return null;
  }

  function crearAdministradorInicial() {
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM usuarios').get();
    if (total > 0) return;
    const credenciales = credencialesIniciales();
    if (!credenciales) {
      console.error('No hay administrador: define ADMIN_CORREO y ADMIN_CLAVE en .env');
      return;
    }
    const { hash, sal } = hashear(credenciales.clave);
    db.prepare('INSERT INTO usuarios (correo, hash, sal) VALUES (?, ?, ?)').run(credenciales.correo.toLowerCase(), hash, sal);
  }

  function usuarioDeSolicitud(req) {
    const token = leerCookie(req, NOMBRE_COOKIE);
    if (!token) return null;
    const fila = db.prepare(`
      SELECT usuarios.id, usuarios.correo, sesiones.expira FROM sesiones
      JOIN usuarios ON usuarios.id = sesiones.usuario_id WHERE sesiones.token = ?
    `).get(token);
    if (!fila || fila.expira < Date.now()) return null;
    return { id: fila.id, correo: fila.correo };
  }

  function registrarIntento(ip) {
    const ahora = Date.now();
    const recientes = (intentos.get(ip) ?? []).filter((momento) => ahora - momento < VENTANA_INTENTOS_MS);
    recientes.push(ahora);
    intentos.set(ip, recientes);
    return recientes.length;
  }

  function opcionesCookie() {
    return { httpOnly: true, secure: entorno.esProduccion, sameSite: 'lax', maxAge: duracionMs, path: '/' };
  }

  // Datos de prueba para el login. Nunca se exponen las credenciales reales del .env.
  function credencialesDemo() {
    return entorno.adminCorreo ? null : (cliente.demo ?? null);
  }

  function rutas() {
    const router = Router();

    router.post('/entrar', (req, res) => {
      if (registrarIntento(req.ip) > MAXIMO_INTENTOS) {
        throw new ErrorValidacion('Demasiados intentos. Espera unos minutos.', 429);
      }
      const correo = String(req.body?.correo ?? '').trim().toLowerCase();
      const clave = String(req.body?.clave ?? '');
      const usuario = db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(correo);
      if (!usuario || !claveCorrecta(clave, usuario)) {
        throw new ErrorValidacion('Correo o contraseña incorrectos.', 401);
      }
      intentos.delete(req.ip);
      const token = randomBytes(32).toString('hex');
      db.prepare('DELETE FROM sesiones WHERE expira < ?').run(Date.now());
      db.prepare('INSERT INTO sesiones (token, usuario_id, expira) VALUES (?, ?, ?)').run(token, usuario.id, Date.now() + duracionMs);
      res.cookie(NOMBRE_COOKIE, token, opcionesCookie());
      res.json({ correo: usuario.correo });
    });

    router.post('/salir', (req, res) => {
      const token = leerCookie(req, NOMBRE_COOKIE);
      if (token) db.prepare('DELETE FROM sesiones WHERE token = ?').run(token);
      res.clearCookie(NOMBRE_COOKIE, { path: '/' });
      res.json({ salio: true });
    });

    router.get('/', (req, res) => {
      const usuario = usuarioDeSolicitud(req);
      if (!usuario) throw new ErrorValidacion('Sin sesión.', 401);
      res.json(usuario);
    });

    return router;
  }

  crearAdministradorInicial();
  return { usuarioDeSolicitud, credencialesDemo, rutas };
}

// Middleware: exige sesión del panel
export function requiereSesion(sesion) {
  return (req, res, siguiente) => {
    const usuario = sesion.usuarioDeSolicitud(req);
    if (!usuario) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
    req.usuario = usuario;
    siguiente();
  };
}
