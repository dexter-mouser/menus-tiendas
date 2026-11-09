// Carta: agregar platos al carrito, barra de resumen y categoría activa
import { formatearPrecio, avisar } from '../app.js';
import { leerCarrito, cambiarCantidad, lineasCarrito, calcularTotales, ultimoPedido } from './pedidos.js';

const barra = document.querySelector('.barra-carrito');
const avisoPedido = document.querySelector('.pedido-en-curso');

function textoCantidad(cantidad) {
  return cantidad === 1 ? '1 producto' : `${cantidad} productos`;
}

function pintarBarra(carrito = leerCarrito()) {
  const { cantidad, subtotal } = calcularTotales(lineasCarrito(carrito));
  barra.hidden = cantidad === 0;
  barra.querySelector('[data-carrito-cantidad]').textContent = textoCantidad(cantidad);
  barra.querySelector('[data-carrito-total]').textContent = `· ${formatearPrecio(subtotal)}`;
}

function pintarPedidoEnCurso() {
  const pedido = ultimoPedido();
  avisoPedido.hidden = !pedido || pedido.estado === 'entregado';
}

function productoDe(tarjeta) {
  return {
    id: tarjeta.dataset.id,
    nombre: tarjeta.dataset.nombre,
    precio: Number(tarjeta.dataset.precio)
  };
}

// Botón "+" de cada plato
document.querySelector('main').addEventListener('click', (evento) => {
  const boton = evento.target.closest('.plato .boton-icono');
  if (!boton) return;
  const producto = productoDe(boton.closest('.plato'));
  pintarBarra(cambiarCantidad(producto, 1));
  avisar(`Agregaste: ${producto.nombre}`);
});

// Categoría activa según la sección visible
const chips = [...document.querySelectorAll('.categorias .chip')];

function marcarCategoria(id) {
  chips.forEach((chip) => {
    const esActiva = chip.getAttribute('href') === `#${id}`;
    chip.setAttribute('aria-current', String(esActiva));
    if (esActiva) chip.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
}

const observador = new IntersectionObserver((entradas) => {
  const visible = entradas.find((entrada) => entrada.isIntersecting);
  if (visible) marcarCategoria(visible.target.id);
}, { rootMargin: '0px 0px -70% 0px' });

document.querySelectorAll('.seccion-carta').forEach((seccion) => observador.observe(seccion));

pintarBarra();
pintarPedidoEnCurso();
window.addEventListener('storage', () => { pintarBarra(); pintarPedidoEnCurso(); });
