# KAN-56 — Private resumable upload lifecycle

The upload service accepts a verified session UID, declared type and length, and expected SHA-256. PostgreSQL owns the current upload revision, owner/workspace authority, progress and generation receipts. Cloud Storage holds the bytes in a private quarantine bucket. The service checks workspace membership and account deletion markers on reads and mutations.

| Path | Behavior |
| --- | --- |
| Intent and resume | Server-selected fixed-size parts have a short-lived intent and a bounded part count. Each offset reserves one digest before sending bytes to storage. A repeat must match the reservation or committed part. Concurrent writes advance the SQL cursor once. |
| Private storage | Each part uses a server-derived name and a create-only Cloud Storage precondition. The SQL receipt pins the object generation. A lost upload response can recover the existing generation on retry. [Cloud Storage object creation and read parameters](https://docs.cloud.google.com/storage/docs/json_api/v1/objects/insert) |
| Verification | Parts are read by their pinned generations and checked against the manifest. Completion independently validates length, SHA-256 and content type. A mismatch rejects the upload. Incomplete or unavailable parts remain retryable. |
| Scan and parser | A trusted worker supplies the scanner and streaming parser. Only a clean scan and successful bounded parse can commit READY. The service counts output bytes and entries while consuming the stream and checks cancellation and scope at the SQL write. |
| Access | Pending, rejected and cancelled uploads expose no bytes through the upload service. Foreign owners and revoked workspace members cannot read progress or complete the job. |

Run `npm run data:check` with disposable PostgreSQL to exercise the lifecycle and migration. The local object transport fixture implements the Cloud Storage HTTP contract. Hosted acceptance must also exercise a private bucket, pinned generation reads and anonymous access refusal under scoped credentials in `visionary-research`.

Before a public feature consumes uploads, FILE-02 owns promotion to permanent immutable object generations. The worker integration owns trusted scanner and sandboxed parser qualification, workload scheduling, and quarantine lifecycle cleanup for expired, rejected and uncommitted parts. These paths have separate release gates.
