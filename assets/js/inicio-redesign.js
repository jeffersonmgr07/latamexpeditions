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

  // Package search: distinct destinations, not duplicate package titles.
  const packageForm=$('tripSearchForm');
  if(packageForm){
    const select=$('searchDestination');
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
    const normalize=value=>(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    const countries=new Set(destinationList.filter(item=>!item[2]).map(item=>item[0]));
    // Use an accessible native suggestion list; do not expose every tour as a suggestion.
    const input=document.createElement('input');
    input.id='searchDestination'; input.name='destination'; input.type='search';
    input.placeholder='Ciudad, destino o país';input.autocomplete='off';
    input.setAttribute('aria-label','Ciudad, destino o país'); input.setAttribute('list','lxDestinationList');
    input.setAttribute('required','');input.style.width='100%';
    const datalist=document.createElement('datalist');datalist.id='lxDestinationList';
    select.replaceWith(input);input.after(datalist);
    const rebuild=()=>{
      const query=normalize(input.value);
      const matching=destinationList.filter(([slug,label,country])=>{
        if(!query)return true;
        return normalize(label).includes(query)||normalize(slug).includes(query)||
          (country&&normalize(country)===query);
      });
      datalist.replaceChildren(...matching.map(([slug,label])=>{
        const option=document.createElement('option');option.value=label;option.dataset.slug=slug;return option;
      }));
    };
    input.addEventListener('input',rebuild);input.addEventListener('focus',rebuild);rebuild();
    // Keep original form styling; extra choices are optional.
    const addField=(id,label,element)=>{
      const div=document.createElement('div');div.className='search-field';
      const lab=document.createElement('label');lab.htmlFor=id;lab.textContent=label;
      element.id=id;element.style.width='100%';
      div.append(lab,element);
      packageForm.insertBefore(div,packageForm.querySelector('button[type="submit"]'));
      return element;
    };
    const guests=document.createElement('input');guests.type='number';guests.min='1';guests.max='9';guests.step='1';guests.value='2';
    addField('searchGuests','Viajeros',guests);
    const origin=document.createElement('select');
    [['','Sin vuelos por ahora'],['LIM','Lima (LIM)'],['CUZ','Cusco (CUZ)'],['BOG','Bogotá (BOG)'],
     ['MDE','Medellín (MDE)'],['EZE','Buenos Aires (EZE)'],['SCL','Santiago (SCL)'],
     ['MEX','Ciudad de México (MEX)'],['GRU','São Paulo (GRU)']].forEach(([value,label])=>{
       const opt=document.createElement('option');opt.value=value;opt.textContent=label;origin.append(opt);
     });
    addField('searchOrigin','Salida / aeropuerto (opcional)',origin);
    const date=$('searchDate');if(date){date.required=true;date.previousElementSibling&&(date.previousElementSibling.textContent='Fecha de llegada');date.min=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);}
    packageForm.addEventListener('submit',e=>{
      e.preventDefault();
      const typed=normalize(input.value);
      const selected=destinationList.find(([slug,label])=>normalize(label)===typed||normalize(slug)===typed);
      if(!selected){input.setCustomValidity('Selecciona un destino de la lista.');input.reportValidity();return;}
      input.setCustomValidity('');
      const [slug,,country]=selected;
      const qs=new URLSearchParams();
      if(countries.has(slug))qs.set('destino',slug);
      else{qs.set('ciudad',slug);qs.set('destino',country);}
      const type=$('searchType')?.value;
      if(type)qs.set('estilo',type);
      if(date?.value)qs.set('fecha',date.value);
      qs.set('viajeros',String(Math.min(9,Math.max(1,Number(guests.value)||2))));
      if(origin.value)qs.set('origen',origin.value);
      location.href='paquetes.html?'+qs.toString();
    });
    input.addEventListener('input',()=>input.setCustomValidity(''));
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