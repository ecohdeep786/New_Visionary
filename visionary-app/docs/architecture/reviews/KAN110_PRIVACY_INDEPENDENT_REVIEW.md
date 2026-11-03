# KAN-110 independent privacy repair review

Current decision. The approved reference integration at exact `7155d4403a685f1bda3b45dcd98d38d9a8b1aba4` passed independent source review. See the integration review below for evidence and the open browser and lifecycle gates.

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

## Re-review of corrected candidate 1080e312d5cd5f0ec222b0aec33ed94049f53e6a

Decision: **CHANGES REQUESTED**, limited to the remaining accessor validation finding below. Earlier P1 policy-content binding and ordinary nested-content P2 findings are corrected on this exact source: both acknowledgement and proposal match digest plus version, missing fields deny, and ordinary object/array/null values are rejected by the bounded-scalar helper. Those earlier defects are not being carried forward as unresolved.

The same task-specific QA instance merged the corrected candidate while preserving the first independent report. Backend, scripts and package source diff against the exact candidate was empty before/after the probes. Reviewer-owned temporary test additions were restored after use; no worker, Jira, `dev` or `main` change was made.

### P2 — accessor values change between validation and returned clone

`privacy-core-service.ts:20-32` evaluates candidate values separately through `Object.values`, `JSON.stringify` and `structuredClone`. `privacy-policy.ts:4-5` admits plain objects containing enumerable getter descriptors. An internal JS caller can therefore pass this input to the exported minimizer:

```js
let reads = 0;
const input = {};
Object.defineProperty(input, 'runId', {
  enumerable: true,
  get() {
    return ++reads < 3 ? 'safe' : { rawPrivateText: 'synthetic-private-text' };
  }
});
const result = await core.minimize('model_artifacts', input);
// result.runId.rawPrivateText === 'synthetic-private-text'; reads === 3
```

The scalar validator sees the first safe value, serialization sees another safe value, and the returned clone contains the third nested value. The actual compiled helper boundary independently reproduced this with no store call; the full exported `minimize` call then reproduced it with the actual Firestore policy adapter in the extended emulator suite. This is specifically an internal JavaScript object boundary issue; ordinary JSON deserialization does not create accessors, and this finding does not claim an HTTP exploit or artifact collector write.

Correction: reject unsupported property descriptors/accessors before reading candidate values and/or validate and return the same immutable plain-data snapshot. Reject unsupported symbol/non-enumerable/descriptor shapes consistently as appropriate to the bounded data contract. Tests should prove malicious getters are never evaluated (or cannot change the accepted snapshot), while ordinary data descriptors still work. Preserve scalar/minimal-field validation and explicit structured-domain schema gates.

### Independent corrected-candidate evidence

- `node scripts/privacycore-check.mjs`: **46/46 passed** with exact corrected source compiled independently. `C:\Users\Administrator\Visionary-local\kan110-independent-1080e312.log`, SHA256 `4cbdffd7b38e5c4d187455d55381419fc2d9367599bf62e9d179e0140eea43ce`.
- Seven additional actual-emulator probes: **53/53 observations passed**. Six validate genuine missing-digest rejection, wrong-version/current-digest rejection, canonical-equivalent key order acceptance, independent proof refresh, corrupt artifact-digest replay denial, and scalar text/nested text behavior. The seventh deliberately reproduces the accessor bypass above and therefore blocks acceptance despite its observation assertion passing.
- `C:\Users\Administrator\Visionary-local\kan110-independent-probes-1080e312.log`, SHA256 `b5d11cd41412bdedf73c0cf59f53b33954d4d7ca07e149cc708b0bda2c06aa36`. Full temporary probe suite preserved outside Git at `C:\Users\Administrator\Visionary-local\kan110-independent-probe-suite-1080e312.cjs`.
- Source registration inspection confirms the ordinary data command includes privacy compilation/emulator checks and the deployed-lock checker includes privacy service/store plus the same test suite. Production checker syntax passed. No broad SQL/deployed/browser success is claimed by this review.
- Actual Firestore was official pinned emulator 1.22.0, loopback-only synthetic project `demo-visionary-kan110`, Java 21, synthetic reviewers/records. Launchers cleaned up their emulator children. No live policy approval, record deletion, admission activation or provider mutation occurred.

Submit the next repaired exact SHA for independent review. Full policy-owner, consumer/owning-domain, browser, hosted, integration and Jira acceptance gates remain as stated above.

## Final source re-review: de99307de4fe3497cf229460382d56580def7406

Decision: **ACCEPTED — INTERNAL SOURCE CHECKPOINT ONLY** for exact `de99307de4fe3497cf229460382d56580def7406`. This is the current source decision; prior rejected candidates and findings above are retained as historical receipts. Reviewer remains `/root/kan110_privacy_review`, independent of the author, and accepts responsibility for this scoped decision.

All three demonstrated source defects are corrected on this exact candidate: acknowledgement/proposal proof binds both version and canonical digest; ordinary nested values cannot pass bounded scalar metadata minimization; own property descriptors are checked before any candidate value evaluation, denying getters, symbols and hidden fields. Policy class and permitted-field arrays also reject accessor elements and unsupported descriptor/key extensions before evaluation. Ordinary enumerable data descriptors, including frozen records, remain usable.

The reviewer's matching task instance merged the exact corrected source without discarding prior review receipts. Backend/source, scripts and package diff against the worker candidate is empty. Temporary reviewer probe additions were restored, and clean state was checked before the report update. No dependency locks/model generation or worker code were changed by this review.

### Exact-source verification

- Independently compiled and ran `node scripts/privacycore-check.mjs`: **48/48 passed**, pinned official Firestore 1.22.0 emulator, Java 21, loopback-only `demo-visionary-kan110`, synthetic review/service identities and records. Log `C:\Users\Administrator\Visionary-local\kan110-independent-de99307d.log`, SHA256 `1715cd4442a111562fab2af46fda8379765eaf43458a0b31d1310d0370facb84`.
- Re-ran six independent proof/replay/minimization probes against this exact compiled source and actual Firestore adapter: **54/54 passed** including submitted suite. True absent digest fields deny; wrong version with otherwise-current digest denies; canonical-equivalent policy key ordering retains validity; refreshing only acknowledgement does not refresh artifact proposal; corrupt persisted artifact digest cannot replay; intended scalar text remains usable while nested text objects deny. Log `C:\Users\Administrator\Visionary-local\kan110-independent-proofs-de99307d.log`; full temporary suite preserved at `C:\Users\Administrator\Visionary-local\kan110-independent-probe-suite-de99307d.cjs`.
- **10/10 separate reviewer-owned actual compiled descriptor-boundary probes passed:** changing getter denied with zero reads; hidden and symbol metadata denied; ordinary frozen data descriptor accepted; policy admission getter denied with zero reads; classes/permittedFields element getters denied with zero reads; policy array hidden/symbol extensions denied; approval digest getter denied with zero reads. These descriptor-only probes do not contact a store. Script `C:\Users\Administrator\Visionary-local\kan110-independent-descriptor-probes-de99307d.cjs`; log of the same name ending `.log`, SHA256 `3b31c54fda83fc3a74964716974533cff865cd2d48804022af34d9a29c21d4bd`.
- Layout/import integrity passed again: 3842 imported files, four recorded patches, credentials excluded. Production-check syntax passed. Relevant ordinary/deployed-lock test registration remains included as inspected above. Full SQL/frontend/CI outcomes remain the integrator's separately recorded evidence; this review does not substitute focused results for them.
- Tests cover transactional pending-erasure/fence durability, rollback and lost acknowledgements through the submitted actual-store suite. Synthetic account/billing preservation and no live fallback remain explicit. Launchers stop their owned emulator children.

### Acceptance boundaries retained

This accepts the bounded implementation source and correction of the independent findings. It does **not** accept a real privacy policy, retention/admission decision, guardian/institution proof, consent publication, completed erasure/export, global consumer fencing, connected product/controller/UI journey, browser end-to-end behavior, hosted/provider deployment, full KAN-110 Done, or KAN-39 unblock. Those require the applicable named owner, owning-domain/consumer, authenticated browser and hosted evidence. No real user records, passwords, policies, grants or provider resources were changed.

**Do not infer merge/Done/cleanup authorization from this source-only decision.** Any integration must have an explicitly accepted scope, complete relevant full checks and remaining product gates. No merge to `dev` or `main`, Jira transition or worktree removal was performed by this reviewer. Later source changes require a new exact-SHA decision. Preserve these receipts alongside the author's handoff and integrator evidence.

## Approved preservation reference integration review

**Decision for `7155d4403a685f1bda3b45dcd98d38d9a8b1aba4`**. The Founder-approved reference asset and the signed-in read-only API and Privacy view pass independent source review. Reviewer `/root/kan110_privacy_review` exercised the compiled API, production HTTP composition, packaged asset and account-scoped client. The authenticated browser journey remains an open acceptance gate.

The named approval receipt binds the preservation reference to canonical digest `2f928ca888cf4d2bddf7b35898788fd3ca093b351ef9344e1db572608140b577`. The service verifies that digest, the named owner attribution, the approval and schema, the nine approved data classes and the owner-controlled retention mode. The result carries the preservation boundaries. The active application graph exposes a read. The Firestore policy publication, runtime reviewer trust, lifecycle jobs, guardian verification and training activation remain separate.

`GET /api/account/privacy/policy` uses the verified Firebase session and bound device, compares the expected-account hint, rejects selectors, and requests a read without touching the session. The Privacy view mounts by signed-in person ID, checks the current account before and after transport, discards completions after unmount and offers explicit recovery when a read fails. The production HTTP middleware applies `Cache-Control: no-store`, and the service limits the asset to 24,000 bytes and returns a bounded summary.

- **Backend**. Independently compiled the privacy suite and passed 52/52 tests against the pinned loopback Firestore emulator and the submitted Nest fixture. The latter covers account authority and the asset corruption, self-rehash and size denials. Log `C:\Users\Administrator\Visionary-local\kan110-independent-60fd9eca-backend.log`.
- **Production package**. Compiled `tsconfig.product.json`, verified that it emits the JSON alongside the service, and compared the parsed emitted and source JSON for equality. The deployment Dockerfile copies that compiled directory into the runtime image.
- **HTTP authority**. Independent loopback probe used the actual controller, `FirebaseProductService.authenticate` and production HTTP middleware with synthetic Firebase verifier and transaction rows. The owner got 200, `no-store`, nine classes and a bounded response. Anonymous, mixed-cookie/device, revoked and stale-session reads got 401. A switched account with a stale hint got 409, a query got 400 and POST got 404. The transaction fixture rejected any write and the session timestamp remained unchanged. Log `C:\Users\Administrator\Visionary-local\kan110-independent-http-9ae13885.log`.
- **Client account fence**. 14/14 submitted client tests passed. Independent probes of the actual transport confirmed a 503 retry is stopped when the account switches during its delay, and 401/409 propagate with one request each. Log `C:\Users\Administrator\Visionary-local\kan110-independent-client-9ae13885.log`.
- **Authority and limits**. The authority audit recognized 39 registered routes. Its paired authority and request-limit suites passed 59/59 after the inventory assertions were updated. Log `C:\Users\Administrator\Visionary-local\kan110-independent-9ae13885-inventory.log`.

Runtime source and the policy asset are identical across `60fd9ecaa311f41481d39f80a7f02d902621ef06` and this reviewed head. The follow-up commits adjusted authority and limit tests, regenerated the v1 manifest and updated the contract test from 38 to 39 routes with an explicit `existing-json` assertion for the policy route. The independent contract run on the intermediate manifest commit reproduced its stale 38-route expectation. The registered contract checker then passed 35/35 on the exact reviewed head. Log `C:\Users\Administrator\Visionary-local\kan110-independent-7155d440-contract.log`.

Acceptance covers the reference integration. Open gates include the authenticated browser render, owning-domain consumer enforcement, retention/export/deletion/support operations, guardian or institution proof and hosted release. Keep the worktrees for the outstanding gates and use the exact candidate SHA for subsequent delivery decisions.
