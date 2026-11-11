// Bus de eventos del servidor: los módulos se comunican sin importarse entre sí
import { EventEmitter } from 'node:events';

export function crearEventos() {
  const emisor = new EventEmitter();
  emisor.setMaxListeners(0);
  return {
    emitir: (nombre, datos) => emisor.emit(nombre, datos),
    escuchar: (nombre, funcion) => {
      emisor.on(nombre, funcion);
      return () => emisor.off(nombre, funcion);
    }
  };
}

// Abre un flujo Server-Sent Events y devuelve una función para enviar mensajes
const INTERVALO_LATIDO_MS = 25000;

export function abrirFlujo(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write(': conectado\n\n');
  const latido = setInterval(() => res.write(': latido\n\n'), INTERVALO_LATIDO_MS);
  const cierres = [];
  req.on('close', () => {
    clearInterval(latido);
    cierres.forEach((cerrar) => cerrar());
  });
  return {
    enviar: (evento, datos) => res.write(`event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`),
    alCerrar: (funcion) => cierres.push(funcion)
  };
}
