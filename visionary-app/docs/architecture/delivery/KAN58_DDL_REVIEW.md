# KAN-58 — FILE-03 private downloads/exports: durable store increment (DDL review)

## Scope of this increment

Durable PostgreSQL adapter for the already-reviewed FILE-03 delivery fencing
(heads d9c69944 / 6fc55a11, review comments 10587/10588). The synthetic store
semantics are reproduced 1:1 over real tables:

- `download_grants` / `download_exports` tables added to the canonical DATA-01
  domain schema (Prisma models `DownloadGrant` / `DownloadExport`; the single
  generated migration `20261024000001_data_01_workspaces/migration.sql` was
  regenerated via `scripts/domain-ddl.mjs --write` — pure addition, +59 lines,
  per the "never a separate migration registry" convention).
- `src/file/download-store.sql.ts` — `PostgresDownloadStore implements
  DownloadStore`:
  - `consumeGrant` is ONE conditional statement (state ACTIVE, owner match,
    `revokedAt IS NULL`, `remainingReads > 0`, `expiresAt > UTC now` with the
    UTC-cast database clock): a read paused across a concurrent revocation
    matches zero rows and can never resurrect the grant or overwrite REVOKED
    (the review-10583 window is closed at the owning-store boundary),
  - `updateGrant(activeOnly)` refuses non-ACTIVE rows (no paused-revoke
    overwrite), `recordExportDelivery` is the same single-statement fence,
  - failures are classified honestly (not_found/unauthorized/revoked/used/expired),
  - identifiers embedded in raw statements pass a strict allow-list.

## Verification

- `npm run data:check` through its runnable steps: prisma validate + generate,
  canonical DDL PASS, `tsc -p tsconfig.workspace.json`, `tsc -p
  tsconfig.data.json`, data-01 suite (incl. the updated twelve-table DDL
  contract), data-02 migration registry suite (twelve tables), then
  `provision-check`/`privacycore-check` — these two require a local Java 21
  for the pinned Firestore emulator and the host has no Java; pre-existing
  environmental constraint, unchanged by this increment (the emulator role is
  covered by the Docker emulator suite locally).
- FILE-03 suites: `download.test.mjs` 14/14 (unchanged behavior) +
  `download.sql.test.mjs` 7/7 against real PostgreSQL: durable consume with
  accounting, the review-10583 paused-read fence (consume refused after
  concurrent revoke; row stays REVOKED; zero bytes), one-read token consumed
  exactly once across concurrent requests, activeOnly cannot resurrect
  REVOKED, foreign-owner denial on every operation, database-clock expiry,
  export delivery fencing.
- `nest build` exit 0.

## Remaining open (unchanged from review 10588)

- Authenticated HTTP route for the gateway (controller wiring).
- READY object ownership from KAN-56/KAN-57 (candidates outside dev).
- Connected/browser acceptance after those land.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (codex)
- Verification result: pending
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-58 → Testing (transition 41)
