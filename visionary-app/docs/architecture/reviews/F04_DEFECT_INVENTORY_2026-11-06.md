# F-04 — Defect inventory and implementation order (2026-11-06)

Jira key / source ID: F-04 (Visionary Frontend Agent task — defect inventory and implementation order)
Acceptance scope: enabler (audit/classification; findings only, no product implementation)
Implementer: ZCode agent (Quality Lead specialist)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f04-defect-inventory` / beta `893bfae7` (F-03 landing)
Owned files: this receipt only. No source, config, contract or test file changed in this lane.

## Objective and method

Classify verified defects, protect approved designs, define acceptance criteria and create
dependency-ordered tasks. Every entry below was **re-verified against beta `893bfae7` in this run**
with file:line or command evidence — nothing is carried forward on trust, and nothing is invented.
This lane implements nothing (task instruction 9: audit findings without broad implementation).

Verification environment: worktree `New_Visionary-worktrees/zcode-f04-defect-inventory`, product
running on Vite dev `127.0.0.1:4198` in local preview mode during the whole lane.

## A. Verified defect register

Severity key: **P1** = breaks an accepted/shipped claim or blocks verification of shipped scope;
**P2** = real operational/security/hygiene cost; **P3** = tech debt, cosmetic or minor duplication;
**INFO** = recorded observation, no action authorized.

| ID | Sev | Class | Defect (verified this run) | Evidence (beta `893bfae7`) | Source |
| --- | --- | --- | --- | --- | --- |
| D-01 | **P1** | perf / acceptance integrity | Accepted FAP-7 WOFF2 font state is not in the tree: 7 TTFs (6.0 MB) ship, zero `.woff2` exists anywhere, every face declared `format('truetype')`, 4 TTF font preloads in `index.html` | `frontend/public/fonts/` (6.0 MB); `find … -name '*.woff2'` → 0; `frontend/src/styles/tokens.css` 12 × `truetype`; `frontend/index.html:33-36` | F-01-F1 |
| D-02 | **P1** | verification environment | Four QA batteries (`qa:design`, `qa:navigation`, `qa:fonts`, `qa:i18n`) cannot run without a service bring-up (app + auth API 3001 + emulator) and the real-UI QA login that failed in F-02; no documented bring-up exists. `qa:i18n` additionally defaults to `127.0.0.1:5179` (its own port), so even a running app on another port refuses (`ERR_CONNECTION_REFUSED` observed this run) | F-02-F1 receipt; this run: `npm run qa:i18n` → `ERR_CONNECTION_REFUSED at http://127.0.0.1:5179/login` via `scripts/qa-session.mjs:16` | F-02-F1/F-02-F2 |
| D-03 | P2 | deployment hygiene | `puppeteer` ^25.12.0 sits in prod `dependencies`; used only by five review scripts (0 `src/` imports). Production installs pull its Chromium download | `package.json` dependencies; `grep puppeteer src/` → 0 | F-01-F2 |
| D-04 | P2 | supply-chain | Lockfile audit: **17 advisories (12 high, 5 moderate)**. Direct: `firebase` 13.0.0 (high; "fix via firebase@9.14.0" is a bogus downgrade — needs upstream review, not auto-fix), `puppeteer` 25.12.0 (fixable bump; its transitive `chromium-bidi` also high), `vite` ≤6.4.3 (fixable bump), `zod` <4.6.6 (advisory disappears entirely if the zero-usage dep is removed) | `npm audit --package-lock-only` this run (full list captured in the run log) | new this lane |
| D-05 | P3 | dead weight | **9** zero-usage prod dependencies (was 8 in F-01; `react-hot-toast` verified as a ninth — its only "usage" is a comment in the vendored `use-toast.jsx`): `@stripe/react-stripe-js`, `@stripe/stripe-js`, `@hello-pangea/dnd`, `@hookform/resolvers`, `@radix-ui/react-toast`, `date-fns`, `framer-motion`, `zod`, `react-hot-toast` | per-package grep across `src/ tests/ scripts/ tailwind.config.js` → 0 files each, this run | F-01-F3 + new |
| D-06 | P3 | duplication | Two toast UI modules serve different surfaces: `src/components/ui/sooner.jsx` (sonner; consumed by `pages/Register.jsx`) and `src/components/ui/use-toast.jsx`+`toaster.jsx` (vendored radix-style store; consumed by `DashboardTopbar.jsx` and Register) | imports verified this run | F-01-F4 |
| D-07 | P3 | contract gap | `src/api/base44Client.js` has no integration contract under `integration/` and is imported by **30 source files** (wider than the F-01 note's "onboarding only": EmailVerification, DailyBriefing, FamilyProgress, MarketTrends, CourseIntro, QuestionBar, …) | `grep -rln base44Client src/` → 30; `ls integration/` → no base44 doc | F-01-F5 + widened |
| D-08 | P3 | naming drift | Five route paths render differently-named page files (`/help`→SchoolPage, `/professional`→CollegePage, `/how-it-works`→CoachingPage, `/pricing`→AILearningPage, per F-01's verified map) — content-correct, mapping non-obvious | F-01 audit §route map; unchanged since (no renames landed) | F-01-N1 |
| D-09 | P3 | deep-link semantics | `/dashboard/ask` renders `DashboardHome` — Ask is reached from home, not a distinct route element; deep links land on the generic home shell | `frontend/src/App.jsx:201` `<Route path="ask" element={<DashboardHome />} />` | F-01-N2 |
| D-10 | P3 | dev-console hygiene | React logs an error-level `fetchPriority` prop warning in dev for the landing hero images | `frontend/src/components/landing/NewPersona.jsx:380` and `:440` `fetchPriority="high"` | F-02-F3 |
| D-11 | INFO | observation | Vite dev first-load dependency optimizer can serve a sparse "Loading…" shell to a fresh context (harness-level; F-03 harness now waits for rendered content) | F-03-F2 receipt | F-03 |
| D-12 | INFO | observation | Tablet (768px) uses the compact navigation (hamburger + icon rail); renders cleanly on all captured dashboards — baselined, not a defect | F-03-F4 receipt + 192-capture evidence | F-03 |
| D-13 | INFO | honest states | 59 control declarations in `missing` state and 152 `intentionally-unreleased` in the surface inventory are the product's known-disconnected/boundary surfaces — a dependency register, not defects | `docs/architecture/tracking/product-surface.json` counts (this run) | register |

## B. Design protection constraints (must not regress while fixing anything above)

These are accepted, reviewed states. Any implementation task touching them re-runs the corresponding
law battery and the F-03 visual baseline for before/after evidence:

1. **Design tokens** (`frontend/src/styles/tokens.css` color/type scales) and the FAP-59/60/62/65/67
   public design convergence (CTA law, space rhythm, Apple-privacy heroes, type-role law, icon
   family, India-first dates).
2. **Voice→type ladder** (`docs/visionary/design/VOICE_TYPE_LADDER_2026-10-21.md`; enforced by the
   landing ESLint rule).
3. **Motion law** (CSS-based; `qa:motion`), **tap law** (≥44px hit areas; `qa:taps`), **continuity
   laws** (`qa:continuity`).
4. **Honest-state patterns** ("Saved on this device", "Local preview: …", not_connected placeholders)
   — the D-13 register is a feature, never to be "fixed" by inventing backend behavior.
5. **Dual-mode transport** (firebase server sessions vs localStorage preview repository) and the CSRF
   origin law in the auth boundary.
6. The five-role journey structure and dashboardNavigation allowlist.

## C. Acceptance criteria per actionable defect

| ID | Done when (measurable) |
| --- | --- |
| D-01 | `find` for `*.woff2` under the product returns the subset set; `tokens.css` declares `format('woff2')` sources; `index.html` preloads ≤4 woff2 subsets; fresh `dist/` fonts ≤ 300 KB total (FAP-7's accepted target); FAP-7 receipt re-verified **against the tree**; F-03 baseline re-captured with no visual regression |
| D-02 | A single documented bring-up sequence (services → warm app route → login) exists under `docs/architecture/` and is proven by running all four login-dependent batteries green end-to-end in one session; every battery accepts the app base URL via env (no hardcoded personal port) |
| D-03 | `puppeteer` in `devDependencies`; prod `npm ci --omit=dev` pulls no Chromium; full battery green |
| D-04 | Advisory count re-run: direct-dep highs resolved or explicitly accepted with rationale in the receipt (`zod` advisory gone via D-05 removal; `puppeteer`/`vite` bumped; `firebase` 13.0.0 either upgraded after upstream review or accepted in writing with the bogus-downgrade note) |
| D-05 | The 9 packages absent from `package.json` dependencies; `npm run check` + full battery green (proves zero hidden usage) |
| D-06 | One toast implementation serves all toast call-sites; the other module + package removed; battery green |
| D-07 | A contract document exists under `integration/` for the base44 client boundary (or the 30 call-sites migrate to the documented `/api/account/*` surface — separate decision); until then the gap is visible in `CONTRACT_GAPS.md` |
| D-08 | Renamed files or alias comments land with zero behavior change (route map diff-limited to renames); all batteries green |
| D-09 | `/dashboard/ask` either renders a distinct Ask surface or documents the alias decision; deep-link behavior recorded in the route map |
| D-10 | No `fetchPriority` warning in a dev-run console capture of the landing page |

## D. Dependency-ordered implementation plan

Ordering rationale: **T0 unblocks verified verification** of everything else; T1 is the biggest
user-facing lever and is independent; T2 reduces supply-chain surface and is safest early; T3+ are
small local lanes. Nothing below changes approved design (constraints B apply to all).

| Order | Task | Covers | Depends on | Key risk / note |
| --- | --- | --- | --- | --- |
| **T0** | QA service bring-up runbook + env-parametrized battery URLs; prove once by running all four login-dependent batteries green in one session | D-02 | — | Requires the QA account/login fix from F-02-F1 investigation; batteries must stop assuming port 5179/4197 |
| **T1** | Font lane: regenerate WOFF2 subsets, swap `tokens.css` + preloads, re-verify FAP-7 against the tree, re-capture F-03 baseline before/after | D-01 | — (baseline evidence already exists) | Largest perf lever (fonts = 40% of dist); visual regression gate mandatory |
| **T2** | Dependency hygiene: remove the 9 zero-usage deps; move `puppeteer` to devDependencies; bump `puppeteer`/`vite`; `firebase` advisory reviewed separately (no bogus downgrade) | D-03, D-05, D-04 | — | `npm run check` + battery proves zero hidden usage; `firebase` change is explicitly out of the mechanical lane |
| **T3** | Toast consolidation onto one implementation | D-06 | T2 (removes a package cleanly) | Touches Register + DashboardTopbar surfaces; battery + one manual toast check |
| **T4** | base44 contract document (or migration decision recorded) | D-07 | — | Documentation lane; migration is a separate authorized task |
| **T5** | Route/file naming alignment + `/dashboard/ask` deep-link decision | D-08, D-09 | — | Rename-only, zero behavior change for D-08; D-09 needs a small product decision recorded first |
| **T6** | `fetchPriority` dev-warning fix | D-10 | — | Trivial; verify via dev console capture of the landing |

T1 and T2 may run in parallel after T0; T3–T6 are independent small lanes. Backend/ML dependencies:
none for T0–T3, T5, T6; T4's migration option would need the `/api/account/*` contract (backend
authority) — document-first avoids inventing endpoints (task instruction 7).

## E. Verification results (this run, beta `893bfae7` content)

| Check | Result |
| --- | --- |
| Worktree checkout of beta + junction to the verified 748-package lockfile install | OK; product served on `127.0.0.1:4198` (HTTP 200) during the lane |
| Re-verification greps for D-01…D-10 | All confirmed at the cited paths (evidence column above) |
| `npm audit --package-lock-only` | 17 advisories (12 high, 5 moderate) — captured as D-04 |
| `npm run qa:i18n` | **NOT RUN (environment)** — `ERR_CONNECTION_REFUSED at 127.0.0.1:5179` + F-02-F1 login dependency; recorded, not hidden |
| `npm test` | **PASS — 653/653, 0 fail** |
| `npm run lint` / `npm run typecheck` | **PASS** (exit 0 both) |
| `npm run build` | **PASS — exit 0, built in 19.18 s** |
| `npm run qa:taps` / `qa:motion` / `qa:continuity` | **ALL PASS** — tap law holds (243 controls / 126 files; 3 recorded exceptions); motion law holds (439 files); all recorded public-surface laws pass |
| `npm run check` (product root) | **PASS** (exit 0; 3842 imported files match baseline + 4 recorded patches; script tests 54/54; frontend suite re-run 653/653) |

## F. Backend / ML dependencies

None used and none invented. D-04's `firebase` advisory resolution may need upstream coordination;
D-07's migration option references the backend-owned `/api/account/*` contract only as a recorded
dependency.

## G. Remaining issues and risks

- The four login-dependent QA batteries remain unverifiable in this environment until T0 lands.
- `firebase` 13.0.0 is deliberately pinned; its high advisory must not be "fixed" by the audit-suggested
  downgrade — an upstream review lane owns it.
- The 18 MB baseline evidence and future before/after captures grow the repo per the established PNG
  convention.

## H. Worktree and change summary

`New_Visionary-worktrees/zcode-f04-defect-inventory` on `zcode/f04-defect-inventory` = beta
`893bfae7` + this receipt. Docs-only lane; no source diff. Junction-based node_modules runtime
arrangement as in F-03 (nothing committed). Worktree removed after the beta landing per the
operator's standing instruction; branch retained pushed for review.

## I. Review handoff

```
Jira key / source ID: F-04
Acceptance scope: enabler (defect inventory, acceptance criteria, ordered tasks)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f04-defect-inventory / 893bfae7 / <receipt commit>
Owned files: docs/architecture/reviews/F04_DEFECT_INVENTORY_2026-11-06.md only
Verification: all register entries re-verified at cited paths on beta 893bfae7; npm audit 17 advisories captured; qa:i18n blocked evidence recorded
Defects register: D-01..D-13 (2×P1, 3×P2, 5×P3, 3×INFO); plan T0..T6 dependency-ordered
Reviewer decision: pending
Dev integration commit: pending
Next dependent task: T0/T1/T2 per the order above, assigned by operator
```
