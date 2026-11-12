# Bitácora · 11 de noviembre de 2026 · Precios de Chile y Patagonia detallada

## Alcance

Investigación del coste de compra por separado (hotel, tours, traslados y entradas), comparativa con paquetes de otras agencias, revisión de los tres precios actuales de Chile y propuestas de siete paquetes nuevos para completar diez. Se excluye explícitamente la verificación y el desarrollo de PayPal.

## Hallazgos

1. Atacama Premium con Terrantai se posiciona en premium: precio de lista US$1,499.90/pax y presupuesto autogestionado referencial US$850–1,300/pax. No bajar precio sin coste de contrato.
2. Santiago–Atacama de US$880/pax aparece alto para combinación Panamericano + hostal. Objetivo a estudiar US$799.90/pax si costos, impuestos y descuentos permiten margen. Corroborar si `Hostal La Ruca` es `La Rukka Hostal Boutique`.
3. Patagonia de US$1,450/pax está en rango de operadores organizados, pero antes de aceptar cobro necesita hotel confirmado en Punta Arenas, navegación Grey y servicios efectivos. Referencia programa ~4N Puerto Natales + 1N Punta Arenas.
4. Se consultaron referencias actualizadas de Booking/Expedia/KAYAK, Viator, TourRadar, Chile Travel, CONAF, transfer, Hotel Lago Grey y operadores locales. Cambio USD-CLP de referencia ~983 CLP por USD el 11/11/2026.
5. Se creó `docs/ESTUDIO_MERCADO_CHILE_2026-11-11.md` con siete candidatos (Santiago-Valparaíso, Puerto Varas, Carretera Austral, Pucón, Rapa Nui, Valle Nevado y Chiloé), propuestas de precio, cupón del 10%, costo objetivo y temporada. Elqui es suplente.

## Modificaciones en la rama

`feat/chile-pricing-research-patagonia-detailed-20261111`

- `paquetes/chile-patagonia-6d5n.html`: itinerario de seis días con **35 hitos horarios referenciales** (llegada y traslado, parque, navegación Grey, Cueva del Milodón, Punta Arenas/Isla Magdalena y aeropuerto). Hoteles divididos cuatro noches Natales y una Punta Arenas; hotel de Punta Arenas sin nombre hasta verificar.
- `assets/js/package-product-20261108.js`: aviso de hoteles en dos ciudades y se desactiva sustitución automática basada en una estancia de una ciudad, que no representa esta ruta.
- Patagonia en `assets/data/catalog.json`: marcado `quoteOnly` hasta hotel y servicios confirmados; HTML también con `data-book-quote-only="true"`.
- Documentos y README conectan investigación con manual vigente.
- No se alteraron órdenes, capturas ni credenciales de PayPal.

## QA y pendientes

- Revisar sintaxis y diff; controlar que permanezcan 38 paquetes y 81 experiencias. Comprobar precios actuales no cambiados.
- **Pendiente en proveedor:** 5.ª noche en Punta Arenas, tarifa mayorista de navegación Grey con traslado, 4 noches Puerto Natales, Park Pass, fechas, cupos, política clima y hotel alternativo.
- **Pendiente en producto:** fotografías legítimas de Patagonia, identidad La Ruca/La Rukka, ocupaciones infantiles/single y cotización real del proveedor.
- **Pendiente en web:** navegador móvil/PC y búsqueda real en SerpAPI; ni fuente de hotel ni avión se ha confirmado desde Apps Script en esta revisión. No abrir ventas automáticas de Patagonia hasta cerrar.
