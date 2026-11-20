#!/usr/bin/env node
/* KAN-210 — the workspace product-quality floor: real-browser E2E.
 *
 * Two focused parts, run against the production build on the real local realm
 * (registered backend + Auth/Firestore emulators + disposable synthetic SQL —
 * the same environment contract as the FAP-69 v7 integrated journey):
 *
 *   landing (public, no auth, production build) — the reveal law: landing
 *     content is in the visible first paint (no .scroll-reveal chapter hides
 *     above the fold), the print cascade never hides an armed chapter, and
 *     prefers-reduced-motion snaps every chapter fully visible instantly.
 *
 *   listbox (real account, real backend, workspace preview surface) — a full
 *     real-user enrollment (register → real Auth Emulator oobCode verification
 *     → onboarding → account home), then the personalization Trust panel: no
 *     native <select> remains, every picker is a WorkspaceListbox with
 *     native-grade listbox semantics driven through the REAL keyboard (open on
 *     Enter/ArrowDown, roving focus, Home/End, typeahead, Enter commit,
 *     Escape closes back to the trigger with visible focus) and the honest
 *     save-on-change status notice. The panel lives in the development
 *     workspace preview by design (FAP-93: production stops at the connected
 *     account shell), so this part runs on KAN210_WORKSPACE_ORIGIN.
 *
 * No stubs, no request intercepts, no seeded identities: the account is
 * registered live through the real UI and verified through the real oobCode
 * action, matching the FAP-69 v7 integrated journey contract.
 *
 * Environment:
 *   KAN210_ORIGIN           (default http://127.0.0.1:5176 — vite preview of the
 *                            production build; hosts the landing reveal law)
 *   KAN210_WORKSPACE_ORIGIN (default KAN210_ORIGIN — the surface hosting the
 *                            workspace preview shell. The personalization Trust
 *                            panel is a development-preview journey by design
 *                            (FAP-93: production stops at the connected account
 *                            shell), so a vite dev server on this origin carries
 *                            the listbox law with the same real account/backend.)
 *   KAN210_PART         landing | listbox | all (default all)
 *   KAN210_AUTH_HOST    (default 127.0.0.1:59042 — Auth Emulator oobCodes)
 *   KAN210_EVIDENCE_DIR (default docs/visionary/baseline/kan210-workspace-quality)
 *   ALLOW_EVIDENCE_OVERWRITE=1 replaces an existing evidence directory.
 *
 * Backend pairing: the realm backend pins one browser origin for its CSRF law
 * (AUTH_PUBLIC_ORIGIN). Start it with FRONTEND_ORIGIN=$KAN210_WORKSPACE_ORIGIN
 * when driving the listbox part; the landing part needs no backend.
 */
import playwright from 'playwright-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchReviewedBrowser, openEvidenceDir, receiptMeta } from './qa-env.mjs';

const origin = process.env.KAN210_ORIGIN || 'http://127.0.0.1:5176';
const workspaceOrigin = process.env.KAN210_WORKSPACE_ORIGIN || origin;
const authHost = process.env.KAN210_AUTH_HOST || '127.0.0.1:59042';
const part = (process.env.KAN210_PART || 'all').toLowerCase();
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const evidenceDir = path.resolve(productRoot, process.env.KAN210_EVIDENCE_DIR || 'docs/visionary/baseline/kan210-workspace-quality');
await openEvidenceDir(evidenceDir);

const results = [];
const stamp = () => new Date().toISOString();
const startedAt = stamp();
const email = `${Date.now()}.kan210@fixture.invalid`;
const password = 'Kan210-Journey-strong-7!';

const { browser, version } = await launchReviewedBrowser(playwright);
let lastState = { page: null, forensics: [] };
let deviceStateRef = null;
console.log(`[${stamp()}] KAN-210 browser E2E against ${origin} (part=${part}, ${version})`);

const newPage = async ({ reducedMotion } = {}) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...(reducedMotion ? { reducedMotion } : {}),
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  const forensics = [];
  page.on('pageerror', error => forensics.push(`pageerror: ${String(error.message).slice(0, 300)}`));
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      const cookies = await context.cookies(response.url()).catch(() => []);
      const sessionCookie = cookies.find(row => row.name.includes('session') || row.name.includes('visionary'));
      forensics.push(`api ${response.status()} ${response.request().method()} ${response.url().slice(0, 160)} cookie:${sessionCookie ? sessionCookie.name + '=' + String(sessionCookie.value).slice(0, 8) + '…(exp ' + new Date(sessionCookie.expires * 1000).toISOString() + ')' : 'none'}`);
    }
  });
  const state = { context, page, forensics };
  lastState = state;
  return state;
};
const text = page => page.evaluate(() => document.body.innerText);
const click = async (page, label) => {
  await page.waitForFunction(label => [...document.querySelectorAll('button')].some(element => element.textContent.trim() === label && !element.disabled), label, { timeout: 60000 });
  await page.evaluate(label => [...document.querySelectorAll('button')].find(element => element.textContent.trim() === label && !element.disabled).click(), label);
};
const fill = async (page, selector, value) => {
  await page.waitForSelector(selector);
  await page.$eval(selector, element => { element.value = ''; element.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.type(selector, value);
};
const see = (page, value) => page.waitForFunction(value => document.body.innerText.includes(value), value, { timeout: 60000 });
const shot = async (page, name) => page.screenshot({ path: path.join(evidenceDir, name + '.png') });
const dumpPageState = async (state, label) => {
  console.log(`[${stamp()}] FAILURE CONTEXT — ${label}`);
  console.log(`  pathname: ${await state.page.evaluate(() => location.pathname).catch(() => 'n/a')}`);
  try { console.log(`  body: ${(await text(state.page)).slice(0, 700).replaceAll('\n', ' | ')}`); } catch {}
  for (const line of state.forensics.slice(-30)) console.log(`  ${line}`);
  await shot(state.page, 'failure-' + String(label).replace(/\W+/g, '-').slice(0, 40)).catch(() => {});
};

try {
  /* ─── Part A — the reveal law (public landing, no auth) ─── */
  if (part === 'landing' || part === 'all') {
    // 1. Default motion: above-fold chapters are never armed and always visible.
    {
      const state = await newPage();
      await state.page.goto(`${origin}/`, { waitUntil: 'networkidle' });
      const audit = await state.page.evaluate(() => {
        const fold = window.innerHeight;
        return [...document.querySelectorAll('.scroll-reveal')].map(element => {
          const rect = element.getBoundingClientRect();
          return {
            aboveFold: rect.top < fold && rect.bottom > 0,
            armed: element.classList.contains('reveal-armed'),
            opacity: getComputedStyle(element).opacity,
          };
        });
      });
      assert.ok(audit.length > 0, 'the landing page renders scroll-reveal chapters');
      for (const row of audit) {
        if (row.aboveFold) {
          assert.equal(row.armed, false, 'an above-fold chapter is never armed — content is in the first paint');
          assert.equal(row.opacity, '1', 'an above-fold chapter is visible without scrolling');
        }
      }
      const h1 = await state.page.locator('h1').first();
      assert.equal(await h1.evaluate(node => getComputedStyle(node).opacity), '1', 'the landing headline is visible in the first paint');
      assert.ok((await h1.innerText()).trim().length > 0, 'the landing headline renders in the first paint');
      results.push({ leg: 'landing-firstpaint-visible', chapters: audit.length, passed: true, at: stamp() });
      await shot(state.page, 'landing-firstpaint-1440');
      await state.context.close();
    }
    // 2. Print: the print cascade never hides an armed chapter (no-JS crawlers and print see everything).
    {
      const state = await newPage();
      await state.page.goto(`${origin}/`, { waitUntil: 'networkidle' });
      await state.page.emulateMedia({ media: 'print' });
      const audit = await state.page.evaluate(() =>
        [...document.querySelectorAll('.scroll-reveal')].map(element => ({
          opacity: getComputedStyle(element).opacity,
          armed: element.classList.contains('reveal-armed'),
        })));
      assert.ok(audit.length > 0, 'the print document still carries the reveal chapters');
      for (const row of audit) {
        assert.equal(row.opacity, '1', 'print forces every chapter visible, armed or not');
      }
      results.push({ leg: 'landing-print-fully-visible', chapters: audit.length, passed: true, at: stamp() });
      await shot(state.page, 'landing-print-1440');
      await state.context.close();
    }
    // 3. Reduced motion: armed chapters snap fully visible instantly; FadeReveal never rides.
    {
      const state = await newPage({ reducedMotion: 'reduce' });
      await state.page.goto(`${origin}/`, { waitUntil: 'networkidle' });
      // Scroll through the page so every below-fold chapter is encountered.
      await state.page.evaluate(async () => {
        for (let y = 0; y <= document.body.scrollHeight; y += window.innerHeight) {
          window.scrollTo(0, y);
          await new Promise(resolve => setTimeout(resolve, 40));
        }
      });
      const audit = await state.page.evaluate(() =>
        [...document.querySelectorAll('.scroll-reveal')].map(element => ({
          armed: element.classList.contains('reveal-armed'),
          opacity: getComputedStyle(element).opacity,
        })));
      for (const row of audit) assert.equal(row.opacity, '1', 'reduced motion snaps every chapter fully visible, armed or not');
      const fade = await state.page.evaluate(() => {
        const element = document.querySelector('.fade-reveal');
        if (!element) return null;
        const style = getComputedStyle(element);
        return { transitionDuration: style.transitionDuration, transitionTimingFunction: style.transitionTimingFunction };
      });
      if (fade) assert.equal(fade.transitionDuration, '0s', 'FadeReveal has no ride under reduced motion');
      results.push({ leg: 'landing-reduced-motion-instant', chapters: audit.length, fadeRide: fade ? fade.transitionDuration : 'absent', passed: true, at: stamp() });
      await shot(state.page, 'landing-reduced-motion-1440');
      await state.context.close();
    }
  }

  /* ─── Part B — the workspace listbox law (real account, real backend) ─── */
  if (part === 'listbox' || part === 'all') {
    const deviceState = await newPage();
    deviceStateRef = deviceState;
    const device = deviceState;
    // Real enrollment through the workspace surface (FAP-69 v7 journey contract;
    // the workspace preview shell is a development journey by design — FAP-93).
    await device.page.goto(`${workspaceOrigin}/register`, { waitUntil: 'load' });
    await click(device.page, 'Continue with Email');
    await fill(device.page, 'input[type="email"]', email);
    await click(device.page, 'Continue');
    await device.page.waitForSelector('input[type="password"]');
    const signupFields = await device.page.$$('input[type="password"]');
    await signupFields[0].type(password);
    await signupFields[1].type(password);
    await click(device.page, 'Create account');
    await see(device.page, 'I verified my email');
    results.push({ leg: 'register-awaits-verification', passed: true, at: stamp() });
    const codes = await (await fetch(`http://${authHost}/emulator/v1/projects/demo-visionary-kan42/oobCodes`)).json();
    const action = codes.oobCodes.filter(item => item.email === email && item.requestType === 'VERIFY_EMAIL').at(-1);
    assert.ok(action, 'Auth Emulator issued a VERIFY_EMAIL action');
    const verifier = await newPage();
    await verifier.page.goto(`${workspaceOrigin}/auth/action?mode=verifyEmail&oobCode=${encodeURIComponent(action.oobCode)}`, { waitUntil: 'load' });
    await see(verifier.page, 'Your email is verified.');
    await verifier.context.close();
    await click(device.page, 'I verified my email');
    for (let attempt = 0; attempt < 3; attempt++) {
      const reached = await device.page.waitForFunction(() => location.pathname === '/onboarding', null, { timeout: 12000 }).then(() => true).catch(() => false);
      if (reached) break;
      if (await hasButton(device.page, 'I verified my email')) await click(device.page, 'I verified my email');
    }
    await device.page.waitForFunction(() => location.pathname === '/onboarding').catch(async () => {
      await dumpPageState(device, 'enroll-verified-signup');
      throw Error('listbox part: verified signup did not open /onboarding');
    });
    results.push({ leg: 'verified-signup-opens-onboarding', passed: true, at: stamp() });
    // Deterministic Professional onboarding (the FAP-69 v7 4-step path).
    await device.page.waitForFunction(() => [...document.querySelectorAll('button')].some(element => element.textContent.includes('I am a')));
    await device.page.evaluate(() => [...document.querySelectorAll('button')].find(element => element.textContent.includes('I am a Professional')).click());
    await click(device.page, 'Continue');
    await device.page.waitForSelector('input[type="text"]');
    await fill(device.page, 'input[type="text"]', 'Quality Floor User');
    const band = await device.page.$eval('select', element => {
      const values = [...element.options].map(option => option.value).filter(Boolean);
      return values.includes('adult') ? 'adult' : values.at(-1);
    }).catch(() => null);
    if (band) await device.page.selectOption('select', band);
    for (let guard = 0; guard < 6; guard++) {
      if (await device.page.evaluate(() => location.pathname) === '/dashboard/home') break;
      const body = await text(device.page);
      if (body.includes('Skip for now')) await click(device.page, 'Skip for now');
      else if (body.includes('Start using Visionary')) await click(device.page, 'Start using Visionary');
      else if (await hasButton(device.page, 'Continue')) await click(device.page, 'Continue');
      await device.page.waitForTimeout(600);
    }
    assert.equal(await device.page.evaluate(() => location.pathname), '/dashboard/home', 'onboarding reaches the account home');
    if (workspaceOrigin === origin) {
      await see(device.page, 'Your Visionary account');
    } else {
      // The workspace preview shell (development journey) opens the full
      // workspace chrome on the account home.
      await device.page.waitForSelector('.workspace-shell', { timeout: 60000 });
    }
    results.push({ leg: 'onboarding-reaches-account-home', passed: true, at: stamp() });

    // The personalization panel: the workspace listbox law.
    await device.page.goto(`${workspaceOrigin}/dashboard/personalization`, { waitUntil: 'load' });
    await see(device.page, 'Language and accessibility');
    const nativeSelects = await device.page.locator('section.v-preference-panel select').count();
    assert.equal(nativeSelects, 0, 'no native <select> remains in the personalization preference panel');
    const shellNativeSelects = await device.page.locator('select').count();
    /* Observation, not a pass/fail: the topbar WorkspaceSwitcher (FAP-73 shell)
     * still uses a native select outside the panel KAN-210 owns. Flagged for a
     * future shell task so the audit trail stays honest. */
    const triggers = device.page.locator('button[aria-haspopup="listbox"]');
    const triggerCount = await triggers.count();
    assert.ok(triggerCount >= 3, `every panel picker uses the workspace listbox control (found ${triggerCount})`);
    assert.equal(await triggers.nth(0).getAttribute('aria-label'), 'Teaching language', 'the first picker is the teaching language');
    const interfaceTrigger = triggers.nth(1);
    assert.equal(await interfaceTrigger.getAttribute('aria-label'), 'Interface language', 'the second picker is the interface language');
    results.push({ leg: 'personalization-uses-workspace-listbox', triggers: triggerCount, nativeSelects, shellNativeSelects, passed: true, at: stamp() });
    await shot(device.page, 'listbox-personalization-panel');

    /* The panel only renders while open and only one opens at a time, so a
     * structural locator survives the locale re-render (after a Hindi commit
     * every label re-renders in Hindi; the laws must hold in both languages). */
    const panel = device.page.locator('ul[role="listbox"]');
    const focusedText = () => device.page.evaluate(() => document.activeElement?.textContent?.trim());
    const onTrigger = () => device.page.evaluate(() => document.activeElement?.getAttribute('aria-haspopup'));
    const notice = () => device.page.locator('p[role="status"]').last();
    const triggerText = async () => (await interfaceTrigger.innerText()).trim();
    /* openList() lands option focus in a requestAnimationFrame after the panel
     * mounts; every open waits for the roving focus the control itself
     * guarantees before the next key, so no keystroke races the panel. */
    const openPanel = async trigger => {
      await trigger.press('Enter');
      await panel.waitFor();
      await device.page.waitForFunction(() => document.activeElement?.closest('ul[role="listbox"]') instanceof HTMLUListElement, null, { timeout: 15000 });
    };

    // Interface language: open → roving focus → commit → honest notice.
    await interfaceTrigger.click();
    await panel.waitFor();
    await device.page.waitForFunction(() => document.activeElement?.closest('ul[role="listbox"]') instanceof HTMLUListElement, null, { timeout: 15000 });
    assert.equal(await interfaceTrigger.getAttribute('aria-expanded'), 'true', 'the trigger announces the open listbox');
    assert.equal(await panel.getAttribute('aria-label'), 'Interface language', 'the listbox is labelled');
    assert.equal(await panel.locator('[role="option"]').first().getAttribute('aria-selected'), 'true', 'the selected option announces itself');
    assert.match(await focusedText(), /English/, 'opening focuses the selected option (real roving focus)');
    await shot(device.page, 'listbox-open');
    await device.page.keyboard.press('ArrowDown');
    assert.match(await focusedText(), /हिन्दी/, 'ArrowDown moves real focus to the next option');
    await device.page.keyboard.press('Home');
    assert.match(await focusedText(), /English/, 'Home returns roving focus to the first option');
    await device.page.keyboard.press('ArrowDown');
    await shot(device.page, 'listbox-keyboard-focus');
    await device.page.keyboard.press('Enter');
    await panel.waitFor({ state: 'detached' });
    assert.equal(await interfaceTrigger.getAttribute('aria-expanded'), 'false', 'commit closes the listbox');
    assert.match(await triggerText(), /हिन्दी/, 'the trigger shows the committed value');
    assert.equal(await onTrigger(), 'listbox', 'commit returns focus to the trigger');
    const hindiNotice = await notice().textContent().catch(() => '');
    assert.ok(hindiNotice.trim().length > 0, 'the save-on-change status notice surfaces (in the panel language)');
    results.push({ leg: 'listbox-keyboard-commit-hindi', trigger: await triggerText(), notice: hindiNotice.trim().slice(0, 60), passed: true, at: stamp() });
    await shot(device.page, 'listbox-committed-hindi');

    // Escape closes without committing; focus returns visibly to the trigger.
    await openPanel(interfaceTrigger);
    await device.page.keyboard.press('Escape');
    await panel.waitFor({ state: 'detached' });
    assert.match(await triggerText(), /हिन्दी/, 'Escape leaves the committed value unchanged');
    assert.equal(await onTrigger(), 'listbox', 'Escape refocuses the trigger');
    const focusVisible = await device.page.evaluate(() => document.activeElement?.matches(':focus-visible'));
    assert.equal(focusVisible, true, 'the refocused trigger keeps its visible keyboard focus ring');
    results.push({ leg: 'listbox-escape-close-refocus', passed: true, at: stamp() });

    // Outside click closes without committing.
    await interfaceTrigger.click();
    await panel.waitFor();
    await device.page.waitForFunction(() => document.activeElement?.closest('ul[role="listbox"]') instanceof HTMLUListElement, null, { timeout: 15000 });
    await device.page.locator('h1').first().click();
    await panel.waitFor({ state: 'detached' });
    assert.match(await triggerText(), /हिन्दी/, 'an outside click closes without committing');
    results.push({ leg: 'listbox-outside-click-close', passed: true, at: stamp() });

    // Revert to English so the receipt shows a second full commit cycle.
    await openPanel(interfaceTrigger);
    await device.page.keyboard.press('Home');
    await device.page.keyboard.press('Enter');
    await panel.waitFor({ state: 'detached' });
    assert.match(await triggerText(), /English/, 'a second commit cycle lands on English');
    assert.equal((await notice().textContent()).trim(), 'Preference saved on this device.', 'the English commit names the honest local scope');
    results.push({ leg: 'listbox-second-commit-english', passed: true, at: stamp() });

    // Guide appearance: first-letter typeahead selects Indigo.
    const appearanceTrigger = triggers.nth(2);
    assert.equal(await appearanceTrigger.getAttribute('aria-label'), 'Guide appearance', 'the third picker is the guide appearance');
    await appearanceTrigger.click();
    await panel.waitFor();
    await device.page.waitForFunction(() => document.activeElement?.closest('ul[role="listbox"]') instanceof HTMLUListElement, null, { timeout: 15000 });
    await device.page.keyboard.press('i');
    assert.match(await focusedText(), /Indigo/, 'first-letter typeahead moves roving focus to Indigo');
    await shot(device.page, 'listbox-typeahead-focus');
    await device.page.keyboard.press('Enter');
    await panel.waitFor({ state: 'detached' });
    assert.match((await appearanceTrigger.innerText()).trim(), /Indigo/, 'typeahead commits Indigo through the keyboard');
    assert.equal((await notice().textContent()).trim(), 'Guide appearance saved on this device.', 'the appearance commit names its own honest scope');
    results.push({ leg: 'listbox-typeahead-appearance', passed: true, at: stamp() });
    await shot(device.page, 'listbox-appearance-committed');
    await device.context.close();
  }

  const receipt = {
    ...receiptMeta({ route: '/', viewport: '1440x900', role: part === 'listbox' ? 'professional' : 'anonymous', browser: version }),
    part,
    environment: {
      productionOrigin: origin,
      workspaceOrigin,
      workspaceSurfaceNote: 'The personalization Trust panel is the development-preview workspace journey (FAP-93): production stops at the connected account shell, so the listbox law runs on the dev workspace surface with the same real account, Auth Emulator and registered backend.',
      authEmulator: authHost,
      backend: '127.0.0.1:3001 (registered module, disposable synthetic SQL)',
    },
    startedAt,
    finishedAt: stamp(),
    results,
  };
  await fs.writeFile(path.join(evidenceDir, 'kan210-browser-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(`[${stamp()}] KAN-210 E2E GREEN — ${results.length} legs, evidence: ${path.relative(productRoot, evidenceDir)}`);
  console.log(JSON.stringify({ passed: true, legs: results.length, evidence: path.relative(productRoot, evidenceDir) }));
} catch (error) {
  console.log(`[${stamp()}] FAILURE CONTEXT — main catch`);
  const dumps = [lastState, typeof deviceStateRef !== 'undefined' ? deviceStateRef : null].filter(Boolean);
  for (const state of dumps) {
    console.log(`  --- state dump ---`);
    try { console.log(`  pathname: ${await state.page.evaluate(() => location.pathname).catch(() => 'page gone')}`); } catch {}
    try { console.log(`  body: ${(await text(state.page)).slice(0, 700).replaceAll('\n', ' | ')}`); } catch {}
    try {
      const cookies = await state.context.cookies().catch(() => []);
      for (const row of cookies) console.log(`  cookie ${row.name} domain=${row.domain} expires=${row.expires > 0 ? new Date(row.expires * 1000).toISOString() : 'session'} httpOnly=${row.httpOnly} secure=${row.secure} sameSite=${row.sameSite}`);
    } catch {}
    for (const line of state.forensics.slice(-40)) console.log(`  ${line}`);
  }
  await shot(lastState.page, 'failure-main-catch').catch(() => {});
  const receipt = {
    ...receiptMeta({ route: '/', viewport: '1440x900', browser: version }),
    part,
    startedAt, finishedAt: stamp(), results,
    failure: String(error && error.stack || error).slice(0, 2000),
  };
  await fs.writeFile(path.join(evidenceDir, 'kan210-browser-receipt.json'), JSON.stringify(receipt, null, 2) + '\n').catch(() => {});
  console.error(`[${stamp()}] KAN-210 E2E FAILED: ${error.message || error}`);
  process.exitCode = 1;
} finally {
  await browser.close().catch(() => {});
}

async function hasButton(page, label) {
  return page.evaluate(label => [...document.querySelectorAll('button')].some(element => element.textContent.trim() === label && !element.disabled), label);
}
