import { chromium } from 'playwright-core';
const ROUTES=['/','/about','/student','/teacher','/parent','/professional','/organization','/how-it-works','/pricing','/download','/careers','/contact','/partners','/updates','/referral','/research','/community','/help','/safety','/privacy','/terms','/security','/accessibility','/cookies'];
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width:1440,height:1000}, reducedMotion:'reduce' });
const p = await c.newPage();
const rows=[];
for (const r of ROUTES) {
  try {
    await p.goto('http://127.0.0.1:4197'+r, { waitUntil:'domcontentloaded', timeout:45000 });
    await p.waitForTimeout(900);
    const m = await p.evaluate(()=>{
      const px=v=>v?Math.round(parseFloat(v)):null;
      const h1=document.querySelector('main h1');
      const h2s=[...document.querySelectorAll('main h2')];
      const label=document.querySelector('[data-type="label"]');
      const cs=el=>el?getComputedStyle(el):null;
      const h1cs=cs(h1);
      // first section-law h2: the one NOT inside a card (h3 card names are separate role)
      const h2cs=cs(h2s[0]);
      const labelcs=cs(label);
      return {
        h1: h1cs?px(h1cs.fontSize)+'/'+h1cs.fontWeight.slice(0,1):null,
        h2first: h2cs?px(h2cs.fontSize)+'/'+h2cs.fontWeight.slice(0,1):null,
        h2count: h2s.length,
        label: labelcs?px(labelcs.fontSize)+'/'+labelcs.fontWeight.slice(0,1):null,
      };
    });
    rows.push({r, ...m});
    console.log(r.padEnd(16), 'h1:', String(m.h1).padEnd(7), 'h2[0]:', String(m.h2first).padEnd(7), '(n='+m.h2count+')', 'label:', m.label);
  } catch(e) { console.log(r.padEnd(16), 'ERROR', String(e).slice(0,80)); }
}
await b.close();
