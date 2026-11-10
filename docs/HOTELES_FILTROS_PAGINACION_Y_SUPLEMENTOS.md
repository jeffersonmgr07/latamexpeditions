# LATAM Expeditions · Filtros de hoteles, páginas y suplementos
Actualizado 10/11/2026

## Cambios hechos
- `integraciones/vuelos/Code.gs`: devuelve hasta 24 hoteles por página si SerpApi los proporciona; admite hasta tres páginas (hasta ~72 resultados teóricos, con duplicados eliminados). **No es un número garantizado**: depende de lo que Google Hotels devuelva, de la disponibilidad y del `serpapi_pagination.next_page_token`. La primera consulta puede necesitar una segunda solicitud a SerpApi para localizar el hotel incluido.
- Las páginas siguientes requieren tokens de continuación emitidos y almacenados en el caché privado de Apps Script; no se aceptan tokens arbitrarios desde el navegador. Cada nueva página consume otra solicitud a SerpApi cuando no hay caché.
- Se incluye `stars` derivado de `extracted_hotel_class`, separado de `rating` (opiniones). No inventar categoría cuando falta.
- En el modal: búsqueda por nombre, filtro 3★/4★/5★, orden por precio bajo/alto o puntuación, recargo máximo por noche si existe referencia y botón **Mostrar más / Buscar más hoteles**.
- Los precios brutos del proveedor y la referencia interna no se muestran en las tarjetas. Solo suplemento adicional al paquete, cuando se puede calcular.
- Cambio de categoría o habitación oficial borra los resultados anteriores para no comparar con una referencia de otra opción.

## Por qué puede aparecer «Suplemento por confirmar»
Para calcular el **cambio de hotel** hacen falta dos tarifas compatibles:
- Coste del hotel alternativo de Google Hotels para las fechas y grupo.
- **Referencia** del hotel incluido en el paquete, para esa misma ocupación.

La segunda puede venir de una tarifa comparable del proveedor identificada por el mismo nombre del hotel o del **presupuesto interno protegido** que configures en el Apps Script de vuelos/hoteles.

**No se calcula un recargo de USD 0 cuando falta referencia.** El checkout sigue solicitando confirmación y no habilita cobros de servicios dinámicos sin validación de precio en el backend de pagos.

## Propiedad privada opcional de referencias por habitación/noche
Proyecto: **LATAM Flights API** → Configuración del proyecto → Propiedades del script → Añadir propiedad:

Nombre exacto: `HOTEL_REFERENCE_NIGHT_USD`

Valor: objeto JSON con claves `slug-paquete|codigo-categoria|ocupacion` y **el presupuesto real de una habitación por noche en USD**, por ejemplo, SOLO para mostrar el formato:

```json
{
  "medellin-esencial|3e|double": 100,
  "medellin-esencial|3e|matrimonial": 100,
  "medellin-esencial|3e|single": 85,
  "medellin-esencial|4e|double": 140,
  "medellin-esencial|5e|double": 230
}
```

**Advertencia: todos los importes de este ejemplo son ficticios.** NO copies estos valores como si fueran costos de hoteles. Solicita y registra antes las tarifas reales para habitación doble, matrimonial, simple y otras ocupaciones que vendas, con impuestos y desayuno comparables. Si una variante no está cotizada, omite su clave y conserva el estado pendiente.

Reglas:
- Una clave por categoría y **ocupación**; el sistema no aplica una tarifa doble a una habitación simple o triple sin referencia válida.
- El presupuesto no se guarda en el HTML público ni se devuelve directamente al navegador. El servidor devuelve únicamente `supplementTotal` y `supplementPerNight`.
- Atención: aunque el presupuesto no se publica directamente, un cliente técnicamente puede inferir información parcial comparando los suplementos publicados con las tarifas de proveedores disponibles en internet. No usar este mecanismo para datos que deban mantenerse matemáticamente secretos.
- El suplemento observado es **estimativo**. No activa la venta de un hotel no reservado; el backend de PayPal debe recalcular y verificar el importe definitivo antes de cobrarlo.

## Para que funcione en el sitio
1. Actualiza `integraciones/vuelos/Code.gs` en el proyecto **LATAM Flights API**.
2. Verifica que `SERPAPI_KEY` esté presente; si usarás presupuesto privado, añade `HOTEL_REFERENCE_NIGHT_USD` con tus valores reales.
3. **Implementar → Gestionar implementaciones → Editar → Nueva versión → Implementar.** Si mantienes la misma URL /exec no necesitas cambiarla en la web.
4. La ficha `paquetes/medellin-esencial.html` ya tiene scripts actualizados para filtros y paginación. Actualiza página con recarga completa.
5. Prueba 2 adultos, una habitación doble y fecha futura. Verifica precio por noche de suplemento, suplemento total por estancia y filtro por estrellas.
6. Prueba 1 adulto (single) y 2 adultos + 1 niño (edad requerida). Si falta presupuesto de ocupación, mostrar **Suplemento por confirmar**; no asumir 0.
7. Prueba varias páginas y verifica el consumo en SerpApi.
8. No considerar PayPal online habilitado para vuelos u hoteles externos: la autorización del monto desde el backend de reservas sigue pendiente.

## Por qué «Pagar online» está deshabilitado
- La configuración del catálogo puede tener PayPal Live habilitado para paquete base.
- `assets/js/booking.js` desactiva el radio de pago online cuando hay vuelo añadido, cambio de hotel o importe hotelero pendiente.
- En el checkout ahora se muestra el motivo real. **No basta con credenciales Live**: el servidor `backend/Codigo.gs` debe validar un presupuesto congelado de cada vuelo/hotel antes de crear una orden con extras.
- Para probar la conexión PayPal en Sandbox usa las funciones de `backend/PruebasPayPal.gs`; nunca realices una captura Live para probar tarifas dinámicas.

## Estilo del checkout
La regla antigua que aplicaba `border-radius:999px` al contenedor `.booking-pay` se retiró. Las opciones de pago ahora se presentan dentro de un panel rectangular con esquinas redondeadas y tarjetas claras; los botones conservan la identidad verde.
