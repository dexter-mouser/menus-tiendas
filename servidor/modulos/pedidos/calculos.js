// Reglas de negocio de un pedido: totales y avance de estado

// Subtotal, servicio (porcentaje del cliente, redondeado) y total
export function calcularTotales(lineas, porcentajeServicio) {
  const subtotal = lineas.reduce((suma, linea) => suma + linea.precio * linea.cantidad, 0);
  const servicio = Math.round((subtotal * porcentajeServicio) / 100);
  return { subtotal, servicio, total: subtotal + servicio };
}

// Siguiente estado; el último ("entregado") no avanza más
export function siguienteEstado(estado, estados) {
  const indice = estados.indexOf(estado);
  if (indice === -1 || indice === estados.length - 1) return null;
  return estados[indice + 1];
}

// Junta líneas repetidas del mismo plato sumando cantidades
export function agruparLineas(lineas) {
  const porPlato = new Map();
  lineas.forEach(({ platoId, cantidad }) => porPlato.set(platoId, (porPlato.get(platoId) ?? 0) + cantidad));
  return [...porPlato].map(([platoId, cantidad]) => ({ platoId, cantidad }));
}
