import puppeteer from "puppeteer";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await puppeteer.launch({ headless: "new", executablePath: EDGE });
for (const tag of ["1440", "390", "320"]) {
  const [w] = tag === "1440" ? [1440, 900] : tag === "390" ? [390, 844] : [320, 700];
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: tag === "1440" ? 900 : tag === "390" ? 844 : 700, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));
  const m = await page.evaluate(() => {
    const meet = document.querySelector('[data-section="04-meet"]');
    if (!meet) return { err: "no meet section" };
    // debug: list every element with class containing 'grid' or 'max-w' inside meet
    const debug = [...meet.querySelectorAll("*")].filter((e) => String(e.className).includes("grid") || String(e.className).includes("max-w")).map((e) => ({ t: e.tagName, cls: String(e.className).slice(0, 50), data: e.dataset.step, role: e.getAttribute("role") }));
    const strip = meet.querySelector('[role="tablist"]');
    const rows = meet.querySelectorAll('[data-step]');
    const center = (r) => ({ cx: Math.round(r.left + r.width / 2), l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), t: Math.round(r.top + window.scrollY), b: Math.round(r.bottom + window.scrollY) });
    const stripRect = strip ? center(strip.getBoundingClientRect()) : null;
    const rowRects = [...rows].map((row, i) => {
      const copy = row.querySelector("div:first-child");
      const img = row.querySelector("figure img") || row.querySelector("img");
      const rr = center(row.getBoundingClientRect());
      return { i, rowCx: rr.cx, copyCx: copy ? center(copy.getBoundingClientRect()).cx : null, imgCx: img ? center(img.getBoundingClientRect()).cx : null, gapAbove: i === 0 && stripRect ? Math.round(rr.t - stripRect.b) : null, h: rr.b - rr.t, rowGap: row.style.gap || getComputedStyle(row).gap };
    });
    return { debug, strip: stripRect, rows: rowRects };
  });
  console.log(`\n=== ${tag} ===`);
  console.log("strip:", JSON.stringify(m.strip));
  console.log("rows:", JSON.stringify(m.rows));
  await page.close();
}
await browser.close();
