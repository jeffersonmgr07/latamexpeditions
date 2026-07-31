/**
 * Latam Expeditions — reserva unificada para experiencias y paquetes.
 * Adultos/niños, nacionalidades, hotel/ocupación y pago seguro con PayPal.
 */
(function () {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const BASE = document.documentElement.dataset.base || './';
  const T = (text) => window.LatamI18n?.t ? window.LatamI18n.t(text) : text;
  const applyI18n = (root) => { try { window.LatamI18n?.apply?.(root); } catch (_) {} };
  const trigger = $('[data-book]');
  if (!trigger) return;

  const parseJSON = (value, fallback) => {
    try { return value ? JSON.parse(value) : fallback; }
    catch (error) { console.warn('[booking] JSON inválido', error); return fallback; }
  };
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  const round2 = (value) => Math.round(Number(value) * 100) / 100;
  const money = (value) => `USD ${Number(value).toLocaleString(document.documentElement.lang === 'en' ? 'en-US' : 'es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const assetURL = (path) => {
    const value = String(path || '').trim();
    if (!value) return '';
    if (/^(?:https?:)?\/\//i.test(value) || value.startsWith('/') || value.startsWith('data:') || value.startsWith('blob:')) return value;
    return `${BASE}${value.replace(/^\.?\//, '')}`;
  };
  const languageIsEnglish = () => document.documentElement.lang === 'en';
  const tierHotels = (tier, english = languageIsEnglish()) => {
    const translated = english && Array.isArray(tier?.hotelsEn) ? tier.hotelsEn : null;
    return translated || (Array.isArray(tier?.hotels) ? tier.hotels : []);
  };
  const tierOptionLabel = (tier, english = languageIsEnglish()) => {
    if (!tier) return '';
    const explicit = english ? tier.optionLabelEn : tier.optionLabel;
    if (explicit) return explicit;
    const category = english ? (tier.starsEn || tier.stars || '') : (tier.stars || '');
    const hotels = tierHotels(tier, english);
    const name = hotels.length === 1
      ? hotels[0]
      : (english ? (tier.nameEn || tier.name || '') : (tier.name || ''));
    return [category, name].filter(Boolean).join(' · ');
  };

  const COUNTRIES = [
    [
        "Afganistán",
        "Afghanistan"
    ],
    [
        "Albania",
        "Albania"
    ],
    [
        "Alemania",
        "Germany"
    ],
    [
        "Andorra",
        "Andorra"
    ],
    [
        "Angola",
        "Angola"
    ],
    [
        "Anguila",
        "Anguilla"
    ],
    [
        "Antigua y Barbuda",
        "Antigua & Barbuda"
    ],
    [
        "Antártida",
        "Antarctica"
    ],
    [
        "Arabia Saudí",
        "Saudi Arabia"
    ],
    [
        "Argelia",
        "Algeria"
    ],
    [
        "Argentina",
        "Argentina"
    ],
    [
        "Armenia",
        "Armenia"
    ],
    [
        "Aruba",
        "Aruba"
    ],
    [
        "Australia",
        "Australia"
    ],
    [
        "Austria",
        "Austria"
    ],
    [
        "Azerbaiyán",
        "Azerbaijan"
    ],
    [
        "Bahamas",
        "Bahamas"
    ],
    [
        "Bangladés",
        "Bangladesh"
    ],
    [
        "Barbados",
        "Barbados"
    ],
    [
        "Baréin",
        "Bahrain"
    ],
    [
        "Belice",
        "Belize"
    ],
    [
        "Benín",
        "Benin"
    ],
    [
        "Bermudas",
        "Bermuda"
    ],
    [
        "Bielorrusia",
        "Belarus"
    ],
    [
        "Bolivia",
        "Bolivia"
    ],
    [
        "Bosnia y Herzegovina",
        "Bosnia & Herzegovina"
    ],
    [
        "Botsuana",
        "Botswana"
    ],
    [
        "Brasil",
        "Brazil"
    ],
    [
        "Brunéi",
        "Brunei"
    ],
    [
        "Bulgaria",
        "Bulgaria"
    ],
    [
        "Burkina Faso",
        "Burkina Faso"
    ],
    [
        "Burundi",
        "Burundi"
    ],
    [
        "Bután",
        "Bhutan"
    ],
    [
        "Bélgica",
        "Belgium"
    ],
    [
        "Cabo Verde",
        "Cape Verde"
    ],
    [
        "Camboya",
        "Cambodia"
    ],
    [
        "Camerún",
        "Cameroon"
    ],
    [
        "Canadá",
        "Canada"
    ],
    [
        "Canarias",
        "Canary Islands"
    ],
    [
        "Caribe neerlandés",
        "Caribbean Netherlands"
    ],
    [
        "Catar",
        "Qatar"
    ],
    [
        "Ceuta y Melilla",
        "Ceuta & Melilla"
    ],
    [
        "Chad",
        "Chad"
    ],
    [
        "Chequia",
        "Czechia"
    ],
    [
        "Chile",
        "Chile"
    ],
    [
        "China",
        "China"
    ],
    [
        "Chipre",
        "Cyprus"
    ],
    [
        "Ciudad del Vaticano",
        "Vatican City"
    ],
    [
        "Colombia",
        "Colombia"
    ],
    [
        "Comoras",
        "Comoros"
    ],
    [
        "Congo",
        "Congo - Brazzaville"
    ],
    [
        "Corea del Norte",
        "North Korea"
    ],
    [
        "Corea del Sur",
        "South Korea"
    ],
    [
        "Costa Rica",
        "Costa Rica"
    ],
    [
        "Croacia",
        "Croatia"
    ],
    [
        "Cuba",
        "Cuba"
    ],
    [
        "Curazao",
        "Curaçao"
    ],
    [
        "Côte d’Ivoire",
        "Côte d’Ivoire"
    ],
    [
        "Diego García",
        "Diego Garcia"
    ],
    [
        "Dinamarca",
        "Denmark"
    ],
    [
        "Dominica",
        "Dominica"
    ],
    [
        "Ecuador",
        "Ecuador"
    ],
    [
        "Egipto",
        "Egypt"
    ],
    [
        "El Salvador",
        "El Salvador"
    ],
    [
        "Emiratos Árabes Unidos",
        "United Arab Emirates"
    ],
    [
        "Eritrea",
        "Eritrea"
    ],
    [
        "Eslovaquia",
        "Slovakia"
    ],
    [
        "Eslovenia",
        "Slovenia"
    ],
    [
        "España",
        "Spain"
    ],
    [
        "Estados Unidos",
        "United States"
    ],
    [
        "Estonia",
        "Estonia"
    ],
    [
        "Esuatini",
        "Eswatini"
    ],
    [
        "Etiopía",
        "Ethiopia"
    ],
    [
        "Filipinas",
        "Philippines"
    ],
    [
        "Finlandia",
        "Finland"
    ],
    [
        "Fiyi",
        "Fiji"
    ],
    [
        "Francia",
        "France"
    ],
    [
        "Gabón",
        "Gabon"
    ],
    [
        "Gambia",
        "Gambia"
    ],
    [
        "Georgia",
        "Georgia"
    ],
    [
        "Ghana",
        "Ghana"
    ],
    [
        "Gibraltar",
        "Gibraltar"
    ],
    [
        "Granada",
        "Grenada"
    ],
    [
        "Grecia",
        "Greece"
    ],
    [
        "Groenlandia",
        "Greenland"
    ],
    [
        "Guadalupe",
        "Guadeloupe"
    ],
    [
        "Guam",
        "Guam"
    ],
    [
        "Guatemala",
        "Guatemala"
    ],
    [
        "Guayana Francesa",
        "French Guiana"
    ],
    [
        "Guernesey",
        "Guernsey"
    ],
    [
        "Guinea",
        "Guinea"
    ],
    [
        "Guinea Ecuatorial",
        "Equatorial Guinea"
    ],
    [
        "Guinea-Bisáu",
        "Guinea-Bissau"
    ],
    [
        "Guyana",
        "Guyana"
    ],
    [
        "Haití",
        "Haiti"
    ],
    [
        "Honduras",
        "Honduras"
    ],
    [
        "Hungría",
        "Hungary"
    ],
    [
        "India",
        "India"
    ],
    [
        "Indonesia",
        "Indonesia"
    ],
    [
        "Irak",
        "Iraq"
    ],
    [
        "Irlanda",
        "Ireland"
    ],
    [
        "Irán",
        "Iran"
    ],
    [
        "Isla Bouvet",
        "Bouvet Island"
    ],
    [
        "Isla Clipperton",
        "Clipperton Island"
    ],
    [
        "Isla Norfolk",
        "Norfolk Island"
    ],
    [
        "Isla de Man",
        "Isle of Man"
    ],
    [
        "Isla de Navidad",
        "Christmas Island"
    ],
    [
        "Isla de la Ascensión",
        "Ascension Island"
    ],
    [
        "Islandia",
        "Iceland"
    ],
    [
        "Islas Aland",
        "Åland Islands"
    ],
    [
        "Islas Caimán",
        "Cayman Islands"
    ],
    [
        "Islas Cocos",
        "Cocos (Keeling) Islands"
    ],
    [
        "Islas Cook",
        "Cook Islands"
    ],
    [
        "Islas Feroe",
        "Faroe Islands"
    ],
    [
        "Islas Georgia del Sur y Sandwich del Sur",
        "South Georgia & South Sandwich Islands"
    ],
    [
        "Islas Heard y McDonald",
        "Heard & McDonald Islands"
    ],
    [
        "Islas Malvinas",
        "Falkland Islands"
    ],
    [
        "Islas Marianas del Norte",
        "Northern Mariana Islands"
    ],
    [
        "Islas Marshall",
        "Marshall Islands"
    ],
    [
        "Islas Pitcairn",
        "Pitcairn Islands"
    ],
    [
        "Islas Salomón",
        "Solomon Islands"
    ],
    [
        "Islas Turcas y Caicos",
        "Turks & Caicos Islands"
    ],
    [
        "Islas Vírgenes Británicas",
        "British Virgin Islands"
    ],
    [
        "Islas Vírgenes de EE. UU.",
        "U.S. Virgin Islands"
    ],
    [
        "Islas menores alejadas de EE. UU.",
        "U.S. Outlying Islands"
    ],
    [
        "Israel",
        "Israel"
    ],
    [
        "Italia",
        "Italy"
    ],
    [
        "Jamaica",
        "Jamaica"
    ],
    [
        "Japón",
        "Japan"
    ],
    [
        "Jersey",
        "Jersey"
    ],
    [
        "Jordania",
        "Jordan"
    ],
    [
        "Kazajistán",
        "Kazakhstan"
    ],
    [
        "Kenia",
        "Kenya"
    ],
    [
        "Kirguistán",
        "Kyrgyzstan"
    ],
    [
        "Kiribati",
        "Kiribati"
    ],
    [
        "Kosovo",
        "Kosovo"
    ],
    [
        "Kuwait",
        "Kuwait"
    ],
    [
        "Laos",
        "Laos"
    ],
    [
        "Lesoto",
        "Lesotho"
    ],
    [
        "Letonia",
        "Latvia"
    ],
    [
        "Liberia",
        "Liberia"
    ],
    [
        "Libia",
        "Libya"
    ],
    [
        "Liechtenstein",
        "Liechtenstein"
    ],
    [
        "Lituania",
        "Lithuania"
    ],
    [
        "Luxemburgo",
        "Luxembourg"
    ],
    [
        "Líbano",
        "Lebanon"
    ],
    [
        "Macedonia del Norte",
        "North Macedonia"
    ],
    [
        "Madagascar",
        "Madagascar"
    ],
    [
        "Malasia",
        "Malaysia"
    ],
    [
        "Malaui",
        "Malawi"
    ],
    [
        "Maldivas",
        "Maldives"
    ],
    [
        "Mali",
        "Mali"
    ],
    [
        "Malta",
        "Malta"
    ],
    [
        "Marruecos",
        "Morocco"
    ],
    [
        "Martinica",
        "Martinique"
    ],
    [
        "Mauricio",
        "Mauritius"
    ],
    [
        "Mauritania",
        "Mauritania"
    ],
    [
        "Mayotte",
        "Mayotte"
    ],
    [
        "Micronesia",
        "Micronesia"
    ],
    [
        "Moldavia",
        "Moldova"
    ],
    [
        "Mongolia",
        "Mongolia"
    ],
    [
        "Montenegro",
        "Montenegro"
    ],
    [
        "Montserrat",
        "Montserrat"
    ],
    [
        "Mozambique",
        "Mozambique"
    ],
    [
        "Myanmar (Birmania)",
        "Myanmar (Burma)"
    ],
    [
        "México",
        "Mexico"
    ],
    [
        "Mónaco",
        "Monaco"
    ],
    [
        "Naciones Unidas",
        "United Nations"
    ],
    [
        "Namibia",
        "Namibia"
    ],
    [
        "Nauru",
        "Nauru"
    ],
    [
        "Nepal",
        "Nepal"
    ],
    [
        "Nicaragua",
        "Nicaragua"
    ],
    [
        "Nigeria",
        "Nigeria"
    ],
    [
        "Niue",
        "Niue"
    ],
    [
        "Noruega",
        "Norway"
    ],
    [
        "Nueva Caledonia",
        "New Caledonia"
    ],
    [
        "Nueva Zelanda",
        "New Zealand"
    ],
    [
        "Níger",
        "Niger"
    ],
    [
        "Omán",
        "Oman"
    ],
    [
        "Pakistán",
        "Pakistan"
    ],
    [
        "Palaos",
        "Palau"
    ],
    [
        "Panamá",
        "Panama"
    ],
    [
        "Papúa Nueva Guinea",
        "Papua New Guinea"
    ],
    [
        "Paraguay",
        "Paraguay"
    ],
    [
        "Países Bajos",
        "Netherlands"
    ],
    [
        "Perú",
        "Peru"
    ],
    [
        "Polinesia Francesa",
        "French Polynesia"
    ],
    [
        "Polonia",
        "Poland"
    ],
    [
        "Portugal",
        "Portugal"
    ],
    [
        "Pseudoacentos",
        "Pseudo-Accents"
    ],
    [
        "Pseudobidi",
        "Pseudo-Bidi"
    ],
    [
        "Puerto Rico",
        "Puerto Rico"
    ],
    [
        "RAE de Hong Kong (China)",
        "Hong Kong SAR China"
    ],
    [
        "RAE de Macao (China)",
        "Macao SAR China"
    ],
    [
        "Región desconocida",
        "Unknown Region"
    ],
    [
        "Reino Unido",
        "United Kingdom"
    ],
    [
        "República Centroafricana",
        "Central African Republic"
    ],
    [
        "República Democrática del Congo",
        "Congo - Kinshasa"
    ],
    [
        "República Dominicana",
        "Dominican Republic"
    ],
    [
        "Reunión",
        "Réunion"
    ],
    [
        "Ruanda",
        "Rwanda"
    ],
    [
        "Rumanía",
        "Romania"
    ],
    [
        "Rusia",
        "Russia"
    ],
    [
        "Samoa",
        "Samoa"
    ],
    [
        "Samoa Americana",
        "American Samoa"
    ],
    [
        "San Bartolomé",
        "St. Barthélemy"
    ],
    [
        "San Cristóbal y Nieves",
        "St. Kitts & Nevis"
    ],
    [
        "San Marino",
        "San Marino"
    ],
    [
        "San Martín",
        "St. Martin"
    ],
    [
        "San Pedro y Miquelón",
        "St. Pierre & Miquelon"
    ],
    [
        "San Vicente y las Granadinas",
        "St. Vincent & Grenadines"
    ],
    [
        "Santa Elena",
        "St. Helena"
    ],
    [
        "Santa Lucía",
        "St. Lucia"
    ],
    [
        "Santo Tomé y Príncipe",
        "São Tomé & Príncipe"
    ],
    [
        "Senegal",
        "Senegal"
    ],
    [
        "Serbia",
        "Serbia"
    ],
    [
        "Seychelles",
        "Seychelles"
    ],
    [
        "Sierra Leona",
        "Sierra Leone"
    ],
    [
        "Singapur",
        "Singapore"
    ],
    [
        "Sint Maarten",
        "Sint Maarten"
    ],
    [
        "Siria",
        "Syria"
    ],
    [
        "Somalia",
        "Somalia"
    ],
    [
        "Sri Lanka",
        "Sri Lanka"
    ],
    [
        "Sudáfrica",
        "South Africa"
    ],
    [
        "Sudán",
        "Sudan"
    ],
    [
        "Sudán del Sur",
        "South Sudan"
    ],
    [
        "Suecia",
        "Sweden"
    ],
    [
        "Suiza",
        "Switzerland"
    ],
    [
        "Surinam",
        "Suriname"
    ],
    [
        "Svalbard y Jan Mayen",
        "Svalbard & Jan Mayen"
    ],
    [
        "Sáhara Occidental",
        "Western Sahara"
    ],
    [
        "Tailandia",
        "Thailand"
    ],
    [
        "Taiwán",
        "Taiwan"
    ],
    [
        "Tanzania",
        "Tanzania"
    ],
    [
        "Tayikistán",
        "Tajikistan"
    ],
    [
        "Territorio Británico del Océano Índico",
        "British Indian Ocean Territory"
    ],
    [
        "Territorios Australes Franceses",
        "French Southern Territories"
    ],
    [
        "Territorios Palestinos",
        "Palestinian Territories"
    ],
    [
        "Territorios alejados de Oceanía",
        "Outlying Oceania"
    ],
    [
        "Timor-Leste",
        "Timor-Leste"
    ],
    [
        "Togo",
        "Togo"
    ],
    [
        "Tokelau",
        "Tokelau"
    ],
    [
        "Tonga",
        "Tonga"
    ],
    [
        "Trinidad y Tobago",
        "Trinidad & Tobago"
    ],
    [
        "Tristán de Acuña",
        "Tristan da Cunha"
    ],
    [
        "Turkmenistán",
        "Turkmenistan"
    ],
    [
        "Turquía",
        "Türkiye"
    ],
    [
        "Tuvalu",
        "Tuvalu"
    ],
    [
        "Túnez",
        "Tunisia"
    ],
    [
        "Ucrania",
        "Ukraine"
    ],
    [
        "Uganda",
        "Uganda"
    ],
    [
        "Unión Europea",
        "European Union"
    ],
    [
        "Uruguay",
        "Uruguay"
    ],
    [
        "Uzbekistán",
        "Uzbekistan"
    ],
    [
        "Vanuatu",
        "Vanuatu"
    ],
    [
        "Venezuela",
        "Venezuela"
    ],
    [
        "Vietnam",
        "Vietnam"
    ],
    [
        "Wallis y Futuna",
        "Wallis & Futuna"
    ],
    [
        "Yemen",
        "Yemen"
    ],
    [
        "Yibuti",
        "Djibouti"
    ],
    [
        "Zambia",
        "Zambia"
    ],
    [
        "Zimbabue",
        "Zimbabwe"
    ],
    [
        "zona del euro",
        "Eurozone"
    ]
];

  const PRODUCT = {
    slug: trigger.dataset.book,
    kind: trigger.dataset.bookKind || 'experience',
    title: trigger.dataset.bookTitle || '',
    price: Number(trigger.dataset.bookPrice || 0),
    country: trigger.dataset.bookCountry || '',
    duration: trigger.dataset.bookDuration || '',
    tiers: parseJSON(trigger.dataset.bookTiers, []),
    departures: parseJSON(trigger.dataset.bookDepartures, []),
    childFactor: Number(trigger.dataset.bookChildFactor || (trigger.dataset.bookKind === 'package' ? 0.70 : 0.75)),
    childMinAge: Number(trigger.dataset.bookChildMinAge || 0)
  };

  let CONFIG = null;
  let step = 1;
  let paypalButtons = null;
  let paymentInProgress = false;
  const state = {
    date: '', departureTime: PRODUCT.departures[0] || '', adults: 2, children: 0,
    travelers: 2, tier: PRODUCT.tiers[0]?.code || null, occupancy: 'double',
    holder: {}, passengers: [], adultUnit: PRODUCT.price, childUnit: round2(PRODUCT.price * PRODUCT.childFactor),
    total: 0, due: 0, mode: 'deposito', requestKey: ''
  };

  const nationalityOptions = () => `<option value="" data-en="Select a nationality">Selecciona una nacionalidad</option>${COUNTRIES.map(([es, en]) => `<option value="${escapeHTML(es)}" data-en="${escapeHTML(en)}">${escapeHTML(es)}</option>`).join('')}`;
  const numberOptions = (min, max, selected) => Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => `<option value="${n}" ${n === selected ? 'selected' : ''}>${n}</option>`).join('');

  function getTier() {
    return PRODUCT.tiers.find((tier) => tier.code === state.tier) || PRODUCT.tiers[0] || null;
  }

  function selectedAdultPrice() {
    const tier = getTier();
    if (!tier) return PRODUCT.price;
    const occupancyPrices = tier.occupancyPrices || {};
    return Number(occupancyPrices[state.occupancy] ?? tier.pricePerPerson ?? PRODUCT.price);
  }

  function calculateCharge(total) {
    if (total <= CONFIG.payFullBelow) return { due: round2(total), mode: 'completo' };
    let due = Math.ceil((total * CONFIG.depositPercent) / 100 / CONFIG.depositRoundTo) * CONFIG.depositRoundTo;
    due = Math.max(CONFIG.depositMin, Math.min(due, CONFIG.depositMax));
    return { due: Math.min(round2(total), due), mode: 'deposito' };
  }

  function recalculate() {
    state.travelers = state.adults + state.children;
    state.adultUnit = round2(selectedAdultPrice());
    state.childUnit = round2(state.adultUnit * PRODUCT.childFactor);
    state.total = round2(state.adults * state.adultUnit + state.children * state.childUnit);
    const charge = calculateCharge(state.total);
    state.due = charge.due;
    state.mode = charge.mode;
    updateLiveQuote();
    updateHotelPreview();
  }

  function updateLiveQuote() {
    const totalPax = $('#bkTravelerTotal');
    if (totalPax) totalPax.textContent = String(state.travelers);
    const live = $('#bkLivePrice');
    if (live) live.textContent = money(state.total);
    const unit = $('#bkLiveUnit');
    if (unit) unit.textContent = state.children ? `${money(state.adultUnit)} / ${money(state.childUnit)}` : money(state.adultUnit);
  }


  function updateHotelPreview() {
    const preview = $('#bkHotelPreview');
    if (!preview) return;
    const tier = getTier();
    if (!tier) { preview.hidden = true; return; }

    const english = languageIsEnglish();
    const image = $('#bkHotelImage');
    const placeholder = $('#bkHotelPlaceholder');
    const placeholderText = $('#bkHotelPlaceholderText');
    const badge = $('#bkHotelBadge');
    const name = $('#bkHotelName');
    const caption = $('#bkHotelCaption');
    const hotels = tierHotels(tier, english);
    const noAccommodation = Boolean(tier.noAccommodation || tier.code === 'sin-hotel');
    const selectedName = noAccommodation
      ? (english ? 'Tour only, no accommodation' : 'Solo tour, sin alojamiento')
      : (hotels.join(' / ') || (english ? (tier.nameEn || tier.name) : tier.name));

    preview.hidden = false;
    badge.textContent = english ? (tier.starsEn || tier.stars || 'Hotel') : (tier.stars || 'Hotel');
    name.textContent = selectedName;
    caption.textContent = noAccommodation
      ? (english ? 'This option does not include a hotel night.' : 'Esta opción no incluye noche de hotel.')
      : (english ? 'Reference photo of the selected accommodation.' : 'Foto referencial del alojamiento seleccionado.');

    const imagePath = tier.image || '';
    const showPlaceholder = (text) => {
      image.hidden = true;
      image.removeAttribute('src');
      placeholder.hidden = false;
      placeholderText.textContent = text;
    };

    if (!imagePath) {
      showPlaceholder(noAccommodation
        ? (english ? 'Tour without accommodation' : 'Tour sin alojamiento')
        : (english ? 'Hotel photo pending' : 'Foto del hotel pendiente'));
      return;
    }

    placeholder.hidden = true;
    image.hidden = false;
    image.alt = english ? (tier.imageAltEn || tier.imageAlt || selectedName) : (tier.imageAlt || selectedName);
    image.onload = () => { image.hidden = false; placeholder.hidden = true; };
    image.onerror = () => showPlaceholder(english ? 'Hotel photo pending' : 'Foto del hotel pendiente');
    image.src = assetURL(imagePath);
  }

  function buildModal() {
    const departure = PRODUCT.departures.length ? `
      <div class="form-field">
        <label for="bkDeparture">Horario de salida</label>
        <select id="bkDeparture" required>
          <option value="">Selecciona un horario</option>
          ${PRODUCT.departures.map((time) => `<option value="${escapeHTML(time)}" ${time === state.departureTime ? 'selected' : ''}>${escapeHTML(time)}</option>`).join('')}
        </select>
        <span class="form-error">Selecciona una hora de salida.</span>
      </div>` : '';

    const tierFields = PRODUCT.tiers.length ? `
      <div class="booking-subsection booking-subsection--hotel">
        <h3 data-en="Hotel option and accommodation">Opción de hotel y acomodación</h3>
        <div class="booking-form-grid booking-form-grid--2">
          <div class="form-field">
            <label for="bkTier" data-en="Hotel option">Opción de hotel</label>
            <select id="bkTier" required>${PRODUCT.tiers.map((tier) => `<option value="${escapeHTML(tier.code)}" data-en="${escapeHTML(tierOptionLabel(tier, true))}">${escapeHTML(tierOptionLabel(tier, false))}</option>`).join('')}</select>
          </div>
          <div class="form-field">
            <label for="bkOccupancy">Acomodación</label>
            <select id="bkOccupancy" required>
              <option value="single">Habitación simple</option>
              <option value="double" selected>Habitación doble</option>
              <option value="matrimonial">Habitación matrimonial</option>
              <option value="triple">Habitación triple</option>
              <option value="family">Habitación familiar</option>
            </select>
          </div>
        </div>
        <figure class="booking-hotel-preview" id="bkHotelPreview">
          <div class="booking-hotel-preview__media">
            <img id="bkHotelImage" alt="" loading="lazy" decoding="async" hidden>
            <div class="booking-hotel-preview__placeholder" id="bkHotelPlaceholder">
              <i class="fa-solid fa-hotel" aria-hidden="true"></i>
              <span id="bkHotelPlaceholderText">Foto del hotel pendiente</span>
            </div>
          </div>
          <figcaption class="booking-hotel-preview__content">
            <span class="booking-hotel-preview__badge" id="bkHotelBadge">Hotel</span>
            <strong id="bkHotelName">—</strong>
            <small id="bkHotelCaption"></small>
          </figcaption>
        </figure>
        <div class="booking-live-quote"><span>Precio por adulto / niño</span><strong id="bkLiveUnit">—</strong><span>Total referencial</span><strong id="bkLivePrice">—</strong></div>
        <p class="form-note" data-en="The child price is calculated at ${Math.round(PRODUCT.childFactor * 100)}% of the selected adult fare. The final hotel or an equivalent property is confirmed before payment.">El precio infantil se calcula al ${Math.round(PRODUCT.childFactor * 100)}% de la tarifa adulta seleccionada. El hotel final o uno equivalente se confirma antes del pago.</p>
      </div>` : '';

    const modal = document.createElement('div');
    modal.className = 'booking-modal';
    modal.id = 'bookingModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'bookingTitle');
    modal.innerHTML = `
      <div class="booking-box">
        <div class="booking-head">
          <div><h2 id="bookingTitle">Reservar ${escapeHTML(PRODUCT.title)}</h2><p>${escapeHTML(PRODUCT.country)} · ${escapeHTML(PRODUCT.duration)}</p></div>
          <button type="button" class="close-modal" data-close-booking aria-label="Cerrar reserva">&times;</button>
        </div>
        <ol class="booking-steps">
          <li data-step-label="1" aria-current="step">Fecha y viajeros</li>
          <li data-step-label="2">Datos de pasajeros</li>
          <li data-step-label="3">Pago</li>
        </ol>
        <div class="booking-body">
          <div class="booking-error" id="bookingError" role="alert"></div>

          <section class="booking-step is-active" data-step="1">
            <div class="booking-form-grid booking-form-grid--2">
              <div class="form-field"><label for="bkDate">Fecha del tour</label><input type="date" id="bkDate" required><small>Con al menos <span id="bkLeadDays"></span> días de anticipación.</small><span class="form-error">Elige una fecha válida.</span></div>
              ${departure || '<div class="form-field booking-field-placeholder" aria-hidden="true"></div>'}
            </div>
            <div class="booking-subsection">
              <h3>Viajeros</h3>
              <div class="booking-form-grid booking-form-grid--3 travelers-grid">
                <div class="form-field"><label for="bkAdults">Adultos</label><select id="bkAdults">${numberOptions(1, 12, state.adults)}</select></div>
                <div class="form-field"><label for="bkChildren">Niños</label><select id="bkChildren">${numberOptions(0, 8, state.children)}</select><small>${PRODUCT.childMinAge ? `${PRODUCT.childMinAge} a 11 años · menores, coordinar por WhatsApp` : '0 a 11 años'}</small></div>
                <div class="traveler-total"><span>Total de viajeros</span><strong id="bkTravelerTotal">${state.travelers}</strong></div>
              </div>
            </div>
            ${tierFields}
            <div class="booking-subsection">
              <h3>Contacto del titular</h3>
              <div class="booking-form-grid booking-form-grid--2">
                <div class="form-field"><label for="bkEmail">Correo del titular</label><input type="email" id="bkEmail" autocomplete="email" required><span class="form-error">Escribe un correo válido.</span></div>
                <div class="form-field"><label for="bkPhone">Teléfono / WhatsApp</label><input type="tel" id="bkPhone" autocomplete="tel" minlength="5" required><span class="form-error">Escribe un teléfono válido.</span></div>
              </div>
              <div class="form-field"><label for="bkNotes">Comentarios o solicitudes (opcional)</label><textarea id="bkNotes" rows="3" maxlength="1200"></textarea></div>
            </div>
          </section>

          <section class="booking-step" data-step="2">
            <p class="form-note">Los nombres deben coincidir exactamente con el documento de viaje. Completa los datos de cada adulto y niño.</p>
            <div id="bkPaxList"></div>
          </section>

          <section class="booking-step" data-step="3">
            <div class="booking-summary">
              <div class="fact-row"><span>Experiencia</span><strong>${escapeHTML(PRODUCT.title)}</strong></div>
              <div class="fact-row"><span>Fecha</span><strong id="bkSumDate">—</strong></div>
              <div class="fact-row" ${PRODUCT.departures.length ? '' : 'hidden'}><span>Horario de salida</span><strong id="bkSumDeparture">—</strong></div>
              <div class="fact-row"><span>Adultos</span><strong id="bkSumAdults">—</strong></div>
              <div class="fact-row"><span>Niños</span><strong id="bkSumChildren">—</strong></div>
              <div class="fact-row"><span>Total de viajeros</span><strong id="bkSumPax">—</strong></div>
              <div class="fact-row" ${PRODUCT.tiers.length ? '' : 'hidden'}><span data-en="Hotel option">Opción de hotel</span><strong id="bkSumTier">—</strong></div>
              <div class="fact-row" ${PRODUCT.tiers.length ? '' : 'hidden'}><span>Acomodación</span><strong id="bkSumOccupancy">—</strong></div>
              <div class="fact-row"><span>Tarifa adulto</span><strong id="bkSumAdultUnit">—</strong></div>
              <div class="fact-row" id="bkChildPriceRow"><span>Tarifa niño</span><strong id="bkSumChildUnit">—</strong></div>
              <div class="booking-total"><span>Total del tour</span><strong id="bkSumTotal">—</strong></div>
            </div>
            <div class="booking-pay">
              <div class="booking-pay__amount"><span id="bkPayLabel">Pagas ahora</span><strong id="bkPayAmount">—</strong></div>
              <p class="booking-pay__note" id="bkPayNote"></p>
              <div id="paypalButtons"></div>
              <div class="booking-fallback" id="bkFallback" hidden>No hemos podido cargar la pasarela de pago. <a href="https://wa.me/51900608980" target="_blank" rel="noopener noreferrer">Escríbenos por WhatsApp</a>.</div>
            </div>
          </section>

          <section class="booking-step booking-success" data-step="4">
            <i class="fa-solid fa-circle-check" aria-hidden="true"></i><h2>Reserva confirmada</h2>
            <p>Tu código de reserva es <strong id="bkCode">—</strong>.</p><p>Enviamos la confirmación a <strong id="bkDoneEmail">—</strong>.</p><p id="bkDoneBalance"></p><p id="bkDoneAccount"></p>
            <button type="button" class="btn-primary" data-close-booking>Cerrar</button>
          </section>
        </div>
        <div class="booking-actions" id="bkActions"><button type="button" class="btn-outline" id="bkBack" hidden>Volver</button><button type="button" class="btn-primary" id="bkNext">Continuar</button></div>
      </div>`;
    document.body.appendChild(modal);
    window.LatamI18n?.invalidate?.();
    applyI18n(modal);
    return modal;
  }

  function showError(message) {
    const box = $('#bookingError');
    box.textContent = T(message);
    box.classList.add('is-visible');
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function clearError() { $('#bookingError')?.classList.remove('is-visible'); }

  function fieldValid(input) {
    const field = input.closest('.form-field');
    const valid = input.checkValidity();
    field?.classList.toggle('has-error', !valid);
    input.setAttribute('aria-invalid', String(!valid));
    return valid;
  }

  function saveStep1() {
    state.date = $('#bkDate').value;
    state.departureTime = $('#bkDeparture')?.value || '';
    state.adults = Number($('#bkAdults').value);
    state.children = Number($('#bkChildren').value);
    state.tier = $('#bkTier')?.value || state.tier;
    state.occupancy = $('#bkOccupancy')?.value || 'double';
    state.holder = { email: $('#bkEmail').value.trim(), phone: $('#bkPhone').value.trim(), notes: $('#bkNotes').value.trim() };
    recalculate();
  }

  function validateStep1() {
    const inputs = ['#bkDate','#bkDeparture','#bkEmail','#bkPhone'].map((selector) => $(selector)).filter(Boolean);
    let valid = inputs.every(fieldValid);
    const total = Number($('#bkAdults').value) + Number($('#bkChildren').value);
    if (total < 1 || total > CONFIG.maxTravelers) { valid = false; showError(`La reserva admite entre 1 y ${CONFIG.maxTravelers} viajeros.`); }
    if (!valid) showError('Revisa los campos marcados antes de continuar.');
    return valid;
  }

  function buildPassengers() {
    const list = $('#bkPaxList');
    const passengerTypes = [...Array(state.adults).fill('adult'), ...Array(state.children).fill('child')];
    list.innerHTML = passengerTypes.map((type, index) => `
      <fieldset class="passenger-card" data-pax="${index}" data-passenger-type="${type}">
        <legend>${index === 0 ? 'Titular de la reserva' : `Pasajero ${index + 1}`} <small>· ${type === 'adult' ? 'Adulto' : 'Niño'}</small></legend>
        <div class="booking-form-grid booking-form-grid--2">
          <div class="form-field"><label for="paxName${index}">Nombres y apellidos</label><input id="paxName${index}" data-pax-field="name" autocomplete="name" minlength="3" required><span class="form-error">Completa el nombre.</span></div>
          <div class="form-field"><label for="paxNationality${index}">Nacionalidad</label><select id="paxNationality${index}" data-pax-field="nationality" required>${nationalityOptions()}</select><span class="form-error">Selecciona una nacionalidad.</span></div>
          <div class="form-field"><label for="paxDocType${index}">Tipo de documento</label><select id="paxDocType${index}" data-pax-field="docType" required>${CONFIG.documentTypes.map((typeName) => `<option value="${escapeHTML(typeName)}">${escapeHTML(typeName)}</option>`).join('')}</select></div>
          <div class="form-field"><label for="paxDoc${index}">Número de documento</label><input id="paxDoc${index}" data-pax-field="docNumber" required maxlength="50"><span class="form-error">Completa el documento.</span></div>
          <div class="form-field"><label for="paxBirth${index}">Fecha de nacimiento</label><input type="date" id="paxBirth${index}" data-pax-field="birth" required max="${new Date().toISOString().slice(0,10)}"><span class="form-error">Completa una fecha válida.</span></div>
        </div>
      </fieldset>`).join('');
    applyI18n(list);
    window.LatamI18n?.invalidate?.();
  }

  function validateStep2() {
    const inputs = $$('[data-pax-field]', $('#bkPaxList'));
    const valid = inputs.every(fieldValid);
    if (!valid) showError('Completa los datos de todos los pasajeros.');
    return valid;
  }

  function saveStep2() {
    state.passengers = $$('.passenger-card').map((card) => {
      const value = (field) => card.querySelector(`[data-pax-field="${field}"]`).value.trim();
      return { name: value('name'), nationality: value('nationality'), docType: value('docType'), docNumber: value('docNumber'), birth: value('birth'), passengerType: card.dataset.passengerType };
    });
  }

  function occupancyLabel(code) {
    const label = ({ single:'Habitación simple', double:'Habitación doble', matrimonial:'Habitación matrimonial', triple:'Habitación triple', family:'Habitación familiar' })[code] || code;
    return T(label);
  }

  function paintSummary() {
    const formattedDate = new Intl.DateTimeFormat(document.documentElement.lang === 'en' ? 'en-US' : 'es-PE', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${state.date}T12:00:00Z`));
    $('#bkSumDate').textContent = formattedDate;
    if ($('#bkSumDeparture')) $('#bkSumDeparture').textContent = state.departureTime || '—';
    $('#bkSumAdults').textContent = String(state.adults);
    $('#bkSumChildren').textContent = String(state.children);
    $('#bkSumPax').textContent = String(state.travelers);
    if (PRODUCT.tiers.length) {
      const tier = getTier();
      $('#bkSumTier').textContent = tierOptionLabel(tier);
      $('#bkSumOccupancy').textContent = occupancyLabel(state.occupancy);
    }
    $('#bkSumAdultUnit').textContent = money(state.adultUnit);
    $('#bkSumChildUnit').textContent = money(state.childUnit);
    $('#bkChildPriceRow').hidden = state.children === 0;
    $('#bkSumTotal').textContent = money(state.total);
    $('#bkPayAmount').textContent = money(state.due);
    const isEnglish = document.documentElement.lang === 'en';
    $('#bkPayLabel').textContent = state.mode === 'completo'
      ? (isEnglish ? 'Pay in full now' : 'Pago total ahora')
      : (isEnglish ? 'Book now' : 'Reserva ahora');
    $('#bkPayNote').textContent = state.mode === 'completo'
      ? (isEnglish ? 'The full product amount is charged to confirm the booking.' : 'El importe del producto se paga por completo para confirmar la reserva.')
      : (isEnglish
        ? `Pay ${money(state.due)} now. The remaining balance of ${money(round2(state.total - state.due))} will be coordinated according to the voucher terms.`
        : `Pagas ${money(state.due)} ahora. El saldo de ${money(round2(state.total - state.due))} se coordina según las condiciones del voucher.`);
  }

  function goToStep(next) {
    step = next;
    $$('.booking-step').forEach((section) => section.classList.toggle('is-active', Number(section.dataset.step) === next));
    $$('.booking-steps li').forEach((item) => {
      const number = Number(item.dataset.stepLabel);
      item.classList.toggle('is-done', number < next);
      if (number === next) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
    });
    $('#bkBack').hidden = next === 1 || next === 4;
    $('#bkNext').hidden = next >= 3;
    $('.booking-steps').hidden = next === 4;
    $('#bkActions').hidden = next === 4;
    $('.booking-box').scrollTo({ top: 0, behavior: 'smooth' });
    clearError();
  }

  function requestKey() {
    if (crypto?.randomUUID) return crypto.randomUUID().replace(/-/g, '');
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`.slice(0, 64);
  }

  function payload() {
    return {
      requestKey: state.requestKey,
      slug: PRODUCT.slug,
      kind: PRODUCT.kind,
      title: PRODUCT.title,
      date: state.date,
      departureTime: state.departureTime,
      travelers: state.travelers,
      adults: state.adults,
      children: state.children,
      tier: state.tier,
      occupancy: state.occupancy,
      holder: state.holder,
      passengers: state.passengers,
      quotedTotal: state.total,
      quotedDue: state.due,
      mode: state.mode,
      currency: CONFIG.currency,
      language: document.documentElement.lang || 'es'
    };
  }

  async function callBackend(action, data) {
    if (!CONFIG.endpoint || CONFIG.endpoint.startsWith('PEGAR_AQUI')) throw new Error('El sistema de reservas aún no está conectado con Google Apps Script.');
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 60000) : null;
    try {
      const response = await fetch(CONFIG.endpoint, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body:JSON.stringify({ action, data }), signal:controller?.signal });
      if (!response.ok) throw new Error(`El servidor respondió ${response.status}`);
      const json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Error desconocido del servidor');
      return json;
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('La confirmación está tardando demasiado. No vuelvas a pagar; revisa tu correo o escríbenos.');
      throw error;
    } finally { if (timer) clearTimeout(timer); }
  }

  function loadPayPal() {
    if (window.paypal) return Promise.resolve(window.paypal);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(CONFIG.paypalClientId)}&currency=${encodeURIComponent(CONFIG.currency)}&intent=capture&components=buttons`;
      script.async = true;
      script.onload = () => resolve(window.paypal);
      script.onerror = () => reject(new Error('No se pudo cargar PayPal'));
      document.head.appendChild(script);
    });
  }

  async function mountPayment() {
    const container = $('#paypalButtons');
    container.innerHTML = `<div class="booking-loading">${T('Cargando pasarela de pago…')}</div>`;
    $('#bkFallback').hidden = true;
    if (!CONFIG.paypalClientId || CONFIG.paypalClientId.startsWith('PEGAR_AQUI') || !CONFIG.endpoint || CONFIG.endpoint.startsWith('PEGAR_AQUI')) {
      container.innerHTML = '';
      $('#bkFallback').hidden = false;
      showError('La pasarela todavía no está configurada. Completa el Client ID de PayPal y la URL de Google Apps Script.');
      return;
    }
    try {
      const paypal = await loadPayPal();
      container.innerHTML = '';
      if (paypalButtons?.close) { try { await paypalButtons.close(); } catch (_) {} }
      paypalButtons = paypal.Buttons({
        style: { layout:'vertical', shape:'rect', label:'pay', height:46 },
        createOrder: async () => (await callBackend('createOrder', payload())).orderId,
        onApprove: async (data) => {
          if (paymentInProgress) return;
          paymentInProgress = true;
          $('#bkActions').hidden = true;
          container.innerHTML = `<div class="booking-loading">${T('Confirmando el pago…')}</div>`;
          try { showConfirmation(await callBackend('captureOrder', { orderId:data.orderID })); }
          catch (error) { showError(error.message || 'No pudimos confirmar el pago. No vuelvas a pagar.'); container.innerHTML=''; $('#bkFallback').hidden=false; }
          finally { paymentInProgress = false; }
        },
        onCancel: () => showError('Has cancelado el pago. No se ha realizado ningún cargo.'),
        onError: (error) => { console.error('[PayPal]', error); showError('No se pudo abrir PayPal. No se ha realizado ningún cargo.'); $('#bkFallback').hidden=false; }
      });
      if (paypalButtons.isEligible && !paypalButtons.isEligible()) throw new Error('PayPal no está disponible en este navegador');
      await paypalButtons.render('#paypalButtons');
    } catch (error) {
      console.error(error); container.innerHTML=''; $('#bkFallback').hidden=false; showError('No hemos podido cargar la pasarela de pago. Puedes reservar por WhatsApp.');
    }
  }

  function showConfirmation(response) {
    $('#bkCode').textContent = response.bookingCode || '—';
    $('#bkDoneEmail').textContent = state.holder.email;
    const balance = Number(response.balance || 0);
    const isEnglish = document.documentElement.lang === 'en';
    $('#bkDoneBalance').textContent = balance > 0
      ? `${isEnglish ? 'Outstanding balance' : 'Saldo pendiente'}: ${money(balance)}.`
      : (isEnglish ? 'The booking has been paid in full.' : 'La reserva quedó pagada por completo.');
    let user = null;
    try { user = JSON.parse(localStorage.getItem('latamExpeditionsUser') || 'null'); } catch (_) {}
    $('#bkDoneAccount').innerHTML = user && String(user.email || '').toLowerCase() === state.holder.email.toLowerCase()
      ? `<a href="${BASE}mis-viajes.html">${isEnglish ? 'View this booking in My trips' : 'Ver esta reserva en Mis viajes'}</a>`
      : (isEnglish
        ? `Create an account with <strong>${escapeHTML(state.holder.email)}</strong> to view this booking in <a href="${BASE}registro.html">My trips</a>.`
        : `Puedes crear una cuenta con <strong>${escapeHTML(state.holder.email)}</strong> para consultar esta reserva en <a href="${BASE}registro.html">Mis viajes</a>.`);
    applyI18n($('#bkDoneAccount'));
    state.confirmation = response;
    window.LatamI18n?.invalidate?.();
    goToStep(4);
  }

  function prefillAccount() {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('latamExpeditionsUser') || 'null'); } catch (_) {}
    if (!user) return;
    if (!$('#bkEmail').value && user.email) $('#bkEmail').value = user.email;
    if (!$('#bkPhone').value && user.phone) $('#bkPhone').value = user.phone;
  }

  async function init() {
    try {
      const response = await fetch(`${BASE}assets/data/catalog.json`, { cache:'no-store' });
      CONFIG = (await response.json()).booking;
    } catch (error) { console.error('[booking] No se pudo cargar la configuración', error); return; }

    state.adults = Number(CONFIG.defaultAdults || 2);
    state.children = Number(CONFIG.defaultChildren || 0);
    const modal = buildModal();
    $('#bkLeadDays').textContent = String(CONFIG.minLeadDays);
    let lastFocused = null;

    const open = () => {
      lastFocused = document.activeElement;
      recalculate(); prefillAccount();
      modal.classList.add('is-open'); document.body.style.overflow='hidden'; $('#bkDate').focus();
    };
    const close = () => { modal.classList.remove('is-open'); document.body.style.overflow=''; lastFocused?.focus?.(); };
    trigger.addEventListener('click', open);
    $$('[data-close-booking]', modal).forEach((button) => button.addEventListener('click', close));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open') && step !== 4) close(); });

    const minDate = new Date(); minDate.setDate(minDate.getDate() + CONFIG.minLeadDays); $('#bkDate').min = minDate.toISOString().slice(0,10);
    ['#bkAdults','#bkChildren','#bkTier','#bkOccupancy'].forEach((selector) => $(selector)?.addEventListener('change', () => {
      state.adults = Number($('#bkAdults').value); state.children = Number($('#bkChildren').value);
      state.tier = $('#bkTier')?.value || state.tier; state.occupancy = $('#bkOccupancy')?.value || state.occupancy; recalculate();
    }));

    $('#bkNext').addEventListener('click', async () => {
      if (step === 1) {
        if (!validateStep1()) return;
        saveStep1(); buildPassengers(); goToStep(2);
      } else if (step === 2) {
        if (!validateStep2()) return;
        saveStep2(); state.requestKey = requestKey(); paintSummary(); goToStep(3); await mountPayment();
      }
    });
    $('#bkBack').addEventListener('click', () => goToStep(Math.max(1, step - 1)));
    modal.addEventListener('input', (e) => {
      const field = e.target.closest('.form-field');
      if (field?.classList.contains('has-error') && e.target.checkValidity()) { field.classList.remove('has-error'); e.target.setAttribute('aria-invalid','false'); }
    });
    document.addEventListener('latam:languagechange', () => {
      recalculate();
      if (step === 3) paintSummary();
      if (step === 4 && state.confirmation) showConfirmation(state.confirmation);
    });
    recalculate();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
