/** FAP-93 supersedes FAP-70 — the simulated preview OTP no longer exists.
 *
 *  FAP-70 (beta 67edaa93) caught /register's preview OTP view claiming
 *  "We sent a 6-digit code to <email>" while preview mode had no email
 *  transport, a "Code sent" resend toast wired to a no-op resendOtp(), and
 *  verifyOtp() accepting any 6 digits. Its law gated honest disclosure copy
 *  around a mechanism that simulated verification.
 *
 *  FAP-93 removes the mechanism: Firebase is the only identity source, so
 *  there is no preview auth source to disclose — every registration goes
 *  through the connected identity provider and the real email-verification
 *  step. The honesty law survives as an absence law: the simulated step,
 *  its disclosure, and its any-code truth cannot silently return.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = readFileSync(join(root, "src/pages/Register.jsx"), "utf8");

test("FAP-93: the preview OTP mechanism and its preview flag are gone from registration", () => {
  assert.doesNotMatch(source, /verifyOtp|resendOtp/, "no local code entry or resend remains");
  assert.doesNotMatch(source, /base44\.auth\.source/, "no page branches on the removed preview auth source");
  assert.doesNotMatch(source, /Any 6-digit code completes signup/, "the any-code truth is retired with the mechanism");
  assert.doesNotMatch(source, /We sent a 6-digit code to/, "the sent-code claim has no local transport to be honest about");
});

test("FAP-93: registration continues only to the connected email-verification step", () => {
  assert.match(source, /setView\('verification'\)/, "the create step continues to verification");
  assert.match(source, /<EmailVerification email=\{email\}/, "the connected verification view is the only survivor of the OTP era");
  assert.match(source, /err\.registrationCreated/, "a created-but-undeliverable identity still reaches verification for retry");
});

test("FAP-93: the connected verification gate itself is tested at the adapter contract", () => {
  const contract = readFileSync(join(root, "tests/firebase-server-auth.test.mjs"), "utf8");
  assert.match(contract, /auth\/email-not-verified/, "an unverified email never exchanges a token for a product session");
});
