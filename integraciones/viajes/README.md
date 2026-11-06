# LATAM Expeditions — Personalizador integrado de paquetes

## Flujo comercial

El buscador de la portada ofrece un destino único por ciudad o atractivo turístico; al escribir el país, también ofrece sus ciudades. Incluye punto de partida, fecha exacta, adultos, niños y estilo opcional. La vitrina de paquetes conserva las cards existentes y filtra por país o ciudad. Al abrir una ficha, el viajero ve el botón **Personalizar mi paquete** dentro de esa misma ficha, con la cabecera y los estilos vigentes.

El nuevo personalizador tiene cinco pasos: paquete/fechas → hotel → actividades → vuelos opcionales → resumen y pasajeros. La salida se calcula a partir de las noches indicadas por cada paquete.

Las tarifas hoteleras por categoría provienen del catálogo público propio. También se consultan otros hoteles con Google Hotels a través de SerpApi, mostrando fotos, calificaciones y precios si los devuelve el proveedor. Solo calculamos diferencias si los precios son comparables para las mismas fechas y ocupación. El resto requiere cotización; nunca se inventa un suplemento.

Las actividades opcionales proceden del catálogo de experiencias publicado; se excluyen las visitas ya incluidas en cada itinerario. Los vuelos se obtienen de la API Google Flights/SerpApi existente; el viajero puede escoger ida, regreso, horario, aerolínea, escalas y solicitar equipaje. Las tarifas observadas no confirman plazas y los precios de equipaje deben validarse.

**Cobertura:** 37 paquetes activos de assets/data/catalog.json y sus fichas existentes. Hay 8 páginas históricas fuera del catálogo que requieren homologación de tarifas/categorías antes de integrarlas.

## Archivos

- index.html, assets/js/buscador-paquetes.js, assets/js/home-controls.js, assets/js/inicio-redesign.js y assets/css/main.css: nueva búsqueda de paquetes.
- paquetes.html y assets/js/catalog-search-bridge.js: filtro general y conservación de fechas/personas/origen en enlaces.
- assets/js/main.js: carga el personalizador automáticamente en cada ficha incluida en el catálogo.
- assets/components/paquetes-personalizador.html, assets/js/paquetes-personalizador.js y assets/css/paquetes-personalizador.css: interfaz integrada de cinco pasos con colores actuales (#07873E en llamadas a la acción).
- assets/js/paquetes-sources.js: aeropuertos y consultas a la API existente.
- arma-tu-viaje.html: URL anterior redirigida a la ficha, evitando dos cotizadores inconexos.
- integraciones/vuelos/Code.gs y integraciones/vuelos/UniversalRequest.html: endpoints hoteleros, registro privado y comprobante.

## IMPORTANTE — activar el backend de Google Apps Script

Los cambios de GitHub Pages NO actualizan Apps Script. Para que funcionen los hoteles alternativos y el registro final:

1. Abre LATAM Flights API en https://script.google.com/.
2. Reemplaza completamente el archivo Code.gs con la versión actual de integraciones/vuelos/Code.gs en GitHub.
3. Crea un archivo de tipo HTML en Apps Script llamado exactamente **UniversalRequest**. Copia el contenido de integraciones/vuelos/UniversalRequest.html. Conserva los archivos FlightRequest y TripRequest existentes.
4. Conserva SERPAPI_KEY como propiedad privada del proyecto. No la publiques en GitHub.
5. Si no existe TRIP_REQUEST_SHEET_ID, ejecuta la función **initTripRequestsSheet** una sola vez en Apps Script. Autoriza el acceso a Sheets. No compartas la hoja de pasajeros.
6. Opcional: establece TRIP_REQUEST_NOTIFY_EMAIL con contact@latamexpeditions.com.
7. Implementar → Gestionar implementaciones → editar implementación existente → **Nueva versión** → Implementar. Mantén la URL pública actual de la aplicación web, con ejecución como propietario.
8. Prueba en incógnito el flujo primero sin vuelos y luego con ellos. Verifica que las solicitudes privadas generen un código LXP- y que la hoja reciba el estado **SOLICITUD SIN PAGO NI BILLETE**.

No es necesario crear otra clave de SerpApi. El backend usa la configuración existente.

## Reglas de precio y límites

- Los precios base y las categorías de hotel salen del catálogo propio. Apps Script **recalcula** estos valores desde el catálogo publicado y no confía en los importes de navegador.
- Para niños y hoteles externos, la cotización puede quedar pendiente hasta confirmar la tarifa contractual.
- Para varias ciudades, la sustitución de todos los hoteles no puede calcularse mediante una sola tarifa.
- Las búsquedas de vuelos observados por SerpApi no constituyen una reserva. Las combinaciones de ida y regreso se seleccionan por separado en pantalla, pero para ida/vuelta normal usan un precio conjunto devuelto por el proveedor; las rutas con aeropuertos diferentes usan dos trayectos solo ida.
- Los suplementos por equipaje adicional se cotizan conforme a la aerolínea y no se inventan.
- Hasta 30 días: +10% para vuelo observado; 31 a 45: +5%; 46 a 90: 0%; 91 a 180: −5%; 181 a 270: −10%; 271+: −15%.
- No se activa un cobro PayPal automático hasta validar disponibilidad y condiciones con los proveedores. El comprobante interno no es un ticket ni PNR.
- Se necesitan controles de privacidad, acceso seguro, retención y cuotas de SerpApi antes de procesar documentos reales.

## Pruebas

1. Escribir «Medellín» en Inicio: debe haber una sola sugerencia Medellín, Colombia.
2. Escribir «Colombia»: el país y las ciudades con productos deben aparecer.
3. Escribir «Cusco» o «Machu Picchu»: debe haber un destino único, no uno por paquete.
4. Elegir origen, fecha exacta y 2 adultos; abrir una card y comprobar que se conserva el contexto.
5. Elegir un paquete 4D/3N: la salida debe calcularse 3 noches después de la llegada.
6. Comparar categorías y hoteles. Si faltan tarifas comparables, usar «Pendiente».
7. Agregar experiencias adicionales sin cobrar las incluidas.
8. Buscar y seleccionar vuelos; comprobar itinerarios y precios conjuntos.
9. Enviar solicitud privada y verificar código interno, sin cobro ni emisión.

## Advertencia de seguridad

Se detectó en el encabezado de index.html una referencia a JavaScript externo de un dominio ajeno a los proveedores documentados de la web. Se eliminó preventivamente. Conviene revisar permisos de GitHub y publicaciones recientes si esa referencia no fue autorizada.
