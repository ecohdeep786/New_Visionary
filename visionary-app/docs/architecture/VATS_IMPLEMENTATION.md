# VATS: seven layers, one connected product journey

16 October 2026 · D-087. The founder's “VTAS” refers to **Visionary Adaptive Teaching System (VATS)** in both Document03 variants. [ML ownership](../../ml/vats/README.md) · [layer evidence/exit registry](../../ml/vats/layers.json) · [full task mapping](tracking/vats-delivery.json) · [Jira](tracking/JIRA_SYNC.md) · [earlier 37-file review](FOUNDER_SPEC_RECONCILIATION.md).

## Decision and evidence

Both original Document03 files were re-read, including their three embedded images. The full version has130 extracted blocks; the summary has17. Original SHA-256 values remain `fc72b360b9b058724b2eefddbc22b6199cd34c5bf9a6265974a6dcc3190dd4a2` and `e888396dfece50169f56c94df22c23eb6021fab706516f5acfaee039ec7af1e6`. The summary diagram has cropped labels. Its missing text is not inferred; the full document's layer map and prose resolve the seven names. The claimed advisory attribution is unverified and is not evidence of DeepMind authorship or endorsement. Some prior ignored research extracts are no longer present; fresh source extraction and image copies for this review are retained in `artifacts/qa/vats-alignment-2026-10-16/` rather than pretending old scratch evidence was revalidated.

Keep seven capability boundaries and existing product journeys. **AIRA coordinates VATS; it is not an eighth layer.** ML must not absorb identity/billing, permission decisions, assessment commits or frontend rendering merely to put everything in one folder. Retain the GCP-first modular plan and Firebase UID. No old OTP/JWT replacement, AWS/EKS/Kafka/Neo4j/Qdrant migration, price/model selection or data deletion is authorized by a historical stack table. Reuse imported components behind qualified product adapters; no baseline source is deleted or moved here.

The current active Nest module still connects account/onboarding/device sessions, test billing and feedback. New policy modules are not registered in it. `ml/upstream/` supplies disconnected RAG components, not the complete VATS engine. Python policy files under `ml/vats/` are product-owned, dependency-free library code with local tests; they do not start a service, train, load a model or make network calls.

## Seven-layer ownership and acceptance

| Layer | Product-owned responsibility | Actual state and next acceptance |
| --- | --- | --- |
| L1 Perception & Input | Backend admits input/modality/locale/source; ML extracts intent and concept hypotheses; ambiguous input asks clarification | Imported query-understanding/self-query candidates are disconnected. AI-10 must include text perception, code switching and source mapping, then only released voice/photo/OCR. Inferred grade/age/role never authorizes access. |
| L2 Student Cognition Model | Backend owns assessed receipts, knowledge projections, source/criteria/model versions and separately qualified mastery. ML reads only permitted snapshots | Pure BKT policy exists; new ML proposal can trace an early prerequisite gap. LEARN-09/DATA-01/CONTENT-08 must implement atomic SQL receipts/projection/outbox, calibration and rebuild/replay. Unknown evidence stays unknown. |
| L3 Adaptive Teaching Engine | ML proposes pedagogy; backend owns explain/check/assessment/remediation/review transitions | New uncalibrated reference policy plus backend request/revision/phase binding and prior pure loop have tests. LEARN-10/AI-14 must add actual durable integration. Different remediation, three-failure bound and review suggestion are required; no automatic mastery or notification. |
| L4 Model Stack & Grounding | Evaluated model adapter, authorized retrieval, prompt/tool manifests, typed candidates, citations and independent safety checks | NLI batch-client and metric math have local repairs. Complete caller/stream/cache/source authority and actual provider/corpus evaluation remain AI-01/03/05/06/07/08/11/13. NLI cannot guarantee truth, formulas or safety. |
| L5 3D Concept Visualization | ML selects approved representation; backend admits pinned manifest/parameters; existing frontend renders and provides accessible fallback | Existing frontend representations are preserved. AI-16 supplies the approved registry/protocol and real device/sync acceptance. Do not execute raw SCENE tokens, generated JavaScript or arbitrary URLs; no full-syllabus 3D claim. |
| L6 Memory & Personalization | Backend owns purpose-scoped facts, due review, revisions and relationships; ML receives minimized P0–P3 context | Account/device state is connected, but imported Redis history and frontend previews are not durable authorized VATS memory. AI-04/15, LEARN-11 and SYNC-02 must provide scoped history, correction, due queue and two-device recovery; cache/vector stores are projections. |
| L7 Data Flywheel & Reviewed Improvement | Permitted outcome/error evidence, optional feedback, accountable review, held-out evaluation and human-approved changes/rollback | Optional account feedback and metric contracts exist. AI-09/12/13 and PLAT-07 finish the launch evaluation loop. Raw legacy export remains disconnected; own-model training LATER-04 and online experiments LATER-06 stay separately gated. |

Layer7 starts with trustworthy evidence and reviewed improvement from the first released user, not automatic copying of every conversation into training. Operational receipts, optional feedback, evaluation examples, training eligibility and deployment approval are separate records/purposes. A hashed UID does not anonymize text. No imported TTL/purge, weekly cron/sample-count trigger or automatic p-value/posterior promotion is enabled.

## Runtime communication

```text
Existing frontend / authenticated user / independent devices
  → Nest API: schema, session UID, current workspace/object/consent/source/plan
  → durable command/run + source/criteria/model/policy/graph versions
  → L1 input hypothesis or short clarification
  → backend-scoped L2 evidence snapshot + L6 permitted context
  → L3 prerequisite/pedagogy proposal (no writes)
  → backend rejects stale/cross-scope/unsupported proposal
  → L4 permitted retrieval/model candidate → grounding/typed/safety checks
      └─ L5 approved representation or accessible text/2D fallback
  → current backend policy recheck → authorized delivery/check
  → learner answer → server assessment transaction + immutable receipt
      ├─ L2 ordered knowledge/progress projection (not probability-only mastery)
      ├─ L3 next bounded transition, different remediation or review
      ├─ L6 owned memory/due-review projection and resume cursor
      └─ owning-store outbox → minimized L7 outcome/review workflow
  → scoped polling/SSE/refetch → second device sees committed state
  → optional simple feedback → human triage → evaluated approved improvement
```

The layers are not a mandatory serial pipeline on every endpoint. L6 reads precede generation; L2/L3 iterate after assessed checks; L5 is conditional; L7 is asynchronous after durable evidence. Login/payment never depend on model availability. A socket/event is not a database commit, and disconnect does not authorize repeating a charge or submission under a new key. The backend owns authority and data transactions; ML never reads another domain's database directly. GCP ingress/load balancing/Cloud Run/SQL/private objects/jobs remain the reviewed target architecture, not newly provisioned resources.

Build consumes the same input/context/model/representation capabilities while retaining private project/run ownership, exact artifact revisions and explicit review/share/export. Learning evidence may suggest a project; blank creation remains. A generated artifact or successful preview does not grant assessed mastery, publish a project, transfer IP or issue a credential.

## Local correction made now

`ml/vats/pedagogy.py` implements a strict bounded snapshot contract: pinned policy and graph, valid knowledge estimates/counts, resolved acyclic prerequisites and deterministic root-first proposals. It treats an unassessed prior as insufficient evidence even when it is .99. State/approved-visual/error-hypothesis inputs guide a strategy, a failed check excludes the previous strategy, and pending/passed checks and the three-failure bound retain their distinct actions. No person diagnosis, provider choice or state commit occurs.

`backend/.../learning/pedagogy-proposal.ts` checks exact request/UID/workspace/session/source/criteria/graph/policy/learner-revision/loop-revision binding, eligible targets, allowed strategies, visual admission, hints-only and current loop phase/bound. The returned proposal cannot create an assessed receipt or claim a check passed. The handler still must reauthorize current policy, verify the actual output and commit in its owning transaction. The pure boundary is not a signature or permission check. See the [contract](../../integration/VATS_CONTRACT.md) and12 independent synthetic cross-language fixture cases.

The `.35/.5/.75` policy bands are a versioned reference interpretation of the drafts, not calibrated difficulty or proof of improved learning. The draft's `.70 taught` and `.95 mastered` shortcuts are replaced by criterion-backed assessment and separate knowledge/mastery state. Error labels are reviewable hypotheses; engagement/latency/edit behavior does not justify diagnosing carelessness, fatigue or learning disorders. Full source/locale/device outcomes and thresholds must be reviewed before release.

## Step-by-step delivery

| Milestone | Work to finish | Demonstrable exit |
| --- | --- | --- |
| 1. Scope and shared authority | SCOPE-01–08; DATA-01–09; PLAT foundations; JOB/FILE/CONTENT admission | Enumerated current controls/roles/categories/sources/locales; reviewed schemas and SQL/outbox, UID/workspace/consent/source rules and versioned synthetic fixtures. Start with SCOPE-01/KAN-28, then settle released source/locale and contracts before schema implementation. |
| 2. First assessed learning slice | CONTENT-08; LEARN-01/02/08/09; AI-10 text boundary | One permitted concept/prerequisite snapshot; diagnostic/check uses server criteria, commits one receipt/projection on retry and resumes on a second device. No provider needed to validate this evidence path. |
| 3. Grounded adaptive teaching | AI-01–08/11/14/15; LEARN-10; SAFE-01; shared durable run/usage admission | Real evaluated model response follows current pedagogy/context/source policy, passes output checks and a criterion-backed learner check, with bounded remediation and cancellation/recovery. Shared run foundations may be completed before their parent feature epic closes. |
| 4. Representation and persistent memory | AI-16; LEARN-03/04/11/12; SYNC/CACHE; purpose-scoped reports | Approved visuals with fallback; actual due review and protected timed assessments; same current authorized state across devices, restart and revocation. No arbitrary old SRS exponential formula. |
| 5. Build and released role journeys | BUILD/ROLE/BILL/PRIV integration and their linked ML/context dependencies | Learning→private project→exact revision→review/share only when authorized; teacher/guardian/professional/company journeys respect purpose, expiry and provenance. Existing extra features remain, with truthful unavailable states until connected. |
| 6. Evaluate and host a controlled release | AI-09/12/13; PLAT-07; ACCEPT; RELEASE | Minimal L7 feedback/review/evaluation loop, held-out educational/task outcomes, actual source/language/device acceptance, payment webhook/reconciliation, restore/rollback, measured load/latency/cost and support. No claim from unit tests alone. |
| 7. Extend capability deliberately | LATER-01–06 after their approvals | Qualified runtime/tools, experiments, serving/model independence or infrastructure expansion only where measured benefit, rights, safety and cost justify them. No automatic training schedule or AGI milestone from sample count. |

These are overlapping integration milestones, not a promise to implement every item in a row before independent work elsewhere. The [generated task mapping](tracking/vats-delivery.json) gives all137 source tasks a layer scope, actual Jira key and an explicit prerequisite-compatible planning position. It uses all75 native task edges and preserves30 phase links. Phase blockers organize epic acceptance; they do not implicitly block every child from preparatory or scoped enabler implementation. Native dependencies and current shared authority gates take precedence over the displayed position. No dates, assignees, task statuses or board ordering are invented. The original12 local Done tasks retain their historical scope.

## AGI ambition and real-world evidence

VATS is Visionary's seven-layer **product architecture**. Google DeepMind's public research evaluates depth of performance, breadth across tasks and autonomy; it does not establish that a seven-layer app is AGI. Its [Levels of AGI](https://deepmind.google/research/publications/66938/) therefore informs the separate AI-13 capability scorecard rather than an unverified claim about DeepMind's internal architecture.

The [March2026 cognitive framework](https://blog.google/innovation-and-ai/models-and-research/google-deepmind/measuring-agi-cognitive-framework/) motivates held-out tasks and representative human comparisons across distinct abilities. Our engineering mapping is an interpretation: sensory interpretation→L1; useful output→L4/5; selective focus→L1/3/6; acquiring skills→L2/3/7; remembering→L6; inference→L3/4; uncertainty awareness→L2/4/7; planning/control→L3/AIRA; solving practical tasks→L3/4/Build; social interpretation→L1/3/6 with consent boundaries. This is not a one-to-one implementation of that research or proof of those abilities.

Before a market claim, AI-13 must pin independent development/held-out tasks, leakage checks, human/expert baselines, repeated final-state outcomes, uncertainty/abstention, transfer to unseen tasks, released language/source/device groups and model/prompt/tool manifests. Educational gains need qualified teacher review and delayed retention/transfer evidence; posterior growth alone is insufficient. Product integration, reliable market release and broad general intelligence are separate evidence gates. A responsible plan can advance all three; none guarantees the others.
