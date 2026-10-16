/* Ground truth for /research — every element the conversion touches. */
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/research', { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector('#main h1', { timeout: 30000 });
await page.waitForTimeout(900);

const out = await page.evaluate(() => {
  const css = (el, prop) => getComputedStyle(el)[prop];
  const clip = (s) => (s && s.length > 30 ? s.slice(0, 30) : s);
  const dump = (label, el) => {
    if (!el) return { label, missing: true };
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      label, tag: el.tagName.toLowerCase(),
      fs: c.fontSize, fw: c.fontWeight, lh: c.lineHeight, ls: c.letterSpacing,
      tt: c.textTransform, color: c.color, bg: c.backgroundColor, radius: c.borderTopLeftRadius,
      bw: c.borderTopWidth, bc: c.borderTopColor, bt: c.borderTopColor,
      shadow: c.boxShadow === 'none' ? null : 'shadow',
      minH: c.minHeight,
      h: Math.round(r.height), w: Math.round(r.width),
      txt: clip(el.textContent.trim()),
    };
  };
  const t = (sel) => document.querySelector(sel);
  const sections = [...document.querySelectorAll('main > section')].map((s, i) => ({
    i, id: s.id || null, ds: s.dataset.section || null,
    py: `${css(s, 'paddingTop')}/${css(s, 'paddingBottom')}`,
    bg: css(s, 'backgroundColor'), bt: `${css(s, 'borderTopWidth')} ${css(s, 'borderTopColor')}`,
    h: Math.round(s.getBoundingClientRect().height),
  }));
  const S2 = 'main > section:nth-of-type(2)';
  const S3 = 'main > section:nth-of-type(3)';
  const S7 = 'main > section:nth-of-type(7)';
  const S9 = 'main > section:nth-of-type(9)';
  return {
    docH: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    sections,
    d: [
      /* hero */
      dump('h1', t('#main h1')),
      dump('hero-sub', t('#main h1 + p')),
      dump('hero-chip', t('main > section:nth-of-type(1) .pointer-events-none')),
      dump('hero-illo', t('main > section:nth-of-type(1) .pointer-events-none + .pointer-events-none')),
      /* mission */
      dump('mission-h2', t(`${S2} h2`)),
      dump('mission-p', t(`${S2} h2 + p`)),
      dump('mission-panel', t(`${S2} [class*="rounded-3xl"]`)),
      dump('mission-eyebrow', t(`${S2} [class*="rounded-3xl"] p`)),
      dump('mission-statement', t(`${S2} [class*="rounded-3xl"] > p + p`)),
      dump('mission-chip', t(`${S2} [class*="rounded-3xl"] span`)),
      /* quote */
      dump('quote-panel', t(`${S3} [class*="rounded-3xl"]`)),
      dump('quote-p', t(`${S3} p`)),
      dump('quote-avatar', t(`${S3} span`)),
      dump('quote-name', t(`${S3} [class*="rounded-3xl"] p + div p`)),
      /* latest */
      dump('latest-h2', t('#latest h2')),
      dump('latest-pill', t('#latest a[href="/updates"]')),
      dump('latest-card', t('#latest article')),
      dump('latest-head', t('#latest article > div')),
      dump('latest-h3', t('#latest article h3')),
      dump('latest-copy', t('#latest article h3 + p')),
      dump('latest-date', t('#latest article [class*="mt-auto"] span')),
      dump('latest-link', t('#latest article [class*="mt-auto"] a')),
      /* areas */
      dump('areas-h2', t('#areas h2')),
      dump('areas-sub', t('#areas h2 + p')),
      dump('areas-mat', t('#areas [style]')),
      dump('areas-img', t('#areas [style] img')),
      dump('areas-eyebrow', t('#areas p.uppercase')),
      dump('areas-h3', t('#areas h3')),
      dump('areas-copy', t('#areas h3 + p')),
      dump('areas-cta', t('#areas a[href="/student"]')),
      dump('item-tile', t('#areas article span')),
      dump('item-tag', t('#areas article p.uppercase')),
      dump('item-h4', t('#areas article h4')),
      dump('item-detail', t('#areas article h4 + p')),
      /* projects */
      dump('projects-h2', t('#projects h2')),
      dump('projects-pill', t('#projects a[href="/how-it-works"]')),
      dump('projects-card', t('#projects article')),
      dump('projects-h3', t('#projects article h3')),
      dump('projects-copy', t('#projects article h3 + p')),
      /* domains */
      dump('domains-panel', t(`${S7} [class*="rounded-3xl"]`)),
      dump('domains-h2', t(`${S7} h2`)),
      dump('domains-copy', t(`${S7} h2 + p`)),
      dump('domains-pill', t(`${S7} a[href="/how-it-works"]`)),
      dump('domains-chip', t(`${S7} [class*="border-white"]`)),
      /* origin */
      dump('origin-h2', t('#origin h2')),
      dump('origin-p1', t('#origin h2 + p')),
      dump('origin-p2', t('#origin h2 + p + p')),
      dump('origin-link', t('#origin a[href="/updates"]')),
      dump('origin-card', t('#origin [class*="g-card"]')),
      dump('origin-eyebrow', t('#origin [class*="g-card"] p.uppercase')),
      dump('origin-chip', t('#origin [class*="g-card"] span')),
      dump('origin-quote', t('#origin [class*="g-card"] > p')),
      dump('origin-hairline', t('#origin .border-t')),
      dump('origin-fine', t('#origin .border-t p')),
      /* responsible */
      dump('resp-img', t(`${S9} [class*="rounded-2xl"]`)),
      dump('resp-h2', t(`${S9} h2`)),
      dump('resp-copy', t(`${S9} h2 + p`)),
      dump('resp-pill1', t(`${S9} a[href="/safety"]`)),
      /* future */
      dump('future-h2', t('#future h2')),
      dump('future-card', t('#future a[class*="group"]')),
      dump('future-h3', t('#future a[class*="group"] h3')),
      dump('future-copy', t('#future a[class*="group"] h3 + p')),
      dump('future-curve', t('#future [class*="rounded-tl"]')),
      dump('future-pill', t('#future a[class*="group"] span')),
      dump('future-row', t('#future .border-t')),
      dump('future-row-h3', t('#future .border-t h3')),
      dump('future-row-p', t('#future .border-t p')),
      dump('future-row-link', t('#future .border-t a')),
    ],
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
