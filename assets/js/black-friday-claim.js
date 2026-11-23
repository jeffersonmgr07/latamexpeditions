/* LATAM Expeditions · Registro Black Friday 2026 con Apps Script por POST/iframe. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  let endpoint='',email='',coupon='',busy=false;
  const status=(message,error=false)=>{const e=$('bfStatus');e.textContent=message||'';e.classList.toggle('is-error',Boolean(error));};
  const toggleBusy=(value)=>{
    busy=value;
    ['bfRequest','bfVerify'].forEach(id=>{const e=$(id);if(e)e.disabled=value;});
  };
  const trusted=(origin)=>{
    try{
      const url=new URL(origin);return url.protocol==='https:'&&(
        url.hostname==='script.google.com'||url.hostname==='script.googleusercontent.com'||
        url.hostname.endsWith('.script.googleusercontent.com')||
        url.hostname.endsWith('-script.googleusercontent.com'));
    }catch(_){return false;}
  };
  const post=(action,data)=>new Promise((resolve,reject)=>{
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint))
      {reject(Error('La campaña todavía no está conectada.'));return;}
    const requestKey='bf'+Date.now().toString(36)+Math.random().toString(36).slice(2,14);
    const iframe=document.createElement('iframe');
    iframe.hidden=true;iframe.setAttribute('aria-hidden','true');iframe.name='lx_bf_'+requestKey;
    const form=document.createElement('form');form.hidden=true;form.method='POST';
    form.action=endpoint;form.target=iframe.name;
    for(const [name,value] of Object.entries({action,payload:JSON.stringify({...data,requestKey})})){
      const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;form.append(input);
    }
    let settled=false;
    const finish=(err,result)=>{
      if(settled)return;settled=true;clearTimeout(timer);window.removeEventListener('message',onMessage);
      form.remove();setTimeout(()=>iframe.remove(),350);
      err?reject(err):resolve(result);
    };
    const onMessage=event=>{
      const reply=event.data;
      if(event.source!==iframe.contentWindow||!trusted(event.origin)||
        !reply||reply.type!=='latam-bf-claim-response'||reply.action!==action||
        reply.requestKey!==requestKey)return;
      if(reply.ok!==true)finish(Error(reply.error||'No se pudo procesar la solicitud.'));
      else finish(null,reply);
    };
    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>finish(Error('La conexión tardó demasiado. Revisa tu correo antes de reintentar.')),45000);
    document.body.append(iframe,form);
    try{form.submit();}catch(e){finish(e);}
  });
  const step=n=>{for(let i=1;i<=3;i++)$('bfStep'+i).hidden=i!==n;status('');};
  const init=async()=>{
    try{
      const r=await fetch('assets/data/catalog.json',{cache:'no-store'});
      if(!r.ok)throw Error('No se pudo cargar la configuración de reservas.');
      endpoint=String((await r.json()).booking?.endpoint||'');
      if(!endpoint)throw Error('El registro no está disponible por el momento.');
    }catch(e){status(e.message||'No se pudo iniciar el registro.',true);$('bfRequest').disabled=true;}
  };
  $('bfForm').addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    const firstName=$('bfFirst').value.trim(),lastName=$('bfLast').value.trim();
    email=$('bfEmail').value.trim().toLowerCase();
    const whatsapp=$('bfPhone').value.trim();
    toggleBusy(true);status('Enviando código de verificación…');
    try{
      await post('bfLeadStart',{firstName,lastName,email,whatsapp,
        privacyAccepted:$('bfPrivacy').checked,marketingAccepted:$('bfMarketing').checked});
      $('bfEmailPreview').textContent=email;
      step(2);$('bfOtp').focus();
    }catch(e){status(e.message||'No pudimos enviar el código.',true);}
    finally{toggleBusy(false);}
  });
  $('bfVerifyForm').addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    const otp=$('bfOtp').value.trim();
    toggleBusy(true);status('Verificando el código…');
    try{
      const r=await post('bfLeadVerify',{email,otp});
      if(!/^BF26-[A-Z0-9-]{19}$/.test(String(r.code||'')))throw Error('No recibimos el cupón. Contáctanos.');
      coupon=r.code;$('bfCode').textContent=coupon;
      step(3);
    }catch(e){status(e.message||'No pudimos verificar el correo.',true);}
    finally{toggleBusy(false);}
  });
  $('bfRestart').addEventListener('click',()=>step(1));
  $('bfCopy').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(coupon);$('bfCopy').textContent='¡Copiado!';}
    catch(_){status('Selecciona el código y cópialo manualmente.',true);}
  });
  init();
})();
