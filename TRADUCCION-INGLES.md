# Traducción al inglés — Latam Expeditions

Este documento resume la traducción al 100 % al inglés y cómo continuar con más idiomas.

## Cómo funciona ahora

El español es el idioma base: vive directamente en el HTML. Cuando el visitante elige otro idioma en el selector, `assets/js/main.js`:

1. Descarga dos diccionarios desde `assets/data/i18n/<idioma>/`:
   - `ui-translations.json` — claves por atributo `data-i18n` (nav, hero, buscador, CTA). Ya existía.
   - `content.json` — **nuevo**: un mapa «texto en español» → «traducción» que cubre **todo el resto del sitio**.
2. Recorre el DOM y sustituye cada nodo de texto, `placeholder`, `aria-label`, `alt`, el `<title>` y los metadatos SEO cuyo texto original en español esté en `content.json`.
3. Guarda los originales, así que volver al español no recarga la página.

Para el contenido que se genera por JavaScript (modal de reserva, tarjetas de «Mis viajes», mensajes de error/PayPal) `booking.js` y `cuentas.js` usan `window.LatamI18n.t()` y `window.LatamI18n.apply()`, expuestos por `main.js`.

## Qué quedó traducido (100 %)

Las 67 páginas de contenido: inicio, experiencias, paquetes, destinos, estilos de viaje, nosotros, contacto, login, registro, mi-reserva, mis-viajes, 404, las **36 páginas de experiencias** y las **19 de paquetes**. Incluye modals, etiquetas, badges, formularios, instrucciones, `alt`, `placeholders`, `aria-labels`, títulos de pestaña, metadatos SEO y los mensajes dinámicos del flujo de reserva y de cuentas.

Verificado con un script que recorre todo el sitio: **0 textos en español** en las páginas traducidas.

## Qué quedó aplazado (según lo acordado)

Las **páginas legales** (`legal.html`: términos, privacidad, cookies, cancelación…) siguen en español porque aún no tienen contenido definitivo. Su barra de navegación y footer **sí** están en inglés. Cuando tengas el texto legal, se traduce igual que el resto (ver abajo).

## Archivos modificados / nuevos

- **Nuevo:** `assets/data/i18n/en/content.json` (1359 entradas).
- **Modificado:** `assets/js/main.js` (motor i18n ampliado), `assets/js/booking.js` y `assets/js/cuentas.js` (traducción de textos dinámicos).
- **Ningún archivo HTML fue modificado** — toda la traducción vive en la carpeta `i18n`, como pediste.

## Cómo añadir el siguiente idioma (p. ej. portugués)

El selector ya incluye PT, FR, DE, IT, JA, ZH. Para completar uno:

1. Copia `assets/data/i18n/en/content.json` a `assets/data/i18n/pt/content.json`.
2. Traduce **solo los valores** (el lado derecho). **No cambies las claves**: deben quedar en español, porque son el texto original que se busca en la página.
3. Opcional: completa `assets/data/i18n/pt/ui-translations.json` (nav/hero/buscador/CTA).

Eso es todo. No hace falta tocar HTML ni JS.

## Cómo mantenerlo

Si en el futuro agregas texto nuevo **en español** al HTML, solo añade su par `"texto en español": "traducción"` en el `content.json` de cada idioma. Si un texto no está en el diccionario, se muestra en español (degradación segura, nunca se rompe).
