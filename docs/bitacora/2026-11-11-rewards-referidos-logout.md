# Bitácora · 2026-11-11 · Rewards, referidos, fotografías y cierre de sesión

## Solicitud
Cerrar sesión no respondía, especialmente en móvil. Se solicitó imagen de Machu Picchu muy tenue en la tarjeta verde de LATAM Rewards, 50 puntos por amigo registrado/verificado en vez de 100 y sin exigir compra, listado de invitados (nombre y estado) y movimientos contables, compartir solo en Facebook/Instagram/TikTok/WhatsApp, estado de cuenta legible sin scroll lateral y sustituir fotos de recompensas.

## Cambios de código
- `assets/js/main.js`: delegación en captura para `[data-logout]` creados dinámicamente; borra token y usuario localmente, despacha evento de sesión, intenta invalidación remota con espera acotada de 900 ms y redirige al inicio.
- `backend/LatamReferidos.gs`: se acredita **50 puntos una vez por invitado** después de registrarse por enlace y verificar su cuenta, sin exigir compra. Conserva la protección contra autoinvitaciones, duplicados y hasta 4 nuevas acreditaciones mensuales por patrocinador. Registra el movimiento en hoja `MillasMovimientos`; muestra nombre de pila e inicial, estado y fecha al patrocinador. No cambia montos históricos ya asignados.
- `backend/ExpeditionDashboard.gs`: comentario actualizado para la política en vigor.
- `assets/js/expedition-dashboard.js`: invitaciones 50 puntos y lista de invitados; comparte en Facebook/Instagram/TikTok/WhatsApp. Las redes sin prepublicación por URL copian el mensaje y abren la plataforma. `Estado de cuenta` incluye `Ver más` para concepto.
- `assets/css/expedition-dashboard.css`: imagen tenue de Machu Picchu detrás de tarjeta Rewards, contraste, columnas correctas de compartir y ficha móvil por movimiento.
- `assets/img/rewards-*.webp`: seis imágenes que el usuario entregó, optimizadas a WebP. Cusco aparece en dos tarjetas temporalmente, Machu guiado y Buenos Aires conservan su foto previa.
- Versiones de caché actualizadas en `mis-viajes.html`, `login.html`, `registro.html`, `index.html`, `paquetes.html`, `vuelos.html` y `mi-reserva.html`.

## Despliegue pendiente fuera de GitHub
La regla nueva de referidos requiere copiar **`backend/LatamReferidos.gs` actualizado al Apps Script de reservas y publicar Nueva versión**. Fusionar a GitHub `main` solo modifica el frontend y los archivos fuente, no las funciones `.gs` ejecutadas en la nube.

## QA imprescindible
1. Móvil Android y escritorio: cerrar sesión, desaparecer enlaces privados, token local vacío y nueva autenticación solicitada.
2. Panel Rewards: Machu Picchu muy tenue (no lavada por blur), créditos intactos y tabla móvil sin scroll horizontal.
3. Nuevo usuario por código `ref=LEX...`, verificar email, estado `ACREDITADO`, +50 en `MillasMovimientos` del invitador; segunda consulta no duplica.
4. Registro sin verificar: muestra pendiente, no suma puntos. Autoinvitación y amigo repetido no suman. Cuatro bonificaciones en mes y la quinta en cola.
5. Personas históricas acreditadas con 100 puntos se mantienen contablemente sin reversión accidental.
6. Compartir solo cuatro redes; WhatsApp normal abre el mensaje, Instagram y TikTok copian texto.
7. Recompensas: fotos correctas, botón Consultar canje sin cambios.
