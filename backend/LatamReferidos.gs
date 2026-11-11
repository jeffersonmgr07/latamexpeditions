/**
 * LATAM Rewards — invitaciones personales.
 * No recompensa compartidos, publicaciones o reseñas.
 * 50 puntos por amigo único que se registra y verifica su cuenta.
 * Máximo cuatro bonificaciones por patrocinador y mes, sin autoinvitaciones.
 * Se integra con Cuentas.gs y ExpeditionDashboard.gs.
 */
function lxRefCodesSheet_() {
  return hojaCuenta('Códigos referidos LATAM',
    ['Código','Email usuario','Fecha creación']);
}
function lxRefEntriesSheet_() {
  return hojaCuenta('Referidos LATAM Rewards',
    ['Código','Patrocinador','Invitado','Fecha alta','Estado','Fecha acreditación']);
}
function lxRefCodeFor_(email) {
  var aliases=lxRwEmails_(normalizarEmail(email)),table=lxRefCodesSheet_();
  var rows=table.getDataRange().getValues();
  for(var i=1;i<rows.length;i++)
    if(aliases.indexOf(normalizarEmail(rows[i][1]))>=0)
      return String(rows[i][0]);
  var lock=LockService.getScriptLock();lock.waitLock(15000);
  try {
    rows=table.getDataRange().getValues();
    for(var j=1;j<rows.length;j++)
      if(aliases.indexOf(normalizarEmail(rows[j][1]))>=0)
        return String(rows[j][0]);
    var code=('LEX'+Utilities.getUuid().replace(/-/g,'').substring(0,11)).toUpperCase();
    table.appendRow([code,email,new Date()]);
    return code;
  }finally{lock.releaseLock();}
}
function lxRefTrackSignup_(code,friendEmail) {
  var requested=String(code||'').toUpperCase().trim();
  if(!/^(LEX[A-F0-9]{11})$/.test(requested))return false;
  var email=normalizarEmail(friendEmail),lock=LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var codes=lxRefCodesSheet_().getDataRange().getValues(),owner='';
    for(var i=1;i<codes.length;i++)if(String(codes[i][0])===requested) {
      owner=normalizarEmail(codes[i][1]);break;
    }
    if(!owner||lxRwEmails_(owner).indexOf(email)>=0)return false;
    var sheet=lxRefEntriesSheet_(),rows=sheet.getDataRange().getValues();
    for(var j=1;j<rows.length;j++)if(normalizarEmail(rows[j][2])===email)return false;
    sheet.appendRow([requested,owner,email,new Date(),'REGISTRADO','']);
    return true;
  }finally{lock.releaseLock();}
}
// Exposición mínima de datos del invitado para el patrocinador: nombre e inicial.
function lxRefPublicName_(friendUser) {
  if(!friendUser)return 'Registro pendiente';
  var name=String(friendUser.nombre||'').trim().replace(/\s+/g,' ');
  if(!name)return 'Viajero registrado';
  var parts=name.split(' ');
  var first=parts[0].slice(0,35);
  var initial=parts.length>1?' '+parts[parts.length-1].slice(0,1).toUpperCase()+'.':'';
  return first+initial;
}
function lxRefReview_(email) {
  var aliases=lxRwEmails_(email);
  var sh=lxRefEntriesSheet_(),rows=sh.getDataRange().getValues();
  var ledger=lxRwLedger_();
  var movements=ledger.getDataRange().getValues();
  var lock=LockService.getScriptLock();lock.waitLock(15000);
  try {
    rows=sh.getDataRange().getValues();
    movements=ledger.getDataRange().getValues();
    var keys={}, creditedPoints={};
    var usedThisMonth=0,month=Utilities.formatDate(new Date(),'America/Lima','yyyy-MM');
    for(var j=1;j<movements.length;j++){
      var key=String(movements[j][0]||'');
      keys[key]=true;
      creditedPoints[key]=Number(movements[j][5])||0;
      if(String(movements[j][3])==='REFERIDO'&&
          aliases.indexOf(normalizarEmail(movements[j][1]))>=0&&
          lxRwIsoDate_(movements[j][2]).slice(0,7)===month)usedThisMonth++;
    }
    var list=[];
    for(var i=1;i<rows.length;i++){
      var r=rows[i];
      if(aliases.indexOf(normalizarEmail(r[1]))<0)continue;
      var friend=normalizarEmail(r[2]),friendUser=buscarUsuario(friend);
      var key='REFERRAL:'+friend,status=String(r[4]||'REGISTRADO');
      var displayName=lxRefPublicName_(friendUser);
      if(keys[key])status='ACREDITADO';
      else if(status!=='RECHAZADO'&&friendUser&&lxRwIsVerified_(friendUser)){
        if(usedThisMonth<4){
          // Idempotencia por invitado único: solo se acredita una vez, sin compra obligatoria.
          ledger.appendRow([key,email,new Date(),'REFERIDO',
            'Amigo viajero · '+displayName,50,'DISPONIBLE',String(r[0]||'')]);
          keys[key]=true;creditedPoints[key]=50;usedThisMonth++;status='ACREDITADO';
          sh.getRange(i+1,5,1,2).setValues([[status,new Date()]]);
        }else status='EN COLA';
      }else if(friendUser)status='PENDIENTE DE VERIFICACIÓN';
      list.push({date:lxRwIsoDate_(r[3]),name:displayName,status:status,
        points:status==='ACREDITADO'?(creditedPoints[key]||50):0});
    }
    return list;
  }finally{lock.releaseLock();}
}
function lxRefDashboard_(email) {
  var code=lxRefCodeFor_(email),list=lxRefReview_(email);
  return {code:code,link:'https://latamexpeditions.com/registro.html?ref='+encodeURIComponent(code),
    invited:list.length,qualified:list.filter(function(x){return x.status==='ACREDITADO';}).length,
    entries:list.slice(-20).reverse()};
}
