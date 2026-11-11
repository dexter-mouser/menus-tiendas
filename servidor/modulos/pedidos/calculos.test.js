// Pruebas de las reglas de negocio de pedidos (node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularTotales, siguienteEstado, agruparLineas } from './calculos.js';

const ESTADOS = ['nuevo', 'preparando', 'listo', 'entregado'];

test('calcula subtotal, servicio redondeado y total', () => {
  const lineas = [{ precio: 14000, cantidad: 2 }, { precio: 7500, cantidad: 1 }];
  assert.deepEqual(calcularTotales(lineas, 10), { subtotal: 35500, servicio: 3550, total: 39050 });
  assert.deepEqual(calcularTotales([{ precio: 9999, cantidad: 1 }], 10), { subtotal: 9999, servicio: 1000, total: 10999 });
});

test('pedido vacío y servicio en cero', () => {
  assert.deepEqual(calcularTotales([], 10), { subtotal: 0, servicio: 0, total: 0 });
  assert.deepEqual(calcularTotales([{ precio: 1000, cantidad: 3 }], 0), { subtotal: 3000, servicio: 0, total: 3000 });
});

test('avanza en orden y se detiene al entregar', () => {
  assert.equal(siguienteEstado('nuevo', ESTADOS), 'preparando');
  assert.equal(siguienteEstado('listo', ESTADOS), 'entregado');
  assert.equal(siguienteEstado('entregado', ESTADOS), null);
  assert.equal(siguienteEstado('desconocido', ESTADOS), null);
});

test('junta líneas del mismo plato', () => {
  const agrupadas = agruparLineas([{ platoId: 1, cantidad: 1 }, { platoId: 2, cantidad: 2 }, { platoId: 1, cantidad: 3 }]);
  assert.deepEqual(agrupadas, [{ platoId: 1, cantidad: 4 }, { platoId: 2, cantidad: 2 }]);
});
