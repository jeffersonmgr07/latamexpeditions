# Bitácora técnica y comercial · Chile premium 10 paquetes · 11/11/2026

## Encargo

Reestructurar los tres paquetes ya publicados de Chile para ofrecer categoría hotelera **4★ o boutique superior**, ajustar precios y descuento del 10%, completar un portafolio de diez itinerarios con estructura Atacama Premium, sin intervenir en PayPal.

## Resultado implementado

- Atacama Premium: **US$1,349.00 por persona en doble** (código LATAM10EXP → **US$1,214.10**), Terrantai 4★. El costo de habitación al público ~US$400/noche puede impedir rentabilidad con excursiones de US$350/pax; se requiere tarifa neta.
- Santiago + Atacama: **US$949.90** (→ **US$854.91**), base 1 noche **Novotel Providencia 4★** + 3 noches **Casa Solcor 4★**. Tiers boutique adicionales con NOI Casa y Hotel Desértica, precios propios. Retirado Panamericano y hostal de la base.
- Patagonia 6D/5N: **US$1,399.90** (→ **US$1,259.91**), referencia cuatro noches **Costaustralis 4★** y una **Cabo de Hornos 4★**. Itinerario detallado anterior preservado, Grey y otros servicios pendientes de cotización real.
- Siete nuevas fichas en `paquetes/`, con 31 días de itinerarios y 141 hitos horarios referenciales; destinos Santiago/Valparaíso/Casablanca, Puerto Varas, Carretera Austral, Pucón, Rapa Nui, Valle Nevado, Chiloé.
- `assets/data/catalog.json` ahora registra **45 paquetes, 10 de Chile**, todos los 10 chilenos con `quoteOnly=true`.
- `paquetes.html` muestra las diez tarjetas. Esquema SEO `ItemList` actualizado a 45 paquetes; los siete nuevos tienen `noindex,follow` por estar en fase comercial de cotización.
- `assets/js/package-product-20261108.js` redirige las consultas de los productos `quoteOnly` a WhatsApp incluyendo viaje, fecha, viajeros, hotel y precio referencial. No abre cobro.
- `backend/Codigo.gs` contiene nuevas tablas de precios de los tres Chile existentes y deniega pago de estos mientras no exista tarifa contractual; no se cambiaron operaciones de PayPal. Este cambio **NO está desplegado automáticamente en Apps Script**.
- `tools/build.py` conserva manualmente los HTML premium chilenos al regenerar; maneja tarjetas sin foto. Recompilar toda la web puede sobrescribir otras páginas manuales; revisar diffs.
- Cinco fichas aún no tienen foto de destino: Puerto Varas, Carretera Austral, Pucón, Rapa Nui, Chiloé. Se muestran placeholders de marca, no imágenes falsas.

## Archivos esenciales

- Catálogo: `assets/data/catalog.json`
- Fichas: `paquetes/desierto-atacama-premium-5d4n.html`, `paquetes/chile-*.html` (excepto la ficha antigua 6D/5N fuera de catálogo)
- Tabla de precios y validación Apps Script: `backend/Codigo.gs`
- UI de paquetes / cotización: `assets/js/package-product-20261108.js`
- Generador fuente: `tools/build.py`
- Plan fuente con siete productos: `docs/chile/PRODUCTOS_PREMIUM_2026.json`
- Estudio comercial vigente: `docs/ESTUDIO_MERCADO_CHILE_2026-11-11.md`
- Manual oficial: `docs/MANUAL_PROYECTO_VIGENTE.md`

## Pendientes obligatorios y limitaciones

1. Tarifa neta por temporada y ocupación en los hoteles y proveedores. No prometer disponibilidad sin contrato.
2. Cinco fotografías de destinos y, después, imágenes autorizadas de hoteles. Evitar material comercial con licencias no comprobadas.
3. QA móvil real, selector de vuelos/hoteles y seguimiento de WhatsApp; la prueba estática de código no equivale a una consulta SerpAPI real.
4. Despliegue manual de Apps Script si se desea aplicar la lógica de precios en backend. Nunca sustituir Apps Script de producción sin pruebas del resto de países.
5. PayPal excluido de esta etapa por solicitud expresa; no se han creado órdenes, capturas ni pagos.

## Criterio de publicación

No mostrar rebaja artificial. El precio de lista aprobado debe ser real antes de publicitar el «10% menos». El frontend muestra un **precio objetivo** y pide cotización de disponibilidad; el operador confirma y documenta el precio final antes del pago.
