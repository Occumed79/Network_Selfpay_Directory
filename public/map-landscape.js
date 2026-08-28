(function applyLandscapeMapStyle(){
  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    try{
      if(typeof map!=='undefined' && map && typeof map.setStyle==='function' && maptilersdk?.MapStyle?.LANDSCAPE){
        map.setStyle(maptilersdk.MapStyle.LANDSCAPE);
        const label=document.querySelector('#mapSection .map-head p');
        if(label) label.textContent='MapTiler Landscape · click a marker for prices and evidence.';
        clearInterval(timer);
      }else if(tries>120){
        clearInterval(timer);
      }
    }catch(err){
      if(tries>120) clearInterval(timer);
    }
  },150);
})();
