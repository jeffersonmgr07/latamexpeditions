# Atacama Premium 5D/4N · Estudio preliminar de costos y publicación comercial
Fecha de análisis: 10 noviembre 2026. **Estas cifras NO son tarifas netas contratadas ni garantizan margen**.
Paquete piloto: 22–26 marzo 2027, 4 noches, 2 adultos en Andina doble/twin Terrantai, vuelos NO incluidos.

## Fuentes de referencia
- Hotel Terrantai oficial: https://terrantai.com/es/ y https://terrantai.com/es/habitaciones/; la habitación Andina ofrece cama king o twin y desayuno incluido; pedir tarifa 22–26/03/2027, festivo y política de cancelación.
- Promedio mercado de Terrantai en marzo: https://www.vio.com/Hotel/1716746/es (aprox. US$329/noche); cotización de ejemplo mayorista orientativa https://www.scbtravel.com/es/hotel/terrantai-spa ~USD 370 por doble/noche, sujeto a disponibilidad; **USD 370 es HIPÓTESIS presupuestaria, no tarifa confirmada**.
- Tours 6 componentes: https://viajandochile.com/planifica/mejores-tours-san-pedro-de-atacama CLP 37.900 Luna, 45.000 Arcoíris, 70.000 Piedras Rojas, 50.000 El Tatio, 45.000 Cejar, 40.000 astronómico = CLP 287.900/persona antes de entradas; presupuesto redondeado USD 300/persona, la sesión nocturna tendrá que ser ASTROLUNAR por luna llena.
- Entradas estimadas CLP 85.800/persona, aprox. USD 89. Se incluyen por hipótesis de presupuesto, verificar administrador y operador.
- Transfers https://transferpampa.cl/ CLP 34.000 por persona ida y vuelta; presupuesto aprox. USD 35/persona.
- Tipo de cambio de trabajo CLP 970/USD (10/11/2026 aprox.); tasa real de emisión y comisiones puede variar.
- 26/03/2027 Viernes Santo (feriado): https://www.feriados.cl/2027.php
- 22/03/2027 luna llena / tour astrolunar condicionado: https://www.bajolanochedeatacama.com/services-7 y https://atacamastargazingtour.com/atacama-stargazing-full-moon/

## Presupuesto operativo para DOS adultos (USD)
| Concepto | Cálculo | Costo estimado USD |
|---|---|---:|
| Hotel Terrantai 4 noches doble | 4 x 370 | 1,480 |
| Excursiones compartidas + actividad lunar | 2 x 300 | 600 |
| Entradas previstas | 2 x 89 | 178 |
| Transfers CJC-San Pedro-CJC | 2 x 35 | 70 |
| Fondo de contingencia operativa | estimación | 130 |
| Comisión de cobro y redondeos | estimación 5% grupo | 150 |
| **Costo estimado del grupo** | | **2,608** |
| **Precio comercial orientativo del grupo** | 2 x US$1,499.90 | **2,999.80** |
| **Margen esperado para DOS** | 2,999.80 - 2,608 | **391.80** |
| **Margen esperado por persona** | 391.80 / 2 | **195.90** |

Este escenario supera la meta de US$50/persona **solo bajo las hipótesis indicadas**. Si sube el costo del hotel en US$73/noche (4 noches), quedaría ~US$50/persona antes de cambios en otros costos. Por tanto, no prometer rentabilidad mínima sin cotizaciones firmes. No se incluyeron vuelos en costo base, oferta ni subtotal. No se ha asignado tarifa **single** sin comprobación de proveedor.

## Datos ya actualizados en GitHub
- `intranet/AtacamaSeed.gs`: contenido y vuelos cambiados a **opcionales**; hotel Terrantai, ficha, términos y luna llena.
- `intranet/Code.gs`: método **`lxAplicarEstudioAtacama()`**, que conserva el ID y código del producto previamente importado, pone cifras internas en la Sheet privada y fija el estado `PUBLICADO_COTIZACION`.
- `intranet/Index.html`: botón **Completar costos de Atacama** para ejecutar ese método sin crear un nuevo archivo .gs por cada paquete.
- `paquetes/desierto-atacama-premium-5d4n.html`: ficha pública de consulta, diseñada con estilos actuales y motor opcional de vuelos a **CJC**.
- `paquetes.html`: tarjeta de producto en el catálogo público.
- `assets/data/catalog.json`: registro del producto, 4★ y vuelos opcionales, `quoteOnly=true`.
- `backend/Codigo.gs`: tarifa base referencial conocida para registrar solicitudes, pero `crearOrden` rechaza PayPal específicamente para este slug hasta validar proveedores; otros productos no cambian de estado.
- `assets/js/booking.js`: el botón PayPal no aparece disponible para fichas `data-book-quote-only=true`.
- `sitemap.xml`: URL de la nueva ficha.

## Qué debe hacer el propietario ahora
1. En **LATAM – Consola de Experiencias**, sustituir **Code.gs**, **AtacamaSeed.gs** e **Index.html** por las versiones más recientes de GitHub; guardar y crear una nueva versión de la aplicación web existente.
2. En la consola, abrir **Desierto de Atacama Premium** ya importado y pulsar **Completar costos de Atacama**. Confirmar la advertencia. El método actualiza el producto en el mismo Google Sheet, sin crear otra ficha. Estado `PUBLICADO_COTIZACION`, costos internos y precio preliminar US$1499.90 por adulto en doble. **No marcar aprobaciones sin prueba**.
3. En **LATAM – Reservas y Pagos**, sustituir el archivo principal `Code.gs` por `backend/Codigo.gs` actualizado de GitHub, conservar Cuentas/Formularios/Operaciones y publicar nueva versión. Esto permite registrar las solicitudes del nuevo slug, sin cobros hasta aprobación.
4. La página web pública, la ficha y tarjeta ya están en GitHub. Verificar propagación GitHub Pages y abrir: https://latamexpeditions.com/paquetes/desierto-atacama-premium-5d4n.html
5. Verificar que dos adultos ven USD 2,999.80 referencial sin vuelo, que pueden buscar LIM/CUZ/SCL → CJC opcional, que la solicitud **sin pago** crea registro y llega al correo (sin convertirlo en emisión). Verificar en móvil.
6. Pedir cotización oficial de **doble y single** a Terrantai, guías en inglés, servicios, entradas, lunas, feriados y términos, para definir fecha y condiciones. Solo entonces marcar los checks reales y APROBADO para ventas. **APROBADO no activa cobro automático en el flujo de este MVP**: hay que retirar explícitamente los bloqueos quote-only en frontend y backend después de comparar precios.

## Limitación de la consola actual
**Guardar** escribe en Sheets, **no genera automáticamente** HTML, cambios de catalog.json ni modifica precios del backend. El Atacama se publicó en GitHub como piloto gestionado por el equipo. Para autopublicar futuras experiencias, sigue pendiente implementar un publicador seguro autenticado con GitHub con revisión, generación de páginas, sincronización de catálogo y precios, rollback y confirmación de reservas.

No guardar tokens de GitHub en el HTML público ni conceder permisos anónimos a la consola.
