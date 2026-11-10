/**
 * PRUEBAS CONTROLADAS DE PAYPAL · LATAM Expeditions
 * Archivo para el MISMO proyecto Apps Script "LATAM – Reservas y Pagos".
 *
 * Garantías: las funciones de este archivo SOLO se ejecutan en Sandbox,
 * NO generan reservas, NO envían correos, NO capturan pagos reales y
 * no publican credenciales en los registros.
 * El comprador debe aprobar manualmente la orden con una cuenta PERSONAL Sandbox.
 */
const LX_PAYPAL_TEST_ORDER = 'LX_PAYPAL_TEST_ORDER_ID_V1';
const LX_PAYPAL_TEST_AMOUNT = '1.00';
const LX_PAYPAL_TEST_CUSTOM = 'LATAM-SANDBOX-ONLY';

function lxProbarSoloSandbox_() {
  const env=PropertiesService.getScriptProperties().getProperty('PAYPAL_ENV');
  if(env!=='sandbox' || CONFIG.env!=='sandbox') {
    throw Error('PRUEBA BLOQUEADA: cambia PAYPAL_ENV a sandbox y utiliza credenciales SANDBOX. Este test nunca funciona en Live.');
  }
  if(!CONFIG.clientId||!CONFIG.secret)throw Error('Configura Client ID y Secret de SANDBOX en Propiedades del script.');
}
function lxRevisarOrdenSandbox_(orderId) {
  const id=String(orderId||'').trim();
  if(!/^[A-Z0-9]{8,36}$/.test(id))throw Error('ID de orden Sandbox inválido.');
  const result=solicitudPayPal('/v2/checkout/orders/'+encodeURIComponent(id),'get');
  if(result.code!==200)throw Error('No se pudo consultar la orden Sandbox (HTTP '+result.code+').');
  const b=result.body||{},unit=(b.purchase_units||[])[0]||{},amount=unit.amount||{};
  if(unit.custom_id!==LX_PAYPAL_TEST_CUSTOM || amount.currency_code!=='USD' || amount.value!==LX_PAYPAL_TEST_AMOUNT) {
    throw Error('La orden no corresponde a la prueba Sandbox de USD 1.00. No capturar.');
  }
  return b;
}
/**
 * 1) Ejecutar desde el editor con PAYPAL_ENV=sandbox.
 * CREA una orden Sandbox de USD 1.00 sin cobrarla.
 * Copia la URL APPROVAL_URL registrada en el log y aprueba con un comprador Sandbox.
 */
function pruebaPayPalCrearOrdenSandbox() {
  lxProbarSoloSandbox_();
  const props=PropertiesService.getScriptProperties();
  if(props.getProperty(LX_PAYPAL_TEST_ORDER)) {
    throw Error('Ya hay una prueba registrada. Ejecuta pruebaPayPalConsultarOrdenSandbox para revisar su estado.');
  }
  const req='LXP-SBOX-'+Utilities.getUuid().replace(/-/g,'').slice(0,22);
  const r=solicitudPayPal('/v2/checkout/orders','post',{
    intent:'CAPTURE',
    purchase_units:[{
      amount:{currency_code:'USD',value:LX_PAYPAL_TEST_AMOUNT},
      description:'LATAM Expeditions - PRUEBA PAYPAL SANDBOX (sin reserva)',
      custom_id:LX_PAYPAL_TEST_CUSTOM
    }],
    payment_source:{paypal:{experience_context:{
      brand_name:'LATAM EXPEDITIONS - PRUEBAS',
      locale:'es-ES',shipping_preference:'NO_SHIPPING',user_action:'PAY_NOW',
      return_url:'https://latamexpeditions.com/?paypal_sandbox_prueba=aprobada',
      cancel_url:'https://latamexpeditions.com/?paypal_sandbox_prueba=cancelada'
    }}}
  },req);
  if(r.code<200||r.code>=300||!r.body?.id) {
    throw Error('No se pudo crear la orden de prueba (HTTP '+r.code+'). Consulta Ejecuciones, sin compartir las credenciales.');
  }
  const id=String(r.body.id);
  if(!/^[A-Z0-9]{8,36}$/.test(id))throw Error('PayPal devolvió un ID de orden inesperado.');
  props.setProperty(LX_PAYPAL_TEST_ORDER,id);
  const link=(r.body.links||[]).find(x=>x.rel==='payer-action'||x.rel==='approve');
  const url=link&&/^https:\/\/([a-z0-9-]+\.)*paypal\.com\//i.test(link.href||'')?link.href:'';
  const report=[
    'ORDEN DE PRUEBA SANDBOX CREADA',
    'ID: '+id,
    'IMPORTE: USD '+LX_PAYPAL_TEST_AMOUNT,
    'ESTADO: '+(r.body.status||'CREATED'),
    'APPROVAL_URL: '+(url||'No se devolvió un enlace; revisa la respuesta de PayPal en sandbox.'),
    'SIGUIENTE PASO: abre APPROVAL_URL con comprador PERSONAL Sandbox.',
    'Después ejecuta pruebaPayPalConsultarOrdenSandbox.'
  ].join('\n');
  console.log(report);
  return report;
}
/** 2) Consulta estado Sandbox sin cobrar. Espera APPROVED tras la aprobación del comprador. */
function pruebaPayPalConsultarOrdenSandbox() {
  lxProbarSoloSandbox_();
  const id=PropertiesService.getScriptProperties().getProperty(LX_PAYPAL_TEST_ORDER);
  if(!id)throw Error('Primero ejecuta pruebaPayPalCrearOrdenSandbox.');
  const b=lxRevisarOrdenSandbox_(id);
  const captures=((b.purchase_units||[])[0]?.payments?.captures)||[];
  const report='SANDBOX ORDER '+id+' | ESTADO: '+b.status+
    ' | CAPTURAS: '+captures.map(c=>c.status+' ('+(c.amount&&c.amount.value||'')+' USD)').join(', ');
  console.log(report);
  return report;
}
/**
 * 3) CAPTURA solo la orden de prueba y solo después de APPROVED.
 * Validaciones: importe exacto USD 1.00, estado COMPLETED, idempotencia.
 * No envía voucher ni modifica Reservas; sirve para probar solo PayPal REST.
 */
function pruebaPayPalCapturarOrdenSandbox() {
  lxProbarSoloSandbox_();
  const props=PropertiesService.getScriptProperties();
  const id=props.getProperty(LX_PAYPAL_TEST_ORDER);
  if(!id)throw Error('No hay una orden de prueba guardada.');
  const previous=lxRevisarOrdenSandbox_(id);
  if(previous.status==='COMPLETED'){
    console.log('La orden Sandbox ya está COMPLETED. No se realizó otra captura. ID: '+id);
    return {ok:true,alreadyCaptured:true,orderId:id};
  }
  if(previous.status!=='APPROVED')throw Error(
    'La orden todavía está '+previous.status+'. Abre APPROVAL_URL y aprueba desde una cuenta PERSONAL Sandbox.');
  const r=solicitudPayPal('/v2/checkout/orders/'+encodeURIComponent(id)+'/capture','post',{},
    'LXP-SBOX-CAP-'+id.slice(0,20));
  if(r.code<200||r.code>=300||r.body?.status!=='COMPLETED'){
    const again=lxRevisarOrdenSandbox_(id);
    if(again.status!=='COMPLETED')throw Error(
      'La captura no está confirmada (HTTP '+r.code+'). No repitas sin revisar el estado.');
  }
  const finalOrder=lxRevisarOrdenSandbox_(id);
  const capture=finalOrder.purchase_units?.[0]?.payments?.captures?.[0]||{};
  const amount=capture.amount||{};
  if(finalOrder.status!=='COMPLETED'||capture.status!=='COMPLETED'||
    amount.value!==LX_PAYPAL_TEST_AMOUNT||amount.currency_code!=='USD') {
    throw Error('Captura pendiente de revisión: no coincide estado/importe. No repetir cobro.');
  }
  const report='PRUEBA SANDBOX EXITOSA · orden '+id+
    ' · captura '+String(capture.id||'SIN ID')+' · USD '+amount.value+' · '+capture.status;
  console.log(report);
  return {ok:true,orderId:id,captureId:capture.id,amount:amount.value,currency:amount.currency_code};
}
/**
 * Para iniciar otra prueba: borrar MANUALMENTE la propiedad
 * LX_PAYPAL_TEST_ORDER_ID_V1 tras revisar que la prueba anterior terminó.
 * No se incluye botón de reset para evitar órdenes duplicadas por accidente.
 */
