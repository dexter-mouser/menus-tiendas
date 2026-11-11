// Arranque del servidor
import { cargarConfiguracion } from './nucleo/configuracion.js';
import { crearApp } from './nucleo/app.js';

const config = await cargarConfiguracion();
const { app } = await crearApp(config);

app.listen(config.entorno.puerto, () => {
  console.log(`${config.general.nombreApp} (${config.cliente.nombre}) en http://localhost:${config.entorno.puerto}`);
});
