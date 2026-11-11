/* Presentación de las fechas de la campaña; no acredita puntos.
   El programa de recompensas se implementará en el backend por separado. */
(() => {
  'use strict';
  function actualizarFecha() {
    const nodos=document.querySelectorAll('[data-welcome-deadline]');
    if(!nodos.length)return;
    const partes=new Intl.DateTimeFormat('en-US',{
      timeZone:'America/Lima',year:'numeric',month:'numeric',day:'numeric'
    }).formatToParts(new Date());
    const leer=(tipo)=>Number(partes.find(item=>item.type===tipo)?.value);
    const año=leer('year'),mes=leer('month'),dia=leer('day');
    if(!año||!mes||!dia)return;
    const ultimo=new Date(Date.UTC(año,mes,0)).getUTCDate();
    const corte=dia<=15?15:ultimo;
    const vencimiento=new Date(Date.UTC(año,mes-1,corte,12));
    const etiqueta=new Intl.DateTimeFormat('es-PE',{
      timeZone:'UTC',day:'numeric',month:'long',year:'numeric'
    }).format(vencimiento);
    nodos.forEach(n=>{
      n.textContent=etiqueta;
      if(n.tagName==='TIME')n.dateTime=`${año}-${String(mes).padStart(2,'0')}-${String(corte).padStart(2,'0')}`;
    });
  }
  // Mantener la vigencia correcta al volver a una pestaña que cruzó la medianoche.
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)actualizarFecha();});
  window.addEventListener('focus',actualizarFecha);
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',actualizarFecha):actualizarFecha();
})();
