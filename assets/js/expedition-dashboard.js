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

  function tierProgress() {
    const t=membership(),levels=[['Explorer',0],['Gold',3000],['Platinum',7000],['Diamond',10000]];
    const low=t.points>=10000?10000:t.points>=7000?7000:t.points>=3000?3000:0;
    const next=t.next||10000;
    const fraction=t.next===null?100:Math.max(0,Math.min(100,100*(t.points-low)/(next-low)));
    return '<div class="exp-tier-progress"><div class="exp-tier-meta"><span>Tu nivel: <strong>'+esc(t.name)+'</strong></span>'+
      '<span>'+esc(t.points.toLocaleString('es-PE'))+' puntos acumulados</span></div>'+
      '<div class="exp-tier-track"><span style="width:'+fraction.toFixed(1)+'%"></span></div>'+
      '<small>'+(t.next===null?'¡Has alcanzado el nivel más alto!':'Te faltan '+esc(t.remaining.toLocaleString('es-PE'))+' puntos para '+esc(levels.find(x=>x[1]===t.next)?.[0]||'el siguiente nivel'))+'</small></div>';
  }
  function shareCards() {
    const choices=[
      {network:'facebook',name:'Facebook',ico:'fa-brands fa-facebook-f',
        href:'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Flatamexpeditions.com%2F',
        detail:'Comparte el sitio en una publicación pública con tus propias palabras.'},
      {network:'instagram',name:'Instagram',ico:'fa-brands fa-instagram',
        href:'https://www.instagram.com/',detail:'Publica una foto o reel propio y menciona LATAM Expeditions.'},
      {network:'tiktok',name:'TikTok',ico:'fa-brands fa-tiktok',
        href:'https://www.tiktok.com/',detail:'Comparte un video original relacionado con tus planes de viaje.'}
    ];
    const social=state.data.social||{};
    return '<div class="exp-social-grid">'+choices.map(n=>{
      const claim=social[n.network],status=claim?.status||'';
      const done=status==='APROBADO',pending=status==='EN ESPERA'||status==='EN REVISION';
      const statusText=done?'Publicación destacada':pending?(status==='EN ESPERA'?'Pendiente de 24 horas':'En revisión'):
        status==='RECHAZADO'?'Enlace rechazado. Puedes enviar otro.':'Compartir es voluntario';
      return '<article class="exp-social-card"><div class="exp-social-icon"><i class="'+n.ico+'" aria-hidden="true"></i></div>'+
        '<div><strong>'+n.name+'</strong><p>'+n.detail+'</p><span class="exp-tag'+(pending?' exp-tag--pending':'')+'">'+statusText+'</span></div>'+
        '<a class="exp-btn exp-btn--light" href="'+n.href+'" target="_blank" rel="noopener noreferrer">Ir a '+n.name+' <i class="fa-solid fa-arrow-up-right-from-square"></i></a>'+
        (!pending&&!done?'<form class="exp-social-form" data-exp-social-form="'+n.network+'">'+
          '<label for="expSocial'+n.network+'">Enlace de tu publicación</label>'+
          '<input id="expSocial'+n.network+'" type="url" name="postUrl" placeholder="https://…" required>'+
          '<button type="submit" class="exp-btn">Enviar publicación</button></form>':
          '<small>Referencia enviada: '+esc(claim?.url||'')+'</small>')+
        '</article>';
    }).join('')+'</div>'+
      '<p class="exp-social-note">Compartir es voluntario y no otorga puntos. Puedes enviar un enlace para que tu publicación forme parte de nuestra comunidad. Los enlaces se revisan a partir de las 24 horas. Si publicas contenido comercial, identifica la colaboración conforme a las reglas de cada plataforma.</p>';
  }
  function milesPage() {
    const m=state.data.miles,ready=!!m,t=membership();
    return verificationBanner()+
      '<div class="exp-wallet"><label>LATAM REWARDS · NIVEL '+esc(t.name.toUpperCase())+'</label>'+
      '<strong>'+(ready?esc(m.available):'—')+' puntos disponibles</strong>'+
      '<small>Tu saldo actual</small><div class="exp-wallet-stats"><div><b>'+(ready?esc(m.pending):'—')+'</b>'+
      '<span>Pendientes de completar el servicio</span></div><div><b>'+(ready?esc(m.used):'—')+'</b><span>Puntos utilizados</span></div></div></div>'+
      tierProgress()+
      '<div class="exp-card"><div class="exp-card-head"><h3>Obtén más puntos</h3>'+
      '<button class="exp-link" type="button" data-exp-nav="recompensas">Ver el programa</button></div>'+
      '<p class="exp-card-intro">Cada US$10 pagados en experiencias, paquetes, vuelos y hoteles te suma 1 punto. También puedes compartir voluntariamente tus planes de viaje.</p>'+
      (state.data.verified?shareCards():verificationBanner())+'</div>'+
      '<div class="exp-card"><h3>Estado de cuenta</h3>'+
      (ready&&m.movements.length?'<div class="exp-table-wrap"><table class="exp-table"><thead><tr><th>Fecha</th><th>Concepto</th><th>Estado</th><th>Puntos</th></tr></thead><tbody>'+
      m.movements.map(x=>'<tr><td>'+esc(fmtDate(x.date))+'</td><td><strong>'+esc(x.title)+'</strong><small>'+esc(x.code||x.type)+'</small></td>'+
        '<td><span class="exp-tag'+(x.status==='PENDIENTE'?' exp-tag--pending':'')+'">'+esc(x.status)+'</span></td>'+
        '<td><span class="'+(num(x.points)<0?'exp-negative':'exp-positive')+'">'+(num(x.points)>0?'+':'')+esc(x.points)+'</span></td></tr>').join('')+
      '</tbody></table></div>':empty('Aún no hay movimientos','Tus bonos y compras se reflejarán aquí.',false))+'</div>';
  }
  function rewardsPage() {
    const values=[
      ['fa-map-location-dot','Experiencias','Tours Full Day, visitas de medio día, city tours, recorridos culturales y experiencias seleccionadas.'],
      ['fa-gift','Souvenirs','Recuerdos de viaje, artesanías y productos regionales seleccionados en nuestros destinos.'],
      ['fa-ticket','Cupones de descuento','Canjea puntos por cupones para experiencias, paquetes, vuelos y hoteles, sujetos a sus condiciones.'],
      ['fa-star','Promociones exclusivas','Beneficios por temporadas, campañas para miembros y experiencias destacadas.']
    ];
    const levels=[['Explorer','0–2,999'],['Gold','3,000–6,999'],['Platinum','7,000–9,999'],['Diamond','10,000+']];
    return '<div class="exp-rewards-grid">'+values.map(x=>
        '<article class="exp-reward"><i class="fa-solid '+x[0]+'" aria-hidden="true"></i>'+
        '<h3>'+x[1]+'</h3><p>'+x[2]+'</p></article>').join('')+'</div>'+
      '<details class="exp-program-accordion"><summary><span><i class="fa-solid fa-gem" aria-hidden="true"></i> Todo sobre LATAM Rewards</span>'+
      '<span class="exp-accordion-arrow"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></span></summary>'+
      '<div class="exp-program-body"><p>Acumula puntos con tus viajes y actividades elegibles. A mayor cantidad de puntos acreditados, mejor será tu nivel de membresía.</p>'+
      '<div class="exp-program-how">'+
      '<article><i class="fa-solid fa-user-check"></i><strong>100 puntos</strong><span>Al verificar tu cuenta por primera vez</span></article>'+
      '<article><i class="fa-solid fa-credit-card"></i><strong>1 punto / US$10</strong><span>En experiencias, paquetes, vuelos y hoteles pagados</span></article>'+
      '<article><i class="fa-solid fa-share-nodes"></i><strong>Comunidad viajera</strong><span>Comparte tus experiencias cuando quieras, sin obligación ni recompensas por publicaciones</span></article>'+
      '<article><i class="fa-solid fa-clock-rotate-left"></i><strong>Puntos disponibles</strong><span>Las compras se acreditan al completar el servicio</span></article></div>'+
      '<h3>Tu camino de recompensas</h3><div class="exp-tiers">'+levels.map(x=>
      '<div><i class="fa-solid fa-medal"></i><strong>'+x[0]+'</strong><small>'+x[1]+' puntos acreditados</small></div>').join('')+'</div>'+
      tierProgress()+
      '<div class="exp-highlight-reward"><i class="fa-solid fa-ticket"></i><div><strong>Experiencias locales desde 500 puntos</strong>'+
      '<p>Podrás solicitar beneficios seleccionados en Cusco, Pachacámac, Santiago, Río de Janeiro o Buenos Aires, según disponibilidad y campaña vigente.</p></div></div>'+
      '<p>Los puntos pueden canjearse directamente por experiencias independientes y souvenirs. Para paquetes, hoteles y vuelos se utilizan cupones con condiciones específicas.</p>'+
      '<p>En Tripadvisor puedes compartir una opinión auténtica sobre tu experiencia, sin premios ni puntos por reseñas.</p>'+
      '</div></details>';
  }
  function profilePage() {
    const u=state.data.user||{},p=state.data.profile||{},provider=String(u.provider||'correo');
    const method=provider.toLowerCase().includes('google')?'Google':'Correo y contraseña';
    const codes=[['🇵🇪','+51','Perú'],['🇨🇴','+57','Colombia'],['🇨🇱','+56','Chile'],
      ['🇦🇷','+54','Argentina'],['🇧🇷','+55','Brasil'],['🇻🇪','+58','Venezuela'],
      ['🇧🇴','+591','Bolivia'],['🇪🇨','+593','Ecuador'],['🇲🇽','+52','México'],
      ['🇺🇾','+598','Uruguay'],['🇨🇷','+506','Costa Rica'],['🇺🇸','+1','Estados Unidos'],
      ['🇪🇸','+34','España'],['🇨🇦','+1','Canadá'],['🇫🇷','+33','Francia']];
    const avatar=state.avatar||p.googlePicture||'';
    return '<div class="exp-card"><div class="exp-profile-top">'+
      '<span class="exp-profile-avatar">'+(avatar?'<img src="'+esc(avatar)+'" alt="Tu fotografía de perfil">':'<i class="fa-solid fa-user" aria-hidden="true"></i>')+'</span>'+
      '<div><strong>Tu fotografía</strong><p>Usa la foto de Google o carga tu propia imagen.</p>'+
      '<label class="exp-btn exp-btn--light" for="expAvatarInput"><i class="fa-solid fa-camera"></i> Cambiar fotografía</label>'+
      '<input type="file" id="expAvatarInput" accept="image/jpeg,image/png,image/webp" hidden></div></div></div>'+
      '<div class="exp-card"><h3>Información personal</h3><form id="expProfileForm" class="exp-profile-form">'+
      '<div class="exp-form-grid"><label>Nombre y apellido<input name="name" maxlength="120" value="'+esc(p.name||u.name||'')+'" required></label>'+
      '<label>Correo electrónico<input value="'+esc(p.email||u.email||'')+'" disabled></label>'+
      '<label>Teléfono de contacto<input name="phone" type="tel" maxlength="28" value="'+esc(p.phone||u.phone||'')+'" placeholder="+51 987654321"></label>'+
      '<label>Tipo de documento<select name="docType"><option value="">Seleccionar</option>'+
      ['DNI','CE','PASAPORTE','CI','RG','CPF','OTRO'].map(x=>'<option value="'+x+'"'+(x===p.docType?' selected':'')+'>'+({'CE':'Carné de extranjería','PASAPORTE':'Pasaporte','CI':'Cédula de identidad','RG':'RG (Brasil)','CPF':'CPF (Brasil)'}[x]||x)+'</option>').join('')+'</select></label>'+
      '<label>Número de documento<input name="docNumber" maxlength="30" value="'+esc(p.docNumber||'')+'" autocomplete="off"></label>'+
      '<label>Acceso a la cuenta<input value="'+esc(method)+'" disabled></label></div>'+
      '<h4>WhatsApp</h4><div class="exp-whatsapp-row"><label>Código de país<select name="whatsappCode">'+
      codes.map(x=>'<option value="'+x[1]+'"'+(x[1]===(p.whatsappCode||'+51')?' selected':'')+'>'+x[0]+' '+x[1]+' · '+x[2]+'</option>').join('')+
      '</select></label><label>Número de WhatsApp<input type="tel" name="whatsapp" inputmode="numeric" maxlength="15" placeholder="987654321" value="'+esc(p.whatsapp||'')+'"></label></div>'+
      '<button type="submit" class="exp-btn"><i class="fa-solid fa-floppy-disk"></i> Guardar cambios</button></form></div>'+
      '<div class="exp-card"><h3>Correo y seguridad</h3>'+
      '<details class="exp-subdetails"><summary>Cambiar correo electrónico <i class="fa-solid fa-chevron-down"></i></summary>'+
      '<p>Para proteger tu cuenta, enviaremos un código al nuevo correo.</p>'+
      '<form id="expEmailRequestForm" class="exp-profile-form">'+
      '<label>Nuevo correo<input type="email" name="newEmail" required placeholder="nuevo@correo.com"></label>'+
      (provider.toLowerCase().includes('password')?
        '<label>Contraseña actual<input type="password" name="password" required autocomplete="current-password"></label>':'')+
      '<button class="exp-btn exp-btn--light" type="submit">Enviar código al nuevo correo</button></form>'+
      '<form id="expEmailConfirmForm" class="exp-email-confirm"><label>Código de seis dígitos<input name="code" pattern="[0-9]{6}" maxlength="6" inputmode="numeric" placeholder="000000" required></label>'+
      '<button class="exp-btn" type="submit">Confirmar cambio de correo</button></form></details>'+
      '<div class="exp-security-foot"><span>Sesión actual</span><button type="button" class="exp-btn exp-btn--light" data-logout>Cerrar sesión</button></div></div>'+
      '<div class="exp-card"><h3>Verificación y bienvenida</h3>'+
      (state.data.verified?'<div class="exp-notice"><i class="fa-solid fa-circle-check"></i><p>Tu cuenta está verificada y participa en LATAM Rewards.</p></div>':verificationBanner())+'</div>';
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
  // La vista de perfil se declara junto al resto de LATAM Rewards.
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
    const tier=$('#expSidebarTier');
    if(tier)tier.textContent=membership().name+' · LATAM Rewards';
    const avatar=$('.exp-sidebar-avatar');
    const source=state.avatar||d.profile?.googlePicture||d.user?.picture||'';
    if(avatar)avatar.innerHTML=source?'<img src="'+esc(source)+'" alt="" decoding="async">':
      '<i class="fa-solid fa-user" aria-hidden="true"></i>';
    $('#expHeading').textContent=titleFor(state.page);
    const subtitle=$('#expHeadingSubtitle');
    if(subtitle)subtitle.textContent=subtitleFor(state.page);
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
      loadAvatar();
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
      flash('¡Tu correo está verificado! Ya puedes consultar tus 100 puntos de bienvenida.');
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

  async function loadAvatar(){
    if(state.legacy || !state.data.profile?.hasAvatar)return;
    try{const result=await api('dashboardGetAvatar');if(result.avatar){state.avatar=result.avatar;render();}}catch(err){}
  }
  async function profileSave(form,button){
    button.disabled=true;
    try{
      const formData=new FormData(form);
      const payload=Object.fromEntries(formData.entries());
      const result=await api('dashboardSaveProfile',payload);
      state.data.profile=result.profile;
      state.data.user.name=result.profile.name;
      state.data.user.phone=result.profile.phone;
      const cached=JSON.parse(localStorage.getItem(kUser)||'{}');
      cached.name=result.profile.name;cached.phone=result.profile.phone;
      localStorage.setItem(kUser,JSON.stringify(cached));
      render();flash('Tus datos se guardaron correctamente.');
    }catch(err){flash(err.message,true);}finally{button.disabled=false;}
  }
  async function emailRequest(form,button){
    button.disabled=true;
    try{
      const payload=Object.fromEntries(new FormData(form).entries());
      const result=await api('dashboardRequestEmailChange',payload);
      flash(result.message||'Revisa tu nuevo correo.');
    }catch(err){flash(err.message,true);}finally{button.disabled=false;}
  }
  async function emailConfirm(form,button){
    button.disabled=true;
    try{
      const result=await api('dashboardConfirmEmailChange',Object.fromEntries(new FormData(form).entries()));
      await reload();
      const cached=JSON.parse(localStorage.getItem(kUser)||'{}');
      cached.email=result.email;localStorage.setItem(kUser,JSON.stringify(cached));
      flash('Correo actualizado y verificado. Tus viajes y puntos se mantienen asociados a la cuenta.');
    }catch(err){flash(err.message,true);}finally{button.disabled=false;}
  }
  async function socialSubmit(form,button){
    button.disabled=true;
    try{
      const result=await api('dashboardSubmitSocial',{
        network:form.dataset.expSocialForm,url:form.elements.postUrl.value.trim()
      });
      await reload();
      flash(result.message||'Publicación enviada. Gracias por participar.');
    }catch(err){flash(err.message,true);}finally{button.disabled=false;}
  }
  async function avatarUpload(file){
    if(!file || !/^image\/(jpeg|png|webp)$/.test(file.type)){
      flash('Selecciona una fotografía JPG, PNG o WebP.',true);return;
    }
    if(file.size>7*1024*1024){flash('La imagen supera el límite de 7 MB.',true);return;}
    try{
      const source=await new Promise((resolve,reject)=>{
        const reader=new FileReader();reader.onload=()=>resolve(reader.result);
        reader.onerror=reject;reader.readAsDataURL(file);
      });
      const img=await new Promise((resolve,reject)=>{
        const pic=new Image();pic.onload=()=>resolve(pic);pic.onerror=reject;pic.src=source;
      });
      const canvas=document.createElement('canvas');canvas.width=160;canvas.height=160;
      const ctx=canvas.getContext('2d');
      const side=Math.min(img.width,img.height),sx=(img.width-side)/2,sy=(img.height-side)/2;
      ctx.drawImage(img,sx,sy,side,side,0,0,160,160);
      const jpeg=canvas.toDataURL('image/jpeg',.78).split(',')[1];
      if(jpeg.length>108000)throw Error('Prueba con una fotografía más pequeña.');
      const result=await api('dashboardUploadAvatar',{image:jpeg});
      state.avatar=result.avatar;state.data.profile.hasAvatar=true;
      render();flash('Fotografía actualizada.');
    }catch(err){flash(err.message||'No se pudo guardar la fotografía.',true);}
  }
  document.addEventListener('click',e=>{
    const logout=e.target.closest('#expPagePanels [data-logout]');
    if(logout){
      e.preventDefault();logout.disabled=true;
      api('logout').catch(()=>{}).finally(()=>{
        try{localStorage.removeItem(kToken);localStorage.removeItem(kUser);}catch(err){}
        window.location.href=base+'index.html';
      });return;
    }
    const tab=e.target.closest('[data-exp-nav]');
    if(tab && (tab.closest('.exp-app')||tab.closest('.exp-workspace'))) {
      e.preventDefault();navigate(tab.dataset.expNav);return;
    }
    const reservationFilter=e.target.closest('[data-exp-res-filter]');
    if(reservationFilter){state.reservationFilter=reservationFilter.dataset.expResFilter;render();return;}
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
    const form=e.target,submit=e.submitter||form.querySelector('[type="submit"]');
    if(form.id==='expVerifyForm'){
      e.preventDefault();const input=$('#expEmailCode');
      if(!input || !/^\d{6}$/.test(input.value.trim())){
        flash('Introduce los seis dígitos del correo.',true);return;
      }
      verifyCode(input.value.trim(),submit);return;
    }
    if(form.id==='expProfileForm'){e.preventDefault();profileSave(form,submit);return;}
    if(form.id==='expEmailRequestForm'){e.preventDefault();emailRequest(form,submit);return;}
    if(form.id==='expEmailConfirmForm'){e.preventDefault();emailConfirm(form,submit);return;}
    if(form.dataset.expSocialForm){e.preventDefault();socialSubmit(form,submit);}
  });
  document.addEventListener('change',e=>{
    if(e.target.id==='expAvatarInput' && e.target.files?.[0])avatarUpload(e.target.files[0]);
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);
  else load();
})();
