// Estado del pedido: pasos y detalle; se actualiza cuando cocina cambia el estado
import { formatearPrecio, formatearHora } from '../app.js';
import { ESTADOS, ultimoPedido } from './pedidos.js';

const detalle = document.getElementById('detalle-pedido');
const vacio = document.querySelector('.vacio');

function pintarPasos(estado) {
  const indiceActual = ESTADOS.indexOf(estado);
  document.querySelectorAll('[data-paso]').forEach((paso) => {
    const indice = ESTADOS.indexOf(paso.dataset.paso);
    // "Preparando" es el único paso que queda en curso; los demás se marcan hechos al llegar
    const estaHecho = indice < indiceActual || (indice === indiceActual && estado !== 'preparando');
    const esActual = indice === indiceActual && !estaHecho;
    paso.classList.toggle('hecho', estaHecho);
    paso.classList.toggle('actual', esActual);
    if (esActual) paso.setAttribute('aria-current', 'step');
    else paso.removeAttribute('aria-current');
  });
}

function crearLinea(linea) {
  const item = document.createElement('li');
  item.className = 'linea-total';
  const nombre = document.createElement('span');
  nombre.textContent = linea.nombre;
  const cantidad = document.createElement('span');
  cantidad.className = 'suave';
  cantidad.textContent = `×${linea.cantidad}`;
  item.append(nombre, cantidad);
  return item;
}

function pintar() {
  const pedido = ultimoPedido();
  vacio.hidden = Boolean(pedido);
  detalle.hidden = !pedido;
  if (!pedido) return;

  detalle.querySelector('[data-numero]').textContent = `Pedido #${pedido.numero}`;
  detalle.querySelector('[data-hora]').textContent = `Enviado a las ${formatearHora(pedido.hora)}`;
  document.getElementById('lineas-pedido').replaceChildren(...pedido.lineas.map(crearLinea));
  const notas = detalle.querySelector('[data-notas]');
  notas.textContent = pedido.notas;
  notas.hidden = !pedido.notas;
  detalle.querySelector('[data-total]').textContent = formatearPrecio(pedido.total);
  pintarPasos(pedido.estado);
}

pintar();
// Otra pestaña (cocina) cambió el estado
window.addEventListener('storage', pintar);
