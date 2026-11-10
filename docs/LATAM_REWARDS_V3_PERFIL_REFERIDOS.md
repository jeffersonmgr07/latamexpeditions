# LATAM Rewards — perfil, catálogo e invitaciones (noviembre de 2026)

## Cambios visuales en GitHub Pages

- Foto: pulsa la fotografía del perfil o del menú lateral para abrir un modal y reemplazarla. No aparece un recuadro de fotografía en la página de perfil.
- Datos: nombre, correo, tipo y número de documento, fecha de nacimiento (AAAA-MM-DD), acceso y WhatsApp. Se elimina el teléfono adicional.
- Selectores de documento y código WhatsApp: listas propias con búsqueda y banderas, sin usar el desplegable nativo del navegador.
- Cuentas con contraseña: cambio de contraseña validando la actual. Al actualizarla, se revocan las sesiones y el cliente inicia sesión de nuevo. Las cuentas Google sin contraseña local gestionan su contraseña en Google.
- El botón Cerrar sesión permanece al final del menú lateral y en el menú de usuario superior. Ya no se repite en el perfil.
- Cabecera global: nombre de pila del usuario cuando hay sesión; al desplegarse aparecen Mi cuenta, Consultar reserva y Cerrar sesión. En móvil se accede desde el menú.
- Recompensas: niveles Explorer, Gold, Platinum y Signature, y ocho propuestas de experiencias de 500 a 650 puntos.
- Las experiencias disponen de "Consultar canje" por WhatsApp: se confirma disponibilidad antes de solicitar el canje. No descuenta puntos automáticamente.

## Actualización obligatoria del proyecto Apps Script existente

Trabajar en **LATAM – Reservas y Pagos**, el mismo proyecto con PayPal y las cuentas activas.

1. Hacer una copia de seguridad o versión del proyecto existente.
2. Sustituir el archivo **ExpeditionDashboard.gs** por la versión completa de [backend/ExpeditionDashboard.gs](../backend/ExpeditionDashboard.gs), previa comparación con cualquier cambio reciente en el proyecto en vivo.
3. Crear un nuevo archivo Apps Script llamado **LatamReferidos.gs** y copiar [backend/LatamReferidos.gs](../backend/LatamReferidos.gs).
4. En **Code.gs**, junto a los endpoints dashboardHome/dashboardSaveProfile, añadir UNA línea (sin duplicarla):

    if (action === 'dashboardChangePassword') return json(lxRwChangePassword_(data));

5. En **Cuentas.gs**, incorporar las dos llamadas a lxRefTrackSignup_ del [backend/Cuentas.gs](../backend/Cuentas.gs):
   - En registrarUsuario, tras guardar el usuario, capturar data.ref si existe y es válido.
   - En entrarConGoogle, solo en cuentas Google recién creadas, capturar data.ref tras liberar el lock.
   No eliminar las validaciones lxRwAliasInUse_ ni reemplazar funciones PayPal.
6. Ejecutar **instalarExpeditionRewards** desde el selector del editor. Se añaden encabezados a Perfiles Expedition y se crean las dos nuevas hojas de referidos si no existen.
7. Implementar > Gestionar implementaciones > Editar > Nueva versión > Implementar. Mantener la misma URL web /exec, la configuración de PayPal y SHEET_ID.

## Hojas y almacenamiento

- Perfiles Expedition: agrega Fecha nacimiento y WhatsApp país ISO sin modificar la posición de las columnas anteriores (incluida foto privada).
- Códigos referidos LATAM: un código personal por cliente.
- Referidos LATAM Rewards: código usado, patrocinador, invitado, fecha, estado y acreditación.
- MillasMovimientos: los nuevos puntos por referidos se registran como tipo REFERIDO, una sola vez por amigo.

## Programa de invitaciones y verificación

- El cliente obtiene un enlace único a registro.html?ref=LEX...
- Puede compartirlo mediante Facebook, X, WhatsApp, o usar el sistema de compartir nativo en dispositivos compatibles. En Instagram, TikTok y YouTube se copia el texto + enlace y se abre la aplicación, según lo que permita el navegador.
- El texto de invitación se muestra listo para copiar, pero el contenido privado no se publica sin acción expresa del usuario.
- La plataforma **no puede obtener automáticamente la URL de cada post creado por el usuario en redes de terceros** ni garantizar su permanencia después de 10–12 horas sin aplicaciones registradas, OAuth específico y permisos de las plataformas. Tampoco se asignan puntos por publicaciones, compartidos o reseñas incentivadas.
- **100 puntos** al patrocinador por cada amigo que llegue por su enlace, se verifique y complete su primera compra pagada, con un máximo de **4 bonificaciones por mes**.
- Se excluyen las autorreferencias por la misma dirección de cuenta y se registran identificadores únicos para impedir acreditaciones repetidas. Los controles adicionales contra cuentas múltiples y contracargos deberán reforzarse antes de realizar canjes de alto valor.
- La evaluación se efectúa automáticamente al consultar el panel del patrocinador; no se crean desencadenadores horarios en este despliegue.
- Todo movimiento mantiene su código de referencia y queda en el libro contable de puntos.

## Pruebas recomendadas

1. Vista PC/móvil: avatar solo en modal, campos alineados y dropdown con banderas/imágenes y búsqueda.
2. Guardar fecha de nacimiento y país WhatsApp; recargar y comprobar persistencia.
3. Cambiar contraseña de cuenta de prueba, verificar que la contraseña anterior ya no funciona y que se obliga a ingresar nuevamente. Google sin contraseña muestra el aviso correspondiente.
4. Navegar por páginas ajenas al dashboard: barra superior mostrando el nombre de pila si la sesión está abierta. Comprobar menú Mi cuenta/Consultar reserva/Cerrar sesión.
5. Crear cliente A: copiar su enlace. Registrar cliente B con ese enlace por correo y Google (en pruebas independientes).
6. Antes del primer servicio completado de B, A no debe recibir puntos del referido. Después de un pago confirmado y servicio completado, A debe recibir +100 una única vez.
7. Probar que una autorreferencia se rechaza y que repetir recargas no genera más puntos.
8. Revisar ocho propuestas 500–650 puntos y que "Consultar canje" prepara el mensaje correcto.
9. Verificar que el checkout y las capturas PayPal siguen operando con las mismas credenciales.

## Consideraciones comerciales

Los importes en puntos del catálogo son propuestas de beneficios; están sujetos a la aprobación de costos y disponibilidad de proveedores. El botón de consulta no ejecuta un canje instantáneo ni retiene puntos. Definir términos y condiciones por destino antes de permitir canjes en línea.

Cuentas por correo y Google comparten las mismas reglas de referidos, pero ninguna de las redes sociales publica contenido o entrega el ID de post a través de esta integración.
