# Correcciones Colombia — resumen

Fecha: julio 2026. Base para replicar en otros destinos e idiomas.

## 1. Filtro de Experiencias
- Se eliminó el grupo de filtro **"Destino en Colombia"** de `experiencias.html`.
- Quedan solo **País** y **Estilo de viaje**, que se combinan con lógica **Y** (AND):
  al elegir *Colombia* + *Aventura* se muestran solo los tours que cumplen ambos.
- Verificado: colombia+cultura=18, +naturaleza=13, +aventura=7, +playa=6, +gastronomía=5, +familia=1.

## 2. Tours de Colombia en el listado
- Antes aparecían 8 de 50. Ahora aparecen **los 50**, regenerados desde `assets/data/catalog.json`
  con `data-tags="<estilo> <país>"` para que el filtro funcione.

## 3. Paquetes de Colombia en el listado
- `paquetes.html` mostraba solo 2 (los antiguos). Ahora muestra **los 25**.
- Los enlaces antiguos (`colombia-caribe-4d3n`, `colombia-completo-7d6n`) en `index.html` y
  `paquetes.html` se corrigieron a los nuevos slugs.

## 4. Páginas de paquete (ES + EN) según la plantilla maestra
- Las 25 páginas ES (`paquetes/`) y 25 EN (`en/packages/`) estaban "delgadas" (~6 KB).
  Se reconstruyeron a ~15 KB con las secciones de la **Plantilla Maestra de Paquete**:
  información, destacados, itinerario día a día, **categorías 3★/4★/5★**, incluye/no incluye,
  comidas, transporte, idiomas, información importante, logística y cancelación, más el
  footer completo del sitio y el enlace ES↔EN.
- **No se inventaron hoteles ni precios** (Colombia es "a cotizar"): las categorías muestran
  "hotel previsto o similar" y el CTA es *Solicitar cotización*.

## 5. Traducción de tours al inglés (importante)
- El sitio traduce con un **diccionario en tiempo real**: el español vive en el HTML y, al
  cambiar de idioma, se carga `assets/data/i18n/<idioma>/content.json` y se traduce el DOM.
- **El motor de traducción se había perdido**: el `assets/js/main.js` en uso solo tenía el
  filtrado; el selector de idioma no hacía nada en **todo el sitio**. Se **reconstruyó** el
  motor `window.LatamI18n` dentro de `main.js` (traduce textos, atributos, `<title>` y metadatos;
  guarda la preferencia; expone `.t()` y `.apply()` para el contenido dinámico de reservas).
- Se añadió `main.js` a las 44 páginas de tour que solo cargaban `booking.js`.
- Se agregaron **+1.110 traducciones** al `content.json` (2.215 → 3.325) cubriendo títulos,
  extractos, descripciones, itinerarios, inclusiones y textos operativos de los 50 tours.
  Los nombres propios de lugares se quedan igual (correcto en inglés).

## 6. Indexación y limpieza
- `sitemap.xml`: ya incluye los 50 tours + 25 paquetes ES + 25 EN; se quitaron 2 entradas obsoletas.
- Se corrigieron 44 enlaces rotos a `privacidad.html` → `politica-privacidad.html` y las rutas de
  `en/packages/index.html`. **0 enlaces internos rotos.**
- 14 archivos antiguos duplicados (8 paquetes + 6 tours) se excluyeron del paquete final.

## Cómo continuar

**Otro destino (p. ej. Perú, más tours):**
1. Añade los productos a `assets/data/catalog.json` (con `country`, `region`, `style`, etc.).
2. Regenera las tarjetas de `experiencias.html` / `paquetes.html` (mismo criterio: `data-tags`).
3. Crea las páginas de paquete ES+EN con la plantilla maestra (mismas secciones que Colombia).

**Otro idioma (p. ej. portugués):**
1. Copia `assets/data/i18n/en/content.json` a `assets/data/i18n/pt/content.json`.
2. Traduce **solo los valores** (lado derecho). No cambies las claves (son el texto en español).
3. El selector de idioma ya lo cargará automáticamente. Lo no traducido se muestra en español.

> Nota: los textos legales y los precios son referenciales y deben revisarse/negociarse antes de publicar.
