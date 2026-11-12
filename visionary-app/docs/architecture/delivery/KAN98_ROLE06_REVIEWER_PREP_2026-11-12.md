# KAN-98 / ROLE-06 — reviewer-corrector pass (2026-11-12)

Reviewer-prep for `codex/principal-kan-98-org-membership` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `c260894e`; package.json scripts unioned), re-integration settlement (the branch's own registered data:check battery restored — see below).

## Corrections

1. **Join/revoke TOCTOU closed**: `joinByInvite` read the invite then wrote the membership + accepted status in two writes — a concurrent revocation could land between and the join would overwrite it back to accepted (**a revoked invite admitting the member**). The store gains `claimMembership` (atomic: the invite flips pending→accepted and the membership inserts together, conditional on the invite still being 'pending' — a concurrent revocation wins and the join refuses). SQL adapter law: one `UPDATE … WHERE status = 'pending'` + INSERT inside the transaction.
2. **Org/invite/audit ids use `randomUUID`** and the join code is cryptographically random (the `Math.random` code was a guessable authorization artifact).
3. **Two tests were silently relying on the accidental counter-id collision across service instances** (the timed expiry test passed service 1's orgId to service 2 — with counter ids `org_1` existed in both stores; with UUID ids the org is legitimately unknown). The tests now create and use their own org honestly.

## Re-integration settlement (old-base branch)

The 36-commit stack bases on an old dev generation. Merging dev `c260894e` brought the newer families, but dev's newest `domain-check.mjs` references suites this tree legitimately predates (invitations sources + the prisma `institutionApproval` model + provision-check). The branch's own registered battery (59 tests) runs green exit 0 with PostgreSQL; after Codex merges the corrected per-task branches into dev, dev's newest domain-check governs the full battery.

## Review finding (verified, no further defect)

ROLE checks (members refuse admin actions with `not_org_admin`; unknown org denies uniformly `not_owner` — no existence leak); admin-only role changes (owner role immutable); approved-curriculum publication (unapproved refuses; approval records the named approver; members read published only); scoped audited admin actions.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Organization suite (ROLE-06's own acceptance) | `node --test backend/tests/contracts/organization/organization.test.mjs` (after `npx tsc -p tsconfig.organization.json`, exit 0) | **6/6 pass** |
| Data contracts (branch's registered battery) | `npm run data:check` | **exit 0 — 59/59 green with PostgreSQL** |
| Product check gate | `npm run check` | **exit 0 — 741 ok lines on this branch's generation** |
| Live journey | in-app browser (2026-11-12) | **all four stages green** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-12)

Pricing renders; register renders all three reviewed methods; the email-entry step renders on click; the protected-route guard renders in-place with the Create-account link preserving the full `returnTo` deep link. Credential step founder-gated as always.
