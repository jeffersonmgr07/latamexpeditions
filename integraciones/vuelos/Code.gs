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

  if (FLIGHT_AIRPORTS.indexOf(origin) < 0 || FLIGHT_AIRPORTS.indexOf(destination) < 0 ||
      origin === destination || ["roundtrip","oneway"].indexOf(trip) < 0 ||
      !validFutureDate_(departure) ||
      (trip === "roundtrip" && (!validFutureDate_(ret) || ret < departure))) {
    return { ok:false, error:"invalid_query", message:"Ruta o fechas no válidas." };
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
  var nearby = [];
  if (!exact.length) {
    // Only as a clearly labeled alternative. Never treat nearby dates as exact.
    var monthData = queryAviasales_(token, {
      origin:origin, destination:destination, departure_at:departure.slice(0,7),
      return_at:trip === "roundtrip" ? ret.slice(0,7) : "",
      one_way:trip === "oneway" ? "true" : "false"
    });
    nearby = normalizeOffers_(monthData,origin,destination,trip,departure,ret,false);
  }
  var result = {
    ok:true, source:"Aviasales Data API / Travelpayouts",
    currency:"USD", type:"cached_fares", live:false, quoted_at:new Date().toISOString(),
    exact:exact.length > 0, offers:(exact.length ? exact : nearby).slice(0,24)
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
