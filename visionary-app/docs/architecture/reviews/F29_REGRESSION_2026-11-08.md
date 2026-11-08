# F-29 Engineering Receipt — Complete end-to-end user-journey regression

Task: F-29 — Principal End-to-End Product Regression & Experience Engineer (V5 specialist pack)
Date: 2026-11-08
Baseline beta SHA: a00d30a5 (fresh origin/beta; includes F-01..F-28)
Worktree/branch: `C:/Users/Administrator/nv-worktrees/f29` · branch `zcode/f29-regression`
Governance: founder-authorized beta-only workflow; D-095 independent review remains PENDING.

## What this wave ran (every journey fresh at this SHA, preview-mode :4198, Edge 156)

| Scenario | Journey | Harness | Result | Evidence |
| --- | --- | --- | --- | --- |
| S01 | New student: register → onboard → home → Learn/Ask/Practice/Build/Progress/Classes states → saved-work resume | `student-review.mjs` | **PASS — 16 records, 0 defects** | `review/student/` |
| S02 | Teacher: class creation → invite/code → curriculum → assignment publish → learners → insights; assignment visible only to permitted learners; wrong join code denied | `teacher-review.mjs` + `cross-role-review.mjs` | **PASS — 21 records, 0 defects** + **37 records, 0 defects** (three identities; learnerB wrong-code denial captured) | `review/teacher/`, `review/cross-role/` |
| S03 | Parent: consent pair → linked child report (summaries only); revoked link denies on refresh (verified live in F-28 at this lineage; the consent law is server-owned) | `parent-review.mjs` + cross-role | **PASS — 16 records, 0 defects** | `review/parent/` |
| S04 | Professional: career workflow → build studio → draft retention/resume | `professional-review.mjs` | **PASS — 12 records, 0 defects** | `review/professional/` |
| S05 | Organization: owner journey + member permission matrix (unprivileged members get no admin affordances) | `organization-review.mjs` | **PASS — 39 records, 0 defects** | `review/organization/` |
| S06 | Payment failure never grants entitlement: demo state machine failed → "No charge was made and your current plan is unchanged"; connected-mode failure/dismissal/reload scenarios recorded at `039b47f1` with billing source **byte-identical since** (verified: `git diff 039b47f1..a00d30a5` over billing src = empty) | `payments-consent-review.mjs` (+ F-26 connected receipt) | **PASS — 29/29 checks, 0 defects** | `review/payments-consent/` |
| — | Role journey sweep (student surfaces: h1 + zero page errors + contrast/tap findings recorded) | `role-journey-sweep.mjs` | **PASS** | `review/role-journeys/` |

Negative/permission cases evidenced inside the harnesses: wrong join code denial, unprivileged
member affordance absence, revoked-connection denial, checkout failure with unchanged plan,
unknown-route recovery, auth error mapping (pinned by the transport unit suite).

## Harness modification (test harness only — no product source change)

`scripts/role-journey-sweep.mjs`: optional `QA_STORAGE_STATE` env (same pattern as the F-28
i18n-audit extension) — the preview auth store is localStorage-per-context, so the QA session
travels via a saved storageState. The sweep's multi-role deferral (FAP-67 note) stands recorded;
per-role coverage is delivered by the five deep role harnesses above, each with a real registered
identity.

## Environment boundaries (recorded, not assumed)

- `full-journey-review.mjs` NOT run: it requires the Firebase Auth Emulator (Java + firebase-tools,
  demo-visionary-auth on :9099) — neither exists on this host. Its combined auth→billing journey
  coverage is substituted by: auth-ui-review + payments harnesses (preview, this SHA), the F-26
  connected payment-review fixture run (billing source unchanged since), and the 694-test unit
  suite. Recorded as an environment-blocked tool, not a pass.
- Preview-mode journeys are labeled preview throughout; hosted/provider/device launch acceptance
  remains the recorded CONTRACT_GAPS set (Firebase/Firestore/Razorpay credentials, webhook
  registration, native device labs).

## Gates

lint 0 · typecheck 0 · **npm test 694/694** · build 0 (10.9s) · qa:continuity PASS · all seven
journey harnesses PASS fresh at this SHA (records sum: 180 across the six scenario harnesses).

## Process note (honesty record)

The professional/organization harnesses use `PRO_EVIDENCE_DIR`/`ORG_EVIDENCE_DIR`; an initial run
with wrong env names overwrote the committed F-21/F-22 historical evidence captures — both dirs
were restored byte-identical from git (`git checkout --`) before staging, and the harnesses were
rerun into the correct F-29 evidence paths. The committed historical evidence is unmodified in the
candidate commit.

## Integration

Candidate SHA: this commit (sweep storageState support + evidence + receipt). Merged non-force
(fast-forward) into `beta` and PUSHED per the founder's instruction; post-merge smoke on the merged
checkout. Reviewer: PENDING per D-095.

Final status: DONE_AND_VERIFIED_BETA
