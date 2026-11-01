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
