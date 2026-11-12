# Bitácora · 12 noviembre 2026 · Fichas, banners, aeropuertos Chile y ranking Colombia

## Requerimiento
- Recuperar banner detrás del título de todas las experiencias, usando su imagen de destino.
- Presentar tarifa por persona y, para paquetes, por acomodación doble; recalcular mensaje cuando selecciona habitación individual.
- No anunciar debajo del precio ni en cabecera un código de descuento que el viajero no haya recibido.
- Eliminar recuadro «Información del paquete» si muestra solo duración; mostrar resumen de duración, dificultad, destino, servicios y vuelos junto a la descripción.
- Mantener plantilla compartida para nuevas fichas.
- Permitir búsqueda de vuelos y hoteles para nuevos destinos de Chile (especialmente Rapa Nui) y documentar cómo actualizar Apps Script.
- Preparar ranking comercial de Colombia sin nuevos precios ni modificaciones de pagos.

## Implementación
1. `assets/js/main.js`: el normalizador usa imágenes de su propia ficha `og:image`/`--detail-image`, oculta el código de promoción pública, cambia título del precio, retira tarjeta de información redundante de paquetes e inserta cinco datos compactos en la descripción. No altera precios.
2. `assets/css/main.css`: estilos de banner y degradado corporativo para experiencias nuevas, antiguas y fichas unificadas; resumen responsive.
3. `assets/js/package-product-20261108.js`: etiqueta variable según doble/matrimonial/single; aeropuerto IPC con SCL recomendado; ciudades hoteleras equivalentes para siete paquetes Chile.
4. `integraciones/vuelos/Code.gs`: lista de aeropuertos actualizada con **IPC, PMC, BBA, ZCO y MHC**; lista blanca Google Hotels ampliada con Puerto Varas, Coyhaique, Pucón, Hanga Roa, Castro, Puerto Natales y Punta Arenas. Nada de tarifas inventadas.
5. `tools/build.py`: plantillas permanentes con imagen hero, sección «Sobre este paquete» y nomenclatura de precio. Se preservan las fichas gestionadas en Chile/Colombia.
6. HTML Chile (10 fichas): no muestra la reducción antes de que el viajero ingrese cupón y se actualizó la versión de CSS/JS, sin alterar montos 2026 aprobados. El campo «Código de descuento» sigue operativo.
7. `docs/RANKING_COLOMBIA_2026-11-12.md`: 25 paquetes y 55 experiencias, priorización de 12 líneas comerciales basadas en ANATO y otras fuentes.

## Pruebas ejecutadas
- El catálogo tiene 81 experiencias con imagen declarada y archivo local existente; 81 páginas actuales también existen.
- `main.js`, `package-product-20261108.js` y `integraciones/vuelos/Code.gs` pasan sintaxis JavaScript.
- Prueba **sin clave privada** y sin efectuar consultas SerpAPI: las rutas SCL–IPC, SCL–PMC, SCL–BBA, SCL–ZCO, SCL–MHC y SCL–PUQ superan la validación de aeropuertos; la búsqueda de hoteles supera su lista blanca y llega a la comprobación de `SERPAPI_KEY`. Esto NO confirma tarifa ni disponibilidad.
- Búsquedas reales y revisión visual móvil/PC quedan pendientes de desplegar Apps Script y ejecutar flujo de navegador; no se realizaron operaciones PayPal.

## Importante para despliegue
**GitHub no despliega automáticamente Apps Script.** Copiar el archivo `integraciones/vuelos/Code.gs` al proyecto LATAM Flights API identificado en `assets/js/vuelos-config.js`, desplegar una **nueva versión de la Web App** y probar rutas/cupos futuros. No cambiar `backend/Codigo.gs` ni PayPal en esta tarea. No publicar `SERPAPI_KEY` ni propiedades privadas.

## Siguiente etapa comercial
Revisar los productos de Colombia por orden: Cartagena, Medellín, Santa Marta, San Andrés, Eje Cafetero, Bogotá, circuitos y nichos. Auditar hotel 4★, temporadas, itinerario y margen antes de publicar actualizaciones.
