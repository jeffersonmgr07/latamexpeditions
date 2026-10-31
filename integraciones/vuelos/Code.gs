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
  "LIM","CUZ","AQP","JUL","PIU","TRU","IQT","TPP","CIX","PEM","BOG","MDE","CTG","CLO","SMR","ADZ","PEI","LET","UIO","GYE","SCL","ANF","EZE","AEP","COR","MDZ","GRU","GIG","BSB","LPB","VVI","MEX","CUN","GDL","PTY","SJO","MVD","CCS","BLA","MAR","MIA","MCO","JFK","LAX","MAD","BCN"
];
var API_ROOT = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates";
var CACHE_SECONDS = 900;

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.mode === "request") {
    // Pass the original search context from the server to the iframe. This
    // avoids account-switching and redirect issues with Apps Script URLs.
    var keys=["origin","destination","trip","departure","returnDate","adults","children","observedPrice"];
    var clean={};
    keys.forEach(function(k){clean[k]=String(p[k]||"").slice(0,36);});
    clean.origin=/^[A-Z]{3}$/.test(clean.origin)?clean.origin:"";
    clean.destination=/^[A-Z]{3}$/.test(clean.destination)?clean.destination:"";
    clean.trip=["oneway","roundtrip"].indexOf(clean.trip)>=0?clean.trip:"";
    ["departure","returnDate"].forEach(function(k){
      if(!/^\d{4}-\d\d-\d\d$/.test(clean[k]))clean[k]="";
    });
    clean.adults=/^[1-9]$/.test(clean.adults)?clean.adults:"1";
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
    output = fetchFlightData_(p);
  } catch (err) {
    output = { ok:false, error:"service_error", message:"No pudimos consultar tarifas. Intenta de nuevo o solicita una cotización." };
    console.error("Flight lookup failed: " + String(err && err.message || err).slice(0,200));
  }
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
    airplane:String(s.airplane||"").slice(0,70)
  };
}
function normalizeTrip_(item) {
  return {
    segments:(Array.isArray(item.flights)?item.flights:[]).slice(0,8).map(normalizeSegment_),
    layovers:(Array.isArray(item.layovers)?item.layovers:[]).slice(0,7).map(function(l){
      return {airport:String(l.id||"").slice(0,3),
        name:String(l.name||"").slice(0,100),
        duration:typeof l.duration==="number"?l.duration:null};
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
      dob=String(t.birthDate||"");
    if(fn.length<2||ln.length<2||allowedTypes.indexOf(type)<0||
       !/^[A-Za-z0-9 .-]{4,35}$/.test(number)||
       !/^\d{4}-\d\d-\d\d$/.test(dob) || !Number.isFinite(toUtcDay_(dob))||
       toUtcDay_(dob)>=Date.now()) throw new Error("Verifica datos de los pasajeros.");
    return {firstName:fn,lastName:ln,docType:type,docNumber:number,birthDate:dob};
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
    var rate=dayLead<=44?0.10:dayLead<=60?0.05:dayLead<=90?0:
      dayLead<=180?-0.05:dayLead<=270?-0.10:-0.15;
    var estimated=Number.isFinite(observed)&&observed>0&&observed<100000?
      Math.round(observed*(1+rate)*100)/100:"NO VERIFICADO";
    var row=[new Date(),internalCode,"SOLICITUD SIN RESERVA NI BILLETE",
      origin+"-"+destination,departure+(ret?" / "+ret:""),adults,children,
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
