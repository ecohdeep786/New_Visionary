import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// Bisect the duplicate-key warning: which exact render emits it?
// Phases: A empty classes list -> B create modal open -> C class created (list render)
// -> D class detail page.
const OUT = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t09-r2-bisect.json'
const BASE = 'http://127.0.0.1:5174'
const ts = Date.now()
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errs = []
let phase = 'start'
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push({ phase, type: m.type(), text: m.text().slice(0, 240) }) })
page.on('pageerror', e => errs.push({ phase, type: 'pageerror', text: String(e).slice(0, 240) }))
const results = { email: `t09-r2-bisect-${ts}@visionary.test` }
const save = () => fs.writeFileSync(OUT, JSON.stringify({ results, errs }, null, 2))
const mark = (name, url) => { results[name] = { url }; console.log(`${name}: ${url} (errs so far: ${errs.length})`); save() }

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
await page.locator('input[type="text"]').first().fill('T09 Bisect fixture')
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
mark('onboarded', page.url())

await page.locator('select[aria-label="Active workspace"]').selectOption({ value: 'add' })
await page.waitForTimeout(900)
await page.locator('[role="dialog"] select[aria-label="Role"]').selectOption('teacher')
await page.getByRole('button', { name: 'Add role' }).click()
await page.waitForTimeout(2000)
mark('teacher-role', page.url())

phase = 'A-empty-list'
await page.goto(BASE + '/dashboard/classes', { waitUntil: 'load', timeout: 30000 })
await page.waitForTimeout(2200)
mark('A-empty-list', page.url())

phase = 'B-modal-open'
await page.getByRole('button', { name: 'Create your first class' }).click()
await page.waitForTimeout(1200)
mark('B-modal-open', page.url())

phase = 'C-class-created-list'
await page.locator('[role="dialog"] input').first().fill(`T09 Bisect Class ${ts}`)
await page.locator('[role="dialog"] button[type="submit"]').last().click()
await page.waitForTimeout(2500)
const listState = await page.evaluate(() => ({ url: location.pathname, h1: document.querySelector('h1')?.textContent.trim(), cards: document.querySelectorAll('.v-class-stats, [class*="ClassCard"]').length }))
results.C = listState
console.log('C-state: ' + JSON.stringify(listState))
mark('C-class-created-list', page.url())

phase = 'D-class-detail'
const card = page.locator('a[href*="/dashboard/class/"]').first()
if (await card.count()) { await card.click(); await page.waitForTimeout(2500) }
mark('D-class-detail', page.url())

save()
await browser.close()
console.log('ERRS: ' + JSON.stringify(errs, null, 1))
