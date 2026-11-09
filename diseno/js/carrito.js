// Carrito: cantidades, totales y envío del pedido
import { formatearPrecio } from '../app.js';
import { leerCarrito, cambiarCantidad, lineasCarrito, calcularTotales, enviarPedido } from './pedidos.js';

const lista = document.getElementById('lista-carrito');
const formulario = document.getElementById('form-pedido');
const vacio = document.querySelector('.vacio');
const plantilla = document.getElementById('plantilla-linea');

function crearLinea(linea) {
  const nodo = plantilla.content.firstElementChild.cloneNode(true);
  nodo.dataset.id = linea.id;
  nodo.querySelector('[data-nombre]').textContent = linea.nombre;
  nodo.querySelector('[data-precio]').textContent = formatearPrecio(linea.precio * linea.cantidad);
  nodo.querySelector('[data-cantidad]').textContent = linea.cantidad;
  const [quitar, agregar] = nodo.querySelectorAll('[data-cambio]');
  quitar.setAttribute('aria-label', linea.cantidad === 1 ? `Quitar ${linea.nombre}` : `Restar uno de ${linea.nombre}`);
  agregar.setAttribute('aria-label', `Sumar uno de ${linea.nombre}`);
  return nodo;
}

function pintar(carrito = leerCarrito()) {
  const lineas = lineasCarrito(carrito);
  vacio.hidden = lineas.length > 0;
  formulario.hidden = lineas.length === 0;
  lista.replaceChildren(...lineas.map(crearLinea));

  const totales = calcularTotales(lineas);
  formulario.querySelector('[data-subtotal]').textContent = formatearPrecio(totales.subtotal);
  formulario.querySelector('[data-servicio]').textContent = formatearPrecio(totales.servicio);
  formulario.querySelector('[data-total]').textContent = formatearPrecio(totales.total);
}

// Botones + y −
lista.addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-cambio]');
  if (!boton) return;
  const linea = leerCarrito()[boton.closest('li').dataset.id];
  if (!linea) return;
  const id = boton.closest('li').dataset.id;
  pintar(cambiarCantidad({ id, ...linea }, Number(boton.dataset.cambio)));
  lista.querySelector(`[data-id="${CSS.escape(id)}"] [data-cambio="${boton.dataset.cambio}"]`)?.focus();
});

// Enviar: guarda el pedido y lleva al estado
formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const boton = formulario.querySelector('[type="submit"]');
  boton.disabled = true;
  const pedido = enviarPedido(formulario.notas.value);
  if (pedido) location.href = 'pedido.html';
  else boton.disabled = false;
});

pintar();
window.addEventListener('storage', () => pintar());
