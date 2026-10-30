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
