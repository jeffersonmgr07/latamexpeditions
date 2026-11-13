/**
 * LATAM EXPEDITIONS — Mini API v2 · Google Apps Script.
 * Source: Aviasales Data API / Travelpayouts, v3/prices_for_dates.
 * 
 * SETUP: Apps Script > Project settings > Script properties
 *   TP_API_TOKEN = your private Travelpayouts API token
 * Deploy > Web app > Execute as: Me > Who has access: Anyone.
 * Frontend reads this public endpoint using sanitized JSONP (CORS-safe in GitHub Pages).
 * NEVER paste the token into GitHub or browser JavaScript.
 *
 * Data is cached airfare observations, NOT live bookable inventory.
 */
var FLIGHT_AIRPORTS = [
  "LIM","CUZ","AQP","JUL","PIU","TRU","IQT","TPP","CIX","PEM","BOG","MDE","CTG","CLO","SMR","ADZ","PEI","LET","UIO","GYE","SCL","CJC","ANF","PUQ","IPC","PMC","BBA","ZCO","MHC","EZE","AEP","COR","MDZ","GRU","GIG","BSB","LPB","VVI","MEX","CUN","GDL","PTY","SJO","MVD","CCS","BLA","MAR","MIA","MCO","JFK","LAX","MAD","BCN"
];
var API_ROOT = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates";
var CACHE_SECONDS = 900;


/* Cotizaciones firmadas, con expiración, para los pagos de marcha blanca.
 * Comparte LATAM_PRICE_QUOTE_KEY (mín. 40 caracteres aleatorios) con Reservas.
 * Ningún precio firmado equivale a boleto o hotel confirmado.
 */
/**
 * Ejecutar UNA sola vez en LATAM Flights API, tras copiar el nuevo Code.gs.
 * Guarda una clave aleatoria en propiedades del proyecto y la muestra en
 * el registro SOLO para copiarla a LATAM – Reservas y Pagos.
 * NO envíes esta clave en capturas ni mensajes.
 */
function lxPrepararClaveCotizaciones(){
  const p=PropertiesService.getScriptProperties();
  let key=String(p.getProperty('LATAM_PRICE_QUOTE_KEY')||'');
  if(!key){
    key=(Utilities.getUuid()+Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,'');
    p.setProperty('LATAM_PRICE_QUOTE_KEY',key);
  }
  if(key.length<40)throw Error('La clave de firma es demasiado corta. Reemplázala por una aleatoria de 64 caracteres o más.');
  console.log('Copia LATAM_PRICE_QUOTE_KEY en las propiedades PRIVADAS de LATAM – Reservas y Pagos: '+key);
  console.log('No compartas capturas que contengan esta clave. No modifiques la clave tras recibir cotizaciones.');
  return 'Clave creada o encontrada; cópiala del registro de ejecución y guárdala de forma segura.';
}
function lxQuoteKey_(){
  var k=String(PropertiesService.getScriptProperties().getProperty('LATAM_PRICE_QUOTE_KEY')||'');
  return k.length>=40?k:'';
}
function lxQuoteFingerprint_(segments){
  return (Array.isArray(segments)?segments:[]).map(function(s){
    return [String(s.airline||''),String(s.flightNumber||''),
      String(s.from&&s.from.code||''),String(s.from&&s.from.time||''),
      String(s.to&&s.to.code||''),String(s.to&&s.to.time||'')];
  });
}
function lxQuoteSign_(payload){
  var key=lxQuoteKey_();if(!key)return '';
  payload.v=1;payload.issued=Date.now();payload.expires=payload.issued+30*60*1000;
  var b64=Utilities.base64EncodeWebSafe(
    Utilities.newBlob(JSON.stringify(payload),'application/json').getBytes()).replace(/=+$/,'');
  var sig=Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(b64,key,Utilities.Charset.UTF_8)).replace(/=+$/,'');
  return b64+'.'+sig;
}
function lxFlightMarkupServer_(date){
  var d=new Date(String(date||'')+'T00:00:00Z'),today=new Date();
  var todayDay=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()));
  var n=Math.round((d-todayDay)/86400000);
  return n<=30?.10:n<=45?.05:n<=90?0:n<=180?-.05:n<=270?-.10:-.15;
}
function lxSignProviderResults_(result,request){
  if(!result||result.ok!==true||!lxQuoteKey_())return result;
  var slug=String(request.package_slug||'').toLowerCase();
  if(!/^[a-z0-9-]{4,90}$/.test(slug))return result;
  if(request.mode==='hotels'&&Array.isArray(result.hotels)){
    var tier=String(request.hotel_tier||''),room=String(request.hotel_occupancy||'');
    var adults=Number(request.adults||2),children=Number(request.children||0);
    var nights=Number(result.nights||0);
    var budgetMap={};
    try{budgetMap=JSON.parse(PropertiesService.getScriptProperties().getProperty('HOTEL_REFERENCE_NIGHT_USD')||'{}')}
    catch(ignore){budgetMap={}}
    var privateNight=Number(budgetMap[slug+'|'+tier+'|'+room]||0);
    // Referencia presupuestaria INTERNA del piloto Terrantai. Es un costo de trabajo
    // de la agencia (no precio neto confirmado) y NO se devuelve a la web.
    // Si se configura el valor en las propiedades, prevalece el costo personalizado.
    if(!(privateNight>0)&&slug==='desierto-atacama-premium-5d4n'&&tier==='4e'&&
       ['double','matrimonial','single'].indexOf(room)>=0)privateNight=370;
    var providerBaseline=Number(result.referenceHotel&&result.referenceHotel.totalRate||0);
    var baseline=privateNight>0?privateNight*nights:providerBaseline>0?providerBaseline:0;
    result.hotels.forEach(function(h){
      var alt=Number(h.totalRate||0);
      if(!(alt>0&&baseline>0&&nights>0))return;
      var extra=Math.round(Math.max(0,alt-baseline)*100)/100;
      h.supplementTotal=extra;h.supplementPerNight=Math.round(extra/nights*100)/100;
      h.quoteToken=lxQuoteSign_({
        kind:'hotel',slug:slug,tier:tier,occupancy:room,
        checkIn:String(request.check_in_date||''),checkOut:String(request.check_out_date||''),
        adults:adults,children:children,name:String(h.name||''),
        supplement:extra,alternativeStay:Math.round(alt*100)/100,nights:nights
      });
    });
  }else if(Array.isArray(result.offers)){
    var offers=result.offers;
    offers.forEach(function(o){
      if(!(o&&Number(o.price)>0&&o.origin&&o.destination&&
        o.outbound&&Array.isArray(o.outbound.segments)&&o.outbound.segments.length))return;
      var displayed=Math.round(Number(o.price)*(1+lxFlightMarkupServer_(o.departure))*100)/100;
      var allOut=o.outbound.segments,arrival=String(allOut[allOut.length-1].to&&
        allOut[allOut.length-1].to.time||'').slice(0,10);
      if(!/^\d{4}-\d\d-\d\d$/.test(arrival))return;
      o.displayedPrice=displayed;
      o.quoteToken=lxQuoteSign_({
        kind:'flight',slug:slug,origin:String(o.origin),destination:String(o.destination),
        departure:String(o.departure),returnDate:String(o.returnDate||''),arrival:arrival,
        adults:Number(o.partyAdults),children:Number(o.partyChildren),amount:displayed,
        observed:Math.round(Number(o.price)*100)/100,
        legs:[lxQuoteFingerprint_(o.outbound.segments),
          lxQuoteFingerprint_(o.inbound&&o.inbound.segments)]
      });
    });
  }
  return result;
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.mode === "bundle") {
    try {
      var request=String(p.payload||"");
      if(request.length>4200)throw new Error("Solicitud demasiado extensa.");
      var context=sanitizeTripBundle_(JSON.parse(request));
      var page=HtmlService.createTemplateFromFile("TripRequest");
      page.bundleContext=JSON.stringify(encodeURIComponent(JSON.stringify(context)));
      return page.evaluate().setTitle("Datos del viaje | Latam Expeditions")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }catch(err) {
      return HtmlService.createHtmlOutput("<p>Esta solicitud no es válida. Vuelve a armar tu viaje en Latam Expeditions.</p>")
        .setTitle("Solicitud no válida");
    }
  }
  if (p.mode === "request") {
    // Pass the original search context from the server to the iframe. This
    // avoids account-switching and redirect issues with Apps Script URLs.
    var keys=["origin","destination","trip","departure","returnDate","adults","children","observedPrice","package"];
    var clean={};
    keys.forEach(function(k){clean[k]=String(p[k]||"").slice(0,36);});
    clean.origin=/^[A-Z]{3}$/.test(clean.origin)?clean.origin:"";
    clean.destination=/^[A-Z]{3}$/.test(clean.destination)?clean.destination:"";
    clean.trip=["oneway","roundtrip"].indexOf(clean.trip)>=0?clean.trip:"";
    ["departure","returnDate"].forEach(function(k){
      if(!/^\d{4}-\d\d-\d\d$/.test(clean[k]))clean[k]="";
    });
    clean.adults=/^[1-9]$/.test(clean.adults)?clean.adults:"1";
    clean.package=clean.package==="medellin-esencial"?clean.package:"";
    clean.children=/^[0-6]$/.test(clean.children)?clean.children:"0";
    clean.observedPrice=/^\d{1,5}(\.\d{1,2})?$/.test(clean.observedPrice)?clean.observedPrice:"";
    var query=keys.map(function(k){return encodeURIComponent(k)+"="+encodeURIComponent(clean[k]);}).join("&");
    var template=HtmlService.createTemplateFromFile("FlightRequest");
    template.flightRequestQuery=JSON.stringify(query);
    return template.evaluate()
      .setTitle("Datos de pasajeros | Latam Expeditions")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  var cb = String(p.callback || "");
  if (!/^latamFlightCb_[a-zA-Z0-9]{5,50}$/.test(cb)) {
    return ContentService.createTextOutput("/* Invalid callback */")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  var output;
  try {
    output = p.mode === "hotel_rooms" ? searchHotelRoomDetails_(p) :
      (p.mode === "hotel_search" ? searchWorldwideHotels_(p) :
      (p.mode === "hotels" ? searchBundleHotels_(p) : fetchFlightData_(p)));
  } catch (err) {
    output = { ok:false, error:"service_error", message:"No pudimos consultar tarifas. Intenta de nuevo o solicita una cotización." };
    console.error("Flight lookup failed: " + String(err && err.message || err).slice(0,200));
  }
  // Firmar el precio observado solo cuando existe clave privada compartida.
  // El backend de PayPal comprobará la firma, fechas, viajeros y selección exacta.
  output=lxSignProviderResults_(output,p);
  // Payload is JSON-only, callback is strict allowlisted; no HTML output or secret.
  return ContentService.createTextOutput(cb + "(" + JSON.stringify(output) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function fetchFlightData_(p) {
  var origin = String(p.origin || "").toUpperCase();
  var destination = String(p.destination || "").toUpperCase();
  var trip = String(p.trip || "");
  var departure = String(p.departure || "");
  var ret = String(p.returnDate || "");
  var cabin = String(p.cabin || "economy");
  var adults = Number(p.adults || 1);
  var children = Number(p.children || 0);
  if (!Number.isInteger(adults) || adults<1 || adults>9 ||
      !Number.isInteger(children) || children<0 || children>6 || adults+children>9) {
    return {ok:false,error:"passengers_invalid",message:"Revisa la cantidad de pasajeros."};
  }

  if (FLIGHT_AIRPORTS.indexOf(origin) < 0 || FLIGHT_AIRPORTS.indexOf(destination) < 0 ||
      origin === destination || ["roundtrip","oneway"].indexOf(trip) < 0 ||
      !validFutureDate_(departure) ||
      (trip === "roundtrip" && (!validFutureDate_(ret) || ret < departure))) {
    return { ok:false, error:"invalid_query", message:"Ruta o fechas no válidas." };
  }
  var googleKey = PropertiesService.getScriptProperties().getProperty("SERPAPI_KEY");
  if (googleKey) {
    return searchGoogleFlights_(googleKey, origin, destination, departure,
      trip === "roundtrip" ? ret : "", trip, cabin, adults, children);
  }
  if (cabin !== "economy") {
    return { ok:false, error:"cabin_unsupported", message:"Las tarifas automáticas por ahora son de clase económica. Solicita una cotización para otras cabinas." };
  }
  var token = PropertiesService.getScriptProperties().getProperty("TP_API_TOKEN");
  if (!token) {
    return { ok:false, error:"not_configured", message:"Falta configurar el token privado de la fuente de tarifas." };
  }
  var cache = CacheService.getScriptCache();
  var key = ["fare-v2",origin,destination,trip,departure,ret].join("_");
  var stored = cache.get(key);
  if (stored) return JSON.parse(stored);

  // Exact travel date first. Round trips always include requested return date.
  var exactData = queryAviasales_(token, {
    origin:origin, destination:destination, departure_at:departure,
    return_at:trip === "roundtrip" ? ret : "",
    one_way:trip === "oneway" ? "true" : "false"
  });
  var exact = normalizeOffers_(exactData, origin, destination, trip, departure, ret, true);
  // Only show fares for the selected dates, never substitutes for other days.
  var result = {
    ok:true, source:"Aviasales Data API / Travelpayouts",
    currency:"USD", type:"cached_fares", live:false, quoted_at:new Date().toISOString(),
    exact:true, offers:exact.slice(0,24).map(function(o){o.priceBasis="adult";return o;})
  };
  // No quota wasted for repeated identical routes/dates.
  cache.put(key,JSON.stringify(result),CACHE_SECONDS);
  return result;
}

function queryAviasales_(token,q) {
  var params = {
    origin:q.origin, destination:q.destination, departure_at:q.departure_at,
    one_way:q.one_way, currency:"usd", sorting:"price", unique:"false", direct:"false",
    limit:"100", page:"1"
  };
  if (q.return_at) params.return_at = q.return_at;
  var fields = [];
  Object.keys(params).forEach(function(k) {
    fields.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
  });
  var response = UrlFetchApp.fetch(API_ROOT + "?" + fields.join("&"), {
    method:"get", muteHttpExceptions:true, followRedirects:true,
    headers:{"X-Access-Token":token,"Accept":"application/json"}
  });
  var status = response.getResponseCode();
  if (status === 429) throw new Error("Upstream rate limit");
  if (status < 200 || status >= 300) throw new Error("Upstream HTTP " + status);
  var obj = JSON.parse(response.getContentText());
  if (!obj || obj.success !== true || !Array.isArray(obj.data)) {
    throw new Error("Upstream query rejected");
  }
  return obj.data;
}

function normalizeOffers_(data,origin,destination,trip,departure,ret,onlyExact) {
  var departureMs = toUtcDay_(departure);
  var returnMs = trip === "roundtrip" ? toUtcDay_(ret) : 0;
  var out = [];
  data.forEach(function(f) {
    var price = Number(f.price);
    var day = String(f.departure_at || "").slice(0,10);
    var retDay = String(f.return_at || "").slice(0,10);
    if (!isFinite(price) || price <= 0 || !/^\d{4}-\d\d-\d\d$/.test(day)) return;
    if (f.origin && String(f.origin).toUpperCase() !== origin) return;
    if (f.destination && String(f.destination).toUpperCase() !== destination) return;
    if (trip === "roundtrip" && !/^\d{4}-\d\d-\d\d$/.test(retDay)) return;
    var same = day === departure && (trip !== "roundtrip" || retDay === ret);
    if (onlyExact && !same) return;
    if (!onlyExact) {
      // Alternate flights must be near the requested dates (not arbitrary dates).
      if (Math.abs(toUtcDay_(day) - departureMs) > 14 * 86400000) return;
      if (trip === "roundtrip" && Math.abs(toUtcDay_(retDay) - returnMs) > 14 * 86400000) return;
    }
    out.push({
      price:Math.round(price * 100) / 100, currency:"USD",
      origin:origin, destination:destination,
      originAirport:/^[A-Z]{3}$/.test(String(f.origin_airport || "")) ? f.origin_airport : origin,
      destinationAirport:/^[A-Z]{3}$/.test(String(f.destination_airport || "")) ? f.destination_airport : destination,
      departure:day, returnDate:trip === "roundtrip" ? retDay : "",
      departureAt:/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(String(f.departure_at || "")) ? String(f.departure_at).slice(0,35) : "",
      returnAt:trip === "roundtrip" && /^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(String(f.return_at || "")) ? String(f.return_at).slice(0,35) : "",
      airline:/^[A-Z0-9]{2,3}$/.test(String(f.airline || "").toUpperCase()) ? String(f.airline).toUpperCase() : "",
      flightNumber:/^[A-Za-z0-9]{1,8}$/.test(String(f.flight_number || "")) ? String(f.flight_number) : "",
      stops:typeof f.transfers === "number" && f.transfers >= 0 ? f.transfers : null,
      returnStops:typeof f.return_transfers === "number" && f.return_transfers >= 0 ? f.return_transfers : null,
      durationTo:typeof f.duration_to === "number" && f.duration_to > 0 ? f.duration_to : (trip === "oneway" && typeof f.duration === "number" && f.duration > 0 ? f.duration : null),
      durationBack:trip === "roundtrip" && typeof f.duration_back === "number" && f.duration_back > 0 ? f.duration_back : null,
      sameDates:same
    });
  });
  // Remove duplicate itineraries, preferring the lowest price.
  out.sort(function(a,b) { return a.price - b.price; });
  var unique = {};
  return out.filter(function(f) {
    var id = [f.airline,f.flightNumber,f.departureAt,f.returnAt,f.stops,f.returnStops].join("|");
    if (unique[id]) return false;
    unique[id] = true;
    return true;
  }).slice(0,24);
}

function validFutureDate_(v) {
  if (!/^\d{4}-\d\d-\d\d$/.test(v)) return false;
  var utc = toUtcDay_(v);
  if (!isFinite(utc) || new Date(utc).toISOString().slice(0,10) !== v) return false;
  var today = new Date();
  var start = Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate());
  return utc >= start && utc <= start + 365 * 86400000;
}

function toUtcDay_(v) {
  var a = String(v).split("-");
  return Date.UTC(Number(a[0]),Number(a[1])-1,Number(a[2]));
}


/**
 * OPTIONAL on-demand Google Flights data adapter through SerpApi.
 * We do not bypass Google's anti-bot protections or scrape directly.
 * Set SERPAPI_KEY only after confirming provider's commercial permissions.
 * Round-trip search = one outbound search + at most 2 return selections
 * (up to 3 provider API requests per user query). No ticketing/PNR.
 */
function serpSearch_(key,params) {
  // Cache on-demand searches to conserve quota, but never present cached
  // flight data as an airline reservation.
  var preKey=JSON.stringify(params);
  var hash=Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,preKey));
  var cacheKey="serp_"+hash.slice(0,54);
  var cache=CacheService.getScriptCache();
  var cached=cache.get(cacheKey);
  if(cached) return JSON.parse(cached);
  params.engine="google_flights";
  params.api_key=key;
  params.currency="USD";
  params.hl="es";
  params.gl="pe";
  var query=Object.keys(params).map(function(k){
    return encodeURIComponent(k)+"="+encodeURIComponent(params[k]);
  }).join("&");
  var res=UrlFetchApp.fetch("https://serpapi.com/search.json?"+query,{
    muteHttpExceptions:true,method:"get",followRedirects:true
  });
  if(res.getResponseCode()!==200) throw new Error("SerpApi HTTP "+res.getResponseCode());
  var json=JSON.parse(res.getContentText());
  if(json.error) throw new Error("SerpApi search error: "+String(json.error).slice(0,100));
  // Cache may reject oversized responses; failure to cache must not block results.
  try {cache.put(cacheKey,JSON.stringify(json),600);} catch(ex) {}
  return json;
}
function serpOptions_(json) {
  return [].concat(Array.isArray(json.best_flights)?json.best_flights:[],
    Array.isArray(json.other_flights)?json.other_flights:[]);
}
function normalizeSegment_(s) {
  function airport_(a) {
    return {code:String(a&&a.id||"").slice(0,3),
      name:String(a&&a.name||"").slice(0,100),time:String(a&&a.time||"").slice(0,25)};
  }
  return {
    airline:String(s.airline||"").slice(0,65),
    flightNumber:String(s.flight_number||"").slice(0,24),
    from:airport_(s.departure_airport),to:airport_(s.arrival_airport),
    duration:typeof s.duration==="number"?s.duration:null,
    airplane:String(s.airplane||"").slice(0,70),
    airlineLogo:/^https:\/\/www\.gstatic\.com\/flights\/airline_logos\/70px\/[A-Za-z0-9_-]+\.png$/.test(String(s.airline_logo||""))?String(s.airline_logo):""
  };
}
function normalizeTrip_(item) {
  return {
    segments:(Array.isArray(item.flights)?item.flights:[]).slice(0,8).map(normalizeSegment_),
    layovers:(Array.isArray(item.layovers)?item.layovers:[]).slice(0,7).map(function(l){
      return {airport:String(l.id||"").slice(0,3),
        id:String(l.id||"").slice(0,3),
        name:String(l.name||"").slice(0,100),
        duration:typeof l.duration==="number"?l.duration:null,
        overnight:!!l.overnight};
    }),
    duration:typeof item.total_duration==="number"?item.total_duration:null
  };
}
function searchGoogleFlights_(key,origin,destination,departure,ret,trip,cabin,adults,children) {
  var travelClass={"economy":"1","premium_economy":"2","business":"3"}[cabin]||"1";
  var p={type:trip==="roundtrip"?"1":"2",departure_id:origin,arrival_id:destination,
    outbound_date:departure,travel_class:travelClass,adults:String(adults),children:String(children)};
  if(trip==="roundtrip") p.return_date=ret;
  var base=serpSearch_(key,p);
  var outs=serpOptions_(base).filter(function(o){
    return Array.isArray(o.flights)&&o.flights.length;
  });
  var results=[];
  if(trip==="oneway") {
    outs.slice(0,30).forEach(function(o){
      if(!(Number(o.price)>0))return;
      var outbound=normalizeTrip_(o);
      results.push({
        price:Number(o.price),priceBasis:"party",partyAdults:adults,partyChildren:children,
        currency:"USD",origin:origin,destination:destination,
        departure:departure,returnDate:"",airline:o.flights[0].airline||"",
        stops:outbound.segments.length-1,returnStops:null,
        durationTo:outbound.duration,durationBack:null,
        outbound:outbound, inbound:null, sameDates:true,
        priceContext:"one_way_observed"
      });
    });
  } else {
    // Each outbound selection consumes another provider request.
    outs.filter(function(o){return !!o.departure_token;}).slice(0,3).forEach(function(o){
      var selected={type:"1",departure_id:origin,arrival_id:destination,
        outbound_date:departure,return_date:ret,travel_class:travelClass,
        adults:String(adults),children:String(children),departure_token:o.departure_token};
      var returns=serpOptions_(serpSearch_(key,selected));
      returns.slice(0,5).forEach(function(back){
        // Without a complete price for selected outbound+return do not quote.
        if(!(Number(back.price)>0) || !Array.isArray(back.flights) || !back.flights.length) return;
        var outward=normalizeTrip_(o),inward=normalizeTrip_(back);
        results.push({
          price:Number(back.price),priceBasis:"party",partyAdults:adults,partyChildren:children,
          currency:"USD",origin:origin,destination:destination,
          departure:departure,returnDate:ret,airline:o.flights[0].airline||"",
          stops:outward.segments.length-1,returnStops:inward.segments.length-1,
          durationTo:outward.duration,durationBack:inward.duration,
          outbound:outward,inbound:inward,sameDates:true,
          priceContext:"round_trip_observed"
        });
      });
    });
  }
  results.sort(function(a,b){return a.price-b.price;});
  return {ok:true,source:"Google Flights via SerpApi",currency:"USD",
    type:"on_demand_prices",live:false,quoted_at:new Date().toISOString(),
    exact:true,offers:results.slice(0,30)};
}

/**
 * Private quote request registration. No payment captured, no airline booking.
 * IMPORTANT: requires calling initFlightRequestsSheet() once in the editor.
 * Only invoked from Apps Script HtmlService (google.script.run).
 */
function initFlightRequestsSheet() {
  var prop=PropertiesService.getScriptProperties();
  var id=prop.getProperty("FLIGHT_REQUEST_SHEET_ID");
  if(id) return id;
  var book=SpreadsheetApp.create("Latam Expeditions - Solicitudes de vuelos");
  var sheet=book.getSheets()[0];
  sheet.setName("Solicitudes");
  sheet.appendRow(["Fecha","Código interno","Estado","Ruta","Fechas viaje",
    "Adultos","Niños","Tarifa ref. USD","Ajuste sugerido","Precio preliminar USD",
    "Nombre contacto","Email","Teléfono","Pasajeros (JSON privado)","Aceptación"]);
  sheet.setFrozenRows(1);
  prop.setProperty("FLIGHT_REQUEST_SHEET_ID",book.getId());
  return book.getId();
}
function submitFlightRequest(p) {
  if(!p || p.honeypot) throw new Error("Solicitud inválida.");
  var allowedTypes=["DNI","CE","PASSPORT","OTHER"];
  var legs=["oneway","roundtrip"];
  var origin=String(p.origin||"").toUpperCase(),destination=String(p.destination||"").toUpperCase();
  var departure=String(p.departure||""),ret=String(p.returnDate||"");
  var trip=String(p.trip||"");
  var packageCode=String(p.package||"")==="medellin-esencial"?"medellin-esencial":"";
  var adults=Number(p.adults),children=Number(p.children);
  if(FLIGHT_AIRPORTS.indexOf(origin)<0 || FLIGHT_AIRPORTS.indexOf(destination)<0 ||
    origin===destination || legs.indexOf(trip)<0 ||
    !validFutureDate_(departure) ||
    trip==="roundtrip" && (!validFutureDate_(ret)||ret<departure) ||
    !Number.isInteger(adults)||adults<1||adults>9||
    !Number.isInteger(children)||children<0||children>6||adults+children>9) {
    throw new Error("Revisa las fechas, rutas y número de viajeros.");
  }
  // Strictly no next-day departures without an actual flight departure time:
  // a departure tomorrow may be less than 24h away.
  var dayUTC=Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),new Date().getUTCDate());
  if(toUtcDay_(departure)-dayUTC<2*86400000) throw new Error("Por ahora solo aceptamos solicitudes desde pasado mañana.");
  if(p.accepted!==true) throw new Error("Debes aceptar las condiciones de la solicitud.");
  var email=String(p.email||"").trim().slice(0,150);
  var contact=String(p.contact||"").trim().slice(0,150);
  var phone=String(p.phone||"").replace(/[^\d+\s()-]/g,"").slice(0,30);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || contact.length<3) {
    throw new Error("Nombre y correo no válidos.");
  }
  var passengers=p.passengers;
  if(!Array.isArray(passengers)||passengers.length!==adults+children) {
    throw new Error("Completa los datos de todos los pasajeros.");
  }
  var sanitized=passengers.map(function(t){
    var fn=String(t.firstName||"").trim().slice(0,100),
      ln=String(t.lastName||"").trim().slice(0,100),
      type=String(t.docType||"").toUpperCase(),
      number=String(t.docNumber||"").trim().slice(0,35),
      dob=String(t.birthDate||""),
      baggage=String(t.baggagePreference||"standard");
    if(fn.length<2||ln.length<2||allowedTypes.indexOf(type)<0||
       !/^[A-Za-z0-9 .-]{4,35}$/.test(number)||
       !/^\d{4}-\d\d-\d\d$/.test(dob) || !Number.isFinite(toUtcDay_(dob))||
       toUtcDay_(dob)>=Date.now()) throw new Error("Verifica datos de los pasajeros.");
    if(["standard","carry_on","checked_23","both"].indexOf(baggage)<0) baggage="standard";
    return {firstName:fn,lastName:ln,docType:type,docNumber:number,birthDate:dob,baggagePreference:baggage};
  });
  var bookId=PropertiesService.getScriptProperties().getProperty("FLIGHT_REQUEST_SHEET_ID");
  if(!bookId) throw new Error("El registro privado aún no está activado. Contacta con Latam Expeditions.");
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(10000)) throw new Error("Servidor ocupado. Intenta nuevamente.");
  try {
    var cache=CacheService.getScriptCache();
    var digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,email.toLowerCase());
    var key="rq_"+Utilities.base64EncodeWebSafe(digest).slice(0,35);
    if(cache.get(key)) throw new Error("Ya recibimos una solicitud reciente de este correo. Contacta a nuestro equipo para evitar duplicados.");
    var internalCode="LXQ-"+Utilities.formatDate(new Date(),"Etc/UTC","yyyyMMdd")+"-"+
      Utilities.getUuid().replace(/-/g,"").slice(0,8).toUpperCase();
    // Values from client are UNVERIFIED and never constitute a price agreement.
    var observed=Number(p.observedPrice);
    var dayLead=Math.round((toUtcDay_(departure)-dayUTC)/86400000);
    var rate=dayLead<=30?0.10:dayLead<=45?0.05:dayLead<=90?0:
      dayLead<=180?-0.05:dayLead<=270?-0.10:-0.15;
    var estimated=Number.isFinite(observed)&&observed>0&&observed<100000?
      Math.round(observed*(1+rate)*100)/100:"NO VERIFICADO";
    var row=[new Date(),internalCode,"SOLICITUD SIN RESERVA NI BILLETE",
      origin+"-"+destination+(packageCode?" | PAQUETE: Medellín Esencial 4D/3N":""),departure+(ret?" / "+ret:""),adults,children,
      Number.isFinite(observed)&&observed>0&&observed<100000?observed:"NO VERIFICADO",
      (rate*100)+"%",estimated,contact,email,phone,JSON.stringify(sanitized),
      "Acepta solicitud sin billete y tratamiento de datos"];
    // Avoid spreadsheet formulas injected via user-provided input.
    row=row.map(function(value){return typeof value==="string" && /^[=+\-@]/.test(value)? "'"+value:value;});
    SpreadsheetApp.openById(bookId).getSheetByName("Solicitudes").appendRow(row);
    cache.put(key,internalCode,600);
    var notify=PropertiesService.getScriptProperties().getProperty("FLIGHT_REQUEST_NOTIFY_EMAIL");
    if(notify && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notify)) {
      try {
        MailApp.sendEmail(notify,"Nueva solicitud de vuelos "+internalCode,
          "Se recibió una solicitud de tarifa NO EMITIDA: "+internalCode+
          "\nRuta: "+origin+"-"+destination+"\nSalida: "+departure+
          "\nLos datos personales están disponibles exclusivamente en la hoja privada. "+
          "No hay boleto ni pago.");
      } catch(ex) {console.error("Flight request notification unavailable");}
    }
    return {ok:true,reference:internalCode,status:"SOLICITUD_RECIBIDA",
      message:"Tu solicitud fue registrada. Aún NO existe reserva aérea, PNR ni boleto emitido. Nuestro equipo validará precio y disponibilidad antes de ofrecerte pagar."};
  } finally {lock.releaseLock();}
}


/**
 * LATAM EXPEDITIONS — paquetes combinados MVP.
 * Los precios externos se usan SOLO como referencias; jamás confirma reserva.
 * App Script: usar propiedad SERPAPI_KEY existente. Para registro privado de
 * solicitudes ejecutar initTripRequestsSheet() una vez y desplegar NUEVA versión.
 */
function searchBundleHotels_(p) {
  var destination=String(p.destination||"").trim();
  // Lista blanca: evita que un endpoint público consuma cuota SerpAPI con consultas arbitrarias.
  var supported={
    "Medellín, Colombia":{q:"hoteles en Medellín Colombia",gl:"co"},
    "Bogotá, Colombia":{q:"hoteles en Bogotá Colombia",gl:"co"},
    "Cartagena, Colombia":{q:"hoteles en Cartagena Colombia",gl:"co"},
    "Cusco, Perú":{q:"hoteles en Cusco Perú",gl:"pe"},
    "Lima, Perú":{q:"hoteles en Lima Perú",gl:"pe"},
    "Arequipa, Perú":{q:"hoteles en Arequipa Perú",gl:"pe"},
    "Río de Janeiro, Brasil":{q:"hoteles en Río de Janeiro Brasil",gl:"br"},
    "Buenos Aires, Argentina":{q:"hoteles en Buenos Aires Argentina",gl:"ar"},
    "Santiago, Chile":{q:"hoteles 4 estrellas en Santiago Chile",gl:"cl"},
    "San Pedro de Atacama, Chile":{q:"hoteles 4 estrellas en San Pedro de Atacama Chile",gl:"cl"},
    "Puerto Varas, Chile":{q:"hoteles 4 estrellas Puerto Varas Chile",gl:"cl"},
    "Coyhaique, Chile":{q:"hoteles 4 estrellas Coyhaique Chile",gl:"cl"},
    "Pucón, Chile":{q:"hoteles 4 estrellas Pucón Chile",gl:"cl"},
    "Hanga Roa, Rapa Nui, Chile":{q:"hoteles 4 estrellas Hanga Roa Isla de Pascua Chile",gl:"cl"},
    "Castro, Chiloé, Chile":{q:"hoteles 4 estrellas Castro Chiloe Chile",gl:"cl"},
    "Puerto Natales, Chile":{q:"hoteles 4 estrellas Puerto Natales Chile",gl:"cl"},
    "Punta Arenas, Chile":{q:"hoteles 4 estrellas Punta Arenas Chile",gl:"cl"}
  };
  var location=supported[destination];
  if(!location)return {ok:false,message:"Consulta hotelera todavía no habilitada para este destino."};
  var checkin=String(p.check_in_date||""),checkout=String(p.check_out_date||"");
  // El hotel de referencia se consulta con las mismas fechas y ocupación.
  var baselineHotel=String(p.baseline_hotel||"").trim().slice(0,100);
  if(!/^[\p{L}0-9 .,&\x27\-]{2,100}$/u.test(baselineHotel))baselineHotel="";
  var adults=Number(p.adults||2),children=Number(p.children||0);
  var ages=String(p.children_ages||"").split(",").filter(function(x){return x!==""});
  if(children===0)ages=[];
  if(children>0&&(ages.length!==children||ages.some(function(x){
    return !/^[0-9]{1,2}$/.test(x)||Number(x)<1||Number(x)>17;
  })))return {ok:false,message:"Indica la edad de cada niño para cotizar hoteles."};
  if(!validFutureDate_(checkin)||!validFutureDate_(checkout)||checkout<=checkin||
     !Number.isInteger(adults)||adults<1||adults>4||
     !Number.isInteger(children)||children<0||children>2||adults+children>4||
     toUtcDay_(checkout)-toUtcDay_(checkin)>30*86400000){
    return {ok:false,message:"Revisa fechas y ocupación del hotel."};
  }
  var scriptProps=PropertiesService.getScriptProperties();
  var key=scriptProps.getProperty("SERPAPI_KEY");
  if(!key)return {ok:false,message:"Google Hotels requiere la propiedad SERPAPI_KEY en Apps Script."};
  // Referencia presupuestada por ocupación. Propiedad PRIVADA de Apps Script:
  // HOTEL_REFERENCE_NIGHT_USD = {"medellin-esencial|3e|double":100}
  // El ejemplo NO es una tarifa real y NO debe cargarse sin presupuesto de proveedor.
  var packageSlug=String(p.package_slug||"").toLowerCase().trim();
  var tierCode=String(p.hotel_tier||"").toLowerCase().trim();
  var roomCode=String(p.hotel_occupancy||"").toLowerCase().trim();
  if(!/^[a-z0-9-]{2,90}$/.test(packageSlug)||
     !/^[a-z0-9-]{1,40}$/.test(tierCode)||
     !/^(single|double|matrimonial|triple|family)$/.test(roomCode)){
    packageSlug="";tierCode="";roomCode="";
  }
  var budgetMap={};
  try{
    var fromProps=JSON.parse(scriptProps.getProperty("HOTEL_REFERENCE_NIGHT_USD")||"{}");
    if(fromProps&&typeof fromProps==="object"&&!Array.isArray(fromProps))budgetMap=fromProps;
  }catch(ignore){console.warn("Configuración privada de presupuestos hoteleros inválida.");}
  var lookupKey=packageSlug+"|"+tierCode+"|"+roomCode;
  var refNight=Number(budgetMap[lookupKey]||0);
  if(!(refNight>0&&refNight<10000))refNight=0;
  // Suplementos del piloto de Atacama: referencia privada que la agencia asume.
  // No incluye vuelos ni modifica el precio fijo del paquete.
  if(!refNight&&packageSlug==='desierto-atacama-premium-5d4n'&&tierCode==='4e'&&
     ['single','double','matrimonial'].indexOf(roomCode)>=0)refNight=370;
  // Paginación de hasta tres páginas: solo continuaciones generadas y almacenadas
  // por el servidor. El navegador no puede enviar tokens arbitrarios a SerpApi.
  var page=Number(p.page||0);
  if(!Number.isInteger(page)||page<0||page>2)
    return {ok:false,message:"Página de hoteles no disponible."};
  var baseKey="hotels_v4_"+Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
      [destination,checkin,checkout,adults,children,ages.join(","),baselineHotel,
        lookupKey,refNight].join("|"))).slice(0,50);
  var cache=CacheService.getScriptCache(),ck=baseKey+"_p"+page,stored=cache.get(ck);
  if(stored)return JSON.parse(stored);
  var token=page?cache.get(baseKey+"_token"+page):null;
  if(page&&!token)return {ok:false,message:"La búsqueda expiró. Vuelve a consultar hoteles para continuar."};
  var params={engine:"google_hotels",q:location.q,hl:"es",gl:location.gl,
    currency:"USD",check_in_date:checkin,check_out_date:checkout,
    adults:String(adults),children:String(children),api_key:key};
  if(children>0)params.children_ages=ages.join(",");
  function fetchHotels_(query,nextToken){
    var queryParams=Object.assign({},params,{q:query});
    if(nextToken)queryParams.next_page_token=nextToken;
    var url="https://serpapi.com/search.json?"+Object.keys(queryParams).map(function(k){
      return encodeURIComponent(k)+"="+encodeURIComponent(queryParams[k]);}).join("&");
    var res=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true});
    if(res.getResponseCode()!==200)throw Error("Hotel provider HTTP "+res.getResponseCode());
    var body=JSON.parse(res.getContentText());
    if(body.error)throw Error("No se pudo completar la búsqueda de hoteles.");
    // Al buscar un hotel concreto, Google Hotels/SerpApi puede devolver
    // un objeto de propiedad directamente, sin el arreglo "properties".
    // Antes esto descartaba la tarifa del hotel incluido en el paquete.
    return {
      properties:Array.isArray(body.properties)?body.properties:
        body.name&&(body.total_rate||body.rate_per_night)?[body]:[],
      nextToken:body.serpapi_pagination&&String(body.serpapi_pagination.next_page_token||'')||''
    };
  }
  var firstResponse=fetchHotels_(location.q,token);
  var properties=firstResponse.properties;
  function number_(obj){
    if(typeof obj==="number")return obj>0&&obj<100000?obj:null;
    if(obj&&typeof obj==="object"){
      var found=Number(obj.extracted_after_taxes_fees||obj.extracted_display_price||obj.extracted_lowest||obj.extracted_price||obj.extracted_total||0);
      return found>0&&found<100000?found:null;
    }
    return null;
  }
  function photo_(item){
    var candidates=[item.thumbnail,item.image,item.images&&item.images[0]&&
      (item.images[0].thumbnail||item.images[0].original_image)];
    return candidates.filter(function(v){return typeof v==="string"&&
      /^https:\/\/[^<>"'\s]{8,600}$/.test(v);})[0]||"";
  }
  var nights=Math.round((toUtcDay_(checkout)-toUtcDay_(checkin))/86400000);
  function toHotel_(h){
    var rating=Number(h.overall_rating||h.rating||0);
    var night=number_(h.rate_per_night),stay=number_(h.total_rate);
    // SerpAPI total_rate es el total de la estancia; nunca multiplicarlo por noches.
    var stars=Number(h.extracted_hotel_class||0);
    if(!Number.isInteger(stars)||stars<1||stars>5){
      var parsed=String(h.hotel_class||"").match(/(?:^|\D)([1-5])(?:\s*[- ]?star|\s*estrell)/i);
      stars=parsed?Number(parsed[1]):null;
    }
    var computedStay=stay||(night?Math.round(night*nights*100)/100:null);
    var addition=refNight>0&&computedStay>0?
      Math.round(Math.max(0,computedStay-refNight*nights)*100)/100:null;
    return {name:String(h.name).slice(0,110),rating:rating>=1&&rating<=5?rating:null,
      stars:stars>=1&&stars<=5?stars:null,
      thumbnail:photo_(h),nightlyRate:night,totalRate:computedStay,
      supplementTotal:addition,
      supplementPerNight:addition===null?null:Math.round(addition/nights*100)/100,
      address:String(h.address||"").slice(0,160),source:"Google Hotels",roomsVerified:false};
  }
  function canonical_(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}
  function exactHotel_(array,name){
    var target=canonical_(name);
    return array.find(function(h){return h&&h.name&&canonical_(h.name)===target;})||null;
  }
  var filtered=properties.filter(function(h){
    return h&&h.name&&String(h.type||"hotel").toLowerCase()!=="vacation rental";
  });
  var hotels=filtered.slice(0,24).map(toHotel_);
  var reference=page===0&&baselineHotel?exactHotel_(filtered,baselineHotel):null;
  // Solo una consulta adicional si el hotel incluido no aparece en el listado principal.
  if(page===0&&!reference&&baselineHotel&&refNight===0){
    try{reference=exactHotel_(fetchHotels_(baselineHotel+" "+destination).properties,baselineHotel);}catch(ignore){
      console.warn("No se encontró tarifa comparable para hotel incluido.");
    }
  }
  var referenceHotel=reference?toHotel_(reference):null;
  if(referenceHotel&&!(referenceHotel.totalRate>0))referenceHotel=null;
  // En páginas posteriores recuperar la misma referencia cotizada en página 1,
  // para firmar suplementos compatibles también en "Mostrar más hoteles".
  if(page>0&&!referenceHotel&&refNight===0){
    try{
      var firstCached=cache.get(baseKey+"_p0");
      if(firstCached){
        var firstPage=JSON.parse(firstCached);
        if(firstPage.referenceHotel&&Number(firstPage.referenceHotel.totalRate)>0)
          referenceHotel=firstPage.referenceHotel;
      }
    }catch(ignore){console.warn("No se pudo recuperar la tarifa base del primer resultado.");}
  }
  var nextToken=String(firstResponse.nextToken||"");
  var hasMore=page<2 && !!nextToken && nextToken.length<3000;
  var result={ok:true,source:"Google Hotels via SerpApi",pricesVerified:false,
    occupancyPricedForChildren:children===0||ages.length===children,
    nights:nights,referenceHotel:refNight>0?null:referenceHotel,hotels:hotels,
    supplementReferenceConfigured:refNight>0,
    page:page,hasMore:hasMore,nextPage:hasMore?page+1:null};
  try{
    if(hasMore)cache.put(baseKey+"_token"+(page+1),nextToken,600);
    cache.put(ck,JSON.stringify(result),600);
  }catch(ignore){}
  return result;
}

/**
 * Buscador independiente de hoteles. Admite cualquier ciudad/país (a diferencia
 * del selector de hoteles incluidos en paquetes, cuyo contrato no cambia).
 * SERPAPI_KEY permanece solamente en propiedades privadas del script.
 * Las tarifas son observaciones, NO disponibilidad reservable ni precio final.
 */
function searchWorldwideHotels_(p){
  var destination=String(p.destination||"").normalize("NFC").trim().replace(/\s+/g," ");
  if(destination.length<2||destination.length>90||
     !/^[\p{L}\p{N}\p{M} ,.'()\-]+$/u.test(destination))
    return {ok:false,message:"Escribe una ciudad o destino válido."};
  // El modo independiente puede consultar también un hotel destacado.
  // Nunca restringe la ciudad ni el país del viajero a una lista fija.
  var hotelName=String(p.hotel_name||"").normalize("NFC").trim().replace(/\s+/g," ").slice(0,110);
  if(hotelName&&!/^[\p{L}\p{N}\p{M} &.,'()\-]+$/u.test(hotelName))
    return {ok:false,message:"El nombre del hotel no es válido."};
  var checkin=String(p.check_in_date||""),checkout=String(p.check_out_date||"");
  var adults=Number(p.adults||2),children=Number(p.children||0);
  var ages=String(p.children_ages||"").split(",").filter(function(x){return x!==""});
  var category=String(p.category||"all");
  var page=Number(p.page||0);
  if(!/^(all|[2345])$/.test(category))
    return {ok:false,message:"Elige una categoría de hotel válida."};
  if(!validFutureDate_(checkin)||!validFutureDate_(checkout)||checkout<=checkin||
     toUtcDay_(checkout)-toUtcDay_(checkin)>30*86400000)
    return {ok:false,message:"Elige fechas futuras y una estancia de hasta 30 noches."};
  if(!Number.isInteger(adults)||adults<1||adults>8||
     !Number.isInteger(children)||children<0||children>6||adults+children>10)
    return {ok:false,message:"Revisa la cantidad de viajeros."};
  if(children===0)ages=[];
  if(children>0&&(ages.length!==children||ages.some(function(x){
    return !/^[0-9]{1,2}$/.test(x)||Number(x)<1||Number(x)>17;
  })))return {ok:false,message:"Indica la edad de cada niño."};
  if(!Number.isInteger(page)||page<0||page>2)
    return {ok:false,message:"Página de resultados no válida."};
  var key=PropertiesService.getScriptProperties().getProperty("SERPAPI_KEY");
  if(!key)return {ok:false,message:"La consulta de hoteles no está disponible en este momento."};
  var baseKey="hotel_public_v1_"+Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
      [destination.toLowerCase(),hotelName.toLowerCase(),checkin,checkout,adults,children,ages.join(","),category].join("|"))).slice(0,48);
  var cache=CacheService.getScriptCache();
  var ck=baseKey+"_p"+page;
  var cached=cache.get(ck);
  if(cached)return JSON.parse(cached);
  var nextPageToken=page?cache.get(baseKey+"_next_"+page):"";
  if(page&&!nextPageToken)
    return {ok:false,message:"La búsqueda ha expirado. Vuelve a buscar hoteles."};
  // Límite opcional para proteger la cuota del propietario ante tráfico abusivo.
  // Se configura en Apps Script: HOTEL_PUBLIC_DAILY_LIMIT (por defecto 100).
  var props=PropertiesService.getScriptProperties();
  var limit=Number(props.getProperty("HOTEL_PUBLIC_DAILY_LIMIT")||100);
  if(!Number.isFinite(limit)||limit<1)limit=100;
  var lock=LockService.getScriptLock(),locked=lock.tryLock(5000);
  if(!locked)return {ok:false,message:"Hay muchas búsquedas simultáneas. Inténtalo nuevamente."};
  try {
    var day=Utilities.formatDate(new Date(),"UTC","yyyyMMdd");
    var counterKey="HOTEL_PUBLIC_COUNT_"+day;
    var count=Number(props.getProperty(counterKey)||0);
    if(count>=limit)return {ok:false,message:"Las consultas de hoteles están temporalmente ocupadas. Inténtalo más tarde."};
    props.setProperty(counterKey,String(count+1));
  }finally{lock.releaseLock();}
  var params={
    engine:"google_hotels",q:hotelName?hotelName+" "+destination:"hoteles en "+destination,hl:"es",gl:"pe",currency:"USD",
    check_in_date:checkin,check_out_date:checkout,adults:String(adults),
    children:String(children),api_key:key
  };
  if(children>0)params.children_ages=ages.join(",");
  if(category!=="all")params.hotel_class=category;
  if(nextPageToken)params.next_page_token=nextPageToken;
  var url="https://serpapi.com/search.json?"+Object.keys(params).map(function(k){
    return encodeURIComponent(k)+"="+encodeURIComponent(params[k]);
  }).join("&");
  var response=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true});
  if(response.getResponseCode()!==200)
    return {ok:false,message:"No pudimos obtener resultados para esta búsqueda."};
  var data=JSON.parse(response.getContentText());
  if(data.error)return {ok:false,message:"No pudimos consultar los hoteles. Prueba otras fechas."};
  var nights=Math.round((toUtcDay_(checkout)-toUtcDay_(checkin))/86400000);
  function price_(value){
    if(typeof value==="number")return value>0&&value<1000000?value:null;
    if(!value||typeof value!=="object")return null;
    var number=Number(value.extracted_after_taxes_fees||
      value.extracted_display_price||value.extracted_lowest||value.extracted_price||0);
    return number>0&&number<1000000?number:null;
  }
  function image_(h){
    var candidates=[h.thumbnail,h.image,
      h.images&&h.images[0]&&(h.images[0].thumbnail||h.images[0].original_image)];
    return candidates.find(function(v){return typeof v==="string"&&
      /^https:\/\/[^<>"'\s]{8,650}$/.test(v);})||"";
  }
  var seen={};
  var hotels=(Array.isArray(data.properties)?data.properties:[])
    .filter(function(h){
      if(!h||!h.name||String(h.type||"hotel").toLowerCase()==="vacation rental")return false;
      var k=String(h.name).toLowerCase().trim();
      if(seen[k])return false;
      seen[k]=true;return true;
    }).slice(0,24).map(function(h){
      var stars=Number(h.extracted_hotel_class||0);
      if(!(stars>=2&&stars<=5)){
        var found=String(h.hotel_class||"").match(/(?:^|\D)([2-5])(?:\s*[- ]?star|\s*estrell)/i);
        stars=found?Number(found[1]):null;
      }
      var nightly=price_(h.rate_per_night);
      var total=price_(h.total_rate);
      return {
        name:String(h.name).slice(0,110),
        propertyToken:/^[A-Za-z0-9_-]{8,180}$/.test(String(h.property_token||""))?String(h.property_token):"",
        address:String(h.address||"").slice(0,160),
        thumbnail:image_(h),
        stars:stars>=2&&stars<=5?stars:null,
        rating:Number(h.overall_rating)>=1&&Number(h.overall_rating)<=5?
          Number(h.overall_rating):null,
        nightlyRate:nightly,totalRate:total||(nightly?Math.round(nightly*nights*100)/100:null),
        source:"Google Hotels"
      };
    });
  // Solo permitir detalle de hoteles que haya devuelto una búsqueda válida.
  hotels.forEach(function(h){
    if(!h.propertyToken)return;
    var identity=[h.propertyToken,destination,checkin,checkout,String(adults),String(children),ages.join(",")].join("|");
    var hash=Utilities.base64EncodeWebSafe(Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,identity)).slice(0,42);
    try{cache.put("hotel_room_authorized_"+hash,JSON.stringify({
      token:h.propertyToken,checkin:checkin,checkout:checkout,adults:adults,
      children:children,ages:ages,destination:destination,name:h.name
    }),600);}catch(ignore){}
  });
  var token=String(data.serpapi_pagination&&data.serpapi_pagination.next_page_token||"");
  var hasMore=page<2&&token.length>0&&token.length<3000;
  var result={
    ok:true,hotels:hotels,destination:destination,nights:nights,
    page:page,hasMore:hasMore,nextPage:hasMore?page+1:null,
    source:"Google Hotels",pricesVerified:false
  };
  try{
    if(hasMore)cache.put(baseKey+"_next_"+(page+1),token,600);
    cache.put(ck,JSON.stringify(result),600);
  }catch(ignore){}
  return result;
}


/* Consulta opcional del detalle de habitaciones de Google Hotels (SerpAPI).
 * Los tipos y las tarifas son datos observados, NO inventario reservable.
 * Solo acepta property_token procedente de una búsqueda previa de este servicio.
 */
function searchHotelRoomDetails_(p){
  var token=String(p.property_token||"");
  if(!/^[A-Za-z0-9_-]{8,180}$/.test(token))
    return {ok:false,message:"Selecciona nuevamente el hotel."};
  var query=[token,String(p.destination||""),String(p.check_in_date||""),
    String(p.check_out_date||""),String(p.adults||""),String(p.children||""),
    String(p.children_ages||"")].join("|");
  var hash=Utilities.base64EncodeWebSafe(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,query)).slice(0,42);
  var cache=CacheService.getScriptCache();
  var raw=cache.get("hotel_room_authorized_"+hash);
  if(!raw)return {ok:false,message:"La consulta ha caducado. Busca nuevamente el hotel."};
  var ctx=JSON.parse(raw);
  if(ctx.token!==token)return {ok:false,message:"Selecciona nuevamente el hotel."};
  var detailKey="hotel_rooms_v2_"+hash;
  var cached=cache.get(detailKey);if(cached)return JSON.parse(cached);
  var key=PropertiesService.getScriptProperties().getProperty("SERPAPI_KEY");
  if(!key)return {ok:false,message:"No se pudieron consultar las habitaciones."};
  // Evitar que la búsqueda de detalles agote la cuota con peticiones repetidas.
  var props=PropertiesService.getScriptProperties();
  var counterKey="HOTEL_PUBLIC_COUNT_"+Utilities.formatDate(new Date(),"UTC","yyyyMMdd");
  var limit=Number(props.getProperty("HOTEL_PUBLIC_DAILY_LIMIT")||100);
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(5000))return {ok:false,message:"Inténtalo nuevamente."};
  try{
    var count=Number(props.getProperty(counterKey)||0);
    if(count>=(Number.isFinite(limit)&&limit>0?limit:100))
      return {ok:false,message:"No podemos consultar más habitaciones por el momento."};
    props.setProperty(counterKey,String(count+1));
  }finally{lock.releaseLock()}
  var params={engine:"google_hotels",property_token:token,
    check_in_date:ctx.checkin,check_out_date:ctx.checkout,
    adults:String(ctx.adults),children:String(ctx.children),
    hl:"es",gl:"pe",currency:"USD",api_key:key};
  if(ctx.children>0)params.children_ages=ctx.ages.join(",");
  var url="https://serpapi.com/search.json?"+Object.keys(params).map(function(k){
    return encodeURIComponent(k)+"="+encodeURIComponent(params[k]);}).join("&");
  var response=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true});
  if(response.getResponseCode()!==200)
    return {ok:false,message:"No fue posible consultar las habitaciones de este hotel."};
  var body=JSON.parse(response.getContentText());
  if(body.error)return {ok:false,message:"No fue posible consultar las habitaciones de este hotel."};
  function price_(v){
    if(typeof v==="number")return v>0&&v<1000000?v:null;
    var n=Number(v&&(v.extracted_after_taxes_fees||v.extracted_display_price||
      v.extracted_lowest||v.extracted_price)||0);
    return n>0&&n<1000000?n:null;
  }
  function url_(v){
    return typeof v==="string"&&/^https:\/\/[^<>"'\s]{8,1500}$/.test(v)?v:"";
  }
  var nights=Math.round((toUtcDay_(ctx.checkout)-toUtcDay_(ctx.checkin))/86400000);
  var offers=[],providers=[].concat(body.featured_prices||[],body.prices||[]);
  providers.slice(0,25).forEach(function(provider){
    var source=String(provider.source||"").slice(0,80);
    var rooms=Array.isArray(provider.rooms)?provider.rooms:[];
    rooms.slice(0,18).forEach(function(room){
      if(!room||!room.name||offers.length>=40)return;
      var rateVariants=Array.isArray(room.rates)&&room.rates.length?room.rates:[room];
      rateVariants.slice(0,4).forEach(function(rate){
        if(offers.length>=40)return;
        var night=price_(rate.rate_per_night)||price_(room.rate_per_night);
        var total=price_(rate.total_rate)||price_(room.total_rate)||(night?Math.round(night*nights*100)/100:null);
        var capacity=Number(rate.num_guests||room.num_guests||provider.num_guests||0);
        offers.push({name:String(room.name).slice(0,100),source:source,
          numGuests:Number.isInteger(capacity)&&capacity>=1&&capacity<=20?capacity:null,
          nightlyRate:night,totalRate:total,
          inclusions:(Array.isArray(rate.inclusions)?rate.inclusions:[]).slice(0,5)
            .map(function(t){return String(t).slice(0,100)}),
          bookingUrl:url_(rate.link)||url_(room.link)||url_(provider.link),
          thumbnail:url_(room.images&&room.images[0]&&(typeof room.images[0]==="string"?
            room.images[0]:room.images[0].thumbnail||room.images[0].original_image))
        });
      });
    });
    if(!rooms.length&&offers.length<40){
      var night=price_(provider.rate_per_night),total=price_(provider.total_rate);
      if(night||total)offers.push({
        name:"Opción de alojamiento",source:source,numGuests:Number(provider.num_guests)||null,
        nightlyRate:night,totalRate:total||(night?Math.round(night*nights*100)/100:null),
        inclusions:[],bookingUrl:url_(provider.link),thumbnail:"",roomTypeUnspecified:true
      });
    }
  });
  var seen={};
  offers=offers.filter(function(o){
    var k=[o.name,o.source,o.totalRate,o.numGuests].join("|");
    if(seen[k])return false;seen[k]=true;return true;
  });
  var result={ok:true,hotel:ctx.name,destination:ctx.destination,
    checkIn:ctx.checkin,checkOut:ctx.checkout,adults:ctx.adults,children:ctx.children,
    nights:nights,rooms:offers,source:"Google Hotels",inventoryConfirmed:false};
  try{cache.put(detailKey,JSON.stringify(result),450);}catch(ignore){}
  return result;
}

function sanitizeTripBundle_(b){
  if(!b||typeof b!=="object"||b.packageId!=="medellin-esencial")throw Error("Paquete no válido.");
  var origin=String(b.origin||"").toUpperCase();
  if(FLIGHT_AIRPORTS.indexOf(origin)<0||origin==="MDE")throw Error("Aeropuerto inválido.");
  var adults=Number(b.adults),children=Number(b.children);
  if(!Number.isInteger(adults)||adults<1||adults>4||
     !Number.isInteger(children)||children<0||children>2||adults+children>4)throw Error("Viajeros no válidos.");
  var arrival=String(b.arrival||""),checkout=String(b.checkout||"");
  if(!validFutureDate_(arrival)||!validFutureDate_(checkout)||
     toUtcDay_(checkout)-toUtcDay_(arrival)!==3*86400000)throw Error("Estadía inválida.");
  var current=Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),new Date().getUTCDate());
  if(toUtcDay_(arrival)-current<2*86400000)throw Error("Fecha próxima no permitida.");
  var tier=String(b.hotelTier||"standard");
  if(["standard","superior","luxury"].indexOf(tier)<0)throw Error("Categoría no válida.");
  var custom=String(b.customHotel||"").trim().slice(0,110);
  if(custom&&!/^[\p{L}\p{N} .,'&()\-]{3,110}$/u.test(custom))throw Error("Nombre de hotel no válido.");
  var rawActs=Array.isArray(b.activities)?b.activities:[];
  if(rawActs.length>2||rawActs.some(function(a){return ["parapente","medellin-noche"].indexOf(a)<0;}))throw Error("Actividad no válida.");
  var acts=rawActs.filter(function(a,i){return rawActs.indexOf(a)===i;});
  var outbound=String(b.flightOut||""),ret=String(b.flightBack||"");
  var flight=b.flight&&typeof b.flight==="object"?b.flight:null;
  function segments_(arr){
    if(!Array.isArray(arr))return [];
    return arr.slice(0,6).map(function(seg){
      function airport_(a){return {code:String(a&&a.code||"").slice(0,3),
        time:String(a&&a.time||"").slice(0,30),name:String(a&&a.name||"").slice(0,65)};}
      return {airline:String(seg.airline||"").slice(0,65),
        flightNumber:String(seg.flightNumber||"").slice(0,24),
        from:airport_(seg.from),to:airport_(seg.to)};
    });
  }
  var cleanFlight=null;
  if(flight){
    if(!validFutureDate_(outbound)||!validFutureDate_(ret)||outbound>ret||
       toUtcDay_(outbound)-current<2*86400000||outbound>checkout||
       ret<arrival||ret>daysAfterTrip_(checkout,2))throw Error("Fechas aéreas no válidas.");
    var observed=Number(flight.price);
    if(!(observed>0&&observed<100000))throw Error("Tarifa no válida.");
    var out=segments_(flight.outbound),back=segments_(flight.inbound);
    if(!out.length||!back.length)throw Error("Faltan tramos aéreos.");
    cleanFlight={priceObserved:observed,currency:"USD",airline:String(flight.airline||"").slice(0,80),
      flightOut:outbound,flightBack:ret,outbound:out,inbound:back,
      note:"Datos enviados por navegador; se requiere verificar tarifa y plazas antes del cobro."};
  }
  return {packageId:"medellin-esencial",origin:origin,destination:"MDE",arrival:arrival,
    checkout:checkout,adults:adults,children:children,hotelTier:tier,
    customHotel:custom,activities:acts,flight:cleanFlight};
}
function daysAfterTrip_(date,n){var d=new Date(date+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);
  return Utilities.formatDate(d,"UTC","yyyy-MM-dd");}
function tripPackageCost_(b){
  var rates={standard:[419,299,289,279],superior:[589,419,399,389],luxury:[909,649,619,599]};
  var rate=rates[b.hotelTier][b.adults+b.children-1];
  return Math.round((rate*b.adults+rate*.7*b.children)*100)/100;
}
function tripActivitiesCost_(b){
  var rates={"parapente":99,"medellin-noche":49};
  return b.activities.reduce(function(sum,id){return sum+rates[id]*b.adults;},0);
}
function tripFlightEstimate_(b){
  if(!b.flight)return 0;
  var today=Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),new Date().getUTCDate());
  var n=Math.round((toUtcDay_(b.flight.flightOut)-today)/86400000);
  var factor=n<=30?1.10:n<=45?1.05:n<=90?1:n<=180?.95:n<=270?.90:.85;
  return Math.round(b.flight.priceObserved*factor*100)/100;
}
/**
 * Private storage: creates a new Sheet ID in Script Properties.
 * NEVER publish the Sheet or put passenger documents into a GET URL.
 */
function initTripRequestsSheet(){
  var prop=PropertiesService.getScriptProperties();
  var current=prop.getProperty("TRIP_REQUEST_SHEET_ID");if(current)return current;
  var book=SpreadsheetApp.create("Latam Expeditions - Viajes personalizables");
  var sheet=book.getSheets()[0];sheet.setName("Solicitudes de paquetes");
  sheet.appendRow(["Fecha","Código interno","Estado","Paquete","Llegada","Salida",
    "Aeropuerto origen","Adultos","Niños","Hotel categoría","Hotel alternativo",
    "Actividades","Vuelo (JSON sin pasajeros)","Paquete referencial USD",
    "Actividades adultos USD","Vuelo referencial USD","Subtotal referencial USD",
    "Contacto","Email","Teléfono","Pasajeros privados (JSON)","Aceptación"]);
  sheet.setFrozenRows(1);prop.setProperty("TRIP_REQUEST_SHEET_ID",book.getId());
  return book.getId();
}
function submitTripRequest(p){
  if(!p||p.honeypot)throw Error("Solicitud inválida.");
  var b=sanitizeTripBundle_(p.bundle);
  if(p.accepted!==true)throw Error("Debes aceptar las condiciones de la solicitud.");
  var email=String(p.email||"").trim().slice(0,150);
  var contact=String(p.contact||"").trim().slice(0,150);
  var phone=String(p.phone||"").replace(/[^\d+\s()-]/g,"").slice(0,30);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||contact.length<3||
     phone.replace(/\D/g,"").length<7)throw Error("Revisa tus datos de contacto.");
  var passengers=p.passengers;
  if(!Array.isArray(passengers)||passengers.length!==b.adults+b.children)throw Error("Completa todos los pasajeros.");
  var approvedTypes=["DNI","CE","PASSPORT","OTHER"];
  var people=passengers.map(function(t){
    var first=String(t.firstName||"").trim().slice(0,100),
      last=String(t.lastName||"").trim().slice(0,100),
      type=String(t.docType||"").toUpperCase(),
      doc=String(t.docNumber||"").trim().slice(0,35),
      dob=String(t.birthDate||""),
      baggage=String(t.baggagePreference||"standard");
    if(first.length<2||last.length<2||approvedTypes.indexOf(type)<0||
       !/^[A-Za-z0-9 .-]{4,35}$/.test(doc)||!validFutureDate_(b.arrival)||
       !/^\d{4}-\d\d-\d\d$/.test(dob)||!Number.isFinite(toUtcDay_(dob))||
       toUtcDay_(dob)>=Date.now())throw Error("Revisa los datos de pasajeros.");
    if(["standard","carry_on","checked_23","both"].indexOf(baggage)<0)baggage="standard";
    return {firstName:first,lastName:last,docType:type,docNumber:doc,birthDate:dob,baggagePreference:baggage};
  });
  var sheetId=PropertiesService.getScriptProperties().getProperty("TRIP_REQUEST_SHEET_ID");
  if(!sheetId)throw Error("La hoja privada de viajes no está inicializada. Contacta con Latam Expeditions.");
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(10000))throw Error("El servidor está ocupado.");
  try{
    var digest=Utilities.base64EncodeWebSafe(Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,email.toLowerCase()+JSON.stringify(b)));
    var cache=CacheService.getScriptCache(),key="bundle_"+digest.slice(0,48);
    if(cache.get(key))throw Error("Ya recibimos una solicitud similar. Contacta con nuestro equipo antes de repetirla.");
    var id="LXP-"+Utilities.formatDate(new Date(),"Etc/UTC","yyyyMMdd")+"-"+
      Utilities.getUuid().replace(/-/g,"").slice(0,8).toUpperCase();
    var pkg=tripPackageCost_(b),act=tripActivitiesCost_(b),flight=tripFlightEstimate_(b);
    var estimate=Math.round((pkg+act+flight)*100)/100;
    // All values remain NON-BINDING and may contain user-supplied prices.
    var row=[new Date(),id,"SOLICITUD PENDIENTE SIN COBRO",b.packageId,b.arrival,b.checkout,
      b.origin,b.adults,b.children,b.hotelTier,b.customHotel,b.activities.join(", "),
      JSON.stringify(b.flight||{}),pkg,act,flight,estimate,contact,email,phone,
      JSON.stringify(people),"Acepta validación de disponibilidad y tratamiento de datos"];
    row=row.map(function(v){return typeof v==="string"&&/^[=+\-@]/.test(v)?"'"+v:v});
    var sheet=SpreadsheetApp.openById(sheetId).getSheetByName("Solicitudes de paquetes");
    sheet.appendRow(row);cache.put(key,id,600);
    var notify=PropertiesService.getScriptProperties().getProperty("TRIP_REQUEST_NOTIFY_EMAIL");
    if(notify&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notify)){
      try{MailApp.sendEmail(notify,"Nueva solicitud combinada "+id,
        "Nueva solicitud "+id+"\nPaquete: Medellín Esencial\nLlegada: "+b.arrival+
        "\nRevisa los datos privados en la hoja. Sin cobro ni reservas confirmadas.");}
      catch(ex){console.error("Trip email notification failed");}
    }
    return {ok:true,reference:id,status:"PENDIENTE_DE_VALIDACION",
      estimatedSubtotal:estimate,
      message:"Recibimos tu solicitud. Te enviaremos disponibilidad, condiciones y un enlace de pago después de verificarlas. Este código no es una reserva aérea ni hotelera."};
  }finally{lock.releaseLock();}
}
