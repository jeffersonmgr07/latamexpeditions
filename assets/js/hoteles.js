/* LATAM Expeditions · Buscador de hoteles globales (Google Hotels vía Apps Script).
   Solo consulta; nunca confirma ni cobra una reserva hotelera. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('hotelsForm');
  if (!form) return;
  const destination = $('hotelDestination');
  const checkin = $('hotelCheckin'), checkout = $('hotelCheckout'), category = $('hotelCategory');
  const error = $('hotelError'), submit = $('hotelSearchButton');
  const results = $('hotelResults'), cards = $('hotelResultCards');
  const message = $('hotelResultMessage'), loadMore = $('hotelLoadMore'), summary = $('hotelSearchSummary');
  const sort = $('hotelSort');
  const numberFormatter = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2});
  const places = [
    'Lima, Perú','Cusco, Perú','Arequipa, Perú','Puno, Perú','Paracas, Perú',
    'Medellín, Colombia','Bogotá, Colombia','Cartagena, Colombia','Cali, Colombia','Santa Marta, Colombia',
    'Santiago, Chile','San Pedro de Atacama, Chile','Puerto Varas, Chile','Punta Arenas, Chile',
    'Buenos Aires, Argentina','Bariloche, Argentina','Mendoza, Argentina','Ushuaia, Argentina',
    'Río de Janeiro, Brasil','São Paulo, Brasil','Florianópolis, Brasil','Foz do Iguaçu, Brasil',
    'Ciudad de México, México','Cancún, México','Oaxaca, México',
    'Quito, Ecuador','Guayaquil, Ecuador','Galápagos, Ecuador',
    'La Paz, Bolivia','Uyuni, Bolivia','Montevideo, Uruguay','Caracas, Venezuela',
    'San José, Costa Rica','Ciudad de Panamá, Panamá',
    'Nueva York, Estados Unidos','Miami, Estados Unidos','Orlando, Estados Unidos',
    'Madrid, España','Barcelona, España','París, Francia','Roma, Italia','Londres, Reino Unido',
    'Lisboa, Portugal','Berlín, Alemania','Dubái, Emiratos Árabes Unidos',
    'Tokio, Japón','Kioto, Japón','Seúl, Corea del Sur','Bali, Indonesia','Bangkok, Tailandia',
    'Sídney, Australia','El Cairo, Egipto','Ciudad del Cabo, Sudáfrica'
  ];
  const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
  const iso = d => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const dayAfter = s => { const [y,m,d]=String(s).split('-').map(Number);return iso(new Date(y,m-1,d+1)) };
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  checkin.min = iso(today); checkout.min=iso(tomorrow);
  checkin.value=iso(tomorrow); checkout.value=dayAfter(checkin.value);
  checkin.dispatchEvent(new Event('change',{bubbles:true}));
  checkout.dispatchEvent(new Event('change',{bubbles:true}));
  checkin.addEventListener('change',()=>{
    const min=checkin.value?dayAfter(checkin.value):iso(tomorrow);
    checkout.min=min;
    if(checkout.value<min){checkout.value=min;checkout.dispatchEvent(new Event('change',{bubbles:true}));}
  });

  // Destino libre en cualquier ciudad del mundo. Las sugerencias son solo una ayuda:
  // se carga bajo demanda un índice de ciudades principales de GeoNames (CC BY 4.0).
  // La búsqueda NO queda limitada a este catálogo: cualquier localidad escrita
  // se pasa como texto a Google Hotels / SerpAPI.
  const list=$('hotelDestinationOptions');
  const expand=$('hotelDestinationExpand');
  const WORLD_CITY_INDEX='https://cdn.jsdelivr.net/gh/datasets/world-cities@main/data/world-cities.csv';
  let worldCities=[],cityIndexRequest=null,choices=[],chosen=-1,focusedHotel='';
  const commonCountryNames={
    'Peru':'Perú','Brazil':'Brasil','Mexico':'México','United States':'Estados Unidos',
    'United Kingdom':'Reino Unido','Germany':'Alemania','France':'Francia',
    'Spain':'España','Italy':'Italia','Japan':'Japón','South Korea':'Corea del Sur',
    'Bolivia, Plurinational State of':'Bolivia','Venezuela, Bolivarian Republic of':'Venezuela',
    'Russian Federation':'Rusia','Czechia':'Chequia','Ecuador':'Ecuador',
    'Dominican Republic':'República Dominicana'
  };
  function csvRow(line){
    const cols=[];let field='',quoted=false;
    for(let i=0;i<line.length;i++){
      const chr=line[i];
      if(chr==='"'){
        if(quoted&&line[i+1]==='"'){field+='"';i++}else quoted=!quoted;
      }else if(chr===','&&!quoted){cols.push(field);field=''}
      else field+=chr;
    }
    cols.push(field);return cols;
  }
  function loadWorldCityIndex(){
    if(cityIndexRequest)return cityIndexRequest;
    cityIndexRequest=(async()=>{
      const response=await fetch(WORLD_CITY_INDEX,{mode:'cors'});
      if(!response.ok)throw Error('city_index_unavailable');
      const raw=await response.text();
      const lines=raw.split(/\r?\n/);
      const result=[];
      for(let i=1;i<lines.length;i++){
        if(!lines[i])continue;
        const [city,country,region]=csvRow(lines[i]);
        if(!city||!country)continue;
        const translated=commonCountryNames[country]||country;
        let label=city+(region?', '+region:'')+', '+translated;
        if(label.length>90)label=city+', '+translated;
        if(label.length>90)continue;
        result.push({label,search:norm(label),cityNorm:norm(city)});
      }
      worldCities=result;
      if(!list.hidden)openDest();
    })().catch(()=>{/* No impedir búsquedas si falla el catálogo externo. */});
    return cityIndexRequest;
  }
  function closeDest(){list.hidden=true;chosen=-1;destination.setAttribute('aria-expanded','false')}
  function chooseDest(item){
    destination.value=item.label;
    focusedHotel='';
    closeDest();destination.focus();
  }
  function openDest(all=false){
    const q=norm(destination.value),suggestions=[];
    const unique=new Set();
    function add(label,cityNorm){
      if(suggestions.length>=36)return;
      const normalized=norm(label);
      if(unique.has(normalized))return;
      unique.add(normalized);suggestions.push({label,cityNorm:cityNorm||normalized});
    }
    // Destinos más buscados, seguidos por coincidencias del catálogo mundial.
    for(const p of places){if(all||!q||norm(p).includes(q))add(p)}
    if(q){
      const prefix=[],other=[];
      for(const city of worldCities){
        if(city.cityNorm.startsWith(q)){if(prefix.length<75)prefix.push(city)}
        else if(city.search.includes(q)&&other.length<75)other.push(city);
      }
      for(const item of prefix.concat(other)){add(item.label,item.cityNorm)}
    }
    choices=suggestions.slice(0,35);chosen=-1;
    list.replaceChildren();
    choices.forEach((item,i)=>{
      const button=document.createElement('button');
      button.type='button';button.setAttribute('role','option');
      button.setAttribute('aria-selected','false');button.textContent=item.label;
      button.addEventListener('mousedown',e=>e.preventDefault());
      button.addEventListener('click',()=>chooseDest(item));
      list.append(button);
    });
    if(q){
      const typed=destination.value.trim();
      if(typed&&!unique.has(norm(typed))){
        const button=document.createElement('button');button.type='button';
        button.className='hotel-destination-world';
        button.setAttribute('role','option');button.setAttribute('aria-selected','false');
        button.textContent='Buscar hoteles en «'+typed+'»';
        button.addEventListener('mousedown',e=>e.preventDefault());
        button.addEventListener('click',()=>chooseDest({label:typed}));
        list.append(button);
        choices.push({label:typed});
      }
    }
    const hint=document.createElement('p');hint.className='hotel-destination-hint';
    hint.append(document.createTextNode(worldCities.length?
      'Puedes buscar cualquier ciudad, aunque no aparezca en la lista. Ciudades de referencia: ':
      'Escribe cualquier ciudad del mundo, aunque no aparezca en las sugerencias. '));
    const credit=document.createElement('a');
    credit.href='https://www.geonames.org/';credit.textContent='GeoNames';
    credit.target='_blank';credit.rel='noopener noreferrer';
    if(worldCities.length){
      hint.append(credit,document.createTextNode(' (CC BY 4.0).'));
    }else if(cityIndexRequest){
      hint.append(document.createTextNode('Las sugerencias mundiales se cargan al escribir.'));
    }
    list.append(hint);
    list.hidden=false;destination.setAttribute('aria-expanded','true');
  }
  destination.addEventListener('focus',()=>{openDest();loadWorldCityIndex()});
  destination.addEventListener('input',()=>{focusedHotel='';openDest();loadWorldCityIndex()});
  expand.addEventListener('click',()=>{
    if(!list.hidden){closeDest();return}
    destination.focus();openDest(true);loadWorldCityIndex();
  });
  destination.addEventListener('keydown',e=>{
    if(e.key==='Escape'){closeDest();return}
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault();
      if(list.hidden)openDest();
      if(!choices.length)return;
      chosen=(chosen+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length;
      list.querySelectorAll('[role="option"]').forEach((b,i)=>{
        b.setAttribute('aria-selected',String(i===chosen));
        if(i===chosen)b.scrollIntoView({block:'nearest'});
      });
    }
    if(e.key==='Enter'&&!list.hidden&&chosen>=0&&choices[chosen]){
      e.preventDefault();chooseDest(choices[chosen]);
    }
  });

  // Viajeros: adultos, niños y edad de cada menor (requerida por Google Hotels).
  let adults=2,children=0,ages=[];
  const travelerButton=$('hotelTravelersTrigger'),travelerMenu=$('hotelTravelersMenu');
  const agesHost=$('hotelChildrenAges');
  function renderTravelers(){
    $('hotelAdultsCount').value=String(adults);$('hotelChildrenCount').value=String(children);
    $('hotelTravelersText').textContent=adults+' '+(adults===1?'adulto':'adultos')+
      (children?' · '+children+' '+(children===1?'niño':'niños'):'');
    travelerMenu.querySelectorAll('[data-hotel-counter]').forEach(b=>{
      const [type,delta]=b.dataset.hotelCounter.split(':');
      b.disabled=type==='adults'?(Number(delta)<0?adults<=1:adults>=8||adults+children>=10):
        (Number(delta)<0?children===0:children>=6||adults+children>=10);
    });
    agesHost.replaceChildren();
    ages.forEach((age,i)=>{
      const row=document.createElement('div');row.className='hotel-age-row';
      const label=document.createElement('label');label.htmlFor='hotelAge'+i;label.textContent='Edad del niño '+(i+1);
      const select=document.createElement('select');select.id='hotelAge'+i;
      for(let year=1;year<=17;year++){
        const opt=document.createElement('option');opt.value=String(year);
        opt.textContent=year===1?'1 año':year+' años';select.append(opt);
      }
      select.value=String(age);
      select.addEventListener('change',()=>{ages[i]=Number(select.value)});
      row.append(label,select);agesHost.append(row);
    });
  }
  function closeTravelers(){travelerMenu.hidden=true;travelerButton.setAttribute('aria-expanded','false')}
  travelerButton.addEventListener('click',()=>{
    const opening=travelerMenu.hidden;closeDest();
    travelerMenu.hidden=!opening;travelerButton.setAttribute('aria-expanded',String(opening));
    if(opening)renderTravelers();
  });
  travelerMenu.addEventListener('click',e=>{
    const button=e.target.closest('[data-hotel-counter]');if(!button)return;
    const [type,delta]=button.dataset.hotelCounter.split(':');
    const step=Number(delta);
    if(type==='adults')adults=Math.max(1,Math.min(8,adults+step));
    else children=Math.max(0,Math.min(6,children+step));
    if(adults+children>10){
      if(type==='adults')adults-=step;else children-=step;
      return;
    }
    while(ages.length<children)ages.push(8);
    ages.length=children;
    renderTravelers();
  });
  $('hotelTravelersDone').addEventListener('click',()=>{closeTravelers();travelerButton.focus()});
  document.addEventListener('pointerdown',e=>{
    if(!destination.closest('.hotel-destination-combobox').contains(e.target))closeDest();
    if(!travelerButton.contains(e.target)&&!travelerMenu.contains(e.target))closeTravelers();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDest();closeTravelers()}});
  renderTravelers();

  function showError(txt){
    error.textContent=txt||'';error.hidden=!txt;
  }
  function validate(){
    const city=destination.value.replace(/\s+/g,' ').trim();
    const todayIso=iso(new Date());
    if(city.length<2||city.length>90)return 'Escribe la ciudad o destino donde deseas alojarte.';
    if(!/^[\p{L}\p{N}\p{M} ,.'()\-]+$/u.test(city))return 'Escribe un destino válido.';
    if(!checkin.value||!checkout.value||checkin.value<todayIso||checkout.value<=checkin.value)
      return 'Selecciona fechas válidas para entrada y salida.';
    const nights=Math.round((Date.parse(checkout.value+'T00:00:00Z')-Date.parse(checkin.value+'T00:00:00Z'))/86400000);
    if(nights>30)return 'Para esta consulta selecciona una estancia de hasta 30 noches.';
    if(!ages.every(age=>Number.isInteger(age)&&age>=1&&age<=17))
      return 'Selecciona la edad de cada niño.';
    return '';
  }
  function queryNow(){
    return {destination:destination.value.trim(),check_in_date:checkin.value,
      check_out_date:checkout.value,adults:String(adults),children:String(children),
      children_ages:ages.join(','),category:category.value,hotel_name:focusedHotel};
  }
  function getHotels(query,page){
    const endpoint=String(window.LATAM_FLIGHTS_API_URL||'').trim();
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(endpoint))
      return Promise.reject(new Error('not_configured'));
    return new Promise((resolve,reject)=>{
      const cb='latamFlightCb_'+Date.now()+String(Math.floor(Math.random()*100000));
      const url=new URL(endpoint);
      Object.entries({...query,mode:'hotel_search',page:String(page),callback:cb}).forEach(([k,v])=>url.searchParams.set(k,v));
      const script=document.createElement('script');
      let done=false;const timeout=setTimeout(()=>finish(null,new Error('timeout')),65000);
      function finish(data,err){
        if(done)return;done=true;clearTimeout(timeout);script.remove();delete window[cb];
        if(err)reject(err);else resolve(data);
      }
      window[cb]=data=>finish(data,null);
      script.onerror=()=>finish(null,new Error('network'));
      script.src=url.toString();document.head.append(script);
    });
  }
  let activeQuery=null,hotels=[],lastPage=0,hasMore=false,searchSeq=0,busy=false;
  function normalizeHotel(h){
    if(!h||typeof h.name!=='string'||!h.name.trim())return null;
    const numeric=v=>Number.isFinite(Number(v))&&Number(v)>0?Number(v):null;
    return {name:h.name.slice(0,110),address:String(h.address||'').slice(0,160),
      photo:typeof h.thumbnail==='string'&&/^https:\/\//.test(h.thumbnail)?h.thumbnail:'',
      stars:[2,3,4,5].includes(Number(h.stars))?Number(h.stars):null,
      rating:numeric(h.rating),night:numeric(h.nightlyRate),total:numeric(h.totalRate)};
  }
  const element=(tag,cls,txt)=>{
    const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;
  };
  function consultUrl(h){
    const bits=['Hola, Latam Expeditions. Quisiera consultar disponibilidad del hotel '+h.name+'.',
      'Destino: '+activeQuery.destination+'.',
      'Check-in: '+activeQuery.check_in_date+'. Check-out: '+activeQuery.check_out_date+'.',
      'Viajeros: '+activeQuery.adults+' adultos y '+activeQuery.children+' niños'+
        (activeQuery.children_ages?' (edades: '+activeQuery.children_ages+')':'')+'.'];
    return 'https://wa.me/51906472060?text='+encodeURIComponent(bits.join('\n'));
  }
  function render(){
    cards.replaceChildren();
    const ordered=hotels.slice();
    if(sort.value==='recommended'&&activeQuery&&activeQuery.hotel_name){
      const focus=norm(activeQuery.hotel_name);
      ordered.sort((a,b)=>Number(norm(b.name)===focus)-Number(norm(a.name)===focus));
    }
    if(sort.value==='priceAsc')ordered.sort((a,b)=>(a.total||Infinity)-(b.total||Infinity));
    if(sort.value==='priceDesc')ordered.sort((a,b)=>(b.total||-1)-(a.total||-1));
    if(sort.value==='rating')ordered.sort((a,b)=>(b.rating||0)-(a.rating||0));
    ordered.forEach(h=>{
      const card=element('article','hotel-result-card');
      const photo=element('div','hotel-result-card__photo');
      if(h.photo){
        const img=document.createElement('img');img.src=h.photo;img.alt='Fotografía de '+h.name;img.loading='lazy';
        img.referrerPolicy='no-referrer';
        img.addEventListener('error',()=>{img.remove();photo.append(element('i','fa-solid fa-hotel'))},{once:true});
        photo.append(img);
      }else photo.append(element('i','fa-solid fa-hotel'));
      const body=element('div','hotel-result-card__body');
      body.append(element('span','hotel-result-card__category',h.stars?h.stars+' estrellas':'Alojamiento'));
      body.append(element('h3','',h.name));
      if(h.address)body.append(element('p','hotel-result-card__address',h.address));
      if(h.rating)body.append(element('p','hotel-result-card__rating','Valoración de viajeros: '+h.rating.toFixed(1)+'/5'));
      const price=element('div','hotel-result-card__price');
      if(h.night){
        price.append(element('b','',numberFormatter.format(h.night)),element('span','','por noche'));
        if(h.total)price.append(element('small','','Estancia consultada: '+numberFormatter.format(h.total)));
      }else if(h.total){
        price.append(element('b','',numberFormatter.format(h.total)),element('span','','por estancia'));
      }else price.append(element('span','','Tarifa por confirmar'));
      body.append(price);
      const cta=element('a','hotel-result-card__cta','Consultar disponibilidad');
      cta.href=consultUrl(h);cta.target='_blank';cta.rel='noopener noreferrer';
      body.append(cta);card.append(photo,body);cards.append(card);
    });
    const count=hotels.length;
    message.textContent=count?count+' '+(count===1?'hotel encontrado':'hoteles encontrados')+'.':'No encontramos hoteles con esta búsqueda. Prueba otras fechas o una categoría diferente.';
    loadMore.hidden=!hasMore;
  }
  function describe(q){
    const label=Number(q.adults)+' '+(q.adults==='1'?'adulto':'adultos')+
      (Number(q.children)?' · '+q.children+' '+(q.children==='1'?'niño':'niños'):'');
    return q.destination+' · '+q.check_in_date+' — '+q.check_out_date+' · '+label+
      (q.category!=='all'?' · '+q.category+' estrellas':'')+
      (q.hotel_name?' · '+q.hotel_name:'');
  }
  async function lookup(page=0){
    if(busy)return;
    const seq=++searchSeq;
    busy=true;submit.disabled=true;loadMore.disabled=true;
    const original=submit.innerHTML;
    submit.textContent='Buscando hoteles…';
    if(page===0)showError('');
    else message.textContent='Buscando más hoteles…';
    try {
      const data=await getHotels(activeQuery,page);
      if(seq!==searchSeq)return;
      if(!data||data.ok!==true)throw new Error(data&&data.message||'No se pudieron consultar hoteles.');
      const incoming=(Array.isArray(data.hotels)?data.hotels:[]).map(normalizeHotel).filter(Boolean);
      if(page===0)hotels=[];
      const names=new Set(hotels.map(h=>norm(h.name)));
      incoming.forEach(h=>{if(!names.has(norm(h.name))){hotels.push(h);names.add(norm(h.name))}});
      lastPage=page;hasMore=Boolean(data.hasMore)&&Number(data.nextPage)===page+1;
      $('hotelSummaryText').textContent=describe(activeQuery);
      $('hotelResultDetails').textContent=describe(activeQuery);
      summary.hidden=false;results.hidden=false;
      document.body.classList.add('lx-hotel-results-mode');
      document.body.classList.remove('lx-hotel-editing');
      render();
      if(page===0)results.scrollIntoView({behavior:'smooth',block:'start'});
    } catch(err){
      const text=String(err&&err.message||'');
      const safe=/^(timeout|network|not_configured)$/.test(text)?
        'No se pudo conectar con el buscador. Inténtalo de nuevo.':
        text.slice(0,180);
      if(page===0){showError(safe);document.body.classList.add('lx-hotel-editing')}
      else message.textContent=safe;
      console.warn('Hotel lookup unavailable:',text);
    } finally{
      busy=false;submit.disabled=false;loadMore.disabled=false;submit.innerHTML=original;
    }
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(busy)return;
    closeDest();closeTravelers();showError('');
    const problem=validate();
    if(problem){showError(problem);return}
    activeQuery=queryNow();
    hotels=[];hasMore=false;results.hidden=true;summary.hidden=true;
    document.body.classList.remove('lx-hotel-results-mode','lx-hotel-editing');
    lookup(0);
  });
  loadMore.addEventListener('click',()=>{if(!busy&&hasMore)lookup(lastPage+1)});
  sort.addEventListener('change',()=>{if(hotels.length)render()});
  $('hotelEditSearch').addEventListener('click',()=>{
    document.body.classList.add('lx-hotel-editing');
    window.scrollTo({top:0,behavior:'smooth'});destination.focus({preventScroll:true});
  });
  // Carrusel de alojamientos de inspiración. Se mantiene al final del contenido
  // cuando aparecen los resultados (orden DOM: buscador → resultados → destacados).
  const featuredTrack=$('hotelFeaturedTrack');
  if(featuredTrack){
    const prev=$('hotelFeaturedPrev'),next=$('hotelFeaturedNext');
    function updateFeaturedArrows(){
      const overflow=Math.max(0,featuredTrack.scrollWidth-featuredTrack.clientWidth);
      prev.disabled=featuredTrack.scrollLeft<=3||overflow<3;
      next.disabled=featuredTrack.scrollLeft>=overflow-3||overflow<3;
    }
    const scrollFeatured=direction=>{
      const first=featuredTrack.querySelector('.hotel-featured-card');
      featuredTrack.scrollBy({left:(first?first.getBoundingClientRect().width+18:290)*direction,behavior:'smooth'});
    };
    prev.addEventListener('click',()=>scrollFeatured(-1));
    next.addEventListener('click',()=>scrollFeatured(1));
    featuredTrack.addEventListener('scroll',updateFeaturedArrows,{passive:true});
    window.addEventListener('resize',updateFeaturedArrows);
    updateFeaturedArrows();
    featuredTrack.querySelectorAll('.hotel-featured-card__photo img').forEach(img=>{
      img.addEventListener('error',()=>{
        const holder=img.parentElement;img.remove();
        const fallback=document.createElement('i');
        fallback.className='fa-solid fa-hotel';fallback.setAttribute('aria-hidden','true');
        holder?.append(fallback);
      },{once:true});
    });
    featuredTrack.querySelectorAll('[data-featured-hotel]').forEach(button=>{
      button.addEventListener('click',()=>{
        if(busy)return;
        focusedHotel=button.dataset.featuredHotel||'';
        destination.value=button.dataset.featuredCity||'';
        category.value='all';
        category.dispatchEvent(new Event('change',{bubbles:true}));
        closeDest();closeTravelers();
        form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
      });
    });
  }

  // Permite precargar parámetros desde otras secciones sin limitar destinos.
  const params=new URLSearchParams(location.search);
  if(params.has('destination'))destination.value=String(params.get('destination')).slice(0,90);
  if(/^\d{4}-\d{2}-\d{2}$/.test(params.get('checkin')||'')&&params.get('checkin')>=checkin.min){
    checkin.value=params.get('checkin');checkin.dispatchEvent(new Event('change',{bubbles:true}));
  }
  if(/^\d{4}-\d{2}-\d{2}$/.test(params.get('checkout')||'')&&params.get('checkout')>=checkout.min){
    checkout.value=params.get('checkout');checkout.dispatchEvent(new Event('change',{bubbles:true}));
  }
  if(/^[1-8]$/.test(params.get('adults')||''))adults=Number(params.get('adults'));
  if(/^[0-6]$/.test(params.get('children')||'')){
    children=Math.min(Number(params.get('children')),10-adults);ages=Array(children).fill(8);
  }
  if(['all','2','3','4','5'].includes(params.get('category'))) {
    category.value=params.get('category');category.dispatchEvent(new Event('change',{bubbles:true}));
  }
  renderTravelers();
})();