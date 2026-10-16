/* Dump all CSS rules whose selector matches a given element, in order.
   Usage: node scripts-tmp/probe-rules.mjs <url> <section> [tag] */
import { chromium } from 'playwright-core';

const [url, sect, tag = 'h2'] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await page.waitForSelector(`[data-section="${sect}"] ${tag}`, { timeout: 30000 }).catch(() => {});

const out = await page.evaluate(({ sectName, tagName }) => {
  const el = document.querySelector(`[data-section="${sectName}"] ${tagName}`);
  if (!el) return { error: 'element not found: ' + sectName + ' ' + tagName };
  const cs = getComputedStyle(el);
  const hits = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    const walk = (list, media) => {
      for (const rule of list) {
        if (rule.cssRules && rule.conditionText !== undefined) { walk(rule.cssRules, rule.conditionText); continue; }
        if (!rule.selectorText) continue;
        let matches = false;
        try { matches = el.matches(rule.selectorText); } catch { continue; }
        if (!matches) continue;
        const fs = rule.style.getPropertyValue('font-size');
        const lh = rule.style.getPropertyValue('line-height');
        if (!fs && !lh) continue;
        hits.push({ media: media || null, sel: rule.selectorText.slice(0, 220), fs, lh, prio: rule.style.getPropertyPriority('font-size') });
      }
    };
    walk(rules, null);
  }
  return { cls: el.className.toString().slice(0, 200), computedFs: cs.fontSize, computedLh: cs.lineHeight, hitCount: hits.length, hits };
}, { sectName: sect, tagName: tag });
console.log(JSON.stringify(out, null, 1));
await context.close();
await browser.close();
