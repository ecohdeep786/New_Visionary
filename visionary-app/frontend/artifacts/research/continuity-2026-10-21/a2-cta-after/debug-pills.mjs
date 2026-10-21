import { chromium } from 'playwright-core';

const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://127.0.0.1:5182/download', { waitUntil: 'load', timeout: 20000 });
await p.waitForTimeout(1200);
const res = await p.evaluate(() => [...document.querySelectorAll('a,button')]
  .filter(el => {
    const s = getComputedStyle(el);
    return s.backgroundColor !== 'rgba(0, 0, 0, 0)' && parseInt(s.borderRadius) >= 900 && el.getBoundingClientRect().height >= 40 && el.offsetParent;
  })
  .slice(0, 12)
  .map(el => {
    const s = getComputedStyle(el);
    return {
      text: (el.innerText || '').trim().slice(0, 20),
      fw: s.fontWeight, ls: s.letterSpacing, fs: s.fontSize,
      cls: (el.className.match(/(tracking|font)-\S+/g) || []).join(' '),
      tmpl: (el.className.match(/text-\[\S+?\]/g) || []).join(' '),
    };
  }));
console.log(JSON.stringify(res, null, 1));
await b.close();
