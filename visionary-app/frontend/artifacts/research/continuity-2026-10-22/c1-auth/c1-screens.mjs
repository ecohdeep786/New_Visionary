/**
 * C1/FAP-49 flow captures — "Auth to the one system".
 * `node c1-screens.mjs` on PORT=5192 records the preview-surface auth flows.
 * The real mobile (phone) journey is captured from PORT2=5175 (emulator build,
 * VITE_ENABLE_PHONE_SIGNIN=1) — methods, number entry, and the OTP step.
 */
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5192';
const PORT2 = process.env.PORT2 || '5175';
const OUT = path.dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

const shot = async name => page.screenshot({ path: path.join(OUT, name), fullPage: true });
const goto = async (base, route) => { await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 }); await page.waitForSelector('[data-font-surface="product"]', { timeout: 30000 }); await page.waitForTimeout(700); };

for (const w of [1440, 768, 390]) {
  await page.setViewportSize({ width: w, height: 960 });
  await goto(`http://localhost:${PORT}`, '/login');
  await shot(`auth-login-methods-${w}.png`);
}

await page.setViewportSize({ width: 1440, height: 960 });
// login email + error state
await goto(`http://localhost:${PORT}`, '/login');
await page.click('button:has-text("Continue with Email")');
await page.waitForTimeout(450);
await shot('auth-login-email-1440.png');
await page.fill('input[type="email"]', `c1-capture-${Date.now()}@fixture.invalid`);
await page.click('button[type="submit"]:has-text("Continue")');
await page.waitForTimeout(900);
await shot('auth-login-email-error-1440.png');
// register methods + email
await goto(`http://localhost:${PORT}`, '/register');
await shot('auth-register-methods-1440.png');
await page.setViewportSize({ width: 390, height: 960 });
await shot('auth-register-methods-390.png');
await page.setViewportSize({ width: 1440, height: 960 });
await page.click('button:has-text("Continue with Email")');
await page.waitForTimeout(450);
await shot('auth-register-email-1440.png');
// forgot flows
await page.setViewportSize({ width: 390, height: 960 });
await goto(`http://localhost:${PORT}`, '/forgot-password');
await shot('auth-forgot-password-390.png');
await page.setViewportSize({ width: 1440, height: 960 });
await goto(`http://localhost:${PORT}`, '/forgot-password');
await shot('auth-forgot-password-1440.png');
await page.fill('input[type="email"]', `c1-capture-${Date.now()}@fixture.invalid`);
await page.click('button[type="submit"]');
await page.waitForTimeout(800);
await shot('auth-forgot-password-sent-1440.png');
await goto(`http://localhost:${PORT}`, '/forgot-user-id');
await shot('auth-forgot-user-id-1440.png');
await goto(`http://localhost:${PORT}`, '/reset-password');
await shot('auth-reset-password-needs-new-link-1440.png');

// real mobile journey captured on the emulator build (phone option present)
await page.setViewportSize({ width: 390, height: 960 });
await goto(`http://localhost:${PORT2}`, '/login');
await shot('auth-login-phone-enabled-390.png');
await page.click('button:has-text("Continue with Mobile Number")');
await page.waitForTimeout(500);
await shot('auth-login-mobile-390.png');
await page.fill('input[type="tel"]', '5551234567');
await page.click('button[type="submit"]:has-text("Send code")');
await page.waitForTimeout(1600);
await shot('auth-login-mobile-otp-390.png');

await browser.close();
console.log('C1 captures written to', OUT);
