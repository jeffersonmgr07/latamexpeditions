/* LATAM Expeditions · Ofertas hoteleras fijas.
   Pago exclusivamente tras cupo hotelero configurado y validado en backend.
   Nunca se infiere disponibilidad desde un calendario o desde Google Hotels. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const modal=$('hotelOfferModal'),form=$('hotelOfferBookingForm');
  if(!modal||!form)return;
  const rates={
    'hotel-oferta-dreams-playa-bonita':{title:'Dreams Playa Bonita All Inclusive',country:'PA',night:284.90},
    'hotel-oferta-westin-playa-bonita':{title:'The Westin Playa Bonita Panama',country:'PA',night:200.90},
    'hotel-oferta-viajero-tayrona':{title:'Viajero Tayrona Hostel & Ecohabs',country:'CO',night:123.90},
    'hotel-oferta-hotel-tocarema':{title:'Hotel Tocarema',country:'CO',night:116.90}
  };
  const fmt=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
  const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const utc=s=>new Date(s+'T00:00:00Z');
  const nights=(a,b)=>Math.round((utc(b)-utc(a))/86400000);
  const now=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
  const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
  const dateLabel=s=>s?new Intl.DateTimeFormat('es-PE',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(utc(s)):'Seleccionar fecha';
  function easter(year){
    const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,
      f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,
      i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k+7)%7,
      m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;
    return new Date(Date.UTC(year,month-1,day));
  }
  const nthSunday=(year,month,n)=>1+((7-new Date(Date.UTC(year,month-1,1)).getUTCDay())%7)+(n-1)*7;
  // Los bloqueos del cliente se verifican otra vez en Apps Script antes de PayPal.
  function blackout(s,country){
    const d=utc(s),m=d.getUTCMonth()+1,day=d.getUTCDate(),year=d.getUTCFullYear();
    if((m===12&&day>=23)||(m===1&&day<=3))return true;
    const md=String(m).padStart(2,'0')+'-'+String(day).padStart(2,'0');
    const diff=Math.round((d-easter(year))/86400000);
    if(diff>=-7&&diff<=1||md==='05-01')return true;
    if(country==='PA'){
      if(['01-09','11-03','11-04','11-05','11-10','11-28','12-08','12-20'].includes(md))return true;
      if(diff>=-50&&diff<=-46)return true;
      if(m===6&&day===nthSunday(year,6,3))return true;
    }else if(country==='CO'){
      if(['01-06','07-20','08-07','11-11','12-08','12-25','01-01'].includes(md))return true;
      if(m===11&&[1,2,15,16].includes(day))return true;
      if(m===5&&day===nthSunday(year,5,2))return true;
      if(m===6&&day===nthSunday(year,6,3))return true;
    }
    return false;
  }
  let selected=null,start='',end='',adults=2,step=1,displayMonth=new Date(),
    paySetup=false,config=null,orderId='',requestKey='';
  const error=$('hotelOfferError'),calendar=$('hotelOfferCalendarGrid'),msg=$('hotelOfferAvailability');
  const showError=text=>{error.textContent=text||'';error.hidden=!text};
  const busyText=(t)=>{msg.textContent=t};
  const rangeValid=(from,to)=>{
    if(!from||!to||from>=to)return false;
    const min=iso(now()),max=iso(addDays(now(),90));
    if(from<min||to>max||nights(from,to)<1)return false;
    for(let i=0;i<nights(from,to);i++){
      const night=iso(addDays(new Date(from+'T12:00:00'),i));
      if(blackout(night,selected.country))return false;
    }
    return true;
  };
  const summary=()=>{
    $('hotelOfferStart').textContent=dateLabel(start);
    $('hotelOfferEnd').textContent=dateLabel(end);
    const length=start&&end&&rangeValid(start,end)?nights(start,end):0;
    $('hotelOfferNights').textContent=length?length+' '+(length===1?'noche':'noches')+' · '+adults+' '+(adults===1?'adulto':'adultos'):'Selecciona tus fechas';
    $('hotelOfferTotal').textContent=length?fmt.format(length*selected.night):'—';
  };
  function drawCalendar(){
    const year=displayMonth.getFullYear(),month=displayMonth.getMonth();
    $('hotelOfferCalendarMonth').textContent=months[month]+' '+year;
    $('hotelOfferPrevMonth').disabled=year===now().getFullYear()&&month===now().getMonth();
    const max=addDays(now(),90);
    $('hotelOfferNextMonth').disabled=year===max.getFullYear()&&month===max.getMonth();
    calendar.replaceChildren();
    ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].forEach(day=>{
      const w=document.createElement('span');w.textContent=day;w.className='hotel-offer-calendar__weekday';calendar.append(w);
    });
    const offset=(new Date(year,month,1).getDay()+6)%7;
    for(let j=0;j<offset;j++)calendar.append(document.createElement('span'));
    for(let day=1;day<=new Date(year,month+1,0).getDate();day++){
      const d=new Date(year,month,day),date=iso(d),button=document.createElement('button');
      button.type='button';button.className='hotel-offer-calendar__day';
      button.textContent=String(day);button.setAttribute('aria-label',date);
      const disabled=date<iso(now())||date>iso(max)||blackout(date,selected.country);
      button.disabled=disabled;button.classList.toggle('is-blocked',disabled);
      if(date===start||date===end)button.classList.add('is-selected');
      else if(start&&end&&date>start&&date<end)button.classList.add('is-range');
      if(!disabled)button.addEventListener('click',()=>pickDate(date));
      calendar.append(button);
    }
  }
  function pickDate(date){
    showError('');
    if(!start||(start&&end)||date<=start){
      start=date;end='';
      $('hotelOfferDateHint').textContent='Ahora elige la fecha de salida. Las noches festivas están excluidas.';
    }else if(!rangeValid(start,date)){
      showError('La estancia incluye días excluidos o supera el período permitido. Selecciona otras fechas.');
      return;
    }else{
      end=date;
      $('hotelOfferDateHint').textContent='Fechas seleccionadas. Continúa para completar los datos de los pasajeros.';
    }
    drawCalendar();summary();
  }
  $('hotelOfferPrevMonth').addEventListener('click',()=>{displayMonth=new Date(displayMonth.getFullYear(),displayMonth.getMonth()-1,1);drawCalendar()});
  $('hotelOfferNextMonth').addEventListener('click',()=>{displayMonth=new Date(displayMonth.getFullYear(),displayMonth.getMonth()+1,1);drawCalendar()});
  $('hotelOfferAdults').addEventListener('change',e=>{
    adults=Number(e.target.value);renderPassengers();summary();
  });

  const documents=['Pasaporte','DNI / Cédula de identidad / ID','Carné de extranjería','Otro'];
  function passengerRow(index){
    const fieldset=document.createElement('fieldset');fieldset.className='hotel-offer-passenger';
    const legend=document.createElement('legend');legend.textContent='Pasajero '+(index+1);
    const grid=document.createElement('div');grid.className='hotel-offer-passenger__grid';
    function input(label,name,type='text',placeholder=''){
      const wrap=document.createElement('label');wrap.textContent=label;
      const node=document.createElement('input');node.type=type;node.placeholder=placeholder;node.required=true;node.dataset.field=name;node.maxLength=120;
      wrap.append(node);grid.append(wrap);
    }
    input('Nombres','firstName','text','Nombres');
    input('Apellidos','lastName','text','Apellidos');
    const docLabel=document.createElement('label');docLabel.textContent='Tipo de documento';
    const select=document.createElement('select');select.dataset.field='docType';select.required=true;
    documents.forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;select.append(o)});
    docLabel.append(select);grid.append(docLabel);
    input('Número de documento','docNumber','text','Número');
    input('Nacionalidad','nationality','text','Ej. Peruana');
    input('Fecha de nacimiento','birth','text','AAAA-MM-DD');
    fieldset.append(legend,grid);
    return fieldset;
  }
  function renderPassengers(){
    const host=$('hotelOfferPassengerFields');
    const previous=[...host.querySelectorAll('.hotel-offer-passenger')].map(el=>{
      const entries={};el.querySelectorAll('[data-field]').forEach(node=>{entries[node.dataset.field]=node.value});
      return entries;
    });
    host.replaceChildren();
    for(let i=0;i<adults;i++){
      const row=passengerRow(i);
      row.querySelectorAll('[data-field]').forEach(node=>{node.value=previous[i]?.[node.dataset.field]||node.value});
      host.append(row);
    }
  }
  function passengerData(){
    const records=[];
    const list=[...$('hotelOfferPassengerFields').querySelectorAll('.hotel-offer-passenger')];
    if(list.length!==adults)throw Error('Revisa el número de pasajeros.');
    for(const fieldset of list){
      const v={};
      fieldset.querySelectorAll('[data-field]').forEach(node=>{v[node.dataset.field]=node.value.trim()});
      if(!v.firstName||!v.lastName||!v.docType||v.docNumber.length<3||!v.nationality)
        throw Error('Completa los datos de los dos pasajeros, o del pasajero seleccionado.');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(v.birth)||!Number.isFinite(utc(v.birth).getTime())||
         utc(v.birth)>new Date(Date.now()-18*365.24*86400000))
        throw Error('Introduce fechas de nacimiento válidas de adultos en formato AAAA-MM-DD.');
      records.push({name:v.firstName+' '+v.lastName,nationality:v.nationality,
        docType:v.docType,docNumber:v.docNumber,birth:v.birth,passengerType:'adult'});
    }
    const email=$('hotelOfferEmail').value.trim(),phone=$('hotelOfferPhone').value.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||phone.replace(/\D/g,'').length<7)
      throw Error('Indica un correo electrónico y un WhatsApp con código de país.');
    return {passengers:records,holder:{email,phone}};
  }
  function makeKey(){
    if(window.crypto&&typeof crypto.randomUUID==='function')return crypto.randomUUID().replace(/-/g,'')+Date.now();
    return Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);
  }
  function paymentPayload(){
    const details=passengerData();
    return {requestKey,slug:selected.id,title:selected.title,kind:'hotel',date:start,checkout:end,
      travelers:adults,adults,children:0,holder:details.holder,passengers:details.passengers,
      quotedTotal:Number((selected.night*nights(start,end)).toFixed(2)),paymentMethod:'online'};
  }
  function showStep(n){
    step=n;showError('');
    modal.querySelectorAll('[data-offer-step]').forEach(section=>section.hidden=Number(section.dataset.offerStep)!==n);
    modal.querySelectorAll('[data-offer-step-nav]').forEach(li=>li.classList.toggle('is-active',Number(li.dataset.offerStepNav)===n));
    $('hotelOfferBack').hidden=n===1||n===4;
    $('hotelOfferNext').hidden=n>=3;
    $('hotelOfferActions').hidden=n===4;
    modal.querySelector('.hotel-offer-modal__panel').scrollTop=0;
    if(n===3)checkout();
  }
  function open(id){
    selected={...rates[id],id};if(!selected)return;
    start='';end='';adults=2;requestKey=makeKey();orderId='';paySetup=false;
    $('hotelOfferAdults').value='2';$('hotelOfferEmail').value='';$('hotelOfferPhone').value='';
    $('hotelOfferTitle').textContent=selected.title;
    $('hotelOfferSubtitle').textContent='Oferta especial · '+fmt.format(selected.night)+' por noche';
    displayMonth=new Date(now().getFullYear(),now().getMonth(),1);
    $('hotelOfferDateHint').textContent='Selecciona la entrada y luego la salida. Solo fechas dentro de los próximos 90 días.';
    $('hotelOfferPaypalButtons').replaceChildren();
    $('hotelOfferPayment').hidden=true;$('hotelOfferWhatsApp').hidden=true;
    modal.hidden=false;document.body.style.overflow='hidden';
    renderPassengers();summary();drawCalendar();showStep(1);
    modal.querySelector('[data-offer-close]:last-of-type')?.focus();
  }
  function close(){
    if(modal.hidden)return;
    modal.hidden=true;document.body.style.overflow='';
    start='';end='';orderId='';paySetup=false;
  }
  modal.querySelectorAll('[data-offer-close]').forEach(b=>b.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(!modal.hidden&&e.key==='Escape')close()});
  document.querySelectorAll('[data-hotel-offer-id]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.hotelOfferId)));
  $('hotelOfferBack').addEventListener('click',()=>{if(step===2)showStep(1);else if(step===3)showStep(2)});
  $('hotelOfferNext').addEventListener('click',()=>{
    try{
      if(step===1){if(!rangeValid(start,end))throw Error('Selecciona fechas de ingreso y salida válidas, sin noches festivas.');renderPassengers();showStep(2)}
      else if(step===2){passengerData();showStep(3)}
    }catch(err){showError(err.message)}
  });
  form.addEventListener('submit',event=>event.preventDefault());
  async function getConfig(){
    if(config)return config;
    const response=await fetch('assets/data/catalog.json',{cache:'no-store'});
    if(!response.ok)throw Error('El sistema de reservas no está disponible.');
    const data=await response.json();
    const b=data.booking||{};
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(b.endpoint||''))
      throw Error('El sistema de pagos no está habilitado.');
    config={endpoint:b.endpoint,clientId:b.paypalClientId,currency:b.currency||'USD'};
    return config;
  }
  function getAvailability(){
    return new Promise(async(resolve,reject)=>{
      let cfg;
      try{cfg=await getConfig()}catch(e){reject(e);return}
      const cb='latamHotelOfferCb_'+Date.now()+'_'+Math.random().toString(36).slice(2,12);
      const url=new URL(cfg.endpoint);
      Object.entries({action:'hotel_offer_availability',slug:selected.id,checkin:start,checkout:end,callback:cb}).forEach(([k,v])=>url.searchParams.set(k,v));
      const node=document.createElement('script');let done=false;
      const finish=(error,data)=>{
        if(done)return;done=true;clearTimeout(timer);delete window[cb];node.remove();
        if(error)reject(error);else resolve(data);
      };
      const timer=setTimeout(()=>finish(Error('La consulta de disponibilidad tardó demasiado.')),30000);
      window[cb]=data=>finish(null,data);
      node.onerror=()=>finish(Error('No pudimos consultar la disponibilidad.'));
      node.src=url.toString();document.head.append(node);
    });
  }
  function whatsappUrl(){
    const items=[
      'Hola, Latam Expeditions. Quisiera reservar esta oferta especial de hotel:',
      selected.title,'Check-in: '+start,'Check-out: '+end,
      adults+' '+(adults===1?'adulto':'adultos')+', sin niños.',
      nights(start,end)+' noches · '+fmt.format(selected.night)+' por noche.',
      'Total de la estancia: '+fmt.format(selected.night*nights(start,end))+'.',
      '¿Pueden confirmar disponibilidad para estas fechas?'
    ];
    return 'https://wa.me/51906472060?text='+encodeURIComponent(items.join('\n'));
  }
  function fillReceipt(){
    const values=[
      ['Alojamiento',selected.title],['Check-in',dateLabel(start)],
      ['Check-out',dateLabel(end)],['Huéspedes',adults+' '+(adults===1?'adulto':'adultos')],
      ['Noches',String(nights(start,end))],['Precio por noche',fmt.format(selected.night)],
      ['Total a pagar',fmt.format(selected.night*nights(start,end))]
    ];
    const host=$('hotelOfferSummary');host.replaceChildren();
    values.forEach(([label,value])=>{
      const row=document.createElement('div'),left=document.createElement('span'),right=document.createElement('strong');
      left.textContent=label;right.textContent=value;row.append(left,right);host.append(row);
    });
  }
  let checkoutNonce=0;
  async function checkout(){
    const nonce=++checkoutNonce;
    fillReceipt();
    $('hotelOfferPayment').hidden=true;$('hotelOfferWhatsApp').hidden=true;
    $('hotelOfferWhatsApp').href=whatsappUrl();
    busyText('Comprobando disponibilidad de esta oferta para tus fechas…');
    try{
      const info=await getAvailability();
      if(nonce!==checkoutNonce||modal.hidden||step!==3)return;
      if(info?.ok!==true||info.available!==true){
        busyText('La habitación necesita confirmación para estas fechas. Puedes consultarla con nuestro equipo sin realizar un pago.');
        $('hotelOfferWhatsApp').hidden=false;return;
      }
      busyText('Tenemos cupos confirmados por el operador para estas fechas. Puedes continuar al pago seguro.');
      const cfg=await getConfig();
      if(!cfg.clientId||cfg.currency!=='USD')throw Error('El pago seguro no está habilitado actualmente.');
      $('hotelOfferPayment').hidden=false;
      await showPaypal(cfg);
    }catch(e){
      if(nonce!==checkoutNonce||modal.hidden)return;
      busyText('No pudimos confirmar disponibilidad. Puedes solicitarla con nuestro equipo.');
      $('hotelOfferWhatsApp').hidden=false;
      console.warn('Disponibilidad hotel no confirmada:',e?.message);
    }
  }
  function googleOrigin(origin){
    try{const u=new URL(origin);return u.protocol==='https:'&&
      (u.hostname==='script.google.com'||u.hostname==='script.googleusercontent.com'||
        u.hostname.endsWith('.script.googleusercontent.com')||u.hostname.endsWith('-script.googleusercontent.com'))}catch(_){return false}
  }
  function statusGet(key){
    return new Promise(async(resolve)=>{
      let cfg;try{cfg=await getConfig()}catch(_){resolve(null);return}
      const cb='__latamPayStatus_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,14);
      const script=document.createElement('script');let done=false;
      function finish(data){if(done)return;done=true;clearTimeout(timer);delete window[cb];script.remove();resolve(data||null)}
      const timer=setTimeout(()=>finish(null),5500);
      const p=new URLSearchParams({action:'paypal_order_status',requestKey:key,callback:cb});
      window[cb]=finish;script.src=cfg.endpoint+'?'+p.toString();script.onerror=()=>finish(null);
      document.head.append(script);
    });
  }
  function callBooking(action,payload){
    return new Promise(async(resolve,reject)=>{
      let cfg;try{cfg=await getConfig()}catch(e){reject(e);return}
      const iframe=document.createElement('iframe'),formNode=document.createElement('form');
      iframe.hidden=true;iframe.setAttribute('aria-hidden','true');
      iframe.name='lx_hotel_offer_'+Date.now()+'_'+Math.random().toString(36).slice(2,9);
      formNode.method='POST';formNode.target=iframe.name;formNode.action=cfg.endpoint;formNode.hidden=true;
      Object.entries({action,payload:JSON.stringify(payload)}).forEach(([key,value])=>{
        const input=document.createElement('input');input.name=key;input.type='hidden';input.value=value;formNode.append(input);
      });
      let finished=false,timer,poller;
      function finish(err,reply){
        if(finished)return;finished=true;clearTimeout(timer);clearTimeout(poller);
        window.removeEventListener('message',onMessage);
        formNode.remove();setTimeout(()=>iframe.remove(),1500);
        if(err)reject(err);else resolve(reply);
      }
      function onMessage(event){
        const data=event.data;
        if(event.source!==iframe.contentWindow||!googleOrigin(event.origin)||!data||
           data.type!=='latam-paypal-response'||data.action!==action||
           data.requestKey!==payload.requestKey)return;
        if(data.ok!==true)finish(Error(data.error||'No pudimos procesar el pago.'));
        else finish(null,data);
      }
      window.addEventListener('message',onMessage);
      timer=setTimeout(()=>finish(Error('El pago está tardando en verificarse. No lo repitas; contacta a nuestro equipo.')),90000);
      document.body.append(iframe,formNode);
      async function poll(){
        if(finished)return;
        try{
          const status=await statusGet(payload.requestKey);
          if(finished)return;
          if(status?.ok&&status.requestKey===payload.requestKey){
            if(action==='createOrder'&&status.orderId){finish(null,{ok:true,orderId:status.orderId});return}
            if(action==='captureOrder'&&status.captured&&status.bookingCode){
              finish(null,{ok:true,bookingCode:status.bookingCode});return;
            }
            if(action==='captureOrder'&&['REVISION','PAGO_SIN_REGISTRO'].includes(status.status)){
              finish(Error('El pago requiere revisión manual. No intentes pagar otra vez. Orden: '+status.orderId));return;
            }
          }
        }catch(_){}
        if(!finished)poller=setTimeout(poll,1700);
      }
      try{formNode.submit();poller=setTimeout(poll,2200)}catch(e){finish(e)}
    });
  }
  let paypalLoader=null;
  function loadPaypal(cfg){
    if(window.paypal)return Promise.resolve(window.paypal);
    if(paypalLoader)return paypalLoader;
    paypalLoader=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://www.paypal.com/sdk/js?client-id='+encodeURIComponent(cfg.clientId)+'&currency=USD&intent=capture&components=buttons';
      script.onload=()=>window.paypal?resolve(window.paypal):reject(Error('No se pudo cargar el pago seguro.'));
      script.onerror=()=>reject(Error('No se pudo conectar con PayPal.'));
      document.head.append(script);
    });
    return paypalLoader;
  }
  async function showPaypal(cfg){
    if(paySetup)return;paySetup=true;
    try{
      const paypal=await loadPaypal(cfg);
      if(modal.hidden||step!==3)return;
      $('hotelOfferPaypalButtons').replaceChildren();
      const buttons=paypal.Buttons({
        style:{layout:'vertical',shape:'pill',label:'pay'},
        createOrder:async()=>{
          if(!rangeValid(start,end))throw Error('Las fechas ya no son válidas. Reinicia tu reserva.');
          const result=await callBooking('createOrder',paymentPayload());
          if(!result.orderId)throw Error('No pudimos crear la orden de pago.');
          orderId=result.orderId;return orderId;
        },
        onApprove:async data=>{
          try{
            busyText('Estamos registrando tu pago. No cierres esta ventana.');
            const result=await callBooking('captureOrder',{requestKey,orderId:data.orderID||orderId});
            if(!result?.bookingCode)throw Error('El pago requiere revisión del equipo.');
            $('hotelOfferSuccessTitle').textContent='¡Pago recibido!';
            $('hotelOfferSuccessText').textContent='Código '+result.bookingCode+'. Enviaremos por correo la información de tu alojamiento y su confirmación.';
            showStep(4);
          }catch(err){
            busyText('El pago está pendiente de verificación. No realices otro pago. Contacta con el equipo.');
            showError(err.message);
          }
        },
        onCancel:()=>busyText('El pago fue cancelado. Puedes retomarlo sin hacer un nuevo cobro.'),
        onError:err=>{
          console.warn('Oferta de hotel PayPal:',err?.message);
          busyText('No pudimos procesar el pago. Si PayPal mostró un cargo, no repitas el intento: contacta con nuestro equipo.');
        }
      });
      await buttons.render('#hotelOfferPaypalButtons');
    }catch(e){
      paySetup=false;
      busyText('El pago seguro no está disponible ahora. Puedes solicitar disponibilidad con un asesor.');
      $('hotelOfferPayment').hidden=true;$('hotelOfferWhatsApp').hidden=false;
    }
  }
})();