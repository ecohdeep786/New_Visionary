/* FAP-67 shared QA session: the product's auth is Firebase-backed
 * (VITE_AUTH_MODE=firebase), so QA scripts sign in through the real login UI
 * in their own browser context. No localStorage seeding — a pre-seeded
 * workspace conflicts with the app's own bootstrap and stalls the post-login
 * navigation. The Firebase session persists across the script's navigations.
 * The QA account (qa.designer@example.test) must exist in Firebase Auth with
 * a verified email and a completed onboarding; see the FAP-67 receipts. */
export const QA_EMAIL = 'qa.designer@example.test';
export const QA_PASSWORD = 'Visionary#2026';
/* A verified but un-onboarded account for surfaces that must render the
 * onboarding gate (the firebase profile carries onboarding_complete). */
export const QA_ONBOARDING_EMAIL = 'qa.onboarding@example.test';

export async function loginViaUi(page, base, { debug = false, email = QA_EMAIL } = {}) {
 for (let attempt = 0; attempt < 2; attempt++) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000); // let the SPA hydrate before the first click
  /* An already-established session (or the un-onboarded account's redirect)
   * may land past the methods view — the login is then already done. */
  const early = await page.evaluate(() => location.pathname).catch(() => '/login');
  if (early === '/onboarding' || early.startsWith('/dashboard')) return;
  try { await page.getByRole('button', { name: 'Continue with Email' }).first().click({ timeout: 15000 }); }
  catch (failure) {
   const state = await page.evaluate(() => ({ url: location.pathname, h1: document.querySelector('h1')?.textContent.trim().slice(0, 60) ?? null, body: document.body.textContent.trim().slice(0, 140) })).catch(() => 'page unreachable');
   console.log('LOGIN STALL:', JSON.stringify(state));
   throw failure;
  }
  await page.locator('input[type="email"]').first().fill(email);
  await page.getByRole('button', { name: /continue|next/i }).last().click();
  await page.locator('input[type="password"]').first().fill(QA_PASSWORD, { timeout: 20000 });
  await page.getByRole('button', { name: /sign in/i }).last().click();
  try {
   await page.waitForFunction(() => {
    try { const ws = JSON.parse(localStorage.getItem('visionary_workspace_v2') || '{}'); return Object.keys(ws.active || {}).length > 0; } catch { return false; }
   }, { timeout: 20000 });
   await page.waitForTimeout(1500);
   if (debug) {
    const dbg = await page.evaluate(() => ({ url: location.pathname, h1: document.querySelector('h1')?.textContent.trim().slice(0, 50) ?? null }));
    console.log('LOGIN STATE:', JSON.stringify(dbg));
   }
   return;
  } catch { /* one clean retry */ }
 }
 throw new Error('The QA login could not complete in two attempts.');
}

/* The live session's identity for services that key on person/workspace ids. */
export async function liveIdentity(page) {
 return page.evaluate(() => {
  const ws = JSON.parse(localStorage.getItem('visionary_workspace_v2') || '{}');
  const uid = Object.keys(ws.active || {})[0] || null;
  return { personId: uid, workspaceId: uid ? ws.active[uid] : null, role: (ws.people?.find(p => p.id === uid)?.roles || ['student'])[0] };
 });
}
