/**
 * LATAM Expeditions · Operación de reservas, manifiesto y acuses.
 * Copiar ESTE archivo al MISMO proyecto Apps Script que Codigo.gs.
 * Ninguna hoja es pública: acceso solo al equipo autorizado.
 */
function lxSheet_(name,headers){
  const book=SpreadsheetApp.openById(CONFIG.sheetId);
  let sheet=book.getSheetByName(name);
  if(!sheet){sheet=book.insertSheet(name);sheet.appendRow(headers);
    sheet.getRange(1,1,1,headers.length).setBackground('#0a3d2c').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);}
  return sheet;
}
function lxRowExists_(sheet,code){
  if(sheet.getLastRow()<2)return false;
  const rows=sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues();
  return rows.some(r=>String(r[0])===String(code));
}
function lxCell_(value,max){
  return textoHoja(textoPlano(value,max||180));
}
function lxFlightSegments_(data){
  const flight=data&&data.flightSelection;
  if(!flight||typeof flight!=='object')return [];
  const out=[];
  [['Ida',flight.outbound],['Regreso',flight.inbound]].forEach(([leg,segments])=>{
    if(!Array.isArray(segments))return;
    segments.slice(0,6).forEach((segment,i)=>{
      if(!segment||typeof segment!=='object')return;
      out.push([leg,i+1,lxCell_(segment.airline,70),lxCell_(segment.flightNumber,30),
        lxCell_(segment.from&&segment.from.code,10),lxCell_(segment.from&&segment.from.time,40),
        lxCell_(segment.to&&segment.to.code,10),lxCell_(segment.to&&segment.to.time,40)]);
    });
  });
  return out;
}
function lxGuardarDetalle_(code,data,status,orderId,captureId,baseTotal){
  if(!code||!data)return;
  const key=textoPlano(data.requestKey,80),flight=data.flightSelection||{},hotel=data.alternateHotelDetails||{};
  const op=lxSheet_('Detalle Operativo',[
    'Código','Fecha registro','Estado','Producto','Fecha llegada','Adultos','Niños','Idioma tour',
    'Hotel incluido','Hotel alternativo','Habitación','Entrada hotel','Salida hotel',
    'Suplemento hotel USD','Cotización vuelo USD','Salida vuelo','Regreso vuelo',
    'Origen','Destino','Total base USD','Total ofertado USD','Request Key','PayPal Order','PayPal Capture']);
  if(!lxRowExists_(op,code))op.appendRow([
    code,new Date(),status,lxCell_(data.slug,100),lxCell_(data.date,10),
    Number(data.adults)||0,Number(data.children)||0,lxCell_(data.tourLanguage||data.holder&&data.holder.tourLanguage,20),
    lxCell_(data.includedHotel,140),lxCell_(data.alternateHotel,140),lxCell_(data.roomPlan||data.occupancy,120),
    lxCell_(hotel.checkIn,10),lxCell_(hotel.checkOut,10),
    Number(data.alternateHotelSupplement)||0,Number(flight.displayedPrice)||0,
    lxCell_(flight.departure,10),lxCell_(flight.returnDate,10),
    lxCell_(flight.origin,10),lxCell_(flight.destination,10),
    Number(baseTotal)||0,Number(data.quotedTotal)||0,lxCell_(key,80),
    lxCell_(orderId,60),lxCell_(captureId,60)]);
  const pax=lxSheet_('Pasajeros',[
    'Código','Nº','Tipo pasajero','Nombres completos','Tipo documento','Nº documento',
    'Nacionalidad','Nacimiento','Estado','Fecha de viaje']);
  if(!lxRowExists_(pax,code) && Array.isArray(data.passengers)){
    data.passengers.slice(0,12).forEach((p,i)=>{
      pax.appendRow([code,i+1,lxCell_(p.passengerType,15),lxCell_(p.name||((p.firstName||'')+' '+(p.lastName||'')),140),
        lxCell_(p.docType,50),lxCell_(p.docNumber,60),lxCell_(p.nationality,80),lxCell_(p.birth,10),
        p.pendingDetails?'DATOS PENDIENTES':'DATOS RECIBIDOS',lxCell_(data.date,10)]);
    });
  }
  const fly=lxSheet_('Vuelos',[
    'Código','Tramo','Orden','Aerolínea','Nº vuelo','Desde','Salida fecha/hora',
    'Hasta','Llegada fecha/hora','Estado emisión','PayPal Order']);
  if(!lxRowExists_(fly,code)){
    lxFlightSegments_(data).forEach(f=>fly.appendRow([code,...f,'PENDIENTE DE EMISIÓN',lxCell_(orderId,60)]));
  }
  const hot=lxSheet_('Hoteles',[
    'Código','Hotel incluido','Hotel elegido','Entrada','Salida','Acomodación',
    'Suplemento USD','Estado proveedor','Personas','PayPal Order']);
  if(!lxRowExists_(hot,code)){
    hot.appendRow([code,lxCell_(data.includedHotel,140),lxCell_(data.alternateHotel||data.includedHotel,140),
      lxCell_(hotel.checkIn||data.date,10),lxCell_(hotel.checkOut,10),
      lxCell_(data.roomPlan||data.occupancy,120),Number(data.alternateHotelSupplement)||0,
      'PENDIENTE DE CONFIRMACIÓN',Number(data.travelers)||0,lxCell_(orderId,60)]);
  }
}
function lxTextoOperativo_(data){
  if(!data)return '';
  const segments=lxFlightSegments_(data);
  const lines=[
    'DATOS PARA OPERACIÓN MANUAL',
    'Hotel incluido: '+(data.includedHotel||'Categoría del paquete'),
    'Hotel solicitado: '+(data.alternateHotel||'Sin cambio'),
    'Acomodación: '+(data.roomPlan||data.occupancy||'Por definir'),
    'Suplemento hotel (estimado): USD '+(Number(data.alternateHotelSupplement)||0).toFixed(2),
    'Idioma deseado: '+(data.tourLanguage||data.holder&&data.holder.tourLanguage||'Por confirmar'),
    'Vuelos: '+(segments.length?'PENDIENTES DE EMISIÓN':'No añadidos')
  ];
  if(data.flightSelection){
    lines.push('Origen: '+(data.flightSelection.origin||''),
      'Destino: '+(data.flightSelection.destination||''),
      'Ida: '+(data.flightSelection.departure||''),
      'Regreso: '+(data.flightSelection.returnDate||''),
      'Vuelo estimado USD: '+(Number(data.flightSelection.displayedPrice)||0).toFixed(2));
  }
  segments.forEach(f=>lines.push(f[0]+' segmento '+f[1]+': '+f[2]+' '+f[3]+' / '+f[4]+' '+f[5]+' → '+f[6]+' '+f[7]));
  lines.push('Total ofertado en web (NO validado por proveedor): USD '+(Number(data.quotedTotal)||0).toFixed(2));
  return '\n'+lines.join('\n');
}
function lxAcuseSheet_(){
  return lxSheet_('Acuses', ['Request Key','Código','Fecha','Correo enviado','Estado']);
}
function lxRegistrarAcuse_(key,code,emailSent,status){
  const sheet=lxAcuseSheet_();
  if(sheet.getLastRow()>1){
    const rows=sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues();
    for(let i=0;i<rows.length;i++)if(String(rows[i][0])===String(key)){
      sheet.getRange(i+2,2,1,4).setValues([[code,new Date(),!!emailSent,status]]);return;
    }
  }
  sheet.appendRow([key,code,new Date(),!!emailSent,status]);
}
function lxEstadoAcuse_(key){
  const safe=String(key||'');
  const base={type:'latam-booking-receipt',requestKey:safe,pending:true};
  if(!/^[A-Za-z0-9]{16,80}$/.test(safe))return base;
  const sheet=lxAcuseSheet_();
  if(sheet.getLastRow()<2)return base;
  const rows=sheet.getRange(2,1,sheet.getLastRow()-1,5).getValues();
  for(let i=rows.length-1;i>=0;i--)if(String(rows[i][0])===safe){
    return {type:base.type,requestKey:safe,pending:false,ok:true,
      bookingCode:String(rows[i][1]),emailSent:rows[i][3]===true,paymentStatus:'pending'};
  }
  return base;
}
function lxHtmlAcuse_(reply){
  const json=JSON.stringify(reply).replace(/</g,'\\u003c');
  return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><script>parent.postMessage('+json+', "*");</script>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function lxResponderEstado_(e){
  const p=e&&e.parameter||{},action=String(p.action||''),key=String(p.requestKey||'');
  const reply=lxEstadoAcuse_(key);
  if(action==='status_html')return lxHtmlAcuse_(reply);
  const callback=String(p.callback||'');
  if(!/^__latamReceipt_[A-Za-z0-9_]{12,100}$/.test(callback))
    return ContentService.createTextOutput('/* callback inválido */').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(callback+'('+JSON.stringify(reply)+');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
