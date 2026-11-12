/* LATAM Expeditions · Presentación del buscador de vuelos.
   Conserva los select e inputs originales que consume vuelos.js. */
(() => {
  'use strict';
  const form=document.getElementById('flightsForm');
  if(!form)return;
  const origin=document.getElementById('flightOrigin');
  const destination=document.getElementById('flightDestination');
  const adults=document.getElementById('flightAdults');
  const children=document.getElementById('flightChildren');
  if(!origin||!destination||!adults||!children)return;
  const normalize=value=>String(value||'').normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
  const collator=new Intl.Collator('es',{sensitivity:'base'});
  const errors=document.getElementById('flightError');
  const airportControls=[];

  function enhanceAirport(select){
    const field=select.closest('.flight-field');
    if(!field||select.dataset.lxAirportReady)return null;
    select.dataset.lxAirportReady='1';
    const label=field.querySelector('label[for="'+select.id+'"]');
    const host=document.createElement('div');
    host.className='lx-flight-airport-combobox';
    const text=document.createElement('input');
    text.type='search';text.id=select.id+'Search';text.className='lx-flight-airport-input';
    text.spellcheck=false;text.autocomplete='off';
    text.placeholder='Escribe ciudad o aeropuerto';
    text.setAttribute('role','combobox');
    text.setAttribute('aria-autocomplete','list');
    text.setAttribute('aria-expanded','false');
    text.setAttribute('aria-controls',select.id+'Matches');
    text.setAttribute('aria-label',label?.textContent.trim()||'Aeropuerto');
    if(label)label.htmlFor=text.id;
    const expand=document.createElement('button');
    expand.type='button';expand.className='lx-flight-airport-expand';
    expand.setAttribute('aria-label','Ver aeropuertos disponibles');
    expand.innerHTML='<i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';
    const list=document.createElement('div');
    list.id=select.id+'Matches';list.className='lx-flight-airport-list';
    list.setAttribute('role','listbox');list.hidden=true;
    host.append(text,expand,list);
    select.after(host);
    select.classList.add('lx-flight-original-select');
    select.tabIndex=-1;select.setAttribute('aria-hidden','true');
    const airports=Array.from(select.options).filter(opt=>opt.value).map(opt=>{
      const code=opt.value.toUpperCase();
      const city=opt.textContent.trim().replace(new RegExp('\\s*\\('+code+'\\)\\s*$','i'),'').trim();
      const display=city==='Ciudad de México'?'México (Ciudad de México)':city;
      const country=opt.closest('optgroup')?.label||'';
      return {code,display,country,label:display+' ('+code+')'};
    }).sort((a,b)=>collator.compare(a.display,b.display)||collator.compare(a.code,b.code));
    let results=[],active=-1;
    const sync=()=>{
      const found=airports.find(item=>item.code===select.value);
      if(found){text.value=found.label;text.setAttribute('aria-invalid','false')}
      else text.value='';
    };
    function close(){
      list.hidden=true;active=-1;
      text.setAttribute('aria-expanded','false');
      text.removeAttribute('aria-activedescendant');
    }
    function activeOption(index){
      if(!results.length)return;
      active=(index+results.length)%results.length;
      list.querySelectorAll('[role="option"]').forEach((button,i)=>{
        button.classList.toggle('is-active',i===active);
      });
      const current=list.querySelectorAll('[role="option"]')[active];
      if(current){text.setAttribute('aria-activedescendant',current.id);current.scrollIntoView({block:'nearest'});}
    }
    function choose(item){
      select.value=item.code;
      select.dispatchEvent(new Event('change',{bubbles:true}));
      sync();close();text.focus();
    }
    function open(query='',all=false){
      const q=normalize(query);
      const filtered=airports.filter(item=>all||!q||
        normalize(item.label).includes(q)||normalize(item.country).includes(q));
      const prefix=q&&!all?filtered.filter(item=>normalize(item.display).startsWith(q)||normalize(item.code).startsWith(q)):[];
      const rest=q&&!all?filtered.filter(item=>!prefix.includes(item)):[];
      results=(q&&!all?[...prefix,...rest]:filtered).slice(0,70);
      list.replaceChildren();
      if(!results.length){
        const empty=document.createElement('p');
        empty.className='lx-flight-airport-empty';
        empty.textContent='No encontramos aeropuertos con ese nombre.';
        list.append(empty);
      }
      results.forEach((item,i)=>{
        const btn=document.createElement('button');
        btn.type='button';btn.className='lx-flight-airport-option';
        btn.id=select.id+'Result'+i;btn.setAttribute('role','option');
        btn.setAttribute('aria-selected',String(item.code===select.value));
        const name=document.createElement('span');name.textContent=item.display;
        const extra=document.createElement('small');
        extra.textContent=item.country+' · '+item.code;
        btn.append(name,extra);
        btn.addEventListener('mousedown',event=>event.preventDefault());
        btn.addEventListener('click',()=>choose(item));
        list.append(btn);
      });
      list.hidden=false;active=-1;text.setAttribute('aria-expanded','true');
      text.removeAttribute('aria-activedescendant');
    }
    text.addEventListener('focus',()=>{text.select();open(text.value)});
    text.addEventListener('input',()=>{
      // Evita enviar el aeropuerto anterior cuando el viajero escribe una búsqueda nueva.
      select.value='';text.setAttribute('aria-invalid','true');open(text.value);
    });
    text.addEventListener('keydown',event=>{
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();
        if(list.hidden)open(text.value);
        activeOption(active+(event.key==='ArrowDown'?1:-1));
      }else if(event.key==='Enter'&&!list.hidden){
        event.preventDefault();
        if(results.length)choose(results[active>=0?active:0]);
      }else if(event.key==='Escape'){
        close();sync();
      }else if(event.key==='Tab'){
        close();
      }
    });
    expand.addEventListener('click',()=>{
      if(!list.hidden){close();return;}
      text.focus();open('',true);
    });
    document.addEventListener('pointerdown',event=>{
      if(!host.contains(event.target))close();
    });
    select.addEventListener('change',sync);
    sync();
    return {select,text,sync};
  }
  airportControls.push(enhanceAirport(origin),enhanceAirport(destination));
  document.getElementById('swapFlights')?.addEventListener('click',()=>{
    airportControls.forEach(control=>control?.sync());
  });

  function enhanceTravelers(){
    const adultField=adults.closest('.flight-field');
    const childField=children.closest('.flight-field');
    if(!adultField||!childField)return;
    const field=document.createElement('div');
    field.className='flight-field lx-flight-travelers';
    const label=document.createElement('label');
    label.id='lxFlightTravelersLabel';
    label.textContent='Viajeros';
    const button=document.createElement('button');
    button.type='button';button.className='lx-flight-travelers-trigger';
    button.setAttribute('aria-labelledby','lxFlightTravelersLabel');
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-haspopup','dialog');
    button.innerHTML='<span></span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';
    const popup=document.createElement('div');
    popup.className='lx-flight-travelers-menu';
    popup.hidden=true;
    popup.setAttribute('role','dialog');
    popup.setAttribute('aria-label','Seleccionar adultos y niños');
    function row(name,description,type){
      const wrap=document.createElement('div');
      wrap.className='lx-flight-traveler-row';
      const title=document.createElement('div');
      title.innerHTML='<strong>'+name+'</strong><small>'+description+'</small>';
      const controls=document.createElement('div');
      controls.className='lx-flight-traveler-buttons';
      const minus=document.createElement('button'),plus=document.createElement('button');
      minus.type='button';plus.type='button';minus.textContent='−';plus.textContent='+';
      minus.setAttribute('aria-label','Quitar '+name.toLowerCase());
      plus.setAttribute('aria-label','Agregar '+name.toLowerCase());
      const count=document.createElement('output');
      controls.append(minus,count,plus);wrap.append(title,controls);popup.append(wrap);
      function adjust(delta){
        const nA=Number(adults.value),nC=Number(children.value);
        const next=type==='adult'?Math.max(1,Math.min(9,nA+delta)):Math.max(0,Math.min(6,nC+delta));
        if(type==='adult'){
          if(next+nC>9)return;
          adults.value=String(next);adults.dispatchEvent(new Event('change',{bubbles:true}));
        }else{
          if(next+nA>9)return;
          children.value=String(next);children.dispatchEvent(new Event('change',{bubbles:true}));
        }
        render();
      }
      minus.addEventListener('click',()=>adjust(-1));
      plus.addEventListener('click',()=>adjust(1));
      return {count,minus,plus,type};
    }
    const a=row('Adultos','Desde 12 años','adult');
    const c=row('Niños','De 2 a 11 años','child');
    const done=document.createElement('button');
    done.type='button';done.className='lx-flight-traveler-done';
    done.textContent='Aplicar';
    done.addEventListener('click',()=>close(true));
    popup.append(done);
    function render(){
      const nA=Number(adults.value),nC=Number(children.value);
      a.count.value=String(nA);c.count.value=String(nC);
      a.minus.disabled=nA<=1;a.plus.disabled=nA+nC>=9;
      c.minus.disabled=nC<=0;c.plus.disabled=nA+nC>=9||nC>=6;
      button.querySelector('span').textContent=
        nA+' '+(nA===1?'adulto':'adultos')+(nC?' · '+nC+' '+(nC===1?'niño':'niños'):'');
    }
    function close(focus=false){
      popup.hidden=true;button.setAttribute('aria-expanded','false');
      if(focus)button.focus();
    }
    button.addEventListener('click',()=>{
      popup.hidden=!popup.hidden;
      button.setAttribute('aria-expanded',String(!popup.hidden));
      render();
    });
    popup.addEventListener('keydown',event=>{
      if(event.key==='Escape'){close(true)}
    });
    document.addEventListener('pointerdown',event=>{
      if(!field.contains(event.target))close();
    });
    adults.addEventListener('change',render);
    children.addEventListener('change',render);
    field.append(label,button,popup);
    adultField.before(field);
    adultField.classList.add('lx-flight-travelers-original');
    childField.classList.add('lx-flight-travelers-original');
    render();
  }
  enhanceTravelers();

  // Validar la entrada visible ANTES de la consulta de tarifas existente.
  form.addEventListener('submit',event=>{
    const missing=airportControls.find(control=>!control?.select.value);
    if(!missing)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(errors){
      errors.textContent='Selecciona un aeropuerto de la lista para continuar.';
      errors.hidden=false;
    }
    missing.text.focus();
  },true);
})();
