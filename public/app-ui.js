function initBars(){
  document.getElementById("heroBars").innerHTML = Object.keys(codeNames).map(code=>{
    const pct = Math.round(stats[code].count/clinics.length*100);
    return `<div class="barrow"><b>${code}</b><div class="track"><i data-width="${pct}"></i></div><span>${stats[code].count}/${clinics.length}</span></div>`;
  }).join("");
}

function initAnalytics(){
  const maxObserved = Math.max(...Object.values(stats).map(s=>s.max||0),1);
  document.getElementById("priceRanges").innerHTML = Object.keys(codeNames).map(code=>{
    const s=stats[code], w=Math.round((s.avg||0)/maxObserved*100);
    return `<div class="code-stat">
      <div><b>${code}</b></div>
      <div class="mid"><small>${codeNames[code]}</small><div class="range"><i style="width:${w}%"></i></div></div>
      <div class="numbers"><strong>${money(s.avg)}</strong><span>${money(s.min)}–${money(s.max)}</span></div>
    </div>`;
  }).join("");
  document.getElementById("captureRings").innerHTML = Object.keys(codeNames).map(code=>{
    const pct=Math.round(stats[code].count/clinics.length*100);
    return `<div class="ringcard"><div class="ring" style="--pct:${pct}"><strong>${pct}%</strong></div><b>${code}</b><span>${stats[code].count} of ${clinics.length} locations</span></div>`;
  }).join("");
}

function markerColor(c){
  if(c.coverage>=80) return "#34c759";
  if(c.coverage>=60) return "#0071e3";
  return "#ff9f0a";
}
function popupHTML(c){
  const prices=Object.entries(c.prices).filter(([,v])=>v!=null).map(([k,v])=>`<div style="background:#f5f5f7;border-radius:12px;padding:8px 10px"><b>${k}</b><br>${money(v)}</div>`).join("");
  return `<div style="font-family:Inter,sans-serif;min-width:230px"><div style="font-weight:800;font-size:15px;line-height:1.25">${esc(c.clinic)}</div><div style="color:#6e6e73;font-size:11px;margin:4px 0 10px">${esc(c.city)}, ${c.state} ${c.zip} · ${c.coverage}% complete</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px">${prices}</div><div style="margin-top:10px"><a href="${c.source}" target="_blank" style="color:#0071e3;font-weight:750">Pricing evidence ↗</a></div></div>`;
}
function mapSubset(){ return clinics.filter(c=>c.lnglat && (currentMapCode==="ALL" || c.prices[currentMapCode]!=null)); }
function clearMarkers(){ mapMarkers.forEach(m=>m.remove()); mapMarkers=[]; }
function renderMapMarkers(){
  if(!map) return;
  clearMarkers();
  const arr=mapSubset();
  arr.forEach(c=>{
    const el=document.createElement("div");
    el.style.width="17px";el.style.height="17px";el.style.borderRadius="50%";el.style.background=markerColor(c);el.style.boxShadow=`0 0 0 8px ${markerColor(c)}22,0 8px 22px rgba(0,0,0,.16)`;
    const marker=new maptilersdk.Marker({element:el}).setLngLat(c.lnglat).setPopup(new maptilersdk.Popup({offset:16,maxWidth:"300px"}).setHTML(popupHTML(c))).addTo(map);
    mapMarkers.push(marker);
  });
  if(arr.length){
    const bounds=new maptilersdk.LngLatBounds();
    arr.forEach(c=>bounds.extend(c.lnglat));
    map.fitBounds(bounds,{padding:80,maxZoom:5.5,duration:900});
  }
  document.getElementById("mapLoc").textContent=arr.length;
  document.getElementById("mapStates").textContent=new Set(arr.map(c=>c.state)).size;
  document.getElementById("mapCov").textContent=(arr.length?Math.round(arr.reduce((a,b)=>a+b.coverage,0)/arr.length):0)+"%";
  document.getElementById("map180").textContent=arr.filter(c=>c.prices.D0180!=null).length;
}
function loadMap(key){
  if(!key) return;
  maptilersdk.config.apiKey=key;
  if(map) try{ map.remove(); }catch(e){}
  map=new maptilersdk.Map({
    container:"map",
    style:maptilersdk.MapStyle.DATAVIZ.LIGHT,
    center:[-96.5,38.5],
    zoom:3.6,
    navigationControl:true,
    geolocateControl:false
  });
  document.getElementById("mapKeyOverlay").style.display="none";
  map.on("load",renderMapMarkers);
  map.on("error",e=>console.warn("MapTiler:",e?.error?.message||e));
}
async function bootHostedMap(){
  const overlay=document.getElementById("mapKeyOverlay");
  const msg=document.getElementById("mapConfigMessage");
  try{
    const res=await fetch("/api/config",{cache:"no-store"});
    if(!res.ok) throw new Error("Config endpoint unavailable");
    const cfg=await res.json();
    if(!cfg.maptilerKey) throw new Error("MAPTILER_KEY is not configured on the server");
    loadMap(cfg.maptilerKey);
  }catch(err){
    if(msg) msg.textContent="Map configuration is not available yet. Add MAPTILER_KEY to the Render environment and redeploy.";
    console.warn("Hosted map config:",err);
    if(overlay) overlay.style.display="flex";
  }
}

function initCompare(){
  const opts=clinics.map(c=>`<option value="${c.id}">${esc(c.clinic)} — ${c.city}, ${c.state}</option>`).join("");
  document.getElementById("clinicA").innerHTML=opts;
  document.getElementById("clinicB").innerHTML=opts;
  if(clinics.length>1) document.getElementById("clinicB").selectedIndex=1;
  renderCompare();
}
function renderCompare(){
  const a=clinics.find(c=>c.id===document.getElementById("clinicA").value) || clinics[0];
  const b=clinics.find(c=>c.id===document.getElementById("clinicB").value) || clinics[1] || clinics[0];
  const header=`<div class="cmp-cell"></div><div class="cmp-cell"><b>${esc(a.clinic)}</b><div class="dim">${a.city}, ${a.state}</div></div><div class="cmp-cell"><b>${esc(b.clinic)}</b><div class="dim">${b.city}, ${b.state}</div></div>`;
  const rows=Object.keys(codeNames).map(code=>{
    const av=a.prices[code], bv=b.prices[code];
    const aw=av!=null && bv!=null && av<bv ? "winner":"";
    const bw=av!=null && bv!=null && bv<av ? "winner":"";
    return `<div class="cmp-cell"><div class="cmp-code">${code}</div><div class="cmp-name">${codeNames[code]}</div></div><div class="cmp-cell cmp-val ${aw}">${money(av)}</div><div class="cmp-cell cmp-val ${bw}">${money(bv)}</div>`;
  }).join("");
  document.getElementById("compareGrid").innerHTML=header+rows;
}

function freshnessBucket(c){
  const f=String(c.freshness).toUpperCase();
  if(f.includes("CURRENT")) return "Current";
  if(f.includes("RECENT")) return "Recent";
  return "Legacy";
}
function initFreshness(){
  const counts={Current:0,Recent:0,Legacy:0};
  clinics.forEach(c=>counts[freshnessBucket(c)]++);
  document.getElementById("freshSummary").innerHTML=`<h3>Refresh priority</h3><p>Source age stays attached to the clinic so older pricing never looks newer than it is.</p>
    ${Object.entries(counts).map(([k,v])=>`<div class="freshstat"><span>${k}</span><strong>${v}</strong></div>`).join("")}`;
  const sorted=[...clinics].sort((a,b)=>(b.sourceYear||0)-(a.sourceYear||0));
  document.getElementById("timeline").innerHTML=sorted.map(c=>`<div class="timecard"><div class="year">${c.sourceYear||"—"}</div><div><h4>${esc(c.clinic)}</h4><p>${esc(c.city)}, ${c.state} · ${c.coverage}% complete · ${esc(c.freshness)}</p></div><div class="grade">${esc(c.grade)}</div></div>`).join("");
}

function registryVisible(){
  return clinics.filter(c=>{
    if(search){
      const blob=[c.id,c.clinic,c.city,c.state,c.zip].join(" ").toLowerCase();
      if(!blob.includes(search)) return false;
    }
    if(registryFilter==="complete" && c.coverage<80) return false;
    if(registryFilter==="d0180" && c.prices.D0180==null) return false;
    if(registryFilter==="fresh" && !["RECENT","CURRENT"].includes(String(c.freshness).toUpperCase())) return false;
    return true;
  });
}
function renderTable(){
  document.getElementById("tableBody").innerHTML=registryVisible().map(c=>`<tr>
    <td><b>${esc(c.clinic)}</b><br><span class="dim">${esc(c.id)}</span></td>
    <td>${esc(c.city)}, ${c.state}<br><span class="dim">${esc(c.zip)}</span></td>
    <td>${c.coverage}%</td>
    <td>${money(c.prices.D0150)}</td><td>${money(c.prices.D0180)}</td><td>${money(c.prices.D0210)}</td><td>${money(c.prices.D0274)}</td><td>${money(c.prices.D0330)}</td>
    <td><a class="sourcebtn" href="${c.source}" target="_blank">Open source ↗</a></td>
  </tr>`).join("");
}

function animateCounters(){
  document.querySelectorAll("[data-count]").forEach(el=>{
    const target=Number(el.dataset.count||0), suffix=el.dataset.suffix||"";
    const start=performance.now(), dur=1100;
    const tick=t=>{
      const p=Math.min(1,(t-start)/dur), eased=1-Math.pow(1-p,3);
      el.textContent=Math.round(target*eased)+suffix;
      if(p<1) requestAnimationFrame(tick);
    }; requestAnimationFrame(tick);
  });
}
function reveal(){
  document.querySelectorAll(".reveal").forEach(el=>{
    if(el.getBoundingClientRect().top < innerHeight*.87) el.classList.add("in");
  });
  if(document.querySelector(".hero-viz.in")) document.querySelectorAll(".track i").forEach(i=>i.style.width=i.dataset.width+"%");
}
function initTilt(){
  document.querySelectorAll(".tilt").forEach(card=>{
    card.addEventListener("mousemove",e=>{
      const r=card.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`perspective(900px) rotateX(${-y*4}deg) rotateY(${x*5}deg) translateY(-2px)`;
    });
    card.addEventListener("mouseleave",()=>card.style.transform="");
  });
}
function parallax(){
  const y=scrollY;
  const a=document.querySelector(".panel-a"), b=document.querySelector(".panel-b"), c=document.querySelector(".panel-c");
  if(a) a.style.translate=`0 ${Math.min(45,y*.035)}px`;
  if(b) b.style.translate=`0 ${Math.min(24,y*.016)}px`;
  if(c) c.style.translate=`0 ${Math.min(58,y*.045)}px`;
}
function updateProgress(){
  const max=document.documentElement.scrollHeight-innerHeight;
  document.getElementById("progress").style.width=(max?scrollY/max*100:0)+"%";
}

document.querySelectorAll("#mapControls .seg").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll("#mapControls .seg").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");currentMapCode=btn.dataset.code;renderMapMarkers();
}));
document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));btn.classList.add("active");registryFilter=btn.dataset.filter;renderTable();
}));
document.getElementById("searchInput").addEventListener("input",e=>{search=e.target.value.trim().toLowerCase();renderTable()});
document.getElementById("clinicA").addEventListener("change",renderCompare);
document.getElementById("clinicB").addEventListener("change",renderCompare);
window.addEventListener("scroll",()=>{reveal();parallax();updateProgress()},{passive:true});

initHeatmap();initBars();initAnalytics();initCompare();initFreshness();renderTable();initTilt();reveal();animateCounters();updateProgress();bootHostedMap();
