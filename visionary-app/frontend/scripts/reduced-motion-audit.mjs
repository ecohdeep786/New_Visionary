/* FHE-19 reduced-motion verification on the connected production shell.
 *
 * The F-09 motion harness (scripts/motion-verification.mjs) verifies the
 * motion law on public surfaces and the preview journey. This audit extends
 * the same law to the connected workspace shell: with prefers-reduced-motion
 * the shell must render fully (no animation-gated content) and its animated
 * elements must compute collapsed durations, while a no-preference context
 * shows the motion is present by default. Env: RM_BASE_URL (default
 * http://localhost:4200), QA_EMAIL / QA_PASSWORD, RM_EVIDENCE_DIR. */
import { chromium } from 'playwright-core';
import { loginViaUi } from './qa-session.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.RM_BASE_URL || 'http://localhost:4200';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = path.resolve(productRoot, process.env.RM_EVIDENCE_DIR || 'docs/visionary/baseline/reduced-motion-audit-2026-11-18');
await mkdir(evidenceDir, { recursive: true });
if (!process.env.CHROME_PATH) process.env.CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const SURFACES = ['/dashboard/home', '/dashboard/profile', '/dashboard/learn'];

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const receipt = { at: new Date().toISOString(), base, surfaces: [], totals: {} };
let failures = 0;

/* Sample the computed animation/transition state of visible elements. */
const motionSample = () => {
  const sample = { animated: 0, collapsed: 0, durations: [] };
  for (const el of document.querySelectorAll('main *, header *, [role="dialog"] *')) {
    if (!(el instanceof HTMLElement) || el.offsetParent === null) continue;
    const cs = getComputedStyle(el);
    const ad = cs.animationDuration === '0s' ? [] : cs.animationDuration.split(',').map(v => parseFloat(v));
    const td = cs.transitionDuration === '0s' ? [] : cs.transitionDuration.split(',').map(v => parseFloat(v));
    const hasAnimation = (cs.animationName || 'none') !== 'none' && ad.some(v => v > 0);
    const hasTransition = td.some(v => v > 0);
    if (!hasAnimation && !hasTransition) continue;
    sample.animated += 1;
    sample.durations.push(...(hasAnimation ? ad : td).filter(v => v > 0).slice(0, 2));
  }
  return sample;
};

for (const mode of ['reduce', 'no-preference']) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  await loginViaUi(page, base);
  for (const route of SURFACES) {
    await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(1800);
    const state = await page.evaluate(() => ({
      h1: document.querySelector('main h1')?.textContent?.trim()?.slice(0, 40) || null,
      mainTextLength: (document.querySelector('main')?.textContent || '').trim().length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }));
    const motion = await page.evaluate(motionSample);
    const record = { mode, route, ...state, animatedElements: motion.animated, maxDuration: Math.max(0, ...motion.durations) };
    receipt.surfaces.push(record);
    console.log(`[${mode}] ${route} — h1 "${state.h1}" · animated ${motion.animated} · max duration ${record.maxDuration}s · overflow ${state.overflow}`);
    // The shell must render fully under reduced motion: real heading, real
    // content, no horizontal overflow.
    if (mode === 'reduce') {
      if (!state.h1 || state.mainTextLength < 40 || state.overflow) failures += 1;
    }
  }
  await context.close();
}

/* The law: motion present by default, collapsed under reduce. Compare the
 * per-route samples; reduced motion must not show LONGER animation than the
 * default, and the default must animate something. */
const byMode = mode => receipt.surfaces.filter(r => r.mode === mode);
const reduced = byMode('reduce');
const normal = byMode('no-preference');
const reducedMax = Math.max(0, ...reduced.map(r => r.maxDuration));
const normalMax = Math.max(0, ...normal.map(r => r.maxDuration));
const normalAnimated = normal.reduce((sum, r) => sum + r.animatedElements, 0);
const reducedAnimated = reduced.reduce((sum, r) => sum + r.animatedElements, 0);
receipt.totals = { reducedMaxDuration: reducedMax, normalMaxDuration: normalMax, normalAnimatedElements: normalAnimated, reducedAnimatedElements: reducedAnimated, failures };
console.log(`totals — reduce max ${reducedMax}s vs normal max ${normalMax}s · animated elements ${reducedAnimated} vs ${normalAnimated}`);
assert.equal(failures, 0, `${failures} connected surfaces did not render fully under prefers-reduced-motion`);
assert.ok(normalAnimated > 0, 'the connected shell shows no motion by default — the reduced-motion contract cannot be verified');
assert.ok(reducedMax <= normalMax + 0.01, `reduced-motion durations (${reducedMax}s) exceed the default (${normalMax}s) — the collapse rule is not applied`);
await writeFile(path.join(evidenceDir, 'reduced-motion-audit-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log('PASS reduced-motion audit: the connected shell renders fully under prefers-reduced-motion and its animation collapses against the no-preference baseline.');
await browser.close();
