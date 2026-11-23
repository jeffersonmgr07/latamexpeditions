# Black Friday 2026 · verificación inmediata y correos HTML

## Problema corregido
El código OTP llegaba por correo, pero la landing esperaba la confirmación del POST
mediante `bf_claim_status` antes de mostrar el campo de verificación.
Si el acuse no llegaba, el usuario veía un aviso de conexión tardía y no podía introducir el código.

## Solución del frontend
- Al pulsar **Solicitar mi cupón** se abre de inmediato el paso de verificación;
  el campo de seis dígitos queda disponible incluso si el acuse demora o se pierde.
- Un reloj de **5 minutos** aparece en la landing; si llega el acuse del backend,
  se ajusta a su marca de caducidad real `expiresAt`.
- Los mensajes de transporte ambiguos no cierran ni ocultan el formulario.
- Botón **Reenviar código** después de 60 segundos o tras el vencimiento,
  sujeto también al límite de envío del servidor.
- Si la verificación se completó pero su acuse falló, el cliente recibe el cupón
  en un segundo correo y puede utilizarlo desde allí. Nunca se confirma
  ficticiamente una solicitud sin respuesta.

## Mejoras del backend
- `LX_BF_OTP_MS` se ajustó a cinco minutos.
- `lxBfLeadStart_` devuelve `expiresAt` para sincronizar el reloj.
- Los mensajes de verificación y de entrega del cupón incluyen `htmlBody`
  con colores de Latam Expeditions, encabezado de marca, código resaltado y
  CTA; mantienen `body` en texto como respaldo para clientes de correo.
- Texto dinámico de cliente escapado contra inyección HTML.
- No se cambió el inventario, distribución, descuentos ni pagos.

## Activación
1. El **frontend** se publica con la fusión del PR en GitHub `main`.
2. En el proyecto real **LATAM – Reservas y Pagos** reemplazar el contenido
   de **`BlackFridayLeads.gs`** por
   `backend/BlackFridayLeads.gs` de `main`.
3. Guardar y publicar una **Nueva versión** en **Gestionar implementaciones**,
   conservando el mismo endpoint `/exec`.
4. Abrir `https://latamexpeditions.com/black-friday.html` sin caché.
5. Probar con un correo propio y comprobar:
   - El campo de verificación se abre de inmediato.
   - El reloj comienza en ~05:00.
   - Llega un correo HTML con código de seis dígitos.
   - El código se acepta y aparece el cupón o llega el correo del cupón.
   - Reenvío y vencimiento funcionan sin generar dos cupones.
6. Evitar compartir públicamente el OTP o los códigos recibidos.

**Pruebas realizadas:** sintaxis de JS y Apps Script, integridad de IDs HTML,
correo HTML/texto, escape de nombres y flujo simulado de inicio/verificación.
**Pendiente:** correo real y prueba integral tras publicar Apps Script.
