# Latam Flights — Ajustes de interfaz y búsqueda exacta

## Qué se corrigió en el sitio

- Buscador y resultados con textos comerciales breves. Se eliminan explicaciones sobre API, caché, márgenes y datos técnicos que no aportan al comprador.
- Tarjetas con un solo **precio de Latam Expeditions** (el ajuste comercial se calcula internamente). Se distingue total para el grupo si el proveedor devuelve un precio grupal, o precio **por adulto** si la fuente únicamente informa ese tipo de tarifa.
- El botón **Reservar** abre un modal para recopilar los datos de cada pasajero cuando se haya activado correctamente la integración.
- En los resultados solo se mostrarán tarifas que coincidan con **las fechas exactas** de la consulta. Ya no se publican vuelos de fechas distintas en la misma lista.
- Los filtros de precio trabajan sobre el importe que verá el cliente, no el importe base.
- El formulario de pasajeros recibe origen, destino, tipo de trayecto, fechas y cantidad de viajeros desde una plantilla de Apps Script. Esta corrección resuelve la cabecera vacía que se observó en la prueba anterior.
- El comprobante posterior presenta un número de solicitud interno y explica de forma concisa que no es el localizador de una aerolínea.

## Integración realmente disponible

**Sin la propiedad SERPAPI_KEY**, el script seguirá consultando Aviasales/Travelpayouts. Ese servicio no cubre necesariamente todos los vuelos ni todas las fechas y puede no devolver ciertas aerolíneas. **No estamos haciendo scraping directo de Google Flights.**

**Con SERPAPI_KEY**, Google Apps Script ejecuta la búsqueda bajo demanda a través de SerpApi, que proporciona datos estructurados extraídos de Google Flights. Los datos de ruta y fechas van desde el formulario a Apps Script, con tokens privados en sus propiedades. Se transfieren también adultos y niños; el precio resultante del proveedor se trata como total del grupo si se indica `priceBasis=party`. Para viajes de ida y vuelta, el programa selecciona hasta **3 opciones de ida** y hasta **5 de regreso** de cada una, por lo que **no copia la totalidad de vuelos de Google Flights**. Una búsqueda de ida y vuelta puede consumir hasta **4 llamadas a SerpApi**, más que una búsqueda de solo ida.

Antes de usar comercialmente una fuente externa, revisar derechos de reutilización, condiciones de servicio y cuotas. Los precios pueden cambiar, no son reservas aéreas ni autorizan cobros sin emisión verificada.

## Activación en Google Apps Script

1. Abre el proyecto existente **LATAM Flights API**.
2. Sustituye TODO el contenido de `Código.gs` por `integraciones/vuelos/Code.gs` de la rama principal en GitHub.
3. Sustituye TODO el contenido de `FlightRequest.html` por `integraciones/vuelos/FlightRequest.html` de esa rama. **Son dos archivos distintos**.
4. Conserva las propiedades privadas `TP_API_TOKEN` y `FLIGHT_REQUEST_SHEET_ID`. Para activar Google Flights por demanda, añade `SERPAPI_KEY` (privada, no incluir en GitHub). No es necesaria para probar el formulario.
5. Implementar → Gestionar implementaciones → Editar → **Nueva versión** → Implementar. Conserva tu URL `/exec`.
6. Prueba la URL de solicitud con `mode=request&origin=LIM&destination=MDE&trip=roundtrip&departure=2027-02-10&returnDate=2027-02-18&adults=2&children=0&observedPrice=250`, cambiando las fechas por unas futuras válidas.
7. Comprueba que se vea **LIM → MDE** y **dos formularios** de pasajeros, que el envío de datos ficticios se registre correctamente en la hoja privada y que genere el código interno de solicitud.

**No actives todavía el modal público** sin probar recepción de solicitudes, revisar políticas de datos y configurar la implementación. El archivo público `assets/js/vuelos-config.js` conserva el interruptor `LATAM_FLIGHTS_REQUESTS_ENABLED = false`. Cuando termines las pruebas, cambiaremos a `true` desde GitHub. El botón Reservar ya está preparado y no requiere otro desarrollo.

## Limitaciones a mantener claras

No ofrecer un billete aéreo ni una reserva confirmada antes de la emisión. La interfaz ya no expone detalles de implementación técnica, pero conserva un aviso discreto de confirmación del precio antes del pago. El comprobante no se presenta como PNR, e-ticket ni boarding pass. No se integra aún PayPal con vuelos.
