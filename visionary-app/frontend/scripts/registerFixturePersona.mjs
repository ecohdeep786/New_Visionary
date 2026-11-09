/**
 * registerFixturePersona — boots a REAL persona into a Playwright page through
 * the product's own /register → onboarding journey (the same journey every
 * fresh visitor walks). Used by review instruments that need an authenticated
 * live session inside their own browser context (local auth mode keeps
 * visionary_users in context-local storage, so a context must create its own
 * account before the signed-in dashboard exists).
 *
 * Env-free: all options come from the caller.
 *  { page, base, email, password, persona: { target: [...targets], name } }
 */
export async function registerFixturePersona({ page, base, email, password, persona }) {
  const targets = (persona && persona.targets) || ["I am a Learner", "School"];
  const name = (persona && persona.name) || "Meera";
  await page.goto(`${base}/register`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2200);
  const emailCta = page.getByRole("button", { name: /Continue with Email/i });
  if (await emailCta.count()) { await emailCta.first().click(); await page.waitForTimeout(900); }
  const emailField = page.locator('input[type="email"], input[name*="email" i], input[autocomplete*="email" i]').first();
  await emailField.fill(email);
  await page.waitForTimeout(500);
  const cont1 = page.getByRole("button", { name: /continue|next|send/i });
  await cont1.nth((await cont1.count()) - 1).click({ timeout: 8000 });
  await page.waitForTimeout(1200);
  const pws = page.locator('input[type="password"]');
  const pwCount = await pws.count();
  if (!pwCount) throw new Error("registerFixturePersona: no password step after email submit");
  for (let i = 0; i < pwCount; i++) await pws.nth(i).fill(password);
  await page.waitForTimeout(400);
  const cont2 = page.getByRole("button", { name: /continue|next|create|register|sign/i });
  await cont2.nth((await cont2.count()) - 1).click({ timeout: 8000 });
  await page.waitForTimeout(1500);
  const slot = page.locator('input[inputmode="numeric"], input[autocomplete*="one-time" i]').first();
  if (await slot.count()) {
    await slot.click();
    await page.keyboard.type("000000");
    await page.waitForTimeout(500);
    const cont3 = page.getByRole("button", { name: /verify|continue|confirm|next/i });
    await cont3.nth((await cont3.count()) - 1).click({ timeout: 8000 });
    await page.waitForTimeout(1800);
  }
  /* Wizard: card selections (escalating DOM level), empty selects (CBSE/English
   * priority), persona name, then forward-first until /dashboard. */
  const lvl = Object.fromEntries(targets.map((t) => [t, 0]));
  const tryForward = async () => {
    const fw = page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Get started"), button:has-text("Finish"), button:has-text("Done"), button:has-text("Start")');
    const fn = await fw.count();
    for (let k = fn - 1; k >= 0; k--) {
      try { if (await fw.nth(k).isEnabled()) { await fw.nth(k).click({ timeout: 4000 }); return true; } } catch {}
    }
    return false;
  };
  for (let step = 0; step < 40; step++) {
    await page.waitForTimeout(1100);
    if (/\/dashboard/.test(page.url())) {
      await page.waitForFunction(() => {
        try { const ws = JSON.parse(localStorage.getItem("visionary_workspace_v2") || "{}"); return Object.keys(ws.active || {}).length > 0; } catch { return false; }
      }, { timeout: 20000 });
      await page.waitForTimeout(1500);
      return { landed: page.url() };
    }
    try {
      await page.evaluate((lvl2) => {
        for (const target of Object.keys(lvl2)) {
          const cands = [...document.querySelectorAll("button, [role='button'], [aria-pressed], label, div, section, span")]
            .filter((el) => (el.textContent || "").trim().startsWith(target) && (el.textContent || "").length < target.length + 70);
          if (!cands.length) continue;
          const el = cands[Math.min(lvl2[target], cands.length - 1)];
          try { el.click(); } catch {}
        }
      }, lvl);
      await page.waitForTimeout(500);
      const fwNow = page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Get started"), button:has-text("Finish"), button:has-text("Done")');
      let anyEnabled = false;
      const fn2 = await fwNow.count();
      for (let k = 0; k < fn2; k++) { try { if (await fwNow.nth(k).isEnabled()) { anyEnabled = true; break; } } catch {} }
      if (!anyEnabled) for (const key of Object.keys(lvl)) lvl[key] = (lvl[key] + 1) % 6;
    } catch {}
    let moved = await tryForward();
    await page.waitForTimeout(700);
    if (!moved) {
      const selects = page.locator("select");
      const sc = await selects.count();
      for (let s = 0; s < sc; s++) {
        const sel = selects.nth(s);
        try {
          const opts = await sel.evaluate((el) => [...el.options].map((o) => o.textContent.trim()));
          const current = await sel.evaluate((el) => el.value);
          if (current === "" && opts.length > 1) {
            const want = opts.find((o) => /^CBSE$/i.test(o)) || opts.find((o) => /english/i.test(o)) || opts.find((o) => /school/i.test(o) && !/high/i.test(o)) || opts[1];
            if (want) await sel.selectOption({ label: want });
          }
        } catch {}
      }
      const textIn = page.locator('input[type="text"], input:not([type])');
      const tc = await textIn.count();
      for (let t = 0; t < Math.min(tc, 3); t++) {
        try { if (!(await textIn.nth(t).inputValue())) await textIn.nth(t).fill(name); } catch {}
      }
      moved = await tryForward();
      await page.waitForTimeout(700);
    }
  }
  throw new Error(`registerFixturePersona: onboarding did not reach /dashboard (stuck at ${page.url()})`);
}
