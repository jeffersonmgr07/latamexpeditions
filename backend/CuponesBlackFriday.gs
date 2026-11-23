/**
 * Latam Expeditions · Black Friday 2026 (privado, solo servidor).
 * 10 códigos de una compra: únicamente se publican hashes SHA-256.
 * Ventana de uso: 23 al 29 de noviembre de 2026, hora de Lima.
 * Se consumen al CAPTURAR pago aprobado, no al consultar ni al crear una solicitud.
 * Ejecutar como el propietario del Apps Script; Google Sheet NO debe ser pública.
 */
const LX_BF_HASHES_2026 = [
'e59742ffc7d67bb8c1cb118ba3312139d07637bcd04b39a12b203f4c3b238930',
'9023280b972b4112299ee9d024cff139e751c49d2b069cd020a0ea804ce45565',
'8d9abedd78ef086f5357d34c30630812163adf692c1ba0f93ff8321d8f33c7b5',
'ee4ec331997a8a752b81032a264300fd506b52e2016c9494af18e4a2140ea43f',
'24a8bb031113a65e3c4cb5d51dbb9d83257aa036c1aff6632666fddfe5c77fa8',
'0de1a2ee95293dede9476a0ded7d2d71c8ba9e6216c0d8897a4c93d57812678a',
'956a8d82af11b744f0d2089145b58e0c1b93ae5feb9b5862834b17f8afb8f36b',
'f577acb5a3963cc924c75432a265f32feca938ec6ce7c263bfdb50d14ab548c0',
'42872eb970fc8afe0bdf850449d0016c8ad258a52c77f0d0e361aaec5774241c',
'459c68a047d7dba4670a0382f6255c574f044428d4ab861c889c887985ec1fd1'
];
const LX_BF_SHEET = 'Cupones BF 2026';
const LX_BF_HEADER = ['Hash SHA256','Estado','Orden reservada','Reserva hasta','Orden utilizada','Usado el','Porcentaje fijo','Actualizado'];
const LX_BF_TZ = 'America/Lima';
const LX_BF_HOLD_MS = 30 * 60 * 1000;

function lxBfHoy_() {
  return Utilities.formatDate(new Date(),LX_BF_TZ,'yyyy-MM-dd');
}
function lxBfVigente_() {
  const hoy = lxBfHoy_();
  return hoy >= '2026-11-23' && hoy <= '2026-11-29';
}
function lxBfHash_(code) {
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,code,Utilities.Charset.UTF_8);
  return bytes.map(function(b){return ('0'+(b & 255).toString(16)).slice(-2);}).join('');
}
function lxBfNormalizar_(code) {
  const s=String(code||'').trim().toUpperCase();
  if(!/^BF26-(?:[A-HJ-NP-Z2-9]{4}-){3}[A-HJ-NP-Z2-9]{4}$/.test(s))
    throw new Error('El cupón no está disponible.');
  return s;
}
function lxBfHoja_() {
  const book=SpreadsheetApp.openById(CONFIG.sheetId);
  let sheet=book.getSheetByName(LX_BF_SHEET);
  if(!sheet){
    sheet=book.insertSheet(LX_BF_SHEET);
    sheet.appendRow(LX_BF_HEADER);
    sheet.getRange(1,1,1,LX_BF_HEADER.length).setFontWeight('bold').setBackground('#0a3d2c').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  const rows=sheet.getDataRange().getValues();
  const existing={};
  for(let i=1;i<rows.length;i++)existing[String(rows[i][0])]=true;
  const missing=LX_BF_HASHES_2026.filter(function(hash){return !existing[hash];});
  if(missing.length){
    const now=new Date();
    sheet.getRange(sheet.getLastRow()+1,1,missing.length,8).setValues(
      missing.map(function(hash){return [hash,'DISPONIBLE','','','','','',now];})
    );
  }
  return sheet;
}
function lxBfBuscar_(code) {
  const hash=lxBfHash_(lxBfNormalizar_(code));
  const sheet=lxBfHoja_();
  const rows=sheet.getDataRange().getValues();
  for(let i=1;i<rows.length;i++){
    if(String(rows[i][0])===hash)return {sheet:sheet,row:i+1,data:rows[i],hash:hash};
  }
  throw new Error('El cupón no está disponible.');
}
function lxBfPorcentaje_(travelDate) {
  const iso=String(travelDate||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))throw new Error('Selecciona una fecha de viaje válida.');
  const today=lxBfHoy_();
  const parse=function(s){const p=s.split('-').map(Number);return Date.UTC(p[0],p[1]-1,p[2]);};
  const ts=parse(iso),delta=(ts-parse(today))/86400000;
  if(!Number.isInteger(delta)||delta<0||new Date(ts).toISOString().slice(0,10)!==iso)
    throw new Error('Selecciona una fecha de viaje válida.');
  return delta<=30?10:delta<=60?20:delta<=75?30:delta<=100?40:50;
}
function lxBfValidar_(code,travelDate,orderId) {
  if(!lxBfVigente_())throw new Error('El cupón no está disponible.');
  const found=lxBfBuscar_(code),v=found.data;
  if(v[1]==='USADO' && String(v[4])===String(orderId||'') && orderId){
    const fixed=Number(v[6]);
    return {percent:v[6]!==''&&Number.isInteger(fixed)&&fixed>=1&&fixed<=50?fixed:lxBfPorcentaje_(travelDate),found:found,alreadyUsed:true};
  }
  if(v[1]==='USADO'||v[1]==='BLOQUEADO')throw new Error('El cupón ya no está disponible.');
  const held=String(v[2]||''),until=v[3] instanceof Date?v[3].getTime():new Date(v[3]).getTime();
  if(held && Number.isFinite(until) && until>Date.now() && held!==String(orderId||''))
    throw new Error('Este cupón está asociado temporalmente a otra compra.');
  const fixed=Number(v[6]);
  const percent=v[6]!==''&&Number.isInteger(fixed)&&fixed>=1&&fixed<=50?fixed:lxBfPorcentaje_(travelDate);
  return {percent:percent,found:found};
}
function lxBfCotizar_(code,travelDate) {
  const result=lxBfValidar_(code,travelDate,'');
  return {ok:true,percent:result.percent};
}
/** Crear o renovar una reserva de cupón dentro del LockService del flujo PayPal. */
function lxBfReservar_(code,travelDate,orderId) {
  if(!code)return;
  const r=lxBfValidar_(code,travelDate,orderId);
  if(r.alreadyUsed)return;
  const sheet=r.found.sheet,row=r.found.row;
  sheet.getRange(row,2,1,3).setValues([['RESERVADO',String(orderId),new Date(Date.now()+LX_BF_HOLD_MS)]]);
  sheet.getRange(row,8).setValue(new Date());
}
/** Debe llamarse ANTES de capturar fondos, manteniendo el lock del proceso. */
function lxBfVerificarCaptura_(code,travelDate,orderId) {
  if(!code)return;
  lxBfReservar_(code,travelDate,orderId);
}
/** Marcar comprado tras comprobar que PayPal realmente capturó el importe correcto. */
function lxBfConsumir_(code,orderId) {
  if(!code)return;
  const item=lxBfBuscar_(code),v=item.data;
  if(v[1]==='USADO'&&String(v[4])===String(orderId))return;
  if(v[1]!=='RESERVADO'||String(v[2])!==String(orderId))
    throw new Error('No se pudo cerrar el cupón de esta compra.');
  item.sheet.getRange(item.row,2,1,7).setValues([['USADO','','',String(orderId),new Date(),v[6],new Date()]]);
}
/** Editor de Apps Script, nunca endpoint público: cambiar % fijo para una excepción.
 * Ejemplo: lxBfPorcentajeFijoAdministrativo_('BF26-XXXX-XXXX-XXXX-XXXX',50)
 * Pasar null para volver al porcentaje automático.
 */
function lxBfPorcentajeFijoAdministrativo_(code,percent) {
  const p=percent===null||percent===''?'':Number(percent);
  if(p!==''&&(!Number.isInteger(p)||p<1||p>50))throw new Error('Porcentaje no válido.');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{const x=lxBfBuscar_(code);x.sheet.getRange(x.row,7).setValue(p);x.sheet.getRange(x.row,8).setValue(new Date());}
  finally{lock.releaseLock();}
}
function lxBfResponderCotizacion_(e) {
  const p=e&&e.parameter||{},callback=String(p.callback||'');
  if(!/^__latamBf_[A-Za-z0-9_]{8,90}$/.test(callback))
    return ContentService.createTextOutput('/* callback inválido */')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  let result;
  try{result=lxBfCotizar_(p.code,p.date);}
  catch(err){result={ok:false,error:'El cupón no está disponible para esta reserva.'};}
  const raw=JSON.stringify(result).replace(/</g,'\\u003c');
  return ContentService.createTextOutput(callback+'('+raw+');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


/**
 * EJECUTAR UNA SOLA VEZ DESDE EL EDITOR DE APPS SCRIPT (no está expuesto por HTTP).
 * Crea/verifica la pestaña privada y comprueba las diez huellas sin consumir códigos.
 */
function lxBfPruebaInstalacion_() {
  const h=lxBfHoja_();
  const rows=h.getDataRange().getValues().slice(1);
  const matching=rows.filter(function(row){return LX_BF_HASHES_2026.indexOf(String(row[0]))>=0;});
  const unique=new Set(matching.map(function(row){return String(row[0]);}));
  if(matching.length!==10 || unique.size!==10)throw new Error('La campaña no tiene diez cupones distintos.');
  const testDate=function(days){
    const base=lxBfHoy_().split('-').map(Number);
    const d=new Date(Date.UTC(base[0],base[1]-1,base[2]+days));
    return Utilities.formatDate(d,'UTC','yyyy-MM-dd');
  };
  const tests=[[30,10],[31,20],[60,20],[61,30],[75,30],[76,40],[100,40],[101,50]];
  tests.forEach(function(t){if(lxBfPorcentaje_(testDate(t[0]))!==t[1])
    throw new Error('Los tramos de descuento no coinciden.');});
  return {ok:true,cuponesInstalados:matching.length,campanaVigente:lxBfVigente_(),
    pestaña:h.getName(),descuentosVerificados:true};
}
