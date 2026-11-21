import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'

// Debug: dump the onboarding "about" step DOM to see why submit stays disabled.
const BASE = 'http://127.0.0.1:5174'
const ts = Date.now()
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errs = []
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)) })

await page.goto(BASE + '/register', { waitUntil: 'load', timeout: 30000 })
await page.waitForTimeout(2200)
await page.getByRole('button', { name: 'Continue with Email' }).first().click()
await page.locator('input[type="email"]').first().fill(`t09-dbg-${ts}@visionary.test`)
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
await page.locator('button[type="submit"]').last().click() // Continue
await page.waitForTimeout(1000)

const dump = () => page.evaluate(() => ({
  url: location.pathname,
  headings: [...document.querySelectorAll('h1,h2,h3,label,p')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 18),
  inputs: [...document.querySelectorAll('input')].map(i => ({ type: i.type, value: i.value, placeholder: i.placeholder, aria: i.getAttribute('aria-label'), visible: !!i.offsetParent })),
  selects: [...document.querySelectorAll('select')].map(s => ({ aria: s.getAttribute('aria-label'), value: s.value, options: [...s.options].map(o => o.value + '|' + o.textContent), visible: !!s.offsetParent })),
  buttons: [...document.querySelectorAll('button')].map(b => ({ text: b.textContent.trim().slice(0, 40), disabled: b.disabled, type: b.type, visible: !!b.offsetParent })),
}))
console.log('ABOUT-STEP: ' + JSON.stringify(await dump()).slice(0, 3000))

await page.locator('input[type="text"]').first().fill('T09 Debug fixture')
await page.locator('select').first().selectOption({ index: 1 })
await page.waitForTimeout(600)
console.log('AFTER-FILL: ' + JSON.stringify(await dump()).slice(0, 2600))
await page.locator('button[type="submit"]').last().click({ timeout: 8000 }).catch(() => {})
await page.waitForTimeout(900)
console.log('AFTER-CLICK: ' + JSON.stringify(await dump()).slice(0, 2000))
console.log('CONSOLE-ERRORS: ' + JSON.stringify(errs))
await browser.close()
