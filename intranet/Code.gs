/**
 * LATAM EXPEDITIONS · CONSOLA PRIVADA DE PRODUCTOS
 * Google Apps Script separado del backend público de reservas.
 * Ejecutar como "Usuario que accede" y conceder acceso solo a administradores.
 * Propiedades privadas requeridas:
 *   LATAM_ADMIN_SHEET_ID = id del Google Sheet privado
 *   LATAM_ADMIN_EMAILS = correo1@gmail.com,correo2@empresa.com
 * IMPORTANTE: NO desplegar "cualquiera, incluso anónimo".
 */
const LXADMIN_HEADERS=['ID','Código','Slug','Estado','Título','País','Ciudad','Actualizado','Versión','Autor','Producto JSON'];
const LXADMIN_STATES=['BORRADOR','EN_REVISION','APROBADO'];
const LXADMIN_TYPES=['package','experience'];
function lxAdminWho_(){
  const configured=(PropertiesService.getScriptProperties().getProperty('LATAM_ADMIN_EMAILS')||'')
    .split(',').map(v=>v.trim().toLowerCase()).filter(Boolean);
  const email=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
  if(!configured.length||!email||configured.indexOf(email)===-1)
    throw Error('Acceso denegado. Configura tu correo en LATAM_ADMIN_EMAILS y vuelve a iniciar sesión.');
  return email;
}
function lxAdminBook_(){
  const id=String(PropertiesService.getScriptProperties().getProperty('LATAM_ADMIN_SHEET_ID')||'');
  if(!id||!/^[a-zA-Z0-9_-]{20,}$/.test(id))throw Error('Falta LATAM_ADMIN_SHEET_ID en las propiedades privadas de Apps Script.');
  return SpreadsheetApp.openById(id);
}
function lxAdminSheet_(){
  const book=lxAdminBook_();let sheet=book.getSheetByName('PRODUCTOS_ADMIN');
  if(!sheet){
    sheet=book.insertSheet('PRODUCTOS_ADMIN');sheet.appendRow(LXADMIN_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,LXADMIN_HEADERS.length).setFontWeight('bold').setBackground('#073d25').setFontColor('#fff');
  }
  return sheet;
}
function lxAudit_(actor,event,productId,detail){
  const book=lxAdminBook_();let sheet=book.getSheetByName('AUDITORIA_PRODUCTOS');
  if(!sheet){sheet=book.insertSheet('AUDITORIA_PRODUCTOS');sheet.appendRow(['Fecha','Actor','Evento','ID','Detalle']);sheet.setFrozenRows(1);}
  sheet.appendRow([new Date(),actor,event,productId,String(detail||'').slice(0,700)]);
}
function lxAdminSafeCell_(x){const v=String(x==null?'':x);return /^[=+\-@]/.test(v)?"'"+v:v;}
function lxReadRows_(){
  const sheet=lxAdminSheet_(),values=sheet.getDataRange().getValues();
  return values.slice(1).map((r,i)=>({
    row:i+2,id:String(r[0]||''),code:String(r[1]||''),slug:String(r[2]||''),
    status:String(r[3]||''),title:String(r[4]||''),country:String(r[5]||''),
    city:String(r[6]||''),modified:r[7] instanceof Date?r[7].toISOString():String(r[7]||''),
    version:Number(r[8]||0),owner:String(r[9]||''),raw:String(r[10]||'')
  })).filter(x=>x.id);
}
function lxReadProduct_(id){
  const found=lxReadRows_().find(x=>x.id===id);if(!found)throw Error('Producto no encontrado.');
  try{return JSON.parse(found.raw);}catch(e){throw Error('El registro necesita revisión: JSON inválido.');}
}
function lxClean_(value,limit){
  return String(value==null?'':value).replace(/[\u0000-\u001f]/g,' ').trim().slice(0,limit||250);
}
function lxNormalizeProduct_(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Datos de producto inválidos.');
  if(JSON.stringify(input).length>44000)throw Error('El producto supera el tamaño admitido en la hoja.');
  const p=JSON.parse(JSON.stringify(input));
  p.identity=p.identity||{};p.pricing=p.pricing||{};p.lodging=p.lodging||{};
  p.commercial=p.commercial||{};p.seo=p.seo||{};p.dates=p.dates||{};
  p.identity.type=lxClean_(p.identity.type,25);
  if(LXADMIN_TYPES.indexOf(p.identity.type)===-1)throw Error('Tipo de producto no válido.');
  p.identity.title=lxClean_(p.identity.title,180);
  p.identity.slug=lxClean_(p.identity.slug,120).toLowerCase();
  if(p.identity.title.length<6||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.identity.slug))
    throw Error('Ingresa título y slug válidos.');
  for(const k of ['country','region','city'])p.identity[k]=lxClean_(p.identity[k],110);
  if(!p.identity.country||!p.identity.city)throw Error('Selecciona país y ciudad.');
  p.identity.days=Math.floor(Number(p.identity.days)||1);
  p.identity.nights=Math.floor(Number(p.identity.nights)||0);
  if(p.identity.days<1||p.identity.days>40||p.identity.nights<0||p.identity.nights>39)
    throw Error('Duración fuera del rango admitido.');
  p.identity.defaultAdults=2;p.identity.defaultChildren=0;
  p.pricing.basisOccupancy=2;p.pricing.defaultAdults=2;p.pricing.defaultChildren=0;
  p.pricing.currency='USD';
  p.pricing.pricePerAdultOnDoubleUSD=Number(p.pricing.pricePerAdultOnDoubleUSD)||0;
  if(p.pricing.pricePerAdultOnDoubleUSD<0||p.pricing.pricePerAdultOnDoubleUSD>100000)
    throw Error('Precio base inválido.');
  for(const k of ['costDoubleRoomNightUSD','costSingleRoomNightUSD']){
    const v=p.lodging[k];p.lodging[k]=v===''||v===null||v===undefined?null:Number(v);
    if(p.lodging[k]!==null&&(!Number.isFinite(p.lodging[k])||p.lodging[k]<=0||p.lodging[k]>100000))
      throw Error('Tarifa hotelera inválida: '+k);
  }
  p.lodging.nights=Math.floor(Number(p.lodging.nights)||p.identity.nights);
  p.lodging.name=lxClean_(p.lodging.name,140);
  p.lodging.stars=Math.floor(Number(p.lodging.stars)||0);
  p.itinerary=Array.isArray(p.itinerary)?p.itinerary:[];
  if(p.itinerary.length>40)throw Error('Demasiados días de itinerario.');
  p.itinerary.forEach((d,i)=>{
    d.day=i+1;d.title=lxClean_(d.title,160);d.intro=lxClean_(d.intro,1600);
    d.activities=Array.isArray(d.activities)?d.activities.slice(0,35):[];
    d.activities.forEach(a=>{a.time=lxClean_(a.time,25);a.activity=lxClean_(a.activity,160);a.detail=lxClean_(a.detail,600);});
  });
  p.status=LXADMIN_STATES.indexOf(p.status)>=0?p.status:'BORRADOR';
  if(p.status==='APROBADO'){
    const quality=p.quality||{};
    const checks=['pricesConfirmed','hotelConfirmed','suppliersConfirmed','flightConfirmed',
      'photosLicensed','policiesApproved','datesVerified','bookingTested'];
    const pending=checks.filter(key=>quality[key]!==true);
    if(p.pricing.priceStatus!=='CONFIRMADA'||!p.lodging.costDoubleRoomNightUSD||
       !p.lodging.costSingleRoomNightUSD||pending.length)
      throw Error('No se puede aprobar todavía: falta confirmar precio doble/single y calidad operativa ('+
        pending.join(', ')+').');
  }
  // El primer MVP no publica directamente en GitHub: aprobación y exportación son pasos separados.
  p.public=false;p.approved=p.status==='APROBADO';
  p.schemaVersion=1;
  return p;
}
function lxNextCode_(rows,type){
  const prefix=type==='experience'?'LEX-EXP-':'LEX-PKG-';
  let n=0;
  rows.forEach(r=>{if(r.code.startsWith(prefix)){const k=Number(r.code.slice(prefix.length));if(Number.isInteger(k)&&k>n)n=k;}});
  return prefix+String(n+1).padStart(6,'0');
}
function lxListProducts(){
  lxAdminWho_();
  return lxReadRows_().map(x=>({
    id:x.id,code:x.code,slug:x.slug,title:x.title,status:x.status,
    country:x.country,city:x.city,modified:x.modified,version:x.version
  })).reverse();
}
function lxGetProduct(id){lxAdminWho_();return lxReadProduct_(String(id||''));}
function lxSaveProduct(input){
  const actor=lxAdminWho_(),lock=LockService.getScriptLock();lock.waitLock(25000);
  try{
    const sheet=lxAdminSheet_(),rows=lxReadRows_(),p=lxNormalizeProduct_(input);
    let existing=null;
    if(p.id)existing=rows.find(x=>x.id===String(p.id));
    if(p.id&&!existing)throw Error('No encontramos el producto original.');
    if(rows.some(x=>x.slug===p.identity.slug&&(!existing||x.id!==existing.id)))
      throw Error('Ya existe un producto con ese slug.');
    if(existing&&Number(input.version||0)!==existing.version)
      throw Error('Otro editor modificó este producto. Vuelve a abrirlo antes de guardar.');
    if(!existing){p.id=Utilities.getUuid();p.code=lxNextCode_(rows,p.identity.type);p.version=1;}
    else{p.id=existing.id;p.code=existing.code;p.version=existing.version+1;}
    p.updatedAt=new Date().toISOString();p.updatedBy=actor;
    // La hoja es PRIVADA. Los costos internos nunca se exportan al catálogo público.
    const data=JSON.stringify(p);
    if(data.length>49000)throw Error('Documento demasiado grande para una celda de Sheets.');
    const record=[p.id,p.code,p.identity.slug,p.status,lxAdminSafeCell_(p.identity.title),
      lxAdminSafeCell_(p.identity.country),lxAdminSafeCell_(p.identity.city),new Date(),p.version,actor,data];
    if(existing)sheet.getRange(existing.row,1,1,record.length).setValues([record]);
    else sheet.appendRow(record);
    lxAudit_(actor,existing?'EDITAR':'CREAR',p.id,p.code+' · '+p.status);
    return p;
  }finally{lock.releaseLock();}
}
function lxImportAtacama(){
  lxAdminWho_();
  const existing=lxReadRows_().find(x=>x.slug==='desierto-atacama-premium-5d4n');
  if(existing)return lxReadProduct_(existing.id);
  return lxSaveProduct(ATACAMA_PREMIUM_DRAFT);
}
function lxPricePreview(data,count){
  lxAdminWho_();
  const p=lxNormalizeProduct_(data),adults=Math.floor(Number(count));
  if(!Number.isInteger(adults)||adults<1||adults>12)throw Error('Selecciona 1–12 adultos.');
  const base=Number(p.pricing.pricePerAdultOnDoubleUSD)||0;
  const singles=adults%2,doubles=Math.floor(adults/2);
  if(!base)return {adults,status:'PENDIENTE',message:'Falta precio base por adulto, en doble.'};
  const hotel=p.lodging, nights=Number(hotel.nights)||0;
  if(singles&&(!hotel.costDoubleRoomNightUSD||!hotel.costSingleRoomNightUSD)){
    return {adults,doubles,singles,status:'SINGLE_PENDIENTE',
      indicativeBase:Math.round(adults*base*100)/100,
      message:'Se necesita una cotización doble y una individual del mismo hotel/fechas. No mostrar precio final todavía.'};
  }
  const supplement=singles?Math.max(0,Math.round((hotel.costSingleRoomNightUSD-hotel.costDoubleRoomNightUSD/2)*nights*100)/100):0;
  const total=Math.round((adults*base+supplement)*100)/100;
  const valid=Boolean(p.pricing.priceStatus==='CONFIRMADA'&&p.quality&&p.quality.pricesConfirmed&&p.quality.hotelConfirmed);
  return {adults,doubles,singles,basePerPerson:base,supplement,total,
    perPerson:Math.round(total/adults*100)/100,
    status:valid?'COTIZADO':'REFERENCIAL',message:valid?'Precio calculado para la ocupación.':'Simulación interna: faltan precios/proveedores confirmados.'};
}
function lxPublicPreview(data){
  lxAdminWho_();const p=lxNormalizeProduct_(data);
  const i=p.identity,c=p.commercial,h=p.lodging,pr=p.pricing;
  return {schemaVersion:1,code:p.code||'SIN_GUARDAR',slug:i.slug,type:i.type,
    title:i.title,country:i.country,region:i.region,city:i.city,destination:i.destination,
    days:i.days,nights:i.nights,category:i.category,difficulty:i.difficulty,
    language:i.language,startPoint:i.startPoint,endPoint:i.endPoint,minAge:i.minAge,
    shortDescription:c.short||'',description:c.description||'',
    highlights:c.highlights||[],includes:c.includes||[],excludes:c.excludes||[],
    itinerary:p.itinerary||[],hotel:{name:h.name,stars:h.stars,nights:h.nights,
      roomType:h.roomType,breakfast:h.breakfast,minimumAge:h.minHotelGuestAge||null},
    currency:pr.currency,basisOccupancy:2,defaultAdults:2,defaultChildren:0,
    status:'NO PUBLICADO',price:null,
    seo:{title:p.seo.title||i.title,description:p.seo.description||'',heroImage:p.seo.heroImage||'',gallery:p.seo.gallery||[]}};
}
function doGet(){
  try{
    lxAdminWho_();
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Consola LATAM Expeditions · Experiencias')
      .addMetaTag('viewport','width=device-width,initial-scale=1');
  }catch(e){
    return HtmlService.createHtmlOutput('<meta name="robots" content="noindex"><h2>Acceso restringido</h2><p>Esta consola requiere autorización de administrador.</p>');
  }
}
