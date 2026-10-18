# KAN-161 independent review

- Jira/source: KAN-161 / ACCOUNT-DIRECTORY-01. Live issue read on 18 October 2026: In Progress; source receipt agrees.
- Acceptance scope: account-organization enabler and connected local metadata provisioning. Future domain, provider, payment, privacy and hosted gates remain open.
- Implementer: Codex (/root).
- Reviewer: account_structure_review, a separate agent. I accept responsibility for this source review and the checks explicitly attributed to me.
- Implementation branch: codex/codex-kan-161-account-structure.
- Verified base/current origin/dev at review start: f92495eadba3a07b17adef73a70d43ac38dab547.
- Exact reviewed implementation: 902d56454d88cf29063dc5db44ff3f145ff02f75.
- Reviewer branch: codex/qa-review-kan-161-account-structure, created fresh from verified origin/dev and fast-forwarded to the candidate; remote ref verified at that candidate.
- Reviewer checkout: C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-161-account-structure/visionary-app (sparse checkout).
- Owned review file: this document only. No implementation, production configuration, credentials or live data changed.

## Decision for 902d56454d88cf29063dc5db44ff3f145ff02f75

**Changes requested — P2.** The new current-tree verifier incorrectly treats queue revision equality as a storage invariant. `account-tree-verifier.ts` checks queue.revision === billing.revision whenever billing is due. Existing accepted Family membership operations (`BillingService.acceptFamily`, `removeFamily`, `leaveFamily`) increment the owner billing revision without updating the queue. They preserve nextSyncAt, and the scheduled reader uses the UID and due time, not revision. A consistent, quiet current tree therefore reports recordDifferences after normal Family activity. This is persistent until another billing update, not a concurrent-read artifact.

Independent reproduction used the reviewed TypeScript source through a TypeScript transpile hook, existing locked SDK libraries from the primary checkout, and the candidate billing-memory fixture. No Admin initialization, network or .env loading occurred. A UID-consistent root/directory/billing/queue fixture reports zero differences. Applying the exact revision/family-members change produced by the existing Family writer produces recordDifferences: 1, with all other counters unchanged. Command exit 0 (reproduction succeeded), 18 October 2026. Fix the check to match the actual queue contract and add a regression for accepted Family mutations; rejecting a foreign UID, different due time and genuinely impossible queue version should remain covered as appropriate.

## Source and contract assessment

- The sixteen-section directory is a schema locator. It distinguishes connected native stores from future not-connected domain-service links. It creates no future records, memberships, entitlements or activity. This matches the accepted task scope and preserves D-075 cross-store ownership.
- Directory paths are derived from a validated UID and stay under its account root. Overview identity comes from reverified session authority and matching account header, not a client-supplied directory UID.
- New/repeated verified sign-in reads directory before writes and provisions it within the existing account/billing/device/event transaction. Foreign directory ownership and newer versions fail closed. Admission and unverified-email rules remain intact.
- Reconcile reads root/directory transactionally, rejects inconsistent identity/version/migration state, and writes only the regenerable structure/account document. It leaves billing, profile, onboarding, history and shared records untouched. Inspect is read-only; unchanged replay writes nothing.
- Current mirror checks deliberately avoid historical billing equality. Read-only multipage verification requires a quiet snapshot/retry; it is not a global transaction or release gate.
- Scope explicitly excludes provider/payment operations, deleting retained legacy evidence, future domain implementation, main promotion and hosted release.

## Evidence and remaining verification

- Reviewer: live Jira KAN-161 and local task receipt inspected; mandatory repository documents and TASK_REVIEW_TEMPLATE read.
- Reviewer: full candidate diff and surrounding auth, account authority/storage/migration, billing Family/queue/invoice and feedback writers inspected.
- Reviewer: `git diff --check f92495eadba3a07b17adef73a70d43ac38dab547 902d56454d88cf29063dc5db44ff3f145ff02f75`, exit 0.
- Reviewer: `node --check scripts/account-directory.cjs`, exit 0.
- Reviewer: independent pure-memory queue revision reproduction, exit 0, demonstrated finding above.
- Implementer build/module/service/HTTP checks are in progress; no pass is assumed or certified here.
- Frontend -> API -> backend -> data: overview source authority inspected; applicable module/HTTP checks pending. Jobs: due-queue source inspected and finding identified. ML/cache: N/A for derived account directory. Device/session preservation: source inspected; tests pending.
- Hosted verification: N/A to this source enabler; no hosted release approval given. Live additive metadata plan/apply/replay/readback remains pending and must follow corrected exact-SHA source approval and tests.
- Rollback: stop reading/provisioning the additive directory; preserve stored metadata and existing record paths.
- Verification result: failed for current-tree verifier correctness; other claimed runtime results pending.
- Dev integration/checks and Jira transition receipt: pending, not performed by this reviewer.
- Dependent implementation: not accepted; keep this task awaiting correction/review and retain other task prerequisites.

## Replacement candidate aab4568efdabfc55b903385a23bf06477f5cf7d5

The implementer removed the non-authoritative queue revision comparison and retained UID/due-time checks. The new regression invokes the real BillingService.leaveFamily transaction; it verifies billing revision 9 with queue revision 8 remains valid. Source review accepts that fix for the original P2.

Independent verification command, 18 October 2026:

```text
node --require ./artifacts/qa/review-ts-preloader.cjs --test backend/tests/account-directory.test.cjs backend/tests/account-storage.test.cjs backend/tests/firebase-product.test.cjs
```

The ignored reviewer preloader uses the baseline locked TypeScript/SDK runtime from the primary checkout, loads the exact reviewed task TypeScript in memory and maps test dist imports to that source. It initializes no Admin provider and reads no .env or credentials. This is direct reviewed-source functional verification, not a Nest build/typecheck claim.

Result: exit 1, 31 tests, 30 passed, 1 failed, 60.45 seconds. All account-storage service/HTTP and auth service/HTTP tests passed, as did the real Family departure regression. The sole failure is the combined injected-defects assertion `failed.recordDifferences >= 3` in account-directory.test.cjs. Fixture construction stores the same event object in both global and nested maps; mutating nested type also changes the supposed comparison source. Clone the second stored event so the intended third corruption actually exists. This is a test fixture defect rather than a source-verifier defect, but the failing required check still prevents approval.

Reviewer decision for aab4568efdabfc55b903385a23bf06477f5cf7d5: **changes requested** pending corrected exact candidate and passing checks. `git diff --check` exit 0 on this replacement. No live reconciliation or dev integration authorized by this report yet.

## Corrected candidate f28c4d088c21884a8169e9e66648f79b692c4c53

The only change from aab4568efdabfc55b903385a23bf06477f5cf7d5 is cloning the nested test event. I reviewed that exact change and reran the affected directory suite against reviewed TypeScript:

```text
node --require ./artifacts/qa/review-ts-preloader.cjs --test backend/tests/account-directory.test.cjs
```

Result: exit 0, 5 tests passed, 0 failed, 11.98 seconds, 18 October 2026. Together with the unchanged account-storage/auth suites already independently passing (26 tests), all 31 relevant reviewer checks now pass. The affected rerun covers additive/replay preservation, wrong ownership/newer schema rejection, current mirror defects and actual Family departure. `git diff --check` passes for the full corrected candidate. The reviewer branch differs from the exact implementation only by this review document.

There are no remaining actionable source findings. Normal backend build/test evidence remains pending at this checkpoint, so the final approval decision is recorded only after that evidence below.

## Final source review — approved exact implementation 075e082fc084261ab7fbacc30bade178361d92db

18 October 2026. Reviewer: account_structure_review, separate from implementer Codex. **Approved for the KAN-161 account hierarchy/directory and backend maintenance scope.** Both earlier findings are resolved. This decision covers only this exact implementation commit and the accepted scope; it does not complete future domain features or certify a hosted release.

The changes since f28c4d088c21884a8169e9e66648f79b692c4c53 are a type-only DocumentReference annotation fixing TypeScript transaction overload inference and generated source-audit decorator offsets/controller hash. I inspected this entire delta. I independently verified the controller SHA-256 against product-surface.json and checked decorators at lines 14, 30 and 43. The annotation changes no runtime behavior. Full candidate diff check exits 0.

Normal compiled verification reported by the implementer on this exact candidate, following the reviewer's independent direct-source checks above:

- `npm run backend:build`: exit 0.
- `node --test --test-concurrency=2 backend/tests/firebase-admin.test.cjs backend/tests/firebase-product.test.cjs backend/tests/account-storage.test.cjs backend/tests/account-directory.test.cjs backend/tests/billing.test.cjs backend/tests/feedback.test.cjs`: exit 0; 63 tests passed, 0 failed; 11.75 seconds. This includes the five directory tests through ordinary compiled output, positive/replay/failure and owner isolation, account/storage HTTP authority, preserved billing/Family behavior and feedback regression coverage.
- Root `npm run check` so far: layout/import integrity, 18 script regression tests and regenerated unchanged-count product surface audit passed. Frontend lint/typecheck/test/build remain pending at the time of this source approval and must pass before accepting/publishing dev integration.
- The implementer reports unchanged lock hashes verified before reusing corresponding baseline per-component dependency directories through junctions after a slow fresh-install attempt. Build output and reviewed sources belong to the task checkout. Production environment configuration was not copied.

Verification result: **passed for exact-source/backend scope**, using independent direct-source functional checks plus inspected normal build/test evidence. No remaining actionable source findings. The canonical directory is an ownership/location schema, not activity or a permission grant. The additive reconciler changes only derived directory metadata; UID, profile, billing, history and domain authorities retain their existing paths and semantics. Current-tree checks now match actual billing queue scheduling semantics.

Dev integration and remaining release/operational gates: pending and not certified by this approval. Complete the root check, compare exact approved source against current dev, check/publish the integrated result and record actual Jira receipts. Only then proceed with the scoped live read-only plan, additive directory apply, zero-write replay and current-tree readback; preserve no-deletion/no-provider-operation constraints. Live evidence has not been executed or claimed by this reviewer. Keep Jira Testing until relevant integrated verification and native Done criteria are satisfied. KAN-38/KAN-42 and other future domain/provider/privacy/hosted prerequisites remain open and receive no acceptance from this review.

Rollback remains stopping directory reads/provisioning while preserving additive metadata and existing owning records. No reverse migration is needed. Later implementation changes require renewed exact-SHA review.
