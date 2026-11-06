# KAN-40 connected consent independent review

Reviewer: independent agent `/root/kan58_review`, 6 November 2026. Review task: KAN-40 only.

**Decision for `c6928a2ba84fed214f24164876d3dae7c33dde40`: CHANGES REQUESTED.** The self-service source is not approved for dev integration until runtime identity/target isolation is corrected and the new exact source is reviewed. Passing CI does not cover the reproduced configuration defect.

## Exact scope and provenance

- Candidate: `codex/principal-kan-40-share-authority`, exact source above, including delivery guard `b0a4fee9`.
- Review worktree/branch: fresh `qa-review-kan-40-connected-consent` / `codex/qa-review-kan-40-connected-consent`, created and pushed from verified dev `65dee5af76d0ccaa3ee7d8bf52155b64108ac13c`.
- Scope: authenticated own-consent listing and revocation, signed UID-bound pagination, no-store, CSRF/account fences, canonical consent/share mutation with audit/outbox, and transaction-scoped delivery authorization.
- No new consent grant, policy publication, institution admission, job/download activation or production release is included.
- Exact source was read from Git objects. Candidate source, runtime dependencies and generated Prisma output were not modified.

## Blocking finding: identity realm is not bound to the SQL target

**P1 — `src/consent/product-consent.service.ts:41-59` accepts a SQL client without checking the authenticated Firebase identity realm.** The checks validate SQL URL, role/schema syntax and pool bounds, but ignore `FIREBASE_PROJECT_ID`, `FIREBASE_PROJECT_KIND` and `FIRESTORE_DATABASE_ID`. The repository subsequently looks up consent using the bare UID. An emulator UID or same string from another Firebase project is not the owner identity of a row created by the intended live product realm.

The [exact-source no-network probe](evidence/KAN40_RUNTIME_TARGET_PROBE.cjs) verifies both configurations against the actual `firebaseAdminSettings` function and actual consent target-validation code:

1. Development with valid `demo-qa-review` emulator settings plus a correctly formatted real-project staging Cloud SQL socket: Firebase settings pass and consent constructs its SQL client.
2. Production with valid live settings for `other-live-review` plus a correctly formatted `visionary-research` production SQL socket: Firebase settings pass and consent constructs its SQL client.

Prisma construction is replaced only in this probe by a recording sentinel that throws on connection/transaction attempts. Both unsafe targets were accepted; **zero provider/database connections occurred**. This is a configuration-boundary reproduction, not a claim of cloud data access or a substitute product test.

Before constructing a client, bind the supported verified identity realm and actual database name to the environment/SQL target, explicitly refuse emulator-to-cloud identity reuse, and retain/refuse drift on a cached target binding. Validate actual session role/database/schema and the required DML-only privilege boundary instead of treating role syntax as runtime privilege evidence. The current HTTP test installs `service.repository` directly, so it bypasses this initialization path.

Firestore database names must retain their actual SDK meaning: `default` and `(default)` are distinct names. The current product uses its configured literal database; do not introduce a consent-only alias that disagrees with the auth store. A broader identity realm requires its own accepted binding, not bare UID reuse.

## Verification completed

- No-network configuration probe: exit 0 while intentionally reproducing the rejected behavior; default-off list returned unavailable without SQL construction. Verified 653 installed dependency version/integrity records read-only.
- Independent exact-source client archive: `node --test frontend/tests/consent-client.test.mjs`, **4 passed / 0 failed**. Covers receipt validation, account changes before send/after response, malformed/foreign responses and cursor encoding/outage behavior. No frontend dependency install was needed.
- Independently fetched [candidate CI 42160094928](https://github.com/ecohdeep786/New_Visionary/actions/runs/42160094928): checks succeeded, including root check, data check, migration/API image and infrastructure checks; production deployment skipped.
- Inspected controller: authenticated expected-account checks, CSRF/Origin on revoke, strict command shape and bounded grant ID, no-store headers, signed expiring UID-bound cursor, and generic internal-store errors. No additional blocker identified in these inspected paths.
- Inspected UI: keyed per person, visible account guard, transport account checks around requests, explicit unavailable/error states and no promise of deleting retained records or recalling delivered bytes.
- Inspected transaction guard: canonical Person lock precedes current consent/time lookup; the callback uses the same transaction and a second lookup rejects expiry during callback writes. Canonical revoke holds that lock and atomically closes matching shares plus audit/outbox. Actual SQL callback/HTTP races were exercised in candidate CI; they were not independently rerun in this rejected-candidate review.

The implementer reports real-Firebase localhost browser list/revoke/refetch and owning-store readback (`revoked`, one audit, one outbox) on explicitly synthetic SQL data. The reviewer did not independently repeat that browser session and does not convert it into job/download, two-device or hosted acceptance.

## Remaining gates and next decision

The corrected target/session boundary requires new exact-source review and relevant tests/CI. No source approval, dev merge, Jira transition or cleanup is authorized by this report.

Even after the bounded self-service scope is approved, KAN-53/KAN-58 consumer delivery and current consent at final commit, actual READY/source authority, hosted operations and full KAN-40 acceptance remain open. Local self-service verification cannot establish those outcomes.
