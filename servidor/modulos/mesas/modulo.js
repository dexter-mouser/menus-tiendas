// Módulo mesas: mesas del local (de 1 al máximo del cliente) y su código QR
import QRCode from 'qrcode';
import { requiereSesion } from '../../nucleo/sesion.js';
import { entero, noEncontrado, ErrorValidacion } from '../../nucleo/validacion.js';

const TAMANO_QR = 512;

export default {
  nombre: 'mesas',
  requiere: [],

  iniciar({ db, config, router, servicios, sesion }) {
    const { maximoMesas, mesasIniciales } = config.cliente.negocio;
    db.exec('CREATE TABLE IF NOT EXISTS mesas (numero INTEGER PRIMARY KEY, creada TEXT NOT NULL)');

    const consultas = {
      todas: db.prepare('SELECT numero FROM mesas ORDER BY numero'),
      una: db.prepare('SELECT numero FROM mesas WHERE numero = ?'),
      ultima: db.prepare('SELECT MAX(numero) AS numero FROM mesas'),
      insertar: db.prepare('INSERT INTO mesas (numero, creada) VALUES (?, ?)'),
      borrar: db.prepare('DELETE FROM mesas WHERE numero = ?')
    };

    if (!consultas.ultima.get().numero) {
      for (let numero = 1; numero <= mesasIniciales; numero += 1) consultas.insertar.run(numero, new Date().toISOString());
    }

    const existe = (numero) => Boolean(consultas.una.get(numero));
    servicios.registrar('mesas', { existe });

    function numeroDe(req) {
      return entero(req.params.numero, { campo: 'mesa', minimo: 1, maximo: maximoMesas });
    }

    // Dirección que abre el cliente al escanear
    function urlMesa(req, numero) {
      const base = config.entorno.urlPublica || `${req.protocol}://${req.get('host')}`;
      return `${base}/mesa/${numero}`;
    }

    router.get('/', requiereSesion(sesion), (req, res) => {
      const mesas = consultas.todas.all().map(({ numero }) => ({ numero, url: urlMesa(req, numero) }));
      res.json({ mesas, maximo: maximoMesas, minimo: mesasIniciales });
    });

    router.post('/', requiereSesion(sesion), (req, res) => {
      const siguiente = (consultas.ultima.get().numero ?? 0) + 1;
      if (siguiente > maximoMesas) throw new ErrorValidacion(`El máximo es ${maximoMesas} mesas.`);
      consultas.insertar.run(siguiente, new Date().toISOString());
      res.status(201).json({ numero: siguiente, url: urlMesa(req, siguiente) });
    });

    // Solo se quita la última, para que la numeración siga continua
    router.delete('/ultima', requiereSesion(sesion), (req, res) => {
      const { numero } = consultas.ultima.get();
      if (!numero || numero <= mesasIniciales) throw new ErrorValidacion('No hay mesas para quitar.');
      consultas.borrar.run(numero);
      res.json({ numero });
    });

    router.get('/:numero', (req, res) => {
      const numero = numeroDe(req);
      if (!existe(numero)) throw noEncontrado('Esta mesa no existe.');
      res.json({ numero });
    });

    router.get('/:numero/qr.svg', requiereSesion(sesion), async (req, res) => {
      const numero = numeroDe(req);
      if (!existe(numero)) throw noEncontrado('Esta mesa no existe.');
      const svg = await QRCode.toString(urlMesa(req, numero), { type: 'svg', margin: 1, width: TAMANO_QR });
      res.type('image/svg+xml').send(svg);
    });
  }
};
