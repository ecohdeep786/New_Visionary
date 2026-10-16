# Backend execution and ML handoff

16 October 2026 · D-082 · [launch tracker](BACKEND_LAUNCH_CHECKLIST.md) · [machine-readable Jira backlog](tracking/jira-backlog.json).

The next product milestone is a durable, authorized learning-to-project journey across two devices. The account/payment foundation is connected locally. Domain records, private AI and hosted acceptance remain work. A product is ready when actual journeys and failure recovery pass; an architecture diagram or a model response does not establish readiness.

## End-to-end connection

```text
React routes / existing service facades
  └─ same-origin /api; secure session + CSRF + expected-account + command/revision
      └─ GCP HTTPS ingress / request limits / load balancing                 [planned]
          └─ stateless modular NestJS product API                           [local subset]
              ├─ Firebase identity + verified device session                [connected locally]
              ├─ account/onboarding/Free/test billing/invoices → Firestore   [connected locally]
              ├─ account feedback → same UID's Firestore subtree            [D-082 local slice]
              ├─ workspace/membership/consent/source policy                  [next foundation]
              │   └─ PostgreSQL domain transaction + revision + outbox       [planned]
              │       ├─ catalog / learning evidence / progress
              │       ├─ project revisions / explicit shares / class copies
              │       └─ reports constrained by relationship and purpose
              ├─ private file intent → GCS quarantine / verify / scan        [planned]
              └─ usage reservation + owned durable run + authorized context  [planned]
                  └─ private IAM-authenticated worker / ML entrypoint
                      ├─ validate signed actor/workspace/run/source scope
                      ├─ retrieve only permitted published source versions
                      ├─ selected API or later own-model adapter
                      ├─ schema/citation/language/action/safety validation
                      └─ recheck policy → persist candidate + usage settlement
                          └─ API delivers current scoped result/events
                              └─ UI can review/save/accept explicitly

Outboxes → private Tasks/workers → retry/lease/reconcile → durable status
Metrics/traces with redacted IDs → alerts + scoped operator procedures
Optional cache → scoped key + reauthorization; database remains authority
```

Every arrow crossing a service boundary needs a deadline, authorization, bounded payload, observable outcome and recovery rule. Firestore and SQL each commit their own records/outboxes; there is no assumed cross-store ACID transaction. A retry uses the same mutation identity. A project save uses an expected revision; conflicting edits preserve drafts for comparison. Events prompt a refetch and never grant permission. Cache invalidation does not replace access checks. Load-balanced instances cannot depend on local memory for domain state, quota, billing commands or job ownership.

During AI failure, ordinary authorized saves should remain available when their store is healthy. Model calls have admission/concurrency caps so they cannot exhaust API resources; split the process further if measurements justify it. Initial teaching requests must fit the existing20s client deadline and proposed18s backend budget. Long Build work uses durable run/status/cancellation rather than a misleading long synchronous request.

## Fresh source review and disposition

Rechecked the active product module and account authority, browser transport, imported gateway/session/cache implementations, and current ingress limits. The findings agree with the existing D-075 audit:

| Observed source | Finding | Implementation action |
| --- | --- | --- |
| backend `src/main-auth.ts`, `firebase-product.module.ts` | Standalone Firebase account/test billing runtime; legacy Prisma/JWT/model modules are absent | Keep this entrypoint; add bounded modules deliberately; preserve auth/payment regressions |
| backend `request-authority.ts` | Session/device, Origin/CSRF and expected-account checks already shared | Reuse for feedback and future browser commands; domain endpoints additionally need server-owned workspace/object policy |
| backend `main-auth.ts` | Normal JSON24KiB; signed billing webhook256KiB | Feedback fits. Define reviewed per-route limits before larger project/submission APIs; no unlimited/global base64 bypass |
| frontend `backendTransport.ts` | Four domain operation adapters,20s total deadline; no connected domain URL | Replace preview persistence per accepted slice; preserve account/workspace stale-response rejection |
| ML `middleware/auth.go` | Legacy HMAC identity and process-local IP limiter | Replace at private product boundary; browser JWT/role claims cannot grant ML authority; use UID/fleet fairness |
| ML `handler/query_handler.go` + `session/session_manager.go` | Caller session ID loads history without actor/workspace comparison; Redis TTL/turn truncation | Do not expose. Persist owned SQL conversation/revisions; scope every read/append/delete and prevent concurrent lost updates |
| ML `cache/response_cache.go`, `semantic_cache.go`, `cag_orchestrator.go` | Keys lack complete policy scope; private query logging and detached fills | Keep protected-response caches disabled until scoped lookup, revocation/cancellation and redaction tests pass |
| ML `handler/websocket.go` | Permissive origin default and detached120s context; synchronous requests also use120s | Fail closed on ingress; bind lifecycle/cancellation to authorized runs and reconcile deadlines |
| Imported ML feedback handler | Separate legacy flow and aggregation | Do not attach it to the new product feedback or automatically reuse notes for training |

Retain useful parsing, chunking, retrieval, reranking and evaluation modules behind repaired boundaries. Legacy startup, identity, unscoped cache/session and provider assumptions remain quarantined reference source. Remove dependencies/routes only after replacement coverage and a recorded upstream patch; do not delete retained user data or erase upstream provenance.

## First execution sequence for one founder

Keep at most two implementation items actively in progress. Policy/provider decisions can be researched alongside a slice, but independent side effects still need one accountable executor.

1. **Now — contract/data foundation:** SCOPE-01/03/04/06 and DATA-01/02. Inventory actual exposed operations; choose the first approved source/category/language slice; write tested server-owned workspace/membership/consent and source criteria. Keep the five-role expansion visible. Do not persist browser preview membership as verified authority.
2. **Alongside that — staging foundation:** PLAT-01 and remaining P02 gates. A reviewed GCP environment, independent runtime/deploy CI, IAM/secrets, limits, telemetry and backup/restore checks must accompany the first real-user domain store.
3. **Next — the durable vertical slice:** published source → authorized learning/check evidence → private document project/revision → second-device resume. Add bounded jobs/private files as required. Test wrong user/workspace, conflicting saves, revoked sources, outage, retry and interrupted writes through real adapters.
4. **Then — private AI connection:** own the run/usage/context/output boundary and benchmark an approved API. Attach useful retrieval components only after isolation tests. Models propose explanations/artifacts; the server validates actions and evidence, and the user explicitly accepts protected changes.
5. **Expand — roles, billing, operations:** teacher/classroom, guardian summaries, professional/company and organization workflows; hosted test billing and actual merchant events; exports/privacy/support, whole journeys, then realistic load/recovery/cost acceptance. Commercial live payments remain a distinct gate.

D-082 implements account feedback independently on the existing account store, without pretending that P00/P01 or full PRIV-05 is complete. The remaining support case/operator/export/privacy gates are explicit. This small slice provides a useful channel while the durable learning foundation is built.

## ML boundary before the founder's own-model strategy

Own these stable product interfaces: authorized source retrieval; bounded generation request; candidate output schema/citations/actions; durable run state; usage measurement; evaluation case/result. The selected API and future self-hosted model implement the same generation interface. Neither can directly modify identity, payment, consent, published sources or assessed mastery. Keep provider/model configuration outside domain code and secrets outside the repository.

The initial evaluated workflow is permitted task/context → retrieve approved evidence → bounded model/tool steps → validate → abstain or deliver a candidate with citations → capture optional user feedback → reviewed regression analysis. A useful education system combines these controls with product state and measured learning outcomes. Do not equate fluent prediction with verified reasoning, correctness or AGI.

The own-model plan should later supply intended tasks, licensed/consented data, modality/language scope, serving target and compute/budget. Compare it on the same held-out educational, safety, privacy, latency and per-success cost evaluations as APIs. Do not silently train on student work, private conversations or feedback. No new provider/model has been selected, called or trained in this slice.

## Feedback-to-improvement loop

Feedback stays optional and reachable from every permitted connected dashboard section. Ask one question, offer two ratings and an optional short note; do not repeatedly block lessons, checkout or editing. Save only user-submitted fields plus minimized section/locale and server receipt, under verified UID. Keep a failed note available for explicit retry and confirm success only after commit.

Authorized future triage groups recurring usability/reliability/content issues, reproduces them with consented or synthetic examples, links a minimized engineering issue, tests a fix and monitors the affected journey. No automatic copying of learner notes into Jira, unrestricted founder user dumps, model-training consent or guaranteed response SLA is introduced. Full support cases, staff policy/audit, export inclusion and hosted privacy acceptance remain launch tasks.

## Jira handoff

D-084 update, 16 October 2026: the founder-selected **[Team AGI (KAN)](https://visionary-team.atlassian.net/jira/software/projects/KAN/list)** project contains 123 tasks plus 15 epics, with 30 native phase dependencies and two task blockers. The [fresh backend/ML review](BACKEND_ML_JIRA_REVIEW.md) adds metric and quality-export bugs AI-11/12 and refines nine existing acceptance descriptions. D-083's initial 136-item snapshot remains historical evidence. Earlier D-082 site-unavailable checks are superseded; current API access succeeds. Reuse the selected project. See [current Jira tracking](tracking/JIRA_SYNC.md) and [verified issue map](tracking/jira-issue-map.json).

`node scripts/launch-backlog.mjs --write` regenerates [jira-backlog.json](tracking/jira-backlog.json) from stable checklist IDs, preserving complete/open/later distinctions and dependencies. Search each stable ID label before creating an issue; persist resulting keys immediately to avoid duplicate creation after a lost response. Use one epic per phase, owner responsibilities and acceptance criteria, Now/Next/Later queue, and a work-in-progress limit of two. No calendar delivery promises, assignees, project key or issue URLs are fabricated. Actual dates follow capacity estimates after the first slice; a dependency order is not a committed schedule.

Readback verifies every task's parent, stable source-ID label and status across both result pages, plus all 32 dependency directions. The 12 scoped local tasks are Done, 106 launch tasks To Do and 5 later tasks Idea; phase epics add one Done, 13 To Do and one Idea. The seven-task Now view establishes the first execution queue. WIP2 remains guidance, not an enforced Jira board limit; dates, sprints and assignees remain unset. Preserve hosted/provider gates and reconcile current Jira state before future synchronization.
