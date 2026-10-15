# Visionary backend and ML foundation

The founder authorized backend, database, authentication, ML and analysis-tool work on 13 October 2026. This supersedes the earlier frontend-only phase restriction, while retaining the existing UI and open acceptance evidence. Importing these repositories starts implementation; it does not make their services compatible or certify model capabilities.

## Source ownership

| Area | Location | Pinned upstream | Purpose |
| --- | --- | --- | --- |
| Existing web product | `frontend/src/` | Existing product history | React/Vite public site and five-role workspace |
| Application backend | `backend/upstream/backend/` | visionaryorg/visionary-dev `81e861be4a87` | NestJS APIs, Prisma schema/migrations, auth, content and chat |
| ML pipeline | `ml/upstream/` | visionaryorg/ragpipeline-master `f7fffc39b789` | Go retrieval services; Python ingestion, reranking and evaluations |
| Engineering analysis | `reverse-engineering/upstream/` | morluto/rea `43738bec579f` | Local REA CLI/MCP and evidence workflows |

`upstream-lock.json` records URLs, complete commits, file hashes, redactions, exclusions and optional REA submodule revisions. These are source snapshots, with no nested `.git` directories and no automatic tracking of upstream `main`. Imported source retains its own package locks, documentation and licenses. The backend repository had no top-level license file at this revision; the founder explicitly supplied organization-owned code. ML has an MIT root license and a proprietary declaration in the ingestion package; preserve both declarations for review. REA carries MIT and third-party notices.

All backend implementation files and deployment source are imported. The old Next.js frontend, design references, upstream CI/deployment credentials and unrelated monorepo documents are excluded from the backend snapshot. All tracked ML and REA files are imported, with known embedded ML credentials replaced by explicit placeholders. REA's five external provider submodules are pinned references, not initialized provider installations.

## Local setup

Run commands from `visionary-app`. Keep the frontend, backend, Go and REA dependency environments separate.

D-057 relocates the web package into `frontend/`, local Compose/SQL into `infrastructure/local/`, and temporary evidence into `artifacts/tmp/`. Root commands still work; see [repository ownership](../docs/architecture/README.md). The backend/ML/REA source paths and import lock remain unchanged.

D-060 installs the Firebase Web/Admin SDKs for the founder's existing production project. Read [Firebase setup and the console handoff](FIREBASE_SETUP.md). Intentional backend dependency/runtime changes are recorded separately in [upstream-patches.json](upstream-patches.json); the original import lock remains the reviewed baseline.

```powershell
# Windows: project-local, checksum-verified runtimes; no global PATH changes.
powershell -NoProfile -File scripts/setup-toolchains.ps1
npm run backend:install
npm run backend:build
npm run ml:install
npm run ml:build
npm run ml:test
npm run rea:install
npm run rea:build
npm run rea -- --help
npm run product:doctor
npm run product:verify-imports
```

The original backend declared Node 20; its historical project-local Node 20.20.2 remains installed but is no longer selected by backend tasks. Firebase Admin 14.5.0 requires Node 22+, so D-060 moves the backend declaration/commands to supported Node 22/24 LTS (24 recommended), using the installed runtime. The ML modules require Go 1.25; the local toolchain is Go 1.25.14. REA uses the host's compatible Node 24 and its own npm lock. `toolchains.windows.json` retains the original import-bootstrap download/checksum record; the setup script still installs the historical Node tool plus Go. Provide supported installed Node 22/24 separately for current backend tasks. No global runtime is replaced.

Backend installation suppresses bulk lifecycle scripts, explicitly rebuilds bcrypt and generates the Prisma client. REA installation suppresses lifecycle hooks so importing it does not change the enclosing project's Git hooks or agent configuration. Backend runtime configuration belongs in `backend/upstream/backend/.env`; ML configuration belongs in `ml/upstream/.env.local` and the appropriate service environment. Start from the supplied examples and add `DIRECT_URL` for Prisma. Credentials stay in ignored local files or an eventual secret manager.

Optional local PostgreSQL/pgvector and Redis infrastructure:

```powershell
# Docker Desktop must be running. Only local loopback ports are exposed.
# Set VISIONARY_LOCAL_DB_PASSWORD first, using a development-only value.
docker compose -f infrastructure/local/compose.yml up -d
```

This command provisions new named local volumes. It does not run migrations, seeds, cloud deployments, or copy browser data. Application and retrieval databases are separate. See `infrastructure/local/init-databases.sql`; apply each repository's schema deliberately to its own database after review.

Python 3.11+ is also required for ingestion, reranking and evaluation. The root Python requirements include `faiss-gpu`, so they cannot be treated as a portable Windows installation. Create a separate Python environment and choose the ingestion package's declared dependencies or a compatible Linux/GPU environment. Do not install those requirements into the frontend or the host's shared Python environment. Dependency resolution, pipeline execution and evaluation are separate checks from Go compilation.

## Runtime boundaries

D-075 supersedes the initial import-era topology with the [100,000-MAU system design](../docs/architecture/discussions/system-design.md), [backend/ML audit](../docs/architecture/discussions/backend-ml-audit.md), [operations](../docs/architecture/discussions/launch-operations.md) and [model strategy](../docs/architecture/discussions/ml-strategy.md). Account/onboarding/device sessions and Razorpay test billing are connected locally through Firebase/Firestore. Learning/linked-role APIs and ML remain integration work. Root `backend:dev` (existing `backend:auth:dev` alias) and `backend:start` select the current product app; imported package/Docker defaults select legacy code and are not launch instructions.

```text
React/Vite web product
        | same-origin authenticated API, cancellation and request IDs
        v
NestJS product backend --- Firestore account/billing + future product PostgreSQL
        | server-owned ML request scoped to person/workspace/source
        v
Private product-authorized AI --- retrieval PostgreSQL/pgvector / optional cache
        | embeddings, retrieval, grounding, generation, evaluation
        v
Configured model providers

REA development toolkit --> local evidence --> reviewed feature requirements
```

The product backend owns identity, workspace membership, authorization, consent, persistence, publication and billing. The ML gateway must receive server-authorized source/context, not browser-selected authority. REA is a development tool, outside the product request path and outside production containers.

## Integration sequence and acceptance

1. **Import and reproducibility:** preserve source, resolve dependencies, compile each component, verify hashes and record concrete limitations. No real user records or upstream deployments are changed.
2. **Account and workspace identity:** retain the connected Firebase session/profile/onboarding and stale-response handling; do not reintroduce the old OTP/JWT identity. Implement durable five-role workspaces/memberships, guardian consent and scoped policy. Profile role selection does not authorize linked-role access.
3. **Content and persistence:** reconcile catalog IDs, source versions, provenance, language availability and learner-safe DTOs. Implement owner-scoped persistence, optimistic revisions and idempotent writes. Migration/export is explicit and preserves browser originals until ownership and acknowledgments are verified.
4. **Product backend to RAG:** define private service IAM plus product assertions with audience, source/workspace restrictions and trusted user identity; reconcile deadlines/cancellation/output contracts and repair session/cache isolation. The current connected app calls neither legacy direct-provider agents nor the imported RAG pipeline. Similar JWT shapes do not establish equivalent authorization.
5. **One evaluated vertical slice:** sign in -> authorized curriculum -> explanation with valid sources -> contextual Ask -> check -> practice -> saved project -> reload/resume. Verify missing models, withdrawn sources, wrong workspace, failed save and cancellation. Extend to all roles after this works.
6. **Controlled beta:** complete remaining device/language/accessibility acceptance, model/content evaluations, observability, retention/deletion, capacity and operational recovery. Claims come from measured evidence; imported README performance claims are historical upstream statements.

`frontend/src/services/backendTransport.ts` defines `content.syllabus`, `content.concept`, `teaching.request` and `mentor.turn`. No matching connected exchange endpoint exists yet. Dedicated authorized contracts and frontend adapters are required; a proxy or copied repository alone does not complete integration. Learning previews remain browser-local until that cutover is implemented and verified; this does not describe the already connected auth/account/test-billing runtime.

## Credential remediation

The backend upstream tracked `github_actions_deploy_private_key.pem`, `github_actions_deploy_public_key.pem`, and `github_classic_token.pem`. They were excluded. ML contained Google API key patterns in test scripts and reports; their values were replaced with `REPLACE_WITH_YOUR_GOOGLE_API_KEY`. The lock records affected paths and original source hashes without exposing values. The repository owner should revoke/rotate exposed secrets and review upstream history and access. File removal or local redaction does not revoke a credential.

The pattern scan is bounded, not a claim of exhaustive secret detection. No imported key was used, printed, copied to frontend configuration or sent to a model provider.

## Updating upstream

Original upstream ignore rules are preserved. Some files were tracked in the upstream repositories despite those rules, including configuration examples and test fixtures. `npm run product:source-control` reports this. When saving the import in Git, use `npm run product:stage-imports` to verify hashes and stage exactly the manifest-listed source files with a forced path list. It never stages local credential files, dependencies, generated artifacts or unrelated frontend edits. This import does not create a commit or push to any repository.

Do not overwrite imported folders or run a pull inside them. Review a new commit in a temporary Git checkout, rerun the inspection, then apply a reviewed source update with explicit local patch ownership and new hashes. `scripts/import-repositories.mjs` refuses existing destinations and imports only the pinned revisions. `product:verify-imports` verifies this initial reviewed baseline; future intentional source changes must be recorded as reviewed patches rather than silently changing the original provenance.

Verification results for this installation are recorded in `VERIFICATION.md` and the existing `docs/visionary/QA.md` log.
