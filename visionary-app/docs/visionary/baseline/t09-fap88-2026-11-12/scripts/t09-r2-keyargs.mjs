import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// Capture the duplicate-key warning's ARGS (the actual duplicated key value).
const OUT = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t09-r2-key-args.json'
const BASE = 'http://127.0.0.1:5174'
const ts = Date.now()
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const hits = []
page.on('console', async m => {
  if (/two children with the same key/.test(m.text())) {
    const args = []
    for (const a of m.args()) {
      try { args.push(await a.jsonValue()) } catch { args.push('<unserializable>') }
    }
    const loc = m.location()
    hits.push({ text: m.text().slice(0, 160), args, url: page.url(), loc })
    fs.writeFileSync(OUT, JSON.stringify(hits, null, 2))
  }
})
const results = { email: `t09-r2-key-${ts}@visionary.test` }
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
  await page.locator('input[type="text"]').first().fill('T09 Key fixture')
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
  await page.getByRole('button', { name: 'Create your first class' }).click()
  await page.waitForTimeout(900)
  await page.locator('[role="dialog"] input').first().fill(`T09 Key Class ${ts}`)
  await page.locator('[role="dialog"] button[type="submit"]').last().click()
  await page.waitForTimeout(2500)
  console.log('class created; hits: ' + hits.length)
} catch (e) {
  results.error = String(e).slice(0, 250)
  console.log('ERROR: ' + results.error)
}
fs.writeFileSync(OUT, JSON.stringify({ results, hits }, null, 2))
console.log('WROTE ' + OUT)
await browser.close()
