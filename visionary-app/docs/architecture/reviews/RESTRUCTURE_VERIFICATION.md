# D-057 repository relocation verification

13 October 2026. Scope: reorganize product files and developer entry points while preserving frontend behavior, data and imported source. System design, cloud/provider selection, backend API implementation and model evaluation remain separate work.

| Check | Result |
| --- | --- |
| Frontend source/assets/tests | All 577 pre-move SHA-256 values match their new paths, including existing typography edits |
| Upstream source | All 3,842 reviewed hashes still match; backend/ML/REA paths are unchanged |
| Root command separation | Thin dependency-free product package delegates frontend commands to `frontend/` |
| Frontend lint and both type configurations | Pass through root `npm run check` |
| Frontend regressions | 485 pass; zero failures/skips |
| Frontend production build | Pass; output under `frontend/dist/`; application entry remains `index-CuYUxBsp.js` |
| Development workflow | Root `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` starts the relocated Vite package |
| Development HTTP paths | Root and Student routes, `/src/main.jsx`, manifest and product font return HTTP 200; manifest parses as Visionary |
| Root production preview | Preview command serves Student, the compiled application entry and product font from `frontend/dist/`; isolated preview stopped after checking |
| Backend root command | `npm run backend:build` passes after restructuring |
| REA root command | `npm run rea -- --help` passes and identifies 6.4.0 |
| Local infrastructure configuration | `docker compose -f infrastructure/local/compose.yml config --quiet` passes with a fictional configuration-only password |
| Documentation links | Three first-party files updated; append-only logs and protected product-owner documentation excluded |
| Temporary files/reports | Original scratch files moved to `artifacts/`; no cleanup/delete performed |
| Existing report tracking | Previously tracked audit reports/scratch evidence have explicit ignore-rule exceptions |

The identified product Vite process on 5173 was stopped for relocation and restarted on the same port after commands were updated. Other processes/browser records were not operated on. Public/frontend source files were moved byte-for-byte, not redesigned. Installed frontend dependencies and their original lock moved together; no dependency versions were upgraded.

`restructure-2026-10-13.json` records the complete move list and source hashes. Normal layout checks allow future intentional source edits; the `--preserved-source` flag verifies this one-time snapshot. Historical log commands/paths remain historical. Their old root `src/`, `public/` and `tests/` now belong to `frontend/`; old temporary evidence is retained under `artifacts/tmp/`.

Evidence logs: `artifacts/tmp/restructure-check.log`, `restructure-backend.log`, and `restructure-rea.log`. Existing backend/ML/REA dependency/build evidence remains in the relocated `artifacts/tmp/` files documented by D-056. These checks do not certify rendered account journeys, native accessibility, real model responses or a live frontend/backend/ML connection.
