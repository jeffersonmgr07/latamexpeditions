# LATAM Expeditions · Activación de reservas, Google Sheets y PayPal
Actualizado: 9 de noviembre de 2026.

## Qué está preparado
El repositorio contiene `backend/Codigo.gs`, `backend/Cuentas.gs`, `backend/Formularios.gs` y el nuevo `backend/Operaciones.gs`.

**No equivale a despliegue:** modificar los archivos en GitHub NO cambia el proyecto Apps Script de Google que atiende la URL /exec. Hay que sincronizar código y desplegar NUEVA VERSIÓN.

- `Codigo.gs`: reserva, cálculo oficial de paquete, PayPal Orders v2, validación, hojas principales y correos de operaciones.
- `Operaciones.gs`: hojas de emisión/confirmación manual y consultas de acuse sin exponer datos personales.
- `integraciones/vuelos/Code.gs`: servicio distinto de vuelos/hoteles/SerpApi. Desplegarlo por separado.

## Instrucciones de instalación del backend de reservas
1. Crea o abre una hoja privada de Google Sheets llamada **Reservas LATAM Expeditions**.
2. Copia el ID que aparece entre /d/ y /edit en la URL de Sheets. **No compartas la hoja públicamente**.
3. Abre **Extensiones → Apps Script** desde esa hoja. Mantén en el mismo proyecto los archivos `Codigo.gs`, `Cuentas.gs`, `Formularios.gs` y agrega **`Operaciones.gs`** con el contenido exacto del repositorio.
4. En **Configuración del proyecto → Propiedades del script**, configura:
   - `SHEET_ID`: ID de tu hoja de Google.
   - `NOTIFY_EMAIL`: dirección que recibirá las solicitudes y pagos confirmados (por ejemplo `contact@latamexpeditions.com`).
   - `PAYPAL_CLIENT_ID`: identificador público de la aplicación de PayPal.
   - `PAYPAL_SECRET`: secreto de PayPal, **solo en las propiedades privadas**, nunca en GitHub ni en `catalog.json`.
   - `PAYPAL_ENV`: `sandbox` durante pruebas y `live` únicamente al terminar.
   - `GOOGLE_CLIENT_ID`: solo si ya utilizas el módulo de acceso con Google.
5. Ejecuta en Apps Script la función `pruebaDeInstalacion()` y acepta las autorizaciones pertinentes. Las hojas de operación se crean a la primera solicitud recibida.
6. Selecciona **Implementar → Gestionar implementaciones → Editar → Nueva versión**, tipo **Aplicación web**, ejecutar como tu cuenta y acceso según el endpoint público. Copia la URL `.../exec`.
7. Verifica que `assets/data/catalog.json` use esa URL en `booking.endpoint`.
8. Prueba una solicitud **sin pago real** con 2 adultos y, por separado, con 2 adultos + 1 niño. Confirma que hay correo interno, copia al cliente y filas en las hojas:
   - `Reservas`
   - `Detalle Operativo`
   - `Pasajeros`
   - `Vuelos` (una fila por tramo; si no eligió vuelos no habrá filas)
   - `Hoteles`
   - `Acuses` (sin datos sensibles; para comprobar recepción)
   - `Ordenes PayPal` (cuando se ensayen pagos)
9. Implementa también una **nueva versión independiente** de `integraciones/vuelos/Code.gs` en el proyecto Apps Script que ya tiene `SERPAPI_KEY`, porque la tarifa del hotel de referencia ahora acepta fichas individuales.

## Qué llega al correo de la agencia
Código de reserva; fecha; producto y categoría; cantidad de adultos/niños; nombres y documentos; fecha de nacimiento; contacto; idioma; hotel previsto/elegido; noches y acomodación; suplemento estimado; vuelos ida/regreso con aerolínea, vuelo, aeropuerto y horas de cada segmento; total mostrado y estado pendiente/recibido; IDs PayPal cuando corresponda.

Los precios observados del proveedor no equivalen a emisión. Si no se ha verificado la tarifa del alojamiento incluido, se registra una **solicitud de cotización**, no un cargo de USD 0.

## PayPal — proceso seguro
1. En https://developer.paypal.com/ abre Apps & Credentials y crea una REST App en Sandbox.
2. Guarda su Client ID en `booking.paypalClientId` del catálogo; su Secret únicamente en propiedades de Apps Script.
3. El backend existente implementa `createOrder` y `captureOrder`, pero solo debe aceptar importes que él mismo pueda recalcular con datos confiables.
4. **No habilites todavía el botón PayPal**: los vuelos y cambios de hotel dinámicos no se verifican aún contra inventario servidor; el frontend de pago también requiere un canal compatible con el navegador para comunicarse con Apps Script (por ejemplo un proxy HTTPS con CORS o una pasarela HTML segura por iframe).
5. Implementa un presupuesto firmado/congelado por servidor para cualquier vuelo/hotel añadido. El servidor debe verificar importes, divisa, estado de orden, captura y coincidencia de la solicitud; aplicar idempotencia.
6. Prueba pagos Sandbox: éxito, cancelación, rechazo, doble clic, desconexión al capturar, consulta de orden pagada, pedido con vuelos/hotel y pedido con suplementos pendientes.
7. Solo entonces habilita PayPal en el frontend y repite en Live. Mantén el estado del alojamiento y de los billetes como **pendiente de confirmación o emisión** hasta que se complete manualmente.

## Protección de datos
- Los nombres, documentos y fechas de nacimiento son datos personales: acceso solo a operadores autorizados, credenciales privadas, permisos mínimos y política de conservación.
- Nunca subir archivos Excel/CSV con pasajeros a un repositorio público; nunca incluir Secret ni SERPAPI_KEY en la web.
- La pantalla de búsqueda de reservas y el endpoint de estado solo deben devolver información no sensible a personas sin autenticación.
- Evitar registrar el cuerpo completo de formularios en logs de errores.
