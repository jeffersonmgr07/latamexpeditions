/**
 * LATAM Expeditions - dashboard de cuenta. Sin saldos de demostración.
 * Endpoints en backend/ExpeditionDashboard.gs, con fallback a myTrips.
 */
(function () {
  'use strict';
  const $ = (s,root=document) => root.querySelector(s);
  const $$ = (s,root=document) => Array.from(root.querySelectorAll(s));
  const root = $('#expPagePanels');
  if (!root) return;
  const base = document.documentElement.dataset.base || './';
  const kToken = 'latamExpeditionsToken';
  const kUser = 'latamExpeditionsUser';
  const state = {
    page: ['inicio','viajes','reservas','millas','recompensas','avisos','perfil'].includes(location.hash.slice(1))
      ? location.hash.slice(1) : 'inicio',
    data: null, legacy: false, details: null, filter: 'upcoming',
    endpoint: '', busy: false, reservationFilter: 'all', avatar: ''
  };
  function token() { try { return localStorage.getItem(kToken) || ''; } catch (_) { return ''; } }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g,
      c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function num(v) { return Number.isFinite(Number(v)) ? Number(v) : 0; }
  function usd(v) { return 'US$ ' + num(v).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function fmtDate(s) {
    const v = String(s||'');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return v || 'Por confirmar';
    const [y,m,d]=v.split('-').map(Number);
    const day=new Date(Date.UTC(y,m-1,d,12));
    return new Intl.DateTimeFormat('es-PE',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(day);
  }
  function titleFor(page) {
    return ({inicio:'Mi espacio de viajes',viajes:'Mis viajes',reservas:'Mis reservaciones',
      millas:'Mis puntos LATAM Rewards',recompensas:'Recompensas y cupones',
      avisos:'Notificaciones',perfil:'Mi perfil',detalle:'Detalle del viaje'})[page] || 'Mi cuenta';
  }
  function subtitleFor(page) {
    return ({inicio:'Tus viajes y beneficios, siempre a mano.',
      viajes:'Próximos, anteriores y cancelados.',
      reservas:'Consulta el estado de pago y confirmación de cada reserva.',
      millas:'Saldo disponible, puntos pendientes y movimientos.',
      recompensas:'Descubre experiencias, beneficios y formas de ganar puntos.',
      avisos:'Las novedades importantes sobre tus viajes.',
      perfil:'Actualiza tus datos personales y preferencias.',
      detalle:'Información completa de tu reservación.'})[page] || '';
  }
  function membership() {
    const points=num(state.data?.miles?.tierPoints);
    return state.data?.membership || {
      name:points>=10000?'Diamond':points>=7000?'Platinum':points>=3000?'Gold':'Explorer',
      points:points,next:points>=10000?null:points>=7000?10000:points>=3000?7000:3000,
      remaining:points>=10000?0:Math.max(0,(points>=7000?10000:points>=3000?7000:3000)-points)
    };
  }
  function statusClass(s) {
    if (/cancel|anulad|reembols/i.test(String(s||''))) return ' exp-tag--cancel';
    if (/pendiente|cotiza|revis|solicitud/i.test(String(s||''))) return ' exp-tag--pending';
    return '';
  }
  function imgFor(item) {
    const key=String((item.slug||item.product||'')+' '+(item.title||'')).toLowerCase();
    if (/cusco|machu|peru|perú/.test(key)) return 'assets/img/peru-machu-picchu-01.jpg';
    if (/medellín|medellin|colombia/.test(key)) return 'assets/img/colombia-experiencia-city-tour-medellin.jpg';
    if (/brasil|rio|río/.test(key)) return 'assets/img/brasil-rio-01.jpg';
    if (/chile|atacama/.test(key)) return 'assets/img/chile-patagonia-01.jpg';
    return 'assets/img/latam-hero-01.jpg';
  }
  function pic(item,cls) {
    return '<img class="'+(cls||'')+'" src="'+base+imgFor(item)+'" alt="Imagen ilustrativa de destino" loading="lazy" decoding="async">';
  }
  function allTrips() { const d=state.data||{};return [...(d.upcoming||[]),...(d.past||[])]; }
  function empty(title,text,action) {
    return '<div class="exp-empty"><i class="fa-regular fa-compass" aria-hidden="true"></i>'+
      '<h3>'+esc(title)+'</h3><p>'+esc(text)+'</p>'+
      (action?'<a class="exp-btn" href="'+base+'experiencias.html">Explorar experiencias</a>':'')+'</div>';
  }
  function notice(text) {
    return '<div class="exp-notice"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><p>'+esc(text)+'</p></div>';
  }
  function stat(icon,value,label) {
    return '<article class="exp-stat"><i class="fa-solid '+icon+'" aria-hidden="true"></i>'+
      '<strong>'+esc(value)+'</strong><span>'+esc(label)+'</span></article>';
  }
  function heading(title,desc) {
    return '<div class="exp-page-head"><div><h2>'+esc(title)+'</h2><p>'+esc(desc)+'</p></div></div>';
  }
  function tripCard(r) {
    const pending=/pendiente|cotiz|solicitud|revis/i.test(String(r.status||''));
    return '<article class="exp-trip-item">'+pic(r)+
      '<div><div class="exp-trip-code">'+esc(r.code||'')+'</div><h3>'+esc(r.title||'Experiencia')+'</h3>'+
      '<p><i class="fa-regular fa-calendar" aria-hidden="true"></i> '+esc(fmtDate(r.date))+
      ' · '+esc(r.travelers||0)+' viajeros</p>'+
      '<p>Total: '+esc(usd(r.total||0))+' · Pagado: '+esc(usd(r.paid||0))+'</p></div>'+
      '<div class="exp-trip-actions"><span class="exp-tag'+statusClass(r.status)+'">'+esc(r.status||'En revisión')+'</span>'+
      '<button type="button" class="exp-btn exp-btn--light" data-exp-trip="'+esc(r.code)+'">Ver detalles <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></div>'+
      '</article>';
  }
  function verificationBanner() {
    if(state.legacy) return '';
    if(state.data&&state.data.verified) return '';
    return '<div class="exp-notice"><i class="fa-solid fa-envelope-circle-check" aria-hidden="true"></i>'+
      '<div><strong>Verifica tu correo y activa 100 puntos LATAM Rewards</strong>'+
      '<p>Enviaremos un código de seis dígitos al correo registrado. El bono se concede una sola vez por cuenta verificada.</p>'+
      '<div class="exp-verification"><button class="exp-btn exp-btn--light" data-exp-send-code type="button">Enviar código por correo</button>'+
      '<form id="expVerifyForm"><label for="expEmailCode">Código recibido</label> '+
      '<input id="expEmailCode" name="verificationCode" type="text" inputmode="numeric" maxlength="6" minlength="6" pattern="[0-9]{6}" autocomplete="one-time-code" placeholder="000000" required>'+
      ' <button class="exp-btn" type="submit">Verificar cuenta</button></form></div></div></div>';
  }
  function overview() {
    const d=state.data,u=d.user||{},all=allTrips(),next=(d.upcoming||[])[0];
    const miles=d.miles;
    const available=miles?String(miles.available):'—';
    const incoming=(d.upcoming||[]).filter(x=>!/cancel|anulad|reembols/i.test(x.status||''));
    return '<p class="exp-greeting">¡Hola'+(u.name?', '+esc(u.name.split(' ')[0]):'')+'! 👋</p>'+
      verificationBanner()+
      '<div class="exp-grid">'+stat('fa-suitcase-rolling',incoming.length,'Viajes próximos')+
      stat('fa-ticket',all.length,'Reservaciones')+stat('fa-gift',available,'Puntos disponibles')+'</div>'+
      '<div class="exp-card"><div class="exp-card-head"><h3>Tu próximo viaje</h3><button class="exp-link" data-exp-nav="viajes" type="button">Ver todos</button></div>'+
      (next?tripCard(next):empty('Tu próxima aventura empieza aquí','Aún no tienes viajes próximos registrados.',true))+'</div>'+
      '<div class="exp-card"><div class="exp-card-head"><h3>Tus puntos LATAM Rewards</h3><button class="exp-link" data-exp-nav="millas" type="button">Ver estado de cuenta</button></div>'+
      '<div class="exp-wallet"><label>LATAM REWARDS · '+esc(membership().name.toUpperCase())+'</label><strong>'+esc(available)+' puntos</strong>'+
      '<small>Puntos disponibles para recompensas</small><div class="exp-wallet-stats">'+
      '<div><b>'+(miles?esc(miles.pending):'—')+'</b><span>Puntos pendientes</span></div>'+
      '<div><b>'+(miles?esc(miles.bonus):'—')+'</b><span>Bono de bienvenida</span></div></div></div>'+
      '<button type="button" class="exp-link" data-exp-nav="recompensas">Descubre cómo ganar puntos</button></div>';
  }
  function tripsPage(kind) {
    const all=allTrips();
    if(kind==='reservas'){
      const filters=[['all','Todas'],['pending','Pendientes de pago'],['confirmed','Pagadas o confirmadas']];
      const list=state.reservationFilter==='pending'?all.filter(x=>num(x.balance)>0||/pendiente|cotiz/i.test(x.status||'')):
        state.reservationFilter==='confirmed'?all.filter(x=>num(x.paid)>0&&num(x.balance)<=0):all;
      return '<div class="exp-filters">'+filters.map(x=>'<button class="exp-filter'+(state.reservationFilter===x[0]?' is-active':'')+
        '" type="button" data-exp-res-filter="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
        (list.length?list.map(tripCard).join(''):empty('No hay reservaciones en esta categoría','Cuando tengas reservas con ese estado, aparecerán aquí.',true));
    }
    let list=[];
    if(state.filter==='upcoming')list=state.data.upcoming.filter(x=>!/cancel|anulad|reembols/i.test(x.status||''));
    else if(state.filter==='past')list=state.data.past.filter(x=>!/cancel|anulad|reembols/i.test(x.status||''));
    else list=all.filter(x=>/cancel|anulad|reembols/i.test(x.status||''));
    const filters=[['upcoming','Próximos'],['past','Anteriores'],['cancel','Cancelados']];
    return '<div class="exp-filters">'+filters.map(x=>
        '<button class="exp-filter'+(state.filter===x[0]?' is-active':'')+'" type="button" data-exp-filter="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
      (list.length?list.map(tripCard).join(''):empty('No hay viajes en esta categoría','Aquí verás tus viajes cuando estén registrados.',state.filter==='upcoming'));
  }
  function milesPage() {
    const m=state.data.miles,ready=!!m;
    return heading('Mis Millas Expedition','Tu saldo, las millas en proceso y los movimientos de tu cuenta.')+
      verificationBanner()+
      '<div class="exp-wallet"><label>MI SALDO · EXPEDITION REWARDS</label>'+
      '<strong>'+(ready?esc(m.available):'—')+' millas</strong>'+
      '<small>Millas disponibles</small><div class="exp-wallet-stats"><div><b>'+(ready?esc(m.pending):'—')+'</b>'+
      '<span>Pendientes de completar el servicio</span></div><div><b>'+(ready?esc(m.used):'—')+'</b><span>Millas utilizadas</span></div></div></div>'+
      '<div class="exp-card"><h3>Cómo acumulas millas</h3>'+
      '<p>Obtienes 1 milla por cada US$10 efectivamente pagados. Se incluyen experiencias, paquetes, vuelos y hoteles; los importes menores a US$10 se acumulan para futuras compras. Las millas de una compra quedan pendientes hasta que el viaje figure como completado.</p>'+
      (ready?'<p>Importe acumulado hacia tu próxima milla: <strong>'+esc(usd(m.carryUsd))+'</strong>.</p>':'')+'</div>'+
      '<div class="exp-card"><h3>Estado de cuenta</h3>'+
      (ready&&m.movements.length?'<div class="exp-table-wrap"><table class="exp-table"><thead><tr><th>Fecha</th><th>Concepto</th><th>Estado</th><th>Millas</th></tr></thead><tbody>'+
      m.movements.map(x=>'<tr><td>'+esc(fmtDate(x.date))+'</td><td><strong>'+esc(x.title)+'</strong><small>'+esc(x.code||x.type)+'</small></td>'+
        '<td><span class="exp-tag'+(x.status==='PENDIENTE'?' exp-tag--pending':'')+'">'+esc(x.status)+'</span></td>'+
        '<td><span class="'+(num(x.points)<0?'exp-negative':'exp-positive')+'">'+(num(x.points)>0?'+':'')+esc(x.points)+'</span></td></tr>').join('')+
      '</tbody></table></div>':empty('Aún no hay movimientos','Los bonos y compras confirmadas se registrarán aquí.',false))+'</div>'+
      '';
  }
  function rewardsPage() {
    const values=[
      ['fa-map-location-dot','Experiencias','Canje directo por experiencias independientes, como Full Day.'],
      ['fa-gift','Souvenirs','Productos y recuerdos seleccionados de los destinos.'],
      ['fa-ticket','Cupones','Descuentos aplicables a experiencias, paquetes, vuelos y hoteles, según condiciones.'],
      ['fa-percent','Promociones exclusivas','Beneficios especiales que se habilitarán dentro del programa.']
    ];
    return heading('Recompensas y cupones','Próximo catálogo de Expedition Rewards.')+
      notice('Los canjes todavía no están habilitados. Las millas podrán comenzar a acumularse una vez instalado el backend, pero ningún botón realizará canjes antes de que definamos sus valores y condiciones.')+
      '<div class="exp-rewards-grid">'+values.map(x=>
        '<article class="exp-reward"><i class="fa-solid '+x[0]+'" aria-hidden="true"></i>'+
        '<h3>'+x[1]+'</h3><p>'+x[2]+'</p><span>Próximamente</span></article>').join('')+'</div>'+
      '<div class="exp-card" style="margin-top:20px"><h3>Reglas de canje</h3>'+
      '<p>Las millas NO se aplicarán directamente al pago de vuelos, hoteles o paquetes. Sí podrán canjearse por cupones que apliquen a esos servicios, sujetos a límites y restricciones.</p></div>';
  }
  function notificationsPage() {
    const notes=state.data.notifications||[];
    return '<div class="exp-card">'+(notes.length?notes.map(n=>
        '<div class="exp-notification'+(n.read?'':' is-unread')+'"><i class="fa-solid '+
        (n.type==='booking'?'fa-suitcase-rolling':'fa-gift')+'" aria-hidden="true"></i><div style="flex:1;min-width:0">'+
        '<strong>'+esc(n.title)+'</strong><p>'+esc(n.text)+'</p><time>'+esc(String(n.date||'').replace('T',' '))+'</time></div>'+
        (!n.read?'<button type="button" class="exp-link" data-exp-read="'+esc(n.id)+'">Marcar leída</button>':'')+
        '</div>').join(''):empty('No tienes notificaciones nuevas','Cuando haya novedades sobre tus reservas, aparecerán aquí.',false))+'</div>';
  }
  function profilePage() {
    const u=state.data.user||{};
    return heading('Mi perfil','Información y verificación de tu cuenta de viajero.')+
      '<div class="exp-card"><h3>Información personal</h3><div class="exp-facts">'+
      fact('Nombre y apellido',u.name||'Sin nombre')+fact('Correo electrónico',u.email||'—')+
      fact('Teléfono',u.phone||'No registrado')+fact('Método de acceso',u.provider||'Correo')+'</div></div>'+
      '<div class="exp-card"><h3>Verificación y bono de bienvenida</h3>'+
      (state.legacy?notice('Para verificar tu correo necesitas publicar el nuevo módulo de Apps Script.'):
        (state.data.verified?
          '<div class="exp-notice"><i class="fa-solid fa-circle-check" aria-hidden="true"></i><p>Tu cuenta está verificada. Si todavía no aparece el bono, revisa los movimientos de Millas Expedition.</p></div>':
          verificationBanner()))+'</div>'+
      '<div class="exp-card"><h3>Seguridad</h3><p>Tu sesión está protegida por el sistema de autenticación actual. Si utilizas un equipo compartido, cierra sesión al terminar.</p>'+
      '<button type="button" class="exp-btn exp-btn--light" data-logout>Cerrar sesión</button></div>';
  }
  function fact(label,value) {
    return '<div class="exp-fact"><small>'+esc(label)+'</small><strong>'+esc(value||'—')+'</strong></div>';
  }
  function detailPage() {
    const d=state.details || {},r=d.booking;
    if(state.busy) return '<div class="exp-loading"><i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Cargando detalle de tu viaje…</div>';
    if(!r)return empty('No se cargó el detalle','Puedes volver a Mis viajes e intentarlo de nuevo.',false);
    const guests=r.passengers||[], flights=r.flights||[], itinerary=r.itinerary||[];
    return '<button type="button" class="exp-link" data-exp-nav="viajes">← Volver a Mis viajes</button>'+
      '<div class="exp-card"><div class="exp-detail-head">'+pic(r,'exp-detail-photo')+
      '<div><span class="exp-tag'+statusClass(r.status)+'">'+esc(r.status||'En revisión')+'</span>'+
      '<h2>'+esc(r.title||'Reserva')+'</h2><small>Reserva '+esc(r.code||'')+'</small></div></div>'+
      '<div class="exp-facts">'+fact('Fecha de viaje',fmtDate(r.date))+fact('Pasajeros',r.travelers||0)+
      fact('Categoría',r.tier||'Por confirmar')+fact('Hora de salida',r.departureTime||'Por confirmar')+'</div></div>'+
      '<div class="exp-card"><h3>Pasajeros</h3>'+
      (guests.length?'<div class="exp-detail-list">'+guests.map((g,i)=>'<div><strong>'+(i+1)+'. '+esc(g.name||'Pasajero')+'</strong><small>'+esc(g.status||'Registrado')+'</small></div>').join('')+'</div>':
      '<p>Los nombres de pasajeros se mostrarán cuando estén asociados a la reserva.</p>')+'</div>'+
      '<div class="exp-card"><h3>Itinerario del viaje</h3>'+
      (itinerary.length?'<div class="exp-detail-list">'+itinerary.map(x=>
        '<div><strong>Día '+esc(x.day)+' · '+esc(x.title||'Actividad')+'</strong><small>'+
        esc((x.date?fmtDate(x.date)+' · ':'')+(x.time?x.time+' · ':'')+(x.detail||''))+'</small></div>').join('')+'</div>':
        '<p>El itinerario detallado de esta reserva estará disponible cuando nuestro equipo lo incorpore.</p>')+'</div>'+
      '<div class="exp-card"><h3>Vuelos</h3>'+
      (flights.length?'<div class="exp-detail-list">'+flights.map(f=>
        '<div><strong>'+esc(f.leg)+' · '+esc(f.airline)+' '+esc(f.flight)+'</strong><small>'+
        esc(f.origin)+' '+esc(f.departure)+' → '+esc(f.destination)+' '+esc(f.arrival)+'</small>'+
        '<small>Estado: '+esc(f.status)+'</small></div>').join('')+'</div>':
        '<p>No hay vuelos registrados para esta reserva.</p>')+'</div>'+
      '<div class="exp-card"><h3>Hotel y alojamiento</h3>'+
      (r.hotel?'<div class="exp-facts">'+fact('Alojamiento',r.hotel.name)+
        fact('Entrada',fmtDate(r.hotel.checkIn))+fact('Salida',fmtDate(r.hotel.checkOut))+
        fact('Habitación',r.hotel.room)+fact('Estado',r.hotel.status)+'</div>':
        '<p>No hay un alojamiento registrado para esta reserva.</p>')+'</div>'+
      '<div class="exp-card"><h3>Pagos y documentos</h3><div class="exp-facts">'+
      fact('Total de reserva',usd(r.total))+fact('Total pagado',usd(r.paid))+
      fact('Saldo pendiente',usd(r.balance))+fact('Código',r.code)+'</div>'+
      '<p>El voucher se envía al correo de confirmación cuando corresponde. Los archivos protegidos se habilitarán aquí a medida que estén disponibles.</p>'+
      '<p><a href="'+base+'mi-reserva.html" class="exp-btn exp-btn--light">Consultar reserva por código</a></p></div>'+
      notice(r.notice||'Los vuelos y hoteles solo se consideran confirmados cuando la emisión o confirmación del proveedor esté registrada.');
  }
  function render() {
    if(!state.data)return;
    const d=state.data;
    const count=(d.notifications||[]).filter(x=>!x.read).length;
    const badge=$('#expAlertCount'),small=$('#expSidebarBadge');
    if(badge){badge.hidden=count===0;badge.textContent=count>99?'99+':String(count);}
    if(small)small.hidden=count===0;
    const name=d.user&&d.user.name?String(d.user.name):'Mi cuenta';
    $('#expSidebarName').textContent=name;
    $('#expHeading').textContent=titleFor(state.page);
    $$('[data-exp-nav]',document).forEach(btn=>{
      if(btn.closest('.exp-side-nav')){btn.classList.toggle('is-active',btn.dataset.expNav===state.page);
        if(btn.dataset.expNav===state.page)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');}
    });
    let html='';
    if(state.page==='inicio')html=overview();
    else if(state.page==='viajes')html=tripsPage('viajes');
    else if(state.page==='reservas')html=tripsPage('reservas');
    else if(state.page==='millas')html=milesPage();
    else if(state.page==='recompensas')html=rewardsPage();
    else if(state.page==='avisos')html=notificationsPage();
    else if(state.page==='perfil')html=profilePage();
    else if(state.page==='detalle')html=detailPage();
    root.innerHTML=html;
    root.hidden=false;
    $('#expLoading').hidden=true;
  }
  function flash(msg,err) {
    const box=$('#expFlash');
    if(!box)return;
    box.hidden=!msg;box.textContent=msg||'';
    box.classList.toggle('is-error',!!err);
  }
  async function api(action,data) {
    if(!state.endpoint)throw new Error('No se encontró la configuración de reservas.');
    const response=await fetch(state.endpoint,{
      method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({action:action,data:Object.assign({},data||{},{token:token()})})
    });
    if(!response.ok)throw new Error('No se pudo conectar con el servidor ('+response.status+').');
    const result=await response.json();
    if(!result.ok)throw new Error(result.error||'No fue posible completar la operación.');
    return result;
  }
  async function load() {
    if(!token()) {location.href=base+'login.html?volver='+encodeURIComponent(location.pathname);return;}
    try {
      const response=await fetch(base+'assets/data/catalog.json',{cache:'no-store'});
      if(!response.ok)throw new Error('No se pudo cargar la configuración.');
      const catalog=await response.json();
      state.endpoint=catalog&&catalog.booking&&catalog.booking.endpoint||'';
      try{
        state.data=await api('dashboardHome');
      }catch(err){
        if(!/Acción no reconocida|acción no reconocida/.test(String(err.message)))throw err;
        const old=await api('myTrips');
        state.legacy=true;
        state.data={ok:true,user:old.user,upcoming:old.upcoming||[],past:old.past||[],
          verified:null,miles:null,notifications:[]};
      }
      render();
    }catch(err){
      $('#expLoading').hidden=true;
      flash(err.message||'No fue posible cargar tu cuenta.',true);
      if(/sesi[oó]n/i.test(String(err.message))) {
        try{localStorage.removeItem(kToken);localStorage.removeItem(kUser);}catch(_){}
      }
      root.hidden=false;
      root.innerHTML=empty('No podemos cargar tu cuenta','Revisa tu conexión o inicia sesión nuevamente.',false)+
        '<p><a class="exp-btn" href="'+base+'login.html">Iniciar sesión</a></p>';
    }
  }
  function navigate(page) {
    state.page=page;
    state.details=null;
    flash('');
    if(page!=='detalle')history.replaceState(null,'','#'+page);
    render();
    if(window.innerWidth<761)document.querySelector('.exp-heading')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function openTrip(code) {
    const r=allTrips().find(x=>String(x.code)===String(code));
    if(!r)return;
    state.page='detalle';state.details=null;state.busy=true;flash('');
    render();
    try{
      if(state.legacy){
        state.details={booking:Object.assign({},r,{passengers:[],flights:[],hotel:null,itinerary:[]})};
      } else {
        state.details=await api('dashboardTrip',{code:code});
      }
    }catch(err){flash(err.message,true);}
    state.busy=false;render();
    if(window.innerWidth<761)document.querySelector('.exp-heading')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function sendCode(btn) {
    if(state.legacy)return;
    btn.disabled=true;
    flash('');
    try{
      const r=await api('dashboardSendVerification');
      flash(r.message||'Código enviado a tu correo.');
      if(r.verified)await reload();
    }catch(err){flash(err.message,true);}
    finally{btn.disabled=false;}
  }
  async function reload() {
    if(state.legacy)return;
    state.data=await api('dashboardHome');
    render();
  }
  async function verifyCode(code,btn) {
    btn.disabled=true;flash('');
    try{
      await api('dashboardVerifyEmail',{code:code});
      await reload();
      flash('¡Tu correo está verificado! Ya puedes consultar tus 100 millas de bienvenida.');
      state.page='millas';render();
    }catch(err){flash(err.message,true);}
    finally{btn.disabled=false;}
  }
  async function markRead(id,btn) {
    if(state.legacy)return;
    btn.disabled=true;
    try{
      await api('dashboardReadNotification',{id:id});
      const n=(state.data.notifications||[]).find(x=>x.id===id);
      if(n)n.read=true;
      render();
    }catch(err){flash(err.message,true);btn.disabled=false;}
  }
  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-exp-nav]');
    if(tab && (tab.closest('.exp-app')||tab.closest('.exp-workspace'))) {
      e.preventDefault();navigate(tab.dataset.expNav);return;
    }
    const filter=e.target.closest('[data-exp-filter]');
    if(filter){state.filter=filter.dataset.expFilter;render();return;}
    const trip=e.target.closest('[data-exp-trip]');
    if(trip){openTrip(trip.dataset.expTrip);return;}
    const send=e.target.closest('[data-exp-send-code]');
    if(send){sendCode(send);return;}
    const read=e.target.closest('[data-exp-read]');
    if(read){markRead(read.dataset.expRead,read);return;}
  });
  document.addEventListener('submit',e=>{
    if(e.target.id!=='expVerifyForm')return;
    e.preventDefault();
    const input=$('#expEmailCode');
    if(!input || !/^\d{6}$/.test(input.value.trim())) {
      flash('Introduce los seis dígitos del correo.',true);return;
    }
    verifyCode(input.value.trim(),e.submitter||e.target.querySelector('[type="submit"]'));
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);
  else load();
})();
