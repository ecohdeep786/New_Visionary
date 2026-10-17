# Repository structure and ownership

D-093 agent delivery: [branch ownership, isolated checkouts and review-to-release workflow](BRANCH_WORKFLOW.md). `dev` is integration, `main` is production history; Codex, DeepSeek and the founder use separate worker branches. The existing calendar remains the earlier one-agent forecast until capacity and task ownership are reforecast.

D-091 calendar handoff: [full task dates, effort and backend/ML change map](DELIVERY_CALENDAR.md) with [machine-readable forecast](tracking/delivery-schedule.json). The founder confirmed one founder + one coding agent. All 127 open launch tasks, six conditional Later reviews and 14 phase rollups have native Jira start/due dates verified; 13 historical Done items retain their original records. Daily capacity/effort are assumptions, not demonstrated velocity or delivery promises. Dates never trigger implementation or release automatically.

D-090 current continuation: [lifelong education delivery contract](../../integration/LIFELONG_EDUCATION_CONTRACT.md) reconciles the [vision audit](VISION_ALIGNMENT_REVIEW.md) with three focused tasks and explicit existing-task acceptance. The current [launch plan](EDUCATION_LAUNCH_PLAN.md) and [Jira record](tracking/JIRA_SYNC.md) cover 145 tasks/15 epics and 163 native dependencies. All original requirements, current journeys and seven VATS boundaries remain. Earlier dated counts below are historical checkpoints; no runtime capability or new Done is implied.

D-088 current handoff: [India education, natural voice, offline continuity and staged Build launch](EDUCATION_LAUNCH_PLAN.md), based on [primary-source AGI/education research](../../research/EDUCATION_AGI_RESEARCH_2026_10_17.md). [Verified Jira tracking](tracking/JIRA_SYNC.md) covers 142 tasks and 15 epics with 137 dependencies. The [implementation manifest](tracking/education-launch.json) connects every task to VATS, feature families, prerequisites and eleven delivery layers. This is planning evidence; no runtime feature or AGI achievement is claimed. Earlier paragraphs retain their dated scope.

D-087 implementation direction: [VATS seven-layer ownership, actual code and ordered Jira delivery](VATS_IMPLEMENTATION.md), with [machine-readable task/layer mapping](tracking/vats-delivery.json) and [backend↔ML contract](../../integration/VATS_CONTRACT.md). Both Document03 variants are reconciled; AIRA coordinates these seven capabilities. Product integration and broad AGI evidence remain separate gates.

Implementation tracker: [backend-to-launch checklist](BACKEND_LAUNCH_CHECKLIST.md), with [completed/partial/source evidence](BACKEND_LAUNCH_EVIDENCE.md). Work is broken into dependency-ordered chunks and explicit launch gates.

Execution handoff: [current backend/ML wiring and next slices](IMPLEMENTATION_HANDOFF.md), [Jira synchronization state](tracking/JIRA_SYNC.md) and [account feedback contract](../../integration/FEEDBACK_CONTRACT.md).

Fresh D-084 review: [backend/ML findings, isolated reproductions and Jira closure criteria](BACKEND_ML_JIRA_REVIEW.md). Imported ML remains disconnected; this review does not certify model quality or AGI capability.

D-086 founder reconciliation: [37 source documents, per-file decisions and deterministic VATS/AIRA delivery](FOUNDER_SPEC_RECONCILIATION.md), including tested local policy/metric/client changes and the remaining durable integration. The [feature delivery trace](FEATURE_DELIVERY_MATRIX.md) maps 137 tasks across frontend, APIs, data, jobs, cache, real-time and AI; product/capability acceptance remain separate.

Current baseline: [final architecture recommendation and release evidence](FINAL_ARCHITECTURE_RECOMMENDATION.md), consolidated after the founder's reference reviews. Implementation and measured acceptance remain staged work.

Architecture review: [grouped platform map](diagrams/PLATFORM_ARCHITECTURE.md), [numbered request paths](diagrams/REQUEST_PATHS.md) and [scale/recovery](diagrams/RESILIENCE_AND_SCALE.md), with [current implementation gaps and next steps](VISUAL_REVIEW.md).

For visual review, use the [system-design diagrams](diagrams/README.md). The separate [Build architecture](build/README.md) extends the shared blueprint with durable projects, reviewed AI proposals and staged execution/preview boundaries after the Claude/ChatGPT/Gemini reference study.

D-057, 13 October 2026: the founder requested a recognizable product structure before detailed system-design, scale, stack, cloud/DevOps, MLOps and testing discussions. Existing frontend jobs establish shared product vocabulary while backend and ML retain independent authority and runtime boundaries.

| Directory | Ownership | Guide |
| --- | --- | --- |
| `frontend/` | Routes, UI, domain/service adapters, styles, assets, frontend tests/dependencies | [Frontend](../../frontend/README.md) |
| `backend/` | Identity, workspaces, consent, authorization, application records and APIs | [Backend](../../backend/README.md) |
| `ml/` | Ingestion, retrieval, orchestration, grounding and evaluation | [ML](../../ml/README.md) |
| `reverse-engineering/` | Pinned REA toolkit and setup guide | [Toolkit](../../reverse-engineering/README.md) |
| `research/` | Visionary study scripts, reports, templates and evidence indexes | [Research](../../research/README.md) |
| `integration/` | Cross-component contracts, upstream locks and interface gaps | [Integration](../../integration/README.md) |
| `infrastructure/` | Local provisioning and eventual reviewed deployment code | [Infrastructure](../../infrastructure/README.md) |
| `docs/visionary/` | Product requirements, evidence and three living logs | [Current status](../visionary/CURRENT_PRODUCT_STATUS.md) |
| `docs/architecture/discussions/` | System-design and engineering discussion material | [Index](discussions/README.md) |
| `scripts/` | Product commands, integrity checks, imports and migrations | Root package scripts |
| `artifacts/` | Retained scratch files, screenshots and reports | [Artifacts](../../artifacts/README.md) |
| `.tools/` | Ignored project-local runtimes | Toolchain manifest |

The actual application lives in `frontend/src/`; root commands preserve the existing developer workflow. Each component owns its package/module locks. Builds go to `frontend/dist/`. Local Compose and its SQL moved together to `infrastructure/local/`, preserving relative mounts.

Use the [domain map](PRODUCT_DOMAINS.md) to name API operations, backend modules, model jobs and tests. Start with the [D-076 engineering blueprint](blueprint/README.md) for the complete tree, HLD/LLD/object design, frontend/backend communication, researched reference patterns and cloud/cost model. D-075 supplies the [100,000-MAU system design](discussions/system-design.md), [source audit](discussions/backend-ml-audit.md), [launch operations](discussions/launch-operations.md) and [model strategy](discussions/ml-strategy.md). Target services remain implementation work unless explicitly marked connected. Pinned imports retain their internal structure and hashes; relocation does not invent new services.

`restructure-2026-10-13.json` records moves and pre-move hashes of 577 frontend source/asset/test files, including existing uncommitted typography edits. `product:verify-layout -- --preserved-source` verifies the relocation snapshot. Normal layout verification permits future intentional source changes. Historical paths in append-only logs are retained: root `src/`, `public/` and `tests/` now belong to `frontend/`; old `tmp/` evidence is under `artifacts/tmp/`; other scratch work is under `artifacts/legacy/`.

The migration refuses existing destinations, verifies absolute endpoints remain inside the product, and uses literal moves. The product Vite server is restarted on the same port. Application files/assets are unchanged; configuration, command and link consumers are updated separately. Folder organization does not change account, model or cloud capabilities.
