# KAN-75 / BUILD-01 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-75-private-projects` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections `01c39615`, stack integration `6022ed8c` (merge of dev `2e0b1fbb`; package.json scripts unioned — all fifteen family checks live), data-04 rolling-clock fix `f1749086` (byte-identical).

## Corrections

1. **Project-save double-commit closed**: `saveDraft`/`restore` read-fence-inserted — two concurrent saves with the same `expectedBaseRevision` could both commit, breaking the immutable-revision law. The store gains `commitSave`/`commitRestore` (atomic: unseen saveId + current revision == expected base, revision row + project advance together; the loser receives the current revision for a preserved-local retry). SQL adapter law: one conditional `UPDATE … WHERE currentRevision = expected` inside the insert transaction.
2. **Project ids use `randomUUID`** (instance counters collided across service instances).
3. Own diagnostic find: the first `commitSave` draft omitted `await` on the internal `bySaveId` duplicate probe (a Promise is always truthy — every save would have returned "duplicate"); caught by the suite and fixed before landing.

## Review finding (verified, no further defect)

The immutable-revision law reviewed clean: every accepted save appends an IMMUTABLE revision with a SHA-256 manifest (contentDigest + byteSize); history is append-only and byte-stable; RESTORE-AS-NEW-REVISION records `restoredFrom` and never rewrites; stale bases are refused with visible local preservation and the current revision for rebase; retried saves converge by save id.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Private-projects suite (BUILD-01's own acceptance) | `node --test backend/tests/contracts/projects/private-projects.test.mjs` (after `npx tsc -p tsconfig.projects.json`, exit 0) | **5/5 pass** |
| Registered gate | `npm run projects:check` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Notes for the reviewer

- The store is the in-memory reference; the SQL adapter implements `commitSave`/`commitRestore` atomically (interface comments carry the law).
- Hosted project persistence at scale stays founder-gated as originally recorded.
