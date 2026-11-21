# FAP-73 real-user browser verification (candidate `aff92c2b` + this verify commit)

Server: `http://127.0.0.1:5199` — vite dev serve of `zcode/fap-73-workspace-loading-shell`
(the worktree that carries FAP-73). Probe: OpenCode in-app Chromium, driven as a real user,
2026-11-13. Screenshots beside this receipt.

## Journey

1. **Register** (`/register`): email-first flow — `Continue with Email` → email step →
   `Create a password` + confirm (min-6 hint shown) → `Create account`.
2. **OTP** (`/register` OTP step): honest preview copy intact — "Local preview — verification is
   simulated; no email is sent. Any 6-digit code completes signup…"; InputOTP field; `000000` +
   `Verify` → lands `/onboarding`.
3. **Onboarding** (5 steps): role=Learner → name+age range (native select; self-declared-age
   honesty note present) → focus=Exam preparation + preferred language English with the FAP-72
   honest note "UI currently available in English, Hindi and Bengali — your choice helps us
   prioritise." under the full 14-language list → exam=JEE Main → review step shows every saved
   value and the preview-saves-locally note → `Start using Visionary` → `/dashboard/home`.
4. **Dashboard home** renders the fresh-account learner workspace: "Welcome back, Real.",
   scoped-sharing note, getting-started entry, honest local-preview labeling.
5. **Six core routes** each opened directly (cold navigation):
   - `/dashboard/learn` → settled h1 `Your learning outline`, overflowX 0
   - `/dashboard/ask` → `Visionary Guide`, overflowX 0
   - `/dashboard/practice` → `Your next practice`, overflowX 0
   - `/dashboard/build` → `Build something of your own`, overflowX 0
   - `/dashboard/progress` → `Your learning evidence`, overflowX 0
   - `/dashboard/career` → learner gets the honest role-boundary page ("This workspace area
     opens with a professional workspace. You are currently working in a learning workspace.")
     — FAP-89/90 law intact, no data leak.
6. **Role add**: `+ Add a role` (workspace switcher select) → getting-started 3-step intro →
   Add-a-workspace-role dialog (Teacher) → role created; the workspace switcher then shows
   both `Personal · Learner` and `Personal · Teacher`; switching back and forth works and each
   side keeps its own workspace shell and sidebar variant.
7. **Console**: 0 errors, 0 warnings across the entire journey.

## Shell evidence

The cold-mount shell window on a warm local dev server is sub-100ms and was not sampled by this
rAF probe on every route (the reviewer's `rev-f-fap73.json` — served on 5177 in the review lane —
captured it live in the restore window: `role=status`, `aria-busy=true`, h1 `Learning workspace`,
localized note, skeleton 560×166, `animation-name: v-opening-pulse`; reduced-motion run shows
`anim: "none"`; 390px phone shell fits at 344px; exactly the five priority chunks warmed after
2.5s on an idle callback; console clean; verdict `ok: true`). The 5/5 law test
`fap73-workspace-opening-shell.test.mjs` pins the same facts at source level.

## Files

- `learn-outline-teacher@1440.png` — `/dashboard/learn` as the added Teacher role
  (teacher variant sidebar: Prepare/Classes/Learners/Insights; outline entry intact).
- `ask-guide-teacher@1440.png` — `/dashboard/ask` (Visionary Guide with task cards,
  language + scoping line, local-preview disclosure).
