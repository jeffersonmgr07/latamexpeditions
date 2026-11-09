# LATAM Expeditions — Instalación de la búsqueda de vuelos y hoteles (noviembre 2026)

## Qué se ha preparado

La página utiliza **dos servicios independientes**: la API de vuelos/hoteles y el receptor de solicitudes de reserva. No copies dos funciones `doGet` o `doPost` al mismo proyecto Apps Script. No se emiten billetes ni se confirman habitaciones; SerpAPI devuelve **ofertas observadas**, no inventario emitible.

### A. Publicar la API de vuelos y hoteles

1. Abre [script.google.com](https://script.google.com/) e inicia sesión con la cuenta operativa de LATAM Expeditions. Crea el proyecto **LATAM Flights API** o abre el que ya contiene la API actual.
2. Abre el archivo `integraciones/vuelos/Code.gs` del repositorio y **reemplaza el contenido de `Code.gs` del proyecto de vuelos** por el texto completo actualizado. Este código incluye `doGet(e)`, validación de fechas/rutas, caché, Google Flights mediante SerpAPI y hoteles mediante Google Hotels.
3. En **Configuración del proyecto → Propiedades del script**, añade **`SERPAPI_KEY`** con tu clave privada de SerpAPI. Si deseas usar el respaldo de Aviasales histórico, añade `TP_API_TOKEN`; no lo uses como fuente de precios en tiempo real. **Nunca copies tokens ni contraseñas en GitHub, el HTML o `vuelos-config.js`.**
4. En el menú **Implementar → Nueva implementación → Tipo: Aplicación web**, elige **Ejecutar como: Yo** y **Quién tiene acceso: Cualquier persona**, necesario para consultas públicas desde el dominio del sitio. Autoriza los permisos solicitados. En una implementación existente, usa **Gestionar implementaciones → Editar → Nueva versión → Implementar**. Copia la URL que termina en `/exec`.
5. Compara la URL `/exec` publicada con la variable pública `window.LATAM_FLIGHTS_API_URL` en `assets/js/vuelos-config.js`. Modifica esta URL **solo si cambió el ID de despliegue**. No pegues la URL de prueba `/dev`, que requiere ser editor del script.
6. Prueba con **una ruta y fechas futuras**, por ejemplo la consulta JSONP `/exec?origin=LIM&destination=MDE&departure=AAAA-MM-DD&returnDate=AAAA-MM-DD&trip=roundtrip&adults=2&children=0&cabin=economy&callback=latamFlightCb_TEST123`. Sustituye las fechas por valores válidos. Debe aparecer una llamada `latamFlightCb_TEST123(...)` con `ok:true` y `offers` (o `ok:false` y un mensaje controlado), nunca una página de autenticación. Para probar el modal, utiliza la ficha Medellín Esencial y comprueba ida/regreso, logos, escalas y precios.
7. La búsqueda de hoteles toma ahora el **destino validado de cada ficha**, no siempre Medellín. El backend acepta únicamente ciudades incluidas en el mapa `supported` de `searchBundleHotels_`. Para habilitar una ciudad nueva: verifica cobertura, añade su nombre, consulta `q` y código `gl`, y asigna en la ficha `data-book-destination` (IATA) y `data-book-destination-label` (ciudad, país).

### B. Cómo interpretar los precios correctamente

- `offer.price` en el adaptador actual corresponde al **importe de la consulta para todos los pasajeros** (`priceBasis: "party"`), no al precio del vuelo de ida por sí solo.
- El modal calcula el importe orientativo **por persona** dividiendo el total combinado entre los viajeros. Esto es un **promedio**, no una tarifa individual garantizada para niños o adultos. La elección de ida y regreso selecciona una sola combinación completa, que **no se suma dos veces**.
- No muestres `outboundPricePerPerson` o `inboundPricePerPerson` si no se realizaron y verificaron consultas independientes por tramo (Google Flights `type=2`) y no se conocen sus condiciones. Una tarifa ida+vuelta puede ser distinta de la suma de dos billetes de solo ida.
- **Equipaje facturado**: la casilla se oculta mientras la respuesta de proveedor no contenga un suplemento numérico verificable y aplicable a los pasajeros seleccionados. Si deseas ofrecerlo luego, consulta opciones reales por oferta y pasajero; comprueba política de equipaje, moneda, tarifa y disponibilidad antes de sumar.
- Las tarifas son referenciales. Debes volver a comprobarlas con el proveedor antes de cobrar o emitir. **Nunca crees automáticamente reservas, billetes o vouchers a partir de una cotización SerpAPI**.

### C. Reservas y datos de pasajeros: otra implementación distinta

El formulario `assets/js/booking.js` utiliza la URL **`booking.endpoint`** de `assets/data/catalog.json`; no es la misma URL de `vuelos-config.js`. El frontend envía `action=registerPayOnTour` y `payload` mediante un formulario `POST` oculto, y después consulta el acuse con `action=status` / `status_html`. No apuntes ese endpoint a `integraciones/vuelos/Code.gs`, que solo atiende consultas de vuelos/hoteles y formularios de viaje propios.

**Compatibilidad que debes comprobar antes de publicar el nuevo checkout:** el receptor de reservas que está actualmente desplegado debe admitir `holder.firstName`, `holder.lastName`, `holder.tourLanguage`, `passengers[].firstName`, `passengers[].lastName`, `passengers[].pendingDetails` y `tourLanguage` del pedido, conservando `passengers[].name` para sistemas anteriores. En **experiencias**, solo pasajeros 2+ pueden dejar documentos pendientes; **en paquetes todos son obligatorios**. La validación del servidor debe aplicar la misma regla. No basta con validar en JavaScript.

Hay un `backend/Codigo.gs` en el repositorio, pero **su `doPost` y `doGet` no implementan el mismo acuse del flujo de correo del sitio actual**. No lo sustituyas sin migración y pruebas. Ese código además rechaza pasajeros pendientes y los totales que difieren de sus tablas internas; requieren actualización controlada del backend de reservas. El sitio no debe asegurar que los datos están guardados o que los vuelos están confirmados hasta recibir el acuse real.

### D. Seguridad, pruebas y despliegue

- Crea un proyecto de Sheets privado para solicitudes y limita el acceso solo al personal autorizado. Datos de pasaporte, nacimiento, teléfono y correo **nunca** deben colocarse en URL JSONP/GET, logs públicos ni HTML alojado en GitHub. Usa exclusivamente el mecanismo de `POST` previsto por el backend de reservas, y valida campos del lado servidor.
- Conserva el `requestKey` único como clave de idempotencia: si la conexión expira, revisa el estado antes de reenviar. Evita reservas duplicadas.
- Mantén SerpAPI y PayPal en **proyectos/credenciales separados**. El checkout actual mantiene PayPal deshabilitado mientras no esté listo el backend seguro que verifica precios y captura pagos.
- Prueba reservas de 1 adulto, varios adultos, adulto+niño, experiencia con acompañantes pendientes, paquete con datos completos y paquete con vuelo/hotel opcionales. Verifica también vista móvil, cierre de modal, fechas de nacimiento, edad calculada, idioma del tour, email enviado y confirmación.
- El despliegue de Apps Script no se hace automáticamente al modificar GitHub. Después de reemplazar el código debes **crear una nueva versión de la aplicación web**. Hasta entonces la web seguirá consultando la versión antigua.

Referencias oficiales: [Google Apps Script — Web Apps](https://developers.google.com/apps-script/guides/web), [Google Apps Script — PropertiesService](https://developers.google.com/apps-script/reference/properties/properties-service), [SerpAPI Google Flights](https://serpapi.com/google-flights-api), [SerpAPI Google Hotels](https://serpapi.com/google-hotels-api).
