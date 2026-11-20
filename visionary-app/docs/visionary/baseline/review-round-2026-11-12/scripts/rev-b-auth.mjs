import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// INDEPENDENT REVIEW ROUND 2026-11-12 — script B (auth surfaces, preview mode).
// Reviewer probes on MERGED beta at 127.0.0.1:5175 (head f8c3fd1d):
//   FAP-70 /register preview OTP step is honest (no sent-email claim, no Resend)
//   FAP-85 /forgot-password preview creates a token and continues to a real reset
//   FAP-86 toast shim: no unknown-prop warning; the x control dismisses
// OTP '000000' is the disclosed preview simulation (FAP-70 law) — no email claim.
const DIR = 'C:/Users/Administrator/nv-worktrees/review-beta-serve/visionary-app/docs/visionary/baseline/review-round-2026-11-12'
const OUT = DIR + '/rev-b-auth.json'
const SHOTS = DIR + '/shots'
const BASE = 'http://127.0.0.1:5175'
fs.mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const results = { base: BASE, betaHead: 'f8c3fd1d', fap70: {}, fap85: {}, fap86: {} }
const save = () => fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
const log = (k, v) => { console.log(`rev-b/${k}: ` + JSON.stringify(v).slice(0, 400)); save() }
const ts = Date.now()

async function registerThroughOtp(email) {
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
}

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const warns = []
page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') warns.push({ type: m.type(), text: m.text().slice(0, 180) }) })
page.on('pageerror', e => warns.push({ type: 'pageerror', text: String(e).slice(0, 180) }))

// ---------- FAP-70 ----------
try {
  const email = `rev-fap70-${ts}@visionary.test`
  results.fap70.email = email
  await registerThroughOtp(email)
  const otp = page.locator('input[autocomplete="one-time-code"]')
  await otp.click({ timeout: 15000 })
  const view = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body
    const heads = [...main.querySelectorAll('h1, h2')].map(h => h.textContent.trim())
    const otpTitle = heads.find(t => /Finish creating your account|Verify your email/i.test(t))
    const ps = [...main.querySelectorAll('p')].map(p => p.textContent.trim())
    const claim = ps.find(t => /6-digit|no email is sent/i.test(t))
    const buttons = [...main.querySelectorAll('button')].map(b => b.textContent.trim())
    return { otpTitle, claim, buttons, hasResend: buttons.some(b => /resend/i.test(b)) }
  })
  results.fap70.view = view
  await page.screenshot({ path: `${SHOTS}/rev-fap70-otp-1440.png` })
  await otp.fill('000000')
  await page.getByRole('button', { name: 'Verify' }).click()
  await page.waitForURL('**/onboarding', { timeout: 20000 })
  await page.waitForTimeout(1200)
  results.fap70.landedOn = new URL(page.url()).pathname
  results.fap70.ok = view.otpTitle === 'Finish creating your account' &&
    /no email is sent/i.test(view.claim || '') && !view.hasResend && results.fap70.landedOn === '/onboarding'
  log('fap70', { otpTitle: view.otpTitle, claim: (view.claim || '').slice(0, 120), hasResend: view.hasResend, landedOn: results.fap70.landedOn, ok: results.fap70.ok })
} catch (e) { results.fap70.error = String(e).slice(0, 300); log('fap70-ERROR', { message: results.fap70.error, url: page.url() }) }

// ---------- FAP-85 ----------
try {
  const email = results.fap70.email
  // sign out keeping local accounts (the disclosed same-context technique)
  await page.evaluate(() => { try { for (const k of ['visionary_session_token', 'visionary_sessions', 'visionary_session']) localStorage.removeItem(k) } catch (e) {} })
  await page.goto(BASE + '/forgot-password', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1500)
  const formView = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body
    return {
      copy: [...main.querySelectorAll('p, label')].map(p => p.textContent.trim()).find(t => /reset|token|email/i.test(t)),
      buttons: [...main.querySelectorAll('button')].map(b => b.textContent.trim()),
    }
  })
  results.fap85.formView = formView
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(1600)
  const success = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body
    const heads = [...main.querySelectorAll('h1, h2')].map(h => h.textContent.trim())
    const text = main.innerText.replace(/\n+/g, ' | ')
    const cont = [...main.querySelectorAll('a')].find(a => /continue to reset/i.test(a.textContent))
    return { heads, text: text.slice(0, 600), continueHref: cont ? new URL(cont.href, location.origin).pathname + new URL(cont.href, location.origin).search : null }
  })
  results.fap85.success = success
  await page.screenshot({ path: `${SHOTS}/rev-fap85-success-1440.png` })
  let resetDone = null
  if (success.continueHref) {
    await page.goto(BASE + success.continueHref, { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1500)
    const npw = page.locator('input[type="password"]')
    await npw.first().fill('fresh-review-77', { timeout: 15000 })
    if (await npw.count() > 1) await npw.nth(1).fill('fresh-review-77')
    await page.locator('button[type="submit"]').last().click()
    await page.waitForTimeout(2200)
    resetDone = await page.evaluate(() => ({
      url: location.pathname,
      heads: [...(document.querySelector('main') || document.body).querySelectorAll('h1, h2')].map(h => h.textContent.trim()),
      text: (document.querySelector('main') || document.body).innerText.replace(/\n+/g, ' | ').slice(0, 300),
    }))
    await page.screenshot({ path: `${SHOTS}/rev-fap85-reset-done-1440.png` })
  }
  results.fap85.resetDone = resetDone
  results.fap85.ok = /token/i.test(formView.copy || '') && formView.buttons.some(b => /create reset token/i.test(b)) &&
    success.heads.includes('Finish resetting your password') && /no email is sent/i.test(success.text) &&
    !!success.continueHref && /password/i.test(resetDone?.url || '') && /Password updated/i.test(resetDone?.text || '')
  log('fap85', { heads: success.heads, continueHref: success.continueHref, resetDone: resetDone && resetDone.text.slice(0, 80), ok: results.fap85.ok })
} catch (e) { results.fap85.error = String(e).slice(0, 300); log('fap85-ERROR', { message: results.fap85.error, url: page.url() }) }

// ---------- FAP-86 ----------
try {
  const warnsBefore = warns.length
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1200)
  const fired = await page.evaluate(async () => {
    const mod = await import('/src/components/ui/use-toast.jsx')
    mod.toast({ title: 'REVIEW FAP-86', description: 'independent review toast' })
    return 'dispatched'
  })
  await page.waitForTimeout(900)
  // the shim's toast is a plain div (no role attr); find it by its title text
  const toastSeen = await page.evaluate(() => {
    const t = [...document.querySelectorAll('div.group, div.pointer-events-auto')].find(d => d.textContent.includes('REVIEW FAP-86'))
    return t ? { present: true, text: t.textContent.trim().slice(0, 80) } : { present: false }
  })
  await page.screenshot({ path: `${SHOTS}/rev-fap86-toast-1440.png` })
  const closeBtn = page.locator('div.group button[toast-close]').first()
  const hadClose = await closeBtn.count()
  if (hadClose) {
    await closeBtn.hover({ timeout: 4000 }).catch(() => {})
    await closeBtn.click({ timeout: 4000, force: true })
    await page.waitForTimeout(700)
  }
  const afterClose = await page.evaluate(() => ({ present: [...document.querySelectorAll('div.group, div.pointer-events-auto')].some(d => d.textContent.includes('REVIEW FAP-86')) }))
  await page.screenshot({ path: `${SHOTS}/rev-fap86-after-x-1440.png` })
  const shimWarns = warns.slice(warnsBefore).filter(w => /onOpenChange|Unknown event handler/i.test(w.text))
  results.fap86 = { fired, toastSeen, hadClose, afterClose, shimWarns, ok: toastSeen.present && hadClose > 0 && !afterClose.present && shimWarns.length === 0 }
  log('fap86', { seen: toastSeen.present, hadClose, goneAfterX: !afterClose.present, shimWarns: shimWarns.length, ok: results.fap86.ok })
} catch (e) { results.fap86.error = String(e).slice(0, 300); log('fap86-ERROR', { message: results.fap86.error }) }

results.consoleIssues = warns
save()
await ctx.close()
await browser.close()
console.log('WROTE ' + OUT)
