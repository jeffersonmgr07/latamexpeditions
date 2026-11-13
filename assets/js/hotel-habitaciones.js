/* Selección de habitaciones basada en datos de Google Hotels. Sin cobro no verificado. */
(() => {
'use strict';
const $=id=>document.getElementById(id),modal=$('hotelRoomsModal');
if(!modal)return;
const cash=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
const el=(tag,cls,value)=>{const e=document.createElement(tag);e.className=cls||'';if(value!==undefined)e.textContent=String(value);return e};
let choice=null,query=null,option=null,busy=false,requestKey='';
function message(v){$('hotelRoomsMessage').textContent=v||''}
function error(v){const p=$('hotelRoomRequestError');p.textContent=v||'';p.hidden=!v}
function close(){if(busy)return;modal.hidden=true;document.body.style.overflow=''}
modal.querySelectorAll('[data-hotel-rooms-close]').forEach(node=>node.addEventListener('click',close));
document.addEventListener('keydown',e=>{if(!modal.hidden&&e.key==='Escape')close()});
const googleOrigin=origin=>{try{const u=new URL(origin);return u.protocol==='https:'&&(u.hostname==='script.google.com'||u.hostname==='script.googleusercontent.com'||u.hostname.endsWith('.script.googleusercontent.com')||u.hostname.endsWith('-script.googleusercontent.com'))}catch(_){return false}};
function roomLookup(token){
 const endpoint=String(window.LATAM_FLIGHTS_API_URL||'');
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint))return Promise.reject(Error('No se pudo consultar este hotel.'));
 return new Promise((resolve,reject)=>{
   const cb='latamFlightCb_'+Date.now()+Math.random().toString(36).slice(2,12),url=new URL(endpoint);
   url.searchParams.set('mode','hotel_rooms');url.searchParams.set('property_token',token);url.searchParams.set('callback',cb);
   const script=document.createElement('script');let done=false;
   const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);script.remove();delete window[cb];if(err)reject(err);else resolve(data)};
   const timer=setTimeout(()=>finish(Error('La consulta de habitaciones tardó demasiado.')),45000);
   window[cb]=data=>finish(null,data);script.onerror=()=>finish(Error('No se pudieron consultar las habitaciones.'));
   script.src=url.toString();document.head.append(script);
 });
}
function choose(o){
 option=o;$('hotelRoomsBooking').hidden=false;
 $('hotelRoomSelectedTitle').textContent=o.name||'Habitación por confirmar';
 $('hotelRoomQuantity').value='1';
 updatePrice();
 const link=String(o.bookingUrl||'');
 const anchor=$('hotelRoomSupplierLink');anchor.hidden=!/^https:\/\/[^<>"'\s]+$/.test(link);
 if(!anchor.hidden)anchor.href=link;
 $('hotelRoomsBooking').scrollIntoView({behavior:'smooth',block:'start'});
}
function updatePrice(){
 if(!option)return;
 const q=Number($('hotelRoomQuantity').value),amount=Number(option.totalRate||0);
 $('hotelRoomSelectedPrice').textContent=(q===1&&amount>0)?
 'Tarifa publicada para la estancia: '+cash.format(amount)+'. Confirmaremos las condiciones antes de reservar.':
 'Confirmaremos el precio final para '+q+' '+(q===1?'habitación':'habitaciones')+'.';
}
$('hotelRoomQuantity').addEventListener('change',updatePrice);
function render(rooms){
 const host=$('hotelRoomsList');host.replaceChildren();
 if(!rooms.length){message('No encontramos detalles de habitaciones para estas fechas. Puedes solicitar una opción.');rooms=[{name:'Habitación por confirmar',source:'',totalRate:choice.total}]}
 else message('Selecciona el alojamiento y la tarifa que prefieres.');
 rooms.forEach(o=>{
   const card=el('article','hotel-rooms-modal__option');
   if(o.thumbnail&&/^https:\/\//.test(o.thumbnail)){
     const img=document.createElement('img');img.src=o.thumbnail;img.alt=o.name||'Habitación';img.loading='lazy';
     img.addEventListener('error',()=>img.remove(),{once:true});card.append(img);
   }
   const body=el('div','hotel-rooms-modal__option-body');
   body.append(el('h3','',o.roomTypeUnspecified?'Opción de alojamiento':o.name||'Habitación'));
   if(o.source)body.append(el('p','hotel-rooms-modal__supplier-name',o.source));
   if(Number(o.numGuests)>0)body.append(el('p','','Capacidad informada: '+o.numGuests+' personas'));
   if(Array.isArray(o.inclusions)&&o.inclusions.length)body.append(el('p','',o.inclusions.join(' · ')));
   const total=Number(o.totalRate||0),night=Number(o.nightlyRate||0);
   body.append(el('strong','hotel-rooms-modal__price',total>0?cash.format(total)+' por estancia':night>0?cash.format(night)+' por noche':'Precio por confirmar'));
   const select=el('button','hotel-rooms-modal__choose','Elegir esta opción');select.type='button';
   select.addEventListener('click',()=>choose(o));
   body.append(select);card.append(body);host.append(card);
 });
}
window.addEventListener('latam:hotel-room-select',async event=>{
 const d=event.detail;if(!d?.hotel||!d?.search)return;
 query=d.search;choice=d.hotel;option=null;requestKey='';
 $('hotelRoomsTitle').textContent=choice.name;
 $('hotelRoomsDates').textContent=query.destination+' · '+query.check_in_date+' al '+query.check_out_date;
 $('hotelRoomsList').replaceChildren();$('hotelRoomsBooking').hidden=true;$('hotelRoomsSuccess').hidden=true;
 $('hotelRoomsRequestForm').reset();error('');
 modal.hidden=false;document.body.style.overflow='hidden';
 if(!choice.propertyToken){render([]);return}
 message('Buscando opciones de habitación…');
 try{const result=await roomLookup(choice.propertyToken);
   if(modal.hidden||choice!==d.hotel)return;
   if(result?.ok!==true)throw Error(result?.message||'No se pudo consultar el hotel.');
   render(Array.isArray(result.rooms)?result.rooms:[]);
 }catch(e){if(!modal.hidden&&choice===d.hotel){message(e.message);render([])}}
});
async function backendUrl(){
 const res=await fetch('assets/data/catalog.json',{cache:'no-store'});
 if(!res.ok)throw Error('El formulario no está disponible en este momento.');
 const data=await res.json(),url=String(data?.booking?.endpoint||'');
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url))
   throw Error('El formulario no está disponible en este momento.');
 return url;
}
function send(url,data){
 return new Promise((resolve,reject)=>{
  const iframe=document.createElement('iframe');iframe.hidden=true;iframe.name='lx_hotel_rooms_'+Date.now();
  const form=document.createElement('form');form.hidden=true;form.method='POST';form.action=url;form.target=iframe.name;
  Object.entries({action:'hotelRoomRequest',payload:JSON.stringify(data)}).forEach(([key,val])=>{
    const input=document.createElement('input');input.name=key;input.type='hidden';input.value=val;form.append(input);
  });
  let done=false;
  function finish(e,r){if(done)return;done=true;clearTimeout(timer);window.removeEventListener('message',handle);form.remove();setTimeout(()=>iframe.remove(),500);if(e)reject(e);else resolve(r)}
  function handle(ev){const r=ev.data;
    if(ev.source!==iframe.contentWindow||!googleOrigin(ev.origin)||r?.type!=='latam-hotel-room-receipt'||r.requestKey!==data.requestKey)return;
    if(r.ok!==true)finish(Error(r.error||'No pudimos registrar tu solicitud.'));else finish(null,r);
  }
  window.addEventListener('message',handle);
  const timer=setTimeout(()=>finish(Error('No pudimos confirmar la recepción. Contáctanos antes de reintentar.')),65000);
  document.body.append(iframe,form);try{form.submit()}catch(e){finish(e)}
 });
}
$('hotelRoomsRequestForm').addEventListener('submit',async e=>{
 e.preventDefault();if(busy||!choice||!option)return;
 const guest=$('hotelRoomMainName').value.trim(),nationality=$('hotelRoomNationality').value.trim(),
 documentId=$('hotelRoomDocument').value.trim(),email=$('hotelRoomEmail').value.trim(),
 phone=$('hotelRoomPhone').value.trim(),others=$('hotelRoomOtherGuests').value.trim();
 if(guest.length<3||!nationality||documentId.length<3||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||phone.replace(/\D/g,'').length<7){
   error('Completa el nombre, nacionalidad, documento, correo y teléfono del titular.');return;
 }
 if(!requestKey)requestKey=window.crypto?.randomUUID?crypto.randomUUID().replace(/-/g,'')+Date.now().toString(36):
   Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);
 const data={requestKey,hotel:choice.name,destination:query.destination,room:option.name,
   provider:option.source||'',checkin:query.check_in_date,checkout:query.check_out_date,
   adults:Number(query.adults),children:Number(query.children),rooms:Number($('hotelRoomQuantity').value),
   mainGuest:guest,nationality,document:documentId,email,phone,otherGuests:others};
 busy=true;const btn=$('hotelRoomRequestButton');btn.disabled=true;btn.textContent='Enviando solicitud…';error('');
 try{
   const url=await backendUrl(),reply=await send(url,data);
   $('hotelRoomsBooking').hidden=true;$('hotelRoomsSuccess').hidden=false;message('');
   $('hotelRoomsSuccess').querySelector('p').textContent='Referencia '+reply.reference+'. Te enviaremos los siguientes pasos por correo.';
 }catch(ex){error(ex.message||'No pudimos enviar la solicitud.')}
 finally{busy=false;btn.disabled=false;btn.textContent='Solicitar reserva'}
});
})();