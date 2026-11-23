/**
 * Black Friday 2026 · alta de clientes con verificación de correo.
 * Datos privados en Sheets. Código de cupón solo tras verificar 6 dígitos.
 * Un cupón por correo verificado, inventario de 40 más 10 códigos manuales.
 */
const LX_BF_LEADS_SHEET='Registros BF 2026';
const LX_BF_LEADS_HEADERS=['Creado','Actualizado','Nombre','Apellidos','Correo','WhatsApp',
  'Código de verificación hash','Vence verificación','Intentos','Verificado','Cupón hash','Publicidad autorizada'];
const LX_BF_OTP_MS=10*60*1000;
function lxBfLeadText_(v,max) {
  return String(v==null?'':v).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
}
function lxBfSheetValue_(v) {
  const s=String(v==null?'':v);
  return /^[=+@-]/.test(s)?"'"+s:s;
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
    MailApp.sendEmail({
      to:email,
      subject:'Verifica tu correo para recibir tu cupón · Latam Expeditions',
      body:'Hola, '+first+'.\n\nTu código de verificación es: '+otp+
        '\n\nCaduca en 10 minutos. Si no solicitaste este código, ignora el mensaje.\n\nLatam Expeditions',
      name:'Latam Expeditions'
    });
    cache.put(limitKey,'1',60);
    return {ok:true,verificationRequired:true,message:'Enviamos un código de seis dígitos a tu correo.'};
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
          '\n\nLatam Expeditions',name:'Latam Expeditions'});
    }catch(err){registrarError(err,'Envío cupón Black Friday');}
    return {ok:true,code:code,message:'Correo verificado. Este es tu cupón exclusivo.'};
  } finally {lock.releaseLock();}
}
