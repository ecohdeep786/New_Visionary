import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// INDEPENDENT REVIEW — FAP-72 A/B (2026-11-13).
// BEFORE = merged beta f8c3fd1d at 127.0.0.1:5175 (defect present)
// AFTER  = zcode candidate 224a5048 at 127.0.0.1:5174 (fix applied)
// Checks: (1) the cosmetic auth/onboarding LanguageSelector is gone;
// (2) on beta, driving it changes its own label while the page stays English
//     (the fake-switch proof); (3) every onboarding language-preference surface
//     carries the honest UI_LANGUAGE_NOTE; (4) the full 14-language
//     content-interest list is preserved (never a UI switch).
// OTP '000000' is the disclosed preview simulation (FAP-70 law) — no email claim.
const DIR = 'C:/Users/Administrator/nv-worktrees/review-beta-serve/visionary-app/docs/visionary/baseline/review-round-2026-11-12'
const OUT = DIR + '/rev-e-fap72.json'
const SHOTS = DIR + '/shots'
const SIDES = [
  { tag: 'before', base: 'http://127.0.0.1:5175', sha: 'f8c3fd1d (beta)' },
  { tag: 'after', base: 'http://127.0.0.1:5176', sha: '224a5048 (zcode/fap-72, serve worktree)' },
]
fs.mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const results = { sides: {} }
const save = () => fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
const log = (k, v) => { console.log(`rev-e/${k}: ` + JSON.stringify(v).slice(0, 400)); save() }
const ts = Date.now()

async function registerThroughOtp(page, base, email) {
  await page.goto(base + '/register', { waitUntil: 'load', timeout: 30000 })
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
}

async function fakeSelectorProbe(page, tag) {
  // a button[aria-haspopup="listbox"] whose label is the current UI language
  const btn = page.locator('button[aria-haspopup="listbox"]').first()
  const present = await btn.count()
  if (!present) return { present: false }
  const labelBefore = (await btn.textContent() || '').trim()
  await btn.click({ timeout: 4000 })
  await page.waitForTimeout(600)
  const menuItems = await page.evaluate(() =>
    [...document.querySelectorAll('button[aria-haspopup="listbox"]')].length &&
    [...document.querySelectorAll('[role="listbox"] button, div.absolute button')].map(b => b.textContent.trim()).filter(Boolean).slice(0, 14))
  const espanol = page.locator('div.absolute button', { hasText: 'Español' }).first()
  let driveProof = null
  if (await espanol.count()) {
    await espanol.click({ timeout: 4000 })
    await page.waitForTimeout(600)
    driveProof = await page.evaluate(() => ({
      selectorLabel: document.querySelector('button[aria-haspopup="listbox"]')?.textContent.trim(),
      pageH1: document.querySelector('h1')?.textContent.trim(),
    }))
  }
  await page.screenshot({ path: `${SHOTS}/rev-fap72-${tag}-selector-1440.png` })
  return { present: true, labelBefore, menuItems, driveProof }
}

async function journeyAndCapture(page, base, identity) {
  const email = `rev-fap72-${identity}-${ts}@visionary.test`
  await registerThroughOtp(page, base, email)
  const card = { student: 'I am a Learner', parent: 'I am a Parent' }[identity]
  await page.getByRole('button', { name: card }).first().click()
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  await page.locator('main input').first().fill(`Review FAP72 ${identity}`)
  await page.locator('select').first().selectOption('adult')
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(900)
  const steps = []
  for (let step = 0; step < 9; step++) {
    if (/dashboard/.test(new URL(page.url()).pathname)) break
    const cap = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body
      const text = main.innerText.replace(/\n+/g, ' | ')
      const headerSel = [...document.querySelectorAll('button[aria-haspopup="listbox"]')].length
      const prefLabel = [...main.querySelectorAll('label, p, h3, h2')].some(l => /preferred learning language/i.test(l.textContent))
      const sel = [...main.querySelectorAll('select')].find(s => [...s.options].some(o => o.text === 'Tamil'))
      return {
        path: location.pathname,
        listboxButtons: headerSel,
        honestNote: /UI currently available in English, Hindi and Bengali/.test(text),
        fullListPresent: text.includes('Tamil') && text.includes('Bengali') && text.includes('Assamese'),
        preferredLearningLabel: prefLabel,
        preferredOptions: sel ? sel.options.length : null,
        snippet: text.slice(0, 200),
      }
    })
    steps.push(cap)
    const start = page.getByRole('button', { name: 'Start using Visionary' })
    if (await start.count()) { await start.first().click(); await page.waitForURL('**/dashboard/**', { timeout: 25000 }); await page.waitForTimeout(2000); break }
    const exam = page.getByRole('button', { name: 'Exam preparation' }).first()
    if (await exam.count()) { await exam.click(); await page.waitForTimeout(500) }
    const sel = page.locator('main select').first()
    if (await sel.count()) await sel.selectOption({ index: 1 })
    await page.locator('button[type="submit"]').last().click()
    await page.waitForTimeout(900)
  }
  return { email, steps }
}

for (const side of SIDES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const entry = { base: side.base, sha: side.sha }
  try {
    // 1) register-page fake selector + drive proof
    await page.goto(side.base + '/register', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(2200)
    entry.registerSelector = await fakeSelectorProbe(page, side.tag)
    // 2) student journey: honest note on the learner context surface
    const student = await journeyAndCapture(page, side.base, 'student')
    entry.studentSteps = student.steps
    // 3) parent journey: honest note under the ProductSetupFields select
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch (e) {} })
    await page.goto(side.base + '/', { waitUntil: 'load', timeout: 30000 }).catch(() => {})
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch (e) {} })
    await page.waitForTimeout(600)
    const parent = await journeyAndCapture(page, side.base, 'parent')
    entry.parentSteps = parent.steps
  } catch (e) {
    entry.error = String(e).slice(0, 300)
    log(`${side.tag}-ERROR`, { message: entry.error, url: page.url() })
  }
  results.sides[side.tag] = entry
  save()
  await ctx.close()
}

// verdict assembly
const b = results.sides.before, a = results.sides.after
const stepSummary = (e) => {
  const notes = [...(e.studentSteps || []), ...(e.parentSteps || [])]
  return {
    stepsWithListbox: notes.filter(s => s.listboxButtons > 0).length,
    maxListboxButtons: Math.max(0, ...notes.map(s => s.listboxButtons)),
    noteSteps: notes.filter(s => s.honestNote).length,
    fullListSteps: notes.filter(s => s.fullListPresent).length,
  }
}
const bs = stepSummary(b), as = stepSummary(a)
results.beforeSummary = bs
results.afterSummary = as
results.ok = !!(b && a &&
  b.registerSelector.present && b.registerSelector.driveProof &&
  /Español/i.test(b.registerSelector.driveProof.selectorLabel || '') &&
  /English|Visionary/i.test(b.registerSelector.driveProof.pageH1 || '') &&
  !a.registerSelector.present &&
  bs.noteSteps === 0 && as.noteSteps >= 1 &&
  as.fullListSteps >= 1 && as.stepsWithListbox === 0)
log('verdict', { before: bs, after: as, ok: results.ok })
save()
await browser.close()
console.log('WROTE ' + OUT)
