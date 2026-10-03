import puppeteer from "puppeteer";

const b = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto("http://localhost:5175/", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 4500));
await p.screenshot({ path: "scripts-tmp/shots/landing-matrix/hero-anim-restored.png" });
await b.close();
