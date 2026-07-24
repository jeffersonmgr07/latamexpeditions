# Latam Expeditions — Inglés, páginas del footer, formularios y rediseño

Resumen de todo lo realizado. Todo es **bilingüe** (español base + inglés en `assets/data/i18n/en/content.json`).

## 1. Traducción al inglés (100 %)

El español vive en el HTML. Al elegir otro idioma, `assets/js/main.js` descarga `en/ui-translations.json` (nav/hero) y `en/content.json` (todo lo demás) y traduce el DOM, atributos, `<title>` y metadatos. El contenido dinámico (reservas, cuentas, formularios) se traduce con `window.LatamI18n`. Verificado: **0 textos en español** con el idioma en inglés, en las 82 páginas.

## 2. Páginas del footer (nuevas, dedicadas)

Cada tema tiene ahora su propia página HTML, y el footer apunta a ellas en todo el sitio:

**Legales** (una por tema): `terminos.html`, `politica-reservas.html` (incluye la política de cancelación con ancla `#cancelacion`), `politica-privacidad.html`, `politica-cookies.html`, `libro-reclamaciones.html`. `legal.html` quedó como índice que enlaza a todas.

**Información útil:** `planifica-tu-viaje.html`, `viajes-en-grupo.html`, `requisitos-por-pais.html` (incluye mejor temporada, ancla `#temporada`), `contactar-asesor.html` (red de asesores por destino + contacto directo), `preguntas-frecuentes.html` (respuestas detalladas).

**Empresas y trabajo:** `agencias.html`, `proveedores.html`, `trabaja.html`.

"Sobre nosotros" y "Nuestro compromiso / Plan de sostenibilidad" siguen como secciones ancladas en `nosotros.html`.

> **Importante — revisión legal:** los textos legales (términos, reservas, privacidad, cookies) son una plantilla profesional de base pensada para una operación con sede en Perú y **deben ser revisados por un asesor legal** antes de publicarse. En `libro-reclamaciones.html` reemplaza `[completar con tu RUC]` y `[completar con tu domicilio]` por tus datos reales.

## 3. Formularios → tu correo (Google Apps Script)

Estas páginas tienen formulario y envían a **reservas@latamexpeditions.com**: libro de reclamaciones, agencias, proveedores, cambios y postergaciones, y el formulario de propuesta de `contacto.html`. El envío usa el **mismo** backend de Apps Script que ya usas para reservas (`catalog.json → booking.endpoint`), mediante `assets/js/forms.js`.

**Para activarlo (1 minuto), sigue las instrucciones dentro de `backend/Formularios.gs`:**

1. Copia `backend/Formularios.gs` a tu proyecto de Apps Script.
2. En `doPost()` de `Codigo.gs`, antes de `return json({ ok: false, error: 'Acción no reconocida.' });`, añade:
   ```js
   if (['complaint','agency','supplier','changeRequest','contactLead'].indexOf(action) !== -1)
     return json(enviarFormulario(action, data));
   ```
3. Vuelve a desplegar (Nueva versión). No cambia la URL: es la misma de `catalog.json`.

Mientras el endpoint siga con el texto `PEGAR_AQUI_...`, los formularios mostrarán un mensaje de error controlado. En cuanto pegues tu URL de Apps Script en `catalog.json`, empezarán a enviar correos.

## 4. Rediseño (paleta dorado · negro · verde)

Se añadió un bloque de estilos al final de `assets/css/main.css`: dorado `#C6A15B` para acentos, botones y detalles; fondos marfil cálidos en vez de blanco puro; títulos con más jerarquía (subrayado dorado, verde para encabezados); secciones oscuras para dar ritmo; y componentes nuevos para formularios, pasos y tarjetas de asesor. Es un bloque aditivo: no borra tus estilos anteriores. Si quieres afinar algún color, todo está en las variables `--latam-gold`, `--latam-black`, `--latam-bg-alt` de ese bloque.

## 5. Archivos entregados

**Nuevos (18):** 14 páginas HTML del footer, `assets/data/i18n/en/content.json`, `assets/js/forms.js`, `backend/Formularios.gs` y este documento.
**Modificados (71):** `assets/css/main.css`, `assets/js/main.js`, `assets/js/booking.js`, `assets/js/cuentas.js` y 67 HTML (contenido + enlaces del footer).

Sube todo respetando las rutas (carpeta `latamexpeditions-main`).

## 6. Añadir el siguiente idioma (p. ej. portugués)

1. Copia `assets/data/i18n/en/content.json` a `assets/data/i18n/pt/content.json`.
2. Traduce **solo los valores** (lado derecho). **No cambies las claves** (son el texto en español que se busca en la página).
3. Opcional: completa `assets/data/i18n/pt/ui-translations.json`.

Si agregas texto nuevo en español al HTML, solo añade su par `"español": "traducción"` en el `content.json` de cada idioma. Lo que no esté traducido se muestra en español (nunca se rompe).
