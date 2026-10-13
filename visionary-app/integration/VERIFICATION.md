# Import and installation verification — 13 October 2026

Scope: import the three supplied repositories, install independent development dependencies, compile the available components, and record integration gaps. This is not a production deployment, real model evaluation or whole-product acceptance result.

D-057 location addendum: the later repository restructure moved frontend code/configs/tests into `frontend/`, local Compose/SQL into `infrastructure/local/`, and the historical `tmp/*.log` evidence listed below into `artifacts/tmp/`. This table records the D-056 commands at their original locations. Relocation verification is in `docs/architecture/RESTRUCTURE_VERIFICATION.md`.

| Check | Result | Evidence |
| --- | --- | --- |
| Pinned source import | PASS: 83 backend, 412 ML and 3,347 REA files; 3,842 total | `upstream-lock.json` |
| Import integrity after installation/builds | PASS: all source hashes match; credential files excluded; no nested Git checkouts | `../tmp/product-import-verification.log` |
| Backend dependencies | PASS: locked install, 530 packages, project-local Node 20.20.2 | `../tmp/backend-install.log` |
| Native password dependency | PASS: bcrypt rebuilt; fictional native hash/compare succeeds | `../tmp/backend-native.log` and recorded command in QA.md |
| Prisma client generation | PASS: Prisma Client 5.22.0 generated without database mutations | `../tmp/backend-generate.log` |
| NestJS production compilation | PASS | `../tmp/backend-build.log` |
| ML Go dependencies | PASS: service modules downloaded with Go 1.25.14 | `../tmp/ml-install.log` |
| ML Go production compilation | PASS: gateway, embedding, vector search and query understanding, plus library modules | `../tmp/ml-build.log`, `../tmp/ml-embedding-build-diagnostic.log` |
| ML local library tests | PASS: circuitbreaker, context keys and shared analytics/utils; modules without tests identified | `../tmp/ml-tests.log` |
| ML Python syntax | PASS: all imported Python files compile | `../tmp/ml-python-syntax.log` |
| Python runtime dependencies/evaluations | NOT VERIFIED: separate environment needed; root requirements include GPU-specific FAISS | `ml/upstream/requirements.txt`, ingestion package declaration |
| REA dependencies | PASS: locked install, 400 packages, host Node 24.19.0; lifecycle hooks suppressed | `../tmp/rea-install.log` |
| REA runtime/skill build | PASS: three build tasks; two existing dynamic-import bundler warnings | `../tmp/rea-build.log` |
| REA CLI | PASS: `npm run rea -- --help` returns REA 6.4.0 command catalog | `../tmp/rea-cli.log` |
| REA native providers, external submodules, agent registration | NOT RUN: five optional provider submodules pinned, none activated | Import lock and toolkit handoff |
| Frontend lint | PASS after tooling/watch configuration | `../tmp/product-foundation-lint.log` |
| Frontend JS and domain types | PASS | `../tmp/product-foundation-types.log` |
| Frontend production build | PASS; application output retained; watcher-only exclusions subsequently syntax checked | `../tmp/product-foundation-build.log` |
| Existing product regression suite | PASS: 485 tests, no failures/skips | `../tmp/product-foundation-tests.log` |
| Local Compose configuration | PASS with a fictional configuration-only password; no containers started | `docker compose -f integration/compose.local.yml config --quiet` |
| Tooling/Vite syntax and whitespace | PASS | `node --check` for changed scripts/config; `git diff --check` |
| Source control coverage | Three imported files match original upstream ignore rules; manifest-based staging command provided | `npm run product:source-control` |
| Real auth/database/ML/frontend interoperability | NOT IMPLEMENTED by this import | `CONTRACT_GAPS.md` |

Temporary npm/Go/compiler logs stay under the ignored `tmp/*.log` paths. The public/internal frontend source and existing browser records were not migrated or replaced. Existing separate styling edits remain outside this import.

The first ML test target list included a Go umbrella module containing no packages; the wrapper now selects actual library modules, and the final command passes. Simultaneous cold compilation caused memory pressure; remaining builds were serialized and Go parallelism limited to two by default. A diagnostic command initially used the wrong relative toolchain depth and was corrected to the absolute executable path. Its failed invocation is not treated as a build result. These were harness/setup corrections, not upstream source fixes.

Backend and REA locked dependencies include upstream deprecation/bundler warnings; no dependency-upgrade or vulnerability-remediation pass is claimed. No upstream source was patched beyond the recorded credential redactions. The bounded pattern scan is not an exhaustive secret audit. Repository owners should revoke/rotate the exposed upstream credentials; redaction does not revoke them.

Next implementation boundary: reconcile real account/workspace identity and server-side access, then a source-authorized RAG-backed learning slice. Current preview data remains local until an explicit, verified migration.

Automatic approval review rejected deletion of the task-created temporary source checkouts with "blocked by policy". Those checkouts remain under `C:/Users/Administrator/AppData/Local/Temp/visionary-import-20261013-hnu5hf7`, outside the product. The reviewed product snapshots and installed dependencies are unaffected; no cleanup workaround was attempted.
