import { chromium } from 'file:///C:/Users/Administrator/New_Visionary/visionary-app/frontend/node_modules/playwright-core/index.mjs'
import fs from 'node:fs'

const BASE = process.env.T07_BASE || 'http://127.0.0.1:5174'
const OUT = process.env.T07_OUT || 'C:/Users/Administrator/AppData/Local/Temp/2/opencode/t07-research-crawl.json'

const ROUTES = [
  '/', '/student', '/teacher', '/parent', '/professional', '/organization',
  '/how-it-works', '/about', '/careers', '/research', '/community', '/contact',
  '/partners', '/updates', '/download', '/pricing',
]

const PUBLIC_ROUTES = new Set([
  '/', '/login', '/register', '/forgot-password', '/forgot-user-id', '/reset-password',
  '/auth/action', '/student', '/teacher', '/parent', '/help', '/professional',
  '/how-it-works', '/organization', '/download', '/about', '/pricing', '/careers',
  '/research', '/community', '/contact', '/partners', '/updates', '/referral',
  '/safety', '/privacy', '/terms', '/security', '/accessibility', '/cookies',
])

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

const results = []
for (const route of ROUTES) {
  const url = BASE + route
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 })
    await page.waitForSelector('body', { timeout: 10000 })
    await page.waitForTimeout(600)
    const data = await page.evaluate((PUBLIC_ROUTES) => {
      const abs = (el) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0 }
      }
      const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '')

      const h1s = [...document.querySelectorAll('h1')].map(h => ({ text: text(h).slice(0, 140), rect: abs(h) }))
      const h2s = [...document.querySelectorAll('h2')].map(h => text(h).slice(0, 120)).filter(Boolean).slice(0, 12)

      const links = [...document.querySelectorAll('a[href]')].map(a => ({
        text: text(a).slice(0, 60),
        href: a.getAttribute('href'),
        classes: a.className && typeof a.className === 'string' ? a.className.slice(0, 120) : '',
        rect: abs(a),
      }))

      const buttons = [...document.querySelectorAll('button')].map(b => ({ text: text(b).slice(0, 60), rect: abs(b) }))

      // primary hero CTA candidates: links with pill-ish classes in first viewport
      const pillLinks = links.filter(l => /pill/i.test(l.classes))
      const heroPills = pillLinks.filter(l => l.rect && l.rect.top < 900 && l.rect.visible)

      // dead-end detection for internal links
      const dead = []
      const deadSeen = new Set()
      for (const l of links) {
        const href = l.href || ''
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) continue
        let path = href.split('#')[0].split('?')[0]
        if (path === '') continue
        if (path.startsWith('/dashboard')) continue // protected area, out of public scope
        if (!PUBLIC_ROUTES.includes(path) && !deadSeen.has(path)) {
          deadSeen.add(path)
          dead.push({ href, from: text(links.find(x => x.href === href)) || l.text })
        }
      }

      // first paragraph after h1 (value prop subhead)
      let subhead = null
      const h1 = document.querySelector('h1')
      if (h1) {
        let el = h1.nextElementSibling
        let hops = 0
        while (el && hops < 6) {
          if (el.tagName === 'P' || el.tagName === 'P'.toLowerCase()) { subhead = text(el).slice(0, 220); break }
          const p = el.querySelector && el.querySelector('p')
          if (p) { subhead = text(p).slice(0, 220); break }
          el = el.nextElementSibling; hops++
        }
      }

      return {
        title: document.title,
        h1: h1s,
        h2s,
        subhead,
        heroPills,
        buttons: buttons.slice(0, 12),
        deadLinks: dead,
        totalLinks: links.length,
        imgCount: document.querySelectorAll('img').length,
        imgNoAlt: [...document.querySelectorAll('img')].filter(i => !i.getAttribute('alt')).length,
      }
    }, [...PUBLIC_ROUTES])
    results.push({ route, ok: true, ...data })
    console.log(`${route}: h1="${(data.h1 && data.h1[0] && data.h1[0].text) || '(none)'}" pills=${data.heroPills.length} dead=${data.deadLinks.length}`)
  } catch (e) {
    results.push({ route, ok: false, error: String(e).slice(0, 300) })
    console.log(`${route}: ERROR ${String(e).slice(0, 120)}`)
  }
}

await browser.close()
fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
console.log('WROTE ' + OUT)
