// Mesas: agregar (máximo 10), quitar la última, abrir, imprimir y descargar su QR
import { CLAVES, MAXIMO_MESAS, leer, guardar, avisar } from '../app.js';

const MESAS_INICIALES = 1;

const lista = document.getElementById('lista-mesas');
const contador = document.querySelector('[data-contador-mesas]');
const plantillaMesa = document.getElementById('plantilla-mesa');
const plantillaAgregar = document.getElementById('plantilla-agregar');
const dialogoQuitar = document.getElementById('dialogo-quitar');

function leerCantidad() {
  const cantidad = Number(leer(CLAVES.mesas, MESAS_INICIALES));
  return Number.isInteger(cantidad) ? Math.min(Math.max(cantidad, MESAS_INICIALES), MAXIMO_MESAS) : MESAS_INICIALES;
}

function urlMesa(numero) {
  return new URL(`index.html?mesa=${numero}`, location.href).href;
}

function crearMesa(numero, esUltima) {
  const nodo = plantillaMesa.content.firstElementChild.cloneNode(true);
  nodo.dataset.numero = numero;
  nodo.querySelector('[data-titulo]').textContent = `Mesa ${numero}`;
  nodo.querySelector('[data-enlace]').href = urlMesa(numero);
  nodo.querySelector('[data-qr]').setAttribute('aria-label', `Código QR de la mesa ${numero}`);
  const quitar = nodo.querySelector('[data-quitar]');
  quitar.hidden = !esUltima || numero === MESAS_INICIALES;
  quitar.setAttribute('aria-label', `Quitar mesa ${numero}`);
  return nodo;
}

function pintar() {
  const cantidad = leerCantidad();
  const mesas = Array.from({ length: cantidad }, (_, i) => crearMesa(i + 1, i + 1 === cantidad));
  const hayEspacio = cantidad < MAXIMO_MESAS;
  if (hayEspacio) mesas.push(plantillaAgregar.content.firstElementChild.cloneNode(true));
  lista.replaceChildren(...mesas);
  contador.textContent = hayEspacio
    ? `${cantidad} de ${MAXIMO_MESAS} mesas`
    : `${cantidad} de ${MAXIMO_MESAS} mesas · llegaste al máximo`;
  document.querySelectorAll('[data-agregar-mesa]').forEach((boton) => { boton.disabled = !hayEspacio; });
}

function agregarMesa() {
  const cantidad = leerCantidad();
  if (cantidad >= MAXIMO_MESAS) return;
  guardar(CLAVES.mesas, cantidad + 1);
  pintar();
  avisar(`Mesa ${cantidad + 1} agregada`);
  lista.querySelector(`[data-numero="${cantidad + 1}"] h2`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function quitarUltimaMesa() {
  dialogoQuitar.returnValue = '';
  dialogoQuitar.showModal();
  dialogoQuitar.addEventListener('close', () => {
    if (dialogoQuitar.returnValue !== 'quitar') return;
    const cantidad = leerCantidad();
    guardar(CLAVES.mesas, Math.max(cantidad - 1, MESAS_INICIALES));
    pintar();
    avisar(`Mesa ${cantidad} quitada`);
  }, { once: true });
}

function imprimirMesa(tarjeta) {
  tarjeta.classList.add('para-imprimir');
  document.body.classList.add('imprimiendo');
  window.addEventListener('afterprint', () => {
    tarjeta.classList.remove('para-imprimir');
    document.body.classList.remove('imprimiendo');
  }, { once: true });
  window.print();
}

// Descarga el QR como archivo SVG (en la app lo generará la librería qrcode)
async function descargarQr(numero) {
  try {
    const respuesta = await fetch('icons.svg');
    const sprite = new DOMParser().parseFromString(await respuesta.text(), 'image/svg+xml');
    const simbolo = sprite.getElementById('qr-muestra');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${simbolo.getAttribute('viewBox')}" width="512" height="512">${simbolo.innerHTML}</svg>`;
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    enlace.download = `mesa-${numero}-qr.svg`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  } catch (error) {
    console.error('No se pudo descargar el QR', error);
    avisar('No se pudo descargar el QR. Intenta de nuevo.', true);
  }
}

document.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button');
  if (!boton) return;
  const tarjeta = boton.closest('.mesa');
  if (boton.matches('[data-agregar-mesa]')) agregarMesa();
  else if (boton.matches('[data-quitar]')) quitarUltimaMesa();
  else if (boton.matches('[data-imprimir]')) imprimirMesa(tarjeta);
  else if (boton.matches('[data-descargar]')) descargarQr(tarjeta.dataset.numero);
});

pintar();
