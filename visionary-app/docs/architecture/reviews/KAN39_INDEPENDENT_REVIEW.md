# KAN-39 independent product-boundary review

31 October 2026 (Asia/Calcutta). Jira/source: KAN-39 / DATA-04.

**Decision: CHANGES REQUESTED for exact candidate `a93cc508bb1a929247276bdd0a3a01c77e2cec6b`. Verification found reproducible permission/lifecycle defects. Do not merge this candidate or mark it Done. Return the issue to In Progress for repair and a new exact-SHA review.**

## Responsibility and scope

Implementer: DeepSeek, branch `codex/deepseek-kan-39-invitations`.
Independent reviewer/verifier: `/root/kan39_product_review`, separate from the implementer, explicitly accepting reviewer responsibility. The reviewer changed only this report and its independent probe; no candidate source, shared execution manifest, primary checkout, live record or Jira status was modified.

Review base: published `origin/dev f61292efaf6940ec1acc1751a61cb4a7dd17e66b`, fetched and verified before creating a fresh instance.
Reviewer checkout: `C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-39-invitation-authority`.
Reviewer branch: `codex/qa-review-kan-39-invitation-authority`, initially pushed and remotely verified at that base. Candidate source was inspected through Git and executed directly from the matching existing worker. The probe checks the worker HEAD and byte equality of all imported candidate modules against the exact Git blobs before import. No unreviewed candidate code is merged into the reviewer baseline or dev by this report.

Live Jira was Testing. Requirement: server-authorized, transactionally scoped invitations, verified organization/classroom roles and lifecycle history. D-090 also retains verified child/guardian/institution proof and existing admission guards; an invitation alone cannot activate a child. Latest implementer receipt 10223 and `KAN39_DDL_REVIEW.md` offer a disconnected domain enabler with an in-memory store and nine focused tests, while deferring durable SQL/controller cutover. Even that bounded enabler fails its one-time-token, revocation and recovery claims below.

## Blocking findings

| Finding | Exact source | Independently observed consequence |
| --- | --- | --- |
| R1 — P1: token consumption is not conditional or atomic | `invitation.service.ts:98-110`; `invitation-store.ts:42-47` | Two simultaneous `accept` calls with the same token and different authenticated UIDs both fulfill, create two memberships and append two acceptance events. The token is not one-time under concurrency. |
| R2 — P1: completed revocation can be overwritten by an in-flight acceptance | `invitation.service.ts:98-110,116-124` | Pause acceptance after its token lookup, complete authorized revoke, then resume acceptance: persisted state becomes accepted while revokedAt remains set, and the recipient gains membership. Recorded history is pending → revoked → accepted. |
| R3 — P1: acceptance is partially committed on a membership-write outage | `invitation.service.ts:107-110` | Inject failure at the actual store membership write. The token is already marked accepted, no membership or acceptance audit exists, and retry by the same UID fails `already_accepted`. No transaction/rollback or recoverable command receipt restores the operation. |
| R4 — P1: invitation acceptance overwrites existing authority | `invitation.service.ts:109`; `invitation-store.ts:55-58` | Existing sole OWNER accepts a MEMBER invitation and is replaced with MEMBER. OWNER and ADMIN authority disappear, and further invitation administration is denied. A membership-creation flow cannot silently perform a role change or remove the last owner. |

The store contract exposes independent reads, unconditional updates, membership writes and event append. It has no atomic consume-and-grant transaction, expected-state compare-and-swap, conditional membership policy or combined receipt/audit boundary. A future SQL adapter cannot supply those guarantees merely by swapping this provider; the domain transaction contract must change.

A fifth probe records a further policy observation: removing the issuing OWNER's membership after issue does not prevent later acceptance. Resolve current issuer-authority and institution/guardian proof requirements before cutover, and exercise the chosen rule transactionally. This observation is not used as a standalone blocking finding because the exact lifecycle policy requires an explicit accepted decision.

## Executed evidence

Environment: Windows, Node `v24.19.0`; synthetic UIDs/workspace/email only. No dependency install, cloud service, private account, credentials, paid resource or runtime configuration was used.

Probe: [KAN39_INDEPENDENT_PROBES.mjs](evidence/KAN39_INDEPENDENT_PROBES.mjs). It imports the actual candidate `InvitationService` and `InMemoryInvitationStore` through Node's TypeScript transform. It does not copy the business logic. The revoke race subclasses only the real store's token read to control scheduling; the outage probe changes only that fixture instance's membership write.

```powershell
$env:KAN39_SOURCE_ROOT='C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/deepseek-kan-39-invitations/visionary-app'
node --experimental-transform-types --test docs/architecture/reviews/evidence/KAN39_INDEPENDENT_PROBES.mjs
```

Actual result: exit 0; **five reproductions passed, zero failed/skipped/cancelled**, 6.191 seconds overall. Passing assertions deliberately establish the unsafe outcomes; this is a failed product review, not five acceptance tests passing. Node emitted its ordinary experimental-transform/module-format warnings.

Reviewer baseline `node scripts/verify-layout.mjs`: exit 0.
Reviewer baseline `node scripts/verify-imports.mjs`: exit 0; 3,842 imported files, four retained upstream patches / 11 changed files. These checks establish preservation of the fresh review baseline, not correctness or provenance acceptance of the unmerged candidate.

The candidate's nine supplied tests were inspected, not claimed as an independently rerun full suite. They exercise sequential in-memory outcomes, without concurrent acceptance, revoke races, interrupted writes or owner preservation. Candidate `scripts/check.mjs` does not register DATA-04; the candidate changes no package/CI registration. A focused pass therefore does not demonstrate that normal verification executes this suite.

## Product application and repair sequence

1. Rebase/reconcile this one task onto latest accepted dev and consume the accepted real workspace repository/migration foundations. Preserve the existing auth/account/billing/admission behavior and the unmerged worker evidence.
2. Define an owning-store invitation operation that atomically rechecks current authority, token status/expiry/revocation and permitted institution/guardian proof, conditionally consumes the token, creates only an eligible membership, and records audit/receipt/outbox together. Decide same-UID replay/recovery semantics explicitly; changed-UID or changed-payload replay must never grant another membership.
3. Preserve existing membership/OWNER authority; separate role-change/owner-transfer operations with their own authorization and last-owner rules. Test wrong workspace/UID/role and denial preservation.
4. Implement the durable PostgreSQL adapter and real positive/deny/concurrent/revoke/outage/rollback/replay tests against it. Register them fail-fast in relevant normal commands and required CI. Repair the four reproductions as safety assertions, rather than deleting their scenarios.
5. Compile and verify the actual controller with authentication, Origin/CSRF, expected account, runtime input bounds, stable error responses, rate limits and authority/request-limit inventories before activation. Prove frontend Connections/classroom/organization adapters and independent-device recovery only when those connected prerequisites are accepted.
6. Submit the new exact SHA for independent review; integrate accepted scope, verify the published dev result and record an actual Jira transition. Hosted/email/provider/privacy/admission/release outcomes keep their own gates.

Current boundary trace: frontend unchanged; API controller/module are present but disconnected from `FirebaseProductModule`; backend service executed by the probes; data is an in-memory synthetic store with no durable SQL adapter in this candidate; jobs/ML/cache are not involved; no connected device or hosted outcome was demonstrated.

KAN-93, KAN-96 and KAN-169 must not treat this rejected invitation candidate as accepted permission readiness. Main promotion, deployment, full DATA-04 completion and completed-worktree cleanup are not eligible. The integrator owns the Jira comment/transition and any task-execution receipt update; this reviewer has performed neither.
