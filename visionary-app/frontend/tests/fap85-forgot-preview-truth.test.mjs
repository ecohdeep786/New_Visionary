/** FAP-93 supersedes FAP-85 — there is no local reset token to promise or disclose.
 *
 *  FAP-85 (beta a0aeb95b) caught /forgot-password showing the connected-mode
 *  "Check your email" claim while preview mode fabricated a single-use local
 *  reset token (15-minute TTL in localStorage) that no email referenced, and
 *  no reachable continuation — /reset-password requires ?token (or ?oobCode),
 *  so preview users had no recovery path at all. Its law gated a truthful
 *  preview disclosure and a token continuation around that mechanism.
 *
 *  FAP-93 removes the mechanism: Firebase is the only identity source, so
 *  the reset request goes to the connected transport and the anti-enumeration
 *  "Check your email" view is now the only arm — and it is true. The honesty
 *  law survives as an absence law: no local token, no simulation disclosure,
 *  and no preview arm can silently return.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = readFileSync(join(root, "src/pages/ForgotPassword.jsx"), "utf8");

test("FAP-93: the local reset-token mechanism and its preview arm are gone", () => {
  assert.doesNotMatch(source, /resetToken/, "no local token is created, captured or continued");
  assert.doesNotMatch(source, /Local preview — no email is sent/, "no simulation disclosure left to keep honest");
  assert.doesNotMatch(source, /Continue to reset password/, "no token continuation link");
  assert.doesNotMatch(source, /No local account found/, "the local account store it reported against is gone");
  assert.doesNotMatch(source, /base44\.auth\.source/, "no preview flag on the removed auth source");
});

test("FAP-93: the connected anti-enumeration success view is the only arm", () => {
  assert.match(source, /base44\.auth\.resetPasswordRequest\(email\)/, "the request goes to the connected transport");
  assert.match(source, /Check your email/, "the anti-enumeration success view remains");
  assert.match(source, /If an account exists for/, "the claim stays conditional on account existence");
  assert.match(source, /cause\.code === 'auth\/user-not-found'/, "an unknown address resolves to the same success view, not a separate local error arm");
});

test("FAP-85 regression guard: /reset-password still reads the historical ?token param next to oobCode", () => {
  const reset = readFileSync(join(root, "src/pages/ResetPassword.jsx"), "utf8");
  assert.match(reset, /search\.get\('oobCode'\) \|\| search\.get\('token'\)/, "the reset page reads the ?token param the old continuation link set");
});
