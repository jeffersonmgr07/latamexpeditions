/* Paquetes: filtra por país y ciudad sin romper la vitrina ni los filtros existentes.
 * El contexto de fechas/origen/viajeros viaja hasta el detalle del paquete.
 */
(()=>{
 'use strict';
 const params=new URLSearchParams(location.search);
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const slug=s=>norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const country=slug(params.get('destino')||'');
 const city=slug(params.get('ciudad')||'');
 const place=norm(params.get('lugar')||'');
 const origin=String(params.get('origen')||'').toUpperCase();
 const date=params.get('fecha')||'',adults=params.get('adultos')||'2',children=params.get('ninos')||'0';
 const style=slug(params.get('estilo')||'');
 const cards=[...document.querySelectorAll('.trip-card')];
 const countries=['peru','colombia','argentina','chile','brasil','bolivia','ecuador','mexico'];
 const cityAliases={'machu-picchu':['machu picchu'],'rio-de-janeiro':['rio de janeiro','rio '],
 'eje-cafetero':['eje cafetero','salento'],'san-pedro-de-atacama':['atacama','san pedro'],
 'foz-de-iguazu':['foz do igua'],'torres-del-paine':['torres del paine'],
 'san-andres':['san andres'],'guatape':['guatape'],'santa-marta':['santa marta','tayrona','minca'],
 'villa-de-leyva':['villa de leyva'],'zipaquira':['zipaquira'],'iguazu':['iguazu'],
 'ica':['ica','huacachina'],'arequipa':['arequipa','colca'],'puno':['puno','titicaca']};
 const tokens=cityAliases[city]||[city.replace(/-/g,' ')];
 const anchorParams=new URLSearchParams();
 if(/^[A-Z]{3}$/.test(origin))anchorParams.set('origen',origin);
 if(/^\d{4}-\d{2}-\d{2}$/.test(date))anchorParams.set('fecha',date);
 if(/^[1-9]$/.test(adults))anchorParams.set('adultos',adults);
 if(/^[0-6]$/.test(children))anchorParams.set('ninos',children);
 if(city)anchorParams.set('ciudad',city);
 if(country)anchorParams.set('destino',country);
 const linkFor=(relative)=>{
  const u=new URL(relative,location.href);
  anchorParams.forEach((v,k)=>u.searchParams.set(k,v));
  return u.pathname.split('/').slice(-2).join('/')+u.search+u.hash;
 };
 const header=document.createElement('div');header.className='lx-search-summary';
 const tag=document.createElement('div');tag.className='lx-search-tags';
 if(country||city||date){
  const labels=[params.get('lugar')||params.get('destino')||'Todos los destinos',
   date?'Llegada: '+date:'', 'Desde: '+(origin||'a elegir'),
   adults+' adultos',children+' niños'].filter(Boolean);
  labels.forEach(t=>{const label=document.createElement('span');label.textContent=t;tag.append(label)});
  header.append(tag);
  const change=document.createElement('a');change.href='index.html#explorar';change.textContent='Modificar búsqueda';change.className='lx-modify-search';header.append(change);
  (document.querySelector('[data-filterable] .filters')||document.querySelector('[data-filterable]'))?.before(header);
 }
 const styleElement=document.createElement('style');
 styleElement.textContent=
 '.lx-search-summary{display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap;padding:13px 17px;margin:0 auto 20px;max-width:1200px;border:1px solid #d7eadb;background:#f2faf4;border-radius:12px}'+
 '.lx-search-tags{display:flex;gap:8px;flex-wrap:wrap}.lx-search-tags span{background:#fff;border:1px solid #e0ece5;border-radius:25px;padding:5px 10px;color:#22583a;font-size:11px;font-weight:650}'+
 '.lx-modify-search{color:#07873e;font-weight:800;font-size:12px}'+
 '.trip-card.lx-destination-mismatch{display:none!important}.trip-card.lx-style-mismatch{display:none!important}'+
 '.lx-build-link{display:block;margin:10px 0 0;padding:10px 8px;border-radius:8px;text-align:center;background:#07873e;color:#fff;font-size:11px;font-weight:800}.lx-build-link:hover{background:#066d33}';
 document.head.append(styleElement);
 cards.forEach(card=>{
  const title=norm(card.querySelector('h3')?.textContent||'');
  const meta=norm(card.querySelector('.meta')?.textContent||'');
  const excerpt=norm(card.querySelector('.trip-card__body p')?.textContent||'');
  const text=title+' '+meta+' '+excerpt;
  const countriesTags=norm(card.dataset.tags||'');
  const byCountry=!country||!countries.includes(country)||countriesTags.split(/\s+/).includes(country);
  const byCity=!city||tokens.some(t=>text.includes(t));
  card.classList.toggle('lx-destination-mismatch',!(byCountry&&byCity));
  card.dataset.lxMatch=String(byCountry&&byCity);
  const existing=card.querySelector('a[href^="paquetes/"]');
  if(!existing)return;
  existing.href=linkFor(existing.getAttribute('href'));
  if(!card.querySelector('.lx-build-link')){
   const a=document.createElement('a');a.className='lx-build-link';
   a.href=existing.href+(existing.href.includes('#')?'':'#personaliza');
   a.textContent='Personalizar paquete: hotel + actividades + vuelos';
   (card.querySelector('.trip-card__body')||card).append(a);
  }
 });
 // Optional style; do not suppress all destination results when catalogue lacks this metadata.
 if(style){
  const matching=cards.filter(c=>c.dataset.lxMatch==='true'&&
    norm(c.dataset.tags||'').split(/\s+/).includes(style));
  if(matching.length)cards.forEach(c=>c.classList.toggle('lx-style-mismatch',
    c.dataset.lxMatch==='true'&&!matching.includes(c)));
 }
 const count=document.getElementById('resultsCount'),empty=document.getElementById('emptyState');
 const update=()=>{
  const n=cards.filter(c=>!c.hidden&&!c.classList.contains('lx-destination-mismatch')&&
    !c.classList.contains('lx-style-mismatch')).length;
  if(count)count.textContent=n+' paquete'+(n===1?'':'s')+' encontrado'+(n===1?'':'s');
  if(empty)empty.hidden=n>0;
 };
 document.addEventListener('DOMContentLoaded',update,{once:true});
 document.querySelector('[data-filterable]')?.addEventListener('click',()=>setTimeout(update,0));
 update();
})();