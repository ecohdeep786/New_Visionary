# T10 real-user browser verification — five persona product specialists

Exploration receipt for the V6 T10 lane (Five Persona Product Specialists Team). Server:
`http://127.0.0.1:5198` — vite dev serve of the `fap91-teardown-guard` worktree carrying
beta content (`origin/beta` @ `d0ec8058`, FAP-91 merged). Probe: OpenCode in-app Chromium,
driven as a real user (native form controls, real pointer sequences for Radix menus, honest
waits on settled text), 2026-11-13 and 2026-11-14. Screenshots beside this receipt.

## Verification windows (honest scope note)

- **Window A (2026-11-13):** the Teacher↔Student connected loop, the Parent loop and the
  Professional loop verified live end-to-end. A harness/server restart then wiped the
  browser profile (all local accounts lost), so no further screenshots could be captured
  for these lanes; the surviving Parent screenshot below was captured during window A.
- **Window B (2026-11-14, fresh accounts):** the onboarding role-mapping reproduction and
  the full Organization lane re-verified live end-to-end with two new accounts, console
  receipts recorded at every step.

All verification is against the same beta content (`d0ec8058`); only the browser profile
changed between windows. Account registration throughout used the email-first flow with
OTP `000000` (disclosed preview simulation copy intact).

## Persona sub-lane: Learner / Student (connected with Teacher)

Window A, two accounts. Teacher created class **"Fictional Physics 9B"** (join code
`VISION-B0318730`), posted a stream update and created the assignment
**"Measure free-fall time with a phone stopwatch"** (100 pts, Kinematics). Student joined
via the code, framed the activity honestly (own recorded work, no invented mastery),
submitted. Teacher graded **85** with feedback; the student then saw **"85/100"**, the
feedback text and **"Returned by your teacher"** — the full connected loop closed on both
sides with honest framing at each step.

## Persona sub-lane: Parent

Window A. Self-connection honestly rejected. Parent→learner connection request saved
("Request expires: Nov 20, 2026"); learner accepted → **"Connection accepted."** Parent
report opened at `/dashboard/reports` — **"Their learning, in context"**
(screenshot `parent-report-opened@1440.png`) with the privacy law rendered
("Returned-work titles and upcoming due dates only. Answers, grades and private feedback
are excluded.") and honest empty states ("No classwork was returned in this period. This
does not describe the learner's ability." / "No upcoming classwork due date is recorded
for this learner's active classes."). Consented-progress support delivered without
exposing answers, grades or private feedback.

## Persona sub-lane: Professional

Window A. Career direction saved (privacy note shown). Skill goal **"Explain measurement
uncertainty"** at level **Intermediate** → **"Your capabilities"** with a Provisional
provenance outline + Chapter 1. Portfolio project **"Stopwatch uncertainty explainer"**
created, saved and listed (**"draft · private"**) with the artifact preview live.

## Persona sub-lane: Organization (window B, cross-account)

Account A `rev.t10b@visionary.test` (org owner, "Owner · My organization"); account B
`fap91b2@visionary.test` (Learner + later Teacher).

- **Cohort:** created **"Measurement upskilling group"** with purpose → listed as
  "draft · 0 connected members · 0 linked classes"; toast **"Cohort saved. Membership
  does not grant access to personal learning."**
- **Curriculum:** authored **"Measurement uncertainty fundamentals"** (Organization
  audience local draft): source metadata (board/framework, class/level, subject, provider,
  identifier, version), Chapter 1 "Trials and uncertainty ranges" (pp. 12–14), one
  objective with authored teaching explanation and one review criterion →
  **"Revision 1 · draft"** → "Submit saved revision" → **"Revision 1 · submitted"**.
  Governance copy present throughout: "A different academic administrator reviews each
  authored revision", "Author only reviewed source content", "No book conversion or new
  3D asset is generated."
- **Content library** ("Organization content") consistent with the curriculum state
  filters (draft/submitted/changes/approved/archived).
- **Insights:** suppression law rendered with 0 contributors — "Period participation is
  hidden below 5 contributors." / "Concept totals require at least 5 contributing learners
  in the selected period."
- **Audit:** "3 recorded actions in the selected period and source" (cohort saved, content
  draft saved, content submit), each with target/actor ids, timestamps and
  "Outcome: Saved locally".
- **Seats & billing:** requested 12 seats with purpose → "12 seats · pending" →
  Acknowledge → **"Owner acknowledged the planning request. No seats activated."** Honest
  framing: "Acknowledgement does not activate seats, grant access or create a charge."
- **Cross-account membership loop:** owner invited `fap91b2@visionary.test` (teacher
  scope) → "Organization membership · teacher · Approval: Invited member · Request
  expires: Nov 21, 2026 · Awaiting acceptance". A self-invite attempt was honestly
  rejected ("Use another person's account email.").
- **Member side, role-gated acceptance enforced:** the request appeared in B's Learner
  workspace Connections as "Needs your approval"; the first Accept was honestly blocked —
  **"This invitation is for a teacher. Open that workspace role first."** After adding the
  Teacher role and switching to it, Accept succeeded → **"Connection accepted."** and a
  new workspace appeared: **"Work · Review Two · Teacher"**, whose home states
  "Connected organization · Personal learning stays separate".
- **Owner side closes the loop:** B listed under **Connected** with the scope line and a
  Disconnect action (screenshot `org-membership-connected@1440.png`).

Platform dependency documented in-product at every step: "Local preview: connections work
between accounts stored in this browser. Cloud invitations, verified access rules, and
cross-device sync are not active yet."

## Observation: onboarding role-card → workspace mapping (window B, not a defect)

Registering account A chose the identity card **"I am a Learner"** (aria-pressed true,
verified after settle) and the focus card **"Independent learning"**; the review step
showed "Using Visionary as / **Learner**" + "Learning focus / Independent learning", and
the delivered workspace was **"Personal · Professional"** (person roles `['professional']`,
workspace role `professional`). Source confirms this is a deliberate, long-standing
mapping, not a click-wiring bug: the role cards are plain buttons that pass their own id
only (`ChoiceGrid` → `onChange('student')` for the Learner card), while
`bootstrapPerson` (`workspaceService.ts:40`) derives the workspace role as
`education_stage === 'professional' ? 'professional' : identity`, and the independent-
learning focus card carries id `professional`. The mapping is documented and accepted in
`docs/visionary/CATEGORY_FLOW_ACCEPTANCE_2026_10_09.md` line 7: "The last maps to the
professional workspace."

Corroborated with account B: Learner + **"Exam preparation"** branched to the exam step
(JEE Main) and delivered **"Personal · Learner"** — the other focus cards map to the
learner workspace as the acceptance doc states.

Copy wrinkle recorded as an observation only (no ticket): the review step still reads
"Using Visionary as: Learner" while the delivered workspace is Professional. Behavior is
correct per the accepted mapping; the review-step copy could name the delivered
workspace.

## Console

Window B: **0 console errors at every recorded checkpoint** — cohort save, curriculum
draft save, revision submit, org page walks, seat request + acknowledge, invite save,
member accept attempt (blocked), member accept success, owner connected view. Window A:
console clean per lane, recorded in-session before the profile wipe.

## Files

- `parent-report-opened@1440.png` — window A: the parent report ("Their learning, in
  context") with the privacy law and honest empty states.
- `org-membership-connected@1440.png` — window B: the org owner's People & connections
  page after the cross-account accept (fap91b2 Connected, teacher scope).
