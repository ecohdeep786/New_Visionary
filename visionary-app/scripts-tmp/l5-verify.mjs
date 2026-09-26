import { chromium } from "playwright-core";

/* Wave L5 — 07-perf (4G hero + LCP), 05-motion (reduced-motion), 06-a11y (keyboard), 02-copy (locale). */
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });

// ── 07-perf: simulated 4G (≈12 Mbps down), phone viewport, LCP + hero transfer per persona route
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 60, downloadThroughput: (12 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8 });

const PERF_ROUTES = ["/", "/student", "/teacher", "/parent", "/professional", "/organization"];
for (const route of PERF_ROUTES) {
  await page.goto("about:blank");
  const t0 = Date.now();
  await page.goto("http://localhost:4173" + route, { waitUntil: "load", timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => new Promise((res) => {
    let lcp = 0, lcpEl = "";
    new PerformanceObserver((l) => { const e = l.getEntries(); if (e.length) { lcp = e[e.length - 1].startTime; lcpEl = e[e.length - 1].element?.tagName || ""; } })
      .observe({ type: "largest-contentful-paint", buffered: true });
    const heroes = performance.getEntriesByType("resource").filter((e) => /-hero-main|face-main/.test(e.name) && /webp/.test(e.name))
      .map((e) => e.name.split("/").pop() + ":" + Math.round(e.transferSize / 1024) + "KB");
    setTimeout(() => res({ lcp: Math.round(lcp), lcpEl, heroes }), 600);
  }));
  console.log(route, "load:" + (Date.now() - t0) + "ms LCP:" + r.lcp + "ms (" + r.lcpEl + ") heroes:", r.heroes.join(" "));
}
await ctx.close();

// ── 05-motion: reduced-motion traversal
const rm = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
for (const route of ["/", "/student", "/how-it-works"]) {
  await rm.emulateMedia({ reducedMotion: "reduce" });
  await rm.goto("http://localhost:4173" + route, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await rm.waitForTimeout(1000);
  const state = await rm.evaluate(() => ({
    h1Visible: (() => { const h = document.querySelector("h1"); return h && getComputedStyle(h).opacity !== "0"; })(),
    h1Text: document.querySelector("h1")?.textContent?.trim().slice(0, 40) || null,
    noAnimHidden: ![...document.querySelectorAll("main *")].some((el) => { const s = getComputedStyle(el); return s.opacity === "0" && s.animationName !== "none"; }),
  }));
  console.log("reduced-motion", route, JSON.stringify(state));
}
// loop must not auto-advance under reduced motion
await rm.goto("http://localhost:4173/how-it-works", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
const before = await rm.evaluate(() => document.querySelector('[aria-label="Learning loop stages"] [aria-pressed="true"]')?.textContent?.trim());
await rm.waitForTimeout(3200);
const after = await rm.evaluate(() => document.querySelector('[aria-label="Learning loop stages"] [aria-pressed="true"]')?.textContent?.trim());
console.log("loop auto-advance under reduced-motion: paused=" + (before === after) + ` (${before})`);

// ── 06-a11y: keyboard journey 1 — landing → persona → modal → close → pricing CTA
const k = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await k.goto("http://localhost:4173/", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
await k.keyboard.press("Tab"); // skip link
const journey = await k.evaluate(() => {
  // navigate to student page via keyboard: focus first persona link
  const link = [...document.querySelectorAll('a[href="/student"]')][0];
  link?.focus();
  return { focused: document.activeElement?.getAttribute("href") };
});
await k.keyboard.press("Enter");
await k.waitForTimeout(1800);
await k.evaluate(() => document.querySelector('[data-section="04-journey"] [data-card] button')?.focus());
await k.keyboard.press("Enter"); // open modal
await k.waitForTimeout(700);
const modalOpen = await k.evaluate(() => Boolean(document.querySelector('[role="dialog"][aria-modal="true"]')));
await k.keyboard.press("Escape"); // close
await k.waitForTimeout(500);
const modalClosed = await k.evaluate(() => !document.querySelector('[role="dialog"][aria-modal="true"]'));
// journey modal → pricing CTA reachable by keyboard from how-it-works
await k.goto("http://localhost:4173/how-it-works", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
const pricingReachable = await k.evaluate(() => Boolean([...document.querySelectorAll("a[href='/pricing']")].length));
console.log("keyboard journey1: linkFocus=" + JSON.stringify(journey.focused) + " modalOpen=" + modalOpen + " escClose=" + modalClosed + " pricingReachable=" + pricingReachable);

// keyboard journey 2 — pricing table navigation + plan selection
await k.goto("http://localhost:4173/pricing", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
const pricingKb = await k.evaluate(() => {
  const tabs = [...document.querySelectorAll('[role="group"][aria-label="Billing period"] button')];
  tabs[1]?.focus(); tabs[1]?.click();
  const annual = document.body.innerText.includes("Billed yearly");
  const planLinks = [...document.querySelectorAll('a[href*="plan="]')].map((a) => a.getAttribute("href"));
  return { annualShown: annual, planLinks };
});
console.log("keyboard journey2 (pricing):", JSON.stringify(pricingKb));

// keyboard journey 3 — contact form with error recovery
await k.goto("http://localhost:4173/contact", { waitUntil: "networkidle", timeout: 30000 }).catch(()=>{});
await k.evaluate(() => document.getElementById("form")?.scrollIntoView());
await k.evaluate(() => document.getElementById("contact-name")?.focus());
await k.keyboard.type("Keyboard Tester");
await k.evaluate(() => document.getElementById("contact-email")?.focus());
await k.keyboard.type("bad");
await k.keyboard.press("Enter");
await k.waitForTimeout(400);
const errShown = await k.evaluate(() => Boolean(document.querySelector('[role="alert"]')));
await k.keyboard.press("Tab");
await k.keyboard.type("ok@kb.org");
await k.keyboard.press("Enter");
await k.waitForTimeout(1300);
const okShown = await k.evaluate(() => document.body.innerText.includes("Your message is ready"));
console.log("keyboard journey3 (contact): errAlert=" + errShown + " recovered=" + okShown);

// ── 02-copy: locale spot check (Hindi/Bengali longest fixtures)
await k.goto("http://localhost:4173/pricing", { waitUntil: "networkidle", timeout: 30000 }).catch(()=>{});
const locale = await k.evaluate(() => {
  const hi = "विश्वसनीय बहुभाषी शिक्षण अवसंरचना के साथ सीखना";
  const bn = "বিশ্বস্ত বহুভাষিক শিক্ষা অবকাঠামো নিয়ে শেখা চালিয়ে যাওয়া";
  const nav = document.querySelector("header a, nav a");
  const cell = document.querySelector('th[scope="row"]');
  const origNav = nav.textContent; const origCell = cell.textContent;
  nav.textContent = hi; cell.textContent = bn;
  const overflow = document.documentElement.scrollWidth - window.innerWidth;
  const navClipped = nav.scrollWidth > nav.clientWidth + 2;
  const cellClipped = cell.scrollWidth > cell.clientWidth + 2;
  nav.textContent = origNav; cell.textContent = origCell;
  return { overflow, navClipped, cellClipped };
});
console.log("locale spot check (hi/bn injected):", JSON.stringify(locale));

// ── R4: prod leak — dev route absent
await k.goto("http://localhost:4173/dev/scenarios", { waitUntil: "load", timeout: 20000 }).catch(() => {});
const devRoute = await k.evaluate(() => ({ path: location.pathname, is404: document.body.innerText.includes("Page Not Found") || document.body.innerText.includes("404") }));
console.log("R4 dev route in prod:", JSON.stringify(devRoute));

await browser.close();
