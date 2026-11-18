/* FAP-E4 (FAP-33) + FHE-19: i18n completeness audit (en/hi/bn) — runtime, per page.
 * Renders each workspace surface under en, hi and bn interface locales and
 * compares visible leaf text: a node whose text is IDENTICAL between the en
 * run and a translated run, and carries >=3 English words, is an untranslated
 * remnant. Proper nouns / numerics / short tokens are excluded. Public
 * (landing) pages are English by design (PRODUCT_SURFACE_AUDIT).
 *
 * FHE-19 (2026-11-18): the hi/bn passes are real now. The audit drives the
 * app's own language control — the Interface-language listbox on the
 * Personalization surface (preview) — completing the recorded FAP-67
 * follow-up. The connected production surfaces carry the same translations
 * through connectedSurfaceCopy (verified separately in the L2 realm walk).
 *
 * Env: I18N_URL (default http://127.0.0.1:5179), I18N_EVIDENCE_DIR,
 * QA_EMAIL / QA_PASSWORD (the realm account; must be onboarded). */
import { chromium } from 'playwright-core';
import { loginViaUi } from './qa-session.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.I18N_URL || 'http://127.0.0.1:5179';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = path.resolve(productRoot, process.env.I18N_EVIDENCE_DIR || 'docs/visionary/baseline/i18n-audit-2026-11-18');
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
  ['/dashboard/subscription', 'Plans & payments (billing)'],
  ['/dashboard/child', 'Family (parent)'],
  ['/dashboard/classes', 'Classes (teacher)'],
  ['/dashboard/people', 'People (organization)'],
];

/* The Interface-language listbox trigger carries one of these labels depending
   on the locale the UI is currently in; the options carry native labels that
   never translate. */
const INTERFACE_TRIGGER_LABELS = ['Interface language', 'इंटरफ़ेस', 'ইন্টারফেস'];
const OPTION_LABELS = { en: 'English', hi: 'हिन्दी', bn: 'বাংলা' };

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const isEnglishSentence = (t) => {
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;
  const english = words.filter((w) => /^[A-Za-z][A-Za-z'’.-]*$/.test(w)).length;
  return english / words.length >= 0.8;
};

const collectLeafText = () => {
  const out = [];
  for (const el of document.querySelectorAll('#main p,#main li,#main label,#main span,#main a,#main button,#main h1,#main h2,#main h3,#main td,#main th,#main dt,#main dd')) {
    if (el.offsetParent === null || el.closest('[aria-hidden="true"],.sr-only')) continue;
    if ([...el.childNodes].some((n) => n.nodeType === 1)) continue;
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (t.length > 2) out.push(t);
  }
  return out;
};

/* Drive the app's own Interface-language listbox on the Personalization
   surface. Returns the language attribute the shell reports afterwards. */
async function setInterfaceLocale(page, locale) {
  await page.goto(base + '/dashboard/personalization', { waitUntil: 'load', timeout: 90000 });
  const trigger = page.getByRole('button', { name: new RegExp(INTERFACE_TRIGGER_LABELS.join('|')) }).first();
  try {
    await trigger.waitFor({ state: 'visible', timeout: 45000 });
  } catch (failure) {
    const state = await page.evaluate(() => ({
      url: location.pathname, h1: document.querySelector('h1')?.textContent?.trim()?.slice(0, 60) ?? null,
      alert: document.querySelector('[role=alert]')?.textContent?.slice(0, 80) ?? null,
      mainButtons: [...document.querySelectorAll('main button')].map(b => b.getAttribute('aria-label') || b.textContent.trim().slice(0, 20)).slice(0, 8),
    })).catch(() => 'page unreachable');
    console.log('SWITCHER STALL:', JSON.stringify(state));
    throw failure;
  }
  await trigger.click();
  await page.waitForTimeout(400);
  await page.getByRole('option', { name: new RegExp('^' + OPTION_LABELS[locale]) }).first().click();
  await page.waitForTimeout(1200);
  return page.evaluate(() => document.querySelector('[lang][data-role],[lang].v-page,[lang]')?.getAttribute('lang') || 'unknown');
}

/* Decided-English strings, with the recorded decisions. These are intentional
 * (not untranslated remnants) and stay out of the flagged count, exactly like
 * the palette law's allowlist pattern:
 * - FAP-87: in-shell boundary notices render in English by recorded decision
 *   (RoleAreaUnavailable pins lang="en" with the decision comment).
 * - FHE-19: the approved data policy section renders in the language the
 *   policy was approved in; its purpose texts are server-owned approved
 *   records (ApprovedPrivacyPolicy declares lang="en"). */
const DECIDED_ENGLISH_PREFIXES = [
  ['This workspace area opens with a', 'FAP-87: in-shell boundary notices are English by recorded decision'],
  ['Return to workspace', 'FAP-87: in-shell boundary notices are English by recorded decision'],
  ['Approved data policy', 'FHE-19: the approved policy renders in its approved language (server-owned records)'],
  ['Test billing is not configured', 'FHE-19: server-owned error copy renders as received (failure.message)'],
  ['Your existing records are preserved', 'FHE-19: approved policy language'],
  ['Under-18 activation remains blocked', 'FHE-19: approved policy language'],
  ['Account and device security', 'FHE-19: approved policy language'],
  ['Authenticate and secure', 'FHE-19: approved policy language (server-owned purpose)'],
  ['Private learning text', 'FHE-19: approved policy language'],
  ['Deliver private learning', 'FHE-19: approved policy language (server-owned purpose)'],
  ['Source files', 'FHE-19: approved policy language'],
  ['Use permitted owner source', 'FHE-19: approved policy language (server-owned purpose)'],
  ['Billing and audit records', 'FHE-19: approved policy language'],
  ['Support authorized billing', 'FHE-19: approved policy language (server-owned purpose)'],
  ['Model operation metadata', 'FHE-19: approved policy language'],
  ['Record reviewed operation', 'FHE-19: approved policy language (server-owned purpose)'],
  ['Admission and relationship proof', 'FHE-19: approved policy language'],
  ['Keep minimal reviewed', 'FHE-19: approved policy language (server-owned purpose)'],
  ['Requested voice input', 'FHE-19: approved policy language'],
  ['Use explicitly requested voice', 'FHE-19: approved policy language (server-owned purpose)'],
  ['Offline learning packs', 'FHE-19: approved policy language'],
  ['Deliver explicitly permitted', 'FHE-19: approved policy language (server-owned purpose)'],
  ['Reviewed pilot feedback', 'FHE-19: approved policy language'],
  ['Use minimized', 'FHE-19: approved policy language (server-owned purpose)'],
  ['Approved by ', 'FHE-19: approved policy language (server-owned approver record)'],
  ['Policy reference', 'FHE-19: approved policy language'],
  ['Policy digest', 'FHE-19: approved policy language'],
  ['Checking the approved policy', 'FHE-19: approved policy language'],
  ['The approved policy is unavailable', 'FHE-19: approved policy language'],
  ['Retry policy', 'FHE-19: approved policy language'],
];
const decidedReason = t => (DECIDED_ENGLISH_PREFIXES.find(([p]) => t.startsWith(p)) || [null, null])[1];

const receipt = { at: new Date().toISOString(), base, v1SurfaceDecision: 'workspace shell surfaces translated (en/hi/bn); public landing pages are English by design per PRODUCT_SURFACE_AUDIT; FHE-19: the hi/bn passes drive the app Interface-language control', surfaces: [], totals: {} };
let flaggedTotal = 0;

const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
await loginViaUi(page, base);

for (const [route, label] of SURFACES) {
  const perLocale = {};
  for (const locale of ['en', 'hi', 'bn']) {
    await setInterfaceLocale(page, locale);
    await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(1200);
    perLocale[locale] = await page.evaluate(collectLeafText);
  }
  const findings = { hi: [], bn: [] };
  const decided = { hi: 0, bn: 0 };
  for (const locale of ['hi', 'bn']) {
    const enSet = new Set(perLocale.en);
    for (const t of perLocale[locale]) {
      if (enSet.has(t) && isEnglishSentence(t)) {
        const reason = decidedReason(t);
        if (reason) { decided[locale] += 1; continue; }
        findings[locale].push(t.slice(0, 90));
      }
    }
  }
  const flagged = findings.hi.length + findings.bn.length;
  flaggedTotal += flagged;
  receipt.surfaces.push({ route, label, enNodes: perLocale.en.length, hiNodes: (perLocale.hi || []).length, bnNodes: (perLocale.bn || []).length, hiSample: ((perLocale.hi || []).find(t=>/['ऀ-ॿ]/.test(t))||'').slice(0,50), hiUntranslated: findings.hi.length, bnUntranslated: findings.bn.length, decidedEnglish: decided, all: { hi: findings.hi, bn: findings.bn } });
  console.log(`${route} — hi untranslated: ${findings.hi.length}, bn untranslated: ${findings.bn.length}${flagged ? '  e.g. "' + (findings.hi[0] || findings.bn[0] || '').slice(0, 60) + '"' : ''}`);
}
await context.close();

receipt.totals = { flaggedNodes: flaggedTotal };
await writeFile(path.join(evidenceDir, 'i18n-audit-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
assert.equal(flaggedTotal, 0, `${flaggedTotal} untranslated English sentence nodes remain across the v1 workspace surfaces (see ${path.relative(productRoot, path.join(evidenceDir, 'i18n-audit-receipt.json'))})`);
console.log('PASS i18n completeness audit: zero untranslated English sentence nodes across the v1 workspace surfaces in hi and bn.');
await browser.close();
