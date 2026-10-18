# KAN-161 review and rollout handoff

Jira: [KAN-161](https://visionary-team.atlassian.net/browse/KAN-161). Scope: current account-directory connected foundation and finalized account ownership contract; future domain/provider/hosted acceptance remains open.

Implementer: Codex. Separate reviewer: account_structure_review agent; decision pending. Worker branch: `codex/codex-kan-161-account-structure`. Base/current accepted dev: `f92495eadba3a07b17adef73a70d43ac38dab547`. Implementation candidate: `075e082fc084261ab7fbacc30bade178361d92db`, pushed and remote-ref verified. Review/evidence-only commits must keep this implementation SHA explicit or record any replacement candidate.

Ownership: account directory/current-tree verifier, existing auth sign-in/account overview integration, related tests and maintenance command, USER_ACCOUNT_STORAGE, architecture/handoff/current-execution evidence and appended living-log entries. Existing UID/auth/billing/feedback foundation is reused. KAN-38/KAN-42 and domain/hosted gates remain open and are not prerequisites for an additive schema directory that claims no such functionality.

## Acceptance evidence

| Criterion | Evidence / state |
| --- | --- |
| One root UID across roles/devices with nested current activity | Existing sign-in regressions extended to assert per-UID directory isolation; 63 compiled backend tests pass |
| Current and future activity ownership understandable without fabricated activity | `account-directory.ts`, USER_ACCOUNT_STORAGE sixteen-section map and architecture review; separate source review pending |
| New/repeated verified login provisions/reuses directory atomically | Sign-in reads before writes; missing/conflicting/newer schema tests; 63 compiled backend tests pass |
| Wrong UID, foreign directory or unfinished account migration cannot be overwritten | Additive reconciliation and HTTP/service regressions; 63 compiled backend tests pass |
| Backfill preserves profile, billing and history and replay writes zero | Isolated transaction fixtures; actual live plan/apply/replay/readback waits for approval |
| Current-tree verifier catches real ownership/mirror/queue defects while ignoring historical legacy drift | Injected-defect fixtures; 63 compiled backend tests pass |
| Owner-only account overview retains authority and pagination | Existing HTTP test extended for schema directory; 63 compiled backend tests pass |
| Relevant environment/runtime isolation and provenance | Initial layout/import checks and eight product-runtime/provenance tests pass; SDK dependencies installing from component locks |

Frontend: no UI journey changes; existing consumers may ignore additive `structure`. API: existing owner-bound overview response gains schema metadata; no new endpoint or client grant. Data: one additional derived directory document under each existing root, plus atomic provisioning for future verified sign-ins. ML/jobs/cache/observation: N/A to metadata-only provisioning; no new model, provider, background job, cache or event channel. Current native activity paths and their authority are preserved.

## Verification and limitations

`node --check` passes for the new command and test. `product:verify-layout` and `product:verify-imports` pass at the task baseline. `node --test scripts/tests/backend-runtime.test.mjs scripts/tests/upstream-patches.test.mjs` passes 8/8 after source changes. Initial source-audit attempt could not load frontend TypeScript before component installation; no pass is claimed for that attempt. Backend build, focused service tests and post-install checks remain pending here.

No credential/.env is copied into this task checkout. Browser/provider testing is not new scope: founder confirmed normal localhost login recovered when the stopped auth backend was restarted before this task. Apple web-provider configuration remains incomplete. Domain implementations, live billing, hosted rollout, guardian-first admission, privacy/export implementations and real-person identity linking remain their accepted separate gates.

## Release/rollback sequence

1. Complete checks and separate exact-SHA review. Record actual decision and any replacement candidate.
2. Integrate only approved implementation/evidence into current dev, recheck and publish/verify remote.
3. Build the integrated backend. Inspect `node scripts/account-directory.cjs`; apply only the reviewed derived metadata; run `--verify` and a second inspect requiring zero changes. Preserve private evidence locally; publish counters only.
4. Confirm existing account/profile/billing/history data are byte/field-equivalent before/after except the added directory. Restart the existing product backend if needed; anonymous CSRF/authority smoke checks must pass.
5. Record actual integration, live counters and native Jira transition. Only then close and remove task/reviewer worktrees after preserving evidence. Do not promote main or infer hosted acceptance.

Rollback stops directory consumption/provisioning and retains the extra metadata. No record rename, reverse billing migration or deletion is needed. A foreign UID/newer schema stops reconciliation for investigation; it is never overwritten as a recovery shortcut.

Reviewer identity/decision/exact SHA: pending. Relevant verification: pending. Dev integration/publication: pending. Native Jira status at task start: In Progress (transition31, ownership comment10017). No Done or live rollout is claimed by this draft.


## Compiled verification checkpoint

Normal npm run backend:build passes at075e082fc084261ab7fbacc30bade178361d92db. Normal compiled node --test --test-concurrency=2 over firebase-admin/firebase-product/account-storage/account-directory/billing/feedback passes63/63,0fail in11.75seconds. Separate reviewer direct-source tests pass5/5 directory and26/26 unchanged auth/storage tests. Earlier build diagnosed an ambiguous transaction.get overload on an any-typed reference; the candidate now returns explicit DocumentReference. Earlier fullcheck correctly stopped on source-audit drift; regenerated inventory changes only three controller decorator line offsets and the controller hash, with all route/control/state counts unchanged. No earlier failed check is reported as passed.

Two implementation findings were corrected before this candidate: the queue revision is not current billing authority after Family mutations, and the corruption fixture must store independent event objects. The reviewer rechecked the replacements; written final decision remains pending.

Fresh npm ci operations were unusually slow and were explicitly interrupted, not counted as successful. Partial installations remain in ignored task artifacts/tmp/dependency-install-preserved. Both frontend/backend lock hashes equal the primary checkout; matching per-component dependencies are reused through task-local junctions without changing a lock, credential or primary source. Build outputs remain task-local. Cleanup must remove these links as links, never recurse into their primary targets.


## Full check receipt

At implementation075e082fc084261ab7fbacc30bade178361d92db, the complete npm run check exits0: layout/import integrity,18 script tests, unchanged68-route/1637-control/26-endpoint audit, frontend lint, both type configurations,532 frontend tests0fail and Vite production build29.14seconds. Normal backend build and63 compiled backend tests also pass. This supersedes the draft pending check states above. No hosted/provider/user-activity feature acceptance is inferred. Written separate review and live metadata reconciliation remain pending at this receipt.


## Separate acceptance receipt

account_structure_review independently approved exact implementation075e082fc084261ab7fbacc30bade178361d92db. The written decision is in KAN161_INDEPENDENT_REVIEW.md, published on its separate branch atcae90769732dcff26e6a1b0ea9b125a196c41dd0. Source/back-end verification passed; integrated/live/Jira receipts remain pending. This supersedes the draft reviewer-pending states above. Task headb983e612276573466abe4fa01cfe8e9e630be18c contains the approved runtime byte-identically plus review/evidence-only changes.


D-099 acceptance receipt: separate reviewer account_structure_review approves exact implementation075e082fc084261ab7fbacc30bade178361d92db. Checked integrated devfe20cb454e3d1383687ed50ef2b8de1f10b4602b is published/remote-verified; layout/import/audit/backend build pass and runtime sources equal the reviewed candidate. Actual live reconciliation writes1 derived directory under the existing UID; current-tree verification returns0 directory/ownership/record differences, and repeat plans0 writes. Pre/post in-memory comparison checks31 existing database records unchanged; only1 directory is added, with0 deletions/provider calls. Source-watch runtime restarts successfully; proxied CSRF200 and anonymous me/account overview401. Native Jira comment10019/transition51 actually returns Done for KAN-161 scoped hierarchy/metadata acceptance. Future domains/provider/guardian/privacy/hosted gates remain open; no main promotion. See tracking/kan161-account-directory-closeout.json and the independent delivery review. Worktree cleanup follows evidence publication.
