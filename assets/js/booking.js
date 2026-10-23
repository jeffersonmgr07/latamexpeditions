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
    total: 0, due: 0, mode: 'deposito', requestKey: '', pickupAddress: '', pickupStatus: 'pending_validation', paymentMethod: 'pay_on_tour'
  };

  // Zona informativa, no una validación automática de cobertura.
  function pickupZone() {
    const search = `${PRODUCT.slug} ${PRODUCT.title} ${PRODUCT.country}`.toLowerCase();
    const zones = [
      { match:/medell[ií]n|guatap[eé]|comuna-13|antioquia|jardin-antioquia|santa-fe-antioquia|hacienda-napoles/, city:'Medellín', center:'El Poblado', lat:6.2108, lon:-75.5704 },
      { match:/cusco|machu.picchu|ollantaytambo|valle.sagrado|humantay|montana.colores/, city:'Cusco', center:'Plaza de Armas', lat:-13.5163, lon:-71.9780 },
      { match:/cartagena|bar[uú]|rosario|cholon|totumo/, city:'Cartagena', center:'Centro Histórico', lat:10.4236, lon:-75.5510 },
      { match:/bogot[aá]|zipaquir[aá]|guatavita|villa.de.leyva/, city:'Bogotá', center:'Plaza de Bolívar', lat:4.5981, lon:-74.0760 },
      { match:/lima|paracas|ballestas/, city:'Lima', center:'Plaza Mayor', lat:-12.0453, lon:-77.0308 },
      { match:/santa.marta|tayrona|m[aá]gica|mindo/, city:'Santa Marta', center:'Centro Histórico', lat:11.2408, lon:-74.1990 },
      { match:/san.andr[eé]s/, city:'San Andrés', center:'Centro', lat:12.5847, lon:-81.7006 }
    ];
    return zones.find(z => z.match.test(search)) || null;
  }
  function pickupMapHTML() {
    const z = pickupZone();
    if (!z) return '<p class="form-note">La zona de recojo y el punto de encuentro se confirmarán después de revisar tu dirección.</p>';
    const deltaLat = 1 / 111.1, deltaLon = 1 / (111.1 * Math.cos(z.lat * Math.PI / 180));
    const bbox = [z.lon-deltaLon,z.lat-deltaLat,z.lon+deltaLon,z.lat+deltaLat].join('%2C');
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${z.lat}%2C${z.lon}`;
    return `<p class="form-note">Zona de referencia: ${escapeHTML(z.center)}, ${escapeHTML(z.city)} (aprox. 1 km alrededor). <strong>Mapa orientativo: no garantiza recojo.</strong></p><iframe class="booking-pickup-map" title="Mapa orientativo de recojo en ${escapeHTML(z.city)}" loading="lazy" referrerpolicy="no-referrer" src="${src}"></iframe>`;
  }
  const pickupNotice = 'Al enviar la solicitud, nuestro equipo revisará si tu alojamiento se encuentra en la ruta de recojo. Te comunicaremos por correo o WhatsApp la hora de recojo o el punto de encuentro, según corresponda. La ubicación del mapa es solo orientativa.';
  // Backend actual: solo correo. No habilitar PayPal por error al añadir un Client ID.
  const onlineConfigured = () => false; // Habilitar solo con un backend que implemente createOrder y captureOrder.

  // Prefijos internacionales, con países y territorios. +51 seleccionado por defecto.
  const PHONE_COUNTRIES = [["Afganistán","+93","AF"],["Albania","+355","AL"],["Alemania","+49","DE"],["Angola","+244","AO"],["Anguila","+1264","AI"],["Antigua y Barbuda","+1268","AG"],["Arabia Saudí","+966","SA"],["Argelia","+213","DZ"],["Argentina","+54","AR"],["Armenia","+374","AM"],["Aruba","+297","AW"],["Australia","+61","AU"],["Austria","+43","AT"],["Azerbaiyán","+994","AZ"],["Bahamas","+1242","BS"],["Bangladés","+880","BD"],["Barbados","+1246","BB"],["Baréin","+973","BH"],["Belice","+501","BZ"],["Benín","+229","BJ"],["Bermudas","+1441","BM"],["Bielorrusia","+375","BY"],["Bolivia","+591","BO"],["Bosnia y Herzegovina","+387","BA"],["Botsuana","+267","BW"],["Brasil","+55","BR"],["Brunéi","+673","BN"],["Bulgaria","+359","BG"],["Burkina Faso","+226","BF"],["Burundi","+257","BI"],["Bután","+975","BT"],["Bélgica","+32","BE"],["Cabo Verde","+238","CV"],["Camboya","+855","KH"],["Camerún","+237","CM"],["Canadá","+1","CA"],["Catar","+974","QA"],["Chad","+235","TD"],["Chequia","+420","CZ"],["Chile","+56","CL"],["China","+86","CN"],["Chipre","+357","CY"],["Colombia","+57","CO"],["Comoras","+269","KM"],["Congo","+242","CG"],["Corea del Norte","+850","KP"],["Corea del Sur","+82","KR"],["Costa Rica","+506","CR"],["Croacia","+385","HR"],["Cuba","+53","CU"],["Côte d’Ivoire","+225","CI"],["Dinamarca","+45","DK"],["Dominica","+1767","DM"],["Ecuador","+593","EC"],["Egipto","+20","EG"],["El Salvador","+503","SV"],["Emiratos Árabes Unidos","+971","AE"],["Eritrea","+291","ER"],["Eslovaquia","+421","SK"],["Eslovenia","+386","SI"],["España","+34","ES"],["Estados Unidos","+1","US"],["Estonia","+372","EE"],["Esuatini","+268","SZ"],["Etiopía","+251","ET"],["Filipinas","+63","PH"],["Finlandia","+358","FI"],["Fiyi","+679","FJ"],["Francia","+33","FR"],["Gabón","+241","GA"],["Gambia","+220","GM"],["Georgia","+995","GE"],["Ghana","+233","GH"],["Gibraltar","+350","GI"],["Granada","+1473","GD"],["Grecia","+30","GR"],["Groenlandia","+299","GL"],["Guadalupe","+590","GP"],["Guam","+1671","GU"],["Guatemala","+502","GT"],["Guayana Francesa","+594","GF"],["Guernesey","+44","GG"],["Guinea","+224","GN"],["Guinea Ecuatorial","+240","GQ"],["Guinea-Bisáu","+245","GW"],["Guyana","+592","GY"],["Haití","+509","HT"],["Honduras","+504","HN"],["Hungría","+36","HU"],["India","+91","IN"],["Indonesia","+62","ID"],["Irak","+964","IQ"],["Irlanda","+353","IE"],["Irán","+98","IR"],["Isla de Man","+44","IM"],["Isla de Navidad","+61","CX"],["Isla Norfolk","+672","NF"],["Islandia","+354","IS"],["Islas Caimán","+1345","KY"],["Islas Cocos","+61","CC"],["Islas Cook","+682","CK"],["Islas Feroe","+298","FO"],["Islas Georgia del Sur y Sandwich del Sur","+500","GS"],["Islas Malvinas","+500","FK"],["Islas Marianas del Norte","+1670","MP"],["Islas Marshall","+692","MH"],["Islas Pitcairn","+64","PN"],["Islas Salomón","+677","SB"],["Israel","+972","IL"],["Italia","+39","IT"],["Jamaica","+1876","JM"],["Japón","+81","JP"],["Jersey","+44","JE"],["Jordania","+962","JO"],["Kazajistán","+76","KZ"],["Kenia","+254","KE"],["Kirguistán","+996","KG"],["Kiribati","+686","KI"],["Kuwait","+965","KW"],["Laos","+856","LA"],["Lesoto","+266","LS"],["Letonia","+371","LV"],["Liberia","+231","LR"],["Libia","+218","LY"],["Liechtenstein","+423","LI"],["Lituania","+370","LT"],["Luxemburgo","+352","LU"],["Líbano","+961","LB"],["Macedonia del Norte","+389","MK"],["Madagascar","+261","MG"],["Malasia","+60","MY"],["Malaui","+265","MW"],["Maldivas","+960","MV"],["Mali","+223","ML"],["Malta","+356","MT"],["Marruecos","+212","MA"],["Martinica","+596","MQ"],["Mauricio","+230","MU"],["Mauritania","+222","MR"],["Mayotte","+262","YT"],["Micronesia","+691","FM"],["Moldavia","+373","MD"],["Mongolia","+976","MN"],["Montserrat","+1664","MS"],["Mozambique","+258","MZ"],["México","+52","MX"],["Mónaco","+377","MC"],["Namibia","+264","NA"],["Nauru","+674","NR"],["Nepal","+977","NP"],["Nicaragua","+505","NI"],["Nigeria","+234","NG"],["Niue","+683","NU"],["Noruega","+47","NO"],["Nueva Caledonia","+687","NC"],["Nueva Zelanda","+64","NZ"],["Níger","+227","NE"],["Omán","+968","OM"],["Pakistán","+92","PK"],["Palaos","+680","PW"],["Panamá","+507","PA"],["Papúa Nueva Guinea","+675","PG"],["Paraguay","+595","PY"],["Países Bajos","+31","NL"],["Perú","+51","PE"],["Polinesia Francesa","+689","PF"],["Polonia","+48","PL"],["Portugal","+351","PT"],["Puerto Rico","+1787","PR"],["RAE de Hong Kong (China)","+852","HK"],["RAE de Macao (China)","+853","MO"],["Reino Unido","+44","GB"],["República Centroafricana","+236","CF"],["República Democrática del Congo","+243","CD"],["República Dominicana","+1809","DO"],["Reunión","+262","RE"],["Ruanda","+250","RW"],["Rumanía","+40","RO"],["Rusia","+7","RU"],["Samoa","+685","WS"],["Samoa Americana","+1684","AS"],["San Cristóbal y Nieves","+1869","KN"],["San Marino","+378","SM"],["San Pedro y Miquelón","+508","PM"],["San Vicente y las Granadinas","+1784","VC"],["Santa Elena","+290","SH"],["Santa Lucía","+1758","LC"],["Santo Tomé y Príncipe","+239","ST"],["Senegal","+221","SN"],["Serbia","+381","RS"],["Seychelles","+248","SC"],["Sierra Leona","+232","SL"],["Singapur","+65","SG"],["Siria","+963","SY"],["Somalia","+252","SO"],["Sri Lanka","+94","LK"],["Sudáfrica","+27","ZA"],["Sudán","+249","SD"],["Sudán del Sur","+211","SS"],["Suecia","+46","SE"],["Suiza","+41","CH"],["Surinam","+597","SR"],["Svalbard y Jan Mayen","+4779","SJ"],["Sáhara Occidental","+212","EH"],["Tailandia","+66","TH"],["Taiwán","+886","TW"],["Tanzania","+255","TZ"],["Tayikistán","+992","TJ"],["Territorio Británico del Océano Índico","+246","IO"],["Timor-Leste","+670","TL"],["Togo","+228","TG"],["Tokelau","+690","TK"],["Tonga","+676","TO"],["Trinidad y Tobago","+1868","TT"],["Turkmenistán","+993","TM"],["Turquía","+90","TR"],["Tuvalu","+688","TV"],["Túnez","+216","TN"],["Ucrania","+380","UA"],["Uganda","+256","UG"],["Uruguay","+598","UY"],["Uzbekistán","+998","UZ"],["Vanuatu","+678","VU"],["Venezuela","+58","VE"],["Vietnam","+84","VN"],["Wallis y Futuna","+681","WF"],["Yemen","+967","YE"],["Yibuti","+253","DJ"],["Zambia","+260","ZM"],["Zimbabue","+263","ZW"]];
  const phoneCodeOptions = () => PHONE_COUNTRIES.map(([country, dial, iso]) =>
    `<option value="${escapeHTML(dial)}" ${iso === 'PE' ? 'selected' : ''}>${escapeHTML(dial)} · ${escapeHTML(country)}</option>`
  ).join('');

  const nationalityOptions = () => `<option value="" data-en="Select a nationality">Selecciona una nacionalidad</option>${COUNTRIES.map(([es, en]) => `<option value="${escapeHTML(es)}" data-en="${escapeHTML(en)}">${escapeHTML(es)}</option>`).join('')}`;
  const numberOptions = (min, max, selected) => Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => `<option value="${n}" ${n === selected ? 'selected' : ''}>${n}</option>`).join('');

  const isoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const parseISODate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const bookingLocale = () => document.documentElement.lang === 'en' ? 'en-US' : 'es-PE';
  const formatBookingDate = (value, options = { day: '2-digit', month: 'long', year: 'numeric' }) => {
    const date = parseISODate(value);
    return date ? new Intl.DateTimeFormat(bookingLocale(), options).format(date) : '';
  };
  const ageOnTravelDate = (birthValue) => {
    const birth = parseISODate(birthValue);
    const travel = parseISODate(state.date);
    if (!birth || !travel || birth > travel) return null;
    let age = travel.getFullYear() - birth.getFullYear();
    const beforeBirthday = travel.getMonth() < birth.getMonth() || (travel.getMonth() === birth.getMonth() && travel.getDate() < birth.getDate());
    if (beforeBirthday) age -= 1;
    return age >= 0 ? age : null;
  };

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
          <div class="booking-head__copy">
            <span class="booking-head__eyebrow">Reserva tu experiencia</span>
            <h2 id="bookingTitle">${escapeHTML(PRODUCT.title)}</h2>
            <p><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${escapeHTML(PRODUCT.country)} <span aria-hidden="true">·</span> <i class="fa-regular fa-clock" aria-hidden="true"></i> ${escapeHTML(PRODUCT.duration)}</p>
          </div>
          <button type="button" class="close-modal" data-close-booking aria-label="Cerrar reserva">&times;</button>
        </div>
        <ol class="booking-steps">
          <li data-step-label="1" aria-current="step"><span>1</span><b>Fecha y viajeros</b></li>
          <li data-step-label="2"><span>2</span><b>Datos de pasajeros</b></li>
          <li data-step-label="3"><span>3</span><b>Pago</b></li>
        </ol>
        <div class="booking-body">
          <div class="booking-error" id="bookingError" role="alert"></div>

          <section class="booking-step is-active" data-step="1">
            <div class="booking-form-grid booking-form-grid--2">
              <div class="form-field booking-date-field" id="bkDateField">
                <label id="bkDateLabelText">Fecha del tour</label>
                <button type="button" class="booking-date-trigger" id="bkDateTrigger" aria-haspopup="dialog" aria-expanded="false" aria-controls="bkCalendar">
                  <span id="bkDateDisplay">Selecciona una fecha</span>
                  <i class="fa-regular fa-calendar" aria-hidden="true"></i>
                </button>
                <input type="hidden" id="bkDate" value="">
                <div class="booking-calendar" id="bkCalendar" role="dialog" aria-label="Seleccionar fecha del tour" hidden>
                  <div class="booking-calendar__head">
                    <button type="button" class="booking-calendar__nav" id="bkCalPrev" aria-label="Mes anterior"><span aria-hidden="true">‹</span></button>
                    <strong id="bkCalMonth">—</strong>
                    <button type="button" class="booking-calendar__nav" id="bkCalNext" aria-label="Mes siguiente"><span aria-hidden="true">›</span></button>
                  </div>
                  <div class="booking-calendar__weekdays" aria-hidden="true"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
                  <div class="booking-calendar__grid" id="bkCalGrid"></div>
                </div>
                <small>Con al menos <span id="bkLeadDays"></span> días de anticipación.</small>
                <span class="form-error">Elige una fecha válida.</span>
              </div>
              ${departure || '<div class="form-field booking-field-placeholder" aria-hidden="true"></div>'}
            </div>
            <div class="booking-subsection">
              <h3>Viajeros</h3>
              <div class="booking-form-grid booking-form-grid--3 travelers-grid">
                <div class="form-field"><label for="bkAdults">Adultos</label><div class="booking-counter" role="group" aria-label="Número de adultos"><button type="button" data-counter="bkAdults" data-change="-1" aria-label="Quitar un adulto">−</button><input type="number" id="bkAdults" min="1" max="12" value="${state.adults}" readonly aria-label="Adultos"><button type="button" data-counter="bkAdults" data-change="1" aria-label="Añadir un adulto">+</button></div></div>
                <div class="form-field"><label for="bkChildren">Niños</label><div class="booking-counter" role="group" aria-label="Número de niños"><button type="button" data-counter="bkChildren" data-change="-1" aria-label="Quitar un niño">−</button><input type="number" id="bkChildren" min="0" max="8" value="${state.children}" readonly aria-label="Niños"><button type="button" data-counter="bkChildren" data-change="1" aria-label="Añadir un niño">+</button></div><small>${PRODUCT.childMinAge ? `${PRODUCT.childMinAge} a 11 años · menores, coordinar por WhatsApp` : '0 a 11 años'}</small></div>
                <div class="traveler-total"><span>Total de viajeros</span><strong id="bkTravelerTotal">${state.travelers}</strong></div>
              </div>
            </div>
            ${tierFields}
            <div class="booking-subsection">
              <h3>Contacto del titular</h3>
              <div class="booking-form-grid booking-form-grid--2">
                <div class="form-field"><label for="bkEmail">Correo del titular</label><input type="email" id="bkEmail" autocomplete="email" required><span class="form-error">Escribe un correo válido.</span></div>
                <div class="form-field booking-phone-field"><label for="bkPhone">Teléfono / WhatsApp</label><div class="booking-phone-combined"><label class="visually-hidden" for="bkPhoneDial">Código de país</label><select id="bkPhoneDial" required aria-label="Código de país" title="Selecciona el país">${phoneCodeOptions()}</select><input type="tel" id="bkPhone" inputmode="tel" autocomplete="tel-national" placeholder="Número de WhatsApp" pattern="[0-9 ()\-]{6,25}" minlength="6" maxlength="25" required aria-label="Número de WhatsApp"></div><span class="form-error">Escribe un WhatsApp válido e indica su código de país.</span></div>
              </div>
              <div class="form-field"><label for="bkNotes">Comentarios o solicitudes (opcional)</label><textarea id="bkNotes" rows="3" maxlength="1200"></textarea></div>
            </div>
            <div class="booking-subsection booking-pickup">
              <h3>Dirección de recojo (opcional)</h3>
              <div class="form-field"><label for="bkPickup">Hotel / Airbnb / Dirección de recojo</label><textarea id="bkPickup" rows="2" maxlength="400" placeholder="Ingresa el nombre y dirección completa de tu hotel o Airbnb"></textarea></div>
              <div id="bkPickupMap">${pickupMapHTML()}</div>
              <p class="booking-pickup-notice" id="bkPickupNotice" hidden></p>
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
              <div class="fact-row"><span>Correo de contacto</span><strong id="bkSumEmail">—</strong></div>
              <div class="fact-row"><span>WhatsApp</span><strong id="bkSumPhone">—</strong></div>
              <div class="fact-row" id="bkSumPickupRow" hidden><span>Dirección propuesta de recojo (por validar)</span><strong id="bkSumPickup">—</strong></div>
              <div class="fact-row" ${PRODUCT.tiers.length ? '' : 'hidden'}><span data-en="Hotel option">Opción de hotel</span><strong id="bkSumTier">—</strong></div>
              <div class="fact-row" ${PRODUCT.tiers.length ? '' : 'hidden'}><span>Acomodación</span><strong id="bkSumOccupancy">—</strong></div>
              <div class="fact-row"><span>Tarifa adulto</span><strong id="bkSumAdultUnit">—</strong></div>
              <div class="fact-row" id="bkChildPriceRow"><span>Tarifa niño</span><strong id="bkSumChildUnit">—</strong></div>
              <div class="booking-total"><span>Total del tour</span><strong id="bkSumTotal">—</strong></div>
            </div>
            <div class="booking-pay">
              <h3>¿Cómo deseas pagar?</h3>
              <div class="booking-payment-options" role="radiogroup" aria-label="Forma de pago">
                <label><input type="radio" name="bkPaymentMethod" value="pay_on_tour" checked><span><strong>Pagar en efectivo al iniciar el tour</strong><small>Pago pendiente hasta el inicio de la experiencia</small></span></label>
                <label><input type="radio" name="bkPaymentMethod" value="online" ${onlineConfigured() ? '' : 'disabled'}><span><strong>Pagar online ahora</strong><small>${onlineConfigured() ? 'Paga de forma segura con PayPal' : 'Próximamente · pasarela por configurar'}</small></span></label>
              </div>
              <div id="bkPayOnTour"><p class="form-note">Tu registro se enviará a nuestro equipo. La reserva no estará pagada y la disponibilidad debe ser confirmada.</p><button type="button" class="btn-primary" id="bkSubmitCash">Enviar solicitud de reserva</button></div>
              <div id="bkPayOnline" hidden>
              <div class="booking-pay__amount"><span id="bkPayLabel">Pagas ahora</span><strong id="bkPayAmount">—</strong></div>
              <p class="booking-pay__note" id="bkPayNote"></p>
              <div id="paypalButtons"></div>
              <div class="booking-fallback" id="bkFallback" hidden>No hemos podido cargar la pasarela de pago. <a href="https://wa.me/51900608980" target="_blank" rel="noopener noreferrer">Escríbenos por WhatsApp</a>.</div>
              </div>
            </div>
          </section>

          <section class="booking-step booking-success" data-step="4" role="status" aria-live="polite">
            <div class="booking-success__mark" aria-hidden="true">✓</div>
            <span class="booking-success__eyebrow">LATAM EXPEDITIONS · RESERVAS</span>
            <h2 id="bkSuccessTitle">¡Tus datos se enviaron correctamente!</h2>
            <p id="bkSuccessText"></p>
            <div class="booking-success__reference"><small>Número de solicitud</small><strong id="bkCode">—</strong></div>
            <p id="bkSuccessMethod"></p>
            <p id="bkDoneBalance"></p>
            <p class="booking-success__email" id="bkDoneEmail"></p>
            <p id="bkDoneAccount"></p>
            <button type="button" class="btn-primary" data-close-booking>Entendido, cerrar</button>
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
    const dialCode = $('#bkPhoneDial').value;
    const nationalNumber = $('#bkPhone').value.replace(/\D/g, '');
    state.holder = { email: $('#bkEmail').value.trim(), phone: `${dialCode}${nationalNumber}`, phoneCountryCode: dialCode, phoneNational: nationalNumber, notes: $('#bkNotes').value.trim() };
    state.pickupAddress = $('#bkPickup').value.trim();
    state.pickupStatus = 'pending_validation';
    recalculate();
  }

  function validateStep1() {
    const inputs = ['#bkDeparture','#bkEmail','#bkPhoneDial','#bkPhone'].map((selector) => $(selector)).filter(Boolean);
    let valid = inputs.every(fieldValid);
    const dateValue = $('#bkDate')?.value || '';
    const minValue = $('#bkDate')?.dataset.min || '';
    const validDate = Boolean(parseISODate(dateValue)) && (!minValue || dateValue >= minValue);
    $('#bkDateField')?.classList.toggle('has-error', !validDate);
    $('#bkDateTrigger')?.setAttribute('aria-invalid', String(!validDate));
    valid = valid && validDate;
    const total = Number($('#bkAdults').value) + Number($('#bkChildren').value);
    if (total < 1 || total > CONFIG.maxTravelers) { valid = false; showError(`La reserva admite entre 1 y ${CONFIG.maxTravelers} viajeros.`); }
    if (!valid) showError('Revisa los campos marcados antes de continuar.');
    return valid;
  }

  function buildPassengers() {
    const list = $('#bkPaxList');
    const passengerTypes = [...Array(state.adults).fill('adult'), ...Array(state.children).fill('child')];
    const documentTypes = Array.isArray(CONFIG.documentTypes) && CONFIG.documentTypes.length
      ? CONFIG.documentTypes
      : ['Pasaporte', 'DNI / Cédula de identidad / ID', 'Carné de extranjería', 'Otro'];
    const defaultDocument = CONFIG.defaultDocumentType || 'Pasaporte';
    list.innerHTML = passengerTypes.map((type, index) => `
      <fieldset class="passenger-card" data-pax="${index}" data-passenger-type="${type}">
        <legend>${index === 0 ? 'Titular de la reserva' : `Pasajero ${index + 1}`} <small>· ${type === 'adult' ? 'Adulto' : 'Niño'}</small></legend>
        <div class="booking-form-grid booking-form-grid--2">
          <div class="form-field"><label for="paxName${index}">Nombres y apellidos</label><input id="paxName${index}" data-pax-field="name" autocomplete="name" minlength="3" required><span class="form-error">Completa el nombre.</span></div>
          <div class="form-field"><label for="paxNationality${index}">Nacionalidad</label><select id="paxNationality${index}" data-pax-field="nationality" required>${nationalityOptions()}</select><span class="form-error">Selecciona una nacionalidad.</span></div>
          <div class="form-field"><label for="paxDocType${index}">Tipo de documento</label><select id="paxDocType${index}" data-pax-field="docType" required>${documentTypes.map((typeName) => `<option value="${escapeHTML(typeName)}" ${typeName === defaultDocument ? 'selected' : ''}>${escapeHTML(typeName)}</option>`).join('')}</select></div>
          <div class="form-field"><label for="paxDoc${index}">Número de documento</label><input id="paxDoc${index}" data-pax-field="docNumber" required maxlength="50"><span class="form-error">Completa el documento.</span></div>
          <div class="form-field passenger-birth-field" data-birth-calendar><label for="paxBirth${index}">Fecha de nacimiento</label>
            <button type="button" class="booking-date-trigger" data-birth-trigger aria-haspopup="dialog" aria-expanded="false" aria-label="Elegir fecha de nacimiento"><span data-birth-display>Selecciona la fecha de nacimiento</span><i class="fa-regular fa-calendar" aria-hidden="true"></i></button>
            <input type="date" class="booking-birth-native" id="paxBirth${index}" data-pax-field="birth" required min="1900-01-01" max="${isoDate(new Date())}" tabindex="-1" aria-label="Fecha de nacimiento seleccionada">
            <div class="booking-calendar booking-birth-calendar" role="dialog" aria-label="Seleccionar fecha de nacimiento" hidden>
              <div class="booking-calendar__head"><button type="button" class="booking-calendar__nav" data-birth-prev aria-label="Mes anterior"><span aria-hidden="true">‹</span></button><strong data-birth-month>—</strong><button type="button" class="booking-calendar__nav" data-birth-next aria-label="Mes siguiente"><span aria-hidden="true">›</span></button></div>
              <div class="booking-birth-jump"><select data-birth-month-select aria-label="Mes de nacimiento"></select><select data-birth-year-select aria-label="Año de nacimiento"></select></div>
              <div class="booking-calendar__weekdays" aria-hidden="true"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
              <div class="booking-calendar__grid" data-birth-grid></div>
            </div>
            <span class="passenger-age" id="paxAge${index}" aria-live="polite">Edad: —</span><span class="form-error">Completa una fecha válida.</span>
          </div>
        </div>
      </fieldset>`).join('');
    list.querySelectorAll('[data-pax-field="birth"]').forEach((input) => {
      setupPassengerBirthCalendar(input);
      const updateAge = () => {
        const age = ageOnTravelDate(input.value);
        const output = input.closest('.passenger-birth-field')?.querySelector('.passenger-age');
        if (output) output.textContent = age === null ? 'Edad: —' : `${age} ${age === 1 ? 'año' : 'años'}`;
      };
      input.addEventListener('input', updateAge);
      input.addEventListener('change', updateAge);
      updateAge();
    });
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
    $('#bkPickupNotice').hidden = !state.pickupAddress;
    $('#bkPickupNotice').textContent = pickupNotice;
    if ($('#bkSumDeparture')) $('#bkSumDeparture').textContent = state.departureTime || '—';
    $('#bkSumAdults').textContent = String(state.adults);
    $('#bkSumChildren').textContent = String(state.children);
    $('#bkSumPax').textContent = String(state.travelers);
    $('#bkSumEmail').textContent = state.holder.email;
    $('#bkSumPhone').textContent = state.holder.phone;
    $('#bkSumPickupRow').hidden = !state.pickupAddress;
    $('#bkSumPickup').textContent = state.pickupAddress || '—';
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
    $('.booking-body')?.scrollTo({ top: 0, behavior: 'smooth' });
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
      pickupAddress: state.pickupAddress,
      pickupStatus: 'pending_validation',
      paymentMethod: state.paymentMethod,
      paymentStatus: state.paymentMethod === 'pay_on_tour' ? 'pending' : 'awaiting_payment',
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

  // Envío a Apps Script mediante un iframe oculto, sin leer respuestas CORS.
  // El servidor notifica de forma directa con postMessage; JSONP/status queda
  // como respaldo. Solo se muestra éxito tras recibir emailSent=true.
  async function submitEmailOnly(data) {
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/i.test(CONFIG.endpoint || '')) {
      throw new Error('Configura la URL /exec pública de Google Apps Script antes de recibir solicitudes.');
    }
    const iframe = document.createElement('iframe');
    const id = `latam_booking_${data.requestKey.slice(0,20)}`;
    iframe.name = id;
    iframe.hidden = true;
    iframe.setAttribute('aria-hidden','true');
    const form = document.createElement('form');
    form.hidden = true;
    form.method = 'POST';
    form.target = id;
    form.action = CONFIG.endpoint;
    const fields = { action: 'registerPayOnTour', payload: JSON.stringify(data) };
    for (const [name, value] of Object.entries(fields)) {
      const field = document.createElement('input');
      field.type = 'hidden'; field.name = name; field.value = value;
      form.appendChild(field);
    }
    document.body.append(iframe, form);
    let resolveDirect;
    let finished = false;
    const direct = new Promise(resolve => { resolveDirect = resolve; });
    const isGoogleScriptOrigin = (origin) => {
      try {
        const url = new URL(origin);
        return url.protocol === 'https:' && (
          url.hostname === 'script.google.com' ||
          url.hostname === 'script.googleusercontent.com' ||
          url.hostname.endsWith('.script.googleusercontent.com')
        );
      } catch (_) { return false; }
    };
    const onMessage = (event) => {
      if (!isGoogleScriptOrigin(event.origin)) return;
      const reply = event.data;
      if (reply?.type !== 'latam-booking-receipt' || reply.requestKey !== data.requestKey) return;
      // Un estado pending no equivale a un correo enviado.
      if (!reply.pending) resolveDirect(reply);
    };
    window.addEventListener('message', onMessage);
    const checkStatus = () => new Promise((resolve) => {
      const callback = `__latamReceipt_${data.requestKey.slice(0,20)}`;
      const script = document.createElement('script');
      let done = false;
      const finish = (value) => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        delete window[callback];
        script.remove();
        resolve(value);
      };
      window[callback] = finish;
      const timeout = setTimeout(() => finish(null), 2300);
      script.onerror = () => finish(null);
      const params = new URLSearchParams({
        action: 'status', requestKey: data.requestKey,
        callback, cache: Date.now().toString()
      });
      script.src = `${CONFIG.endpoint.split('?')[0]}?${params.toString()}`;
      document.head.appendChild(script);
    });
    const receipt = (reply) => {
      if (!reply || reply.pending) return null;
      if (reply.ok === true && reply.emailSent === true) return reply;
      throw new Error(reply.error || 'El servidor no pudo registrar la solicitud. Revisa tu correo antes de volver a intentar.');
    };
    try {
      form.submit();
      for (let attempt = 0; attempt < 10; attempt++) {
        const immediate = await Promise.race([
          direct,
          new Promise(resolve => setTimeout(() => resolve(null), 1600))
        ]);
        const confirmed = receipt(immediate);
        if (confirmed) { finished = true; return confirmed; }
        const fromStatus = await Promise.race([direct, checkStatus()]);
        const fallback = receipt(fromStatus);
        if (fallback) { finished = true; return fallback; }
      }
      throw new Error('No pudimos confirmar el envío aunque puede haberse recibido. Revisa el correo contact@latamexpeditions.com antes de repetir la solicitud para evitar duplicados.');
    } finally {
      window.removeEventListener('message', onMessage);
      // Mantener los nodos un instante permite completar el POST cuando
      // recibimos el acuse muy pronto, sin dejar iframes permanentes.
      setTimeout(() => { iframe.remove(); form.remove(); }, finished ? 800 : 4000);
    }
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
    $('#bkDoneEmail').textContent = state.paymentMethod === 'pay_on_tour' ? (response.clientEmailSent ? `Enviamos una copia a ${state.holder.email}.` : `Recibimos tu solicitud, pero no pudimos enviar la copia automática a ${state.holder.email}. Nuestro equipo se pondrá en contacto.`) : state.holder.email;
    const cash = state.paymentMethod === 'pay_on_tour';
    $('#bkSuccessTitle').textContent = cash ? '¡Tus datos se enviaron correctamente!' : 'Reserva confirmada';
    $('#bkSuccessText').textContent = cash ? 'Recibimos tu solicitud para el tour ' + PRODUCT.title + '. Nuestro equipo verificará tu dirección de recojo (si fue proporcionada) y te confirmará por correo electrónico o WhatsApp el horario de recojo o el punto de encuentro correspondiente. Este registro está pendiente de confirmación.' : '';
    $('#bkSuccessMethod').textContent = cash ? 'Forma de pago: Pago en efectivo al iniciar el tour (pendiente).' : ''; 
    const balance = Number(response.balance || 0);
    const isEnglish = document.documentElement.lang === 'en';
    $('#bkDoneBalance').textContent = cash ? `Pago pendiente: ${money(state.total)}.` : balance > 0
      ? `${isEnglish ? 'Outstanding balance' : 'Saldo pendiente'}: ${money(balance)}.`
      : (isEnglish ? 'The booking has been paid in full.' : 'La reserva quedó pagada por completo.');
    let user = null;
    try { user = JSON.parse(localStorage.getItem('latamExpeditionsUser') || 'null'); } catch (_) {}
    $('#bkDoneAccount').innerHTML = cash ? '' : user && String(user.email || '').toLowerCase() === state.holder.email.toLowerCase()
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
    if (!$('#bkPhone').value && user.phone) {
      const stored = String(user.phone).trim();
      const digits = stored.replace(/\D/g, '');
      const codes = [...new Set(PHONE_COUNTRIES.map(([, dial]) => dial))].sort((a,b) => b.length - a.length);
      const match = stored.startsWith('+') ? codes.find((dial) => digits.startsWith(dial.slice(1))) : null;
      if (match) {
        $('#bkPhoneDial').value = match;
        $('#bkPhone').value = digits.slice(match.length - 1);
      } else $('#bkPhone').value = digits;
    }
  }

  function setupPassengerBirthCalendar(input) {
    const field = input.closest('[data-birth-calendar]');
    const trigger = field.querySelector('[data-birth-trigger]');
    const calendar = field.querySelector('.booking-birth-calendar');
    const grid = field.querySelector('[data-birth-grid]');
    const display = field.querySelector('[data-birth-display]');
    const monthTitle = field.querySelector('[data-birth-month]');
    const monthSelect = field.querySelector('[data-birth-month-select]');
    const yearSelect = field.querySelector('[data-birth-year-select]');
    const prev = field.querySelector('[data-birth-prev]');
    const next = field.querySelector('[data-birth-next]');
    const today = new Date(); today.setHours(12,0,0,0);
    // Año y mes desplegables: no es necesario retroceder decenas de años clic a clic.
    const monthFormatter = new Intl.DateTimeFormat(bookingLocale(), { month:'long' });
    monthSelect.innerHTML = Array.from({length:12}, (_,i) => `<option value="${i}">${monthFormatter.format(new Date(2020,i,1))}</option>`).join('');
    yearSelect.innerHTML = Array.from({length:today.getFullYear()-1899}, (_,i) => `<option value="${today.getFullYear()-i}">${today.getFullYear()-i}</option>`).join('');
    let view = new Date(today.getFullYear()-25, today.getMonth(), 1);
    const hide = () => { calendar.hidden=true; trigger.setAttribute('aria-expanded', 'false'); };
    const render = () => {
      const monthText = new Intl.DateTimeFormat(bookingLocale(), {month:'long',year:'numeric'}).format(view);
      monthTitle.textContent = monthText.charAt(0).toUpperCase()+monthText.slice(1);
      monthSelect.value = String(view.getMonth()); yearSelect.value = String(view.getFullYear());
      const first = new Date(view.getFullYear(),view.getMonth(),1);
      const mondayOffset=(first.getDay()+6)%7;
      const start=new Date(first);start.setDate(1-mondayOffset);
      grid.innerHTML = Array.from({length:42},(_,i)=>{
        const day=new Date(start);day.setDate(start.getDate()+i);
        const value=isoDate(day);const outside=day.getMonth()!==view.getMonth();
        const disabled=day>today || day.getFullYear()<1900;
        return `<button type="button" data-birth-date="${value}" class="booking-calendar__day${outside ? ' is-outside' : ''}${value===input.value ? ' is-selected' : ''}" ${disabled ? 'disabled' : ''} aria-label="${escapeHTML(formatBookingDate(value))}">${day.getDate()}</button>`;
      }).join('');
      prev.disabled=view.getFullYear()===1900 && view.getMonth()===0;
      next.disabled=view.getFullYear()===today.getFullYear() && view.getMonth()===today.getMonth();
    };
    trigger.addEventListener('click', () => {
      if (!calendar.hidden) {hide();return;}
      document.querySelectorAll('.booking-calendar:not([hidden])').forEach((node) => {node.hidden=true;node.closest('.form-field')?.querySelector('[aria-expanded]')?.setAttribute('aria-expanded','false');});
      const selected=parseISODate(input.value);
      if(selected)view=new Date(selected.getFullYear(),selected.getMonth(),1);
      render();calendar.hidden=false;trigger.setAttribute('aria-expanded','true');
    });
    prev.addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render();});
    next.addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render();});
    const jump=()=>{view=new Date(Number(yearSelect.value),Number(monthSelect.value),1);render();};
    monthSelect.addEventListener('change',jump);yearSelect.addEventListener('change',jump);
    grid.addEventListener('click',(event)=>{
      const button=event.target.closest('[data-birth-date]');
      if(!button || button.disabled)return;
      input.value=button.dataset.birthDate;
      display.textContent=formatBookingDate(input.value);
      field.classList.remove('has-error');
      hide();input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
    });
    document.addEventListener('click', function closeOutside(event) {
      if (!field.isConnected) {document.removeEventListener('click',closeOutside);return;}
      if (!calendar.hidden && !field.contains(event.target))hide();
    });
    field.addEventListener('keydown',(event)=>{if(event.key==='Escape' && !calendar.hidden){hide();trigger.focus();}});
  }

  function setupBookingCalendar(minDate) {
    const input = $('#bkDate');
    const field = $('#bkDateField');
    const triggerButton = $('#bkDateTrigger');
    const display = $('#bkDateDisplay');
    const calendar = $('#bkCalendar');
    const monthLabel = $('#bkCalMonth');
    const grid = $('#bkCalGrid');
    const previousButton = $('#bkCalPrev');
    const nextButton = $('#bkCalNext');
    if (!input || !triggerButton || !calendar || !grid) return;

    input.dataset.min = isoDate(minDate);
    let viewDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);

    const closeCalendar = () => {
      calendar.hidden = true;
      triggerButton.setAttribute('aria-expanded', 'false');
    };
    const openCalendar = () => {
      const selected = parseISODate(input.value);
      if (selected) viewDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
      renderCalendar();
      calendar.hidden = false;
      triggerButton.setAttribute('aria-expanded', 'true');
    };
    const renderCalendar = () => {
      const monthText = new Intl.DateTimeFormat(bookingLocale(), { month: 'long', year: 'numeric' }).format(viewDate);
      monthLabel.textContent = monthText.charAt(0).toUpperCase() + monthText.slice(1);
      const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      const firstWeekdayMonday = (first.getDay() + 6) % 7;
      const gridStart = new Date(first);
      gridStart.setDate(first.getDate() - firstWeekdayMonday);
      const selected = input.value;
      const today = isoDate(new Date());
      const minValue = isoDate(minDate);
      grid.innerHTML = Array.from({ length: 42 }, (_, index) => {
        const day = new Date(gridStart);
        day.setDate(gridStart.getDate() + index);
        const value = isoDate(day);
        const outside = day.getMonth() !== viewDate.getMonth();
        const disabled = value < minValue;
        const selectedDay = value === selected;
        const isToday = value === today;
        return `<button type="button" class="booking-calendar__day${outside ? ' is-outside' : ''}${selectedDay ? ' is-selected' : ''}${isToday ? ' is-today' : ''}" data-date="${value}" ${disabled ? 'disabled' : ''} aria-label="${escapeHTML(formatBookingDate(value))}" ${selectedDay ? 'aria-current="date"' : ''}>${day.getDate()}</button>`;
      }).join('');
      const previousMonthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0);
      previousButton.disabled = isoDate(previousMonthEnd) < minValue;
    };

    triggerButton.addEventListener('click', () => calendar.hidden ? openCalendar() : closeCalendar());
    previousButton.addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1); renderCalendar(); });
    nextButton.addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1); renderCalendar(); });
    grid.addEventListener('click', (event) => {
      const dayButton = event.target.closest('[data-date]');
      if (!dayButton || dayButton.disabled) return;
      input.value = dayButton.dataset.date;
      state.date = input.value;
      display.textContent = formatBookingDate(input.value, { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });
      field?.classList.remove('has-error');
      triggerButton.setAttribute('aria-invalid', 'false');
      closeCalendar();
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.addEventListener('click', (event) => {
      if (!calendar.hidden && !field?.contains(event.target)) closeCalendar();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !calendar.hidden) { closeCalendar(); triggerButton.focus(); }
    });
    renderCalendar();
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
      modal.classList.add('is-open'); document.body.style.overflow='hidden'; $('#bkDateTrigger').focus();
    };
    const close = () => { modal.classList.remove('is-open'); document.body.style.overflow=''; lastFocused?.focus?.(); };
    trigger.addEventListener('click', open);
    $$('[data-close-booking]', modal).forEach((button) => button.addEventListener('click', close));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open') && step !== 4) close(); });

    const minDate = new Date();
    minDate.setHours(12, 0, 0, 0);
    minDate.setDate(minDate.getDate() + CONFIG.minLeadDays);
    setupBookingCalendar(minDate);
    const refreshCounters = () => {
      const currentTotal = Number($('#bkAdults').value) + Number($('#bkChildren').value);
      $$('.booking-counter button').forEach((button) => {
        const input = document.getElementById(button.dataset.counter);
        const delta = Number(button.dataset.change);
        const nextValue = Number(input.value) + delta;
        button.disabled = nextValue < Number(input.min) || nextValue > Number(input.max) || (delta > 0 && currentTotal >= Number(CONFIG.maxTravelers || 12));
      });
    };
    $$('.booking-counter button').forEach((button) => button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.counter);
      if (!input || button.disabled) return;
      const nextValue = Math.max(Number(input.min), Math.min(Number(input.max), Number(input.value) + Number(button.dataset.change)));
      if (nextValue === Number(input.value)) return;
      input.value = String(nextValue);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }));
    ['#bkAdults','#bkChildren','#bkTier','#bkOccupancy'].forEach((selector) => $(selector)?.addEventListener('change', () => {
      state.adults = Number($('#bkAdults').value); state.children = Number($('#bkChildren').value);
      state.tier = $('#bkTier')?.value || state.tier; state.occupancy = $('#bkOccupancy')?.value || state.occupancy; recalculate(); refreshCounters();
    }));
    refreshCounters();

    $('#bkNext').addEventListener('click', async () => {
      if (step === 1) {
        if (!validateStep1()) return;
        saveStep1(); buildPassengers(); goToStep(2);
      } else if (step === 2) {
        if (!validateStep2()) return;
        saveStep2(); state.requestKey = requestKey(); paintSummary(); goToStep(3); updatePaymentMethod();
      }
    });
    const updatePaymentMethod = () => {
      state.paymentMethod = $('input[name="bkPaymentMethod"]:checked')?.value || 'pay_on_tour';
      $('#bkPayOnTour').hidden = state.paymentMethod !== 'pay_on_tour';
      $('#bkPayOnline').hidden = state.paymentMethod !== 'online';
      if (state.paymentMethod === 'online') mountPayment();
      clearError();
    };
    $$('input[name="bkPaymentMethod"]').forEach(radio => radio.addEventListener('change', updatePaymentMethod));
    $('#bkSubmitCash').addEventListener('click', async () => {
      if (paymentInProgress) return;
      if (!CONFIG.endpoint || CONFIG.endpoint.startsWith('PEGAR_AQUI')) {
        showError('El envío aún no está configurado. Debes publicar Google Apps Script y colocar su URL en catalog.json para recibir reservas por correo.');
        return;
      }
      paymentInProgress = true;
      $('#bkSubmitCash').disabled = true;
      $('#bkSubmitCash').textContent = 'Enviando solicitud…';
      try {
        state.paymentMethod = 'pay_on_tour';
        const response = await submitEmailOnly(payload());
        showConfirmation(response);
      } catch (error) {
        showError(error.message || 'No pudimos registrar tu solicitud. Inténtalo nuevamente.');
      } finally {
        paymentInProgress = false;
        $('#bkSubmitCash').disabled = false;
        $('#bkSubmitCash').textContent = 'Enviar solicitud de reserva';
      }
    });
    $('#bkPickup').addEventListener('input', () => {
      $('#bkPickupNotice').hidden = !$('#bkPickup').value.trim();
      $('#bkPickupNotice').textContent = pickupNotice;
    });
    $('#bkBack').addEventListener('click', () => goToStep(Math.max(1, step - 1)));
    modal.addEventListener('input', (e) => {
      const field = e.target.closest('.form-field');
      if (field?.classList.contains('has-error') && e.target.checkValidity()) { field.classList.remove('has-error'); e.target.setAttribute('aria-invalid','false'); }
    });
    document.addEventListener('latam:languagechange', () => {
      recalculate();
      if ($('#bkDate')?.value) $('#bkDateDisplay').textContent = formatBookingDate($('#bkDate').value, { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });
      if (step === 3) paintSummary();
      if (step === 4 && state.confirmation) showConfirmation(state.confirmation);
    });
    recalculate();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
