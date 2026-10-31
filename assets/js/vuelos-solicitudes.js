/* LATAM Expeditions — Solicitud interna, NO emisión de boleto. */
(() => {
  'use strict';
  const modal=document.getElementById('flightQuoteModal');
  const frame=document.getElementById('flightRequestFrame');
  const placeholder=document.getElementById('flightModalNotReady');
  const form=document.getElementById('flightsForm');
  if(!modal||!form)return;
  let restoreFocus=null;
  const api=String(window.LATAM_FLIGHTS_API_URL||'');
  const apiIsValid=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(api);
  const enabled=window.LATAM_FLIGHTS_REQUESTS_ENABLED===true;
  function quoteUrl(price,departure,returnDate){
    const query={
      mode:'request',
      origin:form.querySelector('#flightOrigin').value,
      destination:form.querySelector('#flightDestination').value,
      trip:form.elements.tripType.value,
      departure,returnDate,
      adults:form.querySelector('#flightAdults').value,
      children:form.querySelector('#flightChildren').value,
      observedPrice:String(price)
    };
    const u=new URL(api);
    Object.entries(query).forEach(([k,v])=>u.searchParams.set(k,v));
    return u.toString();
  }
  function open(offerBtn) {
    restoreFocus=document.activeElement;
    modal.hidden=false;
    document.body.classList.add('flight-modal-open');
    const base=Number(offerBtn.dataset.price);
    const departure=offerBtn.dataset.outbound;
    const returnDate=offerBtn.dataset.inbound;
    const canLoad=enabled && apiIsValid && Number.isFinite(base) && base>0 &&
      /^\d{4}-\d\d-\d\d$/.test(departure||'');
    placeholder.hidden=canLoad;
    frame.hidden=!canLoad;
    if(canLoad) frame.src=quoteUrl(base,departure,returnDate);
    modal.querySelector('.flight-modal__close').focus();
  }
  function close() {
    modal.hidden=true;
    frame.src='about:blank';frame.hidden=true;
    document.body.classList.remove('flight-modal-open');
    if(restoreFocus&&restoreFocus.focus)restoreFocus.focus();
  }
  document.addEventListener('click',event=>{
    const a=event.target.closest('[data-flight-request]');
    if(a){event.preventDefault();open(a);return;}
    if(event.target.closest('[data-flight-modal-close]')&&!modal.hidden) close();
  });
  document.addEventListener('keydown',event=>{
    if(modal.hidden)return;
    if(event.key==='Escape')close();
    if(event.key==='Tab'){
      // Keep focus on outer modal until embedded form is focused.
      const tabbable=[...modal.querySelectorAll('button:not([disabled]),a[href],iframe:not([hidden])')]
        .filter(el=>el.getClientRects().length);
      if(!tabbable.length)return;
      const first=tabbable[0],last=tabbable[tabbable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
})();