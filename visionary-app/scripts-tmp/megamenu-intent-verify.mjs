import puppeteer from "puppeteer";

const b = await puppeteer.launch({
  headless: "new",
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await p.goto("http://localhost:5175", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));

await p.hover('button[aria-controls="mega-who"]');
await new Promise((r) => setTimeout(r, 40));
console.log("open at 40ms (want closed):", (await p.$("div#mega-who")) ? "OPEN (bad)" : "closed (intent delay works)");
await new Promise((r) => setTimeout(r, 400));
console.log("open at 440ms (want open):", (await p.$("div#mega-who")) ? "OPEN (good)" : "closed (bad)");
await p.screenshot({ path: "scripts-tmp/shots/landing-matrix/1440-megamenu.png" });

await p.keyboard.press("Escape");
await new Promise((r) => setTimeout(r, 200));
console.log("after Escape (want closed):", (await p.$("div#mega-who")) === null ? "closed (good)" : "still open (bad)");

// hover a different trigger: who closes, download opens
await p.hover('button[aria-controls="mega-download"]');
await new Promise((r) => setTimeout(r, 500));
const whoOpen = await p.$("div#mega-who");
const dlOpen = await p.$("div#mega-download");
console.log("switch to Download (want who closed, dl open):", !whoOpen && dlOpen ? "good" : `who=${!!whoOpen} dl=${!!dlOpen}`);
await p.screenshot({ path: "scripts-tmp/shots/landing-matrix/1440-megamenu-download.png" });

await b.close();
