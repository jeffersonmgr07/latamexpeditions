/* LATAM Expeditions · Selector de vuelos, alojamiento y datos heredados para fichas de paquetes.
   Importes informativos. Nunca emite billetes ni confirma un hotel. */
(() => {
 'use strict';
 const startProductUI = () => {
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
  destination:String(book.dataset.bookDestination||(/^medellin-/.test(book.dataset.book||'')?'MDE':'')).toUpperCase(),
  destinationPlace:String(book.dataset.bookDestinationLabel||(/^medellin-/.test(book.dataset.book||'')?'Medellín, Colombia':'')),
  title:book.dataset.bookTitle||'',base:Number(book.dataset.bookPrice)||0,
  childFactor:Number(book.dataset.bookChildFactor||.7)};
 let tiers=[];try{tiers=JSON.parse(book.dataset.bookTiers||'[]')}catch(_){}
 const firstTier=tiers[0]||null;
 const multiCityAtacama=params.slug==='chile-atacama-5d4n';
 const flightStayNights=multiCityAtacama?3:params.nights;
 const hasHotelIncluded=Boolean(firstTier&&!firstTier.noAccommodation&&firstTier.code!=='sin-hotel');
 const maxHotelOccupancy=4;
 const defaults={'Perú':'LIM','Colombia':'BOG','Argentina':'EZE','Chile':'SCL','México':'MEX',
  'Brasil':'GRU','Ecuador':'UIO','Bolivia':'LPB','Venezuela':'CCS','Costa Rica':'SJO','Uruguay':'MVD'};
 let country='';try{country=localStorage.getItem('latam_country')||''}catch(_){}
 const state={
  date:dateOK(q.get('fecha'))&&q.get('fecha')>=minDate?q.get('fecha'):
    dateOK(book.dataset.bookDefaultArrival)&&book.dataset.bookDefaultArrival>=minDate?
      book.dataset.bookDefaultArrival:'',
  adults:Math.max(1,Math.min(9,Number(q.get('adults'))||Number(q.get('viajeros'))||2)),
  children:Math.max(0,Math.min(8,Number(q.get('children'))||0)),
  origin:(params.slug==='chile-atacama-5d4n'?'SCL':q.get('origen')||defaults[country]||'LIM').toUpperCase(),
  tier:firstTier?.code||'',occupancy:'double',hotelPicked:false,customHotel:'',
  hotelPhotos:{},couponCode:'',roomPlan:'',hotelQuotePending:false,hotelAlternative:null,childrenAges:[],flight:null,baggage:'none',offers:[],outboundKey:'',choice:null,flightStage:'outbound',flightSearch:null
 };
 if(state.adults+state.children>9)state.children=Math.max(0,9-state.adults);
 function defaultRoom(){
   const n=state.adults+state.children;
   return n===1?'single':n===3?'triple':n===4?'family':'double';
 }
 state.occupancy=defaultRoom();
 if(!/^[A-Z]{3}$/.test(state.origin))state.origin='LIM';
 const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=String(txt);return e};
 const normalizeHotelName=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const validSrc=s=>/^https:\/\/[^<>"'\s]+$/.test(s||'');
  // Archivos locales: se activan automáticamente cuando se suben a assets/img/.
  const hotelImages={
    'hotel terrantai':'hotel-terrantai-01.jpg','terrantai boutique':'hotel-terrantai-01.jpg',
    'hotel panamericano santiago':'hotel-panamericano-santiago-01.jpg',
    'hostal la ruca':'hostal-la-ruca-01.jpg',
    'cumbres lastarria':'cumbres-lastarria-01.jpg',
    'hotel cumbres san pedro':'hotel-cumbres-san-pedro-01.jpg',
    'the singular santiago':'the-singular-santiago-01.jpg',
    'tierra atacama':'tierra-atacama-01.jpg'
  };
  const hotelImageUrl=name=>hotelImages[normalizeHotelName(name)]?
    new URL((document.documentElement.dataset.base||'../')+'assets/img/'+hotelImages[normalizeHotelName(name)],location.href).href:'';
  const hotelPhotoElement=(name,cls)=>{const src=hotelImageUrl(name);if(!src)return null;
    const photo=el('img',cls);photo.src=src;photo.alt='Imagen de '+name;photo.loading='lazy';
    photo.style.cssText='width:100%;height:100%;max-height:130px;object-fit:cover;border-radius:9px';
    photo.addEventListener('error',()=>photo.remove(),{once:true});return photo;
  };
 function currentTier(){return tiers.find(x=>x.code===state.tier)||firstTier}
 function pricePackage(){const tier=currentTier();const rate=tier?Number(tier.occupancyPrices?.[state.occupancy]??tier.pricePerPerson??params.base):params.base;
  return Math.round((state.adults*rate+state.children*rate*params.childFactor)*100)/100;
 }
 let quoteRevision=0;
 function resetSelections(){
  quoteRevision++;
  state.tier=firstTier?.code||'';
  state.occupancy=defaultRoom();state.roomPlan='';state.hotelQuotePending=false;
  state.hotelPicked=false;state.customHotel='';state.hotelAlternative=null;state.childrenAges=[];
  state.hotelPhotos={};state.baggage='none';invalidateFlight();clearHotelLookup();
 }
 function priceFlight(){return state.flight?.displayedPrice||0}
 function extraHotelCost(){return state.customHotel?Number(state.hotelAlternative?.supplement||0):0}
 function discountAmount(){return state.couponCode==='LATAM10'?Math.round(pricePackage()*10)/100:0}
 function total(){return Math.round((pricePackage()+priceFlight()+extraHotelCost()-discountAmount())*100)/100}
 function passengerText(){return state.adults+(state.adults===1?' adulto':' adultos')+(state.children?', '+state.children+(state.children===1?' niño':' niños'):'')}
 function flightMarkup(date){const n=Math.round((new Date(date+'T12:00:00')-new Date(localISO(new Date())+'T12:00:00'))/86400000);
  return n<=30?.1:n<=45?.05:n<=90?0:n<=180?-.05:n<=270?-.1:-.15;
 }
 function getSelection(){return {slug:params.slug,date:state.date,adults:state.adults,children:state.children,
  tier:state.tier,occupancy:state.occupancy,customHotel:state.customHotel,
  hotelAlternative:state.hotelAlternative?{...state.hotelAlternative}:null,hotelSupplement:extraHotelCost(),
  roomPlan:state.roomPlan,hotelQuotePending:state.hotelQuotePending,
  flight:state.flight?{...state.flight,baggage:state.baggage}:null,
  totalEstimate:total(),packageEstimate:pricePackage(),couponCode:state.couponCode,discountAmount:discountAmount(),origin:state.origin};}
 window.LatamPackageDetails={getSelection};
 function removeInternalNotes(){
  const facts=main.querySelector('.tour-facts.product-facts');
  if(facts){const useful=[...facts.children].filter(div=>/duraci[oó]n|comidas|idiomas/i.test(div.querySelector('span')?.textContent||''));
   if(useful.length){facts.replaceChildren(...useful)}
  }
  side.querySelectorAll('.fact-row,.dynamic-rate-note,.tour-booking-note,.package-flights-box').forEach(x=>x.remove());
  // La selección de hotel se hace en el modal: evitar tabla duplicada en la ficha.
  main.querySelectorAll(':scope > .detail-card').forEach(card=>{
    if(/^Categor[ií]as? de alojamiento\b/i.test(card.querySelector(':scope > h2')?.textContent?.trim()||''))card.remove();
  });
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
  '<div class="lx-travel-field"><label for="lxProductTotalPax">Viajeros</label><button id="lxProductTotalPax" class="lx-travel-trigger" type="button">2 viajeros</button></div></div>'+
  '<div id="lxProductPriceDetails" class="lx-package-price-details" aria-live="polite"></div>'+
  '<div class="lx-product-coupon" style="margin:12px 0"><label for="lxCouponCode" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600">Código de descuento</label><div style="display:flex;gap:8px"><input id="lxCouponCode" maxlength="32" placeholder="Ingresa tu cupón" style="min-width:0;flex:1;border:1px solid #ccd6d0;border-radius:9px;padding:10px"><button type="button" id="lxCouponApply" style="border:0;background:#176b45;color:white;border-radius:9px;padding:10px 15px">Aplicar</button></div><small id="lxCouponNotice" role="status" aria-live="polite" style="display:block;margin-top:6px"></small></div>'+
  '<div class="lx-package-quick-total"><small>Total a pagar</small><strong id="lxProductGroupPrice"></strong></div>'+
  '<div id="lxProductFlightPrice" class="lx-package-flight-price" hidden></div>'+
  '<p class="lx-package-addons-note" id="lxProductQuoteNote">Elige la fecha y los viajeros para continuar.</p>';
 side.querySelector('.price-block')?.after(panel);
 $('lxCouponApply').addEventListener('click',()=>{
   const code=String($('lxCouponCode').value||'').trim().toUpperCase();
   state.couponCode=code==='LATAM10'?'LATAM10':'';
   $('lxCouponNotice').textContent=state.couponCode?'Descuento del 10 % aplicado al paquete. No incluye vuelos ni adicionales.':code?'Código no válido o no disponible.':'Cupón eliminado.';
   update();
 });
 $('lxCouponCode').addEventListener('input',()=>{
   if(state.couponCode&&$('lxCouponCode').value.trim().toUpperCase()!==state.couponCode){state.couponCode='';$('lxCouponNotice').textContent='Vuelve a aplicar el código.';update()}
 });
 $('lxProductDate').min=minDate;$('lxProductDate').value=state.date;
 const productCalendar=window.LatamProductControls.calendar($('lxProductDate'));
 $('lxProductDate').addEventListener('change',()=>{
   const next=$('lxProductDate').value;
   if(next!==state.date){state.date=next;resetSelections();}update();
 });
 const productTravelers=window.LatamProductControls.travelers(
   $('lxProductTotalPax'),
   ()=>({adults:state.adults,children:state.children}),
   ({adults,children})=>{
     if(adults!==state.adults||children!==state.children){state.adults=adults;state.children=children;resetSelections();}
     update();
   },
   {max:9,maxChildren:8}
 );
 const sectionAt=cards.find(x=>/^Itinerario/i.test(x.querySelector('h2')?.textContent||''))||
   main.querySelector('.package-itinerary')?.closest('section.detail-card');
 const addonFlights=el('section','lx-package-addon');
 addonFlights.innerHTML='<div class="lx-addon-row"><div><h2><i class="fa-solid fa-plane"></i> Añade vuelos a tu paquete</h2>'+
 '<p>Consulta vuelos a '+(params.destination==='CJC'?'Calama (CJC)':params.destination)+', o continúa sin añadirlos.</p></div>'+
 '<button type="button" id="lxProductOpenFlights">Buscar vuelos</button></div>'+
 '<div id="lxProductSelectedFlight" class="lx-package-status">Vuelos no incluidos</div>';
 const addonHotels=el('section','lx-package-addon');
 addonHotels.innerHTML='<h2><i class="fa-solid fa-bed"></i> Alojamiento del paquete</h2>'+
 '<div class="lx-package-hotel-item"><div class="lx-package-hotel-photo" id="lxProductHotelPhoto">'+
 '<span>Foto del hotel al consultar opciones</span></div><div><strong id="lxProductHotelName"></strong>'+
 '<small id="lxProductHotelCategory"></small><p id="lxProductHotelStatus"></p></div></div>'+
 '<div class="lx-addon-row"><span class="lx-package-addons-note">Puedes cambiar de categoría o solicitar otro hotel.</span>'+
 '<button type="button" id="lxProductOpenHotel">Elegir habitación u hotel</button></div>';
 if(multiCityAtacama){
   const flightIntro=addonFlights.querySelector('p');
   if(flightIntro){
     flightIntro.replaceChildren();
     const route=el('strong','','Santiago (SCL) → Calama (CJC) → Santiago (SCL)');
     route.style.cssText='display:block;margin:8px 0 5px;font-size:1rem;color:inherit';
     const explain=el('span','','Vuelo interno para llegar a San Pedro de Atacama · días 2 y 5 del itinerario.');
     explain.style.display='block';
     const separate=el('small','','¿Necesitas vuelos hacia o desde Santiago? También podemos cotizarlos por separado.');
     separate.style.cssText='display:block;margin-top:8px;line-height:1.5';
     flightIntro.append(route,explain,separate);
   }
   addonFlights.querySelector('h2').textContent='✈ Añade tus vuelos internos';
   addonFlights.querySelector('#lxProductOpenFlights').textContent='Buscar vuelos internos';
   const intro=addonHotels.querySelector('.lx-addon-row .lx-package-addons-note');
   if(intro)intro.textContent='Elige una categoría que incluye hotel en Santiago (1 noche) y San Pedro de Atacama (3 noches). Los cambios individuales se solicitan a un asesor.';
   const button=addonHotels.querySelector('#lxProductOpenHotel');
   if(button)button.textContent='Elegir categoría y habitación';
   const paired=el('div','lx-paired-hotels');
   paired.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin-top:12px';
   for(const [id,label] of [['lxSantiagoHotel','Santiago · 1 noche'],['lxAtacamaHotel','San Pedro de Atacama · 3 noches']]){
     const item=el('div','lx-paired-hotel');item.style.cssText='padding:12px;border:1px solid #dce6df;border-radius:12px';
     item.append(el('small','',label),el('strong','', ''));item.querySelector('strong').id=id;
     item.querySelector('strong').style.cssText='display:block;margin-top:5px';
     paired.append(item);
   }
   addonHotels.append(paired);
 }
 if(sectionAt){sectionAt.before(addonFlights,addonHotels)}
 else main.prepend(addonFlights,addonHotels);
 // En móvil, la fecha y los viajeros deben quedar antes de personalizar el paquete.
 const reserveShortcut=el('button','lx-mobile-book-shortcut','Reservar ahora');
 reserveShortcut.type='button';
 reserveShortcut.addEventListener('click',()=>book.click());
 panel.append(reserveShortcut);
 const mobileLayout=window.matchMedia('(max-width:900px)');
 const positionQuickPanel=()=>{
   if(mobileLayout.matches){
     if(panel.parentNode!==main||main.firstElementChild!==panel)main.prepend(panel);
     reserveShortcut.hidden=false;
   }else{
     if(panel.parentNode!==side)side.querySelector('.price-block')?.after(panel);
     reserveShortcut.hidden=true;
   }
 };
 positionQuickPanel();
 mobileLayout.addEventListener?.('change',positionQuickPanel);
 // Modal container (shared design for flights and hotels).
 function modal(id,title){
  const wrap=el('div','lx-package-modal');wrap.id=id;wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');
  const dialog=el('div','lx-package-dialog');const head=el('header','lx-package-modal-head');
  const heading=el('h2','',title),close=el('button','lx-package-close','×');close.type='button';close.setAttribute('aria-label','Cerrar');
  const body=el('div','lx-package-modal-body');head.append(heading,close);dialog.append(head,body);wrap.append(dialog);
  document.body.append(wrap);
  let last=null;
  function hide(){
    wrap.querySelectorAll('.lx-date-calendar,.lx-travel-popover').forEach(node=>{node.hidden=true});
    wrap.querySelectorAll('[aria-expanded="true"]').forEach(node=>node.setAttribute('aria-expanded','false'));
    wrap.classList.remove('is-open');document.body.style.overflow='';last?.focus?.();
  }
  function show(){last=document.activeElement;wrap.classList.add('is-open');document.body.style.overflow='hidden';close.focus()}
  close.addEventListener('click',hide);wrap.addEventListener('click',e=>{if(e.target===wrap)hide()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&wrap.classList.contains('is-open'))hide()});
  return {body,hide,show,wrap};
 }
 const flights=modal('lxProductFlightsModal','Elige tus vuelos');
 flights.body.innerHTML=
 '<div class="lx-flight-search-context"><div class="lx-flight-context-heading"><small>Itinerario de vuelos</small><div id="lxFlightSearchSummary" class="lx-flight-search-summary" role="group" aria-label="Resumen de vuelos">Preparando búsqueda…</div></div>'+
 '<button type="button" id="lxFlightEditBtn" aria-expanded="false" aria-controls="lxFlightSearchPanel">Editar búsqueda</button></div>'+
 '<div id="lxFlightSearchPanel" class="lx-flight-search-panel" hidden><div class="lx-package-modal-fields">'+
 '<label>Salida desde<select id="lxFlightOrigin">'+
 ['LIM|Lima','BOG|Bogotá','CUZ|Cusco','MDE|Medellín','CLO|Cali','CTG|Cartagena',
  'AQP|Arequipa','EZE|Buenos Aires','AEP|Buenos Aires (Aeroparque)','GIG|Río de Janeiro',
  'PUQ|Punta Arenas','SCL|Santiago','MEX|Ciudad de México','UIO|Quito',
  'GRU|São Paulo','PTY|Ciudad de Panamá','MIA|Miami','CCS|Caracas'].map(s=>{
  const [code,label]=s.split('|');return '<option value="'+code+'">'+label+' ('+code+')</option>';
 }).join('')+'</select></label>'+
 '<label>Vuelo de ida<input type="date" id="lxFlightDeparture"></label>'+
 '<label>Vuelo de regreso<input type="date" id="lxFlightReturn"></label>'+
 '<input type="hidden" id="lxFlightArrival"><input type="hidden" id="lxFlightAdults"><input type="hidden" id="lxFlightChildren">'+
 '<div class="lx-travel-field"><label for="lxFlightTravelers">Viajeros</label>'+
 '<button type="button" id="lxFlightTravelers" class="lx-travel-trigger">2 viajeros</button></div>'+
 '</div><div class="lx-flight-editor-actions">'+
 '<button type="button" class="lx-package-search" id="lxProductSearchFlights">Realizar búsqueda</button>'+
 '<button type="button" class="lx-search-cancel" id="lxFlightCancelEdit">Cancelar</button></div></div>'+
 '<div id="lxFlightSearchStatus" role="status" class="lx-package-status" aria-live="polite"></div>'+
 '<div id="lxFlightDepartures" class="lx-package-offers"></div><div id="lxFlightReturns" class="lx-package-offers" hidden></div>'+
 '<label class="lx-baggage-select" id="lxFlightBaggageRow" hidden><input type="checkbox" id="lxFlightCheckedBag"> Añadir equipaje facturado (tarifa por confirmar)</label>'+
 '<div class="lx-package-modal-bottom lx-flight-modal-bottom">'+
 '<button type="button" id="lxFlightBackStep" class="lx-flight-back" hidden>Volver a ida</button>'+
 '<div id="lxFlightConfirmedTotal" class="lx-flight-price-summary" role="status" aria-live="polite">Selecciona tu vuelo de ida</div>'+
 '<button type="button" id="lxFlightNextStep" disabled hidden>Continuar al regreso</button>'+
 '<button type="button" id="lxFlightApply" disabled hidden>Confirmar vuelos</button></div>';
 const hotels=modal('lxProductHotelsModal','Hotel y acomodación');
 hotels.body.innerHTML='<p class="lx-modal-lead">Encuentra el alojamiento que prefieras para tu viaje.</p>'+
 '<div hidden><select id="lxHotelTier">'+tiers.map(t=>'<option value="'+String(t.code).replace(/["<>]/g,'')+'">'+String(t.name||'').replace(/</g,'')+'</option>').join('')+'</select>'+
 '<select id="lxHotelOccupancy"><option value="single">Simple</option><option value="double">Doble</option><option value="matrimonial">Matrimonial</option><option value="triple">Triple</option><option value="family">Familiar</option></select></div>'+
 '<div id="lxHotelTierCards" class="lx-hotel-cards"></div>'+
 '<div id="lxHotelCurrentSummary" class="lx-package-status"></div>'+
 '<div id="lxHotelAgesBox" class="lx-hotel-age-box" hidden></div>'+
 '<button type="button" class="lx-package-search" id="lxProductLookupHotels">Ver otros hoteles del destino</button>'+
 '<div id="lxHotelLookupStatus" class="lx-package-status" role="status"></div>'+
 '<div id="lxHotelFilters" class="lx-hotel-filters" hidden>'+
 '<label class="lx-hotel-filter-name">Buscar hotel<input id="lxHotelNameSearch" type="search" placeholder="Nombre del hotel" autocomplete="off"></label>'+
 '<label>Categoría<select id="lxHotelStarsFilter"><option value="all">Todas</option><option value="3">3 estrellas</option><option value="4">4 estrellas</option><option value="5">5 estrellas</option></select></label>'+
 '<label>Ordenar<select id="lxHotelSort"><option value="recommended">Recomendados</option><option value="priceAsc">Menor precio</option><option value="priceDesc">Mayor precio</option><option value="rating">Mejor valoración</option></select></label>'+

 '<p class="lx-hotel-filter-help" id="lxHotelFilterHelp" aria-live="polite"></p>'+
 '</div>'+
 '<div id="lxHotelResultCount" class="lx-hotel-result-count" role="status" hidden></div>'+
 '<div id="lxHotelLookupOptions" class="lx-package-offers lx-hotel-alternatives"></div>'+
 '<button type="button" id="lxHotelLoadMore" class="lx-hotel-load-more" hidden>Mostrar más hoteles</button>'+
 '<div class="lx-package-modal-bottom"><span class="lx-package-quotes-extra" id="lxHotelExtraStatus"></span>'+
 '<button type="button" id="lxHotelApply">Confirmar alojamiento</button></div>';

 // Selectores de LATAM: lista visual propia, accesible y sin desplegable nativo.
 function lxStyleHotelSelect(id){
   const select=$(id);if(!select)return;
   const host=el('div','lx-hotel-custom-select');
   const trigger=el('button','lx-hotel-select-trigger');trigger.type='button';
   const list=el('div','lx-hotel-select-options');list.setAttribute('role','listbox');
   const setClosed=()=>{host.classList.remove('is-open');trigger.setAttribute('aria-expanded','false');};
   const sync=()=>{
     trigger.replaceChildren(el('span','',select.selectedOptions[0]?.textContent||'Seleccionar'),
       el('span','lx-hotel-select-chevron','⌄'));
     list.replaceChildren();
     [...select.options].forEach(option=>{
       const choice=el('button','lx-hotel-select-option'+(option.value===select.value?' is-selected':''),option.textContent);
       choice.type='button';choice.setAttribute('role','option');
       choice.setAttribute('aria-selected',String(option.value===select.value));
       choice.addEventListener('click',()=>{
         select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));
         sync();setClosed();trigger.focus();
       });
       list.append(choice);
     });
   };
   trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
   trigger.setAttribute('aria-label',select.closest('label')?.textContent?.trim().replace(select.textContent,'')||'Filtro');
   select.classList.add('lx-hotel-original-select');
   select.after(host);host.append(trigger,list);
   trigger.addEventListener('click',()=>{
     const wasOpen=host.classList.contains('is-open');
     hotels.body.querySelectorAll('.lx-hotel-custom-select.is-open').forEach(h=>{
       h.classList.remove('is-open');h.querySelector('button[aria-expanded]')?.setAttribute('aria-expanded','false');
     });
     if(!wasOpen){host.classList.add('is-open');trigger.setAttribute('aria-expanded','true');}
   });
   trigger.addEventListener('keydown',event=>{
     if(['ArrowDown','ArrowUp','Enter',' '].includes(event.key)){
       if(host.classList.contains('is-open')&&event.key==='Enter')return;
       event.preventDefault();host.classList.add('is-open');trigger.setAttribute('aria-expanded','true');
       const options=[...list.querySelectorAll('button')];options[Math.max(0,options.findIndex(o=>o.classList.contains('is-selected')))]?.focus();
     }
     if(event.key==='Escape')setClosed();
   });
   list.addEventListener('keydown',event=>{
     const items=[...list.querySelectorAll('button')];const index=items.indexOf(document.activeElement);
     if(event.key==='ArrowDown'||event.key==='ArrowUp'){
       event.preventDefault();items[(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();
     }else if(event.key==='Escape'){event.preventDefault();setClosed();trigger.focus();}
   });
   document.addEventListener('click',event=>{if(!host.contains(event.target))setClosed()});
   select._lxRefreshCustom=sync;
   select.addEventListener('change',sync);sync();
 }
 ['lxHotelStarsFilter','lxHotelSort'].forEach(lxStyleHotelSelect);

 const flightStatus=$('lxFlightSearchStatus'),hotelStatus=$('lxHotelLookupStatus');
 const outboundCalendar=window.LatamProductControls.calendar($('lxFlightDeparture'));
 const inboundCalendar=window.LatamProductControls.calendar($('lxFlightReturn'));
 const flightTravelers=window.LatamProductControls.travelers(
  $('lxFlightTravelers'),
  ()=>({adults:Number($('lxFlightAdults').value)||1,children:Number($('lxFlightChildren').value)||0}),
  counts=>{$('lxFlightAdults').value=String(counts.adults);$('lxFlightChildren').value=String(counts.children)},
  {max:9,maxChildren:6}
 );
 function setStatus(node,message,err=false,loading=false){
  node.replaceChildren();node.classList.toggle('is-error',err);node.classList.toggle('is-loading',loading);
  if(loading){const spin=el('span','lx-flight-spinner');spin.setAttribute('aria-hidden','true');node.append(spin,el('span','',message))}
  else node.textContent=message;
 }
 function currentFlightQuery(){
 return {origin:$('lxFlightOrigin').value,destination:params.destination,departure:$('lxFlightDeparture').value,
  returnDate:$('lxFlightReturn').value,arrival:$('lxFlightArrival').value,
  adults:Number($('lxFlightAdults').value),children:Number($('lxFlightChildren').value)};
}
function syncFlightReturnMin(){
 const outbound=$('lxFlightDeparture').value,ret=$('lxFlightReturn');
 // El regreso nunca puede ser anterior a la ida ni a la duración del paquete.
 const earliest=dateOK(outbound)?addDays(outbound,flightStayNights):minDate;
 ret.min=earliest;
 if(dateOK(outbound)&&(!dateOK(ret.value)||ret.value<earliest))ret.value=earliest;
 inboundCalendar.sync();
}
$('lxFlightDeparture').addEventListener('change',syncFlightReturnMin);
function syncFlightForm(){
 if(state.origin&&!Array.from($('lxFlightOrigin').options).some(o=>o.value===state.origin)){
  const option=el('option','',state.origin);option.value=state.origin;$('lxFlightOrigin').append(option);
 }
 const old=state.flightSearch;
 const reuse=old&&old.arrival===state.date&&old.adults===state.adults&&old.children===state.children&&old.origin===state.origin;
 $('lxFlightOrigin').value=state.origin;
 $('lxFlightAdults').value=String(Math.min(state.adults,9));
 $('lxFlightChildren').value=String(Math.min(state.children,6));
 $('lxFlightDeparture').min=minDate;
 $('lxFlightArrival').value=state.date||'';
 $('lxFlightDeparture').value=reuse?old.departure:(state.date?addDays(state.date,multiCityAtacama?1:0):'');
 $('lxFlightReturn').value=reuse?old.returnDate:(state.date?addDays(state.date,params.nights):'');
 if(multiCityAtacama){$('lxFlightOrigin').value='SCL';$('lxFlightOrigin').disabled=true;}
 syncFlightReturnMin();
 $('lxFlightCheckedBag').checked=false;
 outboundCalendar.sync();inboundCalendar.sync();flightTravelers.sync();
 renderFlightSearchSummary();
}
function renderFlightSearchSummary(){
 const query=currentFlightQuery();
 const en=(document.documentElement.lang||'es').toLowerCase().startsWith('en');
 const months=en?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']:
  ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
 const shortDate=value=>{
  const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m&&Number(m[2])>=1&&Number(m[2])<=12?
   Number(m[3])+' '+months[Number(m[2])-1]+' '+m[1]:(en?'To be defined':'Por definir');
 };
 const airports={MDE:'Medellín',CJC:'Calama · San Pedro de Atacama',LIM:'Lima',BOG:'Bogotá',CUZ:'Cusco',PUQ:'Punta Arenas',CLO:'Cali',
  CTG:'Cartagena',AQP:'Arequipa',EZE:'Buenos Aires',SCL:'Santiago',MEX:'Ciudad de México',
  UIO:'Quito',GRU:'São Paulo',GIG:'Río de Janeiro',AEP:'Buenos Aires',PTY:'Ciudad de Panamá',MIA:'Miami',CCS:'Caracas'};
 const origin=$('lxFlightOrigin').selectedOptions[0]?.textContent.replace(/\s*\([A-Z]{3}\)\s*$/,'')||
  airports[query.origin]||query.origin;
 const destination=airports[query.destination]||query.destination||(en?'Destination':'Destino');
 const count=query.adults+query.children;
 const summary=$('lxFlightSearchSummary');summary.replaceChildren();
 const items=[
  [en?'Route':'Ruta',origin+' – '+destination],
  [en?'Outbound':'Vuelo de ida',shortDate(query.departure)],
  [en?'Inbound':'Vuelo de regreso',shortDate(query.returnDate)],
  [en?'Travelers':'Viajeros',count+' '+(count===1?(en?'traveler':'viajero'):(en?'travelers':'viajeros'))]
 ];
 items.forEach(([label,value])=>{
  const item=el('span','lx-flight-summary-item');
  item.append(el('small','',label),el('strong','',value));summary.append(item);
 });
}
function toggleFlightEditor(open){
 $('lxFlightSearchPanel').hidden=!open;
 flights.body.querySelector('.lx-flight-search-context').hidden=open;
 flights.body.querySelector('.lx-flight-modal-bottom').hidden=open;
 if(open){
   setStatus(flightStatus,'');
   $('lxFlightDepartures').hidden=true;$('lxFlightReturns').hidden=true;
 }else if(state.offers.length){
   renderFlightOffers();
 }else{
   $('lxFlightDepartures').hidden=false;$('lxFlightReturns').hidden=true;
 }
 $('lxFlightEditBtn').setAttribute('aria-expanded',String(open));
}
$('lxFlightEditBtn').addEventListener('click',()=>toggleFlightEditor(true));
$('lxFlightCancelEdit').addEventListener('click',()=>{syncFlightForm();toggleFlightEditor(false)});
 function invalidateFlight(){
  state.flight=null;state.choice=null;state.offers=[];state.outboundKey='';state.flightStage='outbound';state.flightSearch=null;
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
// Solo ofrecer distribuciones cuyo precio esté definido para la categoría.
function supportedRoomPlans(tier,n){
 return roomPlans(n).filter(plan=>!plan.pending&&Number.isFinite(Number(tier?.occupancyPrices?.[plan.code]??tier?.pricePerPerson))&&Number(tier?.occupancyPrices?.[plan.code]??tier?.pricePerPerson)>0);
}
let pendingRoomPlan=null;
function syncHotelForm(){
 hotelsPendingName=state.customHotel;
 hotelsPendingSelection=state.hotelAlternative;
 $('lxHotelTier').value=state.tier;
 const plans=roomPlans(state.adults+state.children);
 pendingRoomPlan=supportedRoomPlans(currentTier(),state.adults+state.children).find(p=>p.label===state.roomPlan)||
  supportedRoomPlans(currentTier(),state.adults+state.children).find(p=>p.code===state.occupancy)||
  supportedRoomPlans(currentTier(),state.adults+state.children)[0]||plans[0];
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
 const box=$('lxHotelTierCards'),n=state.adults+state.children;box.replaceChildren();
 tiers.forEach(t=>{
  if(!t?.code)return;
  const card=el('article','lx-hotel-option-card'),media=el('div','lx-hotel-card-media');
  const name=(t.hotels||[]).join(' / ')||t.name||'Hotel previsto';
  const photo=state.hotelPhotos[normalizeHotelName((t.hotels||[])[0])];
  if(validSrc(photo)){const img=el('img');img.src=photo;img.alt=name;img.loading='lazy';img.referrerPolicy='no-referrer';media.append(img)}
  else media.append(el('span','lx-hotel-placeholder','⌂'),el('small','','Hotel'));
  const details=el('div','lx-hotel-card-details');
  details.append(el('strong','lx-hotel-card-name',name),el('small','lx-hotel-card-category',(t.stars||'')+' · '+(t.name||'')),
   el('p','lx-hotel-room-title','Selecciona tu acomodación'));
  const options=el('div','lx-hotel-room-options');
  options.setAttribute('role','radiogroup');options.setAttribute('aria-label','Habitaciones de '+name);
  supportedRoomPlans(t,n).forEach(plan=>{
   const selected=!hotelsPendingSelection&&$('lxHotelTier').value===t.code&&pendingRoomPlan?.label===plan.label;
   const button=el('button','lx-hotel-room-choice'+(selected?' is-selected':''));button.type='button';
   button.setAttribute('role','radio');button.setAttribute('aria-checked',String(selected));
   const rate=Number(t.occupancyPrices?.[plan.code]??t.pricePerPerson??params.base);
   const weight=state.adults+state.children*params.childFactor;
   const supplement=Math.round((rate-params.base)*weight*100)/100;
   // Mostrar únicamente la diferencia frente al paquete base para todo el grupo.
   const supplementLabel=!hasHotelIncluded?'No incluido':
     supplement>.005?'+ '+fmt(supplement):supplement<-.005?'− '+fmt(Math.abs(supplement)):'Incluido';
   button.append(el('span','lx-choice-radio',''),el('span','lx-room-copy',plan.label),
    el('strong','',supplementLabel));
   button.addEventListener('click',()=>{
    $('lxHotelTier').value=t.code;$('lxHotelOccupancy').value=plan.code;
    pendingRoomPlan=plan;hotelsPendingName='';hotelsPendingSelection=null;
    clearHotelLookup();renderHotelCards();showTierQuote();
   });
   options.append(button);
  });
  details.append(options);card.append(media,details);box.append(card);
 });
}
function showTierQuote(){
 if(hotelsPendingSelection){
  const h=hotelsPendingSelection;
  $('lxHotelCurrentSummary').textContent='Hotel alternativo: '+h.name+' · '+
    (h.pending?'suplemento por confirmar':h.supplement>0?'+ '+fmt(h.supplement)+' por el grupo':'sin costo adicional');
  $('lxHotelExtraStatus').textContent='Tarifa observada para '+h.nights+' noches, sujeta a disponibilidad del proveedor.';
  return;
 }
 const t=tiers.find(x=>x.code===$('lxHotelTier').value)||firstTier;
 const plan=pendingRoomPlan||roomPlans(state.adults+state.children)[0];
 if(!t)return;
 const rate=Number(t.occupancyPrices?.[plan.code]??t.pricePerPerson??params.base);
 const supplement=Math.round((rate-params.base)*(state.adults+state.children*params.childFactor)*100)/100;
 const supplementText=!hasHotelIncluded?' · alojamiento no incluido':
   supplement>.005?' · adicional + '+fmt(supplement)+' por el grupo':
   supplement<-.005?' · descuento − '+fmt(Math.abs(supplement))+' por el grupo':
   ' · sin costo adicional';
 $('lxHotelCurrentSummary').textContent=!hasHotelIncluded?'Este paquete no incluye hotel; solicitar cotización.':
  'Seleccionado: '+(t.hotels||[]).join(' / ')+' · '+plan.label+supplementText;
 $('lxHotelExtraStatus').textContent='Sujeto a disponibilidad al confirmar.';
}
 function renderHotelPhoto(){
  const name=state.customHotel||(hasHotelIncluded?((currentTier()?.hotels||[])[0]||''):'');
  const slot=$('lxProductHotelPhoto');slot.replaceChildren();
  if(!hasHotelIncluded&&!state.customHotel){slot.append(el('span','','Hotel no incluido'));return}
  const photo=state.hotelPhotos[normalizeHotelName(name)];
  if(validSrc(photo)){const image=el('img');image.src=photo;image.alt='Imagen de '+name;image.loading='lazy';image.referrerPolicy='no-referrer';slot.append(image)}
  else {
    const fallback=el('span','','Foto del hotel al consultar opciones');
    slot.append(fallback);
    const local=hotelPhotoElement(name,'lx-local-hotel-photo');
    if(local){local.style.maxHeight='none';local.addEventListener('load',()=>fallback.remove(),{once:true});slot.append(local)}
  }
 }

 function renderPriceBreakdown(){
   const rows=$('lxProductPriceDetails');rows.replaceChildren();
   const weight=state.adults+state.children*params.childFactor;
   const baseAmount=Math.round(params.base*weight*100)/100;
   const people=state.adults+' '+(state.adults===1?'adulto':'adultos')+
     (state.children?' · '+state.children+' '+(state.children===1?'niño':'niños'):'');
   function addLine(label,amount,pending=false,detail=''){
     const item=el('div','lx-package-cost-line');
     const description=el('span','',label);
     if(detail)description.append(el('small','lx-flight-pax-detail',detail));
     item.append(description,el('strong','',pending?'Por cotizar':fmt(amount)));
     if(pending)item.classList.add('is-pending');
     rows.append(item);
   }
   addLine('Paquete base',baseAmount,false,'('+people+')');
   const adjustment=Math.round((pricePackage()-baseAmount)*100)/100;
   if(Math.abs(adjustment)>=.01){
     const arrangement=state.roomPlan||roomPlans(state.adults+state.children).find(p=>p.code===state.occupancy)?.label||'';
     addLine(state.occupancy==='single'?'Acomodación de hotel':
       state.tier!==firstTier?.code?'Diferencia de tarifa hotelera':'Acomodación de hotel',adjustment,false,
       arrangement?'('+arrangement+')':'');
   }
   if(state.couponCode)addLine('Descuento · '+state.couponCode,-discountAmount());
   if(state.flight){
     const airlines=[...new Set([state.flight.outbound?.[0]?.airline,state.flight.inbound?.[0]?.airline].filter(Boolean))];
     addLine('Vuelos ida y vuelta · '+(airlines.join(' + ')||state.flight.airline),
       priceFlight(),false,'('+passengerText()+')');
   }
   if(state.customHotel&&state.hotelAlternative){
     const alt=state.hotelAlternative;
     const info='('+alt.nights+' '+(alt.nights===1?'noche':'noches')+' · '+(state.roomPlan||'habitación seleccionada')+')';
     addLine(hasHotelIncluded?'Cambio de hotel · '+alt.name:'Alojamiento · '+alt.name,
       extraHotelCost(),!!alt.pending,info);
   }else if(state.hotelQuotePending)addLine('Habitación o alojamiento adicional',0,true);
 }

 function update(){
  $('lxProductDate').value=state.date;
  productCalendar.sync();productTravelers.sync();
  renderPriceBreakdown();
  const needsGroupQuote=state.adults+state.children>maxHotelOccupancy||state.hotelQuotePending;
  $('lxProductGroupPrice').textContent=state.adults+state.children>maxHotelOccupancy?'Consultar':fmt(total());
  // Mostrar avisos solo cuando afectan al itinerario; nunca añadir textos de cotización al importe.
  const notice=state.adults+state.children>maxHotelOccupancy?'La distribución de habitaciones requiere una tarifa adicional.':
    state.hotelQuotePending?'El hotel alternativo solicitado está pendiente de cotizar y NO forma parte del pago. Se mantiene el hotel base del paquete.':
    state.flight&&state.date&&state.flight.returnDate>addDays(state.date,params.nights)?
      'El vuelo de regreso es posterior al final del paquete; verifica las noches adicionales.':
      state.flight&&state.baggage==='checked'?'El equipaje facturado no está incluido en esta tarifa.':'';
  const note=$('lxProductQuoteNote');note.textContent=notice;note.hidden=!notice;
  const flightPrice=$('lxProductFlightPrice');flightPrice.hidden=true;
  $('lxProductHotelName').textContent=state.customHotel||(!hasHotelIncluded?'Sin alojamiento':((currentTier()?.hotels||[]).join(' / ')||'Hotel incluido'));
  if(multiCityAtacama){
    const pair=currentTier()?.hotels||[];
    const santiago=$('lxSantiagoHotel'),atacama=$('lxAtacamaHotel');
    if(santiago)santiago.textContent=pair[0]||'Alojamiento por confirmar';
    if(atacama)atacama.textContent=pair[1]||'Alojamiento por confirmar';
    for(const [element,name] of [[santiago,pair[0]],[atacama,pair[1]]]){
      if(!element)continue;
      const holder=element.parentElement,existing=holder.querySelector('img.lx-paired-photo');
      if(existing?.dataset.hotel!==name)existing.remove();
      if(!holder.querySelector('img.lx-paired-photo')&&name){
        const photo=hotelPhotoElement(name,'lx-paired-photo');
        if(photo){photo.dataset.hotel=name;photo.style.marginTop='10px';holder.append(photo)}
      }
    }
  }

  $('lxProductHotelCategory').textContent=state.customHotel?'Hotel seleccionado':
    (!hasHotelIncluded?'Puedes solicitar un hotel adicional':
      (currentTier()?.stars||'Hotel')+' · '+(currentTier()?.name||'Categoría prevista'));

  $('lxProductHotelStatus').textContent=state.customHotel&&state.hotelAlternative?
    state.hotelAlternative.nights+' noches · '+(state.roomPlan||'habitación seleccionada')+' · '+
     (state.hotelQuotePending?'cambio pendiente de cotizar · no incluido en el pago':extraHotelCost()>0?'+ '+fmt(extraHotelCost())+' por la estancia':'sin recargo'):
    !hasHotelIncluded?'Este paquete no incluye noches de hotel.':
    'Alojamiento incluido · '+(state.roomPlan||(state.occupancy==='double'?'habitación doble':state.occupancy==='single'?'habitación simple':state.occupancy==='matrimonial'?'habitación matrimonial':state.occupancy==='triple'?'habitación triple':'habitación familiar'));
  let selectedHotelTotal=document.getElementById('lxSelectedHotelTotal');
  if(!selectedHotelTotal){selectedHotelTotal=el('div','lx-selected-hotel-total');
   selectedHotelTotal.id='lxSelectedHotelTotal';
   $('lxProductHotelStatus').after(selectedHotelTotal);}
  selectedHotelTotal.replaceChildren();
  if(state.customHotel&&state.hotelAlternative){
   selectedHotelTotal.append(el('span','','Cambio de hotel · adicional al paquete'),
     el('strong','',state.hotelQuotePending?'Por cotizar':extraHotelCost()>0?'+ '+fmt(extraHotelCost()):'Sin recargo'));
   selectedHotelTotal.hidden=false;
  }else selectedHotelTotal.hidden=true;
  const flightText=$('lxProductSelectedFlight');
  const selected=state.flight;flightText.replaceChildren();
  if(selected){
    const firstOut=selected.outbound?.[0],lastOut=selected.outbound?.at(-1);
    const firstBack=selected.inbound?.[0],lastBack=selected.inbound?.at(-1);
    const outAirline=firstOut?.airline||selected.airline;
    const backAirline=firstBack?.airline||selected.airline;
    const codeByAirline={'avianca':'AV','latam':'LA','latam airlines':'LA','jetsmart':'JA',
      'jetsmart airlines':'JA','copa':'CM','copa airlines':'CM','sky airline':'H2','wingo':'P5',
      'aerolíneas argentinas':'AR','gol':'G3','azul':'AD'};
    const logoCode=codeByAirline[String(outAirline||'').trim().toLowerCase()]||'';
    const supplied=String(selected.airlineLogo||'');
    const logo=/^https:\/\/www\.gstatic\.com\/flights\/airline_logos\/[0-9]+px\/[A-Za-z0-9_-]+\.png$/.test(supplied)?
      supplied:(logoCode?'https://www.gstatic.com/flights/airline_logos/70px/'+logoCode+'.png':'');
    const card=el('div','lx-chosen-flight');
    const brand=el('div','lx-chosen-flight-brand');
    const mark=el('span','lx-chosen-flight-mark','✈');
    if(logo){const img=el('img');img.src=logo;img.alt='';img.loading='lazy';
      img.onerror=()=>{img.remove();mark.textContent='✈'};mark.replaceChildren(img);}
    brand.append(mark,el('strong','',outAirline===backAirline?outAirline:outAirline+' + '+backAirline));
    card.append(brand);
    const shortDate=value=>dateOK(value)?
      new Intl.DateTimeFormat('es-PE',{day:'numeric',month:'short'}).format(new Date(value+'T12:00:00')):'';
    const line=(direction,date,first,last,airline)=>{
      const row=el('div','lx-chosen-flight-leg');
      const ico=el('i',direction==='Ida'?'fa-solid fa-plane-departure':'fa-solid fa-plane-arrival');ico.setAttribute('aria-hidden','true');
      const detail=el('span','lx-chosen-flight-leg-detail');
      detail.append(el('strong','',direction+' · '+shortDate(date)),
        el('span','',String(first?.from?.code||'')+' '+flightTime(first?.from?.time)+
          ' → '+String(last?.to?.code||'')+' '+flightTime(last?.to?.time)+
          (airline!==outAirline?' · '+airline:'')));
      row.append(ico,detail);return row;
    };
    card.append(line('Ida',selected.departure,firstOut,lastOut,outAirline),
      line('Regreso',selected.returnDate,firstBack,lastBack,backAirline));
    const price=el('div','lx-chosen-flight-total');
    price.append(el('span','','Tarifa total de vuelos · '+passengerText()),el('strong','',fmt(priceFlight())));
    card.append(price);
    if(state.baggage==='checked')card.append(el('small','','Equipaje facturado no incluido en la tarifa.'));
    if(state.date&&selected.returnDate>addDays(state.date,params.nights))
      card.append(el('small','','El regreso es posterior al final del paquete; revisa las noches adicionales.'));
    flightText.append(card);
  }else flightText.textContent='Vuelos no incluidos';
  $('lxProductOpenFlights').textContent=state.flight?'Cambiar vuelos':'Buscar vuelos';
  renderHotelPhoto();
  window.dispatchEvent(new CustomEvent('latam:packagequotechange',{detail:getSelection()}));
 }
 $('lxProductOpenFlights').addEventListener('click',()=>{
 syncFlightForm();flights.show();
 if(state.children>6){
  toggleFlightEditor(true);
  setStatus(flightStatus,'La consulta aérea admite hasta 6 niños. Ajusta la cantidad de viajeros.',true);
  return;
 }
 if(!params.destination){
  toggleFlightEditor(true);
  setStatus(flightStatus,'La búsqueda aérea de este paquete todavía no está habilitada.',true);
  return;
 }
 if(!state.date&&!state.flightSearch){
  toggleFlightEditor(true);
  setStatus(flightStatus,'Selecciona las fechas de ida y regreso para buscar vuelos.');
  return;
 }
  toggleFlightEditor(false);
 if(state.offers.length&&state.flightSearch){
  state.flightStage='outbound';state.outboundKey='';state.choice=null;renderFlightOffers();
  setStatus(flightStatus,'Elige tu vuelo de ida. Los precios corresponden a ida y regreso.');
 }else $('lxProductSearchFlights').click();
});
 $('lxProductOpenHotel').addEventListener('click',()=>{
 hotels.show();
 try{syncHotelForm();setStatus(hotelStatus,'')}catch(err){
  console.error('[LATAM] No pudo abrirse selector de alojamiento:',err);
  setStatus(hotelStatus,'No se pudieron cargar las habitaciones. Recarga la ficha y vuelve a intentar.',true);
 }
});
 let hotelsPendingName=state.customHotel;
 let hotelsPendingSelection=state.hotelAlternative;
 let hotelResults=[],hotelBudget=null,hotelPrivateReference=false,hotelQuery=null,hotelPage=0,hotelNextPage=null,hotelDisplayCount=10;
 const hotelLookupUi=$('lxHotelFilters');

 $('lxHotelApply').addEventListener('click',()=>{
  state.hotelPicked=true;
  if(hotelsPendingSelection){
    // Mantener la categoría y ocupación contra las que se calculó la diferencia.
    state.tier=hotelsPendingSelection.tierCode||state.tier;
    state.occupancy=hotelsPendingSelection.occupancy||defaultRoom();
    state.customHotel=hotelsPendingSelection.name;
    state.hotelAlternative={...hotelsPendingSelection};
    state.roomPlan=hotelsPendingSelection.roomPlan||roomPlans(state.adults+state.children).find(p=>p.code===state.occupancy)?.label||'';
    state.hotelQuotePending=Boolean(hotelsPendingSelection.pending);
  }else{
    state.tier=$('lxHotelTier').value;state.occupancy=$('lxHotelOccupancy').value;
    state.customHotel='';state.hotelAlternative=null;
    state.roomPlan=pendingRoomPlan?.label||'';
    state.hotelQuotePending=Boolean(!hasHotelIncluded);
  }
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
 function clearHotelLookup(){
  hotelResults=[];hotelBudget=null;hotelPrivateReference=false;hotelQuery=null;hotelPage=0;hotelNextPage=null;hotelDisplayCount=10;
  $('lxHotelLookupOptions').replaceChildren();$('lxHotelFilters').hidden=true;
  $('lxHotelResultCount').hidden=true;$('lxHotelLoadMore').hidden=true;
  const status=$('lxHotelLookupStatus');if(status)setStatus(status,'');
}
 function flightTime(s){const found=String(s||'').match(/\d\d:\d\d/);return found?found[0]:'—'}
 function legSummary(leg){const s=leg?.segments||[],a=s[0]||{},b=s[s.length-1]||{};
  return (a.airline||'Aerolínea')+' · '+flightTime(a.from?.time)+' '+(a.from?.code||'')+
   ' → '+flightTime(b.to?.time)+' '+(b.to?.code||'')+' · '+(s.length<=1?'Directo':(s.length-1)+' escala(s)');}
 function signature(leg){return JSON.stringify((leg?.segments||[]).map(s=>
   [s.airline,s.flightNumber,s.from?.code,s.from?.time,s.to?.code,s.to?.time]))}
 function flightCard(leg,price,selected,action,phase,partyCount,offer){
 const seg=leg?.segments||[],first=seg[0]||{},last=seg[seg.length-1]||{};
 const count=Math.max(1,Number(partyCount)||1);
 // La cotización devuelve una combinación de ida y vuelta para todo el grupo.
 const perPerson=Math.round(Number(price)/count*100)/100;
 const card=el('article','lx-flight-choice'+(selected?' is-selected':''));
 const select=el('button','lx-flight-choice-select');select.type='button';
 select.setAttribute('aria-pressed',String(selected));
 select.setAttribute('aria-label','Seleccionar vuelo '+(phase==='outbound'?'de ida':'de regreso'));
 select.append(el('span','lx-choice-radio',''));
 const body=el('span','lx-flight-choice-content'),brand=el('span','lx-flight-choice-brand');
 const airline=String(first.airline||leg?.airline||'Aerolínea');
 const brandIcon=el('span','lx-flight-airline-mark','✈');
 const codeByAirline={'avianca':'AV','latam':'LA','latam airlines':'LA','jetsmart':'JA','jetsmart airlines':'JA',
  'copa airlines':'CM','copa':'CM','sky airline':'H2','wingo':'P5',
  'aerolíneas argentinas':'AR','aerolineas argentinas':'AR','gol':'G3','azul':'AD'};
 const logoProvided=String(first.airlineLogo||first.logoUrl||leg?.airlineLogo||leg?.logoUrl||offer?.airlineLogo||'');
 const iata=codeByAirline[airline.toLowerCase().trim()]||'';
 const logo=/^https:\/\/www\.gstatic\.com\/flights\/airline_logos\/[0-9]+px\/[A-Za-z0-9_-]+\.png$/.test(logoProvided)?
  logoProvided:(iata?'https://www.gstatic.com/flights/airline_logos/70px/'+iata+'.png':'');
 if(logo){const img=el('img');img.alt='';img.loading='lazy';img.src=logo;
  img.onerror=()=>{img.remove();brandIcon.textContent='✈'};
  brandIcon.textContent='';brandIcon.append(img);}
 brand.append(brandIcon,el('strong','',airline));
 const route=el('span','lx-flight-route'),depart=el('span','lx-flight-stop'),arrive=el('span','lx-flight-stop');
 depart.append(el('strong','',flightTime(first.from?.time)),el('small','',first.from?.code||'Origen'));
 arrive.append(el('strong','',flightTime(last.to?.time)),el('small','',last.to?.code||'Destino'));
 const nStops=Math.max(0,seg.length-1);
 route.append(depart,el('span','lx-flight-route-middle',!nStops?'Directo':nStops+' escala(s)'),arrive);
 body.append(brand,route);
 const cost=el('span','lx-flight-choice-price');
 cost.append(el('strong','',fmt(perPerson)),
  el('small','','Precio por persona · ida y vuelta'));
 select.append(body,cost);select.addEventListener('click',action);card.append(select);
 if(nStops){
  const details=el('details','lx-flight-layovers'),summary=el('summary','','Ver '+nStops+' escala(s) y conexiones');
  const list=el('ol','lx-flight-layover-list');
  for(let i=0;i<nStops;i++){
   const layover=leg?.layovers?.[i]||{},airport=layover.id||seg[i]?.to?.code||'Aeropuerto';
   const mins=Number(layover.duration);
   const duration=Number.isFinite(mins)&&mins>0?Math.floor(mins/60)+' h '+String(mins%60).padStart(2,'0')+' min':
    'Tiempo de conexión por confirmar';
   const stop=el('li','lx-layover-item');const symbol=el('span','lx-layover-icon','✈');
   const content=el('div','lx-layover-copy');content.append(el('strong','',layover.name||airport),
    el('span','',airport+' · '+duration+(layover.overnight?' · Conexión nocturna':'')));
   const connection=seg[i+1];if(connection)content.append(el('small','',
    'Siguiente vuelo '+(connection.flightNumber||'')+' · '+(connection.airline||'Aerolínea')+
    ' · salida '+flightTime(connection.from?.time)));
   stop.append(symbol,content);list.append(stop);
  }
  details.append(summary,list);card.append(details);
 }
 return card;
}
 function showFlightPriceSummary(amount){
   const target=$('lxFlightConfirmedTotal'),count=state.adults+state.children;
   const badges=[
     ['Precio por persona · ida y vuelta',amount/Math.max(1,count),false],
     ['Precio total por '+count+' '+(count===1?'pasajero':'pasajeros'),amount,true]
   ];
   target.replaceChildren();
   badges.forEach(([label,value,isTotal])=>{
     const badge=el('span','lx-flight-price-badge'+(isTotal?' is-total':''));
     badge.append(el('small','',label),el('strong','',fmt(value)));
     target.append(badge);
   });
 }
 function renderFlightOffers(){
 const departures=$('lxFlightDepartures'),returns=$('lxFlightReturns');
 departures.replaceChildren();returns.replaceChildren();
 const returning=state.flightStage==='return';
 departures.hidden=returning;returns.hidden=!returning;
 const next=$('lxFlightNextStep'),back=$('lxFlightBackStep'),apply=$('lxFlightApply');
 next.hidden=returning;back.hidden=!returning;apply.hidden=!returning;
 $('lxFlightBaggageRow').hidden=true; // Sin tarifa de maleta verificada; no ofrecer recargo falso.
 if(!state.offers.length){next.disabled=true;apply.disabled=true;
   $('lxFlightConfirmedTotal').textContent='No hay vuelos seleccionados';return}
 const groups=new Map();
 state.offers.forEach(o=>{const key=signature(o.outbound);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o)});
 if(!returning){
  departures.append(el('h3','lx-package-options-title','Paso 1 · Selecciona tu vuelo de ida'));
  groups.forEach((options,key)=>{
   const cheapest=options.reduce((a,o)=>Number(o.price)<Number(a.price)?o:a,options[0]);
   const amount=Number(cheapest.displayedPrice)>0?Number(cheapest.displayedPrice):
    Math.round(Number(cheapest.price)*(1+flightMarkup(cheapest.departure))*100)/100;
   departures.append(flightCard(cheapest.outbound,amount,key===state.outboundKey,()=>{
     state.outboundKey=key;state.choice=null;renderFlightOffers();
   },'outbound',state.adults+state.children,cheapest));
  });
  next.disabled=!state.outboundKey;
  $('lxFlightConfirmedTotal').textContent=state.outboundKey?'Vuelo de ida elegido':'Selecciona un vuelo de ida';
 }else{
  returns.append(el('h3','lx-package-options-title','Paso 2 · Selecciona tu vuelo de regreso'));
  (groups.get(state.outboundKey)||[]).forEach(offer=>{
   const price=Number(offer.displayedPrice)>0?Number(offer.displayedPrice):
     Math.round(Number(offer.price)*(1+flightMarkup(offer.departure))*100)/100;
   returns.append(flightCard(offer.inbound,price,state.choice===offer,()=>{
     state.choice=offer;renderFlightOffers();
   },'return',state.adults+state.children,offer));
  });
  apply.disabled=!state.choice;
  const amount=state.choice?(Number(state.choice.displayedPrice)>0?Number(state.choice.displayedPrice):
    Math.round(Number(state.choice.price)*(1+flightMarkup(state.choice.departure))*100)/100):0;
  if(state.choice)showFlightPriceSummary(amount);
  else $('lxFlightConfirmedTotal').textContent='Selecciona un vuelo de regreso';
 }
}
$('lxFlightNextStep').addEventListener('click',()=>{
 if(!state.outboundKey)return;state.flightStage='return';renderFlightOffers();
 setStatus(flightStatus,'Selecciona tu vuelo de regreso. Las tarifas mostradas incluyen ida y vuelta.');
 $('lxFlightReturns').scrollIntoView({block:'nearest'});
});
$('lxFlightBackStep').addEventListener('click',()=>{state.flightStage='outbound';renderFlightOffers()});
 $('lxProductSearchFlights').addEventListener('click',async ()=>{
  const airport=$('lxFlightOrigin').value,out=$('lxFlightDeparture').value,ret=$('lxFlightReturn').value;
  const arrival=$('lxFlightArrival').value;
  const adults=Number($('lxFlightAdults').value),children=Number($('lxFlightChildren').value);
  if(adults+children>9||children>6){setStatus(flightStatus,'Máximo 9 viajeros y hasta 6 niños por consulta.',true);toggleFlightEditor(true);return}
  if(!dateOK(out)||out<minDate||!dateOK(ret)||ret<addDays(out,flightStayNights)){
   setStatus(flightStatus,'Selecciona fechas válidas de ida y regreso. El regreso debe permitir la duración del paquete.',true);
   toggleFlightEditor(true);return;
  }
  if(multiCityAtacama&&airport!=='SCL'){setStatus(flightStatus,'Este itinerario consulta vuelos internos Santiago–Calama–Santiago.',true);return}
  if(airport===params.destination){setStatus(flightStatus,'La ciudad de salida y el destino deben ser diferentes.',true);return}
  if(!params.destination){setStatus(flightStatus,'Este destino aún no cuenta con consulta de vuelos integrada.',true);return}
  $('lxProductSearchFlights').disabled=true;
  const occupancyChanged=state.adults!==adults||state.children!==children;
  state.adults=adults;state.children=children;state.origin=airport;
  if(occupancyChanged)resetSelections();else invalidateFlight();
  update();
  renderFlightSearchSummary();toggleFlightEditor(false);
  setStatus(flightStatus,'Buscando vuelos de ida y vuelta…',false,true);
  const requestedRevision=quoteRevision;
  try{
   const result=await callApi({origin:airport,destination:params.destination,departure:out,returnDate:ret,
    trip:'roundtrip',adults,children,cabin:'economy',package_slug:params.slug});
   if(requestedRevision!==quoteRevision)return;
   if(!result?.ok)throw Error(result?.message||'No hay vuelos disponibles para esta búsqueda.');
   state.flightSearch={origin:airport,departure:out,returnDate:ret,arrival:state.date||out,adults,children};
    state.flightStage='outbound';renderFlightSearchSummary();toggleFlightEditor(false);
    state.offers=(Array.isArray(result.offers)?result.offers:[]).filter(o=>
     Number(o.price)>0&&o.outbound?.segments?.length&&o.inbound?.segments?.length&&
     o.departure===out&&o.returnDate===ret&&Number(o.partyAdults)===adults&&Number(o.partyChildren)===children&&
     (()=>{const land=String(o.outbound.segments.at(-1)?.to?.time||'').slice(0,10);
       return dateOK(land)&&ret>=addDays(land,flightStayNights)})()).slice(0,30);
   setStatus(flightStatus,state.offers.length?
    'Encontramos '+state.offers.length+' '+(state.offers.length===1?'opción de vuelo':'opciones de vuelos')+'. Los precios mostrados incluyen ida y vuelta. Elige tu vuelo de ida.':
    'No encontramos vuelos compatibles con las fechas y la duración de este paquete.',!state.offers.length);
   renderFlightOffers();
  }catch(err){if(requestedRevision!==quoteRevision)return;toggleFlightEditor(true);setStatus(flightStatus,err?.message||'No se pudieron consultar vuelos.',true)}
  finally{$('lxProductSearchFlights').disabled=false}
 });
 $('lxFlightApply').addEventListener('click',()=>{
  const offer=state.choice;if(!offer)return;
  const d=$('lxFlightDeparture').value,returnDate=$('lxFlightReturn').value;
  const actualArrival=String(offer.outbound?.segments?.at(-1)?.to?.time||'').slice(0,10);
  if(dateOK(actualArrival)&&!multiCityAtacama){
    if(state.date&&state.date!==actualArrival)resetSelections();
    state.date=actualArrival;state.flightSearch={...state.flightSearch,arrival:actualArrival};
  }else if(!state.date){
    state.date=d;state.flightSearch={...state.flightSearch,arrival:d};
  }
  const adults=Number($('lxFlightAdults').value),children=Number($('lxFlightChildren').value);
  state.origin=$('lxFlightOrigin').value;
  state.adults=adults;state.children=children;
  if(!state.hotelPicked)state.occupancy=defaultRoom();
  if(state.customHotel&&state.hotelAlternative?.checkIn!==state.date){
   state.customHotel='';state.hotelAlternative=null;state.hotelPicked=false;state.roomPlan='';
   setStatus(hotelStatus,'La fecha de llegada cambió según el vuelo. Consulta nuevamente hoteles para esa fecha.',true);
  }
  state.baggage='none';
  state.flight={observedPrice:Number(offer.price),
   displayedPrice:Number(offer.displayedPrice)>0?Number(offer.displayedPrice):
     Math.round(Number(offer.price)*(1+flightMarkup(d))*100)/100,
   quoteToken:String(offer.quoteToken||''),
   origin:state.origin,destination:params.destination,departure:d,returnDate,
   airline:String(offer.airline||offer.outbound.segments[0]?.airline||'Aerolínea').slice(0,80),
   airlineLogo:String(offer.airlineLogo||offer.outbound?.segments?.[0]?.airlineLogo||'').slice(0,180),
   outbound:(offer.outbound.segments||[]).slice(0,6).map(s=>({airline:s.airline,flightNumber:s.flightNumber,from:s.from,to:s.to})),
   inbound:(offer.inbound.segments||[]).slice(0,6).map(s=>({airline:s.airline,flightNumber:s.flightNumber,from:s.from,to:s.to}))};
  update();flights.hide();
 });

 function stayPrice(h){
   const stay=Number(h?.totalRate)||0,nightly=Number(h?.nightlyRate)||0;
   return stay>0?stay:nightly>0?Math.round(nightly*params.nights*100)/100:0;
 }
 function extraForHotel(h){
   if(h&&h.supplementTotal!==undefined&&h.supplementTotal!==null&&
     Number.isFinite(Number(h.supplementTotal))&&Number(h.supplementTotal)>=0)
     return Math.round(Number(h.supplementTotal)*100)/100;
   if(hotelBudget===null||!(stayPrice(h)>0))return null;
   return Math.round(Math.max(0,stayPrice(h)-hotelBudget)*100)/100;
 }
 function filterHotels(){
   const search=normalizeHotelName($('lxHotelNameSearch').value);
   const stars=$('lxHotelStarsFilter').value;
   const sort=$('lxHotelSort').value;
   let list=hotelResults.filter(h=>{
     if(search&&!normalizeHotelName(h.name).includes(search))return false;
     const tierMinStars=parseInt(String(currentTier()?.stars||firstTier?.stars||''),10);
   const hotelStars=Number(h.stars)||0;
   if(Number.isFinite(tierMinStars)&&tierMinStars>=1&&hotelStars<tierMinStars)return false;
   if(stars!=='all'&&hotelStars!==Number(stars))return false;
     return true;
   });
   if(sort==='priceAsc')list.sort((a,b)=>stayPrice(a)-stayPrice(b));
   else if(sort==='priceDesc')list.sort((a,b)=>stayPrice(b)-stayPrice(a));
   else if(sort==='rating')list.sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0));
   return list;
 }
 function renderHotelResults(){
   const list=$('lxHotelLookupOptions');list.replaceChildren();
   const all=filterHotels(),shown=all.slice(0,hotelDisplayCount);
   const count=$('lxHotelResultCount');count.hidden=false;
   count.textContent='Mostrando '+shown.length+' de '+all.length+' hoteles que coinciden'+
     (hotelNextPage!==null?' · Hay más resultados para consultar':'');
   if(!all.length)list.append(el('p','lx-hotel-no-results',
     'No hay hoteles con estos filtros. Prueba otra categoría o busca más resultados.'));
   const quotedTier=tiers.find(t=>t.code===$('lxHotelTier').value)||currentTier();
   shown.forEach(h=>{
     if(!h?.name)return;
     const stay=stayPrice(h),rate=Number(h.nightlyRate)||0;
     const canSelect=stay>0,calculatedExtra=extraForHotel(h),canPrice=canSelect&&calculatedExtra!==null;
     const difference=canPrice?calculatedExtra:0;
     const differenceNight=canPrice?Math.round(difference/params.nights*100)/100:0;
     const selected=hotelsPendingSelection?.name===h.name;
     const card=el('button','lx-package-offer lx-hotel-live-card'+(selected?' is-selected':''));
     card.type='button';
     const left=el('span');
     if(validSrc(h.thumbnail)){
       const img=el('img');img.src=h.thumbnail;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';
       left.append(img);state.hotelPhotos[normalizeHotelName(h.name)]=h.thumbnail;
     }
     left.append(el('b','',h.name));
     const meta=(h.stars?Number(h.stars)+'★':'Categoría por confirmar')+
       (Number(h.rating)>0?' · Opiniones '+Number(h.rating).toFixed(1)+'/5':'');
     left.append(el('small','lx-hotel-category-line',meta));
     left.append(el('small','',params.nights+' '+(params.nights===1?'noche':'noches')+
       ' · '+(pendingRoomPlan?.label||'acomodación seleccionada')));
     const actions=el('span','lx-hotel-choice-meta');
     if(canPrice)actions.append(el('strong','',difference>0?'+ '+fmt(differenceNight):'Sin recargo'),
       el('small','',difference>0?'por noche · + '+fmt(difference)+' por estancia':'Sin costo adicional'));
     else actions.append(el('strong','',canSelect?'Consultar tarifa':'No disponible'),
       el('small','',canSelect?'Elige el hotel para recibir una propuesta':'Prueba otras fechas'));
     card.disabled=!canSelect;card.append(left,actions);
     if(canSelect)card.addEventListener('click',()=>{
       hotelsPendingName=h.name;
       hotelsPendingSelection={name:h.name,stayTotal:Math.round(stay*100)/100,
         supplement:canPrice?difference:null,supplementPerNight:canPrice?differenceNight:null,
         quoteToken:String(h.quoteToken||''),
         pending:!canPrice,baselineTotal:hotelBudget,nights:params.nights,nightlyRate:rate,
         tierCode:quotedTier?.code||state.tier,occupancy:$('lxHotelOccupancy').value,
         roomPlan:pendingRoomPlan?.label||'',
         checkIn:state.date,checkOut:addDays(state.date,params.nights),
         adults:state.adults,children:state.children,priceSource:'Google Hotels via SerpApi',
         baselineSource:h.supplementTotal!==undefined&&h.supplementTotal!==null
           ?'referencia protegida del servidor':hotelBudget!==null?'tarifa comparable':'referencia pendiente'};
       renderHotelResults();renderHotelCards();showTierQuote();
     });
     list.append(card);
   });
   const moreLocal=hotelDisplayCount<all.length;
   const load=$('lxHotelLoadMore');
   load.hidden=!moreLocal&&hotelNextPage===null;
   load.textContent=moreLocal?'Mostrar 10 hoteles más':'Buscar más hoteles';
 }
 async function searchHotelsPage(page=0){
   if(page===0){
     if(!state.date){setStatus(hotelStatus,'Elige primero la fecha de llegada.',true);return}
     if(!params.destinationPlace){setStatus(hotelStatus,'Este destino todavía no dispone de búsqueda hotelera.',true);return}
     if(state.adults+state.children>4){setStatus(hotelStatus,'Para más de 4 huéspedes, solicita una distribución de habitaciones personalizada.',true);return}
     if(state.children>2){setStatus(hotelStatus,'La búsqueda admite máximo 2 niños por habitación.',true);return}
     const ages=state.children?[...$('lxHotelAgesBox').querySelectorAll('[data-child-age]')].map(x=>Number(x.value)):[];
     if(state.children&&(ages.length!==state.children||ages.some(a=>!Number.isInteger(a)||a<1||a>17))){
       setStatus(hotelStatus,'Indica la edad de cada niño para obtener tarifas correctas.',true);return;
     }
     state.childrenAges=ages;
     clearHotelLookup();
     hotelQuery={mode:'hotels',destination:params.destinationPlace,
       check_in_date:state.date,check_out_date:addDays(state.date,params.nights),
       adults:state.adults,children:state.children,children_ages:ages.join(','),
       baseline_hotel:String(((tiers.find(t=>t.code===$('lxHotelTier').value)||currentTier())?.hotels||[])[0]||''),
       package_slug:params.slug,hotel_tier:$('lxHotelTier').value,
       hotel_occupancy:$('lxHotelOccupancy').value};
   }
   if(!hotelQuery)return;
   const btn=$('lxProductLookupHotels'),load=$('lxHotelLoadMore');
   btn.disabled=true;load.disabled=true;
   setStatus(hotelStatus,page===0?'Buscando hoteles del destino…':'Buscando más hoteles…',false,true);
   const requestedRevision=quoteRevision;
   try{
     const result=await callApi({...hotelQuery,page});
     if(requestedRevision!==quoteRevision)return;
     if(!result?.ok)throw Error(result?.message||'No hay hoteles disponibles para la búsqueda.');
     if(page===0){
       const quotedTier=tiers.find(t=>t.code===$('lxHotelTier').value)||currentTier();
       const includedName=String((quotedTier?.hotels||[])[0]||'');
       const referenceName=String(result.referenceHotel?.name||'');
       const referenceTotal=Number(result.referenceHotel?.totalRate)||0;
       const comparableOption=(result.hotels||[]).find(h=>normalizeHotelName(h.name)===normalizeHotelName(includedName));
       const comparableTotal=stayPrice(comparableOption);
       const providerBaseline=(referenceTotal>0&&referenceName&&normalizeHotelName(referenceName)===normalizeHotelName(includedName))
         ?referenceTotal:comparableTotal;
       const configuredBudget=Number(quotedTier?.hotelBudgetPerNight||
         (quotedTier?.code===firstTier?.code?book.dataset.bookHotelBudgetNightly:0))||0;
       hotelBudget=hasHotelIncluded?(configuredBudget>0?Math.round(configuredBudget*params.nights*100)/100:
         providerBaseline>0?providerBaseline:null):0;
       hotelPrivateReference=result.supplementReferenceConfigured===true;
       hotelResults=[];hotelDisplayCount=10;
       hotelLookupUi.hidden=false;
       $('lxHotelNameSearch').value='';$('lxHotelStarsFilter').value='all';$('lxHotelSort').value='recommended';
       $('lxHotelStarsFilter')._lxRefreshCustom?.();$('lxHotelSort')._lxRefreshCustom?.();
       $('lxHotelFilterHelp').textContent='Busca por nombre, categoría o precio y elige tu alojamiento favorito.';
     }
     const previous=new Set(hotelResults.map(h=>normalizeHotelName(h.name)));
     (Array.isArray(result.hotels)?result.hotels:[]).forEach(h=>{
       const key=normalizeHotelName(h?.name);
       if(key&&!previous.has(key)){hotelResults.push(h);previous.add(key)}
     });
     hotelPage=page;hotelNextPage=result.hasMore===true&&Number.isInteger(result.nextPage)?result.nextPage:null;
     if(!hotelResults.length){setStatus(hotelStatus,'No se encontraron hoteles para estas fechas.');return}
     setStatus(hotelStatus,hotelBudget===null&&!hotelPrivateReference?
       'Estos son los hoteles disponibles en la búsqueda. Elige tu favorito para conocer la tarifa.':
       'Explora opciones para '+params.nights+' noches. Puedes comparar el adicional por noche.');
     renderHotelResults();renderHotelCards();renderHotelPhoto();
   }catch(err){
     if(requestedRevision!==quoteRevision)return;
     setStatus(hotelStatus,err?.message||'No se pudieron consultar hoteles.',true);
   }finally{btn.disabled=false;load.disabled=false}
 }
 if(multiCityAtacama){
   $('lxProductLookupHotels').hidden=true;
   const msg=$('lxHotelLookupStatus');
   msg.textContent='Este circuito incluye un hotel en Santiago y otro en San Pedro de Atacama. Elige la categoría para ambos alojamientos. Si necesitas cambiar solo uno, solicita una cotización personalizada.';
   msg.hidden=false;
   const lead=hotels.body.querySelector('.lx-modal-lead');
   if(lead)lead.textContent='Escoge la categoría de alojamiento de tu circuito: 1 noche en Santiago y 3 noches en San Pedro de Atacama.';
 }
 $('lxProductLookupHotels').addEventListener('click',()=>searchHotelsPage(0));
 $('lxHotelLoadMore').addEventListener('click',()=>{
   if(hotelDisplayCount<filterHotels().length){hotelDisplayCount+=10;renderHotelResults();}
   else if(hotelNextPage!==null)searchHotelsPage(hotelNextPage);
 });
 ['lxHotelNameSearch','lxHotelStarsFilter','lxHotelSort'].forEach(id=>{
   const input=$(id);input.addEventListener(id==='lxHotelNameSearch'?'input':'change',()=>{
     hotelDisplayCount=10;renderHotelResults();
   });
 });
 // Al cambiar el tipo de categoría oficial se cancela la sustitución externa.
 $('lxHotelTier').addEventListener('change',()=>{hotelsPendingName='';hotelsPendingSelection=null;clearHotelLookup()});
 $('lxHotelOccupancy').addEventListener('change',()=>{hotelsPendingName='';hotelsPendingSelection=null;clearHotelLookup()});
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
 };
 // Algunas fichas incluyen este archivo directamente; cargar los controles ANTES de iniciar la UI.
 const startWhenReady=()=>{
   if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startProductUI,{once:true});
   else startProductUI();
 };
 if(window.LatamProductControls){startWhenReady();return;}
 if(!document.querySelector('.product-booking-card [data-book-kind="package"]'))return;
 const activeScript=document.currentScript?.src||document.querySelector('script[src*="package-product-20261108.js"]')?.src||location.href;
 const controls=document.createElement('script');
 controls.src=new URL('latam-product-controls.js?v=20261109-product-final-1',activeScript).href;
 controls.onload=()=>{if(window.LatamProductControls)startWhenReady();else console.error('[LATAM] Controles de viajeros y calendario no disponibles.');};
 controls.onerror=()=>console.error('[LATAM] No se pudo cargar latam-product-controls.js.');
 document.head.append(controls);
})();
