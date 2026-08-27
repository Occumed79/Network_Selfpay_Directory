(async () => {
  let useNeon = false;
  try {
    const response = await fetch('/api/clinics', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Clinic API returned ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.clinics) || !payload.clinics.length) throw new Error('Clinic API returned no records');
    window.__REGISTRY_CLINICS__ = payload.clinics;
    useNeon = true;
  } catch (error) {
    console.warn('Neon registry unavailable; using embedded fallback seed.', error);
  }

  const scripts = [useNeon ? '/app-runtime.js' : '/app-data.js', '/app-heatmap.js', '/app-ui.js'];
  for (const src of scripts) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }
})().catch((error) => console.error('Registry bootstrap error:', error));
