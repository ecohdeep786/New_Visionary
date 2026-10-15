# Visionary product

The web product, application backend, ML pipeline and engineering research share this product root. Each component owns its source, dependencies and checks. Existing frontend journeys define the product behavior that backend APIs and model workflows must support.

## Repository layout

```text
visionary-app/
├── frontend/             React/Vite application, assets, configs and tests
├── backend/              Application API, identity and persistence source
├── ml/                   RAG services, ingestion and model evaluations
├── reverse-engineering/  REA toolkit and feature-research evidence
├── integration/          Cross-component contracts and upstream provenance
├── infrastructure/       Local infrastructure and reviewed deployment work
├── docs/                 Product contract, status and architecture discussions
├── scripts/              Product commands and source-maintenance tools
├── artifacts/            Local reports, screenshots and retained scratch files
└── .tools/               Ignored project-local runtimes
```

Read [repository ownership](docs/architecture/README.md) and [the frontend-to-service domain map](docs/architecture/PRODUCT_DOMAINS.md). Product requirements and evidence remain in [docs/visionary](docs/visionary/README.md).

## Development commands

Run from this directory. Existing frontend commands continue to work:

```powershell
npm run frontend:install  # Fresh checkout: install the frontend lock
npm run dev              # Vite serves frontend/; default port 5173
npm run build            # Production output: frontend/dist/
npm run preview
npm run lint
npm run typecheck
npm test                 # All frontend service tests
npm run check            # Layout/import checks, then frontend checks in sequence
```

You can also run commands directly inside `frontend/`. Its package lock and installed dependencies were relocated together; no dependency upgrade is part of this restructure. The root npm package only dispatches commands and has no runtime dependencies. `npm ci` at the root installs that command package; `npm run frontend:install` installs the web application.

Backend, ML and analysis-tool commands remain `backend:install`, `backend:build`, `ml:install`, `ml:build`, `ml:test`, `rea:install`, `rea:build`, `rea` and `product:doctor`. See [the integration handoff](integration/README.md) and [infrastructure setup](infrastructure/README.md) before starting services or applying schemas. Upstream source is pinned and checked by `product:verify-imports`; environments remain independent.

## Current runtime and next discussions

The workspace starts at `/dashboard/home` after role-based onboarding. Firebase-mode identity, server device sessions and saved Firestore account/onboarding state are connected locally. Start `npm run backend:dev` (or its existing `backend:auth:dev` alias) alongside `npm run dev`; use `http://localhost:5173`. After `backend:build`, `backend:start` selects the connected production entrypoint. Imported backend package startup/deployment commands belong to the retired legacy application. Read [the auth contract](integration/FIREBASE_AUTH_CONTRACT.md) for setup, tested recovery flows and remaining provider/deployment gates. [Razorpay test billing](integration/PAYMENTS_CONTRACT.md) connects authenticated monthly/annual checkout, persisted subscription state, Family billing benefits and test invoices. Live money/tax invoicing is disabled. Learning workspaces, organization membership, model responses and delivery remain separate integration work; their local previews are for fictional data.

The [100,000-MAU system design](docs/architecture/discussions/system-design.md) links the backend/ML audit, capacity/GCP operations and API-first model strategy. The [discussion index](docs/architecture/discussions/README.md) separates current implementation from target architecture. Future implementation follows reviewed contracts and shared product-domain vocabulary.
