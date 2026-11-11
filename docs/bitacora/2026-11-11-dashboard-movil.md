# Bitácora técnica · 2026-11-11 · Dashboard móvil y documentación

## Contexto
El usuario reportó capturas Android de `mis-viajes.html` con tarjetas, referencias, nivel Rewards y perfil recortados por desbordamiento horizontal; la barra de secciones de cuenta ocupaba espacio móvil y la navegación principal repetía Paquetes/Ofertas/Vuelos/Hoteles. Los botones Google en login/registro aparecían con demora. Se solicitó una sola documentación actual, con historial separado.

## Diagnóstico confirmado en el código
- `assets/js/main.js` insertaba enlaces de servicios en **dos** rutinas de navegación, causando duplicaciones.
- La cuenta privada mostraba `.exp-sidebar` horizontal en móvil además del menú principal.
- `assets/css/expedition-dashboard.css` conservaba tres columnas de estadísticas, grids y referencias de escritorio en pantallas angostas.
- `assets/js/cuentas.js` aguardaba en paralelo SDK y `authNonce` de Apps Script antes de dibujar el botón oficial; también descargaba un `catalog.json` grande con `cache:'no-store'`.
- `assets/js/expedition-dashboard.js` cambiaba fragmentos al navegar internamente, pero no reaccionaba a enlaces `#millas` provenientes del menú global.

## Implementación propuesta en rama
`fix/mobile-dashboard-unified-nav-docs-20261111`

1. Menú móvil de una sola fuente: `main.js` elimina inserciones redundantes, conserva los cinco servicios y añade enlaces privados a `mis-viajes.html#...` si el visitante tiene sesión.
2. `cuentas.js` evita reactivar el enlace antiguo duplicado; `main.css` presenta el grupo LATAM Rewards en el menú general con estados accesibles.
3. `expedition-dashboard.css` oculta la barra secundaria solo bajo 760 px, limita desbordamientos y adapta estadísticas, cards, perfil, invitaciones y recompensas. Escritorio permanece sin cambios funcionales.
4. `expedition-dashboard.js` escucha `hashchange` para cambiar entre vistas privadas desde el menú.
5. Login/registro: preconnect/preload a Google Identity Services, texto de preparación inmediato y cambio de solicitud de configuración a revalidación HTTP (`no-cache`). **No se suprime nonce ni verificación del JWT**.
6. Creación de `docs/MANUAL_PROYECTO_VIGENTE.md`; la documentación previa pasa a tener estatus histórico.

## No implementado en este ciclo
- Facebook/Meta Login y TikTok Login Kit. Requieren las aplicaciones oficiales, configuración OAuth de callback seguro, aprobación/condiciones de proveedor y validación en servidor; no introducir botones sin proveedor funcional.
- No se tocó Apps Script en producción ni se modificaron órdenes, captura, precios, fondos ni datos del cliente.
- No se ha comprobado mediante un navegador real la apariencia de cada dispositivo; requiere QA tras publicar o en una vista previa.

## Pruebas de aceptación
- 360px, 390px, 430px, 768px y PC: ninguna sección de dashboard produce desplazamiento horizontal global.
- Menú principal: no repite servicios. Estado sin sesión no muestra cuenta. Estado con sesión muestra todas las vistas; cerrar sesión funciona.
- Desde `mis-viajes.html#perfil` pulsar en el menú LATAM Rewards/otros fragmentos y comprobar cambio sin recarga.
- Tablas: desplazamiento únicamente dentro de su contenedor.
- Login Google: indicador visible desde carga inicial; Google oficial aparece cuando SDK y nonce estén listos; sesión se valida contra backend, sin saltarse controles.
- Confirmar compatibilidad de escritorio y funcionamiento del panel tras fusionar.

## Política de trazabilidad
Esta entrada documenta la historia del trabajo. La configuración y el proceso vigente se mantienen exclusivamente en `docs/MANUAL_PROYECTO_VIGENTE.md`. Los archivos previos se conservan en `docs/historico/`, no como rutas de instalación activas.
