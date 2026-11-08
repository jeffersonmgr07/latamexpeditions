/* Catálogo · Contexto de búsqueda, título breve y continuidad de parámetros. */
(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  const city=params.get('ciudad')||'';
  const country=params.get('destino')||'';
  const arrival=params.get('fecha')||'';
  const origin=(params.get('origen')||'').toUpperCase();
  const adults=Math.max(1,Math.min(9,Number(params.get('adults'))||Number(params.get('viajeros'))||2));
  const children=Math.max(0,Math.min(8,Number(params.get('children'))||0));
  const total=adults+children;
  const normalize=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const cities={'medellin':'Medellín','bogota':'Bogotá','cartagena':'Cartagena',
    'santa-marta':'Santa Marta','machu-picchu':'Machu Picchu','cusco':'Cusco',
    'arequipa':'Arequipa','puno':'Puno','lima':'Lima','cali':'Cali',
    'guatape':'Guatapé','san-andres':'San Andrés','eje-cafetero':'Eje Cafetero',
    'buenos-aires':'Buenos Aires','iguazu':'Iguazú','patagonia':'Patagonia',
    'rio-de-janeiro':'Río de Janeiro','quito':'Quito','galapagos':'Galápagos',
    'santiago':'Santiago','atacama':'Atacama','riviera-maya':'Riviera Maya',
    'la-paz':'La Paz','uyuni':'Salar de Uyuni'};
  const countries={'peru':'Perú','colombia':'Colombia','argentina':'Argentina',
    'brasil':'Brasil','ecuador':'Ecuador','chile':'Chile','mexico':'México',
    'bolivia':'Bolivia','uruguay':'Uruguay','venezuela':'Venezuela','costa-rica':'Costa Rica'};
  const fallback=document.querySelector('.lx-results-catalog')?.dataset.searchFallback==='true';
  const cityName=cities[city]||(city?city.replace(/-/g,' '):'');
  const countryName=countries[country]||'Latinoamérica';
  const heading=document.getElementById('lxResultsHeading');
  const summary=document.getElementById('lxResultsSummary');
  if(heading)heading.textContent=fallback?'Más opciones en '+countryName:
    cityName||((country)?countryName:'Destinos disponibles');
  const parts=[];
  if(fallback)parts.push('Sin paquetes exactos para '+cityName+'.');
  if(arrival&&/^\d{4}-\d{2}-\d{2}$/.test(arrival)){
    const d=new Date(arrival+'T12:00:00');
    if(!Number.isNaN(d.getTime()))parts.push('Llegada: '+d.toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'}));
  }
  if(params.has('adults')||params.has('viajeros')){
    parts.push(adults+' '+(adults===1?'adulto':'adultos')+
      (children?' · '+children+' '+(children===1?'niño':'niños'):''));
  }
  if(summary)summary.textContent=parts.join('  ·  ')||'Elige el paquete que más te guste.';
  const edit=document.querySelector('.lx-results-intro__edit');
  if(edit){
    const url=new URL('index.html',location.href);
    ['ciudad','destino','fecha','origen','adults','children'].forEach(k=>{
      if(params.has(k))url.searchParams.set(k,params.get(k));
    });
    url.hash='explorar';edit.href=url.href;
  }
  const searchCanBeConfigured=adults>=1&&total<=4&&children<=2;
  document.querySelectorAll('.lx-results-catalog .trip-card').forEach(card=>{
    card.querySelectorAll('a[href^="paquetes/"]').forEach(link=>{
      const url=new URL(link.getAttribute('href'),location.href);
      if(arrival&&/^\d{4}-\d{2}-\d{2}$/.test(arrival))url.searchParams.set('fecha',arrival);
      if(/^[A-Z]{3}$/.test(origin))url.searchParams.set('origen',origin);
      url.searchParams.set('adults',String(adults));
      url.searchParams.set('children',String(children));
      link.href=url.pathname.split('/').slice(-2).join('/')+url.search;
    });
    const title=normalize(card.querySelector('h3')?.textContent||'');
    if(title!=='medellin esencial')return;
    const link=document.createElement('a');link.className='lx-build-link';
    if(searchCanBeConfigured){
      link.textContent='Personalizar hotel, vuelos y actividades';
      const url=new URL('arma-tu-viaje.html',location.href);
      url.searchParams.set('package','medellin-esencial');
      if(arrival&&/^\d{4}-\d{2}-\d{2}$/.test(arrival))url.searchParams.set('arrival',arrival);
      if(/^[A-Z]{3}$/.test(origin))url.searchParams.set('origin',origin);
      url.searchParams.set('adults',String(adults));
      url.searchParams.set('children',String(children));
      link.href=url.pathname.split('/').pop()+url.search;
    }else{
      link.textContent='Consultar paquete para '+total+' viajeros';
      const detail='Hola, quisiera cotizar Medellín Esencial para '+adults+
        ' adulto(s) y '+children+' niño(s)'+(arrival?', llegada '+arrival:'')+'.';
      link.href='https://wa.me/51906472060?text='+encodeURIComponent(detail);
      link.target='_blank';link.rel='noopener noreferrer';
    }
    (card.querySelector('.trip-card__body')||card).append(link);
  });
})();
