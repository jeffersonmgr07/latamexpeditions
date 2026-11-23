(function standardizePackagePage(html,p){
  "use strict";
  const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  let s=String(html),slug=p.slug;
  if(s.includes("package-standard-20261123.js"))throw Error("Already standardized: "+slug);
  const first=(s.match(/class="lx-package-carousel__slide is-active"[^>]*><img src="([^"]+)"/)||[])[1]||"../assets/img/"+encodeURIComponent(p.img||"");
  if(s.includes('<section class="page-hero">'))
    s=s.replace('<section class="page-hero">','<section class="page-hero lx-package-hero" style="--lx-hero-img:url(\''+first+'\')">');
  s=s.replace(/<section class="product-hero-clean package-hero-clean[^"]*"(?:\s+style="[^"]*")?[^>]*>/,tag=>{
    if(tag.includes('--lx-hero-img:'))return tag.replace(/\s+style="[^"]*"/,' style="--lx-hero-img:url(\''+first+'\')"');
    return tag.replace(/>$/,' style="--lx-hero-img:url(\''+first+'\')">');
  });
  if(s.includes('class="detail-grid"')){
    s=s.replace(/<section class="section">\s*<div class="detail-grid">/,
       '<section class="section product-detail-section"><div class="detail-layout detail-layout--aligned">');
    s=s.replace(/(<div class="detail-layout detail-layout--aligned">\s*)<div>/,'$1<div class="detail-main">');
    s=s.replace(/(<aside class="detail-aside">\s*)<div class="detail-card">/,
       '$1<div class="detail-card tour-booking-card product-booking-card">');
  }
  s=s.replace(/(<h2(?:\s[^>]*)?>)Información del paquete(<\/h2>)/,'$1Información esencial$2')
    .replace(/(<h2(?:\s[^>]*)?>)Descubre [^<]+(<\/h2>)/,'$1Sobre este paquete$2')
    .replace(/(<h2(?:\s[^>]*)?>)(?:Categorías de alojamiento|Opciones de alojamiento y precios|Alojamiento premium|Alojamiento incluido)(<\/h2>)/,'$1Hotel y acomodación$2')
    .replace(/(<h2(?:\s[^>]*)?>)Servicios contemplados(<\/h2>)/,'$1Qué incluye$2')
    .replace(/(<h2(?:\s[^>]*)?>)(?:Antes de reservar|Condiciones y recomendaciones)(<\/h2>)/,'$1Información importante antes de reservar$2')
    .replace(/<div><span>Edad mínima<\/span><strong>[\s\S]*?<\/strong><\/div>/g,'');
  if(s.includes('<ol class="itinerary">')){
    s=s.replace(/<ol class="itinerary">([\s\S]*?)<\/ol>/,(match,inner)=>{
      const day=[...inner.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m=>m[1].replace(/<[^>]+>/g,'').trim());
      return '<div class="package-itinerary">'+day.map((line,i)=>
        '<article class="package-day"><div class="package-day__head"><span>Día '+(i+1)+'</span><h3>'+
        esc(line.replace(/^D[ií]a\s*\d+\s*[·:–-]\s*/i,''))+'</h3></div>'+
        '<p class="tour-note">El horario de las actividades y los traslados se confirma con el programa definitivo.</p></article>').join('')+
        '</div>';
    });
    s=s.replace(/(<h2(?:\s[^>]*)?>)Itinerario día a día(<\/h2>)/,'$1Itinerario detallado por días$2');
  }
  const mainTag='<div class="detail-main">',pos=s.indexOf(mainTag);
  if(pos<0)throw Error('Cannot locate detail-main: '+slug);
  const duration=(s.match(/data-book-duration="([^"]+)"/)||[])[1]||((Number(p.nights||0)+1)+' días / '+(p.nights||0)+' noches');
  const items=(p.itinerary||[]).map(x=>x.replace(/^D[ií]a\s*\d+\s*[·:–-]\s*/i,'').trim())
    .filter(x=>!/^llegada|^salida|^regreso|^traslado al aeropuerto/i.test(x)).slice(0,4);
  const hl=(items.length?items:(p.includes||[]).slice(0,3))
    .map(x=>'<li>'+esc(x)+'</li>').join('');
  const highlight='<h3 class="tour-subtitle">Lo más destacado</h3><ul class="lx-standard-highlight-list">'+hl+'</ul>';
  let asideAt=()=>s.indexOf('<aside class="detail-aside',s.indexOf(mainTag));
  if(!/<h2[^>]*>Información esencial<\/h2>/.test(s.slice(pos,asideAt()))){
    const extra='<section class="detail-card"><h2>Información esencial</h2><div class="tour-facts product-facts lx-standard-facts">'+
      '<div><span>Ubicación</span><strong>'+esc(p.region||p.country)+', '+esc(p.country)+'</strong></div>'+
      '<div><span>Duración</span><strong>'+esc(duration)+'</strong></div>'+
      '<div><span>Tipo de servicio</span><strong>Visitas y traslados según itinerario</strong></div>'+
      '<div><span>Dificultad</span><strong>'+(/trek|caminata|senderismo/i.test(p.title)?'Requiere preparación para caminatas':'Depende de las actividades del programa')+'</strong></div></div></section>';
    const k=pos+mainTag.length;s=s.slice(0,k)+extra+s.slice(k);
  }else{
    const ess=s.indexOf('Información esencial',pos),sectionEnd=s.indexOf('</section>',ess),facts=s.indexOf('<div class="tour-facts product-facts',ess);
    if(facts>=0&&facts<sectionEnd){
      const existing=s.slice(facts,sectionEnd),add=[];
      if(!/Ubicación|Destino|Región|Destinos/.test(existing))add.push('<div><span>Ubicación</span><strong>'+esc(p.region||p.country)+', '+esc(p.country)+'</strong></div>');
      if(!/Dificultad/.test(existing))add.push('<div><span>Dificultad</span><strong>Según las excursiones del programa</strong></div>');
      if(!/Tipo de servicio|Modalidad/.test(existing))add.push('<div><span>Tipo de servicio</span><strong>Visitas y traslados según itinerario</strong></div>');
      if(add.length){const k=s.indexOf('>',facts)+1;s=s.slice(0,k)+add.join('')+s.slice(k);}
    }
  }
  if(!/<h2[^>]*>Sobre este paquete<\/h2>/.test(s.slice(pos,asideAt()))){
    const about='<section class="detail-card"><h2>Sobre este paquete</h2><p class="tour-lead">'+
      esc(p.excerpt||p.title)+'</p>'+highlight+'</section>';
    const essential=s.indexOf('Información esencial',pos),end=s.indexOf('</section>',essential);
    if(end<0)throw Error('Cannot insert about after essential: '+slug);
    s=s.slice(0,end+10)+about+s.slice(end+10);
  }else{
    const about=s.indexOf('Sobre este paquete',pos),start=s.lastIndexOf('<section class="detail-card',about),end=s.indexOf('</section>',about);
    if(start>=0&&end>=0&&!s.slice(start,end).includes('Lo más destacado'))
      s=s.slice(0,end)+highlight+s.slice(end);
  }
  const reg=/<h2[^>]*>Itinerario[^<]*<\/h2>/gi,tail=s.slice(pos);let it;let m;
  while((m=reg.exec(tail))){it=pos+m.index;break;}
  if(it===undefined)throw Error('Cannot locate itinerary: '+slug);
  const sect=Math.max(s.lastIndexOf('<section class="detail-card',it),s.lastIndexOf('<div class="detail-card',it));
  if(sect<pos)throw Error('Cannot insert selectors: '+slug);
  const flights='<section class="detail-card" data-lx-flight-fallback><h2>Añade vuelos a tu paquete</h2>'+
    '<p>Consulta las alternativas aéreas para tus fechas. El vuelo es opcional salvo que el programa indique lo contrario.</p>'+
    '<div class="lx-standard-actions"><a href="../arma-tu-viaje.html?package='+encodeURIComponent(slug)+'">Consultar vuelos</a></div></section>';
  const lodging='<section class="detail-card" data-lx-hotel-fallback><h2>Alojamiento del paquete</h2>'+
    '<p>Elige la categoría de hotel y el tipo de acomodación. Si necesitas otro alojamiento, puedes solicitar un cambio sujeto a disponibilidad.</p></section>';
  s=s.slice(0,sect)+flights+lodging+s.slice(sect);
  const a=asideAt();if(a<0)throw Error('Missing booking aside: '+slug);
  const at=s.lastIndexOf('</div>',a);if(at<0)throw Error('Missing closing main: '+slug);
  const known=s.slice(pos,at);
  const extras=[];
  if(!/<h2[^>]*>Hotel y acomodación<\/h2>/.test(known)){
    const options=(p.hotelTiers||[]).filter(t=>!t.noAccommodation).slice(0,3).map(t=>esc(t.name)+': '+esc((t.hotels||[]).join(' o '))).join('; ');
    extras.push('<section class="detail-card"><h2>Hotel y acomodación</h2><p>'+
      (options?'Opciones de referencia: '+options+'. ':'Consulta las opciones de alojamiento disponibles. ')+
      'La categoría y las habitaciones definitivas se confirmarán según tu reserva.</p></section>');
  }
  if(!/<h2[^>]*>Qué incluye<\/h2>/.test(known))
    extras.push('<section class="detail-card"><h2>Qué incluye</h2><ul class="detail-list">'+
      (p.includes||[]).map(x=>'<li><span>'+esc(x)+'</span></li>').join('')+'</ul></section>');
  if(!/<h2[^>]*>No incluye<\/h2>/.test(known))
    extras.push('<section class="detail-card"><h2>No incluye</h2><ul class="detail-list">'+
      (p.notIncludes||[]).map(x=>'<li><span>'+esc(x)+'</span></li>').join('')+'</ul></section>');
  if(!known.includes('Información importante antes de reservar'))
    extras.push('<section class="detail-card"><h2>Información importante antes de reservar</h2>'+
      '<p>La programación puede ajustarse por disponibilidad, acceso a atractivos, condiciones locales y requisitos de ingreso. La documentación final indicará los servicios confirmados.</p></section>');
  const sections=[
    ['Horarios y operación','Los horarios de las excursiones y traslados se indican al confirmar el programa y pueden ajustarse por condiciones operativas.'],
    ['Entradas y pagos adicionales','Se incluyen únicamente los servicios y accesos especificados en «Qué incluye». Los gastos opcionales se informarán antes de su contratación.'],
    ['Idiomas disponibles','La disponibilidad de guías en diferentes idiomas varía según el destino y la modalidad. Indica tu preferencia durante la reserva.'],
    ['Recomendaciones','Viaja con documentos vigentes, ropa apropiada para el clima y calzado cómodo. Consulta las indicaciones particulares de cada actividad.'],
    ['Restricciones','Determinadas actividades pueden requerir condiciones físicas o requisitos de ingreso específicos. Informa cualquier necesidad antes de reservar.'],
    ['Accesibilidad','Algunos recorridos y alojamientos pueden presentar limitaciones de acceso. Contáctanos antes de reservar para revisar alternativas.'],
    ['Clima y operación','Por seguridad, las actividades al aire libre pueden reprogramarse o adaptarse si el clima o las disposiciones locales lo requieren.'],
    ['Cancelación','Las condiciones de cambios y cancelación se informan antes de confirmar la compra. Consulta nuestra <a href="../politica-reservas.html">política de reservas</a>.'],
    ['Voucher y confirmación','Al registrar tus datos recibirás el estado de la solicitud. La confirmación definitiva está sujeta a validación de los servicios incluidos y se comunica por los canales de contacto proporcionados.']
  ];
  const oper=sections.filter(([h])=>!known.includes('<h2>'+h+'</h2>'))
    .map(([h,text])=>'<section class="detail-card lx-standard-conditions"><h2>'+h+'</h2><p>'+text+'</p></section>').join('');
  if(oper)extras.push('<div class="lx-standard-operations">'+oper+'</div>');
  if(!known.includes('<h2>Preguntas frecuentes</h2>'))
    extras.push('<section class="detail-card lx-standard-faq"><h2>Preguntas frecuentes</h2>'+
      '<details><summary>¿Se incluyen los vuelos?</summary><p>Solo cuando se indique expresamente en el apartado de servicios incluidos. También puedes consultar opciones aéreas antes de reservar.</p></details>'+
      '<details><summary>¿Puedo modificar mi alojamiento?</summary><p>Puedes consultar otras categorías o solicitar un cambio sujeto a disponibilidad y a la diferencia de tarifa.</p></details>'+
      '<details><summary>¿Cuándo está confirmada la reserva?</summary><p>Después de validar disponibilidad, servicios y condiciones se envía la confirmación correspondiente.</p></details></section>');
  const phone=(s.match(/https:\/\/wa\.me\/(\d{8,15})/)||[])[1]||'51900608980';
  extras.push('<section class="detail-card"><h2>¿Prefieres un viaje a medida?</h2>'+
    '<p>Podemos adaptar fechas, excursiones y categorías de alojamiento según tus preferencias.</p>'+
    '<div class="lx-standard-actions"><a href="../contacto.html?paquete='+encodeURIComponent(slug)+'">Solicitar una cotización a medida</a>'+
    '<a href="https://wa.me/'+phone+'?text='+encodeURIComponent('Hola, quisiera consultar por el paquete '+p.title)+
    '" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a></div></section>');
  s=s.slice(0,at)+extras.join('\n')+s.slice(at);
  s=s.replace('</head>','<link rel="stylesheet" href="../assets/css/package-standard-20261123.css?v=1"/>\n</head>')
    .replace('</body>','<script src="../assets/js/package-standard-20261123.js?v=1" defer></script>\n</body>');
  if(!s.includes('package-standard-20261123.js')||!s.includes('Información esencial')||!s.includes('Preguntas frecuentes')||!s.includes('data-lx-flight-fallback'))
    throw Error('Invalid result '+slug);
  return s;
})