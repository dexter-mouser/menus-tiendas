// Login del panel: copiar datos de prueba y validar el acceso (simulado)
import '../app.js';

const DURACION_AVISO_MS = 2000;
// Credenciales de la demo; en la app se validan en el servidor
const ACCESO_DEMO = { correo: 'admin@laterraza.co', clave: 'terraza-2026' };

const formulario = document.getElementById('form-login');
const errorLogin = document.getElementById('error-login');

function mostrarAviso(aviso, texto, esError) {
  if (!aviso) return;
  aviso.textContent = texto;
  aviso.classList.toggle('error', esError);
  setTimeout(() => { aviso.textContent = ''; }, DURACION_AVISO_MS);
}

// Respaldo si el navegador no deja escribir en el portapapeles
function seleccionarTexto(elemento) {
  const rango = document.createRange();
  rango.selectNodeContents(elemento);
  const seleccion = window.getSelection();
  seleccion.removeAllRanges();
  seleccion.addRange(rango);
}

async function copiarDato(boton) {
  const origen = document.getElementById(boton.dataset.copiar);
  const aviso = boton.closest('section')?.querySelector('.aviso-copiado');
  if (!origen) return;
  try {
    await navigator.clipboard.writeText(origen.textContent.trim());
    mostrarAviso(aviso, boton.dataset.aviso, false);
  } catch (error) {
    console.error('No se pudo copiar', error);
    seleccionarTexto(origen);
    mostrarAviso(aviso, 'Texto seleccionado: cópialo con Ctrl+C.', true);
  }
}

document.addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-copiar]');
  if (boton) copiarDato(boton);
});

formulario.addEventListener('input', () => { errorLogin.hidden = true; });

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  if (!formulario.checkValidity()) {
    formulario.reportValidity();
    return;
  }
  const esValido = formulario.correo.value.trim().toLowerCase() === ACCESO_DEMO.correo
    && formulario.clave.value === ACCESO_DEMO.clave;
  if (!esValido) {
    errorLogin.hidden = false;
    return;
  }
  location.href = 'admin.html';
});
