# RELEASE-06 (KAN-129) — Release-Path Security Review Runbook

**Task:** Complete release-path security/dependency/image reviews, controlled access review, secret rotation and incident/support/on-call runbooks with named responders.
**Status:** dependency/patch provenance review, secret-surface law and the live secret-rotation drill complete on the local synthetic estate; the image review, controlled access/IAM review, advisory-database review and NAMED responders remain the owner's external gates.
**Registered command:** `npm run release:security:review`.
**Depends on:** the BILL-01/02 ingress + webhook harnesses (lane stack; this branch stacks on the RELEASE-05 lane).

## What the review proves

Executed by `backend/tests/contracts/release-06/release-security.test.mjs`
(5 tests) against the real product tree and runtime:

1. **Patch provenance integrity.** Every recorded upstream patch in
   `integration/upstream-patches.json` has an existing diff whose bytes match
   the recorded sha256 — a silently edited patch fails the release path —
   with its decision recorded and touched files listed. Recorded file paths
   are import-BASELINE-relative (visionaryorg/visionary-dev @ `81e861be`):
   paths that resolve nowhere in the current tree are recorded as stale
   baseline references (legacy layout, e.g. `services/api-gateway`,
   `shared/go`) in the report, not silently ignored.
2. **Dependency pins.** Every workspace that declares dependencies
   (root, frontend, backend runtime, integration contracts, infra runtime)
   carries a v3+ lockfile, and every declared dependency resolves to an EXACT
   locked version with an integrity hash — caret ranges are resolved by the
   lock, never installed loose.
3. **Secret-surface law.** No fixture or secret material appears in product
   source; the webhook secret is read ONLY from configuration with no
   hardcoded default (an empty configured secret fails the signature check
   closed — proven in the BILL-02 acceptance).
4. **Rotation drill (live).** Over the canonical TLS ingress with real
   signature verification: a webhook signed with the registered secret is
   accepted; the SAME bytes signed with a different, unregistered secret are
   refused. After a REAL rotation (full product restart with rotated
   configuration) the stale secret is refused fail-closed, the rotated secret
   is accepted, and the reconciliation job token obeys the same law.

## The secret-rotation procedure (operator)

Rotation is a full-restart procedure — credentials are read at composition
time:

1. Mint the new secret(s) (webhook secret: shared with the merchant dashboard
   registration; job token: 64-hex).
2. Stop every writer/instance (exactly one executor — ACCEPT-07 law).
3. Restart the runtime with the rotated configuration; the OLD credentials
   are dead from that moment (drill-proven fail-closed).
4. Register the rotated webhook secret on the merchant dashboard and update
   the job token wherever the scheduler holds it.
5. Rerun `npm run billing:webhook:acceptance` (with the rotated fixture
   override) to re-prove the surface; archive both rotations in the release
   evidence.

## Incident / support / on-call runbook (skeleton — responders pending)

| Incident | First response (drilled procedure) | Owner |
| --- | --- | --- |
| Payment webhook storm / replay | Signature + event-id idempotency absorb duplicates (BILL-02 409/idempotent laws); reconciliation converges from provider facts | **GATE: name responder** |
| Billing record lost/corrupted | Restore from the explicit recovery point; account/revision/invoice byte-faithful; NO fresh Free record over uncertain subscription state (RELEASE-05 drill) | **GATE: name responder** |
| Logical SQL corruption | Independent restore + digests + tombstone-journal replay (RELEASE-05 drill; RTO ≤4h) | **GATE: name responder** |
| Credential compromise | Rotate per the procedure above (drill-proven stale-refusal) | **GATE: name responder** |
| Bad schema migration | Forward-only: recovery is snapshot-based; drift preflight refuses unknown registries (ACCEPT-07 + RELEASE-05 drills) | **GATE: name responder** |
| Region outage | Manual DR runbook (RTO/RPO ≤24h) — EXTERNAL GATE, owner-run | owner |

## External gates (owner)

1. **Container image review** — no container runtime on this host (no nested
   virtualization); run against the built images once the container estate
   exists.
2. **Controlled access / IAM review** — hosted identities and bindings.
3. **Named responders** — the founder records accountable names in the table
   above.
4. **Advisory-database review** (`npm audit` equivalents) — network-dependent;
   run in a connected environment per the pinned-lockfile surface proven
   here.
