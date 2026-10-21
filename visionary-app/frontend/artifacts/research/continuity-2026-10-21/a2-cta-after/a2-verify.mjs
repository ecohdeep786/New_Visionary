/**
 * A2 CTA-law verification (FAP-42) — targeted after-captures + full pill-anatomy probes.
 * Surfaces: /download, /pricing. Probe asserts EVERY interactive filled pill/button/link:
 * h=44, fs=17px, radius=980, padding-x=21, tracking=-0.011em(→~0.19px), weight 500 (fills),
 * law inks (#1d1d1f/#272729/#18181a or alpha secondary), focus ring #0066cc, link #0066cc.
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5182';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)));
const ROUTES = ['/download', '/pricing', '/signin'];
const WIDTHS = [1440, 1024, 390];

const LAW = { inkRest: 'rgb(29, 29, 31)', inkHover: 'rgb(39, 39, 41)', inkActive: 'rgb(24, 24, 26)', focus: 'rgb(0, 102, 204)', link: 'rgb(0, 102, 204)' };

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const captures = [];
const probes = {};

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const page = await context.newPage();
  for (const route of ROUTES) {
    const slug = route.slice(1);
    try {
      await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ fullPage: true, path: path.join(ROOT, `${slug}-${width}.jpeg`), type: 'jpeg', quality: 80 });
      captures.push({ route, width, status: 'ok' });
    } catch (e) {
      captures.push({ route, width, status: 'failed: ' + String(e).slice(0, 80) });
    }
    if (width === 1440) {
      probes[slug] = await page.evaluate(() => {
        const isPill = (el) => {
          const s = getComputedStyle(el);
          const r = parseInt(s.borderRadius);
          return s.backgroundColor !== 'rgba(0, 0, 0, 0)' && r >= 900 && el.getBoundingClientRect().height >= 40;
        };
        const cta = (el) => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return {
            text: (el.innerText || '').trim().slice(0, 24),
            h: Math.round(r.height), fs: s.fontSize, fw: s.fontWeight,
            radius: parseInt(s.borderRadius), px: s.paddingLeft, tracking: s.letterSpacing,
            bg: s.backgroundColor,
            ringCls: /ring-\[#0066cc\]/.test(el.className),
            full: /\bw-full\b/.test(el.className),
          };
        };
        return [...document.querySelectorAll('a,button')].filter(el => el.offsetParent && isPill(el)).slice(0, 16).map(cta);
      });
    }
  }
  await context.close();
}
await browser.close();

const bad = [];
for (const [route, pills] of Object.entries(probes)) {
  for (const p of pills) {
    const fails = [];
    if (p.h !== 44) fails.push('h=' + p.h);
    if (p.fs !== '17px') fails.push('fs=' + p.fs);
    if (p.radius < 900) fails.push('radius=' + p.radius);
    if (p.px !== '21px' && !p.full) fails.push('px=' + p.px);
    if (p.fw !== '500') fails.push('fw=' + p.fw);
    if (!p.ringCls) fails.push('focus-ring-class');
    if (fails.length) bad.push({ route, ...p, fails });
  }
}
writeFileSync(path.join(ROOT, 'a2-probe.json'), JSON.stringify({ probedAt: new Date().toISOString(), lawsChecked: probes, violations: bad, captures }, null, 2));
console.log('CAPTURES ' + captures.filter(c => c.status === 'ok').length + '/' + captures.length);
console.log('VIOLATIONS ' + bad.length);
console.log(JSON.stringify(bad, null, 1));
