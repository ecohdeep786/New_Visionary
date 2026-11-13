# KAN-134 / BUILD-LAUNCH-03 publication — reviewer-corrector pass (2026-11-13)

Branch `codex/principal-kan-134-publication` @ b0134894 (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE + one consistency correction

The publication law reviewed clean (publication suite within the VMM battery):

1. **Explicit approval, bound to the exact artifact digest + revision** — the owner requests, the CUSTODIAN approves; no self-publication and no model-initiated publication.
2. **Credential refs stay private** — connector credentials are vault REFS (`vault:` prefix) never raw values; non-owner/reviewer cannot read refs; the published payload carries refs only (`credentialValuesExposed: false`).
3. **Stale/revoked approvals fail safely** — a wrong digest/revision approval refuses; revocation after publication marks the artifact REVOKED and stops serving; a revoked approval refuses re-publication.
4. **Duplicate publication refused** — the record keys on `artifactDigest:revision` (content-addressed), so the same artifact+revision cannot publish twice.
5. **Scoped connectors** — storage/database/api connectors register with vault refs; unregistered connector refs refuse publication.
6. **Deterministic rollback** — to an earlier PUBLISHED revision only (forward rollback refused); user records unchanged.

**Consistency correction**: `publicationId` was counter-based (`pub_1`, `pub_2`, …). The record itself keys on digest:revision, so the security laws are unaffected — but the receipt label must still never collide across runtime instances/restarts (the lane's proven counter-collision class, applied consistently in KAN-114/133). Now `pub_{uuid4()}`. Suite stayed green.

## Re-integration

Merged `origin/dev` cleanly (no conflicts; VMM-era base predates the privacycore work — no superseded variant). The branch's OWN payload — `ml/vmm/publication.py` + its tests — is intact.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| VMM battery (incl. the publication tests; 317 total) | `VISIONARY_PYTHON=<py312> node scripts/vmm.mjs test` | **317/317 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-13)

Publication is founder-gated ML infrastructure (custodian approval is the founder's accountability); the public product makes no publication/deployment claims (the KAN-132 /research probe law: no unreleased-capability advertisement). The law is proven by the 317-test battery.

## Notes for the reviewer

- The custodian-approval requirement is the invariant to preserve at integration — publication without a custodian approval must refuse even if the requester is an owner.
- Credential refs: the vault implementation resolves `vault:` refs server-side only; raw values must never enter the publication payload (the contract pins `credentialValuesExposed: false`).
