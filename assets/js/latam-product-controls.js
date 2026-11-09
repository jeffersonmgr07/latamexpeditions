/* LATAM Expeditions · controles compartidos de fecha y viajeros */
(function(){
  'use strict';
  const el=(tag,className,text)=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''))&&!Number.isNaN(Date.parse(s+'T12:00:00'));
  const format=s=>valid(s)?new Intl.DateTimeFormat('es-PE',{day:'numeric',month:'short',year:'numeric'}).format(new Date(s+'T12:00:00')):'Seleccionar fecha';
  // Mismo trazo SVG de los desplegables de la reserva.
  const icon=(kind)=>{
    const node=el('span',kind==='calendar'?'lx-date-icon':'lx-travel-chevron');
    node.setAttribute('aria-hidden','true');
    node.innerHTML=kind==='calendar'?
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>':
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
    return node;
  };

  function calendar(input){
    if(!input || input.dataset.lxCalendar)return {sync:()=>{}};
    input.dataset.lxCalendar='1';
    const host=input.closest('label');
    if(!host)return {sync:()=>{}};
    const heading=(host.firstChild?.textContent||'fecha').trim();
    const overlay=input.closest('.lx-package-modal');
    input.type='hidden';input.tabIndex=-1;
    host.classList.add('lx-custom-date-field');
    const trigger=el('button','lx-date-trigger');
    trigger.type='button';trigger.setAttribute('aria-haspopup','dialog');
    trigger.setAttribute('aria-expanded','false');
    trigger.setAttribute('aria-label','Seleccionar '+heading);
    const display=el('span','lx-date-display');
    trigger.append(display,icon('calendar'));
    const pop=el('div','lx-date-calendar');pop.hidden=true;pop.setAttribute('role','dialog');
    pop.setAttribute('aria-label','Calendario de '+heading);
    const head=el('div','lx-date-calendar-head'),prev=el('button','lx-date-nav','‹'),next=el('button','lx-date-nav','›');
    prev.type=next.type='button';prev.setAttribute('aria-label','Mes anterior');next.setAttribute('aria-label','Mes siguiente');
    const title=el('strong','lx-date-month');head.append(prev,title,next);
    const weekdays=el('div','lx-date-weekdays');
    for(const day of ['L','M','X','J','V','S','D'])weekdays.append(el('span','',day));
    const grid=el('div','lx-date-days');
    pop.append(head,weekdays,grid);
    host.append(trigger);
    if(overlay){pop.classList.add('is-modal-calendar');overlay.append(pop)}
    else host.append(pop);
    let view=new Date();
    function position(){
      if(!overlay||pop.hidden)return;
      const rect=trigger.getBoundingClientRect(),gutter=10;
      const width=Math.min(322,window.innerWidth-gutter*2);
      pop.style.width=width+'px';
      pop.style.left=Math.max(gutter,Math.min(rect.left,window.innerWidth-width-gutter))+'px';
      const height=pop.getBoundingClientRect().height;
      const below=window.innerHeight-rect.bottom,above=rect.top;
      const top=below>=height+12?rect.bottom+7:
        above>=height+12?rect.top-height-7:
        Math.max(gutter,Math.min(rect.bottom+7,window.innerHeight-height-gutter));
      pop.style.top=Math.max(gutter,top)+'px';
    }
    function min(){return valid(input.getAttribute('min'))?input.getAttribute('min'):iso(new Date())}
    function close(){pop.hidden=true;trigger.setAttribute('aria-expanded','false')}
    function render(){
      const titleText=new Intl.DateTimeFormat('es-PE',{month:'long',year:'numeric'}).format(view);
      title.textContent=titleText[0].toUpperCase()+titleText.slice(1);
      grid.replaceChildren();
      const first=new Date(view.getFullYear(),view.getMonth(),1,12);
      const offset=(first.getDay()+6)%7;
      for(let i=0;i<42;i++){
        const day=new Date(view.getFullYear(),view.getMonth(),1-offset+i,12);
        const value=iso(day),btn=el('button','lx-date-day',String(day.getDate()));
        btn.type='button';btn.dataset.date=value;
        if(day.getMonth()!==view.getMonth())btn.classList.add('is-outside');
        if(value===input.value)btn.classList.add('is-selected');
        if(value===iso(new Date()))btn.classList.add('is-today');
        btn.disabled=value<min()||(valid(input.getAttribute('max'))&&value>input.getAttribute('max'));
        btn.setAttribute('aria-label',new Intl.DateTimeFormat('es-PE',{dateStyle:'full'}).format(day));
        grid.append(btn);
      }
      prev.disabled=iso(new Date(view.getFullYear(),view.getMonth()+1,0,12))<min();
    }
    function sync(){display.textContent=format(input.value);if(!pop.hidden){render();position()}}
    trigger.addEventListener('click',event=>{
      event.preventDefault();
      if(!pop.hidden){close();return}
      document.querySelectorAll('.lx-date-calendar:not([hidden])').forEach(node=>{node.hidden=true});
      document.querySelectorAll('.lx-date-trigger[aria-expanded="true"]').forEach(node=>node.setAttribute('aria-expanded','false'));
      const start=valid(input.value)?input.value:min();
      const d=new Date(start+'T12:00:00');
      view=new Date(d.getFullYear(),d.getMonth(),1,12);
      render();pop.hidden=false;trigger.setAttribute('aria-expanded','true');position();
    });
    prev.addEventListener('click',event=>{event.preventDefault();view=new Date(view.getFullYear(),view.getMonth()-1,1,12);render()});
    next.addEventListener('click',event=>{event.preventDefault();view=new Date(view.getFullYear(),view.getMonth()+1,1,12);render()});
    grid.addEventListener('click',event=>{
      const btn=event.target.closest('[data-date]');
      if(!btn||btn.disabled)return;
      event.preventDefault();input.value=btn.dataset.date;close();sync();
      input.dispatchEvent(new Event('change',{bubbles:true}));
    });
    input.addEventListener('change',sync);
    document.addEventListener('click',event=>{if(!host.contains(event.target)&&!pop.contains(event.target))close()});
    const onEscape=event=>{if(event.key==='Escape'&&!pop.hidden){event.stopPropagation();close();trigger.focus()}};
    host.addEventListener('keydown',onEscape);
    pop.addEventListener('keydown',onEscape);
    if(overlay){window.addEventListener('resize',position);document.addEventListener('scroll',position,true)}
    sync();
    return {sync,close};
  }

  function travelers(trigger,getCounts,setCounts,options){
    options=options||{};
    const max=options.max||9,maxChildren=options.maxChildren||8;
    const host=trigger.parentElement;host.classList.add('lx-travel-field');
    trigger.setAttribute('aria-haspopup','true');trigger.setAttribute('aria-expanded','false');
    const pop=el('div','lx-travel-popover');pop.hidden=true;pop.setAttribute('role','group');pop.setAttribute('aria-label','Adultos y niños');
    const output={};
    for(const [type,label,min] of [['adults','Adultos',1],['children','Niños',0]]){
      const row=el('div','lx-travel-row'),left=el('div','lx-travel-copy'),count=el('div','lx-travel-count');
      left.append(el('strong','',label),el('small','',type==='children'?'0 a 11 años':'Mayores de 11 años'));
      const minus=el('button','lx-travel-adjust','−'),number=el('output','', ''),plus=el('button','lx-travel-adjust','+');
      minus.type=plus.type='button';
      minus.setAttribute('aria-label','Quitar '+label.toLowerCase());
      plus.setAttribute('aria-label','Añadir '+label.toLowerCase());
      count.append(minus,number,plus);row.append(left,count);pop.append(row);
      output[type]={minus,plus,number};
      for(const [button,delta] of [[minus,-1],[plus,1]])button.addEventListener('click',event=>{
        event.preventDefault();
        const c=getCounts(),next=c[type]+delta;
        if(next<min||next>(type==='children'?maxChildren:max)||
           next+c[type==='children'?'adults':'children']>max)return;
        setCounts({...c,[type]:next});sync();
      });
    }
    host.append(pop);
    function close(){pop.hidden=true;trigger.setAttribute('aria-expanded','false')}
    function sync(){
      const c=getCounts(),total=c.adults+c.children;
      trigger.replaceChildren(document.createTextNode(total+' '+(total===1?'viajero':'viajeros')),
        icon('chevron'));
      const n={adults:c.adults,children:c.children};
      for(const [type,controls] of Object.entries(output)){
        controls.number.textContent=String(n[type]);
        controls.minus.disabled=n[type]<=(type==='adults'?1:0);
        controls.plus.disabled=total>=max||n[type]>=(type==='children'?maxChildren:max);
      }
    }
    trigger.addEventListener('click',event=>{
      event.preventDefault();pop.hidden=!pop.hidden;trigger.setAttribute('aria-expanded',String(!pop.hidden));
    });
    document.addEventListener('click',event=>{if(!host.contains(event.target))close()});
    host.addEventListener('keydown',event=>{if(event.key==='Escape'){close();trigger.focus()}});
    sync();
    return {sync,close};
  }
  window.LatamProductControls={calendar,travelers};
})();
