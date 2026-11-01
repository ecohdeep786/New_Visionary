# KAN-37 deadline repair independent review

1 November 2026 (Asia/Calcutta). Jira/source: KAN-37 / DATA-02.

**Final scoped reviewer decision: approved at exact evidence candidate `55e7bb25a5ff7decc7f4c3fc1bfd0b31b94b3828`, subject to successful final-head CI before merge and accepted published dev integration/checks before scoped Done.** Runtime/test source remains exact `6b40d420d651e8b4dd9c6e2ad26a3ddc01c91b1e`. The original `0278ee93` checkpoint below retains its changes-requested decision and failed local check. Later sections record replacement and final evidence acceptance; no hosted, broader feature or release approval follows.

## Responsibility and review instance

Reviewer `/root/kan38_final_review` explicitly accepts separate review responsibility; implementer is Codex `/root`. Reviewer owns this report and its two review-only probe files. No worker implementation, production account, schema policy, provider service, dev merge or Jira status was changed by the reviewer.

Fresh review checkout: `C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-37-deadline-rework`, branch `codex/qa-review-kan-37-deadline-rework`, created from independently verified `origin/dev` `3aa0d91957b31f44ca708f5af6b1a09515cd4f48`. Initial branch push and remote SHA were verified before fast-forwarding the exact candidate. Jira Testing and candidate worker remote were independently read; reviewer claim is comment 10521.

The review checkout compiled its own `dist` with `tsconfig.data.json`. Its backend dependency junction points to the existing read-only cache at `C:/Users/Administrator/Visionary-local/visionary-dependency-cache/kan33-locked-20261031/backend/node_modules`; both source package-lock and installed package-lock hashes matched the cache manifest before reuse. The implementer's full check had already completed Prisma client generation before the reviewer borrowed dependencies. No credentials were copied or printed. Only a disposable loopback synthetic PostgreSQL database was selected through memory-only environment configuration; fixture-owned random schemas/roles were cleaned by the fixture.

## Runtime assessment

The change repairs the existing store/runner rather than replacing migrations, schemas or product flows. One monotonic invocation deadline starts before identity checks; optional bounds propagate through identity, transaction admission, guarded SQL, work and final runtime privilege checks. Current bounds are checked after asynchronous identity resolution, after raw SQL results and immediately before commit admission. Small budgets reserve capped proportions instead of subtracting 1000/500 ms unconditionally, and the callback receives the store's remaining batch budget, retaining the 15-second transaction cap when the global invocation is longer.

The raw SQL guard recognizes the explicit PostgreSQL statement-timeout diagnostic, while explicit user cancellation and other SQL errors remain original errors. Selected Prisma transaction-expiry/admission diagnostics are classified separately. The commit-admission flag makes a deadline/cancellation after possible commit explicitly uncertain; cold retry reconciles durable checkpoint/deduplication state instead of claiming that a committed batch rolled back. Earlier committed batches remain durable. Migration-only default calls retain their existing 15-second policy and authority checks.

The reviewer found no additional runtime defect in this exact scope. Read-only authority/configuration queries may still finish after an outer caller has returned; checks prevent their late continuation from opening a migration transaction or submitting guarded writes. Writers must still use the supplied transaction; this repair cannot roll back arbitrary external side effects or forcibly interrupt synchronous JavaScript.

## Verification finding V1

The implementer's full local DATA check on exact `0278ee93` failed **48/49**, at `backfills.test.mjs` test "the configured SQL statement timeout reports a deadline and rolls back the batch". It expected `BACKFILL_DEADLINE_SQL`, but received the supported `BACKFILL_DEADLINE_TRANSACTION` classification. This is a retained failed verification, not a successful full local run. The independently inspected exact-candidate CI passed all 49.

The test configures a transaction/global budget, performs variable identity/setup work, then sleeps. A statement timeout established earlier can exceed the transaction's remaining time by the time that statement begins. The test therefore cannot promise which supported timer wins on a loaded host. Split the obligations: the long-work test must accept only the documented SQL/transaction deadline classes and still prove no committed rows plus cold recovery; a separate actual server-timeout case must deliberately leave ample enclosing time, assert the precise SQL deadline, verify checkpoint rollback and cold recovery. Keep the deterministic policy regression proving that the production 200 ms budget no longer becomes 1 ms, the original 200 ms test and the diagnostic preservation tests. This resolves test intent without accepting unrelated errors or extending the original deadline.

## Independent execution

| Review check | Actual result |
| --- | --- |
| Own exact-source `tsconfig.data.json` compile | Exit 0 |
| Submitted policy suite | 3/3 passed, explicitly inert Prisma interfaces |
| Original 200 ms hanging-source and new 200 ms setup/recovery tests | 2/2 passed against real PostgreSQL from reviewer source |
| Independent current-input/post-query/commit-uncertainty policy probes | 3/3 passed |
| Independent real PostgreSQL division error | Original SQLSTATE 22012 retained; prior target write rolled back; cold retry committed exactly one row |
| Independent real PostgreSQL user cancellation | Actual selected backend cancelled while `pg_sleep` was active; original user-request SQLSTATE 57014 retained; prior target write rolled back; cold retry committed exactly one row |
| Clean final independent probe rerun | 5/5 passed; `C:/Users/Administrator/Visionary-local/kan37-independent-review-20261101/independent-probes-final.log` |
| Independent emitted-implementation weakening | Three targeted assertions fail when post-identity guard, post-query result guard or commit-admission flag is removed; exact bytes restored in finally |
| Layout and imported-source provenance | Passed; 3,842 baseline files plus four patches/11 changed files |
| Exact-range whitespace | Passed with established CRLF policy |

The published [independent probes](evidence/KAN37_DEADLINE_INDEPENDENT_PROBES.cjs) execute actual separately emitted store/runner source. Their first three tests are policy-unit evidence, and their final two tests execute real isolated PostgreSQL. The [weakening runner](evidence/KAN37_DEADLINE_WEAKENING.cjs) changes only this review checkout's ignored emitted files temporarily, never product source or shared dependencies. An initial reviewer user-cancellation harness lacked the integer cast required by `pg_cancel_backend`; PostgreSQL returned 42883. The reviewer fixed that tooling-only query before the successful targeted and complete reruns; it is not counted as a candidate failure or pass.

The implementer's preserved old-store policy probe was inspected: it executes actual old store source with the new policy regression, fails its usable-budget assertion with exit 1, and leaves product files unchanged. That is deliberately labelled policy evidence. Prior real PostgreSQL 57014 and controlled setup failures remain separate before-fix evidence.

## CI and remaining gates

The reviewer independently read live [CI 41284013263](https://github.com/ecohdeep786/New_Visionary/actions/runs/41284013263), checks job `124781527038`, successful; production skipped. Its log identifies exact `0278ee93` rehearsed against accepted `3aa0d919`. It records scripts 82, contracts 35, schema cases 5, actual Learning HTTP 12, frontend-scope 6, frontend 625, DATA-01 20, DATA-02 49, provisioning 11, deployed backend 99 and deployed provisioning 11 passing, plus real migration/API image checks and infrastructure JS 31/Python 11. This does not erase the retained local 48/49 failure. The implementer's full product check separately reports exit 0 on exact `0278ee93`.

After V1 is repaired, review the exact replacement delta and its verification; preserve this checkpoint as history. Actual real-Firebase browser regression, final-head checks, accepted/published dev integration with integrated checks, native Jira Done and evidence/configuration-preserving worktree cleanup remain pending. No paid cloud development resource, hosted SQL/IAM acceptance, broader domain/source/role/privacy/model/two-device gate or main release is approved by this report. The reviewer backend dependency junction must eventually be removed as a link object without recursing into its cache target.

## Replacement V1 review — exact 6b40d420

**Decision: V1 resolved; source and test changes approved at exact `6b40d420d651e8b4dd9c6e2ad26a3ddc01c91b1e`.** This is a bounded source/test decision, pending final product/verification gates below. Reviewer responsibility and independence are unchanged.

The reviewer fetched the pushed replacement and merged it into the same clean matching reviewer task instance. Exact `0278ee93` to `6b40d420` changes only `backend/tests/contracts/data-02/backfills.test.mjs` and the existing rework handoff. Backend runtime, frontend and infrastructure source are byte-identical; the earlier independent compile, five probes and three production-guard weakening results remain applicable. Before this report update, the reviewer tree differed from the candidate only by the three preserved review/probe files. No implementer source was edited by the reviewer.

The long-SQL case now allows only the two documented deadline classifications and retains actual rollback/cold-retry assertions. A separate actual SQL case sets a 50 ms server statement timeout inside the existing default 10-second invocation and requires the precise `BACKFILL_DEADLINE_SQL` outcome, no committed target rows, rollback of the uncommitted checkpoint table and cold retry to five rows. The original 200 ms tests, deterministic product-policy regression and authority/error-preservation assertions remain unchanged. This splits distinct obligations rather than accepting arbitrary errors or extending the requested deadline.

The reviewer independently ran both corrected tests on its own compiled runtime and the actual isolated PostgreSQL fixture: **2/2 passed, zero failed**. The explicit-server case reached its exact SQL-deadline assertion and rollback/recovery checks. The handoff correctly retains the original local 48/49 failure, identifies the rejected baseline in past tense and leaves final verification pending. Live Jira comment 10522 records the native In Progress repair and resubmission to Testing; no Done is inferred.

At this checkpoint live replacement [CI 41284731460](https://github.com/ecohdeep786/New_Visionary/actions/runs/41284731460) is still in progress. The final replacement full local DATA rerun and actual real-Firebase browser regression are also pending; no result is predicted. A final evidence head must retain this exact runtime identity, receive evidence-only delta review and passing required head/integration checks before accepted dev publication and scoped Jira Done. New runtime source changes require renewed exact-source review.

## Final evidence acceptance — exact 55e7bb25

**Decision: approved for the existing bounded backfill/transaction development-enabler repair at exact `55e7bb25a5ff7decc7f4c3fc1bfd0b31b94b3828`. No unresolved source, test or submitted-evidence finding remains in this scope. Final evidence-head CI must pass before merge; accepted published dev integration and integrated checks still precede native scoped Jira Done.** Reviewer `/root/kan38_final_review` accepts this exact final decision independently of the implementer.

The final delta over approved `6b40d420` changes two documentation files only: the rework handoff append and [sanitized SQL/browser receipt](../delivery/evidence/KAN37_REWORK_BROWSER_SQL_2026-11-01.json). Backend/runtime/frontend/infrastructure/test/dependency source is unchanged. The reviewer fetched and merged the exact final candidate into the same matching task instance. Before this report update, its only differences from the candidate were the three preserved independent report/probe files. Exact-range whitespace checks passed. The reviewer did not alter implementation, sign in, operate the live account or write account records.

### Browser artifacts and limits

The reviewer independently SHA-256 checked, byte-count checked and decoded format/dimensions for all six original captures under `C:/Users/Administrator/Visionary-local/kan37-deadline-rework-20261101`. All values match the public receipt; all six are actual JPEGs, each 1187 x 1170. Every capture was visually inspected:

| Capture | What it corroborates |
| --- | --- |
| browser-signed-in-home.jpg | Professional workspace and the saved authored unit's Continue learning state |
| browser-restored-learning.jpg | Existing understanding/practice checks, Build stage and authored-sample/disconnected-teaching disclosure |
| browser-project-handoff.jpg | Fictional-data brief, existing project title and explicit local-preview/workplace-privacy boundary |
| browser-scoped-ask.jpg | Preserved learning-return context and unsent project-help draft |
| browser-practice-records.jpg | Existing unit with two recorded answers |
| browser-privacy-boundaries.jpg | Existing local-preview, sharing and privacy disclosures; no active export/delete/consent operation shown |

The raw browser-observation summary matches the public browser receipt. Reload, auth/me 200, console counts, navigation ordering and requested-action history remain explicitly implementer-observed evidence; static captures do not independently establish those events. The reviewer accepts the scoped artifact-backed product regression without claiming to have repeated sign-in or server/account writes. The receipt explicitly says its network buffer is truncated and is not a full HAR. It retains the initial cold-load automation timeouts and the watched-API restart proxy 500/ECONNREFUSED attempt, followed by the official API restart and clean observed journey. Those attempts are not converted into passes.

The public receipt contains no account UID, cookies, tokens, raw session/command/artifact identifiers, protected profile or billing records. Raw captures/configuration/runtime logs remain outside Git. The unsent Ask draft is not a model invocation, the authored unit is not official-source coverage, and visible local practice/project state is not newly accepted durable Build, hosted SQL or multi-device evidence. Administrative backfill behavior is correctly established by the separate SQL tests; no fictitious backfill UI journey is asserted.

### Final runtime verification inspected

Live [CI 41284731460](https://github.com/ecohdeep786/New_Visionary/actions/runs/41284731460), exact `6b40d420`, completed successfully with checks job `124783620444`; production was skipped. The reviewer inspected its live log, which identifies `6b40d420` rehearsed against accepted `3aa0d919` and records all DATA-01 20, DATA-02 50, SQL/Firestore provisioning 11, deployed backend 99/deployed provisioning 11, root product checks, actual migration/API images and infrastructure checks passing. This supersedes the former pending-CI checkpoint above without erasing its historical timing.

The reviewer read the preserved local source/result/log receipts: exact `6b40d420` local SQL stages passed 20/20 and 50/50; the encompassing `data:check` still exited 1 when the unchanged provisioning script could not locate Java 21. That original result is retained accurately. After selecting the already installed official Java executable, registered `node scripts/provision-check.mjs` on the same exact source exited 0 with 11/11 actual SQL/official Firestore-emulator/HTTP tests. Full local product check on `0278ee93` exited 0, and its product runtime/frontend source is unchanged in the accepted replacement. No whole-command local DATA exit-0 result is claimed.

At final evidence review, [CI 41286130404](https://github.com/ecohdeep786/New_Visionary/actions/runs/41286130404) for exact `55e7bb25` is in progress. **The integrator must confirm that exact final-head check succeeds, compare current dev and merge only this reviewed head.** A new source or evidence revision is not covered automatically. After published integration and passed relevant integrated checks, record actual scoped Jira Done and preserve configuration/raw evidence before worktree cleanup. This reviewer performed no merge to dev, Jira write, cleanup, cloud provisioning or main promotion. Hosted SQL/IAM/operations, domain/provider/content/rights/privacy/model/two-device and release gates remain open.
