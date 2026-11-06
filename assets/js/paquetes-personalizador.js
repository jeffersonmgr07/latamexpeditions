/* LATAM Expeditions | personalizador UNIVERSAL de paquetes (37 fichas).
 * Reutiliza la cabecera, el footer, el catálogo y la API actual de vuelos.
 */
(()=>{
'use strict';
const slug=decodeURIComponent(location.pathname.split('/').pop()||'').replace(/\.html$/i,'');
const src=window.LXPackageSources;if(!src)return;
const $=id=>document.getElementById(id);
const mk=(tag,content='',className='')=>{const e=document.createElement(tag);if(className)e.className=className;e.textContent=String(content);return e};
const round=n=>Math.round(Number(n)*100)/100;
const usd=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const today=iso(new Date());
const addDays=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return iso(d)};
const minArrival=addDays(today,2);
const dateOK=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&!Number.isNaN(Date.parse(s+'T12:00:00'));
const fmt=s=>dateOK(s)?new Date(s+'T12:00:00').toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'}):'Fecha por elegir';
const lead=s=>Math.round((Date.parse(s+'T12:00:00')-Date.parse(today+'T12:00:00'))/86400000);
const margin=n=>n<=30?.10:n<=45?.05:n<=90?0:n<=180?-.05:n<=270?-.10:-.15;
const time=s=>(String(s||'').match(/(\d\d:\d\d)(?!.*\d\d:\d\d)/)||[])[1]||'—';
const length=m=>Number.isFinite(m)?Math.floor(m/60)+'h '+(m%60)+'m':'—';
let pack,catalog,modal,extras=[],oldFocus;
const q=new URLSearchParams(location.search);
const state={step:0,origin:src.originCountry(),arrival:'',checkout:'',adults:2,children:0,
 tier:0,otherHotel:null,extraIds:[],withFlights:false,dest:'',backOrigin:'',outDate:'',backDate:'',
 bag:'default',flightOffers:[],outKey:'',selectedPair:null,selectedOut:null,selectedReturn:null,flightMode:'roundtrip'};
const nights=()=>Number((String(pack?.nights||'').match(/(\d+)N/i)||[])[1]||3);
const baseTier=()=>pack.hotelTiers[0];
function tierRate(t){
 const occ=state.adults+state.children;
 const field=occ===1?'single':occ===2?'double':occ===3?'triple':'family';
 const price=Number(t.occupancyPrices?.[field]||t.pricePerPerson||pack.priceFrom);
 return price>0?price:Number(pack.priceFrom);
}
function adultPackagePrice(){return round(tierRate(pack.hotelTiers[state.tier])*state.adults)}
function extrasPrice(){return round(extras.filter(x=>state.extraIds.includes(x.slug)).reduce((sum,x)=>sum+Number(x.priceFrom||0)*state.adults,0))}
function rawFlight(){
 if(!state.withFlights)return 0;
 if(state.flightMode==='roundtrip')return Number(state.selectedPair?.price||0);
 if(!state.selectedOut||!state.selectedReturn)return 0;
 return Number(state.selectedOut.price)+Number(state.selectedReturn.price);
}
const flightCost=()=>rawFlight()>0?round(rawFlight()*(1+margin(lead(state.outDate)))):0;
const isFlightSelected=()=>state.withFlights&&rawFlight()>0;
const hotelCost=()=>state.otherHotel&&Number.isFinite(state.otherHotel.delta)?state.otherHotel.delta:0;
const total=()=>Math.max(0,round(adultPackagePrice()+extrasPrice()+hotelCost()+flightCost()));
const pending=()=>!!state.children||!!(state.otherHotel&&!Number.isFinite(state.otherHotel.delta))||
 !!(state.otherHotel?.estimate)||state.bag!=='default'&&isFlightSelected();
function line(host,label,price){
 const row=mk('div','','lx-pkg-line');row.append(mk('span',label),mk('strong',price));host.append(row);
}
function clearFlights(){
 state.flightOffers=[];state.outKey='';state.selectedPair=null;state.selectedOut=null;state.selectedReturn=null;
 $('lxPkgFlightOptions')?.replaceChildren();$('lxPkgFlightReturns')?.replaceChildren();
}
function setDate(d){
 state.arrival=d;state.checkout=dateOK(d)?addDays(d,nights()):'';
 state.outDate=d;state.backDate=state.checkout;clearFlights();
}
function progress(id,text,error=false){
 const e=$(id);if(!e)return;e.textContent=text;e.classList.toggle('is-error',error);
}
function summarize(){
 if(!modal)return;
 $('lxPkgSummaryDetails').textContent=pack.nights+' · '+fmt(state.arrival)+' · '+state.adults+' adultos, '+state.children+' niños';
 const host=$('lxPkgSummaryLines');host.replaceChildren();
 line(host,'Paquete + '+pack.hotelTiers[state.tier].name,usd(adultPackagePrice()));
 if(state.otherHotel)line(host,'Cambio de hotel',Number.isFinite(state.otherHotel.delta)?
   (state.otherHotel.delta>=0?'+':'−')+usd(Math.abs(state.otherHotel.delta)):'Pendiente');
 if(state.extraIds.length)line(host,'Actividades adicionales',usd(extrasPrice()));
 line(host,'Vuelos',isFlightSelected()?usd(flightCost()):'No incluidos');
 if(state.bag!=='default'&&isFlightSelected())line(host,'Equipaje','Por cotizar');
 $('lxPkgTotal').textContent=usd(total())+(pending()?' + pendientes':'');
 $('lxPkgPer').textContent=state.children?'Menores de edad: tarifa por confirmar antes del cobro':
  'Precio preliminar, sujeto a disponibilidad y condiciones.';
}
function render(){
 document.querySelectorAll('.lx-pkg-section').forEach((x,i)=>x.hidden=i!==state.step);
 document.querySelectorAll('.lx-pkg-steps>span').forEach((x,i)=>x.classList.toggle('is-active',i===state.step));
 $('lxPkgPrev').hidden=state.step===0;$('lxPkgNext').hidden=state.step===4;
 $('lxPkgCurrent').textContent='Paso '+(state.step+1)+' de 5';
 if(state.step===0)renderBasic();
 if(state.step===1)renderHotel();
 if(state.step===2)renderExtras();
 if(state.step===3)renderFlight();
 if(state.step===4)renderReview();
 summarize();modal.scrollTo(0,0);
}
function step(next){
 if(next>state.step&&state.step===0){
  if(!dateOK(state.arrival)||state.arrival<minArrival){progress('lxPkgBasicStatus','Selecciona una fecha de viaje con al menos dos días de anticipación.',true);return}
  if(state.adults+state.children>9){progress('lxPkgBasicStatus','Máximo 9 viajeros por solicitud.',true);return}
 }
 if(next>state.step&&state.step===3&&state.withFlights&&!isFlightSelected()){
  if(!confirm('No elegiste una combinación de vuelos. ¿Continuar sin incluir vuelos en el subtotal?'))return;
  state.withFlights=false;clearFlights();
 }
 state.step=Math.max(0,Math.min(4,next));render();
}
function makeOptions(select,options,selected){
 select.replaceChildren();
 options.forEach(([v,txt])=>{const o=mk('option',txt);o.value=String(v);select.append(o)});
 if(selected&&[...select.options].some(o=>o.value===String(selected)))select.value=String(selected);
}
function renderBasic(){
 $('lxPkgOrigin').value=state.origin;$('lxPkgArrival').value=state.arrival;
 $('lxPkgCheckout').value=state.checkout;
 $('lxPkgAdults').value=String(state.adults);$('lxPkgChildren').value=String(state.children);
 const el=$('lxPkgIncludes');el.replaceChildren(mk('strong','Tu paquete incluye:'));
 (pack.includes||[]).slice(0,11).forEach(t=>el.append(mk('p','✓ '+t)));
}
function hotelCity(){return String(pack.region||pack.country).split(/\s+\/\s+|\s+y\s+|,/)[0].trim()||pack.country}
function isMultiHotel(){
 const reg=norm(pack.region);
 if(/medellin y antioquia|cali y valle del cauca|bogota y boyaca/.test(reg))return false;
 return /\s\/\s|\sy\s/.test(reg);
}
function renderHotel(){
 const host=$('lxPkgHotelTiers');host.replaceChildren();
 pack.hotelTiers.forEach((tier,i)=>{
  const card=mk('button','','lx-pkg-opt'+(state.tier===i&&!state.otherHotel?' is-selected':''));
  card.type='button';
  const head=mk('div','','lx-pkg-opt__header');
  head.append(mk('strong',(tier.stars||'')+' '+tier.name),mk('span',usd(tierRate(tier))+' / adulto'));
  card.append(head,mk('small',(tier.hotels||[]).join(' · ')||'Hotel previsto o similar'));
  card.append(mk('div',i===0?'Hotel de categoría base incluido':
   'Diferencia respecto a la categoría base: '+usd((tierRate(tier)-tierRate(baseTier()))*state.adults),'lx-pkg-opt__body'));
  card.addEventListener('click',()=>{state.tier=i;state.otherHotel=null;
   $('lxPkgHotelAlternatives').replaceChildren();renderHotel();summarize()});
  host.append(card);
 });
}
function photo(h){const src=String(h.thumbnail||'');return /^https:\/\/[^<>"'\s]+$/.test(src)?src:''}
async function hotelSearch(){
 if(!dateOK(state.arrival)){progress('lxPkgHotelStatus','Elige primero la fecha de viaje.',true);return}
 if(isMultiHotel()){
  progress('lxPkgHotelStatus','Este paquete recorre varios destinos; los cambios de hotel se cotizan por ciudad. Elige una categoría o solicita una alternativa personalizada.',true);return
 }
 const button=$('lxPkgSearchHotels');button.disabled=true;progress('lxPkgHotelStatus','Buscando hoteles y fotografías…');
 const host=$('lxPkgHotelAlternatives');host.replaceChildren();
 try{
  const data=await src.get({mode:'package_hotels',package:pack.slug,arrival:state.arrival,
   checkout:state.checkout,adults:state.adults,children:state.children,
   baseHotel:pack.hotelTiers[state.tier]?.hotels?.[0]||''});
  if(!data?.ok)throw Error(data?.message||'El proveedor no devolvió resultados.');
  const list=Array.isArray(data.hotels)?data.hotels:[];
  if(!list.length){progress('lxPkgHotelStatus','Sin opciones para estas fechas. Puedes conservar el hotel incluido.');return}
  progress('lxPkgHotelStatus','Precios de referencia: selecciona el hotel; confirmaremos disponibilidad antes de cobrar.');
  list.slice(0,12).forEach(h=>{
   const delta=data.comparable===true&&state.children===0&&state.adults<=2&&
    Number(data.baselineTotal)>0&&Number(h.totalRate)>0?
    round(Number(h.totalRate)-Number(data.baselineTotal)):null;
   const card=mk('button','','lx-pkg-opt');card.type='button';
   const row=mk('div','','lx-pkg-hotelrow');
   if(photo(h)){const img=document.createElement('img');img.src=photo(h);img.alt='Hotel '+h.name;img.className='lx-pkg-altphoto';img.loading='lazy';row.append(img)}
   const copy=mk('div');copy.append(mk('strong',h.name),
    mk('small',(h.rating?'Calificación '+h.rating+' · ':'')+(h.totalRate?'Tarifa hotel '+usd(h.totalRate):'Precio por consultar')));
   copy.append(mk('div',Number.isFinite(delta)?
    'Diferencia hotelera estimada: '+(delta>=0?'+':'−')+usd(Math.abs(delta)):
    'Precio de sustitución pendiente de verificación','lx-pkg-opt__body'));
   row.append(copy);card.append(row);
   card.addEventListener('click',()=>{
    state.otherHotel={name:String(h.name).slice(0,100),delta,estimate:Number.isFinite(delta),
     hotelTotal:h.totalRate||null,baseTotal:data.baselineTotal||null};
    host.querySelectorAll('.lx-pkg-opt').forEach(x=>x.classList.remove('is-selected'));card.classList.add('is-selected');summarize();
   });
   host.append(card);
  });
 }catch(e){progress('lxPkgHotelStatus',e.message||'Servicio hotelero no disponible.',true)}
 finally{button.disabled=false}
}
function pickExtras(){
 const words=norm([pack.title,...(pack.includes||[]),...(pack.itinerary||[])].join(' '));
 const reg=norm(pack.region||pack.title);
 const blacklist={
  'machu-picchu-full-day':['machu picchu'],'valle-sagrado-clasico':['valle sagrado'],
  'city-tour-medellin':['city tour'],'comuna-13-medellin':['comuna 13'],
  'guatape-piedra-penol':['guatape'],'montana-colores':['montana de colores','vinicunca']
 };
 extras=(catalog.experiences||[]).filter(e=>{
  if(e.country!==pack.country||!e.slug||!(Number(e.priceFrom)>0))return false;
  const ereg=norm(e.region||'');
  if(!ereg||!reg.includes(ereg))return false;
  return !(blacklist[e.slug]||[]).some(v=>words.includes(v));
 }).slice(0,6);
}
function renderExtras(){
 const root=$('lxPkgExtras');root.replaceChildren();
 if(!extras.length){root.append(mk('div','Este paquete no tiene extras independientes con tarifa publicada. Puedes solicitarlos a nuestro asesor.','lx-pkg-option-include'));return}
 extras.forEach(x=>{
  const row=mk('div','','lx-pkg-activity');
  if(x.img){const img=document.createElement('img');img.src='../assets/img/'+x.img;img.alt=x.title;img.loading='lazy';row.append(img)}
  const copy=mk('div','','lx-pkg-activity__copy');copy.append(mk('strong',x.title),mk('p',x.excerpt||'Sujeta a horarios y disponibilidad'),
   mk('small',usd(x.priceFrom)+' por adulto · Niños a consultar'));
  const check=document.createElement('input');check.type='checkbox';
  check.checked=state.extraIds.includes(x.slug);check.setAttribute('aria-label','Agregar '+x.title);
  check.addEventListener('change',()=>{
   if(check.checked){if(!state.extraIds.includes(x.slug))state.extraIds.push(x.slug)}
   else state.extraIds=state.extraIds.filter(v=>v!==x.slug);
   summarize();
  });
  row.append(copy,check);root.append(row);
 });
}
function renderFlight(){
 $('lxPkgWantFlights').checked=state.withFlights;
 $('lxPkgFlightInterface').hidden=!state.withFlights;
 $('lxPkgOutDate').value=state.outDate;$('lxPkgBackDate').value=state.backDate;
 $('lxPkgFlightDestination').value=state.dest;$('lxPkgFlightReturnOrigin').value=state.backOrigin;
 $('lxPkgBag').value=state.bag;renderFlightOptions();
}
function first(t){return t?.segments?.[0]||{}}
function last(t){return t?.segments?.at(-1)||{}}
function flightCard(t,price,subtitle,onSelect,selected){
 const card=mk('button','','lx-pkg-opt'+(selected?' is-selected':''));card.type='button';
 const head=mk('div','','lx-pkg-opt__header');const name=mk('div','','lx-pkg-offerhead');
 const logo=src.logo(first(t));if(logo){const img=document.createElement('img');img.src=logo;img.alt='';img.loading='lazy';name.append(img)}
 name.append(mk('strong',first(t).airline||'Aerolínea'));head.append(name,mk('span',usd(price)));card.append(head);
 const route=mk('div','','lx-pkg-flightroute');route.append(
  mk('strong',time(first(t).from?.time)+' '+(first(t).from?.code||'')),
  mk('span',length(t.duration)+' · '+Math.max(0,(t.segments||[]).length-1)+' escala(s)','middle'),
  mk('strong',time(last(t).to?.time)+' '+(last(t).to?.code||'')));
 card.append(route,mk('small',subtitle));
 if(t.segments?.length>1){
  const timeline=mk('div','','lx-pkg-segments');
  t.segments.forEach(seg=>timeline.append(mk('p',(seg.flightNumber||seg.airline||'Vuelo')+
   ' · '+(seg.from?.code||'')+' '+time(seg.from?.time)+' → '+(seg.to?.code||'')+' '+time(seg.to?.time))));
  card.append(timeline);
 }
 card.addEventListener('click',onSelect);return card;
}
function renderFlightOptions(){
 const out=$('lxPkgFlightOptions'),ret=$('lxPkgFlightReturns');out.replaceChildren();ret.replaceChildren();
 if(!state.flightOffers.length)return;
 const factor=1+margin(lead(state.outDate));
 if(state.flightMode==='roundtrip'){
  const group=src.outPair(state.flightOffers);out.append(mk('h4','Elige tu vuelo de ida'));
  for(const [key,arr] of group){
   const cheapest=arr.reduce((a,b)=>a.price<b.price?a:b);
   out.append(flightCard(cheapest.outbound,round(cheapest.price*factor),
    'Combinación ida y vuelta para todo el grupo',()=>{
     state.outKey=key;
     if(src.signature(state.selectedPair?.outbound)!==key)state.selectedPair=null;
     renderFlightOptions();summarize();
    },state.outKey===key));
  }
  if(state.outKey){
   ret.append(mk('h4','Elige tu regreso'));
   (group.get(state.outKey)||[]).forEach(o=>ret.append(flightCard(o.inbound,round(o.price*factor),
    'Precio completo ida + regreso, no solo este tramo',()=>{
     state.selectedPair=o;renderFlightOptions();summarize();
    },state.selectedPair===o)));
  }
 }else{
  out.append(mk('h4','Elige tu ida'));ret.append(mk('h4','Elige tu vuelta'));
  state.flightOffers.filter(o=>o.leg==='out').forEach(o=>out.append(flightCard(o.outbound,round(o.price*factor),
   'Solo ida para el grupo',()=>{state.selectedOut=o;renderFlightOptions();summarize()},state.selectedOut===o)));
  state.flightOffers.filter(o=>o.leg==='return').forEach(o=>ret.append(flightCard(o.outbound,round(o.price*factor),
   'Solo regreso para el grupo',()=>{state.selectedReturn=o;renderFlightOptions();summarize()},state.selectedReturn===o)));
 }
}
async function flightSearch(){
 if(!dateOK(state.outDate)||!dateOK(state.backDate)||state.outDate<minArrival||state.backDate<state.outDate){
  progress('lxPkgFlightStatus','Selecciona fechas correctas.',true);return
 }
 if(state.origin===state.dest){progress('lxPkgFlightStatus','La ciudad de partida coincide con la de llegada. Corrige el aeropuerto o continúa sin vuelos.',true);return}
 const button=$('lxPkgFindFlights');button.disabled=true;clearFlights();
 progress('lxPkgFlightStatus','Buscando rutas y precios mediante Google Flights…');
 try{
  let offers=[];
  const params={adults:state.adults,children:state.children,cabin:'economy'};
  const valid=o=>Number(o?.price)>0&&o.outbound?.segments?.length&&
   Number(o.partyAdults)===state.adults&&Number(o.partyChildren)===state.children;
  if(state.dest===state.backOrigin){
   state.flightMode='roundtrip';
   const result=await src.get({...params,origin:state.origin,destination:state.dest,
    departure:state.outDate,returnDate:state.backDate,trip:'roundtrip'});
   if(!result?.ok)throw Error(result?.message||'Sin resultados');
   offers=(result.offers||[]).filter(o=>valid(o)&&o.inbound?.segments?.length&&
    o.departure===state.outDate&&o.returnDate===state.backDate).slice(0,24);
  }else{
   state.flightMode='openjaw';
   const results=await Promise.all([
    src.get({...params,origin:state.origin,destination:state.dest,departure:state.outDate,trip:'oneway'}),
    src.get({...params,origin:state.backOrigin,destination:state.origin,departure:state.backDate,trip:'oneway'})
   ]);
   if(results.some(r=>!r?.ok))throw Error(results.find(r=>!r.ok)?.message||'Ruta multidestino no disponible');
   offers=[...(results[0].offers||[]).filter(valid).slice(0,8).map(o=>({...o,leg:'out'})),
    ...(results[1].offers||[]).filter(valid).slice(0,8).map(o=>({...o,leg:'return'}))];
  }
  state.flightOffers=offers;
  progress('lxPkgFlightStatus',offers.length?'Selecciona ida y regreso. Los importes son observados y se verificarán antes del cobro.':'No hay vuelos válidos para estos días. Puedes continuar sin vuelos.',!offers.length);
  renderFlightOptions();
 }catch(e){progress('lxPkgFlightStatus',e.message||'Servicio no disponible.',true)}
 finally{button.disabled=false}
}
function renderReview(){
 const el=$('lxPkgReview');el.replaceChildren();
 line(el,'Paquete: '+pack.title,usd(adultPackagePrice()));
 line(el,'Hotel: '+pack.hotelTiers[state.tier].name,'Incluido en la categoría');
 if(state.otherHotel)line(el,'Hotel alternativo: '+state.otherHotel.name,Number.isFinite(state.otherHotel.delta)?
  (state.otherHotel.delta>=0?'+':'−')+usd(Math.abs(state.otherHotel.delta)):'Cotizar');
 state.extraIds.forEach(id=>{const e=extras.find(e=>e.slug===id);if(e)line(el,e.title,usd(Number(e.priceFrom)*state.adults))});
 line(el,'Vuelos',isFlightSelected()?usd(flightCost()):'No incluidos');
 if(state.bag!=='default'&&isFlightSelected())line(el,'Equipaje extra','Por confirmar');
 line(el,'SUBTOTAL REFERENCIAL',usd(total())+(pending()?' + pendientes':''));
 const warning=$('lxPkgWarnings');warning.replaceChildren();
 ['Fechas: '+fmt(state.arrival)+' al '+fmt(state.checkout),
  'Viajeros: '+state.adults+' adultos y '+state.children+' niños',
  'Los datos de proveedores pueden cambiar antes de la emisión',
  ...(pending()?['Existen servicios o precios pendientes de confirmar']:[])]
  .forEach(x=>warning.append(mk('p','• '+x)));
}
function payload(){
 const flight=isFlightSelected()?{
  priceObserved:rawFlight(),mode:state.flightMode,
  outbound:state.flightMode==='roundtrip'?state.selectedPair.outbound.segments:state.selectedOut.outbound.segments,
  inbound:state.flightMode==='roundtrip'?state.selectedPair.inbound.segments:state.selectedReturn.outbound.segments
 }:null;
 const slim=arr=>(arr||[]).slice(0,5).map(s=>({
  airline:String(s.airline||'').slice(0,55),flightNumber:String(s.flightNumber||'').slice(0,20),
  from:{code:s.from?.code,time:s.from?.time},to:{code:s.to?.code,time:s.to?.time}}));
 return {packageId:pack.slug,origin:state.origin,destination:state.dest,returnAirport:state.backOrigin,
  arrival:state.arrival,checkout:state.checkout,outDate:flight?state.outDate:'',
  backDate:flight?state.backDate:'',adults:state.adults,children:state.children,
  hotelTier:pack.hotelTiers[state.tier].code,hotelAlternative:state.otherHotel?.name||'',
  hotelReference:state.otherHotel?.hotelTotal||null,hotelBaselineReference:state.otherHotel?.baseTotal||null,
  activityIds:state.extraIds.slice(0,6),baggage:state.bag,
  flight:flight?{priceObserved:flight.priceObserved,mode:flight.mode,
   outbound:slim(flight.outbound),inbound:slim(flight.inbound)}:null};
}
function launchPassengerForm(){
 const block=$('lxPkgRequestBlock');block.hidden=false;
 if(!src.valid){progress('lxPkgRequestStatus','Falta desplegar el Apps Script actualizado para recibir solicitudes privadas.',true);return}
 const data=JSON.stringify(payload());
 if(data.length>3900){progress('lxPkgRequestStatus','La combinación incluye demasiados tramos. Solicita asistencia personalizada.',true);return}
 const url=new URL(src.endpoint);url.searchParams.set('mode','package_request');url.searchParams.set('payload',data);
 $('lxPkgRequestFrame').src=url.toString();
 progress('lxPkgRequestStatus','Ingresa los datos personales únicamente en el formulario privado.');
 block.scrollIntoView({behavior:'smooth',block:'start'});
}
function open(){if(!modal||modal.open)return;oldFocus=document.activeElement;modal.showModal();document.body.classList.add('lx-pkg-locked');state.step=0;render()}
function close(){modal?.close();document.body.classList.remove('lx-pkg-locked');oldFocus?.focus?.()}
async function init(){
 try{
  const r=await Promise.all([
   fetch('../assets/data/catalog.json',{cache:'force-cache'}),
   fetch('../assets/components/paquetes-personalizador.html',{cache:'force-cache'})
  ]);
  if(r.some(x=>!x.ok))return;
  catalog=await r[0].json();pack=(catalog.packages||[]).find(x=>x.slug===slug);
  if(!pack||!pack.hotelTiers?.length)return;
  const html=await r[1].text();
  modal=document.createElement('dialog');modal.className='lx-pkg-modal';modal.id='lxPkgModal';modal.innerHTML=html;
  document.body.append(modal);
 }catch(_){return}
 const area=document.querySelector('.product-booking-card')||
  document.querySelector('.tour-booking-aside')||document.querySelector('.detail-aside')||
  document.querySelector('.detail-grid')||document.querySelector('main');
 if(!area)return;
 const entry=mk('div','','lx-pkg-entry');entry.id='personaliza';
 entry.append(mk('strong','Personaliza tu viaje'),mk('p','Elige hotel, experiencias, vuelos y maletas; revisa el precio preliminar antes de ingresar los datos de pasajeros.'));
 const btn=mk('button','Personalizar mi paquete');btn.type='button';btn.addEventListener('click',open);entry.append(btn);area.append(entry);
 $('lxPkgClose').addEventListener('click',close);
 modal.addEventListener('cancel',e=>{e.preventDefault();close()});
 $('lxPkgPrev').addEventListener('click',()=>step(state.step-1));
 $('lxPkgNext').addEventListener('click',()=>step(state.step+1));
 const arrival=q.get('fecha')||q.get('arrival')||'';
 state.arrival=dateOK(arrival)&&arrival>=minArrival?arrival:'';
 const adults=Number(q.get('adultos')||q.get('adults')||2),children=Number(q.get('ninos')||q.get('children')||0);
 state.adults=adults>=1&&adults<=9?adults:2;
 state.children=children>=0&&children<=6&&state.adults+children<=9?children:0;
 if(src.airports.some(o=>o[0]===q.get('origen')))state.origin=q.get('origen');
 const parts=String(pack.region||'').split(/\s+\/\s+|\s+y\s+|,/).map(s=>s.trim()).filter(Boolean);
 state.dest=src.airport(parts[0]||pack.title);
 state.backOrigin=parts.length>1?src.airport(parts[parts.length-1]):state.dest;
 if(state.backOrigin==='LIM'&&state.dest!=='LIM')state.backOrigin=state.dest;
 if(state.arrival)setDate(state.arrival);
 makeOptions($('lxPkgOrigin'),src.airports,state.origin);
 makeOptions($('lxPkgFlightDestination'),src.airports,state.dest);
 makeOptions($('lxPkgFlightReturnOrigin'),src.airports,state.backOrigin);
 makeOptions($('lxPkgAdults'),Array.from({length:9},(_,i)=>[i+1,i+1]),state.adults);
 makeOptions($('lxPkgChildren'),Array.from({length:7},(_,i)=>[i,i]),state.children);
 $('lxPkgArrival').min=minArrival;
 $('lxPkgPhoto').src='../assets/img/'+pack.img;$('lxPkgPhoto').alt=pack.alt||pack.title;
 $('lxPkgSummaryTitle').textContent=pack.title;$('lxPkgTitle').textContent='Personaliza '+pack.title;
 $('lxPkgOrigin').addEventListener('change',()=>{state.origin=$('lxPkgOrigin').value;clearFlights();summarize()});
 $('lxPkgArrival').addEventListener('change',()=>{setDate($('lxPkgArrival').value);summarize()});
 ['lxPkgAdults','lxPkgChildren'].forEach(id=>$(id).addEventListener('change',()=>{
  state.adults=Number($('lxPkgAdults').value);state.children=Number($('lxPkgChildren').value);
  if(state.adults+state.children>9){state.children=9-state.adults;$('lxPkgChildren').value=state.children}
  state.otherHotel=null;clearFlights();summarize();
 }));
 $('lxPkgSearchHotels').addEventListener('click',hotelSearch);
 $('lxPkgWantFlights').addEventListener('change',()=>{
  state.withFlights=$('lxPkgWantFlights').checked;
  $('lxPkgFlightInterface').hidden=!state.withFlights;
  if(!state.withFlights)clearFlights();summarize();
 });
 ['lxPkgFlightDestination','lxPkgFlightReturnOrigin'].forEach(id=>$(id).addEventListener('change',()=>{
  state.dest=$('lxPkgFlightDestination').value;state.backOrigin=$('lxPkgFlightReturnOrigin').value;clearFlights();
 }));
 $('lxPkgOutDate').addEventListener('change',()=>{state.outDate=$('lxPkgOutDate').value;clearFlights()});
 $('lxPkgBackDate').addEventListener('change',()=>{state.backDate=$('lxPkgBackDate').value;clearFlights()});
 $('lxPkgBag').addEventListener('change',()=>{state.bag=$('lxPkgBag').value;summarize()});
 $('lxPkgFindFlights').addEventListener('click',flightSearch);
 $('lxPkgAccept').addEventListener('change',()=>{$('lxPkgPassengers').disabled=!$('lxPkgAccept').checked});
 $('lxPkgPassengers').addEventListener('click',launchPassengerForm);
 pickExtras();renderBasic();summarize();
 if(location.hash==='#personaliza')setTimeout(open,80);
 window.addEventListener('hashchange',()=>{if(location.hash==='#personaliza')open()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();