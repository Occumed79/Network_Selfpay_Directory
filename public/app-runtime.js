const clinics = window.__REGISTRY_CLINICS__ || [];
const codeNames = {
  D0150: 'Comprehensive evaluation',
  D0180: 'Comprehensive periodontal evaluation',
  D0210: 'Full-mouth series',
  D0274: '4 bitewings',
  D0330: 'Panoramic radiograph',
};
const allStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];
const liveStates = new Set(clinics.map((c) => c.state));
const targetCodes = Object.keys(codeNames);
const stats = Object.fromEntries(targetCodes.map((code) => {
  const values = clinics.map((c) => c.prices?.[code]).filter((v) => v != null).map(Number);
  return [code, {
    count: values.length,
    avg: values.length ? Math.round((values.reduce((a,b) => a+b, 0) / values.length) * 100) / 100 : null,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
  }];
}));

let currentMapCode = 'ALL', map = null, mapMarkers = [];
const clinicCountyFips = {};
clinics.forEach((c) => {
  const fips = c.county_fips || c.countyFips;
  if (fips) clinicCountyFips[c.id] = String(fips).padStart(5, '0');
});
const stateFipsToAbbr = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL','13':'GA',
  '15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD','25':'MA',
  '26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY',
  '37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD','47':'TN','48':'TX',
  '49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY','60':'AS','66':'GU','69':'MP','72':'PR','78':'VI'
};
let registryFilter = 'all', search = '';
function money(v){ return v == null ? '—' : '$' + Number(v).toLocaleString(undefined,{maximumFractionDigits:2}); }
function esc(s){ return String(s ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

let heatTopo = null, heatCounties = [], heatStates = null, heatMetric = 'gap';
let heatSvg = null, heatRoot = null, heatPath = null, heatZoom = null, heatCountyAgg = {};

(function syncLiveMetrics(){
  const locs = clinics.length;
  const states = new Set(clinics.map((c) => c.state)).size;
  const pricePoints = clinics.reduce((n,c) => n + Number(c.pricePoints || Object.values(c.prices || {}).filter((v) => v != null).length), 0);
  const avgCov = locs ? Math.round(clinics.reduce((n,c) => n + Number(c.coverage || 0), 0) / locs) : 0;
  const d0180 = clinics.filter((c) => c.prices?.D0180 != null).length;
  const counters = document.querySelectorAll('.metric [data-count]');
  if (counters[0]) counters[0].dataset.count = locs;
  if (counters[1]) counters[1].dataset.count = states;
  if (counters[2]) counters[2].dataset.count = pricePoints;
  if (counters[3]) counters[3].dataset.count = avgCov;
  const footprint = document.querySelector('.panel-a .panel-number');
  if (footprint) footprint.innerHTML = `${states} <span style="font-size:16px;color:var(--muted);font-weight:650">states live</span>`;
  const evidence = document.querySelector('.panel-c .panel-number');
  if (evidence) evidence.textContent = `${avgCov}%`;
  const ids = {mapLoc:locs,mapStates:states,mapCov:`${avgCov}%`,map180:d0180};
  Object.entries(ids).forEach(([id,value]) => { const el=document.getElementById(id); if(el) el.textContent=value; });
  const heatStats = document.querySelectorAll('.heat-foot .mapmetric strong');
  if (heatStats[1]) heatStats[1].textContent = locs;
  if (heatStats[2]) heatStats[2].textContent = states;
  if (heatStats[3]) heatStats[3].textContent = d0180;
})();
