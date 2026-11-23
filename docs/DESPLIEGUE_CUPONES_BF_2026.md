# Activación de cupones Black Friday 2026 · LATAM Expeditions

Esta rama prepara la integración. **No mezclar frontend nuevo con Apps Script antiguo**:
los cupones deben validarse en el servidor antes de activar el formulario público.

## Publicación segura

1. Abrir el proyecto de Google Apps Script conectado con la hoja de reservas real.
2. Actualizar el contenido de `Codigo.gs` desde `backend/Codigo.gs`.
3. Agregar al mismo proyecto el nuevo archivo `CuponesBlackFriday.gs`
   desde `backend/CuponesBlackFriday.gs`. No introducir códigos en archivos públicos.
4. Guardar y **Gestionar implementaciones → Editar → Nueva versión → Implementar**.
   Mantener la URL `/exec` ya configurada en `assets/data/catalog.json`.
5. Probar, con un código privado y un paquete que permita pago online, que el
   servidor devuelva el descuento y que el total excluya vuelos y suplementos.
6. Verificar en Google Sheets la pestaña privada `Cupones BF 2026`:
   `DISPONIBLE` → `RESERVADO` (iniciar orden PayPal) → `USADO`
   (captura confirmada). Una reserva sin pago no consume el código.
7. Solo después de actualizar el backend, fusionar esta rama con `main`
   y verificar en la web la compra real de prueba.

## Administración

- Cada código puede canjearse en **una compra pagada** (la compra puede incluir
  varios pasajeros). Los códigos originales se entregan exclusivamente al operador.
- El servidor usa huellas SHA-256; el repositorio público no incluye códigos originales.
- Los cupones se vencen automáticamente al finalizar la campaña.
- Para una excepción, desde el editor de Apps Script ejecutar una función privada
  que llame `lxBfPorcentajeFijoAdministrativo_(codigoPrivado, porcentaje)`.
  Pasar `null` como porcentaje devuelve la modalidad automática.
- Para bloquear manualmente un cupón, localizar su hash en la hoja privada y
  cambiar su estado a `BLOQUEADO`.
- Las páginas de cotización manual (por ejemplo Atacama Premium) **no deben
  presentarse como compras pagadas** hasta que sus tarifas y disponibilidad
  estén habilitadas en el servidor. La solicitud no consume códigos.

## Comprobaciones importantes

- Un cupón reutilizado debe rechazarse.
- Un cupón aplicado a otra orden pendiente debe quedar bloqueado temporalmente.
- Al abandonar un pago, el bloqueo caduca y puede solicitarse otra reserva.
- La cotización del navegador jamás autoriza el monto del pago.
- Validar todas las reglas con fecha de Lima (`America/Lima`).
