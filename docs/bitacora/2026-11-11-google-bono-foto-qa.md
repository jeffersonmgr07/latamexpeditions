# Bitácora · 2026-11-11 · Imagen Rewards, Google Sign-In y bono

## Solicitud
1. Sustituir **únicamente** la fotografía de la recompensa «Bienvenida ancestral en Cusco» por la ceremonia andina facilitada en el chat.
2. Reemplazar el indicador «Preparando acceso con Google…» con la representación visual de Google y el título «Iniciar sesión con Google».
3. Mostrar únicamente 100 puntos Rewards y una vigencia quincenal automática; eliminar el texto explicativo sobre renovación/canjes.
4. Revisar búsquedas del index. **No tocar PayPal ni realizar cobros de prueba todavía**.

## Implementación
- Archivo nuevo `assets/img/rewards-bienvenida-ancestral-20261111.webp` (720 px, WebP). Se asigna a `cusco-bienvenida` en `assets/js/expedition-dashboard.js`; City Tour Cusco y las demás recompensas no se sustituyen.
- `login.html` y `registro.html`: marcador visual estable con G multicolor y «Iniciar sesión con Google». Al cargarse SDK + nonce se reemplaza con el iframe oficial; no se construye un OAuth alternativo.
- `assets/js/cuentas.js`: corrección del error `$('[data-auth-in]').forEach` (un nodo no tiene `.forEach`) a `$$` y de la detección `$('[data-google-signin]').length` a `$$`. Esos errores detenían la inicialización del flujo.
- Configuración de autenticación ligera `assets/data/auth-config.json`, generada desde `assets/data/catalog.json` mediante `tools/build_auth_config.py` y llamada también desde `tools/build.py`. No se duplica la fuente comercial. Fallback a catálogo si no hay archivo pequeño.
- El botón oficial usa `text:'signin_with'` y `locale:'es'`, manteniendo comprobación `authNonce` y JWT en el servidor.
- `registro.html` muestra «Disponible para quienes se registren hasta el [fecha]» y elimina la explicación de renovación.
- `assets/js/welcome-points.js` mantiene el corte 15/fin de mes usando `America/Lima` y actualiza en `focus`/`visibilitychange`.
- Se actualizan versiones de JS/CSS para cache busting en páginas principales.

## Verificaciones estáticas
| Comprobación | Resultado |
| --- | --- |
| Sintaxis JavaScript de cuentas, Rewards y fecha | Correcta |
| Selector múltiple y detección del Google SDK | Corregidos |
| Marcador de Google visible antes de cargar | Sí |
| Google real conserva nonce y validación servidor | Código conservado |
| 11 y 15 de noviembre de 2026 | Vigencia 15/11 |
| 16 y 30 de noviembre de 2026 | Vigencia 30/11 |
| 1 y 16 de diciembre de 2026 | 15/12 y 31/12 respectivamente |
| Febrero 2027 y 2028 | 28 y 29 de febrero respectivamente |
| Destino Cusco, Machu Picchu, Medellín | 1 sugerencia única cada uno |
| Colombia | País y ocho ciudades/destinos, sin duplicados |
| Perú | País y cinco ciudades/destinos, sin duplicados |
| Fuente de la nueva fotografía | WebP del archivo adjuntado, verificado en GitHub |
| Disponibilidad en motor de búsqueda público | Se encontraron páginas indexadas, cobertura total no demostrada |

## Pendientes y límites
- No se controló un navegador Android autenticado ni se completó un callback real de Google: el render final depende de Google y el Apps Script desplegado.
- No se ejecutaron llamadas de reserva ni búsquedas de tarifas de proveedores con parámetros reales; el QA de datos dinámicos requerirá conectar la sesión de prueba adecuada.
- No se usaron credenciales ni se modificaron operaciones de PayPal.
- Todos los cambios deben fusionarse mediante PR antes de considerarlos publicados.
