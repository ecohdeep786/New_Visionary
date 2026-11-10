# F-19 — Teacher experience (2026-11-06)

Jira key / source ID: F-19 (Visionary Frontend Agent task — teacher experience)
Acceptance scope: enabler (education + product review; findings only — no product changes required)
Implementer: ZCode agent (Education + Product Engineers)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f19-teacher-experience` / beta `9499047c` (F-18 landing)
Owned files: `frontend/scripts/teacher-review.mjs` (new reusable harness), evidence directory, this
receipt. No product source file changed.

## Objective and method

Review classroom management, curriculum, assignments, learners, teaching workflows and feedback.
New harness `frontend/scripts/teacher-review.mjs` drives the REAL journey on Vite dev
`127.0.0.1:4198` (preview repository): register → onboarding (teacher, school board) → dashboard →
**create a class through the CreateClassModal** (name/subject filled, color fieldset present) →
class detail tabs (Stream/Classwork/Curriculum/People/Insights/Community) → inline assignment form
→ People honest roster → Insights honest state → Learners honest state → Prepare surface. Evidence
+ receipt: `docs/visionary/baseline/f19-teacher-2026-11-06/` (11 PNG + receipt.json).

## A. Verified-correct (protect)

| Workflow | Verified state (live) |
| --- | --- |
| Prepare | "Prepare a lesson" — the lesson-preparation entry surface |
| Class creation | CreateClassModal renders (name required, section/subject/room optional, color fieldset with `aria-pressed` swatches); "Physics 9A" created through the UI and rendered as a class card; a **join code** (`VISI-…` format) is issued |
| Class detail | Six tabs render: Stream, Classwork, Curriculum, People, Insights, Community; the class join code is shown in the detail |
| Curriculum | The Curriculum tab renders its assign/curriculum flow (honest boundary states present) |
| Assignments | The Classwork tab offers "Create assignment" ("Create assignments and return feedback to your students."); the click reveals the **inline assignment form** (fields render) — feedback loop entry verified |
| People | Honest roster state (no students joined yet) |
| Insights | Honest empty/"awaiting" state at class level and "Teaching insights" surface level |
| Learners | "Your class connections start here — Invite learners to a class. Their submitted work appears here once they connect." with the "Open classes" door — honest by design |
| Draft recovery | CreateClassModal restores saved class-edit drafts via `getResourceEditorDraft('new:teacher-class')` with a validated-fields guard (source verified) |

## B. Findings

**F-19-F1 (INFO, review methodology):** "Create assignment" toggles an **inline form** in the
Classwork tab (not a dialog) — recorded so future harnesses look for the inline AssignLesson
fields; the Learners honest copy says "once they **connect**" (not "join").

**F-19-F2 (INFO):** class creation issues the join code immediately (visible on the card/detail) —
the invite loop (share code → learner joins → roster appears) is the verified honest pattern; no
backend capability invented.

**No new product defects.** No changes were needed or made.

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout |
| `node scripts/teacher-review.mjs` | **PASS** — 21 records, 12/12 checks: class creation, detail tabs, curriculum, inline assignment form, People/Insights/Learners honest states, Prepare; 0 page errors |
| Full battery | **PASS — all 11 stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (17.48 s); qa:perf PASS (no chunk flip this build); qa:taps PASS; qa:motion PASS; qa:continuity PASS; `npm run check` exit 0; **RELEASE GATE PASS 5/5** |
| Visual evidence | 11 captures covering Prepare, modal, created class, detail tabs, assignment form, People/Insights/Learners |

## D. Backend / ML dependencies

None. Classes/rosters/assignments run on the recorded local repository; curriculum availability
keeps its honest boundary.

## E. Remaining issues and risks

- The full feedback loop (learner submits → teacher grades) spans both sides of the class
  connection; this lane verified the teacher-side entry points and honest states — the learner-side
  submission was covered in F-18, and the connected-pair flow remains an integration-lane item
  (F-02-F1's firebase bring-up would enable a two-account live pair).
- F-16-F4 (chunk nondeterminism) did not flip this build but remains a law-owner item.

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f19-teacher-experience` on `zcode/f19-teacher-experience` = beta
`9499047c` + review harness + evidence + this receipt. No product source change. Junction-based
node_modules runtime arrangement (nothing committed). Worktree removed after the beta landing per
the operator's standing instruction; branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-19
Acceptance scope: enabler (teacher experience review)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f19-teacher-experience / 9499047c / <receipt commit>
Owned files: frontend/scripts/teacher-review.mjs; docs/visionary/baseline/f19-teacher-2026-11-06/ (11 PNG + receipt.json); this receipt
Verification: 12/12 live checks PASS (class creation through the modal, six detail tabs, inline assignment form, honest People/Insights/Learners); battery all 11 stages exit 0 (653/653); RELEASE GATE PASS 5/5
Findings: F-19-F1/F2 (INFO methodology + honest join-code pattern); no product changes
Reviewer decision: pending
Dev integration commit: pending
```
