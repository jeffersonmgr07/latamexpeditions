/* LATAM Expeditions · controles de fecha y listas con aspecto propio.
 * Se mantienen los <select> e <input> originales para compatibilidad con
 * los formularios y sus enlaces, pero nunca se invoca un picker nativo. */
(() => {
 'use strict';
 const targets=['searchOrigin','searchType','searchDate','homeFlightOrigin',
  'homeFlightDestination','homeFlightDeparture','homeFlightReturn',
  'homeFlightAdults','homeHotelDestination','homeHotelCheckin',
  'homeHotelCheckout','homeHotelGuests',
  'flightDeparture','flightReturn','flightCabin',
   'hotelCheckin','hotelCheckout','hotelCategory'];
 const months=['enero','febrero','marzo','abril','mayo','junio','julio',
  'agosto','septiembre','octubre','noviembre','diciembre'];
 const shortMonths=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
 const weekdays=['Lu','Ma','Mi','Ju','Vi','Sa','Do'];
 const active=[];
 const create=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;
   if(text!==undefined)e.textContent=text;return e};
 const parse=s=>{if(!/^\d{4}-\d{2}(?:-\d{2})?$/.test(s||''))return null;
   const p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]||1)};
 const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),
   String(d.getDate()).padStart(2,'0')].join('-');
 const format=(value,type)=>{const d=parse(value);if(!d)return '';
   if(type==='month')return months[d.getMonth()][0].toUpperCase()+months[d.getMonth()].slice(1)+' '+d.getFullYear();
   return String(d.getDate()).padStart(2,'0')+' '+shortMonths[d.getMonth()]+' '+d.getFullYear()};
 function closeOthers(current){active.forEach(o=>{if(o!==current)o.close()})}
 function wrap(input){
   const host=create('div','lx-control-host');
   input.parentNode.insertBefore(host,input);host.append(input);input.classList.add('lx-original-control');
   input.tabIndex=-1;input.setAttribute('aria-hidden','true');
   const trigger=create('button','lx-picker-trigger');trigger.type='button';
   trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');
   const text=create('span'),chevron=create('i','fa-solid fa-chevron-down');
   chevron.setAttribute('aria-hidden','true');trigger.append(text,chevron);
   const label=document.querySelector('label[for="'+input.id+'"]');
   trigger.id=input.id+'StyledPicker';
   if(label){
     trigger.setAttribute('aria-label',label.textContent.trim());
     // Clicking the label must focus our control, not invoke the browser picker.
     label.htmlFor=trigger.id;
   }
   if(input.type==='month'||input.type==='date'){
     chevron.className='fa-regular fa-calendar-days';
   }
   const panel=create('div','lx-picker-popover');panel.hidden=true;
   panel.setAttribute('role','dialog');panel.setAttribute('aria-label',label?.textContent.trim()||'Seleccionar');
   host.append(trigger,panel);
   const flightPicker=!!input.closest('body.lx-flights-only,body.lx-hotels-only');
   let portaled=false;
   const positionPanel=()=>{
     if(!portaled||panel.hidden)return;
     const anchor=trigger.getBoundingClientRect();
     const vw=document.documentElement.clientWidth, vh=window.innerHeight;
     const width=Math.min(350,vw-20);
     const left=Math.max(10,Math.min(anchor.left,vw-width-10));
     panel.style.width=width+'px';
     panel.style.position='fixed';
     panel.style.left=left+'px';
     panel.style.right='auto';
     panel.style.zIndex='9998';
     panel.style.maxHeight='min(430px, calc(100dvh - 25px))';
     const usableBelow=vh-anchor.bottom-12;
     const usableAbove=anchor.top-12;
     const want=Math.min(340,panel.scrollHeight||340);
     const flip=usableBelow<want&&usableAbove>usableBelow;
     const max=Math.max(120,Math.min(430,flip?usableAbove:usableBelow));
     panel.style.maxHeight=max+'px';
     panel.style.top=(flip?Math.max(8,anchor.top-Math.min(want,max)-9):Math.min(vh-120,anchor.bottom+9))+'px';
     panel.style.overflowY='auto';
   };
   const api={input,trigger,panel,close(focus=false){
     panel.hidden=true;trigger.setAttribute('aria-expanded','false');
     if(portaled){host.append(panel);portaled=false;panel.removeAttribute('style')}
     if(focus)trigger.focus();
   },open(){
     closeOthers(api);
     if(flightPicker){document.body.append(panel);portaled=true}
     panel.hidden=false;trigger.setAttribute('aria-expanded','true');
     positionPanel();
   }};
   active.push(api);
   document.addEventListener('pointerdown',e=>{
     if(!host.contains(e.target)&&!panel.contains(e.target))api.close();
   });
   window.addEventListener('resize',positionPanel);
   window.addEventListener('scroll',positionPanel,true);
   trigger.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();api.close(true)}});
   panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();api.close(true)}});
   return {...api,text};
 }
 function enhanceSelect(select){
   if(!select||select.tagName!=='SELECT')return;
   const api=wrap(select),{trigger,panel}=api;
   function refresh(){const opt=select.selectedOptions[0];
     api.text.textContent=opt?.textContent?.trim()||'Seleccionar';
     trigger.classList.toggle('is-placeholder',!select.value);
   }
   function populate(){
     panel.replaceChildren();
     if(select.options.length>12){
       const search=create('input','lx-picker-search');search.type='search';
       search.placeholder='Buscar en la lista…';search.setAttribute('aria-label','Buscar opciones');
       panel.append(search);
       search.addEventListener('input',()=>{
         const q=search.value.toLocaleLowerCase('es').trim();
         panel.querySelectorAll('.lx-option').forEach(b=>b.hidden=!b.textContent.toLocaleLowerCase('es').includes(q));
         panel.querySelectorAll('.lx-option-group').forEach(group=>{
           let next=group.nextElementSibling,visible=false;
           while(next&&!next.classList.contains('lx-option-group')){if(!next.hidden)visible=true;next=next.nextElementSibling;}
           group.hidden=!visible;
         });
       });
     }
     const opts=[...select.children];const output=[];
     opts.forEach(child=>{
       const group=child.tagName==='OPTGROUP'?child:null;
       if(group)output.push(create('div','lx-option-group',group.label));
       const options=group?[...group.children]:[child];
       options.forEach(opt=>{
         if(opt.tagName!=='OPTION')return;
         const b=create('button','lx-option',opt.textContent.trim());b.type='button';
         b.dataset.value=opt.value;b.setAttribute('role','option');
         b.setAttribute('aria-selected',String(opt.value===select.value));
         b.addEventListener('click',()=>{
           select.value=opt.value;
           select.dispatchEvent(new Event('change',{bubbles:true}));
           refresh();api.close(true);
         });output.push(b);
       });
     });
     panel.append(...output);
   }
   trigger.addEventListener('click',()=>{if(!panel.hidden){api.close();return}populate();api.open();
     (panel.querySelector('.lx-picker-search')||panel.querySelector('[aria-selected="true"]')||panel.querySelector('button'))?.focus()});
   select.addEventListener('change',refresh);refresh();
 }
 function enhanceDate(input){
   if(!input||!['date','month'].includes(input.type))return;
   const type=input.type,api=wrap(input),{trigger,panel}=api;
   if(!input.value && type==='month')input.min=iso(new Date()).slice(0,7);
   if(type==='month')api.text.textContent='Elige una fecha';
   function refresh(){
     api.text.textContent=format(input.value,type)||(type==='month'?'Elige una fecha':'Selecciona una fecha');
     trigger.classList.toggle('is-placeholder',!input.value);
   }
   function allowed(value){
     if(input.min&&value<input.min)return false;
     if(input.max&&value>input.max)return false;
     return true;
   }
   let shown=parse(input.value)||parse(input.min)||new Date();shown=new Date(shown.getFullYear(),shown.getMonth(),1);
   const flightsDeparture=input.id==='flightDeparture';
   const hotelsCheckin=input.id==='hotelCheckin';
   const hotelsCheckout=input.id==='hotelCheckout';
   // La selección del check-in hotelero puede finalizar con el check-out
   // dentro del MISMO calendario. No cambia el selector de vuelos ni otros productos.
   let pickingReturn=false;
   let previewUntil='';
   function emit(target,value){
     target.value=value;
     target.dispatchEvent(new Event('input',{bubbles:true}));
     target.dispatchEvent(new Event('change',{bubbles:true}));
   }
   function choose(value){
     const roundtrip=flightsDeparture&&
       document.querySelector('#flightsForm [name="tripType"]:checked')?.value==='roundtrip';
     if((roundtrip||hotelsCheckin)&&value){
       const paired=document.getElementById(hotelsCheckin?'hotelCheckout':'flightReturn');
       if(!pickingReturn){
         emit(input,value);
         if(paired)emit(paired,'');
         pickingReturn=true;
         previewUntil='';
         draw();
         return;
       }
       if(value<=input.value){
         emit(input,value);
         if(paired)emit(paired,'');
         previewUntil='';
         draw();
         return;
       }
       if(paired)emit(paired,value);
       pickingReturn=false;
       previewUntil='';
       refresh();
       api.close(true);
       return;
     }
     pickingReturn=false;previewUntil='';
     emit(input,value);
     refresh();api.close(true);
   }
   function draw(){
     panel.replaceChildren();
     const header=create('div','lx-calendar-header');
     const prev=create('button','lx-calendar-nav','‹'),next=create('button','lx-calendar-nav','›');
     prev.type='button';next.type='button';prev.setAttribute('aria-label','Anterior');
     next.setAttribute('aria-label','Siguiente');
     const caption=create('strong','',type==='month'?String(shown.getFullYear()):
       months[shown.getMonth()]+' '+shown.getFullYear());
     header.append(prev,caption,next);panel.append(header);
     prev.addEventListener('click',()=>{shown=new Date(shown.getFullYear(),shown.getMonth()+(type==='month'?-12:-1),1);draw()});
     next.addEventListener('click',()=>{shown=new Date(shown.getFullYear(),shown.getMonth()+(type==='month'?12:1),1);draw()});
     if(type==='month'){
       const grid=create('div','lx-calendar-months');
       months.forEach((month,index)=>{
         const value=shown.getFullYear()+'-'+String(index+1).padStart(2,'0');
         const btn=create('button','lx-calendar-month',month.slice(0,3).toUpperCase());btn.type='button';
         btn.disabled=!allowed(value);btn.classList.toggle('is-selected',input.value===value);
         btn.addEventListener('click',()=>choose(value));grid.append(btn);
       });
       panel.append(grid);
     }else{
       const rangeMode=hotelsCheckin||hotelsCheckout||(flightsDeparture&&
         document.querySelector('#flightsForm [name="tripType"]:checked')?.value==='roundtrip');
       if(rangeMode){
         const hint=create('p','lx-calendar-range-hint',
           hotelsCheckin?(pickingReturn?'Selecciona la fecha de salida':'Selecciona la entrada y después la salida'):
           hotelsCheckout?'Selecciona una nueva fecha de salida':
           pickingReturn?'Selecciona la fecha de regreso':'Selecciona la salida y luego el regreso');
         panel.append(hint);
       }
       const grid=create('div','lx-calendar-grid');
       weekdays.forEach(day=>grid.append(create('span','lx-calendar-weekday',day)));
       const first=(new Date(shown.getFullYear(),shown.getMonth(),1).getDay()+6)%7;
       for(let i=0;i<first;i++)grid.append(create('span'));
       const days=new Date(shown.getFullYear(),shown.getMonth()+1,0).getDate();
       for(let day=1;day<=days;day++){
         const value=iso(new Date(shown.getFullYear(),shown.getMonth(),day));
         const btn=create('button','lx-calendar-day',String(day));btn.type='button';
         btn.disabled=!allowed(value);btn.classList.toggle('is-selected',value===input.value);
         const paired=hotelsCheckin?'hotelCheckout':'flightReturn';
         const rangeStart=hotelsCheckout?(document.getElementById('hotelCheckin')?.value||''):input.value;
         const rangeEnd=hotelsCheckout?input.value:(pickingReturn?previewUntil:(document.getElementById(paired)?.value||''));
         if(rangeMode&&rangeStart&&rangeEnd&&value>rangeStart&&value<rangeEnd)btn.classList.add('is-in-range');
         if(rangeMode&&rangeStart&&value===rangeEnd)btn.classList.add('is-range-end');
         if(rangeMode&&rangeStart&&value===rangeStart)btn.classList.add('is-range-start');
         btn.setAttribute('aria-label',value);
         btn.addEventListener('click',()=>choose(value));
         if(rangeMode&&(!hotelsCheckout)){
           btn.addEventListener('mouseenter',()=>{
             if(!pickingReturn||value<=input.value||value===previewUntil)return;
             previewUntil=value;
             grid.querySelectorAll('.lx-calendar-day').forEach(dayButton=>{
               const v=dayButton.dataset.iso;
               dayButton.classList.toggle('is-in-range',!!v&&v>input.value&&v<value);
               dayButton.classList.toggle('is-range-end',v===value);
             });
           });
         }
         btn.dataset.iso=value;
         grid.append(btn);
       }
       panel.append(grid);
     }
     if(!input.required){
       const clear=create('button','lx-calendar-today','Borrar selección');clear.type='button';
       clear.addEventListener('click',()=>choose(''));panel.append(clear);
     }
   }
   trigger.addEventListener('click',()=>{
     if(!panel.hidden){api.close();return}
     pickingReturn=false;previewUntil='';
     const d=parse(input.value)||parse(input.min)||new Date();
     shown=new Date(d.getFullYear(),d.getMonth(),1);draw();api.open();
     panel.querySelector('.lx-calendar-day:not(:disabled),.lx-calendar-month:not(:disabled),.lx-calendar-nav')?.focus();
   });
   input.addEventListener('change',refresh);refresh();
 }
 targets.forEach(id=>{
   const input=document.getElementById(id);if(!input)return;
   if(input.tagName==='SELECT')enhanceSelect(input);
   else enhanceDate(input);
 });
 // La comprobación se hace en el JS del formulario, en su botón visible,
 // para evitar que el navegador enfoque inputs ocultos al enviar.
 document.querySelectorAll('#homeFlightSearch,#homeHotelsInquiry').forEach(form=>form.noValidate=true);
})();