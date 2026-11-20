import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'

const BASE = 'http://127.0.0.1:5174'
const OUT = 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t07-media.json'
const ROUTES = ['/', '/student', '/teacher', '/parent', '/professional', '/organization',
  '/how-it-works', '/about', '/careers', '/research', '/community', '/contact',
  '/partners', '/updates', '/download', '/pricing']

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const consoleErrors = []

const results = []
for (const route of ROUTES) {
  consoleErrors.length = 0
  page.removeAllListeners('console')
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)) })
  await page.goto(BASE + route, { waitUntil: 'load', timeout: 30000 })
  await page.waitForSelector('body', { timeout: 10000 })
  await page.waitForTimeout(900)
  const data = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].map(i => ({
      src: (i.currentSrc || i.src || '').split('/').pop().slice(0, 60),
      complete: i.complete,
      broken: i.complete && i.naturalWidth === 0,
      alt: i.getAttribute('alt') !== null ? (i.getAttribute('alt') === '' ? '(decorative)' : i.getAttribute('alt').slice(0, 40)) : '(missing attr)',
      inViewport: (() => { const r = i.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 })(),
    }))
    const bgImgs = [...document.querySelectorAll('*')].filter(el => {
      const b = getComputedStyle(el).backgroundImage
      return b && b.includes('url(')
    }).length
    return {
      imgs,
      broken: imgs.filter(i => i.broken),
      bgImgs,
    }
  })
  // also scroll to bottom to trigger lazy images
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(700)
  const after = await page.evaluate(() => [...document.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0).map(i => (i.currentSrc || i.src || '').split('/').pop()))
  results.push({ route, totalImgs: data.imgs.length, brokenAfterScroll: after, bgImgs: data.bgImgs, consoleErrors: consoleErrors.slice(0, 5) })
  console.log(`${route}: imgs=${data.imgs.length} broken=${after.length} bg=${data.bgImgs} consoleErr=${consoleErrors.length}`)
}
await browser.close()
const fs = await import('node:fs')
fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
console.log('WROTE ' + OUT)
