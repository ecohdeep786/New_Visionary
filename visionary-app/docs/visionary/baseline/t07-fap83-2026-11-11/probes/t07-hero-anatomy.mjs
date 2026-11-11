import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

const BASE = 'http://127.0.0.1:5174'
const OUT = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t07-hero-anatomy.json'
const ROUTES = ['/', '/student', '/teacher', '/how-it-works', '/about', '/research']

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

const results = []
for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'load', timeout: 30000 })
  await page.waitForSelector('body', { timeout: 10000 })
  await page.waitForTimeout(700)
  const data = await page.evaluate(() => {
    const out = []
    const h1 = document.querySelector('h1')
    // walk ancestors to hero section
    let hero = h1
    for (let i = 0; i < 6 && hero && hero.parentElement; i++) {
      const p = hero.parentElement
      if (p.tagName === 'SECTION' || p.tagName === 'HEADER' || p.getBoundingClientRect().height > innerHeight * 0.6) { hero = p; break }
      hero = p
    }
    const walk = (el, depth) => {
      if (depth > 4) return
      for (const c of el.children) {
        const r = c.getBoundingClientRect()
        if (r.height === 0) continue
        const cs = getComputedStyle(c)
        out.push({
          depth,
          tag: c.tagName.toLowerCase(),
          cls: (typeof c.className === 'string' ? c.className : '').slice(0, 60),
          text: c.textContent.replace(/\s+/g, ' ').trim().slice(0, 70),
          top: Math.round(r.top + scrollY), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height),
          fs: cs.fontSize, fw: cs.fontWeight, color: cs.color, bg: cs.backgroundColor, op: cs.opacity,
        })
        if (['DIV', 'SECTION', 'HEADER'].includes(c.tagName)) walk(c, depth + 1)
      }
    }
    walk(hero, 0)
    return { heroTag: hero.tagName, heroCls: typeof hero.className === 'string' ? hero.className.slice(0, 80) : '', tree: out, vh: innerHeight }
  })
  results.push({ route, ...data })
  console.log(`${route}: hero=${data.heroTag} els=${data.tree.length}`)
}
await browser.close()
fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
console.log('WROTE ' + OUT)
