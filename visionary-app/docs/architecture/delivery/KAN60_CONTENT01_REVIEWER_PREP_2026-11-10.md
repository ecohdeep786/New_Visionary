# KAN-60 / CONTENT-01 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/deepseek-kan-60-content-catalog` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections `20759ed0`, stack integration `c6226944` (corrected kan-53 `dd520a57`: dev `2e0b1fbb` + blob-verified data-04 + JOB-01 laws; dispatcher/test resolutions per the lane's scripted pattern).

## Correction — lifecycle-gate bypass CLOSED

`CatalogPatch` (the patch type `updateMetadata` forwards) included `rights`, `source`, `publication`, `publishedAt` and `withdrawnAt` — so an owner could **publish a PENDING or REJECTED-source node directly through a metadata update**: visibility public + publication published + forged timestamps, with no approval check, defeating the documented forward-only approval law the store's own comment called "service-enforced".

Fixed at both layers:

- `CatalogPatch` is now genuine metadata only (`name`, `grade`, `category`, `authoredLanguage`, `license`, `updatedAt`). Lifecycle state travels on a separate store-level patch type used exclusively by the owner-checked forward-only methods (approve/reject/publish/withdraw/updateSourceVersion). The durable identity (publicId/kind/parentId/ownerUid) remains unpatchable; `visibility`/`ownerUid` ride publish/withdraw only; `license` merges into rights at the store.
- `updateMetadata` additionally refuses lifecycle keys at runtime with the new typed `immutable_field` error (runtime parity for untyped callers/SQL adapters).
- Bypass test: `publication`, `source`, and `rights` patches all refuse `immutable_field`; the node stays draft/private/pending with retrieval ineligible.

## Review observations (verified, deliberately unchanged)

- `updateSourceVersion` advances provider/edition while keeping the registration-frozen public ID — a documented design decision (versions under one stable ID, like editions of a work); the ID maps to the REGISTRATION identity, not current state. Recorded so the reviewer sees it is deliberate.
- `eligibleForRetrieval` checks the node's own source approval (not ancestors') and every ancestor's publication/visibility — doc-consistent.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Complete FILE+JOB+CONTENT battery in ONE serialized invocation | `node --test --test-concurrency=1` over content, security, download, download.sql (real PostgreSQL 16), upload, manifest, outbox, jobs, admission (after `npx tsc -p tsconfig.data.json`, exit 0) | **89/89 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Live product check (2026-11-10)

The integrated product re-verified live in the browser (standing journey evidence: pricing → register → email step → auth guards with `returnTo`). CONTENT-01 is the catalog enabler with no separate UI surface at this slice (the released-content journey runs through ACCEPT-01's chain); hosted catalog retrieval at scale stays founder-gated as originally recorded.
