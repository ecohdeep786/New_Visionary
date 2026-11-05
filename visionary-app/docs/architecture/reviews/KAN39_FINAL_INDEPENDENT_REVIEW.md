# KAN-39 exact-candidate review and emulator credential finding

5 November 2026. Reviewer: `/root/kan39_final_review`, independently accepting
responsibility separately from implementer `/root` and the implementation lane.

**Decision: CHANGES REQUESTED for exact candidate
`7493774c2a8f82a2f7778f8531d79469662ee171`. The emulator credential change
introduces ambient credential discovery during actual Firestore SDK
initialization. This candidate is not approved for dev integration.**

## Scope and current evidence

The matching existing QA instance is
`C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-39-transaction-rework`,
branch `codex/qa-review-kan-39-transaction-rework`, starting at
`0307df9a6f765d252fc626985e18ab201ceff5f8`. Its tracked/untracked state was clean;
ignored compiled output and dependency junction were preserved. This review
changes only this report and its new independent SDK probe. It does not merge
implementation into the QA branch, modify candidate source, touch dev/Jira, or
start SQL, Firebase emulators, a browser, or a cloud service.

The candidate remote was independently verified at the exact reviewed SHA.
Current local and published `origin/dev` was
`9b1c16a8b9bc027387b0d49c12765503f9df108d`. Live Jira read during the review
showed KAN-39 Testing and its native blocker KAN-110 Testing. Current execution
receipts, architecture/domain/workflow instructions and the task review template
were inspected. The review is for bounded development integration with real/live
institution activation disabled, never full-ticket or hosted acceptance.

The prior separate QA report in this branch approves source checkpoints through
`1a22f73337ad13ccd94ae9890282e5caafb6b76e`, with later product gates open.
There is no committed independent exact-SHA approval of `4119f106` in that report;
this reviewer does not infer approval from an implementer or Jira summary.
Exact Git objects for the subsequent invitation/institution/API changes, the
three new commit deltas over `4119f106`, and the full current-dev file scope were
inspected. The remaining finding below independently prevents integration.

## N8 / P2: emulator SDK initialization discovers ambient credentials

`backend/upstream/backend/src/auth/firebase/firebase-admin.service.ts` replaces
the emulator-only token shim with `applicationDefault()`. The comment's claim
that this performs no credential file discovery is false for the installed SDK.
The explicit key-file guard rejects a configured credential path but does not
disable well-known ADC or compute metadata discovery.

Actual installed SDK path: Firebase Admin accepts its ADC credential class and
constructs Firestore; the normal emulator Firestore client initializes its gax
stub; gax invokes GoogleAuth `getUniverseDomain()` even with an insecure emulator
channel; that invokes `getClient()`, which attempts environment credentials,
well-known credentials and compute metadata discovery. Consequently the existing
no-host-credential-discovery emulator boundary is lost.

This finding does **not** establish live Firebase writes or credential leakage.
Auth emulator RPCs use the SDK's `owner` token, and product Firestore initialization
requires an explicit loopback emulator host. Those guards remain valuable; they
do not prevent this earlier SDK credential-discovery path.

The new [independent probe](evidence/KAN39_EMULATOR_CREDENTIAL_PROBE.cjs) reads the
exact FirebaseAdminService Git object, transpiles it only in memory, obtains the
actual app, and initializes the real installed Firestore SDK stub with normal
loopback emulator settings. Before initialization it replaces the three SDK
discovery methods with counters returning no credentials, so no real file is
read and no metadata request occurs. It invokes no document operation or RPC.

```powershell
node docs/architecture/reviews/evidence/KAN39_EMULATOR_CREDENTIAL_PROBE.cjs 7493774c2a8f82a2f7778f8531d79469662ee171
```

Actual result: **exit 1**, the intended zero-discovery gate failed. Environment,
well-known and metadata counters were each **1**; endpoint `127.0.0.1`, SSL false.
This is a reproduced SDK boundary failure, not a speculative reading of a comment.

### Minimal compatibility experiment

The same probe with `--ephemeral-cert` instead creates a library-compatible
`cert(...)` using a freshly generated in-memory RSA-2048 PKCS8 private key, a
synthetic email under `demo-visionary-review`, and that explicit demo project.
The actual emulator Firestore stub initializes successfully with all three
discovery counters **0** and SSL false: **exit 0**. The key is never printed,
written, or retained outside that short-lived process. This is a proposed repair
experiment, not a change to candidate code or approval of a future implementation.

Repair must preserve project/kind/production-runtime/key-file and loopback guards,
avoid ambient ADC, and register a meaningful SDK-boundary regression. A replacement
exact SHA needs independent review and relevant checks after the current dev merge.

## Other inspected boundaries and verification limits

The new membership query correctly rejects a retained member row when that UID
has a person tombstone or a matching workspace tombstone. Its shared location
also protects issue/list/history/pending/revoke, current issuer authority during
acceptance, accepted replay and membership read-back. Canonical workspace-owner
erasure checks remain separate. The retained ADMIN SQL regression checks both
tombstone scopes and permits the unaffected canonical owner to revoke.

The parent verifier's preserved old-source log independently shows that regression
failed with a missing expected rejection at invitation issuance. The corrected
log was inspected and shows **34/34** focused cases passed, zero skipped; its
compile log contains no diagnostics. This reviewer did not rerun that SQL suite
or contend over the fixture. The parent reported **42/42** Firebase auth/product
tests; that count is attributed evidence, not this reviewer's executed result.

The bounded invitation adapter checks its development/emulator/synthetic/enabled
gate before returning even a cached runtime. HTTP handlers require exact-origin
CSRF and current account binding, and recipient email comes from a current
provider lookup for the authenticated UID rather than the request body. Approval
operations use configured reviewer authority, canonical ownership, bounded expiry
and locked persisted approval IDs. SQL operations recheck approval/authority and
retain transaction, receipt, audit and outbox behavior. These inspected boundaries
do not replace KAN-110 admission consistency or accepted institution proof policy.

The newer API test uses an actual Nest HTTP listener but injects store/privacy
fixtures. It demonstrates that HTTP boundary; it is not a connected SQL/Firestore
journey. The commit/Jira claim of 18 connected emulator API steps was not
independently rerun or accepted here. Two HTTP cookie jars cannot establish actual
browser UI wiring, two-device UX, or hosted acceptance. Current Connections
preview and missing connected browser outcomes remain open gates.

No dev integration, integrated verification, Jira Done, protected activation,
production promotion, human product decision or worktree cleanup follows from
this review. Preserve this rejection and review a new exact repaired candidate.
