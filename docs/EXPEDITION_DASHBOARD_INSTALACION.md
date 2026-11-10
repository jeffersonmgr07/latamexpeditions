# LATAM Expeditions — Dashboard y Millas Expedition
Actualización del 10 de noviembre de 2026

## Código implementado en GitHub

- mis-viajes.html: nueva área privada con panel, viajes, reservas, millas, recompensas, notificaciones y perfil.
- assets/css/expedition-dashboard.css: estilos responsive.
- assets/js/expedition-dashboard.js: integración de viajes, detalles, saldos, notificaciones y OTP.
- registro.html: bono denominado 100 Millas Expedition.
- backend/ExpeditionDashboard.gs: API de cuenta para Google Apps Script.
- backend/Codigo.gs: nuevas rutas de doPost.

## Instalación obligatoria en Apps Script

Los archivos backend de GitHub no se ejecutan automáticamente con GitHub Pages. La nueva interfaz usa temporalmente la API anterior myTrips si la nueva API todavía no está publicada; no inventa saldos.

1. Abre el proyecto Apps Script que administra RESERVAS, CUENTAS y PayPal de LATAM Expeditions (no la intranet de creación de experiencias).
2. Crea allí un archivo de secuencia de comandos llamado ExpeditionDashboard.gs y copia íntegramente el archivo homónimo de este repositorio.
3. Abre el archivo Code.gs / Codigo.gs que contiene doPost. Busca la ruta de myTrips e inserta debajo las cinco rutas del bloque **Mi Cuenta / Expedition Rewards** que ya están incorporadas a backend/Codigo.gs. Compara antes de reemplazar, para evitar sobrescribir modificaciones de PayPal existentes.
4. Verifica que el proyecto contiene Cuentas.gs y Operaciones.gs; las funciones compartirán el mismo Spreadsheet ID configurado.
5. Ejecuta una vez lxRwInstall_() desde el editor con permisos de administrador. Acepta las autorizaciones de Google Sheets y MailApp. La respuesta debería ser «Expedition Rewards: hojas creadas».
6. En **Implementar → Gestionar implementaciones → Editar → Nueva versión**, publica una nueva versión bajo la misma URL /exec configurada en assets/data/catalog.json, en booking.endpoint.
7. Inicia sesión con una cuenta de prueba y abre https://latamexpeditions.com/mis-viajes.html.

## Hojas de Google Sheets nuevas

- Verificaciones Expedition: correo, fecha de verificación y OTP temporal guardado con hash.
- MillasMovimientos: bono de 100 millas acreditado una sola vez y futuros canjes/ajustes.
- Notificaciones Expedition: avisos de reserva y millas, con estado leído o no leído.

El cálculo de millas por compras proviene de la hoja **Reservas** existente, no del navegador ni de valores inventados. El estado de cuenta incluye los movimientos de compra calculados desde esa fuente y el bono asentado en la hoja MillasMovimientos.

Se leen también los datos existentes de Detalle Operativo, Pasajeros, Vuelos y Hoteles. Opcionalmente, una hoja **Itinerarios**, con columnas en este orden: Código, Día, Fecha, Título, Detalle, Hora. Los itinerarios y documentos no se inventan. La entrega de vouchers protegidos desde el dashboard queda pendiente de integración con el almacenamiento seguro.

## Reglas operativas

- Bono de 100 Millas Expedition al verificar el correo (Google validado u OTP de seis dígitos; 10 minutos de vigencia, máximo cinco intentos y tres envíos por hora).
- Una milla por cada US$10 efectivamente pagados por experiencias, paquetes, vuelos y hoteles.
- La parte sobrante inferior a US$10 se conserva en el cálculo entre compras.
- Las millas de compra permanecen PENDIENTES hasta que el estado de la reserva en Sheets sea REALIZADA, COMPLETADA o FINALIZADA. Confirmar el cumplimiento del servicio antes de cambiarlo.
- Las compras canceladas o reembolsadas no generan millas.
- Los canjes están desactivados hasta definir las equivalencias y limitaciones. No se modifica ningún importe del checkout.
- El pago directo con millas se reservará para experiencias individuales y souvenirs; los cupones podrán tener descuentos en experiencias, paquetes, vuelos y hoteles, bajo sus condiciones.

## Comprobaciones previas al uso real

1. Abrir cuenta y comprobar que solo muestra las reservas de su correo autenticado.
2. Registro por correo sin verificar: cero bonos disponibles.
3. Verificar OTP: aparece un solo bono de 100 incluso después de recargar.
4. Acceder mediante Google validado: bono de bienvenida único.
5. Reserva pagada futura: millas pendientes.
6. Cambiar reserva de prueba a COMPLETADA: millas disponibles.
7. Cancelación/reembolso de prueba: no sumar millas.
8. Rechazar detalle de reserva ajena.
9. Verificar vistas PC y móvil, encabezado, notificaciones y estado de lectura.

## Límites

Se utiliza la autenticación y los pagos actuales. Ninguna URL de documento público fue añadida. Apps Script y Sheets resultan útiles para un primer volumen bajo; para una operación mayor convendría una base de datos transaccional. No considerar habilitado el programa hasta desplegar el código actualizado de Apps Script y probarlo.
