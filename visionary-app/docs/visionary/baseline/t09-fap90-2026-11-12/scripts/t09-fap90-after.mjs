import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// FAP-90 A/B (after side) on the CANDIDATE worktree (5173).
// Fresh org account + fresh parent account deep-link /dashboard/classes:
// before, the address bar was rewritten to /dashboard/home with no
// explanation; after, the URL is kept and RoleAreaUnavailable explains
// ("Classes — This workspace area opens with a teaching workspace.").
// Also sanity-checks a teacher account still reaches the real Classes page.
// OTP '000000' is the disclosed preview simulation.
const OUT = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t09-fap90-after.json'
const SHOTS = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t09-fap90-after-shots'
const BASE = 'http://127.0.0.1:5173'
const ts = Date.now()
fs.mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errs = []
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)) })
page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 200)))
const results = { base: BASE, accounts: [] }
const save = () => fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
const log = (step, info) => { console.log(`fap90/${step}: ` + JSON.stringify(info).slice(0, 340)); save() }

async function registerAndOnboard(identity) {
  const email = `t09-fap90-${identity}-${ts}@visionary.test`
  await page.goto(BASE + '/register', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(2000)
  await page.getByRole('button', { name: 'Continue with Email' }).first().click()
  await page.locator('input[type="email"]').first().fill(email)
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
  await page.waitForTimeout(1400)
  const card = { organization: 'We are an Organization', parent: 'I am a Parent', teacher: 'I am a Teacher' }[identity]
  await page.getByRole('button', { name: card }).first().click()
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  await page.locator('main input').first().fill(`T09 FAP90 ${identity} user`)
  await page.locator('select').first().selectOption('adult')
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  if (identity === 'organization') {
    await page.locator('main input').first().fill(`FAP90 Academy ${ts}`)
    await page.locator('main select').first().selectOption({ index: 1 })
    await page.locator('button[type="submit"]').last().click()
    await page.waitForTimeout(900)
  }
  if (identity === 'teacher') {
    await page.locator('main select').first().selectOption({ index: 1 })
    await page.locator('button[type="submit"]').last().click()
    await page.waitForTimeout(900)
  }
  for (let step = 0; step < 6; step++) {
    if (/dashboard/.test(new URL(page.url()).pathname)) break
    const start = page.getByRole('button', { name: 'Start using Visionary' })
    if (await start.count()) { await start.first().click(); await page.waitForURL('**/dashboard/**', { timeout: 25000 }); await page.waitForTimeout(2500); break }
    await page.locator('button[type="submit"]').last().click()
    await page.waitForTimeout(800)
  }
  return email
}

try {
  for (const identity of ['organization', 'parent', 'teacher']) {
    const errsBefore = errs.length
    const email = await registerAndOnboard(identity)
    const entry = { identity, email, onboarded: new URL(page.url()).pathname }
    await page.goto(BASE + '/dashboard/classes', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1600)
    entry.classesView = await page.evaluate(() => ({
      url: location.pathname + location.search,
      h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim())[0] ?? null,
      main: (document.querySelector('main')?.innerText || document.body.innerText).slice(0, 380).replace(/\n+/g, ' | '),
    }))
    entry.newConsoleErrors = errs.slice(errsBefore)
    results.accounts.push(entry)
    log(identity, { h1: entry.classesView.h1, url: entry.classesView.url, main: entry.classesView.main.slice(0, 200) })
    await page.screenshot({ path: `${SHOTS}/fap90-${identity}-classes-1440.png` })
    // sign out through the account menu so the next identity starts clean
    await page.goto(BASE + '/dashboard/settings', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1200)
    const signOut = page.getByRole('button', { name: /sign out|Sign out/i }).first()
    if (await signOut.count()) { await signOut.click(); await page.waitForTimeout(1800) } else {
      await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch (e) {} })
    }
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 30000 }).catch(() => {})
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch (e) {} })
    await page.waitForTimeout(600)
  }
  results.consoleErrorsSweep = errs
  log('done', { consoleErrors: errs })
} catch (e) {
  log('ERROR', { message: String(e).slice(0, 300), url: page.url() })
}
save()
await browser.close()
console.log('WROTE ' + OUT)
