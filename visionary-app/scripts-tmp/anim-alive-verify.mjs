/* Verify every ambient animation on the landing page actually runs:
   hero float, problem carousel, meet word ticker, OI phase cycle,
   commitment auto-advance, language questions, trust ticker.
   No hover is applied — the old behavior is that these run on their own. */
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const p = await browser.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto("http://localhost:5175/", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));

const read = () => p.evaluate(() => {
  const dotActive = () =>
    Array.from(document.querySelectorAll('[data-section="02-problem"] [role="group"] button')).find((b) => b.getAttribute("aria-pressed") === "true");
  const meetWord = () => document.querySelector('[data-section="04-meet"] h2 .hero-fade-up')?.textContent;
  const oiPhase = () =>
    Array.from(document.querySelectorAll('[data-section="05-one-intelligence"] [role="group"] button')).findIndex((b) => b.getAttribute("aria-pressed") === "true");
  const cmStep = () =>
    Array.from(document.querySelectorAll('[data-section="06-commitment"] button[aria-expanded]')).findIndex((b) => b.getAttribute("aria-expanded") === "true");
  const trustWord = () => document.querySelector('[data-section="08-trust"] h2 .hero-fade-up')?.textContent;
  const voiceBar = () => {
    const bar = document.querySelector('[data-section="07-language"] [aria-hidden] span');
    return bar ? getComputedStyle(bar).animationName : null;
  };
  return {
    heroFloat: getComputedStyle(document.querySelector(".apple-float")).animationName,
    problem: dotActive()?.getAttribute("aria-label"),
    meetWord: meetWord(),
    oiPhase: oiPhase(),
    cmStep: cmStep(),
    trustWord: trustWord(),
    voiceBar: voiceBar(),
  };
});

const t0 = await read();
await new Promise((r) => setTimeout(r, 5000));
const t1 = await read();

// language question: scroll there and sample twice
await p.evaluate(() => document.querySelector('[data-section="07-language"]')?.scrollIntoView({ behavior: "instant", block: "center" }));
await new Promise((r) => setTimeout(r, 600));
const langQ = () => p.evaluate(() => document.querySelector('[data-section="07-language"] p[aria-live] span')?.textContent);
const l0 = await langQ();
await new Promise((r) => setTimeout(r, 4200));
const l1 = await langQ();

const changed = (a, b) => (a !== b ? "CHANGING ✓" : `STATIC ✗ (${JSON.stringify(a)} → ${JSON.stringify(b)})`);
console.log(`hero float animation: ${t0.heroFloat}`);
console.log(`hero float active:    ${t1.heroFloat}`);
console.log(`voice bars animation: ${t0.voiceBar}`);
console.log(`problem carousel:     ${changed(t0.problem, t1.problem)}`);
console.log(`meet word ticker:     ${changed(t0.meetWord, t1.meetWord)}`);
console.log(`OI phase cycle:       ${changed(t0.oiPhase, t1.oiPhase)}`);
console.log(`commitment advance:   ${changed(t0.cmStep, t1.cmStep)}`);
console.log(`trust word ticker:    ${changed(t0.trustWord, t1.trustWord)}`);
console.log(`language questions:   ${changed(l0, l1)}`);

await browser.close();
