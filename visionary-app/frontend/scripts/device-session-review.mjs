import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

// Real compiled frontend + Nest controller/service, with isolated fictional
// Firebase identity and transactional memory storage. Never loads credentials,
// sends mail, or contacts a hosted identity/database provider.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const req = createRequire(path.join(root, 'backend/upstream/backend/package.json'));
req('reflect-metadata');
const { Module } = req('@nestjs/common'), { ConfigService } = req('@nestjs/config'), { NestFactory } = req('@nestjs/core');
const express = req('express');
const { FirebaseProductController } = req('./dist/src/auth/firebase-product/firebase-product.controller.js');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { memoryFirestore } = req('../../tests/fixtures/firestore-memory.cjs');
const { db, rows } = memoryFirestore();
console.log('Device review: constructing isolated auth server');
let serial = 0, passiveOutage = false, outageReads = 0;
const cookies = new Map();
const identity = { uid: 'session-review-adult', email: 'fixture@example.test', email_verified: true, firebase: { sign_in_provider: 'password' } };
const auth = {
  verifyIdToken: async token => { assert.equal(token, 'fictional-token'); return { ...identity, auth_time: Math.floor(Date.now() / 1000) }; },
  createSessionCookie: async () => { const cookie = `fictional-cookie-${++serial}`; cookies.set(cookie, { ...identity }); return cookie; },
  verifySessionCookie: async cookie => { if (!cookies.has(cookie)) throw { code: 'auth/invalid-session-cookie' }; return cookies.get(cookie); },
};
const config = new ConfigService({ AUTH_RATE_LIMIT_KEY: 'fictional-device-review-key-that-is-long-enough' });
const service = new FirebaseProductService({ getAuth: () => auth }, config); service.db = () => db;
class FixtureModule {}
Module({ controllers: [FirebaseProductController], providers: [{ provide: FirebaseProductService, useValue: service }, { provide: ConfigService, useValue: config }] })(FixtureModule);
const app = await NestFactory.create(FixtureModule, { logger: false });
app.use(req('cookie-parser')()); app.setGlobalPrefix('api');
app.use((request, response, next) => {
  if (passiveOutage && request.path === '/api/auth/me' && request.query.passive === '1') { ++outageReads; return response.status(503).json({ message: 'Fictional storage outage' }); }
  next();
});
app.use(express.static(path.join(root, 'frontend/dist')));
app.use((request, response, next) => request.path.startsWith('/api/') ? next() : response.sendFile(path.join(root, 'frontend/dist/index.html')));
await app.listen(0, '127.0.0.1');
const origin = await app.getUrl(); config.set('AUTH_PUBLIC_ORIGIN', origin);
console.log('Device review: isolated server listening; launching browser');
const output = path.join(root, 'artifacts/qa/kan34/device-sessions'); await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true });
// Separate browser processes model two active devices. Two tabs in one browser
// can hide each other when Radix restores focus after an issuer sign-out.
const peerBrowser = await puppeteer.launch({ headless: true });
console.log('Device review: browser started');
const results = [];
const authReads = new Map();
const passiveReads = new Map();
const seed = async context => {
  const csrfResponse = await fetch(`${origin}/api/auth/csrf`), csrf = await csrfResponse.json();
  const csrfCookie = csrfResponse.headers.getSetCookie()[0].split(';')[0];
  const response = await fetch(`${origin}/api/auth/session`, { method: 'POST', headers: { Origin: origin, Cookie: csrfCookie, 'X-CSRF-Token': csrf.token, 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: 'fictional-token' }) });
  assert.equal(response.status, 201); const profile = await response.json();
  const issued = response.headers.getSetCookie().map(cookie => cookie.split(';')[0]);
  await context.setCookie(...[csrfCookie, ...issued].map(cookie => { const index = cookie.indexOf('='); return { name: cookie.slice(0, index), value: cookie.slice(index + 1), domain: new URL(origin).hostname, path: '/', httpOnly: true, sameSite: 'Strict', expires: Math.floor(Date.now() / 1000) + 14 * 86400 }; }));
  return profile;
};
try {
  for (const width of [1280, 390]) {
    console.log(`Device review: ${width}px two-device scenario`);
    // Native auth_time uses seconds; a fresh sign-in must follow the cutoff.
    if (results.length) await new Promise(resolve => setTimeout(resolve, 1100));
    const contexts = await Promise.all([browser.createBrowserContext(), peerBrowser.createBrowserContext()]);
    const pages = await Promise.all(contexts.map(async context => {
      const page = await context.newPage(); await page.setViewport({ width, height: 900 });
      page.setDefaultNavigationTimeout(60000);
      await page.setRequestInterception(true);
      page.on('request', request => {
        const target = new URL(request.url());
        if (target.origin === origin && target.pathname === '/api/auth/me') authReads.set(page, (authReads.get(page) || 0) + 1);
        if (target.origin === origin && target.pathname === '/api/auth/me' && target.searchParams.get('passive') === '1') passiveReads.set(page, (passiveReads.get(page) || 0) + 1);
        return target.origin === origin ? request.continue() : request.abort();
      });
      await seed(context); return page;
    }));
    if (!results.length) {
      assert.equal((await service.me(identity.uid)).onboarding_complete, false);
      const draftKey = `visionary_onboarding_${identity.uid}`;
      const seeded = await pages[0].evaluateOnNewDocument(key => localStorage.setItem(key, JSON.stringify({ phase: 'identity', data: { full_name: 'Unsaved fixture draft', identity: 'professional', preferred_language: 'English' } })), draftKey);
      await pages[0].goto(`${origin}/dashboard/home`, { waitUntil: 'domcontentloaded' });
      await pages[0].removeScriptToEvaluateOnNewDocument(seeded.identifier);
      await pages[0].waitForFunction(() => location.pathname === '/onboarding', { polling: 100 });
      assert.ok(authReads.get(pages[0]) > 0, 'Build the frontend with VITE_AUTH_MODE=firebase before this review');
      await pages[0].bringToFront();
      const draftBefore = await pages[0].evaluate(key => localStorage.getItem(key), draftKey), observationsBefore = passiveReads.get(pages[0]) || 0;
      await service.completeOnboarding(identity.uid, { full_name: 'Session Review Adult', identity: 'professional', age_band: 'adult', preferred_language: 'English' });
      await service.completeIntroduction(identity.uid, {});
      await pages[0].waitForFunction(() => location.pathname === '/dashboard/home', { timeout: 45000, polling: 100 });
      assert.ok((passiveReads.get(pages[0]) || 0) > observationsBefore, 'Still-open onboarding must observe the other device completion');
      assert.equal(await pages[0].evaluate(key => localStorage.getItem(key), draftKey), draftBefore, 'Passive sync must preserve the unfinished local draft');
      console.log('Device review: open onboarding synchronized and draft retained');
    }
    for (const page of pages) {
      await page.goto(`${origin}/dashboard/home`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('header.workspace-topbar');
      assert.equal(new URL(page.url()).pathname, '/dashboard/home');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    // A returning device restores the same account without provider login.
    await pages[1].reload({ waitUntil: 'domcontentloaded' }); await pages[1].waitForSelector('header.workspace-topbar');
    console.log(`Device review: ${width}px shared dashboard and return session restored`);
    passiveOutage = true; const before = outageReads;
    await pages[1].bringToFront(); await pages[1].evaluate(() => window.dispatchEvent(new Event('focus')));
    await pages[1].waitForFunction(() => document.querySelector('header.workspace-topbar'));
    const deadline = Date.now() + 10000;
    while (outageReads === before && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
    assert.ok(outageReads > before); await new Promise(resolve => setTimeout(resolve, 1800));
    assert.equal(new URL(pages[1].url()).pathname, '/dashboard/home');
    console.log(`Device review: ${width}px passive outage preserved signed-in UI`);
    passiveOutage = false;
    await pages[0].bringToFront();
    await pages[0].click('button[aria-label="Open account menu"]');
    await pages[0].waitForSelector('[role="menuitem"]');
    await pages[0].screenshot({ path: path.join(output, `all-device-menu-${width}.png`), fullPage: true });
    await pages[1].bringToFront();
    assert.equal(await pages[1].evaluate(() => document.hidden), false);
    const started = Date.now();
    const previousVersion = rows.get(`visionary_accounts/${identity.uid}`).authSessionVersion || 0;
    // Keep the other device visible: its timer must discover revocation without
    // reloading or receiving a same-browser storage/broadcast event.
    await pages[0].evaluate(() => [...document.querySelectorAll('[role="menuitem"]')].find(item => item.textContent.trim() === 'Sign out on all devices').click());
    await pages[0].waitForFunction(() => location.pathname === '/login', { polling: 100 });
    assert.equal(rows.get(`visionary_accounts/${identity.uid}`).authSessionVersion, previousVersion + 1, 'The UI must commit all-device revocation, not local logout');
    assert.equal(await pages[1].evaluate(() => document.hidden), false, 'The peer device must remain visible for timer observation');
    try { await pages[1].waitForFunction(() => location.pathname === '/login', { timeout: 45000, polling: 100 }); }
    catch (error) {
      console.error('Peer device observation failed', JSON.stringify(await pages[1].evaluate(async () => ({ hidden: document.hidden, path: location.pathname, passiveStatus: (await fetch('/api/auth/me?passive=1', { cache: 'no-store' })).status }))));
      await pages[1].screenshot({ path: path.join(output, `peer-observation-failed-${width}.png`), fullPage: true });
      throw error;
    }
    assert.ok(Date.now() - started < 45000);
    await pages[1].screenshot({ path: path.join(output, `other-device-signed-out-${width}.png`), fullPage: true });
    assert.equal((await service.me(identity.uid)).onboarding_complete, true);
    console.log(`Device review: ${width}px both devices signed out`);
    results.push({ width, sharedProfile: true, newUserSetupOnly: true, reloadRestored: true, passiveOutagePreserved: true, globalLogout: true, otherDeviceObservedWithoutReload: true, providerAcceptance: false });
    await Promise.all(contexts.map(context => context.close()));
  }
  assert.equal([...rows.keys()].filter(key => /^visionary_accounts\/[^/]+$/.test(key)).length, 1);
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ results, hostedVerified: false }, null, 2));
  console.log(JSON.stringify({ passed: results.length, scenarios: results, hostedVerified: false }));
} finally { await Promise.all([browser.close(), peerBrowser.close()]); await app.close(); }
