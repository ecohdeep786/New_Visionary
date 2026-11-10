/**
 * B2/FAP-47 — settled full-page captures of the door routes (1440), for the
 * evidence pack. PNGs land in artifacts/research/continuity-2026-10-21/b2-screens/.
 */
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5188';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'b2-screens');

const SHOTS = [
  ['/', ['home-frontend-door', '03-promise quiet door']],
  ['/partners', ['partners-doors', '4 narrative doors']],
  ['/accessibility', ['accessibility-doors', '6 doors + label lead-in']],
  ['/download', ['download-doors', '3 doors']],
  ['/careers', ['careers-doors', '3 doors']],
  ['/research', ['research-doors', '3 doors']],
  ['/referral', ['referral-honesty-door', 'honesty door + label']],
  ['/safety', ['safety-doors', '2 doors']],
  ['/how-it-works', ['howitworks-loop-door', 'loop door']],
  ['/terms', ['terms-contact-door', 'legal close door']],
  ['/privacy', ['privacy-contact-door', 'legal close door']],
  ['/security', ['security-contact-door', 'legal close door']],
  ['/cookies', ['cookies-contact-door', 'legal close door']],
  ['/about', ['about-label', 'label lead-in record']],
  ['/community', ['community-label', 'label lead-in record']],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
for (const [route, [file, note]] of SHOTS) {
  await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('main', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2600);
  const p = path.join(OUT, `${file}-1440.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log(`captured ${route} -> ${file} (${note})`);
}
await browser.close();
console.log('DONE — 15 captures');
