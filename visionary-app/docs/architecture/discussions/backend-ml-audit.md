# Backend and ML alignment audit

15 October 2026 · D-075 · source review against [product domains](../PRODUCT_DOMAINS.md), current Firebase/account/payment contracts and the founder's 100,000-MAU launch target.

The connected account/payment runtime and the imported legacy application are different systems. Preserve the working Firebase UID, onboarding, browser sessions, test subscriptions/invoices and Family privacy. Do not bolt old controllers onto the current app or run old database seeds as product provisioning. The imported RAG implementation offers useful components but is not safe to connect directly as the product's authorized AI interface.

This review inspects the entrypoint/module graphs, identity/data schema, current storage/billing contracts, old chat/orchestrator/upload/job implementations, ML authentication/session/query/cache/context code, timeouts and imported infrastructure. It does not claim an exhaustive vulnerability audit of every imported file, a cloud penetration test or empirical model/performance evaluation.

## Backend classification

Paths below are relative to `backend/upstream/backend/` unless stated otherwise.

| Component/evidence | Finding | Action |
| --- | --- | --- |
| `src/main-auth.ts`, `src/auth/firebase-product/firebase-product.module.ts` | Connected Firebase/account/test-billing entrypoint; module imports avoid old AppModule/Prisma/agents | **Keep as product runtime**, expand by reviewed domain modules |
| Firebase product service, account controller/storage, billing service/repository/provider | Verified session/device/expected UID, canonical UID tree, durable test commands/events, invoice ownership and entitlement rules | **Keep**; hosted and scale acceptance still open |
| `src/main.ts`, `src/app.module.ts` | Old broad startup imports own auth, Prisma, Redis, chat/upload/jobs; can bind same API namespace/port | **Retire from product startup**; root dev/start now use connected runtime |
| `src/auth/auth.service.ts`, `src/auth/strategies/jwt.strategy.ts` | Old password/OTP/JWT identity uses Prisma user, not canonical Firebase UID | **Do not integrate**; retain baseline for provenance, no new accounts/tokens through it |
| `prisma/schema.prisma` User/Plan | Generated cuid identity, FREE/PRO, promptsToday and category fields; incompatible with current billing and workspace policy | **Replace with reviewed domain schema**, do not migrate/seed this as current account authority |
| Old onboarding/board/grade/subject controllers | Useful catalog concepts but three-role fields and tracking are not five-role authorization, source versions or evidence | **Adapt concepts only**, explicit contracts and data import rules |
| `src/chat/chat.controller.ts`, `chat.service.ts` | Old JWT guard; user ownership check exists for conversations; SSE prompt in URL, old persistence/response shape | **Replace product boundary**; retain ownership check pattern, use bounded authenticated POST and source/workspace policy |
| `src/orchestrator/orchestrator.service.ts`, `src/agents/` | Eager provider lifecycle, model intent routing and direct content/diagram/resource calls; no current product source/permission envelope | **Do not attach**; private provider adapter and evaluated teaching contract replace this path |
| `src/documents/documents.service.ts` | Eager Supabase service client; public URL generation, hardcoded `uploads` URL bucket despite configurable upload bucket; processing queue TODO | **Replace** with private quarantine/GCS pipeline; no public student files |
| `src/jobs/jobs.service.ts` | Writes PENDING image job; queue execution is a TODO | **Keep disabled**; durable job/result/failure workflow required before advertising capability |
| `backend/upstream/deploy/Dockerfile.backend` | Old `dist/main` command/health route and migrate-and-seed target | **Reference only**, not a current product image or deployment instruction |
| Backend dependency lock | Still contains legacy bcrypt/Prisma/Supabase/provider libraries as well as active dependencies | **Retain this turn**; remove only after explicit import/dependency mapping and reviewed patch/lock regeneration |

The old Nest chat service does check conversation ownership. That does not make it a compatible workspace/consent/source API. Avoid treating all legacy code as equally broken or deleting useful implementation before replacement.

## ML findings and integration blockers

Paths are relative to `ml/upstream/`.

| Priority | Evidence | Consequence and required replacement |
| --- | --- | --- |
| Release blocker | `services/api-gateway/middleware/auth.go`: HMAC JWT, `user_id`/`sub`/`uid`; no product workspace/source assertion | Not Firebase/service IAM interoperability. Require private service IAM plus audience/expiry-bound product scope; never accept user fields as authority |
| Release blocker | `services/api-gateway/handler/query_handler.go` streaming/nonstreaming history reads; `handler/websocket.go`; `session/session_manager.go` `GetSession`/`GetHistory` by ID | Query handlers load supplied conversation ID without owner comparison before using history. UUID secrecy does not authorize access. Enforce UID/workspace ownership on get/append/delete and context APIs |
| Release blocker | `cache/response_cache.go` `buildKey`: query, sessionContext, grade, subject; `cache/cag_orchestrator.go` exact lookup omits supplied filters | Same query/context can address a cache entry without source/tenant/policy separation. Disable for protected requests; scope and reauthorize before reuse |
| Release blocker | `cache/semantic_cache.go` `SearchSimilar`: reads global key set and compares embeddings; no user/workspace/source scope | Potential cross-context response reuse; global scan also scales poorly. Replace with authorized namespaces or leave off |
| Release blocker | `cache/template_cache.go` key inputs intent/query/chunk hashes; `services/vector-search-service/cache/search_cache.go` embedding/topK/filters | Chunk hashes/filters alone are not complete actor/policy/version authority. Audit all retrieval/cache layers, scope before retrieval and verify revocation |
| High | `handler/websocket.go` upgrader permits any origin when `WS_ALLOWED_ORIGINS` absent; query context starts from `context.Background()` | Configuration can admit unintended origins and work outlive request cancellation. Prefer one reviewed POST/SSE boundary, enforce allowlist/cancellation if WebSocket retained |
| High | `middleware/auth.go` applies the process-local20/IP/minute limiter before parsing each authenticated request | Shared school/NAT traffic can exhaust the limit with valid requests, and instances do not share the counter. Separate coarse abuse defense from UID/workspace admission and test synchronized classes |
| High | `cache/semantic_cache.go` logs `query_text` on a semantic hit | Private learning text can enter diagnostic logs. Remove raw text from operational logging and require approved scoped diagnostics |
| High | `session/session_manager.go`, `context/session_registry.go` | Redis is TTL/eviction-based session/context store; target needs durable owned history and policy-aware context, not Redis as sole record |
| High | `cache/cag_orchestrator.go` `CacheResult`: detached context, deferred cancel, spawned goroutines | Function returns/cancels while asynchronous fills may still run; fills are not durable or reliably completed. Replace with bounded tracked work and valid scope |
| High | `handler/query_handler.go`, config defaults; frontend `backendTransport.ts` |120s gateway work conflicts with20s whole-client deadline; token/prompt/stream response contracts differ. Align budgets/cancellation before connection |
| High | `supabase/migrations/001_production_schema.sql`, ingestion taxonomy and model config | Curriculum/source schema is specialized; not all frontend categories, language coverage, publication/consent or source rights | 
| High | `terraform/main.tf`, imported deployment/compose | Standalone RAG assumptions, AlloyDB/Redis/connector sizing, `latest` images and identities are not product deployment evidence. Do not apply; create reviewed infrastructure under product ownership |
| Evaluation gap | Imported README latency/concurrency/cache claims | Not measured here; library tests/builds do not prove authorized educational quality or launch throughput |

The ML config validator rejects the blank/default `change-me-in-production` secret. This audit does **not** claim that placeholder passes configuration validation. The middleware accepts HMAC algorithms and lacks the proposed product service boundary even with a strong secret. These findings concern source that remains disconnected, not evidence that current product accounts have been exposed.

## Reuse map

Retain Go HTTP/client/circuit-breaker utilities and retrieval interfaces as candidates. Retain Python parsers, chunking, ingestion retry/checkpoint ideas and evaluation fixtures for rights/quality review. Candidate grounding/reranking/context code needs corpus/language evaluation and the new scope contract. Keep Go/Python environments independent; root Python GPU requirements are not a Windows setup command.

Do not import the ML repository's old frontend, own JWT/session authority, global private-response cache, unverified performance claims or standalone Terraform into the product runtime. Do not copy model names/prompts/embedding dimensions without versioned tests. Research tooling stays outside containers and request paths.

## Changes made now and retirement mechanics

- Root `backend:dev` now launches `src/main-auth.ts`; existing `backend:auth:dev` remains an alias. New `backend:start` launches built `dist/src/main-auth.js`.
- `scripts/backend-runtime.mjs` is the explicit selector. Regression tests verify development/production selection and walk relative imports from the selected source to reject legacy AppModule/AuthModule/PrismaModule/OrchestratorModule; tests are included in root `check`.
- Old product-command dispatch to the imported package `start:dev` is removed. Product doctor and guides identify connected account/test-billing capability and disconnected learning/ML accurately.
- Pinned source files, old migrations, dependency locks, user records, current payment credentials and unrelated frontend work remain intact. No new backend controller or ML service is exposed.

Physical deletion of pinned source is a later provenance-recorded cleanup, after a domain replacement and retained reference/evidence exist. That preserves the ability to compare/adapt useful internals and avoids erasing current uncommitted work. The original imported package commands still exist inside the baseline; they are explicitly prohibited as product launch commands. This change isolates the supported root path; it does not sandbox someone deliberately running an old file directly.

For each later removal: map imports and runtime owner -> implement replacement and migration -> prove contract/policy acceptance -> record intentional patch against the original upstream hashes -> regenerate only that component's lock -> verify preserved source/provenance and regression suite. Never run old identity/plan migrations against the current account tree, join identity by display name/email, or delete provider/invoice history to simplify the schema.

## Next implementation checkpoint

Implement the SQL workspace/consent foundation and one authorized content/teaching slice before broad endpoint expansion. Required contracts, synchronization, durable billing work, capacity, model evaluations and release gates are in [system design](system-design.md), [launch operations](launch-operations.md) and [ML strategy](ml-strategy.md). Design artifacts are complete for this request; those target services are a staged implementation program, not silently completed features.
