(function initProviderContactDirectory(){
  const css = document.createElement('style');
  css.textContent = `
    .provider-directory-shell{background:#f5f5f7}
    .provider-tools{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:0 0 24px}
    .provider-search{flex:1;min-width:280px;display:flex;align-items:center;gap:10px;background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:18px;padding:13px 15px;box-shadow:0 10px 30px rgba(0,0,0,.045)}
    .provider-search input{width:100%;border:0;outline:0;background:transparent;font:inherit;color:var(--ink);font-size:13px}
    .provider-search span{color:var(--muted);font-size:18px}
    .provider-summary{display:flex;gap:8px;flex-wrap:wrap}
    .provider-kpi{background:#fff;border:1px solid rgba(0,0,0,.05);border-radius:16px;padding:10px 13px;min-width:108px;box-shadow:0 8px 24px rgba(0,0,0,.035)}
    .provider-kpi label{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.06em;font-weight:750}
    .provider-kpi strong{display:block;font-size:20px;letter-spacing:-.04em;margin-top:2px}
    .provider-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    .provider-card{position:relative;background:#fff;border:1px solid rgba(0,0,0,.055);border-radius:28px;padding:22px;box-shadow:0 16px 48px rgba(0,0,0,.055);transition:transform .28s ease,box-shadow .28s ease}
    .provider-card:hover{transform:translateY(-4px);box-shadow:0 24px 62px rgba(0,0,0,.085)}
    .provider-card-head{display:flex;gap:14px;justify-content:space-between;align-items:flex-start}
    .provider-card h3{font-size:20px;line-height:1.15;letter-spacing:-.035em;margin:0;max-width:76%}
    .provider-location{margin-top:6px;color:var(--muted);font-size:11px;line-height:1.45}
    .provider-state{flex:0 0 auto;background:#f0f6ff;color:#0066cc;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:800}
    .contact-stack{display:grid;gap:9px;margin-top:18px}
    .contact-row{display:grid;grid-template-columns:70px 1fr auto;gap:10px;align-items:center;background:#f8f8fa;border-radius:15px;padding:10px 11px;min-height:48px}
    .contact-row label{font-size:9px;color:var(--muted);font-weight:800;text-transform:uppercase;letter-spacing:.06em}
    .contact-value{min-width:0}
    .contact-value a,.contact-value b{display:block;color:var(--ink);font-size:12px;font-weight:750;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .contact-value small{display:block;color:var(--muted);font-size:8.5px;margin-top:2px;white-space:normal;line-height:1.3}
    .contact-action{border:0;background:#fff;color:#0066cc;border-radius:10px;padding:7px 9px;font-size:9px;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,.05);cursor:pointer;text-decoration:none}
    .contact-action.muted{color:var(--muted);cursor:default}
    .provider-card-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:16px;padding-top:15px;border-top:1px solid rgba(0,0,0,.055);flex-wrap:wrap}
    .provider-badges{display:flex;gap:6px;flex-wrap:wrap}
    .provider-badge{background:#f5f5f7;border-radius:999px;padding:6px 8px;font-size:8.5px;font-weight:750;color:#555}
    .provider-badge.ok{background:#eef8f1;color:#248a3d}
    .provider-badge.warn{background:#fff5e8;color:#a55b00}
    .provider-links{display:flex;gap:7px;flex-wrap:wrap}
    .provider-link{color:#0066cc;font-size:9px;font-weight:800;text-decoration:none;background:#f0f6ff;padding:7px 9px;border-radius:10px}
    .directory-empty{grid-column:1/-1;background:#fff;border-radius:24px;padding:40px;text-align:center;color:var(--muted)}
    .copy-flash{position:fixed;left:50%;bottom:30px;transform:translateX(-50%) translateY(10px);background:rgba(29,29,31,.92);color:#fff;border-radius:999px;padding:10px 15px;font-size:11px;font-weight:750;opacity:0;pointer-events:none;transition:.2s ease;z-index:9999;backdrop-filter:blur(12px)}
    .copy-flash.show{opacity:1;transform:translateX(-50%) translateY(0)}
    @media(max-width:850px){.provider-grid{grid-template-columns:1fr}.provider-card h3{max-width:82%}}
    @media(max-width:560px){.contact-row{grid-template-columns:58px 1fr}.contact-action{grid-column:2;justify-self:start}.provider-card{padding:18px;border-radius:24px}}
  `;
  document.head.appendChild(css);

  const mapSection = document.getElementById('mapSection');
  if (!mapSection) return;

  mapSection.insertAdjacentHTML('afterend', `
    <section class="section provider-directory-shell" id="providers">
      <div class="wrap">
        <div class="head reveal">
          <div class="eyebrow">Provider contact directory</div>
          <h2>Call, fax, or email the clinic from the same record.</h2>
          <p>Operational contact channels are kept beside the pricing evidence so the registry can be used for actual referral outreach, not just price comparison.</p>
        </div>
        <div class="provider-tools reveal">
          <div class="provider-search"><span>⌕</span><input id="providerDirectorySearch" placeholder="Search clinic, city, state, ZIP, phone, fax, or email"></div>
          <div class="provider-summary">
            <div class="provider-kpi"><label>Providers</label><strong id="providerCount">0</strong></div>
            <div class="provider-kpi"><label>Phone</label><strong id="providerPhoneCount">0</strong></div>
            <div class="provider-kpi"><label>Fax</label><strong id="providerFaxCount">0</strong></div>
            <div class="provider-kpi"><label>Email</label><strong id="providerEmailCount">0</strong></div>
          </div>
        </div>
        <div class="provider-grid" id="providerDirectoryGrid"></div>
      </div>
    </section>
    <div class="copy-flash" id="providerCopyFlash">Copied</div>
  `);

  const navLinks = document.querySelector('.nav .links');
  if (navLinks && !navLinks.querySelector('a[href="#providers"]')) {
    const a = document.createElement('a');
    a.href = '#providers';
    a.textContent = 'Providers';
    const registryLink = navLinks.querySelector('a[href="#registry"]');
    registryLink ? navLinks.insertBefore(a, registryLink) : navLinks.appendChild(a);
  }

  function telHref(v){ return `tel:${String(v||'').replace(/[^0-9+]/g,'')}`; }
  function showFlash(text='Copied'){
    const flash=document.getElementById('providerCopyFlash');
    if(!flash)return;
    flash.textContent=text;flash.classList.add('show');
    clearTimeout(showFlash.t);showFlash.t=setTimeout(()=>flash.classList.remove('show'),1200);
  }
  async function copyText(text){
    try{ await navigator.clipboard.writeText(text); showFlash('Copied to clipboard'); }
    catch{ showFlash('Copy unavailable'); }
  }

  function availableCodes(c){
    return Object.entries(c.prices||{}).filter(([,v])=>v!=null).map(([code])=>code);
  }

  function contactRow(label,value,scope,type){
    if(!value){
      return `<div class="contact-row"><label>${label}</label><div class="contact-value"><b>Not publicly listed</b><small>${esc(scope||'Needs confirmation')}</small></div><span class="contact-action muted">—</span></div>`;
    }
    if(type==='phone'){
      return `<div class="contact-row"><label>${label}</label><div class="contact-value"><a href="${telHref(value)}">${esc(value)}</a><small>${esc(scope||'')}</small></div><a class="contact-action" href="${telHref(value)}">Call</a></div>`;
    }
    if(type==='email'){
      return `<div class="contact-row"><label>${label}</label><div class="contact-value"><a href="mailto:${esc(value)}">${esc(value)}</a><small>${esc(scope||'')}</small></div><a class="contact-action" href="mailto:${esc(value)}">Email</a></div>`;
    }
    return `<div class="contact-row"><label>${label}</label><div class="contact-value"><b>${esc(value)}</b><small>${esc(scope||'')}</small></div><button class="contact-action copy-fax" data-copy="${esc(value)}">Copy</button></div>`;
  }

  function card(c){
    const codes=availableCodes(c);
    const fullyDirect = [c.phoneScope,c.faxScope,c.emailScope].filter(Boolean).every(x=>/dental/i.test(x));
    const statusClass = /needs confirmation|general|agency|partner|records/i.test([c.contactStatus,c.faxScope,c.emailScope].join(' ')) ? 'warn':'ok';
    const bundle=[c.clinic,c.address||`${c.city}, ${c.state} ${c.zip}`,c.phone?`Phone: ${c.phone}`:'',c.fax?`Fax: ${c.fax}`:'',c.email?`Email: ${c.email}`:''].filter(Boolean).join('\n');
    return `<article class="provider-card reveal" data-search="${esc([c.id,c.clinic,c.city,c.state,c.zip,c.phone,c.fax,c.email].join(' ').toLowerCase())}">
      <div class="provider-card-head"><div><h3>${esc(c.clinic)}</h3><div class="provider-location">${esc(c.address||'')}<br>${esc(c.city)}, ${esc(c.state)} ${esc(c.zip)}</div></div><span class="provider-state">${esc(c.state)}</span></div>
      <div class="contact-stack">
        ${contactRow('Phone',c.phone,c.phoneScope,'phone')}
        ${contactRow('Fax',c.fax,c.faxScope,'fax')}
        ${contactRow('Email',c.email,c.emailScope,'email')}
      </div>
      <div class="provider-card-foot">
        <div class="provider-badges"><span class="provider-badge ${statusClass}">${esc(c.contactStatus||'Contact captured')}</span><span class="provider-badge">${c.coverage||0}% price capture</span>${codes.slice(0,3).map(code=>`<span class="provider-badge">${code}</span>`).join('')}${codes.length>3?`<span class="provider-badge">+${codes.length-3}</span>`:''}</div>
        <div class="provider-links"><button class="provider-link copy-contact" data-copy="${esc(bundle)}" style="border:0;cursor:pointer">Copy contact</button>${c.locationUrl?`<a class="provider-link" href="${c.locationUrl}" target="_blank" rel="noopener">Clinic page ↗</a>`:''}${c.source?`<a class="provider-link" href="${c.source}" target="_blank" rel="noopener">Pricing ↗</a>`:''}${c.contactSource?`<a class="provider-link" href="${c.contactSource}" target="_blank" rel="noopener">Contact source ↗</a>`:''}</div>
      </div>
    </article>`;
  }

  function render(query=''){
    const q=query.trim().toLowerCase();
    const filtered=clinics.filter(c=>!q || [c.id,c.clinic,c.city,c.state,c.zip,c.phone,c.fax,c.email,c.address].join(' ').toLowerCase().includes(q));
    const grid=document.getElementById('providerDirectoryGrid');
    grid.innerHTML=filtered.length?filtered.map(card).join(''):`<div class="directory-empty">No provider contacts match that search.</div>`;
    document.getElementById('providerCount').textContent=clinics.length;
    document.getElementById('providerPhoneCount').textContent=clinics.filter(c=>c.phone).length;
    document.getElementById('providerFaxCount').textContent=clinics.filter(c=>c.fax).length;
    document.getElementById('providerEmailCount').textContent=clinics.filter(c=>c.email).length;
    grid.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',()=>copyText(btn.dataset.copy)));
  }

  document.getElementById('providerDirectorySearch').addEventListener('input',e=>render(e.target.value));
  render();
})();
