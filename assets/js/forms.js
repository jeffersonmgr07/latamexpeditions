/**
 * Latam Expeditions — envío de formularios de las páginas del footer.
 *
 * Cualquier <form data-form-action="X"> se valida y se envía por POST al mismo
 * backend de Google Apps Script que usan las reservas (catalog.booking.endpoint),
 * con { action: X, data: {campos} }. El Apps Script (Formularios.gs) envía el
 * correo a reservas@latamexpeditions.com y responde { ok: true }.
 *
 * Muestra el bloque [data-success] o [data-error] del mismo contenedor. Los
 * textos ya están traducidos por main.js (i18n), así que aquí solo se alternan.
 */
(function () {
  'use strict';

  const $ = (s, sc) => (sc || document).querySelector(s);
  const $$ = (s, sc) => Array.from((sc || document).querySelectorAll(s));
  const BASE = document.documentElement.dataset.base || './';
  const T = (s) => (window.LatamI18n && window.LatamI18n.t ? window.LatamI18n.t(s) : s);

  const forms = $$('form[data-form-action]');
  if (!forms.length) return;

  let cfgPromise = null;
  function getEndpoint() {
    if (!cfgPromise) {
      cfgPromise = fetch(`${BASE}assets/data/catalog.json`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((j) => (j.booking && j.booking.endpoint) || null)
        .catch(() => null);
    }
    return cfgPromise;
  }

  function validate(form) {
    let ok = true, first = null;
    $$('.form-field', form).forEach((field) => {
      const input = $('input, select, textarea', field);
      if (!input) return;
      const good = input.checkValidity();
      field.classList.toggle('has-error', !good);
      input.setAttribute('aria-invalid', String(!good));
      if (!good && ok) { first = input; ok = false; }
    });
    if (first) first.focus();
    return ok;
  }

  function collect(form) {
    const data = {};
    $$('input, select, textarea', form).forEach((el) => {
      if (!el.name) return;
      data[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
    });
    data.page = location.pathname;
    data.language = document.documentElement.lang || 'es';
    return data;
  }

  forms.forEach((form) => {
    const host = form.parentElement;
    const success = $('[data-success]', host) || $('[data-success]');
    const errorBox = $('[data-error]', host) || $('[data-error]');
    const btn = $('button[type="submit"]', form);

    $$('input, select, textarea', form).forEach((input) => {
      input.addEventListener('input', () => {
        const f = input.closest('.form-field');
        if (f && f.classList.contains('has-error') && input.checkValidity()) {
          f.classList.remove('has-error');
          input.setAttribute('aria-invalid', 'false');
        }
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (errorBox) errorBox.classList.remove('is-visible');
      if (!validate(form)) return;

      const original = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = T('Enviando…'); }

      try {
        const endpoint = await getEndpoint();
        if (!endpoint || /^PEGAR_AQUI/.test(endpoint)) throw new Error('endpoint no configurado');
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: form.dataset.formAction, data: collect(form) })
        });
        const json = await res.json().catch(() => ({ ok: res.ok }));
        if (!res.ok || json.ok === false) throw new Error(json.error || 'error del servidor');

        form.reset();
        form.style.display = 'none';
        if (success) {
          success.classList.add('is-visible');
          success.setAttribute('role', 'status');
          success.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      } catch (err) {
        if (errorBox) {
          errorBox.classList.add('is-visible');
          errorBox.setAttribute('role', 'alert');
          errorBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = original; }
      }
    });
  });
})();
