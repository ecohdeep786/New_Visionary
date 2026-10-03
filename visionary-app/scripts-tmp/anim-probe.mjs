/* Animation probe: do cycling words/quotes actually animate on persona pages vs home?
   Run: node scripts-tmp/anim-probe.mjs */
import puppeteer from "puppeteer";

const PAGES = [
  ["home", "/"],
  ["student", "/student"],
  ["teacher", "/teacher"],
  ["parent", "/parent"],
  ["professional", "/professional"],
  ["organization", "/organization"],
];

const b = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

for (const [name, path] of PAGES) {
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 100)));
  await p.goto(`http://localhost:5175${path}`, { waitUntil: "networkidle2", timeout: 90000 });
  await p.evaluate(() => document.fonts?.ready);
  await new Promise((r) => setTimeout(r, 1200));

  const probe = await p.evaluate(() => {
    // hero cycling word = the accent-gradient span inside the h1
    const heroWord = document.querySelector("main h1 .accent-gradient, main section h1 span[aria-hidden] span");
    const heroText = heroWord ? heroWord.textContent.trim() : null;
    const animName = heroWord ? getComputedStyle(heroWord).animationName : null;
    const heroWordCount = document.querySelectorAll("main h1 span[aria-hidden] span, main h1 .accent-gradient").length;
    return { heroText, animName, heroWordCount };
  });

  // wait longer than one hero cycle (2800ms) and re-read
  await new Promise((r) => setTimeout(r, 3300));
  const after = await p.evaluate(() => {
    const heroWord = document.querySelector("main h1 .accent-gradient, main section h1 span[aria-hidden] span");
    return { heroText: heroWord ? heroWord.textContent.trim() : null };
  });

  // struggle carousel on persona pages: word + quote cycle every 4s
  let struggle = null;
  if (path !== "/") {
    struggle = await p.evaluate(() => {
      const sec = document.querySelector('[data-section="02-struggle"]');
      if (!sec) return "no-struggle";
      const word = sec.querySelector("h2 span:last-child");
      return { word: word ? word.textContent.trim() : null };
    });
    await p.evaluate(() => document.querySelector('[data-section="02-struggle"]')?.scrollIntoView({ behavior: "instant" }));
    await new Promise((r) => setTimeout(r, 4600));
    struggle = { ...(struggle || {}), ...(await p.evaluate(() => {
      const sec = document.querySelector('[data-section="02-struggle"]');
      const word = sec.querySelector("h2 span:last-child");
      return { wordAfter: word ? word.textContent.trim() : null };
    })) };
  }

  console.log(name.padEnd(14), "hero:", JSON.stringify(probe.heroText), "->", JSON.stringify(after.heroText),
    "| anim:", probe.animName, "| struggle:", JSON.stringify(struggle), "| errs:", errs.length ? errs[0] : "none");
}
await b.close();
