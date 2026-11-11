// Acceso a datos de pedidos y sus líneas
import { enTransaccion } from '../../nucleo/base-datos.js';

export function crearRepositorioPedidos(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY,
      codigo TEXT NOT NULL UNIQUE,
      mesa INTEGER NOT NULL,
      estado TEXT NOT NULL,
      notas TEXT NOT NULL DEFAULT '',
      subtotal INTEGER NOT NULL,
      servicio INTEGER NOT NULL,
      total INTEGER NOT NULL,
      creado TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pedido_lineas (
      id INTEGER PRIMARY KEY,
      pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      plato_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      precio INTEGER NOT NULL,
      cantidad INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS pedidos_estado ON pedidos (estado);
  `);

  const consultas = {
    insertar: db.prepare(`INSERT INTO pedidos (codigo, mesa, estado, notas, subtotal, servicio, total, creado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
    insertarLinea: db.prepare('INSERT INTO pedido_lineas (pedido_id, plato_id, nombre, precio, cantidad) VALUES (?, ?, ?, ?, ?)'),
    porId: db.prepare('SELECT * FROM pedidos WHERE id = ?'),
    porCodigo: db.prepare('SELECT * FROM pedidos WHERE codigo = ?'),
    lineas: db.prepare('SELECT plato_id AS platoId, nombre, precio, cantidad FROM pedido_lineas WHERE pedido_id = ? ORDER BY id'),
    activos: db.prepare("SELECT * FROM pedidos WHERE estado != 'entregado' ORDER BY id"),
    cambiarEstado: db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?')
  };

  function conLineas(fila) {
    if (!fila) return null;
    return {
      id: fila.id,
      codigo: fila.codigo,
      numero: fila.id,
      mesa: fila.mesa,
      estado: fila.estado,
      notas: fila.notas,
      subtotal: fila.subtotal,
      servicio: fila.servicio,
      total: fila.total,
      creado: fila.creado,
      lineas: consultas.lineas.all(fila.id)
    };
  }

  function crear({ codigo, mesa, estado, notas, totales, lineas }) {
    const id = enTransaccion(db, () => {
      const { lastInsertRowid } = consultas.insertar.run(
        codigo, mesa, estado, notas, totales.subtotal, totales.servicio, totales.total, new Date().toISOString()
      );
      lineas.forEach((linea) => consultas.insertarLinea.run(lastInsertRowid, linea.platoId, linea.nombre, linea.precio, linea.cantidad));
      return Number(lastInsertRowid);
    });
    return conLineas(consultas.porId.get(id));
  }

  return {
    crear,
    porId: (id) => conLineas(consultas.porId.get(id)),
    porCodigo: (codigo) => conLineas(consultas.porCodigo.get(codigo)),
    activos: () => consultas.activos.all().map(conLineas),
    cambiarEstado: (id, estado) => consultas.cambiarEstado.run(estado, id)
  };
}
