import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

// INDEPENDENT REVIEW ROUND 2026-11-12 — script A (public surfaces, no login).
// Reviewer probes on MERGED beta at 127.0.0.1:5174 (head f8c3fd1d):
//   FAP-81 /community marquee under prefers-reduced-motion: reduce vs no-preference
//   FAP-82 /pricing 320x720 @200% root text — offscreen headings + FAQ accordion operable
//   FAP-83 persona language showcase carries exactly the served set {en,hi,bn}
//   FAP-84 zero "React does not recognize" warnings on the CinematicHero routes
const DIR = 'C:/Users/Administrator/New_Visionary/visionary-app/docs/visionary/baseline/review-round-2026-11-12'
const OUT = DIR + '/rev-a-public.json'
const SHOTS = DIR + '/shots'
const BASE = 'http://127.0.0.1:5174'
fs.mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const results = { base: BASE, betaHead: 'f8c3fd1d', fap81: {}, fap82: {}, fap83: {}, fap84: {} }
const save = () => fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
const log = (k, v) => { console.log(`rev-a/${k}: ` + JSON.stringify(v).slice(0, 400)); save() }

async function freshPage(ctxOpts) {
  const ctx = await browser.newContext(ctxOpts)
  const page = await ctx.newPage()
  return { ctx, page }
}

// ---------- FAP-81: community marquee reduced motion ----------
try {
  const probe = async (reduced) => {
    const { ctx, page } = await freshPage({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced })
    const msgs = []
    page.on('console', m => { if (m.type() === 'error') msgs.push(m.text().slice(0, 120)) })
    await page.goto(BASE + '/community', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(2500)
    const s1 = await page.evaluate(() => {
      const anims = document.getAnimations()
      const rows = [...document.querySelectorAll('.cm-left, .cm-right')]
      return {
        running: anims.filter(a => a.playState === 'running').length,
        names: anims.map(a => a.animationName).filter(Boolean),
        rowTransforms: rows.map(r => getComputedStyle(r).transform),
      }
    })
    await page.waitForTimeout(1400)
    const s2 = await page.evaluate(() => {
      const anims = document.getAnimations()
      const rows = [...document.querySelectorAll('.cm-left, .cm-right')]
      return {
        running: anims.filter(a => a.playState === 'running').length,
        rowTransforms: rows.map(r => getComputedStyle(r).transform),
      }
    })
    const shot = reduced === 'reduce' ? 'rev-fap81-community-reduce.png' : 'rev-fap81-community-nopref.png'
    await page.screenshot({ path: `${SHOTS}/${shot}` })
    await ctx.close()
    return { reduced, sample1: s1, sample2: s2, consoleErrors: msgs }
  }
  results.fap81.reduce = await probe('reduce')
  results.fap81.noPreference = await probe('no-preference')
  results.fap81.ok = results.fap81.reduce.sample2.running === 0 &&
    results.fap81.reduce.sample1.rowTransforms.join() === results.fap81.reduce.sample2.rowTransforms.join() &&
    results.fap81.noPreference.sample2.running === 2
  log('fap81', { reduceRunning: results.fap81.reduce.sample2.running, noprefRunning: results.fap81.noPreference.sample2.running, ok: results.fap81.ok })
} catch (e) { results.fap81.error = String(e).slice(0, 300); log('fap81-ERROR', { message: results.fap81.error }) }

// ---------- FAP-82: pricing at 320 & 390 with 200% root text ----------
try {
  for (const width of [320, 390]) {
    const { ctx, page } = await freshPage({ viewport: { width, height: 720 } })
    const msgs = []
    page.on('console', m => { if (m.type() === 'error') msgs.push(m.text().slice(0, 120)) })
    await page.goto(BASE + '/pricing', { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1800)
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    await page.waitForTimeout(900)
    const m = await page.evaluate(() => {
      const vw = window.innerWidth
      const heads = [...document.querySelectorAll('h1, h2')]
      const offscreenHeads = heads.filter(h => { const r = h.getBoundingClientRect(); return r.right > vw + 1 || r.left < -1 }).map(h => h.textContent.trim().slice(0, 40))
      const faqBtns = [...document.querySelectorAll('button[id^="pricing-faq-question"]')]
      const faqOff = faqBtns.filter(b => b.getBoundingClientRect().right > vw + 1).length
      const faq = faqBtns[0] ? { count: faqBtns.length, before: faqBtns[0].getAttribute('aria-expanded'), right: Math.round(faqBtns[0].getBoundingClientRect().right) } : null
      return { vw, offscreenHeads, faqOff, faq, scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth }
    })
    let clicked = null
    if (m.faq) {
      const first = page.locator('button[id^="pricing-faq-question"]').first()
      await first.click()
      await page.waitForTimeout(600)
      clicked = await page.evaluate(() => {
        const b = [...document.querySelectorAll('button[id^="pricing-faq-question"]')][0]
        const answer = document.getElementById('pricing-faq-answer-0')
        return { after: b.getAttribute('aria-expanded'), answerVisible: !!answer && getComputedStyle(answer).display !== 'none' && (answer.textContent || '').length > 0 }
      })
    }
    await page.screenshot({ path: `${SHOTS}/rev-fap82-pricing-${width}-200.png`, fullPage: false })
    results.fap82[width] = { ...m, clicked, consoleErrors: msgs }
    await ctx.close()
    log(`fap82-${width}`, { offscreenHeads: m.offscreenHeads.length, faqOff: m.faqOff, clickedAfter: clicked?.after })
  }
  results.fap82.ok = results.fap82[320].offscreenHeads.length === 0 && results.fap82[390].offscreenHeads.length === 0 &&
    results.fap82[320].faqOff === 0 && results.fap82[320].clicked?.after === 'true'
} catch (e) { results.fap82.error = String(e).slice(0, 300); log('fap82-ERROR', { message: results.fap82.error }) }

// ---------- FAP-83: persona language showcase ----------
try {
  const personas = ['student', 'teacher', 'parent', 'professional', 'organization']
  results.fap83.pages = {}
  const { ctx, page } = await freshPage({ viewport: { width: 1440, height: 900 } })
  const msgs = []
  page.on('console', m => { if (m.type() === 'error') msgs.push(m.text().slice(0, 120)) })
  for (const p of personas) {
    await page.goto(`${BASE}/${p}`, { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1600)
    const m = await page.evaluate(() => {
      const sec = document.querySelector('[data-section="07-language"]')
      if (!sec) return { section: false }
      const eyebrow = sec.querySelector('p')?.textContent.trim()
      const text = sec.innerText
      const chips = ['Hindi', 'English', 'Bengali', 'Tamil', 'Kannada', 'Punjabi'].filter(n => text.includes(n))
      return { section: true, eyebrow, chipsPresent: chips, unservedPresent: ['Tamil', 'Kannada', 'Punjabi'].filter(n => text.includes(n)), everyLanguageClaim: /every language/i.test(text), namesServed: text.includes('English, Hindi, and Bengali'), roadmap: text.includes('More languages are on the roadmap'), head: text.slice(0, 260) }
    })
    results.fap83.pages[p] = m
    await page.screenshot({ path: `${SHOTS}/rev-fap83-${p}-language-1440.png` })
    log(`fap83-${p}`, { eyebrow: m.eyebrow, chips: m.chipsPresent, unserved: m.unservedPresent, everyLanguageClaim: m.everyLanguageClaim })
  }
  const all = Object.values(results.fap83.pages)
  results.fap83.ok = all.length === 5 && all.every(x => x.section && x.eyebrow === 'Your language' &&
    x.chipsPresent.join() === 'Hindi,English,Bengali' && x.unservedPresent.length === 0 &&
    !x.everyLanguageClaim && x.namesServed && x.roadmap) && msgs.length === 0
  results.fap83.consoleErrors = msgs
  await ctx.close()
  log('fap83-ok', { ok: results.fap83.ok })
} catch (e) { results.fap83.error = String(e).slice(0, 300); log('fap83-ERROR', { message: results.fap83.error }) }

// ---------- FAP-84: CinematicHero routes, unrecognized-prop warnings ----------
try {
  const routes = ['/', '/research', '/privacy', '/terms', '/security', '/cookies', '/accessibility']
  results.fap84.routes = {}
  for (const r of routes) {
    const { ctx, page } = await freshPage({ viewport: { width: 1440, height: 900 } })
    const msgs = []
    page.on('console', m => { if (/does not recognize/i.test(m.text())) msgs.push(m.text().slice(0, 140)) })
    page.on('pageerror', e => msgs.push('PAGEERROR: ' + String(e).slice(0, 120)))
    await page.goto(BASE + r, { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(1800)
    const hero = await page.evaluate(() => {
      const img = document.querySelector('img[fetchpriority], img[fetchPriority]')
      return img ? { fetchpriority: img.getAttribute('fetchpriority'), loading: img.getAttribute('loading') } : null
    })
    results.fap84.routes[r] = { unrecognizedWarnings: msgs.length, heroImg: hero }
    await ctx.close()
    log(`fap84-${r}`, { warnings: msgs.length, heroImg: hero })
  }
  results.fap84.ok = Object.values(results.fap84.routes).every(x => x.unrecognizedWarnings === 0)
} catch (e) { results.fap84.error = String(e).slice(0, 300); log('fap84-ERROR', { message: results.fap84.error }) }

save()
await browser.close()
console.log('WROTE ' + OUT)
