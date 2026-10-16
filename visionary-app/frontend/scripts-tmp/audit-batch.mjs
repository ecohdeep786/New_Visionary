/* Batch audit of remaining public pages.
   Visits each route, scrolls to load lazy media, then dumps a JSON report:
   - document metrics + overflow
   - failed requests / broken images
   - h1/h2/h3 inventory with computed type metrics
   - main > section anatomy (paddings, grounds, borders)
   Usage: node scripts-tmp/audit-batch.mjs [outDir] [width] */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const outDir = process.argv[2] || 'artifacts/research/remaining-pages-audit-2026-10-16/dom';
const width = Number(process.argv[3] || 1440);
const height = Number(process.argv[4] || 900);

const ROUTES = [
  ['how-it-works', '/how-it-works'],
  ['pricing', '/pricing'],
  ['download', '/download'],
  ['about', '/about'],
  ['careers', '/careers'],
  ['research', '/research'],
  ['community', '/community'],
  ['contact', '/contact'],
  ['partners', '/partners'],
  ['updates', '/updates'],
  ['referral', '/referral'],
  ['safety', '/safety'],
  ['privacy', '/privacy'],
  ['security', '/security'],
  ['terms', '/terms'],
  ['accessibility', '/accessibility'],
  ['cookies', '/cookies'],
];

await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width, height } });

const summaryLines = [];

for (const [slug, route] of ROUTES) {
  const failed = [];
  const consoleErrors = [];
  const onResponse = (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); };
  const onConsole = (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); };
  page.on('response', onResponse);
  page.on('console', onConsole);

  try {
    await page.goto(`http://localhost:5173${route}`, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(900);
    await page.evaluate(async () => {
      const step = Math.max(400, Math.floor(innerHeight * 0.8));
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 110));
      }
      scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 500));
    });
    await page.waitForLoadState('networkidle').catch(() => {});

    const report = await page.evaluate(() => {
      const cs = (el, prop) => getComputedStyle(el).getPropertyValue(prop);
      const txt = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      const sectionOf = (el) => {
        const s = el.closest('section');
        if (!s) return '(no section)';
        return s.getAttribute('data-section') || s.id || `section@${Math.round(s.getBoundingClientRect().top + scrollY)}`;
      };
      const headings = [];
      const seen = new Set();
      document.querySelectorAll('#main h1, #main h2, #main h3').forEach((el) => {
        const key = `${el.tagName}|${txt(el)}`;
        if (seen.has(key)) return;
        seen.add(key);
        const r = el.getBoundingClientRect();
        headings.push({
          tag: el.tagName.toLowerCase(),
          sec: sectionOf(el),
          text: txt(el),
          cls: (el.className || '').toString().slice(0, 120),
          fs: cs(el, 'font-size'), lh: cs(el, 'line-height'), fw: cs(el, 'font-weight'),
          ls: cs(el, 'letter-spacing'), tt: cs(el, 'text-transform'), color: cs(el, 'color'),
          w: Math.round(r.width),
        });
      });
      const imgs = [];
      document.querySelectorAll('#main img, #main .lazy-placeholder').forEach((el) => {
        const broken = el.tagName === 'IMG' && (el.naturalWidth === 0 || !el.complete);
        const r = el.getBoundingClientRect();
        imgs.push({
          broken, tag: el.tagName.toLowerCase(), sec: sectionOf(el),
          src: (el.currentSrc || el.getAttribute?.('src') || '(placeholder div)').split('/').pop().slice(0, 60),
          nat: el.tagName === 'IMG' ? `${el.naturalWidth}x${el.naturalHeight}` : null,
          rect: `${Math.round(r.width)}x${Math.round(r.height)}`,
          ratio: r.height ? (r.width / r.height).toFixed(2) : null,
        });
      });
      const sections = [];
      document.querySelectorAll('#main > section, #main > div > section').forEach((s, i) => {
        const r = s.getBoundingClientRect();
        sections.push({
          i,
          tag: s.tagName.toLowerCase(),
          id: s.id || null,
          dataSection: s.getAttribute('data-section'),
          direct: s.parentElement?.id === 'main' || null,
          py: `${cs(s, 'padding-top')}/${cs(s, 'padding-bottom')}`,
          bg: cs(s, 'background-color'),
          borderTop: cs(s, 'border-top-width'),
          h: Math.round(r.height),
          w: Math.round(r.width),
        });
      });
      const kids = [];
      document.querySelector('#main')?.childNodes.forEach((n) => {
        if (n.nodeType === 1) kids.push(`${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${n.className && typeof n.className === 'string' ? '.' + n.className.split(' ').slice(0, 3).join('.') : ''}`);
      });
      return {
        title: document.title,
        docH: document.body.scrollHeight,
        overflowX: document.documentElement.scrollWidth - innerWidth,
        headings, imgs, sections, kids,
      };
    });

    const broken = report.imgs.filter((i) => i.broken);
    const out = { route, ...report, failed: failed.slice(0, 25), consoleErrors: consoleErrors.slice(0, 10) };
    await fs.writeFile(path.join(outDir, `${slug}.json`), JSON.stringify(out, null, 1));

    const h2s = report.headings.filter((h) => h.tag === 'h2').map((h) => `${h.fs.replace('px', '')}`).join(',');
    const h3s = report.headings.filter((h) => h.tag === 'h3').map((h) => `${h.fs.replace('px', '')}`).join(',');
    summaryLines.push(
      `── ${slug} (${route}) · H=${report.docH}px · secs=${report.sections.length} · overflowX=${report.overflowX}px\n` +
      `   h2 sizes: [${h2s}]  h3 sizes: [${h3s}]\n` +
      `   imgs=${report.imgs.length} broken=${broken.length}${broken.length ? ' → ' + broken.map((b) => b.src).join(' | ') : ''}\n` +
      `   failed=${failed.length}${failed.length ? ' → ' + failed.slice(0, 5).join(' | ') : ''} consoleErr=${consoleErrors.length}`
    );
  } catch (err) {
    summaryLines.push(`── ${slug} (${route}) · ERROR: ${err.message.slice(0, 160)}`);
  }
  page.removeListener('response', onResponse);
  page.removeListener('console', onConsole);
}

await fs.writeFile(path.join(outDir, '_summary.txt'), summaryLines.join('\n'));
console.log(summaryLines.join('\n'));
await browser.close();
