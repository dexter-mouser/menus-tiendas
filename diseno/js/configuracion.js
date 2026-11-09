// Ajustes: datos del restaurante, funciones activas y edición de platos
import { leerConfig, guardarConfig, formatearPrecio, avisar } from '../app.js';

const MODULOS = ['pedidos', 'cocina', 'resenas'];

const formulario = document.getElementById('form-ajustes');
const errorNombre = document.getElementById('error-nombre');
const dialogo = document.getElementById('dialogo-plato');
const formPlato = document.getElementById('form-plato');
const errorPlato = document.getElementById('error-plato');
const listaPlatos = document.getElementById('lista-platos');
let platoEditado = null;

// Ajustes generales
function cargarAjustes() {
  const config = leerConfig();
  formulario.nombre.value = config.nombre;
  formulario.moneda.value = config.moneda;
  MODULOS.forEach((modulo) => { formulario[modulo].checked = config.modulos[modulo]; });
  formulario.modoDemo.checked = config.modoDemo;
}

formulario.nombre.addEventListener('input', () => { errorNombre.hidden = true; });

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const nombre = formulario.nombre.value.trim();
  if (!nombre) {
    errorNombre.hidden = false;
    formulario.nombre.focus();
    return;
  }
  const modulos = Object.fromEntries(MODULOS.map((modulo) => [modulo, formulario[modulo].checked]));
  guardarConfig({ nombre, moneda: formulario.moneda.value, modulos, modoDemo: formulario.modoDemo.checked });
  pintarResumenes();
  avisar('Cambios guardados');
});

// Vista previa del logo (en la app se sube al servidor)
formulario.logo.addEventListener('change', () => {
  const archivo = formulario.logo.files[0];
  if (!archivo) return;
  const imagen = document.createElement('img');
  imagen.src = URL.createObjectURL(archivo);
  imagen.alt = 'Logo nuevo';
  imagen.width = 72;
  imagen.height = 72;
  document.querySelector('[data-logo-vista]').replaceChildren(imagen);
  avisar('Logo listo. Guarda los cambios para aplicarlo.');
});

// Platos
function pintarResumen(item) {
  item.querySelector('[data-resumen-plato]').textContent = `${item.dataset.categoria} · ${formatearPrecio(Number(item.dataset.precio))}`;
}

function pintarResumenes() {
  listaPlatos.querySelectorAll('li').forEach(pintarResumen);
}

function abrirPlato(item) {
  platoEditado = item;
  errorPlato.hidden = true;
  formPlato.reset();
  document.getElementById('titulo-plato').textContent = item ? 'Editar plato' : 'Agregar plato';
  if (item) {
    formPlato.nombre.value = item.querySelector('[data-nombre-plato]').textContent;
    formPlato.categoria.value = item.dataset.categoria;
    formPlato.precio.value = item.dataset.precio;
    formPlato.descripcion.value = item.dataset.descripcion;
  }
  dialogo.showModal();
}

function crearItemPlato() {
  const item = listaPlatos.querySelector('li').cloneNode(true);
  listaPlatos.append(item);
  return item;
}

formPlato.addEventListener('submit', (evento) => {
  evento.preventDefault();
  if (!formPlato.checkValidity() || !formPlato.nombre.value.trim()) {
    errorPlato.hidden = false;
    return;
  }
  const item = platoEditado ?? crearItemPlato();
  const nombre = formPlato.nombre.value.trim();
  item.querySelector('[data-nombre-plato]').textContent = nombre;
  item.querySelector('[data-editar-plato]').setAttribute('aria-label', `Editar ${nombre}`);
  item.dataset.categoria = formPlato.categoria.value;
  item.dataset.precio = formPlato.precio.value;
  item.dataset.descripcion = formPlato.descripcion.value.trim();
  pintarResumen(item);
  dialogo.close();
  avisar(platoEditado ? 'Plato actualizado' : 'Plato agregado');
  item.querySelector('[data-editar-plato]').focus();
});

document.addEventListener('click', (evento) => {
  if (evento.target.closest('[data-nuevo-plato]')) abrirPlato(null);
  const editar = evento.target.closest('[data-editar-plato]');
  if (editar) abrirPlato(editar.closest('li'));
  if (evento.target.closest('[data-cerrar]')) dialogo.close();
});

// Cerrar al hacer clic fuera del diálogo
dialogo.addEventListener('click', (evento) => {
  if (evento.target === dialogo) dialogo.close();
});

cargarAjustes();
pintarResumenes();
