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
    document.querySelectorAll('[data-close-nav]').forEach((el) => el.addEventListener('click', closeNav));
    mobileNav?.addEventListener('click', (e) => { if (e.target === mobileNav) closeNav(); });

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
      const apply = () => {
        let visible = 0;
        cards.forEach((card) => {
          const tags = (card.dataset.tags || '').split(/\s+/).filter(Boolean);
          const ok = Object.values(active).every((value) => !value || tags.includes(value));
          card.hidden = !ok;
          if (ok) visible += 1;
        });
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

  document.addEventListener('DOMContentLoaded', () => {
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
