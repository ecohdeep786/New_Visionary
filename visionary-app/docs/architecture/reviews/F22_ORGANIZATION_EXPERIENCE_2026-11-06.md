# F-22 — Organization experience (2026-11-06)

Jira key / source ID: F-22 (Visionary Frontend Agent task — organization experience)
Acceptance scope: enabler (product + platform review; findings only — no product changes required)
Implementer: ZCode agent (Product + Platform Engineers); lane completed by the principal engineer
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f22-organization-experience` / beta `451b1205` (F-21 landing)
Owned files: `frontend/scripts/organization-review.mjs` (new reusable harness), evidence directory,
this receipt. No product source file changed.

## Objective and method

Review the organization workspace end to end: the owner journey (org onboarding, People invites,
cohorts, content authoring with anti-self-approval, curriculum templates, analytics honesty, audit,
settings, seats & billing, organization updates) and the member permission matrix (an invited
analyst's reduced access). Harness `frontend/scripts/organization-review.mjs` drives the real journey
on Vite dev `127.0.0.1:4198` (preview repository, no interception) in two phases with one browser:

- **Phase 1 — owner:** registers through the UI (email → password → OTP → onboarding
  "We are an Organization", the F-21-F1 registration path), then walks the org shell: Home
  (owner topbar "Owner · My organization", primary People/Cohorts/Curriculum/Insights + secondary
  Content/Audit/Seats & billing doors), People (invites an analyst through the real Connections
  form), Cohorts (create group + membership boundary copy), Content (author → save → submit with
  the anti-self-approval wait), Curriculum (reviewed templates + unreviewed earlier drafts),
  Analytics (honest no-linkage), Audit (device-local honesty), Settings (owner edit → review →
  confirm, preview-only framing), Seats & billing (planning request, no-charge honesty) and
  Organization updates.
- **Phase 2 — member permissions:** signs out with real pointer clicks, registers the invited
  analyst, sees the pending organization invite on Connections, accepts it, switches to the joined
  organization workspace through the real `select[aria-label="Active workspace"]` switcher, then
  verifies the analyst permission matrix live: `/dashboard/home` renders OrganizationAccessHome
  with only the Aggregate insights door plus the privacy boundary copy, analytics renders the
  reduced "Aggregate insights" surface, and audit/cohorts/curriculum/library/subscription are
  permission-blocked.

Evidence + receipt: `docs/visionary/baseline/f22-organization-2026-11-06/` (13 PNG + receipt.json).

## A. Verified-correct (protect)

| Step | Verified state (live, two accounts) |
| --- | --- |
| Organization onboarding | "We are an Organization" path reaches the dashboard with the org owner shell (Home / People / Cohorts / Curriculum / Insights + Content / Audit / Seats & billing), topbar "Owner · My organization" — matches the F-17 role law |
| People invite | The real Connections form creates the analyst invite with "Request saved locally for seven days", the pending row shows "Awaiting acceptance" with the "Organization membership · Analyst" scope |
| Cohorts | Cohort creation saves "Physics research circle" with the boundary copy "Cohort saved. Membership does not grant access to personal learning"; the dialog states only accepted members and explicitly organization-linked classes are available — no private notes or conversations |
| Content anti-self-approval | Authoring → save → submit leaves the owner in "Waiting for a different academic administrator to review" with **no Approve control** rendered for their own revision; the dialog states a different academic administrator reviews each authored revision |
| Curriculum | "Reviewed curriculum templates" with "Earlier subject drafts · unreviewed" and the honesty law "cannot be distributed as approved curriculum" |
| Analytics honesty | "Institution analytics" renders "No linked classrooms yet" and "Roster drafts do not create classroom access" — no invented institutional metrics |
| Audit | "Organization audit" states the history is stored on this device and is editable browser data (device-local honesty) |
| Settings | Owner edits apply through the "Apply organization settings?" review dialog with "These settings apply only in this local preview"; saved state shows the changed org type (Coaching organization) |
| Seats & billing | "Organization seats and billing" honestly states pricing/invoices are not connected; a saved seat request records "5 seats · pending" with "Acknowledgement does not activate seats, grant access or create a charge" |
| Organization updates | "Organization updates" states email/push/scheduled delivery require the later notification service, with the Summary frequency preference |
| Member invite acceptance | The invited analyst sees the pending org membership on their Connections surface, accepts it, and the workspace switcher offers "Brightpath Academy" |
| Member permission matrix | Analyst home renders "Your organization workspace" with **only the Aggregate insights door** (People/Cohorts/Local audit/Seats and billing absent), the owner's org email shown, and the privacy boundary "Private learner questions, personal notes and learning transcripts are excluded from administrative access" |
| Member analytics scope | The analyst's analytics surface renders the reduced "Aggregate insights" view with no "Institution analytics" |
| Member blocked surfaces | audit / cohorts / curriculum / library / subscription all render the permission-required state for the analyst |

## B. Findings

**F-22-F1 (INFO, review methodology):** the harness is two-phase in a single browser — the owner
invites the analyst through the real People form, then the same browser signs out and registers the
invited analyst so the invite → pending → accept → member-workspace-switch chain is exercised live
end to end (the same two-account pattern F-20 established for the parent/learner consent pair).
The workspace switcher is a native `select[aria-label="Active workspace"]`, not a Radix menu —
recorded so future multi-workspace harnesses switch contexts without pointer-menu workarounds.

**F-22-F2 (INFO, honesty law verified):** the organization surfaces enforce the honest-by-construction
model consistently: content review is anti-self-approval in the UI (submitting own revision leaves
"Waiting for a different academic administrator" and renders no Approve control), curriculum drafts
are labeled unreviewed and cannot be distributed as approved curriculum, analytics refuses to invent
institutional metrics from roster drafts, audit/settings are explicitly device-local/preview-only,
billing acknowledgement creates no charge, and notifications defer email/push to the later service.
The member permission matrix (analyst: aggregate insights only; five surfaces permission-blocked)
matches the org role law recorded in the product contract.

**F-22-F3 (INFO, environment):** the battery ran while two Vite dev servers were up (4198 this
lane, 4197 another lane's). `npm test` took 201 s versus the usual ~95 s but passed deterministically;
no stray runaway process was present this time (contrast F-21-F2). The harness itself passed
deterministically on re-run (39 records, 0 defects) and qa:perf passed against the recorded budgets
with no chunk flip this build, so no re-record was needed.

**No new product defects.** No changes were needed or made.

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout (worktree-served) |
| `node scripts/organization-review.mjs` | **PASS** — 39 records, 26/26 checks 0 defects, 0 page errors: owner journey (home shell, people invite, cohorts, content anti-self-approval, curriculum, analytics, audit, settings, billing, notifications) + member permission matrix (invite visible/accepted, access home, analytics scope, 5 blocked surfaces) |
| Full battery | **PASS — all 10 stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (2 m 27 s); qa:perf PASS (137 chunks within recorded budgets — no re-record needed); qa:taps PASS (243/126, 3 exceptions); qa:motion PASS (439 files); qa:continuity PASS (all recorded public-surface laws); `npm run check` exit 0 |
| Release gate | **RELEASE GATE PASS 5/5** (route sweep 27 routes, keyboard skip-link + focus-visible, accessibility-spot 0 low-contrast / 0 small controls, critical navigation) |
| Visual evidence | 13 captures: org home, people invite, cohorts entry, content submitted, curriculum, analytics, audit, settings saved, billing saved, notifications, member invite pending, member home, member blocked |

## D. Backend / ML dependencies

None. The organization journey runs on the recorded local law (preview repository: invites and
membership requests are saved locally for seven days, settings/audit are device-local, content
review is an editorial record on this device). Real server-side organization authority — member
provisioning, cross-device membership, institutional analytics and seat invoicing — remains the
backend/trust/billing lanes' open gate (recorded, not invented).

## E. Remaining issues and risks

- Organization invites/membership are preview-local ("saved locally for seven days"); real
  organization authority and cross-device membership remain the backend lane's open gate.
- Seats & billing is an honest planning surface only — acknowledgement does not activate seats or
  create a charge; real pricing/invoicing remains the billing lane's open gate.
- Organization updates honestly defer email/push/scheduled delivery to the later notification service.
- The analyst permission matrix is enforced by the frontend role law; server-side enforcement of the
  same matrix is the backend lane's open gate (the frontend cannot be the authority).

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f22-organization-experience` on `zcode/f22-organization-experience`
= beta `451b1205` + review harness + evidence + this receipt. No product source change; no
perf-budget re-record needed (qa:perf passed within recorded budgets). Junction-based node_modules
runtime arrangement (nothing committed). Worktree removed after the beta landing per the operator's
standing instruction; branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-22
Acceptance scope: enabler (organization experience review)
Implementer: ZCode agent (lane completed by principal engineer)
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f22-organization-experience / 451b1205 / <receipt commit>
Owned files: frontend/scripts/organization-review.mjs; docs/visionary/baseline/f22-organization-2026-11-06/ (13 PNG + receipt.json); this receipt
Verification: 26/26 organization checks PASS (owner journey + member permission matrix); battery all 10 stages exit 0 (653/653); RELEASE GATE PASS 5/5
Findings: F-22-F1/F2/F3 (INFO methodology, honesty law, environment); no product changes
Reviewer decision: pending
Dev integration commit: pending
```
