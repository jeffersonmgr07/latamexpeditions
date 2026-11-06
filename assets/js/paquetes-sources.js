/* LATAM Expeditions · adaptadores de vuelos y hoteles del configurador */
(()=>{
'use strict';
const endpoint=String(window.LATAM_FLIGHTS_API_URL||'');
const valid=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint);
function get(params){
 if(!valid)return Promise.reject(new Error('Debes actualizar la implementación de Google Apps Script.'));
 return new Promise((resolve,reject)=>{
  const cb='latamFlightCb_'+Date.now()+Math.floor(Math.random()*1e6);
  const url=new URL(endpoint);
  Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,String(v)));
  url.searchParams.set('callback',cb);
  const script=document.createElement('script');let done=false;
  const timer=setTimeout(()=>finish(new Error('Consulta agotada.')),65000);
  function finish(err,data){
   if(done)return;done=true;clearTimeout(timer);script.remove();delete window[cb];
   if(err)reject(err);else resolve(data);
  }
  window[cb]=data=>finish(null,data);
  script.onerror=()=>finish(new Error('No se pudo conectar con Apps Script.'));
  script.src=url.toString();document.head.append(script);
 });
}
const airlines=[['latam','LA'],['jetsmart','JA'],['avianca','AV'],['sky','H2'],['copa','CM'],['american','AA'],['united','UA'],['gol','G3']];
function logo(s){
 const u=String(s?.airlineLogo||'');
 if(/^https:\/\/www\.gstatic\.com\/flights\/airline_logos\/70px\/[A-Za-z0-9_-]+\.png$/.test(u))return u;
 const name=String(s?.airline||'').toLowerCase();
 const a=airlines.find(a=>name.includes(a[0]));
 return a?'https://www.gstatic.com/flights/airline_logos/70px/'+a[1]+'.png':'';
}
function signature(trip){
 return JSON.stringify((trip?.segments||[]).map(s=>[s.airline,s.flightNumber,s.from?.code,s.to?.code,s.from?.time,s.to?.time]));
}
function outPair(offers){
 const grouped=new Map();
 offers.forEach(o=>{
  if(!o.outbound?.segments?.length||!o.inbound?.segments?.length)return;
  const key=signature(o.outbound);
  if(!grouped.has(key))grouped.set(key,[]);
  grouped.get(key).push(o);
 });
 return grouped;
}
const airports=[
 ['LIM','Lima'],['CUZ','Cusco'],['AQP','Arequipa'],['JUL','Juliaca / Puno'],['PIU','Piura'],
 ['BOG','Bogotá'],['MDE','Medellín'],['CTG','Cartagena'],['CLO','Cali'],['SMR','Santa Marta'],['ADZ','San Andrés'],['PEI','Pereira'],
 ['EZE','Buenos Aires (EZE)'],['AEP','Buenos Aires (AEP)'],['COR','Córdoba'],['MDZ','Mendoza'],
 ['GRU','São Paulo'],['GIG','Río de Janeiro'],['SCL','Santiago'],['UIO','Quito'],['GYE','Guayaquil'],
 ['LPB','La Paz'],['VVI','Santa Cruz'],['MEX','México'],['CUN','Cancún'],['PTY','Panamá'],
 ['MIA','Miami'],['CCS','Caracas'],['MVD','Montevideo'],['MAD','Madrid']
];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function airport(city){
 const s=norm(city);
 const map=[['cusco','CUZ'],['machu picchu','CUZ'],['puno','JUL'],['arequipa','AQP'],['lima','LIM'],
 ['paracas','LIM'],['huacachina','LIM'],['bogota','BOG'],['zipaquira','BOG'],['medellin','MDE'],
 ['antioquia','MDE'],['cartagena','CTG'],['santa marta','SMR'],['tayrona','SMR'],['san andres','ADZ'],
 ['cali','CLO'],['eje cafetero','PEI'],['buenos aires','EZE'],['patagonia','EZE'],
 ['rio','GIG'],['santiago','SCL'],['atacama','SCL'],['quito','UIO'],['galapagos','UIO'],
 ['la paz','LPB'],['uyuni','LPB'],['riviera maya','CUN']];
 return map.find(a=>s.includes(a[0]))?.[1]||'LIM';
}
function originCountry(){
 let s='';try{s=localStorage.getItem('latam_country')||localStorage.getItem('latam_auto_country')||''}catch(_){}
 return {'Perú':'LIM','Colombia':'BOG','Argentina':'EZE','Brasil':'GRU','Chile':'SCL','Ecuador':'UIO','México':'MEX','Bolivia':'LPB'}[s]||'LIM';
}
window.LXPackageSources={get,valid,endpoint,logo,signature,outPair,airports,airport,originCountry};
})();