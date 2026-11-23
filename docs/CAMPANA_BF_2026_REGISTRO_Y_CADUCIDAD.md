# Black Friday 2026 · activar campaña con registro y cuenta regresiva

## Alcance de los cambios

- Se mantienen los 10 códigos privados existentes. Se generan **40 códigos nuevos**
  para registros de campaña: **50 en total**, sin repetir códigos ni publicar su texto
  en el repositorio.
- Los 40 nuevos se asocian al **correo verificado**. El cliente registra nombre,
  apellido, WhatsApp y correo, acepta la política de privacidad y recibe un OTP
  de seis dígitos válido durante 10 minutos. El consentimiento comercial es opcional.
- Cada correo verificado recibe un solo cupón, incluso si vuelve a solicitarlo.
  Este registro promocional NO crea una cuenta con contraseña en LATAM Rewards.
- La primera vez que el cliente pulsa **Aplicar**, el backend guarda
  `Activado el` y `Caduca el` en `Cupones BF 2026`.
  El vencimiento es el menor de *5 horas desde primera aplicación* y
  *29 de noviembre de 2026, 23:59:59 (hora Perú)*.
- La cuenta regresiva muestra el tiempo absoluto del servidor y no se reinicia
  al cambiar de página, navegador o fecha de salida.
- El descuento sigue siendo **10, 20, 30, 40 o 50%** según anticipación, o
  el porcentaje administrativo excepcional que se configure.
  Solamente afecta al precio elegible del tour, no los vuelos ni mejoras hoteleras.
- El código se consume después de un **pago PayPal capturado**; durante la
  preparación del pago se mantiene reservado temporalmente. No se consumen
  códigos al solicitarlos ni al aplicar el descuento.

## Paso 1 · Actualizar Google Apps Script ANTES del frontend

En **LATAM – Reservas y Pagos**, el mismo proyecto Apps Script que usa la web:

1. Reemplazar `Codigo.gs` con el contenido completo de `backend/Codigo.gs`.
2. Reemplazar `CuponesBlackFriday.gs` con
   `backend/CuponesBlackFriday.gs`.
3. Crear un tercer archivo nuevo `BlackFridayLeads.gs` con
   `backend/BlackFridayLeads.gs`.
4. Guardar los tres y ejecutar desde el selector **`prepararCampanaBlackFriday`**.
   El registro debe devolver `{"ok":true,"codigosOriginales":10,"nuevos":40,"total":50}`.
   Es seguro ejecutarla nuevamente, pues solo añade los códigos pendientes.
5. Ejecutar también **`pruebaCuponesBlackFriday`** para verificar las diez
   huellas originales y los porcentajes. La prueba no consume códigos.
6. **Implementar → Gestionar implementaciones → Editar → Nueva versión →
   Implementar**, manteniendo la URL /exec actualmente utilizada en catalog.json.
7. Comprobar `/exec?action=health`: debe incluir
   `"blackFridayCouponsReady":true` y `"blackFridayLeadReady":true`.

**Nunca** insertar el archivo entero al final del otro sin comprobar duplicados
de `const` o funciones. Cada archivo .gs es independiente dentro del proyecto.

## Paso 2 · Publicar la página web

Una vez desplegada y verificada la nueva versión de Apps Script, integrar el
Pull Request de la rama `feature/black-friday-2026-claim-5h` a `main`.
El enlace para campañas será:

`https://latamexpeditions.com/black-friday.html`

La página usa el mismo endpoint de `assets/data/catalog.json`. No necesita
una URL distinta de Apps Script. No agregar códigos secretos a ese catálogo.

## Paso 3 · Prueba sin pagar

1. Visitar `black-friday.html` y registrar un correo propio con nombre y WhatsApp.
2. Comprobar el correo OTP y escribir los seis dígitos. Debe aparecer un código
   nuevo `BF26-...` y quedar asociado en Google Sheets.
3. Entrar a un paquete con tarifa online habilitada, seleccionar fecha y pegar
   el código. El badge debe indicar **Descuento del X% aplicado**,
   debajo `Cupón caduca en 04:59:59` y fuera del badge
   `(No aplica para vuelos y extras)`.
4. Cerrar la ficha, esperar un minuto, volver y aplicar de nuevo el MISMO código.
   Debe mostrar **menos tiempo** del original.
5. Probar el formulario de reserva con un correo diferente al de registro:
   debe **rechazarse al crear la orden**, sin cobrar fondos.
6. Confirmar que el precio mostrado y el calculado por Google Apps Script
   coinciden en el tipo de habitación y que vuelos y mejoras se excluyen.
7. **No** hacer pagos reales sin validar antes PayPal y la confirmación de
   proveedor; las fichas con cotización manual siguen sin pago habilitado.

## Administración y seguridad

Las hojas `Cupones BF 2026` y `Registros BF 2026` deben permanecer privadas.
El texto de los 40 códigos nuevos existe solo en la columna **Código privado**
de la primera hoja. Los 10 originales mantienen solo su hash y uso manual.

Los correos se envían con `MailApp`. Deben comprobarse cuotas y permisos del
proyecto. Hay límites de reenvío por correo y un tope diario de verificaciones;
si la cuota se agota, no se debe afirmar que el código ha sido enviado.

La campaña vence el 29/11/2026 en hora de Perú. Después no podrá iniciarse
ningún canje nuevo, aunque existan códigos no utilizados.
