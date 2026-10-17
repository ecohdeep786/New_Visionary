# Model and retrieval strategy

15 October 2026 · D-075 · [system design](system-design.md) · [source audit](backend-ml-audit.md).

**Launch with managed model APIs behind a Visionary-owned authorization, retrieval and evaluation layer.** Own the education system and its evidence first. Do not train a general foundation model for the initial 100,000-MAU launch. Reuse useful Go/Python retrieval components only after repairing the product boundary and measuring quality. The existing RAG pipeline is source material, not a deployed or accepted product backend.

## Choice and tradeoffs

| Option | Fit | Decision |
| --- | --- | --- |
| Managed API generation | Fastest route to evaluated multilingual explanations; no GPU fleet; usage costs/quota/provider dependencies | Launch default; contracts, residency, retention, quota and quality must pass |
| Self-host an appropriately licensed open-weight model | Control serving/data route; needs GPU capacity, security, evaluation and on-call operation | Later shadow benchmark; not assumed cheaper or better |
| Fine-tune a licensed/managed model | Can improve stable teaching style, classification or structured outputs with enough reviewed examples | Consider after error analysis; RAG remains source/version authority |
| Train a foundation model | Requires substantial rights-cleared data, compute and specialist operations | Outside initial launch architecture |

GCP-managed generation/embedding is the first deployment candidate because workload identity and regional operations fit the chosen platform. The winning **specific model and fallback are not yet selected**: benchmark approved available models on Visionary's categories and languages, then pin a versioned deployment configuration. Keep a small provider interface so switching does not change domain authority. Do not automatically send a child's data to a second provider on failure; fallback must have the same approved purpose/region/retention and explicit configuration.

Compare useful-answer quality, grounded citations, hints versus direct answers, Hindi/Bengali/English behavior, structured-action reliability, first-content/final latency, token cost, quotas and operational failure behavior. A larger model may handle a bounded difficult request after a quality/cost policy check; ordinary explanations should not pay for a classifier call plus a planning swarm on every turn. Start with deterministic request classification where possible, one retrieval pass and one generation call. Add reranking/multi-step work only when measured quality benefit warrants the added latency and cost.

Provider governance must be checked for the selected endpoint/features. Do not equate a no-training provision with zero retention or India-only processing: abuse monitoring, provider caches and optional grounding tools can have different data handling. Current official Google documentation describes such exceptions and controls; review the actual contracted service before selection. [Data governance documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/data-governance)

## Private AI contract

Browser communicates only with the product API. The API verifies identity/session, workspace membership/consent, source publication and metered usage. AI service invocation uses Google IAM identity plus a short-lived product context assertion with issuer, exact audience, expiry, unique run ID and signed scope. A browser Firebase token is not accepted as an internal service credential. Product policy constructs the assertion; AI validates it rather than trusting arbitrary JSON actor fields.

Use an asymmetric signing key with managed rotation (for example Cloud KMS), an allowlisted key ID/algorithm and a tightly bounded assertion lifetime, proposed at most60s. Grant signing only to the product policy caller. Verify issuer/audience/time/run binding and return the existing idempotent run outcome on replay; do not reuse the imported shared HMAC JWT secret. The assertion accompanies authenticated service traffic and is never exposed to a browser. Its expiry does not replace current revocation checks.

Context envelope to implement under `integration/contracts/`:

```text
operation, schemaVersion, runId, traceId, deadline
actorUid, workspaceId, policyRevision, authorizedConversationId
sourceVersionIds / releaseId / allowedVisibilityScope
conceptId, allowedContentTypes, age/safety policy, allowedActionIds
interfaceLocale, sourceLanguage, inputLanguage, outputLanguage
promptVersion, modelRouteVersion, maxInputTokens, maxOutputTokens
usageReservationId, cancellation reference
```

Use only necessary learning context. Email, payment details, device IP, raw security metadata and whole account records never enter prompts. Check conversation UID/workspace ownership on every load, append and stream. A random session ID is not an authorization mechanism. Missing actor/workspace/source/policy scope fails closed. The AI identity cannot modify membership, consent, billing, grades or content publication.

Validate output schema, cited chunk/source versions, requested locale, representation safety and allowed action identifiers. Tool execution re-enters the product API policy layer; an AI proposal cannot authorize itself. Do not run arbitrary generated HTML/scripts, URLs, shell commands or a source-document instruction. Treat uploaded/source text as untrusted data. Retrieval access filtering occurs before results enter the model; post-generation redaction is insufficient.

Current client deadline is20s overall. Keep initial connected requests within the [18s backend budget](launch-operations.md). Abort/cancel must reach retrieval and provider operations. Persist a completed run only if policy is still valid; distinguish a partial response from a final answer and settle usage once. Long jobs require explicit durable job behavior. Never detach protected output delivery into an untracked background goroutine after the caller cancels.

## Retrieval and source lifecycle

1. Register a rights-approved source with owner/visibility, license, version, language and curriculum mapping. CBSE grades6–8 coverage is not evidence of support for every frontend category.
2. Upload privately to quarantine; validate size/MIME/checksum and scan. Parse in an isolated bounded job. Keep page/section offsets and transformation provenance.
3. Chunk with parent/child links and citations; record chunker version, embedding model/dimensions and checksum. Index separate embedding versions; never compare vectors from incompatible model spaces.
4. Apply SQL filters for authorized workspace/source release/visibility **before** similarity/keyword result selection. Evaluate hybrid keyword/vector retrieval and optional reranking against labeled questions. Similarity thresholds are calibrated per corpus/language, not magic constants.
5. Evaluate the candidate release and atomically change the publication/index pointer. Incomplete ingestion stays unavailable to learners. Retries and rollback preserve old valid release manifests.
6. Withdrawal increments source/policy revision, removes eligible retrieval/cache entries and stops pending output. Keep an audit trail without continuing to serve a withdrawn source.

Start with PostgreSQL/pgvector plus full-text search and a product-owned language-aware tokenizer/index strategy. Validate Bengali/Hindi segmentation and queries; an English tokenizer cannot be assumed adequate. Measure filtered recall: a fast ANN query that filters out most authorized candidates may need a different retrieval strategy. Separate retrieval DB resources when they threaten transactional SLOs.

## Cache and memory rules

Disable imported exact/semantic/template response caching for protected product traffic until isolation tests pass. Public reviewed curriculum responses may eventually share a cache only with an explicit public-publication namespace. Never cache personal conversation or private uploaded content globally.

For private cache candidates, the canonical key includes UID, workspace, visibility/policy revision, permitted source manifest/release, source/input/output language, concept/context revision, prompt/model/embedding versions and normalized input. Use unambiguous canonical encoding and a keyed digest; hashing raw text alone does not make an authorization key. Cache entries retain scope and source references and are reauthorized on read. Expiry is a freshness bound, not revocation. Skip caching entirely when a complete authorized key cannot be computed.

Semantic lookup must search only the same permitted namespace and verify source/context compatibility; embedding similarity cannot establish identity or permission. Do not linearly scan all users' semantic entries. Cache fills must be bounded, awaited or durably scheduled with valid scope, and safe after cancellation. Durable conversation history lives in owned SQL records; optional short memory summaries preserve source/run references and explicit retention. Opt-in memory must not silently cross personal/company or guardian boundaries.

## Evaluation and release

Build rights-cleared, reviewed evaluation sets stratified by released category, source/version, age/safety need, language and task. Separate development, validation and hidden regression sets; avoid training/test overlap. Teacher/subject review is required for educational correctness. Automated judges assist triage and cannot be the only judge of student-facing correctness or safety.

| Layer | Measure and gate |
| --- | --- |
| Authorization | Zero cross-UID/workspace/session/private-source disclosure in adversarial suite; missing scope denied; no unauthorized action |
| Retrieval | Recall@k/ranking and source coverage on labeled questions; per-language/category breakdown; no wrong-release results |
| Grounding | Every accepted citation resolves to an allowed version/chunk; unsupported questions abstain; human factual-support review |
| Pedagogy | Appropriate hint/explanation, age/level suitability, no false mastery claims, actionable checks and clear uncertainty |
| Language | Separate English/Hindi/Bengali review; interface language does not silently replace source/output choice |
| Robustness | Injection, misleading source, unsupported curriculum, numerical/formula issues, unsafe content and long input |
| Reliability/cost | Completion/cancellation, first-content/final percentile, token/context use, provider quota/error handling and cost/success |

Before release, establish a reviewed baseline and numerical non-regression thresholds for each released slice. Hard privacy/action boundaries have zero tolerated failures; educational correctness thresholds need actual labeled results rather than invented pass percentages. Save dataset/source/prompt/model/config versions and failures. New providers/models or source releases run offline comparison -> bounded internal shadow with approved data -> small canary -> monitored rollout. Roll back the route/release pointer independently of app deployment. Sample ongoing review with privacy controls and report quality per category, not one flattering average.

User feedback is a signal, not a factual label. Do not automatically fine-tune on conversations, minors' work or teacher submissions. Establish rights, consent/purpose, retention, de-identification and review first. No provider training permission is inferred from product use.

## When an own model becomes justified

Reconsider self-hosting only after a candidate passes the same safety/authorization/quality/latency suite and sustained utilization supports the economics. Use measured tokens/sec for the actual input/output lengths, context, quantization, batch size and concurrency; include burst replicas, HA standby, idle hours, egress, model license, engineering/on-call and evaluation cost.

```text
API monthly = billable input/output tokens * contracted rates
            + embedding/tool/retry/fallback costs
self-host monthly = required GPU replicas * all-in hourly price * provisioned hours
                  + CPU/storage/network + availability reserve + operations/evaluation
break-even: equal-or-better accepted quality and reliability,
            self-host all-in charge below API charge at realistic utilization
```

A hybrid may keep routine tasks on a small self-hosted model and route approved difficult tasks to an API. Fine-tuning is suitable for demonstrated style/task errors; it does not grant new source rights, update a curriculum automatically or replace retrieval authorization. No model weights are trained/downloaded and no real student data is sent to providers in this architecture change.
