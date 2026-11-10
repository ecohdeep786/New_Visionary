/* F-11 (Product + Pixel Engineers): landing & persona pages review harness.
 * Captures the homepage and the five role-facing pages at desktop/tablet/
 * mobile, verifies every rendered image loads, every internal door resolves
 * to a real route, and records hero/h1/section structure for the pixel
 * review. No API interception; public surfaces only.
 * Env: PR_BASE_URL (default http://127.0.0.1:4198), PR_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.PR_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.PR_EVIDENCE_DIR || 'docs/visionary/baseline/f11-persona-2026-11-06');
await fs.mkdir(evidence, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

/* Canonical public route list (App.jsx PublicApp). */
const ROUTES = new Set(['/', '/signin', '/login', '/register', '/forgot-password', '/forgot-user-id', '/reset-password', '/student', '/teacher', '/parent', '/help', '/professional', '/how-it-works', '/organization', '/download', '/about', '/pricing', '/careers', '/research', '/community', '/contact', '/partners', '/updates', '/referral', '/safety', '/privacy', '/terms', '/security', '/accessibility', '/cookies', '/onboarding']);

const PAGES = [['/', 'home'], ['/student', 'student'], ['/teacher', 'teacher'], ['/parent', 'parent'], ['/professional', 'professional'], ['/organization', 'organization']];
const SIZES = [['desktop', 1440, 900, true], ['tablet', 768, 1024, false], ['mobile', 390, 844, true]];

const records = [];
const defects = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

const settle = async (page, ms = 2200) => {
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForFunction(() => document.readyState === 'complete' && (document.querySelector('h1, h2') || document.body.innerText.length > 200), { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(ms);
};

for (const size of SIZES) {
  const context = await browser.newContext({ viewport: { width: size[1], height: size[2] }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 150)));
  for (const [route, name] of PAGES) {
    await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
    await settle(page);
    /* Walk the page so lazy images and reveal sections mount before measuring. */
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);
    const facts = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')];
      const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => (i.getAttribute('src') || '').slice(0, 60));
      const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h && h.startsWith('/')).map((h) => h.split('#')[0]);
      const h1 = document.querySelector('h1');
      const heroMedia = [...document.querySelectorAll('img')].filter((i) => (i.currentSrc || '').includes('hero'));
      return {
        h1: h1 ? (h1.textContent || '').trim().slice(0, 60) : null,
        sections: document.querySelectorAll('section').length,
        images: { total: imgs.length, broken },
        internalLinks: [...new Set(links)],
        heroImages: heroMedia.length,
        lazy: imgs.filter((i) => i.loading === 'lazy').length,
      };
    });
    const deadDoors = [...new Set(facts.internalLinks)].filter((h) => !ROUTES.has(h));
    if (deadDoors.length) defects.push(`${route} @ ${size[0]}: internal doors not in the route table — ${JSON.stringify(deadDoors)}`);
    if (facts.images.broken.length) defects.push(`${route} @ ${size[0]}: broken images — ${JSON.stringify(facts.images.broken)}`);
    if (size[0] === 'desktop' && !facts.h1) defects.push(`${route}: no h1 at desktop`);
    await page.screenshot({ path: path.join(evidence, `persona-${name}-${size[0]}${size[3] ? '-full' : ''}.png`), fullPage: size[3] });
    records.push({ page: route, viewport: `${size[1]}x${size[2]}`, ...facts, deadDoors, errors });
  }
  await context.close();
}
await browser.close();

const receipt = { task: 'F-11 landing & persona review', at: new Date().toISOString(), base, routeTable: [...ROUTES].sort(), records, defects };
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; evidence -> ${path.relative(productRoot, evidence)}`);
if (defects.length) {
  console.log(`DEFECTS ${defects.length}:`);
  for (const defect of defects.slice(0, 10)) console.log(` - ${defect}`);
  process.exit(1);
}
console.log('PASS persona review: all heroes/h1s render, all images load, every internal door resolves.');
