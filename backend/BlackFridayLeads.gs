/**
 * Black Friday 2026 · alta de clientes con verificación de correo.
 * Datos privados en Sheets. Código de cupón solo tras verificar 6 dígitos.
 * Un cupón por correo verificado, inventario de 40 más 10 códigos manuales.
 */
const LX_BF_LEADS_SHEET='Registros BF 2026';
const LX_BF_LEADS_HEADERS=['Creado','Actualizado','Nombre','Apellidos','Correo','WhatsApp',
  'Código de verificación hash','Vence verificación','Intentos','Verificado','Cupón hash','Publicidad autorizada'];
const LX_BF_OTP_MS=5*60*1000;
function lxBfLeadText_(v,max) {
  return String(v==null?'':v).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
}
function lxBfSheetValue_(v) {
  const s=String(v==null?'':v);
  return /^[=+@-]/.test(s)?"'"+s:s;
}

/** Correo promocional compatible con Gmail y lectores habituales; todos los datos se escapan. */
function lxBfEmailEscape_(value) {
  return String(value==null?'':value).replace(/[&<>"']/g,function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}
function lxBfEmailHtml_(name,code,kind) {
  const first=lxBfEmailEscape_(name),token=lxBfEmailEscape_(code);
  const verification=kind==='otp';
  const title=verification?'Verifica tu correo':'¡Tu cupón Black Friday está listo!';
  const introductory=verification?'Introduce este código en la página de Latam Expeditions para confirmar tu correo y reclamar tu cupón.':
    'Tu correo ya está verificado. Este es tu cupón exclusivo para tu próxima aventura en Latinoamérica.';
  const validity=verification?'Este código vence en 5 minutos.':
    'Tu cupón es válido para una compra. Su plazo de uso comienza al pulsar «Aplicar» y no se reinicia.';
  const action=verification?'Volver a verificar':'Explorar paquetes';
  const href=verification?'https://latamexpeditions.com/black-friday.html':'https://latamexpeditions.com/paquetes.html';
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"></head>'+
    '<body style="margin:0;padding:0;background:#f1f5f1;font-family:Arial,Helvetica,sans-serif;color:#213a2b;">'+
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f5f1;padding:28px 12px;"><tr><td align="center">'+
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #dfe9df;border-radius:16px;overflow:hidden;">'+
    '<tr><td style="background:#092b1d;padding:26px 30px;text-align:center;">'+
    '<img src="https://latamexpeditions.com/assets/img/logo-header-latam.png" width="198" alt="LATAM EXPEDITIONS" style="display:inline-block;border:0;max-width:100%;height:auto;">'+
    '<div style="color:#c5fb83;letter-spacing:3px;font-size:11px;font-weight:bold;margin-top:15px;">BLACK FRIDAY 2026</div></td></tr>'+
    '<tr><td style="padding:35px 31px 30px;">'+
    '<p style="margin:0 0 13px;font-size:15px;color:#4e6655;">Hola, '+first+'.</p>'+
    '<h1 style="margin:0 0 16px;color:#113f2c;font-size:25px;line-height:1.2;font-weight:800;">'+title+'</h1>'+
    '<p style="margin:0 0 23px;font-size:15px;line-height:1.65;color:#496052;">'+introductory+'</p>'+
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:2px solid #b7e87b;border-radius:12px;background:#f6fced;"><tr><td align="center" style="padding:18px 12px;">'+
    '<div style="color:#65816c;font-size:11px;font-weight:bold;letter-spacing:2px;">'+(verification?'TU CÓDIGO DE VERIFICACIÓN':'TU CUPÓN EXCLUSIVO')+'</div>'+
    '<div style="font-weight:800;font-size:'+(verification?'34':'21')+'px;letter-spacing:'+(verification?'9':'2')+'px;color:#0a713d;line-height:1.5;">'+token+'</div>'+
    '</td></tr></table>'+
    '<p style="margin:17px 0 24px;color:#48604c;font-size:13px;line-height:1.6;">'+validity+'</p>'+
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td bgcolor="#07873e" style="border-radius:9px;">'+
    '<a href="'+href+'" style="display:inline-block;padding:14px 27px;color:#fff;font-weight:bold;text-decoration:none;font-size:14px;">'+action+'</a></td></tr></table>'+
    '<p style="margin:28px 0 0;font-size:12px;color:#7b8d80;line-height:1.6;">'+
    (verification?'Si no solicitaste este mensaje, puedes ignorarlo.':'Guarda este correo: el código también permanecerá asociado a tu correo verificado.')+
    '</p></td></tr>'+
    '<tr><td style="background:#092b1d;color:#c7d6cb;font-size:11px;text-align:center;padding:19px 22px;line-height:1.6;">'+
    'LATAM EXPEDITIONS · Experiencias memorables en Latinoamérica<br>'+
    '<a href="https://latamexpeditions.com" style="color:#d1fca2;text-decoration:none;">latamexpeditions.com</a>'+
    '</td></tr></table></td></tr></table></body></html>';
}

function lxBfLeadsHoja_() {
  const book=SpreadsheetApp.openById(CONFIG.sheetId);
  let sheet=book.getSheetByName(LX_BF_LEADS_SHEET);
  if(!sheet) {
    sheet=book.insertSheet(LX_BF_LEADS_SHEET);
    sheet.appendRow(LX_BF_LEADS_HEADERS);
    sheet.getRange(1,1,1,LX_BF_LEADS_HEADERS.length).setFontWeight('bold')
      .setBackground('#0a3d2c').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}
function lxBfLeadFind_(sheet,email) {
  const rows=sheet.getDataRange().getValues();
  for(let i=rows.length-1;i>=1;i--)
    if(String(rows[i][4]||'').toLowerCase()===email)return {row:i+1,data:rows[i]};
  return null;
}
function lxBfOtp_(email,otp) {
  let secret=PROPS.getProperty('LATAM_BF_OTP_SECRET');
  if(!secret) {
    secret=Utilities.getUuid()+Utilities.getUuid();
    PROPS.setProperty('LATAM_BF_OTP_SECRET',secret);
  }
  return lxBfHash_(secret+'|'+email+'|'+otp);
}
function lxBfLeadStart_(data) {
  if(!lxBfVigente_())throw new Error('La campaña ya no está disponible.');
  const first=lxBfLeadText_(data.firstName,70),last=lxBfLeadText_(data.lastName,90);
  const email=lxBfLeadText_(data.email,254).toLowerCase();
  const whatsapp=lxBfLeadText_(data.whatsapp,26);
  if(first.length<2||last.length<2||!esCorreo(email)||!/^[+]?[-() 0-9]{8,26}$/.test(whatsapp))
    throw new Error('Revisa el nombre, apellido, correo y WhatsApp.');
  if(data.privacyAccepted!==true)throw new Error('Debes aceptar la política de privacidad.');
  const cache=CacheService.getScriptCache(),limitKey='bf_mail_'+lxBfHash_(email).slice(0,30);
  if(cache.get(limitKey))throw new Error('Ya enviamos un código recientemente. Revisa tu correo.');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try {
    const now=new Date(),sheet=lxBfLeadsHoja_(),old=lxBfLeadFind_(sheet,email);
    const lastSent=old?.data?.[1] instanceof Date?old.data[1].getTime():0;
    if(lastSent&&Date.now()-lastSent<60*1000)
      throw new Error('Ya enviamos un código recientemente. Revisa tu correo.');
    const available=lxBfHoja_().getDataRange().getValues().slice(1).some(function(r){
      return String(r[13])==='CAPTACION_2026'&&String(r[1])==='DISPONIBLE'&&!r[10];
    });
    if(!available && !lxBfHoja_().getDataRange().getValues().slice(1).some(function(r){
      return String(r[10]||'').trim().toLowerCase()===email&&Boolean(r[12]);
    }))throw new Error('Los cupones de esta campaña se agotaron.');
    const day='LX_BF_MAILS_'+lxBfHoy_();
    const sentToday=Number(PROPS.getProperty(day)||0);
    if(sentToday>=80)throw new Error('No podemos enviar más verificaciones por el momento. Inténtalo más tarde.');
    if(MailApp.getRemainingDailyQuota()<1)
      throw new Error('No podemos enviar más verificaciones por el momento. Inténtalo más tarde.');
    const digits=parseInt(Utilities.getUuid().replace(/-/g,'').slice(0,8),16)%1000000;
    const otp=String(digits).padStart(6,'0');
    const otpHash=lxBfOtp_(email,otp);
    const values=[old?.data?.[0]||now,now,lxBfSheetValue_(first),lxBfSheetValue_(last),
      email,lxBfSheetValue_(whatsapp),otpHash,new Date(Date.now()+LX_BF_OTP_MS),0,
      old?.data?.[9]===true,old?.data?.[10]||'',data.marketingAccepted===true];
    if(old)sheet.getRange(old.row,1,1,LX_BF_LEADS_HEADERS.length).setValues([values]);
    else sheet.appendRow(values);
    // El OTP nunca se escribe en el registro, solo su hash.
    try {
      MailApp.sendEmail({
        to:email,
        subject:'Verifica tu correo para recibir tu cupón · Latam Expeditions',
        body:'Hola, '+first+'.\n\nTu código de verificación es: '+otp+
          '\n\nCaduca en 5 minutos. Si no solicitaste este código, ignora el mensaje.\n\nLatam Expeditions',
        htmlBody:lxBfEmailHtml_(first,otp,'otp'),
        name:'Latam Expeditions'
      });
    } catch(mailError) {
      registrarError(mailError,'Black Friday: error enviando OTP');
      throw new Error('No podemos enviar el código de verificación en este momento.');
    }
    cache.put(limitKey,'1',60);
    PROPS.setProperty(day,String(sentToday+1));
    return {ok:true,verificationRequired:true,expiresAt:values[7].toISOString(),
      message:'Enviamos un código de seis dígitos a tu correo.'};
  } finally {lock.releaseLock();}
}
function lxBfLeadVerify_(data) {
  if(!lxBfVigente_())throw new Error('La campaña ya no está disponible.');
  const email=lxBfLeadText_(data.email,254).toLowerCase();
  const otp=String(data.otp||'').trim();
  if(!esCorreo(email)||!/^[0-9]{6}$/.test(otp))
    throw new Error('Introduce el código de seis dígitos.');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try {
    const sheet=lxBfLeadsHoja_(),entry=lxBfLeadFind_(sheet,email);
    if(!entry)throw new Error('No encontramos un registro pendiente para ese correo.');
    const v=entry.data,deadline=v[7] instanceof Date?v[7].getTime():Date.parse(v[7]);
    if(!deadline||Date.now()>=deadline)throw new Error('El código de verificación caducó. Solicita otro.');
    if(Number(v[8])>=5)throw new Error('Superaste el máximo de intentos. Solicita otro código.');
    if(String(v[6])!==lxBfOtp_(email,otp)) {
      sheet.getRange(entry.row,9).setValue(Number(v[8]||0)+1);
      throw new Error('El código de verificación es incorrecto.');
    }
    const coupons=lxBfHoja_();
    const values=coupons.getDataRange().getValues();
    // Si el correo ya había reclamado, devolvemos su MISMO código.
    let chosen=null;
    for(let i=1;i<values.length;i++)
      if(String(values[i][10]||'').trim().toLowerCase()===email&&values[i][12])
        {chosen={row:i+1,data:values[i]};break;}
    if(!chosen)for(let i=1;i<values.length;i++)
      if(String(values[i][13])==='CAPTACION_2026'&&
        String(values[i][1])==='DISPONIBLE'&&!values[i][10]&&values[i][12])
        {chosen={row:i+1,data:values[i]};break;}
    if(!chosen)throw new Error('Los cupones de esta campaña se agotaron.');
    const code=String(chosen.data[12]);
    if(!chosen.data[10]) {
      coupons.getRange(chosen.row,11,1,2).setValues([[email,
        lxBfSheetValue_(String(v[2])+' '+String(v[3]))]]);
      coupons.getRange(chosen.row,8).setValue(new Date());
    }
    sheet.getRange(entry.row,10,1,2).setValues([[true,String(chosen.data[0])]]);
    sheet.getRange(entry.row,7,1,3).setValues([['','',0]]);
    try {
      MailApp.sendEmail({to:email,subject:'Tu cupón Black Friday · Latam Expeditions',
        body:'Hola, '+String(v[2])+'.\n\nEste es tu código exclusivo: '+code+
          '\n\nPuedes aplicarlo en https://latamexpeditions.com/paquetes.html o en nuestras experiencias.'+
          '\nEl plazo de uso de cinco horas empezará cuando pulses Aplicar en la reserva.'+
          '\nEl cupón se asocia a este mismo correo y es válido para una sola compra pagada.'+
          '\n\nLatam Expeditions',
        htmlBody:lxBfEmailHtml_(String(v[2]),code,'coupon'),name:'Latam Expeditions'});
    }catch(err){registrarError(err,'Envío cupón Black Friday');}
    return {ok:true,code:code,message:'Correo verificado. Este es tu cupón exclusivo.'};
  } finally {lock.releaseLock();}
}

/**
 * Black Friday: resultado efímero por solicitud POST.
 * El frontend consulta SOLO un identificador aleatorio; nunca envía correo o teléfono por GET.
 * Resuelve los bloqueos de iframe/sandbox de Google Apps Script.
 */
function lxBfClaimKey_(requestKey) {
  const key=String(requestKey||'');
  if(!/^[0-9a-f]{32}$/.test(key))throw new Error('Solicitud de campaña no válida.');
  return 'bf_ack_'+lxBfHash_(key).slice(0,48);
}
function lxBfClaimSave_(requestKey,payload) {
  CacheService.getScriptCache().put(lxBfClaimKey_(requestKey),JSON.stringify(payload),180);
}
function lxBfClaimStatusGet_(e) {
  const p=e&&e.parameter||{},cb=String(p.callback||'');
  if(!/^__lxBfClaim_[A-Za-z0-9_]{8,90}$/.test(cb))
    return ContentService.createTextOutput('/* callback inválido */').setMimeType(ContentService.MimeType.JAVASCRIPT);
  let result;
  try {
    const raw=CacheService.getScriptCache().get(lxBfClaimKey_(p.requestKey));
    result=raw?JSON.parse(raw):{pending:true};
  } catch(ignore) {
    result={ok:false,error:'No se pudo consultar el estado de la solicitud.'};
  }
  const safe=JSON.stringify(result).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  return ContentService.createTextOutput(cb+'('+safe+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/**
 * Función administrativa visible en el editor de Google Apps Script.
 * Comprueba permisos/cupo y si hay inventario, sin enviar emails reales.
 */
function diagnosticoBlackFridayRegistro() {
  const rows=lxBfHoja_().getDataRange().getValues().slice(1);
  const info={
    ok:true,
    campanaVigente:lxBfVigente_(),
    backendRegistroActivo:typeof lxBfLeadStart_==='function',
    backendAcuseActivo:typeof lxBfClaimStatusGet_==='function',
    cuponesCampana:rows.filter(function(r){return String(r[13])==='CAPTACION_2026';}).length,
    cuponesDisponibles:rows.filter(function(r){
      return String(r[13])==='CAPTACION_2026'&&String(r[1])==='DISPONIBLE'&&!r[10];
    }).length,
    cuotaCorreoRestante:MailApp.getRemainingDailyQuota()
  };
  Logger.log(JSON.stringify(info));
  return info;
}
