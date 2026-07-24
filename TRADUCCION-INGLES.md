# Latam Expeditions — Traducción al inglés + páginas del footer

Resumen de los dos trabajos realizados: (1) traducción al 100 % al inglés y (2) contenido para todas las páginas del footer, ambos bilingües.

## Cómo funciona la traducción

El español es el idioma base: vive directamente en el HTML. Cuando el visitante elige otro idioma, `assets/js/main.js`:

1. Descarga dos diccionarios desde `assets/data/i18n/<idioma>/`:
   - `ui-translations.json` — claves por atributo `data-i18n` (nav, hero, buscador, CTA).
   - `content.json` — **el diccionario grande**: mapea «texto en español» → «traducción» y cubre **todo el resto del sitio**.
2. Recorre el DOM y sustituye cada nodo de texto, `placeholder`, `aria-label`, `alt`, el `<title>` y los metadatos SEO cuyo original en español esté en `content.json`.
3. Guarda los originales, así que volver al español no recarga la página.

El contenido generado por JavaScript (modal de reserva, «Mis viajes», mensajes de error/PayPal) se traduce con `window.LatamI18n.t()` / `.apply()` desde `booking.js` y `cuentas.js`.

## Contenido nuevo en el footer (todo bilingüe)

- **legal.html** — Términos y condiciones, Política de reservas (nueva), Política de cancelación y reembolso, Política de privacidad, Política de cookies y Libro de reclamaciones.
- **nosotros.html** — Nuestro compromiso y Plan de sostenibilidad (secciones ampliadas con ancla propia).
- **contacto.html** — Preguntas frecuentes (ampliadas a 12), Planifica tu viaje, Viajes en grupo o privados, Red de oficinas, Cambios y postergaciones, Agencias y agentes, Conviértete en proveedor y Trabaja con nosotros.
- **destinos.html** — Requisitos por país y Mejor temporada para viajar.

Todos los enlaces del footer se actualizaron para apuntar a la sección correcta (p. ej. `contacto.html#planifica`, `destinos.html#requisitos`, `legal.html#reservas`), en todas las páginas y subpáginas.

> **Importante:** el contenido legal (términos, privacidad, reservas, cookies, reclamaciones) es una plantilla profesional de base y **debe ser revisado por un asesor legal** antes de su publicación definitiva. Está redactado para una operación con sede en Perú.

## Verificación

Un script recorre las 68 páginas y comprueba que, con el idioma en inglés, **no quede ningún texto en español** en ninguna página (incluidas legal y todas las del footer). Resultado: 0 fugas.

## Archivos entregados (solo lo modificado)

- **Nuevos:** `assets/data/i18n/en/content.json` y este documento.
- **Modificados:** `assets/js/main.js`, `assets/js/booking.js`, `assets/js/cuentas.js` y 66 archivos HTML (contenido del footer + enlaces del footer).

Sube estos archivos a tu repositorio respetando las mismas rutas (carpeta `latamexpeditions-main`).

## Cómo añadir el siguiente idioma (p. ej. portugués)

El selector ya incluye PT, FR, DE, IT, JA, ZH. Para completar uno:

1. Copia `assets/data/i18n/en/content.json` a `assets/data/i18n/pt/content.json`.
2. Traduce **solo los valores** (el lado derecho). **No cambies las claves**: deben quedar en español, porque son el texto que se busca en la página.
3. Opcional: completa `assets/data/i18n/pt/ui-translations.json`.

Si en el futuro agregas texto nuevo en español al HTML, solo añade su par `"español": "traducción"` en el `content.json` de cada idioma. Lo que no esté traducido se muestra en español (nunca se rompe).
