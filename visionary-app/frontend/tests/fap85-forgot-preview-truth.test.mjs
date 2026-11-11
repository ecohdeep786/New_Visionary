/** FAP-85 — the preview forgot-password step must not promise an emailed reset link.
 *
 *  Defect at beta a0aeb95b: ForgotPassword discarded the resetToken that
 *  appClient.js resetPasswordRequest returns ({ ok: true, resetToken } — a
 *  single-use token with a 15-minute TTL stored in localStorage) and showed
 *  the connected-mode success copy "Check your email / If an account exists
 *  for <email>, you'll receive a password reset link shortly." In preview
 *  (base44.auth.source !== 'firebase') no email is sent, so the claim was
 *  false and the created token was unreachable: /reset-password requires
 *  ?token (or ?oobCode), so preview users had no recovery path at all.
 *
 *  The law: in preview, the success step discloses the simulation truthfully
 *  ("Local preview — no email is sent.") and, when the local adapter returned
 *  a token, continues to /reset-password?token=…; unknown addresses get the
 *  honest "No local account found" state, mirroring the preview sign-in
 *  voice ("Account not found"). The connected Firebase flow keeps its
 *  byte-identical anti-enumeration success view ("Check your email") and its
 *  sendPasswordResetEmail transport.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = readFileSync(join(root, "src/pages/ForgotPassword.jsx"), "utf8");

test("FAP-85: the preview flag gates the form copy and is derived from the auth source", () => {
  assert.match(source, /const preview = base44\.auth\.source !== 'firebase';/, "single preview flag from the auth source");
  assert.match(source, /Enter your account email to create a local password reset token\./, "preview form copy makes no email promise");
  assert.match(source, /Create reset token/, "preview submit button does not say a link is sent");
  const linkedLabelAt = source.indexOf("Enter your account email to request a password reset link.");
  assert.ok(linkedLabelAt > -1, "connected form copy retained");
  assert.match(source, /Send reset link/, "connected submit button retained");
});

test("FAP-85: the preview success step discloses the simulation and continues with the token", () => {
  assert.match(source, /Local preview — no email is sent\./, "honest disclosure present");
  assert.match(source, /No local account found/, "preview honestly reports an unknown local address (mirrors sign-in voice)");
  assert.match(source, /result\?\.resetToken/, "the adapter's resetToken is captured, not discarded");
  assert.match(source, /\/reset-password\?token=\$\{encodeURIComponent\(resetToken\)\}/, "the continuation link carries the token to /reset-password");
  assert.match(source, /Continue to reset password/, "the token continuation is surfaced as a primary action");
  assert.match(source, /single-use reset token was created in this browser's local storage and expires in 15 minutes/, "the token's lifetime is disclosed, not hidden");
});

test("FAP-85: the connected 'Check your email' claim lives only in the connected arm", () => {
  const connectedTitleAt = source.indexOf(">Check your email</h2>");
  const claimAt = source.indexOf("you'll receive a password reset link shortly");
  const disclosureAt = source.indexOf("Local preview — no email is sent.");
  const continueAt = source.indexOf("Continue to reset password");
  assert.ok(connectedTitleAt > -1, "connected title retained");
  assert.ok(claimAt > -1, "connected success copy retained");
  assert.ok(disclosureAt > -1, "preview disclosure present");
  assert.ok(disclosureAt < connectedTitleAt && continueAt > -1 && continueAt < connectedTitleAt, "the preview truth (disclosure + token continuation) precedes the connected arm");
  assert.ok(claimAt > connectedTitleAt, "the emailed-link claim appears in the connected arm, after the preview truth");
  const connectedArm = source.slice(connectedTitleAt);
  assert.ok(!connectedArm.includes("Continue to reset password"), "the connected arm has no token continuation (unchanged flow)");
  assert.ok(!connectedArm.includes("Local preview — no email is sent."), "the connected arm keeps its anti-enumeration copy without the preview disclosure");
});

test("FAP-85: /reset-password already accepts the token param (regression guard)", () => {
  const reset = readFileSync(join(root, "src/pages/ResetPassword.jsx"), "utf8");
  assert.match(reset, /search\.get\('oobCode'\) \|\| search\.get\('token'\)/, "the reset page reads the ?token param the continuation link sets");
});
