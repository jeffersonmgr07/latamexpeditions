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
  departure.max = addDays(today,365);
  returnDate.max = departure.max;
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

  const money = value => 'US$' + Number(value).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const submitButton = form.querySelector('button[type="submit"]');
  const offerContainer = el('flightLiveOffers');
  const count = el('flightResultCount');
  const priceSlider = el('flightMaxPrice');
  const airlineFilters = el('flightAirlineFilters');
  const airlineNames = {
    LA:'LATAM Airlines', JA:'JetSMART', AV:'Avianca', H2:'SKY Airline',
    CM:'Copa Airlines', AR:'Aerolíneas Argentinas', IB:'Iberia',
    AM:'Aeroméxico', G3:'GOL', AD:'Azul', AA:'American Airlines',
    UA:'United Airlines', DL:'Delta Air Lines', '2K':'Avianca Ecuador',
    P5:'Wingo', W4:'Wizz Air Malta', '4C':'LATAM Colombia',
    '5Q':'Euroairlines', VB:'Viva Aerobus', Y4:'Volaris', '9R':'SATENA'
  };
  let currentSearch = 0, allOffers = [], activeSort = 'price', currentQuery = null;
  function setBusy(busy) {
    submitButton.disabled = busy;
    submitButton.setAttribute('aria-busy', String(busy));
    submitButton.textContent = busy ? 'Consultando tarifas…' : 'Consultar vuelos';
  }
  function airlineName(code) {
    if (airlineNames[code]) return airlineNames[code];
    if (typeof code === 'string' && code.length > 3) return code;
    return code ? 'Aerolínea ' + code : 'Aerolínea no informada';
  }
  function stopLabel(n) {
    if (!Number.isInteger(n)) return 'Escalas no informadas';
    return n === 0 ? 'Vuelo directo' : n === 1 ? '1 escala' : n + ' escalas';
  }
  function durationLabel(minutes) {
    if (!Number.isFinite(minutes) || minutes <= 0) return 'Duración no informada';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return (h ? h + ' h ' : '') + (m ? m + ' min' : '');
  }
  function dateLabel(isoDate) {
    if (!isoDate || !/^\d{4}-\d\d-\d\d/.test(isoDate)) return 'Fecha no informada';
    return new Intl.DateTimeFormat('es-PE', {day:'2-digit', month:'short', year:'numeric'})
      .format(new Date(isoDate.slice(0,10) + 'T12:00:00'));
  }
  function departureTime(timestamp) {
    return /^\d{4}-\d\d-\d\d[T ]\d\d:\d\d/.test(timestamp || '')
      ? timestamp.slice(11,16) : '—';
  }
  function node(tag, cls, content) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (content !== undefined) n.textContent = String(content);
    return n;
  }
  function tripRow(label, from, to, timestamp, date, duration, stops, arrivalTime) {
    const line = node('div','flight-leg');
    const heading = node('div','flight-leg__label', label + ' · ' + dateLabel(date));
    const timeline = node('div','flight-leg__timeline');
    const left = node('div','flight-leg__endpoint');
    left.append(node('b','flight-leg__time', departureTime(timestamp)), node('small','',from));
    const mid = node('div','flight-leg__middle');
    mid.append(node('span','',durationLabel(duration)),node('span','flight-leg__arrow','━━━━ ✈ ━━━━'),node('small','',stopLabel(stops)));
    const right = node('div','flight-leg__endpoint flight-leg__endpoint--end');
    right.append(node('b','flight-leg__time',departureTime(arrivalTime)==='—'?'Llegada: —':departureTime(arrivalTime)), node('small','',to));
    timeline.append(left,mid,right);
    line.append(heading,timeline);
    return line;
  }
  function whatsappUrlForOffer(offer) {
    const q = currentQuery || {};
    const text = [
      'Hola, Latam Expeditions. Quiero confirmar una tarifa de vuelo.',
      'Ruta: ' + q.origin + ' → ' + q.destination,
      'Tipo: ' + (q.trip === 'roundtrip' ? 'ida y vuelta' : 'solo ida'),
      'Fechas de la tarifa: ' + offer.departure + (offer.returnDate ? ' / ' + offer.returnDate : ''),
      'Precio observado por adulto: ' + money(offer.price),
      'Aerolínea informada: ' + airlineName(offer.airline),
      'Escalas ida: ' + stopLabel(offer.stops),
      q.trip === 'roundtrip' ? 'Escalas vuelta: ' + stopLabel(offer.returnStops) : '',
      'Pasajeros: ' + q.adults + ' adulto(s), ' + q.children + ' niño(s)',
      '¿Me confirman horarios completos, equipaje, disponibilidad y tarifa final?'
    ].filter(Boolean).join('\n');
    return 'https://wa.me/51900608980?text=' + encodeURIComponent(text);
  }
  function leadDays(dateString) {
    const d = new Date(dateString + 'T12:00:00');
    const start = new Date(); start.setHours(12,0,0,0);
    return Math.round((d.getTime()-start.getTime())/86400000);
  }
  function commercialAdjustment(days) {
    if (days <= 44) return 0.10;
    if (days <= 60) return 0.05;
    if (days <= 90) return 0;
    if (days <= 180) return -0.05;
    if (days <= 270) return -0.10;
    return -0.15;
  }
  function addSegments(parent, title, trip) {
    if (!trip || !Array.isArray(trip.segments)) return;
    parent.append(node('h4','flight-segments__heading',title));
    trip.segments.forEach((seg,i)=>{
      const line=node('p','flight-segment-line');
      const airline=seg.airline||'Aerolínea no informada';
      line.textContent=(i+1)+'. '+(seg.from?.code||'?')+' '+(seg.from?.time||'—')+
        ' → '+(seg.to?.code||'?')+' '+(seg.to?.time||'—')+
        ' · '+airline+(seg.flightNumber?' ('+seg.flightNumber+')':'');
      parent.append(line);
      const lay=trip.layovers?.[i];
      if (lay) parent.append(node('p','flight-segment-layover',
        'Escala en '+(lay.airport||lay.name||'aeropuerto por confirmar')+
        (Number.isFinite(lay.duration)?' · '+durationLabel(lay.duration):'')));
    });
  }
  function quotedPrice(offer) {
    const days=leadDays(offer.departure || currentQuery.departure);
    return Math.round(offer.price*(1+commercialAdjustment(days))*100)/100;
  }
  function renderOffer(offer) {
    const card = node('article','flight-offer flight-offer--detailed');
    const body = node('div','flight-offer__body');
    const carrier = node('div','flight-offer__carrier');
    carrier.append(node('span','flight-offer__airline-icon','✈'),node('strong','',airlineName(offer.airline)));
    // Las propuestas para otras fechas no se mezclan con las solicitadas.
    body.append(carrier);
    body.append(tripRow('IDA',offer.originAirport || offer.origin || currentQuery.origin,
      offer.destinationAirport || offer.destination || currentQuery.destination,
      offer.departureAt || offer.outbound?.segments?.[0]?.from?.time,offer.departure,offer.durationTo,offer.stops,
      offer.outbound?.segments?.at(-1)?.to?.time));
    if (currentQuery.trip === 'roundtrip' && offer.returnDate) {
      body.append(tripRow('VUELTA',offer.destinationAirport || offer.destination || currentQuery.destination,
        offer.originAirport || offer.origin || currentQuery.origin,
        offer.returnAt || offer.inbound?.segments?.[0]?.from?.time,offer.returnDate,offer.durationBack,offer.returnStops,
        offer.inbound?.segments?.at(-1)?.to?.time));
    }
    const disclosure = node('details','flight-offer__disclosure');
    disclosure.append(node('summary','', 'Detalles del itinerario'));
    if (!offer.outbound?.segments?.length)
      disclosure.append(node('p','', 'Los horarios de conexión, equipaje y condiciones se confirman al reservar.'));
    if (offer.flightNumber) disclosure.append(node('p','','Vuelo: ' + offer.flightNumber));
    if (offer.outbound?.segments?.length) {
      addSegments(disclosure,'Tramos de ida',offer.outbound);
      addSegments(disclosure,'Tramos de vuelta',offer.inbound);
    }
    body.append(disclosure);
    const priceBlock = node('div','flight-offer__price-panel');
    priceBlock.append(
      node('span','flight-offer__price-kicker','Precio'),
      node('strong','flight-offer__price',money(quotedPrice(offer))),
      node('small','flight-offer__passenger','Por adulto · ' + (currentQuery.trip === 'roundtrip' ? 'ida y vuelta' : 'solo ida'))
    );
    const action = node('a','flight-offer__button','Reservar');
    // Visible contact request is separate from any airline booking.
    action.href='#flightQuoteModal';
    action.dataset.flightRequest='1';
    action.dataset.price=String(offer.price);
    action.dataset.outbound=offer.departure;
    action.dataset.inbound=offer.returnDate || '';
    priceBlock.append(action);
    card.append(body,priceBlock);
    return card;
  }
  function stopRank(o) {
    return (Number.isInteger(o.stops) ? o.stops : 99) +
       (currentQuery?.trip === 'roundtrip' ? (Number.isInteger(o.returnStops) ? o.returnStops : 99) : 0);
  }
  function durationRank(o) {
    const outward=Number.isFinite(o.durationTo)?o.durationTo:Infinity;
    const back=currentQuery?.trip==='roundtrip'?(Number.isFinite(o.durationBack)?o.durationBack:Infinity):0;
    return outward+back;
  }
  function renderFilteredOffers() {
    offerContainer.replaceChildren();
    const selectedAirlines = new Set(
      Array.from(airlineFilters.querySelectorAll('input[type="checkbox"]:checked')).map(input => input.value)
    );
    const filter = document.querySelector('[name="flightStopFilter"]:checked')?.value || 'all';
    const max = Number(priceSlider.value);
    const filtered = allOffers.filter(o => {
      if (!selectedAirlines.has(o.airline || '??') || quotedPrice(o) > max) return false;
      if (filter === 'direct' && o.stops !== 0) return false;
      if (filter === 'one' && (!Number.isInteger(o.stops) || o.stops > 1)) return false;
      return true;
    });
    filtered.sort((a,b)=>{
      if (activeSort==='stops') return stopRank(a)-stopRank(b) || quotedPrice(a)-quotedPrice(b);
      if (activeSort==='duration') return durationRank(a)-durationRank(b) || quotedPrice(a)-quotedPrice(b);
      return quotedPrice(a)-quotedPrice(b);
    });
    count.textContent = filtered.length + ' de ' + allOffers.length + ' opciones';
    if (!filtered.length) {
      offerContainer.append(node('div','flight-offer__empty','No hay tarifas que cumplan estos filtros. Restablece los filtros o solicita una cotización personalizada.'));
    }
    filtered.forEach(o=>offerContainer.append(renderOffer(o)));
    return filtered.length;
  }
  function resetFilters() {
    document.querySelector('[name="flightStopFilter"][value="all"]').checked=true;
    airlineFilters.querySelectorAll('input').forEach(input => input.checked=true);
    priceSlider.value=priceSlider.max;
    el('flightPriceMaximum').textContent=money(priceSlider.value);
    activeSort='price';
    document.querySelectorAll('[data-flight-sort]').forEach(button => {
      button.setAttribute('aria-pressed',String(button.dataset.flightSort === 'price'));
    });
    if (allOffers.length) renderFilteredOffers();
  }
  function setupFilters(offers) {
    allOffers=offers.filter(o=>Number.isFinite(o.price)&&o.price>0);
    airlineFilters.replaceChildren();
    const names=[...new Set(allOffers.map(o=>o.airline||'??'))].sort((a,b)=>airlineName(a).localeCompare(airlineName(b)));
    names.forEach(code => {
      const label=node('label','flight-airline-option');
      const box=node('input');
      box.type='checkbox';box.value=code;box.checked=true;
      box.addEventListener('change',renderFilteredOffers);
      label.append(box,node('span','',airlineName(code)));
      airlineFilters.append(label);
    });
    const prices=allOffers.map(quotedPrice);
    const min=prices.length?Math.floor(Math.min(...prices)):0;
    const max=prices.length?Math.ceil(Math.max(...prices)):0;
    priceSlider.min=String(min);
    priceSlider.max=String(max || 1);
    priceSlider.step='1';
    priceSlider.value=String(max || 1);
    priceSlider.disabled=!prices.length || min===max;
    el('flightPriceMinimum').textContent=prices.length?money(min):'—';
    el('flightPriceMaximum').textContent=prices.length?money(max):'—';
    document.querySelector('[data-flight-sort="duration"]').disabled=!allOffers.some(o=>Number.isFinite(durationRank(o)));
    resetFilters();
  }
  function showLiveOffers(answer) {
    const exact=(Array.isArray(answer.offers)?answer.offers:[]).filter(o=>
      o && o.departure===currentQuery.departure &&
      (currentQuery.trip!=='roundtrip' || o.returnDate===currentQuery.returnDate) &&
      o.sameDates!==false
    );
    setupFilters(exact);
    renderFilteredOffers();
    return allOffers.length>0;
  }
  document.querySelectorAll('[name="flightStopFilter"]').forEach(e=>e.addEventListener('change',renderFilteredOffers));
  document.querySelectorAll('[data-flight-sort]').forEach(button=>button.addEventListener('click',()=>{
    if (button.disabled) return;
    activeSort=button.dataset.flightSort;
    document.querySelectorAll('[data-flight-sort]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn===button)));
    renderFilteredOffers();
  }));
  priceSlider.addEventListener('input',()=>{
    el('flightPriceMaximum').textContent=money(priceSlider.value);
    renderFilteredOffers();
  });
  el('flightClearFilters').addEventListener('click',resetFilters);
  el('flightModifySearch').addEventListener('click',()=>form.scrollIntoView({behavior:'smooth',block:'center'}));
  // Apps Script ContentService uses a different origin. JSONP bypasses CORS without
  // exposing the API token. The backend validates the callback and returns data only.
  function getLivePrices(query) {
    const endpoint = String(window.LATAM_FLIGHTS_API_URL || '').trim();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(endpoint)) {
      return Promise.reject(new Error('not_configured'));
    }
    return new Promise((resolve,reject) => {
      const cb = 'latamFlightCb_' + String(Date.now()) + String(Math.floor(Math.random() * 100000));
      const url = new URL(endpoint);
      const params = { callback:cb, origin:query.origin, destination:query.destination,
        trip:query.trip, departure:query.departure, returnDate:query.returnDate, cabin:query.cabin };
      Object.keys(params).forEach(k => url.searchParams.set(k, params[k]));
      const script = document.createElement('script');
      let closed = false;
      let timeout;
      function finish(result, err) {
        if (closed) return;
        closed = true;
        clearTimeout(timeout);
        script.remove();
        delete window[cb];
        if (err) reject(err); else resolve(result);
      }
      window[cb] = result => finish(result, null);
      script.onerror = () => finish(null, new Error('network_error'));
      timeout = setTimeout(() => finish(null, new Error('timeout')), 65000);
      script.src = url.toString();
      document.head.appendChild(script);
    });
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
    if (leadDays(query.departure) < 2) { setError('Para evitar vuelos a menos de 24 horas, por ahora aceptamos salidas desde pasado mañana.'); return; }
    if (trip === 'roundtrip' && (!query.returnDate || query.returnDate < query.departure)) { setError('La fecha de regreso no puede ser anterior a la salida.'); return; }
    if (query.adults + query.children > 9) { setError('Para grupos de más de 9 pasajeros, solicita una cotización personalizada.'); return; }

    el('flightRouteTitle').textContent = parseLabel(origin) + '  →  ' + parseLabel(destination);
    const tripText = trip === 'roundtrip' ? 'Ida y vuelta' : 'Solo ida';
    const labelCabin = cabin.options[cabin.selectedIndex].textContent;
    el('flightRouteDetails').textContent = tripText + ' · Salida ' + query.departure +
      (query.returnDate ? ' · Regreso ' + query.returnDate : '') +
      ' · ' + query.adults + ' adulto(s), ' + query.children + ' niño(s) · ' + labelCabin;
    el('flightPriceBox').hidden = true;
    offerContainer.replaceChildren();
    allOffers = [];
    currentQuery = query;
    count.textContent = 'Buscando tarifas…';
    panel.hidden = false;
    el('flightResultMessage').textContent = 'Buscando vuelos para tus fechas…';
    const searchId = ++currentSearch;
    setBusy(true);
    let message = '';
    try {
      const live = await getLivePrices(query);
      if (searchId !== currentSearch) return;
      if (live.ok && showLiveOffers(live)) {
        message = 'Tarifas sujetas a disponibilidad y confirmación antes del pago.';
      } else if (live.ok) {
        setupFilters([]);
        count.textContent = 'No encontramos opciones para estas fechas';
        message = 'Prueba otras fechas o consulta con nuestro equipo para encontrar tu vuelo.';
      } else {
        message = live.message || 'No fue posible consultar tarifas. Solicita una cotización confirmada.';
      }
    } catch (err) {
      if (searchId !== currentSearch) return;
      message = err.message === 'not_configured'
        ? 'El buscador está preparado, pero aún falta activar la conexión con la fuente de tarifas. Solicita una cotización personalizada.'
        : 'La consulta de tarifas no respondió. Intenta nuevamente o solicita una cotización personalizada.';
    } finally {
      if (searchId === currentSearch) setBusy(false);
    }
    if (searchId !== currentSearch) return;
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