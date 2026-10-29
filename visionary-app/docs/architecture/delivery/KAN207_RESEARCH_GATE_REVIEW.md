# KAN-207 — VMM-R0 — research gate: signed versioned manifest, capability matrix, measurement plan, smoke/deny evidence

## Task review and verification handoff

Jira key / source ID: KAN-207 (VMM-R0, parent KAN-168)
Acceptance scope: gate-manifest deliverable (the R0 research gate itself — the manifest/matrix/plan/smoke evidence; it does not accept KAN-169 product integration or KAN-190/KAN-130 release, and named signoffs are recorded at review, not by the implementer)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve or self-sign (D-095); the gate's named model/data/evaluation reviewer signatories are recorded at review
Worker branch / base commit / candidate head commit: `codex/principal-kan-207-research-gate`; based on the latest lane head `dcc9c11a` (KAN-45 PLAT-01 + whole-repo check), per D-098 (lane lineage …45 → 207).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-207-research-gate`, D-098; `dev` owns integration).
Owned files / contracts:
- `ml/vats/research-gate/manifest.json` (versioned signed manifest: exact source revision recorded by smoke evidence, accountable reviewer ROLE slots with pending signatories, CPU-only bounded local environment, private artifact locations outside public Git, data license policy, honest checkpoint inventory)
- `ml/vats/research-gate/capability-matrix.json` (machine-readable role × mode × task family × source × language/script × modality × age/admission matrix; both first reference journeys; claims ledger with bounded claims, explicit notClaimed set and KAN-172 deferral)
- `ml/vats/research-gate/measurement-plan.json` (fixed research task + primary metric; label taxonomy separating independent review labels, observed outcomes and causal benefit; engineering acceptance PROPOSALS with concrete bounds; hidden-data custodian governance; ownership/deferral)
- `ml/vats/research-gate/smoke.mjs` (dependency-free reproducible environment smoke + 7-check deny suite, importable for negative tests; writes evidence with exact git HEAD + artifact SHA-256 to `artifacts/research/private/gate-evidence/` — outside public Git)
- `ml/vats/research-gate/research-gate.test.mjs` (gate suite, 6 tests incl. deny-suite negatives)
- `scripts/researchgate-check.mjs`, `package.json` (`researchgate:check`)
Prerequisites: none (R0's own definition — it permits isolated research before the full product foundation is finished). Sequence unlocked on acceptance: KAN-170/171/173/174/175/193 (respecting native blockers); KAN-169 retains all product-integration gates.

## Requirement

Create a signed, versioned research manifest with named accountable model/data/evaluation reviewers, exact source revision, approved local environment, private artifact locations, approved model/data licenses and a bounded compute plan. Freeze a machine-readable role × mode × task family × source × language/script × modality × age/admission matrix and claims ledger preserving Teach/Learn and general standalone Build for all five roles, with required English/Hindi/Bengali and OCR slices explicit. Specify two first reference journeys without narrowing final scope. Fix the research task and primary metric; define independent review labels separately from observed outcomes and causal learning benefit; approve the measurement design, endpoint definitions and ownership; record the default engineering acceptance proposals; govern hidden data with an independent custodian; inventory current runtime/model checkpoints honestly. Reproducible local research-environment smoke/deny evidence. (source: KAN-207 description, R4 29 October 2026)

## Acceptance criteria → evidence (ml/vats/research-gate/research-gate.test.mjs, 6 tests + smoke evidence)

- VERSIONED MANIFEST — `manifestId: vmm-r0`, versioned; source revision recorded by smoke evidence (exact git HEAD captured at every run, plus artifact SHA-256 hashes).
- ACCOUNTABLE SIGNOFFS — model/data/evaluation reviewer ROLE slots with accountability statements; named signatories are null and recorded AT REVIEW (implementer cannot self-sign; policy statement in the manifest).
- APPROVED LOCAL ENVIRONMENT — CPU-only, no paid capacity, offline training, no production accounts/credentials; bounded compute plan stated.
- PRIVATE ARTIFACT LOCATIONS — `artifacts/research/private/{data,checkpoints,gate-evidence}/`, declared `outsidePublicGit: true` (verified: `artifacts/*` is gitignored).
- DATA LICENSE POLICY — allowed: authored | rights_cleared; public availability is never a training license (deny D3 enforces per-source).
- HONEST CHECKPOINT INVENTORY — `trainedOwnedWeights: false` (a baseline/configuration is not trained owned weights; deny D6 enforces).
- CAPABILITY MATRIX — five roles (student/teacher/parent_guardian/professional/organization) × four modes (teach_learn/ask/practice/build) with bounded task families; two rights-cleared sources; required en-IN/hi/bn; four explicit OCR slices all `qualified: false`; text + photo_ocr modalities; three admission-gated cohorts; both first reference journeys step-by-step; claims ledger with a bounded claimed set, an explicit notClaimed set (retention/transfer gains, misconception classification beyond BKT, arbitrary-task/omniscience/zero-error/AGI/launch claims) and the KAN-172 deferral.
- MEASUREMENT PLAN — research task and primary metric fixed (paired next-action quality, lower-95%-bound>0 promotion rule as a proposal); independent review labels separated from observed outcomes and causal benefit; engineering acceptance recorded as design PROPOSALS (deny suite zero, 100% contract checks, p95 CPU batch-1 ≤50 ms, artifact ≤50 MiB, per-slice degradation ≤2 pp, underpowered = unresolved); independent hidden-data custodian; dev/validation-only model selection; dataset-specific numerics owned by KAN-172.
- REPRODUCIBLE SMOKE/DENY — `node ml/vats/research-gate/smoke.mjs` passes on the frozen gate and writes evidence (gitHead + checks + artifact hashes) outside public Git; the deny suite provably FAILS on injected violations (public-license source, forbidden claim, trained-weights claim, embedded credential) — negative tests in the suite.
- NO PROTECTED DATA — the gate artifacts contain no research data, no learner records, no production accounts and no credentials (deny D1/D2/D7; inputs/locations surfaces scanned).
- Cross-layer closure: Frontend — N/A. API — N/A. Backend — N/A (research gate). Data — private artifact inventory only; nothing exported from protected stores. ML — this IS the ML gate manifest. Hosted — no hosted claim; research evidence never closes hosted/user-outcome/release gates.

## Commands, exit codes, test counts and timestamps

- Gate suite: `npm run researchgate:check` → `node --test` → 6 tests, 6 pass, 0 fail (2026-10-29). Smoke run inside the suite: passed=true, evidence written to `artifacts/research/private/gate-evidence/research-smoke-evidence.json` with candidate gitHead.
- Whole-repo context on the base head dcc9c11a: full `npm run check` composition green (layout/imports/continuity/script tests/API contracts/surface audit/frontend lint+typecheck+tests+build); full `backend:build` exit 0; 44 backend contract suites green; infra suites green (node 33/33, python 21/21).

## Remaining defects, limitations and linked open gates

- Named signatories are PENDING — the gate stays open until the named model/data/evaluation reviewers (and the founder as acceptance owner) sign at review; unresolved measurement ownership keeps R0 open per the ticket.
- OCR slices and all numerical thresholds remain unqualified/deferred (VOCR-02, KAN-172); the matrix expanding before release is expected.
- Research evidence never closes hosted, user-outcome or release gates; KAN-169 retains all product-integration gates.
- No research data was created or committed; private locations are empty inventories awaiting custodian-approved data.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and the named model/data/evaluation signoffs)
