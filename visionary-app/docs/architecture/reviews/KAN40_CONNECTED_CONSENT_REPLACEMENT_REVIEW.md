# KAN-40 replacement source review

Independent reviewer: `/root/kan58_review`, 6 November 2026.

**Decision: SOURCE APPROVED for bounded dev integration at exact `5f5d4e68e993e23cc2b0a47f41c6faa67dee2b68`.** I accept responsibility for this source review. No unresolved source blocker remains in the accepted self-service scope described below. This decision supersedes the rejection of `c6928a2b` for this replacement only; the historical rejection and its executable probe remain preserved.

## Accepted scope and source

- Jira/source: KAN-40 / DATA-05, own-consent list/revoke UI/API and the owning-store consent delivery transaction boundary.
- Implementer branch: `codex/principal-kan-40-share-authority`.
- Exact reviewed and verified source: `5f5d4e68e993e23cc2b0a47f41c6faa67dee2b68`, pushed and remote-verified.
- Accepted dev comparison: `65dee5af76d0ccaa3ee7d8bf52155b64108ac13c`; actual dev integration remains pending.
- Reviewer checkout/branch: `qa-review-kan-40-connected-consent` / `codex/qa-review-kan-40-connected-consent`, created fresh from that dev and used only for this KAN-40 review.
- No new consent grant route, policy publication, institution admission, provider worker, private download activation or production release is accepted by this report. `DATA_CONSENT_ENABLED` remains default-off.

## Prior finding resolved

The replacement validates actual Firebase settings and pins the supported live identity realm to project `visionary-research` and the literal named Firestore database `default`. It rejects emulator identity, foreign projects and other database names before Prisma construction. It does not treat `(default)` as an alias for `default` or change the shared Firebase database provider.

It requires an explicit supported runtime/database mode and a valid nonproduction environment identity, derives the canonical environment/SQL target, and fingerprints that target, provider kind, role and connection binding. Cached repositories revalidate the binding, so a changed realm or a different valid target cannot reuse the prior SQL client.

`WorkspaceRepository.forConsentRuntime` binds the actual role/schema/database expectation. List, revoke and delivery transactions check the live PostgreSQL session before account/grant access, rejecting privileged/delegated roles, object ownership/control and migration-metadata write authority using the accepted DATA-03-style boundary. A configured role name alone is no longer treated as privilege proof.

The registered no-network test exercises invalid identity realms, missing environment identity and cached drift, plus positive pinned production/staging target construction. It records constructor/transaction counts with a sentinel; those cases do not contact any provider. The real SQL HTTP test now uses a scoped DML runtime role and proves rejection of the privileged fixture administrator, wrong schema and newly granted schema CREATE privilege, followed by recovery after revoking that privilege.

## Independent verification

I extracted the exact replacement's backend source/tests with `git archive` into an isolated local review directory. Dependencies were reused read-only from the already verified lock-matching backend cache; no install or Prisma generation occurred. The generated Prisma model was independently compared to the exact source and matched after whitespace/comment normalization.

To avoid an incomplete Windows full-typecheck preparation, the final runtime verification transpiled all **123 exact archived backend source files** with the source's compiler options into that archive's own output. Full TypeScript and normal registered checks are supplied by the independently verified exact-source GitHub CI below. An early setup attempt with missing dist output is not counted as a candidate test result; only the completed final runs are accepted.

| Verification | Result |
| --- | --- |
| Exact-source repository/PostgreSQL/real Nest HTTP suite | **23 passed, 0 failed** |
| Exact-source consent domain suite | **12 passed, 0 failed** |
| Independent consent client tests | **4 passed, 0 failed** on `c6928a2b`; the complete frontend tree is byte-unchanged in this replacement |
| Generated Prisma model versus exact replacement | Matched; shared generated output was not modified |
| [Exact-source CI 42162617516](https://github.com/ecohdeep786/New_Visionary/actions/runs/42162617516) | All checks succeeded, including normal root/data/image/infrastructure checks; production skipped |

The SQL/HTTP suite uses real PostgreSQL and the actual Nest controller/service/repository. Its account verifier is injected with synthetic identities; it is not Firebase-provider acceptance. It covers signed UID-bound pagination, foreign/expired/tampered cursor denial, expected-account mismatch, CSRF/Origin/command rejection, foreign grant denial, no-store responses, idempotent canonical revocation, audit/outbox counts and redacted outage responses. A separate connection verifies stored mutation and unaffected foreign data.

Actual race/rollback cases cover a delivery waiting behind revocation, expiry during an account-lock wait, delivery committed before a waiting revocation, callback write rollback, and expiry during a callback rolling back its writes. The canonical account lock precedes fresh time/consent evaluation; authorization is checked again after the callback before commit. The callback is an internal owning-store transaction seam, not permission to perform provider I/O or a claim that pending consumers already call it.

Inspected unchanged frontend code remains keyed per person, refuses switched-account receipts, bounds responses, reports unavailable/outage states, and distinguishes revoked consent from preservation of saved records or recall of already delivered content. No additional source finding was identified in these accepted paths.

## Environment, cleanup and retained evidence

- Runtime checks used only the validated loopback synthetic PostgreSQL target on port 55437, isolated per-suite schema and synthetic runtime role.
- Fixture schema/role cleanup completed. The PostgreSQL server was stopped in `finally`; `pg_ctl status` confirmed no server running.
- No Firebase account/profile, customer record, live Cloud SQL socket or object provider was accessed by the independent tests.
- Candidate source and shared dependencies/generated client were unchanged. Review outputs and exact source ZIP remain outside Git under `C:/Users/Administrator/Visionary-local/kan40-independent-review-20261106`.
- Accepted local logs: `5f5d4e68-repository-retry.log`, `5f5d4e68-domain.log`, `5f5d4e68-stop-retry.log`; exact client run `c6928a2b-client.log` with verified unchanged frontend source.
- Machine-readable result: [KAN40_REPLACEMENT_REVIEW_RESULTS.json](evidence/KAN40_REPLACEMENT_REVIEW_RESULTS.json).

## Integration and open acceptance

The integrator must finish the corrected-backend real-Firebase browser regression and publish/check the accepted dev integration. The implementer reported prior real-Firebase localhost self-service list/revoke/refetch on explicitly synthetic SQL rows; this reviewer did not independently repeat that browser session or certify a physical second device.

Full KAN-40 remains open for KAN-53/KAN-58 owning consumers, current consent/source authorization at actual final delivery, actual READY object authority, two-device/recovery and hosted acceptance. Existing KAN-58 source defects remain changes requested. Source approval of this bounded self-service replacement does not close those gates or justify full Jira Done.

No Jira transition, dev merge or production deployment was performed by this reviewer. Any later implementation changes or relevant integration conflict require renewed exact-source review.
