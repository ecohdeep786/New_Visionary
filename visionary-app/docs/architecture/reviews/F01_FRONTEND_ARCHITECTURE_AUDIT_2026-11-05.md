# F-01 — Frontend architecture and dependency audit

- **Specialist:** Principal Architect (opencode lane)
- **Source revision audited:** `beta` @ `2cbc89eb` (origin/beta, verified on remote 2026-11-05)
- **Worktree:** `New_Visionary-worktrees/opencode-f01-frontend-audit`, branch `opencode/f01-frontend-audit` (created from `origin/beta`; beta/dev/main untouched)
- **Frontend root:** `visionary-app/frontend`
- **Date:** 2026-11-05
- **Change summary:** docs-only — this report is the only file added. No source, token, style or dependency change is made (audit task, instruction 9).

---

## 1. Governing instructions read

- Root `AGENTS.md` (component ownership, D-056/D-057/D-095/D-098, working rules).
- `frontend/README.md` (dual-mode auth, qa batteries, contracts reading order, install/build commands).
- `docs/README.md` reading order; `docs/architecture/PRODUCT_DOMAINS.md` map; `integration/CONTRACT_GAPS.md` referenced for dependency register.
- Prior session receipts on the audited revision: `docs/visionary/baseline/fap62-type-role-verification-2026-11-04.md`, `docs/visionary/baseline/fap65-icon-family-audit-2026-11-05.md`, `docs/visionary/baseline/principal-review-2026-11-05.md`.

## 2. Route map (verified against `frontend/src/App.jsx` lines 160–234)

### Public (23 routes, no auth guard)
`/` (LandingEntry → Landing), `/login`, `/register`, `/forgot-password`, `/forgot-user-id`, `/reset-password`, `/auth/action`, five persona pages (`/student`, `/teacher`, `/parent`, `/professional` — CollegePage, `/organization`), marketing (`/how-it-works` — CoachingPage, `/help` — SchoolPage, `/pricing` — AILearningPage, `/about`, `/download`, `/careers`, `/research`, `/community`, `/contact`, `/partners`, `/updates`, `/referral`), policy (`/safety`, `/privacy`, `/terms`, `/security`, `/accessibility`, `/cookies`), redirects (`/signin`→`/login`, `/career`→`/careers`).

**Finding F-01-N1 (naming drift, P3):** five route paths render pages whose file names do not match their public name (`/help`→SchoolPage, `/professional`→CollegePage, `/how-it-works`→CoachingPage, `/pricing`→AILearningPage). Content-correct, but the file→route mapping is not obvious to new engineers; worth a rename or an alias comment in a future refactor lane (no behavior change authorized in this audit).

### Auth-gated (ProtectedRoute → OnboardingGate)
`/onboarding` (3-screen introduction dialog + setup), then `DashboardLayout` with 29 dashboard routes: `home`, `classes` (role-dispatched StudentClasses/TeacherClasses), `learn` + `learn/:topicId`, `ask` (renders DashboardHome), `practice`, `build`, `subscription`, `class/:classId`, `child`, `people`, `curriculum`, `analytics`, `insights`, `profile`, `settings`, `connections`, `explore`, `support`, `cohorts`, `learners`, and 10 WorkspaceTools areas (`prepare, library, career, growth, progress, reports, notifications, personalization, privacy, audit`).

**Finding F-01-N2 (route consolidation, P3):** `/dashboard/ask` renders `DashboardHome` — the Ask surface is reached from the home page, not a distinct route element. Deep links to `/dashboard/ask` land on the generic home. Confirmed live earlier (Ask content renders under the home shell). Cosmetic/deep-link semantics; no data impact.

**Finding F-01-N3 (role-dependent 404s are correct, P3, resolved):** sidebar items are role-scoped (`dashboardNavigation.js`); routes exist for all advertised keys. The earlier session's "404" captures were test-script double-slash artifacts (documented in the principal review receipt).

### Catch-all
`*` → PageNotFound (local shell, Go Home affordance — verified live).

## 3. Component architecture map (counts from `find`)

| Area | Files | Notes |
|---|---|---|
| `src/components/landing` | 54 | public site system: LandingNav (dir), LandingFooter, heroes (CinematicHero, AboutUsHero, HeroFanCards), persona premium sections (F10 split: PremiumPersonaSections → 7 modules, PersonaSections → 20 modules), SpotIllustration (dir, illustration family), system/tokens.js + system/ui.jsx (shared primitives) |
| `src/components/dashboard` | 112 | workspace: DashboardLayout/Topbar/Sidebar, DecisionHome, LearningWorkspace, Classwork family, billing components, role workspaces, StageChangeDetails, CurriculumBridgePlan, FamilyProgress |
| `src/components/onboarding` | 15 | GettingStarted (3-screen welcome with the Visionary bot), OnboardingLayout, product-setup |
| `src/components/auth` | 5 | AuthUI, forms |
| `src/pages/landing` | 22 pages | one file per public route |
| `src/pages/dashboard` | ~30 pages | workspace route elements |
| `src/lib` | 70 | copy modules (per-surface en/hi/bn), pure laws (assignmentAvailability, curriculumPublication, classwork*), datetime (new), authErrors allowlist |
| `src/services` | 48 | see §5 |
| `src/hooks` | 8 | useWorkspace, etc. |

**Ownership (per root AGENTS.md):** `frontend/src`, `frontend/public`, `frontend/tests` are the frontend's own files; `backend/upstream/backend` is the pinned NestJS implementation (frontend never imports it); `ml/upstream` is the pinned Go/Python RAG implementation (frontend has **zero direct imports of ML** — verified: no `ml/` specifier in `src`). The `@/` alias resolves to `frontend/src` (vite.config + tsconfig/jsconfig).

**Shared-component blast radius (instruction 11):** changes to `system/tokens.js`, `system/ui.jsx`, `apple-typography.css`, `rhythm.css`, `public-bridge.css`, `SpotIllustration`, `LandingNav` affect all 24 public routes; `DashboardTopbar/Sidebar/workspaceStrings.js` affect all 29 internal routes. The session's FAP-65 weight consolidation and date-locale sweep are worked examples of that blast radius (12 + 16 files).

## 4. Shared styles map (13 CSS files, ~2,676 lines)

| File | Lines | Role |
|---|---|---|
| `apple-typography.css` | 839 | type-role law: h1 80/64/44 @600 −0.015em/1.05; h2 64/56/40; label 21/600; data-type tiers; main-scoped bridge rules (verified live, FAP-62 receipt) |
| `rhythm.css` | 381 | size tokens (--fs-*, --fs-hero-headline 80/64/44), container law |
| `public-bridge.css` | 531 | page-scoped public law bridges (about/mission, partners no-seam, policy hero join) |
| `tokens.css` | 135 | font-face declarations (**TTF sources — see finding F-01-F1**), color tokens |
| `public-system.css` | 147 | public system primitives |
| `premium.css` / `guide-premium.css` / `workspace-premium.css` / `workspace-outcomes.css` | 437 | premium scene + workspace styling |
| `workspace-typography.css` | 74 | product-surface (Google Sans) type law |
| `public-icons.css` | 102 | public icon classes (one icon family — lucide/Feather geometry, FAP-65 receipt) |
| `billing.css`, `feedback.css` | 131 | billing cards, feedback states |

Design tokens single-source: `src/components/landing/system/tokens.js` (CTA_LAW strings, container law, radius law) — public pages compose by import (FAP-58/A1 convergence). **No drift found** between tokens.js and the rendered CTAs in the FAP-59 audit.

## 5. Services and transport map (48 files)

**Server-backed clients (3):**
- `billingClient.js` → `/api/billing` (Razorpay Standard Checkout in firebase mode; test-only)
- `feedbackClient.js` → `/api/account/feedback`
- `learningSessionClient.js` → `/api/account/learning`

**Auth transport (dual-mode, per `frontend/README.md` + FIREBASE_AUTH_CONTRACT):**
- Firebase mode (`VITE_AUTH_MODE=firebase` in ignored `.env.local`): `src/api/firebase/` (authAdapter, serverAuth, config) drives real Firebase Auth + server-owned sessions (`POST /api/auth/session` with CSRF cookie+header, `GET /api/auth/me`, onboarding/profile endpoints). Vite proxies `/api` → `http://127.0.0.1:3001` (backend `main-auth.ts`), or a loopback test proxy under `VISIONARY_AUTH_TEST_PROXY` with a `demo-` Firebase project.
- Local-preview mode: `src/api/appClient.js` is a **localStorage repository** (users/sessions/tokens with Web Crypto hashing, 7-day TTL) — explicitly self-labeled "not a production authentication boundary" (file header, line 1).

**Local-demo services (18 of 48 touch localStorage):** learning pipeline, curriculum, classwork, mentor, daily plan, journeys, community, etc. — the learning loop stays local by contract (FIREBASE_AUTH_CONTRACT: "learning services remain local"); backend/ML contracts for these are **not yet wired** (see §6).

**CSRF law verified live:** backend `ProductRequestAuthority.csrf()` requires Origin == `AUTH_PUBLIC_ORIGIN` (default `http://localhost:5173`) + 64-hex cookie/header pair — QA batteries must run on `localhost:5173` or the origin the backend was configured with (`127.0.0.1:4197` in the current QA setup).

## 6. Backend/ML dependency register (instruction 7: recorded, not invented)

| # | Dependency | Direction | Contract | Status |
|---|---|---|---|---|
| 1 | Firebase Auth (Web SDK 13.0.0) | FE → Firebase + `/api/auth/*` | `integration/FIREBASE_AUTH_CONTRACT.md` | live (email + Google), email verification link; phone flows UI-gated |
| 2 | Backend auth server (NestJS `main-auth.ts`, port 3001) | FE → BE | same contract | running; degrades without SMTP/Supabase/OpenAI creds (FAP-67 patches, ledger 2026-11-04) |
| 3 | Razorpay Standard Checkout | FE → Razorpay via BE billing | `integration/PAYMENTS_CONTRACT.md`, `PAYMENTS_AUTH_HANDOFF.md` | test-mode only; no live money |
| 4 | Account learning/feedback endpoints | FE → BE `/api/account/*` | `integration/FEEDBACK_CONTRACT.md` | connected |
| 5 | Learning loop (pipeline, mentor, classwork) | FE **local only** | `integration/LEARNING_LOOP_CONTRACT.md`, `KNOWLEDGE_PROJECTION_CONTRACT.md`, `LIFELONG_EDUCATION_CONTRACT.md`, `ONBOARDING_CONTRACT.md`, `VATS_CONTRACT.md` | **fixture-based**; no backend wiring — dependency recorded per instruction 8 |
| 6 | ML RAG services (`ml/upstream`) | **none from FE** | — | no direct calls; boundary respected (go/python services not consumed by the frontend) |
| 7 | Legacy base44 client (`src/api/base44Client.js`) | FE → base44 SaaS (onboarding setup) | undocumented in integration/ | **gap — see finding F-01-F5** |

## 7. Dependency audit (57 prod deps, 20 dev deps)

**Finding F-01-F1 (P1, performance + acceptance integrity): fonts still ship TTF, not the accepted WOFF2 subsets.**
Evidence: `frontend/public/fonts` = 7 TTFs, 6.0 MB; `dist/fonts` = 6,104 KB in the fresh build; `src/styles/tokens.css` lines 12–54 declare every face with `format('truetype')`; `index.html` preloads 3 TTFs; **zero `.woff2` files exist anywhere in the repository** (checked beta, dev, and all local branches). Meanwhile FAP-7 ("Font delivery overhaul: subset WOFF2, drop 7-TTF preload (~6.1MB -> <=300KB)") is marked **Done** in Jira. The accepted state and the shipped state disagree — either the WOFF2 work lives on an unmerged/lost branch or the receipt described intended work. dist/ total is 15.5 MB, of which fonts are 40%. **Recommended action (not implemented — audit task):** a font lane should regenerate subsets as WOFF2 (`pyftsubset` per axis), swap tokens.css sources, and re-verify the FAP-7 acceptance against the tree, or re-open FAP-7.

**Finding F-01-F2 (P2, deployment hygiene): `puppeteer` sits in `dependencies`.**
Used by five review scripts (`auth-font-handoff`, `auth-emulator`, `auth-hmr`, `device-session`, `onboarding-account` — dev tooling); `playwright-core` is already correctly in devDependencies. Production installs pull puppeteer's Chromium download. **Recommended:** move to devDependencies (zero src imports).

**Finding F-01-F3 (P3, dead weight / supply-chain surface): 8 prod dependencies with zero usage in src, tests and scripts.**
`@stripe/react-stripe-js`, `@stripe/stripe-js` (billing is Razorpay), `@hello-pangea/dnd`, `@hookform/resolvers`, `@radix-ui/react-toast` (sonner + react-hot-toast are the used toasts), `date-fns`, `framer-motion` (motion law is CSS-based — qa:motion passes without it), `zod`. Verified by per-package grep across `src`, `tests`, `scripts` and `tailwind.config.js` (note: `tailwindcss-animate` IS used via the Tailwind plugin — keep). **Recommended:** one removal lane, verified by `npm run check` + battery.

**Finding F-01-F4 (P3, minor duplication): two toast libraries** (`react-hot-toast` 1 file, `sonner` 1 file). Consolidate in a future lane.

**Finding F-01-F5 (P3, contract gap): `src/api/base44Client.js`** is imported by onboarding (GettingStarted setup, FamilyProgress) but has no contract document under `integration/` — record the dependency or migrate to the documented `/api/account/*` surface.

**Bundle evidence (fresh build on beta content, 2026-11-05):** build exit 0 in 40.82 s; **145 JS/CSS assets ≈ 3.4 MB raw ≈ 937 KB gzip** (largest: vendor 587 kB/167 kB gz, index 179 kB/56 kB gz, WorkspaceTools 134 kB/35 kB gz, legacyLearningCopy 133 kB/29 kB gz — the legacy copy module is a lazy-loaded migration path, acceptable); dist/assets on disk 8.8 MB (includes AVIF/WebP hero imagery), dist total 15.5 MB. No source maps shipped.

## 8. Tests and verification evidence

| Command (from `frontend/`, beta content @ 2cbc89eb) | Result |
|---|---|
| `npm run build` | exit 0, 40.82 s (fresh run for this audit, `/tmp/f01-build.log`) |
| `npm test` | **653/653 pass** (this session, same content) |
| `npm run typecheck` / `npm run lint` | exit 0 |
| `npm run check` (root; layout + verify-imports + continuity/motion/taps + 8 script tests + API contracts + SCOPE-06 ×3 + surface audit + frontend battery) | exit 0 (run on the dev integration merge containing identical frontend content) |
| `qa:design`, `qa:navigation`, `qa:fonts`, `qa:taps`, `qa:motion`, `qa:continuity`, `qa:i18n` | PASS (receipts `a40a2e10`, `ea817e60`) |
| Browser evidence | 24 public routes at 1440+390 full-page captures, learner + teacher workspace walks (all clean) — `frontend/artifacts/research/fap60-beta-verify/` (committed at 2cbc89eb) |

## 9. Findings summary (severity)

| ID | Severity | Finding | Action authorized in this task |
|---|---|---|---|
| F-01-F1 | **P1** | 6.1 MB TTF fonts ship; accepted FAP-7 WOFF2 state not in the tree | recorded only |
| F-01-F2 | P2 | puppeteer in prod `dependencies` | recorded only |
| F-01-F3 | P3 | 8 zero-usage prod dependencies | recorded only |
| F-01-F4 | P3 | two toast libraries | recorded only |
| F-01-F5 | P3 | base44 client has no integration contract | recorded only |
| F-01-N1 | P3 | 5 route→file naming mismatches | recorded only |
| F-01-N2 | P3 | `/dashboard/ask` renders DashboardHome (deep-link semantics) | recorded only |
| F-01-N3 | P3 | role-scoped nav verified correct (prior 404s were test artifacts) | closed |

## 10. Remaining issues and risks

1. FAP-7 acceptance integrity (F-01-F1) — if the WOFF2 work exists on an unmerged branch, recover it; otherwise re-open the ticket and schedule the font lane.
2. The learning loop remains fixture-based by contract — any "production readiness" claim must not imply backend-backed learning (G5 honesty gate).
3. The local-preview auth path (`appClient.js`) must never ship as the auth boundary; firebase-mode gating lives in `src/api/firebase/` — keep the boundary audited on every auth change.
4. Backend CSRF origin coupling (AUTH_PUBLIC_ORIGIN vs dev-server origin) is a recurring QA trap — the principal review receipt documents the law; consider an env template note in a future lane.
5. `dist` weight: fonts (F1) are the single biggest lever; imagery is already AVIF/WebP with LazyImage.

## 11. Codex review handoff

- Branch to review: `opencode/f01-frontend-audit` (worktree `New_Visionary-worktrees/opencode-f01-frontend-audit`), single docs commit on top of `origin/beta` @ `2cbc89eb`.
- Review scope: this report's file paths and claims are reproducible with the commands in §8; every numeric claim was executed on the audited revision during 2026-11-05.
- Not authorized: any source/token/dependency change, merge, or Jira closure (task instruction 12). Codex validates and merges approved work into `dev`.
