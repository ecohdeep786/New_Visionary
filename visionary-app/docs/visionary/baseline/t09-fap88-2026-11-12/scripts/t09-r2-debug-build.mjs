import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'

// Debug: why does the Build "New project" dialog not mount? Fresh adult learner account.
const BASE = 'http://127.0.0.1:5174'
const ts = Date.now()
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const msgs = []
page.on('console', m => { if (['error', 'warning', 'log'].includes(m.type())) msgs.push(`[${m.type()}] ` + m.text().slice(0, 200)) })
page.on('pageerror', e => msgs.push('[pageerror] ' + String(e).slice(0, 300)))

await page.goto(BASE + '/register', { waitUntil: 'load', timeout: 30000 })
await page.waitForTimeout(2200)
await page.getByRole('button', { name: 'Continue with Email' }).first().click()
await page.locator('input[type="email"]').first().fill(`t09-dbg2-${ts}@visionary.test`)
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
await page.locator('input[type="text"]').first().fill('T09 Debug2')
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
console.log('URL: ' + page.url())

await page.goto(BASE + '/dashboard/build', { waitUntil: 'load', timeout: 30000 })
await page.waitForTimeout(2200)
const before = await page.evaluate(() => ({
  url: location.pathname,
  h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim())[0] ?? null,
  dialogs: document.querySelectorAll('[role="dialog"]').length,
  buttons: [...document.querySelectorAll('button')].map(b => ({ t: b.textContent.trim().slice(0, 30), disabled: b.disabled, visible: !!b.offsetParent })).slice(0, 12),
}))
console.log('BEFORE: ' + JSON.stringify(before))

const btn = page.getByRole('button', { name: 'New project' }).first()
console.log('BUTTON-COUNT: ' + await page.getByRole('button', { name: 'New project' }).count())
await btn.click()
await page.waitForTimeout(1200)
const after = await page.evaluate(() => ({
  dialogs: document.querySelectorAll('[role="dialog"]').length,
  dialogRoles: [...document.querySelectorAll('[role="dialog"]')].map(d => d.getAttribute('aria-label') || d.querySelector('h2,h1')?.textContent || '?'),
  inputsInDialog: [...document.querySelectorAll('[role="dialog"] input')].length,
  overlay: !!document.querySelector('[data-state="open"]'),
  bodyTail: [...document.body.children].slice(-4).map(e => e.tagName + '.' + (e.className || '').toString().slice(0, 40)),
  viteOverlay: !!document.querySelector('vite-error-overlay'),
}))
console.log('AFTER: ' + JSON.stringify(after))
await page.screenshot({ path: 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t09-shots-r2/dbg-build-dialog.png' })
console.log('CONSOLE: ' + JSON.stringify(msgs.slice(-12)))
await browser.close()
