import { chromium } from 'playwright-core';

const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://127.0.0.1:5182/download', { waitUntil: 'load', timeout: 20000 });
await p.waitForTimeout(1200);
const res = await p.evaluate(() => {
  const pill = [...document.querySelectorAll('a')].find(el => (el.innerText || '').includes('Continue on web'));
  if (!pill) return 'PILL NOT FOUND';
  const out = [];
  for (const sheet of document.styleSheets) {
    let rules = [];
    try { rules = sheet.cssRules ? [...sheet.cssRules] : []; } catch { continue; }
    for (const rule of rules) {
      if (!rule.selectorText) continue;
      if (!/letter-spacing|font-weight/.test(rule.cssText)) continue;
      try {
        if (pill.matches(rule.selectorText)) out.push({ sel: rule.selectorText, css: rule.style.cssText.slice(0, 150) });
      } catch {}
    }
  }
  return out;
});
console.log(JSON.stringify(res, null, 1));
await b.close();
