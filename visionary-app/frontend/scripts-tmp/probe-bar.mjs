/* Probe: accepted-page chapter radius/padding + sub-page hero sub styles. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// 1) student: chapter radii + padding + border-top color
await page.goto('http://localhost:5173/student', { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(800);
const student = await page.evaluate(() => {
  const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
  return Array.from(document.querySelectorAll('#main > section[data-section]')).map((s) => ({
    id: s.getAttribute('data-section'),
    pad: `${cs(s, 'padding-top')}/${cs(s, 'padding-bottom')}`,
    radius: cs(s, 'border-top-left-radius'),
    bt: `${cs(s, 'border-top-width')} ${cs(s, 'border-top-color')}`,
    bg: cs(s, 'background-color'),
  }));
});
console.log('== student chapters');
console.log(JSON.stringify(student, null, 1));

// 2) sub-page heroes: h1 + following sub
for (const route of ['/download', '/about', '/careers', '/pricing', '/research', '/community']) {
  await page.goto(`http://localhost:5173${route}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(600);
  const hero = await page.evaluate(() => {
    const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
    const h1 = document.querySelector('#main h1');
    if (!h1) return null;
    // first p after h1 in document order with visible text
    const all = Array.from(document.querySelectorAll('#main p'));
    const sub = all.find((p) => p.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_PRECEDING || h1.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING);
    const rect = h1.getBoundingClientRect();
    const sr = sub?.getBoundingClientRect();
    return {
      h1: `${cs(h1, 'font-size')}/${cs(h1, 'font-weight')}/${cs(h1, 'line-height')} ls=${cs(h1, 'letter-spacing')} cls=${(h1.className || '').toString().slice(0, 70)}`,
      h1w: Math.round(rect.width),
      sub: sub ? `${cs(sub, 'font-size')}/${cs(sub, 'font-weight')}/${cs(sub, 'line-height')} color=${cs(sub, 'color')} "${(sub.textContent || '').trim().slice(0, 40)}"` : '(none)',
      gap: sr && rect ? Math.round(sr.top - rect.bottom) : null,
    };
  });
  console.log(`== ${route}`, JSON.stringify(hero));
}
await browser.close();
