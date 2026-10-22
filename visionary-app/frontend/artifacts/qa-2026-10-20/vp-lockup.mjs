/* FAP-34: measure the Vision Pro hero lockup (h1.hero-headline visual box)
   and tagline/CTA pixel sizes across viewports — the focal element is an SVG
   wordmark, so its HEIGHT is the target our statement must match visually. */
import { chromium } from 'playwright-core';

const VIEWPORTS = [[390, 844], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080]];
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  try {
    await page.goto('https://www.apple.com/apple-vision-pro/', { waitUntil: 'load', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(1500);
    const m = await page.evaluate(() => {
      const hero = document.querySelector('h1.hero-headline');
      const r = hero ? hero.getBoundingClientRect() : null;
      const svgs = hero ? Array.from(hero.querySelectorAll('svg')).map((s) => { const b = s.getBoundingClientRect(); return Math.round(b.width) + 'x' + Math.round(b.height); }) : [];
      const tag = document.querySelector('[class*="typography-hero-tagline"]');
      const tagS = tag ? getComputedStyle(tag) : null;
      const cta = document.querySelector('[class*="hero"] a[class*="button"], a[class*="button"]');
      const ctaS = cta ? getComputedStyle(cta) : null;
      return {
        heroBox: r ? Math.round(r.width) + 'x' + Math.round(r.height) : null,
        heroTop: r ? Math.round(r.top) : null,
        svgs,
        tagline: tagS ? Math.round(parseFloat(tagS.fontSize)) + '/' + tagS.fontWeight : null,
        cta: ctaS ? Math.round(parseFloat(ctaS.fontSize)) + '/' + ctaS.fontWeight : null,
        h1fs: hero ? getComputedStyle(hero).fontSize : null
      };
    });
    console.log(w + ' => ' + JSON.stringify(m));
  } catch (e) { console.log(w + ' ERR ' + String(e).slice(0, 90)); }
  await ctx.close();
}
await browser.close();
