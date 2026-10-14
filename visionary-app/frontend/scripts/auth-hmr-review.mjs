import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

// No live login or cookie changes: memory-only HTTP profile fixtures.
const file = fileURLToPath(new URL('../src/lib/AuthContext.jsx', import.meta.url));
const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname === '/api/auth/me') return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'auth-hmr-fixture', email: 'hmr@fixture.invalid', full_name: 'HMR Fixture', identity: 'professional', education_stage: 'professional', age_band: 'adult', auth_source: 'firebase', onboarding_complete: true }) });
    if (url.origin !== 'http://localhost:5173') return request.abort();
    return request.continue();
  });
  await page.goto('http://localhost:5173/dashboard/home', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.body.innerText.includes('Welcome back'));
  let finish;
  const updated = new Promise(resolve => { finish = resolve; });
  page.on('console', message => { if (message.text().includes('hot updated')) finish(); });
  const bytes = await fs.readFile(file);
  const now = new Date(); await fs.utimes(file, now, now);
  await Promise.race([updated, new Promise((_, reject) => setTimeout(() => reject(Error('HMR update did not arrive')), 15000))]);
  await page.waitForFunction(() => document.body.innerText.includes('Welcome back'));
  assert.deepEqual(await fs.readFile(file), bytes, 'HMR check must retain source bytes');
  assert.deepEqual(errors, []);
  assert.equal(new URL(page.url()).pathname, '/dashboard/home');
  console.log('PASS: auth provider hot reload retains the shared context, saved account route and source bytes; no page exceptions.');
} finally { await browser.close(); }
