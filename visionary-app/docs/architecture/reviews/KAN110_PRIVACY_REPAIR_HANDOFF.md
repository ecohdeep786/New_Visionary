# KAN-110 privacy repair review handoff

Candidate: the implementation commit containing this handoff; the exact SHA is recorded in Jira and the independent review. Base: `f50868b3eba2c539768c1454a473d4a29459b79b`. Branch: `codex/principal-kan-110-policy-rework`.

## Problem and resulting behavior

The original `b99eb31f9c8998c97be4ec6e9aaf7799eabf671a` implementation admitted caller thresholds, NaN retention and empty versions, deleted before revoking derived access, and persisted fields its own minimizer rejected. Its isolated memory store did not prove durable delivery. Those independently reproducible findings remain in the local prerequisite evidence; that older lane is not merged here.

This candidate introduces a bounded internal privacy control library backed by actual Firestore transactions. Draft policy has no approval and no invented retention periods. Accepted policy must match its canonical digest/version and a configured trusted reviewer; trust defaults empty. Admission reads the canonical current account tree and an own-purpose current acknowledgement. Under-18 activation remains blocked; an adult declaration is not verified age or guardian/institution authority. No caller age threshold or guardian flag is accepted.

Artifact collection is service-only, matches a separately approved exact-scope/current proposal, persists minimized operation metadata and supports durable replay. A pending erasure request and restriction commit together. This does not delete customer records, acknowledge global revocation, or claim erasure completion. Consumers not using this control boundary remain a separate integration gate. No policy approval publisher, controller, UI, guardian grant or provider activation is installed.

## Ownership and provenance

Owns new `src/privacycore`, its isolated TypeScript compile, real Firestore regression, bounded emulator-suite selection, and registration in data and deployed-lock checks. These are project-owned additions to the imported backend. Existing imported source, dependency locks and Prisma model remain unchanged. KAN-39 stays held on its own branch; this candidate does not import its migration/schema changes.

## Verification

`npm run privacycore:check`: 44/44 passed on the pinned official Firestore 1.22.0 loopback emulator with Java 21. Synthetic review/service identities and nine-class policy fixtures establish executable behavior only. Coverage includes invalid policies, untrusted approval, canonical admission denials, minimal artifact persistence and cold replay, actual transaction concurrency, before-commit rollback, post-commit lost acknowledgement, corrupt fence and pending erasure replay, and preservation of synthetic account/billing data. Test fixtures prohibit live fallback. The emulator was stopped by the launcher.

Compile passed. Layout/import checks and registered full checks are separately reported with actual outcomes in Jira. A passing test does not establish human policy approval or live/browser feature acceptance. No authenticated product journey was changed or accepted by this library-only checkpoint.

## Independent review request and remaining gates

Review the exact submitted SHA, actual service/store code and normal/deployed command registration. Independently exercise negative/mutation probes, especially approval trust, current account ownership, replay integrity, transaction ordering, minimization and outage recovery. Record an exact-SHA decision in your separate task checkout. No author approval exists.

Full KAN-110 stays open pending named policy-owner decisions for purpose/retention/admission/rights, accepted owning-domain integration, consumer fencing/deletion/export contracts, role/source/privacy browser end-to-end journeys and applicable hosted acceptance. This source checkpoint does not unblock KAN-39 on its own. No merge/Done/cleanup is authorized by this handoff alone. `main` remains unchanged.
