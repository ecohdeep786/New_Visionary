import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" });
const p = await browser.newPage();
await p.setViewport({ width: 1440, height: 900 });
/* the capture env reports reduce by default (RDP/VM pitfall) — emulate the
   real user so the choreography under test actually arms */
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
await p.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 60000 });

const probe = async (label) => {
  const data = await p.evaluate(() => {
    const sec = document.querySelector('section[data-section="02-problem"]');
    const fade = sec.querySelector(".transition-all");
    const rect = sec.getBoundingClientRect();
    return {
      top: Math.round(rect.top), bottom: Math.round(rect.bottom),
      opacity: fade ? getComputedStyle(fade).opacity : "no-fade-el",
      cls: fade ? fade.className.slice(0, 80) : "",
    };
  });
  console.log(label, JSON.stringify(data));
};

/* settled in view */
await p.evaluate(() => {
  const el = document.querySelector('section[data-section="02-problem"]');
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: top - 40, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 900));
await probe("in-view ");

/* 60% exited — bottom above the 40% line */
await p.evaluate(() => {
  const el = document.querySelector('section[data-section="02-problem"]');
  const bottom = el.getBoundingClientRect().bottom + window.scrollY;
  window.scrollTo({ top: bottom - 260, behavior: "instant" });
});
await new Promise((r) => setTimeout(r, 900));
await probe("exited  ");

await browser.close();
