// Validación de datos que llegan del cliente. Los errores llevan un mensaje seguro para mostrar.
export class ErrorValidacion extends Error {
  constructor(mensaje, estado = 400) {
    super(mensaje);
    this.estado = estado;
    this.esSeguro = true;
  }
}

export function texto(valor, { campo, maximo, requerido = true }) {
  const limpio = typeof valor === 'string' ? valor.trim() : '';
  if (requerido && !limpio) throw new ErrorValidacion(`Falta el campo ${campo}.`);
  if (limpio.length > maximo) throw new ErrorValidacion(`El campo ${campo} es demasiado largo.`);
  return limpio;
}

export function entero(valor, { campo, minimo, maximo }) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
    throw new ErrorValidacion(`El campo ${campo} no es válido.`);
  }
  return numero;
}

export function noEncontrado(mensaje = 'No encontrado.') {
  return new ErrorValidacion(mensaje, 404);
}
