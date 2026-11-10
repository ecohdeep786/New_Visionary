# KAN-59 / FILE-04 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/deepseek-kan-59-file-security` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: doc-law alignment `51d55ac4`, stacked integrations `54356fa2` (corrected kan-53: dev `2e0b1fbb` + blob-verified data-04 + JOB-01 laws) and `26e9451d` (corrected kan-58: the KAN-58 download corrections — atomic consumeRead, Int32 budget, widened unions — because this branch's base carried the PRE-correction download files; file/index.ts unioned to export all four FILE surfaces), fixture hygiene commit (idempotent person seeding).

## Corrections / findings

1. **No implementation defect found in the security guard itself** — verified against the full matrix: traversal refusals cover raw + decoded + double-encoded dots, absolute/backslash/drive/NUL forms; reads are owner-scoped twice (path namespace + record uid); only READY is readable; scan failures refuse; completion idempotence is durable-state-backed. The one correction is documentation accuracy: `converterScope`'s docstrings said credential fields "are removed/stripped" while the code (and the reviewed test) REFUSE the payload with the typed `credential_leak` error before parse — the docstrings now state the enforced fail-closed law, since the misleading wording would tempt a future editor into silent stripping that could mask a smuggling attempt.
2. **Stacked the KAN-58 download corrections** (this branch's base predated them): without this, a reviewer merging 58→59 would have regressed the atomic consumeRead + Int32 budget laws; `src/file/index.ts` resolved to export all four FILE surfaces; the SQL download fixture's person seeding made idempotent (upsert) so the suite re-runs against any database state.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Full FILE+JOB battery in ONE serialized invocation | `node --test --test-concurrency=1` over security, download, download.sql, upload, manifest, outbox, jobs, admission | **74/74 pass** |
| Data contracts | `npm run data:check` (fresh synthetic schema per suite; includes the SQL suites + data-04 37/37) | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Live product check (2026-11-10)

The integrated product re-verified live in the browser (standing journey evidence: pricing → register → email step → auth guards with `returnTo`). FILE-04 is the security-proof slice over the FILE surfaces; its acceptance is the executed 74-test battery plus the live-origin probes recorded on the sibling slices; hosted WAF/edge enforcement stays founder-gated as originally recorded.

## Note for the reviewer

Diagnostic care taken this pass: an apparent SQL-suite flakiness was traced to the RUNNER's environment (a dropped `DATA_TEST_DATABASE_URL` between invocations), not the suite — the fixture was made idempotent anyway, and the battery is proven green in a single serialized invocation with the env set.
