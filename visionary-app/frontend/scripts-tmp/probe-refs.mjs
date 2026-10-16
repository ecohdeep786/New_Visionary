/* Probe: reference renders on approved pages + heavy-text inventory per page. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const out = [];
for (const url of ['/how-it-works', '/download', '/about']) {
  await page.goto('http://localhost:5173' + url, { waitUntil: 'load', timeout: 90000 });
  await page.waitForSelector('#main h1', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(600);
  const data = await page.evaluate(() => {
    const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
    const secOf = (el) => { let n = el; while (n && n.tagName !== 'SECTION') n = n.parentElement; return n ? (n.dataset.section || n.id || '(sec)') : '(none)'; };
    const heavy = Array.from(document.querySelectorAll('#main p')).filter((el) => parseFloat(cs(el, 'font-size')) >= 19).map((el) => ({ sec: secOf(el), fs: cs(el, 'font-size'), fw: cs(el, 'font-weight'), lh: cs(el, 'line-height'), txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 46) }));
    const all = Array.from(document.querySelectorAll('#main *'));
    const find = (t, sel = '*') => all.find((el) => el.matches(sel) && (el.textContent || '').replace(/\s+/g, ' ').trim().startsWith(t));
    const dump = (label, el) => el && { label, fs: cs(el, 'font-size'), fw: cs(el, 'font-weight'), lh: cs(el, 'line-height'), color: cs(el, 'color'), bg: cs(el, 'background-color'), radius: cs(el, 'border-radius'), h: Math.round(el.getBoundingClientRect().height), txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 36) };
    const fine = Array.from(document.querySelectorAll('#main p')).find((el) => /Free to start|No install, no waiting|Upgrade only/.test(el.textContent || ''));
    const refs = [
      dump('fineprint', fine),
      dump('cta-link', find('See pricing')),
      dump('cta-pill', find('Get started')),
      dump('platform-pill', find('Open in browser')),
      dump('pill-fill', document.querySelector('main .rounded-full[class*="121317"]')),
    ].filter(Boolean);
    return { heavy: heavy.slice(0, 14), refs };
  });
  out.push({ url, ...data });
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
