// Cocina: tablero de pedidos por estado; cada botón avanza el pedido al siguiente estado
import { formatearHora, avisar } from '../app.js';
import { leerPedidos, avanzarEstado } from './pedidos.js';

const ACCIONES = {
  nuevo: { texto: 'Empezar', secundario: false, aviso: 'en preparación' },
  preparando: { texto: 'Marcar listo', secundario: true, aviso: 'listo' },
  listo: { texto: 'Entregado', secundario: true, aviso: 'entregado' }
};

const plantilla = document.getElementById('plantilla-orden');

function crearOrden(pedido) {
  const nodo = plantilla.content.firstElementChild.cloneNode(true);
  nodo.querySelector('[data-mesa-orden]').textContent = `Mesa ${pedido.mesa} · #${pedido.numero}`;
  nodo.querySelector('[data-hora]').textContent = formatearHora(pedido.hora);

  const lineas = pedido.lineas.map((linea) => {
    const item = document.createElement('li');
    const cantidad = document.createElement('b');
    cantidad.textContent = `${linea.cantidad}× `;
    item.append(cantidad, linea.nombre);
    return item;
  });
  nodo.querySelector('[data-lineas]').replaceChildren(...lineas);

  const notas = nodo.querySelector('[data-notas]');
  notas.textContent = pedido.notas;
  notas.hidden = !pedido.notas;

  const accion = ACCIONES[pedido.estado];
  const boton = nodo.querySelector('[data-avanzar]');
  boton.textContent = accion.texto;
  boton.dataset.numero = pedido.numero;
  boton.classList.toggle('boton-secundario', accion.secundario);
  return nodo;
}

function pintar() {
  const pedidos = leerPedidos();
  document.querySelectorAll('[data-columna]').forEach((columna) => {
    const delEstado = pedidos.filter((pedido) => pedido.estado === columna.dataset.columna);
    columna.querySelector('.pila-tarjetas').replaceChildren(...delEstado.map(crearOrden));
    columna.querySelector('[data-cuenta]').textContent = delEstado.length;
    columna.querySelector('.columna-vacia').hidden = delEstado.length > 0;
  });
}

document.querySelector('.tablero').addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-avanzar]');
  if (!boton) return;
  const numero = Number(boton.dataset.numero);
  const pedido = leerPedidos().find((item) => item.numero === numero);
  avanzarEstado(numero);
  pintar();
  if (pedido) avisar(`Pedido #${numero} ${ACCIONES[pedido.estado].aviso}`);
});

pintar();
// Llegan pedidos nuevos desde otra pestaña (en la app: Server-Sent Events)
window.addEventListener('storage', pintar);
