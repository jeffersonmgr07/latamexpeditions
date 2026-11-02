/* LATAM Expeditions · controles de fecha y listas con aspecto propio.
 * Se mantienen los <select> e <input> originales para compatibilidad con
 * los formularios y sus enlaces, pero nunca se invoca un picker nativo. */
(() => {
 'use strict';
 const targets=['searchDestination','searchType','searchDate','homeFlightOrigin',
  'homeFlightDestination','homeFlightDeparture','homeFlightReturn',
  'homeFlightAdults','homeHotelDestination','homeHotelCheckin',
  'homeHotelCheckout','homeHotelGuests'];
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
   if(label){trigger.setAttribute('aria-label',label.textContent.trim());}
   const panel=create('div','lx-picker-popover');panel.hidden=true;
   panel.setAttribute('role','dialog');panel.setAttribute('aria-label',label?.textContent.trim()||'Seleccionar');
   host.append(trigger,panel);
   const api={input,trigger,panel,close(focus=false){
     panel.hidden=true;trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus();
   },open(){closeOthers(api);panel.hidden=false;trigger.setAttribute('aria-expanded','true');}};
   active.push(api);
   document.addEventListener('pointerdown',e=>{if(!host.contains(e.target))api.close()});
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
   function choose(value){
     input.value=value;
     input.dispatchEvent(new Event('input',{bubbles:true}));
     input.dispatchEvent(new Event('change',{bubbles:true}));
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
       const grid=create('div','lx-calendar-grid');
       weekdays.forEach(day=>grid.append(create('span','lx-calendar-weekday',day)));
       const first=(new Date(shown.getFullYear(),shown.getMonth(),1).getDay()+6)%7;
       for(let i=0;i<first;i++)grid.append(create('span'));
       const days=new Date(shown.getFullYear(),shown.getMonth()+1,0).getDate();
       for(let day=1;day<=days;day++){
         const value=iso(new Date(shown.getFullYear(),shown.getMonth(),day));
         const btn=create('button','lx-calendar-day',String(day));btn.type='button';
         btn.disabled=!allowed(value);btn.classList.toggle('is-selected',value===input.value);
         btn.setAttribute('aria-label',value);btn.addEventListener('click',()=>choose(value));grid.append(btn);
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