# KAN-99 / ROLE-07 — reviewer-corrector pass (2026-11-12)

Reviewer-prep for `codex/principal-kan-99-authorized-reports` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `c260894e`; package.json scripts unioned — all thirty-eight family checks live incl. the domain's own registered gate), data-04 settled to dev's evolved version, settled review artifacts.

## Correction

Report/rules ids use `randomUUID` (instance counters collided across service instances).

## Review finding (verified, no defect)

The authorized-reports law reviewed clean:

- **Authorization first**: `generateReport` resolves the recipient's authority server-side (the `isAuthorized` lookup) before anything persists.
- **Approved rules required**: the pinned rules version must exist AND carry a named approver.
- **Period bounds**: finite, ordered, and within the rules' max period days.
- **Private-content refusal**: learner chat/draft/transcript metrics refuse BY DEFAULT — no override.
- **Cohort suppression**: buckets below the rules' min cohort size are suppressed (never aggregated into a release).
- **Provenance carried**: rules id/version + period + generator recorded on every report.
- **Recipient-scoped append-only reads** (uniform not_owner otherwise).

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Reports suite (ROLE-07's own acceptance) | `node --test backend/tests/contracts/reports/reports.test.mjs` (after `npx tsc -p tsconfig.reports.json`, exit 0) | **6/6 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` (after the coupled artifact chain) | **exit 0 — 866 ok lines, frontend build ok** |
| Data-04 fix | settled to dev's evolved version | **exact** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-12)

All four stages re-verified: pricing renders; register renders all three reviewed methods; the email-entry step renders on click; the protected-route guard renders in-place with the Create-account link preserving the full `returnTo` deep link. Credential step founder-gated as always.

## Notes for the reviewer

- The authorization and cohort lookups are injected (the SQL adapter joins the ROLE stores). Hosted report delivery at scale stays founder-gated as originally recorded.
