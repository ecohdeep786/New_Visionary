# KAN-59 — FILE-04 — prove unauthorized reads, URL/path traversal, unsupported formats, scan failures, object loss, duplicate completion and deletion races; isolate converters/parsers from account/payment credentials

## Task review and verification handoff

Jira key / source ID: KAN-59 (FILE-04)
Acceptance scope: enabler (security/robustness guard over the FILE-01/02 surfaces; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: deepseek (senior principal backend engineer)
Reviewer: codex (senior agent) — must explicitly accept responsibility; an implementer cannot self-approve
Worker branch / candidate head: `codex/deepseek-kan-59-file-security`
Base: `codex/deepseek-kan-57-object-manifests` 6721d892 (FILE-02 candidate), itself on origin/dev 65045d72
Owned files / contracts:
- `backend/upstream/backend/src/file/file-security.ts` (FileSecurityGuard — resolveObjectPath/readReady/assertSupportedType/runScan/ensureNoObjectLoss/converterScope + isTraversalPath)
- `backend/upstream/backend/src/file/index.ts`, `tsconfig.data.json`
- `backend/tests/contracts/data-files/security.test.mjs` (new FILE-04 suite)
Prerequisites: FILE-01 (KAN-56) private upload lifecycle; FILE-02 (KAN-57) immutable generations; JOB-* lease/fencing at cutover.

## Requirement

Prove unauthorized reads, URL/path traversal, unsupported formats, scan failures, object loss, duplicate completion and deletion races; isolate converters/parsers from account/payment credentials. Exit: an attacker cannot read or traverse another owner's/private object, force an unsupported format or scan-failed object into READY, complete twice, or leak credentials to parser code.

## Acceptance criteria → evidence

- Criterion: unauthorized reads refused — a non-owner uid is refused even for a READY object, and a path naming another owner's namespace is refused.
  - Evidence: test "unauthorized read: a non-owner uid is refused even for a READY object".
- Criterion: URL/path traversal rejected — absolute, backslash, drive-letter, `..`, NUL and URL-encoded dots are rejected at the raw boundary before any read/commit.
  - Evidence: test "URL/path traversal: ... are rejected" (isTraversalPath cases + resolveObjectPath rejects + clean owner-scoped key resolves).
- Criterion: unsupported formats refused — only allow-listed expandable types reach conversion; a miss is refused.
  - Evidence: test "unsupported format: an allow-list miss is refused before conversion".
- Criterion: scan failure never admits — an infected or throwing scan keeps the object quarantined (REJECTED/refused), never silently admitted.
  - Evidence: test "scan failure: an infected/failing scan never admits the object".
- Criterion: object loss refused — a partial upload that is missing bytes is refused; no silent drop of incomplete bytes as complete.
  - Evidence: test "object loss: an incomplete upload is refused, never silently dropped as complete".
- Criterion: duplicate completion idempotent — a READY object stays READY and a repeated read returns the same durable object (completion never re-executed).
  - Evidence: test "duplicate completion: a READY object stays READY and a second read is the same durable object".
- Criterion: deletion race safe — a cancelled/rejected object resolves to `deleted` even when a read races the deletion; delete and read never tear.
  - Evidence: test "deletion race: a cancelled/rejected object resolves to deleted even if the read races".
- Criterion: converter/parser credential isolation — a payload carrying any account/payment credential field is refused before it reaches third-party parser code; non-credential fields are scrubbed into a safe scope.
  - Evidence: test "converter isolation: account/payment credentials never reach the parser scope".
- Frontend → API → backend → data → jobs/ML → device outcome:
  - Frontend: N/A in the enabler; read/download and export UI consume the guarded READY-object surface at FILE cutover.
  - API: N/A in the enabler; read/traversal/format/scan/credential guard calls are the engine controllers enforce at cutover.
  - Backend: FileSecurityGuard implemented (owner-scoped read, traversal rejection, allow-list, scan-fail, loss, idempotent read, delete-race, credential isolation).
  - Data: guard composes over the in-memory FileStore; Cloud SQL/private-object adapter swap at integration.
  - Jobs/ML: converters/parsers run inside the guarded scope with no account/payment credentials; JOB-* leases/fencing apply at cutover.

## Commands, exit codes, test counts and timestamps

- Compile (pure modules): `tsc --project backend/upstream/backend/tsconfig.data.json --types node --typeRoots node_modules/@types --skipLibCheck` → exit 0 (2026-10-26).
- Backend build: `npm run build` (nest build) in `backend/upstream/backend` → exit 0 (2026-10-26).
- Contract tests: `node --test backend/tests/contracts/data-jobs/outbox.test.mjs backend/tests/contracts/data-jobs/jobs.test.mjs backend/tests/contracts/data-jobs/admission.test.mjs backend/tests/contracts/data-files/upload.test.mjs backend/tests/contracts/data-files/manifest.test.mjs backend/tests/contracts/data-files/security.test.mjs` → 49 tests, 49 pass, 0 fail (2026-10-26).
- Root check `npm run check`: 82 script tests + 35 API contract tests + 624 frontend tests, 0 fail, frontend build ✓ (2026-10-26). Pinned `backend/upstream/backend/package-lock.json` restored to the recorded baseline after the local install (no dependency change).

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/object store and no Nest controller/worker yet; the real adapter swap + worker wiring happen at integration cutover.
- Converter/parser sandbox runtime isolation (process/namespace) is provider/infrastructure qualification; this enabler proves credential-scope isolation.
- FILE-03 (KAN-58, private downloads/exports/revocation) is being implemented by the new team; guard composes with it at cutover.
- Hosted verification, real object storage provisioning and Cloud SQL remain out of scope for an enabler; hosted/load/privacy gates stay open.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (codex)
- Verification result: pending
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-59 → Testing (transition 41)
- Next dependent tasks: FILE-03 (KAN-58) downloads/exports/revocation; SYNC-01 (KAN-139) durable observation; ACCEPT-03 release gate.
