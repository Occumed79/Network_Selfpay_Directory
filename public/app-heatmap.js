function haversineMiles(lon1,lat1,lon2,lat2){
  const R=3958.7613, rad=Math.PI/180;
  const dLat=(lat2-lat1)*rad, dLon=(lon2-lon1)*rad;
  const a=Math.sin(dLat/2)**2 + Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}
function buildCountyAggregates(){
  heatCountyAgg={};
  clinics.forEach(c=>{
    const fips=clinicCountyFips[c.id];
    if(!fips) return;
    const a=heatCountyAgg[fips] ||= {clinics:[],locations:0,coverageSum:0,pricepoints:0,d0180:0};
    a.clinics.push(c);a.locations++;a.coverageSum+=c.coverage;a.pricepoints+=c.pricePoints;
    if(c.prices.D0180!=null)a.d0180++;
  });
  Object.values(heatCountyAgg).forEach(a=>a.capture=a.locations?a.coverageSum/a.locations:null);
}
function heatMetricMeta(metric){
  return {
    gap:{
      title:"National coverage gap",
      section:"Distance to the nearest verified priced clinic.",
      desc:"Darker counties are farther from the nearest verified registry location. This makes the geographic holes visible even while the registry is still being built.",
      sectionDesc:"Each county is shaded by the approximate distance from its geographic centroid to the nearest clinic currently carrying verified posted-price evidence.",
      summary:"Median county gap"
    },
    locations:{
      title:"Verified clinic density",
      section:"Where posted-price clinics are already concentrated.",
      desc:"Counties are shaded by the number of physical clinic locations currently admitted to the verified registry.",
      sectionDesc:"Darker counties contain more verified clinic locations. Counties without admitted price evidence remain neutral.",
      summary:"Counties with evidence"
    },
    capture:{
      title:"Target-code completeness",
      section:"Where the five-code matrix is most complete.",
      desc:"For counties with verified clinics, color represents the average share of D0150, D0180, D0210, D0274 and D0330 captured.",
      sectionDesc:"The choropleth highlights counties where verified clinic records cover more of the five target CDT codes.",
      summary:"Average live-county capture"
    },
    pricepoints:{
      title:"Verified price-point density",
      section:"Where the registry contains the most usable pricing.",
      desc:"Color represents the total number of verified target-code prices captured from clinics in each county.",
      sectionDesc:"The map shifts from location density to actual data density: how many usable prices exist in each county.",
      summary:"Verified target prices"
    },
    d0180:{
      title:"D0180 availability",
      section:"Where comprehensive periodontal evaluation pricing exists.",
      desc:"Counties are highlighted when at least one verified clinic publishes D0180 pricing.",
      sectionDesc:"This layer isolates the hardest-to-find target code and shows exactly where verified D0180 pricing is currently available.",
      summary:"Counties with D0180"
    }
  }[metric];
}
function formatHeatValue(metric,v){
  if(v==null || Number.isNaN(v)) return "No verified data";
  if(metric==="gap") return Math.round(v).toLocaleString()+" mi";
  if(metric==="capture") return Math.round(v)+"%";
  if(metric==="locations") return v+" clinic"+(v===1?"":"s");
  if(metric==="pricepoints") return v+" price"+(v===1?"":"s");
  if(metric==="d0180") return v? v+" clinic"+(v===1?"":"s") : "None";
  return v;
}
function countyMetricValue(feature, metric){
  const fips=String(feature.id).padStart(5,"0");
  const a=heatCountyAgg[fips];
  if(metric==="gap"){
    const centroid=d3.geoCentroid(feature);
    if(!Number.isFinite(centroid[0]) || !Number.isFinite(centroid[1])) return null;
    let best=Infinity;
    clinics.forEach(c=>{
      if(!c.lnglat)return;
      best=Math.min(best,haversineMiles(centroid[0],centroid[1],c.lnglat[0],c.lnglat[1]));
    });
    return Number.isFinite(best)?best:null;
  }
  if(!a) return metric==="locations"||metric==="pricepoints"||metric==="d0180" ? 0 : null;
  if(metric==="locations") return a.locations;
  if(metric==="capture") return a.capture;
  if(metric==="pricepoints") return a.pricepoints;
  if(metric==="d0180") return a.d0180;
  return null;
}
function heatColorScale(metric, values){
  if(metric==="gap"){
    const palette=["#fff2a8","#ffd36c","#ff9e48","#e85a2b","#a71913"];
    return d3.scaleQuantile().domain(values.filter(Number.isFinite)).range(palette);
  }
  if(metric==="capture"){
    return d3.scaleThreshold().domain([20,40,60,80]).range(["#f0f4fa","#dce9fb","#b9d5fa","#79b0f2","#1673d9"]);
  }
  if(metric==="locations"){
    return d3.scaleThreshold().domain([1,2,3,5]).range(["#f1f2f4","#dceafa","#9dc8f6","#4997ea","#075bb5"]);
  }
  if(metric==="pricepoints"){
    return d3.scaleThreshold().domain([1,3,5,8]).range(["#f1f2f4","#e0ebfa","#a8caf2","#599ce4","#145fae"]);
  }
  if(metric==="d0180"){
    return d3.scaleThreshold().domain([1,2]).range(["#f1f2f4","#bfe7d2","#34a96d"]);
  }
}
function heatFill(metric,value,scale){
  if(metric!=="gap" && (value==null || value===0)) return "#eceeef";
  if(value==null || Number.isNaN(value)) return "#eceeef";
  return scale(value);
}
function renderHeatLegend(metric, scale, values){
  const legend=document.getElementById("heatLegend");
  let items=[];
  if(metric==="gap"){
    const qs=[0,.25,.5,.75,1].map(q=>d3.quantileSorted([...values].filter(Number.isFinite).sort(d3.ascending),q)||0);
    const colors=["#fff2a8","#ffd36c","#ff9e48","#e85a2b","#a71913"];
    items=colors.map((c,i)=>({c,label:i===0?`≤ ${Math.round(qs[1])} mi`:i===4?`≥ ${Math.round(qs[3])} mi`:`${Math.round(qs[i])}–${Math.round(qs[i+1])} mi`}));
  }else if(metric==="capture"){
    items=[["#eceeef","No verified data"],["#dce9fb","< 40%"],["#b9d5fa","40–59%"],["#79b0f2","60–79%"],["#1673d9","80–100%"]].map(([c,label])=>({c,label}));
  }else if(metric==="locations"){
    items=[["#eceeef","No clinic"],["#dceafa","1"],["#9dc8f6","2"],["#4997ea","3–4"],["#075bb5","5+"]].map(([c,label])=>({c,label}));
  }else if(metric==="pricepoints"){
    items=[["#eceeef","No prices"],["#e0ebfa","1–2"],["#a8caf2","3–4"],["#599ce4","5–7"],["#145fae","8+"]].map(([c,label])=>({c,label}));
  }else{
    items=[["#eceeef","No D0180"],["#bfe7d2","1 clinic"],["#34a96d","2+ clinics"]].map(([c,label])=>({c,label}));
  }
  const title=heatMetricMeta(metric).title;
  legend.innerHTML=`<div class="heat-legend-title">${title}</div>`+items.map(x=>`<div class="legend-item"><i class="legend-swatch" style="background:${x.c}"></i><span>${x.label}</span></div>`).join("");
}
function updateHeatSummary(metric, values){
  const a=Object.values(heatCountyAgg);
  const label=document.getElementById("heatSummaryLabel"), value=document.getElementById("heatSummaryValue"), text=document.getElementById("heatSummaryText");
  label.textContent=heatMetricMeta(metric).summary;
  if(metric==="gap"){
    const sorted=values.filter(Number.isFinite).sort(d3.ascending);
    value.textContent=Math.round(d3.quantileSorted(sorted,.5)||0).toLocaleString()+" mi";
    text.textContent="Approximate median distance from a U.S. county centroid to the nearest verified priced clinic.";
  }else if(metric==="locations"){
    value.textContent=Object.keys(heatCountyAgg).length;
    text.textContent="Counties currently containing at least one verified registry clinic.";
  }else if(metric==="capture"){
    const vals=a.map(x=>x.capture).filter(Number.isFinite);
    value.textContent=Math.round(d3.mean(vals)||0)+"%";
    text.textContent="Average five-code completeness among counties that currently have evidence.";
  }else if(metric==="pricepoints"){
    value.textContent=d3.sum(a,x=>x.pricepoints);
    text.textContent="Total verified D0150/D0180/D0210/D0274/D0330 prices captured in the live seed registry.";
  }else{
    const n=a.filter(x=>x.d0180>0).length;
    value.textContent=n;
    text.textContent="Counties with at least one verified clinic publishing D0180.";
  }
}
function renderCountyHeat(metric=heatMetric){
  if(!heatCounties.length || !heatRoot)return;
  heatMetric=metric;
  const meta=heatMetricMeta(metric);
  document.getElementById("heatMetricTitle").textContent=meta.title;
  document.getElementById("heatMetricDescription").textContent=meta.desc;
  document.getElementById("heatSectionTitle").textContent=meta.section;
  document.getElementById("heatSectionSubtitle").textContent=meta.sectionDesc;
  const values=heatCounties.map(f=>countyMetricValue(f,metric));
  const scale=heatColorScale(metric,values);

  heatRoot.selectAll("path.county")
    .data(heatCounties,d=>d.id)
    .join("path")
    .attr("class","county")
    .attr("d",heatPath)
    .attr("fill",d=>heatFill(metric,countyMetricValue(d,metric),scale))
    .on("mouseenter",function(event,d){
      const fips=String(d.id).padStart(5,"0");
      const a=heatCountyAgg[fips];
      const val=countyMetricValue(d,metric);
      const st=stateFipsToAbbr[fips.slice(0,2)]||"";
      const name=d.properties?.name||"County";
      const tooltip=document.getElementById("heatTooltip");
      tooltip.innerHTML=`<div class="county-name">${esc(name)}${name.toLowerCase().includes("county")?"":" County"}, ${st}</div>
        <div class="county-meta">FIPS ${fips}</div>
        <div class="heat-value">${formatHeatValue(metric,val)}</div>
        <div class="heat-label">${meta.title}</div>
        <div class="tooltip-grid">
          <div><b>${a?.locations||0}</b><span>verified clinics</span></div>
          <div><b>${a?Math.round(a.capture)+"%":"—"}</b><span>avg completeness</span></div>
          <div><b>${a?.pricepoints||0}</b><span>target prices</span></div>
          <div><b>${a?.d0180||0}</b><span>D0180 clinics</span></div>
        </div>`;
      tooltip.classList.add("show");
    })
    .on("mousemove",function(event){
      const stage=document.getElementById("heatStage"), r=stage.getBoundingClientRect(), tt=document.getElementById("heatTooltip");
      let x=event.clientX-r.left+16, y=event.clientY-r.top+16;
      const tw=tt.offsetWidth||230, th=tt.offsetHeight||160;
      if(x+tw>r.width-12)x=event.clientX-r.left-tw-16;
      if(y+th>r.height-12)y=event.clientY-r.top-th-16;
      tt.style.left=x+"px";tt.style.top=y+"px";
    })
    .on("mouseleave",()=>document.getElementById("heatTooltip").classList.remove("show"));

  renderHeatLegend(metric,scale,values);
  updateHeatSummary(metric,values);
}
async function initHeatmap(){
  buildCountyAggregates();
  const svg=d3.select("#countyHeatmap");
  heatSvg=svg;
  const width=1200,height=700;
  svg.attr("viewBox",`0 0 ${width} ${height}`).attr("preserveAspectRatio","xMidYMid meet");
  const projection=d3.geoAlbersUsa();
  heatPath=d3.geoPath(projection);
  heatRoot=svg.append("g");
  try{
    const us=await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json");
    heatTopo=us;
    const states=topojson.feature(us,us.objects.states);
    projection.fitExtent([[38,28],[width-38,height-28]],states);
    heatCounties=topojson.feature(us,us.objects.counties).features;
    heatStates=topojson.mesh(us,us.objects.states,(a,b)=>a!==b);

    heatRoot.append("g").attr("class","counties");
    heatRoot.append("path").datum(heatStates).attr("class","state-border").attr("d",heatPath);

    heatZoom=d3.zoom().scaleExtent([1,8]).on("zoom",e=>heatRoot.attr("transform",e.transform));
    svg.call(heatZoom).on("dblclick.zoom",null);
    document.getElementById("heatZoomIn").onclick=()=>svg.transition().duration(350).call(heatZoom.scaleBy,1.45);
    document.getElementById("heatZoomOut").onclick=()=>svg.transition().duration(350).call(heatZoom.scaleBy,1/1.45);

    document.querySelectorAll(".heat-seg").forEach(btn=>btn.addEventListener("click",()=>{
      document.querySelectorAll(".heat-seg").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      renderCountyHeat(btn.dataset.metric);
    }));
    document.getElementById("heatCountiesLive").textContent=Object.keys(heatCountyAgg).length;
    document.getElementById("heatLoading").classList.add("hidden");
    renderCountyHeat("gap");
  }catch(err){
    const load=document.getElementById("heatLoading");
    load.textContent="County map geometry could not be loaded. Check the internet connection and reopen this file.";
    console.warn("County heatmap:",err);
  }
}
