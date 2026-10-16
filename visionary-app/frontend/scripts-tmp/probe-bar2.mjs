/* Probe: persona chapter sub + control/text-link styles (the exact targets). */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/student', { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(900);
const out = await page.evaluate(() => {
  const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
  const dump = (label, el) => {
    if (!el) return { label, found: false };
    return {
      label, found: true,
      fs: cs(el, 'font-size'), fw: cs(el, 'font-weight'), lh: cs(el, 'line-height'),
      ls: cs(el, 'letter-spacing'), color: cs(el, 'color'),
      cls: (el.className || '').toString().slice(0, 100),
      txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
    };
  };
  const inSection = (id) => document.querySelector(`#main section[data-section="${id}"]`);
  const s07 = inSection('07-language');
  const s10 = inSection('10-journey-flow');
  const s11 = inSection('11-trust');
  const rows = [];
  if (s07) {
    rows.push(dump('07 eyebrow', s07.querySelector('p')));
    rows.push(dump('07 h2', s07.querySelector('h2')));
    rows.push(dump('07 sub', s07.querySelectorAll('p')[2] || s07.querySelectorAll('p')[1]));
    rows.push(dump('07 link', s07.querySelector('a')));
  }
  if (s10) {
    rows.push(dump('10 h2', s10.querySelector('h2')));
    const ps = s10.querySelectorAll('p');
    rows.push(dump('10 sub', ps[0]));
  }
  if (s11) {
    rows.push(dump('11 h2', s11.querySelector('h2')));
    rows.push(dump('11 sub', s11.querySelectorAll('p')[0]));
    rows.push(dump('11 link', s11.querySelector('a')));
    const cards = s11.querySelectorAll('[data-card]');
    rows.push({ label: '11 data-cards', count: cards.length, radius: cards[0] ? cs(cards[0], 'border-radius') : null, bg: cards[0] ? cs(cards[0], 'background-color') : null, border: cards[0] ? cs(cards[0], 'border-top-width') : null });
  }
  // CTA button
  const s12 = inSection('12-cta');
  if (s12) {
    rows.push(dump('12 h2', s12.querySelector('h2')));
    rows.push(dump('12 sub', s12.querySelector('p')));
    rows.push(dump('12 primary', s12.querySelector('a')));
    rows.push(dump('12 link', s12.querySelectorAll('a')[1]));
  }
  return rows;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
