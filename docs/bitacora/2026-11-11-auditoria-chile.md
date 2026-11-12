# Bitácora · 2026-11-11 · Auditoría y plantilla de Chile

## Solicitud
Revisar itinerarios por países, comenzando por Chile, normalizar el diseño a Atacama Premium / Santiago–Atacama, confirmar el cálculo de vuelos y suplementos y reservar las pruebas de PayPal para después.

## Hallazgos del repositorio
- Catálogo: 38 paquetes, 81 experiencias, países con paquetes: Chile, Perú, Argentina, Bolivia, Ecuador, Brasil, México y Colombia.
- Tres paquetes de Chile están incluidos en `assets/data/catalog.json`; una ficha `chile-atacama.html` anterior 6D/5N existe fuera del catálogo, con precio de reserva cero. Se identificó para desactivar el checkout automático.
- El calculador de paquete suma la tarifa de los viajeros y ocupación, el **precio total grupal de vuelos**, el suplemento del hotel por grupo y resta el cupón del paquete. Los mismos campos alimentan el resumen de reserva y `booking.js`.
- **Limitación grave:** los tiers de Chile permitían precios de triple, single y familiar a falta de tarifas verificadas, aplicando el precio por persona de doble. Se restringió a las ocupaciones que sí constan en el catálogo para cada producto.
- La ficha de Patagonia carecía del diseño contemporáneo y no tenía ruta de búsqueda aérea explícita, pese a `flightsAvailable:true`.
- Día 5 de Patagonia anunciaba Seno Otway, actualmente cerrado a visitas turísticas. Alternativa sugerida: navegación opcional a Isla Magdalena, con temporada y disponibilidad.

## Implementación en rama
`feat/chile-catalog-template-audit-20261111`

1. `paquetes/chile-patagonia-6d5n.html`: portada visual, cuadro de datos, contenido por días, galería, hoteles, reservas y selección dinámica de vuelos con aeropuerto PUQ. Se conserva la lista de seis días y todas las categorías de alojamiento existentes. La galería usa únicamente imagen local pertinente del destino.
2. `assets/data/catalog.json`: itinerario día 5 corregido, excursión opcional a Isla Magdalena fuera de precio y tarifa base por doble explícita en Santiago/Atacama y Patagonia.
3. `paquetes/chile-atacama-5d4n.html`: sincronización de tiers y ocupaciones con catálogo; texto aclara qué precios necesitan cotización.
4. `assets/js/package-product-20261108.js`: `supportedRoomPlans` respeta tarifas de ocupación explícitas; en Chile muestra «Por cotizar» y canal de WhatsApp para configuraciones sin tarifa.
5. `assets/js/booking.js`: en Chile valida ocupación y número de pasajeros antes de pasar al resumen. **Sin cambios en createOrder/captureOrder o APIs PayPal**.
6. `paquetes/chile-atacama.html` histórica: aviso de versión antigua, robots noindex y botón de reserva desactivado.
7. `docs/CATALOGO_ITINERARIOS_2026-11-11.md`: inventario de paquetes por país e itinerarios detallados de Chile.

## Pruebas y pendientes
- Inspección estática de catálogo/DOM/JS, consistencia de slugs, URLs, sumas y categorías.
- Falta prueba real de navegador móvil, reserva de cliente y respuesta SerpAPI (Apps Script no accesible desde entorno de comprobación).
- Falta confirmar tarifas de hoteles Patagonia (en particular distribución Puerto Natales/Punta Arenas), navegación Grey, entradas Torres del Paine, traslados, vuelos y galería de fotos del proveedor.
- No se hicieron ni se autorizan en esta tarea órdenes o capturas de PayPal. El sandbox y la conciliación se abordarán aparte.
- Cuando se modifiquen los backend de Google Apps Script, publicar explícitamente una nueva versión; GitHub no despliega estos proyectos automáticamente.

## Fuentes oficiales / externas para plan comercial
- CONAF: https://www.conaf.cl/parque_nacionales/parque-nacional-torres-del-paine/
- CONAF: https://www.conaf.cl/parque_nacionales/monumento-natural-los-pinguinos/
- CONAF nuevas tarifas (2026): https://www.conaf.cl/el-1-de-mayo-entra-en-vigencia-nuevo-sistema-tarifario-para-el-parque-nacional-torres-del-paine/
