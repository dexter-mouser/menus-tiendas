// Carga la configuración del cliente activo y el entorno
import { GENERAL } from '../../config/general.js';

const NOMBRE_VALIDO = /^[a-z0-9-]+$/;

export async function cargarConfiguracion() {
  const cliente = process.env.CLIENTE || GENERAL.clientePorDefecto;
  if (!NOMBRE_VALIDO.test(cliente)) throw new Error(`Nombre de cliente no válido: ${cliente}`);
  const { default: configCliente } = await import(`../../config/clientes/${cliente}.js`);

  return {
    general: GENERAL,
    cliente: configCliente,
    entorno: {
      puerto: Number(process.env.PUERTO) || GENERAL.puertoPorDefecto,
      baseDatos: process.env.BASE_DATOS || 'datos/mesaqr.db',
      adminCorreo: process.env.ADMIN_CORREO || '',
      adminClave: process.env.ADMIN_CLAVE || '',
      urlPublica: (process.env.URL_PUBLICA || '').replace(/\/+$/, ''),
      esProduccion: process.argv.includes('--produccion')
    }
  };
}
