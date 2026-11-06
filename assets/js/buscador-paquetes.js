/* Latam Expeditions | buscador único de destinos y paquetes
 * Una ciudad se ofrece una sola vez, aunque tenga muchos paquetes.
 * El catálogo de paquetes publicado en GitHub es la fuente de inventario.
 */
(()=>{
 'use strict';
 const form=document.getElementById('tripSearchForm');if(!form)return;
 const $=id=>document.getElementById(id);
 const query=$('lxDestinationQuery'),value=$('searchDestination'),results=$('lxDestinationOptions');
 const origin=$('searchOrigin'),date=$('searchDate');
 const qnorm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const slug=s=>qnorm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const countries={'Perú':'peru','Colombia':'colombia','Argentina':'argentina','Brasil':'brasil','Bolivia':'bolivia','Chile':'chile','Ecuador':'ecuador','México':'mexico'};
 const cities=[
  ['Cusco','Perú',['cusco']],['Machu Picchu','Perú',['machu picchu']],['Puno','Perú',['puno','titicaca']],['Arequipa','Perú',['arequipa','colca']],
  ['Lima','Perú',['lima']],['Paracas','Perú',['paracas']],['Ica','Perú',['ica','huacachina']],['Huacachina','Perú',['huacachina']],
  ['Medellín','Colombia',['medellin','antioquia']],['Bogotá','Colombia',['bogota']],['Cartagena','Colombia',['cartagena']],['Santa Marta','Colombia',['santa marta','tayrona','minca']],['Cali','Colombia',['cali']],['San Andrés','Colombia',['san andres']],['Eje Cafetero','Colombia',['eje cafetero','salento']],
  ['Guatapé','Colombia',['guatape']],['Zipaquirá','Colombia',['zipaquira']],['Villa de Leyva','Colombia',['villa de leyva']],
  ['Buenos Aires','Argentina',['buenos aires']],['Iguazú','Argentina',['iguazu','misiones']],['Patagonia','Argentina',['patagonia','calafate']],
  ['Río de Janeiro','Brasil',['rio de janeiro','rio']],['Foz de Iguazú','Brasil',['foz do iguacu']],
  ['La Paz','Bolivia',['la paz']],['Uyuni','Bolivia',['uyuni']],
  ['Santiago','Chile',['santiago']],['San Pedro de Atacama','Chile',['atacama','san pedro']],['Torres del Paine','Chile',['torres del paine']],
  ['Quito','Ecuador',['quito']],['Galápagos','Ecuador',['galapagos']],
  ['Riviera Maya','México',['riviera maya','cancun']]
 ];
 const airports={'Perú':'LIM','Colombia':'BOG','Argentina':'EZE','Brasil':'GRU','Chile':'SCL','Ecuador':'UIO','México':'MEX','Bolivia':'LPB'};
 let packageData=[],destinationData=[],highlight=0,visible=[],userChoseOrigin=false,adults=2,children=0;
 const destinationText=p=>qnorm([p.title,p.region,p.excerpt].join(' '));
 const matchesCity=(p,c)=>p.country===c[1]&&c[2].some(k=>destinationText(p).includes(k));
 const dateISO=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 const minDate=new Date();minDate.setDate(minDate.getDate()+2);date.min=dateISO(minDate);
 const keyFor=c=>countries[c[1]]+':'+slug(c[0]);
 function inventory(){
  const countriesWithPackages=Object.keys(countries).filter(c=>packageData.some(p=>p.country===c));
  const dest=countriesWithPackages.map(c=>({id:'pais:'+countries[c],name:c,country:c,kind:'country',count:packageData.filter(p=>p.country===c).length}));
  cities.forEach(c=>{
    const count=packageData.filter(p=>matchesCity(p,c)).length;
    if(count)dest.push({id:'ciudad:'+keyFor(c),name:c[0],country:c[1],kind:'city',count});
  });
  destinationData=dest;
 }
 function render(q){
  const normalized=qnorm(q);
  clear();
  if(!normalized){results.hidden=true;query.setAttribute('aria-expanded','false');return}
  const byCountry=destinationData.filter(d=>d.kind==='country'&&qnorm(d.name)===normalized);
  if(byCountry.length){
    const country=byCountry[0].country;
    visible=destinationData.filter(d=>d.country===country);
  }else visible=destinationData.filter(d=>qnorm(d.name).includes(normalized)||
    (normalized.includes(',')&&qnorm(d.name+', '+d.country).includes(normalized))).slice(0,22);
  if(!visible.length){results.appendChild(message('No hay paquetes publicados para esa búsqueda.'));results.hidden=false;query.setAttribute('aria-expanded','true');return}
  visible.sort((a,b)=>a.kind==='country'?-1:b.kind==='country'?1:a.name.localeCompare(b.name,'es'));
  highlight=0;
  visible.forEach((dest,i)=>{
   const b=document.createElement('button');b.type='button';b.className='lx-destination-option';b.setAttribute('role','option');
   b.id='lxDestinationOption'+i;b.setAttribute('aria-selected',String(i===highlight));
   const icon=document.createElement('i');icon.className=dest.kind==='country'?'fa-solid fa-earth-americas':'fa-solid fa-location-dot';icon.setAttribute('aria-hidden','true');
   const copy=document.createElement('span'),title=document.createElement('strong');title.textContent=dest.name+(dest.kind==='city'?', '+dest.country:'');
   const smaller=document.createElement('small');smaller.textContent=dest.kind==='country'?'Ver todos los destinos de '+dest.name:dest.count+' paquete(s) disponibles';
   copy.append(title,smaller);b.append(icon,copy);
   b.addEventListener('click',()=>choose(dest));
   results.append(b);
  });
  results.hidden=false;query.setAttribute('aria-expanded','true');query.setAttribute('aria-activedescendant','lxDestinationOption0');
 }
 function message(t){const p=document.createElement('p');p.textContent=t;p.className='lx-dest-empty';return p}
 function clear(){results.replaceChildren()}
 function choose(dest){
  value.value=dest.id;
  query.value=dest.kind==='country'?dest.name:dest.name+', '+dest.country;
  results.hidden=true;query.setAttribute('aria-expanded','false');query.removeAttribute('aria-activedescendant');
  query.setCustomValidity('');
 }
 function suggestion(){
  let country='';try{country=localStorage.getItem('latam_country')||localStorage.getItem('latam_auto_country')||''}catch(_){}
  country=country||document.documentElement.dataset.country||'';
  if(!userChoseOrigin&&airports[country]&&[...origin.options].some(o=>o.value===airports[country])){
    origin.value=airports[country];
    origin.dispatchEvent(new Event('change',{bubbles:true}));
  }
 }
 async function load(){
  try{
   const resp=await fetch('assets/data/catalog.json',{cache:'force-cache'});
   if(!resp.ok)throw Error('Catálogo no disponible');
   const json=await resp.json();
   packageData=(json.packages||[]).filter(x=>x?.slug&&x?.country);
   inventory();
  }catch(_){results.replaceChildren(message('No se pudo consultar el catálogo. Actualiza la página.'))}
 }
 query.addEventListener('focus',()=>{query.select();render(query.value)});
 query.addEventListener('input',()=>{value.value='';query.setCustomValidity('');render(query.value)});
 query.addEventListener('keydown',e=>{
  if(e.key==='Escape'){results.hidden=true;query.setAttribute('aria-expanded','false');return}
  if(!visible.length||results.hidden)return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
   e.preventDefault();highlight=(highlight+(e.key==='ArrowDown'?1:-1)+visible.length)%visible.length;
   results.querySelectorAll('[role=option]').forEach((n,i)=>n.setAttribute('aria-selected',String(i===highlight)));
   query.setAttribute('aria-activedescendant','lxDestinationOption'+highlight);
  }
  if(e.key==='Enter'){
   e.preventDefault();choose(visible[highlight]);
  }
 });
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('#lxDestinationCombo')){results.hidden=true;query.setAttribute('aria-expanded','false')}});
 $('lxGuestsDone').addEventListener('click',()=>{setGuestsPanel(false);$('lxGuestToggle').focus()});
 $('lxGuestToggle').addEventListener('click',()=>setGuestsPanel($('lxGuestsPanel').hidden));
 function setGuestsPanel(open){$('lxGuestsPanel').hidden=!open;$('lxGuestToggle').setAttribute('aria-expanded',String(open))}
 function syncGuests(){
  $('lxAdultsCount').textContent=String(adults);$('lxChildrenCount').textContent=String(children);
  $('lxSearchAdults').value=String(adults);$('lxSearchChildren').value=String(children);
  $('lxGuestToggle').firstChild.textContent=adults+' adulto(s), '+children+' niño(s) ';
 }
 document.querySelectorAll('#lxGuestsPanel [data-count]').forEach(button=>button.addEventListener('click',()=>{
  const which=button.dataset.count,delta=Number(button.dataset.delta);
  if(which==='adults')adults=Math.max(1,Math.min(9-children,adults+delta));
  else children=Math.max(0,Math.min(6,9-adults,children+delta));
  syncGuests();
 }));
 origin.addEventListener('change',e=>{if(e.isTrusted)userChoseOrigin=true});
 document.addEventListener('latam:countrychange',suggestion);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')setGuestsPanel(false)});
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.lx-guest-field'))setGuestsPanel(false)});
 form.addEventListener('submit',e=>{
  e.preventDefault();
  let selection=destinationData.find(d=>d.id===value.value);
  if(!selection){const exact=qnorm(query.value);selection=destinationData.find(d=>qnorm(d.name)===exact||qnorm(d.name+', '+d.country)===exact)}
  if(!selection){query.setCustomValidity('Selecciona un destino de la lista.');query.reportValidity();render(query.value);return}
  if(!date.value||date.value<date.min){date.setCustomValidity('Selecciona una fecha futura válida.');document.querySelector('#searchDateStyledPicker')?.focus();return}
  date.setCustomValidity('');
  const params=new URLSearchParams();
  params.set('destino',countries[selection.country]);
  if(selection.kind==='city')params.set('ciudad',slug(selection.name));
  params.set('lugar',selection.name);
  params.set('origen',origin.value);
  params.set('fecha',date.value);
  params.set('adultos',String(adults));
  params.set('ninos',String(children));
  if($('searchType').value)params.set('estilo',$('searchType').value);
  location.href='paquetes.html?'+params.toString();
 });
 suggestion();load();syncGuests();
})();