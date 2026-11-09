// Servicios comunes del prototipo: carga, almacenamiento, formatos, mesa y avisos

const DEMORA_SIMULADA_MS = 900;
const DURACION_AVISO_MS = 2500;
const MESA_POR_DEFECTO = 1;
export const PORCENTAJE_SERVICIO = 10;
export const MAXIMO_MESAS = 10;

export const CLAVES = {
  mesa: 'mesaqr.mesa',
  carrito: 'mesaqr.carrito',
  pedidos: 'mesaqr.pedidos',
  ultimoPedido: 'mesaqr.ultimoPedido',
  resenas: 'mesaqr.resenas',
  mesas: 'mesaqr.mesas',
  config: 'mesaqr.config'
};

const CONFIG_POR_DEFECTO = {
  nombre: 'La Terraza',
  moneda: 'COP',
  modoDemo: true,
  modulos: { pedidos: true, cocina: true, resenas: true }
};

// Almacenamiento con valor por defecto si falla o está corrupto
export function leer(clave, porDefecto) {
  try {
    const texto = localStorage.getItem(clave);
    return texto === null ? porDefecto : JSON.parse(texto);
  } catch (error) {
    console.error('No se pudo leer', clave, error);
    return porDefecto;
  }
}

export function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    console.error('No se pudo guardar', clave, error);
  }
}

export function leerConfig() {
  const guardada = leer(CLAVES.config, {});
  const config = guardada && typeof guardada === 'object' ? guardada : {};
  return {
    ...CONFIG_POR_DEFECTO,
    ...config,
    modulos: { ...CONFIG_POR_DEFECTO.modulos, ...(config.modulos ?? {}) }
  };
}

export function guardarConfig(cambios) {
  guardar(CLAVES.config, { ...leerConfig(), ...cambios });
  pintarDatosNegocio();
}

// Formatos
export function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: leerConfig().moneda,
    maximumFractionDigits: 0
  }).format(valor);
}

export function formatearHora(fechaIso) {
  return new Date(fechaIso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
}

export function iniciales(texto) {
  return texto.split(/\s+/).filter(Boolean).slice(0, 2).map((palabra) => palabra[0].toUpperCase()).join('');
}

// Mesa: llega en la URL del QR (?mesa=4) y se recuerda durante la visita
export function obtenerMesa() {
  const desdeUrl = Number(new URLSearchParams(location.search).get('mesa'));
  if (Number.isInteger(desdeUrl) && desdeUrl >= 1 && desdeUrl <= MAXIMO_MESAS) {
    guardar(CLAVES.mesa, desdeUrl);
    return desdeUrl;
  }
  const guardada = Number(leer(CLAVES.mesa, MESA_POR_DEFECTO));
  return Number.isInteger(guardada) && guardada >= 1 ? guardada : MESA_POR_DEFECTO;
}

// Datos del negocio y módulos activos. Un módulo apagado agrega la clase
// "sin-<modulo>" a <html> y el CSS oculta todo lo marcado con data-modulo="<modulo>".
function pintarDatosNegocio() {
  const config = leerConfig();
  document.querySelectorAll('[data-nombre-negocio]').forEach((nodo) => { nodo.textContent = config.nombre; });
  document.querySelectorAll('[data-logo-negocio]').forEach((nodo) => { nodo.textContent = iniciales(config.nombre); });
  Object.entries(config.modulos).forEach(([modulo, estaActivo]) => {
    document.documentElement.classList.toggle(`sin-${modulo}`, !estaActivo);
  });
  document.documentElement.classList.toggle('sin-demo', !config.modoDemo);
  document.querySelectorAll('[data-mesa]').forEach((nodo) => { nodo.textContent = `Mesa ${obtenerMesa()}`; });
}

// Aviso flotante breve (role="status" para lectores de pantalla)
export function avisar(texto, esError = false) {
  let aviso = document.querySelector('.aviso-flotante');
  if (!aviso) {
    aviso = document.createElement('p');
    aviso.className = 'aviso-flotante';
    aviso.setAttribute('role', 'status');
    document.body.append(aviso);
  }
  aviso.textContent = texto;
  aviso.classList.toggle('error', esError);
  aviso.classList.add('visible');
  clearTimeout(avisar.temporizador);
  avisar.temporizador = setTimeout(() => aviso.classList.remove('visible'), DURACION_AVISO_MS);
}

// Estado de carga: muestra el skeleton hasta que llegan los datos.
// En el prototipo se simula la espera; en la app se quita al responder la API.
function terminarCarga() {
  setTimeout(() => document.body.removeAttribute('aria-busy'), DEMORA_SIMULADA_MS);
}

pintarDatosNegocio();
if (document.readyState === 'complete') terminarCarga();
else window.addEventListener('load', terminarCarga);
