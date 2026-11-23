/* Cambio automático y navegación de fotos del paquete (cada 3 segundos). */
(function () {
  'use strict';
  var INTERVAL_MS = 3000;
  function initialize(carousel) {
    if (carousel.dataset.lxInitialized === 'true') return;
    carousel.dataset.lxInitialized = 'true';
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.lx-package-carousel__slide'));
    var prev = carousel.querySelector('[data-lx-carousel-prev]');
    var next = carousel.querySelector('[data-lx-carousel-next]');
    var counter = carousel.querySelector('[data-lx-carousel-counter]');
    var viewport = carousel.querySelector('.lx-package-carousel__viewport');
    if (!slides.length) return;
    var index = 0;
    var timer = null;
    var hovered = false;
    var focused = false;
    var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (slides.length === 1) carousel.setAttribute('data-lx-single', '');
    function show(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        var active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        var photo = slide.querySelector('img');
        if (photo && active) photo.setAttribute('loading', 'eager');
      });
      if (counter) counter.textContent = (index + 1) + ' / ' + slides.length;
    }
    function stop() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }
    function start() {
      stop();
      if (slides.length > 1 && !reduceMotion && !hovered && !focused && !document.hidden) {
        timer = window.setInterval(function () { show(index + 1); }, INTERVAL_MS);
      }
    }
    if (prev) prev.addEventListener('click', function () { show(index - 1); start(); });
    if (next) next.addEventListener('click', function () { show(index + 1); start(); });
    carousel.addEventListener('mouseenter', function () { hovered = true; stop(); });
    carousel.addEventListener('mouseleave', function () { hovered = false; start(); });
    carousel.addEventListener('focusin', function () { focused = true; stop(); });
    carousel.addEventListener('focusout', function (event) {
      if (!carousel.contains(event.relatedTarget)) { focused = false; start(); }
    });
    document.addEventListener('visibilitychange', function () { start(); });
    if (viewport && slides.length > 1) {
      var startX = null;
      viewport.addEventListener('touchstart', function (event) {
        startX = event.changedTouches[0] ? event.changedTouches[0].clientX : null;
      }, { passive: true });
      viewport.addEventListener('touchend', function (event) {
        if (startX === null || !event.changedTouches[0]) return;
        var delta = event.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(delta) > 45) { show(index + (delta < 0 ? 1 : -1)); start(); }
      }, { passive: true });
    }
    show(0);
    start();
  }
  function boot() {
    document.querySelectorAll('[data-lx-package-carousel]').forEach(initialize);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
