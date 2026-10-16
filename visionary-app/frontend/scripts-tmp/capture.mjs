/* Capture a URL at given widths: full-page screenshot + DOM role audit.
   Usage: node scripts-tmp/capture.mjs <url> <outDir> <widths csv> <name> [shot|noshot] */
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const [url, outDir, widthsArg, name, shotArg = 'shot'] = process.argv.slice(2);
const widths = widthsArg.split(',').map(Number);
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

for (const width of widths) {
  const height = width >= 1000 ? 900 : width >= 700 ? 1024 : 844;
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });

  // Scroll through to trigger lazy loading, then return to top.
  await page.evaluate(async () => {
    const step = Math.max(400, Math.floor(innerHeight * 0.8));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 600));
    scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
  await page.waitForLoadState('networkidle').catch(() => {});

  if (shotArg === 'shot') {
    await page.screenshot({ path: path.join(outDir, `${name}-${width}-full.jpg`), fullPage: true, type: 'jpeg', quality: 70, animations: 'disabled' }).catch(async (e) => {
      console.log(`full shot failed ${name} @${width}: ${e.message}; falling back to viewport shots`);
      const total = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0, i = 0; y < total; y += height, i++) {
        await page.evaluate((yy) => scrollTo(0, yy), y);
        await new Promise((r) => setTimeout(r, 250));
        await page.screenshot({ path: path.join(outDir, `${name}-${width}-seg${String(i).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 70 });
      }
    });
  }

  const audit = await page.evaluate(() => {
    const pick = (el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().replace(/\s+/g, ' ').slice(0, 90),
        text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 110),
        fs: Math.round(parseFloat(cs.fontSize) * 10) / 10,
        fw: cs.fontWeight,
        lh: Math.round(parseFloat(cs.lineHeight) * 10) / 10,
        ls: Math.round(parseFloat(cs.letterSpacing) * 100) / 100,
        color: cs.color,
        x: Math.round(r.x),
        y: Math.round(r.y + scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    };
    const nodes = [];
    document.querySelectorAll('h1,h2,h3').forEach((el) => nodes.push({ kind: 'heading', ...pick(el) }));
    document.querySelectorAll('main > section, section[data-section], [data-section]').forEach((el) => nodes.push({ kind: 'section', ...pick(el) }));
    return { title: document.title, url: location.href, scrollHeight: document.body.scrollHeight, nodes };
  });
  await fs.writeFile(path.join(outDir, `${name}-${width}-audit.json`), JSON.stringify(audit, null, 1));
  await context.close();
  console.log(`${name} @${width} done`);
}
await browser.close();
