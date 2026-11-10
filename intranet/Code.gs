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
const LXADMIN_STATES=['BORRADOR','EN_REVISION','PUBLICADO_COTIZACION','APROBADO'];
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
  if(p.status==='PUBLICADO_COTIZACION'&&p.identity.slug!=='desierto-atacama-premium-5d4n')
    throw Error('La publicación en modo cotización está habilitada únicamente para el piloto de Atacama que ya tiene ficha creada en GitHub.');
  if(p.status==='APROBADO'){
    const quality=p.quality||{};
    const checks=['pricesConfirmed','hotelConfirmed','suppliersConfirmed','flightConfirmed',
      'photosLicensed','policiesApproved','datesVerified','bookingTested'];
    const hotelRequired=p.identity.type==='package'&&p.lodging.included!==false;
    const flightRequired=Boolean(p.flights&&p.flights.included);
    const pending=checks.filter(key=>{
      if(key==='hotelConfirmed'&&!hotelRequired)return false;
      if(key==='flightConfirmed'&&!flightRequired)return false;
      return quality[key]!==true;
    });
    const missingRoomRates=hotelRequired&&(!p.lodging.costDoubleRoomNightUSD||!p.lodging.costSingleRoomNightUSD);
    if(p.pricing.priceStatus!=='CONFIRMADA'||missingRoomRates||pending.length)
      throw Error('No se puede aprobar todavía: faltan tarifas verificadas o control de calidad ('+
        pending.join(', ')+').');
  }
  // Solo Atacama tiene una ficha pública de cotización preparada en el repositorio.
  // Guardar otros productos NO crea una página HTML ni actualiza PayPal.
  p.public=p.status==='PUBLICADO_COTIZACION';
  p.approved=p.status==='APROBADO';
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
/**
 * Importa la revisión de contenido y un PRESUPUESTO ESTIMADO a Atacama.
 * SOLO consulta referencias públicas, no es una tarifa neta contratada.
 * Nunca publica ni habilita PayPal. Afecta únicamente al producto piloto,
 * con control de versión y auditoría. Se ejecuta desde la interfaz.
 */
function lxAplicarEstudioAtacama(){
  lxAdminWho_();
  const rows=lxReadRows_(),row=rows.find(x=>x.slug==='desierto-atacama-premium-5d4n');
  if(!row)throw Error('Primero importa Atacama 5D/4N desde el menú lateral.');
  const previous=lxReadProduct_(row.id);
  if(previous.status==='APROBADO'||previous.status==='PUBLICADO')
    throw Error('Esta actualización referencial no modifica productos aprobados.');
  const seed=JSON.parse(JSON.stringify(ATACAMA_PREMIUM_DRAFT));
  // Se conserva la identidad de la ficha existente para evitar duplicados.
  const next=Object.assign({},previous,{
    identity:Object.assign({},previous.identity,seed.identity),
    commercial:seed.commercial,
    itinerary:seed.itinerary,
    flights:seed.flights,
    transfers:seed.transfers,
    dates:seed.dates,
    seo:Object.assign({},previous.seo,seed.seo),
    lodging:Object.assign({},previous.lodging,seed.lodging,{
      costDoubleRoomNightUSD:null,costSingleRoomNightUSD:null,
      rateStatus:'ESTIMACION_MERCADO_NO_CONFIRMADA',
      note:'Referencia pública de marzo: aprox. USD 329/noche; presupuesto conservador de trabajo USD 370/noche por habitación doble. Sin cotización firme ni tarifa single para 22–26/03/2027.'
    }),
    pricing:Object.assign({},previous.pricing,seed.pricing,{
      currency:'USD',basisOccupancy:2,defaultAdults:2,defaultChildren:0,
      pricePerAdultOnDoubleUSD:1499.90,baseGroupPriceForTwoUSD:2999.80,
      priceStatus:'REFERENCIAL_NO_PUBLICAR',
      note:'Tarifa preliminar por adulto en doble, sin vuelos. Precisa confirmar Terrantai, guías, tours y cancelación.'
    }),
    status:'PUBLICADO_COTIZACION',approved:false,public:true,
    quality:Object.assign({},previous.quality,{
      pricesConfirmed:false,hotelConfirmed:false,suppliersConfirmed:false,
      flightConfirmed:false,datesVerified:false,policiesApproved:false,
      bookingTested:false,photosLicensed:false,englishApproved:false,
      notes:'ESTUDIO NO VINCULANTE de referencias públicas actualizado 10/11/2026; falta cotización específica de Terrantai y operadores para marzo 2027.'
    }),
    internal:Object.assign({},previous.internal,{
      costBasis:'REFERENCIAL_MERCADO_NO_COTIZADO',
      currency:'USD',estimateForAdults:2,
      estimateDate:'2026-11-10',
      costsForTwoUSD:{
        domesticFlights:0,
        hotel:1480,
        transfers:70,
        toursAndMoon:600,
        entries:178,
        contingency:130,
        paymentFeeEstimate:150,
        totalCostEst:2608
      },
      estimatedHotelRoomNightUSD:370,
      estimatedSingleNightUSD:null,
      revenueForTwoUSD:2999.80,
      expectedMarginUSD:391.80,
      expectedMarginPerPersonUSD:195.90,
      expectedMarginPercent:13.06,
      supplierNotes:[
        'HOTEL: Terrantai Lodge, Tocopilla 411, San Pedro de Atacama; info@terrantai.com. Se requiere cotización Andina twin/doble 22–26/03/2027, más single y políticas. Base de trabajo USD 370/noche (NO tarifa confirmada).',
        'TOURS: Expedición San Pedro (expedicionsanpedro.com) / Civitatis para comparar; tour de Luna CLP 37.900, Arcoíris CLP 45.000, Piedras Rojas CLP 70.000, El Tatio CLP 50.000, Cejar CLP 45.000, astronómico CLP 40.000 por persona, antes de entradas; confirmar combinación e idiomas.',
        'ENTRADAS: referencias publicadas Valle de la Luna CLP 10.800, Arcoíris/Yerbas Buenas CLP 10.000, Piedras Rojas CLP 29.000, Tatio CLP 15.000, Cejar CLP 21.000 por persona; confirmar administradores y políticas.',
        'TRANSFER: Transfer Pampa (transferpampa.cl), CLP 34.000 ida y vuelta por persona; confirmar coordinación con vuelos opcionales.',
        'FECHA: 26/03/2027 Viernes Santo. 22/03/2027 luna llena: la actividad nocturna requiere operador ASTROLUNAR, no prometer estrellas oscuras.'
      ].join('\n'),
      notes:[
        'Fuente del hotel: https://terrantai.com/es/ y promedio marzo https://www.vio.com/Hotel/1716746/es',
        'Tour y entradas: https://viajandochile.com/planifica/mejores-tours-san-pedro-de-atacama',
        'Transfer: https://www.transferpampa.cl/',
        'Tipo de cambio de trabajo CLP 970/USD, solo para modelar.',
        'USD 1499.90 por adulto en base doble, dos adultos USD 2999.80.',
        'Costo grupo previsto USD 2608; margen estimado USD 391.80 (USD 195.90 pp).',
        'Este margen NO está garantizado: hotel, excursiones, entradas, comisiones y disponibilidades varían.',
        'Tarifa individual desconocida: mantener pendiente de cotización y no ofertar un precio definitivo para uno o tres adultos.',
        'Los vuelos NO están incluidos. Ofrecerlos únicamente como complemento dinámico.'
      ].join('\n')
    })
  });
  return lxSaveProduct(next);
}

function lxPricePreview(data,count){
  lxAdminWho_();
  const p=lxNormalizeProduct_(data),adults=Math.floor(Number(count));
  if(!Number.isInteger(adults)||adults<1||adults>12)throw Error('Selecciona 1–12 adultos.');
  const base=Number(p.pricing.pricePerAdultOnDoubleUSD)||0;
  const singles=adults%2,doubles=Math.floor(adults/2);
  if(!base)return {adults,status:'PENDIENTE',message:'Falta precio base por adulto, en doble.'};
  const hotel=p.lodging, nights=Number(hotel.nights)||0;
  const roomRequired=p.identity.type==='package'&&hotel.included!==false;
  if(roomRequired&&singles&&(!hotel.costDoubleRoomNightUSD||!hotel.costSingleRoomNightUSD)){
    return {adults,doubles,singles,status:'SINGLE_PENDIENTE',
      indicativeBase:Math.round(adults*base*100)/100,
      message:'Se necesita una cotización doble y una individual del mismo hotel/fechas. No mostrar precio final todavía.'};
  }
  const supplement=roomRequired&&singles?Math.max(0,Math.round((hotel.costSingleRoomNightUSD-hotel.costDoubleRoomNightUSD/2)*nights*100)/100):0;
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
    status:p.status==='PUBLICADO_COTIZACION'?'PUBLICADO PARA COTIZACIÓN, SIN COBRO':'NO PUBLICADO',price:null,
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
