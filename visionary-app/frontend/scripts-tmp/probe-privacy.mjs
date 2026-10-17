/* Ground truth for /privacy — every element the legal conversion touches.
   Usage: node scripts-tmp/probe-privacy.mjs */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/privacy', { waitUntil: 'load', timeout: 120000 });
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
      /* policy tabs */
      dump('tabs-track', t('nav[aria-label="Visionary policies"] div[role="group"]')),
      dump('tabs-active', t('nav[aria-label="Visionary policies"] [aria-current="page"]')),
      dump('tabs-inactive', t('nav[aria-label="Visionary policies"] a[href="/terms"]')),
      /* desktop TOC */
      dump('toc-aside', t('#main aside')),
      dump('toc-sticky', t('#main aside > div')),
      dump('toc-item', tn('#main aside nav button', 0)),
      dump('toc-item-2', tn('#main aside nav button', 1)),
      dump('toc-num', t('#main aside nav button span')),
      dump('toc-note-wrap', t('#main aside div.border-t')),
      dump('toc-note', t('#main aside div.border-t p')),
      /* hero */
      dump('hero-illustration', t('#main [class*="justify-center"]')),
      dump('hero-eyebrow', t('#main .grid p.uppercase')),
      dump('h1', t('#main h1')),
      dump('hero-dek', t('#main h1 + p')),
      dump('hero-promise', t('#main h1 + p + div span')),
      dump('hero-action-tile', t('#main h1 + p + div + div > span')),
      dump('hero-action-title', t('#main h1 + p + div + div > div > p')),
      dump('hero-action-link', t('#main a[href="/dashboard/privacy"]')),
      dump('hero-effective', t('#main h1 + p + div + div + p')),
      /* at a glance */
      dump('glance-title', t('#privacy-summary-title')),
      dump('glance-card', tn('[aria-labelledby="privacy-summary-title"] .grid > a', 0)),
      dump('glance-tile', tn('[aria-labelledby="privacy-summary-title"] .grid > a > span', 0)),
      dump('glance-num', tn('[aria-labelledby="privacy-summary-title"] .grid > a > span:nth-of-type(2) span', 0)),
      dump('glance-text', tn('[aria-labelledby="privacy-summary-title"] .grid > a > span:nth-of-type(3)', 0)),
      dump('glance-curve', tn('[aria-labelledby="privacy-summary-title"] [class*="rounded-tl-"]', 0)),
      dump('glance-arrow', tn('[aria-labelledby="privacy-summary-title"] .grid > a > div:last-child', 0)),
      /* article rhythm */
      dump('sec-01', t('#what-we-collect')),
      dump('sec-02', t('#purpose')),
      dump('divider-02', t('#purpose')),
      /* 01 cards */
      dump('c01-card', t('#what-we-collect div.grid > div')),
      dump('c01-tile', t('#what-we-collect div.grid > div > span')),
      dump('c01-h3', t('#what-we-collect div.grid > div h3')),
      dump('c01-copy', t('#what-we-collect div.grid > div p')),
      /* 02 rows */
      dump('c02-row', t('#purpose > div:nth-of-type(2) > div')),
      dump('c02-h3', t('#purpose > div:nth-of-type(2) > div h3')),
      dump('c02-copy', t('#purpose > div:nth-of-type(2) > div p')),
      /* 03 table */
      dump('c03-wrap', t('#sharing > div:nth-of-type(2)')),
      dump('c03-row', t('#sharing > div:nth-of-type(2) > div')),
      dump('c03-who', t('#sharing > div:nth-of-type(2) > div p')),
      dump('c03-what', t('#sharing > div:nth-of-type(2) > div p + p')),
      /* 04 controls */
      dump('c04-card', t('#your-controls div.grid > div')),
      dump('c04-h3', t('#your-controls div.grid > div h3')),
      dump('c04-link', t('#your-controls > div:last-child a')),
      dump('c04-link-2', tn('#your-controls > div:last-child a', 1)),
      /* 05 + 08 learn-more */
      dump('c05-link', t('#security a[href="/security"]')),
      dump('c08-link', t('#younger-learners a[href="/safety"]')),
      /* 06 requests */
      dump('c06-card', t('#data-requests div.grid > div')),
      dump('c06-num', t('#data-requests div.grid > div p')),
      dump('c06-h3', t('#data-requests div.grid > div h3')),
      dump('c06-panel', t('#data-requests .grid + div')),
      dump('c06-pill', t('#data-requests a[href^="mailto"]')),
      /* 07 retention */
      dump('c07-card', t('#retention > div:nth-of-type(2)')),
      dump('c07-dot', t('#retention > div:nth-of-type(2) li > span')),
      dump('c07-copy', t('#retention > div:nth-of-type(2) li > span:nth-of-type(2)')),
      /* 09 faq */
      dump('faq-wrap', t('#explainers > div:nth-of-type(2)')),
      dump('faq-q', t('#explainers button span')),
      dump('faq-a', t('#explainers [role="region"] p')),
      /* 10 grievance */
      dump('c10-card', t('#grievance-officer > div:nth-of-type(2)')),
      dump('c10-mail', t('#grievance-officer a[href^="mailto"]')),
      /* key terms + related */
      dump('terms-section', t('main > section[aria-labelledby="key-terms-title"]')),
      dump('terms-h2', t('#key-terms-title')),
      dump('terms-grid', t('main > section[aria-labelledby="key-terms-title"] div.border-t')),
      dump('terms-term', t('main > section[aria-labelledby="key-terms-title"] div.border-t > div p')),
      dump('terms-def', t('main > section[aria-labelledby="key-terms-title"] div.border-t > div p + p')),
      dump('related-section', t('main > section[aria-label="Related policies"]')),
      dump('related-h2', t('main > section[aria-label="Related policies"] h2')),
      dump('related-card', t('main > section[aria-label="Related policies"] .grid > a')),
      dump('related-label', t('main > section[aria-label="Related policies"] .grid > a span')),
      dump('related-curve', t('main > section[aria-label="Related policies"] [class*="rounded-tl-"]')),
      dump('related-arrow', t('main > section[aria-label="Related policies"] .grid > a > div:last-child')),
      /* values strip + footer */
      dump('values-aside', t(V)),
      dump('values-card', t(`${V} a`)),
      dump('values-current', t(`${V} [aria-current]`)),
      dump('footer', t('footer')),
    ],
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
