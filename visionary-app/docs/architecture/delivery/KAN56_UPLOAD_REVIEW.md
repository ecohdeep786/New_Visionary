# KAN-56 — FILE-01 — authorized upload intent → private quarantine → complete/digest/type/size verification → scan → ready; resumable failures; bounded parser/archive output

## Task review and verification handoff

Jira key / source ID: KAN-56 (FILE-01)
Acceptance scope: enabler (private immutable upload lifecycle domain; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: deepseek (senior principal backend engineer)
Reviewer: codex (senior agent) — must explicitly accept responsibility; an implementer cannot self-approve
Worker branch / candidate head: `codex/deepseek-kan-56-upload-lifecycle`
Base: `codex/deepseek-kan-55-admission-limits` 58d701e5 (JOB-03 candidate; FILE-01 planning-sequence depends on JOB-02), itself on origin/dev 65045d72
Owned files / contracts:
- `backend/upstream/backend/src/file/file-types.ts` (FileState, FileRecord, FilePolicy, sha256Hex)
- `backend/upstream/backend/src/file/file-store.ts` (FileStore contract + in-memory + fenced transition)
- `backend/upstream/backend/src/file/upload.service.ts` (UploadService — intent/chunk/verify/scan/ready + bounds)
- `backend/upstream/backend/src/file/index.ts`
- `backend/upstream/backend/tsconfig.data.json`
- `backend/tests/contracts/data-files/upload.test.mjs` (new FILE-01 suite)
Prerequisites: JOB-01 (KAN-53) outbox dispatch; JOB-02 (KAN-54) leases/fencing; DATA-01 / private-object rows at integration.

## Requirement

Implement authorized upload intent → private quarantine → complete/digest/type/size verification → scan → ready lifecycle; handle resumable failures and bounded parser/archive output. Exit: restarts, retries and malformed files cannot lose work, admit unverified bytes or bypass policy.

## Acceptance criteria → evidence

- Criterion: authorized upload intent — `createIntent` makes a private-quarantine record owned by one uid/workspace; nothing is readable until READY.
  - Evidence: tests "intent: an authorized user creates a private-quarantine intent with durable metadata" and "quarantine: only READY is readable".
- Criterion: private quarantine — INTENT/UPLOADING/SCANNING all refuse a read; only READY is consumed.
  - Evidence: test "quarantine: only READY is readable; INTENT/UPLOADING/SCANNING refuse a read".
- Criterion: resumable failures — chunks append by offset; a retried segment is idempotent (no double bytes) and progress resumes from the durable bytesReceived.
  - Evidence: test "resumable chunks: idempotent resume, no double-count, progress returned for a failed upload".
- Criterion: digest/type/size verification — completion checks declared size vs received, computes sha256 and sniffs type; a mismatch rejects (size mismatch stays resumable).
  - Evidence: test "verify: completion checks size, digest and sniffed type; a size mismatch rejects".
- Criterion: scan → ready — a clean scan result transitions to READY; an infected result is REJECTED, never admitted.
  - Evidence: test "scan: an infected object is REJECTED, never admitted".
- Criterion: bounded parser/archive output — parser/archive expansion is capped by policy; exceeding the cap rejects instead of unbounded expansion.
  - Evidence: test "bounded archive/parser output: exceeding the parser cap rejects instead of unbounded expansion".
- Criterion: cancel before READY — a cancelled intent admits no bytes and cannot later verify.
  - Evidence: test "cancel: an intent cancelled before READY admits no bytes".
- Criterion: server-authoritative ownership — a non-owner uid cannot read or mutate an upload.
  - Evidence: test "authorization: an upload cannot be read or mutated by a non-owner uid".
- Frontend → API → backend → data → jobs/ML → device outcome:
  - Frontend: N/A in the enabler; upload/resume UI consumes the lifecycle at FILE cutover.
  - API: N/A in the enabler; intent/chunk/verify/scan/ready are the engine controllers call at cutover.
  - Backend: UploadService implemented (quarantine → verify → scan → ready + resumable chunks + bounds).
  - Data: in-memory FileStore with fenced transitions; Cloud SQL/private-object adapter swap at integration.
  - Jobs/ML: scan/parse and digest runs are bounded private work; JOB-* leases/fencing apply at cutover.

## Commands, exit codes, test counts and timestamps

- Compile (pure modules): `tsc --project backend/upstream/backend/tsconfig.data.json --types node --typeRoots node_modules/@types --skipLibCheck` → exit 0 (2026-10-26).
- Backend build: `npm run build` (nest build) in `backend/upstream/backend` → exit 0 (2026-10-26).
- Contract tests: `node --test backend/tests/contracts/data-jobs/outbox.test.mjs backend/tests/contracts/data-jobs/jobs.test.mjs backend/tests/contracts/data-jobs/admission.test.mjs backend/tests/contracts/data-files/upload.test.mjs` → 33 tests, 33 pass, 0 fail (2026-10-26).
- Root check `npm run check`: 82 script tests + 35 API contract tests + 624 frontend tests, 0 fail, frontend build ✓ (2026-10-26).

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/object store and no Nest controller/worker yet; the real adapter swap + worker wiring happen at integration cutover.
- Private downloads/exports/revocation (FILE-03 KAN-58), immutable object generations (FILE-02 KAN-57) and unauthorized-read proofs (FILE-04 KAN-59) remain next in the FILE series.
- Upload kind allowlists map onto entitlement/source policy at integration; scan is a policy-injectable step (real antivirus provider remains provider-qualification scope).
- Hosted verification, real object storage provisioning and Cloud SQL remain out of scope for an enabler; hosted/load/privacy gates stay open.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (codex)
- Verification result: pending
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-56 → Testing (transition 41)
- Next dependent tasks: FILE-02 (KAN-57) object generations/manifests; FILE-03 (KAN-58) downloads/exports/revocation; FILE-04 (KAN-59) unauthorized-read proofs.
