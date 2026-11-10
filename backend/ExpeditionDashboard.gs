/**
 * LATAM EXPEDITIONS · EXPEDITION REWARDS / DASHBOARD 2026-11
 * Agregar a MISMO proyecto Apps Script que Codigo.gs, Cuentas.gs y Operaciones.gs.
 * Las hojas no se publican. Ningún dato de otro usuario sale sin token válido.
 * Millas de compras: cálculo a partir de Reservas (fuente contable), NO del navegador.
 * Bono: asiento único en MillasMovimientos; las recompensas y cupones son catálogo futuro.
 */
var LX_REWARDS = {
  verification:'Verificaciones Expedition',
  ledger:'MillasMovimientos',
  notifications:'Notificaciones Expedition'
};
function lxRwSheet_(name,headers) {
  return hojaCuenta(name,headers);
}
function lxRwSafe_(v,max) {
  return textoHoja(textoPlano(v,max||200));
}
function lxRwUser_(data) {
  var email=emailDeSesion(data && data.token);
  var user=buscarUsuario(email);
  if (!user || user.estado!=='ACTIVA') throw new Error('La cuenta no está activa.');
  return user;
}
function lxRwIsoDate_(value) {
  if (value instanceof Date) return Utilities.formatDate(value,'America/Lima','yyyy-MM-dd');
  return String(value||'').slice(0,10);
}
function lxRwIsoTime_(value) {
  if (value instanceof Date) return Utilities.formatDate(value,'America/Lima',"yyyy-MM-dd'T'HH:mm:ss");
  return String(value||'');
}
function lxRwVerifiedSheet_() {
  return lxRwSheet_(LX_REWARDS.verification,
    ['Email','Verificado','Código hash','Expira','Intentos','Último envío','Envíos en ventana']);
}
function lxRwVerification_(email) {
  var h=lxRwVerifiedSheet_(),values=h.getDataRange().getValues();
  for(var i=1;i<values.length;i++) if(normalizarEmail(values[i][0])===email) {
    return {sheet:h,row:i+1,data:values[i]};
  }
  return {sheet:h,row:0,data:null};
}
function lxRwIsVerified_(user) {
  if(user.googleSub && /google/i.test(user.proveedor))return true;
  var r=lxRwVerification_(user.email);
  return !!(r.data && r.data[1] instanceof Date && !isNaN(r.data[1].getTime()));
}
function lxRwLedger_() {
  return lxRwSheet_(LX_REWARDS.ledger,
    ['Clave','Email','Fecha','Tipo','Concepto','Millas','Estado','Referencia']);
}
function lxRwAwardWelcome_(user) {
  if(!lxRwIsVerified_(user))return false;
  var key='WELCOME:'+user.email;
  var lock=LockService.getScriptLock();lock.waitLock(15000);
  try {
    var sheet=lxRwLedger_(),vals=sheet.getDataRange().getValues();
    for(var i=1;i<vals.length;i++)if(String(vals[i][0])===key)return false;
    sheet.appendRow([key,lxRwSafe_(user.email,254),new Date(),'BONO',
      'Bono de bienvenida · cuenta verificada',100,'DISPONIBLE','Registro']);
    return true;
  }finally{lock.releaseLock();}
}
function lxRwSendCode_(data) {
  var user=lxRwUser_(data);
  if(lxRwIsVerified_(user))return {ok:true,verified:true,message:'Cuenta ya verificada.'};
  var lock=LockService.getScriptLock();lock.waitLock(15000);
  try {
    var rec=lxRwVerification_(user.email),now=Date.now(),prev=rec.data;
    var last=prev&&prev[5] instanceof Date?prev[5].getTime():0;
    if(last && now-last<60000)throw new Error('Espera un minuto antes de pedir otro código.');
    var count=last && now-last<3600000?Number(prev[6]||0):0;
    if(count>=3)throw new Error('Has alcanzado el límite de envíos. Inténtalo dentro de una hora.');
    var bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
      Utilities.getUuid()+':'+Utilities.getUuid()+':'+pepperAuth());
    var seed=((bytes[0]&255)*65536)+((bytes[1]&255)*256)+(bytes[2]&255);
    var code=String(seed%1000000).padStart(6,'0');
    var hash=hashTokenSesion('VERIFY:'+user.email+':'+code);
    var values=[user.email,'',hash,new Date(now+10*60000),0,new Date(),count+1];
    if(rec.row)rec.sheet.getRange(rec.row,1,1,values.length).setValues([values]);
    else rec.sheet.appendRow(values);
    MailApp.sendEmail({
      to:user.email,subject:'Verifica tu cuenta · LATAM Expeditions',
      name:'LATAM Expeditions',
      body:'Tu código de verificación es: '+code+
        '\n\nEs válido por 10 minutos. No lo compartas con nadie.'+
        '\nSi no lo solicitaste, puedes ignorar este correo.'
    });
    return {ok:true,verified:false,message:'Código enviado a tu correo.'};
  }finally{lock.releaseLock();}
}
function lxRwVerifyCode_(data) {
  var user=lxRwUser_(data);
  if(lxRwIsVerified_(user)) {
    lxRwAwardWelcome_(user);
    return {ok:true,verified:true};
  }
  var code=String(data&&data.code||'').trim();
  if(!/^\d{6}$/.test(code))throw new Error('Introduce el código de seis dígitos.');
  var lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    var rec=lxRwVerification_(user.email);
    if(!rec.row || !rec.data[2])throw new Error('Solicita primero un código de verificación.');
    if(Number(rec.data[4]||0)>=5)throw new Error('Demasiados intentos. Solicita un código nuevo.');
    if(!(rec.data[3] instanceof Date)||rec.data[3].getTime()<Date.now())
      throw new Error('El código caducó. Solicita uno nuevo.');
    var expected=String(rec.data[2]),provided=hashTokenSesion('VERIFY:'+user.email+':'+code);
    if(!igualSeguro(expected,provided)){
      rec.sheet.getRange(rec.row,5).setValue(Number(rec.data[4]||0)+1);
      throw new Error('El código no coincide.');
    }
    rec.sheet.getRange(rec.row,2,1,4).setValues([[new Date(),'','',0]]);
  }finally{lock.releaseLock();}
  lxRwAwardWelcome_(user);
  return {ok:true,verified:true};
}
function lxRwNotifications_() {
  return lxRwSheet_(LX_REWARDS.notifications,
    ['ID','Email','Fecha','Tipo','Título','Detalle','Reserva','Leída']);
}
function lxRwBookings_(email) {
  var rows=hojaReservas().getDataRange().getValues(),out=[];
  for(var i=1;i<rows.length;i++) {
    if(normalizarEmail(rows[i][COL.email])!==email)continue;
    var r=filaAReserva(rows[i]);
    r.orderId=String(rows[i][17]||'');
    r.captureId=String(rows[i][18]||'');
    r.paymentStatus=String(rows[i][24]||'');
    r.created=lxRwIsoDate_(rows[i][0]);
    out.push(r);
  }
  return out;
}
function lxRwPaid_(b) {
  var bad=/cancel|anulad|reembols|devuelt|refunded|chargeback|disputa/i.test(b.status||'');
  return !bad && Number(b.paid)>0 && (Boolean(b.captureId) ||
    /paid|pagada|completad|realizad|finalizad/i.test(String(b.paymentStatus||'')+' '+String(b.status||'')));
}
function lxRwCompleted_(b) {
  return /^(REALIZADA|COMPLETADA|FINALIZADA)$/i.test(String(b.status||'').trim());
}
function lxRwPointStatement_(bookings,verified) {
  var ledger=lxRwLedger_().getDataRange().getValues(),entries=[],redemptions=0,bonus=0;
  for(var i=1;i<ledger.length;i++) {
    var row=ledger[i];
    if(normalizarEmail(row[1])!==verified.email)continue;
    var qty=Number(row[5])||0,kind=String(row[3]||'');
    if(kind==='BONO' && String(row[0])==='WELCOME:'+verified.email)bonus+=qty;
    else if(qty<0)redemptions+=qty;
    entries.push({id:String(row[0]),date:lxRwIsoDate_(row[2]),type:kind,
      title:String(row[4]),points:qty,status:String(row[6]||'DISPONIBLE'),code:String(row[7]||'')});
  }
  // Las compras cerradas primero: el saldo disponible no usa pagos de viajes pendientes.
  var paid=bookings.filter(lxRwPaid_).sort(function(a,b){
    var comp=Number(lxRwCompleted_(b))-Number(lxRwCompleted_(a));
    return comp || String(a.created).localeCompare(String(b.created)) || String(a.code).localeCompare(String(b.code));
  });
  var cents=0,available=0,pending=0;
  paid.forEach(function(b){
    var value=Math.round(Math.max(0,Number(b.paid)||0)*100);
    var before=Math.floor(cents/1000);cents+=value;
    var points=Math.floor(cents/1000)-before;
    var completed=lxRwCompleted_(b);
    if(completed)available+=points;else pending+=points;
    entries.push({id:'PURCHASE:'+b.code,date:b.created||b.date,
      type:'COMPRA',title:'Compra · '+b.title,points:points,
      status:completed?'DISPONIBLE':'PENDIENTE',code:b.code});
  });
  entries.sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
  return {
    available:Math.max(0,bonus+available+redemptions),pending:pending,
    earned:bonus+available+pending,used:-redemptions,
    bonus:bonus,movements:entries.slice(0,100),
    carryUsd:Number(((cents%1000)/100).toFixed(2))
  };
}
function lxRwSyncNotifications_(email,bookings,verified) {
  var h=lxRwNotifications_(),rows=h.getDataRange().getValues(),existing={};
  for(var i=1;i<rows.length;i++)if(normalizarEmail(rows[i][1])===email)
    existing[String(rows[i][0])]=true;
  var adds=[],now=new Date();
  if(verified){
    var welcomeId='VERIFIED:'+email;
    if(!existing[welcomeId]) adds.push([welcomeId,email,now,'rewards',
      '¡Bienvenido a Expedition Rewards!','Tu cuenta está verificada y puedes consultar tus millas.','','NO']);
  }
  bookings.slice(-100).forEach(function(b){
    if(!b.code)return;
    // Una nueva notificación por cambio de estado; nunca por simple refresco.
    var currentState=String(b.status||'EN REVISIÓN').trim().toUpperCase().slice(0,60);
    var id='BOOKING:'+email+':'+b.code+':'+currentState;
    if(!existing[id]) {
      adds.push([id,email,now,'booking','Estado de tu reserva',
        b.title+' · '+b.code+' · '+b.status,b.code,'NO']);
    }
    if(lxRwCompleted_(b) && lxRwPaid_(b)){
      var rewardId='MILES:'+email+':'+b.code;
      if(!existing[rewardId])adds.push([rewardId,email,now,'rewards',
        'Compra elegible completada','Las millas de '+b.code+
          ' ya cuentan como disponibles en tu estado de cuenta.',b.code,'NO']);
    }
  });
  if(adds.length)h.getRange(h.getLastRow()+1,1,adds.length,8).setValues(adds);
}
function lxRwReadNotifications_(email) {
  var values=lxRwNotifications_().getDataRange().getValues(),list=[];
  for(var i=values.length-1;i>=1;i--) {
    var r=values[i];
    if(normalizarEmail(r[1])!==email)continue;
    list.push({id:String(r[0]),date:lxRwIsoTime_(r[2]),
      type:String(r[3]),title:String(r[4]),text:String(r[5]),
      code:String(r[6]||''),read:String(r[7]).toUpperCase()==='SI'});
    if(list.length>=60)break;
  }
  return list;
}
function lxRwDashboard_(data) {
  var user=lxRwUser_(data),verified=lxRwIsVerified_(user);
  if(verified)lxRwAwardWelcome_(user);
  var bookings=lxRwBookings_(user.email);
  lxRwSyncNotifications_(user.email,bookings,verified);
  var notices=lxRwReadNotifications_(user.email);
  var miles=lxRwPointStatement_(bookings,user);
  var today=Utilities.formatDate(new Date(),'America/Lima','yyyy-MM-dd');
  var upcoming=[],past=[];
  bookings.forEach(function(b){
    var item={code:b.code,title:b.title,slug:b.slug,tier:b.tier,date:b.date,
      status:b.status,travelers:b.travelers,total:b.total,paid:b.paid,
      balance:b.balance,departureTime:b.departureTime,paymentStatus:b.paymentStatus,
      paidConfirmed:lxRwPaid_(b),completed:lxRwCompleted_(b)};
    if(b.date && b.date<today && !/pendiente|cotizaci/i.test(b.status))past.push(item);
    else upcoming.push(item);
  });
  upcoming.sort(function(a,b){return String(a.date).localeCompare(String(b.date));});
  past.sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
  return {ok:true,user:usuarioPublico(user),verified:verified,
    verificationMethod:user.googleSub?'google':'email',miles:miles,
    upcoming:upcoming,past:past,notifications:notices};
}
function lxRwRowsForCode_(name,code) {
  var book=SpreadsheetApp.openById(CONFIG.sheetId),h=book.getSheetByName(name);
  if(!h || h.getLastRow()<2)return [];
  return h.getDataRange().getValues().slice(1).filter(function(row){return String(row[0])===code;});
}
function lxRwTripDetail_(data) {
  var user=lxRwUser_(data),code=textoPlano(data&&data.code,90);
  if(!code)throw new Error('Falta el código de reserva.');
  var values=hojaReservas().getDataRange().getValues(),row=null;
  for(var i=1;i<values.length;i++){
    if(String(values[i][COL.codigo])===code && normalizarEmail(values[i][COL.email])===user.email){
      row=values[i];break;
    }
  }
  if(!row)throw new Error('No encontramos esa reserva en tu cuenta.');
  var r=filaAReserva(row),op=lxRwRowsForCode_('Detalle Operativo',code),
    px=lxRwRowsForCode_('Pasajeros',code),fl=lxRwRowsForCode_('Vuelos',code),
    ho=lxRwRowsForCode_('Hoteles',code),it=lxRwRowsForCode_('Itinerarios',code);
  var guests=px.map(function(p){return {name:String(p[3]||''),status:String(p[8]||'')};});
  if(!guests.length && r.passengers)guests=String(r.passengers).split(' | ').map(function(x){
    return {name:x.split(' (')[0].slice(0,120),status:'REGISTRADO'};
  });
  var info=op[0]||[],hotel=ho[0]||[];
  var flights=fl.filter(function(f){return f[3]||f[5]||f[7];}).map(function(f){
    return {leg:String(f[1]||''),airline:String(f[3]||''),flight:String(f[4]||''),
      origin:String(f[5]||''),departure:String(f[6]||''),destination:String(f[7]||''),
      arrival:String(f[8]||''),status:String(f[9]||'PENDIENTE DE EMISIÓN')};
  });
  var hotelData=hotel.length?{name:String(hotel[2]||hotel[1]||''),
    checkIn:lxRwIsoDate_(hotel[3]),checkOut:lxRwIsoDate_(hotel[4]),
    room:String(hotel[5]||''),status:String(hotel[7]||'PENDIENTE DE CONFIRMACIÓN')}:null;
  var itinerary=it.map(function(x){return{day:String(x[1]||''),date:lxRwIsoDate_(x[2]),
    title:String(x[3]||''),detail:String(x[4]||''),time:String(x[5]||'')};});
  return {ok:true,booking:{
    code:r.code,title:r.title,date:r.date,status:r.status,travelers:r.travelers,
    total:r.total,paid:r.paid,balance:r.balance,tier:r.tier,departureTime:r.departureTime,
    product:r.slug,passengers:guests,flights:flights,hotel:hotelData,
    itinerary:itinerary,tourLanguage:String(info[7]||''),
    hasFlightEstimate:flights.length>0 || Number(info[14]||0)>0,
    notice:'Los vuelos y hoteles solo están confirmados si su estado indica emisión o confirmación.'
  }};
}
function lxRwMarkRead_(data) {
  var user=lxRwUser_(data),id=String(data&&data.id||'');
  var h=lxRwNotifications_(),rows=h.getDataRange().getValues();
  for(var i=1;i<rows.length;i++)if(String(rows[i][0])===id && normalizarEmail(rows[i][1])===user.email){
    h.getRange(i+1,8).setValue('SI');return{ok:true};
  }
  throw new Error('No encontramos la notificación.');
}
/**
 * Inicialización de Sheets opcional en editor Apps Script.
 * Se crean al primer uso; no ejecutar con cuentas de clientes.
 */
function lxRwInstall_() {
  lxRwVerifiedSheet_();lxRwLedger_();lxRwNotifications_();
  return 'Expedition Rewards: hojas creadas';
}
