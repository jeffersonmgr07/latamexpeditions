# LATAM Expeditions — preparación para PayPal (2026-11-09)

## Estado real
El frontend contiene el SDK y las llamadas `createOrder` / `captureOrder` en `assets/js/booking.js`. Actualmente `onlineConfigured()` devuelve `false` expresamente: no activar pagos sin backend transaccional. La reserva por correo continúa operativa.

## Importe de reserva
El cálculo visible suma:
- Adultos × tarifa por adulto de la categoría/ocupación.
- Niños × tarifa infantil.
- Vuelo seleccionado (`displayedPrice` como total de los viajeros).
- Suplemento de alojamiento alternativo, si existe (`hotelSupplement` por estancia/grupo).

No duplicar el vuelo por pasajero. Todas las partidas deben estar normalizadas a USD y a dos decimales. `quotedTotal` y `quotedDue` enviados por el navegador son informativos y NO son autoridad para cobrar.

## Requisitos del backend (Google Apps Script u otro servidor seguro)
1. `createOrder` recibe la configuración de la reserva, valida campos, fecha, cupos y precio y crea una cotización congelada, con ID único y caducidad.
2. El servidor reconstruye o valida la cotización con tarifas propias de paquete, reglas de niños, hotel base, suplementos y vuelos; no acepta ciegamente montos del navegador.
3. El servidor usa las credenciales privadas de PayPal fuera de GitHub, crea la orden usando Payments Orders API v2, `intent=CAPTURE`, `currency_code=USD` y un ID idempotente. Devuelve solo `orderId`.
4. `captureOrder` verifica que la orden corresponde a la cotización congelada, hace la captura mediante el servidor y comprueba estado `COMPLETED`, importe exacto, divisa, beneficiario y captura no duplicada.
5. Guardar reserva y captura idempotentemente (clave de solicitud, order ID, capture ID, importe, divisa, estado y fechas). Conciliar webhooks verificados y permitir comprobar estados inciertos para no duplicar cargos.
6. Solo confirmar `paid` después de la captura verificada. Emitir comprobante y aviso al operador. La emisión de vuelos y confirmación de hoteles siguen siendo manuales.
7. Para proveedores sujetos a disponibilidad, definir una política pública clara de cobro, confirmación posterior, sustituciones y reembolsos antes de activar el botón.

## Requisitos faltantes para activar
- PayPal REST app Client ID público y Secret **solo del lado servidor**.
- Endpoint backend con `createOrder`, `captureOrder` e idempotencia.
- Pruebas Sandbox: aprobación, cancelación, rechazo, doble clic, red interrumpida, captura duplicada y hotel/vuelo seleccionado.
- Actualmente el código bloquea online también cuando se incluyen vuelos u hotel alternativo. Se debe retirar ese bloqueo solo después de implementar cotización congelada y verificación del importe en backend.

## Tarifa comparable del hotel
El selector hotelero busca primero la tarifa presupuestada `hotelBudgetPerNight` en la categoría activa (`data-book-tiers` de la ficha; USD **por habitación y noche**, para la ocupación considerada). Si no está configurada, intenta usar una tarifa consultada con nombre exactamente igual al hotel incluido en la categoría. Si no hay ninguna referencia comprobable, bloquea el cambio para evitar diferencias ficticias.

La configuración de tarifas base debe venir del inventario interno y ser consistente con fechas, número de habitaciones y viajeros. No introducir una cifra ilustrativa como precio real.
