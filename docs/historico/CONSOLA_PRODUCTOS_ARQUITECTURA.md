# LATAM Expeditions · Consola privada de creación de experiencias
Decisiones previas recuperadas: intranet separada del sitio público; formulario Word maestro; creación/edición con estado Borrador → En revisión → Aprobado → Publicado; campos de país → región/departamento/estado → ciudad; códigos `LEX-EXP-000001` y `LEX-PKG-000001`.

## Regla clave
**No cambiar ahora el diseño de la ficha HTML pública**. Mantener las mismas secciones, composición y reserva. La consola almacenará muchos más datos de los que se muestran al cliente.

## Entidades privadas en Google Sheets / backend
- `PRODUCTOS`: productId, código, slug, tipo, título, país, región, ciudad, destino, idioma, categoría, duración, días/noches, modalidad, dificultad, edades, grupo mínimo/máximo, estado, versiones, autor, fecha.
- `CONTENIDO`: título comercial, introducción, puntos destacados, incluidos/excluidos, restricciones, políticas, qué llevar, SEO, slug, traducciones.
- `ITINERARIO`: productId, día, orden, hora, título, descripción, ubicación, servicio, observación; cantidad de días dinámica.
- `VARIANTES_TARIFAS`: productId, fecha/rango, opción, adultos/niños, ocupación, precio público USD, tarifa hotel incluido de referencia (USD por habitación y noche), impuestos, reglas de grupo, moneda, vigencia.
- `ALOJAMIENTOS`: productId, opción, hotel principal, hotel equivalente sin recargo, hotel alternativo, habitaciones, noches, incluido, costos internos; vincular hoteles externos a cotización verificable.
- `VUELOS`: configuración del motor, aeropuertos, equipajes y servicio de emisión manual; precios dinámicos no son inventario reservado.
- `PROVEEDORES`: proveedorId, país, contacto, servicios, condiciones, tarifas netas, documentos y estado. **Privado**.
- `MEDIA`: URLs de fotos aprobadas, orden, créditos, texto alternativo.
- `AUDITORIA`: actor, cambio, fecha, versión, aprobación y publicación.
- `RESERVAS`, `PASAJEROS`, `VUELOS_OPERACIÓN`, `HOTELES_OPERACIÓN`: ventas y emisión manual. Datos personales en hojas protegidas y no públicas.

## Campos que sí necesita la ficha pública
Identificación comercial y destino; duración y modalidad; descripción/atractivos; itinerario por días y horas; incluidos/excluidos; hoteles o categoría prevista; idioma, dificultad, edades y grupo cuando afecten compra; fechas, opciones de habitación y precios finales; condiciones relevantes; fotos; políticas; CTA de reserva.

## Campos que NO necesita la ficha pública
Costo neto, margen, proveedor y su contacto, presupuesto interno por habitación/noche, IDs de contratación, notas del operador, estado de emisión, cuentas PayPal, documentos de pasajeros, auditoría de cambios, credenciales.

## Publicación
1. Personal autorizado entra a la consola (autenticación y lista de roles/usuarios).
2. Crea producto, asigna destino y completa Word maestro como formulario.
3. Guarda **borrador privado**, añade proveedores, costos y fotos.
4. Ejecuta validaciones de tarifas, permisos, idioma, SEO y reserva.
5. Aprueba y publica una **proyección pública sin datos internos**.
6. Generador de páginas (o plantilla dinámica prerenderizada) conserva el HTML actual. Para GitHub Pages, publicar HTML estático por slug junto con JSON público versionado; nunca exponer el Google Sheet privado directamente.
7. Si se modifica precio o habitación: versionar y sincronizar **precio oficial del backend de cobro** antes de permitir PayPal. Los precios públicos no son la fuente de verdad del importe a cobrar.

## Siguiente comprobación
Comparar esta matriz con la plantilla Word que el propietario adjuntará. Generar una tabla: ya disponible en HTML / ausente / solo intranet, antes de tocar las fichas.
