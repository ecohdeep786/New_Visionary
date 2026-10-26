# KAN-57 — FILE-02 — immutable object generations/manifests; verify references before DB commit; safe collection of unattached objects

## Task review and verification handoff

Jira key / source ID: KAN-57 (FILE-02)
Acceptance scope: enabler (immutable object manifest/reference domain on top of the FILE-01 upload lifecycle; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: deepseek (senior principal backend engineer)
Reviewer: codex (senior agent) — must explicitly accept responsibility; an implementer cannot self-approve
Worker branch / candidate head: `codex/deepseek-kan-57-object-manifests`
Base: `codex/deepseek-kan-56-upload-lifecycle` ccbd85ff (FILE-01 candidate; FILE-02 planning-sequence depends on the FILE series base), itself on origin/dev 65045d72
Owned files / contracts:
- `backend/upstream/backend/src/file/manifest-types.ts` (ObjectManifest, CollectResult)
- `backend/upstream/backend/src/file/manifest-store.ts` (ManifestStore contract + in-memory + immutability-guarded fenced transition)
- `backend/upstream/backend/src/file/manifest.service.ts` (publish / verifyReference / commitReference / retain / release / collectUnattached)
- `backend/upstream/backend/src/file/index.ts`, `tsconfig.data.json`
- `backend/tests/contracts/data-files/manifest.test.mjs` (new FILE-02 suite)
Prerequisites: FILE-01 (KAN-56) private upload lifecycle; DATA-01 / private-object rows at integration.

## Requirement

Store immutable object generations/manifests and verify references before database commit; collect unattached objects safely without deleting retained revisions/submissions. Exit: a DB row never commits a reference to a missing, unowned, mutable or already-collected object; collection never deletes a retained revision/submission.

## Acceptance criteria → evidence

- Criterion: immutable generations — publish records digest/size/type once; a re-publish mints a NEW generation and never mutates the old manifest (store refuses immutable-field updates).
  - Evidence: tests "publish: a new immutable generation records digest/size/type" and "immutability: re-publish mints a NEW generation".
- Criterion: verify references before DB commit — verifyReference validates exact (objectId, generation), ownership, and not-collected before a row commits; commitReference then marks referenced.
  - Evidence: tests "verifyReference: exact ownership and generation, not collected — before DB commit" and "before-DB-commit contract: an unreferenced published generation is never committed".
- Criterion: safe collection — collectUnattached detaches only unreferenced AND unretained generations; a manifest referenced by a retained revision/submission is never deleted; retain/release control retention.
  - Evidence: tests "collection: an unreferenced, unretained generation is safely detached" and "retention: a retain(revision) generation is never deleted even though unreferenced".
- Criterion: reference-commit race defense — a generation already collected cannot later be attached to a row (defense in depth against verify→commit racing the sweep).
  - Evidence: test "before-DB-commit contract" (commitReference on a collected build rejects with `collected`).
- Criterion: server-authoritative ownership — a non-owner cannot verify/commit/retain another uid's manifest.
  - Evidence: test "authorization: a non-owner cannot verify/commit/retain another uid manifest".
- Frontend → API → backend → data → jobs/ML → device outcome:
  - Frontend: N/A in the enabler; manifest/refetch surfaces consume the object records at SYNC/FILE cutover.
  - API: N/A in the enabler; publish/verify/commit/collect are the engine controllers call at cutover.
  - Backend: ManifestService implemented (immutability + reference verification + safe collection).
  - Data: in-memory ManifestStore with immutability-guarded transitions; Cloud SQL/private-object adapter swap at integration.
  - Jobs/ML: bounded private object work with permission/source rechecks; JOB-* leases/fencing apply at cutover.

## Commands, exit codes, test counts and timestamps

- Compile (pure modules): `tsc --project backend/upstream/backend/tsconfig.data.json --types node --typeRoots node_modules/@types --skipLibCheck` → exit 0 (2026-10-26).
- Backend build: `npm run build` (nest build) in `backend/upstream/backend` → exit 0 (2026-10-26).
- Contract tests: `node --test backend/tests/contracts/data-jobs/outbox.test.mjs backend/tests/contracts/data-jobs/jobs.test.mjs backend/tests/contracts/data-jobs/admission.test.mjs backend/tests/contracts/data-files/upload.test.mjs backend/tests/contracts/data-files/manifest.test.mjs` → 41 tests, 41 pass, 0 fail (2026-10-26).
- Root check `npm run check`: 82 script tests + 35 API contract tests + 624 frontend tests, 0 fail, frontend build ✓ (2026-10-26).

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/object store and no Nest controller/worker yet; the real adapter swap + worker wiring happen at integration cutover.
- Private downloads/exports/revocation (FILE-03 KAN-58) and unauthorized-read proofs (FILE-04 KAN-59) remain next in the FILE series.
- Collection is a single-sweep in-memory demo; retention lineage (revision/submission → generation) mapping will come from the connected data layer at cutover.
- Hosted verification, real object storage provisioning and Cloud SQL remain out of scope for an enabler; hosted/load/privacy gates stay open.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (codex)
- Verification result: pending
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-57 → Testing (transition 41)
- Next dependent tasks: FILE-03 (KAN-58) downloads/exports/revocation; FILE-04 (KAN-59) unauthorized-read proofs.
