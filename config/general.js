// Constantes globales de la aplicación (iguales para todos los clientes)
export const GENERAL = {
  nombreApp: 'MesaQR',
  puertoPorDefecto: 3000,
  clientePorDefecto: 'la-terraza',
  // Duración de la sesión del panel
  duracionSesionHoras: 12,
  // Estados de un pedido, en orden
  estadosPedido: ['nuevo', 'preparando', 'listo', 'entregado'],
  limites: {
    notasPedido: 200,
    comentarioResena: 300,
    autorResena: 40,
    nombrePlato: 50,
    descripcionPlato: 140,
    nombreNegocio: 60,
    cantidadPorLinea: 20,
    lineasPorPedido: 30
  }
};
