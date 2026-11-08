/* LATAM Expeditions · Selector de vuelos, alojamiento y datos heredados para fichas de paquetes.
   Importes informativos. Nunca emite billetes ni confirma un hotel. */
(() => {
 'use strict';
 const $=(id)=>document.getElementById(id);
 const q=new URLSearchParams(location.search);
 const book=document.querySelector('.product-booking-card [data-book][data-book-kind="package"]');
 const root=document.querySelector('.product-detail-section .detail-layout');
 if(!book||!root)return;
 const cards=[...document.querySelectorAll('.product-detail-section .detail-main > .detail-card')];
 const side=document.querySelector('.product-booking-card');
 const main=root.querySelector('.detail-main');
 if(!side||!main)return;
 const fmt=n=>'USD '+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 const dateOK=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&!Number.isNaN(Date.parse(s+'T12:00:00'));
 const addDays=(date,n)=>{let d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 const localISO=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 const minDate=addDays(localISO(new Date()),2);
 const params={slug:book.dataset.book||'',nights:Number((book.dataset.bookDuration||'').match(/(\d+)N/)?.[1])||3,
  // No inferir MDE para toda Colombia: solo las fichas de Medellín.
  destination:/^medellin-/.test(book.dataset.book||'')?'MDE':'',
  title:book.dataset.bookTitle||'',base:Number(book.dataset.bookPrice)||0,
  childFactor:Number(book.dataset.bookChildFactor||.7)};
 let tiers=[];try{tiers=JSON.parse(book.dataset.bookTiers||'[]')}catch(_){}
 const firstTier=tiers[0]||null;
 const hasHotelIncluded=Boolean(firstTier&&!firstTier.noAccommodation&&firstTier.code!=='sin-hotel');
 const maxHotelOccupancy=4;
 const defaults={'Perú':'LIM','Colombia':'BOG','Argentina':'EZE','Chile':'SCL','México':'MEX',
  'Brasil':'GRU','Ecuador':'UIO','Bolivia':'LPB','Venezuela':'CCS','Costa Rica':'SJO','Uruguay':'MVD'};
 let country='';try{country=localStorage.getItem('latam_country')||''}catch(_){}
 const state={
  date:dateOK(q.get('fecha'))&&q.get('fecha')>=minDate?q.get('fecha'):'',
  adults:Math.max(1,Math.min(9,Number(q.get('adults'))||Number(q.get('viajeros'))||2)),
  children:Math.max(0,Math.min(8,Number(q.get('children'))||0)),
  origin:(q.get('origen')||defaults[country]||'LIM').toUpperCase(),
  tier:firstTier?.code||'',occupancy:'double',hotelPicked:false,customHotel:'',
  hotelPhotos:{},roomPlan:'',hotelQuotePending:false,childrenAges:[],flight:null,baggage:'none',offers:[],outboundKey:'',choice:null
 };
 if(state.adults+state.children>9)state.children=Math.max(0,9-state.adults);
 function defaultRoom(){
   const n=state.adults+state.children;
   return n===1?'single':n===3?'triple':n===4?'family':'double';
 }
 state.occupancy=defaultRoom();
 if(!/^[A-Z]{3}$/.test(state.origin))state.origin='LIM';
 const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=String(txt);return e};
 const validSrc=s=>/^https:\/\/[^<>"'\s]+$/.test(s||'');
 function currentTier(){return tiers.find(x=>x.code===state.tier)||firstTier}
 function pricePackage(){const tier=currentTier();const rate=tier?Number(tier.occupancyPrices?.[state.occupancy]??tier.pricePerPerson??params.base):params.base;
  return Math.round((state.adults*rate+state.children*rate*params.childFactor)*100)/100;
 }
 function priceFlight(){return state.flight?.displayedPrice||0}
 function total(){return Math.round((pricePackage()+priceFlight())*100)/100}
 function passengerText(){return state.adults+(state.adults===1?' adulto':' adultos')+(state.children?', '+state.children+(state.children===1?' niño':' niños'):'')}
 function flightMarkup(date){const n=Math.round((new Date(date+'T12:00:00')-new Date(localISO(new Date())+'T12:00:00'))/86400000);
  return n<=30?.1:n<=45?.05:n<=90?0:n<=180?-.05:n<=270?-.1:-.15;
 }
 function getSelection(){return {slug:params.slug,date:state.date,adults:state.adults,children:state.children,
  tier:state.tier,occupancy:state.occupancy,customHotel:state.customHotel,roomPlan:state.roomPlan,hotelQuotePending:state.hotelQuotePending,
  flight:state.flight?{...state.flight,baggage:state.baggage}:null,
  totalEstimate:total(),packageEstimate:pricePackage(),origin:state.origin};}
 window.LatamPackageDetails={getSelection};
 function removeInternalNotes(){
  const facts=main.querySelector('.tour-facts.product-facts');
  if(facts){const useful=[...facts.children].filter(div=>/duraci[oó]n|comidas|idiomas/i.test(div.querySelector('span')?.textContent||''));
   if(useful.length){facts.replaceChildren(...useful)}
  }
  side.querySelectorAll('.fact-row,.dynamic-rate-note,.tour-booking-note,.package-flights-box').forEach(x=>x.remove());
  main.querySelectorAll('.tour-note').forEach(node=>{
   if(/tarifa infantil se calcula|precio referencial por persona|precios referenciales actualizados/i.test(node.textContent||''))node.remove();
  });
  main.querySelectorAll('.tour-bullet-list li').forEach(node=>{
   if(/precios son referenciales por persona/i.test(node.textContent||''))node.remove();
  });
 }
 removeInternalNotes();
 const panel=el('section','lx-package-quick');
 panel.setAttribute('aria-label','Fecha y viajeros del paquete');
 panel.innerHTML='<div class="lx-package-quick-grid">'+
  '<label>Fecha de llegada<input type="date" id="lxProductDate" aria-label="Fecha de llegada"></label>'+
  '<label>Personas<input id="lxProductTotalPax" type="text" readonly aria-label="Total de personas"></label></div>'+
  '<div class="lx-package-guests">'+
  '<label>Adultos<div class="lx-package-count"><button type="button" data-pax="adults" data-dir="-1" aria-label="Quitar adulto">−</button><output id="lxProductAdults"></output><button type="button" data-pax="adults" data-dir="1" aria-label="Añadir adulto">+</button></div></label>'+
  '<label>Niños<div class="lx-package-count"><button type="button" data-pax="children" data-dir="-1" aria-label="Quitar niño">−</button><output id="lxProductChildren"></output><button type="button" data-pax="children" data-dir="1" aria-label="Añadir niño">+</button></div></label></div>'+
  '<div class="lx-package-quick-total"><small>Total para el grupo</small><strong id="lxProductGroupPrice"></strong></div>'+
  '<div id="lxProductFlightPrice" class="lx-package-flight-price" hidden></div>'+
  '<p class="lx-package-addons-note" id="lxProductQuoteNote">Elige la fecha y los viajeros para continuar.</p>';
 side.querySelector('.price-block')?.after(panel);
 $('lxProductDate').min=minDate;$('lxProductDate').value=state.date;
 $('lxProductDate').addEventListener('change',()=>{state.date=$('lxProductDate').value;invalidateFlight();update()});
 panel.querySelectorAll('[data-pax]').forEach(b=>b.addEventListener('click',()=>{
  const type=b.dataset.pax,delta=Number(b.dataset.dir),next=state[type]+delta;
  if(next<(type==='adults'?1:0)||next>9||(delta>0&&state.adults+state.children>=9))return;
  state[type]=next;state.hotelPicked=false;state.occupancy=defaultRoom();state.roomPlan='';state.hotelQuotePending=false;state.customHotel='';state.childrenAges=[];invalidateFlight();update();
 }));
 const sectionAt=cards.find(x=>/^Itinerario/i.test(x.querySelector('h2')?.textContent||''))||
   main.querySelector('.package-itinerary')?.closest('section.detail-card');
 const addonFlights=el('section','lx-package-addon');
 addonFlights.innerHTML='<div class="lx-addon-row"><div><h2><i class="fa-solid fa-plane"></i> Añade vuelos a tu paquete</h2>'+
 '<p>Elige ida y regreso desde tu ciudad de salida. Puedes continuar también sin vuelos.</p></div>'+
 '<button type="button" id="lxProductOpenFlights">Buscar vuelos</button></div>'+
 '<div id="lxProductSelectedFlight" class="lx-package-status">Vuelos no incluidos</div>';
 const addonHotels=el('section','lx-package-addon');
 addonHotels.innerHTML='<h2><i class="fa-solid fa-bed"></i> Alojamiento del paquete</h2>'+
 '<div class="lx-package-hotel-item"><div class="lx-package-hotel-photo" id="lxProductHotelPhoto">'+
 '<span>Foto del hotel al consultar opciones</span></div><div><strong id="lxProductHotelName"></strong>'+
 '<small id="lxProductHotelCategory"></small><p id="lxProductHotelStatus"></p></div></div>'+
 '<div class="lx-addon-row"><span class="lx-package-addons-note">Puedes cambiar de categoría o solicitar otro hotel.</span>'+
 '<button type="button" id="lxProductOpenHotel">Elegir habitación u hotel</button></div>';
 if(sectionAt){sectionAt.before(addonFlights,addonHotels)}
 else main.prepend(addonHotels,addonFlights);
 // Modal container (shared design for flights and hotels).
 function modal(id,title){
  const wrap=el('div','lx-package-modal');wrap.id=id;wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');
  const dialog=el('div','lx-package-dialog');const head=el('header','lx-package-modal-head');
  const heading=el('h2','',title),close=el('button','lx-package-close','×');close.type='button';close.setAttribute('aria-label','Cerrar');
  const body=el('div','lx-package-modal-body');head.append(heading,close);dialog.append(head,body);wrap.append(dialog);
  document.body.append(wrap);
  let last=null;
  function hide(){wrap.classList.remove('is-open');document.body.style.overflow='';last?.focus?.()}
  function show(){last=document.activeElement;wrap.classList.add('is-open');document.body.style.overflow='hidden';close.focus()}
  close.addEventListener('click',hide);wrap.addEventListener('click',e=>{if(e.target===wrap)hide()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&wrap.classList.contains('is-open'))hide()});
  return {body,hide,show,wrap};
 }
 const flights=modal('lxProductFlightsModal','Elige tus vuelos');
 flights.body.innerHTML='<div class="lx-package-modal-fields">'+
 '<label>Salida desde<select id="lxFlightOrigin">'+
  ['LIM|Lima','BOG|Bogotá','CUZ|Cusco','MDE|Medellín','CLO|Cali','CTG|Cartagena',
   'AQP|Arequipa','EZE|Buenos Aires','SCL|Santiago','MEX|Ciudad de México',
   'UIO|Quito','GRU|São Paulo','PTY|Ciudad de Panamá','MIA|Miami','CCS|Caracas'].map(s=>{
    const [code,label]=s.split('|');return '<option value="'+code+'">'+label+' ('+code+')</option>';
   }).join('')+'</select></label>'+
 '<label>Llegada al destino<input type="date" id="lxFlightArrival"></label>'+
 '<label>Salida de tu ciudad<input type="date" id="lxFlightDeparture"></label>'+
 '<label>Regreso<input type="date" id="lxFlightReturn"></label>'+
 '<label>Adultos<select id="lxFlightAdults">'+Array.from({length:9},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+'</option>').join('')+'</select></label>'+
 '<label>Niños<select id="lxFlightChildren">'+Array.from({length:7},(_,i)=>'<option value="'+i+'">'+i+'</option>').join('')+'</select></label>'+
 '</div><button type="button" class="lx-package-search" id="lxProductSearchFlights">Consultar vuelos</button>'+
 '<div id="lxFlightSearchStatus" role="status" class="lx-package-status"></div>'+
 '<div id="lxFlightDepartures" class="lx-package-offers"></div><div id="lxFlightReturns" class="lx-package-offers"></div>'+
 '<label class="lx-baggage-select"><input type="checkbox" id="lxFlightCheckedBag"> Quiero añadir equipaje facturado (tarifa por confirmar)</label>'+
 '<div class="lx-package-modal-bottom"><strong id="lxFlightConfirmedTotal">Selecciona ida y regreso</strong>'+
 '<button type="button" id="lxFlightApply" disabled>Confirmar vuelos</button></div>';
 const hotels=modal('lxProductHotelsModal','Hotel y acomodación');
 hotels.body.innerHTML='<p class="lx-modal-lead">Elige hotel y habitaciones compatibles con tu grupo. Los cambios de hotel y combinaciones especiales se cotizan antes del pago.</p>'+
 '<div hidden><select id="lxHotelTier">'+tiers.map(t=>'<option value="'+String(t.code).replace(/["<>]/g,'')+'">'+String(t.name||'').replace(/</g,'')+'</option>').join('')+'</select>'+
 '<select id="lxHotelOccupancy"><option value="single">Simple</option><option value="double">Doble</option><option value="matrimonial">Matrimonial</option><option value="triple">Triple</option><option value="family">Familiar</option></select></div>'+
 '<div id="lxHotelTierCards" class="lx-hotel-cards"></div>'+
 '<div id="lxHotelCurrentSummary" class="lx-package-status"></div>'+
 '<div id="lxHotelAgesBox" class="lx-hotel-age-box" hidden></div>'+
 '<button type="button" class="lx-package-search" id="lxProductLookupHotels">Ver otros hoteles del destino</button>'+
 '<div id="lxHotelLookupStatus" class="lx-package-status" role="status"></div>'+
 '<div id="lxHotelLookupOptions" class="lx-package-offers lx-hotel-alternatives"></div>'+
 '<div class="lx-package-modal-bottom"><span class="lx-package-quotes-extra" id="lxHotelExtraStatus"></span>'+
 '<button type="button" id="lxHotelApply">Confirmar alojamiento</button></div>';
 const flightStatus=$('lxFlightSearchStatus'),hotelStatus=$('lxHotelLookupStatus');
 function setStatus(node,message,err=false){node.textContent=message;node.classList.toggle('is-error',err)}
 function syncFlightForm(){
  $('lxFlightOrigin').value=state.origin;
  $('lxFlightAdults').value=String(state.adults);$('lxFlightChildren').value=String(state.children);
  $('lxFlightArrival').min=minDate;
  $('lxFlightDeparture').min=minDate;$('lxFlightReturn').min=minDate;
  $('lxFlightArrival').value=state.date||'';
  if(state.date){$('lxFlightDeparture').value=state.date;$('lxFlightReturn').value=addDays(state.date,params.nights)}
  else{$('lxFlightDeparture').value='';$('lxFlightReturn').value=''}

 }
 function invalidateFlight(){
  state.flight=null;state.choice=null;state.offers=[];state.outboundKey='';
  if($('lxFlightDepartures'))$('lxFlightDepartures').replaceChildren();
  if($('lxFlightReturns'))$('lxFlightReturns').replaceChildren();
 }
 function roomPlans(n){
 if(n===1)return [{code:'single',label:'01 habitación simple'}];
 if(n===2)return [{code:'double',label:'01 habitación doble twin'},
  {code:'matrimonial',label:'01 habitación matrimonial'},{code:'single',label:'02 habitaciones simples',pending:true}];
 if(n===3)return [{code:'triple',label:'01 habitación triple'},
  {code:'double',label:'01 doble + 01 simple',pending:true},
  {code:'matrimonial',label:'01 matrimonial + cama adicional',pending:true},
  {code:'single',label:'03 habitaciones simples',pending:true}];
 if(n===4)return [{code:'family',label:'01 habitación familiar'},
  {code:'double',label:'02 habitaciones dobles',pending:true},
  {code:'matrimonial',label:'01 matrimonial + 01 doble',pending:true},
  {code:'single',label:'04 habitaciones simples',pending:true}];
 return [{code:'family',label:'Distribución para grupo',pending:true}];
}
let pendingRoomPlan=null;
function syncHotelForm(){
 hotelsPendingName=state.customHotel;
 $('lxHotelTier').value=state.tier;
 const plans=roomPlans(state.adults+state.children);
 pendingRoomPlan=plans.find(p=>p.label===state.roomPlan)||plans.find(p=>p.code===state.occupancy)||plans[0];
 $('lxHotelOccupancy').value=pendingRoomPlan.code;
 renderHotelCards();renderHotelAges();showTierQuote();
}
function renderHotelAges(){
 const box=$('lxHotelAgesBox');box.replaceChildren();box.hidden=!state.children;
 if(!state.children)return;
 box.append(el('strong','','Edades de los niños al momento del viaje'));
 const group=el('div','lx-hotel-age-grid');
 for(let i=0;i<state.children;i++){
  const label=el('label','','Niño '+(i+1)),select=el('select');
  select.dataset.childAge=String(i);
  const hint=el('option','','Selecciona la edad');hint.value='';select.append(hint);
  for(let a=1;a<=17;a++){const o=el('option','',a+' años');o.value=String(a);select.append(o)}
  select.value=String(state.childrenAges[i]||'');
  select.addEventListener('change',()=>{state.childrenAges[i]=Number(select.value)||0});
  label.append(select);group.append(label);
 }
 box.append(group,el('small','','Para bebés menores de un año, la fuente de hoteles requiere indicar 1 año.'));
}
function renderHotelCards(){
 const box=$('lxHotelTierCards');box.replaceChildren(),n=state.adults+state.children;
 tiers.forEach(t=>{
  if(!t?.code)return;
  const card=el('article','lx-hotel-option-card'),media=el('div','lx-hotel-card-media');
  const name=(t.hotels||[]).join(' / ')||t.name||'Hotel previsto';
  const photo=state.hotelPhotos[String((t.hotels||[])[0]||'').toLowerCase()];
  if(validSrc(photo)){const img=el('img');img.src=photo;img.alt=name;img.loading='lazy';img.referrerPolicy='no-referrer';media.append(img)}
  else media.append(el('span','lx-hotel-placeholder','⌂'),el('small','','Foto por confirmar'));
  const details=el('div','lx-hotel-card-details');
  details.append(el('strong','lx-hotel-card-name',name),el('small','lx-hotel-card-category',(t.stars||'')+' · '+(t.name||'')),
   el('p','lx-hotel-room-title','Selecciona tu acomodación'));
  const options=el('div','lx-hotel-room-options');
  options.setAttribute('role','radiogroup');options.setAttribute('aria-label','Habitaciones de '+name);
  roomPlans(n).forEach(plan=>{
   const selected=$('lxHotelTier').value===t.code&&pendingRoomPlan?.label===plan.label;
   const button=el('button','lx-hotel-room-choice'+(selected?' is-selected':''));button.type='button';
   button.setAttribute('role','radio');button.setAttribute('aria-checked',String(selected));
   const rate=Number(t.occupancyPrices?.[plan.code]??t.pricePerPerson??params.base);
   const totalRate=Math.round((state.adults+state.children*params.childFactor)*rate*100)/100;
   button.append(el('span','lx-choice-radio',''),el('span','lx-room-copy',plan.label),
    el('strong','',plan.pending?'Por cotizar':fmt(totalRate)));
   button.addEventListener('click',()=>{
    $('lxHotelTier').value=t.code;$('lxHotelOccupancy').value=plan.code;
    pendingRoomPlan=plan;hotelsPendingName='';renderHotelCards();showTierQuote();
   });
   options.append(button);
  });
  details.append(options);card.append(media,details);box.append(card);
 });
}
function showTierQuote(){
 const t=tiers.find(x=>x.code===$('lxHotelTier').value)||firstTier;
 const plan=pendingRoomPlan||roomPlans(state.adults+state.children)[0];
 if(!t)return;
 const rate=Number(t.occupancyPrices?.[plan.code]??t.pricePerPerson??params.base);
 const sum=Math.round((state.adults+state.children*params.childFactor)*rate*100)/100;
 $('lxHotelCurrentSummary').textContent=!hasHotelIncluded?'Este paquete no incluye hotel; solicitar cotización.':
  'Seleccionado: '+(t.hotels||[]).join(' / ')+' · '+plan.label+
  (plan.pending?' · precio de combinación por confirmar':' · '+fmt(sum)+' total para el grupo');
 $('lxHotelExtraStatus').textContent=(plan.pending||hotelsPendingName)?
  'Suplemento sujeto a cotización; no se cobrará automáticamente.':
  'Sujeto a disponibilidad al confirmar.';
}
 function renderHotelPhoto(){
  const name=state.customHotel||(hasHotelIncluded?((currentTier()?.hotels||[])[0]||''):'');
  const slot=$('lxProductHotelPhoto');slot.replaceChildren();
  if(!hasHotelIncluded&&!state.customHotel){slot.append(el('span','','Hotel no incluido'));return}
  const photo=state.hotelPhotos[name.toLowerCase()];
  if(validSrc(photo)){const image=el('img');image.src=photo;image.alt='Imagen de '+name;image.loading='lazy';image.referrerPolicy='no-referrer';slot.append(image)}
  else slot.append(el('span','', 'Foto del hotel al consultar opciones'));
 }
 function update(){
  $('lxProductDate').value=state.date;
  $('lxProductTotalPax').value=String(state.adults+state.children)+' viajeros';
  $('lxProductAdults').textContent=String(state.adults);$('lxProductChildren').textContent=String(state.children);
  panel.querySelectorAll('[data-pax]').forEach(b=>{
   const next=state[b.dataset.pax]+Number(b.dataset.dir);
   b.disabled=next<(b.dataset.pax==='adults'?1:0)||
    (Number(b.dataset.dir)>0&&state.adults+state.children>=9);
  });
  $('lxProductGroupPrice').textContent=state.adults+state.children>maxHotelOccupancy?'Cotización para el grupo':(state.hotelQuotePending?'Desde '+fmt(total()):fmt(total()));
  $('lxProductQuoteNote').textContent=state.adults+state.children>maxHotelOccupancy?
    'Para más de 4 viajeros, confirmaremos las habitaciones y el precio del grupo.':
    state.hotelQuotePending?'Distribución o cambio de hotel pendiente de cotización.':
    state.flight&&state.date&&state.flight.returnDate>addDays(state.date,params.nights)?
    'El regreso es posterior a la salida del hotel; consultaremos noches adicionales.':state.customHotel?
    'Cambio de hotel solicitado; el suplemento se confirmará antes del pago.':
    state.flight&&state.baggage==='checked'?
    'El suplemento de equipaje facturado se confirmará antes del pago.':
    'Elige categoría de hotel y habitación al reservar.';
  const flightPrice=$('lxProductFlightPrice');
  flightPrice.hidden=!state.flight;
  if(state.flight)flightPrice.textContent='Vuelos seleccionados: '+fmt(priceFlight())+
    ' para el grupo'+(state.baggage==='checked'?' · Maleta por cotizar':'');
  $('lxProductHotelName').textContent=state.customHotel||(!hasHotelIncluded?'Sin alojamiento':((currentTier()?.hotels||[]).join(' / ')||'Hotel incluido'));

  $('lxProductHotelCategory').textContent=state.customHotel?'Hotel alternativo solicitado':
    (!hasHotelIncluded?'Puedes solicitar un hotel adicional':
      (currentTier()?.stars||'Hotel')+' · '+(currentTier()?.name||'Categoría prevista'));

  $('lxProductHotelStatus').textContent=state.customHotel?
    'Sujeto a disponibilidad y cotización del cambio':
    !hasHotelIncluded?'Este paquete no incluye noches de hotel.':
    'Alojamiento incluido · '+(state.roomPlan||(state.occupancy==='double'?'habitación doble':state.occupancy==='single'?'habitación simple':state.occupancy==='matrimonial'?'habitación matrimonial':state.occupancy==='triple'?'habitación triple':'habitación familiar'));
  const flightText=$('lxProductSelectedFlight');
  const selected=state.flight;
  if(selected){
    const firstOut=selected.outbound?.[0],lastOut=selected.outbound?.at(-1);
    const firstBack=selected.inbound?.[0],lastBack=selected.inbound?.at(-1);
    const lateReturn=state.date&&selected.returnDate>addDays(state.date,params.nights);
    flightText.textContent=selected.airline+' · Ida '+flightTime(firstOut?.from?.time)+
      ' a '+flightTime(lastOut?.to?.time)+', regreso '+flightTime(firstBack?.from?.time)+
      ' a '+flightTime(lastBack?.to?.time)+' · '+fmt(priceFlight())+
      (state.baggage==='checked'?' · Equipaje facturado por cotizar':'')+
      (lateReturn?' · Noche adicional por cotizar':'');
  }else flightText.textContent='Vuelos no incluidos';
  $('lxProductOpenFlights').textContent=state.flight?'Cambiar vuelos':'Buscar vuelos';
  renderHotelPhoto();
  window.dispatchEvent(new CustomEvent('latam:packagequotechange',{detail:getSelection()}));
 }
 $('lxProductOpenFlights').addEventListener('click',()=>{syncFlightForm();flights.show()});
 $('lxProductOpenHotel').addEventListener('click',()=>{syncHotelForm();hotels.show()});
 let hotelsPendingName=state.customHotel;
 $('lxHotelApply').addEventListener('click',()=>{
  state.tier=$('lxHotelTier').value;state.occupancy=$('lxHotelOccupancy').value;
  state.hotelPicked=true;state.customHotel=hotelsPendingName;
  state.roomPlan=pendingRoomPlan?.label||'';
  state.hotelQuotePending=Boolean(pendingRoomPlan?.pending||hotelsPendingName||!hasHotelIncluded);
  update();hotels.hide();
 });
 const endpoint=()=>String(window.LATAM_FLIGHTS_API_URL||'');
 const endpointOK=()=>/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint());
 function callApi(params){
  if(!endpointOK())return Promise.reject(Error('La consulta no está disponible en este momento.'));
  return new Promise((resolve,reject)=>{
   const cb='latamFlightCb_'+Date.now()+Math.random().toString(36).slice(2,9);
   const url=new URL(endpoint());Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,String(v)));url.searchParams.set('callback',cb);
   const script=el('script');let done=false;
   const timer=setTimeout(()=>finish(Error('La consulta tardó demasiado. Vuelve a intentarlo.')),65000);
   function finish(error,data){if(done)return;done=true;clearTimeout(timer);delete window[cb];script.remove();error?reject(error):resolve(data)}
   window[cb]=data=>finish(null,data);script.onerror=()=>finish(Error('El servicio no respondió. Comprueba el despliegue público de Apps Script.'));
   script.src=url.href;document.head.append(script);
  });
 }
 function flightTime(s){const found=String(s||'').match(/\d\d:\d\d/);return found?found[0]:'—'}
 function legSummary(leg){const s=leg?.segments||[],a=s[0]||{},b=s[s.length-1]||{};
  return (a.airline||'Aerolínea')+' · '+flightTime(a.from?.time)+' '+(a.from?.code||'')+
   ' → '+flightTime(b.to?.time)+' '+(b.to?.code||'')+' · '+(s.length<=1?'Directo':(s.length-1)+' escala(s)');}
 function signature(leg){return JSON.stringify((leg?.segments||[]).map(s=>
   [s.airline,s.flightNumber,s.from?.code,s.from?.time,s.to?.code,s.to?.time]))}
 function flightCard(leg,price,selected,action){
 const seg=leg?.segments||[],a=seg[0]||{},b=seg[seg.length-1]||{};
 const card=el('button','lx-flight-choice'+(selected?' is-selected':''));card.type='button';
 card.setAttribute('aria-pressed',String(selected));card.append(el('span','lx-choice-radio',''));
 const body=el('span','lx-flight-choice-content'),brand=el('span','lx-flight-choice-brand');
 brand.append(el('span','lx-flight-airline-mark','✈'),el('strong','',a.airline||'Aerolínea'));
 const route=el('span','lx-flight-route'),depart=el('span','lx-flight-stop'),arrive=el('span','lx-flight-stop');
 depart.append(el('strong','',flightTime(a.from?.time)),el('small','',a.from?.code||'Origen'));
 arrive.append(el('strong','',flightTime(b.to?.time)),el('small','',b.to?.code||'Destino'));
 route.append(depart,el('span','lx-flight-route-middle',seg.length<=1?'Directo':(seg.length-1)+' escala(s)'),arrive);
 body.append(brand,route);
 const cost=el('span','lx-flight-choice-price');cost.append(el('strong','',fmt(price)),el('small','','Ida y vuelta · grupo'));
 card.append(body,cost);card.addEventListener('click',action);return card;
}
 function renderFlightOffers(){
  const departures=$('lxFlightDepartures'),returns=$('lxFlightReturns');
  departures.replaceChildren();returns.replaceChildren();
  if(!state.offers.length)return;
  const groups=new Map();
  state.offers.forEach(o=>{const key=signature(o.outbound);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o)});
  departures.append(el('h3','lx-package-options-title','1. Selecciona tu vuelo de ida'));
  groups.forEach((options,key)=>{
   const cheapest=options.reduce((best,o)=>o.price<best.price?o:best,options[0]);
   departures.append(flightCard(cheapest.outbound,Math.round(Number(cheapest.price)*(1+flightMarkup(cheapest.departure))*100)/100,
    key===state.outboundKey,()=>{state.outboundKey=key;state.choice=null;renderFlightOffers()}));
  });
  if(state.outboundKey){
   returns.append(el('h3','lx-package-options-title','2. Selecciona tu vuelo de regreso'));
   (groups.get(state.outboundKey)||[]).forEach(offer=>{
    const adjusted=Math.round(Number(offer.price)*(1+flightMarkup(offer.departure))*100)/100;
    returns.append(flightCard(offer.inbound,adjusted,state.choice===offer,()=>{
      state.choice=offer;renderFlightOffers();$('lxFlightConfirmedTotal').textContent=fmt(adjusted)+' · Grupo completo';
      $('lxFlightApply').disabled=false;
    }));
   });
  }else returns.append(el('p','lx-package-status','El precio corresponde a ida + regreso; elige primero la ida.'));
  if(!state.choice){$('lxFlightConfirmedTotal').textContent='Selecciona ida y regreso';$('lxFlightApply').disabled=true}
 }
 $('lxProductSearchFlights').addEventListener('click',async ()=>{
  const airport=$('lxFlightOrigin').value,out=$('lxFlightDeparture').value,ret=$('lxFlightReturn').value;
  const arrival=$('lxFlightArrival').value;
  const adults=Number($('lxFlightAdults').value),children=Number($('lxFlightChildren').value);
  if(adults+children>9){setStatus(flightStatus,'Máximo 9 viajeros en esta consulta.',true);return}
  if(!dateOK(arrival)||arrival<minDate||!dateOK(out)||out<minDate||!dateOK(ret)||ret<addDays(arrival,params.nights)||out>arrival){
   setStatus(flightStatus,'Elige una llegada y fechas válidas de ida y regreso.',true);return}
  if(airport===params.destination){setStatus(flightStatus,'La ciudad de salida y el destino deben ser diferentes.',true);return}
  if(!params.destination){setStatus(flightStatus,'Este destino aún no cuenta con consulta de vuelos integrada.',true);return}
  $('lxProductSearchFlights').disabled=true;
  state.date=arrival;state.adults=adults;state.children=children;state.origin=airport;
  state.hotelPicked=false;state.occupancy=defaultRoom();state.roomPlan='';state.hotelQuotePending=false;state.customHotel='';state.childrenAges=[];
  invalidateFlight();update();
  setStatus(flightStatus,'Buscando combinaciones de ida y regreso…');
  try{
   const result=await callApi({origin:airport,destination:params.destination,departure:out,returnDate:ret,
    trip:'roundtrip',adults,children,cabin:'economy'});
   if(!result?.ok)throw Error(result?.message||'No hay vuelos disponibles para esta búsqueda.');
   state.offers=(Array.isArray(result.offers)?result.offers:[]).filter(o=>
     Number(o.price)>0&&o.outbound?.segments?.length&&o.inbound?.segments?.length&&
     o.departure===out&&o.returnDate===ret&&Number(o.partyAdults)===adults&&Number(o.partyChildren)===children&&
     (!dateOK(String(o.outbound.segments.at(-1)?.to?.time||'').slice(0,10))||
       String(o.outbound.segments.at(-1).to.time).slice(0,10)===state.date)).slice(0,30);
   setStatus(flightStatus,state.offers.length?
    state.offers.length+' combinaciones encontradas. Elige ida y regreso.':
    'No encontramos combinaciones que lleguen en la fecha de inicio del paquete.',!state.offers.length);
   renderFlightOffers();
  }catch(err){setStatus(flightStatus,err?.message||'No se pudieron consultar vuelos.',true)}
  finally{$('lxProductSearchFlights').disabled=false}
 });
 $('lxFlightApply').addEventListener('click',()=>{
  const offer=state.choice;if(!offer)return;
  const d=$('lxFlightDeparture').value,returnDate=$('lxFlightReturn').value;
  const adults=Number($('lxFlightAdults').value),children=Number($('lxFlightChildren').value);
  state.origin=$('lxFlightOrigin').value;
  state.adults=adults;state.children=children;
  if(!state.hotelPicked)state.occupancy=defaultRoom();
  state.baggage=$('lxFlightCheckedBag').checked?'checked':'none';
  state.flight={observedPrice:Number(offer.price),
   displayedPrice:Math.round(Number(offer.price)*(1+flightMarkup(d))*100)/100,
   origin:state.origin,destination:params.destination,departure:d,returnDate,
   airline:String(offer.airline||offer.outbound.segments[0]?.airline||'Aerolínea').slice(0,80),
   outbound:(offer.outbound.segments||[]).slice(0,6).map(s=>({airline:s.airline,flightNumber:s.flightNumber,from:s.from,to:s.to})),
   inbound:(offer.inbound.segments||[]).slice(0,6).map(s=>({airline:s.airline,flightNumber:s.flightNumber,from:s.from,to:s.to}))};
  update();flights.hide();
 });
 $('lxProductLookupHotels').addEventListener('click',async ()=>{
  if(!state.date){setStatus(hotelStatus,'Elige primero la fecha de llegada.',true);return}
  if(!params.destination){setStatus(hotelStatus,'Este destino todavía no dispone de búsqueda hotelera.',true);return}
  if(state.adults+state.children>4){setStatus(hotelStatus,'Para más de 4 huéspedes, solicita una distribución de habitaciones personalizada.',true);return}
  if(state.children>2){setStatus(hotelStatus,'La búsqueda admite máximo 2 niños por habitación.',true);return}
  const ages=state.children?[...$('lxHotelAgesBox').querySelectorAll('[data-child-age]')].map(x=>Number(x.value)):[];
  if(state.children&&(ages.length!==state.children||ages.some(a=>!Number.isInteger(a)||a<1||a>17))){
   setStatus(hotelStatus,'Indica la edad de cada niño para obtener tarifas correctas.',true);return}
  state.childrenAges=ages;
  const btn=$('lxProductLookupHotels');btn.disabled=true;setStatus(hotelStatus,'Buscando opciones de hoteles…');
  try{
   const result=await callApi({mode:'hotels',destination:'Medellín, Colombia',
    check_in_date:state.date,check_out_date:addDays(state.date,params.nights),
    adults:state.adults,children:state.children,children_ages:ages.join(',')});
   if(!result?.ok)throw Error(result?.message||'No hay opciones para estas fechas.');
   const list=$('lxHotelLookupOptions');list.replaceChildren();
   const options=(Array.isArray(result.hotels)?result.hotels:[]).slice(0,12);
   if(!options.length){setStatus(hotelStatus,'No se encontraron hoteles para esas fechas.');return}
   setStatus(hotelStatus,'Elige un hotel alternativo. Confirmaremos su suplemento antes de finalizar la reserva.');
   options.forEach(h=>{
    if(!h?.name)return;
    const card=el('button','lx-package-offer lx-hotel-live-card');card.type='button';
    const left=el('span');
    if(validSrc(h.thumbnail)){const img=el('img');img.src=h.thumbnail;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';left.append(img);
     state.hotelPhotos[String(h.name).toLowerCase()]=h.thumbnail;}
    left.append(el('b','',h.name),
     el('small','',h.nightlyRate?fmt(h.nightlyRate)+' / noche · tarifa del proveedor, no suplemento': 'Suplemento por confirmar'));
    card.append(left,el('strong','','Consultar'));
    card.addEventListener('click',()=>{
      hotelsPendingName=h.name;
      list.querySelectorAll('.lx-package-offer').forEach(x=>x.classList.remove('is-selected'));
      card.classList.add('is-selected');
      $('lxHotelExtraStatus').textContent='Cambio solicitado: '+h.name+' · suplemento por confirmar';
    });
    list.append(card);
   });
   renderHotelCards();renderHotelPhoto();
  }catch(err){setStatus(hotelStatus,err?.message||'No se pudo consultar hoteles.',true)}
  finally{btn.disabled=false}
 });
 // Al cambiar el tipo de categoría oficial se cancela la sustitución externa.
 $('lxHotelTier').addEventListener('change',()=>{hotelsPendingName=''});
 $('lxHotelOccupancy').addEventListener('change',()=>{hotelsPendingName=''});
 // Para más de cuatro viajeros, no presentar como un precio listo para cobrarse.
 book.addEventListener('click',event=>{
  if(state.adults+state.children<=maxHotelOccupancy)return;
  event.preventDefault();event.stopImmediatePropagation();
  const note=$('lxProductQuoteNote');
  note.textContent='Para este grupo necesitamos confirmar la distribución hotelera. '+
    'Escríbenos para una cotización completa antes de reservar.';
  const link=el('a','','Solicitar cotización por WhatsApp');
  link.href='https://wa.me/51906472060?text='+encodeURIComponent(
   'Hola, quiero cotizar '+params.title+' para '+passengerText()+
   (state.date?', llegada '+state.date:'')+'.');
  link.target='_blank';link.rel='noopener noreferrer';link.style.display='block';link.style.marginTop='8px';
  note.append(link);note.scrollIntoView({behavior:'smooth',block:'center'});
 },true);
 update();
 // Mantener fechas y viajeros en enlace al volver a buscar en el catálogo.
 const findPage=document.querySelector('a[href*="paquetes.html"]');
 if(findPage&&state.date){const u=new URL(findPage.href,location.href);u.searchParams.set('fecha',state.date);
  u.searchParams.set('adults',String(state.adults));u.searchParams.set('children',String(state.children));}
})();
