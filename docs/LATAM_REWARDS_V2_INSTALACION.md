# LATAM Rewards — instalación y política de puntos (10/11/2026)

## Actualizar el mismo Apps Script de reservas y pagos

Se han editado los archivos:
- mis-viajes.html; assets/js/expedition-dashboard.js; assets/css/expedition-dashboard.css; registro.html.
- backend/ExpeditionDashboard.gs; backend/Codigo.gs; backend/Cuentas.gs.

El código de GitHub NO despliega Apps Script automáticamente.

1. Abre Apps Script del proyecto LATAM – Reservas y Pagos, que ya tiene Code.gs, Cuentas.gs, Formularios.gs, Operaciones.gs y ExpeditionDashboard.gs.
2. Reemplaza únicamente el contenido del ExpeditionDashboard.gs instalado por la versión completa de backend/ExpeditionDashboard.gs de GitHub.
3. En el archivo Code.gs que contiene doPost, busca las rutas que comienzan por dashboardHome, dashboardTrip y dashboardReadNotification, y añade debajo estas seis rutas nuevas (sin duplicarlas):
 
    if (action === 'dashboardSaveProfile') return json(lxRwUpdateProfile_(data));
    if (action === 'dashboardUploadAvatar') return json(lxRwUploadAvatar_(data));
    if (action === 'dashboardGetAvatar') return json(lxRwGetAvatar_(data));
    if (action === 'dashboardRequestEmailChange') return json(lxRwRequestEmailChange_(data));
    if (action === 'dashboardConfirmEmailChange') return json(lxRwConfirmEmailChange_(data));
    if (action === 'dashboardSubmitSocial') return json(lxRwSubmitSocial_(data));

4. En Cuentas.gs, preservar código existente y añadir las dos comprobaciones de lxRwAliasInUse_ en las funciones registrarUsuario y entrarConGoogle, como figuran en backend/Cuentas.gs de GitHub. Impiden que terceros creen una cuenta con un correo que fue reemplazado por otro y se apropien del historial. Comparar antes de reemplazar Cuentas.gs.
5. Guardar todos los archivos y ejecutar desde el selector de funciones instalarExpeditionRewards, que crea las hojas nuevas, sin modificar las reservas existentes.
6. En Implementar > Gestionar implementaciones > Editar > Nueva versión, publicar usando la misma URL /exec y el proyecto que ya gestiona PayPal. No cambies PAYPAL_CLIENT_ID, PAYPAL_SECRET ni SHEET_ID.
7. Para subir fotos, Apps Script solicitará permisos de DriveApp además de Sheets y MailApp. El servidor crea una carpeta privada de avatares y guarda únicamente su ID de archivo en la hoja.

## Hojas adicionales

- Perfiles Expedition: nombre, teléfono, WhatsApp con código de país, documento y archivo privado de foto.
- Cambios de email Expedition: código del correo anterior y del nuevo. Son dos códigos de 6 dígitos con 10 minutos de duración.
- Emails anteriores Expedition: permite conservar reservas y puntos anteriores después de cambiar el correo, sin alterar datos históricos de pago.
- Acciones sociales Rewards: enlace de publicación voluntaria, estado y fecha; sin puntos por compartir.

Siguen existiendo Usuarios, Sesiones, Reservas, Verificaciones Expedition, MillasMovimientos, Notificaciones Expedition, Detalle Operativo, Vuelos, Hoteles y Pasajeros.

## Políticas

Programa LATAM Rewards; unidad puntos. Nivel Explorer: de 0 a 2.999; Gold: de 3.000 a 6.999; Platinum: de 7.000 a 9.999; Diamond: desde 10.000 puntos históricos acreditados. El canje no baja el nivel.
Bono: 100 puntos tras verificar la cuenta. Compras: 1 punto por US$10 pagados por experiencias, paquetes, vuelos y hoteles. Puntos de compras pendientes hasta servicio completado.
Canje directo reservado a experiencias independientes y souvenirs; cupones podrán aplicar a paquetes, vuelos y hoteles. No se habilitan canjes ni sorteos automáticos todavía; experiencia de 500 puntos pendiente de condiciones y costes aprobados.

## Redes sociales

Los botones sociales permiten compartir voluntariamente y enviar enlaces para consideración editorial, pero NO generan puntos por hacerlo. Meta restringe ofrecer recompensas por compartidos personales; Tripadvisor prohíbe las reseñas incentivadas. TikTok requiere transparencia en contenido comercial.

Estados de las publicaciones: EN ESPERA durante 24 horas, EN REVISION después del plazo, APROBADO o RECHAZADO por el equipo. La función revisarPublicacionesComunidadLatam pasa los envíos antiguos a EN REVISION; no verifica mediante APIs ni acredita puntos.

## Pruebas de aceptación

1. Iniciar sesión con cuenta real y ver el nombre, nivel y saldo sin valores simulados.
2. Editar nombre, teléfono, WhatsApp, tipo y número de documento. Revisar Perfiles Expedition.
3. Cambiar foto y confirmar que persiste tras cerrar y abrir sesión, conservándose privada en Drive.
4. Cambiar correo con dos códigos y confirmar que las reservas y puntos siguen asociados a la cuenta nueva.
5. Probar que no se puede registrar con el correo antiguo.
6. Revisar los filtros de reservas, la visualización de viajes, el libro de puntos y el acordeón de LATAM Rewards.
7. Revisar la bandeja de notificaciones y los enlaces compartidos sin acreditación.
8. Comprobar que PayPal y el checkout siguen cobrando los mismos importes en entorno de pruebas.

## Inicio de sesión social

Facebook Login es una integración separada que exige aplicación Meta y permisos; TikTok Login Kit también necesita aplicación y configuración; Instagram no ofrece una ruta equivalente sencilla para cuentas personales. No se inventan botones de login que no tengan autenticación segura implementada.
