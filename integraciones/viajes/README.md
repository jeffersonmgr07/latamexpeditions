# Latam Expeditions — Paquetes personalizables (MVP)

## Alcance listo en GitHub

- Nueva página [arma-tu-viaje.html](../../arma-tu-viaje.html) con cinco pasos: paquete/fechas, vuelos, categoría de hotel, actividades adicionales, resumen y datos de pasajeros.
- Paquete piloto **Medellín Esencial 4D/3N**; catálogo de tarifas por ocupación y tres categorías de hotel en [paquetes-configurables.json](../../assets/data/paquetes-configurables.json).
- Fecha de salida del alojamiento = fecha de llegada + **3 noches**. El pasajero puede elegir salida del vuelo un día antes para llegar en fecha.
- Origen sugerido a partir de `latam_country` (preferencia que ya usa la web); el usuario siempre puede corregirlo.
- SerpApi Google Flights: se usan **combinaciones reales de ida+vuelta de la API**, no sumas inventadas de dos búsquedas solo ida. El backend existente consulta un máximo de tres vuelos de ida y cinco opciones de regreso por cada uno para limitar consumo del cupo.
- Hotel previsto o similar: usa las **tarifas ya publicadas en la ficha Medellín Esencial** (3★, 4★ y 5★ con precios simple/doble/triple/familiar). Niños: tarifa referencial 70% de la adulta según el catálogo.
- Google Hotels: comparación **opcional** de otros establecimientos, con nombre, calificación, fotografía y tarifa de referencia si está disponible. Seleccionar un hotel externo crea solicitud de sustitución: **no se suma automáticamente su precio bruto al paquete** porque el paquete ya incluye hotel.
- Actividades adicionales: Parapente (US$99) y tour nocturno (US$49), precios del catálogo propio; **Comuna 13, City Tour y Guatapé se mantienen incluidos** y no se cobran dos veces.
- Subtotal indicativo calculado, sin checkout activo ni afirmaciones de reserva. Para niños en actividades adicionales los suplementos se cotizan aparte.
- Solicitud privada en Google Apps Script: captura contacto, pasajeros, documentos y preferencias de equipaje vía HtmlService + `google.script.run` y crea código `LXP-`. Hoja privada; el código **no es PNR ni boleto**. Comprobante interno imprimible.
- La portada preserva la fecha exacta y ciudad de salida; en el catálogo elige Medellín y conserva parámetros hasta el configurador.

## IMPORTANTE: activar Google Apps Script

**La web nueva puede verse en GitHub Pages, pero las consultas Google Hotels y el formulario privado requieren desplegar el backend actualizado.** GitHub Pages no puede desplegar Google Apps Script por sí solo.

1. Abre tu proyecto existente **LATAM Flights API** en https://script.google.com/.
2. Abre `integraciones/vuelos/Code.gs` desde este repositorio y reemplaza el `Code.gs` de Apps Script con su versión completa (conserva todas las propiedades privadas).
3. Agrega archivo **HTML** denominado exactamente `TripRequest` y pega el contenido de `integraciones/vuelos/TripRequest.html`.
4. Confirma que **SERPAPI_KEY** está configurada en Propiedades de secuencia de comandos. Nunca publiques esa clave en GitHub, HTML ni JavaScript.
5. En el editor, selecciona **initTripRequestsSheet** y ejecútala **una sola vez**. Autoriza los permisos necesarios. La función creará la hoja privada y guardará **TRIP_REQUEST_SHEET_ID** en Script Properties.
6. Opcionalmente, establece **TRIP_REQUEST_NOTIFY_EMAIL=contact@latamexpeditions.com** si esa cuenta ya recibe correos.
7. Haz clic en **Implementar → Gestionar implementaciones → Editar → Nueva versión → Implementar**, manteniendo «Ejecutar como yo» y el acceso público del endpoint. **No necesitas cambiar la URL /exec si modificas la implementación existente.**
8. Abre el sitio con incógnito; prueba fechas futuras, vuelos, hoteles y el envío final.
9. En la hoja privada verifica que el registro incluye el código interno y el JSON de pasajeros. **No compartas la hoja públicamente** y configura acceso mínimo, política de privacidad y retención de documentos.

### Archivos relevantes

| Archivo | Función |
|---|---|
| `arma-tu-viaje.html` | Pantallas del configurador |
| `assets/js/armar-viaje.js` | Navegación, validaciones, vuelos, hoteles, precios |
| `assets/css/armar-viaje.css` | Estilo PC y móvil |
| `assets/data/paquetes-configurables.json` | Tarifas y experiencias del paquete piloto |
| `assets/js/catalog-search-bridge.js` | Búsqueda desde la portada y enlaces contextualizados |
| `integraciones/vuelos/Code.gs` | API de vuelos existente + Google Hotels + solicitudes privadas |
| `integraciones/vuelos/TripRequest.html` | Datos privados y comprobante de solicitud |

## Pruebas propuestas

- Llegada futura (mínimo 2 días) para 2 adultos y retorno automático +3 noches.
- Cambiar origen Lima/Bogotá/Buenos Aires.
- Seleccionar vuelo de ida y luego regreso, comprobar que el precio mostrado es **la pareja completa** para todo el grupo.
- Continuar sin vuelos y verificar subtotal sin vuelos.
- Ver los tres hoteles 3★/4★/5★ y sus precios según la ocupación.
- Consultar Google Hotels; si no existen tarifas, se puede continuar con categoría incluida.
- Agregar y quitar Parapente y tour nocturno; no mostrar Comuna 13/Guatapé como extras.
- Cambiar huéspedes y confirmar que se recalculen correctamente los subtotales.
- Completar datos de pasajeros, seleccionar preferencias de equipaje y registrar la solicitud.
- Confirmar código LXP y guardar/imprimir el comprobante.
- Verificar que **PayPal no cobra nada** en este MVP; la disponibilidad debe comprobarse con proveedores antes de ofrecer un cobro.

## Limitaciones deliberadas

- Google Flights y Google Hotels **no emiten ni reservan** automáticamente. Los precios son observados/informativos y pueden variar.
- La búsqueda aérea muestra una selección de combinaciones para preservar cuota SerpApi, no todo el inventario de la industria.
- El precio de un hotel externo no puede restarse automáticamente de la tarifa del paquete incluido sin una tarifa contractual de proveedor.
- Para viajes familiares con niños, confirmar edades y condiciones hoteleras antes de emitir una cotización definitiva. La comparación hotelera no introduce edades ficticias.
- Los pagos PayPal, descuentos/cupones, saldos cashback y emisión de boletos deben activarse cuando se disponga de validación de precios, disponibilidad y condiciones de reserva.
- El configurador puede ampliarse a otros paquetes añadiendo configuración, itinerarios y reglas de precio en un segundo desarrollo.
