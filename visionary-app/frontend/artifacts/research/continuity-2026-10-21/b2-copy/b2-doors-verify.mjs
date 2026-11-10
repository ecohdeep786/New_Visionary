/**
 * B2/FAP-47 door verification — after the 29 approved doors.
 * Walks the door routes, waits for settle, and asserts every approved door
 * label is present in the page text, rendered inside a quiet link (min-h-11).
 */
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || '5188';
const OUT = path.dirname(fileURLToPath(import.meta.url));

const DOORS = {
  '/partners': ['See who we partner with', 'What the programme covers', 'Begin the conversation', 'Straight answers, before you write'],
  '/accessibility': ['See how it keeps going across devices', 'Reading-setup guides in the Help center', 'Hear how asking works', 'Try the web build, keyboard-first', 'Ask us about your language', 'Tell us what is missing'],
  '/download': ['See how the product works first', 'Questions about your devices', 'Setup guides live in the Help center'],
  '/careers': ['Meet the areas of work', 'The story behind the work', 'Ask a hiring question'],
  '/research': ['What the intelligence does today', 'The research areas, role by role', 'The same work, announced plainly'],
  '/referral': ['Ask a referral question'],
  '/safety': ['The protections, up close', 'Ask the safety team a question first'],
  '/how-it-works': ['Try the loop yourself'],
  '/': ['See how the loop remembers your place'],
  '/terms': ['Talk to a person'],
  '/privacy': ['Talk to a person'],
  '/security': ['Talk to a person'],
  '/cookies': ['Talk to a person'],
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
let missing = 0;
for (const [route, labels] of Object.entries(DOORS)) {
  await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('main', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2200);
  const found = await page.evaluate((want) => {
    const body = (document.querySelector('#main') || document.body).innerText.replace(/\s+/g, ' ');
    const links = [...document.querySelectorAll('main a')].map((a) => ({
      t: (a.innerText || '').replace(/\s+/g, ' ').trim(),
      h: (a.getBoundingClientRect().height >= 40),
    }));
    return want.map((w) => {
      const link = links.find((l) => l.t.includes(w));
      return { w, inText: body.includes(w), asLink: !!link, tall: link ? link.h : false };
    });
  }, labels);
  for (const r of found) {
    if (!r.inText || !r.asLink) { missing++; console.log(`MISSING ${route}: ${r.w} inText=${r.inText} asLink=${r.asLink}`); }
    else if (!r.tall) { missing++; console.log(`SHORT-HIT ${route}: ${r.w}`); }
  }
  if (!found.some((r) => !r.inText || !r.asLink)) console.log(`ok ${route} (${labels.length} doors)`);
}
await browser.close();
console.log(missing === 0 ? 'ALL DOORS RENDER ✓' : `problems: ${missing}`);
