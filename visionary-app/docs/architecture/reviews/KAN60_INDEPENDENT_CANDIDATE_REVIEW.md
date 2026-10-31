# KAN-60 independent review of competing catalogue candidates

31 October 2026 (Asia/Calcutta). Jira/source: KAN-60 / CONTENT-01.

**Decision: changes requested. Neither exact candidate is approved for dev integration or Done.** Six defects were independently reproduced against each candidate's actual TypeScript service and store. Principal's 11 submitted tests and DeepSeek's eight submitted tests all pass despite these defects. Existing product runtime is unaffected because neither catalogue implementation is wired into it.

## Responsibility, scope and exact revisions

Independent reviewer `/root/kan38_final_review` explicitly accepts reviewer responsibility, separate from principal/DeepSeek implementers. Reviewer owns this report and [reproduction runner](evidence/KAN60_CANDIDATE_PROBES.cjs) only; no implementation source, worker checkout, protected account, cloud service, dev branch or Jira status was changed.

| Candidate | Exact revision | Branch | Role in current review |
| --- | --- | --- | --- |
| Principal | `8316a3b0e7b1353f61737b8b50a5ec370c00576a` | `codex/principal-kan-60-content-catalog` | Current submitted candidate, live Jira comment 10261 |
| DeepSeek | `18d6ec4c1ca6b8be56399a15431a805830a1d57c` | `codex/deepseek-kan-60-content-catalog` | Explicitly superseded archive; independently compared, not an alternative to merge |

Fresh review instance: `C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-60-catalog-candidates`, branch `codex/qa-review-kan-60-catalog-candidates`, created from then-latest verified `origin/dev` `f61292efaf6940ec1acc1751a61cb4a7dd17e66b`; initial branch push and remote SHA verified. Live Jira read showed Testing; review claim comment 10473 records exact ownership/base/candidates. This review does not transition the issue.

The live requirement is stable curriculum/book/chapter/topic/concept identities and provenance/rights/ownership/category/authored-language metadata, with authorized supported published versions for learners. The parent P04 requirement still lists P01/P03 phase prerequisites, even though no native incoming Blocks link appears on this individual issue. An empty task-level `blockedBy` list does not accept all data/file/policy foundations or qualify content rights.

## Reproduced findings

All six reproductions use the exact service/store source read through `git show` from each revision, compiled independently into ignored reviewer artifacts. They do not implement a second catalogue or simulate the expected decision in a fixture.

1. **R1 — distinct sibling content collapses into one identity.** `CatalogService.derivePublicId` hashes only `kind|parentId|provider|edition`. Two distinct chapters, "Chapter 1: integers" and "Chapter 2: fractions", under the same synthetic book/provider/edition receive the same public ID. The second `register` returns the first chapter unchanged and `children(book)` contains one node. The same missing identity component affects books/topics/concepts and root curricula sharing the same provider/edition. Add an immutable publisher/source node identifier, separately from editable titles and metadata, and bind retries to the intended identity/payload. Prove multiple siblings, rename stability and duplicate/changed registration behavior.

2. **R2 — rejected ancestor sources do not block child retrieval.** Publish an approved synthetic curriculum and book, then call actual `rejectSource` on the curriculum. `lineage(book)` confirms its parent source is rejected, but `eligibleForRetrieval(book)` returns `{ok:true, reason:'ok'}`. The method checks publication/visibility on every ancestor but source approval only on `self`. Recheck the relevant source/version eligibility through the full lineage and deny pending/rejected/withdrawn ancestor versions. Test this after source-version changes as well as initial publication.

3. **R3 — metadata updates bypass approval and publication transitions.** The actual `CatalogPatch` includes `source`, `rights` and `publication`; `updateMetadata` forwards it directly to store `update`. A newly registered private/pending curriculum accepts a typed metadata patch setting source approval to `released`, visibility to `public` and publication to `published`; retrieval becomes eligible without `approveSource` or `publish`. Use a separate restrictive metadata DTO and runtime allowlist. Keep review/publication transitions in explicit commands with current version/revision checks. TypeScript types alone do not sanitize an HTTP payload.

4. **R4 — the supposedly immutable owner can be replaced through metadata.** A typed `rights` patch changes `ownerUid` from `owner` to `other-owner`. The new owner then successfully changes the node using actual `updateMetadata`; the old owner no longer controls it. Although the outer identity keys are omitted from `CatalogPatch`, the nested owner is included through `rights`. Preserve owner/provenance identity at the store write boundary; any intended transfer needs its own reviewed authorization and atomic protocol.

5. **R5 — concurrent foreign-owner registration overwrites ownership.** Two first registrations for the same derived identity, from different owners, both succeed and the second insert replaces the first owner's row. To make the interleaving deterministic for both hash implementations, the probe holds the two real missing-row reads at a barrier before either real insert. It preserves the candidate's service and `Map.set` write logic. The store exposes no atomic insert-if-absent/conflict result; principal's added read after insert does not repair admission. Use an atomic unique insert/re-read protocol that verifies the winning identity/owner and returns denial/conflict to a foreign claimant; prove it against the actual durable adapter when supplied.

6. **R6 — a foreign caller can attach content beneath another owner's private parent.** `register` validates the parent's existence and kind but no owner/grant/workspace authority. A second synthetic owner registers a book under the first owner's private curriculum successfully. Define and enforce current parent-authoring authority at registration, rather than treating a known parent ID as permission. Caller-supplied `ownerUid` is not an authenticated actor. No currently registered controller supplies a trusted actor/context to this service.

R1–R5 violate the candidate's own bounded enabler claims; deferring HTTP/SQL cutover cannot make these service/store outcomes acceptable. R6 and server actor derivation must be resolved before an authoring adapter is exposed. These are local reproductions, not claims that a deployed endpoint currently exposes the defects.

## Competing branches and actual product use

The branches share ancestor `65045d72976b629336a150fa18aa32d73537a3bd` but are not equivalent integration candidates. Principal adds seven files/changes from dev and explicitly says it supersedes DeepSeek. DeepSeek's branch carries the unaccepted KAN-53/54/55/56/57/59 chain: 33 files and 3,524 inserted lines from the inspected dev, including outbox/jobs/uploads/manifests/security. Merging that archive would include unrelated unapproved scopes.

Principal replaces WebCrypto hashing with `node:crypto`, adds same-source-version retry behavior, reads the stored row after insert and extends its tests from eight to 11. The identity recipe, broad metadata patch, ancestor approval omission, caller owner model and in-memory store remain common to both. The six defects reproduced on both exact revisions; the old branch is not a repair.

Only `InMemoryCatalogStore` implements the catalogue store in the submitted scope. Its `Map` disappears with the process, returns mutable object references and uses unconditional `set` for inserts. There is no submitted SQL adapter, content-node/source-version/publication schema migration, transaction receipt/outbox integration or restart/cold-read test. Comments about a Cloud SQL adapter/unique row describe future work. The candidate has no registered Nest controller/module or import from the current product module; source search finds `CatalogService` only in its own implementation within product source. No frontend catalogue facade is connected to it. Thus the work is executable domain scaffolding with real service tests, not a working catalogue in the product.

The content tests are also absent from normal required registration: root `check`, `production-check` and required CI have no `data-content` step, and `scripts/domain-check.mjs` enumerates only `data-01` and `data-02` tests. `tsconfig.data.json` includes `src/content/**` for compilation, but compilation alone does not execute these tests. Add a fail-fast registered content suite and demonstrate that a deliberate failing assertion stops the normal command before acceptance.

## Commands and retained verification

Command, from this review instance: `node docs/architecture/reviews/evidence/KAN60_CANDIDATE_PROBES.cjs`. The optional first argument is an absolute installed TypeScript compiler path. The checked runner defaults to the existing primary backend compiler and uses its `@types` read-only; no dependency junction, install, generated Prisma client, credentials or live data were copied. It writes only beneath ignored `artifacts/qa/kan60-candidate-review/{principal,deepseek}` after reading exact Git blobs.

| Independent verification | Result |
| --- | --- |
| Exact principal content source strict TypeScript compile | Passed, no diagnostics; actual service/store/types/index |
| Principal submitted suite on that separately emitted source | 11 passed, zero failed |
| Principal defect reproductions | All six reproduced |
| Exact DeepSeek content source strict TypeScript compile | Passed, no diagnostics; actual service/store/types/index |
| DeepSeek submitted suite on that separately emitted source | Eight passed, zero failed |
| DeepSeek defect reproductions | All six reproduced |
| Review baseline layout | Passed |
| Review baseline upstream provenance | Passed: 3,842 baseline files, four recorded patches/11 changed files |

The runner exits 0 when its assertions have successfully reproduced the defects. That exit is not product acceptance. Per-candidate `official-suite.log` and `reproductions.json` retain counts, compiler version and source SHA-256 values locally; the published runner makes the reproductions inspectable and repeatable without committing emitted source or generated artifacts.

An initial reviewer harness attempt had an incorrect external Node type-root path and was corrected before the successful strict compilations. An initial naturally scheduled race denied DeepSeek's second claimant; the final explicit two-missing-read barrier reproduced the valid adverse interleaving on both candidates. Neither harness setup failure is counted as successful verification. Full frontend/data/hosted checks were not run after the blocking service defects were confirmed, and no broad CI or runtime acceptance is inferred.

## Required next action and release boundary

Return KAN-60 to In Progress for repair. Keep the DeepSeek archive preserved and unmerged. Repair in a single clearly owned KAN-60 task instance from current accepted dev, preserving the exact rejected submissions/review history. Resolve R1–R5 at the real service/store boundaries, define parent/actor authority for R6, register meaningful tests and make the handoff honest about implemented persistence/runtime scope. Submit the new exact candidate for separate review; this report supplies no approval for later commits.

No dev integration, native Jira transition or production change was performed by this reviewer. Canonical source identity/rights, durable owning-store acceptance, connected catalogue API/frontend, source withdrawal/cache/retrieval/ML behavior, two-device recovery and hosted/provider/privacy/release gates remain open. KAN-144 and other dependent product/model tasks must not treat either Testing candidate as accepted content foundations.
