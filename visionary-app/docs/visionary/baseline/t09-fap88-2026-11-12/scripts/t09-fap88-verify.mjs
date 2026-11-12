import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// FAP-88 AFTER probe: the exact journey that reproduced the duplicate-key warning
// 4/4 on beta fdfc6a45 (5174), run on the candidate (5173). TWO creation samples:
// first class via the empty-state CTA, second via the header "Create class" button.
const OUT = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t09-fap88-verify.json'
const BASE = 'http://127.0.0.1:5173'
const ts = Date.now()
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errs = []
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push({ type: m.type(), text: m.text().slice(0, 200) }) })
page.on('pageerror', e => errs.push({ type: 'pageerror', text: String(e).slice(0, 200) }))
const results = { email: `t09-fap88-after-${ts}@visionary.test`, base: BASE }
const save = () => fs.writeFileSync(OUT, JSON.stringify({ results, errs }, null, 2))
try {
  await page.goto(BASE + '/register', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(2200)
  await page.getByRole('button', { name: 'Continue with Email' }).first().click()
  await page.locator('input[type="email"]').first().fill(results.email)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(1100)
  const pw = page.locator('input[type="password"]')
  await pw.first().fill('correct-horse-9', { timeout: 20000 })
  if (await pw.count() > 1) await pw.nth(1).fill('correct-horse-9')
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(1600)
  const otp = page.locator('input[autocomplete="one-time-code"]')
  await otp.click({ timeout: 15000 })
  await otp.fill('000000')
  await page.getByRole('button', { name: 'Verify' }).click()
  await page.waitForURL('**/onboarding', { timeout: 20000 })
  await page.waitForTimeout(1500)
  await page.getByRole('button', { name: 'I am a Learner' }).first().click()
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  await page.locator('input[type="text"]').first().fill('T09 FAP-88 fixture')
  await page.locator('select').first().selectOption('adult')
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  for (let step = 0; step < 8; step++) {
    if (/dashboard/.test(new URL(page.url()).pathname)) break
    const start = page.getByRole('button', { name: 'Start using Visionary' })
    if (await start.count()) { await start.first().click(); await page.waitForURL('**/dashboard/**', { timeout: 25000 }); await page.waitForTimeout(2500); break }
    const exam = page.getByRole('button', { name: 'Exam preparation' }).first()
    if (await exam.count()) { await exam.click(); await page.waitForTimeout(500) }
    const sel = page.locator('main select').first()
    if (await sel.count()) await sel.selectOption({ index: 1 })
    await page.locator('button[type="submit"]').last().click()
    await page.waitForTimeout(800)
  }
  console.log('onboarded: ' + page.url())
  await page.locator('select[aria-label="Active workspace"]').selectOption({ value: 'add' })
  await page.waitForTimeout(900)
  await page.locator('[role="dialog"] select[aria-label="Role"]').selectOption('teacher')
  await page.getByRole('button', { name: 'Add role' }).click()
  await page.waitForTimeout(2000)
  await page.goto(BASE + '/dashboard/classes', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1800)

  // creation sample 1: empty-state CTA
  await page.getByRole('button', { name: 'Create your first class' }).click()
  await page.waitForTimeout(900)
  await page.locator('[role="dialog"] input').first().fill(`FAP-88 Verify One ${ts}`)
  await page.locator('[role="dialog"] button[type="submit"]').last().click()
  await page.waitForTimeout(3000)
  const s1 = await page.evaluate(() => ({
    url: location.pathname,
    h1: document.querySelector('h1')?.textContent.trim(),
    cardTitles: [...document.querySelectorAll('.v-class-card h3')].map(h => h.textContent.trim()),
  }))
  results.sample1 = s1
  console.log('sample1: ' + JSON.stringify(s1))
  save()

  // creation sample 2: header "Create class" button (visible with classes present)
  await page.getByRole('button', { name: 'Create class' }).first().click()
  await page.waitForTimeout(900)
  await page.locator('[role="dialog"] input').first().fill(`FAP-88 Verify Two ${ts}`)
  await page.locator('[role="dialog"] button[type="submit"]').last().click()
  await page.waitForTimeout(3000)
  const s2 = await page.evaluate(() => ({
    url: location.pathname,
    cardTitles: [...document.querySelectorAll('.v-class-card h3')].map(h => h.textContent.trim()),
  }))
  results.sample2 = s2
  console.log('sample2: ' + JSON.stringify(s2))
  results.duplicateKeyWarnings = errs.filter(e => /two children with the same key/.test(e.text)).length
  results.consoleIssues = errs
  console.log('duplicate-key warnings: ' + results.duplicateKeyWarnings)
  console.log('console issues: ' + JSON.stringify(errs))
} catch (e) {
  results.error = String(e).slice(0, 300)
  console.log('ERROR: ' + results.error)
}
save()
await page.screenshot({ path: 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t09-fap88-after-classes.png' })
await browser.close()
console.log('WROTE ' + OUT)
