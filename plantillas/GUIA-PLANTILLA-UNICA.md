# Plantilla única de experiencia o paquete — LATAM Expeditions

La referencia visual es la ficha **Medellín Esencial** (`paquetes/medellin-esencial.html`). En noviembre 2026 se agregó una adaptación común en `assets/js/main.js` y `assets/css/main.css`, que estiliza automáticamente fichas históricas que tengan `<main id="contenido">`, `.detail-grid` o `.detail-layout`, una columna lateral `<aside class="detail-aside">` y un botón de reserva con `data-book`.

## Convención para productos nuevos

Usa siempre la misma estructura:

```html
<main id="contenido">
  <section class="product-hero-clean" style="--lx-hero-img:url('../assets/img/foto-del-destino.jpg')">
    <div class="container">
      <h1>Título comercial de la experiencia</h1>
      <p>Descripción breve de valor al viajero.</p>
    </div>
  </section>
  <section class="section product-detail-section">
    <div class="detail-layout detail-layout--aligned">
      <div class="detail-main">
        <section class="detail-card">
          <h2>Información de la experiencia</h2>
          <div class="lx-unified-facts">
            <div><span>Destino</span><strong>Arequipa, Perú</strong></div>
            <div><span>Duración</span><strong>1 día</strong></div>
            <div><span>Idiomas</span><strong>Español · Inglés</strong></div>
          </div>
        </section>
        <section class="detail-card"><h2>Sobre esta experiencia</h2><p>...</p></section>
        <section class="detail-card"><h2>Itinerario detallado</h2><p>...</p></section>
        <section class="detail-card"><h2>Qué incluye</h2><ul class="detail-list">...</ul></section>
        <section class="detail-card"><h2>No incluye</h2><ul class="detail-list">...</ul></section>
        <section class="detail-card"><h2>Recomendaciones y restricciones</h2><p>...</p></section>
      </div>
      <aside class="detail-aside tour-booking-aside">
        <div class="detail-card tour-booking-card product-booking-card">
          <img src="../assets/img/foto-del-destino.jpg" alt="..." loading="lazy">
          <div class="price-block"><small>Desde</small><strong>USD 99.90</strong><span>por persona</span></div>
          <div class="cta-stack">
            <button type="button" class="btn-primary btn-book"
              data-book="arequipa-ejemplo"
              data-book-kind="experience"
              data-book-title="Tour de ejemplo en Arequipa"
              data-book-price="99.90"
              data-book-country="Perú"
              data-book-duration="1 día"
              data-book-languages='["es","en"]'
            >Reservar ahora</button>
          </div>
        </div>
      </aside>
    </div>
  </section>
</main>
```

**Datos obligatorios por ficha:** `data-book` slug único igual al identificador de `catalog.json`/backend; `data-book-kind="experience"` para excursiones y `"package"` para paquetes; título, precio base, país y duración. El navegador **no es autoridad sobre el precio**, que debe ser confirmado por el servidor.

**Idiomas:** `data-book-languages='["es","en"]'` configura las opciones efectivamente disponibles. Para Brasil, añade `pt` solo si el proveedor confirma guía en portugués; para Italia, `it`. Si se omite, el formulario muestra ES/EN y añade automáticamente portugués para Brasil e italiano para Italia, sujetos a confirmación.

**Paquetes:** añade `data-book-tiers` (JSON con categorías y ocupaciones) y, solo si el paquete tiene destino aéreo inequívoco, `data-book-destination="CUZ"` y `data-book-destination-label="Cusco, Perú"`; incluye `assets/css/package-product-20261108.css` y `assets/js/package-product-20261108.js`. Nunca infieras un único destino aéreo de un itinerario multidestino.

**Recursos comunes:** todas las fichas deben cargar `../assets/css/main.css`, `../assets/js/main.js`, `../assets/js/booking.js` y el catálogo `assets/data/catalog.json` del backend. Prefiere versiones de archivo cache-bust al implementar, para evitar servir JS/CSS antiguos.

**Seguridad y contenidos:** usa fotos autorizadas y optimizadas (idealmente WebP), no muestres al cliente placeholders ni mensajes internos; conserva restricciones, políticas, horarios, accesibilidad e información de entradas. El pasajero titular es siempre obligatorio y para paquetes también lo son todos los demás pasajeros. Verifica coherencia de idiomas, fecha, adulto/niño y documentos en servidor.

El adaptador visual es un paso de migración hacia esta estructura. No reemplaza la necesidad de normalizar los datos y validar cada producto en el catálogo.
