/* Inicio 2026: pestañas Paquetes / Ofertas / Vuelos / Hoteles.
 * La búsqueda aérea reutiliza vuelos.html; hoteles deriva a consulta asistida
 * hasta contar con un proveedor de inventario hotelero. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const tabs=Array.from(document.querySelectorAll('[data-service-tab]'));
  const panels=Array.from(document.querySelectorAll('[data-service-panel]'));
  if(!tabs.length)return;

  function activate(name, focus=false) {
    if(!tabs.some(t=>t.dataset.serviceTab===name))name='paquetes';
    tabs.forEach(t=>{
      const selected=t.dataset.serviceTab===name;
      t.classList.toggle('is-active',selected);
      t.setAttribute('aria-selected',String(selected));
      t.tabIndex=selected?0:-1;
      if(focus&&selected)t.focus();
    });
    panels.forEach(p=>{p.hidden=p.dataset.servicePanel!==name});
  }
  const requested=new URLSearchParams(location.search).get('tab');
  activate(['paquetes','ofertas','vuelos','hoteles'].includes(requested)?requested:'paquetes');
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>activate(tab.dataset.serviceTab));
    tab.addEventListener('keydown',e=>{
      if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
      e.preventDefault();
      const index=e.key==='Home'?0:e.key==='End'?tabs.length-1:
        (i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      activate(tabs[index].dataset.serviceTab,true);
    });
  });

  // Paquetes: una selección por destino, fecha exacta y viajeros.
  const packageForm=$('tripSearchForm');
  if(packageForm){
    packageForm.noValidate=true; // La fecha tiene un calendario visual; validamos antes de enviar.
    const destinationList=[
      ['peru','Perú',''],['cusco','Cusco, Perú','peru'],['machu-picchu','Machu Picchu, Perú','peru'],
      ['arequipa','Arequipa, Perú','peru'],['puno','Puno, Perú','peru'],['lima','Lima, Perú','peru'],
      ['colombia','Colombia',''],['medellin','Medellín, Colombia','colombia'],['bogota','Bogotá, Colombia','colombia'],
      ['cartagena','Cartagena, Colombia','colombia'],['santa-marta','Santa Marta, Colombia','colombia'],
      ['cali','Cali, Colombia','colombia'],['guatape','Guatapé, Colombia','colombia'],
      ['san-andres','San Andrés, Colombia','colombia'],['eje-cafetero','Eje Cafetero, Colombia','colombia'],
      ['argentina','Argentina',''],['buenos-aires','Buenos Aires, Argentina','argentina'],
      ['iguazu','Iguazú, Argentina','argentina'],['patagonia','Patagonia, Argentina','argentina'],
      ['brasil','Brasil',''],['rio-de-janeiro','Río de Janeiro, Brasil','brasil'],
      ['ecuador','Ecuador',''],['quito','Quito, Ecuador','ecuador'],['galapagos','Galápagos, Ecuador','ecuador'],
      ['chile','Chile',''],['santiago','Santiago, Chile','chile'],['atacama','Atacama, Chile','chile'],
      ['mexico','México',''],['riviera-maya','Riviera Maya, México','mexico'],
      ['bolivia','Bolivia',''],['la-paz','La Paz, Bolivia','bolivia'],['uyuni','Salar de Uyuni, Bolivia','bolivia'],
      ['costa-rica','Costa Rica',''],['uruguay','Uruguay',''],['venezuela','Venezuela','']
    ];
    const input=$('searchDestination');
    const suggestions=$('lxDestinationList');
    const origin=$('searchOrigin');
    const arrival=$('searchDate');
    const adultsInput=$('searchAdults'),childrenInput=$('searchChildren');
    const guestsButton=$('searchTravelersTrigger'),guestsPanel=$('searchTravelersPanel');
    const error=$('lxPackageSearchError');
    const normalize=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    const slugText=s=>normalize(s).replace(/-/g,' ');
    const countrySlugs=new Set(destinationList.filter(x=>!x[2]).map(x=>x[0]));
    const airports={'Perú':'LIM','Colombia':'BOG','Argentina':'EZE','Chile':'SCL',
      'México':'MEX','Brasil':'GRU','Ecuador':'UIO','Bolivia':'LPB',
      'Venezuela':'CCS','Uruguay':'MVD','Costa Rica':'SJO'};
    function currentCountry(){
      try{return localStorage.getItem('latam_country')||document.documentElement.dataset.country||'Perú'}
      catch(_){return document.documentElement.dataset.country||'Perú'}
    }
    function setDefaultOrigin(country){
      if(origin.dataset.userEdited==='true')return;
      origin.value=airports[country]||'LIM';
    }
    setDefaultOrigin(currentCountry());
    origin.addEventListener('change',()=>{origin.dataset.userEdited='true'});
    document.addEventListener('latam:countrychange',event=>{
      if(origin.dataset.userEdited!=='true')setDefaultOrigin(event.detail?.country||currentCountry());
    });
    function updateSuggestions(){
      const q=normalize(input.value);
      const matches=destinationList.filter(([slug,label,country])=>
        !q||normalize(label).includes(q)||slugText(slug).includes(q)||normalize(country)===q);
      suggestions.replaceChildren(...matches.slice(0,45).map(([,label])=>{
        const option=document.createElement('option');option.value=label;return option;
      }));
    }
    input.addEventListener('input',()=>{updateSuggestions();error.hidden=true});
    input.addEventListener('focus',updateSuggestions);updateSuggestions();
    const today=new Date();
    const localDay=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
    arrival.min=localDay(today);
    const MAX_TRAVELERS=9;
    function travelerCount(){return {adults:Number(adultsInput.value)||1,children:Number(childrenInput.value)||0}}
    function updateGuests(){
      const {adults,children}=travelerCount();
      $('searchAdultsCount').textContent=String(adults);
      $('searchChildrenCount').textContent=String(children);
      $('searchTravelersSummary').textContent=adults+(adults===1?' adulto':' adultos')+
        (children?', '+children+(children===1?' niño':' niños'):'');
      guestsPanel.querySelectorAll('[data-guest-type]').forEach(button=>{
        const type=button.dataset.guestType,step=Number(button.dataset.guestStep);
        button.disabled=(step<0?(type==='adults'?adults<=1:children<=0):adults+children>=MAX_TRAVELERS);
      });
    }
    function openGuests(open){
      guestsPanel.hidden=!open;guestsButton.setAttribute('aria-expanded',String(open));
      if(open)guestsPanel.querySelector('button:not(:disabled)')?.focus();
      else guestsButton.focus();
    }
    guestsButton.addEventListener('click',()=>openGuests(guestsPanel.hidden));
    guestsPanel.querySelectorAll('[data-guest-type]').forEach(button=>button.addEventListener('click',()=>{
      const type=button.dataset.guestType;
      const values=travelerCount();
      const count=values.adults+values.children;
      const next=values[type]+Number(button.dataset.guestStep);
      if(next<(type==='adults'?1:0)||next>MAX_TRAVELERS||
        (Number(button.dataset.guestStep)>0&&count>=MAX_TRAVELERS))return;
      (type==='adults'?adultsInput:childrenInput).value=String(next);updateGuests();
    }));
    $('searchTravelersApply').addEventListener('click',()=>openGuests(false));
    document.addEventListener('pointerdown',event=>{
      if(!guestsPanel.hidden&&!guestsPanel.contains(event.target)&&!guestsButton.contains(event.target))
        openGuests(false);
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!guestsPanel.hidden)openGuests(false);
    });
    // Restaurar los valores al regresar desde «Modificar búsqueda».
    const previous=new URLSearchParams(location.search);
    const previousSlug=previous.get('ciudad')||previous.get('destino')||'';
    const previousDestination=destinationList.find(item=>item[0]===previousSlug);
    if(previousDestination)input.value=previousDestination[1];
    if(/^\d{4}-\d{2}-\d{2}$/.test(previous.get('fecha')||'')&&
      previous.get('fecha')>=arrival.min)arrival.value=previous.get('fecha');
    if(previous.get('origen')&&[...origin.options].some(option=>option.value===previous.get('origen'))){
      origin.value=previous.get('origen');origin.dataset.userEdited='true';
    }
    const previousAdults=Number(previous.get('adults')),previousChildren=Number(previous.get('children'));
    if(previousAdults>=1&&previousAdults<=9&&previousChildren>=0&&
      previousAdults+previousChildren<=MAX_TRAVELERS){
      adultsInput.value=String(previousAdults);childrenInput.value=String(previousChildren);
    }
    updateGuests();
    function showError(message,element){
      error.textContent=message;error.hidden=false;element?.focus?.();
    }
    packageForm.addEventListener('submit',event=>{
      event.preventDefault();
      error.hidden=true;
      const typed=normalize(input.value);
      const selected=destinationList.find(([slug,label])=>
        normalize(label)===typed||slugText(slug)===typed);
      if(!selected){showError('Selecciona una ciudad, destino o país de las sugerencias.',input);return;}
      if(!arrival.value||!/^\d{4}-\d{2}-\d{2}$/.test(arrival.value)||arrival.value<arrival.min){
        showError('Selecciona una fecha de llegada válida.',$('searchDateStyledPicker')||arrival);return;
      }
      const [slug,,country]=selected;
      const guests=travelerCount();
      const qs=new URLSearchParams();
      if(countrySlugs.has(slug))qs.set('destino',slug);
      else{qs.set('ciudad',slug);qs.set('destino',country);}
      qs.set('fecha',arrival.value);
      qs.set('adults',String(guests.adults));
      qs.set('children',String(guests.children));
      qs.set('viajeros',String(guests.adults+guests.children));
      if(origin.value)qs.set('origen',origin.value);
      location.href='paquetes.html?'+qs.toString();
    });
  }

  const flightForm=$('homeFlightSearch');
  const origin=$('homeFlightOrigin'),dest=$('homeFlightDestination');
  const departure=$('homeFlightDeparture'),ret=$('homeFlightReturn');
  const wrap=$('homeReturnControl');
  const flightError=$('homeFlightError');
  const today=new Date();
  const tomorrow=new Date(today.getFullYear(),today.getMonth(),today.getDate()+2);
  const format=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const minDate=format(tomorrow);
  departure.min=minDate;ret.min=minDate;
  departure.addEventListener('change',()=>{
    if(ret.value&&ret.value<departure.value){ret.value='';ret.dispatchEvent(new Event('change',{bubbles:true}));}
    ret.min=departure.value||minDate;
  });
  flightForm?.querySelectorAll('[name="trip"]').forEach(input=>input.addEventListener('change',()=>{
    const roundtrip=flightForm.querySelector('[name="trip"]:checked').value==='roundtrip';
    wrap.hidden=!roundtrip;ret.required=roundtrip;
  }));
  $('homeFlightSwap')?.addEventListener('click',()=>{
    const value=origin.value;origin.value=dest.value;dest.value=value;
    origin.dispatchEvent(new Event('change',{bubbles:true}));
    dest.dispatchEvent(new Event('change',{bubbles:true}));
  });
  flightForm?.addEventListener('submit',e=>{
    e.preventDefault();
    const trip=flightForm.querySelector('[name="trip"]:checked').value;
    const invalid=origin.value===dest.value||!departure.value||departure.value<minDate||
      (trip==='roundtrip'&&(!ret.value||ret.value<departure.value));
    flightError.hidden=!invalid;
    if(invalid){flightError.textContent='Verifica el origen, destino y las fechas del viaje.';return}
    const qs=new URLSearchParams({
      origin:origin.value,destination:dest.value,trip,
      departure:departure.value,adults:$('homeFlightAdults').value,
      children:'0',cabin:'economy'
    });
    if(trip==='roundtrip')qs.set('returnDate',ret.value);
    location.href='vuelos.html?'+qs.toString();
  });

  const hotels=$('homeHotelsInquiry');
  const inDate=$('homeHotelCheckin'),outDate=$('homeHotelCheckout');
  if(inDate&&outDate){inDate.min=format(today);outDate.min=format(today);
    inDate.addEventListener('change',()=>{outDate.min=inDate.value||format(today);
      if(outDate.value<outDate.min)outDate.value='';});
  }
  const hotelError=document.createElement('p');
  hotelError.className='home-search-error';
  hotelError.setAttribute('role','alert');
  hotelError.hidden=true;hotels?.append(hotelError);
  hotels?.addEventListener('submit',e=>{
    e.preventDefault();
    const city=$('homeHotelDestination').value.trim();
    const invalid=!city||!inDate.value||!outDate.value||outDate.value<=inDate.value;
    hotelError.hidden=!invalid;
    if(invalid){
      hotelError.textContent='Selecciona un destino y unas fechas válidas de entrada y salida.';
      (city?hotels.querySelector('.lx-picker-trigger'): $('homeHotelDestination'))?.focus();
      return;
    }
    const content='Hola, Latam Expeditions. Quisiera consultar un hotel en '+city+
      ', del '+inDate.value+' al '+outDate.value+', para '+$('homeHotelGuests').value+' huésped(es).';
    window.open('https://wa.me/51906472060?text='+encodeURIComponent(content),'_blank','noopener');
  });
  window.addEventListener('pageshow',()=>{if(flightError)flightError.hidden=true});
})();