// Reseñas del prototipo: ejemplos más las guardadas, y su tarjeta (cliente y panel)
import { CLAVES, leer, guardar, iniciales, obtenerMesa } from '../app.js';

const PUNTAJE_MAXIMO = 5;
const AUTOR_ANONIMO = 'Cliente';

const RESENAS_EJEMPLO = [
  { autor: 'María C.', puntaje: 5, comentario: 'El ajiaco como el de la abuela. Volveremos.', fecha: '2026-11-08T20:10:00', mesa: 3 },
  { autor: 'Julián R.', puntaje: 4, comentario: 'Pedir desde la mesa fue muy práctico. Las empanadas, excelentes.', fecha: '2026-11-07T13:25:00', mesa: 1 }
];

export function leerResenas() {
  const guardadas = leer(CLAVES.resenas, []);
  const validas = Array.isArray(guardadas) ? guardadas : [];
  return [...validas, ...RESENAS_EJEMPLO].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function agregarResena({ autor, puntaje, comentario }) {
  const guardadas = leer(CLAVES.resenas, []);
  const resena = {
    autor: autor.trim() || AUTOR_ANONIMO,
    puntaje,
    comentario: comentario.trim(),
    fecha: new Date().toISOString(),
    mesa: obtenerMesa()
  };
  guardar(CLAVES.resenas, [resena, ...(Array.isArray(guardadas) ? guardadas : [])]);
  return resena;
}

export function promedio(resenas) {
  if (resenas.length === 0) return 0;
  return resenas.reduce((suma, resena) => suma + resena.puntaje, 0) / resenas.length;
}

export function crearEstrellas(puntaje) {
  const contenedor = document.createElement('p');
  contenedor.className = 'puntaje';
  contenedor.setAttribute('role', 'img');
  contenedor.setAttribute('aria-label', `${puntaje} de ${PUNTAJE_MAXIMO} estrellas`);
  for (let i = 1; i <= PUNTAJE_MAXIMO; i += 1) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', i <= puntaje ? 'icono' : 'icono vacia');
    const uso = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    uso.setAttribute('href', 'icons.svg#estrella');
    svg.append(uso);
    contenedor.append(svg);
  }
  return contenedor;
}

export function crearTarjetaResena(resena, { mostrarMesa = false } = {}) {
  const item = document.createElement('li');
  item.className = 'tarjeta-seccion fila arriba';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = iniciales(resena.autor);

  const cuerpo = document.createElement('div');
  cuerpo.className = 'crece';
  const autor = document.createElement('p');
  const nombre = document.createElement('b');
  nombre.textContent = resena.autor;
  autor.append(nombre);
  if (mostrarMesa) {
    const mesa = document.createElement('span');
    mesa.className = 'suave chico';
    mesa.textContent = ` · Mesa ${resena.mesa}`;
    autor.append(mesa);
  }
  cuerpo.append(autor, crearEstrellas(resena.puntaje));
  if (resena.comentario) {
    const comentario = document.createElement('p');
    comentario.className = 'suave';
    comentario.textContent = resena.comentario;
    cuerpo.append(comentario);
  }

  item.append(avatar, cuerpo);
  return item;
}
