// Módulo resenas: el cliente califica su visita; el panel ve todas con su promedio
import { requiereSesion } from '../../nucleo/sesion.js';
import { texto, entero } from '../../nucleo/validacion.js';

const PUNTAJE_MAXIMO = 5;
const RESENAS_PUBLICAS = 20;
const AUTOR_ANONIMO = 'Cliente';

export default {
  nombre: 'resenas',
  requiere: [],

  iniciar({ db, config, router, sesion }) {
    const { limites } = config.general;
    db.exec(`
      CREATE TABLE IF NOT EXISTS resenas (
        id INTEGER PRIMARY KEY,
        mesa INTEGER,
        autor TEXT NOT NULL,
        puntaje INTEGER NOT NULL,
        comentario TEXT NOT NULL DEFAULT '',
        creada TEXT NOT NULL
      );
    `);

    const consultas = {
      insertar: db.prepare('INSERT INTO resenas (mesa, autor, puntaje, comentario, creada) VALUES (?, ?, ?, ?, ?)'),
      publicas: db.prepare('SELECT id, autor, puntaje, comentario, creada FROM resenas ORDER BY id DESC LIMIT ?'),
      todas: db.prepare('SELECT id, mesa, autor, puntaje, comentario, creada FROM resenas ORDER BY id DESC'),
      resumen: db.prepare('SELECT COUNT(*) AS total, COALESCE(AVG(puntaje), 0) AS promedio FROM resenas')
    };

    router.get('/', (req, res) => {
      res.json(consultas.publicas.all(RESENAS_PUBLICAS));
    });

    router.post('/', (req, res) => {
      const cuerpo = req.body ?? {};
      const puntaje = entero(cuerpo.puntaje, { campo: 'calificación', minimo: 1, maximo: PUNTAJE_MAXIMO });
      const mesa = cuerpo.mesa == null ? null : entero(cuerpo.mesa, { campo: 'mesa', minimo: 1, maximo: config.cliente.negocio.maximoMesas });
      const autor = texto(cuerpo.autor ?? '', { campo: 'nombre', maximo: limites.autorResena, requerido: false }) || AUTOR_ANONIMO;
      const comentario = texto(cuerpo.comentario ?? '', { campo: 'comentario', maximo: limites.comentarioResena, requerido: false });
      const { lastInsertRowid } = consultas.insertar.run(mesa, autor, puntaje, comentario, new Date().toISOString());
      res.status(201).json({ id: Number(lastInsertRowid), autor, puntaje, comentario });
    });

    router.get('/panel', requiereSesion(sesion), (req, res) => {
      const { total, promedio } = consultas.resumen.get();
      res.json({ total, promedio: Math.round(promedio * 10) / 10, resenas: consultas.todas.all() });
    });
  }
};
