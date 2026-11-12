/* =========================================================================
   Latam Expeditions — i18n, navegación, selector de país y filtros
   ========================================================================= */
(function () {
  'use strict';

  const DEFAULT = 'es';
  const SUPPORTED = ['es', 'en', 'pt', 'fr', 'de', 'it', 'ja', 'zh'];
  let lang = DEFAULT;
  const content = {};
  const ui = {};
  let cache = null;
  const originalTextNodes = new WeakMap();
  const originalAttributes = new WeakMap();
  const originalTitle = document.title;

  function rememberText(node) {
    if (!originalTextNodes.has(node)) originalTextNodes.set(node, node.nodeValue);
    return originalTextNodes.get(node);
  }

  function rememberAttribute(el, attr) {
    let attrs = originalAttributes.get(el);
    if (!attrs) { attrs = new Map(); originalAttributes.set(el, attrs); }
    if (!attrs.has(attr)) attrs.set(attr, el.getAttribute(attr));
    return attrs.get(attr);
  }

  const script = document.querySelector('script[src$="assets/js/main.js"]');
  const base = document.documentElement.dataset.base || (script ? (script.getAttribute('src') || '').replace(/assets\/js\/main\.js.*$/, '') : './');
  const store = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
  const read = (key, fallback = '') => { try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; } };
  const nested = (obj, key) => key.split('.').reduce((acc, part) => (acc && acc[part] != null ? acc[part] : null), obj || {});
  const dictionary = (code) => content[code] || {};

  function buildCache() {
    cache = { texts: [], attrs: [], metas: [], uiEls: [], direct: [], title: originalTitle };

    document.querySelectorAll('[data-en]').forEach((el) => {
      if (!el.dataset.esText) el.dataset.esText = el.textContent;
      cache.direct.push({ el, es: el.dataset.esText, en: el.getAttribute('data-en') || el.dataset.esText });
    });

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (/^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.closest('[data-en], [data-i18n]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node;
    while ((node = walker.nextNode())) cache.texts.push({ node, orig: rememberText(node) });

    ['placeholder', 'title', 'alt', 'aria-label'].forEach((attr) => {
      document.querySelectorAll(`[${attr}]`).forEach((el) => {
        const value = rememberAttribute(el, attr);
        if (value && value.trim()) cache.attrs.push({ el, attr, orig: value });
      });
    });

    document.querySelectorAll('[data-en-alt]').forEach((el) => {
      el.dataset.esAlt = el.getAttribute('alt') || '';
    });

    document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[property="og:title"],meta[name="twitter:description"],meta[name="twitter:title"]').forEach((el) => {
      const value = rememberAttribute(el, 'content');
      if (value && value.trim()) cache.metas.push({ el, orig: value });
    });

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      if (!el.dataset.i18nOrig) el.dataset.i18nOrig = el.textContent;
      cache.uiEls.push({ el, key: el.getAttribute('data-i18n'), orig: el.dataset.i18nOrig });
    });
  }

  function translateText(original, code) {
    if (code === DEFAULT) return original;
    const key = String(original).trim();
    const value = dictionary(code)[key];
    return value != null ? String(original).replace(key, value) : original;
  }

  function applyLang(code) {
    if (!cache) buildCache();
    const isDefault = code === DEFAULT;

    cache.direct.forEach(({ el, es, en }) => { el.textContent = code === 'en' ? en : es; });
    document.querySelectorAll('[data-en-alt]').forEach((el) => {
      el.setAttribute('alt', code === 'en' ? (el.getAttribute('data-en-alt') || el.dataset.esAlt || '') : (el.dataset.esAlt || ''));
    });
    cache.texts.forEach((item) => { item.node.nodeValue = isDefault ? item.orig : translateText(item.orig, code); });
    cache.uiEls.forEach((item) => {
      const translated = nested(ui[code], item.key);
      item.el.textContent = isDefault ? item.orig : (translated != null ? translated : translateText(item.orig, code));
    });
    cache.attrs.forEach((item) => {
      if (item.el.hasAttribute('data-en-alt') && item.attr === 'alt') return;
      item.el.setAttribute(item.attr, isDefault ? item.orig : translateText(item.orig, code));
    });
    cache.metas.forEach((item) => item.el.setAttribute('content', isDefault ? item.orig : translateText(item.orig, code)));
    document.title = isDefault ? cache.title : translateText(cache.title, code);
    document.documentElement.lang = code;
    document.dispatchEvent(new CustomEvent('latam:languagechange', { detail: { lang: code } }));
  }

  function load(code) {
    if (code === DEFAULT || content[code] !== undefined) return Promise.resolve();
    return Promise.all([
      fetch(`${base}assets/data/i18n/${code}/content.json`).then((r) => r.ok ? r.json() : {}).catch(() => ({})),
      fetch(`${base}assets/data/i18n/${code}/ui-translations.json`).then((r) => r.ok ? r.json() : {}).catch(() => ({}))
    ]).then(([dict, uiDict]) => { content[code] = dict; ui[code] = uiDict; });
  }

  function setLanguage(code) {
    if (!SUPPORTED.includes(code)) code = DEFAULT;
    lang = code;
    store('latam_lang', code);
    return load(code).then(() => applyLang(code));
  }

  window.LatamI18n = {
    t(text) {
      if (lang === DEFAULT) return text;
      return dictionary(lang)[String(text).trim()] || text;
    },
    apply(root) {
      if (!root) return;
      root.querySelectorAll?.('[data-en]').forEach((el) => {
        if (!el.dataset.esText) el.dataset.esText = el.textContent;
        el.textContent = lang === 'en' ? (el.getAttribute('data-en') || el.dataset.esText) : el.dataset.esText;
      });
      root.querySelectorAll?.('[data-en-alt]').forEach((el) => {
        if (!el.dataset.esAlt) el.dataset.esAlt = el.getAttribute('alt') || '';
        el.setAttribute('alt', lang === 'en' ? (el.getAttribute('data-en-alt') || el.dataset.esAlt) : el.dataset.esAlt);
      });
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!node.nodeValue?.trim() || !parent || parent.closest('[data-en], [data-i18n]') || /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      let node;
      while ((node = walker.nextNode())) {
        const original = rememberText(node);
        node.nodeValue = lang === DEFAULT ? original : translateText(original, lang);
      }
      ['placeholder', 'title', 'alt', 'aria-label'].forEach((attr) => {
        root.querySelectorAll?.(`[${attr}]`).forEach((el) => {
          if (el.hasAttribute('data-en-alt') && attr === 'alt') return;
          const original = rememberAttribute(el, attr);
          if (original != null) el.setAttribute(attr, lang === DEFAULT ? original : translateText(original, lang));
        });
      });
    },
    lang: () => lang,
    set: setLanguage,
    invalidate() { cache = null; }
  };

  function setupNavigation() {
    const navToggle = document.getElementById('navToggle');
    const mobileNav = document.getElementById('mobileNav');
    const closeNav = () => {
      if (!mobileNav) return;
      mobileNav.classList.remove('is-open');
      navToggle?.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    };
    navToggle?.addEventListener('click', () => {
      const open = !mobileNav?.classList.contains('is-open');
      mobileNav?.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-open', open);
    });
    // Delegación: también cierra enlaces generados después del DOMContentLoaded.
    mobileNav?.addEventListener('click', (e) => {
      if (e.target === mobileNav || e.target.closest('[data-close-nav]')) closeNav();
    });

    const loginMenu = document.querySelector('.login-menu');
    const loginToggle = loginMenu?.querySelector('.login-toggle');
    const loginDropdown = loginMenu?.querySelector('.login-dropdown');
    const closeLogin = () => {
      loginMenu?.classList.remove('is-open');
      loginToggle?.setAttribute('aria-expanded', 'false');
    };
    loginToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !loginMenu.classList.contains('is-open');
      loginMenu.classList.toggle('is-open', open);
      loginToggle.setAttribute('aria-expanded', String(open));
    });
    loginDropdown?.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', closeLogin);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeNav(); closeLogin(); } });
  }

  function setupCountrySelector() {
    const modal = document.getElementById('countryModal');
    if (!modal) return;
    const label = document.getElementById('countryLabel');
    const bar = document.getElementById('countryBar');
    const barName = document.getElementById('countryBarName');
    const barFlag = document.getElementById('countryBarFlag');
    const search = document.getElementById('countrySearch');
    const flags = { 'Perú':'🇵🇪','Colombia':'🇨🇴','Chile':'🇨🇱','Argentina':'🇦🇷','Bolivia':'🇧🇴','Brasil':'🇧🇷','Ecuador':'🇪🇨','México':'🇲🇽','Venezuela':'🇻🇪','Uruguay':'🇺🇾','Costa Rica':'🇨🇷','Otro país':'🌎' };
    let lastFocused = null;

    const open = () => {
      lastFocused = document.activeElement;
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      search?.focus();
    };
    const close = () => {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      lastFocused?.focus?.();
    };
    const showCountry = (country, showBar = true) => {
      if (!country) return;
      if (label) label.textContent = country;
      if (barName) barName.textContent = country;
      if (barFlag) barFlag.textContent = flags[country] || '🌎';
      if (bar && showBar && sessionStorage.getItem('latam_country_bar_hidden') !== '1') bar.classList.add('is-visible');
      document.documentElement.dataset.country = country;
    };

    document.querySelectorAll('[data-open-country], [data-change-country]').forEach((el) => el.addEventListener('click', open));
    document.querySelectorAll('[data-close-country]').forEach((el) => el.addEventListener('click', close));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.querySelectorAll('.country-option').forEach((option) => option.addEventListener('click', () => {
      const country = option.dataset.country || option.textContent.trim();
      store('latam_country', country);
      sessionStorage.removeItem('latam_country_bar_hidden');
      showCountry(country, true);
      close();
      document.dispatchEvent(new CustomEvent('latam:countrychange', { detail: { country } }));
    }));
    search?.addEventListener('input', () => {
      const q = search.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      document.querySelectorAll('.country-option').forEach((option) => {
        const value = option.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        option.hidden = !value.includes(q);
      });
    });
    document.querySelector('[data-dismiss-bar]')?.addEventListener('click', () => {
      bar?.classList.remove('is-visible');
      sessionStorage.setItem('latam_country_bar_hidden', '1');
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) close(); });

    const selected = read('latam_country');
    if (selected) showCountry(selected, false);
  }

  function setupFilters() {
    const norm = (value) => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    document.querySelectorAll('[data-filterable]').forEach((root) => {
      const cards = [...root.querySelectorAll('.trip-card')];
      const groups = [...root.querySelectorAll('[data-filter-group]')];
      const count = root.querySelector('#resultsCount');
      const empty = root.querySelector('#emptyState');
      const reset = root.querySelector('#filterReset');
      const active = {};
      const searchParams = new URLSearchParams(location.search);
      const isPackageCatalog = root.classList.contains('lx-results-catalog');
      const requestedCountry = isPackageCatalog ? norm(searchParams.get('destino') || '') : '';
      const requestedCity = isPackageCatalog ? norm(searchParams.get('ciudad') || '') : '';
      // Legacy URLs can include ?estilo=romantico, but that filter is no longer
      // part of the package search and must never hide otherwise valid trips.
      const requestedStyle = isPackageCatalog ? '' : norm(searchParams.get('estilo') || '');
      const cardText = card => norm((card.querySelector('h3')?.textContent || '') + ' ' +
        (card.querySelector('.meta')?.textContent || '') + ' ' +
        (card.querySelector('p')?.textContent || ''));
      const countryOK = card => !requestedCountry ||
        (card.dataset.tags || '').split(/\s+/).includes(requestedCountry);
      const cityOK = card => !requestedCity || cardText(card).includes(requestedCity) ||
        (requestedCity === 'machu-picchu' && cardText(card).includes('cusco'));
      const exactCityExists = !requestedCity || cards.some(card => countryOK(card) && cityOK(card));
      const apply = () => {
        let visible = 0;
        cards.forEach((card) => {
          const tags = (card.dataset.tags || '').split(/\s+/).filter(Boolean);
          const matchCity = !requestedCity || !exactCityExists || cityOK(card);
          const matchStyle = !requestedStyle || tags.includes(requestedStyle);
          const ok = countryOK(card) && matchCity && matchStyle &&
            Object.values(active).every(value => !value || tags.includes(value));
          card.hidden = !ok;
          if (ok) visible += 1;
        });
        if(isPackageCatalog) root.dataset.searchFallback = requestedCity && !exactCityExists ? 'true' : 'false';
        if (count) count.textContent = `${visible} ${document.documentElement.lang === 'en' ? 'results' : 'resultados'}`;
        if (empty) empty.hidden = visible > 0;
        if (reset) reset.hidden = !Object.values(active).some(Boolean);
      };
      groups.forEach((group) => {
        const key = group.dataset.filterGroup;
        group.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
          const value = button.dataset.filter;
          active[key] = active[key] === value ? '' : value;
          group.querySelectorAll('[data-filter]').forEach((item) => {
            const on = item.dataset.filter === active[key];
            item.classList.toggle('is-active', on);
            item.setAttribute('aria-pressed', String(on));
          });
          apply();
        }));
      });
      reset?.addEventListener('click', () => {
        Object.keys(active).forEach((key) => { active[key] = ''; });
        root.querySelectorAll('[data-filter]').forEach((item) => { item.classList.remove('is-active'); item.setAttribute('aria-pressed', 'false'); });
        apply();
      });
      const params = new URLSearchParams(location.search);
      groups.forEach((group) => {
        const key = group.dataset.filterGroup;
        const value = params.get(group.dataset.filterParam);
        if (!value) return;
        active[key] = norm(value);
        const button = group.querySelector(`[data-filter="${CSS.escape(norm(value))}"]`);
        button?.classList.add('is-active');
        button?.setAttribute('aria-pressed', 'true');
      });
      apply();
    });

    const form = document.querySelector('#tripSearch, .hero-search form, form.search-form');
    const destination = document.querySelector('#searchDestination');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = destination?.value;
      if (!value) return;
      const country = ['peru','chile','ecuador','colombia','argentina','brasil','bolivia','mexico','costa-rica','uruguay','venezuela'].includes(value);
      location.href = `${base}experiencias.html?${country ? 'destino' : 'ciudad'}=${encodeURIComponent(value)}`;
    });
  }

  // Foto de cabecera en todas las fichas de experiencias.
  // Conserva la imagen de la ficha (og:image) en móvil. Si existe una
  // versión -panoramica con el mismo nombre, la utiliza solamente en PC.
  function setupExperienceHeroImage() {
    const hero = document.querySelector('.experience-hero-clean');
    const imageMeta = document.querySelector('meta[property="og:image"]');
    if (!hero || !imageMeta?.content) return;

    let photo;
    try {
      const original = new URL(imageMeta.content, location.href);
      // Solo permitimos imágenes del propio proyecto, también en vista previa local.
      if (original.origin !== location.origin &&
          !['latamexpeditions.com', 'www.latamexpeditions.com'].includes(original.hostname)) return;
      if (!original.pathname.startsWith('/assets/img/')) return;
      photo = new URL(original.pathname, location.origin);
    } catch (_) { return; }

    const cssUrl = (url) => `url("${url.href}")`;
    hero.style.setProperty('--experience-photo-mobile', cssUrl(photo));

    const match = photo.pathname.match(/^(.*)(\.(?:jpg|jpeg|png|webp))$/i);
    if (!match) return;
    const panorama = new URL(`${match[1]}-panoramica${match[2]}`, location.origin);
    const desktopQuery = window.matchMedia('(min-width: 761px)');
    let panoramaChecked = false;

    function loadPanorama() {
      if (panoramaChecked || !desktopQuery.matches) return;
      panoramaChecked = true;
      const preload = new Image();
      preload.onload = () => hero.style.setProperty('--experience-photo-desktop', cssUrl(panorama));
      // Si no hay archivo panorámico, la imagen normal sigue funcionando.
      preload.onerror = () => {};
      preload.src = panorama.href;
    }
    loadPanorama();
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', loadPanorama);
    else if (desktopQuery.addListener) desktopQuery.addListener(loadPanorama);
  }

  // Navegación coherente en todas las páginas (incluidas fichas anidadas).
  // Las rutas se resuelven con data-base para conservar enlaces existentes.
  function applyModernNavigation() {
    const items=[
      ['Paquetes','paquetes.html','fa-suitcase-rolling'],['Ofertas','index.html?tab=ofertas#explorar','fa-tags'],
      ['Vuelos','vuelos.html','fa-plane'],['Hoteles','index.html?tab=hoteles#explorar','fa-bed']
    ];
    const header=document.querySelector('header.topbar');
    const nav=header?.querySelector('.nav');
    if(header&&nav){
      const tools=document.createElement('div');tools.className='header-utility';
      [
        ['Para ventas: +51 906 472 060','https://wa.me/51906472060','fa-brands fa-whatsapp']
      ].forEach(([label,href,icon])=>{
        const a=document.createElement('a');a.className='header-utility__link';
        a.href=href;a.target='_blank';a.rel='noopener noreferrer';const i=document.createElement('i');i.className=icon;
        i.setAttribute('aria-hidden','true');a.append(i,document.createTextNode(label));tools.append(a);
      });
      nav.replaceWith(tools);
      // La portada ya posee pestañas funcionales; las páginas interiores solo enlaces.
      if(!document.querySelector('.home-product-nav')) {
        const bar=document.createElement('nav');bar.className='home-product-nav home-product-nav--links';
        bar.setAttribute('aria-label','Servicios de viaje');
        const inner=document.createElement('div');inner.className='home-product-nav__inner';
        items.forEach(([label,href,icon])=>{
          const a=document.createElement('a');a.href=base+href;a.className='home-product-tab';
          const i=document.createElement('i');i.className='fa-solid '+icon;i.setAttribute('aria-hidden','true');
          a.append(i,document.createTextNode(label));
          if(location.pathname.endsWith('/'+href)){a.classList.add('is-active');a.setAttribute('aria-current','page');}
          inner.append(a);
        });
        bar.append(inner);header.after(bar);
      }
    }
    const panel=document.querySelector('#mobileNav .mobile-nav__panel');
    if(panel){
      // El menú móvil se construye exclusivamente en initPeruNatureHeader.
      // Eliminar la navegación histórica, sin volver a insertar enlaces duplicados.
      panel.querySelectorAll('a[data-i18n^="nav."]:not(.mobile-nav__cta)').forEach(a=>a.remove());
    }
    const logoIcon=base+'assets/img/isotipo-latam-expeditions.png?v=2';
    document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]').forEach(icon=>{
      icon.href=logoIcon;if(icon.rel==='icon')icon.type='image/png';
    });
  }
  function syncBrandContact(){
    const old='51900608980',number='51906472060',email='contact@latamexpeditions.com';
    document.querySelectorAll('a[href]').forEach(a=>{
      const h=a.getAttribute('href');
      if(h.includes(old))a.setAttribute('href',h.split(old).join(number));
      if(/^mailto:(?:contact|reservas)@latamexpedition(?:s)?\.com/i.test(h))a.setAttribute('href','mailto:'+email);
    });
    const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
    while((n=walk.nextNode())){
      if(n.parentElement&&/^(SCRIPT|STYLE|TEXTAREA|OPTION)$/.test(n.parentElement.tagName))continue;
      n.nodeValue=n.nodeValue.replace(/(?:\+?51\s*)?900\s*608\s*980|(?:\+?51\s*)?906\s*089\s*80/g,'+51 906 472 060')
       .replace(/\b(?:contact|reservas)@latamexpedition(?:s)?\.com\b/gi,email);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyModernNavigation();
    syncBrandContact();
    setupExperienceHeroImage();
    setupNavigation();
    setupCountrySelector();
    setupFilters();

    const languageSelect = document.getElementById('languageSelect');
    const params = new URLSearchParams(location.search);
    const queryLanguage = params.get('lang');
    const initial = SUPPORTED.includes(queryLanguage) ? queryLanguage : read('latam_lang', DEFAULT);
    if (queryLanguage) {
      params.delete('lang');
      const clean = `${location.pathname}${params.toString() ? `?${params}` : ''}${location.hash}`;
      history.replaceState({}, '', clean);
    }
    if (languageSelect) {
      languageSelect.value = initial;
      languageSelect.addEventListener('change', () => setLanguage(languageSelect.value));
    }
    if (initial !== DEFAULT) setLanguage(initial);
    else { lang = DEFAULT; store('latam_lang', DEFAULT); }
  });
})();

/* === PERU NATURE HEADER ADAPTER FOR LATAM EXPEDITIONS === */
(() => {
  'use strict';
  const locations = {
    PE: ['Perú','es'], CL: ['Chile','es'], CO: ['Colombia','es'],
    MX: ['México','es'], AR: ['Argentina','es'], BO: ['Bolivia','es'],
    EC: ['Ecuador','es'], VE: ['Venezuela','es'], UY: ['Uruguay','es'],
    CR: ['Costa Rica','es'], BR: ['Brasil','pt'], US: ['Estados Unidos','en'],
    IT: ['Italia','it'], FR: ['Francia','fr'], DE: ['Alemania','de'],
    GB: ['Reino Unido','en'], CA: ['Canadá','en'], PT: ['Portugal','pt'],
    JP: ['Japón','ja'], CN: ['China','zh'], ES: ['España','es']
  };
  const languageName = {es:'Español',en:'English',pt:'Português',fr:'Français',de:'Deutsch',it:'Italiano',ja:'日本語',zh:'中文'};
  const read = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
  const chooseLanguage = (lang) => {
    const select = document.getElementById('languageSelect');
    if (!select || !lang || !languageName[lang]) return;
    select.value = lang;
    if (window.LatamI18n?.lang() !== lang) {
      window.LatamI18n?.set(lang);
    }
  };
  const autoLangFor = (country) => {
    const found=Object.values(locations).find(pair => pair[0] === country);
    return found?.[1] || 'es';
  };

  function initPeruNatureHeader() {
    const header=document.querySelector('header.topbar');
    const inner=header?.querySelector('.topbar__inner');
    const brand=inner?.querySelector('.brand');
    const actions=inner?.querySelector('.header-actions');
    if (!header || !inner || !brand || !actions || header.dataset.pnHeaderReady === '1') return;
    header.dataset.pnHeaderReady = '1';
    document.body.classList.add('has-pn-header');
    const base=document.documentElement.getAttribute('data-base') || './';

    const utility=document.createElement('div');
    utility.className='latam-utilitybar';
    const utilityInner=document.createElement('div');
    utilityInner.className='latam-utilitybar__inner';
    utility.append(utilityInner);
    header.before(utility);

    const promo=document.createElement('div');
    promo.className='latam-promo';
    promo.innerHTML='<span class="latam-promo__message">Aprovecha <strong>10% de descuento</strong> · Código <strong>LATAM</strong></span><span class="latam-promo__mobile">10% de descuento · LATAM</span>';
    utilityInner.append(promo);

    const locale=document.createElement('div');
    locale.className='latam-locale';
    const country=header.querySelector('.country-pill');
    const language=header.querySelector('#languageSelect');
    const languageLabel=header.querySelector('label[for="languageSelect"]');
    if (country) locale.append(country);
    if (languageLabel) locale.append(languageLabel);
    if (language) {
      language.classList.add('latam-locale__language');
      language.setAttribute('aria-label','Seleccionar idioma');
      locale.append(language);
    }
    utilityInner.append(locale);

    const oldSales=header.querySelector('.header-utility');
    const sales=document.createElement('a');
    sales.className='latam-utilitybar__sales';
    sales.href='https://wa.me/51906472060';
    sales.target='_blank';
    sales.rel='noopener noreferrer';
    sales.innerHTML='<i class="fa-brands fa-whatsapp" aria-hidden="true"></i><span>Para ventas: +51 906 472 060</span>';
    oldSales?.remove();
    utilityInner.append(sales);

    const nav=document.createElement('nav');
    nav.className='latam-main-nav';
    nav.setAttribute('aria-label','Servicios turísticos');
    const items=[
      ['Paquetes','paquetes.html','paquetes'],
      ['Ofertas','index.html?tab=ofertas#explorar','ofertas'],
      ['Vuelos','vuelos.html','vuelos'],
      ['Hoteles','index.html?tab=hoteles#explorar','hoteles']
    ];
    nav.innerHTML=items.map(([label,href,key])=>
      '<a href="'+base+href+'" data-header-service="'+key+'">'+label+'</a>'
    ).join('');
    inner.querySelector('.nav')?.remove();
    actions.before(nav);
    const path=location.pathname.toLowerCase();
    const tab=new URLSearchParams(location.search).get('tab');
    nav.querySelectorAll('a').forEach(a=>{
      const key=a.dataset.headerService;
      if ((key==='paquetes' && path.endsWith('/paquetes.html')) ||
          (key==='vuelos' && path.endsWith('/vuelos.html')) ||
          (key==='ofertas' && tab==='ofertas') ||
          (key==='hoteles' && tab==='hoteles')) a.classList.add('is-active');
    });

    // Mostrar el PNG transparente proporcionado por el usuario como imagen real.
    // No usar pseudoelementos ni filtros CSS que conviertan el logo en un bloque.
    brand.classList.add('latam-brand-light', 'latam-brand-image');
    let logoImage = brand.querySelector('img.latam-header-logo');
    if (!logoImage) {
      logoImage = document.createElement('img');
      logoImage.className = 'latam-header-logo';
      logoImage.alt = 'LATAM Expeditions';
      logoImage.width = 610;
      logoImage.height = 184;
      logoImage.decoding = 'async';
      brand.prepend(logoImage);
    }
    logoImage.src = base + 'assets/img/logo-header-latam.png?v=20261103-2';

    const panel=document.querySelector('#mobileNav .mobile-nav__panel');
    const head=panel?.querySelector('.mobile-nav__head');
    if (panel && head) {
      panel.querySelectorAll('.mobile-service-links').forEach(e=>e.remove());
      const block=document.createElement('div');
      block.className='mobile-service-links';
      block.innerHTML=items.concat([['Experiencias','experiencias.html','experiencias']]).map(([label,href,key])=>
        '<a href="'+base+href+'" data-close-nav data-header-service="'+key+'">'+label+'</a>'
      ).join('');
      head.after(block);
      // El cierre y aria-expanded se gestionan en setupNavigation.
      panel.querySelectorAll(':scope > a').forEach(a=>{
        if (/^(Destinos|Experiencias|Paquetes|Estilos de viaje|Contacto)$/i.test(a.textContent.trim())) a.style.display='none';
      });
    }

    // Garantiza que el modal quede en la capa superior, nunca detrás del menú.
    const modal=document.getElementById('countryModal');
    if (modal) {
      document.body.append(modal);
      modal.setAttribute('aria-modal','true');
      modal.setAttribute('role','dialog');
      const options=modal.querySelectorAll('.country-option');
      const existing=new Set(Array.from(options).map(x=>x.dataset.country));
      const grid=options[0]?.parentElement;
      const additional=[
        ['Estados Unidos','Salidas y atención internacional','🇺🇸'],
        ['Italia','Viajes desde Italia','🇮🇹'],
        ['Francia','Viajes desde Francia','🇫🇷'],
        ['Alemania','Viajes desde Alemania','🇩🇪'],
        ['Reino Unido','Viajes desde Reino Unido','🇬🇧'],
        ['Canadá','Viajes desde Canadá','🇨🇦'],
        ['España','Viajes desde España','🇪🇸']
      ];
      if (grid) additional.forEach(([name,description,flag])=>{
        if(existing.has(name))return;
        const button=document.createElement('button');
        button.type='button';
        button.className='country-option';
        button.dataset.country=name;
        const symbol=document.createElement('span');
        symbol.textContent=flag;
        const label=document.createElement('strong');
        label.textContent=name;
        const caption=document.createElement('span');
        caption.textContent=description;
        button.append(symbol,label,caption);
        grid.append(button);
        button.addEventListener('click',()=>{
          save('latam_country',name);
          const countryLabel=document.getElementById('countryLabel');
          if(countryLabel)countryLabel.textContent=name;
          document.documentElement.dataset.country=name;
          const barName=document.getElementById('countryBarName');
          if(barName)barName.textContent=name;
          const flagText=document.getElementById('countryBarFlag');
          if(flagText)flagText.textContent=flag;
          modal.classList.remove('is-open');
          document.body.style.overflow='';
          if(read('latam_lang_explicit')!=='1')chooseLanguage(autoLangFor(name));
          document.dispatchEvent(new CustomEvent('latam:countrychange',{detail:{country:name}}));
        });
      });
    }
    language?.addEventListener('change',()=>save('latam_lang_explicit','1'));
    // Respetar selección explícita del país hecha por el visitante.
    document.addEventListener('latam:countrychange',event=>{
      if(read('latam_lang_explicit')!=='1')chooseLanguage(autoLangFor(event.detail?.country));
    });

    // Selección basada en IP pública: no pide permisos de ubicación GPS.
    // Si falla el proveedor, respeta la selección previa y el idioma del navegador.
    const savedCountry=read('latam_country');
    if (savedCountry) {
      if(read('latam_lang_explicit')!=='1')chooseLanguage(autoLangFor(savedCountry));
    } else {
      const localeCountry=(navigator.language||'').split('-')[1]?.toUpperCase();
      const fallback=locations[localeCountry];
      const applyLocation=code=>{
        if (read('latam_country'))return;
        const pair=locations[code];
        if(!pair)return;
        const [name,lang]=pair;
        save('latam_auto_country',name);
        const label=document.getElementById('countryLabel');
        const barName=document.getElementById('countryBarName');
        if(label)label.textContent=name;
        if(barName)barName.textContent=name;
        document.documentElement.dataset.country=name;
        if(read('latam_lang_explicit')!=='1')chooseLanguage(lang);
      };
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),4000);
      fetch('https://ipapi.co/json/',{signal:controller.signal,cache:'no-store'})
        .then(r=>{if(!r.ok)throw Error('Geolocation unavailable');return r.json();})
        .then(d=>applyLocation(String(d.country_code||d.country||'').toUpperCase()))
        .catch(()=>{if(fallback)applyLocation(localeCountry);})
        .finally(()=>clearTimeout(timeout));
    }

    // Tabs ocultos visualmente pero funcionales para Ofertas y Hoteles.
    const activateTab=()=>{
      const name=new URLSearchParams(location.search).get('tab');
      if(!['paquetes','ofertas','vuelos','hoteles'].includes(name))return;
      document.querySelector('[data-service-tab="'+name+'"]')?.click();
    };
    activateTab();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',initPeruNatureHeader,{once:true});
  }else initPeruNatureHeader();
})();

/* LATAM Product Template: adapta fichas históricas al diseño compartido sin borrar itinerarios. */
(function(){
  'use strict';
  function unifyProductPage(){
    const main=document.querySelector('main#contenido');
    const trigger=main?.querySelector('[data-book][data-book-kind]');
    const grid=main?.querySelector('.detail-layout,.detail-grid');
    if(!trigger||!grid)return;
    if(grid.dataset.unifiedProduct==='1')return;
    grid.dataset.unifiedProduct='1';
    document.body.classList.add('lx-unified-product');
    const kind=trigger.dataset.bookKind==='package'?'package':'experience';
    const aside=[...grid.children].find(node=>node.matches('.detail-aside,aside'));
    const content=[...grid.children].find(node=>node!==aside);
    if(!aside||!content)return;
    grid.classList.add('detail-layout','detail-layout--aligned');
    content.classList.add('detail-main');
    aside.classList.add('tour-booking-aside');
    const sideCard=aside.querySelector('.detail-card');
    if(sideCard)sideCard.classList.add('tour-booking-card','product-booking-card');
    const outer=grid.closest('section.section');
    outer?.classList.add('product-detail-section');
    const hero=main.querySelector('.product-hero-clean,.detail-hero,.page-hero');
    if(hero){
      hero.classList.add('product-hero-clean','lx-unified-hero');
      const inner=hero.querySelector('.page-hero__inner');
      inner?.classList.add('container');
      // Resolve each existing product cover from the HTML page, not the CSS file.
      // This keeps the approved local destination photo and prevents broken relative URLs.
      const inlineCover=hero.style.getPropertyValue('--lx-hero-img').trim();
      const coverMatch=inlineCover.match(/^url\\(\\s*(['"]?)([^'")]+)\\1\\s*\\)$/i);
      if(coverMatch){
        try{
          const absolute=new URL(coverMatch[2],document.baseURI);
          if(absolute.origin===location.origin && absolute.pathname.startsWith('/assets/img/')){
            hero.style.setProperty('--lx-hero-img','url("'+absolute.href+'")');
          }
        }catch(ignore){}
      }
      const oldImage=hero.style.getPropertyValue('--detail-image');
      // Experiencias: usar siempre la foto oficial de su ficha como banner (móvil y PC).
      // El background del componente unificado ya no tapa la capa ::before.
      const og=document.querySelector('meta[property="og:image"]')?.content||'';
      const sideImage=sideCard?.querySelector('img[src]')?.getAttribute('src')||'';
      const rawPhoto=kind==='experience'?(og||sideImage):(sideImage||og);
      const source=(rawPhoto&&rawPhoto.indexOf('"')<0)?rawPhoto:'';
      if(kind==='experience'&&source){
        try{
          const u=new URL(source,location.href);
          const allowed=u.origin===location.origin||
            ['latamexpeditions.com','www.latamexpeditions.com'].includes(u.hostname);
          if(allowed&&u.pathname.startsWith('/assets/img/')){
            hero.style.setProperty('--lx-hero-img','url("'+new URL(u.pathname,location.origin).href+'")');
            hero.classList.add('lx-experience-has-photo');
          }
        }catch(ignore){}
      }else if(!hero.style.getPropertyValue('--lx-hero-img')){
        if(oldImage)hero.style.setProperty('--lx-hero-img',oldImage);
        else if(source)hero.style.setProperty('--lx-hero-img','url("'+source+'")');
      }
    }
    if(sideCard){
      const price=sideCard.querySelector('.price-block');
      if(price){
        const label=price.querySelector('small');
        const english=(document.documentElement.lang||'es').toLowerCase().startsWith('en');
        if(label)label.textContent=kind==='package'?
          (english?'Price per person':'Tarifa por persona'):
          (english?'Price per person':'Tarifa por persona');
        if(kind==='package'){
          const sub=price.querySelector('span')||document.createElement('span');
          sub.textContent=english?'based on double occupancy':'en base a acomodación doble';
          if(!sub.parentElement)price.append(sub);
          price.querySelectorAll('p,.lx-quote-promo').forEach(el=>el.remove());
        }
        price.querySelectorAll('small,span,p,.lx-quote-promo').forEach(item=>{
          if(/con c[oó]digo\s+LATAM|LATAM10EXP|precio promocional/i.test(item.textContent||''))item.remove();
        });
        if(kind==='experience'&&!price.querySelector('span')){
          const span=document.createElement('span');span.textContent='por persona';price.append(span);
        }
      }
      if(!sideCard.querySelector('img[src]')){
        const og=document.querySelector('meta[property="og:image"]')?.content||'';
        const oldImage=hero?.style.getPropertyValue('--detail-image')||'';
        const match=oldImage.match(/url\(['"]?([^'")]+)['"]?\)/);
        const source=match?.[1]||og;
                if(source&&/^https?:\/\/|^\.\.\//.test(source)&&!(kind==='package'&&/chile-rapa-nui-moais/.test(trigger.dataset.book||'')&&/destino-chile-01\.jpg/.test(source))){
          const img=document.createElement('img');
          img.src=source;img.alt='Imagen representativa de '+(trigger.dataset.bookTitle||'la experiencia');
          img.loading='lazy';img.decoding='async';
          sideCard.querySelectorAll('.lx-chile-aside-placeholder,.lx-chile-photo-pending').forEach(el=>el.remove());
          sideCard.prepend(img);
        }
      }
    }

    // Mantener la reserva inmediata como único CTA junto al precio; las consultas van después del contenido.
    if(!main.querySelector('.lx-product-help')){
      const slug=String(trigger.dataset.book||''),title=String(trigger.dataset.bookTitle||'este viaje');
      const stack=sideCard?.querySelector('.cta-stack');
      const links=[...stack?.querySelectorAll('a[href]')||[]];
      let custom=links.find(a=>/cotizaci[oó]n|personaliz|a medida|consultar cotizaci[oó]n/i.test(a.textContent||'')||/contacto\.html/.test(a.href));
      let whatsapp=links.find(a=>/whatsapp|wa\.me/i.test(a.href));
      if(!custom){
        custom=document.createElement('a');
        custom.href='../contacto.html?'+(kind==='package'?'paquete':'experiencia')+'='+encodeURIComponent(slug);
      }
      if(!whatsapp){
        whatsapp=document.createElement('a');
        whatsapp.href='https://wa.me/51906472060?text='+encodeURIComponent('Hola, quisiera consultar algunos detalles sobre '+title+'.');
        whatsapp.target='_blank';whatsapp.rel='noopener noreferrer';
      }
      const section=document.createElement('section');
      section.className='lx-product-help';
      section.setAttribute('aria-label','Atención personalizada para '+title);
      const layout=document.createElement('div');layout.className='lx-product-help-grid';
      const createCard=(heading,description,link,label)=>{
        const card=document.createElement('article');card.className='detail-card lx-product-help-card';
        const h=document.createElement('h2');h.textContent=heading;
        const p=document.createElement('p');p.textContent=description;
        link.classList.remove('btn-outline','btn-primary');
        if(link===whatsapp){
          // Conservar el icono y la identidad visual de WhatsApp al reubicar la acción.
          const icon=link.querySelector('i.fa-whatsapp')?.cloneNode(true)||document.createElement('i');
          icon.className='fab fa-whatsapp';icon.setAttribute('aria-hidden','true');
          const caption=document.createElement('span');caption.textContent=label;
          link.replaceChildren(icon,caption);
          link.classList.add('lx-product-help-whatsapp');
        }else{
          link.textContent=label;
        }
        link.classList.add('lx-product-help-cta');
        card.append(h,p,link);return card;
      };
      layout.append(
        createCard('Solicita una cotización a medida',
          '¿Quieres adaptar este viaje a tu medida? Déjanos tus indicaciones y lo organizamos.',
          custom,'Solicitar cotización a medida'),
        createCard('Consulta por WhatsApp',
          'Si prefieres conversar con un asesor para afinar los detalles, puedes escribirnos directamente.',
          whatsapp,'Consultar por WhatsApp')
      );
      section.append(layout);
      // Las consultas pertenecen a la misma columna de contenido que el itinerario.
      const important=[...content.querySelectorAll(':scope > .detail-card')].find(card=>
        /^Informaci[oó]n importante antes de reservar\b/i.test(card.querySelector('h2')?.textContent?.trim()||''));
      if(important)important.after(section);
      else content.append(section);
      links.forEach(link=>{
        if(link!==custom&&link!==whatsapp){
          link.classList.remove('btn-outline','btn-primary');link.classList.add('lx-product-help-cta');
          layout.firstElementChild.append(link);
        }
      });
    }
    // Aplicar a ambas plantillas las exclusiones editoriales solicitadas.
    main.querySelectorAll('.tour-logistics > div,.tour-facts > div,.product-facts > div').forEach(row=>{
      const label=row.querySelector('span,dt')?.textContent?.trim()||'';
      if(/^(ventana de recogida|lugar de finalizaci[oó]n)$/i.test(label))row.remove();
    });
    content.querySelectorAll('i.fa-star,i.fa-star-half-stroke,i.fa-star-half-alt').forEach(icon=>{
      icon.classList.remove('fa-star','fa-star-half-stroke','fa-star-half-alt');
      icon.classList.add('fa-check');
    });
    // Estructura informativa común, sin modificar condiciones de reserva.
    if(kind==='package'){
      const headings=()=>[...content.querySelectorAll('h2')].map(h=>h.textContent.trim().toLowerCase());
      const add=(title,html)=>{
        if(headings().includes(title.toLowerCase()))return;
        const section=document.createElement('section');
        section.className='detail-card';
        section.innerHTML='<h2>'+title+'</h2>'+html;
        content.append(section);
      };
      const slug=trigger.dataset.book||'';
      const atacama=slug==='desierto-atacama-premium-5d4n';
      const rapa=slug==='chile-rapa-nui-moais-5d4n';
      const days=atacama?'Llegadas cualquier día de la semana, sujetas a disponibilidad':rapa?'Llegadas según disponibilidad aérea y hotelera':'Fechas a elección, según disponibilidad';
      const times=atacama?'Se recomienda llegar entre las 08:00 y las 14:00':rapa?'Coordinados con los vuelos a Mataveri':'Según el itinerario y los vuelos contratados';
      const meeting=atacama?'Aeropuerto de Calama para el traslado incluido':rapa?'Aeropuerto Mataveri o alojamiento, según el servicio':'Punto confirmado en el voucher';
      add('Horarios y operación','<div class="tour-logistics"><div><span>Días de operación</span><strong>'+days+'</strong></div><div><span>Horarios de salida</span><strong>'+times+'</strong></div><div><span>Punto de encuentro</span><strong>'+meeting+'</strong></div><div><span>Recogida en hotel</span><strong>Según el programa y previa coordinación</strong></div></div>');
      add('Entradas y pagos adicionales','<div class="tour-table-wrap"><table class="tour-table"><thead><tr><th>Servicio</th><th>Condición</th><th>Información</th></tr></thead><tbody><tr><th>Entradas y visitas</th><td>Según programa</td><td>Las expresamente indicadas en «Qué incluye» están contempladas.</td></tr><tr><th>Actividades adicionales</th><td>Opcionales</td><td>Pueden contratarse por separado cuando estén disponibles.</td></tr></tbody></table></div>');
      add('Idiomas disponibles','<div class="tour-language-grid"><div><span>Idiomas de atención</span><strong>Español · Inglés</strong></div><div><span>Otros idiomas</span><strong>Bajo solicitud</strong></div></div><p class="tour-note">El idioma del guiado depende de la disponibilidad del servicio seleccionado.</p>');
      add('Recomendaciones','<ul class="tour-bullet-list"><li>Lleva tus documentos de viaje y ropa apropiada para el clima.</li><li>Revisa los horarios de llegada y las condiciones de tu alojamiento.</li><li>Comunica con anticipación cualquier necesidad especial.</li></ul>');
      add('Restricciones','<ul class="tour-bullet-list"><li>Los menores deben viajar acompañados según las normas aplicables.</li><li>Algunas actividades tienen limitaciones físicas, de altitud o de acceso.</li><li>Respeta las indicaciones de seguridad y conservación de cada atractivo.</li></ul>');
      add('Accesibilidad','<p class="tour-body-copy">Las condiciones de acceso varían entre alojamientos y excursiones. Consúltanos antes de reservar si necesitas una alternativa adaptada.</p>');
      add('Clima y operación','<p class="tour-body-copy">El orden de las visitas puede variar por condiciones climáticas, seguridad o restricciones de acceso.</p>');
      add('Cancelación','<p class="tour-body-copy">Las condiciones de cambios y cancelaciones se informan durante la reserva y dependen de los servicios contratados.</p>');
      add('Voucher y confirmación','<p class="tour-body-copy">Recibirás la información de los servicios confirmados, horarios y puntos de encuentro antes del inicio del viaje.</p>');
      add('Preguntas frecuentes','<div class="tour-faq-list"><details class="tour-faq"><summary>¿Puedo añadir vuelos al paquete?</summary><p>Cuando el producto lo permita, puedes seleccionar vuelos opcionales por separado.</p></details><details class="tour-faq"><summary>¿Puedo elegir otro hotel?</summary><p>Podemos revisar alternativas de alojamiento según las fechas, disponibilidad y distribución de habitaciones.</p></details><details class="tour-faq"><summary>¿Cuándo recibiré los detalles del viaje?</summary><p>Los servicios, horarios y puntos de encuentro se detallarán en la confirmación de tu reserva.</p></details></div>');
    }
    // Conservar íntegro el contenido editorial de cada experiencia.
    content.querySelectorAll('h2').forEach(h=>{
      if(/^Itinerario d[ií]a a d[ií]a$/i.test(h.textContent.trim()))
        h.textContent='Itinerario detallado';
    });
    // Información esencial conserva los datos reales del producto, sin badges decorativos.
    if(kind==='package'){
      const firstInfo=[...content.querySelectorAll(':scope > .detail-card')].find(card=>
        /^Informaci[oó]n (del paquete|esencial)|^Datos b[aá]sicos/i.test(card.querySelector(':scope > h2')?.textContent?.trim()||''));
      if(firstInfo){
        firstInfo.querySelector('h2').textContent='Información esencial';
        firstInfo.classList.add('lx-product-info');
        const old=firstInfo.querySelector('.tour-facts,.product-facts,.lx-unified-facts');
        if(old && !old.querySelector('.tour-fact')){
          const facts=new Map();
          old.querySelectorAll(':scope > div').forEach(row=>{
            const label=row.querySelector('span,dt')?.textContent?.trim();
            const value=row.querySelector('strong,dd')?.textContent?.trim();
            if(label&&value)facts.set(label,value);
          });
          const text=(pattern)=>[...facts].find(pair=>pattern.test(pair[0]))?.[1]||'';
          const wanted=[
            ['Ubicación',text(/destino|regi[oó]n|ubicaci[oó]n/i)||trigger.dataset.bookDestinationLabel||trigger.dataset.bookCountry||'Según itinerario','fa-location-dot'],
            ['Duración',text(/duraci[oó]n/i)||trigger.dataset.bookDuration||'Según itinerario','fa-clock'],
            ['Dificultad',text(/dificultad|exigencia/i)||'Varía según las excursiones','fa-person-hiking'],
            ['Tipo de servicio',text(/modalidad|tipo de servicio/i)||'Según servicios del programa','fa-people-group'],
            ['Edad mínima',text(/edad m[ií]nima/i)||'Consultar condiciones para menores','fa-child-reaching'],
            ['Tamaño del grupo',text(/tama[nñ]o del grupo|grupo/i)||'Según excursión','fa-users'],
            ['Distancia a pie',text(/distancia a pie/i)||'Variable según excursión','fa-shoe-prints'],
            ['Altitud',text(/altitud/i)||'Depende de los lugares visitados','fa-mountain']
          ];
          const dl=document.createElement('dl');dl.className='tour-facts';
          wanted.forEach(([label,value,icon])=>{
            const row=document.createElement('div');row.className='tour-fact';
            const i=document.createElement('i');i.className='fa-solid '+icon;i.setAttribute('aria-hidden','true');
            const holder=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');
            dt.textContent=label;dd.textContent=value;holder.append(dt,dd);row.append(i,holder);dl.append(row);
          });
          old.replaceWith(dl);
        }
      }
      const about=[...content.querySelectorAll(':scope > .detail-card')].find(card=>
        /^(sobre este paquete|descubre|conoce|sobre el paquete|about this package|discover)/i.test(card.querySelector(':scope > h2')?.textContent?.trim()||''));
      about?.querySelectorAll('.lx-package-key-facts,.trip-badge,.package-badge').forEach(node=>node.remove());
      // Sustituir mensajes internos por información comprensible para el viajero.
      content.querySelectorAll('p,small,span').forEach(node=>{
        if(node.children.length)return;
        const t=node.textContent.trim();
        if(/tarifa (?:objetivo|meta)|objetivo comercial|precio (?:objetivo|interno)/i.test(t)){
          node.textContent=t.replace(/tarifa objetivo|precio objetivo/gi,'tarifa por persona')
           .replace(/objetivo comercial/gi,'precio del paquete');
        }
      });
    }
      // Nunca publicar el cupón por defecto; únicamente tras ingresarlo el viajero.
      content.querySelectorAll('p,small,span').forEach(node=>{
        if(/beneficio\s+LATAM10EXP|con c[oó]digo\s+LATAM10EXP/i.test(node.textContent?.trim()||'')
          &&node.children.length===0)node.closest('p')?.remove();
      });
    if(kind==='experience'&&!content.querySelector('.lx-product-info, .product-facts')){
      const first=content.querySelector(':scope > .detail-card');
      const title=first?.querySelector('h2')?.textContent||'';
      if(!/^(informaci[oó]n (esencial|de la experiencia)|datos b[aá]sicos)/i.test(title)){
        const info=document.createElement('section');info.className='detail-card lx-product-info';
        const h=document.createElement('h2');h.textContent='Información de la experiencia';
        const row=document.createElement('div');row.className='lx-unified-facts';
        [['Duración',trigger.dataset.bookDuration||'Consultar'],
         ['Destino',trigger.dataset.bookCountry||'Consultar']].forEach(([name,value])=>{
           const div=document.createElement('div'),small=document.createElement('span'),strong=document.createElement('strong');
           small.textContent=name;strong.textContent=value;div.append(small,strong);row.append(div);
         });
        info.append(h,row);content.prepend(info);
      }
    }
    // Ubicar las consultas al final de la ficha, después de las preguntas frecuentes.
    const helpAtEnd=content.querySelector(':scope > .lx-product-help');
    if(helpAtEnd)content.append(helpAtEnd);
    // Vuelos de nuevas fichas: el código de aeropuerto es dato editorial explícito.
    // Para fichas históricas, habilitar únicamente destinos únicos conocidos.
    if(kind==='package'&&!trigger.dataset.bookDestination){
      const slug=String(trigger.dataset.book||'');
      const known=[
        [/^medellin-esencial$/, 'MDE','Medellín, Colombia'],
        [/^peru-cusco-4d3n$/, 'CUZ','Cusco, Perú'],
        [/^brasil-rio-4d3n$/, 'GIG','Río de Janeiro, Brasil'],
        [/^chile-patagonia-6d5n$/, 'PUQ','Punta Arenas, Chile'],
        [/^bogota-esencial$/, 'BOG','Bogotá, Colombia'],
        [/^cartagena-esencial$/, 'CTG','Cartagena, Colombia']
      ];
      const item=known.find(([pattern])=>pattern.test(slug));
      if(item){trigger.dataset.bookDestination=item[1];trigger.dataset.bookDestinationLabel=item[2];}
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',unifyProductPage,{once:true});
  else unifyProductPage();
})();


/* Cuenta de viajero: nombre visible y menú en todas las páginas LATAM.
   Conserva el comportamiento de cuentas.js cuando ese script está presente. */
(function(){
  'use strict';
  const TOKEN='latamExpeditionsToken',USER='latamExpeditionsUser';
  const base=document.documentElement.dataset.base||'./';
  function user(){
    try{
      const token=localStorage.getItem(TOKEN);
      const u=JSON.parse(localStorage.getItem(USER)||'null');
      return token&&u&&u.name?u:null;
    }catch(err){return null;}
  }
  function apply(){
    const current=user();
    const menu=document.querySelector('.login-menu');
    const btn=menu?.querySelector('.login-toggle');
    const label=btn?.querySelector('[data-auth-label]');
    if(btn&&label){
      if(current){
        label.removeAttribute('data-i18n');
        label.textContent=String(current.name).trim().split(/\s+/)[0].slice(0,36);
        btn.setAttribute('aria-label','Menú de '+String(current.name).slice(0,65));
        btn.classList.add('is-account-active');
        const dropdown=menu.querySelector('.login-dropdown');
        if(dropdown&&!dropdown.dataset.latamAccountMenu){
          dropdown.dataset.latamAccountMenu='1';
          dropdown.innerHTML='';
          const items=[
            {label:'Mi cuenta',href:base+'mis-viajes.html',icon:'fa-regular fa-user'},
            {label:'Consultar reserva',href:base+'mi-reserva.html',icon:'fa-solid fa-magnifying-glass'}
          ];
          items.forEach(item=>{
            const a=document.createElement('a');a.href=item.href;
            a.setAttribute('role','menuitem');
            const i=document.createElement('i');i.className=item.icon;
            i.setAttribute('aria-hidden','true');
            a.append(i,document.createTextNode(item.label));dropdown.append(a);
          });
          const logout=document.createElement('button');
          logout.type='button';logout.dataset.logout='';logout.dataset.headerAccountLogout='';
          logout.className='latam-account-logout';logout.setAttribute('role','menuitem');
          logout.innerHTML='<i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i> Cerrar sesión';
          dropdown.append(logout);
        }
      }else{
        btn.classList.remove('is-account-active');
        btn.setAttribute('aria-label','Iniciar sesión');
        label.setAttribute('data-i18n','nav.login');
        label.textContent='Iniciar sesión';
        const dropdown=menu.querySelector('.login-dropdown');
        if(dropdown&&dropdown.dataset.latamAccountMenu){
          dropdown.dataset.latamAccountMenu='';
          dropdown.innerHTML='';
          const guest=[
            ['Consultar reserva','mi-reserva.html','fa-solid fa-magnifying-glass'],
            ['Iniciar sesión','login.html','fa-solid fa-right-to-bracket'],
            ['Crear cuenta','registro.html','fa-solid fa-user-plus']
          ];
          guest.forEach(item=>{
            const a=document.createElement('a');a.href=base+item[1];
            a.setAttribute('role','menuitem');
            const icon=document.createElement('i');icon.className=item[2];
            icon.setAttribute('aria-hidden','true');
            a.append(icon,document.createTextNode(item[0]));dropdown.append(a);
          });
        }
      }
    }
    const mobile=document.querySelector('#mobileNav .mobile-nav__panel');
    if(mobile){
      const account=mobile.querySelector('a[data-auth-in]');
      // Un solo menú hamburguesa: las secciones privadas se enlazan desde aquí.
      if(account)account.hidden=true;
      let section=mobile.querySelector('.mobile-account-links');
      if(!section){
        section=document.createElement('div');
        section.className='mobile-account-links';
        const heading=document.createElement('strong');
        heading.className='mobile-account-links__title';
        heading.textContent='MI CUENTA · LATAM REWARDS';
        section.append(heading);
        [
          ['Mi panel','inicio','fa-solid fa-house'],
          ['Mis viajes','viajes','fa-solid fa-suitcase-rolling'],
          ['Mis reservaciones','reservas','fa-solid fa-ticket'],
          ['LATAM Rewards','millas','fa-solid fa-gift'],
          ['Recompensas y cupones','recompensas','fa-solid fa-tags'],
          ['Notificaciones','avisos','fa-regular fa-bell'],
          ['Mi perfil','perfil','fa-regular fa-user']
        ].forEach(([label,hash,icon])=>{
          const link=document.createElement('a');
          link.href=base+'mis-viajes.html#'+hash;
          link.dataset.closeNav='';
          link.dataset.accountSection=hash;
          const i=document.createElement('i');
          i.className=icon;i.setAttribute('aria-hidden','true');
          link.append(i,document.createTextNode(label));
          section.append(link);
        });
        const service=mobile.querySelector('.mobile-service-links');
        if(service)service.after(section);
        else mobile.querySelector('.mobile-nav__head')?.after(section);
        section.addEventListener('click',event=>{
          if(!event.target.closest('a'))return;
          mobile.closest('.mobile-nav')?.classList.remove('is-open');
          document.body.classList.remove('nav-open');
          document.getElementById('navToggle')?.setAttribute('aria-expanded','false');
        });
      }
      section.hidden=!current;
      if(current)section.querySelectorAll('a[data-account-section]').forEach(link=>{
        const currentHash=location.pathname.endsWith('/mis-viajes.html')?(location.hash.slice(1)||'inicio'):'';
        if(link.dataset.accountSection===currentHash)link.setAttribute('aria-current','page');
        else link.removeAttribute('aria-current');
      });
      const login=mobile.querySelector('a[data-auth-out]');
      if(login)login.hidden=Boolean(current);
      let logout=mobile.querySelector('[data-header-account-mobile-logout]');
      if(current&&!logout){
        logout=document.createElement('button');
        logout.type='button';logout.dataset.logout='';
        logout.dataset.headerAccountMobileLogout='';
        logout.className='latam-mobile-account-logout';
        logout.textContent='Cerrar sesión';
        mobile.append(logout);
      }else if(logout)logout.hidden=!current;
    }
  }
  let signingOut=false;
  async function signout(){
    if(signingOut)return;
    signingOut=true;
    let token='';
    try{
      token=localStorage.getItem(TOKEN)||'';
      localStorage.removeItem(TOKEN);
      localStorage.removeItem(USER);
    }catch(err){}
    window.dispatchEvent(new CustomEvent('latam:sessionchange'));
    const home=base+'index.html';
    if(!token){location.assign(home);return;}
    // El cierre visual y local es inmediato. La invalidación remota tiene
    // un máximo de espera para no bloquear al viajero con mala conexión.
    const remote=(async()=>{
      try{
        const cfg=await fetch(base+'assets/data/catalog.json',{cache:'no-cache'}).then(r=>r.json());
        const endpoint=cfg?.booking?.endpoint;
        if(endpoint)await fetch(endpoint,{
          method:'POST',keepalive:true,
          headers:{'Content-Type':'text/plain;charset=UTF-8'},
          body:JSON.stringify({action:'logout',data:{token}})
        });
      }catch(err){console.warn('[logout] Invalidación remota pendiente',err);}
    })();
    await Promise.race([remote,new Promise(resolve=>setTimeout(resolve,900))]);
    location.assign(home);
  }
  function init(){
    apply();
    window.addEventListener('storage',e=>{if(e.key===TOKEN||e.key===USER)apply();});
    window.addEventListener('latam:sessionchange',apply);
    document.addEventListener('latam:langchange',()=>{if(user())apply();});
    // Delegación global: funciona también para el botón móvil creado dinámicamente.
    document.addEventListener('click',e=>{
      const clicked=e.target.closest('[data-logout]');
      if(!clicked)return;
      e.preventDefault();
      e.stopPropagation();
      clicked.disabled=true;
      signout();
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();

/* LATAM · Itinerarios unificados en todas las fichas de paquetes.
 * Convierte los listados antiguos al diseño usado en Atacama Premium,
 * manteniendo el texto original y sin inventar horarios de operación. */
(function () {
  'use strict';
  function enhancePackageItineraries() {
    document.querySelectorAll('.product-detail-section ol.itinerary, .product-detail-section ul.itinerary').forEach(function (list) {
      if (list.dataset.lxDetailed === '1') return;
      const items = Array.from(list.children).filter(el => el.tagName === 'LI');
      if (!items.length) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'package-itinerary';
      items.forEach(function (item, index) {
        const original = String(item.textContent || '').trim();
        if (!original) return;
        const matched = original.match(/^(?:d[ií]a|day)\s*(\d+)\s*[·:—-]?\s*(.*)$/i);
        const dayNumber = matched ? matched[1] : String(index + 1);
        const title = matched && matched[2] ? matched[2] : original;
        const article = document.createElement('article');
        article.className = 'package-day';
        const head = document.createElement('div');
        head.className = 'package-day__head';
        const label = document.createElement('span');
        label.textContent = 'Día ' + dayNumber;
        const heading = document.createElement('h3');
        heading.textContent = title;
        head.append(label, heading);
        const summary = document.createElement('p');
        summary.className = 'tour-note';
        summary.textContent = 'Programa de la jornada · el horario de salida y la secuencia de visitas se confirman con la reserva.';
        const listRows = document.createElement('ul');
        const row = document.createElement('li');
        row.className = 'package-day__row';
        const time = document.createElement('time');
        time.textContent = 'Según programa';
        const detail = document.createElement('span');
        detail.textContent = title;
        row.append(time, detail);
        listRows.append(row);
        article.append(head, summary, listRows);
        wrapper.append(article);
      });
      if(wrapper.children.length){list.replaceWith(wrapper);}
    });
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', enhancePackageItineraries, {once: true});
  else enhancePackageItineraries();
})();


/* Galerías de experiencias: controles accesibles y desplazamiento por fotografías. */
(function(){
  'use strict';
  document.addEventListener('click',function(event){
    const button=event.target.closest('[data-lx-gallery-dir]');
    if(!button)return;
    const track=button.closest('[data-lx-gallery]')?.querySelector('.lx-atacama-gallery-track');
    if(!track)return;
    const photo=track.querySelector('figure');
    const width=photo?.getBoundingClientRect().width||260;
    const direction=Number(button.dataset.lxGalleryDir)||1;
    track.scrollBy({left:direction*(width+13),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  });
  document.addEventListener('keydown',function(event){
    if(!event.target.matches('.lx-atacama-gallery-track')||!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();
    const track=event.target,photo=track.querySelector('figure');
    track.scrollBy({left:(event.key==='ArrowRight'?1:-1)*((photo?.getBoundingClientRect().width||260)+13),behavior:'auto'});
  });
})();


/* Texto público coherente en catálogos y fichas. No modifica datos de precios ni reservas. */
(function(){
 'use strict';
 const words={1:'una estrella',2:'dos estrellas',3:'tres estrellas',4:'cuatro estrellas',5:'cinco estrellas'};
 function hotelText(t){
   return String(t||'').replace(/([1-5])(?:\.5)?\s*(?:★|\bestrellas?\b)/gi,(match,n)=>match.includes('.5')?words[n]+' y media':words[n]);
 }
 function clean(){
   const main=document.querySelector('main');
   if(!main)return;
   const walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT);
   const nodes=[];
   while(walker.nextNode()){
     const n=walker.currentNode;
     if(n.parentElement?.closest('script,style,template,option,textarea'))continue;
     if(/(?:★|[1-5] estrellas?|tarifa objetivo|precio objetivo)/i.test(n.nodeValue||''))nodes.push(n);
   }
   nodes.forEach(n=>{
     let t=hotelText(n.nodeValue);
     t=t.replace(/tarifa objetivo/gi,'tarifa por persona')
        .replace(/precio objetivo/gi,'precio por persona');
     if(t!==n.nodeValue)n.nodeValue=t;
   });
   main.querySelectorAll('.trip-card').forEach(card=>{
     const tag=card.querySelector('.trip-card__media .tag');
     if(!tag)return;
     const old=tag.textContent.trim();
     if(!/^(?:[0-9]+D\s*[\/·-]\s*[0-9]+N|[1-5]\s*(?:★|estrellas?)|cotizaci[oó]n previa|tarifa objetivo)/i.test(old))return;
     const t=(card.querySelector('h3')?.textContent||'').toLowerCase();
     tag.textContent=/rapa nui|isla de pascua/.test(t)?'Cultura ancestral':
       /caf[eé]|cafetera/.test(t)?'Cultura cafetera':
       /atacama|uyuni|salar|desierto|laguna/.test(t)?'Paisajes':
       /playa|isla|caribe|patagonia|gal[aá]pagos/.test(t)?'Naturaleza':
       /senderismo|trek|monta[nñ]a/.test(t)?'Aventura':'Cultura local';
   });
   main.querySelectorAll('.trip-card .price small').forEach(label=>{
     if(/tarifa objetivo|precio objetivo|cotizaci[oó]n previa/i.test(label.textContent||'')){
       label.textContent='Desde';
     }
   });
   document.querySelectorAll('[data-book-tiers]').forEach(node=>{
     const old=node.getAttribute('data-book-tiers');
     const fixed=hotelText(old);
     if(fixed!==old)node.setAttribute('data-book-tiers',fixed);
   });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});
 else clean();
})();
