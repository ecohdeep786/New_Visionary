/* /updates interaction sanity: toggles sync chips, submit shows success, zero errors. */
import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 100)));
await page.goto("http://localhost:4173/updates", { waitUntil: "networkidle", timeout: 25000 });

// 1. card press = selects category + scrolls to form
await page.getByRole("button", { name: /sign up for research & learning/i }).click();
await page.waitForTimeout(700);
const chipOn = await page.getByRole("button", { name: "Research & learning" }).first().getAttribute("aria-pressed");

// 2. toggle row off = chip turns off
await page.getByRole("checkbox", { name: /product updates/i }).click();
const chipOff = await page.getByRole("button", { name: "Product updates" }).first().getAttribute("aria-pressed");

// 3. submit → success state
await page.fill("#updates-name", "QA");
await page.fill("#updates-email", "qa@example.com");
await page.check("input[type=checkbox]");
await page.getByRole("button", { name: "Get updates" }).last().click();
await page.waitForTimeout(400);
const success = await page.getByText("You are on the list.").count();
const pastel = await page.evaluate(() => {
  const els = [...document.querySelectorAll('[role="status"] *')];
  return els.some((el) => {
    const bg = getComputedStyle(el).backgroundColor;
    return bg && !["rgb(255, 255, 255)", "rgba(0, 0, 0, 0)"].includes(bg);
  });
});
console.log(JSON.stringify({ chipOn, chipOff, successVisible: success === 1, pastelInSuccess: pastel, errors }, null, 1));
await browser.close();
