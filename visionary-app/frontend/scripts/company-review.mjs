/* F-12 (Product + Content Engineers): company & information pages review.
 * Captures the company/informational page set at desktop + mobile, verifies
 * images/doors/anchors/headings, and extracts the heading/copy structure per
 * page for the content-honesty review (claims vs the product's recorded
 * boundaries). No API interception; public surfaces only.
 * Env: CO_BASE_URL (default http://127.0.0.1:4198), CO_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.CO_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.resolve(productRoot, process.env.CO_EVIDENCE_DIR || 'docs/visionary/baseline/f12-company-2026-11-06');
await fs.mkdir(evidence, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const ROUTES = new Set(['/dashboard', '/dashboard/privacy', '/dashboard/personalization', '/dashboard/settings', '/dashboard/subscription', '/dashboard/home', '/', '/signin', '/login', '/register', '/forgot-password', '/forgot-user-id', '/reset-password', '/student', '/teacher', '/parent', '/help', '/professional', '/how-it-works', '/organization', '/download', '/about', '/pricing', '/careers', '/research', '/community', '/contact', '/partners', '/updates', '/referral', '/safety', '/privacy', '/terms', '/security', '/accessibility', '/cookies', '/onboarding']);

const PAGES = [['/about', 'about'], ['/careers', 'careers'], ['/research', 'research'], ['/community', 'community'], ['/contact', 'contact'], ['/partners', 'partners'], ['/updates', 'updates'], ['/privacy', 'privacy'], ['/terms', 'terms'], ['/safety', 'safety'], ['/security', 'security'], ['/accessibility', 'accessibility'], ['/cookies', 'cookies'], ['/referral', 'referral'], ['/download', 'download']];

const records = [];
const defects = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

const settle = async (page, ms = 2000) => {
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForFunction(() => document.readyState === 'complete' && (document.querySelector('h1, h2') || document.body.innerText.length > 200), { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(ms);
};

for (const size of [['desktop', 1440, 900, true], ['mobile', 390, 844, false]]) {
  const context = await browser.newContext({ viewport: { width: size[1], height: size[2] } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 150)));
  for (const [route, name] of PAGES) {
    await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
    await settle(page);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 220)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(700);
    const facts = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')];
      const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => (i.getAttribute('src') || '').slice(0, 60));
      const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h && h.startsWith('/')).map((h) => h.split('#')[0]);
      const headings = [...document.querySelectorAll('h2,h3')].filter((h) => h.offsetParent !== null).map((h) => (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70)).slice(0, 14);
      const buttons = [...document.querySelectorAll('button')].filter((b) => b.offsetParent !== null).map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)).filter(Boolean).slice(0, 10);
      const forms = [...document.querySelectorAll('form')].length;
      return {
        h1: (document.querySelector('h1')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70) || null,
        sections: document.querySelectorAll('section').length,
        images: { total: imgs.length, broken },
        internalLinks: [...new Set(links)],
        headings, buttons, forms,
      };
    });
    const deadDoors = [...new Set(facts.internalLinks)].filter((h) => !ROUTES.has(h));
    if (deadDoors.length) defects.push(`${route} @ ${size[0]}: doors not in route table — ${JSON.stringify(deadDoors)}`);
    if (facts.images.broken.length) defects.push(`${route} @ ${size[0]}: broken images — ${JSON.stringify(facts.images.broken)}`);
    if (size[0] === 'desktop' && !facts.h1) defects.push(`${route}: no h1 at desktop`);
    await page.screenshot({ path: path.join(evidence, `company-${name}-${size[0]}${size[3] ? '-full' : ''}.png`), fullPage: size[3] });
    records.push({ page: route, viewport: `${size[1]}x${size[2]}`, ...facts, deadDoors, errors });
  }
  await context.close();
}
await browser.close();

const receipt = { task: 'F-12 company & information pages review', at: new Date().toISOString(), base, records, defects };
await fs.writeFile(path.join(evidence, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`Records: ${records.length}; evidence -> ${path.relative(productRoot, evidence)}`);
if (defects.length) {
  console.log(`DEFECTS ${defects.length}:`);
  for (const defect of defects.slice(0, 12)) console.log(` - ${defect}`);
  process.exit(1);
}
console.log('PASS company review: headings render, images load, all doors resolve.');
