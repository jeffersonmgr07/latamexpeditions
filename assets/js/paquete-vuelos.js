/* Escapada Medellín 4D/3N: las fechas son indicativas y deben comprobarse
 * según el horario real de llegada y salida de los vuelos. */
(() => {
 const form=document.getElementById('packageFlightBundle');
 if(!form)return;
 const arrival=document.getElementById('packageArrivalDate');
 const back=document.getElementById('packageCalculatedReturn');
 const hidden=document.getElementById('packageFlightReturn');
 const today=new Date();
 const earliest=new Date(today.getFullYear(),today.getMonth(),today.getDate()+2);
 function iso(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
 arrival.min=iso(earliest);
 function update(){
   if(!arrival.value){back.value='';hidden.value='';return;}
   const d=new Date(arrival.value+'T12:00:00');
   if(!Number.isFinite(d.getTime())){back.value='';hidden.value='';return;}
   d.setDate(d.getDate()+3);
   back.value=hidden.value=iso(d);
 }
 arrival.addEventListener('change',update);
 form.addEventListener('submit',e=>{
   update();
   if(!hidden.value||arrival.value<arrival.min){e.preventDefault();arrival.setCustomValidity('Selecciona una llegada válida.');arrival.reportValidity();}
   else arrival.setCustomValidity('');
 });
})();