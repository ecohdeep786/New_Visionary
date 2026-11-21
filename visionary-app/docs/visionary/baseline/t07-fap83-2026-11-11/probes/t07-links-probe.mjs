import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

const BASE = process.env.T07_BASE || 'http://127.0.0.1:5174'
const OUT = process.env.T07_OUT || 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t07-links.json'

const ROUTES = [
  '/', '/student', '/teacher', '/parent', '/professional', '/organization',
  '/how-it-works', '/about', '/careers', '/research', '/community', '/contact',
  '/partners', '/updates', '/download', '/pricing',
]

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

const results = []
for (const route of ROUTES) {
  try {
    await page.goto(BASE + route, { waitUntil: 'load', timeout: 30000 })
    await page.waitForSelector('body', { timeout: 10000 })
    await page.waitForTimeout(600)
    const data = await page.evaluate(() => {
      const abs = (el) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { top: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) }
      }
      const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '')

      const links = [...document.querySelectorAll('a[href]')].map(a => ({
        text: text(a).slice(0, 70),
        href: a.getAttribute('href'),
        cls: typeof a.className === 'string' ? a.className : '',
        top: abs(a) ? abs(a).top : null,
        w: abs(a) ? abs(a).w : null,
        h: abs(a) ? abs(a).h : null,
      }))

      // hero: first 900 CSS px from top
      const heroTexts = [...document.querySelectorAll('h1, h2, p, a')].filter(el => {
        const r = el.getBoundingClientRect()
        return r.height > 0 && (r.top + window.scrollY) < 900 && (r.top + window.scrollY) > 60
      }).slice(0, 40).map(el => ({
        tag: el.tagName.toLowerCase(),
        text: text(el).slice(0, 110),
        href: el.getAttribute && el.getAttribute('href') ? el.getAttribute('href') : undefined,
        cls: typeof el.className === 'string' ? el.className.slice(0, 90) : '',
        top: Math.round(el.getBoundingClientRect().top + window.scrollY),
        fs: getComputedStyle(el).fontSize,
        fw: getComputedStyle(el).fontWeight,
        color: getComputedStyle(el).color,
      }))

      return { links, heroTexts }
    })
    results.push({ route, ok: true, ...data })
    console.log(`${route}: links=${data.links.length} heroEls=${data.heroTexts.length}`)
  } catch (e) {
    results.push({ route, ok: false, error: String(e).slice(0, 300) })
    console.log(`${route}: ERROR`)
  }
}

await browser.close()
fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
console.log('WROTE ' + OUT)
