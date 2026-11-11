/** FAP-70 — the preview OTP step must not claim an email was sent.
 *
 *  Defect at beta 67edaa93: /register's preview OTP view claimed "We sent a
 *  6-digit code to <email>" although preview mode (base44.auth.source !==
 *  'firebase') has no email transport; "Resend" showed the toast "Code sent /
 *  Check your email for the new code." via resendOtp() — an unfulfilled
 *  promise (appClient.js resendOtp returns {ok:true}). Any 6 digits completed
 *  registration (verifyOtp ignores the code). The preview disclosure appeared
 *  only on the onboarding review step, not at the OTP step.
 *
 *  The law: in preview, the verification step discloses the simulation
 *  truthfully ("Local preview — verification is simulated; no email is sent.
 *  Any 6-digit code completes signup for <email>.") and the Resend control is
 *  connected-mode only. The connected Firebase flow keeps "Verify your
 *  email", "We sent a 6-digit code to", and its Resend control unchanged.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = readFileSync(join(root, "src/pages/Register.jsx"), "utf8");

test("FAP-70: the preview flag gates the verification view and is derived from the auth source", () => {
  assert.match(source, /const preview = base44\.auth\.source !== 'firebase';/, "single preview flag from the auth source");
  assert.match(source, /\{preview \? "Finish creating your account" : "Verify your email"\}/, "OTP step title gated on preview");
  assert.match(source, /setView\(preview \? "otp" : 'verification'\)/, "post-register view routing uses the same flag");
});

test("FAP-70: the preview OTP step discloses the simulation and makes no sent-email claim", () => {
  assert.match(source, /Local preview — verification is simulated; no email is sent\./, "honest disclosure present");
  assert.match(source, /Any 6-digit code completes signup for/, "the any-code truth is stated, not hidden");
  /* The fake claim may exist only inside the connected arm of the same
   * ternary — the preview arm must not render it. Assert the claim sits on
   * the `:` (connected) side by checking its position after the disclosure. */
  const claimAt = source.indexOf("We sent a 6-digit code to");
  const disclosureAt = source.indexOf("Local preview — verification is simulated");
  assert.ok(claimAt > -1, "connected copy retained");
  assert.ok(disclosureAt > -1 && disclosureAt < claimAt, "claim appears only after (in the connected arm of) the preview disclosure ternary");
});

test("FAP-70: Resend (and its 'Code sent' toast) is connected-mode only", () => {
  const resendIndex = source.indexOf("{!preview && (");
  assert.ok(resendIndex > -1, "Resend row wrapped in a !preview guard");
  const guardWindow = source.slice(resendIndex, resendIndex + 400);
  assert.match(guardWindow, /Didn't receive the code\?/, "the guarded block is the resend row");
  assert.match(guardWindow, /Resend/, "the guarded block contains the Resend control");
  const toastIndex = source.indexOf('title: "Code sent"');
  assert.ok(toastIndex > -1, "the connected toast handler remains for the firebase flow");
  assert.ok(toastIndex < resendIndex, "toast lives in handleResend (defined before the gated JSX), unreachable in preview");
});
