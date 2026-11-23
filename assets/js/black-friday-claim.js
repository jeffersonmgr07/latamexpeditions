/* LATAM Expeditions · Registro Black Friday 2026 con Apps Script por POST/iframe. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  let endpoint='',email='',coupon='',busy=false;
  // Reutiliza todos los prefijos y países de la lista oficial del formulario de reservas.
  const PHONE_COUNTRIES = [["Afganistán","+93","AF"],["Albania","+355","AL"],["Alemania","+49","DE"],["Angola","+244","AO"],["Anguila","+1264","AI"],["Antigua y Barbuda","+1268","AG"],["Arabia Saudí","+966","SA"],["Argelia","+213","DZ"],["Argentina","+54","AR"],["Armenia","+374","AM"],["Aruba","+297","AW"],["Australia","+61","AU"],["Austria","+43","AT"],["Azerbaiyán","+994","AZ"],["Bahamas","+1242","BS"],["Bangladés","+880","BD"],["Barbados","+1246","BB"],["Baréin","+973","BH"],["Belice","+501","BZ"],["Benín","+229","BJ"],["Bermudas","+1441","BM"],["Bielorrusia","+375","BY"],["Bolivia","+591","BO"],["Bosnia y Herzegovina","+387","BA"],["Botsuana","+267","BW"],["Brasil","+55","BR"],["Brunéi","+673","BN"],["Bulgaria","+359","BG"],["Burkina Faso","+226","BF"],["Burundi","+257","BI"],["Bután","+975","BT"],["Bélgica","+32","BE"],["Cabo Verde","+238","CV"],["Camboya","+855","KH"],["Camerún","+237","CM"],["Canadá","+1","CA"],["Catar","+974","QA"],["Chad","+235","TD"],["Chequia","+420","CZ"],["Chile","+56","CL"],["China","+86","CN"],["Chipre","+357","CY"],["Colombia","+57","CO"],["Comoras","+269","KM"],["Congo","+242","CG"],["Corea del Norte","+850","KP"],["Corea del Sur","+82","KR"],["Costa Rica","+506","CR"],["Croacia","+385","HR"],["Cuba","+53","CU"],["Côte d’Ivoire","+225","CI"],["Dinamarca","+45","DK"],["Dominica","+1767","DM"],["Ecuador","+593","EC"],["Egipto","+20","EG"],["El Salvador","+503","SV"],["Emiratos Árabes Unidos","+971","AE"],["Eritrea","+291","ER"],["Eslovaquia","+421","SK"],["Eslovenia","+386","SI"],["España","+34","ES"],["Estados Unidos","+1","US"],["Estonia","+372","EE"],["Esuatini","+268","SZ"],["Etiopía","+251","ET"],["Filipinas","+63","PH"],["Finlandia","+358","FI"],["Fiyi","+679","FJ"],["Francia","+33","FR"],["Gabón","+241","GA"],["Gambia","+220","GM"],["Georgia","+995","GE"],["Ghana","+233","GH"],["Gibraltar","+350","GI"],["Granada","+1473","GD"],["Grecia","+30","GR"],["Groenlandia","+299","GL"],["Guadalupe","+590","GP"],["Guam","+1671","GU"],["Guatemala","+502","GT"],["Guayana Francesa","+594","GF"],["Guernesey","+44","GG"],["Guinea","+224","GN"],["Guinea Ecuatorial","+240","GQ"],["Guinea-Bisáu","+245","GW"],["Guyana","+592","GY"],["Haití","+509","HT"],["Honduras","+504","HN"],["Hungría","+36","HU"],["India","+91","IN"],["Indonesia","+62","ID"],["Irak","+964","IQ"],["Irlanda","+353","IE"],["Irán","+98","IR"],["Isla de Man","+44","IM"],["Isla de Navidad","+61","CX"],["Isla Norfolk","+672","NF"],["Islandia","+354","IS"],["Islas Caimán","+1345","KY"],["Islas Cocos","+61","CC"],["Islas Cook","+682","CK"],["Islas Feroe","+298","FO"],["Islas Georgia del Sur y Sandwich del Sur","+500","GS"],["Islas Malvinas","+500","FK"],["Islas Marianas del Norte","+1670","MP"],["Islas Marshall","+692","MH"],["Islas Pitcairn","+64","PN"],["Islas Salomón","+677","SB"],["Israel","+972","IL"],["Italia","+39","IT"],["Jamaica","+1876","JM"],["Japón","+81","JP"],["Jersey","+44","JE"],["Jordania","+962","JO"],["Kazajistán","+76","KZ"],["Kenia","+254","KE"],["Kirguistán","+996","KG"],["Kiribati","+686","KI"],["Kuwait","+965","KW"],["Laos","+856","LA"],["Lesoto","+266","LS"],["Letonia","+371","LV"],["Liberia","+231","LR"],["Libia","+218","LY"],["Liechtenstein","+423","LI"],["Lituania","+370","LT"],["Luxemburgo","+352","LU"],["Líbano","+961","LB"],["Macedonia del Norte","+389","MK"],["Madagascar","+261","MG"],["Malasia","+60","MY"],["Malaui","+265","MW"],["Maldivas","+960","MV"],["Mali","+223","ML"],["Malta","+356","MT"],["Marruecos","+212","MA"],["Martinica","+596","MQ"],["Mauricio","+230","MU"],["Mauritania","+222","MR"],["Mayotte","+262","YT"],["Micronesia","+691","FM"],["Moldavia","+373","MD"],["Mongolia","+976","MN"],["Montserrat","+1664","MS"],["Mozambique","+258","MZ"],["México","+52","MX"],["Mónaco","+377","MC"],["Namibia","+264","NA"],["Nauru","+674","NR"],["Nepal","+977","NP"],["Nicaragua","+505","NI"],["Nigeria","+234","NG"],["Niue","+683","NU"],["Noruega","+47","NO"],["Nueva Caledonia","+687","NC"],["Nueva Zelanda","+64","NZ"],["Níger","+227","NE"],["Omán","+968","OM"],["Pakistán","+92","PK"],["Palaos","+680","PW"],["Panamá","+507","PA"],["Papúa Nueva Guinea","+675","PG"],["Paraguay","+595","PY"],["Países Bajos","+31","NL"],["Perú","+51","PE"],["Polinesia Francesa","+689","PF"],["Polonia","+48","PL"],["Portugal","+351","PT"],["Puerto Rico","+1787","PR"],["RAE de Hong Kong (China)","+852","HK"],["RAE de Macao (China)","+853","MO"],["Reino Unido","+44","GB"],["República Centroafricana","+236","CF"],["República Democrática del Congo","+243","CD"],["República Dominicana","+1809","DO"],["Reunión","+262","RE"],["Ruanda","+250","RW"],["Rumanía","+40","RO"],["Rusia","+7","RU"],["Samoa","+685","WS"],["Samoa Americana","+1684","AS"],["San Cristóbal y Nieves","+1869","KN"],["San Marino","+378","SM"],["San Pedro y Miquelón","+508","PM"],["San Vicente y las Granadinas","+1784","VC"],["Santa Elena","+290","SH"],["Santa Lucía","+1758","LC"],["Santo Tomé y Príncipe","+239","ST"],["Senegal","+221","SN"],["Serbia","+381","RS"],["Seychelles","+248","SC"],["Sierra Leona","+232","SL"],["Singapur","+65","SG"],["Siria","+963","SY"],["Somalia","+252","SO"],["Sri Lanka","+94","LK"],["Sudáfrica","+27","ZA"],["Sudán","+249","SD"],["Sudán del Sur","+211","SS"],["Suecia","+46","SE"],["Suiza","+41","CH"],["Surinam","+597","SR"],["Svalbard y Jan Mayen","+4779","SJ"],["Sáhara Occidental","+212","EH"],["Tailandia","+66","TH"],["Taiwán","+886","TW"],["Tanzania","+255","TZ"],["Tayikistán","+992","TJ"],["Territorio Británico del Océano Índico","+246","IO"],["Timor-Leste","+670","TL"],["Togo","+228","TG"],["Tokelau","+690","TK"],["Tonga","+676","TO"],["Trinidad y Tobago","+1868","TT"],["Turkmenistán","+993","TM"],["Turquía","+90","TR"],["Tuvalu","+688","TV"],["Túnez","+216","TN"],["Ucrania","+380","UA"],["Uganda","+256","UG"],["Uruguay","+598","UY"],["Uzbekistán","+998","UZ"],["Vanuatu","+678","VU"],["Venezuela","+58","VE"],["Vietnam","+84","VN"],["Wallis y Futuna","+681","WF"],["Yemen","+967","YE"],["Yibuti","+253","DJ"],["Zambia","+260","ZM"],["Zimbabue","+263","ZW"]];
  const flagOf=iso=>/^[A-Z]{2}$/.test(iso)?[...iso].map(c=>String.fromCodePoint(127397+c.charCodeAt(0))).join(''):'🌐';
  let selectedDial='+51';
  const dialWrap=$('bfDial'),dialButton=$('bfDialButton'),dialMenu=$('bfDialMenu');
  const search=$('bfDialSearch'),options=$('bfDialOptions');
  const cleanSearch=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function closeDial(){
    dialMenu.hidden=true;dialButton.setAttribute('aria-expanded','false');
  }
  function chooseDial(country,focusPhone=true){
    const [name,dial,iso]=country;
    selectedDial=dial;
    $('bfDialCode').textContent=dial;
    $('bfDialFlag').textContent=flagOf(iso);
    dialButton.setAttribute('aria-label','Código de país: '+name+' '+dial+'. Cambiar país.');
    closeDial();
    if(focusPhone)$('bfPhone').focus();
  }
  function renderDialList(rawQuery=''){
    const query=cleanSearch(rawQuery);
    const list=PHONE_COUNTRIES.filter(([name,dial,iso])=>
      !query||cleanSearch(name).includes(query)||dial.includes(query)||cleanSearch(iso)===query);
    const fragment=document.createDocumentFragment();
    list.forEach(country=>{
      const [name,dial,iso]=country;
      const item=document.createElement('button');item.type='button';
      item.className='bf-dial-option';item.setAttribute('role','option');
      item.setAttribute('aria-selected',String(dial===selectedDial));
      const emoji=document.createElement('span');emoji.className='bf-dial-option__flag';
      emoji.textContent=flagOf(iso);emoji.setAttribute('aria-hidden','true');
      const label=document.createElement('span');label.className='bf-dial-option__name';label.textContent=name;
      const code=document.createElement('span');code.className='bf-dial-option__dial';code.textContent=dial;
      item.append(emoji,label,code);
      item.addEventListener('click',()=>chooseDial(country));
      fragment.append(item);
    });
    if(!list.length){
      const empty=document.createElement('p');empty.className='bf-dial-empty';
      empty.textContent='No se encontraron países.';fragment.append(empty);
    }
    options.replaceChildren(fragment);
  }
  dialButton.addEventListener('click',()=>{
    const willOpen=dialMenu.hidden;
    if(willOpen){
      dialMenu.hidden=false;dialButton.setAttribute('aria-expanded','true');
      search.value='';renderDialList();search.focus();
    }else closeDial();
  });
  search.addEventListener('input',()=>renderDialList(search.value));
  search.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){
      const first=options.querySelector('.bf-dial-option');
      if(first){event.preventDefault();first.focus();}
    }
  });
  options.addEventListener('keydown',event=>{
    const buttons=[...options.querySelectorAll('.bf-dial-option')];
    const at=buttons.indexOf(document.activeElement);
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();const next=event.key==='ArrowDown'?Math.min(at+1,buttons.length-1):Math.max(at-1,0);
      buttons[next]?.focus();
    }
  });
  document.addEventListener('pointerdown',event=>{if(!dialWrap.contains(event.target))closeDial();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!dialMenu.hidden){closeDial();dialButton.focus();}});
  chooseDial(PHONE_COUNTRIES.find(x=>x[2]==='PE')||PHONE_COUNTRIES[0],false);
  
  const status=(message,error=false)=>{const e=$('bfStatus');e.textContent=message||'';e.classList.toggle('is-error',Boolean(error));};
  const toggleBusy=(value)=>{
    busy=value;
    ['bfRequest','bfVerify'].forEach(id=>{const e=$(id);if(e)e.disabled=value;});
  };
  // Apps Script HTMLService usa iframes aislados y puede no transmitir postMessage.
  // Enviamos PII únicamente por POST; consultamos un acuse efímero por clave secreta.
  const post=(action,data)=>new Promise((resolve,reject)=>{
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint))
      {reject(Error('El registro no está disponible por el momento.'));return;}
    if(!window.crypto?.getRandomValues)
      {reject(Error('No se pudo iniciar una solicitud segura.'));return;}
    const bytes=new Uint8Array(16);window.crypto.getRandomValues(bytes);
    const requestKey=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    const body=new URLSearchParams({action,payload:JSON.stringify({...data,requestKey})});
    const limit=Date.now()+35000;
    let settled=false,script=null,callback='',wait=null;
    const tidy=()=>{
      if(wait)clearTimeout(wait);
      if(script)script.remove();
      if(callback){delete window[callback];callback='';}
      script=null;wait=null;
    };
    const done=(error,response)=>{
      if(settled)return;settled=true;tidy();
      error?reject(error):resolve(response);
    };
    const again=()=>{
      if(settled)return;
      if(Date.now()>limit){
        done(Error('No pudimos confirmar el envío del código. Inténtalo de nuevo más tarde.'));
      }else{
        wait=setTimeout(poll,1350);
      }
    };
    const poll=()=>{
      if(settled)return;
      tidy();
      callback='__lxBfClaim_'+requestKey;
      script=document.createElement('script');
      script.async=true;
      let answered=false;
      const noReply=()=>{
        if(answered||settled)return;answered=true;tidy();again();
      };
      window[callback]=reply=>{
        if(answered||settled)return;answered=true;tidy();
        if(reply?.pending===true){again();return;}
        if(reply?.ok===true){done(null,reply);return;}
        done(Error(reply?.error||'No pudimos completar la solicitud.'));
      };
      script.onerror=noReply;
      script.onload=()=>{wait=setTimeout(noReply,900);};
      script.src=endpoint+'?'+new URLSearchParams({
        action:'bf_claim_status',requestKey,callback,_:String(Date.now())
      });
      document.head.append(script);
    };
    // La respuesta de fetch es opaca por las restricciones CORS de Apps Script.
    // El resultado confiable se obtiene del backend mediante bf_claim_status.
    fetch(endpoint,{method:'POST',mode:'no-cors',body,credentials:'omit',
      cache:'no-store',redirect:'follow'}).catch(()=>{
        console.warn('[BF] No fue posible confirmar el envío POST. Revisando acuse del servidor.');
      });
    wait=setTimeout(poll,1200);
  });
  const step=n=>{for(let i=1;i<=3;i++)$('bfStep'+i).hidden=i!==n;status('');};
  const init=async()=>{
    try{
      const r=await fetch('assets/data/catalog.json',{cache:'no-store'});
      if(!r.ok)throw Error('No se pudo cargar la configuración de reservas.');
      endpoint=String((await r.json()).booking?.endpoint||'');
      if(!endpoint)throw Error('El registro no está disponible por el momento.');
    }catch(e){status(e.message||'No se pudo iniciar el registro.',true);$('bfRequest').disabled=true;}
  };
  $('bfForm').addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    const firstName=$('bfFirst').value.trim(),lastName=$('bfLast').value.trim();
    email=$('bfEmail').value.trim().toLowerCase();
    const digits=$('bfPhone').value.replace(/\D/g,'');
    if(digits.length<6||digits.length>15){
      status('Introduce un número de WhatsApp válido, sin el código de país.',true);
      $('bfPhone').focus();
      return;
    }
    const whatsapp=selectedDial+digits;
    toggleBusy(true);status('Enviando código de verificación…');
    try{
      await post('bfLeadStart',{firstName,lastName,email,whatsapp,
        privacyAccepted:$('bfPrivacy').checked,marketingAccepted:$('bfMarketing').checked});
      $('bfEmailPreview').textContent=email;
      step(2);$('bfOtp').focus();
    }catch(e){status(e.message||'No pudimos enviar el código.',true);}
    finally{toggleBusy(false);}
  });
  $('bfVerifyForm').addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    const otp=$('bfOtp').value.trim();
    toggleBusy(true);status('Verificando el código…');
    try{
      const r=await post('bfLeadVerify',{email,otp});
      if(!/^BF26-[A-Z0-9-]{19}$/.test(String(r.code||'')))throw Error('No recibimos el cupón. Contáctanos.');
      coupon=r.code;$('bfCode').textContent=coupon;
      step(3);
    }catch(e){status(e.message||'No pudimos verificar el correo.',true);}
    finally{toggleBusy(false);}
  });
  $('bfRestart').addEventListener('click',()=>step(1));
  $('bfCopy').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(coupon);$('bfCopy').textContent='¡Copiado!';}
    catch(_){status('Selecciona el código y cópialo manualmente.',true);}
  });
  init();
})();
