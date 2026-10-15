# Repository structure and ownership

D-057, 13 October 2026: the founder requested a recognizable product structure before detailed system-design, scale, stack, cloud/DevOps, MLOps and testing discussions. Existing frontend jobs establish shared product vocabulary while backend and ML retain independent authority and runtime boundaries.

| Directory | Ownership | Guide |
| --- | --- | --- |
| `frontend/` | Routes, UI, domain/service adapters, styles, assets, frontend tests/dependencies | [Frontend](../../frontend/README.md) |
| `backend/` | Identity, workspaces, consent, authorization, application records and APIs | [Backend](../../backend/README.md) |
| `ml/` | Ingestion, retrieval, orchestration, grounding and evaluation | [ML](../../ml/README.md) |
| `reverse-engineering/` | Observations, local analysis and feature evidence | [Research](../../reverse-engineering/README.md) |
| `integration/` | Cross-component contracts, upstream locks and interface gaps | [Integration](../../integration/README.md) |
| `infrastructure/` | Local provisioning and eventual reviewed deployment code | [Infrastructure](../../infrastructure/README.md) |
| `docs/visionary/` | Product requirements, evidence and three living logs | [Current status](../visionary/CURRENT_PRODUCT_STATUS.md) |
| `docs/architecture/discussions/` | System-design and engineering discussion material | [Index](discussions/README.md) |
| `scripts/` | Product commands, integrity checks, imports and migrations | Root package scripts |
| `artifacts/` | Retained scratch files, screenshots and reports | [Artifacts](../../artifacts/README.md) |
| `.tools/` | Ignored project-local runtimes | Toolchain manifest |

The actual application lives in `frontend/src/`; root commands preserve the existing developer workflow. Each component owns its package/module locks. Builds go to `frontend/dist/`. Local Compose and its SQL moved together to `infrastructure/local/`, preserving relative mounts.

Use the [domain map](PRODUCT_DOMAINS.md) to name API operations, backend modules, model jobs and tests. D-075 supplies the [100,000-MAU system design](discussions/system-design.md), [source audit](discussions/backend-ml-audit.md), [launch operations](discussions/launch-operations.md) and [model strategy](discussions/ml-strategy.md). Target services remain implementation work unless explicitly marked connected. Pinned imports retain their internal structure and hashes; relocation does not invent new services.

`restructure-2026-10-13.json` records moves and pre-move hashes of 577 frontend source/asset/test files, including existing uncommitted typography edits. `product:verify-layout -- --preserved-source` verifies the relocation snapshot. Normal layout verification permits future intentional source changes. Historical paths in append-only logs are retained: root `src/`, `public/` and `tests/` now belong to `frontend/`; old `tmp/` evidence is under `artifacts/tmp/`; other scratch work is under `artifacts/legacy/`.

The migration refuses existing destinations, verifies absolute endpoints remain inside the product, and uses literal moves. The product Vite server is restarted on the same port. Application files/assets are unchanged; configuration, command and link consumers are updated separately. Folder organization does not change account, model or cloud capabilities.
