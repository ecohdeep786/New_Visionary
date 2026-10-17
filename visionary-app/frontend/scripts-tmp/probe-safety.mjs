/* Ground truth for /safety — every element the conversion touches.
   Usage: node scripts-tmp/probe-safety.mjs */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/safety', { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(900);

const out = await page.evaluate(() => {
  const clip = (s) => (s && s.length > 70 ? s.slice(0, 70) : s);
  const dump = (label, el) => {
    if (!el) return { label, missing: true };
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      label, tag: el.tagName.toLowerCase(),
      cls: clip(typeof el.className === 'string' ? el.className : ''),
      fs: c.fontSize, fw: c.fontWeight, lh: c.lineHeight, ls: c.letterSpacing,
      tt: c.textTransform, color: c.color, bg: c.backgroundColor, radius: c.borderTopLeftRadius,
      bw: c.borderTopWidth, bc: c.borderTopColor,
      shadow: c.boxShadow === 'none' ? null : 'shadow',
      minH: c.minHeight, pad: `${c.paddingTop}/${c.paddingRight}/${c.paddingBottom}/${c.paddingLeft}`,
      margin: `${c.marginTop}/${c.marginBottom}`,
      h: Math.round(r.height), w: Math.round(r.width),
      txt: (el.textContent || '').trim().slice(0, 40),
    };
  };
  const t = (sel) => document.querySelector(sel);
  const tn = (sel, i) => document.querySelectorAll(sel)[i] || null;
  const V = 'aside[aria-label="Our commitments"]';
  const sections = [...document.querySelectorAll('main > section')].map((s, i) => ({
    i, id: s.id || null, ds: s.dataset.section || null, cls: clip(s.className),
    py: `${getComputedStyle(s).paddingTop}/${getComputedStyle(s).paddingBottom}`,
    bg: getComputedStyle(s).backgroundColor,
    bt: `${getComputedStyle(s).borderTopWidth} ${getComputedStyle(s).borderTopColor}`,
    h: Math.round(s.getBoundingClientRect().height),
  }));
  return {
    docH: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    sections,
    d: [
      /* hero */
      dump('hero-section', t('main > section:nth-of-type(1)')),
      dump('hero-badge', t('main > section:nth-of-type(1) span')),
      dump('h1', t('#main h1')),
      dump('hero-dek', t('#main h1 + p')),
      dump('hero-nav', t('main > section:nth-of-type(1) nav')),
      dump('hero-chip', t('main > section:nth-of-type(1) nav a')),
      /* statement */
      dump('statement-section', t('main > section:nth-of-type(2)')),
      dump('statement-h2', t('#statement-title')),
      dump('statement-tile', t('main > section:nth-of-type(2) > div > div > span')),
      dump('statement-tile-icon', t('main > section:nth-of-type(2) > div > div > span svg')),
      dump('statement-copy', t('main > section:nth-of-type(2) > div > p')),
      /* protections */
      dump('prot-title', t('#protections-title')),
      dump('prot-eyebrow', t('#protections p.uppercase')),
      dump('prot-h3', t('#protections h3')),
      dump('prot-copy', t('#protections h3 + p')),
      dump('prot-panel', t('#protections [class*="max-w-[320px]"]')),
      /* family */
      dump('family-title', t('#family-title')),
      dump('family-sub', t('#family-title + p')),
      dump('family-card', t('#family [class*="min-h-[280px]"]')),
      dump('family-tile', t('#family [class*="min-h-[280px]"] > span')),
      dump('family-eyebrow', t('#family [class*="min-h-[280px]"] p.uppercase')),
      dump('family-h3', t('#family [class*="min-h-[280px]"] h3')),
      dump('family-copy', t('#family [class*="min-h-[280px]"] h3 + p')),
      dump('family-link', t('#family a[href="/parent"]')),
      dump('family-curve', t('#family [class*="rounded-tl-"]')),
      /* reporting */
      dump('report-title', t('#reporting-title')),
      dump('report-sub', t('#reporting-title + p')),
      dump('report-card', t('#reporting [class*="min-h-[340px]"]')),
      dump('report-tile', t('#reporting [class*="min-h-[340px]"] > span')),
      dump('report-eyebrow', t('#reporting [class*="min-h-[340px]"] p.uppercase')),
      dump('report-h3', t('#reporting [class*="min-h-[340px]"] h3')),
      dump('report-link', t('#reporting a[href="/community"]')),
      dump('report-curve', t('#reporting [class*="rounded-tl-"]')),
      /* share band */
      dump('share-section', t('#share')),
      dump('share-band', t('#share div[class*="rounded-["]')),
      dump('share-h2', t('#share h2')),
      dump('share-copy', t('#share p')),
      dump('share-report', t('#share a[href^="mailto"]')),
      dump('share-privacy', t('#share a[href="/privacy"]')),
      dump('share-item', t('#share li')),
      dump('share-circle', t('#share li > span')),
      dump('share-itemtext', tn('#share li > span', 1)),
      /* meta + closing */
      dump('last-updated', t('main > p')),
      dump('closing-section', t('main > section[aria-labelledby="closing-title"]')),
      dump('closing-card', t('[aria-labelledby="closing-title"] div[class*="rounded-["]')),
      dump('closing-h2', t('#closing-title')),
      dump('closing-copy', t('#closing-title + p')),
      dump('closing-pill', t('[aria-labelledby="closing-title"] a[href^="mailto"]')),
      dump('closing-link', t('[aria-labelledby="closing-title"] a[href="/how-it-works"]')),
      /* values strip + footer */
      dump('values-aside', t(V)),
      dump('values-eyebrow', t(`${V} p`)),
      dump('values-card', t(`${V} a`)),
      dump('values-current', t(`${V} [aria-current]`)),
      dump('values-tile', t(`${V} a > span`)),
      dump('values-tile-current', t(`${V} [aria-current] > span`)),
      dump('values-label', t(`${V} a > span:nth-of-type(2) > span`)),
      dump('values-desc', t(`${V} a > span:nth-of-type(2) > span:nth-child(2)`)),
      dump('footer', t('footer')),
    ],
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
