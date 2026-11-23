# Corrección registro Black Friday 2026 · solicitud sin respuesta

## Diagnóstico
En la landing, el formulario anterior enviaba un POST a una ventana oculta
(iframe) de Google Apps Script, y después esperaba recibir un `postMessage`
con `event.source === iframe.contentWindow`. Google Apps Script sirve
`HtmlService` mediante iframes sandbox, lo cual puede evitar que el mensaje
del iframe anidado llegue al navegador. Cuando no llegaba el acuse se mostraba
el error de 45 segundos, aun cuando el servidor hubiera ejecutado la solicitud.

**El mensaje por sí solo no confirma que MailApp haya enviado un código.**
En Apps Script → Ejecuciones se puede revisar la invocación `doPost` y los
errores del servicio de correo.

## Corrección técnica

- Datos de nombre, correo y WhatsApp: únicamente `POST` con
  `application/x-www-form-urlencoded` usando `fetch` `mode:'no-cors'`.
- El navegador genera un identificador de solicitud de 128 bits con
  `crypto.getRandomValues`.
- Apps Script guarda un acuse efímero, por hasta 180 segundos, en
  `CacheService`. En caso de error devuelve un mensaje público seguro.
- El navegador consulta el resultado a través de `GET` JSONP:
  `?action=bf_claim_status&requestKey=...&callback=...`.
- Este GET **nunca lleva correo, teléfono, nombre ni OTP**. El identificador
  es aleatorio e impredecible.
- Se conserva la entrega automática después de validar el correo y se añade
  diagnóstico administrativo de cuotas y disponibilidad.

## Activación — en este orden

1. En el proyecto **LATAM – Reservas y Pagos** de Apps Script, actualizar:
   - `Codigo.gs` con `backend/Codigo.gs` de esta rama.
   - `BlackFridayLeads.gs` con `backend/BlackFridayLeads.gs` de esta rama.
   - `CuponesBlackFriday.gs` no requiere cambios.
2. Guardar, seleccionar la función pública **`diagnosticoBlackFridayRegistro`**,
   ejecutar y revisar Registro de ejecución. Debería indicar
   `backendAcuseActivo:true`, `cuotaCorreoRestante` mayor que cero y
   `cuponesDisponibles` mayor que cero. Si solicita permisos, autorizarlos.
3. **Implementar → Gestionar implementaciones → Editar → Nueva versión →
   Implementar**. No generar un endpoint nuevo.
4. Abrir el URL del Apps Script actual con `?action=health`.
   Debe incluir `blackFridayAckReady:true`.
5. Fusionar el PR en GitHub. El HTML usa una versión nueva del JS para
   invalidar cachés antiguas.
6. Probar con un correo propio. Verificar en Apps Script → **Ejecuciones**
   que `doPost` se completó y, en Google Sheets, la pestaña
   `Registros BF 2026`.
7. Si el estado marca enviado y el email no llega, revisar cuota de MailApp,
   autorizaciones, spam y políticas del correo de destino. El éxito de
   `MailApp.sendEmail` no garantiza entrega en la bandeja de entrada.

## Verificaciones

- Sintaxis de los tres archivos modificados: correcta.
- Pruebas aisladas: `bf_claim_status` responde `pending` antes del POST
  y el resultado guardado después; bloquea claves con formato inválido.
- No se modificaron cálculos de descuento, cupones, PayPal ni tarifas.
- **Pendiente:** prueba real con navegador y Apps Script desplegado.
