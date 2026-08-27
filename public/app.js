(async () => {
  const scripts = ['/app-data.js', '/app-heatmap.js', '/app-ui.js'];
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
