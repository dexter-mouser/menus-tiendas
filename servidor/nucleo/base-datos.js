// Conexión SQLite (nativa de Node) y migraciones de cada módulo
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function abrirBaseDatos(ruta) {
  if (ruta !== ':memory:') mkdirSync(dirname(ruta), { recursive: true });
  const db = new DatabaseSync(ruta);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  return db;
}

// Ejecuta varias operaciones como una sola transacción
export function enTransaccion(db, operacion) {
  db.exec('BEGIN');
  try {
    const resultado = operacion();
    db.exec('COMMIT');
    return resultado;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
