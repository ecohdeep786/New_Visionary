# F-23 — Cross-role integration and continuity (2026-11-06)

Jira key / source ID: F-23 (Visionary Frontend Agent task — cross-role integration and continuity)
Acceptance scope: enabler (UX + platform review; findings only — no product changes required)
Implementer: ZCode agent (UX + Platform Engineers); lane completed by the principal engineer
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f23-cross-role-continuity` / beta `d33064f6` (F-22 landing)
Owned files: `frontend/scripts/cross-role-review.mjs` (new reusable harness), evidence directory,
this receipt. No product source file changed.

## Objective and method

Verify the relationships across users, classrooms, organizations, workspaces and the
learning/building journeys that the single-role lanes (F-17 shell, F-18 student, F-19 teacher,
F-20 parent pair, F-21 professional, F-22 organization pair) could not see: the live hand-offs
between accounts. Harness `frontend/scripts/cross-role-review.mjs` drives **three accounts in one
browser** through the real journey on Vite dev `127.0.0.1:4198` (preview repository, no
interception), in four phases:

- **Phase 1 — teacher:** registers ("I am a Teacher" onboarding), creates "Physics 12B" through
  the real CreateClassModal (capturing the independent-teaching scope notice and the issued
  `VISION-XXXXXXXX` join code from the class detail "Share this class code" block), invites
  learner A by email through the real People-tab invite form, creates and publishes the assignment
  "Forces quiz 1" through the Classwork tab, posts a class update through the Stream tab, signs out.
- **Phase 2 — learner A (invitation path):** registers ("I am a Learner"), sees the teacher's live
  invitation in the "Class invitations" section, accepts it, verifies the class card with the
  teacher's assignment count, opens the class, sees the teacher's assignment in Classwork, answers
  and submits ("Submitted — waiting for your teacher to review."), sees the teacher's announcement
  in Updates, and verifies the "Explore Physics in Learn" continuity door into the learning journey.
- **Phase 3 — learner B (join-code path):** registers, joins with the **real captured code**
  (the first live verification of a successful cross-account join — F-18 had only exercised the
  unknown-code path), also answers and submits the assignment, then re-opens the join dialog with a
  wrong code and verifies the honest not-found state still holds.
- **Phase 4 — teacher continuity:** signs back **in** with the same credentials (session
  continuity), verifies the class and assignment state persisted, the People roster shows both
  learners Connected from the live store, the Classwork tab shows the cross-account submissions
  ("Review (2 · 2 new)"), and the workspace switcher still offers "Personal · Teacher".

Evidence + receipt: `docs/visionary/baseline/f23-cross-role-2026-11-06/` (16 PNG + receipt.json).

## A. Verified-correct (protect)

| Step | Verified state (live, three accounts) |
| --- | --- |
| Teacher classes shell | `/dashboard/classes` renders h1 "Your classes" with the "Create class" control — matches the F-17 teacher role law |
| Class scope notice | CreateClassModal states "Independent teaching · This class belongs to your personal workspace." with "To create in another space, close this dialog and switch workspace first." — the workspace-scoping law renders at the point of creation |
| Join code issuance | Class detail renders the "Share this class code" block with a `VISION-XXXXXXXX` code (8 hex chars, `classroomService.js` format) |
| People invite | The real invite form creates the invitation with "Invitation added. It will appear in this student's Classes page when they sign in on this device. You can also share the class code." and the row shows the learner email with an "Invited" chip |
| Assignment publish | The Classwork tab creates "Forces quiz 1" (100 points) through the real form; the assignment card renders on the teacher surface |
| Class update | The Stream tab posts the update through "Post update"; the announcement renders and the empty state disappears |
| Invitation crossing accounts | Learner A's Classes page shows the "Class invitations" section with "Physics 12B", "{teacher} invited you to join" and the "Accept class" control — the teacher's invite crossed accounts through the shared preview store with enrollment-scoped visibility |
| Acceptance | Accepting opens the class inline; returning to the grid shows the "Physics 12B" card with "1 assignment" — the teacher's published assignment count is visible to the learner |
| Assignment visibility | The learner's Classwork tab shows "Forces quiz 1" with "100 points" — teacher-created classwork crossed accounts |
| Submission | The learner answers and submits; the state renders "Submitted — waiting for your teacher to review." |
| Learning continuity | The class view offers the "Explore Physics in Learn" door linking the classroom journey into the personal learning journey |
| Teacher update crossing accounts | The learner's Updates tab shows the teacher's announcement text |
| Join-code path | Learner B joins with the real captured code; the class opens inline and the card shows "1 assignment" — first live cross-account join verification |
| Wrong-code honesty | A wrong code renders "We couldn't find a class with that code. Check the code with your teacher and try again." in a `role="alert"` — the F-18 honesty law holds after the successful-join path exists |
| Second submission | Learner B answers and submits the same assignment — two independent accounts produce two submissions |
| Session continuity | The teacher signs back in with the same credentials; "Physics 12B" persists with "2 students" and the switcher still offers "Personal · Teacher" |
| Live roster | The People tab shows "2 connected · 0 invited" with both learner emails and "Connected" chips — the roster is live from the shared store, not a snapshot |
| Cross-account submissions | The teacher's Classwork tab shows "Review (2 · 2 new)" on the assignment — both learners' submissions crossed accounts and are attributed to the teacher's review queue |

## B. Findings

**F-23-F1 (INFO, review methodology):** the harness is a three-account, four-phase single-browser
design — the teacher's invite and join code are captured live and consumed by two separately
registered learners, and the teacher then signs back **in** (not registers) to close the loop.
This is the first lane that exercises the successful cross-account join; F-18 had only verified
the unknown-code honesty. The class opens inline after accept/join (the grid is replaced by the
open-class view), so harnesses must return via the "All classes" control before asserting on the
class card — recorded for future multi-account harnesses.

**F-23-F2 (INFO, integration law verified):** the cross-role chain runs entirely on the recorded
local law with no invented capability: the shared preview store (`visionary_entity_*` keys) carries
classrooms/enrollments/assignments/announcements/submissions across accounts, while visibility is
enforced by enrollment-scoped read filters (`previewPermissions.js`) — the learner sees the class
only after accept/join, the teacher sees only their own class, and the roster/review counts update
live. The classroom journey connects into the learning journey through the "Explore {subject} in
Learn" door without merging the two workspaces.

**F-23-F3 (INFO, environment):** the battery ran while the lane's Vite dev server (4198) was the
only frontend server (the previous lane's server was retired before this lane started). The
harness passed deterministically on back-to-back runs (37 records, 0 defects twice); qa:perf
passed within the recorded budgets with no chunk flip, so no re-record was needed.

**No new product defects.** No changes were needed or made.

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout (worktree-served) |
| `node scripts/cross-role-review.mjs` | **PASS** — 37 records, 20/20 checks 0 defects, 0 page errors, deterministic on back-to-back runs: teacher (shell, scope notice, class + code, invite, assignment, update) → learner A (invitation, accept, assignment, submit, learn door, update) → learner B (real-code join, submit, wrong-code honesty) → teacher continuity (session, roster, submissions) |
| Full battery | **PASS — all 10 stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (2 m 07 s); qa:perf PASS (137 chunks within recorded budgets — no re-record needed); qa:taps PASS (243/126, 3 exceptions); qa:motion PASS (439 files); qa:continuity PASS (all recorded public-surface laws); `npm run check` exit 0 |
| Release gate | **RELEASE GATE PASS 5/5** (route sweep 27 routes, keyboard skip-link + focus-visible, accessibility-spot 0 low-contrast / 0 small controls, critical navigation) |
| Visual evidence | 16 captures: teacher classes/modal/class detail/invite/assignment/update/return/roster/review, learner A invitation/accepted/classwork/submitted/updates, learner B joined/submitted/wrong-code |

## D. Backend / ML dependencies

None. The cross-role chain runs on the recorded local law (preview repository: classrooms,
enrollments, assignments, announcements and submissions are local preview entities; invites are
saved locally for seven days; no connected model participates). Real server-side classroom
authority — cross-device enrollment, assignment delivery, submission transport and grading
authority — remains the backend lane's open gate (recorded, not invented). The teacher's grading
flow (AssignmentGrader) exists in the UI but real grade authority is the backend lane's gate.

## E. Remaining issues and risks

- Classroom membership, assignments and submissions are preview-local (shared localStorage in one
  browser profile); real cross-device/classroom delivery remains the backend lane's open gate.
- The preview store is shared across accounts in the same browser profile by design (enrollment-
  scoped reads provide the boundary); a real multi-user deployment requires the server-side
  authority the backend lane owns.
- Grading/feedback return to the learner is UI-present but not exercised end-to-end here; the
  classwork-review law is covered by the existing node tests (`classwork-review-commit.test.mjs`)
  and remains a backend-dependency gate for live verification.
- Organization-linked classes ("Organization class · {id}") were reviewed in F-22 from the org
  side; the teacher-side org-class creation path in a linked org workspace is a remaining
  cross-check for a future lane.

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f23-cross-role-continuity` on `zcode/f23-cross-role-continuity`
= beta `d33064f6` + review harness + evidence + this receipt. No product source change; no
perf-budget re-record needed (qa:perf passed within recorded budgets). Junction-based node_modules
runtime arrangement (nothing committed). Worktree removed after the beta landing per the operator's
standing instruction; branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-23
Acceptance scope: enabler (cross-role integration and continuity review)
Implementer: ZCode agent (lane completed by principal engineer)
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f23-cross-role-continuity / d33064f6 / <receipt commit>
Owned files: frontend/scripts/cross-role-review.mjs; docs/visionary/baseline/f23-cross-role-2026-11-06/ (16 PNG + receipt.json); this receipt
Verification: 20/20 cross-role checks PASS (three accounts, four phases, deterministic x2); battery all 10 stages exit 0 (653/653); RELEASE GATE PASS 5/5
Findings: F-23-F1/F2/F3 (INFO methodology, integration law, environment); no product changes
Reviewer decision: pending
Dev integration commit: pending
```
