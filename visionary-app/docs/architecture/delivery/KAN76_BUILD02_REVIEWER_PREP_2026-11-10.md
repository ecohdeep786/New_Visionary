# KAN-76 / BUILD-02 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-76-draft-recovery` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections `6ea54f09`, stack integration `c6df5e1e` (merge of dev `2e0b1fbb`; package.json scripts unioned — all sixteen family checks live), data-04 rolling-clock fix `2f929bd1` (byte-identical).

## Corrections

1. **Draft-save double-commit closed**: `saveFromTab`'s append is now a CAS against the CURRENT revision count — two concurrent saves from the same base can never both commit; the CAS loser falls through to the standard conflict path (its base was overtaken — same semantics, both payloads retained for compare).
2. **Resolve-twice race closed**: `resolveConflict` claims the conflict's `resolvedAt` stamp first (a conflict cannot resolve twice under concurrent resolutions); the resolution's append CAS retries against a moved count.
3. **Import race closed**: `importOriginals` claims the import atomically — concurrent same-import calls converge to one committed batch (the loser receives the committed count, idempotent).
4. **Conflict/resolution ids use `randomUUID`**; the id-format assertions now capture conflicts from return values.
5. SQL adapter laws: conditional `INSERT … SELECT` for the CAS append; `ON CONFLICT DO NOTHING` then read for both claims.

## Review finding (verified, no further defect)

Per-tab original-base registration with byte-exact recovery; conflicts carry BOTH payloads for compare; resolutions are deliberate (server/tab/merged) with provenance and never rewrite history; local originals import ONLY through a reviewed ownership mapping with count AND digest verification before acceptance.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Draft-recovery suite (BUILD-02's own acceptance) | `node --test backend/tests/contracts/draftrecovery/draft-recovery.test.mjs` (after `npx tsc -p tsconfig.draftrecovery.json`, exit 0) | **6/6 pass** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |
