# LATAM Expeditions

Sitio de experiencias, vuelos, hoteles y paquetes en Latinoamérica. Frontend estático publicado mediante GitHub Pages; servicios de reservas y búsqueda en Google Apps Script con hojas privadas. Desarrollo y documentación administrados en GitHub.

**Documentación oficial vigente:** [Manual técnico y operativo](docs/MANUAL_PROYECTO_VIGENTE.md)  
**Historial de implementación:** [Bitácora 2026-11-11](docs/bitacora/2026-11-11-dashboard-movil.md) · [Archivo histórico](docs/historico/)

> Evita seguir guías archivadas para instalar o configurar el sistema actual. Los documentos previos se conservaron íntegros en `docs/historico/` solo para auditoría y reconstrucción del proceso.

## Módulos activos en el código

| Módulo | Archivos principales |
| --- | --- |
| Landing, catálogo y navegación | `index.html`, `assets/js/main.js`, `assets/css/main.css`, `assets/data/catalog.json` |
| Paquetes y experiencias | `paquetes/`, `experiencias/`, `assets/js/booking.js`, `assets/js/package-product-20261108.js` |
| Vuelos y hoteles | `vuelos.html`, `assets/js/vuelos.js`, `integraciones/vuelos/Code.gs` |
| Cuentas y Google Login | `login.html`, `registro.html`, `assets/js/cuentas.js` |
| Dashboard y LATAM Rewards | `mis-viajes.html`, `assets/js/expedition-dashboard.js`, `backend/ExpeditionDashboard.gs` |
| Operaciones y PayPal | `backend/Codigo.gs`, `backend/Cuentas.gs`, `backend/Operaciones.gs` |
| Intranet de productos (MVP) | `intranet/Code.gs`, `intranet/Index.html` |

## Trabajar en este repositorio

1. Abrir una rama descriptiva para cada módulo; no editar `main` directamente durante el desarrollo.
2. Cambiar el código fuente actual, no añadir otro archivo para sustituirlo mediante un parche temporal.
3. Validar JavaScript/CSS, navegación móvil y escritorio, lógica de precios, reservas y controles de seguridad que afecte el cambio.
4. Si cambia la operación, actualizar el [manual vigente](docs/MANUAL_PROYECTO_VIGENTE.md). Añadir un registro fechado en `docs/bitacora/` con cambios, pruebas y despliegues.
5. Abrir PR, revisar diferencias y fusionar solo al terminar QA.
6. Cuando cambian scripts backend, desplegar **nueva versión manual** del proyecto Apps Script correspondiente; modificar GitHub no actualiza ese backend.

Para cambios de productos y plantillas, revisar si se requiere `python3 tools/build.py` o las herramientas de generación existentes; nunca sobrescribir fichas editadas a mano sin comparar los cambios.

## Fuente de verdad y seguridad

- El catálogo público está en `assets/data/catalog.json`.
- El proveedor de consultas dinámicas de vuelos y hoteles es **SerpAPI** en `integraciones/vuelos/Code.gs`. Aviasales/Travelpayouts solo puede tener uso auxiliar/histórico cuando corresponda.
- Las operaciones de reservas/cuentas/PayPal van en un Apps Script **distinto** al de consultas de vuelos/hoteles. La intranet de productos es un tercer proyecto independiente.
- **No subir** secretos PayPal, claves SerpAPI, contraseñas, tokens de sesión ni datos de clientes al repositorio.
- Actualmente el repositorio es público. Cambiarlo a privado no protege datos ya publicados ni sustituye la seguridad del backend.
- El login existente usa **correo/contraseña y Google**. Facebook y TikTok aún no son opciones activadas.

## Estado de publicación

El frontend está alojado en `https://latamexpeditions.com` con `CNAME`. La existencia de archivos `.gs` en este repositorio **no certifica** su despliegue ni las pruebas en producción. Verificar cada proyecto Google Apps Script, la URL `/exec`, PayPal, reservas y disponibilidad con pruebas reales antes de anunciar funcionamiento.

---

Para incorporar un ajuste nuevo, usar este `README` solo como puerta de entrada; el **manual vigente** es la instrucción oficial y la **bitácora** conserva las decisiones anteriores.
