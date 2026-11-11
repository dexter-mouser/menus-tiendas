// Configuración del cliente "La Terraza". Valores iniciales: el panel puede cambiar
// nombre, moneda, funciones activas y modo demo, y esos cambios se guardan en la base de datos.
export default {
  nombre: 'La Terraza',
  logo: null,
  tema: {
    acento: '#c2410c'
  },
  negocio: {
    moneda: 'COP',
    localidad: 'es-CO',
    porcentajeServicio: 10,
    maximoMesas: 10,
    mesasIniciales: 1
  },
  // Módulos activos. Quitar uno de la lista lo apaga en el servidor y en la app.
  modulos: ['menu', 'carrito', 'pedidos', 'cocina', 'resenas', 'mesas'],
  // Muestra en el login el usuario y la clave de prueba. Si ADMIN_CORREO y ADMIN_CLAVE
  // no están en .env, el administrador se crea con estos datos (solo en modo demo).
  modoDemo: true,
  demo: { correo: 'admin@laterraza.co', clave: 'terraza-2026' },
  // Carta inicial (solo se carga si la base de datos está vacía)
  cartaInicial: [
    {
      categoria: 'Entradas',
      platos: [
        { nombre: 'Empanadas de pipián', descripcion: 'Cuatro unidades con ají de maní casero.', precio: 14000 },
        { nombre: 'Patacones con hogao', descripcion: 'Plátano verde crocante, hogao y queso costeño.', precio: 16500 },
        { nombre: 'Ceviche de camarón', descripcion: 'Limón, cebolla morada, cilantro y aguacate.', precio: 24000 }
      ]
    },
    {
      categoria: 'Platos fuertes',
      platos: [
        { nombre: 'Bandeja paisa', descripcion: 'Fríjoles, arroz, chicharrón, carne molida, huevo, arepa y maduro.', precio: 38000 },
        { nombre: 'Ajiaco santafereño', descripcion: 'Con pollo desmechado, mazorca, crema y alcaparras.', precio: 32000 }
      ]
    },
    {
      categoria: 'Bebidas',
      platos: [
        { nombre: 'Limonada de coco', descripcion: 'Cremosa, con leche de coco y hielo.', precio: 9000 },
        { nombre: 'Jugo de lulo', descripcion: 'En agua o en leche.', precio: 7500 }
      ]
    },
    {
      categoria: 'Postres',
      platos: [
        { nombre: 'Torta tres leches', descripcion: 'Porción individual con canela.', precio: 12000 },
        { nombre: 'Brevas con arequipe', descripcion: 'Con queso campesino.', precio: 11000 }
      ]
    }
  ]
};
