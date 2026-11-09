// Carrito y pedidos del prototipo (compartido por carta, carrito, pedido y cocina)
import { CLAVES, PORCENTAJE_SERVICIO, leer, guardar, obtenerMesa } from '../app.js';

export const ESTADOS = ['nuevo', 'preparando', 'listo', 'entregado'];
const NUMERO_INICIAL = 125;

// Carrito: { id: { nombre, precio, cantidad } }
export function leerCarrito() {
  const carrito = leer(CLAVES.carrito, {});
  return carrito && typeof carrito === 'object' ? carrito : {};
}

export function cambiarCantidad(producto, diferencia) {
  const carrito = leerCarrito();
  const actual = carrito[producto.id]?.cantidad ?? 0;
  const nueva = Math.max(0, actual + diferencia);
  if (nueva === 0) delete carrito[producto.id];
  else carrito[producto.id] = { nombre: producto.nombre, precio: producto.precio, cantidad: nueva };
  guardar(CLAVES.carrito, carrito);
  return carrito;
}

export function lineasCarrito(carrito = leerCarrito()) {
  return Object.entries(carrito).map(([id, linea]) => ({ id, ...linea }));
}

export function calcularTotales(lineas) {
  const subtotal = lineas.reduce((suma, linea) => suma + linea.precio * linea.cantidad, 0);
  const servicio = Math.round(subtotal * PORCENTAJE_SERVICIO / 100);
  const cantidad = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
  return { subtotal, servicio, total: subtotal + servicio, cantidad };
}

// Pedidos de ejemplo para que cocina no arranque vacía en la demo
function hoyALas(hora, minuto) {
  const fecha = new Date();
  fecha.setHours(hora, minuto, 0, 0);
  return fecha.toISOString();
}

const PEDIDOS_EJEMPLO = [
  { numero: 125, mesa: 1, hora: hoyALas(20, 18), estado: 'listo', notas: '', total: 39050,
    lineas: [{ id: 'empanadas', nombre: 'Empanadas de pipián', precio: 14000, cantidad: 2 }, { id: 'jugo-lulo', nombre: 'Jugo de lulo', precio: 7500, cantidad: 1 }] },
  { numero: 126, mesa: 1, hora: hoyALas(20, 31), estado: 'preparando', notas: '', total: 88000,
    lineas: [{ id: 'ceviche', nombre: 'Ceviche de camarón', precio: 24000, cantidad: 1 }, { id: 'limonada-coco', nombre: 'Limonada de coco', precio: 9000, cantidad: 2 }, { id: 'bandeja', nombre: 'Bandeja paisa', precio: 38000, cantidad: 1 }] },
  { numero: 127, mesa: 1, hora: hoyALas(20, 45), estado: 'nuevo', notas: 'Uno de los ajiacos sin alcaparras.', total: 70400,
    lineas: [{ id: 'ajiaco', nombre: 'Ajiaco santafereño', precio: 32000, cantidad: 2 }] }
];

// Pedidos enviados
export function leerPedidos() {
  const pedidos = leer(CLAVES.pedidos, null);
  if (pedidos === null) {
    guardar(CLAVES.pedidos, PEDIDOS_EJEMPLO);
    return PEDIDOS_EJEMPLO;
  }
  return Array.isArray(pedidos) ? pedidos : [];
}

export function enviarPedido(notas) {
  const lineas = lineasCarrito();
  if (lineas.length === 0) return null;
  const pedidos = leerPedidos();
  const numero = pedidos.reduce((mayor, pedido) => Math.max(mayor, pedido.numero), NUMERO_INICIAL - 1) + 1;
  const pedido = {
    numero,
    mesa: obtenerMesa(),
    hora: new Date().toISOString(),
    lineas,
    notas: notas.trim(),
    total: calcularTotales(lineas).total,
    estado: 'nuevo'
  };
  guardar(CLAVES.pedidos, [...pedidos, pedido]);
  guardar(CLAVES.ultimoPedido, numero);
  guardar(CLAVES.carrito, {});
  return pedido;
}

export function avanzarEstado(numero) {
  const pedidos = leerPedidos().map((pedido) => {
    if (pedido.numero !== numero) return pedido;
    const siguiente = ESTADOS[Math.min(ESTADOS.indexOf(pedido.estado) + 1, ESTADOS.length - 1)];
    return { ...pedido, estado: siguiente };
  });
  guardar(CLAVES.pedidos, pedidos);
}

export function ultimoPedido() {
  const numero = leer(CLAVES.ultimoPedido, null);
  return leerPedidos().find((pedido) => pedido.numero === numero) ?? null;
}
