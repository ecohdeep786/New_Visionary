/**
 * CDP matched-rules trace — for a handful of representative uppercase sites,
 * prints the exact cascade (selector, order, effective props) that CSS devtools
 * would show. Settles which law voices each kicker group.
 */
import { chromium } from 'playwright-core';

const PORT = process.env.PORT || '5187';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

async function traceRoutes(specs) {
  for (const [route, textProbe] of specs) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('main, #main', { timeout: 30000 });
    await page.waitForTimeout(2000);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', {
      nodeId: root.nodeId,
      selector: 'p.uppercase, span.uppercase, div.uppercase, th.uppercase',
    });
    for (const nodeId of nodeIds.slice(0, 6)) {
      const { node } = await cdp.send('DOM.describeNode', { nodeId });
      const nodeText = (await cdp.send('DOM.getOuterHTML', { nodeId })).outerHTML.slice(0, 70);
      const t = (node.nodeValue || '').trim();
      void t;
      const { matchedCSSRules } = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
      const rows = [];
      for (const m of matchedCSSRules || []) {
        const sel = m.rule.selectorList.text;
        if (!/uppercase|\.text-\\?\[1[2-7]|h2 \+ p|apple-eyebrow|apple-meta|apple-fine|body/i.test(sel)) continue;
        const want = {};
        for (const p of m.rule.style.cssProperties || []) {
          if (['font-size', 'line-height', 'letter-spacing', 'font-weight', 'text-transform'].includes(p.name)) want[p.name] = p.value;
        }
        if (Object.keys(want).length) rows.push({ sel: sel.slice(0, 130), origin: m.rule.origin, order: m.rule.style.range?.startOffset, props: want });
      }
      const raw = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
      const inline = raw.inlineStyle && raw.inlineStyle.cssProperties ? Object.fromEntries((raw.inlineStyle.cssProperties || []).filter((p) => ['font-size', 'line-height', 'letter-spacing', 'font-weight', 'text-transform'].includes(p.name)).map((p) => [p.name, p.value])) : {};
      console.log('EL:', nodeText.replace(/\s+/g, ' '));
      console.log('INLINE:', JSON.stringify(inline));
      console.log(`\n=== ${route} "${String(textProbe)}" ===`);
      for (const r of rows) console.log('  ', JSON.stringify(r.order || ''), '|', r.sel, '|', JSON.stringify(r.props));
    }
    await ctx.close();
  }
}

await traceRoutes([
  ['/about', 'About Visionary'],
]);
await browser.close();
