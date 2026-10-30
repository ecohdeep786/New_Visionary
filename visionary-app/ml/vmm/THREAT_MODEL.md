# VMM-02 (KAN-170) — Private-model supply-chain security & architecture threat model

**Status:** framework candidate (Testing). **Owner lane:** ML engineering.
**Scope:** private training data, model artifacts, evaluation corpora and the
registry that admits them — BEFORE any cloud capacity starts. This document is
the architecture threat model; the implemented controls live in `ml/vmm/`
(stdlib-only Python, no runtime third-party dependency for verification).

## 1. Assets and trust boundaries

| Asset | Sensitivity | Storage class (target) |
|---|---|---|
| Rights-cleared training corpora | Private (consent/license bound) | `private` |
| Model checkpoints (Tiny-D1 and successors) | Private, owner-decided visibility | `private` |
| Evaluation / hidden benchmark sets | Private (custodian-controlled) | `private` |
| Prompt/model/config versions | Internal | `internal` |
| Public docs, code, released interfaces | Public | `public` |

Boundaries: (1) repository/working tree, (2) artifact registry + storage,
(3) training environment, (4) inference/eval runtime, (5) public history.

## 2. Threats and implemented controls

| ID | Threat | Control (implemented in `ml/vmm/supplychain.py`) |
|---|---|---|
| T1 | Dataset poisoning via unclear provenance | Manifest binds license + consent-bearing producer + lineage edges to rights-cleared parents (`build_manifest`, `verify_lineage`) |
| T2 | Artifact tampering / substitution | SHA-256 content digest + HMAC-SHA256 signature over canonical manifest; any field change breaks verification (`artifact_digest`, `sign_manifest`, `verify_signature`) |
| T3 | Credential/private-data leakage via repo | Exposure inventory with path-pattern classification — evidence, not assumption; credential-class contents are NEVER read or recorded (`exposure.scan_tree`) |
| T4 | Registry over-read of private data | Role policy: `consumer` can never read `private` artifacts; only owner/reviewer (`authorize_read`) |
| T5 | Provenance forgery | Lineage edges must resolve to registered parents with exact digests (`verify_lineage`) |
| T6 | Dependency supply-chain compromise | Verification is stdlib-only; `ml/upstream` stays pinned; vendored matches are inventoried with `vendored-upstream` scope |
| T7 | Model theft / uncontrolled redistribution | Storage class + license recorded on the manifest; egress gated by read policy; visibility is an owner decision |

## 3. Current-state evidence (this repository, 2026-10-30)

Run `npm run ml:vmm:inventory` to regenerate `ml/vmm/evidence/exposure-inventory-latest.json`.

Actual result on this tree (7,372 files scanned): **0 critical** credential findings;
10 `credential-template` matches (all `.env.*.example` templates — review-only, no real
secrets); 2 `dataset-candidate` CSVs; 2 `model-weight` artifacts — the pinned
`ml/upstream` reranker ONNX (`flashrank-MiniLM-L-12-v2_Q.onnx`, ~34 MB) recorded with
`vendored-upstream` scope and a streamed digest, plus its `__MACOSX` metadata twin.

Evidence, not assumption: no real credential material was found in the working tree by
pattern scan; the vendored model weight is the one artifact-sensitivity item to record in
the registry when model artifacts start moving. Public git history was NOT audited in
this pass (recorded as follow-up, not assumed clean).

## 4. Residual risks / open items (recorded, not closed)

- Signing keys live in ignored local configuration; a production HSM/KMS rotation
  policy is a separate decision (no cloud capacity starts from this ticket).
- Git history rewrite/scrub is NOT performed by this task; the inventory records
  working-tree evidence only (public-history audit listed as follow-up).
- Registry/storage backend implementation (where these seams are enforced at
  admission/egress) is future integration work.

## 5. Non-goals

No model is trained, scored or served by this module. No hosted/provider gate is
closed. Nothing here asserts that a Testing status equals acceptance (D-095).
