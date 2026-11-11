# QA · LATAM Expeditions, paquete Medellín Esencial (9 nov 2026)

## Casos obligatorios antes de activar pagos
- Entrar desde el buscador de inicio con fecha/2 adultos: debe heredar fecha y cantidad.
- Entrar directamente a /paquetes/medellin-esencial.html: elegir fecha y 1/2/3/4 viajeros en el panel superior móvil.
- Elegir hotel y vuelos, modificar la fecha: regresar a categoría base, sin vuelo, sin hotel externo ni suplementos.
- Elegir hotel y vuelos, modificar adultos o niños: mismo reinicio. No aceptar respuestas de búsquedas anteriores.
- Buscar vuelos manteniendo fecha y viajeros: conservar alojamiento elegido.
- Seleccionar vuelos con llegada en fecha diferente: invalidar hotel previamente cotizado y exigir nueva búsqueda.
- Modal «Reservar ahora» con fecha válida: abre datos del titular y campos del pasajero.
- Modal sin fecha: mostrar validación en el panel del paquete; no permitir pasar a pago sin fecha.
- 1 adulto, 2 adultos, 2 adultos+1 niño: consultar alojamientos. Pedir edad solo si hay niños; proveedor puede requerirla.
- Alojamiento incluido: tarifa del paquete y suplemento por categoría/ocupación conocidos.
- Hoteles externos: suplemento por noche y suplemento total (n noches), nunca mostrar la tarifa bruta del proveedor.
- Si no existe tarifa comparable de hotel incluido: no inventar valores ni habilitar cambios no calculables.
- Móvil: panel de fechas y viajeros antes de vuelos y alojamiento; días del itinerario con etiqueta y título en la misma línea.
- Escalas: tarjetas detalladas con aeropuerto, duración y próximo vuelo cuando exista dato.
- Revisión PayPal: mantener deshabilitado hasta crear/capturar órdenes desde backend y validar montos.

## Notas técnicas
El frontend de reserva usa `assets/js/booking.js` y catálogo `assets/data/catalog.json`.
El selector de producto usa `assets/js/package-product-20261108.js`.
En caso de discrepancia con SerpApi / Google Hotels, verificar respuesta del proveedor y ocupación antes de definir un presupuesto interno.

## Estado
Se comprobó sintaxis JavaScript y consistencia de archivos, pero no se ejecutó un flujo de navegador completo ni pagos reales desde este entorno.
