/**
 * Diagnóstico privado de Google Flights / SerpApi para Latam Expeditions.
 * Ejecutar manualmente desde el editor de Apps Script; NO publicar como web app.
 * Utiliza una consulta de SOLO IDA (LIM-CUZ) a 21 días para gastar como
 * máximo una consulta real cuando no existe respuesta cacheada.
 * No registra el token, respuestas completas, datos de pasajeros ni URLs con clave.
 */
function diagnosticarSerpApi() {
  var token=PropertiesService.getScriptProperties().getProperty("SERPAPI_KEY");
  var yes=!!(token && String(token).trim());
  console.log("DIAGNÓSTICO LATAM FLIGHTS");
  console.log("SERPAPI_KEY configurada: "+(yes?"SÍ":"NO"));
  if(!yes) {
    console.log("RESULTADO: Apps Script no encuentra una propiedad denominada SERPAPI_KEY. Verificar nombre exacto y guardar.");
    return;
  }
  var d=new Date(Date.now()+21*24*60*60*1000);
  var departure=Utilities.formatDate(d,"Etc/UTC","yyyy-MM-dd");
  console.log("Ruta de prueba: LIM-CUZ | Solo ida | "+departure+" | 1 adulto");
  try {
    var parameters={
      type:"2", departure_id:"LIM", arrival_id:"CUZ",
      outbound_date:departure, travel_class:"1",
      adults:"1", children:"0"
    };
    // Usa el conector SerpApi del proyecto, sin imprimir la URL ni la clave.
    var json=serpSearch_(String(token).trim(),parameters);
    var best=Array.isArray(json.best_flights)?json.best_flights:[];
    var other=Array.isArray(json.other_flights)?json.other_flights:[];
    var all=best.concat(other);
    var withPrice=all.filter(function(o){return Number(o.price)>0;}).length;
    var hasFlights=all.filter(function(o){return Array.isArray(o.flights)&&o.flights.length>0;}).length;
    console.log("Estado SerpApi: "+String(json.search_metadata&&json.search_metadata.status||"sin estado"));
    console.log("Resultados mejores: "+best.length+" | adicionales: "+other.length);
    console.log("Itinerarios completos: "+hasFlights+" | con precio: "+withPrice);
    if(all.length) {
      var first=all[0];
      console.log("Primera aerolínea: "+String(first.flights&&first.flights[0]&&first.flights[0].airline||"no informada"));
      console.log("Primer precio: "+(Number(first.price)>0?String(first.price)+" USD":"sin precio"));
    }
    console.log("RESULTADO: "+(withPrice>0?"SerpApi responde con vuelos. Si la web no los muestra, revisar la versión desplegada o la presentación.":"SerpApi respondió, pero esta consulta no devolvió tarifas utilizables. Verificar respuesta y probar otra fecha."));
  } catch(err) {
    var message=String(err&&err.message||err||"Error desconocido");
    // No imprimir claves ni direcciones completas de la API.
    message=message.replace(/api_key=[^\s&]+/g,"api_key=OCULTO").slice(0,180);
    console.error("ERROR EN SERPAPI: "+message);
    console.error("Comprueba la clave, el saldo de búsquedas, la autorización y los registros de ejecuciones.");
  }
}


/**
 * Diagnóstico del /exec PÚBLICO que utiliza latamexpeditions.com.
 * La ejecución anterior puede funcionar mientras la versión desplegada
 * sigue siendo antigua. Esta función confirma la fuente real de la API web.
 * Utiliza una sola consulta de SOLO IDA de prueba. No imprime credenciales.
 */
function diagnosticarEndpointPublicado() {
  var base="https://script.google.com/macros/s/AKfycbwA7TxLqYvFW_Eo-2V9R60TBs_Y-sW_rZ3Q-RIuYv1kISU_d4lsL-vS4ioZjNcXG7F9/exec";
  var cb="latamFlightCb_TestPublic2026";
  var d=new Date(Date.now()+21*86400000);
  var departure=Utilities.formatDate(d,"Etc/UTC","yyyy-MM-dd");
  var params={callback:cb,origin:"LIM",destination:"CUZ",
    trip:"oneway",departure:departure,adults:"1",children:"0",cabin:"economy"};
  var qs=Object.keys(params).map(function(k){
    return encodeURIComponent(k)+"="+encodeURIComponent(params[k]);
  }).join("&");
  console.log("DIAGNÓSTICO API PÚBLICA | LIM-CUZ | "+departure);
  try {
    var res=UrlFetchApp.fetch(base+"?"+qs,{
      method:"get",followRedirects:true,muteHttpExceptions:true
    });
    console.log("HTTP: "+res.getResponseCode());
    var body=res.getContentText();
    var prefix=cb+"(";
    if(body.indexOf(prefix)!==0 || body.slice(-2)!==");") {
      console.log("El endpoint no entregó la respuesta JSONP esperada.");
      console.log("Tipo de contenido: "+String(res.getHeaders()["Content-Type"]||"desconocido").slice(0,80));
      console.log("Respuesta posiblemente una página de acceso, error o despliegue anterior; no se muestra su contenido.");
      return;
    }
    var data=JSON.parse(body.slice(prefix.length,-2));
    console.log("Backend publicó: "+String(data.source||"NO INFORMADO").slice(0,70));
    console.log("Tipo de datos: "+String(data.type||"NO INFORMADO").slice(0,50));
    console.log("API ok: "+String(data.ok));
    console.log("Cantidad de tarifas: "+(Array.isArray(data.offers)?data.offers.length:"NO INFORMADO"));
    if(data.ok===false) {
      console.log("Código de error: "+String(data.error||"desconocido").slice(0,80));
    }
    if(data.ok && Array.isArray(data.offers) && data.offers.length) {
      var first=data.offers[0];
      console.log("Primera tarifa: "+String(first.price)+" USD | fecha "+String(first.departure));
      console.log("Resultado: la API pública devuelve vuelos; si la web sigue vacía, revisaremos la presentación.");
    } else if(data.source && data.source.indexOf("Aviasales")>=0) {
      console.log("RESULTADO: La web usa un despliegue de Travelpayouts; actualizar la MISMA implementación con Nueva versión.");
    } else if(data.ok && Array.isArray(data.offers) && !data.offers.length) {
      console.log("RESULTADO: La API pública responde pero devuelve cero vuelos. Comprobar fecha, fuente y registros de ejecución.");
    } else {
      console.log("RESULTADO: La API pública no pudo completar la consulta; revisar registros de Apps Script.");
    }
  } catch(err) {
    console.error("Error al consultar /exec: "+String(err&&err.message||err).slice(0,160));
  }
}
