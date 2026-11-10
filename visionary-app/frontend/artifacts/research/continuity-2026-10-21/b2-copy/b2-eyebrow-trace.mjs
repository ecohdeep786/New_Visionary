/**
 * CDP matched-rules trace for apple-eyebrow sites, focusing on the aside
 * "In this policy" (why the base 12px fails there).
 */
import { chromium } from 'playwright-core';

const PORT = process.env.PORT || '5188';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:${PORT}/privacy`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('main, #main', { timeout: 30000 });
await page.waitForTimeout(2000);
const cdp = await ctx.newCDPSession(page);
await cdp.send('DOM.enable');
await cdp.send('CSS.enable');
const { root } = await cdp.send('DOM.getDocument');
const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'div.apple-eyebrow' });
console.log('div.apple-eyebrow count:', nodeIds.length);
let printed = 0;
for (const nodeId of nodeIds) {
  if (printed >= 3) break;
  const { outerHTML } = await cdp.send('DOM.getOuterHTML', { nodeId });
  if (!/In this policy/i.test(outerHTML)) continue;
  printed++;
  console.log('\n=== EL:', String(outerHTML).replace(/\s+/g, ' ').slice(0, 130));
  const { matchedCSSRules, inlineStyle } = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
  const want = ['font-size', 'line-height', 'letter-spacing', 'font-weight', 'text-transform'];
  const row = (m) => {
    const props = {};
    for (const p of m.rule.style.cssProperties || []) {
      if (want.includes(p.name)) props[p.name] = p.value;
    }
    return props;
  };
  console.log('INLINE:', JSON.stringify(Object.fromEntries((inlineStyle?.cssProperties || []).filter((p) => want.includes(p.name)).map((p) => [p.name, p.value]))));
  const info = await page.evaluate(() => {
    const el = [...document.querySelectorAll('div.apple-eyebrow')].find((d) => /in this policy/i.test(d.innerText || ''));
    if (!el) return null;
    const s = getComputedStyle(el);
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    const caption = s.getPropertyValue('--fs-caption');
    const captionRoot = getComputedStyle(document.documentElement).getPropertyValue('--fs-caption');
    return { elFs: s.fontSize, rootFs: root.fontSize, bodyFs: body.fontSize, captionOnEl: caption, captionOnRoot: captionRoot };
  });
  console.log('COMPUTED:', JSON.stringify(info));
  for (const m of matchedCSSRules || []) {
    const props = row(m);
    if (!Object.keys(props).length) continue;
    console.log('   match:', m.rule.selectorList.text.slice(0, 110), '|', JSON.stringify(props), '| origin:', m.rule.origin, '| specific:', JSON.stringify(m.rule.selectorList.specificity || ''));
  }
}
await browser.close();
