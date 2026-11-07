# F-18 — Student experience (2026-11-06)

Jira key / source ID: F-18 (Visionary Frontend Agent task — student experience)
Acceptance scope: enabler (education + product review; findings only — no product changes required)
Implementer: ZCode agent (Education + Product Engineers)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f18-student-experience` / beta `6109287d` (F-17 landing)
Owned files: `frontend/scripts/student-review.mjs` (new reusable harness), evidence directory, this
receipt. No product source file changed.

## Objective and method

Review Learn, Ask, Practice, Build, progress, classes and learning states. New harness
`frontend/scripts/student-review.mjs` drives the real journey on Vite dev `127.0.0.1:4198`
(preview repository): register → onboarding → then each learning surface with actual interactions
— Learn (entry + authored-sample outline), Ask (send a real question), Practice, Build, Progress
(honest empty history), Classes (join with an unknown code). Evidence + receipt:
`docs/visionary/baseline/f18-student-2026-11-06/` (10 PNG + receipt.json).

## A. Verified-correct (protect)

| Surface | Verified state (live) |
| --- | --- |
| Learn entry | "Let's learn — Pick a subject, then choose a book" with BOTH honest paths offered: "Open my outline" (provisional) and "Try authored learning sample" (the fixture SAMPLE_SELECTION per contract) |
| Learn outline | After the authored-sample click the outline renders in place ("Authored sample activities · 2 chapters" drill verified); the provisional-outline law ("A numbered provisional outline keeps your place until sourced content is available. Teaching responses require a connected model.") is on the surface |
| Ask | Question sent ("What is the difference between area and perimeter?") → response rendered; honest markers present ("Local preview · Teaching AI is not connected", AudioPresence footnote); Save question + New chat controls |
| Practice | "Your next practice" renders with the practice entry state |
| Build | "Build something of your own" — ArtifactStudio entry |
| Progress | "Your learning evidence" with the honest empty state (0 invented achievements — the `.v-progress-overview` law from the design-quality audit holds) |
| Classes | Join flow with an unknown code produces the honest not-found state (no invented class) |
| Learning states | Every surface renders honest boundaries; no ML/teaching capability is claimed beyond the recorded contract |

## B. Findings

**F-18-F1 (INFO, review methodology):** the Learn entry is a form-driven flow inside a `<details>`
element — automation must open the disclosure before reaching the sample/outline actions; the
outline renders in place (no route change), and chapters drill by selection rather than topic URL
links. Recorded so future harnesses model the real flow.

**F-18-F2 (INFO):** the authored sample runs on the local SAMPLE_SELECTION fixture per the
recorded learning contract (no ML consumption); the "Teaching responses require a connected
model" boundary is stated on the surface itself.

**No new product defects.** No changes were needed or made — the learning surfaces render the
honest states exactly as recorded.

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout |
| `node scripts/student-review.mjs` | **PASS** — 16 records, 8/8 checks: Learn entry + outline + drill, Ask interaction, Practice, Build, Progress honest state, Classes honest join; 0 page errors |
| Full battery | **PASS — all stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (18.34 s); qa:taps PASS; qa:motion PASS; qa:continuity PASS; `npm run check` exit 0 (3842 imported files match baseline + 4 recorded patches) |
| qa:perf + release gate | qa:perf re-recorded after the known F-16-F4 chunk flip (totals constant 861 KB gzip — interim protocol); **RELEASE GATE PASS 5/5** |
| Visual evidence | 10 captures covering every learning surface state |

## D. Backend / ML dependencies

None. Learning content runs on the recorded local fixtures (SAMPLE_SELECTION); the teaching
boundary ("requires a connected model") is stated on the surface — recorded, not invented.

## E. Remaining issues and risks

- The authored-sample drill verified the outline + chapter level; concept-level teaching states
  remain covered by the existing content/teaching test suite rather than this lane.
- F-16-F4 (chunk nondeterminism) applies to every future battery run until the law owner resolves
  it; the interim protocol is documented.

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f18-student-experience` on `zcode/f18-student-experience` = beta
`6109287d` + review harness + evidence + this receipt + the F-16-F4 interim re-recorded perf
budget. No product source change. Junction-based node_modules runtime arrangement (nothing
committed). Worktree removed after the beta landing per the operator's standing instruction;
branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-18
Acceptance scope: enabler (student experience review)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f18-student-experience / 6109287d / <receipt commit>
Owned files: frontend/scripts/student-review.mjs; frontend/scripts/perf-budget.json (F-16-F4 interim re-record);
  docs/visionary/baseline/f18-student-2026-11-06/ (10 PNG + receipt.json); this receipt
Verification: 8/8 live checks PASS (Learn/Ask/Practice/Build/Progress/Classes + honest states); battery all stages exit 0
  (653/653); RELEASE GATE PASS 5/5
Findings: F-18-F1/F2 (INFO methodology + fixture-contract notes); no product changes
Reviewer decision: pending
Dev integration commit: pending
```
