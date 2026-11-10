# C1/FAP-49 — "Auth to the one system" evidence pack

Date: 2026-10-22 · Branch: `gl-kan-201-c1-auth` · Worktree: `gl-kan-201-c1-auth`
Dev server: 127.0.0.1:5192 (preview build) · Emulator demo: 127.0.0.1:5175 + Firebase Auth Emulator 9099 + fixture 3035

## Scope

1. Auth skin joins the one system: AuthLayout canvas `#f0f2f5` → `#f5f5f7` (Login/Register loading screens included); AuthUI primary pill switched from the FAP-42 commerce fill `#0071e3/#0077ed` to the system **ink pill** `#1d1d1f` (hover `#272729`, pressed `#18181a`, press scale, ring `#0066cc` unchanged) on `primaryBtnClass`/`primaryBtnAutoClass`; error red unified to `#e30000` (was `#b3261e` across Login, Register, SocialAuthButtons, ForgotPassword, ResetPassword; `#b06000` amber notice boxes died with the dead flows).
2. Dead "coming soon" flows removed entirely: Login + Register `mobile`/`organization` dead-submit views, the fake method buttons, SocialAuthButtons' organization button + `onOrganization` prop. "Continue with Email" becomes the primary method in preview builds; dead flows render as **null choices** (probe-verified).
3. **Founder-approved scope addition — real mobile sign-in**: Firebase `signInWithPhoneNumber` flow (adapter `beginPhoneSignIn`/`confirmPhoneSignIn`, serverAuth `requestPhoneSignIn`/`confirmPhoneSignIn`, `AuthContext.confirmPhoneSignIn`, preview-source fail-closed stubs), gated by `source === 'firebase' && VITE_ENABLE_PHONE_SIGNIN === '1'` so both preview builds and emulated/demos never show a phone option where it cannot work. PhoneInput restored in AuthUI as the retained primitive. The final session mint depends on the backend phone-identity gate (`/session` currently requires `email + email_verified`, owned by the backend agent per founder division of labor); until that gate lands the flow **fails closed calmly** (`auth/phone-sign-in-unavailable` copy), which the emulator review asserts.

## Probes (c1-probes.mjs after → c1-probe-after.json) — all exact

- `/login` `/register` `/forgot-password` `/forgot-user-id` `/reset-password` × 1440/768/390: `pageOverflowX 0`.
- Canvas exact `rgb(245,245,247)` (#f5f5f7) on every route; `data-font-surface="product"` shell present; card white + radius 12px.
- Ink pill exact: bg `rgb(29,29,31)`, h 44, radius 9999px, 17px/500, ls −0.187px.
- Links exact `rgb(0,102,204)` (#0066cc); social option count 3 (Google/Microsoft/Apple).
- Dead-choice absence (Mobile/Organization/coming-soon) verified on every route/width.
- Live error state ("Account not found" on login email step): computed `rgb(227,0,0)`.

**Radius law reconciliation (recorded verdict):** the ticket text said "white 28px card". The active A4 public-bridge radius law (`src/styles/public-bridge.css` L353: `.rounded-\[28px\] { border-radius: var(--radius-media) !important; }`, `--radius-media: 12px`) normalizes the arbitrary 28px marker to the one system's canonical radius. C1 keeps the law — the card renders white, radius 12px — and this reconciliation is recorded here and in the ladder doc instead of overriding a settled system law.

## Captures (16, committed as receipts)

Login methods (1440/768/390), login email + error state, register methods (1440/390) + email, forgot-password (1440/390) + sent state, forgot-user-id, reset-password ("request a new link" state), and the real phone journey on the emulator build: methods with phone option, mobile number entry, OTP step (390).

## Gates

| Gate | Result |
| --- | --- |
| `npm run lint` (eslint --quiet) | 0 errors |
| `npm run typecheck` (jsconfig + tsconfig.domain) | exit 0 |
| `npm test` | **609/609 pass** (`c1-tests-tap.txt`) |
| `npm run build` | exit 0 (19.7s final) |
| `npm run qa:fonts` (font-surface-review on :4197) | PASS (includes /login + /register guest surfaces) |
| `npm run scope:audit:write` | regenerated: controlDeclarations 1669 → **1654**, controlFiles 220 (27 dead-flow controls removed, 12 phone-journey controls added) |
| `auth-emulator-review.mjs` (puppeteer, demo-emulator stack) | **12/12 PASS, exit 0** — full Web SDK journey: register → verify → onboarding → dashboard → forgot/reset → wrong/new password → **phone sign-in tokens + calm fail-closed** → duplicate registration → truthful recovery (`emulator-review-results.json`) |

## Division of labor (founder instruction, 2026-10-22)

- Frontend (this task): complete phone journey, env-gated, emulator-verified to the SMS/code legs; session exchange fails closed with calm copy until the backend gate exists.
- Backend (agent Codex): `/session` gate in `firebase-product.service.ts` (accept SMS-verified phone-only identities; profile schema already carries `phoneNumber`). When that merges, flip the production `VITE_ENABLE_PHONE_SIGNIN`, and the same review scenario flips to asserting the onboarding handoff (TODO marker left in the review script).
