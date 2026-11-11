# Bitácora · 2026-11-11 · Reserva y hotel seleccionado al cambiar vuelos

## Problemas reportados
- Algunos formularios mostraban errores al abrir o capturar datos de los viajeros; casos de 2 adultos o 2 adultos + 1 niño.
- Un hotel elegido desaparecía tras seleccionar un vuelo con llegada en fecha diferente.
- Se solicitó coherencia entre importe visible y cobro PayPal.

## Investigación del código existente
- `assets/js/booking.js` genera el formulario en `buildPassengers()`, aplica selectores y calendarios personalizados antes de continuar, usa `saveStep2()` para crear `state.passengers`, y calcula el resumen con `state.total`.
- `assets/js/package-product-20261108.js` invocaba `resetSelections()` cuando el vuelo elegido cambiaba la fecha real de llegada. Eso descartaba la selección hotelera sin conservar siquiera el nombre.
- `backend/Codigo.gs` valida en servidor las tarifas de paquetes, cantidad de pasajeros, vuelos y hoteles firmados y montos cotizados, antes de órdenes PayPal. No se modificaron las operaciones de captura/cobro.

## Cambio en frontend
1. La decoración de listas y calendarios de pasajeros ya no puede bloquear la reserva: hay una ruta de recuperación con campos nativos, y la cuenta de formularios se compara con adultos+niños.
2. `saveStep2()` solo lee viajeros del modal `#bkPaxList`; si hay inconsistencia, muestra error y detiene el paso en lugar de enviar datos incompletos.
3. Al cambiar fecha de llegada por un vuelo, se conserva la **preferencia hotelera** junto con su nombre y configuración, pero se destruyen montos y tokens anteriores; el hotel se marca `pending` y `hotelQuotePending` para nueva cotización. El suplemento antiguo se convierte en cero, no se cobra automáticamente.
4. Se actualizó caché de scripts en fichas clave (Atacama, Santiago+Atacama, Medellín, Cusco y Machu Picchu).

## Qué queda pendiente
- QA real en Android/PC y reproducción del error original con los datos específicos reportados.
- Asegurar que cambios de ocupación en distintas combinaciones de edades/habitaciones produzcan tarifas correctas en cliente/servidor.
- Reconciliación de `createOrder`/`captureOrder` en sandbox sin cobro a terceros.
- Publicación y prueba de las mini APIs Apps Script en las versiones actuales.
- No confundir un hotel guardado en pantalla como preferencia con una reserva hotelera confirmada.
