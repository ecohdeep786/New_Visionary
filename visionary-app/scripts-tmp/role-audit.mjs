// Full-category audit: renders every role's Home + core pages in the running product,
// checks rendering, page errors and overflow at 1440 and 390, and logs the verdicts.
import { chromium } from 'playwright-core';
const BASE = 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const roles = [
  { persona: /Aarav/, name: 'student', pages: ['/dashboard/learn', '/dashboard/practice', '/dashboard/build', '/dashboard/classes'] },
  { persona: /Dev/, name: 'teacher', pages: ['/dashboard/prepare', '/dashboard/classes', '/dashboard/learners'] },
  { persona: /Anika/, name: 'parent', pages: ['/dashboard/child', '/dashboard/reports'] },
  { persona: /Sam/, name: 'professional', pages: ['/dashboard/career', '/dashboard/build'] },
  { persona: /School administrator/, name: 'organization', pages: ['/dashboard/cohorts', '/dashboard/people', '/dashboard/analytics'] },
];
const audit = [];
for (const role of roles) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 100)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 100)); });
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { await page.goto(`${BASE}/dev/scenarios`, { waitUntil: 'networkidle', timeout: 30000 }); break; }
    catch (e) { if (attempt === 3) throw e; await page.waitForTimeout(1500); }
  }
  await page.getByRole('button', { name: role.persona }).first().click();
  await page.waitForURL('**/dashboard/home', { timeout: 20000 });
  await page.waitForTimeout(1500);
  const homeOk = await page.evaluate(() => document.body.innerText.includes('Welcome back') || document.body.innerText.length > 100);
  const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  audit.push(`${role.name}/home: rendered=${homeOk} overflow1440=${homeOverflow}`);
  await page.screenshot({ path: `scripts-tmp/audit-${role.name}-home.png` });
  for (const route of role.pages) {
    const pageErrorsBefore = errors.length;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try { await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 }); break; }
      catch (e) { if (attempt === 3) errors.push('goto-fail: ' + route); await page.waitForTimeout(1200); }
    }
    await page.waitForTimeout(1200);
    const text = await page.evaluate(() => document.body.innerText.length);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    // 390 check on home only for speed; overflow at 1440 for pages.
    audit.push(`${role.name}${route}: text=${text} overflow1440=${overflow} newErrors=${errors.length - pageErrorsBefore}${errors.length > pageErrorsBefore ? ' [' + errors[pageErrorsBefore] + ']' : ''}`);
    await page.screenshot({ path: `scripts-tmp/audit-${role.name}${route.replaceAll('/', '-')}.png` });
  }
  // Mobile home check.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/dashboard/home`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const mOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  audit.push(`${role.name}/home@390: overflow=${mOverflow}`);
  await context.close();
}
await browser.close();
console.log(audit.join('\n'));
