# LATAM Expeditions · Pago online al 100% con vuelos y hoteles · 10/11/2026

## Estado
Código preparado y publicado en el repositorio. **No se ha desplegado automáticamente en Google Apps Script ni se ha realizado ninguna transacción real.** El sitio público puede seguir funcionando con una implementación anterior hasta que el propietario publique las nuevas versiones de sus dos aplicaciones web.

### Cambios
1. Reservas en `backend/Codigo.gs`: `calcularCobro(total)` cobra el **100%**, `mode=completo`, sin depósitos ni topes de anticipo.
2. `assets/js/booking.js`: calcula el **100%**, prepara la orden antes de abrir el popup PayPal y, si un iframe de Google no devuelve respuesta, consulta por JSONP `paypal_order_status` con el `requestKey` aleatorio y sin PII. La captura sigue ejecutándose solo tras aprobación del comprador y se comprueba contra el Order ID guardado en Sheets.
3. `integraciones/vuelos/Code.gs`: firma cada cotización SerpApi de vuelo, y de hotel con suplemento calculable, usando HMAC SHA-256 con una **clave privada compartida**. Firma válida 30 minutos. No equivale a un boleto emitido o habitación reservada.
4. `backend/Codigo.gs`: verifica firma, integridad de importe, viajeros, fechas, trayectos, hotel, categoría y ocupación. Rechaza cotizaciones caducadas o manipuladas. La orden contiene el paquete base + suplemento de hotel + vuelo y se registra con los detalles operativos para gestión manual.
5. Hotel modal: sin filtro de recargo máximo; nombre, categoría 3/4/5 estrellas y orden por recomendado/precio/valoración, con desplegables corporativos.
6. `paquetes/medellin-esencial.html`: versiones renovadas para evitar archivos antiguos en caché.

## PASO 1 — Actualizar LATAM Flights API

1. Abre tu proyecto Google Apps Script **LATAM Flights API**.
2. Reemplaza únicamente **Code.gs** con `integraciones/vuelos/Code.gs` del repositorio (mantén `FlightRequest.html`, `TripRequest.html` y `DiagnosticoSerpApi.gs` existentes).
3. Confirma que la propiedad `SERPAPI_KEY` esté configurada.
4. Selecciona y ejecuta **`lxPrepararClaveCotizaciones()`** una sola vez.
5. En el registro de ejecución saldrá el valor de **`LATAM_PRICE_QUOTE_KEY`**. Ese valor es SECRETO: cópialo en un gestor de contraseñas; **no compartas capturas del registro ni lo subas al repositorio**. La función también lo guarda automáticamente en las propiedades de este proyecto.
6. Opcional para calcular un suplemento de hotel cuando falta precio del ibis incluido: configura `HOTEL_REFERENCE_NIGHT_USD`, un JSON con valores reales por habitación/noche de cada paquete, categoría y ocupación. Por ejemplo, clave `medellin-esencial|3e|double` y otra `medellin-esencial|3e|single`. **No copies importes ilustrativos como si fueran costos reales.**
7. **Implementar → Gestionar implementaciones → Editar (lápiz) → Versión: Nueva versión → Implementar**. Conservar la implementación existente para no cambiar la URL publicada.

## PASO 2 — Actualizar LATAM – Reservas y Pagos

1. En su proyecto Apps Script, **reemplaza Code.gs** (o `Codigo.gs` de este proyecto) con la versión de `backend/Codigo.gs` de GitHub.
2. Mantén juntos `Cuentas.gs`, `Formularios.gs`, `Operaciones.gs` y, si lo instalaste, `PruebasPayPal.gs`. No reemplaces accidentalmente el Code.gs de Flights.
3. En **Configuración del proyecto → Propiedades del script**, agrega `LATAM_PRICE_QUOTE_KEY` con **exactamente la misma clave** creada en Flights API.
4. Conserva tus propiedades `SHEET_ID`, `NOTIFY_EMAIL`, `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_ENV` y `GOOGLE_CLIENT_ID`. **No compartas PAYPAL_SECRET ni la clave de cotizaciones**.
5. Ejecuta **`pruebaDeInstalacion()`**. Debe mostrar el modo de cobro `completo` en TODOS los ejemplos y la línea `OK Clave compartida de cotización`. PayPal debe autenticar en el entorno correspondiente.
6. **Implementar → Gestionar implementaciones → Editar → Nueva versión → Implementar** en este segundo proyecto; mantén la misma URL `/exec`.
7. Abre el endpoint ya registrado, añadiendo `?action=health`. La nueva versión debe responder algo parecido a:

```json
{"ok":true,"version":"2026-11-10-fullpay-signed-v1","paymentMode":"completo","signedQuotesReady":true}
```

Si no aparece esa versión, NO se ha desplegado correctamente el nuevo backend. Si `signedQuotesReady` es false, verifica la propiedad compartida.

## PASO 3 — Probar sin cobrar dinero real

Recomendado: probar con las credenciales **Sandbox** en una implementación y catálogo de pruebas separados del entorno público Live. Nunca mezclar Client ID Sandbox con Secret Live ni viceversa.

Primera prueba: Medellín Esencial, 2 adultos, categoría 3★, **sin** vuelos extras ni hotel alternativo. Debe cobrar el total del grupo, **USD 598** (según tabla actual), nunca USD 120 o porcentaje parcial. Probar crear orden, aprobar, capturar, código de reserva y una sola fila en Sheets.

Segunda prueba: misma ficha con vuelo firmado (precio observado y recargo comercial del motor) y hotel alternativo con suplemento firmado. El checkout debe sumar **precio base + vuelo + suplemento hotelero**, y el backend debe devolver y guardar ese MISMO importe. Si falta precio comparable para el hotel incluido, no se firma la alternativa; configura el presupuesto de referencia de la ocupación o utiliza hotel incluido.

Tercera prueba: 1 adulto y habitación simple, 2 adultos en doble, 3 viajeros con distribución autorizada; si no existe referencia para esa distribución NO inventar precio.

Cuarta prueba: si PayPal se queda con la ventana en blanco, comprobar la consulta automática a `paypal_order_status` y el estado en la hoja `Ordenes PayPal`. Nunca repetir una captura si la primera quedó pendiente de confirmación.

## PASO 4 — Live

Solo después de completar una transacción Sandbox, verificar las filas `Reservas`, `Ordenes PayPal`, `Detalle Operativo`, `Pasajeros`, `Vuelos` y `Hoteles`, los correos y el caso de doble clic. A continuación, publicar el backend Live con credenciales Live y verificar que el Client ID público del catálogo corresponde a la misma aplicación Live. Los cobros son al 100%; la emisión aérea y la confirmación de hoteles siguen siendo **manuales**.

### Riesgo aceptado por la agencia
Las tarifas SerpApi son **cotizaciones observadas**, no reservas garantizadas. El código firma la observación por 30 minutos, no inmoviliza cupos. La agencia deberá reconfirmar y emitir manualmente con sus proveedores después del pago, y ofrecer una alternativa acordada o la devolución correspondiente si no puede prestar los servicios contratados. El pago de la orden y la confirmación de la emisión son cosas distintas.

### Troubleshooting
- **Se queda en about:blank:** el frontend ahora crea la orden ANTES de abrir PayPal y consulta el estado aunque el iframe de Apps Script no emita el mensaje. Si no hay orden, revisa `Ejecuciones` y `Ordenes PayPal`; no intentes cobros duplicados.
- **No aparece pago online con vuelo/hotel:** actualiza ambos Apps Script, guarda la misma `LATAM_PRICE_QUOTE_KEY` en ambos, vuelve a consultar vuelos/hoteles y recarga la página. Las cotizaciones anteriores no tienen firma.
- **Hotel suplemento por confirmar:** el motor no tiene tarifa comparable del hotel incluido ni referencia configurada en `HOTEL_REFERENCE_NIGHT_USD` para la categoría y ocupación seleccionadas.
- **Error importe no coincide:** revisa la tabla de precios `PRECIOS_PAQUETES` en Reservas y que sea idéntica al precio de venta del paquete del catálogo, y recotiza extras que hayan caducado.
