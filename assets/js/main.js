/* =========================================================================
   Latam Expeditions \u2014 motor de internacionalizaci\u00f3n (i18n)
   El espa\u00f1ol vive en el HTML. Al elegir otro idioma se descarga
   assets/data/i18n/<lang>/content.json (diccionario "texto espa\u00f1ol" ->
   traducci\u00f3n) y ui-translations.json (claves data-i18n), y se traducen el
   DOM, atributos, <title> y metadatos. Lo no traducido queda en espa\u00f1ol.
   ========================================================================= */
(function () {
  var DEFAULT = 'es';
  var SUPPORTED = ['es', 'en', 'pt', 'fr', 'de', 'it', 'ja', 'zh'];
  var lang = DEFAULT, content = {}, ui = {}, cache = null;
  var base = (function () {
    var s = document.querySelector('script[src$="assets/js/main.js"]');
    return s ? (s.getAttribute('src') || '').replace(/assets\/js\/main\.js.*$/, '') : '';
  })();
  function store(l) { try { localStorage.setItem('latam_lang', l); } catch (e) {} }
  function stored() { try { return localStorage.getItem('latam_lang') || DEFAULT; } catch (e) { return DEFAULT; } }
  function flat(l) { return content[l] || {}; }
  function nested(o, k) { return k.split('.').reduce(function (a, p) { return (a && a[p] != null) ? a[p] : null; }, o || {}); }
  function buildCache() {
    cache = { texts: [], attrs: [], metas: [], i18nEls: [], title: document.title };
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode;
        if (!p || !p.nodeName) return NodeFilter.FILTER_REJECT;
        var tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('[data-i18n]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n; while ((n = walker.nextNode())) cache.texts.push({ node: n, orig: n.nodeValue });
    ['placeholder', 'title', 'alt', 'aria-label'].forEach(function (a) {
      document.querySelectorAll('[' + a + ']').forEach(function (el) {
        var v = el.getAttribute(a); if (v && v.trim()) cache.attrs.push({ el: el, attr: a, orig: v });
      });
    });
    document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[property="og:title"],meta[name="twitter:description"],meta[name="twitter:title"]').forEach(function (m) {
      var v = m.getAttribute('content'); if (v && v.trim()) cache.metas.push({ el: m, orig: v });
    });
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      cache.i18nEls.push({ el: el, key: el.getAttribute('data-i18n'), orig: el.textContent });
    });
  }
  function applyLang(l) {
    if (!cache) buildCache();
    var d = flat(l), u = ui[l] || {}, def = (l === DEFAULT);
    cache.texts.forEach(function (t) { var k = t.orig.trim(); t.node.nodeValue = def ? t.orig : (d[k] != null ? t.orig.replace(k, d[k]) : t.orig); });
    cache.i18nEls.forEach(function (o) { var k = (o.orig || '').trim(); o.el.textContent = def ? o.orig : (nested(u, o.key) != null ? nested(u, o.key) : (d[k] != null ? d[k] : o.orig)); });
    cache.attrs.forEach(function (a) { var k = a.orig.trim(); a.el.setAttribute(a.attr, def ? a.orig : (d[k] != null ? d[k] : a.orig)); });
    cache.metas.forEach(function (m) { var k = m.orig.trim(); m.el.setAttribute('content', def ? m.orig : (d[k] != null ? d[k] : m.orig)); });
    var tk = cache.title.trim(); document.title = def ? cache.title : (d[tk] != null ? d[tk] : cache.title);
    document.documentElement.lang = l;
  }
  function load(l, cb) {
    if (l === DEFAULT || content[l] !== undefined) { cb && cb(); return; }
    var done = 0, fin = function () { if (++done >= 2) cb && cb(); };
    fetch(base + 'assets/data/i18n/' + l + '/content.json').then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { content[l] = j; fin(); }).catch(function () { content[l] = {}; fin(); });
    fetch(base + 'assets/data/i18n/' + l + '/ui-translations.json').then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { ui[l] = j; fin(); }).catch(function () { ui[l] = {}; fin(); });
  }
  function set(l) { if (SUPPORTED.indexOf(l) < 0) l = DEFAULT; lang = l; store(l); load(l, function () { applyLang(l); }); }
  window.LatamI18n = {
    t: function (s) { if (lang === DEFAULT) return s; var v = flat(lang)[String(s).trim()]; return v != null ? v : s; },
    apply: function (root) { if (lang === DEFAULT || !root) return; var d = flat(lang); var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null); var n; while ((n = w.nextNode())) { var k = (n.nodeValue || '').trim(); if (k && d[k] != null) n.nodeValue = n.nodeValue.replace(k, d[k]); } },
    lang: function () { return lang; }, set: set
  };
  document.addEventListener('DOMContentLoaded', function () {
    var sel = document.getElementById('languageSelect');
    if (!sel) return;
    var l = stored(); sel.value = l;
    sel.addEventListener('change', function () { set(sel.value); });
    if (l !== DEFAULT) set(l);
  });
})();

/* ============================ Filtros y buscador ========================= */
document.addEventListener('DOMContentLoaded',()=>{
  const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  document.querySelectorAll('[data-filterable]').forEach(root=>{
    const cards=[...root.querySelectorAll('.trip-card')], groups=[...root.querySelectorAll('[data-filter-group]')], count=root.querySelector('#resultsCount'), empty=root.querySelector('#emptyState'), reset=root.querySelector('#filterReset');
    const active={};
    const apply=()=>{let visible=0;cards.forEach(card=>{const tags=(card.dataset.tags||'').split(/\s+/);const ok=Object.values(active).every(v=>!v||tags.includes(v));card.hidden=!ok;if(ok)visible++;});if(count)count.textContent=`${visible} ${document.documentElement.lang==='en'?'results':'resultados'}`;if(empty)empty.hidden=visible>0;if(reset)reset.hidden=!Object.values(active).some(Boolean);};
    groups.forEach(g=>{const key=g.dataset.filterGroup;g.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.filter;active[key]=active[key]===v?'':v;g.querySelectorAll('[data-filter]').forEach(x=>{const on=x.dataset.filter===active[key];x.classList.toggle('is-active',on);x.setAttribute('aria-pressed',on)});apply()}));});
    if(reset)reset.addEventListener('click',()=>{Object.keys(active).forEach(k=>active[k]='');root.querySelectorAll('[data-filter]').forEach(x=>{x.classList.remove('is-active');x.setAttribute('aria-pressed','false')});apply()});
    const q=new URLSearchParams(location.search);groups.forEach(g=>{const key=g.dataset.filterGroup,param=g.dataset.filterParam,v=q.get(param);if(v){active[key]=norm(v);const b=g.querySelector(`[data-filter="${CSS.escape(norm(v))}"]`);if(b){b.classList.add('is-active');b.setAttribute('aria-pressed','true')}}});apply();
  });
  const form=document.querySelector('#tripSearch, .hero-search form, form.search-form'); const dest=document.querySelector('#searchDestination');
  if(form&&dest)form.addEventListener('submit',e=>{e.preventDefault();const v=dest.value;if(!v)return;const country=['peru','chile','ecuador','colombia','argentina','brasil','bolivia','mexico','costa-rica','uruguay','venezuela'].includes(v);location.href=`experiencias.html?${country?'destino':'ciudad'}=${encodeURIComponent(v)}`;});
});