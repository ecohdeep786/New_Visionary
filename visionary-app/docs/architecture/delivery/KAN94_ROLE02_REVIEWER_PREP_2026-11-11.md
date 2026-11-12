# KAN-94 / ROLE-02 — reviewer-corrector pass (2026-11-11)

Reviewer-prep for `codex/principal-kan-94-assignment-publication` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections `517ad797`, stack integration `51e71332` (merge of dev `c260894e` — Codex advanced dev twice; package.json scripts unioned — all thirty-three family checks live incl. the domain's own registered gate), data-04 settled to dev's evolved version (Codex's own `b0cd7507` anchors the SQL invitation fixtures to the test run).

## Corrections

The assignment service reviewed clean overall — the one correction:

- **Dead code removed**: `assignmentCounter` was declared but never incremented (assignments are caller-identified with idempotent version convergence via `latestVersionNo + 1`; no counter-generated ids exist).

## Review finding (verified, no defect)

The assignment law reviewed clean:

- **Timezone-honest scheduling**: wall-clock publish/close times convert to instants via a UTC-anchored probe (no TZ database dependency); close must be after publish at definition time; close time is evaluated in the assignment's own timezone at submission.
- **Fixed content at publication**: draft versions are editable; published versions immutable; a scheduled assignment goes live at its own publish instant (computed server-live at submission).
- **Lifecycle integrity**: close refuses submissions; archive records priorStatus and restore restores exactly it; the evidence-ledger probe proves no planning rebuild touched the ledger.
- **Deterministic submissions**: the submission id is `sub_${assignmentId}_${versionNo}_${learnerUid}` and the store keys identically — concurrent double-submits converge to one record (self-healing, no fix needed).
- **Enrollment gating**: submission requires CURRENT enrollment.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Assignment suite (ROLE-02's own acceptance) | `node --test backend/tests/contracts/assignment/assignment.test.mjs` (after `npx tsc -p tsconfig.assignment.json`, exit 0) | **7/7 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-11)

Pricing renders (full plan table); register renders all three reviewed methods; the email-entry step renders on click; the protected-route guard renders in-place with the Create-account link preserving the full `returnTo` deep link. Credential step founder-gated as always.

## Notes for the reviewer

- The store is the in-memory reference; the SQL adapter maps onto the assignment/version/submission tables.
- Hosted assignment flows at scale stay founder-gated as originally recorded.
