# KAN-56 / FILE-01 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/deepseek-kan-56-upload-lifecycle` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits on the branch: corrections `6906cb42`, stacked integration `384e2ba6` (merge of the corrected `codex/deepseek-kan-53-outbox-jobs` `dd520a57`, carrying accepted dev `2e0b1fbb` + the blob-verified data-04 fix; tsconfig include union; lease/attempt tokens also moved to `randomUUID` — this branch's JOB-02-era code still carried the `Date.now()+Math.random` token shape from before the KAN-54 correction), test-adaptation commit (runJob-based idempotency test → fenced-completion replay).

## Corrections (all in `src/file/` unless noted)

1. **Corruption guard in `verify()`**: the received-byte counter is durable but the chunk parts are volatile — after a service restart mid-upload, a resumed assembly could be truncated while `bytesReceived` still matched `expectedSize`, admitting a silently corrupt object. The assembly length is now verified against the counter; divergence is a typed `verification_failed`, never admission.
2. **Volatile chunk parts are released at terminal states** (READY/REJECTED in `scan()`; `cancel()` already released): the parts map previously retained every completed/rejected upload's bytes for the process lifetime.
3. **`expandArchive` now enforces the policy's `expandableTypes` law** ("other types only pass as opaque blobs"): parser output can no longer be recorded for a non-expandable declared type — new typed code `not_expandable` + test covering both SCANNING and READY records. The DECLARED type is the expansion contract; the sniffed type is recorded alongside and divergence reconciliation belongs to the admitting layer (FILE-01 records, FILE-04 enforces format admission — the reviewed test itself asserts a pdf-declared/text-plain-sniffed file goes READY, so sniff-authoritative gating would have broken the reviewed contract; recorded here so the reviewer sees the deliberate boundary).
4. **`createIntent` ids use `randomUUID`** (entropy class).
5. Carry-forward via the stack merge: JOB-01 laws + lease/attempt token UUIDs now hold on this tree's outbox slice too.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| File + job family suites | `node --test backend/tests/contracts/data-files/upload.test.mjs backend/tests/contracts/data-jobs/{outbox,jobs,admission}.test.mjs` (after `npx tsc -p tsconfig.data.json`, exit 0) | **36/36 pass** — upload lifecycle (authorization, quarantine states, resumable chunks with idempotent resume, size/digest/sniff verification, scan gate, bounded parser output, cancellation) + the full outbox battery |
| Data contracts | `npm run data:check` (disposable loopback PostgreSQL 16 on 127.0.0.1:5433 + Java 21 under `nv-tools/`) | **exit 0 — 315/315 across 11 suites**, incl. data-04 invitations 37/37 |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| data-04 fix | blob diff vs canonical `kan-124/b5771920` | **identical** |

## Notes for the reviewer

- The chunk storage is the enabler's in-memory reference (`UploadService.bytes`); the Cloud SQL/object adapter must hold the bytes durably per record and implement `transition` with the same owner + state checks. The verify-time assembly guard stays meaningful even with durable parts (defense in depth).
- Real object-storage admission (private bucket writes, signed download boundaries) belongs to FILE-02/03 and stays owner-gated; this slice's acceptance is the executed lifecycle suite over the real composition.
