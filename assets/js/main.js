document.addEventListener('DOMContentLoaded',()=>{
  const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  document.querySelectorAll('[data-filterable]').forEach(root=>{
    const cards=[...root.querySelectorAll('.trip-card')], groups=[...root.querySelectorAll('[data-filter-group]')], count=root.querySelector('#resultsCount'), empty=root.querySelector('#emptyState'), reset=root.querySelector('#filterReset');
    const active={};
    const apply=()=>{let visible=0;cards.forEach(card=>{const tags=(card.dataset.tags||'').split(/\s+/);const ok=Object.values(active).every(v=>!v||tags.includes(v));card.hidden=!ok;if(ok)visible++;});if(count)count.textContent=`${visible} ${document.documentElement.lang==='en'?'results':'resultados'}`;if(empty)empty.hidden=visible>0;if(reset)reset.hidden=!Object.values(active).some(Boolean);};
    groups.forEach(g=>{const key=g.dataset.filterGroup;g.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.filter;active[key]=active[key]===v?'':v;g.querySelectorAll('[data-filter]').forEach(x=>{const on=x.dataset.filter===active[key];x.classList.toggle('is-active',on);x.setAttribute('aria-pressed',on)});apply()}));});
    if(reset)reset.addEventListener('click',()=>{Object.keys(active).forEach(k=>active[k]='');root.querySelectorAll('[data-filter]').forEach(x=>{x.classList.remove('is-active');x.setAttribute('aria-pressed','false')});apply()});
    const q=new URLSearchParams(location.search);groups.forEach(g=>{const key=g.dataset.filterGroup,param=g.dataset.filterParam,v=q.get(param);if(v){active[key]=norm(v);const b=g.querySelector(`[data-filter="${CSS.escape(norm(v))}"]`);if(b){b.classList.add('is-active');b.setAttribute('aria-pressed','true')}}});apply();
  });
  const form=document.querySelector('#tripSearch, .hero-search form, form.search-form'); const dest=document.querySelector('#searchDestination');
  if(form&&dest)form.addEventListener('submit',e=>{e.preventDefault();const v=dest.value;if(!v)return;const country=['peru','chile','ecuador','colombia','argentina','brasil','bolivia','mexico','costa-rica','uruguay','venezuela'].includes(v);location.href=`experiencias.html?${country?'destino':'ciudad'}=${encodeURIComponent(v)}`;});
});