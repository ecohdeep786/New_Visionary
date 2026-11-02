# KAN-110 independent privacy repair review

- Reviewer: `/root/kan110_privacy_review`, separate from implementer; accepts responsibility for this exact-source review.
- Candidate reviewed: `80983e8c940e65ed911411c1f508ad611e11f98e`.
- Worker: `codex/principal-kan-110-policy-rework`.
- Base/current verified `origin/dev`: `f50868b3eba2c539768c1454a473d4a29459b79b`.
- Reviewer instance: `qa-review-kan-110-policy-rework`, own pushed `codex/qa-review-kan-110-policy-rework` branch, freshly created from verified dev and fast-forwarded to the exact candidate.
- Acceptance scope: internal Firestore-backed source checkpoint only. No human policy-owner decision, browser/hosted feature, provider activation, KAN-39 unblock or complete KAN-110 acceptance was requested or established.
- Decision: **CHANGES REQUESTED. Do not merge this candidate.**

## P1 — bind acknowledgement and artifact proposal to exact policy content

`privacy-core-service.ts:39-43` checks admission acknowledgement against `policyVersion` only. `firestore-privacy-store.ts:25-28` does not carry an acknowledgement digest into that check. `privacy-core-service.ts:83-85` similarly validates proposal version but not policy digest, then writes the *current* policy digest into the artifact.

The policy validator binds the current approval to the exact content digest, but does not forbid a newly approved policy with changed content and the same version. Consequently an old acknowledgement or proposal is silently authorized under different approved content. A digest change can represent different purposes or retention conditions, even though its version string remains unchanged. The new policy approval is not the subject's old acknowledgement or the service's old scoped proposal.

Actual emulator reproductions:

1. Seed the submitted synthetic adult account, acknowledgement, approved policy and proposal using the existing fixture.
2. Clone the approved policy. Change the `learning_text` purpose, retaining `policyVersion`. Recompute the approval digest and persist the changed approved policy. Leave the acknowledgement untouched.
3. `admission(uid)` still returns `allowed: true`.
4. In a second fresh fixture, change `model_artifacts` purpose with the same version and recompute approval digest. Leave the proposal untouched.
5. `collectArtifact(serviceUid,input)` returns `{ replay: false }`, and the persisted artifact carries the new policy digest that the old proposal never referenced.

Required correction: acknowledgements and proposals must carry and match both the approved version and exact canonical digest, or an equally strong immutable revision binding. Missing, stale or mismatched digest must deny. Cover same-version changed-content cases, changed-version cases, and canonical-equivalent object ordering. Keep existing policy-owner and current-domain approval gates.

## P2 — shared minimizer does not enforce field value schemas

`privacy-core-service.ts:18-34` whitelists top-level names but recursively admits arbitrary nested JSON field names. On the exact submitted source:

```js
await core.minimize('model_artifacts', {
  runId: { rawPrivateText: 'synthetic-private-text', password: 'synthetic-not-secret' }
});
```

returns the nested content unchanged under `runId`. This is an actual service call after a valid synthetic approved policy was read from Firestore. Depth/size/prototype restrictions do not make a metadata identifier a valid container for arbitrary private content. The separate `collectArtifact` method does validate its input scalars, so this reproduction does **not** claim that collector persisted the nested text. The exported shared minimizer, however, cannot yet substantiate reusable per-class minimization.

Required correction: define/enforce permitted field types/reference shapes per class (or explicitly restrict this source checkpoint to reviewed scalar metadata fields). Reject nested private content placed beneath a whitelisted identifier; test intended text-bearing fields separately without allowing extra arbitrary object keys. Do not introduce unapproved live retention/content policies to fix validation.

## Independent verification and limits

- Verified clean source at candidate SHA and matching remote reviewer ref before probing.
- Backend/frontend source locks and installed cache lock fingerprints checked against the preserved `kan33-locked-20261031/locks.json`; runtime/contracts lock fingerprints checked too. Read-only dependency junctions only; no dependency install/generation or credentials copied.
- `node scripts/privacycore-check.mjs`: **44/44 passed**, independently, on official SHA-pinned Firestore emulator 1.22.0, Java 21, loopback, project `demo-visionary-kan110`. No live fallback. Local log `C:\Users\Administrator\Visionary-local\kan110-independent-80983e8c.log`, SHA256 `cb80d8fe3b00c56b4d505bfa7823b36c057ee7bb0d60f5b84a5e9a3bb79a553a`.
- Three reviewer-owned observation probes appended temporarily to that suite: **47/47 observations passed**, including the two unsafe policy-rebinding outcomes and nested-content return above. These passing observation probes deliberately confirm the defect; they are not acceptance tests. Actual submitted service/store compiled code was unchanged. Original submitted test restored; clean Git state checked before report.
- Probe log `C:\Users\Administrator\Visionary-local\kan110-independent-probes-80983e8c.log`, SHA256 `efef9a93881afadefbaea77541d6ab0bd06f19cc9f0b2c56e14756bf40850382`.
- Inspected ordinary `data:check` registration and deployed-lock `production-check.mjs`: new library sources and Firestore suite are included, while product controller graph remains unchanged. This review did not rerun full SQL/deployed-lock/frontend CI; the two confirmed defects already block source acceptance.
- Layout/import verification passed (3842 imported files, four recorded patches). The new privacy code is project-owned addition; imported tracked originals and Prisma model remain unchanged.
- Tests use synthetic approvals and records only. No account password/session, live user policy, deletion, grant, provider deployment, main branch, worker source, or Jira transition changed. Emulator launchers stopped their owned children. Browser E2E is not proven by these backend checks and remains a separate feature gate.

## Re-review

Return/keep KAN-110 In Progress for these repairs. Submit a new exact SHA and relevant verification; this rejection does not transfer to a later candidate. Any eventual source acceptance remains distinct from named policy-owner decisions, owning-domain/consumer enforcement, authenticated browser journeys, hosted evidence, `dev` integration and actual Jira Done. Preserve the worker/reviewer instances until proper acceptance and cleanup gates are met.
