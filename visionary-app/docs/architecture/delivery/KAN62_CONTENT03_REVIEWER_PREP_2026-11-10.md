# KAN-62 / CONTENT-03 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-62-publication` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: stack integration `5fab3b42` (merge of dev `2e0b1fbb`; package.json scripts unioned — privacycore/data/ingestion/publication checks all live; data-04 rolling-clock fix `0f9f1fd0`, byte-identical).

## Review finding (verified, no defect)

The publication orchestration reviewed clean and is notably well-engineered:

- **Reviewer separation**: the owner cannot approve or reject their own publication (`SELF_APPROVAL_DENIED`).
- **Ingestion re-checks in depth**: a complete passing ingestion receipt is required at submit AND re-verified at release AND at restore — incomplete ingestion can never appear published.
- **Atomic pointer discipline**: the public pointer changes only through the store's compare-and-swap on the expected revision; a racing release with the identical payload deduplicates to the committed pointer, a different payload conflicts loudly; replayed release commands resolve to the same committed pointer before the state guard.
- **Withdrawal semantics**: withdrawal stops the pointer immediately; restore re-enters REVIEW (never released directly) and requires a fresh approval — withdrawal always stops access until re-reviewed.
- Reader gate refuses unauthenticated requesters; workspace/role/consent filtering is deliberately CONTENT-05 (recorded boundary).

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Publication suite (CONTENT-03's own acceptance) | `node --test backend/tests/contracts/publication/publication.test.mjs` (after `npx tsc -p tsconfig.publication.json`, exit 0) | **10/10 pass** |
| Registered publication gate | `npm run publication:check` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Notes for the reviewer

- The durable store is the in-memory reference; the SQL adapter must implement `swapPointer` as one conditional write on the expected revision (the CAS the replay/dedup semantics depend on).
- Hosted publication delivery at scale stays founder-gated as originally recorded; CONTENT-05's workspace/consent filtering is the next slice in that family.
