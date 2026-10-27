/* D3 LCP lab — the exact script run inside the page under measurement.
 * Installed AFTER a cold navigation to the proxied URL; PerformanceObserver
 * with `buffered: true` replays LCP/FCP/CLS entries the page already painted.
 * Returns one JSON line — the harness (browser.evaluate) copies it verbatim
 * into the receipt files.
 */
export default `(() => {
  const nav = performance.getEntriesByType("navigation")[0] || {};
  const paint = performance.getEntriesByType("paint");
  const fcp = (paint.find((p) => p.name === "first-contentful-paint") || {}).startTime;

  return new Promise((resolve) => {
    let lcpEntries = [];
    let clsTotal = 0;
    try {
      new PerformanceObserver((list) => {
        lcpEntries = lcpEntries.concat(list.getEntries().map((e) => ({
          startTime: Math.round(e.startTime),
          url: e.url,
          element: (e.element && e.element.tagName) || null,
          elementSnippet: e.element && e.element.src ? String(e.element.src).split("/").slice(-2).join("/") : (e.element && e.element.textContent ? String(e.element.textContent).trim().slice(0, 60) : null),
          size: e.size,
          id: (e.element && e.element.getAttribute && e.element.getAttribute("data-section")) || (e.element && e.element.closest && e.element.closest("[data-section]") ? e.element.closest("[data-section]").getAttribute("data-section") : null) || null,
        })));
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (!e.hadRecentInput) clsTotal += e.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch (err) {
      resolve(JSON.stringify({ error: String(err) }));
      return;
    }
    // settle: buffered entries are complete once observers install; a short
    // delay lets late paint/ls entries settle on an idle page
    setTimeout(() => {
      const resources = performance.getEntriesByType("resource");
      const imgs = resources
        .filter((r) => r.initiatorType === "img" || /\.webp|\.avif/.test(r.name))
        .map((r) => ({
          file: String(r.name).split("/").slice(-2).join("/"),
          transferSize: r.transferSize,
          duration: Math.round(r.duration),
          start: Math.round(r.startTime),
        }))
        .sort((a, b) => a.start - b.start);
      const js = resources
        .filter((r) => /\.js/.test(r.name))
        .map((r) => ({ transferSize: r.transferSize, file: String(r.name).split("/").slice(-2).join("/") }));
      const jsBytes = js.reduce((a, r) => a + (r.transferSize || 0), 0);
      resolve(JSON.stringify({
        viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
        ttfbMs: nav.responseStart ? Math.round(nav.responseStart - nav.startTime) : null,
        domContentLoadedMs: nav.domContentLoadedEventEnd ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
        fcpMs: fcp ? Math.round(fcp) : null,
        lcpEntries,
        finalLcpMs: lcpEntries.length ? Math.round(lcpEntries[lcpEntries.length - 1].startTime) : null,
        finalLcp: lcpEntries.length ? lcpEntries[lcpEntries.length - 1] : null,
        cls: Math.round(clsTotal * 1000) / 1000,
        imageResources: imgs,
        jsTransferBytes: jsBytes,
        jsResources: js.length,
      }));
    }, Math.max(nav.domContentLoadedEventEnd - nav.startTime + 1500, 2000));
  });
})()`;
