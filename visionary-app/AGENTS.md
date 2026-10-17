# AGENTS.md

## Product context

Start with `README.md`, `docs/architecture/README.md` and `docs/architecture/PRODUCT_DOMAINS.md`. Keep changes focused on the user's request and preserve existing frontend journeys and role/source/privacy behavior.

## Component ownership

- `frontend/src/`, `frontend/public/`, `frontend/tests/`: application source, assets and regressions.
- `frontend/`: frontend package/lock, Vite/TypeScript/Tailwind/ESLint configs and browser-review scripts.
- `backend/upstream/backend/`: pinned NestJS/Prisma implementation.
- `ml/upstream/`: pinned Go/Python RAG implementation.
- `reverse-engineering/`: local engineering analysis; upstream guidelines apply inside that toolkit.
- `research/`: Visionary study scripts, reports, templates and evidence indexes; keep product architecture in `docs/architecture/` and raw captures in `artifacts/research/`.
- `integration/`: cross-component contracts and source provenance.
- `infrastructure/`: local service provisioning and future reviewed deployments.
- `docs/visionary/`: product contract and append-only STATUS/DECISIONS/QA logs.
- `scripts/`: dependency-free product commands and source-maintenance tools.

Older frontend `src/`, `public/` and `tests/` paths are now relative to `frontend/`. D-056 authorizes backend/ML work; D-057 records this relocation. Do not open or modify `docs/Frontend(Head Of Product Agent)/` for internal-product work.

## Working rules

Follow `docs/architecture/BRANCH_WORKFLOW.md` for agent delivery. `dev` owns integration; `main` owns production release history. Each worker uses its own branch and checkout, with one identified Jira task at a time and agreed file/contract ownership. Do not merge over unrelated uncommitted work, force-push shared branches, or mark user-facing launch features complete from local tests alone. Review and relevant integration checks precede merging into `dev`; release acceptance precedes promotion to `main`.

Root `npm run dev`, `build`, `lint`, `typecheck` and `npm test` delegate to the frontend package. `npm run check` performs layout/import and frontend checks sequentially. Run relevant backend/ML/REA checks for changes to those components.

Keep component locks and environments independent. Credentials stay in ignored configuration. Preserve upstream provenance and record intentional upstream patches. Align domain names and contracts with the frontend task map while retaining server authority and ML boundaries. Preserve unrelated work.

Windows moves must verify absolute source/destination boundaries and retain bytes. The completed `scripts/migrations/2026-10-13-repository-layout.ps1` is a one-time migration, not a repair command. `product:verify-layout -- --preserved-source` checks that relocation snapshot; normal layout checks allow later intentional source changes.
