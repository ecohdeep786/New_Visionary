import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// FAP-89 research (before side) on MERGED beta (5174, ce2c391a).
// A fresh organization account sweeps org-denied routes to capture the current
// "Permission required" copy: personal-learning routes (learn/practice/build/
// classes/ask) currently tell the Owner to "Ask the organization owner" —
// self-referential and false (no org profile grants those sections).
// OTP is the preview-simulated '000000' (disclosed; not email delivery).
const OUT = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t09-fap89-org-denials.json'
const SHOTS = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t09-fap89-shots'
const BASE = 'http://127.0.0.1:5174'
const ts = Date.now()
fs.mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errs = []
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)) })
page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 200)))
const results = { email: `t09-orgdeny-${ts}@visionary.test`, base: BASE, mergedBeta: 'ce2c391a', routes: [], consoleErrorsBefore: [] }
const save = () => fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
const log = (step, info) => { console.log(`fap89/${step}: ` + JSON.stringify(info).slice(0, 320)); save() }
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
  await page.getByRole('button', { name: 'We are an Organization' }).first().click()
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  await page.locator('main input').first().fill('T09 Org Denial user')
  await page.locator('select').first().selectOption('adult')
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  // preferences step: Organization name + Organization type
  await page.locator('main input').first().fill(`Denial Research Academy ${ts}`)
  await page.locator('main select').first().selectOption({ index: 1 })
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  for (let step = 0; step < 6; step++) {
    if (/dashboard/.test(new URL(page.url()).pathname)) break
    const start = page.getByRole('button', { name: 'Start using Visionary' })
    if (await start.count()) { await start.first().click(); await page.waitForURL('**/dashboard/**', { timeout: 25000 }); await page.waitForTimeout(2500); break }
    await page.locator('button[type="submit"]').last().click()
    await page.waitForTimeout(800)
  }
  const home = await page.evaluate(() => ({ url: location.pathname, h1: document.querySelector('h1')?.textContent.trim() || null }))
  log('onboarded', home)
  await page.screenshot({ path: `${SHOTS}/fap89-org-home-1440.png` })

  for (const route of ['/dashboard/learn', '/dashboard/practice', '/dashboard/build', '/dashboard/classes', '/dashboard/ask', '/dashboard/people', '/dashboard/analytics', '/dashboard/audit', '/dashboard/subscription', '/dashboard/settings']) {
    const errsBefore = errs.length
    await page.goto(BASE + route, { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1400)
    const state = await page.evaluate(() => ({
      url: location.pathname + location.search,
      h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim())[0] ?? null,
      main: (document.querySelector('main')?.innerText || document.body.innerText).slice(0, 420).replace(/\n+/g, ' | '),
    }))
    state.requested = route
    state.newConsoleErrors = errs.slice(errsBefore)
    results.routes.push(state)
    log(route, { h1: state.h1, url: state.url, main: state.main.slice(0, 180) })
  }
  await page.screenshot({ path: `${SHOTS}/fap89-org-learn-denial-1440.png` })
  results.consoleErrorsSweep = errs
  log('done', { consoleErrors: errs })
} catch (e) {
  log('ERROR', { message: String(e).slice(0, 300), url: page.url() })
}
save()
await browser.close()
console.log('WROTE ' + OUT)
