# KAN-29 exact-SHA production compatibility review

20 October 2026. Reviewer: `/root/kan29_current_review`, separate from implementing agent `/root`.

**Decision: approved for technical compatibility scope only.** Exact source: `0935365bc98ebccf6cc36e502c446a90777f9c31` on `codex/codex-kan-29-coverage-matrix`. No blocking defect was found in this compatibility checkpoint. KAN-29 as a whole is **not accepted**, must not be moved to Done, and is not approved for dev/main integration or production deployment while its full source/category/language acceptance remains outstanding.

## Scope and source comparison

The candidate merges the existing interrupted KAN-29 checkpoint `70decb67af74b2f29b00c614b078128bb0614dc3` with accepted dev `e089319a24953bcadb522fcfef0e795065dd0c29`. I resumed the clean matching reviewer checkout `qa-review-kan-29-coverage`, preserving its older reports, and merged this exact source. Before adding this report, `git diff --exit-code 0935365b -- .` passed: the review checkout's product source tree was identical to the candidate.

- The production entrypoint, platform HTTP implementation, product TypeScript config, Dockerfile/ignore, GCP README, runtime dependency lock and production HTTP regressions are byte-equivalent to accepted dev. The obsolete task HTTP duplicate is removed. Coverage is transitively included through AccountController -> coverage repository -> policy; the production check explicitly includes the matching six coverage regressions and refuses incomplete source/test scope.
- The old manual publisher is an unconditional nonzero refusal, with no cloud command. Its regression calls the compatibility entrypoint with source/config arguments and instrumented fake gcloud/docker tools, asserting no tool invocation. Current budget metadata names `visionary-research` / `174851137514`, `asia-south1` and `https://visionary.org.in`, acknowledges the load-balancer base cost and keeps the coverage candidate not deployed. Main-only workflow/WIF/deployment boundaries are retained unchanged.
- I independently compared all seven normalized source anchors. The changed inventory digest corresponds only to the hosted-release gap and deployment evidence. Role/category/locale/selector/authority semantics are unchanged; the other six producer/consumer source files are byte-equivalent to the previous candidate. Both independent checker pin and matrix pin match the inspected new inventory. Candidate status, zero released slices, null founder acceptance and non-authorizing boundaries are preserved.
- A script verified each append-only STATUS/QA/DECISIONS file is exactly the common merge base followed by the previous candidate's appended bytes and accepted dev's appended bytes. Neither history was dropped or rewritten.
- Coverage Firestore paths are valid document paths. I instantiated the installed deployed SDK offline and validated account, current-publication and revision/slice document shapes without credentials, transactions or network calls. Existing immutable exact tuple hashing uses JSON serialization, and coverage reads retain UID/profile/catalog/Origin/CSRF/admission/linked-role/source-version-language-script-device boundaries. Missing policy and database outage remain distinct; reads do not mutate learner records or grant learning execution authority.

## Verification and attribution

Independently executed in the reviewer checkout on the exact candidate source:

| Check | Result |
| --- | --- |
| Node coverage contract/negative/mutation tests plus retired publisher regression | 13/13 pass, zero skipped/failed |
| `npm run coverage:check` | Pass: five roles, nine categories, three interface locales, seven anchors, zero released slices |
| `npm run scope:audit` | Pass: 68 routes, 28 registered endpoints, 1647 control declarations, 220 control files; per-control hosted acceptance remains false |
| Accepted platform source equivalence, six unchanged anchors, exact history-tail preservation | Pass |
| Installed deployed Firestore SDK path validation | Pass, offline and no database operation |

I inspected the implementing agent's actual local logs and fixture receipt under its ignored `artifacts/qa/kan29/`, rather than claiming to rerun these longer suites myself:

- `rebase-root-check.log`: exit 0; 31 script and 537 frontend tests, zero failures; layout/import checks, lint, type checks and frontend build pass (111 seconds).
- `rebase-backend-check.log`: backend build and 79 tests pass.
- `rebase-production-check.log`: isolated product and test TypeScript compilations using the deployed dependency lock and all 71 tests pass, zero failures/skips (20.124 seconds). Runtime installation completed independently from the upstream backend environment; implementer reports runtime audit exit 0, four moderate and zero high/critical findings.
- `rebase-infra-check.log`: 22 Node and 11 Python infrastructure tests pass.
- `browser/receipt.json` and `rebase-browser-check.log`: five actual loopback Learn/API/synthetic-store scenario groups pass, including all nine visible categories, outage/retry recovery, Hindi/Bengali interface locales, 390px layout and role-specific restrictions; no live credentials or provider calls.

Linux PR checks may supply additional evidence. This review does not claim a new image build, container execution or deployment for this candidate. The accepted KAN-162 image/release receipts remain attributed to their own exact source.

## Acceptance and integration limits

Live Jira KAN-29 was read during review. Its requirement retains all exposed categories and real source acceptance. The existing contract still contains `releasedSlices: []`, `founderAcceptance: null` and `runtimeAuthorization: false`. A response of “okay” supplies no source package, edition, rights or accountable acceptance. Previous hosted KAN-29 evidence came from the former project and is historical; it does not qualify this candidate in current production. Hosting/pipeline acceptance for KAN-162 does not qualify learning sources, providers, linked-role/guardian admission, privacy, commercial use, speech/offline/native delivery or the full release matrix.

No current production resource, user record, Jira status or dev/main ref was changed by this review. There is no accepted dev integration SHA for KAN-29 and no full-task Done/cleanup approval. Keep the unfinished task/reviewer worktrees until their scope is actually accepted, required hosted checks pass, checked integration is published, and Jira returns Done. Any later runtime, conflict-resolution or shared-contract change requires a new exact-SHA review; an evidence-only follow-up must retain this reviewed implementation SHA explicitly.
