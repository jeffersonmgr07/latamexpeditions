# LATAM Expeditions · Prueba PayPal Sandbox sin dinero real
**9 nov 2026 · Estado:** Preparación confirmada en GitHub. **No se ha ejecutado contra las credenciales de tu cuenta**. El cobro Live sigue desactivado en `assets/data/catalog.json`.

## A. Credenciales y propiedades
- Guarda las credenciales Live en un gestor de contraseñas. No las pegues en GitHub ni en chats.
- En PayPal Developer → **Sandbox** → Apps & Credentials, obtén **Sandbox Client ID** y **Sandbox Secret**. Son DISTINTOS de los Live.
- En Apps Script **LATAM – Reservas y Pagos** → Configuración → Propiedades del script, introduce:
  - `PAYPAL_CLIENT_ID`: Client ID **Sandbox**.
  - `PAYPAL_SECRET`: Secret **Sandbox**.
  - `PAYPAL_ENV`: `sandbox`.
  - `SHEET_ID`: el archivo privado de reservas, que permanece igual.
- Comprueba que los archivos `Codigo.gs`, `Cuentas.gs`, `Formularios.gs`, `Operaciones.gs` estén presentes. Añade el nuevo `PruebasPayPal.gs`. En Apps Script cada archivo de un mismo proyecto comparte sus funciones.
- Ejecuta primero `pruebaDeInstalacion()`: espera `OK Credenciales de PayPal (sandbox)`. La propiedad de inicio de sesión de Google puede seguir pendiente.

## B. Crear orden Sandbox
1. Selecciona `pruebaPayPalCrearOrdenSandbox` y pulsa Ejecutar **solo una vez**.
2. En el registro debe aparecer **ORDEN DE PRUEBA SANDBOX CREADA**, con un `ID` y una URL `APPROVAL_URL`.
3. No se ha cobrado nada todavía. El valor es **USD 1.00 de prueba** en el entorno simulado. La función NO crea una reserva ni envía emails.

## C. Aprobar con un comprador ficticio
1. En https://developer.paypal.com/ → Testing Tools → Sandbox Accounts, busca una cuenta **Personal** de prueba. Usa View/Edit Account para conocer su contraseña de Sandbox (no tu contraseña real).
2. Abre `APPROVAL_URL` en un navegador privado (para evitar conflicto con la cuenta PayPal Live).
3. Entra con la cuenta **Personal Sandbox**, NO con la cuenta Business Sandbox que recibe el dinero.
4. Aprueba **USD 1.00**. Si PayPal te devuelve a la web de LATAM, es normal: el parámetro de retorno solo se utiliza para volver al sitio; la captura se hará en el editor.
5. Ejecuta `pruebaPayPalConsultarOrdenSandbox`. Espera estado `APPROVED`.
6. Si sigue `PAYER_ACTION_REQUIRED`, completa la aprobación con el comprador Sandbox. Si aparece `COMPLETED`, consulta antes de intentar capturar otra vez.

## D. Capturar y comprobar
1. Selecciona `pruebaPayPalCapturarOrdenSandbox` y pulsa Ejecutar.
2. Debe registrar **PRUEBA SANDBOX EXITOSA** y la captura debe tener estado `COMPLETED`, importe `1.00`, moneda `USD`.
3. Repite la misma función **una sola vez** para verificar que devuelve `alreadyCaptured: true` sin generar otro cargo.
4. Puedes comprobar la transacción simulada en el panel de la cuenta **Business Sandbox**.

Estas tres funciones prueban **la comunicación REST con PayPal**, pero **no prueban aún el flujo completo del carrito público, guardado de Reservas, email y voucher**.

## E. Prueba completa del flujo del sitio (fase siguiente, antes de Live)
- Mantén `booking.paypalEnabled=false` en el `assets/data/catalog.json` público.
- Prueba el flujo Sandbox en un **entorno de pruebas separado** con una copia de la web, credenciales Sandbox y backend de reservas de Sandbox.
- Selecciona primero un producto base **sin vuelo extra ni hotel alternativo**. El backend rechaza expresamente un pago con esos componentes porque todavía no hay recotización confiable del lado del servidor.
- Al finalizar, comprobar `Ordenes PayPal` (CAPTURADA y capture ID), `Reservas` (una sola fila), `Detalle Operativo`, `Pasajeros`, correos del operador y del comprador, y saldo.
- Probar cancelación, orden aprobada sin captura, recarga de pantalla, doble clic, pérdida de conexión y respuesta de error.
- Para vuelos y hoteles extras: **no habilitar pagos** hasta que el servidor calcule y congele un importe autorizado; el precio observado del navegador nunca debe utilizarse para capturar.

## F. Cuándo pasar a Live
Después de prueba Sandbox REST y prueba de checkout del sitio + Sheets, cambia los tres valores `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_ENV` por los **Live**. Actualiza también el client ID público en el entorno Live. Publica una **nueva versión** del Apps Script; confirma método de pago y alertas antes de activar `booking.paypalEnabled=true`.

## Seguridad y diagnóstico
- No ejecutar manualmente `crearOrden` ni `capturarOrden` sin contexto.
- Si `pruebaPayPalCrearOrdenSandbox` dice «PRUEBA BLOQUEADA», todavía hay `PAYPAL_ENV=live`; nunca cambies solo el nombre del entorno sin cambiar también ambas credenciales.
- Si se creó una orden y se perdió su URL, no repitas Crear; conserva el ID de la propiedad `LX_PAYPAL_TEST_ORDER_ID_V1` y revisa la orden con Consulta. Puedes inspeccionar su enlace de aprobación en el Developer Dashboard.
- El Secret no debe aparecer en mensajes ni capturas de pantalla.
