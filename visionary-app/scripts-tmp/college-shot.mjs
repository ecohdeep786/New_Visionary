import puppeteer from "puppeteer";

const b = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await p.goto("http://localhost:5175/professional", { waitUntil: "networkidle2", timeout: 60000 });

// DOM-level check: every intelligence step figure must contain a photo <img>
const dom = await p.evaluate(() => {
  const eyebrow = Array.from(document.querySelectorAll("section p")).find((el) =>
    el.textContent.trim().toLowerCase().startsWith("the intelligence behind"),
  );
  const section = eyebrow?.closest("section");
  if (!section) return null;
  const figures = Array.from(section.querySelectorAll("[data-step]"));
  return figures.map((f) => ({
    hasImg: !!f.querySelector("img"),
    imgSrc: f.querySelector("img")?.getAttribute("src")?.split("/").pop() || null,
    hasWindowMarkup: !!f.querySelector('[class*="bg-[#1b1e23]"]'),
  }));
});
console.log("college step figures:", JSON.stringify(dom, null, 1));

// screenshots at two driver offsets
for (const frac of [0.2, 0.45]) {
  await p.evaluate((frac) => {
    const eyebrow = Array.from(document.querySelectorAll("section p")).find((el) =>
      el.textContent.trim().toLowerCase().startsWith("the intelligence behind"),
    );
    let driver = eyebrow.closest("section").parentElement;
    while (driver && getComputedStyle(driver).position === "sticky") driver = driver.parentElement;
    const r = driver.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + r.top + r.height * frac, behavior: "instant" });
  }, frac);
  await new Promise((r) => setTimeout(r, 1400));
  await p.screenshot({ path: `scripts-tmp/shots/landing-matrix/college-intel-${Math.round(frac * 100)}.png` });
}

await b.close();
