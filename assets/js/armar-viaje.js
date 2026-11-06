/* LATAM EXPEDITIONS · Paquetes personalizables MVP
 * Cotizaciones informativas; no PNR, inventario reservado ni pago.
 * Vuelos: parejas completas de Google Flights via SerpApi / Apps Script.
 * Hoteles: tarifas propias por categoría + comparación opcional Google Hotels.
 */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(n);
 const txt=(tag,value,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=value==null?'':String(value);return e};
 const div=cls=>txt('div','',cls);
 const clear=e=>e.replaceChildren();
 const dateOK=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&!Number.isNaN(Date.parse(s+'T12:00:00'));
 const days=(date,n)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
 const lead=s=>Math.floor((new Date(s+'T12:00:00')-new Date(new Date().toDateString()+' 12:00:00'))/86400000);
 const validSrc=s=>/^https:\/\/[^<>\"'\s]+$/.test(s||'');
 const displayDate=s=>dateOK(s)?new Date(s+'T12:00:00').toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'}):'Elegir fecha';
 const app=new URLSearchParams(location.search);
 const endpoint=String(window.LATAM_FLIGHTS_API_URL||'');
 const endpointOK=/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(endpoint);
 const state={step:0,package:null,origin:'LIM',arrival:'',flightOut:'',flightBack:'',adults:2,children:0,
  withFlights:true,flightOffers:[],outboundKey:'',selectedFlight:null,flightSearched:false,
  hotelTier:'standard',customHotel:'',hotelResults:[],activities:[],loading:false};
 let loaded=false;
 let flightSearchKey='';
 function optionValue(id){return $(id)?.value||''}
 function updateMeta(){
  $('lxCheckout').value=dateOK(state.arrival)?days(state.arrival,state.package.nights):'';
  clear($('lxSummaryDetails'));
  [state.origin+' → '+state.package.destinationAirport,
   state.arrival?'Llegada: '+displayDate(state.arrival):'Fecha sin seleccionar',
   state.arrival?'Salida hotel: '+displayDate(days(state.arrival,state.package.nights)):'',
   state.adults+' adulto(s) · '+state.children+' niño(s)'].filter(Boolean)
    .forEach(t=>$('lxSummaryDetails').append(txt('span',t)));
 }
 function roomIndex(){
  const count=state.adults+state.children;
  return Math.max(0,Math.min(3,count-1));
 }
 function category(){
  return state.package.hotelTiers.find(h=>h.id===state.hotelTier)||state.package.hotelTiers[0];
 }
 function packageCost(){
  const rate=category().rates[roomIndex()];
  return Math.round((rate*state.adults+rate*.7*state.children)*100)/100;
 }
 function flightAdjust(daysUntil){
  if(daysUntil<=30)return .10;
  if(daysUntil<=45)return .05;
  if(daysUntil<=90)return 0;
  if(daysUntil<=180)return -.05;
  if(daysUntil<=270)return -.10;
  return -.15;
 }
 function flightCost(){
  if(!state.withFlights||!state.selectedFlight)return 0;
  const price=Number(state.selectedFlight.price);
  return Number.isFinite(price)&&price>0?Math.round(price*(1+flightAdjust(lead(state.flightOut)))*100)/100:0;
 }
 function activitiesCost(){
  return state.package.activities.filter(a=>state.activities.includes(a.id))
   .reduce((sum,a)=>sum+a.pricePerPerson*state.adults,0);
 }
 function grandTotal(){return Math.round((packageCost()+flightCost()+activitiesCost())*100)/100}
 function needsQuote(){return !!state.customHotel||
  (state.activities.length>0&&state.children>0)||
  (state.withFlights&&state.selectedFlight&&state.flightBack>days(state.arrival,state.package.nights));}
 function note(parent,title,value){
  const line=div('lx-summary-line');
  line.append(txt('span',title),txt('strong',value));
  parent.append(line);
 }
 function syncSummary(){
  if(!loaded)return;
  updateMeta();
  const lines=$('lxSummaryLines');clear(lines);
  note(lines,category().name,money(packageCost()));
  if(state.withFlights&&state.selectedFlight)note(lines,'Vuelos (ida y regreso)',money(flightCost()));
  else note(lines,'Vuelos',state.withFlights?'Sin seleccionar':'No incluidos');
  if(state.activities.length)note(lines,'Experiencias adicionales',money(activitiesCost()));
  if(state.customHotel)note(lines,'Otro hotel a cotizar',state.customHotel+' · Pendiente');
  $('lxTotal').textContent=money(grandTotal())+(needsQuote()?' + pendiente':'');
  $('lxPerPerson').textContent='Referencia: '+money(grandTotal()/(state.adults+state.children))+' por viajero';
 }
 function clearFlight(){
  state.flightOffers=[];state.outboundKey='';state.selectedFlight=null;state.flightSearched=false;
  flightSearchKey='';clear($('lxOutOptions'));clear($('lxReturnOptions'));
  $('lxFlightStatus').textContent='';syncSummary();
 }
 function syncFromFields(){
  state.origin=optionValue('lxOrigin');
  state.arrival=optionValue('lxArrival');
  state.adults=Number(optionValue('lxAdults'));
  state.children=Number(optionValue('lxChildren'));
  state.withFlights=$('lxFlightsEnabled').checked;
  syncSummary();
 }
 function validations(){
  if(!dateOK(state.arrival)||lead(state.arrival)<2)return 'Selecciona una llegada válida con al menos dos días de anticipación.';
  if(state.adults+state.children>4)return 'El paquete piloto admite máximo cuatro viajeros por habitación.';
  if(!state.origin||state.origin===state.package.destinationAirport)return 'Selecciona una ciudad de salida válida.';
  if(state.flightOut&&state.flightBack&&state.flightBack<state.flightOut)return 'La fecha de regreso debe ser posterior a la salida.';
  return '';
 }
 function showStep(next){
  if(next<0||next>4)return;
  if(next>state.step){
   syncFromFields();const err=validations();
   if(err){window.alert(err);$('lxArrival').focus();return}
  }
  state.step=next;
  document.querySelectorAll('.lx-screen').forEach((p,i)=>p.hidden=i!==next);
  document.querySelectorAll('[data-step-indicator]').forEach((el,i)=>{
   el.classList.toggle('is-active',i===next);el.classList.toggle('is-done',i<next);
  });
  $('lxPrev').hidden=next===0;$('lxNext').hidden=next===4;
  if(next===1)renderFlights();
  if(next===2)renderHotels();
  if(next===3)renderActivities();
  if(next===4)renderReview();
  syncSummary();
  document.querySelector('.lx-intro').scrollIntoView({block:'start',behavior:'smooth'});
 }
 function setStatus(id,message,error=false){
  const el=$(id);el.textContent=message;el.classList.toggle('is-error',error);
 }
 function searchApi(params){
  if(!endpointOK)return Promise.reject(Error('El servidor de consultas necesita una actualización de Apps Script.'));
  return new Promise((resolve,reject)=>{
   const cb='latamFlightCb_'+Date.now()+Math.floor(Math.random()*100000);
   const url=new URL(endpoint);
   Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,String(v)));
   url.searchParams.set('callback',cb);
   const script=document.createElement('script');let done=false;
   const timer=setTimeout(()=>finish(Error('Tiempo de respuesta agotado.')),65000);
   function finish(error,data){
    if(done)return;done=true;clearTimeout(timer);
    delete window[cb];script.remove();
    if(error)reject(error);else resolve(data);
   }
   window[cb]=value=>finish(null,value);
   script.onerror=()=>finish(Error('No se pudo conectar con la API.'));
   script.src=url.toString();document.head.append(script);
  });
 }
 function airlineImage(seg){
  const url=String(seg?.airlineLogo||'');
  if(/^https:\/\/www\.gstatic\.com\/flights\/airline_logos\/70px\/[A-Za-z0-9_-]+\.png$/.test(url))return url;
  const air=String(seg?.airline||'').toLowerCase();
  const map=[['latam','LA'],['avianca','AV'],['jetsmart','JA'],['sky','H2'],['copa','CM'],['american','AA'],['united','UA']];
  const code=map.find(x=>air.includes(x[0]))?.[1];
  return code?'https://www.gstatic.com/flights/airline_logos/70px/'+code+'.png':'';
 }
 function first(trip){return trip?.segments?.[0]||{}}
 function last(trip){return trip?.segments?.at(-1)||{}}
 function signature(trip){return JSON.stringify((trip?.segments||[]).map(s=>[s.airline,s.flightNumber,s.from?.code,s.from?.time,s.to?.code,s.to?.time]))}
 function stopText(trip){const n=Math.max(0,(trip?.segments||[]).length-1);return n===0?'Directo':n===1?'1 escala':n+' escalas'}
 function duration(value){if(!Number.isFinite(value))return 'Horario por verificar';return Math.floor(value/60)+' h '+(value%60)+' min'}
 function time(s){const m=String(s||'').match(/(\d\d:\d\d)(?!.*\d\d:\d\d)/);return m?m[1]:'—'}
 function legCard(trip,caption,price,selected,onClick,extra=''){
  const card=txt('button','','lx-option'+(selected?' is-selected':''));card.type='button';
  const seg=first(trip),end=last(trip),top=div('lx-option-head'),title=div('lx-airline-name');
  const logo=airlineImage(seg);if(logo){const image=document.createElement('img');image.src=logo;image.alt='';image.loading='lazy';title.append(image)}
  title.append(txt('strong',seg.airline||'Aerolínea'));top.append(title,txt('small',caption));
  const route=div('lx-route-line');
  function airport(a){const box=div();box.append(txt('strong',time(a?.time)),txt('small',a?.code||'—'));return box}
  const mid=div('lx-route-mid');mid.append(txt('span',duration(trip?.duration)+' · '+stopText(trip)));
  route.append(airport(seg.from),mid,airport(end.to));
  const foot=div('lx-option-foot'),facts=div('lx-route-summary');
  facts.append(txt('span',stopText(trip)));if(extra)facts.append(txt('span',extra));
  const value=div('lx-option-price');value.append(txt('strong',money(price)));
  value.append(txt('small','Precio combinado para los viajeros'));
  foot.append(facts,value);
  card.append(top,route,foot);
  // A concise stop timeline is shown on selection and can be toggled without price changes.
  if(trip?.layovers?.length){
   const info=txt('span',trip.layovers.map(l=>(l.name||l.airport||'Conexión')+
     (Number.isFinite(l.duration)?' · '+duration(l.duration):'')).join(' | '),'lx-muted');
   card.append(info);
  }
  card.addEventListener('click',onClick);
  return card;
 }
 function renderFlights(){
  const on=$('lxFlightsEnabled').checked;
  $('lxFlightPicker').hidden=!on;
  const flightStatus=$('lxFlightStatus');
  if(!on){clear($('lxOutOptions'));clear($('lxReturnOptions'));flightStatus.textContent='Continuarás sin vuelos.';return}
  if(state.flightOffers.length){
   const groups=new Map();
   state.flightOffers.forEach(o=>{
    if(!o.outbound?.segments?.length||!o.inbound?.segments?.length)return;
    const key=signature(o.outbound);
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(o);
   });
   const outs=$('lxOutOptions');clear(outs);
   outs.append(txt('h3','Selecciona tu vuelo de ida','lx-section-caption'));
   [...groups].forEach(([key,offers])=>{
    const o=offers.reduce((a,b)=>Number(a.price)<Number(b.price)?a:b);
    const price=Math.round(o.price*(1+flightAdjust(lead(state.flightOut)))*100)/100;
    outs.append(legCard(o.outbound,'Ida · '+displayDate(state.flightOut),
      price,state.outboundKey===key,()=>{
      state.outboundKey=key;
      if(signature(state.selectedFlight?.outbound)!==key)state.selectedFlight=null;
      renderFlights();syncSummary();
    },offers.length+' alternativa(s) de regreso'));
   });
   const backs=$('lxReturnOptions');clear(backs);
   if(state.outboundKey){
    backs.append(txt('h3','Selecciona tu vuelo de regreso','lx-section-caption'));
    (groups.get(state.outboundKey)||[]).forEach(o=>{
     const adjusted=Math.round(o.price*(1+flightAdjust(lead(state.flightOut)))*100)/100;
     backs.append(legCard(o.inbound,'Regreso · '+displayDate(state.flightBack),
      adjusted,state.selectedFlight===o,()=>{state.selectedFlight=o;renderFlights();syncSummary()},
      'Ida + vuelta para todo el grupo'));
    });
   } else backs.append(txt('p','Selecciona primero un vuelo de ida. El precio mostrado incluye una combinación de ida y vuelta, no una tarifa aislada.','lx-note'));
  }else{
   clear($('lxOutOptions'));clear($('lxReturnOptions'));
  }
 }
 async function lookupFlights(){
  syncFromFields();
  if(!state.withFlights)return;
  if(!dateOK(state.flightOut)||!dateOK(state.flightBack)||state.flightBack<state.flightOut||lead(state.flightOut)<2){
   setStatus('lxFlightStatus','Revisa fechas de ida y regreso (mínimo dos días de anticipación).',true);return;
  }
  const q=JSON.stringify([state.origin,state.package.destinationAirport,state.flightOut,state.flightBack,state.adults,state.children]);
  if(q===flightSearchKey&&state.flightOffers.length){renderFlights();return}
  clearFlight();state.loading=true;$('lxSearchFlights').disabled=true;
  setStatus('lxFlightStatus','Consultando opciones de vuelos de ida y vuelta…');
  try{
   const result=await searchApi({origin:state.origin,destination:state.package.destinationAirport,
    departure:state.flightOut,returnDate:state.flightBack,trip:'roundtrip',adults:state.adults,
    children:state.children,cabin:'economy'});
   if(!result?.ok)throw Error(result?.message||'No se encontraron tarifas para estas fechas.');
   state.flightOffers=(Array.isArray(result.offers)?result.offers:[]).filter(o=>
    Number(o.price)>0&&o.departure===state.flightOut&&o.returnDate===state.flightBack&&o.outbound&&o.inbound&&
    Number(o.partyAdults)===state.adults&&Number(o.partyChildren)===state.children&&
    (!dateOK(String(last(o.outbound)?.to?.time||'').slice(0,10))||
      String(last(o.outbound).to.time).slice(0,10)===state.arrival)).slice(0,30);
   flightSearchKey=q;state.flightSearched=true;
   setStatus('lxFlightStatus',state.flightOffers.length?
    'Encontramos '+state.flightOffers.length+' combinaciones consultadas. Elige ida y regreso.':
    'No se encontraron combinaciones válidas. Puedes probar otras fechas o continuar sin vuelos.',
    !state.flightOffers.length);
   renderFlights();
  }catch(err){setStatus('lxFlightStatus',err.message||'No se pudo consultar vuelos. Puedes continuar sin vuelos.',true)}
  finally{state.loading=false;$('lxSearchFlights').disabled=false}
 }
 function hotelPhoto(h){
  const name=String(h.property||h.name||'').toLowerCase();
  const match=state.hotelResults.find(m=>name.includes(m.name.toLowerCase())||m.name.toLowerCase().includes(name));
  return match?.thumbnail||'';
 }
 function renderHotels(){
  const host=$('lxHotelOptions');clear(host);
  state.package.hotelTiers.forEach(tier=>{
   const card=txt('button','','lx-option'+(state.hotelTier===tier.id&&!state.customHotel?' is-selected':''));card.type='button';
   const flex=div('lx-option-hotel'),image=div();
   const photo=hotelPhoto(tier);if(photo){const img=document.createElement('img');img.src=photo;img.loading='lazy';img.alt='Fotografía referencial del hotel consultado';image.append(img)}
   else image.append(txt('div','Foto disponible al consultar hoteles','lx-none'));
   const content=div(),head=div('lx-option-head');
   head.append(txt('strong',tier.name),txt('span',tier.id===state.hotelTier&&!state.customHotel?'Seleccionado':'Elegir','lx-pill'));
   content.append(head,txt('div',tier.property+' o similar','lx-hotel-option-title'),txt('div',tier.description,'lx-hotel-subtitle'));
   const rate=tier.rates[roomIndex()];content.append(txt('div','Referencia por adulto: '+money(rate),'lx-muted'));
   const price=div('lx-option-price');price.append(txt('strong',money(Math.round((rate*state.adults+rate*.7*state.children)*100)/100)));
   price.append(txt('small','Total del paquete con esta categoría, sin vuelos'));
   content.append(price);flex.append(image,content);card.append(flex);
   card.addEventListener('click',()=>{state.hotelTier=tier.id;state.customHotel='';renderHotels();syncSummary()});
   host.append(card);
  });
  const extras=$('lxMarketHotels');
  extras.querySelectorAll('[data-custom-hotel]').forEach(e=>e.classList.toggle('is-selected',e.dataset.customHotel===state.customHotel));
 }
 async function lookupHotels(){
  syncFromFields();
  if(!dateOK(state.arrival)){setStatus('lxHotelStatus','Elige primero una fecha de llegada.',true);return}
  const btn=$('lxExploreHotels');btn.disabled=true;
  setStatus('lxHotelStatus','Consultando hoteles de Medellín y sus fotografías…');
  try{
   const result=await searchApi({mode:'hotels',destination:'Medellín, Colombia',
     check_in_date:state.arrival,check_out_date:days(state.arrival,state.package.nights),
     adults:state.adults,children:state.children});
   if(!result?.ok)throw Error(result?.message||'No pudimos consultar hoteles.');
   state.hotelResults=(Array.isArray(result.hotels)?result.hotels:[]).slice(0,12);
   const wrap=$('lxMarketHotels');clear(wrap);
   if(!state.hotelResults.length){setStatus('lxHotelStatus','No encontramos tarifas de otros hoteles para estas fechas.');return}
   setStatus('lxHotelStatus','Opciones para comparar. El precio de sustitución se confirma con nuestro equipo.');
   state.hotelResults.forEach(h=>{
    const card=txt('button','','lx-option'+(state.customHotel===h.name?' is-selected':''));card.type='button';
    card.dataset.customHotel=h.name;
    const flex=div('lx-market-hotel'),picture=div();
    if(validSrc(h.thumbnail)){const image=document.createElement('img');image.src=h.thumbnail;image.alt='Fotografía de '+h.name;image.loading='lazy';image.referrerPolicy='no-referrer';picture.append(image)}
    else picture.append(txt('span','Sin fotografía','lx-muted'));
    const copy=div();copy.append(txt('strong',h.name),txt('p',h.rating?'Calificación '+h.rating:'Calificación no informada','lx-muted'));
    const lower=h.totalRate?'Referencia total de hotel'+(state.children?' (adultos, niños por cotizar)':'')+': '+money(h.totalRate):
      h.nightlyRate?'Desde '+money(h.nightlyRate)+' / noche (referencia)':'Tarifa a consultar';
    copy.append(txt('p',lower,'lx-muted'),txt('span','Sustitución del hotel incluida en cotización personalizada','lx-pill'));
    flex.append(picture,copy);card.append(flex);
    card.addEventListener('click',()=>{state.customHotel=h.name;renderHotels();syncSummary();});
    wrap.append(card);
   });
   renderHotels();
  }catch(err){setStatus('lxHotelStatus',err.message||'No disponible. Puedes mantener el hotel incluido.',true)}
  finally{btn.disabled=false}
 }
 function renderActivities(){
  const host=$('lxActivities');clear(host);
  state.package.activities.forEach(a=>{
   const row=div('lx-activity-card'),image=document.createElement('img');
   image.src=a.image;image.alt=a.name;image.loading='lazy';
   const copy=div();copy.append(txt('h3',a.name),txt('p',a.description),
    txt('small',money(a.pricePerPerson)+' por adulto · Menores a consultar'));
   const label=document.createElement('label');
   const cb=document.createElement('input');cb.type='checkbox';cb.className='lx-activity-check';
   cb.checked=state.activities.includes(a.id);
   cb.addEventListener('change',()=>{
    if(cb.checked){if(!state.activities.includes(a.id))state.activities.push(a.id)}
    else state.activities=state.activities.filter(v=>v!==a.id);
    syncSummary();
   });
   label.append(cb,txt('span','Agregar'));row.append(image,copy,label);host.append(row);
  });
 }
 function reviewLine(host,name,value,detail=''){
  const line=div('lx-review-row'),left=div();
  left.append(txt('strong',name));
  if(detail)left.append(txt('em',detail));
  line.append(left,txt('strong',value));host.append(line);
 }
 function renderReview(){
  const host=$('lxReview');clear(host);
  reviewLine(host,state.package.name,money(packageCost()),'Alojamiento: '+category().name+' · '+category().property+' o similar');
  reviewLine(host,'Fechas',displayDate(state.arrival)+' – '+displayDate(days(state.arrival,state.package.nights)),
   state.adults+' adultos · '+state.children+' niños');
  if(state.withFlights&&state.selectedFlight){
   reviewLine(host,'Vuelos ida y vuelta',money(flightCost()),state.origin+' → '+state.package.destinationAirport+
     ' · '+displayDate(state.flightOut)+' / '+displayDate(state.flightBack));
  }else reviewLine(host,'Vuelos','No incluidos','Puedes contratarlos posteriormente');
  if(state.customHotel)reviewLine(host,'Otro hotel a cotizar','Pendiente',state.customHotel);
  state.package.activities.filter(a=>state.activities.includes(a.id)).forEach(a=>
   reviewLine(host,a.name,money(a.pricePerPerson*state.adults),'Para '+state.adults+' adultos'+(state.children?' · Menores pendientes':''))
  );
  reviewLine(host,'SUBTOTAL ORIENTATIVO',money(grandTotal())+(needsQuote()?' + pendientes':''),'No incluye componentes aún sin validar');
  $('lxReviewWarnings').textContent='Antes de cobrar, confirmaremos vuelos, horarios, habitación y actividades. El resumen es una solicitud, no un boleto ni una reserva definitiva.'+
    (state.withFlights&&state.selectedFlight&&state.flightBack>days(state.arrival,state.package.nights)?
      ' Atención: el vuelo de regreso es posterior a la salida del hotel. Una noche adicional podría ser necesaria y no está incluida.':'');
  $('lxContinueRequest').disabled=!$('lxAccept').checked;
 }
 function requestPayload(){
  const tier=category();
  const selected=state.withFlights?state.selectedFlight:null;
  const act=state.package.activities.filter(a=>state.activities.includes(a.id));
  return {
   version:1,packageId:state.package.id,origin:state.origin,destination:state.package.destinationAirport,
   arrival:state.arrival,checkout:days(state.arrival,state.package.nights),
   flightOut:state.withFlights&&selected?state.flightOut:'',flightBack:state.withFlights&&selected?state.flightBack:'',
   adults:state.adults,children:state.children,hotelTier:tier.id,customHotel:state.customHotel,
   activities:act.map(a=>a.id),
   flight:selected?{
    price:Number(selected.price),currency:'USD',airline:String(selected.airline||'').slice(0,80),
    outbound:(selected.outbound.segments||[]).slice(0,6).map(s=>({airline:s.airline,flightNumber:s.flightNumber,from:s.from,to:s.to})),
    inbound:(selected.inbound.segments||[]).slice(0,6).map(s=>({airline:s.airline,flightNumber:s.flightNumber,from:s.from,to:s.to}))
   }:null
  };
 }
 function launchRequest(){
  if(!endpointOK){setStatus('lxRequestStatus','Necesitamos configurar el formulario de solicitud en Google Apps Script. También puedes consultar por WhatsApp.',true);
   $('lxRequestHolder').hidden=false;return}
  const data=JSON.stringify(requestPayload());
  const url=new URL(endpoint);url.searchParams.set('mode','bundle');url.searchParams.set('payload',data);
  $('lxRequestHolder').hidden=false;
  $('lxRequestFrame').src=url.toString();
  setStatus('lxRequestStatus','Completa el formulario privado de pasajeros. Recibirás un código de solicitud para seguimiento.');
  $('lxRequestHolder').scrollIntoView({behavior:'smooth',block:'start'});
 }
 function applySearch(){
  if(app.get('package')&&!['medellin-esencial'].includes(app.get('package'))){
   setStatus('lxFlightStatus','Este paquete todavía no está disponible en el configurador piloto.');
  }
  const savedCountry=(()=>{try{return localStorage.getItem('latam_country')||''}catch(_){return ''}})();
  const suggested={'Perú':'LIM','Colombia':'BOG','Argentina':'EZE','Chile':'SCL','México':'MEX','Brasil':'GRU','Ecuador':'UIO'};
  const origin=String(app.get('origin')||app.get('origen')||suggested[savedCountry]||'LIM').toUpperCase();
  if([...$('lxOrigin').options].some(o=>o.value===origin))$('lxOrigin').value=origin;
  const now=new Date(),min=days(now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'),2);
  $('lxArrival').min=min;
  const arrival=app.get('arrival')||app.get('fecha')||'';
  if(dateOK(arrival)&&arrival>=min)$('lxArrival').value=arrival;
  const adult=Number(app.get('adults')||0),child=Number(app.get('children')||0);
  if(adult>=1&&adult<=4)$('lxAdults').value=String(adult);
  if(child>=0&&child<=2)$('lxChildren').value=String(child);
  onDatesChange();syncFromFields();
 }
 function onDatesChange(){
  const value=$('lxArrival').value;
  $('lxCheckout').value=dateOK(value)?days(value,3):'';
  if(dateOK(value)){
   $('lxFlightOutDate').value=value;
   $('lxFlightBackDate').value=days(value,3);
   $('lxFlightOutDate').min=days(value,-1);
   $('lxFlightBackDate').min=value;
  }else{
   $('lxFlightOutDate').value='';$('lxFlightBackDate').value='';
  }
  state.flightOut=$('lxFlightOutDate').value;
  state.flightBack=$('lxFlightBackDate').value;
  clearFlight();
 }
 async function init(){
  try{
   const res=await fetch('assets/data/paquetes-configurables.json',{cache:'no-store'});
   if(!res.ok)throw Error('Catálogo no disponible');
   const json=await res.json();
   state.package=json.packages.find(p=>p.id==='medellin-esencial');
   if(!state.package)throw Error('Paquete no disponible');
  }catch(err){
   document.querySelector('.lx-intro p').textContent='No pudimos cargar el configurador. Actualiza la página o contacta con nuestro equipo.';
   $('lxNext').disabled=true;return;
  }
  loaded=true;
  state.package.included.forEach(item=>{const element=txt('span');element.append(txt('i','','fa-solid fa-check'),txt('span',item));$('lxIncluded').append(element)});
  applySearch();
  $('lxArrival').addEventListener('change',()=>{onDatesChange();syncFromFields()});
  ['lxOrigin','lxAdults','lxChildren'].forEach(id=>$(id).addEventListener('change',()=>{clearFlight();syncFromFields()}));
  $('lxFlightOutDate').addEventListener('change',()=>{state.flightOut=optionValue('lxFlightOutDate');clearFlight()});
  $('lxFlightBackDate').addEventListener('change',()=>{state.flightBack=optionValue('lxFlightBackDate');clearFlight()});
  $('lxFlightsEnabled').addEventListener('change',()=>{state.withFlights=$('lxFlightsEnabled').checked;if(!state.withFlights)state.selectedFlight=null;renderFlights();syncSummary()});
  $('lxSearchFlights').addEventListener('click',lookupFlights);
  $('lxExploreHotels').addEventListener('click',lookupHotels);
  $('lxPrev').addEventListener('click',()=>showStep(state.step-1));
  $('lxNext').addEventListener('click',()=>{
   if(state.step===1&&state.withFlights&&!state.selectedFlight){
    if(!window.confirm('Aún no seleccionaste vuelos. ¿Quieres continuar sin incluirlos en el precio?'))return;
    state.withFlights=false;$('lxFlightsEnabled').checked=false;
   }
   showStep(state.step+1);
  });
  $('lxAccept').addEventListener('change',()=>{$('lxContinueRequest').disabled=!$('lxAccept').checked});
  $('lxContinueRequest').addEventListener('click',launchRequest);
  showStep(0);
 }
 document.addEventListener('DOMContentLoaded',init);
})();