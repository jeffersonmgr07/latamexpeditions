# LATAM Expeditions · Manual técnico y operativo vigente

**Versión documental:** 2026-11-11  
**Fuente de verdad:** código de la rama `main` después de fusionar los cambios aprobados; este manual debe actualizarse en el mismo PR que cambie el comportamiento.  
**Alcance:** sitio público, cuentas, dashboard, catálogo, paquetes, reserva, pagos, integraciones, panel de administración y despliegue.

> **Importante:** el repositorio contiene el código fuente, pero no permite comprobar qué versión se está ejecutando actualmente en Google Apps Script. Los archivos `.gs` NO se despliegan automáticamente con GitHub Pages. Antes de declarar una función como operativa, confirmar su versión publicada y probar el flujo de extremo a extremo. No confundir "existe en GitHub" con "instalado en producción".

## 1. Arquitectura vigente

| Componente | Código principal | Función y ubicación de ejecución |
| --- | --- | --- |
| Sitio público | `index.html`, `paquetes.html`, `experiencias.html`, `paquetes/*.html`, `experiencias/*.html` | HTML/CSS/JS estático servido por GitHub Pages, dominio `latamexpeditions.com` |
| Identidad y navegación | `assets/js/main.js`, `assets/css/main.css` | Menú global, idioma, país, estado de sesión, accesos responsivos |
| Login y registro | `login.html`, `registro.html`, `assets/js/cuentas.js`, `assets/css/auth-pages-20261110.css` | Correo/contraseña y Google Identity Services; validación de sesión en backend |
| Mi cuenta / LATAM Rewards | `mis-viajes.html`, `assets/js/expedition-dashboard.js`, `assets/css/expedition-dashboard.css` | Viajes, reservas, millas, recompensas, alertas, perfil, referidos |
| Configuración/catálogo | `assets/data/catalog.json` | Productos, parámetros públicos de reserva y clientes OAuth; **no** almacenar secretos aquí |
| Compra de paquetes | `assets/js/booking.js`, `assets/js/package-product-20261108.js`, `assets/js/latam-product-controls.js` | Selección de viajeros, alojamientos, vuelos, cotización y checkout |
| Vuelos y hoteles dinámicos | `integraciones/vuelos/Code.gs`, `assets/js/vuelos.js`, `assets/js/vuelos-config.js` | Google Apps Script independiente; consulta a SerpAPI (Google Flights / Google Hotels) |
| Reservas y PayPal | `backend/Codigo.gs`, `backend/Cuentas.gs`, `backend/Formularios.gs`, `backend/Operaciones.gs` | Apps Script de reservas, control de importe, órdenes/captura y seguimiento operativo |
| Rewards, perfil, referidos | `backend/ExpeditionDashboard.gs`, `backend/LatamReferidos.gs` | Mismo proyecto Apps Script de reservas; hojas privadas y permisos por sesión |
| Intranet de productos | `intranet/Code.gs`, `intranet/Index.html`, `intranet/AtacamaSeed.gs` | Proyecto Apps Script/Sheets **separado** del sitio y de las reservas; MVP en repositorio, despliegue no verificado |

**Principio:** un único código oficial por integración. No incorporar funciones `doGet` / `doPost` de dos proyectos Apps Script diferentes en el mismo archivo o aplicación. Las guías históricas de proveedores anteriores no son instrucciones de producción.

## 2. Navegación, identidad y dashboard

- Escritorio: conservar la navegación principal de paquetes, ofertas, vuelos y hoteles y el acceso a cuenta.
- Móvil: **un solo menú hamburguesa en el encabezado compartido**. Sus servicios son Paquetes, Ofertas, Vuelos, Hoteles y Experiencias. Con sesión iniciada añade Mi panel, Mis viajes, Mis reservaciones, LATAM Rewards, Recompensas y cupones, Notificaciones y Mi perfil; incluye Cerrar sesión y Consultar reserva.
- En `mis-viajes.html`, el menú lateral de cuenta se presenta en escritorio; **se oculta en móvil** porque la navegación privada ya está en el menú principal.
- Las vistas privadas usan los fragmentos `#inicio`, `#viajes`, `#reservas`, `#millas`, `#recompensas`, `#avisos` y `#perfil`. El controlador escucha `hashchange` para navegar sin recargar.
- Sección de cuenta: muestra información del usuario autenticado desde la API; no inventar reservas, saldo ni millas. La foto de perfil se edita desde modal. Se respetan cambios de correo, contraseña y sesión con controles de backend.
- **Autenticación actualmente desarrollada:** correo/contraseña y Google (JWT verificado en el servidor con cliente y nonce). Facebook/Meta y TikTok están **pendientes**, no colocar botones activos sin integración OAuth real.
- Para Google: el botón oficial se dibuja por Google Identity Services. Mientras cargan la SDK y el nonce del backend se muestra un indicador visible; la validación del nonce nunca se omite por acelerar la interfaz.

## 3. Catálogo, paquetes y tarifas

- `assets/data/catalog.json` es la configuración pública canónica de paquetes y experiencias.
- Por defecto dos adultos y cero niños, según `booking.defaultAdults` / `defaultChildren`. El precio del grupo se presenta como **Total a pagar**, no «desde».
- Paquetes: tarifa base de hotel en doble, suplemento single para un viajero y reglas de acomodación válidas según ocupantes. Una elección de hotel se expresa por su **diferencia contra la base** (no como un nuevo total aislado).
- En la página de producto se deben mantener sincronizados fechas, viajeros, hotel, vuelos, resumen y checkout. Si cambian los parámetros fundamentales, volver al cálculo base antes de aplicar complementos.
- Tras editar archivos de catálogo o fuentes generadas, ejecutar las herramientas de construcción/validación del repositorio (por ejemplo `python3 tools/build.py` si corresponde al archivo modificado). Inspeccionar siempre los diffs para evitar sobrescribir ediciones manuales de fichas.
- La consola privada de productos conserva **costos de proveedores, márgenes, datos comerciales, hoteles base y borradores** fuera del HTML público. El circuito deseado es Borrador → En revisión → Aprobado → Publicado; el hecho de guardar un borrador no confirma su publicación.

## 4. Vuelos y hoteles: fuente actual SerpAPI

1. El frontend consulta la URL configurada para la mini API de vuelos/hoteles.
2. `integraciones/vuelos/Code.gs` realiza la consulta autorizada a **SerpAPI** con `SERPAPI_KEY` en las propiedades privadas de Apps Script; aplica caché, formato y paginación según el tipo de resultado.
3. Los vuelos usan datos de Google Flights y los hoteles usan Google Hotels. Los filtros, fechas, ocupación, escalas, equipajes, clase y precio aplican según los datos efectivamente devueltos; no inventar una oferta ausente.
4. Las tarifas de búsqueda **no equivalen por sí solas a boletos emitidos ni habitaciones confirmadas**. El operador valida y realiza la compra/emisión operativa.
5. `TP_API_TOKEN` puede servir como respaldo/histórico si se encuentra configurado. **Travelpayouts/Aviasales no reemplaza a SerpAPI como fuente oficial de búsquedas actuales**. La antigua mini API basada solamente en históricos es documentación archivada.
6. La reserva conserva las selecciones del usuario hasta que este cambie explícitamente una condición que obligue a recalcular.

**Despliegue:** abrir el proyecto Apps Script **de vuelos**, actualizar **solamente** su `Code.gs`, conservar `SERPAPI_KEY` en propiedades del script, crear nueva versión y verificar respuestas y resultados. Nunca publicar la clave en frontend ni GitHub.

## 5. Reservas, PayPal y operación

- La configuración pública `catalog.json` actualmente define `paypalEnvironment: live` y `paypalEnabled: true` con cliente y endpoint configurados. **Esto confirma la configuración del repositorio, no el estado de la implementación desplegada**.
- El backend de reservas contiene las rutas `createOrder`, `captureOrder`, `registerPayOnTour`, `myTrips`, `findBooking`, `resendVoucher` y operaciones auxiliares. El importe oficial se valida/calcula en el servidor y **no** se acepta un `quotedTotal` arbitrario del navegador.
- Separar estado del pago, reserva registrada y prestación efectiva. El cobro PayPal no equivale automáticamente a emisión de vuelo ni confirmación de hotel.
- El Apps Script de reservas debe contener **un solo** `doPost`, con las funciones correspondientes en `Codigo.gs`, `Cuentas.gs`, `Formularios.gs`, `Operaciones.gs`, `ExpeditionDashboard.gs` y `LatamReferidos.gs` si se encuentran activas.
- Los datos del cliente y reservas permanecen en Sheets privadas. Rechazar consultas de reservas ajenas; no exponer secretos o datos personales en respuestas públicas.
- Cambiar la propiedad del script y publicar **Nueva versión** en el proyecto de Apps Script. Nunca pegar el Client Secret de PayPal en una página o JSON público.

## 6. LATAM Rewards y referidos

- El dashboard consulta al backend para determinar puntos disponibles, pendientes y movimientos. El bono de bienvenida configurado es de **100 puntos al verificar la cuenta** y no se debe duplicar.
- La política descrita en el backend Rewards calcula millas de compras a partir de reservas y estados de servicio (referencia: una milla por US$10 efectivamente pagados); verificar las reglas comerciales activas antes de anunciar nuevas promociones.
- El programa de recompensas y canjes puede mostrar experiencias y solicitudes de consulta; **no** implementar descuentos automáticos sin un endpoint que valide saldo, reglas y transacción.
- **Referidos vigente desde 2026-11-11:** 50 puntos por amigo que se registre mediante el enlace personal y verifique su cuenta (correo o Google); no se requiere primera compra. Se acredita una sola vez por invitado mediante clave única `REFERRAL:correo`, con máximo cuatro bonificaciones por patrocinador y mes según la política actual. Si alcanza el límite mensual, el caso queda `EN COLA` para el siguiente periodo. Las bonificaciones históricas ya concedidas por la regla anterior no se alteran retroactivamente.
- Los invitados aparecen en el dashboard con nombre de pila e inicial, fecha de registro y estado (registrado, pendiente de verificación, acreditado o en cola); por privacidad no se divulga su correo completo al patrocinador.
- Los puntos acreditados se registran en `MillasMovimientos` y aparecen automáticamente en el estado de cuenta; el frontend no asigna puntos.
- Compartir invitaciones: Facebook y WhatsApp usan enlaces oficiales. Instagram y TikTok no admiten autopublicar enlaces mediante URL web; en esos casos se copia el texto y se abre la plataforma para que el usuario pegue su invitación. No se premian clics ni publicaciones.
- Endpoint base de cuenta: operaciones como `dashboardHome`, `dashboardTrip`, `dashboardSaveProfile`, `dashboardGetAvatar`, verificación de correo, notificaciones, perfil y referidos. Probar la API implementada antes de habilitar cada opción pública.

## 7. Pasos de instalación / réplica para otra marca

1. Duplicar el código en un **repositorio privado** del nuevo negocio. Sustituir dominio, logo, textos, contactos, legal y `CNAME` **sin** reutilizar cuentas, credenciales o datos de clientes de LATAM.
2. Definir el catálogo público del negocio y sus precios aprobados, configuraciones de idiomas, hoteles base y ocupaciones.
3. Crear dos proyectos Google Apps Script independientes: **reservas/cuentas/pagos** y **búsqueda vuelos/hoteles**; opcionalmente un tercero para la **intranet de productos**. No mezclar `doPost` entre proyectos.
4. Crear hojas Google Sheets privadas y configurar propiedades seguras: IDs de hojas, secreto PayPal, Google OAuth, `SERPAPI_KEY`, etc. Los valores privados jamás deben incluirse en Git.
5. Publicar las implementaciones Apps Script; guardar únicamente las URLs públicas necesarias y claves **públicas** de cliente en la configuración del frontend.
6. Configurar Google Identity Services con los dominios/autorizaciones de la nueva marca; probar registro, inicio de sesión, cierre, restablecimiento y navegación.
7. Configurar PayPal del nuevo negocio y validar pagos en sandbox antes de pasar a live. Probar importe, webhooks/consulta de conciliación disponible, reserva, email, voucher y reversión.
8. Probar Google Flights / Google Hotels: rutas, fechas, tarifas ausentes, grupo de pasajeros, paginación, suplementos y reservas con cambios.
9. Verificar HTTPS, dominio, traducciones, mobile (360/390/430 px), escritorio, teclado, fotos, rendimiento y privacidad.
10. Publicar `main` cuando la revisión sea aprobada. Registrar versión/fecha de Apps Script desplegada y cambios relevantes en bitácora.

## 8. Seguridad, fuentes y control de cambios

- GitHub Pages publica el HTML/JS/CSS y `catalog.json`; **todo ello es público** incluso si se configura un repositorio privado con un sitio público. Mantener secretos solo en propiedades de Apps Script u otro almacén seguro.
- Antes de cambiar la visibilidad del repositorio, revisar la elegibilidad y configuración de GitHub Pages con el plan disponible; hacer una copia segura y verificar que el dominio siga publicado.
- Cada cambio de funcionalidad se prepara en una rama, se revisa mediante diff/PR, incluye pruebas y actualiza **este manual** y su bitácora de la fecha correspondiente. No crear una nueva guía de instalación duplicada por cada corrección.
- Priorizar una implementación vigente y un historial aparte. Los archivos dentro de `docs/historico/` son **referencias históricas**, no instrucciones actuales.
- Mantener el `README.md` de la raíz como índice breve al manual y al historial.

## 9. Pruebas mínimas tras cambios

| Caso | Resultado esperado |
| --- | --- |
| Menú móvil sin sesión | Una sola lista de servicios + Iniciar sesión; sin secciones privadas |
| Menú móvil con sesión | Una sola lista de servicios y todas las secciones de cuenta; Cerrar sesión |
| `mis-viajes.html` a 360–430 px | Sin scroll horizontal global; tarjetas, perfil, referidos y recompensas fluidos |
| Enlace `#millas` desde dashboard | Cambia el panel sin recargar y mantiene sesión |
| Login Google | Indicador inmediato; botón oficial al estar preparada SDK/nonce; JWT validado por servidor |
| Cuenta / reservas | No se muestran reservas ni saldos de otros usuarios |
| Cambios de viaje/hotel/vuelo | Cotización consistente y datos de pasajeros persistentes donde corresponda |
| PayPal | Total servidor correcto; no repetir/capturar doble; conciliación y comprobante |
| Cambio de Apps Script | Nueva versión publicada, pruebas reales en URL de despliegue |
| Publicación | QA de móvil, PC y funciones comerciales antes de fusionar |

## 10. Estado y pendientes verificables a 2026-11-11

- **Comprobado en repositorio:** estructura de la web, catálogo, Google Sign-In, código de reservas/PayPal, UI del dashboard, código Rewards, mini API SerpAPI e intranet MVP.
- **No verificado en los servicios externos:** versión exacta de los tres proyectos Apps Script, producción de cuentas/recompensas, emisión de vuelos, confirmación de hoteles y estados de pago reales.
- **Pendiente de proveedor OAuth:** Facebook/Meta Login y TikTok Login Kit. No sustituir Google hasta contar con aplicación aprobada, credenciales configuradas, devolución OAuth segura y pruebas.
- **Pendiente de QA visual con navegador real:** las capturas aportadas motivaron la corrección responsive del 11/11; probar Android/iOS y PC tras publicar el PR.

## 11. Mantenimiento de este documento

Al terminar cada intervención: (1) revisar el comportamiento realmente integrado en `main`; (2) actualizar los apartados correspondientes de este manual eliminando alternativas obsoletas; (3) añadir una entrada histórica en `docs/bitacora/` con fecha, archivos, cambio, motivo, verificación y pendientes; (4) vincular el PR/commit; (5) anotar despliegues manuales de Apps Script solo cuando estén confirmados.


## 12. Ajustes del 11 de noviembre de 2026
- El menú compartido controla también Cerrar sesión en móvil; se elimina la sesión local inmediatamente y se intenta invalidar remotamente con espera acotada.
- El fondo de la tarjeta LATAM Rewards usa una fotografía de Machu Picchu aportada por el propietario, con una capa verde de alta opacidad para mantener contraste.
- Las recompensas utilizan imágenes locales optimizadas. Bienvenida ancestral en Cusco usa `assets/img/rewards-bienvenida-ancestral-20261111.webp` (fotografía aportada por el propietario); City Tour Cusco mantiene `rewards-bienvenida-cusco.webp`, y no se modifican los recorridos de Buenos Aires ni Machu Picchu guiado.
- En móvil el estado de cuenta se presenta como tarjetas por movimiento, con fecha, concepto resumido, puntos, estado y `Ver más`. En escritorio mantiene su tabla.
- **Despliegue obligatorio:** para aplicar las nuevas reglas de 50 puntos hay que actualizar `backend/LatamReferidos.gs` en el proyecto Apps Script existente de reservas y publicar una nueva versión. GitHub Pages no actualiza Apps Script automáticamente. Probar registro, verificación, crédito único, límite mensual, cuenta de puntos y ausencia de duplicados.


## 13. Robustecimiento de reservas y selección de hoteles (11/11/2026)

- `assets/js/booking.js`: la construcción del formulario de pasajeros soporta fallos de las listas personalizadas y del calendario de nacimiento. Ante error se restaura un selector nativo y/o campo HTML5 de fecha visible; el viajero todavía puede completar datos. La recolección se limita a `#bkPaxList` y se comprueba el número de formularios contra el total de adultos y niños antes del siguiente paso. Se conserva el nombre y la fecha al reconstruir el formulario.
- `assets/js/package-product-20261108.js`: al confirmar vuelos con una llegada distinta se preserva **el nombre del hotel preferido**, pero la diferencia anterior, su firma y las tarifas observadas se invalidan por seguridad. La UI lo marca pendiente de nueva consulta (`hotelQuotePending`) y el backend solo permite cobrar el hotel **base**, no un suplemento obsoleto. Conservar una preferencia no equivale a reservarla ni a respetar una cotización anterior.
- `backend/Codigo.gs` se mantiene como autoridad única de importes. Debe validar en servidor cantidad de pasajeros, tarifario, cupón y cotizaciones adicionales firmadas antes de crear una orden PayPal. No confiar en `quotedTotal` del navegador.
- Atacama Premium presenta tarifa definida en el backend para 1–2 adultos en single/doble/matrimonial, **sin** tarifa infantil ni para triple. La validación frontend impide que se avance al pago en otros grupos y remite a cotización personalizada. Esto replica la restricción del backend, en vez de mostrar un importe ficticio.
- **Pruebas aún necesarias:** con navegador Android/PC, 2 adultos, 2 adultos + 1 niño, 1 adulto single, hotel alternativo, vuelo con y sin cambio de llegada, cotización firmada/expirada, checkout con PayPal sandbox y conciliación. Estas pruebas no se reemplazan con validación sintáctica y el backend en Apps Script no se modifica automáticamente.

## 14. Inicio de sesión, vigencia quincenal y control del buscador (11/11/2026)

- **Google Identity Services** es el único componente que realmente inicia sesión con Google. Se ha corregido `assets/js/cuentas.js` para que las operaciones con múltiples nodos usen el selector `$$` (antes se invocaba `.forEach` sobre un solo elemento, bloqueando el arranque) y para habilitar la precarga de la SDK en login y registro.
- El usuario ve de inmediato un marcador visual **«Iniciar sesión con Google»**, con la G multicolor. No es un botón alternativo de autenticación: se sustituye por el botón **oficial** `google.accounts.id.renderButton` en cuanto estén listos el script y el nonce firmado por el backend. Se usa `text:'signin_with'` con `locale:'es'`.
- El frontend obtiene las dos propiedades públicas de login desde `assets/data/auth-config.json` (muy pequeño). El catálogo `assets/data/catalog.json` sigue siendo la **única fuente de verdad**. Generar su archivo derivado con `python3 tools/build_auth_config.py`, o mediante `tools/build.py`, que ya ejecuta dicho generador. No colocar secretos en ninguno de los dos archivos públicos. Si falta la versión pequeña, el cliente usa el catálogo como respaldo.
- **Registro y bono de 100 puntos:** mantener el valor; debajo aparece «Disponible para quienes se registren hasta el [fecha]» y se elimina toda la explicación interna de renovación.
- `assets/js/welcome-points.js` calcula la fecha de corte en `America/Lima`. Del día 1 al 15 muestra el 15 del mes en curso; del día 16 al fin de mes muestra su último día. Se actualiza al abrir, enfocar o reactivar la pestaña. No acredita puntos; el backend conserva el control de bono y verificación.
- **Buscador del index:** la fuente es `assets/js/inicio-redesign.js`. Sugiere destinos únicos, sin duplicar tarjetas: `Cusco`, `Machu Picchu` y `Medellín` dan una entrada cada uno; `Colombia` muestra país y ciudades asociadas. La navegación transmite `ciudad` o `destino`, `fecha`, `adults`, `children` y `origen` a `paquetes.html`. Cambios de resultados/tarifas requerirían una revisión específica del catálogo y la operación.
- **Pruebas efectuadas sobre código fuente:** sintaxis de `cuentas.js`, `welcome-points.js` y `expedition-dashboard.js`; destinos sin etiquetas duplicadas; calendario quincenal en 15/16/30 de noviembre, 1 de diciembre y febreros normales/bisiestos; imagen WebP incorporada; `auth-config` con datos públicos. El sitio se encontró en resultados de búsqueda externos, pero esto **no** demuestra indexación exhaustiva de cada página.
- **No ejecutado:** inicio de sesión real contra Google/Apps Script con cuenta del cliente, reserva de prueba, simulación con tarifas de terceros, cobro/captura PayPal; se hará QA funcional específico, sin modificar cobros en este cambio.


## 14. Inventario por país y modernización de Chile (11 de noviembre de 2026)

El inventario mantenido en [`docs/CATALOGO_ITINERARIOS_2026-11-11.md`](CATALOGO_ITINERARIOS_2026-11-11.md) enumera los **38 paquetes de 8 países** y los días de cada programa chileno; distingue productos del catálogo de fichas históricas que ya no se pueden reservar automáticamente.

### Productos de Chile

- **Desierto de Atacama Premium 5D/4N:** plantilla de referencia con Hotel Terrantai. Tarifas configuradas para 1 y 2 adultos; sin tarifa infantil automatizada.
- **Santiago y Atacama 5D/4N:** plantilla de referencia de dos ciudades; vuelos internos Santiago (SCL) ↔ Calama (CJC) opcionales. Las tarifas publicadas de las categorías se utilizan **para dos adultos en doble o matrimonial**, no se aplican automáticamente a single/triple/familiar sin suplemento validado.
- **Patagonia y Torres del Paine 6D/5N:** ficha modernizada usando la misma estructura visual, itinerario, galería, tarjetas de hotel, consulta de vuelos con destino Punta Arenas (PUQ) y reglas de ocupación definidas. El precio es por persona en habitación **doble para dos adultos**; no hay tarifa aprobada para otras ocupaciones. Hoteles y servicios sujetos a confirmación.
- **`paquetes/chile-atacama.html` antiguo:** programa 6D/5N que no forma parte del catálogo actual y carece de precio; marcado `noindex`, con aviso de versión histórica y botón de reserva automática desactivado. No eliminarlo sin decidir si se comercializará de nuevo.

### Tarifas y validación

La ficha compartida suma mediante `assets/js/package-product-20261108.js`:

`Total mostrado = base de paquete por ocupación + vuelo total para el grupo + suplemento de hotel para la estancia - descuento aplicable al paquete`.

`assets/js/booking.js` recalcula con los mismos conceptos. La suma de vuelos **no se multiplica otra vez por personas**: la API devuelve un total para los viajeros seleccionados. La diferencia hotelera corresponde al grupo y las noches de la estancia. En Chile los valores solo son utilizables automáticamente con la ocupación definida en el catálogo; las tarifas no configuradas provocan un mensaje de cotización previa, también validado en el formulario de pasajeros.

**Importante:** revisar la fórmula en el código no equivale a realizar búsquedas confirmadas con SerpAPI ni a completar una compra. La API pública de Apps Script no respondió a la comprobación desde el entorno de investigación y no se consumieron búsquedas reales ni órdenes PayPal durante esta intervención. El flujo debe ensayarse en navegador con respuesta real, ocupaciones, fechas y backend desplegado antes de ampliar la venta automática.

### Seguridad y operación del destino

- Se eliminó del programa actual de Patagonia la visita a la antigua pingüinera turística de **Seno Otway** (cerrada) y se menciona **Isla Magdalena** solo como navegación opcional, estacional y sujeta a cupos y clima. No incluirla en el precio sin coste/proveedor confirmado. CONAF declara la temporada 2026–2027 del Monumento Natural Los Pingüinos entre el 15/10/2026 y el 31/03/2027.
- La entrada al Parque Nacional Torres del Paine es adicional; validar el sistema tarifario vigente y condiciones en CONAF/Pases Parques antes de cotizar. Grey depende de clima y navegación operativa.
- Las fotografías locales deben estar en `assets/img/` y corresponder al destino, nunca asumir fotos inexistentes de hoteles. Patagonia tiene una imagen válida y necesitará galería ampliada con fotos verificadas.
- La plantilla HTML se cambia puntualmente sin regenerar toda la web con `tools/build.py` salvo inspección del diff: existen fichas manuales recientes y un rebuild masivo podría sustituirlas accidentalmente. Documentar nuevas fichas en el catálogo.


**Backend autoritativo de precios de Chile:** el archivo `backend/Codigo.gs` ha sido sincronizado para que `PRECIOS_PAQUETES` contemple exclusivamente ocupaciones definidas en catálogo, y `validarYCalcular` rechace menores y grupos distintos de dos adultos en Santiago–Atacama 5D/4N y Patagonia 6D/5N. Esto **requiere actualizar y publicar una nueva versión del Apps Script de reservas/cuentas/pagos**; la rama GitHub no actualiza el backend desplegado. No se modificaron `createOrder`, `captureOrder` ni credenciales de PayPal. Hasta el despliegue, la validación del frontend es la medida temporal.
**Corrección de scripts:** se incluyó `vuelos-config.js` y `package-product-20261108.js` en Santiago–Atacama, donde faltaban, para activar los mismos selectores que Atacama Premium. La antigua función `paquete-vuelos.js` específica de Medellín se excluye de las nuevas fichas Chile.


## Auditoría de mercado Chile y logística Patagonia · 2026-11-11

**Fuente de investigación:** [Estudio de mercado y portafolio de 10 paquetes](ESTUDIO_MERCADO_CHILE_2026-11-11.md). Incluye comparación de costos de compra individual contra producto organizado, mercado de OTAs, escenarios de promoción del 10% y un ranking **editorial** para completar Chile con siete nuevos programas. **Los precios de los productos nuevos son hipótesis comerciales, no tarifas aprobadas; no publicarlos como disponibles hasta recibir costos firmes y verificar margen.**

### Patagonia y Torres del Paine

- Ficha `paquetes/chile-patagonia-6d5n.html`: contiene 35 eventos con horarios referenciales por día, seis jornadas detalladas, rutas y puntos de control operativos.
- La distribución comercial prevista es **4 noches en Puerto Natales + 1 noche en Punta Arenas**. El hotel de la quinta noche **todavía no está asignado** y requiere proveedor, categoría y costo.
- El día 3 propone la navegación **Grey III** de temporada 2026–2027 con registro ~12:00, zarpe ~13:00 y regreso ~15:45 según Hotel Lago Grey; no garantizar hasta obtener cupo, mínimo de pasajeros, traslado y condiciones de navegación.
- El día 5 traslada temprano al viajero desde Puerto Natales a Punta Arenas. **Isla Magdalena** es adicional y solo posible con reserva y disponibilidad en temporada; la segunda salida del proveedor Fiordos del Sur referencia registro ~12:30 y navegación ~13:30–18:00.
- Como una cotización de hotel **para cinco noches en una sola ciudad** sería incorrecta, `assets/js/package-product-20261108.js` muestra la distribución 4+1 y **desactiva la búsqueda automática de sustituciones hoteleras** de Patagonia. Las diferencias de categorías definidas sí pueden consultarse.
- `data-book-quote-only="true"` en la página de Patagonia y `quoteOnly:true` en catálogo dejan pendiente el cobro online **hasta confirmar el hotel de Punta Arenas, servicios y costos**. No se modificaron los métodos de PayPal ni se hicieron cobros.
- La publicación del backend Apps Script continúa siendo manual. La tarifa de referencia US$1,450 por persona en doble es informativa hasta confirmar los servicios.

### Notas comerciales

- Atacama Premium US$1,499.90 con hotel Terrantai se mantiene como tarifa de referencia premium; el establecimiento confirma que recibe huéspedes a partir de **14 años**, mientras el paquete de la agencia se mantiene para adultos.
- Santiago–Atacama US$880 por persona es más caro que una combinación básica reservada por separado; evaluar reducción a US$799.90 **solo** si costos mayoristas/operativos permiten sostener margen tras promoción.
- El hotel del catálogo `Hostal La Ruca` requiere verificar identidad comercial frente a `La Rukka Hostal Boutique` antes de cambiar nombres o fotos.
- Toda oferta del 10% se calcula sobre la tarifa de lista real del paquete, no sobre los vuelos ni extras fuera de campaña; margen bruto de referencia 25% sobre precio final, sin ignorar pagos/comisiones/costos administrativos.
