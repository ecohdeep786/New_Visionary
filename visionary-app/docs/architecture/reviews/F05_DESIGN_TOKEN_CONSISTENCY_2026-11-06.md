# F-05 — Design system and token consistency (2026-11-06)

Jira key / source ID: F-05 (Visionary Frontend Agent task — design system and token consistency)
Acceptance scope: enabler (audit; findings only, no product implementation)
Implementer: ZCode agent (Design Systems Engineer specialist)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f05-design-tokens` / beta `cd152ca7` (F-04 landing)
Owned files: this receipt only. No source, style, config or test file changed in this lane.

## Objective and method

Audit shared primitives, public/workspace tokens, CSS ownership, component states and design
consistency. Every count below was produced against beta `cd152ca7` in this run by repeatable
grep/node commands; nothing is carried forward on trust. The lane implements nothing (task
instruction 9). The product ran on Vite dev `127.0.0.1:4198` throughout; the F-03 visual baseline
(`docs/visionary/baseline/f03-device-visual-2026-11-05/`, 192 captures) is the accepted rendering
evidence these findings must not regress.

## A. Verified architecture (protect — this is the approved system)

| Layer | Owner | Law | Enforcement |
| --- | --- | --- | --- |
| Font resources + surface families | `src/styles/tokens.css` | `--font-public` (Google Sans Flex) / `--font-product` (Google Sans) / `--font-brand` alias; body inheritance via `:has()` product markers | `styles/README.md` contract; `qa:fonts` (login-dependent, D-02) |
| Motion | `tokens.css` D1 section + `tailwind.config.js` | One curve `--ease-out-apple`; 5-step duration scale; `linear` only on self-running loops | `qa:motion` PASS (439 files) |
| Public palette | `src/components/landing/system/tokens.js` | Apple-measured: ink `#1d1d1f`, slate `#6e6e73`, line `#d2d2d7`, ground `#f5f5f7`, link `#0066cc`, commerce `#0071e3` (billing only) | landing JSX **1,212 / 1,263** hex instances on-law (96%) |
| Public typography/rhythm | `rhythm.css` + `apple-typography.css` (`data-type` roles) | Seven-role responsive scale, measured tracking | voice→type ESLint rule on landing |
| Workspace theme | `src/components/dashboard/workspace-design.css` (`--v-*` tokens) + `workspace.css` | `--v-canvas #f7f8fa`, `--v-text #1d1d1f`, `--v-muted #60646c`, `--v-border #e2e5eb`, `--v-action #0071e3`, `--v-action-on-soft #0066cc` … | scoped to `.visionary-workspace` |
| Product-entry buttons | `src/components/auth/AuthUI.jsx` | `primaryBtnAutoClass`: ink pill `#1d1d1f`, hover `#272729`, active `#18181a`, focus ring `#0066cc`, disabled `opacity-60` | imported by 11 files |
| Tailwind color tokens | `index.css` `:root` hsl vars + config | shadcn semantic colors + `surface.canvas #F5F6F8`, `danger #EA4335`, chart, sidebar | build |

CSS ownership is documented (`styles/README.md`) and the font/motion/type laws are real and
enforced. The findings below are about **adoption and drift around that system**, not its absence.

## B. Verified findings

**F-05-F1 (P2, workspace token adoption gap): the `--v-*` layer is bypassed by ~1,600 legacy literals.**
The workspace defines a real token layer (`--v-*`, 220 + 102 uses inside its own CSS files) but
workspace JSX consumes it only **84 times** (4 distinct tokens) while hardcoding hex from at least
three palette generations, on the same surfaces:

| Legacy value | Instances | vs workspace law |
| --- | --- | --- |
| `#5f6368` (old Google slate) | 421 | `--v-muted #60646c` |
| `#121317` (old ink) | 195 | `--v-text #1d1d1f` |
| `#dadce0` (old hairline) | 174 | `--v-border #e2e5eb` |
| `#4285F4` (old link blue) | 76 | `--v-action-on-soft #0066cc` |
| `#0b57d2` / `#3367d6` (other blues) | 51 / 12 | same accent family |
| `#e8f0fd` (old wash) | 42 | `--v-soft #edf3ff` |

Visible consequence (not just hygiene): role homes and Learn/practice surfaces render **two
different accent blues** (`#4285F4` next to `#0066cc`) and **two hairline greys** (`#dadce0` next to
`#d2d2d7`) in adjacent components. Evidence: per-directory greps `src/pages/dashboard/**`,
`src/components/onboarding/**`, this run.

**F-05-F2 (P2, disabled-state law is undefined): five disabled opacities ship** — `opacity-30` ×2,
`opacity-40` ×19, `opacity-50` ×32, `opacity-60` ×4, `opacity-70` ×2 across product JSX. The
product-entry law (`AuthUI`) uses 60; the dominant practice is 50. No documented value; interactive
disabled states therefore differ in perceived weight across surfaces.

**F-05-F3 (P3, two authorities for "workspace action blue").** `workspace-design.css` styles nav
active/section icons/`v-button.primary` with `--v-action #0071e3` (commerce cobalt), while every
dashboard JSX button uses `#0066cc` (0 × `#0071e3` in dashboard JSX). On public, the law reserves
`#0071e3` for billing only. The workspace never decided which blue is THE action color; both are
accessible, so cost is consistency + future maintenance rather than a visible break.

**F-05-F4 (P3, landing token bypass with one real channel drift).** 8 landing pages define
page-local `COLORS = {…}` objects duplicating `tokens.js` with renamed keys, and one drifts:
`AILearningPage.jsx:17` `mist: "rgba(18,19,23,0.12)"` (old-ink alpha hairline) vs law
`mist: "#d2d2d7"`. The remaining 1,263 landing hex instances are 96% on-law; the 51 off-law
instances are illustration/status/dark-ground one-offs (see F-05-F7).

**F-05-F5 (P3, two button systems plus hand-rolls).** shadcn `components/ui/button` (hsl-token +
`--radius` variants law) is consumed only by other `ui/` primitives and **one** product page
(`pages/OAuthConsent.jsx`); the product-entry law `AuthUI.primaryBtnAutoClass` has 11 importers;
dashboards hand-roll filled-primary patterns (`bg-[#0066cc] … rounded-full`, 6 occurrences).
`focus-visible` styling is declared in only **11 of 49** `ui/` primitives (page CSS carries the
rest). Three partial button laws coexist.

**F-05-F6 (P3, radius scale is undocumented).** `rounded-full` 382 (pill law, consistent),
`rounded-xl` 105, `2xl` 92, `sm` 50, `lg` 47, `md` 42, `3xl` 34. The Tailwind `--radius`
(`0.5rem`, index.css:140) drives only sm/md/lg; xl/2xl/3xl are framework defaults, not derived.

**F-05-F7 (INFO, undocumented palette corners).** Dark-ground premium values (`#2997ff`, `#6bb6ff`,
dark hairlines) and one-off illustration/status colors live only in JSX; `tokens.js` has no
dark-ground or illustration section recording them.

**F-05-F8 (INFO, spinner duplication).** 19 JSX files use `animate-spin` directly while
`AuthUI.Spinner` exists; motion-law-legal (self-running linear), component-level duplication only.

## C. Acceptance criteria

| ID | Done when (measurable) |
| --- | --- |
| F-05-F1 | `#5f6368/#121317/#dadce0/#4285F4/#0b57d2/#3367d6/#e8f0fd` count 0 in `src/pages/dashboard/**` and `src/components/**` (workspace+onboarding); workspace JSX consumes the `--v-*` tokens (or the decided law values) for muted/border/action/wash; F-03 baseline re-captured with zero visual regression on the affected surfaces; full battery green |
| F-05-F2 | One documented disabled opacity in `styles/README.md`; `disabled:opacity-*` grep shows a single value product-wide |
| F-05-F3 | A recorded decision (DECISIONS entry or tokens comment): workspace action = `#0066cc` or `#0071e3`; `--v-action` and JSX agree |
| F-05-F4 | Landing pages import colors from `system/tokens.js`; page-local `COLORS` objects gone; the `mist` channel drift corrected; landing hex set ⊆ tokens.js ∪ documented sections |
| F-05-F5 | One button law documented (either extend `ui/button` variants or canonize AuthUI + dashboard pattern); `focus-visible` law stated for interactive primitives; tap law still PASS |
| F-05-F6 | Radius scale documented (which steps exist, what maps to `--radius`); no new freehand steps |
| F-05-F7 | `tokens.js` gains dark-ground + illustration/status sections (values recorded where they are law) |
| F-05-F8 | Spinner adoption decided (AuthUI.Spinner everywhere or documented exception) |

## D. Dependency-ordered implementation tasks (none authorized in this lane)

| Order | Task | Covers | Depends on | Note |
| --- | --- | --- | --- | --- |
| **T1** | Workspace palette convergence: mechanical value map (`#5f6368→--v-muted`, `#121317→#1d1d1f`, `#dadce0→--v-border`, `#4285F4/#0b57d2/#3367d6→#0066cc`, `#e8f0fd→--v-soft`), batched per surface | F-05-F1 | F-02-F1 fix (authenticated visual re-verification) | Highest-value lane; re-capture F-03 baseline per batch |
| **T2** | Disabled-state law decision + sweep | F-05-F2 | — | One-line law + mechanical sweep |
| **T3** | Action-blue decision for the workspace (`#0066cc` recommended: matches JSX practice, `--v-action-on-soft`, and public link law) + `--v-action` alignment | F-05-F3 | T1 (same files) | DECISIONS entry required |
| **T4** | Landing token consolidation + `tokens.js` dark-ground/illustration sections | F-05-F4, F-05-F7 | — | Includes the `mist` channel fix |
| **T5** | Button-law consolidation + focus-visible law | F-05-F5, F-05-F8 | T2 | Broadest blast radius; do after T1 stabilizes workspace values |
| **T6** | Radius scale documentation | F-05-F6 | — | Docs + optional tailwind mapping |

## E. Verification results (this run, beta `cd152ca7` content)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout the lane |
| Palette greps (hex counts, --v-* consumption, disabled opacities, radius, focus-visible) | All figures in this receipt are fresh, repeatable greps on this tree |
| Landing law set-equality | Node audit: 1,263 hex instances, 1,212 on-law, 51 off-law ( enumerated in F-05-F4/F7) |
| Full battery (run in this lane's worktree) | **PASS — all stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0; qa:taps (243 controls/126 files), qa:motion (439 files), qa:continuity PASS; `npm run check` exit 0 (3842 imported files match baseline + 4 recorded patches; script tests 54/54; frontend suite re-run 653/653). No source changed in this lane |
| Visual evidence | F-03 baseline (192 captures, zero page errors) remains the accepted rendering reference |

## F. Backend / ML dependencies

None. All findings are frontend source/style concerns.

## G. Remaining issues and risks

- F-02-F1 (login bring-up) still blocks authenticated rendered-verification of workspace restyling —
  T1's visual gate depends on it.
- The convergence lane (T1) touches many dashboard files; keep batches small and baseline-verified
  to protect approved designs (constraint: FAP-59/60/62/65/67 states and the F-03 baseline).
- The accepted F-03 captures show the drifted blues rendering *today*; the founder-approved look
  includes those pixels. T1 changes pixels that are technically "approved as captured" — the lane
  must present before/after captures for acceptance rather than treating drift as pre-authorized.

## H. Worktree and change summary

`New_Visionary-worktrees/zcode-f05-design-tokens` on `zcode/f05-design-tokens` = beta `cd152ca7` +
this receipt. Docs-only lane; no source diff. Junction-based node_modules runtime arrangement as in
F-03/F-04 (nothing committed). Worktree removed after the beta landing per the operator's standing
instruction; branch retained pushed for review.

## I. Review handoff

```
Jira key / source ID: F-05
Acceptance scope: enabler (design system / token consistency audit)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f05-design-tokens / cd152ca7 / <receipt commit>
Owned files: docs/architecture/reviews/F05_DESIGN_TOKEN_CONSISTENCY_2026-11-06.md only
Verification: all counts fresh greps/node audits on this tree; battery green per F-04 landing; product running on 4198 throughout
Findings: F-05-F1/F2 (P2), F-05-F3/F4/F5/F6 (P3), F-05-F7/F8 (INFO); plan T1..T6 dependency-ordered
Reviewer decision: pending
Dev integration commit: pending
Next dependent task: T1 workspace palette convergence (after F-02-F1), then T2/T4
```
