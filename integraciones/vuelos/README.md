# LATAM EXPEDITIONS — Mini API de tarifas aéreas (fase 2)

## Qué resuelve

La página vuelos.html consulta, sin redirigir al cliente, precios de vuelos observados en búsquedas anteriores en Aviasales / Travelpayouts.

**No son disponibilidad en tiempo real, precios garantizados, ni tickets emitibles.** El botón WhatsApp solicita confirmación antes de la venta. Las tarifas visibles son por pasajero adulto (clase económica). El sistema no extrapola el precio a niños o a grupos.

Arquitectura: vuelos.html (GitHub Pages) → vuelos-config.js (URL pública) → Google Apps Script (Code.gs + token secreto) → Aviasales Data API /v3/prices_for_dates.

**No es necesario subir manualmente un JSON de históricos para obtener los primeros precios.** El archivo assets/data/vuelos-historico.json se mantiene para una futura función estadística. Sin un token configurado, la página NO puede obtener tarifas automáticamente.

## Paso 1 — Obtener token gratuito de datos

1. Regístrate en https://www.travelpayouts.com/ .
2. Abre https://app.travelpayouts.com/ y luego Perfil → API token.
3. Copia el token privado. **No lo publiques en GitHub ni en el navegador.**
4. El token da acceso a la API histórica/caché; no es la API de disponibilidad en tiempo real.

Documentación oficial:
- https://support.travelpayouts.com/hc/en-us/articles/203956083-Requirements-for-Aviasales-data-API-access
- https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API

## Paso 2 — Crear Apps Script

1. En https://script.google.com/ crea un proyecto, por ejemplo LATAM Flights API.
2. Reemplaza el código de Code.gs por el contenido del archivo integraciones/vuelos/Code.gs de este repositorio.
3. En **Configuración del proyecto → Propiedades del script** agrega:
   - **Propiedad:** TP_API_TOKEN
   - **Valor:** el token obtenido en Travelpayouts.
4. Guarda los cambios.

No pongas el token en un archivo HTML, JavaScript, JSON público ni en el código Apps Script.

## Paso 3 — Desplegar Web App

1. En Apps Script, pulsa **Implementar → Nueva implementación**.
2. Elige **Aplicación web**.
3. **Ejecutar como:** tu cuenta.
4. **Quién tiene acceso:** cualquiera.
5. Autoriza los permisos requeridos por Apps Script y despliega.
6. Copia la URL pública **terminada en /exec** (no /dev).

Esta versión usa JSONP con nombre de callback validado porque GitHub Pages no puede garantizar peticiones CORS a Apps Script ContentService. No devuelve ningún token ni información privada. Es un endpoint público: para mucho tráfico conviene pasar a un servidor con controles de abuso (p. ej. Cloudflare Worker).

## Paso 4 — Conectar la página

Edita el archivo **assets/js/vuelos-config.js** en GitHub. Cambia:

    window.LATAM_FLIGHTS_API_URL = '';

por:

    window.LATAM_FLIGHTS_API_URL = 'https://script.google.com/macros/s/TU_IMPLEMENTACION/exec';

Guarda los cambios. Esa URL es pública y **no es una clave secreta**.

## Paso 5 — Probar

1. Visita https://latamexpeditions.com/vuelos.html en incógnito.
2. Busca Lima (LIM) → Medellín (MDE), fechas futuras, 1 adulto, clase económica.
3. Si Aviasales tiene búsquedas almacenadas para esa ruta/fecha, verás precios publicados en USD y aerolínea. Si no existen registros para el día exacto, el servicio consulta fechas cercanas (hasta 14 días), etiquetadas claramente con sus fechas reales.
4. Si no hay datos, indicará que **no se encontraron tarifas en la caché**, NO que los vuelos no existan.
5. Verifica ida y vuelta / solo ida, validación de fechas y WhatsApp.

Nota: cada tarifa corresponde a una observación de la caché del proveedor; esta API registra precios encontrados en búsquedas anteriores (habitualmente dentro de las últimas 48 horas para el endpoint exacto), no inventario de compra confirmable.

## Errores frecuentes

- "Falta activar la conexión": aún no configuraste vuelos-config.js.
- "Falta configurar el token": falta la Propiedad del script TP_API_TOKEN.
- "La consulta no respondió": revisa que el Web App sea público, esté implementado y el URL termine en /exec. Algunos errores de despliegue presentan una página de login HTML y el navegador agotará el tiempo de espera.
- "No hay tarifas en caché": intenta otras fechas o rutas; no obliga a que no haya vuelos.
- Seleccionar Business/Premium Economy: por ahora el proveedor no se consulta para esas cabinas. El formulario mantiene la solicitud asistida por WhatsApp.
- Si editas Code.gs después del despliegue, crea una **nueva versión de implementación** en Apps Script.

## Pasos de una futura fase 3 (opcional)

Para análisis estadístico, guardar cada consulta exitosa en Google Sheets con: consulted_at, origin, destination, departure, return_date, airline, price_usd, stops, source. Esto permite construir medianas reales por ruta/mes y graficar tendencias.

**Importante:** consulted_at es cuándo nuestro sistema consultó Aviasales, NO cuándo se encontró originalmente la tarifa. Nunca confundir ambos tiempos.

## Estado técnico

- La clave de Travelpayouts **no** debe almacenarse en archivos públicos.
- Se usa caché de Apps Script 15 minutos por consulta para reducir consumo.
- La página **no** realiza pagos ni emite boletos.
- Antes de cualquier venta, verificar tarifa, equipaje, disponibilidad y reglas tarifarias con el proveedor de emisión.

## Fase 2.1 — Resultados tipo OTA (actualización de octubre de 2026)

Esta actualización conserva el diseño principal de Latam Expeditions y presenta los resultados **debajo del hero**, con filtros funcionales de escalas de ida, límite de precio y aerolíneas; ordenación por precio, escalas o duración (cuando el proveedor la informa), y tarjetas separando IDA y VUELTA.

Se incorporaron campos de Aviasales v3 que antes se descartaban: `departure_at`, `return_at`, `duration_to`, `duration_back`, `return_transfers`, aeropuertos de salida/destino y número de vuelo reportado. La interfaz muestra la hora de **salida** cuando está informada, no inventa horas de llegada ni aeropuertos de escalas. La aerolínea identificada en un registro no garantiza que opere todos los segmentos.

### Acción necesaria después de fusionar los cambios en GitHub

**Muy importante:** actualizar un archivo `Code.gs` en GitHub NO actualiza automáticamente la aplicación de Google Apps Script que ya está implementada.

1. Entra al proyecto **LATAM Flights API** en https://script.google.com/.
2. Abre el archivo `integraciones/vuelos/Code.gs` de la rama principal de GitHub después de la fusión.
3. Reemplaza todo el contenido de `Código.gs` por esa versión actualizada y guarda.
4. En Apps Script abre **Implementar → Gestionar implementaciones**.
5. Selecciona tu implementación actual, pulsa editar (ícono de lápiz) y en **Versión** elige **Nueva versión**.
6. Pulsa **Implementar**. Si se conserva la implementación existente, su URL pública terminada en `/exec` seguirá siendo la misma.
7. Recarga la página de vuelos sin caché y consulta ida y vuelta.

El token privado **TP_API_TOKEN** permanece guardado en las propiedades del script y no tienes que volver a publicarlo.

### Limitaciones importantes

- Esta API ofrece precios históricos/observados (caché), no vuelos con disponibilidad confirmada.
- Los horarios que aparecen son de **salida**; no ofrece itinerarios completos por segmentos, aeropuertos de escala ni equipaje.
- En una búsqueda sin registros no significa que no exista la ruta. La disponibilidad depende de búsquedas previas en Aviasales, fechas, mercado y filtros.
- Los filtros y la clasificación afectan solo a los registros que devuelve la API. **No compara todo el mercado como MyTrip**.
- La web ofrece un botón **Solicitar esta tarifa**, no uno de venta o pago; antes de prometer o cobrar un pasaje debe existir un proveedor de emisión.
- Para autenticar un vuelo con llegada, conexión, equipaje y pago, hará falta Search API aprobada u otro proveedor de inventario y emisión. No se pueden deducir esos datos de esta API.
