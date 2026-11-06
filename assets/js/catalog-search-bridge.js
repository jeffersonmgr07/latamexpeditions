/* Preserve package-search context from homepage and make Medellin pilot discoverable. */
(() => {
 'use strict';
 const params=new URLSearchParams(location.search);
 const city=params.get('ciudad')||'';
 const arrival=params.get('fecha')||'';
 const origin=params.get('origen')||'';
 const cards=[...document.querySelectorAll('.trip-card')];
 const normalize=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const cityFilter=city==='medellin';
 const count=document.getElementById('resultsCount');
 let selected=0;
 if(cityFilter){
  const css=document.createElement('style');
  css.textContent='body.lx-city-medellin .trip-card:not(.lx-city-result){display:none!important}';
  document.head.append(css);document.body.classList.add('lx-city-medellin');
  const info=document.createElement('p');info.className='lx-catalog-context';
  info.textContent='Paquetes en Medellín'+(arrival?' · Llegada prevista: '+arrival:'')+
    ' · Puedes añadir vuelos, elegir hotel y experiencias en los paquetes compatibles.';
  const container=document.querySelector('[data-filterable]')||document.querySelector('main');
  container?.prepend(info);
 }
 cards.forEach(card=>{
  const title=normalize(card.querySelector('h3')?.textContent);
  const matched=title.includes('medellin');
  if(matched)card.classList.add('lx-city-result');
  if(cityFilter&&matched)selected++;
  // Carry dates/origin into detail so the new configurator uses the same trip.
  card.querySelectorAll('a[href^="paquetes/"]').forEach(link=>{
   const url=new URL(link.getAttribute('href'),location.href);
   if(arrival&&/^\d{4}-\d{2}-\d{2}$/.test(arrival))url.searchParams.set('fecha',arrival);
   if(/^[A-Z]{3}$/.test(origin))url.searchParams.set('origen',origin);
   link.href=url.pathname.split('/').slice(-2).join('/')+url.search;
  });
  if(title==='medellin esencial'){
   const link=document.createElement('a');link.className='lx-build-link';
   link.textContent='Arma tu viaje: vuelos + hotel + experiencias';
   const to=new URL('arma-tu-viaje.html',location.href);
   to.searchParams.set('package','medellin-esencial');
   if(arrival&&/^\d{4}-\d{2}-\d{2}$/.test(arrival))to.searchParams.set('arrival',arrival);
   if(/^[A-Z]{3}$/.test(origin))to.searchParams.set('origin',origin);
   link.href=to.pathname.split('/').pop()+to.search;
   (card.querySelector('.trip-card__body')||card).append(link);
  }
 });
 if(cityFilter&&count)count.textContent=selected+' paquetes en Medellín';
 const css=document.createElement('style');
 css.textContent='.lx-build-link{display:block;margin:9px 0 0;padding:10px 8px;border-radius:8px;text-align:center;background:#e9f8ee;color:#08713c;font-size:11px;font-weight:800}.lx-build-link:hover{background:#d5efdf}.lx-catalog-context{background:#eff8f2;border:1px solid #d2e8d9;border-radius:11px;padding:13px 17px;color:#28543b;margin:12px 0 22px;font-size:12px}';
 document.head.append(css);
})();