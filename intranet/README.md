# LATAM Expeditions · Consola privada de experiencias

Estado: **MVP implementado en repositorio, NO desplegado en Google**. Este módulo **NO se instala en GitHub Pages**: funciona dentro de Google Apps Script con una hoja de Google Sheets privada y autenticación de Google.

## Funciones disponibles
- Nueva experiencia/paquete con código automático `LEX-EXP-000001` / `LEX-PKG-000001`.
- País → región → ciudad (sugerencias dependientes), título, slug, categorías, idioma y duración.
- Descripciones, destacados, incluidos/excluidos, políticas y SEO.
- Itinerario día a día editable y actividades con hora, título y detalle.
- Hotel, habitación base doble, precios por adulto en doble, costo doble/single por noche (privados).
- Simulación de 1, 2, 3 o 4 adultos; se requiere cotización de uso individual para grupos impares.
- Control de versiones y registro básico de auditoría; exportación pública sin costos ni contactos internos.
- Botón **Importar Atacama 5D/4N**: precarga en BORRADOR a partir de la ficha de 8/11/2026 con hotel Terrantai.

## Instalación: sigue estos pasos

1. Crea una **nueva** hoja de Google Sheets llamada `LATAM - Productos privados`. No la compartas públicamente. Copia su ID de la URL `.../spreadsheets/d/EL_ID/edit`.
2. Abre esta hoja → **Extensiones → Apps Script** y pon el nombre `LATAM - Consola de Experiencias`. **Debe ser otro proyecto, distinto del backend público de reservas o SerpApi**.
3. Copia exactamente los siguientes archivos del repositorio:
   - `intranet/Code.gs` → archivo de script llamado `Code`.
   - `intranet/AtacamaSeed.gs` → archivo de script llamado `AtacamaSeed`.
   - `intranet/Index.html` → archivo HTML llamado `Index` (en el menú **+ → HTML**).
4. Abre **Configuración del proyecto → Propiedades del script**. Crea:
   - `LATAM_ADMIN_SHEET_ID` → ID de la hoja privada.
   - `LATAM_ADMIN_EMAILS` → **tu dirección de correo de Google** con la que iniciarás sesión. Para varios administradores, separa correos con coma. **No uses el correo comercial solo por ser correo de la marca, a menos que sea una cuenta Google desde la que accederás**.
5. Guarda los archivos y autoriza el acceso a Google Sheets cuando Google lo pida.
6. En **Implementar → Nueva implementación → Aplicación web**, selecciona:
   - **Ejecutar como:** Usuario que accede a la aplicación web.
   - **Quién tiene acceso:** Solo yo. Para agregar al equipo posteriormente, revisar sus permisos y usuarios permitidos; nunca seleccionar acceso anónimo.
   - Implementa y abre la URL `/exec` con la cuenta incluida en `LATAM_ADMIN_EMAILS`.
7. Pulsa **Importar Atacama 5D/4N**. Verás `Desierto de Atacama Premium`, 5 días, hotel Terrantai, base 2 adultos, estado BORRADOR. Se asignará automáticamente un código único. La hoja creará `PRODUCTOS_ADMIN` y `AUDITORIA_PRODUCTOS`.
8. Prueba **Guardar cambios**, vuelve a abrir el producto y comprueba que los campos se conservaron. Usa el simulador 1/2/3/4 adultos. Para ocupación impar, sin costo single/doble, debe mostrar `Por cotizar`. No habrá ningún cambio en la web pública.
9. En **Exportación**, genera el JSON público de vista previa. Por seguridad sale sin costos privados y **sin tarifa publicable**, mientras el producto no esté aprobado.

## Hotel Terrantai · validaciones pendientes

- **Dirección:** Tocopilla 411, San Pedro de Atacama, Chile.
- **Categoría:** 4★, habitación Andina matrimonial/twin sujeta a disponibilidad.
- **Fechas piloto:** 22–26/03/2027 (4 noches). Necesitamos cotización oficial para 2 adultos en doble/matrimonial, desayuno e impuestos y otra para una persona sola.
- **Política de menores:** Terrantai admite desde 14 años, pero este programa piloto es 18+ hasta que se revisen excursiones y tarifas.
- **Precio preliminar:** consta únicamente en la ficha Word original; introducirlo en Google Sheets privado cuando se despliegue la consola. No es un precio confirmado con Terrantai ni debe aparecer en el sitio o checkout.
- Para fechas distintas de la piloto, volver a confirmar costos aéreos, hotel, transfers y excursiones.

## Fórmula del simulador (paquetes basados en doble)

Para N adultos:
- habitaciones dobles = `floor(N/2)`
- viajeros en individual = `N % 2`
- `suplementoIndividual = noches × max(0, tarifaSingleNoche - tarifaDobleNoche / 2)`
- `total = N × precioPorAdultoEnDoble + viajerosEnIndividual × suplementoIndividual`

Los dos costos hoteleros son PRIVADOS y se cargan en la consola. Para 1, 3, 5... viajeros, si falta uno de esos costos, mostrar **Pendiente de cotización**, no USD 0. En el futuro se podrán añadir triples/familiares con tarifas de proveedores verificadas.

**Ejemplo matemático, NO cotización de Terrantai:** habitación doble USD 100/noche, single USD 80/noche, 4 noches: recargo individual = `4 × (80 - 100/2) = USD 120`. El sistema suma USD 120 al precio de la persona que viaja sola; dos adultos en doble no reciben ese recargo.

## Qué falta para publicar productos al público

Esta primera versión crea y edita **registros privados**, no genera automáticamente `paquetes/<slug>.html` ni modifica `assets/data/catalog.json`.

Fase siguiente:
1. Validar proveedores, tarifas por ocupación, categoría, vigencia, políticas y licencias de fotos.
2. Aprobar producto tras pasar el control de calidad.
3. Generar ficha pública desde el JSON depurado usando la plantilla HTML **existente** (manteniendo estilos, modales, reservas y SEO).
4. Sincronizar el precio aprobado con el backend seguro de reservas de Google Apps Script. No cobrar basándose en el JSON del navegador.
5. Actualizar GitHub, `catalog.json` y sitemap; probar escritorio/móvil, búsqueda heredada, selección de hotel/vuelos, reserva y emisión.

**Seguridad:** El repositorio GitHub puede ser público. No subas tarifas netas, márgenes, proveedores privados, hojas con documentos personales ni claves API. La ficha semilla pública está sanitizada. Las versiones históricas de Git pueden conservar contenidos que ya se quitaron del archivo actual; conviene auditar el historial antes de usar el repositorio para información sensible.
