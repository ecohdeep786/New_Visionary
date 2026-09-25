// Visual verification: AGI listening animation on the search pill + sidebar pill states.
// Context B grants the microphone so the ring enters its real listening animation.
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });

async function goto(page, url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }); return; }
    catch (e) { if (attempt === 3) throw e; await page.waitForTimeout(1500); }
  }
}

async function enter(page) {
  await goto(page, `${BASE}/dev/scenarios`);
  await page.getByRole('button', { name: /Aarav/ }).first().click();
  await page.waitForURL('**/dashboard/home', { timeout: 20000 });
  await page.waitForTimeout(1800);
}

// A. Static availability ring (no mic permission).
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await enter(page);
  await page.screenshot({ path: 'scripts-tmp/ring-static.png', clip: { x: 300, y: 0, width: 840, height: 66 } });
  await context.close();
}

// B. Listening: the headless SpeechRecognition layer denies even with a granted context
// permission, so the visual script injects a minimal recognition mock at the browser
// level (the same runtime-injection technique as tests/voice.test.mjs — no product code
// changes) while keeping the REAL analyser for amplitude. The ring then runs its true
// listening animation.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['microphone'] });
  await context.addInitScript(() => {
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    window.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; } };
    class MockRecognition { constructor() { this.onresult = null; this.onerror = null; this.onend = null; this.lang = ''; this.continuous = false; this.interimResults = false; } start() {} stop() {} abort() {} }
    // Plain assignment does not shadow the native getter; defineProperty does.
    Object.defineProperty(window, 'webkitSpeechRecognition', { value: MockRecognition, writable: true, configurable: true });
    Object.defineProperty(window, 'SpeechRecognition', { value: MockRecognition, writable: true, configurable: true });
  });
  const page = await context.newPage();
  await enter(page);
  const status = (await page.locator('.v-audio-anchor [role="status"]').textContent()).trim();
  console.log('listening status:', status);
  await page.screenshot({ path: 'scripts-tmp/ring-listen-1.png', clip: { x: 300, y: 0, width: 840, height: 66 } });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scripts-tmp/ring-listen-2.png', clip: { x: 300, y: 0, width: 840, height: 66 } });
  await context.close();
}

// C. Sidebar pill states: active Home (blue) and hovered Learn (neutral).
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await enter(page);
  await page.getByRole('link', { name: 'Learn' }).first().hover();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'scripts-tmp/sidebar-states.png', clip: { x: 0, y: 0, width: 264, height: 420 } });
  // Collapsed rail: icon-only active pill.
  await page.getByRole('button', { name: 'Toggle navigation' }).first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts-tmp/sidebar-collapsed.png', clip: { x: 0, y: 0, width: 100, height: 420 } });
  await context.close();
}

await browser.close();
console.log('captured');
