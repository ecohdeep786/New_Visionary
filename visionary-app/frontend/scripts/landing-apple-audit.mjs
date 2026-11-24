import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.LANDING_AUDIT_URL || 'http://127.0.0.1:5199';
const outRoot = process.env.LANDING_AUDIT_DIR || fileURLToPath(new URL('../../../shots/apple-pass-2026-11-24/before/', import.meta.url));
await mkdir(outRoot, { recursive: true });

const viewports = [
  { name: 'phone-320', width: 320, height: 568 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'phone-land-844', width: 844, height: 390 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-834', width: 834, height: 1112 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const receipt = { base, generatedAt: new Date().toISOString(), viewports: [], textScale: [], console: [], failedRequests: [] };

async function open(width, height, { reducedMotion = 'reduce', scale = null } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', r => {
    const reason = r.failure()?.errorText || '';
    if (!/abort|cancel|NS_BINDING_ABORTED|Frame load interrupted/i.test(reason)) {
      receipt.failedRequests.push({ url: r.url(), reason });
    }
  });
  await page.route('**/api/auth/me*', route => route.fulfill({ status: 401, json: { error: 'audit' } }));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.locator('.home-hero h1').waitFor();
  await page.evaluate(() => document.fonts.ready);
  if (scale) {
    await page.evaluate(s => { document.documentElement.style.fontSize = s; }, scale);
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(500);
  return { page, errors };
}

const measure = async page => page.evaluate(() => {
  const rect = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), left: +r.left.toFixed(1), right: +r.right.toFixed(1), width: +r.width.toFixed(1), height: +r.height.toFixed(1) }; };
  const style = el => { if (!el) return null; const s = getComputedStyle(el); return { fontSize: s.fontSize, lineHeight: s.lineHeight, fontWeight: s.fontWeight, letterSpacing: s.letterSpacing, color: s.color, textAlign: s.textAlign, maxWidth: s.maxWidth }; };
  const hero = document.querySelector('.home-hero');
  const sections = [...document.querySelectorAll('main > section')].map((el, i) => ({
    i, id: el.id || null, section: el.dataset.section || null, ...rect(el),
    bg: getComputedStyle(el).backgroundColor,
    h2: el.querySelector('h2')?.innerText.replace(/\s+/g, ' ').slice(0, 140) || null,
  }));
  const images = [...document.querySelectorAll('.home-hero img, main section img')].map(img => {
    const r = img.getBoundingClientRect();
    return { src: img.currentSrc.split('/').slice(-1)[0], alt: img.alt, natural: [img.naturalWidth, img.naturalHeight], box: rect(img), objectFit: getComputedStyle(img).objectFit };
  });
  return {
    viewport: [innerWidth, innerHeight],
    scrollHeight: document.documentElement.scrollHeight,
    scrollWidth: document.documentElement.scrollWidth,
    hero: rect(hero),
    heroCopy: rect(document.querySelector('.home-hero-copy')),
    heroStage: rect(document.querySelector('.family-stage')),
    caption: rect(document.querySelector('.cast-caption')),
    h1: { text: document.querySelector('.home-hero h1')?.innerText.replace(/\s+/g, ' '), ...style(document.querySelector('.home-hero h1')) },
    h1Box: rect(document.querySelector('.home-hero h1')),
    sub: { text: document.querySelector('.home-hero-copy p')?.innerText, ...style(document.querySelector('.home-hero-copy p')) },
    sections,
    images,
    heroNextGap: sections[1] ? sections[1].top - innerHeight : null,
    firstSectionAfterHeroVisible: !!sections[1] && sections[1].top < innerHeight - 1,
    overflowX: document.documentElement.scrollWidth - innerWidth,
    nav: rect(document.querySelector('[data-public-nav-bar]')),
  };
});

for (const vp of viewports) {
  const { page, errors } = await open(vp.width, vp.height);
  const m = await measure(page);
  const dir = path.join(outRoot, vp.name);
  await mkdir(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, 'viewport.png') });
  await page.screenshot({ path: path.join(dir, 'full.png'), fullPage: true });
  for (const sec of m.sections) {
    if (!sec.section) continue;
    const el = page.locator(`[data-section="${sec.section}"]`);
    try { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(150); await el.screenshot({ path: path.join(dir, `${sec.section}.png`) }); } catch {}
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  receipt.viewports.push({ ...vp, ...m, errors });
  console.log(vp.name, 'hero', m.hero?.height, 'nextVisible', m.firstSectionAfterHeroVisible, 'gap', m.heroNextGap, 'overflow', m.overflowX, 'docH', m.scrollHeight, 'errors', errors.length);
  await page.close();
}

for (const vp of [{ name: 'scale-390', width: 390, height: 844 }, { name: 'scale-1280', width: 1280, height: 800 }]) {
  const { page, errors } = await open(vp.width, vp.height, { scale: '200%' });
  const m = await measure(page);
  const clipped = await page.evaluate(() => {
    const elements = document.querySelectorAll('main h1, main h2, main h3, main p, main a, main button, .destination-copy, .cast-active');
    return [...elements].flatMap(element => {
      const scroller = element.closest('.path-row, .trust-row');
      if (scroller && scroller.scrollWidth > scroller.clientWidth + 1) return [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const out = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent.trim() || getComputedStyle(node.parentElement).visibility === 'hidden') continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        if ([...range.getClientRects()].some(rect => rect.left < -1 || rect.right > innerWidth + 1)) out.push(node.textContent.trim().slice(0, 80));
      }
      return out;
    });
  });
  const dir = path.join(outRoot, vp.name);
  await mkdir(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, 'viewport.png') });
  await page.screenshot({ path: path.join(dir, 'full.png'), fullPage: true });
  receipt.textScale.push({ ...vp, ...m, clipped, errors });
  console.log(vp.name, 'overflow', m.overflowX, 'clipped', clipped.length, 'docH', m.scrollHeight);
  await page.close();
}

await browser.close();
await writeFile(path.join(outRoot, 'receipt.json'), JSON.stringify(receipt, null, 2));
console.log('wrote', path.join(outRoot, 'receipt.json'));
