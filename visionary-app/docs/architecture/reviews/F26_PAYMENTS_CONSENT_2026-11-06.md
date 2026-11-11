# F-26 — Payments, consent and data integrity (2026-11-06)

Jira key / source ID: F-26 (Visionary Frontend Agent task — payments, consent and data integrity)
Acceptance scope: enabler (trust UI + security audit; findings without broad implementation — the
only implemented artifact is the review harness itself)
Implementer: ZCode agent (Trust UI + Security Engineers; lane completed by principal engineer)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f26-payments-consent` / beta `b8244ec9` (F-25 landing)
Owned files: `frontend/scripts/payments-consent-review.mjs` (new dependency-free browser harness),
evidence directory, this receipt. **No product source file changed.**

## Objective and method

Validate payment disclosures, subscription states, sensitive-data handling, guardian/organization
permissions and server-owned decisions — without inventing endpoints, entitlements or capabilities.
Method:

1. **Source inspection** — the trust surfaces and their pinned tests: `services/billingClient.js`
   (60 s billing transport; account-binding guard throwing 409 before AND after every call plus a
   `beforeSend` re-check; response `uid` mismatch refused; Razorpay script load with a 15 s
   deadline and honest failure copy "Your payment has not been started"; checkout description
   carries "Test mode"), `pages/dashboard/Plans.jsx` (hard mode gate: firebase source →
   `ConnectedBilling`, otherwise `PreviewPlans`), `PreviewPlans` (fail-closed subscription-state
   validation — an invalid local billing record renders "Saved billing is unavailable. Original
   records have not been changed."; simulated checkout with outcome select and explicit
   no-payment/no-charge notices; cancel retains access to period end; "Demo counts are not
   production entitlements"; "No real checkout, renewal, tax calculation, or payment method is
   connected"; youth sponsorship protection), `pages/dashboard/Subscription.jsx` (the
   unconnected-mode plan state: "No active subscription or payment method", "No purchase is made
   from this page"), `components/dashboard/ConnectedBilling.jsx` (revision-guard on account reads,
   15 s foreground polling, family invitations through the billing client), and the Privacy &
   consent surface in `WorkspaceTools.jsx` (sharing boundaries, workspace export, connections
   scoping).
2. **Test baseline** — the 11 pinned trust-related test files pass before any harness work:
   `billing`, `organization-permissions`, `organization-audit`, `organization-invitations`,
   `parent-report-ask`, `connection-integrity`, `connections`, `parent-classwork-boundary`,
   `parent-goal-sharing`, `parent-notifications`, `parent-project-sharing` → **57/57**.
3. **Live harness** — new `frontend/scripts/payments-consent-review.mjs` drives three phases with
   real registered accounts (preview repository mode; billing simulated; no payment method exists)
   and fails closed on any missing honest marker. Evidence:
   `docs/visionary/baseline/f26-payments-consent-2026-11-06/` (receipt.json + 8 captures +
   workspace-export fixture).

## A. Verified-correct (protect)

| Trust point | Verified behaviour | Source |
| --- | --- | --- |
| Simulation disclosure | the Plans surface opens with "All billing here is simulated."; the checkout dialog warns "Simulation only. Never enter card, bank, or UPI details." + "Taxes and live terms are not configured." | `Plans.jsx` PreviewPlans, verified live |
| Subscription states | the full demo state machine renders honestly: failure → "Demo payment failed. No charge was made and your current plan is unchanged."; success → "Demo subscription activated. No payment was collected."; cancel → "Cancellation scheduled. Demo access retained until {date}." with the dialog law "Your saved work is retained. No real subscription is changed."; resume restores with saved work available | verified live (all four states) |
| Server-owned decisions | the failed checkout grants nothing and the recorded plan state reflects it ("Latest checkout Failure · Existing access retained"); no local code path turns a simulated checkout into an entitlement claim; the invoice area states "No invoices. This preview has no payment method." | `Plans.jsx`, verified live |
| Usage entitlements | the usage meter is labelled "Demo counts are not production entitlements." and core access is preserved at the limit ("Saved learning, practice, projects and required classwork remain available at the limit.") | `Plans.jsx`, verified live |
| Youth protection | "This youth/unknown-age preview does not display sponsorship." for non-adult age bands; the Family plan copy keeps "Billing and guardian permission stay separate." | `Plans.jsx`, source-verified |
| Mode gating | firebase source renders `ConnectedBilling`; preview renders `PreviewPlans` — the connected billing surface (real Razorpay + server receipts) cannot appear in the unconnected preview | `Plans.jsx:22` |
| Guardian consent | the connect surface states "This preview does not verify guardianship. Do not enter real child information."; the request is pending with a visible seven-day expiry; the learner accepts through Connections; the parent then sees Connected · "Progress summaries only" | verified live (two-account pair) |
| Consent-scoped reporting | View report lands on `/dashboard/reports?child=` with "Shared learning summaries, not private conversations." and (collapsed section) "Answers, grades and private feedback are excluded."; mastery honesty: "Completion shows participation; it does not establish mastery." | `ParentReport.jsx`, verified live |
| Family-billing boundary | "Family billing does not grant guardian access." renders on the Privacy & consent surface — payment never becomes permission | `WorkspaceTools.jsx`, verified live |
| Data export | "Export this workspace" produces a real download; the export notice states "Export contains this account's local workspace records. Cloud correction, deletion, guardian verification and grievance processing require future services."; the downloaded JSON parses as the local workspace snapshot with no payment credentials inside | verified live (download captured + parsed) |
| Scope honesty | the privacy surface opens with "This is a local preview, not verified cloud security." and Connections "keeps requests, approvers, scopes, expiry and revocation together" with "No request is sent and no permission changes when you open this page." | `WorkspaceTools.jsx`, verified live |

## B. Findings

**F-26-F1 (INFO, trust law verified live):** 29/29 harness checks pass across three phases — the
simulated billing surface discloses itself at every step (simulation banner, anti-phishing dialog,
no-charge/no-payment outcome notices, demo-entitlement label, no-payment-method invoice state),
the subscription state machine behaves exactly as recorded, the guardian consent pair runs
end-to-end with the honest guardianship notice and consent-scoped reporting, and the workspace
export produces a real validated download of local records only.

**F-26-F2 (INFO, server-owned decisions in the connected surface):** `ConnectedBilling` never
derives entitlements locally — account reads are revision-guarded, every response's `uid` is
checked against the bound account (mismatch → reload error), the billing client re-verifies the
account before AND after each call with a 409 mirror, and Razorpay `payment.failed` is tracked
(not thrown) so the server's verify step remains the authority. In this environment the connected
surface is unexercisable (no backend/Firebase credentials) — its live verification remains the
hosted acceptance gate already recorded in CONTRACT_GAPS.

**F-26-F3 (P3, connected-mode verification dependency):** the real payment path (Razorpay
checkout.js, server receipt verification, subscription sync, family invitation transport) exists
behind the firebase-mode gate and cannot be exercised without backend credentials + configured
Razorpay test keys. The preview verifies the honest simulation laws; the connected laws (schema
re-validation refusing mismatched receipts with 503, CSRF/account-bound writes, webhook-driven
state) are pinned by `tests/billing.test.mjs` and the F-24 contract audit but not exercised live
here. Recorded as an environment dependency, not assumed.

**F-26-F4 (INFO, data-integrity posture):** the preview's entire workspace is local
(`exportWorkspace` serializes the local snapshot); the export is the only data-egress path on the
surface and it is explicit and user-initiated. Deletion/correction/grievance flows honestly do not
exist ("require future services") — recorded, not invented. The demo subscription state machine is
validated fail-closed: a malformed local billing record disables the surface rather than rendering
invented state.

**F-26-F5 (INFO, environment):** the F-16-F4 chunk flip recurred on this lane's build
(`organizationAuthorCopy` split out again; 138 chunks); handled per the documented interim
protocol with an explicit F-26 note (totals 3,087,588 B raw / 882,094 B gzip — identical to the
F-24 record, confirming churn-only). The harness is deterministic on back-to-back runs (29/29
checks, 0 defects, 37 records, three consecutive runs). Battery ran against the worktree dev
server started with `VITE_AUTH_MODE=preview` per F-24-F8.

**No product defects in the live trust surfaces. No product changes needed or made.**

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| Trust-related pinned tests | **57/57 PASS** (billing, organization-permissions, organization-audit, organization-invitations, parent-report-ask, connection-integrity, connections, parent-classwork-boundary, parent-goal-sharing, parent-notifications, parent-project-sharing) |
| `node scripts/payments-consent-review.mjs` | **PASS — 29/29 checks, 0 defects, 8 captures, deterministic ×3** (billing state machine failed→success→cancel→resume with all disclosures; consent pair pending→accept→connected→scoped report; privacy surface + validated workspace export download) |
| Full battery | **PASS — all 10 stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (19.6 s); qa:perf **re-recorded per the F-16-F4 interim protocol with an explicit F-26 note** (chunk-assignment churn only; totals 3,087,588 B raw / 882,094 B gzip) and verify PASS (138 chunks); qa:taps PASS (243/126, 3 exceptions); qa:motion PASS (439); qa:continuity PASS; `npm run check` exit 0 |
| Release gate | **RELEASE GATE PASS 5/5** (route-sweep 27 routes, keyboard-skip-link, keyboard-focus-visible, accessibility-spot 0 low-contrast / 0 small controls, critical-navigation reached-dashboard) on the preview-mode worktree server (F-24-F8 law) |
| Live connected-billing exercise | **Not possible in this environment** — requires Firebase/Firestore credentials and configured Razorpay test keys (F-26-F3); recorded for the hosted acceptance gates already listed in CONTRACT_GAPS |

## D. Backend dependencies

- **Connected billing verification** (F-26-F3): Razorpay checkout + server receipt verification +
  webhook-driven subscription state require the credentialed backend environment; the frontend
  schema laws (`tests/billing.test.mjs`, 503 refusal on mismatched receipts) pin the contract.
- **Guardian/identity verification**: the frontend honestly states guardianship is not verified in
  preview; real guardian authority remains the backend/trust lane's open gate (recorded since
  F-20-F2, unchanged).
- **Cloud correction/deletion/grievance services** (F-26-F4): recorded as future services by the
  product copy; no frontend invention.

## E. Remaining issues and risks

- The connected billing surface's live behaviour (Razorpay popup, verify round-trip, family
  invitation transport) is unverified in this environment (F-26-F3).
- The simulated checkout's outcome select is a preview-only affordance; any future real checkout
  must replace it with the server-decided outcome and remove the simulation dialog.
- The demo usage counter ("10-turn demo allowance") is a local simulation; production metering is
  not connected (recorded on the surface).
- Chunk-assignment nondeterminism (F-16-F4) continues to require per-lane re-records until the
  law owner adopts a totals-level rule.

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f26-payments-consent` on `zcode/f26-payments-consent` = beta
`b8244ec9` + `frontend/scripts/payments-consent-review.mjs` + evidence + this receipt + the
F-16-F4 interim re-record of `frontend/scripts/perf-budget.json` (chunk-assignment churn only;
totals stable; explicit F-26 note). No product source change. Junction-based node_modules runtime
arrangement (nothing committed). Worktree removed after the beta landing per the operator's
standing instruction; branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-26
Acceptance scope: enabler (payments, consent and data integrity review)
Implementer: ZCode agent (Trust UI + Security Engineers; lane completed by principal engineer)
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f26-payments-consent / b8244ec9 / <receipt commit>
Owned files: frontend/scripts/payments-consent-review.mjs; docs/visionary/baseline/f26-payments-consent-2026-11-06/ (receipt.json + 8 captures + export fixture); frontend/scripts/perf-budget.json (F-16-F4 interim re-record); this receipt
Verification: 29/29 live trust checks PASS deterministic x3 (0 defects, 8 captures); trust pinned tests 57/57; battery all 10 stages exit 0 (653/653); RELEASE GATE PASS 5/5 (preview-mode worktree server per F-24-F8)
Findings: F-26-F1 INFO trust law verified live; F-26-F2 INFO server-owned decisions in ConnectedBilling (409 guard, uid check, revision guard, payment.failed tracked not thrown); F-26-F3 P3 connected-mode verification dependency (Razorpay/backend credentials required); F-26-F4 INFO data-integrity posture (local workspace, explicit export, fail-closed billing state, no invented deletion/correction); F-26-F5 INFO environment (F-16-F4 chunk flip re-recorded, harness deterministic x3); no product changes
Reviewer decision: pending
Dev integration commit: pending
```
