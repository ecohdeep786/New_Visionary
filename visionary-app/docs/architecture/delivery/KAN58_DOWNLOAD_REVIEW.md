# KAN-58 — FILE-03 — private downloads, exports and revocation; authenticated gateway for immediate revocation; documented signed-link residual validity

## Task review and verification handoff

Jira key / source ID: KAN-58 (FILE-03)
Acceptance scope: enabler (private download/export/revocation domain; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: deepseek (senior principal backend engineer)
Reviewer: codex (senior agent) — must explicitly accept responsibility; an implementer cannot self-approve
Worker branch / candidate head: `codex/deepseek-kan-58-private-downloads`
Base: `codex/deepseek-kan-57-object-manifests` ccbd85ff (FILE-01 upload lifecycle candidate; FILE-03 planning-sequence depends on the FILE-01 READY contract), itself on the origin/dev chain 65045d72
Owned files / contracts:
- `backend/upstream/backend/src/file/download-types.ts` (DownloadGrant, ExportRecord, states, DownloadPolicy)
- `backend/upstream/backend/src/file/download-store.ts` (DownloadStore contract + in-memory + fenced transitions)
- `backend/upstream/backend/src/file/download.service.ts` (DownloadGateway + ExportService — ready-gated delivery, immediate revocation, signed links, export revocation)
- `backend/upstream/backend/src/file/index.ts`
- `backend/upstream/backend/tsconfig.data.json`
- `backend/tests/contracts/data-files/download.test.mjs` (new FILE-03 suite)
Prerequisites: FILE-01 (KAN-56) READY immutable objects; FILE-02 (KAN-57) object generations/manifests at integration; DATA-01 / private-object rows at integration.

## Requirement

Implement private downloads, exports and revocation behavior. Use an authenticated gateway where immediate revocation is required; document signed-link residual validity. Qualify ready immutable private pack/activity assets, digest/version manifests and reviewed offline-use lease behavior. Do not promise immediate removal of already downloaded bytes or change retained learner records.

## Acceptance criteria → evidence

- Criterion: only READY immutable generations are deliverable — quarantine (INTENT/UPLOADING/VERIFYING/SCANNING), REJECTED and CANCELLED objects are refused.
  - Evidence: tests "gateway read: a READY owned generation is delivered over the authenticated gateway" and "gateway: a grant is refused for a non-READY generation (quarantine stays private)".
- Criterion: authenticated gateway for immediate revocation — every read re-checks ACTIVE + owner + lease; after `revoke` the very next read is refused with no residual window.
  - Evidence: test "immediate revocation: after revoke the very next gateway read is refused (no residual window)".
- Criterion: expiry enforced on every read and by the sweep step.
  - Evidence: test "expiry: an expired gateway grant is refused on read and swept to EXPIRED".
- Criterion: signed-link residual validity is documented — a link stays consumable until expiry or revocation (whichever is earlier); bytes already delivered are NOT recalled and a single-use link is consumed by its first read.
  - Evidence: tests "signed link: one-shot by default; an issued token delivers once then is used" and "signed link residual validity: an expired link is refused; a revoked link is refused".
- Criterion: unknown or foreign signed-link tokens are refused.
  - Evidence: test "unknown or foreign signed-link token is refused".
- Criterion: exports are bounded, owner-scoped records of READY generations; reading delivers all members and export revocation is immediate.
  - Evidence: test "export: creation pins READY generations; reading delivers all members; revocation is immediate".
- Criterion: export bounds and non-READY members are refused.
  - Evidence: test "export bounds: an empty or oversized export is refused; a non-READY member is refused".
- Criterion: server-authoritative ownership — a non-owner cannot read, revoke or expire another uid's grant or export.
  - Evidence: test "authorization: a non-owner cannot read, revoke or expire another uid grant/export".
- Frontend → API → backend → data → jobs/ML → device outcome:
  - Frontend: N/A in the enabler; download/export UI consumes the gateway at FILE cutover.
  - API: N/A in the enabler; the download/export controllers call the gateway + services at cutover.
  - Backend: DownloadGateway + ExportService implemented (ready-gated delivery, immediate revocation, signed links, export revocation/expiry).
  - Data: in-memory DownloadStore with fenced transitions; Cloud SQL/private-object adapter swap at integration.
  - Jobs/ML: download/export lease and expiry sweeps are bounded private work; JOB-* leases/fencing apply at cutover.

## Commands, exit codes, test counts and timestamps

- Compile (pure modules): `tsc --project backend/upstream/backend/tsconfig.data.json --types node --typeRoots node_modules/@types --skipLibCheck` → exit 0 (2026-10-26).
- Backend build: `npm run build` (nest build) in `backend/upstream/backend` → exit 0 (2026-10-26).
- Contract tests: `node --test backend/tests/contracts/data-files/download.test.mjs` → 10 tests, 10 pass, 0 fail (2026-10-26).
- Regression: `node --test backend/tests/contracts/data-files/upload.test.mjs` → 9 tests, 9 pass, 0 fail (2026-10-26).

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/object store and no Nest controller/worker yet; the real adapter swap + worker wiring happen at integration cutover.
- The signed-link path is a reviewed convenience/offline-use lease with documented residual validity; it is NOT the immediate-revocation channel. Only the authenticated gateway guarantees that a revoke stops further reads with no residual window.
- FILE-04 (KAN-59) unauthorized-read proofs, FILE-02 (KAN-57) manifest integration and DATA-01 private-object rows remain next in the FILE/DATA series.
- Hosted verification, real object storage provisioning, signed-link emission via a trusted CDN and Cloud SQL remain out of scope for an enabler; hosted/load/privacy gates stay open.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (codex)
- Verification result: pending
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-58 → Testing (transition 41)
- Next dependent tasks: FILE-04 (KAN-59) unauthorized-read proofs; integration of FILE-01/02/03 with DATA-01 private-object rows at cutover.
