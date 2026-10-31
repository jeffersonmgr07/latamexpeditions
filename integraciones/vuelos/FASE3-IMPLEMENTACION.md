# LATAM EXPEDITIONS | Vuelos, cotizaciones y solicitudes (fase 3)

## Estado de la implementación

Este desarrollo incorpora cálculo de precio ORIENTATIVO, un modal de pasajeros alojado en Google Apps Script, una constancia interna de solicitud y búsqueda bajo demanda opcional mediante SerpApi (Google Flights). NO hay reserva aérea, PNR, e-ticket ni pagos automáticos.

IMPORTANTE: el formulario de pasajeros está DESACTIVADO por defecto hasta que se configure y pruebe el almacenamiento privado en Apps Script y se complete una revisión de privacidad y seguridad.

## Precios de referencia

Días hasta la salida | ajuste ilustrativo:
- 0 y 1: sin solicitudes; se requiere desde pasado mañana para evitar accidentalmente salidas a menos de 24 horas cuando no sabemos el horario de salida
- 2 a 44: +10%
- 45 a 60: +5%
- 61 a 90: 0%
- 91 a 180: -5%
- 181 a 270: -10%
- 271 a 365: -15%

Los descuentos son sugerencias NO vinculantes, NO hay financiación garantizada de esos descuentos, ni garantía de precio. Un boleto no se considera vendido ni reservado por mostrar esta cotización. Precio por ADULTO únicamente. Los precios de niños, tasas y condiciones deben confirmarse antes de cobrar.

## 1. OPCIONAL: búsqueda de Google Flights bajo demanda

La mini API de Google Apps Script incluye un adaptador a SerpApi; no hace scraping directo de Google Flights. Debe revisarse que el proveedor permita el uso comercial y que la cobertura, presupuesto y uso de los datos encajen con tu negocio.

Abre https://serpapi.com/google-flights-api y crea una clave de API. Luego en Apps Script > Configuración del proyecto > Propiedades del script añade SERPAPI_KEY, cuyo valor será tu clave privada.

No compartas esa clave ni la guardes en GitHub.

La búsqueda de ida y vuelta consume hasta 3 llamadas por búsqueda inicial (1 para ida y hasta 2 para consultar regresos seleccionados). El código incorpora caché de 10 minutos para reducir consultas repetidas. Si no configuras SERPAPI_KEY, se mantiene Aviasales Data API, que tiene cobertura mucho menor y datos en caché.

## 2. Actualiza Google Apps Script

En el proyecto LATAM Flights API existente:
1. Reemplaza el contenido de Código.gs por el nuevo archivo integraciones/vuelos/Code.gs de este GitHub.
2. Crea un archivo HTML nuevo con el nombre EXACTO FlightRequest.
3. Copia su contenido desde integraciones/vuelos/FlightRequest.html de GitHub y guarda.
4. Ejecuta desde el editor la función initFlightRequestsSheet para crear una hoja privada en Google Drive.
5. Autoriza permisos. Verifica que la hoja Latam Expeditions - Solicitudes de vuelos se haya creado y NO esté compartida públicamente.
6. Revisa en Propiedades del script que existe FLIGHT_REQUEST_SHEET_ID; se configura automáticamente al ejecutar la función.
7. Opcionalmente agrega FLIGHT_REQUEST_NOTIFY_EMAIL para notificar nuevas solicitudes por email SIN documentos personales.
8. Ve a Implementar > Gestionar implementaciones > Editar > Nueva versión > Implementar. Conserva la URL pública actual terminada en /exec.

## 3. Prueba el formulario antes de activarlo

Abre la URL de tu despliegue Apps Script agregando estos parámetros:
?mode=request&origin=LIM&destination=MDE&trip=oneway&departure=2027-02-15&adults=1&children=0&observedPrice=300

Cambia la fecha a una futura válida. Envía únicamente DATOS DE PRUEBA FICTICIOS. Verifica que aparezca un comprobante con código LXQ-... y que exista una fila en la hoja privada.

NOTA: el código LXQ es un código INTERNO DE SOLICITUD, nunca un PNR de aerolínea. El comprobante indica explícitamente que NO se ha reservado ni emitido ningún billete.

Antes de activar el formulario: verifica aviso de privacidad, control de acceso a documentos, políticas de conservación/eliminación, seguridad de la web y necesidad de consentimiento.

## 4. Activación controlada

En GitHub edita assets/js/vuelos-config.js y cambia solo:
window.LATAM_FLIGHTS_REQUESTS_ENABLED = false;
por:
window.LATAM_FLIGHTS_REQUESTS_ENABLED = true;

La URL pública de Apps Script se mantiene donde ya está. No pongas el token en JS público.

## 5. Compra y emisión manual — proceso posterior

La cotización inicial no autoriza a cobrar por un vuelo inexistente. Procedimiento recomendado:

1. Recibir solicitud; validar datos y permisos.
2. Verificar el vuelo y la disponibilidad reales en un proveedor autorizado para emisión.
3. Confirmar al pasajero precio total actualizado, equipaje, escalas, condiciones y plazo de pago.
4. Procesar el pago autorizado por el cliente, usando PayPal solo cuando se pueda emitir.
5. Emitir cuanto antes; obtener PNR y número de e-ticket VERDADEROS, y enviarlos.
6. Solo entonces anunciar al cliente que puede gestionar el vuelo en el sitio de la aerolínea. La tarjeta de embarque se obtiene mediante check-in, según la política específica de la aerolínea.

No destinar pagos anticipados de pasajeros a inversiones que puedan poner en riesgo la emisión. Las reglas de descuento por fechas son propuestas comerciales, no utilidades garantizadas.

## Ficheros de esta fase

- vuelos.html — modal en la web.
- assets/js/vuelos.js — cálculo de tarifas no vinculantes y detalle por tramos.
- assets/js/vuelos-solicitudes.js — comportamiento del modal.
- assets/css/vuelos.css — diseño.
- assets/js/vuelos-config.js — URL pública y llave de activación del formulario (sin tokens).
- integraciones/vuelos/Code.gs — consultas, almacenamiento privado y avisos.
- integraciones/vuelos/FlightRequest.html — formulario privado y comprobante interno.

## Pruebas y límites

- Actualmente no hay pago PayPal activado en el módulo de vuelos ni emisión automatizada.
- No se hace scraping propio de Google Flights ni se bypassan barreras antibot. SerpApi es el adaptador opcional; otro backend con permisos puede sustituirlo en el futuro.
- La integración en Google Apps Script NO se actualiza solo por hacer merge en GitHub. Hay que copiar el Code.gs actualizado y el nuevo archivo HTML, e implementar una nueva versión.
- No prometer boarding pass 48 horas antes ni disponibilidad en sitio de aerolínea 30 días antes: dependen de emisión y reglas particulares.
- Google Flights/SerpApi presenta precios indicativos que pueden cambiar, y la búsqueda no constituye inventario bloqueado.
