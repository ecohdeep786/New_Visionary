# T08 Firebase-live journey verification — receipt (2026-11-11)

User-directed check: "make sure the firebase working in live because it connect with firebase console." This is a **verification-only record — zero source files changed** (contract tests and gates unchanged at beta `9e1fed11`; the merged FAP-70/85/86 code is exercised, not modified). Preview-simulation receipts for the same journeys already exist (`V6_T08_FAP70/85/86_QA_2026-11-11.md`); this receipt covers the **connected Firebase arm driven against the real `visionary-research` project**.

## Environment

- Primary checkout @ beta `9e1fed11` (T08 merge state), dev server 5173 with gitignored `frontend/.env.local` (six public Web-app values copied from the committed `infrastructure/gcp/firebase-web-config.json` + `VITE_AUTH_MODE=firebase`; `visionary-app/.gitignore:35` covers `*.local`), backend auth server 3001, Vite proxy `/api → 127.0.0.1:3001`.
- Edge (msedge channel), Playwright, `--no-proxy-server`, fresh contexts, viewport 1440×900. Network listener captured every identitytoolkit/securetoken call (request+response bodies) and every response ≥ 400 on any domain.
- Probes: `t08-firebase-live.mjs` (first pass, `http://127.0.0.1:5173`), `t08-firebase-live2.mjs` (main pass, `http://localhost:5173`), `t08-firebase-gate.mjs` ("I verified my email" guard). Raw JSONs + screenshots under `docs/visionary/baseline/t08-firebase-live-2026-11-11/`.

## Live results (main pass, localhost origin — account `t08-firebase-1794386344873@visionary.test`)

| # | check | result |
| --- | --- | --- |
| 1 | Adapter resolves to Firebase | `base44.auth.source === 'firebase'` (page import of the production `/src/api/base44Client.js`) |
| 2 | Password policy is the live project's | `passwordPolicy` **200**: `minPasswordLength: 6`, `enforcementState: ENFORCE` |
| 3 | Account created in the live project | `accounts:signUp` **200** → `GetAccountInfoResponse` localId **`LaDxOhsiI7QfYXTldUp43H41g3u2`** |
| 4 | Verification email dispatch #1 | `accounts:sendOobCode` (`requestType: VERIFY_EMAIL`) **200** → `GetOobConfirmationCodeResponse` with the account email |
| 5 | 60 s cooldown honored | "Resend available in 59s" disabled after register; adapter-level guard (`authAdapter.js:17`) plus UI countdown |
| 6 | Resend after cooldown | at +62 s → `sendOobCode` **200** (dispatch #2) → honest "**Verification link sent. Check your inbox and spam folder.**" + cooldown restarted |
| 7 | Unverified sign-in gate | login → `email-not-verified` thrown **pre-server** (`serverAuth.js:44`, before any session exchange) → `/login` renders "Confirm your email address" with "I verified my email" / "Resend verification link" / "Sign in again" |
| 8 | "I verified my email" guard | clicked while still unverified → `lookup` 200 (reload, `emailVerified` still false) → honest message "Open your email verification link, then return here to continue." (`authErrors.js:23`), stays gated, **no `/api/auth/session` POST** |
| 9 | Console inventory | exactly 2× `GET /api/auth/me → 401 {"message":"Sign in to continue."}` — the expected signed-out session bootstrap, one per page load (URL + body captured in `failures-all`); no other console warnings/errors |

## First-pass artifact disclosed (127.0.0.1 origin — not a product defect)

The first pass browsed `http://127.0.0.1:5173`: `sendOobCode` returned **400 twice**, and the register view honestly showed the generic "Your account could not be created. Please try again." (`registrationCreated` routing, `serverAuth.js:84` → `Register.jsx:107`), cooldown skipped via `initialCooldown={error ? 0 : 60}`. Cause: the adapter sets the email-verification continue URL to `` `${window.location.origin}/login` `` (`authAdapter.js:18`; same pattern for reset, line 38), and Firebase's Authorized domains includes `localhost` by default but **not `127.0.0.1`**. Same origin on `localhost` → dispatch 200s. The product behaves correctly for authorized origins; **ops note: any future hosted origin must be added to Firebase console → Authentication → Settings → Authorized domains before the connected verification dispatch will succeed there.**

## Untested — no claims made

1. **Clicking the emailed verification link** (oobCode → `AuthAction.jsx` → `applyActionCode` → verified state → sign-in → server session exchange → onboarding) is **not verified live**: no mailbox exists for `@visionary.test` addresses, and Firebase-side SMTP delivery/bounce for them is not observable from here. The verified-side journey remains verified in preview-simulation form and by contract tests only.
2. **`POST /api/auth/session`** (server-verified session mint) — requires a verified identity; same blocker.
3. **Password-reset email dispatch** (`sendPasswordResetEmail`) was not exercised in this pass; the connected arm is contract-tested byte-identical and the preview arm is receipted (FAP-85).

## Firebase console footprint (labeled fixtures)

Two clearly labeled test accounts now exist in the user's `visionary-research` project, both **Email not verified**, password `correct-horse-9` (disclosed in the probe JSONs): `t08-firebase-1794385955600@visionary.test` (uid begins `VZTKhZgRQkaHEmBDhX…`) and `t08-firebase-1794386344873@visionary.test` (localId `LaDxOhsiI7QfYXTldUp43H41g3u2`). They are throwaway labeled fixtures and can be deleted from the console at any time.

## Teardown

`frontend/.env.local` removed after the run (gitignored; recreate from `infrastructure/gcp/firebase-web-config.json` values + `VITE_AUTH_MODE=firebase` per `.env.firebase.example` when a live-mode session is needed again). Dev server 5173 stopped so the default 5173 preview stays PREVIEW mode for T09 probes; the 5174 preview server (beta) and the 3001 backend are untouched.

## Verdict

The connected Firebase identity path **works live**: adapter resolution, account creation, two real verification-email dispatches with Firebase confirmation responses, the 60-second cooldown on both layers, the honest resend confirmation, the unverified sign-in gate, and the premature-"I verified my email" guard all behave as receipted against the real project. The emailed-link click and the server session exchange remain **open items that require a real verifiable mailbox**; they are not claimed anywhere in this record. T08 stays in Testing pending D-095 independent review, which must weigh this disclosure.
