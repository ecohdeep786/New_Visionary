# F-24 — Backend contract integration (2026-11-06)

Jira key / source ID: F-24 (Visionary Frontend Agent task — backend contract integration)
Acceptance scope: enabler (platform audit; findings without broad implementation — the only
implemented artifact is the audit tooling itself)
Implementer: ZCode agent (Platform Engineer; lane completed by principal engineer)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f24-backend-contracts` / beta `1ca831b8` (F-23 landing)
Owned files: `frontend/scripts/contract-audit.mjs` (new dependency-free audit tool), evidence
directory, this receipt. **No product source file changed.**

## Objective and method

Compare every frontend service/network call against the backend-owned API contracts and validate
authorization, data states, errors and retries — without inventing endpoints, outputs or
capabilities. Method:

1. **Frontend inventory** — every `fetch`/transport call site in `frontend/src` (non-test): path,
   method, auth carriage, error handling, retry policy. The only network surface is the shared
   `src/api/firebase/authTransport.js` wrapper (`credentials: 'same-origin'`, CSRF double-submit,
   `X-Visionary-Account` account binding, 20 s timeout, GET-only single retry) plus three service
   clients (billing 60 s, feedback, learning-session) and two direct `fetch` sites
   (`useSignInMethods`, the dead `OAuthConsent` page). No axios/XHR/WebSocket/SSE anywhere.
2. **Backend inventory** — every `@Controller`/`@Get|Post|Patch|Sse` route in
   `backend/upstream/backend/src`, classified product (FirebaseProductModule — the build started by
   `main-product.ts`/`main-auth.ts`) vs legacy (AppModule — started only by `main.ts`).
3. **Cross-reference** — new dependency-free audit tool `frontend/scripts/contract-audit.mjs`
   extracts both sides statically, matches calls to product routes (path params wildcarded,
   query strings ignored), and **fails closed**: any frontend call without a product route must be
   on the recorded-dependency allowlist or the audit exits 1. Evidence:
   `docs/visionary/baseline/f24-backend-contracts-2026-11-06/contract-audit.json`.
4. **Contract alignment** — findings checked against the recorded boundaries in
   `integration/CONTRACT_GAPS.md` (D-075/D-082/D-087) and the contract docs
   (FIREBASE_AUTH_CONTRACT, PAYMENTS_CONTRACT, FEEDBACK_CONTRACT, LEARNING_LOOP_CONTRACT,
   KNOWLEDGE_PROJECTION_CONTRACT, USER_ACCOUNT_STORAGE).

Audit result: **30 frontend network calls extracted; 28 matched to product backend routes with
matching methods; 2 recorded dependencies (dead OAuthConsent MCP paths); 0 unexpected mismatches;
37 product routes (9 unconsumed); 37 legacy routes (0 consumed by the frontend).** Deterministic
on re-run.

## A. Verified-correct (protect)

| Contract point | Frontend side | Backend side (product) | Verdict |
| --- | --- | --- | --- |
| Session carriage | `credentials: 'same-origin'` only, no bearer (`authTransport.js:14`) | httpOnly `__Host-visionary-session` cookie, Firebase session cookie 14-day/7-day-idle (`request-authority.ts:17-20`, `session-policy.ts`) | match — no token storage in the frontend, server owns the session |
| CSRF | `GET /api/auth/csrf` → `X-CSRF-Token` on every write; one refresh+single replay on the 403 message "Reload this page before continuing." (`authTransport.js:36-43`) | double-submit cookie==header timing-safe compare + `Origin` check; the exact 403 message (`request-authority.ts:21-24`) | match — the replay trigger pins the backend's literal message |
| Account binding | `X-Visionary-Account` sent on writes; clients re-check account identity before AND after each call, throwing status 409 on change (`billingClient.js:5-11`, `learningSessionClient.js:41-46`) | mutating commands require header == current uid, else 409 (`request-authority.ts:26-30`) | match — client guard mirrors the server 409 without replacing it |
| Passive session check | `/api/auth/me?passive=1` every 30 s / on focus; 401 clears silently, non-401 passive failure does not sign out (`AuthContext.jsx:54-63,99-114`) | `me?passive=1` requires exactly `passive=1` (400 otherwise); 401 = session ended (`firebase-product.controller.ts:29`) | match |
| Error mapping | `authErrors.js` maps by HTTP status (429 rate-limit, 401 session ended, 403 reload, 409 account changed, ≥500 unavailable) + `auth/*` code allowlist; vendor messages never rendered | bare NestJS error bodies `{statusCode, message, error}`; no machine-readable codes; 429 message "Too many authentication requests…" | fit — status-based mapping is the correct contract for a codeless error surface (see F-24-F6) |
| Retry policy | GET-only single retry after 120 ms on 502/503/504/TypeError; **writes never auto-retry** (`authTransport.js:22-34`) | server-side idempotency not guaranteed for writes | match — no duplicate-command risk; retries only where safe |
| Data-state validation | billing/feedback/learning clients schema-validate receipts and refuse mismatches with status 503; learning refuses any response containing `answerIndex` (schema-smuggling guard) (`learningSessionClient.js:14-33`) | hand-validated contract bodies (`learning.contract.ts`, `feedback.contract.ts`, `profile.ts`) | match — client re-validation mirrors the recorded receipt contracts |
| Billing | `/api/billing/{account,catalog,checkouts,verify,sync,cancel,invoices/:id,family/*}` all consumed and matched; Razorpay checkout.js loaded with 15 s timeout, `payment.failed` tracked not thrown | full billing controller surface (test mode) | match |
| Learning sessions | `/api/account/learning/sessions{,/:id,/:id/checks,/:id/assessments,/:id/cancel}` consumed and matched | learning controller surface | match |
| Sign-in methods | `GET /api/auth/methods` direct fetch, errors swallowed to `null` gating phone UI (`useSignInMethods.js:8-15`) | public methods endpoint | match |
| Preview isolation | In local preview (`VITE_AUTH_MODE !== 'firebase'`) the frontend makes **zero** network calls — `appClient` is localStorage-only; the Vite `/api` proxy is guarded to dev+demo-project+loopback (`vite.config.js:35-57`) | product runtime not required for preview | match — consistent with F-21-F2 |

## B. Findings

**F-24-F1 (INFO, contract verified):** every live frontend network call has a product backend
route with a matching method — 28/28 matched (see table). The authorization chain (cookie session,
CSRF double-submit with the pinned 403 replay message, account-binding header with mirrored 409
guards) is implemented on both sides without a bearer token anywhere in the product path.

**F-24-F2 (P3, dead module with unmatched endpoints):** `frontend/src/pages/OAuthConsent.jsx` is
imported by nothing (zero importers verified; no route in `App.jsx`) and imports
`@/lib/app-params`, which does not exist — wiring it anywhere would break the build. Its two
endpoints (`GET /api/apps/:appId/mcp/consent-info`, `POST /api/apps/:appId/mcp/authorize-grant`)
have **no contract in either backend app** and use a bearer header foreign to the product session
law. Recorded dependency: an MCP/OAuth app-consent contract does not exist; this page must not be
wired until the backend owns it. `src/lib/authReturnTo.js` also carries stale comments referencing
the missing `app-params.js` (cosmetic). The audit allowlists exactly these two paths so the drift
guard stays fail-closed.

**F-24-F3 (P3, dual backend contract surface):** the pinned backend contains two apps — the
product Firebase app (37 routes, the only one the product build starts) and the legacy
Prisma/JWT app (37 routes: OTP register/verify, bearer-fallback auth, chat SSE, documents, jobs,
subjects — started only by `src/main.ts`). The frontend implements **only** the product contract:
zero frontend calls match legacy-only routes (audit-verified). Risk: a future contributor reading
the legacy controllers could wire the frontend to bearer/OTP endpoints that violate the product
session law. `integration/CONTRACT_GAPS.md` already records the legacy app as "imported reference,
not the current identity runtime" — this audit confirms frontend compliance and records the
misread risk.

**F-24-F4 (INFO, unconsumed product surface):** 9 product routes have no frontend consumer:
`/api/account/overview|devices|invoices` (the frontend renders account data from the
`/api/billing/account` view instead), `/api/billing/jobs/reconcile` and
`/api/billing/webhooks/razorpay` (server-side surfaces, correctly not frontend concerns),
`GET /api/account/feedback` (list; the frontend only POSTs), and the three
`/api/account/learning/knowledge*` endpoints. Not defects — recorded inventory for the backend
lane; the knowledge endpoints sit behind the transport seam in F-24-F5.

**F-24-F5 (INFO, recorded dependency — content/teaching/ML seam):**
`src/services/backendTransport.ts` defines the authenticated exchange contract (20 s whole-operation
deadline, session re-verified before and after each call) but has **zero callers and no URL** —
content serves authored sample material, teaching renders `not_connected`, mentor stays null. No
ML endpoint is called and none is invented; this matches the CONTRACT_GAPS teaching/ML/mentor rows
and the honest "Teaching AI is not connected" law verified in F-18.

**F-24-F6 (P3, error-code gap — backend dependency):** the backend emits no machine-readable error
codes (no global exception filter; bare NestJS bodies), so the frontend maps errors by HTTP status
plus exact message matching — including the literal CSRF 403 sentence that triggers the replay.
This works and is verified, but it is brittle to backend copy changes: message stability is
currently an implicit contract. Recorded as a backend-lane dependency (a stable `code` field would
harden it); the frontend correctly does not invent codes.

**F-24-F7 (INFO, audit tooling):** new `frontend/scripts/contract-audit.mjs` (dependency-free)
produces the cross-reference receipt and fails closed on drift: any future frontend call without a
product route or a recorded dependency exits 1. Deterministic on re-run (30 calls / 28 matched /
2 recorded / 9 unconsumed both runs). Environment note: this build hit the known F-16-F4
chunk-assignment flip (`organizationAuthorCopy.js` split out again); handled per the documented
interim protocol with totals verified stable (+358 B raw / +853 B gzip) before re-recording — the
committed `perf-budget.json` now carries the 138-chunk record (re-recorded on this lane's final
dist with an explicit F-24 note: 3,087,588 B raw / 882,094 B gzip, qa:perf verify PASS).

**F-24-F8 (P3, environment — recorded for future harnesses):** the F-15 release gate's
critical-navigation journey is only exercisable against a **preview-mode** dev server. This lane's
initial gate run hit `critical-navigation` FAIL (OTP wait timeout) because the running 4198 server
had been started against the ignored `frontend/.env.local` (`VITE_AUTH_MODE=firebase`): in firebase
mode the register flow renders the email-verification-link screen (`Confirm your email address` /
`I verified my email`) and never shows the OTP input the gate drives. No product drift — restarting
the worktree dev server with `VITE_AUTH_MODE=preview` restored the recorded OTP journey
(register → password + terms → OTP 000000 → onboarding role board → about wizard → dashboard,
verified in-browser end to end, zero page errors) and the gate passed 5/5. The committed F-15
release-gate baseline was restored and left untouched after the re-run (F-21 precedent).

**No product defects in the live contract surface. No product changes needed or made.**

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| `node scripts/contract-audit.mjs` | **PASS, deterministic ×2** — 30 frontend calls, 28 matched to product routes, 2 recorded dependencies, 0 unexpected mismatches; 37 product + 37 legacy routes inventoried; receipt `docs/visionary/baseline/f24-backend-contracts-2026-11-06/contract-audit.json` |
| Full battery | **PASS — all 10 stages exit 0** (re-verified end-to-end on this tree): `npm test` 653/653 (includes `auth-transport`, `auth-errors`, `backend-transport`, `billing`, `feedback`, `learning-session-client`, `firebase-server-auth` contract-pinning tests); lint, typecheck exit 0; build exit 0 (2 m 07 s); qa:perf **re-recorded per the F-16-F4 interim protocol with an explicit F-24 note** — the known nondeterministic chunk assignment split `organizationAuthorCopy.js` (38,894 B) out of `OrganizationContent.js` this build; totals 3,087,588 B raw / 882,094 B gzip (≈862 KB) vs the previous 3,087,230 B / 881,241 B (+358 B raw / +853 B gzip — chunk-assignment churn only, zero product source change in this lane); qa:perf verify PASS (138 chunks within recorded budgets); qa:taps PASS (243/126, 3 exceptions); qa:motion PASS (439); qa:continuity PASS; `npm run check` exit 0 |
| Release gate | **RELEASE GATE PASS 5/5** (route-sweep 27 routes, keyboard-skip-link, keyboard-focus-visible, accessibility-spot 0 low-contrast / 0 small controls, critical-navigation reached-dashboard) — on the preview-mode worktree dev server; the initial FAIL was the F-24-F8 firebase-mode server misconfiguration, not product drift |
| Browser journey | **PASS** — full register → OTP → onboarding → dashboard driven live in the browser against the preview-mode worktree server, zero page errors (F-24-F8) |
| Live backend exercise | **Not possible in this environment** — the product backend requires Firebase/Firestore credentials to boot and the frontend firebase mode requires `VITE_FIREBASE_*` configuration; neither is present. The contract verification is therefore static + test-pinned (the 653-test battery pins the frontend transport behavior against fake fetches). Recorded as an environment dependency, not assumed. |

## D. Backend / ML dependencies

- **MCP/OAuth app-consent contract** (F-24-F2): does not exist in either backend app; the dead
  `OAuthConsent.jsx` page and its bearer-header pattern must not be wired until the backend owns
  the contract.
- **Content/teaching/ML adapter wiring** (F-24-F5): `backendTransport.ts` is the prepared seam;
  the backend lane owns the real adapter registration and URL. No frontend call exists today.
- **Machine-readable error codes** (F-24-F6): backend-lane enhancement; until then, HTTP-status
  semantics and the exact CSRF/429/401 message strings are the de-facto contract and must be
  treated as stable by the backend lane.
- **Live contract exercise** (C): requires Firebase credentials + `VITE_FIREBASE_*` config in a
  hosted or credentialed environment; recorded for the hosted acceptance gates already listed in
  CONTRACT_GAPS.

## E. Remaining issues and risks

- The dead `OAuthConsent.jsx` (broken `@/lib/app-params` import, unmatched endpoints, bearer
  header) is a latent build hazard if ever imported; removal or contract-backed rewiring is a
  future task-scoped change, not done in this audit lane.
- The legacy 37-route surface remains an attractive misread risk; CONTRACT_GAPS carries the
  authoritative boundary statement.
- Error mapping depends on exact backend message strings (F-24-F6).
- The 9 unconsumed product routes are available surface; any frontend adoption must go through the
  same contract-audit fail-closed guard.
- Battery harnesses must start the 4198 dev server in preview mode (F-24-F8): a server started
  against the ignored firebase `.env.local` renders the email-verification register flow and the
  OTP-based F-15 critical-navigation gate fails closed on it.

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f24-backend-contracts` on `zcode/f24-backend-contracts`
= beta `1ca831b8` + `frontend/scripts/contract-audit.mjs` + evidence + this receipt + the F-16-F4
interim re-record of `frontend/scripts/perf-budget.json` (chunk-assignment churn only; totals
stable; explicit F-24 note). No product source change. Junction-based node_modules runtime
arrangement (nothing committed). Worktree removed after the beta landing per the operator's
standing instruction; branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-24
Acceptance scope: enabler (backend contract integration audit)
Implementer: ZCode agent (Platform Engineer; lane completed by principal engineer)
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f24-backend-contracts / 1ca831b8 / <receipt commit>
Owned files: frontend/scripts/contract-audit.mjs; docs/visionary/baseline/f24-backend-contracts-2026-11-06/ (contract-audit.json); frontend/scripts/perf-budget.json (F-16-F4 interim re-record); this receipt
Verification: contract audit PASS deterministic x2 (30 calls / 28 matched / 2 recorded deps / 0 unexpected); battery all 10 stages exit 0 (653/653); RELEASE GATE PASS 5/5 on the preview-mode worktree server (F-24-F8); browser register->OTP->onboarding->dashboard journey PASS
Findings: F-24-F1 INFO contract verified; F-24-F2 P3 dead OAuthConsent module + unmatched MCP endpoints; F-24-F3 P3 dual backend surface (legacy misread risk); F-24-F4 INFO 9 unconsumed product routes; F-24-F5 INFO backendTransport seam dependency; F-24-F6 P3 error-code gap (backend dependency); F-24-F7 INFO fail-closed audit tooling; F-24-F8 P3 preview-mode server requirement for the release-gate journey; no product changes
Reviewer decision: pending
Dev integration commit: pending
```
