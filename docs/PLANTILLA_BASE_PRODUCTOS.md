# LATAM EXPEDITIONS — PLANTILLA BASE DE PRODUCTOS

**Estado:** aprobada y establecida como referencia obligatoria de diseño.
**Referencia visual:** `paquetes/desierto-atacama-premium-5d4n.html` y `experiencias/comuna-13-medellin.html`.
**Ámbito:** nuevas páginas de paquetes, tours, experiencias, excursiones y ofertas.

## Reglas obligatorias
- No alterar componentes, estilos, itinerarios o funcionalidades que el propietario no haya solicitado.
- Reutilizar las hojas `assets/css/main.css` y `assets/css/package-product-20261108.css`, junto con el normalizador compartido de `assets/js/main.js` y, para paquetes, `assets/js/package-product-20261108.js`.
- Mantener los mismos componentes, proporciones, márgenes simétricos, responsive para PC/móviles, tipografía, tarjetas, acordeones, botones y formularios de la referencia.
- Banner con fotografía **específica del destino**, visible bajo un degradado verde translúcido suficientemente opaco para que el título se lea. La imagen se registra como `--lx-hero-img` con URL de `assets/img`. Nunca usar una imagen genérica o de un destino incorrecto.
- Mantener información esencial, sobre la experiencia / paquete, puntos destacados, horarios y operación, itinerario, incluye/no incluye, entradas y pagos adicionales, idiomas, recomendaciones, restricciones, accesibilidad, clima, cancelación, voucher, preguntas frecuentes, cotización a medida y WhatsApp, según aplique al producto.
- La ficha debe mantener en el summary fecha de llegada, viajeros, precio desglosado, cupones, total a pagar, y reservas, según el tipo de producto. Evitar precios y textos duplicados. Los descuentos se visualizan en negativo **una sola vez**.
- Nunca mostrar notas internas, presupuestos, «tarifa objetivo», advertencias de desarrollo, códigos técnicos de costos ni mensajes solo para operadores. Todo texto público debe dirigirse al viajero.
- Badges de cards: solo describir la esencia de la experiencia (cultura, naturaleza, paisajes, gastronomía, etc.). No usar duraciones, estados operativos ni estrellas decorativas.
- Categoría de alojamiento siempre escrita con palabras: «Cuatro estrellas», «Cinco estrellas» (sin iconos).
- La referencia aprobada debe conservarse al añadir productos; cada producto aporta su contenido, fotografía, servicios y tarifas propios, sin copiar datos o precios de Atacama.

## Integración de una nueva ficha
1. Reutilizar la estructura HTML de la ficha de referencia, sustituyendo únicamente el contenido turístico específico.
2. Conectar los estilos y scripts compartidos que generan y mantienen la UI aprobada. Mantener todas las rutas de imágenes verificables.
3. Verificar en escritorio y móvil los banners, márgenes, reservas, búsqueda de fechas y viajeros, descuentos, galerías y botones de contacto.
4. No dar la publicación ni las reservas como verificadas sin inspeccionar el sitio desplegado.

**Cambios posteriores de esta plantilla:** solo por solicitud expresa del propietario.
