// Acceso a datos de la carta: categorías y platos
import { enTransaccion } from '../../nucleo/base-datos.js';

export function crearRepositorioMenu(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE,
      orden INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS platos (
      id INTEGER PRIMARY KEY,
      categoria_id INTEGER NOT NULL REFERENCES categorias(id),
      nombre TEXT NOT NULL,
      descripcion TEXT NOT NULL DEFAULT '',
      precio INTEGER NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1,
      orden INTEGER NOT NULL DEFAULT 0
    );
  `);

  const consultas = {
    contarCategorias: db.prepare('SELECT COUNT(*) AS total FROM categorias'),
    insertarCategoria: db.prepare('INSERT INTO categorias (nombre, orden) VALUES (?, ?)'),
    insertarPlato: db.prepare('INSERT INTO platos (categoria_id, nombre, descripcion, precio, orden) VALUES (?, ?, ?, ?, ?)'),
    categorias: db.prepare('SELECT id, nombre FROM categorias ORDER BY orden, id'),
    platos: db.prepare('SELECT id, categoria_id AS categoriaId, nombre, descripcion, precio, activo FROM platos ORDER BY orden, id'),
    plato: db.prepare('SELECT id, categoria_id AS categoriaId, nombre, descripcion, precio, activo FROM platos WHERE id = ?'),
    categoria: db.prepare('SELECT id FROM categorias WHERE id = ?'),
    actualizarPlato: db.prepare('UPDATE platos SET categoria_id = ?, nombre = ?, descripcion = ?, precio = ?, activo = ? WHERE id = ?'),
    siguienteOrden: db.prepare('SELECT COALESCE(MAX(orden), -1) + 1 AS orden FROM platos WHERE categoria_id = ?')
  };

  function cargarCartaInicial(carta) {
    if (consultas.contarCategorias.get().total > 0) return;
    enTransaccion(db, () => {
      carta.forEach((grupo, indiceCategoria) => {
        const { lastInsertRowid } = consultas.insertarCategoria.run(grupo.categoria, indiceCategoria);
        grupo.platos.forEach((plato, indicePlato) => {
          consultas.insertarPlato.run(lastInsertRowid, plato.nombre, plato.descripcion, plato.precio, indicePlato);
        });
      });
    });
  }

  // Carta agrupada por categoría; con soloActivos oculta los platos apagados
  function carta({ soloActivos }) {
    const platos = consultas.platos.all().map((plato) => ({ ...plato, activo: plato.activo === 1 }));
    return consultas.categorias.all().map((categoria) => ({
      ...categoria,
      platos: platos.filter((plato) => plato.categoriaId === categoria.id && (!soloActivos || plato.activo))
    }));
  }

  function plato(id) {
    const fila = consultas.plato.get(id);
    return fila ? { ...fila, activo: fila.activo === 1 } : null;
  }

  function existeCategoria(id) {
    return Boolean(consultas.categoria.get(id));
  }

  function crearPlato({ categoriaId, nombre, descripcion, precio }) {
    const { orden } = consultas.siguienteOrden.get(categoriaId);
    const { lastInsertRowid } = consultas.insertarPlato.run(categoriaId, nombre, descripcion, precio, orden);
    return plato(Number(lastInsertRowid));
  }

  function actualizarPlato(id, { categoriaId, nombre, descripcion, precio, activo }) {
    consultas.actualizarPlato.run(categoriaId, nombre, descripcion, precio, activo ? 1 : 0, id);
    return plato(id);
  }

  return { cargarCartaInicial, carta, plato, existeCategoria, crearPlato, actualizarPlato };
}
