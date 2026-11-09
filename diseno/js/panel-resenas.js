// Reseñas en el panel: lista con mesa, promedio y total
import '../app.js';
import { leerResenas, promedio, crearEstrellas, crearTarjetaResena } from './datos-resenas.js';

function pintar() {
  const resenas = leerResenas();
  const media = promedio(resenas);
  document.getElementById('lista-resenas')
    .replaceChildren(...resenas.map((resena) => crearTarjetaResena(resena, { mostrarMesa: true })));
  document.querySelector('[data-promedio]').textContent = media.toLocaleString('es-CO', { maximumFractionDigits: 1 });
  document.querySelector('[data-estrellas-promedio]').replaceChildren(crearEstrellas(Math.round(media)));
  document.querySelector('[data-total-resenas]').textContent = resenas.length === 1 ? '1 reseña' : `${resenas.length} reseñas`;
}

pintar();
window.addEventListener('storage', pintar);
