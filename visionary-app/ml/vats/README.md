# Visionary Adaptive Teaching System (VATS)

This is the product-owned ML policy/contract area. Doc03 calls the system **VATS**; VTAS in founder discussion refers to the same seven-layer architecture. [Seven-layer delivery plan](../../docs/architecture/VATS_IMPLEMENTATION.md) and [layer registry](layers.json) define ownership, existing evidence and open work. AIRA is the bounded runtime coordinating these capabilities, not an eighth layer.

Current executable addition: `pedagogy.py` consumes a backend-created, pinned graph/learner/loop snapshot and proposes prerequisite assessment or a teaching strategy. It preserves unknown evidence, traces the earliest prerequisite gap, changes strategy after failure, supports approved visuals and stops within three failed checks. This is a deterministic **uncalibrated reference policy**, not a trained learner model or connected tutoring service. The backend validates request/session/source/criteria/graph/policy/revision binding before any use. Shared synthetic fixtures are in `integration/contracts/fixtures/vats-pedagogy.v1.json`.

Seven logical capabilities do not mean seven mandatory microservices or seven models:

| Layer | Responsibility | Authority / implementation location |
| --- | --- | --- |
| L1 | Perception and input | Product backend admits modality/source/locale; future ML parsing produces hypotheses, not permission or grade authority. Imported query understanding is a disconnected candidate. |
| L2 | Student Cognition Model | Backend owns immutable assessment evidence, BKT projection/version and calibrated mastery criteria. ML consumes scoped read models and proposes prerequisite diagnoses. |
| L3 | Adaptive Teaching Engine | ML proposes pedagogy; backend owns check/attempt/review state and commits. Local policy and binding tests exist; durable integration remains open. |
| L4 | Model stack and output guard | Evaluated provider adapter/retrieval/typed output; imported components require scoped retrieval, cancellation, streaming/cache parity and qualified quality checks before reuse. |
| L5 | Concept visualization | ML selects an approved representation; backend authorizes the versioned manifest; existing frontend renderer owns presentation/accessibility/fallback. No raw scene-token execution. |
| L6 | Memory and personalization | Backend owns purpose-scoped memories, due review, relationships and resumable history. ML receives minimized snapshots; vectors/cache never authorize reads or overwrite evidence. |
| L7 | Reviewed improvement | Launch needs minimized outcome/error evidence, optional feedback, reviewed evaluation cases and rollback decisions. Rights-approved training/experiments are later gates, not automatic session export. |

`upstream/` remains pinned reusable RAG reference source; no directories or original bytes are moved/deleted by this alignment. Do not use its service startup, raw quality exports or training scripts as the product runtime. No direct ML access to another domain's database; a future private worker uses reviewed backend queries/commands and service identity. Account/billing remain available independently of ML.

Run `npm run ml:vats:test` for Python policy and metric contracts, or `npm run ml:test` for those plus existing Go libraries. Python 3.11+ is required; set `VISIONARY_PYTHON` to an explicit interpreter when necessary. No GPU, model downloads, network, learner data or third-party Python packages are needed. Tests do not start a model/backend, train, or certify teaching quality. Serving/model/queue/SQL wiring are still Jira work.
