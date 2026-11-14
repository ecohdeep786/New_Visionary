# F-07 — Iconography standardization (2026-11-06)

Jira key / source ID: F-07 (Visionary Frontend Agent task — iconography standardization)
Acceptance scope: enabler (audit/verification; findings only, no product changes)
Implementer: ZCode agent (Iconography Engineer specialist)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f07-iconography` / beta `65f47cc4` (F-06 landing)
Owned files: `frontend/scripts/iconography-verification.mjs` (new reusable harness), evidence
directory, this receipt. No source style/product file changed.

## Objective and method

Audit all icons, optical sizing, stroke weights, accessible labels and consistent use of the
Visionary logo. Two evidence streams against beta `65f47cc4`, both produced this run:

1. **Static inventory** — lucide-react adoption, explicit `strokeWidth`/`size` props, custom inline
   SVGs, the recorded laws (`public-icons.css` tokens + landing spec "24px / stroke 1.75 /
   tokenized sizes"; `workspace-design.css` 1.75 for governed svgs), logo sources, favicon set.
2. **Live rendered verification** — new harness `frontend/scripts/iconography-verification.mjs`
   drives the product on Vite dev `127.0.0.1:4198` (preview mode): public landing at 1440/390 and a
   real register → onboarding → workspace journey. It scans every rendered svg's computed
   stroke-width, finds icon-only controls without accessible names, and measures the rendered logo.
   Evidence + receipt: `docs/visionary/baseline/f07-iconography-2026-11-06/`.

## A. Verified-correct (protect)

| Area | Verified evidence |
| --- | --- |
| Accessible labels | **Zero** icon-only controls without accessible names — live scan across landing (desktop + mobile) and dashboard; decorative icons carry `aria-hidden` (54 instances); icon-bearing controls carry text or `aria-label` |
| Logo consistency | **One source**: `components/VisionaryLogo.jsx` (`role="img"`, `aria-label="Visionary"`, surface-aware wordmark via `var(--font-brand)`, exact brand V path) consumed by LandingNav, DashboardTopbar (`aria-label="visionaryHome"` brand link), AuthLayout (sign-in/register/auth pages), OnboardingLayout, BillingInvoice; computed rendered size identical across surfaces (**28px** height / 109.19px width on public nav and workspace topbar alike) |
| Footer brand | Giant "Visionary" wordmark is a documented typographic close, not a second logo ("page ends in air, not a logo", LandingFooter.jsx:89) — deliberate, consistent with the brand spec |
| Favicon | `index.html:9-11` — SVG + PNG + apple-touch-icon, complete set |
| Public icon law | `public-icons.css` tokenizes sizes by role (`--icon-meta 0.875rem / small 1.0625 / medium 1.25 / feature 1.5 / large 2.5`), stroke law (`--icon-stroke 1.75`, controls 2, plus 3), 0.3em link gap, class→role size mapping — measured against Apple references, heroes deliberately excluded |
| Library discipline | lucide-react is the single pictogram library (159 files); the 24 custom inline-SVG files are the illustration/diagram system (SpotIllustration family, IntelligenceArt, data representations, GuideMark, GoogleIcon) — by-design content art that the icon law explicitly excludes; no emoji in workspace UI |
| Live stroke rendering (public) | Landing lucide icons compute **17 × 1.75px** (law), 6 × 2px (control law), 1 × 1.8px |

## B. Verified findings

**F-07-F1 (P3, stroke precision: the 1.75 law is selector-governed, JSX ships 1.8).** The recorded
law is 1.75 (`public-icons.css:15`; `workspace-design.css:80,168` — the latter governs only
`.v-button svg, .v-page svg.lucide, .workspace-topbar svg.lucide`). JSX hardcodes
`strokeWidth={1.8}` in **89 instances across 26 files** plus eight other explicit values
(1.4/1.5/1.55/1.6/2/2.4/2.5/3 — 2 and 3 are lawful control/plus strokes). Rendered result depends
on selector coverage: the dashboard home shows **12 ungoverned icons computing 1.8px next to 7
governed icons at 1.75px on the same page**; the landing shows only 1 ungoverned. The 3% delta is
sub-perceptual at 16–24px, so the cost is precision and attribute honesty, not a visible break.
Evidence: receipt `workspace-stroke-distribution {1.75x7, 1.8x12, 2x4}` + grep counts.

**F-07-F2 (P3, workspace optical-size scale is undocumented).** Explicit icon `size` props use
**12 distinct values** (14/15/16/17/18/20/22/24/32/36/44/68; 16 ×54, 18 ×24, 20 ×12, 17 ×12 are the
tops). The public law maps sizes to roles; the workspace has no equivalent role map, so component
authors pick freehand pixels and the odd 17px step exists. Same sub-perceptual-but-unbounded class
as F-07-F1.

**F-07-F5 note:** no icon-accessibility defects were found this run — the a11y result is a verified
pass, recorded as protect evidence rather than a finding.

## C. Acceptance criteria

| ID | Done when (measurable) |
| --- | --- |
| F-07-F1 | One stroke authority: either the workspace CSS law scope extends to all workspace `svg.lucide` (rendered 1.75 everywhere outside the control/plus exceptions) or JSX attributes normalize to 1.75; `grep strokeWidth={1.8}` → 0; the harness stroke distribution shows only law values (1.75 normal, 2 control, 3 plus); battery green |
| F-07-F2 | A workspace icon-size role map is documented (meta/control/feature/…, mirroring `public-icons.css`) and `size={17}` instances resolve to a role value; harness records a single documented size set; battery green |

## D. Implementation order (none authorized in this lane)

| Order | Task | Covers | Depends on |
| --- | --- | --- | --- |
| **T1** | Stroke consolidation: extend `workspace-design.css` governance (all workspace `svg.lucide` → 1.75; keep 2/3 for control/plus) or normalize the 89 attributes; verify via the harness distribution | F-07-F1 | — |
| **T2** | Workspace size-role map + sweep (fold 17 into the nearest role) | F-07-F2 | T1 (same files) |

Both tasks change only presentation attributes/CSS with sub-perceptual visual deltas; still run the
F-03 baseline comparison and full battery (design-protection rule).

## E. Verification results (this run)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout |
| `node scripts/iconography-verification.mjs` | **PASS** — zero unlabeled icon-only controls on landing (desktop + mobile) and dashboard; stroke distribution recorded per surface; logo 28px verified identical across surfaces; evidence + receipt in `docs/visionary/baseline/f07-iconography-2026-11-06/` |
| Full battery | **PASS — all stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (13.39 s); qa:taps PASS (243 controls/126 files); qa:motion PASS (439 files); qa:continuity PASS; `npm run check` exit 0 (3842 imported files match baseline + 4 recorded patches) |

## F. Backend / ML dependencies

None.

## G. Remaining issues and risks

- The ungoverned-stroke population (12 on one dashboard page) grows with every new component
  written against the freehand convention until T1 lands.
- 1.75→1.8 is sub-perceptual, so founder-visible before/after evidence is only meaningful if the
  tasks also capture the distribution receipt (harness output), not just screenshots.

## H. Worktree and change summary

`New_Visionary-worktrees/zcode-f07-iconography` on `zcode/f07-iconography` = beta `65f47cc4` +
verification harness + evidence + this receipt. Junction-based node_modules runtime arrangement
(nothing committed). Worktree removed after the beta landing per the operator's standing
instruction; branch retained pushed for review.

## I. Review handoff

```
Jira key / source ID: F-07
Acceptance scope: enabler (iconography standardization audit)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f07-iconography / 65f47cc4 / <receipt commit>
Owned files: frontend/scripts/iconography-verification.mjs; docs/visionary/baseline/f07-iconography-2026-11-06/ (3 PNG + receipt.json); this receipt
Verification: live icon/stroke/logo/accessibility scans + static inventory; battery all-exit-0; product on 4198 throughout
Findings: F-07-F1 (P3 stroke governance), F-07-F2 (P3 workspace size scale); accessible labels + logo consistency verified PASS (protect)
Reviewer decision: pending
Dev integration commit: pending
Next dependent task: T1/T2 (independent small lanes)
```
