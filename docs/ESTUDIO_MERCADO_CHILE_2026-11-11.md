# Chile · Portafolio comercial premium vigente (10 paquetes)

**Versión:** 11 de noviembre de 2026, revisión premium 2.0. **Estado:** 10 páginas integradas al catálogo web en modalidad de **cotización previa**, sin cobro automático y sin vuelos incluidos. Los importes son precios objetivos de LATAM Expeditions; **no son contratos de hotel o excursiones confirmados**.

La primera evaluación económica, anterior a esta reestructuración, se conserva exclusivamente para auditoría en [histórico](historico/ESTUDIO_MERCADO_CHILE_2026-11-11_inicial.md). **Esta tabla reemplaza los precios recomendados de aquella versión.**

## Lista objetivo, descuento y techo de costo

Política aplicada: habitación doble para **dos adultos**, precio por persona en USD, descuento de 10% con código `LATAM10EXP` aplicado solo al paquete, **no a vuelos ni adicionales**. Los niveles superiores se cotizan según tier y no se anuncian como reservas confirmadas.

El techo de costo mostrado es **75% del precio final promocional** para dejar un margen bruto objetivo de 25% ANTES de gastos de comercialización, pasarela, impuestos u otros costos. Es una **restricción** para negociar, no un costo real.

| # | Paquete / alojamiento base de referencia | Duración | Lista US$ por persona | Con −10% US$ | Costo máximo de servicios US$ |
|---:|---|---|---:|---:|---:|
| 1 | Desierto de Atacama Premium · Hotel Terrantai (4★) | 5D/4N | 1,349.00 | 1,214.10 | 910.58 |
| 2 | Santiago y Atacama · Novotel Santiago Providencia + Casa Solcor (4★) | 5D/4N | 949.90 | 854.91 | 641.18 |
| 3 | Patagonia y Torres del Paine · Hotel Costaustralis (Puerto Natales) + Hotel Cabo de Hornos (Punta Arenas) (4★) | 6D/5N | 1,399.90 | 1,259.91 | 944.93 |
| 4 | Santiago, Valparaíso, Viña del Mar y Casablanca · Novotel Santiago Providencia (4★) | 4D/3N | 599.90 | 539.91 | 404.93 |
| 5 | Puerto Varas, Frutillar, volcán Osorno y Petrohué · Hotel Bellavista Puerto Varas (4★) | 5D/4N | 829.90 | 746.91 | 560.18 |
| 6 | Carretera Austral y Capillas de Mármol · Hotel Dreams Patagonia Coyhaique (5★) | 4D/3N | 1,199.90 | 1,079.91 | 809.93 |
| 7 | Pucón, volcán Villarrica y termas · Hotel Casa Solaria (4★) | 5D/4N | 899.90 | 809.91 | 607.43 |
| 8 | Rapa Nui: moáis y cultura ancestral · Hotel Hare Nua (4★) | 5D/4N | 1,299.90 | 1,169.91 | 877.43 |
| 9 | Santiago y Valle Nevado: aprende a esquiar · Novotel Santiago Providencia (4★) | 4D/3N | 949.90 | 854.91 | 641.18 |
| 10 | Chiloé: cultura, palafitos y naturaleza · Hotel Parque Quilquico (4★) | 4D/3N | 799.90 | 719.91 | 539.93 |

## Qué está implementado ahora

- **Tres existentes:** Terrantai 4★, Novotel Providencia 4★ + Casa Solcor 4★, Costaustralis 4★ + Cabo de Hornos 4★. Los tiers boutique/premium están definidos en catálogo y el backend mantiene los precios objetivo, pero **cualquier venta requiere contratación efectiva del proveedor**.
- **Siete nuevos:** Santiago/Valparaíso/Casablanca; Puerto Varas y volcanes; Carretera Austral y Capillas de Mármol; Pucón y termas; Rapa Nui; Santiago y Valle Nevado; Chiloé. Hay fichas con itinerario por hora y hoteles 4★ o 5★ de referencia. Todos son **solo cotización**. La opción de hotel alternativo debe comprobarse para varias ciudades antes de prometer suplementación automática.
- Los datos de tarifas se mantienen en `assets/data/catalog.json`, los nombres y precios se plasman en las 10 fichas HTML y las tres antiguas quedaron sincronizadas con `backend/Codigo.gs` **sin tocar PayPal**.
- La pestaña de paquetes públicos contiene 10 tarjetas de Chile. La captura de un lead mediante botón «Solicitar cotización» lleva al WhatsApp de la agencia con el viaje, fecha, viajeros y selección, **sin iniciar checkout**.
- **Imágenes:** fotos locales representativas para los tres productos originales y dos fichas basadas en Santiago. **Faltan fotos autorizadas específicas de Puerto Varas, Capillas de Mármol, Pucón, Rapa Nui y Chiloé.** Esas cinco páginas muestran un aviso visual en lugar de una foto ajena o de otro destino; la agencia debe aportar imágenes propias o con licencia comercial documentada.
- **Reservas:** `quoteOnly=true` para los 10. No se han solicitado pagos ni confirmado hoteles. La tabla `PRECIOS_PAQUETES` de Apps Script se actualizó en GitHub, pero requiere desplegar manualmente la nueva versión antes de operar, aunque el frontend ya evita el cobro para estos productos.

## Análisis económico de Terrantai

Presupuesto del cliente: tarifas OTA entre S/1,059 y S/1,677 por noche en diferentes ofertas, promedio simple **S/1,368/noche para habitación** (una muestra de precios, no garantía de fechas comparables). Aproximadamente US$400 por noche si 1 USD≈S/3.42; dos personas en habitación doble → US$200 por viajero/noche, cuatro noches → **US$800 por persona solo hotel**. Excursiones al público ≈US$250–350 → US$1,050–1,150 antes de transfers, accesos, comisiones y márgenes.

Con lista **US$1,349.00** y promoción **US$1,214.10**, después de US$800 de hotel y US$350 de excursiones quedan **US$64.10** para traslados, entradas y utilidad. **No es suficiente para afirmar margen positivo**, mucho menos 25%, si se compran los servicios a precio público. El costo operativo total debería estar **como máximo cerca de US$910.58 por persona** para alcanzar 25% de margen bruto; por tanto, hay que conseguir tarifa neta de Terrantai y costo de tours de operador. Si no, aumentar lista, reducir alcance con información transparente o ofrecer otro 4★, sin sustituir unilateralmente Terrantai.

Fuentes: [Terrantai Google Hotels](https://www.google.com/travel/hotels/entity/CgoI8O2csYna45kfEAE); [hoteles 4★ San Pedro](https://www.hoteles.com/de10349302-st4/4-estrellas-hoteles-san-pedro-de-atacama-chile/).

## Santiago + Atacama

Base objetivo **US$949.90** (promocional US$854.91), con **1 noche Novotel Santiago Providencia** y **3 noches Casa Solcor** como referencias hoteleras (4★ en proveedores consultados). Alternativas boutique superiores: Novotel + NOI Casa Atacama y Novotel + Hotel Desértica, cada una con su propia lista. Esta combinación reemplaza completamente Panamericano 3★ y Hostal La Rukka, que **no son hoteles 4★**.

No asignar habitaciones reales ni prometer ahorro sin confirmación del precio. El vuelo interno **SCL–CJC–SCL sigue fuera del paquete**, al igual que el vuelo al país de origen.

Fuentes: [Accor Novotel 4★](https://all.accor.com/hotel/A092/index.es.shtml); [Casa Solcor / NOI / Desértica](https://www.hoteles.com/de10349302-st4/4-estrellas-hoteles-san-pedro-de-atacama-chile/); [La Rukka hostal](https://sanpedroatacama.com/accommodation/hostal-la-rukka/).

## Patagonia

Base objetivo **US$1,399.90** (con cupón US$1,259.91), con **4 noches en Puerto Natales (Costaustralis 4★)** + **1 en Punta Arenas (Cabo de Hornos 4★)** como referencias. Habitaciones, costos y condiciones de navegación Grey siguen pendientes de contrato. El itinerario detallado mantiene 6 días y 35 eventos horarios estimados. Isla Magdalena es opcional, no incluida; el ingreso a Torres del Paine está excluido salvo revisión comercial formal.

Fuentes: [Costaustralis 4★](https://www.kayak.com.pe/Puerto-Natales-Hoteles-Hotel-Costaustralis.116552.ksp); [Cabo de Hornos 4★](https://www.google.com/travel/hotels/entity/ChcIvtLxoLyeu5Z7GgsvZy8xdnE3NjJzcBAB); [navegación Grey](https://www.lagogrey.com/navegacion/).

## Los siete nuevos y riesgos operativos

| Producto | Hotel base de referencia | Aspecto que falta contratar/verificar |
|---|---|---|
| Santiago, Valparaíso, Viña del Mar y Casablanca | Novotel Santiago Providencia (4★) | Todo el año. Cotizar proveedores, ocupación, seguros y entradas; fotos del destino parciales. |
| Puerto Varas, Frutillar, volcán Osorno y Petrohué | Hotel Bellavista Puerto Varas (4★) | Todo el año; clima condiciona los paisajes. Cotizar proveedores, ocupación, seguros y entradas; fotos del destino pendientes. |
| Carretera Austral y Capillas de Mármol | Hotel Dreams Patagonia Coyhaique (5★) | Preferente octubre–abril; viento y lago pueden suspender navegación. Cotizar proveedores, ocupación, seguros y entradas; fotos del destino pendientes. |
| Pucón, volcán Villarrica y termas | Hotel Casa Solaria (4★) | Todo el año; termas y senderos sujetos a clima. Cotizar proveedores, ocupación, seguros y entradas; fotos del destino pendientes. |
| Rapa Nui: moáis y cultura ancestral | Hotel Hare Nua (4★) | Todo el año; acceso a sitios arqueológicos regulado. Cotizar proveedores, ocupación, seguros y entradas; fotos del destino pendientes. |
| Santiago y Valle Nevado: aprende a esquiar | Novotel Santiago Providencia (4★) | Invierno austral; nieve y remontes sujetos a condiciones y calendario oficial. Cotizar proveedores, ocupación, seguros y entradas; fotos del destino parciales. |
| Chiloé: cultura, palafitos y naturaleza | Hotel Parque Quilquico (4★) | Todo el año, clima variable. Cotizar proveedores, ocupación, seguros y entradas; fotos del destino pendientes. |

### Advertencias comerciales y seguridad del viajero

- **Carretera Austral:** Coyhaique–Puerto Río Tranquilo es una **jornada larga**, con caminos sujetos a hielo/obras y navegación variable por viento. El paquete dispone de hotel en Coyhaique, no atribuye cinco estrellas a todos los alojamientos de la región.
- **Rapa Nui:** requiere FUI, hospedaje habilitado y guías locales autorizados en sectores arqueológicos; entrada parque según requisitos.
- **Esquí en Valle Nevado:** temporada austral depende de nieve, pistas y aperturas; la propuesta contempla un día de iniciación y otro panorámico. No promete dos días de clase en forfait si no está contratado. [Tarifas del resort 2026](https://skiday.vallenevado.com/tours/display?ES_AGENCIA=2&LANGUAGE=ES&NOMBRE_PAGINA=arrienda&RESORT=hvn).
- **Pucón:** Hotel Casa Solaria aparece como hotel 4★. No se incluye ascenso técnico al volcán ni acceso a termas sin confirmar operador.
- **Puerto Varas:** Hotel Bellavista 4★. Hay referencias OTA desde ~USD 142–171/noche en fechas puntuales, no inventar tarifa fija para todos los meses.
- **Chiloé:** Parque Quilquico aparece 4★; logística aeroportuaria MHC se comprueba en cada fecha.

## Publicación / operación

**Catálogo visible no significa disponibilidad confirmada.** Hasta cerrar proveedor y margen de cada paquete: precio referencial, botón de cotización WhatsApp, sin cobro automático ni oferta cruzada de vuelos como servicios emitidos. Cada página nueva dispone de `noindex,follow` hasta contar con fotografías, contratos y validaciones finales. Los tres productos previos mantienen sus URLs públicas con aviso de precio objetivo.

**Próximas tareas:** (1) negociar tarifas netas y políticas por ocupación con hoteles; (2) validar proveedor/excursión y entradas; (3) incorporar 5 galerías propias o con licencia; (4) revisar móvil/PC y apertura WhatsApp; (5) publicar backend Apps Script cuando se apruebe; (6) solo más adelante verificar pagos PayPal Sandbox.
