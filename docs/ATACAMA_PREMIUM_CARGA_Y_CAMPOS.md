# Atacama Premium 5D/4N · comparación entre ficha Word, consola y web

**Origen:** ficha maestra del 08/11/2026 (9 páginas). **Producto distinto de** `chile-atacama-5d4n` (Santiago y Atacama). Slug propio: `desierto-atacama-premium-5d4n`.

## Lo que YA soportan las fichas públicas tipo Medellín Esencial
- Título comercial, país/destino, duración, hero, texto introductorio y SEO.
- Resumen e información esencial, itinerario por día, incluidos y excluidos.
- Categorías de hoteles, tarjetas y precio de paquete por ocupación.
- Selector de fecha y viajeros, vuelos y hoteles opcionales, modalidad de reserva y formulario de pasajeros.

**No hay necesidad de añadir 12 bloques visibles de la ficha Word.** La consola debe ser más completa que el HTML.

## Qué se proyectará al HTML cuando este producto se apruebe
| Ficha Word | Publicar en página | Uso interno exclusivo |
|---|---|---|
| Identidad, ruta y duración | Sí | Código correlativo, control de versiones |
| Descripción corta/general y destacados | Sí | Notas editoriales |
| Itinerario 5 días con hora/título/detalle | Sí, en tarjetas compactas | Detalles y órdenes de operación |
| Incluye/no incluye | Sí | Desglose de costos |
| Hotel Terrantai 4★; doble/matrimonial; 4 noches | Sí, sujeto a disponibilidad | Tarifa doble neta, single y presupuesto/noche |
| Vuelo SCL–CJC–SCL incluido | Sí, si se confirma | Aerolínea, proveedor y costo neto |
| Reglas de edades, altura y fechas | Sí | Verificación de salud y de proveedores |
| Cancelación, feriados y restricciones | Sí, una vez validados | Contratos y penalidades internas |
| Galería y SEO | Sí, tras permisos | Revisión de derechos y pendientes |
| Rentabilidad y comisiones | **No** | Sí |
| Lista de proveedores y contactos | **No** | Sí |
| Auditoría, aprobaciones y checklist | **No** | Sí |

## Hotel base y regla de ocupación
- Hotel **Terrantai**, Tocopilla 411, San Pedro de Atacama; comercialmente 4★.
- Base: **2 adultos / 1 habitación doble o matrimonial**, siempre en nuevas fichas.
- Cuando viaja 1 o 3 adultos, calcular habitación de uso individual si existe precio verificado; no promediar una habitación doble en dos y ofrecer automáticamente ese precio al viajero solo.
- Costos netos de Terrantai para 22–26/03/2027, solo y doble: **SIN CONFIRMAR**. No reemplazar el presupuesto antiguo con precios de buscadores para otros días.
- El Hotel Terrantai recibe huéspedes desde 14 años. El paquete piloto se mantiene 18+.
- Regla futura para tríos/familias: sin tarifa triple verificada, usar 1 doble + 1 individual (para 3), y marcar como pendiente de cotización cuando falten costos.

## Condiciones necesarias antes de publicar
1. Confirmación escrita de tarifas para habitación doble y uso individual en fechas piloto; impuestos, desayuno, cancelación y cupos.
2. Validación de vuelos internos, equipaje, transfer y regreso del 26/03/2027.
3. Confirmar todos los guías en inglés y accesos/entradas.
4. Verificar la actividad astronómica/lunar y seguridad en altura.
5. Fotografías con derechos claros, cancelación/reprogramación y versión EN.
6. Publicar después la ficha en `paquetes/<slug>.html`, indexar en catálogo y sitemap, y sincronizar su precio autorizado con el backend de pagos.
7. Probar la reserva end-to-end sin cobro y PayPal Sandbox. No vender usando solo la cotización referencial del Word.

## Situación actual en GitHub
- `intranet/Code.gs`, `intranet/Index.html`, `intranet/AtacamaSeed.gs` y `intranet/README.md`: implementación inicial.
- El registro Atacama se precarga como **BORRADOR**, sin costos privados ni tarifa comercial final en el archivo público.
- No existe publicación automática ni URL de consola desplegada: se requiere instalar estos archivos en un Google Apps Script **privado** y asociarlo a una hoja propia.
- No sustituir `chile-atacama-5d4n.html`: programa y itinerario distintos.
