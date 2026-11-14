import { chromium } from 'file:///C:/Users/Administrator/nv-worktrees/fap-84-hero-fetchpriority/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

const OUT = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t07-fap84-sweep.json'

// 16 T07 public routes + the 5 extra CinematicHero trust/legal routes
const ROUTES = [
  '/', '/student', '/teacher', '/parent', '/professional', '/organization',
  '/how-it-works', '/about', '/careers', '/research', '/community', '/contact',
  '/partners', '/updates', '/download', '/pricing',
  '/privacy', '/terms', '/security', '/cookies', '/accessibility',
]

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })

async function sweep(base, label) {
  const results = []
  for (const route of ROUTES) {
    // fresh context per route (the repro pattern that caught the warning 6/6)
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const msgs = []
    page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') msgs.push({ type: m.type(), text: m.text() }) })
    try {
      await page.goto(base + route, { waitUntil: 'load', timeout: 30000 })
      await page.waitForSelector('body', { timeout: 10000 })
      await page.waitForTimeout(2000)
    } catch (e) {
      results.push({ route, ok: false, error: String(e).slice(0, 200) })
      await ctx.close()
      continue
    }
    // does this route render the hero img, and does it carry the attribute?
    const img = await page.evaluate(() => {
      const errored = /Something went wrong/.test(document.body.innerText)
      const i = document.querySelector('picture img')
      return { errored, present: !!i, fetchpriority: i && i.getAttribute('fetchpriority'), loading: i && i.getAttribute('loading') }
    })
    const unrecognized = msgs.filter((m) => /React does not recognize/.test(m.text))
    results.push({ route, ok: true, errored: img.errored, heroImg: { present: img.present, fetchpriority: img.fetchpriority, loading: img.loading }, consoleCount: msgs.length, unrecognizedCount: unrecognized.length, unrecognized, other: msgs.filter((m) => !/React does not recognize/.test(m.text)).map((m) => m.text.slice(0, 100)) })
    await ctx.close()
  }
  const flagged = results.filter((r) => r.unrecognizedCount > 0).map((r) => r.route)
  const errored = results.filter((r) => r.errored).map((r) => r.route)
  console.log(`${label}: routes=${results.length} unrecognized-prop routes=${flagged.length}${flagged.length ? ' -> ' + flagged.join(',') : ''} errored=${errored.length}${errored.length ? ' -> ' + errored.join(',') : ''}`)
  return results
}

const before = await sweep('http://127.0.0.1:5174', 'BEFORE(beta 5174)')
const after = await sweep('http://127.0.0.1:5173', 'AFTER(candidate 5173)')
await browser.close()
fs.writeFileSync(OUT, JSON.stringify({ before, after }, null, 2))

// summarize the hero-img attribute check on every CinematicHero route (after)
for (const r of after) {
  if (r.heroImg && r.heroImg.present) console.log(`AFTER ${r.route}: img fetchpriority=${r.heroImg.fetchpriority} loading=${r.heroImg.loading}`)
}
console.log('WROTE ' + OUT)
