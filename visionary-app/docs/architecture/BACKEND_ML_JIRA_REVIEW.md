# Backend, ML and Jira readiness review

16 October 2026 · D-084 · [implementation tracker](BACKEND_LAUNCH_CHECKLIST.md) · [Jira](tracking/JIRA_SYNC.md).

**The connected foundation is account/setup/test billing/feedback. The imported ML is a collection of reusable RAG components and prototypes, with blocking correctness, privacy and integration gaps. Learning/Build domain persistence and evaluated production AI are still implementation work. There is no evidence establishing AGI capability.**

This fresh review follows the active backend import graph, account/payment authority, old identity/document/orchestrator paths, frontend domain transport, ML gateway/session/cache, retrieval filters, ingestion, reranker/NLI, quality export and evaluation code. It compares those observations with all 136 existing Jira items and their descriptions across two result pages, then reads back all 138 items after amendments. It is a critical-path source review with isolated reproductions, not an assertion that every imported file/model binary was audited or that a deployed system passed penetration, educational or capacity testing. Credentials, real learner records and model APIs are not read/called by the probes.

## What exists and what remains

| Layer | Evidence-based state | Jira coverage |
| --- | --- | --- |
| Identity and account | Current Firebase UID/device sessions, Origin/CSRF/expected-account, account tree/onboarding are connected locally | DONE-01–04; DATA-01–09 for domain authority; hosted acceptance remains open |
| Payment and feedback | Test-only subscription/invoice/Family flows and UID-owned explicit feedback are implemented locally; these are retained | DONE-05–08/12; BILL-01–08 and PRIV-05/remaining privacy gates |
| SQL workspaces and relationships | Imported cuid User/Plan schema is legacy. Server-owned UID linkage, membership/consent, source permissions and domain schema remain required | DATA-01–09; ROLE-01–09 |
| Learning and document Build | Frontend previews/invariants exist; four domain transport operation interfaces are not a production persistence/ML connection | CONTENT-01–07, LEARN-01–08, BUILD-01–08 |
| Retrieval/ingestion | Parent-child parsing/chunking, keyword/vector search/RRF, embeddings, caches and evaluation utilities exist as imported candidates | CONTENT-02/03/05/06, AI-05/06/11 |
| Model assistance | Provider integration, prompts, query rewrite, NLI and reranker candidates exist; useful model/corpus/teaching performance has not been newly measured here | AI-01–12, RELEASE-04 |
| Reliable execution | Product jobs/outboxes, shared usage admission, private files, scoped tools/memory and model promotion still need implementation/acceptance | P02/P03/P07; BUILD-04/08; RELEASE-01–08 |
| Own-model strategy | Specific model/training/serving path is unselected and awaits the founder's strategy plus quality/data/economic qualification | LATER-04; no training started |

The 12 completed local tasks are not twelve production capabilities certified end to end. Their Jira descriptions explicitly retain the local-only scope. Do not infer readiness from a large imported folder, README latency/cache claims, a model's confidence or passing small library tests.

## Fresh findings tied to source and closure

Source paths below are relative to the product root. These findings concern disconnected imported code; they do not establish an exposure in the active account runtime.

| Finding | Concrete source evidence | Required outcome / ticket |
| --- | --- | --- |
| Active and legacy backends are separate | `backend/upstream/backend/src/main-auth.ts`, `auth/firebase-product/firebase-product.module.ts`; old `app.module.ts`, `prisma/schema.prisma:13`, `orchestrator/orchestrator.service.ts` | Keep current module graph. Replace legacy identity/domain contracts deliberately; do not seed cuid users or eagerly initialize old providers. DATA-01/02; ACCEPT-06 |
| Session ID is used as conversation access | ML `services/api-gateway/session/session_manager.go:80–140`; query/websocket history paths | Verify UID/workspace/purpose before each read/append/delete/context operation; owned durable history and concurrency rules. AI-04 / KAN-86 |
| Exact/semantic/template/retrieval caches lack complete policy scope | ML `services/api-gateway/cache/` and vector-search `cache/search_cache.go` | Leave protected caching off until namespace, source/version, language, policy and revocation tests pass. AI-05 / KAN-87 |
| Retrieval filters are taxonomy, not access control | ML `services/vector-search-service/handler/search_handler.go:57–88` exposes grade/subject/content type/chapter; ingestion writer/taxonomy also lacks the product policy contract | Actor/workspace/source-release/visibility filtering before search and before model context; no authorization inferred from curriculum tags. CONTENT-05, AI-06 / KAN-88 |
| Grounding reports success on transport failure | ML `services/api-gateway/handler/grounding_validator.go:147–161` sets IsGrounded=true and score1 for unreachable NLI | Reproduced on closed loopback: grounded=true, score1, label unknown. Use explicit unavailable/unverified state, never invented confidence; withhold/abstain or explicitly degrade according to reviewed operation policy. AI-06 / KAN-88 |
| Streaming and nonstreaming grounding differ | ML `handler/query_handler.go:240–290,477–527`: streaming writes answer/end; nonstream invokes NLI for the whole answer and ignores its error | One reviewed output contract; verify citations, partial/final distinction and policy before protected delivery/persistence. Test empty/invalid/truncated NLI responses and multi-claim coverage, not only service timeout. AI-06/08 / KAN-88/90 |
| Quality export collects raw context globally | ML `handler/quality_pipeline.go:18–25,32–39,97–123,128–203`; `main.go:225–243` registers quality export on the ordinary authenticated API | Raw query/response/context, fixed TTLs and weekly dataset generation are not product consent or scoped operator policy. Keep disconnected; no feedback-to-training default or automatic purge. New AI-12; AI-02/09 and PRIV-01/05/06 |
| Model-generated correction is called a golden response | ML `quality_loop/judge.py` constructs generated GoldenResponse and processes negative feedback | Generated candidate corrections need human/subject review, provenance and split-contamination controls; user dissatisfaction is not a correctness label. AI-01/02; LATER-04 |
| Evaluation math can overstate quality | ML `eval/recall_eval.py:35–88`, `shared/go/analytics/evaluator.go:22–112` | Pure-function probes: duplicate recall=2 in both; Go duplicate NDCG=1.63092975; rank2 Python NDCG=.66666667 vs Go/log-discount=.63092975. Reject/deduplicate duplicate IDs; version metric contract and cross-language fixtures. New AI-11; blocks benchmark acceptance |
| Multilingual quality is not established | ML NLI `main.py:31–35` pins an English spaCy pipeline; ingestion limits grade6/7/8; named reranker is not evidence of multilingual recall | Evaluate released language/category slices with reviewed labels and abstention; identify unsupported combinations. CONTENT-06, AI-01/06 |
| Reranker lifecycle/limits need repair | ML `services/reranker-service/main.py`: unbounded query/passages, synchronous rerank in async handler, loaded L12 model versus L6 health label | Bound passage/query bytes/counts, CPU/concurrency/admission, and publish accurate immutable model artifact identity/readiness. Do not assume model name means accepted quality. AI-06; PLAT-04/RELEASE-03 as applicable |
| Authentication must extend through the private plane | ML gateway uses HMAC; downstream search/embed/query/NLI/rerank route registration has no product scope enforcement visible in source | Private ingress/IAM for every invoked service, least-privilege identities, audience/deadline and signed run/source context. Stats/quality/operator routes require their own policy. Hosting IAM still needs deployment proof. AI-03 / KAN-85 |
| Budgets, logs and cancellation remain inconsistent | ML WebSocket Background120s; frontend whole operation20s; process-local IP limiter and multiple raw query logs | Fleet-shared UID/workspace admission, bounded loops/tokens/tool attempts and one usage settlement; cancellation reaches all dependencies; no raw private text in diagnostics. AI-07/08/09 |

The NDCG comparison uses the documented logarithmic discount convention; scikit-learn's primary [NDCG documentation](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.ndcg_score.html) specifies normalization against ideal DCG. Duplicate-ID fixtures demonstrate a validation weakness, not proof that every historical retrieval run contained duplicates or that every old report is invalid. Existing reports must be requalified with the corrected, pinned metric/corpus contract.

## ML system we need to implement

```text
Frontend: explicit user goal + current account/workspace + selected source
  → Product API: verify UID/session, membership/consent/source authority
  → Persist command/run/base revision + reserve usage
  → Private ML boundary: verify service identity and authorized run context
  → Retrieve only permitted source versions; choose bounded workflow
  → API or future own-model adapter; bounded allowlisted tools if needed
      → Each tool rechecks server policy and mutation identity
      → Sharing/submitting/publishing/charging stays an explicit product action
  → Validate schema, citations, language, safety and observed outcome
  → Recheck policy/revision; persist candidate and settle measured usage once
  → UI receives truthful partial/final/unsupported/unavailable state
  → User reviews/accepts; separate assessed evidence determines learning progress
  → Optional minimized feedback; consented/reviewed evaluation loop
```

Persist a recoverable run state rather than a chain of untracked model calls: queued → running → candidate-ready, failed, cancelled or expired; proposal acceptance is a separate conditional command. A generated explanation, a correctly invoked tool and a successfully completed learning/project task are different outcomes. Keep personal/company/guardian memory scopes distinct. Long-term memory requires explicit purpose/preferences, provenance, bounded summaries and current access checks; Redis is an optional acceleration layer, not sole history or proof of consent.

Own the domain state, source rights/versions, tools, learning evidence, evaluation harness and usage ledger. An API now and an own model later implement the same generation contract. A larger model, agent framework or additional planning calls cannot replace missing permission/data foundations. Start with the simplest bounded workflow that passes task outcomes; introduce additional autonomy only when measured benefit justifies its failure, latency and cost surface.

Published engineering guidance supports task-specific evaluation and outcome verification: Anthropic distinguishes the agent harness, repeated trials, traces and actual final environment state and combines deterministic/model/human graders ([agent evaluation guidance](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)). Google's evaluation workflow starts from the application's dataset and criteria, compares models and iterates on results ([evaluation overview](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/evaluation-overview)). These inform our proposed acceptance process; they do not establish that Visionary has those companies' internal systems or capabilities. We have not selected their evaluation product, model or SDK by citing this guidance.

## Jira reconciliation and qualification

Existing 121 tasks and 15 epics were checked against live Jira before amendments. Preserve their IDs and Done/local qualification. Two source-backed repair gaps become [AI-11 / KAN-137](https://visionary-team.atlassian.net/browse/KAN-137) (reproduced metrics defects) and [AI-12 / KAN-138](https://visionary-team.atlassian.net/browse/KAN-138) (quality data/export source findings). The current tracker has 123 tasks: 12 local Done, 106 launch To Do, 5 later Idea; with 15 epics, 138 total items. Actual issue keys and links are retained in the [issue map](tracking/jira-issue-map.json) after successful creation/readback.

Nine acceptance additions are confirmed on AI-01/02/03/04/06/08/09, RELEASE-04 and LATER-04. Readback verifies the original description prefix is preserved and all added criteria are present. No ticket is marked complete by this audit. There are 32 verified native Blocks links: 30 phase links plus KAN-137 → KAN-83 (metrics before benchmark acceptance) and KAN-138 → KAN-91 (quality-data governance before production robustness acceptance).

First implementation order remains: executable contracts and server-owned UID/workspace/consent → source publication/private files/jobs → durable learning/document Build and two-device resume → evaluated private AI → linked-role/hosted/commercial/operations acceptance. Metric fixtures, approved evaluation-data design and isolated ML repair work can proceed before provider selection. The founder's own-model strategy can then be evaluated on the same product tasks, authorized data, cost and serving/recovery constraints; no training is started here.

## Evidence limits

Fresh root-selected ML library checks pass (cached Go results; some selected packages have no tests). Three current backend entrypoint/module-boundary tests and two backlog tests pass. Import verification passes over 3,842 baseline files with the same two recorded patches/six changed baseline files. Python pure functions and Go metric/grounding probes execute without model, Redis, database or cloud service calls. Probe success means the stated defect was reproduced, not that production ML correctness passed. The first combined Go probe failed module resolution before execution; it was split into independently scoped gateway/shared module probes and rerun successfully without changing locks or imports.

Evidence is retained under `artifacts/qa/backend-ml-review-2026-10-16/`. Real provider teaching/citation quality, multilingual labeled-corpus evaluations, authorization adversarial suites, load/latency, hosted IAM, privacy and recovery acceptance remain open. Existing D-082 account/payment/feedback tests are historical evidence and are not relabeled as freshly rerun. No imported implementation, account data or live provider configuration is modified by this review.
