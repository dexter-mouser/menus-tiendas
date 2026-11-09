# MesaQR

Menú digital con pedidos por QR para restaurantes. El cliente escanea el QR de su mesa, ve la carta, pide y sigue el estado de su pedido sin iniciar sesión. El restaurante entra con usuario y clave a un panel para gestionar mesas, cocina, reseñas y ajustes.

Por ahora el repositorio tiene el diseño aprobado como prototipo estático. La app real (React + Node.js) se construirá a partir de él.

## Ejecutar el prototipo

Los módulos ES necesitan un servidor; abrir el archivo directamente no funciona. Desde la raíz del proyecto, con cualquier servidor estático, por ejemplo:

```bash
npx serve .
```

Luego abre `diseno/index.html?mesa=1` (vista del cliente) o `diseno/login.html` (panel).

## Estructura

```
skeleton/            Boceto de las vistas (bloques grises, sin texto)
diseno/              Prototipo navegable con el diseño final
├── *.html           Vistas: carta, carrito, pedido, reseñas, login, mesas, cocina, reseñas del panel, ajustes
├── style.css        Tema (variables en :root), componentes, vistas y estado de carga
├── icons.svg        Iconos SVG en <symbol>
├── app.js           Servicios comunes: carga, almacenamiento, formatos, mesa, módulos y avisos
└── js/              Un archivo por vista, más pedidos.js y datos-resenas.js (datos compartidos)
```

## Cómo funciona el prototipo

- **Mesa:** llega en la URL del QR (`?mesa=3`) y se recuerda durante la visita.
- **Datos:** carrito, pedidos, reseñas, mesas y ajustes se guardan en `localStorage` del navegador. En la app vivirán en el servidor (SQLite).
- **Tiempo real:** si abres el estado del pedido y la cocina en dos pestañas, los cambios de estado se ven al instante (evento `storage`). En la app se hará con Server-Sent Events.
- **Carga:** cada vista muestra su skeleton hasta tener los datos; en el prototipo la espera está simulada.
- **Módulos:** desde Ajustes se activan o apagan pedidos, cocina, reseñas y el modo demo. Un módulo apagado agrega la clase `sin-<módulo>` a `<html>` y el CSS oculta lo marcado con `data-modulo="<módulo>"`.
- **Modo demo:** muestra en el login un recuadro con usuario y clave de prueba, con botón de copiar.
- Para empezar de cero, borra los datos del sitio en el navegador (o `localStorage.clear()` en la consola).
