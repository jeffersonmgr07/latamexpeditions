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
  var emails=lxRwEmails_(user.email);
  var key='WELCOME:'+user.email;
  var lock=LockService.getScriptLock();lock.waitLock(15000);
  try {
    var sheet=lxRwLedger_(),vals=sheet.getDataRange().getValues();
    for(var i=1;i<vals.length;i++)if(emails.some(function(email){return String(vals[i][0])==='WELCOME:'+email;}))return false;
    sheet.appendRow([key,lxRwSafe_(user.email,254),new Date(),'BONO',
      'Bono de bienvenida · LATAM Rewards',100,'DISPONIBLE','Registro']);
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
  var aliases=lxRwEmails_(email),rows=hojaReservas().getDataRange().getValues(),out=[];
  for(var i=1;i<rows.length;i++) {
    if(aliases.indexOf(normalizarEmail(rows[i][COL.email]))<0)continue;
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
  var aliases=lxRwEmails_(verified.email);
  var ledger=lxRwLedger_().getDataRange().getValues(),entries=[],redemptions=0,bonus=0,otherCredits=0;
  for(var i=1;i<ledger.length;i++) {
    var row=ledger[i];
    if(aliases.indexOf(normalizarEmail(row[1]))<0)continue;
    var qty=Number(row[5])||0,kind=String(row[3]||'');
    if(kind==='BONO' && aliases.some(function(email){return String(row[0])==='WELCOME:'+email;}))bonus+=qty;
    else if(qty>0 && kind!=='COMPRA')otherCredits+=qty;
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
    available:Math.max(0,bonus+otherCredits+available+redemptions),pending:pending,
    earned:bonus+otherCredits+available+pending,used:-redemptions,
    tierPoints:bonus+otherCredits+available,
    bonus:bonus,movements:entries.slice(0,100),
    carryUsd:Number(((cents%1000)/100).toFixed(2))
  };
}
function lxRwSyncNotifications_(email,bookings,verified) {
  var h=lxRwNotifications_(),rows=h.getDataRange().getValues(),existing={};
  var aliases=lxRwEmails_(email);
  for(var i=1;i<rows.length;i++)if(aliases.indexOf(normalizarEmail(rows[i][1]))>=0)
    existing[String(rows[i][0])]=true;
  var adds=[],now=new Date();
  if(verified){
    var welcomeId='VERIFIED:'+email;
    if(!existing[welcomeId]) adds.push([welcomeId,email,now,'rewards',
      '¡Bienvenido a LATAM Rewards!','Tu cuenta está verificada y puedes consultar tus puntos.','','NO']);
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
        'Compra elegible completada','Los puntos de '+b.code+
          ' ya cuentan como disponibles en tu estado de cuenta.',b.code,'NO']);
    }
  });
  if(adds.length)h.getRange(h.getLastRow()+1,1,adds.length,8).setValues(adds);
}
function lxRwReadNotifications_(email) {
  var aliases=lxRwEmails_(email),values=lxRwNotifications_().getDataRange().getValues(),list=[];
  for(var i=values.length-1;i>=1;i--) {
    var r=values[i];
    if(aliases.indexOf(normalizarEmail(r[1]))<0)continue;
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
  lxRwCreditApprovedSocial_(user.email);
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
    profile:lxRwProfileFor_(user),social:lxRwSocialFor_(user.email),
    membership:lxRwMembership_(miles.tierPoints||0),
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
    if(String(values[i][COL.codigo])===code && lxRwEmails_(user.email).indexOf(normalizarEmail(values[i][COL.email]))>=0){
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
  for(var i=1;i<rows.length;i++)if(String(rows[i][0])===id && lxRwEmails_(user.email).indexOf(normalizarEmail(rows[i][1]))>=0){
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
  lxRwProfileSheet_();lxRwSocialSheet_();lxRwEmailChangeSheet_();lxRwAliasesSheet_();
  return 'Expedition Rewards: hojas creadas';
}


/**
 * Ejecutar UNA VEZ desde el selector de funciones de Apps Script.
 * Los métodos que terminan en _ son internos y pueden ocultarse del editor.
 * No cobra dinero ni asigna millas: solo prepara las hojas necesarias.
 */
function instalarExpeditionRewards() {
  if (!CONFIG.sheetId) {
    throw new Error('Falta la propiedad SHEET_ID en este proyecto de Apps Script.');
  }
  var resultado = lxRwInstall_();
  Logger.log(resultado);
  Logger.log('Hojas conectadas: ' + SpreadsheetApp.openById(CONFIG.sheetId).getName());
  return resultado;
}


/* ================= LATAM Rewards · Niveles y perfil ================ */
function lxRwMembership_(points) {
  var p=Math.max(0,Math.floor(Number(points)||0));
  var level=p>=10000?'Diamond':p>=7000?'Platinum':p>=3000?'Gold':'Explorer';
  var next=p>=10000?null:p>=7000?10000:p>=3000?7000:3000;
  return {name:level,points:p,next:next,remaining:next===null?0:next-p};
}
function lxRwProfileSheet_(){
  return lxRwSheet_('Perfiles Expedition',
    ['Email','Nombre','Teléfono','Código WhatsApp','Número WhatsApp',
      'Tipo documento','Número documento','Archivo avatar Drive','Actualizado']);
}
function lxRwProfileRow_(email){
  var sh=lxRwProfileSheet_(),rows=sh.getDataRange().getValues(),aliases=lxRwEmails_(email);
  for(var i=1;i<rows.length;i++)if(aliases.indexOf(normalizarEmail(rows[i][0]))>=0)
    return {sheet:sh,row:i+1,values:rows[i]};
  return {sheet:sh,row:0,values:[]};
}
function lxRwProfileFor_(user){
  var p=lxRwProfileRow_(user.email).values;
  return {
    name:String(p[1]||user.nombre||''),
    email:user.email,phone:String(p[2]||user.telefono||''),
    whatsappCode:String(p[3]||'+51'),whatsapp:String(p[4]||''),
    docType:String(p[5]||''),docNumber:String(p[6]||''),
    hasAvatar:!!p[7],googlePicture:String(user.foto||'')
  };
}
function lxRwUpdateProfile_(data){
  var u=lxRwUser_(data);
  var name=textoPlano(data.name,120),phone=textoPlano(data.phone,30),
      code=textoPlano(data.whatsappCode,6),wa=textoPlano(data.whatsapp,18),
      docType=textoPlano(data.docType,20),doc=textoPlano(data.docNumber,35);
  if(name.length<3)throw Error('Indica tu nombre y apellido.');
  if(phone&&!/^\+?[\d ()-]{6,28}$/.test(phone))throw Error('El teléfono no tiene un formato válido.');
  if(!/^\+[1-9]\d{0,3}$/.test(code))throw Error('Selecciona el código de WhatsApp.');
  if(wa&&!/^\d{6,15}$/.test(wa))throw Error('El número de WhatsApp no es válido.');
  if(docType&&['DNI','CE','PASAPORTE','CI','RG','CPF','OTRO'].indexOf(docType)<0)
    throw Error('Selecciona un tipo de documento válido.');
  if(doc&&(!docType||!/^[A-Za-z0-9-]{4,30}$/.test(doc)))
    throw Error('Revisa el tipo y número de documento.');
  var lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    var entry=lxRwProfileRow_(u.email),prev=entry.values;
    var row=[u.email,lxRwSafe_(name,120),lxRwSafe_(phone,30),
      lxRwSafe_(code,6),lxRwSafe_(wa,18),lxRwSafe_(docType,20),
      lxRwSafe_(doc,35),String(prev[7]||''),new Date()];
    if(entry.row)entry.sheet.getRange(entry.row,1,1,9).setValues([row]);
    else entry.sheet.appendRow(row);
    var users=hojaUsuarios();
    users.getRange(u.fila,2).setValue(lxRwSafe_(name,120));
    users.getRange(u.fila,3).setValue(lxRwSafe_(phone,30));
  }finally{lock.releaseLock();}
  return {ok:true,profile:lxRwProfileFor_(buscarUsuario(u.email))};
}
/** Las fotos se guardan PRIVADAS en Drive; no se crea un enlace público. */
function lxRwAvatarFolder_(){
  var prop='LATAM_REWARDS_AVATAR_FOLDER',p=PROPS.getProperty(prop);
  if(p){try{return DriveApp.getFolderById(p);}catch(err){}}
  var folder=DriveApp.createFolder('LATAM Rewards · Avatares privados');
  PROPS.setProperty(prop,folder.getId());
  return folder;
}
function lxRwUploadAvatar_(data){
  var user=lxRwUser_(data),base64=String(data.image||'');
  if(base64.length>112000||!/^[/+A-Za-z0-9=]+$/.test(base64))throw Error('La fotografía es demasiado grande.');
  var bytes=Utilities.base64Decode(base64);
  if(bytes.length>80000||bytes.length<100||
     (bytes[0]&255)!==255||(bytes[1]&255)!==216||(bytes[2]&255)!==255)
    throw Error('Carga una imagen JPG válida de hasta 80 KB.');
  var blob=Utilities.newBlob(bytes,'image/jpeg','avatar.jpg');
  var file=lxRwAvatarFolder_().createFile(blob),previous='';
  var lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    var entry=lxRwProfileRow_(user.email),p=lxRwProfileFor_(user);
    previous=String(entry.values[7]||'');
    var row=[user.email,lxRwSafe_(p.name,120),lxRwSafe_(p.phone,30),
      lxRwSafe_(p.whatsappCode,6),lxRwSafe_(p.whatsapp,18),
      lxRwSafe_(p.docType,20),lxRwSafe_(p.docNumber,35),file.getId(),new Date()];
    if(entry.row)entry.sheet.getRange(entry.row,1,1,9).setValues([row]);
    else entry.sheet.appendRow(row);
  }catch(err){file.setTrashed(true);throw err;}
  finally{lock.releaseLock();}
  if(previous){try{DriveApp.getFileById(previous).setTrashed(true);}catch(err){}}
  return {ok:true,avatar:'data:image/jpeg;base64,'+base64};
}
function lxRwGetAvatar_(data){
  var user=lxRwUser_(data),entry=lxRwProfileRow_(user.email),id=String(entry.values[7]||'');
  if(!id)return{ok:true,avatar:''};
  try{
    var bytes=DriveApp.getFileById(id).getBlob().getBytes();
    return{ok:true,avatar:'data:image/jpeg;base64,'+Utilities.base64Encode(bytes)};
  }catch(err){return{ok:true,avatar:''};}
}
/* Cambios de correo: verificación del nuevo correo y preservación del historial. */
function lxRwAliasesSheet_(){
  return lxRwSheet_('Emails anteriores Expedition',['Correo anterior','Correo nuevo','Fecha']);
}
function lxRwEmails_(email){
  var current=normalizarEmail(email),set=[current];
  var rows=lxRwAliasesSheet_().getDataRange().getValues();
  for(var n=0;n<10;n++){
    var match=null;
    for(var i=1;i<rows.length;i++)
      if(normalizarEmail(rows[i][1])===current){match=normalizarEmail(rows[i][0]);break;}
    if(!match||set.indexOf(match)>=0)break;
    set.push(match);current=match;
  }
  return set;
}
function lxRwAliasInUse_(email){
  var rows=lxRwAliasesSheet_().getDataRange().getValues(),e=normalizarEmail(email);
  return rows.slice(1).some(function(r){return normalizarEmail(r[0])===e;});
}
function lxRwEmailChangeSheet_(){
  return lxRwSheet_('Cambios de email Expedition',
    ['Email actual','Email nuevo','Código hash','Expira','Fecha envío','Intentos']);
}
function lxRwEmailChangeRow_(email){
  var sh=lxRwEmailChangeSheet_(),rows=sh.getDataRange().getValues();
  for(var i=1;i<rows.length;i++)if(normalizarEmail(rows[i][0])===email)
    return{sheet:sh,row:i+1,values:rows[i]};
  return{sheet:sh,row:0,values:[]};
}
function lxRwRequestEmailChange_(data){
  var user=lxRwUser_(data),target=normalizarEmail(data.newEmail);
  if(!esCorreo(target)||target===user.email)throw Error('Introduce un correo nuevo válido.');
  if(buscarUsuario(target)||lxRwAliasInUse_(target))
    throw Error('Ese correo ya pertenece a una cuenta.');
  // La reautenticación se requiere si existe una contraseña local.
  if(user.hash && !verificarPassword(String(data.password||''),user).ok)
    throw Error('Confirma tu contraseña actual para cambiar el correo.');
  var rec=lxRwEmailChangeRow_(user.email),now=Date.now();
  if(rec.values[4] instanceof Date && now-rec.values[4].getTime()<60000)
    throw Error('Espera un minuto antes de pedir otro código.');
  var rnd=Utilities.getUuid().replace(/-/g,'');
  var six=String((parseInt(rnd.slice(0,7),16)%900000)+100000);
  var key=hashTokenSesion('EMAIL:'+user.email+':'+target+':'+six);
  var value=[user.email,target,key,new Date(now+10*60000),new Date(),0];
  if(rec.row)rec.sheet.getRange(rec.row,1,1,6).setValues([value]);
  else rec.sheet.appendRow(value);
  MailApp.sendEmail({to:target,subject:'Confirma tu nuevo correo · LATAM Rewards',
    body:'Tu código de verificación es '+six+'. Vence en 10 minutos. No lo compartas.'});
  return{ok:true,message:'Enviamos un código al nuevo correo.'};
}
function lxRwConfirmEmailChange_(data){
  var user=lxRwUser_(data),code=String(data.code||'').trim();
  if(!/^\d{6}$/.test(code))throw Error('Introduce los seis números del código.');
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  var to,old=user.email;
  try{
    var rec=lxRwEmailChangeRow_(old),row=rec.values;
    if(!rec.row||!row[2])throw Error('Primero solicita un cambio de correo.');
    if(Number(row[5]||0)>=5)throw Error('Se alcanzó el máximo de intentos.');
    if(!(row[3] instanceof Date)||row[3].getTime()<Date.now())
      throw Error('El código ha caducado.');
    to=normalizarEmail(row[1]);
    if(buscarUsuario(to)||lxRwAliasInUse_(to))throw Error('El correo ya se encuentra registrado.');
    if(!igualSeguro(String(row[2]),hashTokenSesion('EMAIL:'+old+':'+to+':'+code))){
      rec.sheet.getRange(rec.row,6).setValue(Number(row[5]||0)+1);
      throw Error('El código no coincide.');
    }
    var verify=lxRwVerification_(to);
    var verified=[to,new Date(),'','',0,'',0];
    if(verify.row)verify.sheet.getRange(verify.row,1,1,7).setValues([verified]);
    else verify.sheet.appendRow(verified);
    // Los movimientos y reservas conservarán su correo histórico; el vínculo
    // por alias firmado en Sheets permite consultarlos desde el nuevo correo.
    lxRwAliasesSheet_().appendRow([old,to,new Date()]);
    var profile=lxRwProfileRow_(old);
    if(profile.row)profile.sheet.getRange(profile.row,1).setValue(lxRwSafe_(to,254));
    var sessions=hojaSesiones(),values=sessions.getDataRange().getValues();
    for(var i=1;i<values.length;i++)if(normalizarEmail(values[i][1])===old)
      sessions.getRange(i+1,2).setValue(lxRwSafe_(to,254));
    hojaUsuarios().getRange(user.fila,1).setValue(lxRwSafe_(to,254));
    rec.sheet.getRange(rec.row,3,1,4).clearContent();
  }finally{lock.releaseLock();}
  try{MailApp.sendEmail({to:old,subject:'Tu correo de LATAM Rewards se actualizó',
    body:'El correo asociado a tu cuenta LATAM Expeditions se actualizó a '+to+
      '. Si no solicitaste este cambio, contacta al equipo de soporte.'});}catch(err){}
  return{ok:true,email:to};
}
/* ================= Solicitudes sociales · revisión controlada ================ */
function lxRwSocialSheet_(){
  return lxRwSheet_('Acciones sociales Rewards',
    ['Clave','Email','Red','Publicación','Enviada','Estado','Revisada','Comentario']);
}
function lxRwSocialUrl_(network,url){
  var s=String(url||'').trim();
  if(s.length>600||!/^https:\/\//i.test(s))throw Error('Introduce el enlace HTTPS de tu publicación.');
  // No se abren los enlaces en Apps Script: las APIs requieren permisos del autor.
  var accepted={
    facebook:/^https:\/\/(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch)\//i,
    instagram:/^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\//i,
    tiktok:/^https:\/\/(?:www\.|m\.)?tiktok\.com\/@[^/]+\/video\/\d+/i
  };
  if(!accepted[network]||!accepted[network].test(s))
    throw Error('El enlace no corresponde a una publicación de esa red.');
  return s;
}
function lxRwSubmitSocial_(data){
  var u=lxRwUser_(data),network=textoPlano(data.network,20);
  if(!lxRwIsVerified_(u))throw Error('Verifica tu cuenta antes de participar.');
  if(['facebook','instagram','tiktok'].indexOf(network)<0)throw Error('Selecciona una red válida.');
  var url=lxRwSocialUrl_(network,data.url);
  var lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    var sh=lxRwSocialSheet_(),rows=sh.getDataRange().getValues(),aliases=lxRwEmails_(u.email);
    for(var i=1;i<rows.length;i++)if(String(rows[i][2])===network &&
      aliases.indexOf(normalizarEmail(rows[i][1]))>=0){
      if(String(rows[i][5])!=='RECHAZADO')throw Error('Ya enviaste una publicación en esta red.');
      sh.getRange(i+1,4,1,5).setValues([[lxRwSafe_(url,600),new Date(),'EN ESPERA','','']]);
      return{ok:true,message:'Publicación recibida para revisión.'};
    }
    sh.appendRow(['SOCIAL:'+network+':'+u.email,u.email,network,lxRwSafe_(url,600),
      new Date(),'EN ESPERA','','']);
    return{ok:true,message:'Publicación recibida para revisión.'};
  }finally{lock.releaseLock();}
}
function lxRwSocialFor_(email){
  var aliases=lxRwEmails_(email),rows=lxRwSocialSheet_().getDataRange().getValues(),out={};
  for(var i=1;i<rows.length;i++){
    var r=rows[i],network=String(r[2]||'');
    if(aliases.indexOf(normalizarEmail(r[1]))<0)continue;
    var submitted=r[4] instanceof Date?r[4].getTime():0;
    var elapsed=Date.now()-submitted>=86400000;
    out[network]={url:String(r[3]||''),status:String(r[5])==='EN ESPERA'&&elapsed?
      'EN REVISION':String(r[5]||'EN ESPERA'),
      date:lxRwIsoTime_(r[4])};
  }
  return out;
}
function lxRwCreditApprovedSocial_(email){
  var aliases=lxRwEmails_(email),rows=lxRwSocialSheet_().getDataRange().getValues();
  var lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    var ledger=lxRwLedger_(),existing=ledger.getDataRange().getValues().map(function(r){return String(r[0]);});
    for(var i=1;i<rows.length;i++){
      var r=rows[i],network=String(r[2]||'');
      if(aliases.indexOf(normalizarEmail(r[1]))<0||String(r[5])!=='APROBADO')continue;
      if(!(r[4] instanceof Date)||Date.now()-r[4].getTime()<86400000)continue;
      var key='SOCIAL:'+network+':'+email;
      if(aliases.some(function(alias){return existing.indexOf('SOCIAL:'+network+':'+alias)>=0;}))continue;
      ledger.appendRow([key,email,new Date(),'SOCIAL',
        'Publicación en '+network,100,'DISPONIBLE',network]);
      existing.push(key);
    }
  }finally{lock.releaseLock();}
}
/**
 * Función para el equipo: comprobar manualmente el enlace después de 24h,
 * y marcar APROBADO/RECHAZADO en hoja 'Acciones sociales Rewards'.
 * La acreditación sucede sin duplicados en la siguiente consulta del usuario.
 */
function procesarAprobacionesLatamRewards(){
  var rows=lxRwSocialSheet_().getDataRange().getValues(),emails={};
  for(var i=1;i<rows.length;i++)if(String(rows[i][5])==='APROBADO')emails[normalizarEmail(rows[i][1])]=true;
  Object.keys(emails).forEach(lxRwCreditApprovedSocial_);
  Logger.log('Aprobaciones procesadas.');
}
