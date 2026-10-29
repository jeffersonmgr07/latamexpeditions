/* Cotizador Latam Expeditions — v1: interfaz real, tarifas solo si hay datos verificables */
(() => {
  'use strict';
  const form = document.getElementById('flightsForm');
  if (!form) return;
  const el = id => document.getElementById(id);
  const origin = el('flightOrigin');
  const destination = el('flightDestination');
  const departure = el('flightDeparture');
  const returnDate = el('flightReturn');
  const returnWrap = el('flightReturnWrap');
  const adults = el('flightAdults');
  const children = el('flightChildren');
  const cabin = el('flightCabin');
  const error = el('flightError');
  const panel = el('flightResults');
  const WHATSAPP = '51900608980';
  const DAY = 24 * 60 * 60 * 1000;

  function iso(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }
  function addDays(date, days) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
    return iso(d);
  }
  function dateMs(v) {
    const ms = Date.parse(v + 'T12:00:00');
    return Number.isFinite(ms) ? ms : NaN;
  }
  function parseLabel(select) {
    return select.options[select.selectedIndex]?.textContent.trim() || select.value;
  }
  function updateTripType() {
    const roundtrip = form.elements.tripType.value === 'roundtrip';
    returnWrap.hidden = !roundtrip;
    returnDate.required = roundtrip;
    returnDate.disabled = !roundtrip;
  }
  function syncDates() {
    returnDate.min = departure.value || iso(new Date());
    if (departure.value && returnDate.value && returnDate.value < departure.value) {
      returnDate.value = addDays(new Date(departure.value + 'T12:00:00'), 6);
    }
  }
  function setError(msg) {
    error.textContent = msg || '';
    error.hidden = !msg;
  }
  const today = new Date();
  departure.min = iso(today);
  departure.value = addDays(today, 14);
  returnDate.value = addDays(today, 20);
  syncDates();
  updateTripType();
  departure.addEventListener('change', syncDates);
  form.querySelectorAll('[name="tripType"]').forEach(radio => radio.addEventListener('change', updateTripType));
  el('swapFlights').addEventListener('click', () => {
    const oldOrigin = origin.value;
    origin.value = destination.value;
    destination.value = oldOrigin;
  });

  // Permite compartir búsquedas mediante la URL; no almacena datos personales.
  const saved = new URLSearchParams(window.location.search);
  const validAirport = (select, val) => Array.from(select.options).some(opt => opt.value === val);
  if (validAirport(origin, saved.get('origin'))) origin.value = saved.get('origin');
  if (validAirport(destination, saved.get('destination'))) destination.value = saved.get('destination');
  if (['oneway', 'roundtrip'].includes(saved.get('trip'))) {
    form.querySelector('[name="tripType"][value="' + saved.get('trip') + '"]').checked = true;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(saved.get('departure') || '') && saved.get('departure') >= departure.min) departure.value = saved.get('departure');
  if (/^\d{4}-\d{2}-\d{2}$/.test(saved.get('return') || '')) returnDate.value = saved.get('return');
  if (/^[1-9]$/.test(saved.get('adults') || '')) adults.value = saved.get('adults');
  if (/^[0-6]$/.test(saved.get('children') || '')) children.value = saved.get('children');
  if (['economy', 'premium_economy', 'business'].includes(saved.get('cabin'))) cabin.value = saved.get('cabin');
  syncDates();
  updateTripType();

  async function getObservedPrices(query) {
    // Fuente futura: Google Sheets / Apps Script. Este JSON comienza vacío a propósito.
    const response = await fetch('assets/data/vuelos-historico.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo leer el historial');
    const records = await response.json();
    if (!Array.isArray(records)) throw new Error('Formato de historial no válido');
    const now = Date.now();
    const tripMs = dateMs(query.departure);
    const tripDays = query.trip === 'roundtrip' ? Math.round((dateMs(query.returnDate) - tripMs) / DAY) : 0;
    const found = records.filter(record => {
      if (record.origin !== query.origin || record.destination !== query.destination) return false;
      if (record.trip_type !== query.trip || record.cabin !== query.cabin || record.currency !== 'USD') return false;
      if (!Number.isFinite(record.price) || record.price <= 0) return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(record.departure_date || '') || !/^\d{4}-\d{2}-\d{2}$/.test(record.observed_at || '')) return false;
      const observed = dateMs(record.observed_at);
      if (!Number.isFinite(observed) || observed > now + DAY || now - observed > 120 * DAY) return false;
      if (Math.abs(dateMs(record.departure_date) - tripMs) > 45 * DAY) return false;
      if (query.trip === 'roundtrip') {
        const nights = Math.round((dateMs(record.return_date || '') - dateMs(record.departure_date)) / DAY);
        if (!Number.isFinite(nights) || Math.abs(tripDays - nights) > 3) return false;
      }
      // Solo precios documentados por adulto, sin margen añadido y sin condiciones inventadas.
      if (record.passenger_type !== 'adult' || !record.source) return false;
      return true;
    });
    return found;
  }
  const money = value => 'US$ ' + Math.round(value).toLocaleString('en-US');
  function showEstimate(records) {
    const values = records.map(v => v.price).sort((a, b) => a - b);
    const n = values.length;
    if (n < 3) return false;
    const median = n % 2 ? values[Math.floor(n / 2)] : (values[n / 2 - 1] + values[n / 2]) / 2;
    const low = values[Math.floor((n - 1) * 0.2)];
    const high = values[Math.ceil((n - 1) * 0.8)];
    el('flightPriceRange').textContent = money(low) + ' – ' + money(high);
    const lastSeen = records.map(v => v.observed_at).sort().pop();
    el('flightSampleInfo').textContent = n + ' observaciones verificadas · Mediana ' + money(median) + ' · Última observación ' + lastSeen;
    el('flightPriceBox').hidden = false;
    return true;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    setError('');
    panel.hidden = true;
    const trip = form.elements.tripType.value;
    const query = {
      origin: origin.value, destination: destination.value, trip,
      departure: departure.value, returnDate: trip === 'roundtrip' ? returnDate.value : '',
      adults: Number(adults.value), children: Number(children.value), cabin: cabin.value
    };
    if (query.origin === query.destination) { setError('El origen y el destino deben ser distintos.'); return; }
    if (!query.departure || query.departure < iso(new Date())) { setError('Selecciona una fecha de salida válida.'); return; }
    if (trip === 'roundtrip' && (!query.returnDate || query.returnDate < query.departure)) { setError('La fecha de regreso no puede ser anterior a la salida.'); return; }
    if (query.adults + query.children > 9) { setError('Para grupos de más de 9 pasajeros, solicita una cotización personalizada.'); return; }

    el('flightRouteTitle').textContent = parseLabel(origin) + '  →  ' + parseLabel(destination);
    const tripText = trip === 'roundtrip' ? 'Ida y vuelta' : 'Solo ida';
    const labelCabin = cabin.options[cabin.selectedIndex].textContent;
    el('flightRouteDetails').textContent = tripText + ' · Salida ' + query.departure +
      (query.returnDate ? ' · Regreso ' + query.returnDate : '') +
      ' · ' + query.adults + ' adulto(s), ' + query.children + ' niño(s) · ' + labelCabin;
    el('flightPriceBox').hidden = true;
    let message = 'Aún no contamos con suficientes precios históricos verificados para esta búsqueda. Puedes solicitar una cotización actualizada con nuestro equipo.';
    try {
      const records = await getObservedPrices(query);
      if (showEstimate(records)) {
        message = 'Este rango resume tarifas observadas en fechas cercanas, no es una oferta vigente ni garantiza equipaje, disponibilidad o precio final. Solicita una confirmación antes de pagar.';
      }
    } catch (err) {
      // Sin conexión al historial: no se inventan ni se mantienen resultados anteriores.
      message = 'No fue posible consultar el historial de tarifas. Puedes solicitar una cotización directamente con nuestro equipo.';
    }
    el('flightResultMessage').textContent = message;
    const request = [
      'Hola, Latam Expeditions. Quiero cotizar un vuelo.',
      'Ruta: ' + parseLabel(origin) + ' → ' + parseLabel(destination),
      'Trayecto: ' + tripText,
      'Salida: ' + query.departure,
      query.returnDate ? 'Regreso: ' + query.returnDate : '',
      'Adultos: ' + query.adults,
      'Niños (2–11 años): ' + query.children,
      'Cabina: ' + labelCabin,
      '¿Me confirman tarifa final, equipaje y disponibilidad?'
    ].filter(Boolean).join('\n');
    el('flightWhatsapp').href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(request);
    const qp = new URLSearchParams({ origin: query.origin, destination: query.destination, trip: query.trip, departure: query.departure, adults: String(query.adults), children: String(query.children), cabin: query.cabin });
    if (query.returnDate) qp.set('return', query.returnDate);
    window.history.replaceState(null, '', window.location.pathname + '?' + qp.toString());
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();