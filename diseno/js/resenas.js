// Reseñas del cliente: calificar, comentar y ver las de otros
import { avisar } from '../app.js';
import { leerResenas, agregarResena, crearTarjetaResena } from './datos-resenas.js';

const formulario = document.getElementById('form-resena');
const gracias = document.querySelector('.gracias');
const errorPuntaje = document.getElementById('error-puntaje');
const lista = document.getElementById('lista-resenas');

function pintarLista() {
  lista.replaceChildren(...leerResenas().map((resena) => crearTarjetaResena(resena)));
}

formulario.addEventListener('change', (evento) => {
  if (evento.target.name === 'puntaje') errorPuntaje.hidden = true;
});

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const puntaje = Number(formulario.puntaje.value);
  if (!puntaje) {
    errorPuntaje.hidden = false;
    formulario.querySelector('.estrellas input').focus();
    return;
  }
  agregarResena({ autor: formulario.autor.value, puntaje, comentario: formulario.comentario.value });
  formulario.hidden = true;
  gracias.hidden = false;
  gracias.focus();
  pintarLista();
  avisar('Reseña enviada');
});

pintarLista();
