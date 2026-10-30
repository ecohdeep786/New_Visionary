/* FAP-E4 (FAP-33): i18n completeness audit (en/hi/bn) - runtime, per page.
 * Renders each workspace surface under en, hi and bn interface locales and
 * compares visible leaf text: a node whose text is IDENTICAL between the en
 * run and a translated run, and carries >=3 English words, is an
 * untranslated remnant. Proper nouns / numerics / short tokens are excluded.
 * Public (landing) pages are English by design (PRODUCT_SURFACE_AUDIT), so
 * the v1 translated surface list is the workspace shell set below.
 * Env: I18N_URL (default http://127.0.0.1:5179), I18N_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.I18N_URL || 'http://127.0.0.1:5179';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = path.resolve(productRoot, process.env.I18N_EVIDENCE_DIR || 'docs/visionary/baseline/i18n-audit-2026-10-30');
await mkdir(evidenceDir, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

/* v1 translated surface list (decision recorded in the receipt): the signed-in
   workspace shell. English-only proper nouns and short tokens are excluded. */
const SURFACES = [
  ['/dashboard/home', 'Home'],
  ['/dashboard/learn', 'Learn'],
  ['/dashboard/ask', 'Ask'],
  ['/dashboard/progress', 'Progress'],
  ['/dashboard/settings', 'Personalization'],
  ['/dashboard/privacy', 'Privacy & consent'],
  ['/dashboard/notifications', 'Notifications'],
  ['/dashboard/child', 'Family (parent)'],
  ['/dashboard/classes', 'Classes (teacher)'],
  ['/dashboard/people', 'People (organization)'],
];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const isEnglishSentence = (t) => {
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;
  const english = words.filter((w) => /^[A-Za-z][A-Za-z'’.-]*$/.test(w)).length;
  return english / words.length >= 0.8;
};

const receipt = { at: new Date().toISOString(), base, v1SurfaceDecision: 'workspace shell surfaces translated (en/hi/bn); public landing pages are English by design per PRODUCT_SURFACE_AUDIT', surfaces: [], totals: {} };
let flaggedTotal = 0;

for (const [route, label] of SURFACES) {
  const perLocale = {};
  for (const locale of ['en', 'hi', 'bn']) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(({ locale }) => {
      const user = { id: 'qa-i18n', email: 'qa-i18n@example.test', full_name: 'Alex', identity: 'student', roles: ['student'], age_band: 'adult', onboarding_complete: true };
      const now = Date.now(), id = user.id + ':student';
      const data = { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale, interfaceLocale: locale, voice: false, memory: true }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: new Date(now).toISOString().slice(0, 10) }, legacyImported: false };
      localStorage.setItem('visionary_users', JSON.stringify([user]));
      localStorage.setItem('visionary_sessions', JSON.stringify([{ token: user.id, userId: user.id, email: user.email, expiresAt: now + 86400000 }]));
      localStorage.setItem('visionary_session_token', user.id);
      localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people: [{ id: 'qa-i18n', email: user.email, name: 'Alex', ageBand: 'adult', roles: ['student'] }], workspaces: [{ id, personId: 'qa-i18n', role: 'student', name: 'Personal' }], active: { 'qa-i18n': id }, relationships: [], data: { [id]: data } }));
    }, { locale });
    const page = await context.newPage();
    await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(1200);
    perLocale[locale] = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('#main p,#main li,#main label,#main span,#main a,#main button,#main h1,#main h2,#main h3,#main td,#main th,#main dt,#main dd')) {
        if (el.offsetParent === null || el.closest('[aria-hidden="true"],.sr-only')) continue;
        if ([...el.childNodes].some((n) => n.nodeType === 1)) continue;
        const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (t.length > 2) out.push(t);
      }
      return out;
    });
    await context.close();
  }
  const findings = { hi: [], bn: [] };
  for (const locale of ['hi', 'bn']) {
    const enSet = new Set(perLocale.en);
    for (const t of perLocale[locale]) {
      if (enSet.has(t) && isEnglishSentence(t)) findings[locale].push(t.slice(0, 90));
    }
  }
  const flagged = findings.hi.length + findings.bn.length;
  flaggedTotal += flagged;
  receipt.surfaces.push({ route, label, enNodes: perLocale.en.length, hiNodes: perLocale.hi.length, bnNodes: perLocale.bn.length, hiSample: (perLocale.hi.find(t=>/['ऀ-ॿ]/.test(t))||'').slice(0,50), hiUntranslated: findings.hi.length, bnUntranslated: findings.bn.length, all: { hi: findings.hi, bn: findings.bn } });
  console.log(`${route} — hi untranslated: ${findings.hi.length}, bn untranslated: ${findings.bn.length}${flagged ? '  e.g. "' + (findings.hi[0] || findings.bn[0] || '').slice(0, 60) + '"' : ''}`);
}

receipt.totals = { flaggedNodes: flaggedTotal };
await writeFile(path.join(evidenceDir, 'i18n-audit-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
assert.equal(flaggedTotal, 0, `${flaggedTotal} untranslated English sentence nodes remain across the v1 workspace surfaces (see ${path.relative(productRoot, path.join(evidenceDir, 'i18n-audit-receipt.json'))})`);
console.log('PASS i18n completeness audit: zero untranslated English sentence nodes across the v1 workspace surfaces in hi and bn.');
