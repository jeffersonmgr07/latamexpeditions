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

  const packageForm=$('tripSearchForm');
  packageForm?.addEventListener('submit',e=>{
    e.preventDefault();
    const destination=$('searchDestination')?.value||'';
    const type=$('searchType')?.value||'';
    const month=$('searchDate')?.value||'';
    const qs=new URLSearchParams();
    const selected=$('searchDestination')?.selectedOptions?.[0];
    const countryValues=new Set(['peru','chile','ecuador','colombia','argentina','brasil','bolivia','mexico','costa-rica','uruguay','venezuela']);
    const country=countryValues.has(destination)?destination:
      selected?.parentElement?.label==='Destinos de Colombia'?'colombia':'';
    if(country)qs.set('destino',country);
    if(type)qs.set('estilo',type);
    if(month)qs.set('fecha',month);
    const origins={'Perú':'LIM','Colombia':'BOG','Argentina':'EZE','Chile':'SCL','México':'MEX',
      'Brasil':'GRU','Ecuador':'UIO'};
    let selectedCountry='';
    try{selectedCountry=localStorage.getItem('latam_country')||''}catch(_){}
    qs.set('origen',origins[selectedCountry]||'LIM');
    if(destination==='medellin')qs.set('ciudad','medellin');
    location.href='paquetes.html'+(qs.size?'?'+qs.toString():'');
  });

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