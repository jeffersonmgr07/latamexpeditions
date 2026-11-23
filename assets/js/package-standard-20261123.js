/* Ajusta orden y dos columnas de secciones de paquetes sin tocar tarifas o contenido del itinerario. */
(function(){
  'use strict';
  function run(){
    const main=document.querySelector('.product-detail-section .detail-main');
    if(!main)return;
    const norm=(s)=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    const directCards=()=>Array.from(main.children).filter(e=>e.classList.contains('detail-card'));
    const find=(rx)=>directCards().find(e=>rx.test(norm(e.querySelector(':scope > h2')?.textContent)));
    const essential=find(/^informacion esencial/);
    const about=find(/^sobre este paquete/);
    if(essential&&main.firstElementChild!==essential)main.prepend(essential);
    if(about&&essential&&essential.nextElementSibling!==about)essential.after(about);
    const itinerary=find(/^itinerario/);
    const hotel=find(/^(hotel y acomodacion|alojamiento incluido|alojamiento premium)/);
    if(itinerary&&hotel&&hotel.previousElementSibling!==itinerary)itinerary.after(hotel);
    const includes=find(/^que incluye$|^servicios contemplados$/);
    const excludes=find(/^no incluye$/);
    if(includes&&excludes&&!includes.closest('.tour-split')){
      const split=document.createElement('div');
      split.className='tour-split lx-standard-includes';
      includes.before(split);
      split.append(includes,excludes);
    }
    const split=main.querySelector(':scope > .tour-split');
    if(split){
      const hotelAnchor=hotel||itinerary;
      if(hotelAnchor && hotelAnchor.nextElementSibling!==split)hotelAnchor.after(split);
    }
    // Los selectores de vuelos y hotel se insertan antes del itinerario por la UI del paquete.
    const facts=main.querySelector('.tour-facts.product-facts');
    if(facts)facts.classList.add('lx-standard-facts');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
