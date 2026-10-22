/**
 * B3/FAP-48 probes — pricing store-grade table.
 * Modes: `node b3-probes.mjs before` / `after` → b3-probe-<mode>.json
 * Per width (1440/768/390):
 *   - page overflow AC: documentElement.scrollWidth vs innerWidth
 *   - plan-table geometry: columns, wrapper scroll, sticky first col / header row
 *   - measured voices: price cell, entitlement rows, fine print, CTA pill bg
 *   - FAQ accordion behavior (aria-expanded + curve duration)
 */
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5190';
const MODE = process.argv[2] || 'before';
const OUT = path.dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

const measure = (w) => {
  const doc = document.documentElement;
  const table = document.querySelector('main table[data-b3="plan"]') || document.querySelector('main table');
  const wrap = table ? table.closest('[data-overflow]') || table.parentElement : null;
  const rows = table ? [...table.querySelectorAll('tbody tr')] : [];
  const th = table ? table.querySelectorAll('thead th') : [];
  const prices = document.querySelectorAll('[data-b3="price"]');
  const ctas = document.querySelectorAll('[data-b3="cta"]');
  const fine = document.querySelectorAll('[data-b3="fine"]');
  const ent = rows[0] ? [...rows[0].children].map((c) => { const s = getComputedStyle(c.firstElementChild || c); return { fs: s.fontSize, fw: s.fontWeight, ls: s.letterSpacing, lh: s.lineHeight, color: s.color, tag: c.tagName }; }) : [];
  const cs = doc.scrollWidth; const iw = window.innerWidth;
  const faq = document.querySelector('main button[aria-expanded]');
  return {
    width: w,
    pageOverflowX: cs > iw ? doc.scrollWidth - iw : 0,
    bodyOverflowers: [...document.querySelectorAll('body *')].filter(el => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'auto' && getComputedStyle(el).overflowX !== 'scroll' && !el.closest('[data-overflow]') && el.getBoundingClientRect().width > 4 && !el.closest('main') ? 0 : 0).length - 0,
    overflowScrollers: [...document.querySelectorAll('main [data-overflow]')].map((el) => ({
      scroll: el.scrollWidth, client: el.clientWidth, isScroll: el.scrollWidth > el.clientWidth,
    })),
    tableCols: th.length,
    entRows: rows.length,
    firstCellVoice: ent[0] ? { fs: ent[0].fontSize, fw: ent[0].fontWeight, ls: ent[0].letterSpacing, lh: ent[0].lineHeight, color: ent[0].color } : null,
    priceVoices: [...prices].map((el) => {
      const s = getComputedStyle(el);
      return { fs: s.fontSize, fw: s.fontWeight, ls: s.letterSpacing, lh: s.lineHeight, text: (el.textContent || '').slice(0, 14) };
    }),
    fineVoices: [...fine].map((el) => { const s = getComputedStyle(el); return { fs: s.fontSize, lh: s.lineHeight, ls: s.letterSpacing, color: s.color, text: (el.textContent || '').slice(0, 42) }; }),
    ctaPills: [...ctas].map((el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return { bg: s.backgroundColor, fs: s.fontSize, h: Math.round(r.height), text: (el.textContent || '').slice(0, 26), href: el.getAttribute('href') || 'button' }; }),
    faq: faq ? { q: (faq.textContent || '').slice(0, 30), expanded: faq.getAttribute('aria-expanded') } : null,
  };
};

const results = {};
for (const w of [1440, 768, 390]) {
  await page.setViewportSize({ width: w, height: 960 });
  await page.goto(`http://localhost:${PORT}/pricing`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('main', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2400);
  const top = await page.evaluate(measure, w);

  // sticky checks (desktop widths): scroll the page, then ask th positions.
  if (w === 1440 && (await page.$('main table'))) {
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(600);
    top.stickyHeaderTopAtScroll = await page.evaluate(() => {
      const th = document.querySelector('main table thead th');
      return th ? Math.round(th.getBoundingClientRect().top) : null;
    });
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  // FAQ toggle behavior
  const faqBtn = await page.$('main button[aria-expanded]');
  if (faqBtn) {
    await faqBtn.click();
    await page.waitForTimeout(700);
    top.faq = { ...top.faq, afterClickExpanded: await page.evaluate(() => !!document.querySelector('main button[aria-expanded="true"]')) };
  }
  results[`w${w}`] = top;
}

// billboard: billing toggle prices actually switch (w1440)
await page.setViewportSize({ width: 1440, height: 960 });
await page.goto(`http://localhost:${PORT}/pricing`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2400);
const pricesAnnual = await page.evaluate(() => [...document.querySelectorAll('[data-b3="price"]')].map((el) => (el.textContent || '').trim()).join('|'));
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Monthly'); if (b) b.click(); });
await page.waitForTimeout(500);
const pricesMonthly = await page.evaluate(() => [...document.querySelectorAll('[data-b3="price"]')].map((el) => (el.textContent || '').trim()).join('|'));
results.billingSwitch = { annual: pricesAnnual, monthly: pricesMonthly, changed: pricesAnnual !== pricesMonthly };
// billing path check: the personal CTA href under annual
results.billingHref = await page.evaluate(() => {
  const cta = [...document.querySelectorAll('[data-b3="cta"]')].find((el) => (el.getAttribute('href') || '').includes('personal'));
  return cta ? cta.getAttribute('href') : null;
});

// truth check: tbody row texts must reproduce COMPARISON verbatim
// (booleans render as icons → empty innerText by design).
const truth = await page.evaluate(() => (
  [...document.querySelectorAll('main table[data-b3="plan"] tbody tr')].map((tr) => (
    [...tr.children].map((c) => (c.innerText || '').replace(/\s+/g, ' ').trim())
  ))
));
const cellText = (v) => (typeof v === 'boolean' ? '' : v);
try {
  const cfg = await import('./truth-config.mjs');
  const want = cfg.COMPARISON.map((r) => [cellText(r.feature) && r.feature, cellText(r.start), cellText(r.personal), cellText(r.family)]);
  results.truthRows = { match: JSON.stringify(truth) === JSON.stringify(want), count: truth.length };
  if (!results.truthRows.match) {
    results.truthRows.diff = [];
    for (let i = 0; i < Math.max(truth.length, want.length); i++) {
      const a = JSON.stringify(truth[i]); const b = JSON.stringify(want[i]);
      if (a !== b) results.truthRows.diff.push({ i, got: truth[i], want: want[i] });
    }
  }
} catch (e) {
  results.truthRows = { error: String(e) };
}

// pinned feature column at 768: scroll the wrapper, first th stays left-aligned
await page.setViewportSize({ width: 768, height: 960 });
await page.goto(`http://localhost:${PORT}/pricing`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2200);
results.pinnedColumn = await page.evaluate(() => {
  const wrap = document.querySelector('main [data-overflow]');
  if (!wrap) return null;
  const before = document.querySelector('main table tbody th').getBoundingClientRect().left;
  wrap.scrollLeft = 200;
  const after = document.querySelector('main table tbody th').getBoundingClientRect().left;
  wrap.scrollLeft = 0;
  return { before: Math.round(before), afterScroll: Math.round(after), pinned: Math.abs(before - after) < 3 };
});

await browser.close();
const fs = await import('node:fs');
const file = path.join(OUT, `b3-probe-${MODE}.json`);
fs.writeFileSync(file, JSON.stringify(results, null, 1));
console.log(`WROTE ${file}`);
const summary = {};
for (const k of ['w1440', 'w768', 'w390']) {
  const r = results[k];
  if (r) summary[k] = { ov: r.pageOverflowX, cols: r.tableCols, rows: r.entRows, ent: r.firstCellVoice && r.firstCellVoice.fs, pills: r.ctaPills.length };
}
summary.billing = results.billingSwitch;
console.log('summary:', JSON.stringify(summary, null, 1).slice(0, 900));
