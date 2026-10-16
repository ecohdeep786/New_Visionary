# Complete system tree

Legend: **C** connected locally; **P** existing preview/interface; **T** target. IDs E1–E9 identify communication paths detailed in [communication](COMMUNICATION.md). This is a logical/deployment tree; the proposed package tree below is not a claim those folders already exist.

```text
VISIONARY PRODUCT — one verified Firebase UID across devices
|
+-- 1. CLIENT EXPERIENCE [React/Vite C; domain journeys P]
|   +-- Public site: education categories, exploration, pricing, support
|   |   +-- Pricing -> preserve selected plan -> Auth -> Onboarding -> Plans [E1/E2]
|   |   +-- Public immutable app assets <- CDN [E0]
|   +-- Account shell: AuthContext + route guard + workspace selector
|   |   +-- Firebase SDK sign-in/provider verification -> ID token [E1]
|   |   +-- serverAuth/authTransport -> server cookie/device session [E1 C]
|   |   +-- Profile/setup/devices -> account API -> UID Firestore tree [E2 C]
|   |   +-- Query cache key: UID + workspace + role/policy + resource/revision [T]
|   +-- Learner categories: CBSE / West Bengal / exam prep / higher-ed / independent
|   |   +-- Home / Explore -> eligible plan/catalog/recommendations [E3 T]
|   |   +-- Learn -> contentRepository -> published concept/source version [E3 P/T]
|   |   +-- Ask / Guide -> teachingInterface / mentorModelService [E4 P/T]
|   |   +-- Practice -> attempt/review -> learning evidence/progress [E3 T]
|   |   +-- Build -> artifact draft/revision -> private project/submission [E3 T]
|   |   +-- Classes -> enrollment/assignment -> owned submission [E3 T]
|   +-- Teacher: independent / verified organization membership
|   |   +-- Prepare / Library -> draft/review/publish -> versioned source [E3/E6 T]
|   |   +-- Classes / Learners -> enrollment, assignment, return/revise [E3 T]
|   |   +-- Insights / Growth -> authorized evidence summaries [E3 T]
|   +-- Parent: Children / Reports -> verified link + scoped consent -> summary [E3 T]
|   +-- Professional: personal / employer-sponsored
|   |   +-- Career / Learn / portfolio -> personal records + explicit shares [E3 T]
|   |   +-- Company context -> active membership, separate visibility [E3 T]
|   +-- Organization: school / company
|   |   +-- People / Cohorts -> invitations, membership and role policy [E3 T]
|   |   +-- Curriculum / Library -> reviewed publication [E3/E6 T]
|   |   +-- Analytics / Audit -> suppressed aggregates + scoped audit [E3 T]
|   |   +-- Billing -> organization contract workflow [T; no invented seat price]
|   +-- Shared: Connections / Notifications / Settings / Privacy / Support
|   |   +-- Policy-bound reads/writes and export/delete jobs [E3/E6/E7 T]
|   +-- Plans / invoice -> billingClient -> server checkout/reconcile [E5 C]
|   +-- Local drafts: UID/workspace-bound, unsynced badge, conflict recovery [T]
|   +-- Future mobile apps -> same Firebase project identity + versioned APIs [T]
|
+-- 2. PUBLIC DELIVERY AND TRUST BOUNDARY [T]
|   +-- Cloud DNS -> managed TLS -> global external Application Load Balancer
|   +-- E0: approved app paths -> static bucket / CDN
|   |   +-- index HTML revalidation; hashed assets immutable
|   |   +-- missing asset404; no API -> SPA fallback
|   +-- E1/E2/E3/E4/E5: /api/** -> Cloud Armor -> serverless NEG -> product API
|       +-- API no-store; direct public run.app access rejected by ingress
|       +-- consumer invocation at platform edge; application verifies user
|
+-- 3. PRODUCT API [NestJS; account/billing C; additional modules T]
|   +-- Request boundary: request ID + schema/size + origin/CSRF + verified session
|   +-- Actor context: UID + device session + membership + policy revision
|   +-- Object policy: action + ownership + source eligibility + consent + purpose
|   +-- Idempotent command handler: payload digest + revision + transaction/outbox
|   +-- Account module [C] -> Firebase Auth + Firestore account tree [E1/E2]
|   +-- Billing module [C] -> Firestore commands/events/invoices -> Razorpay [E5]
|   +-- Workspace/policy module [T] -> SQL memberships/consents/share grants
|   +-- Catalog module [T] -> SQL sources/versions/releases -> approved object refs
|   +-- Learning module [T] -> SQL sessions/attempts/evidence/review schedules
|   +-- Artifact/classroom module [T] -> SQL revisions/submissions/feedback
|   +-- Reports/connections module [T] -> authorized summaries, no raw private chat
|   +-- AI application module [T] -> usage reservation -> private AI [E4]
|   +-- Media/privacy/jobs module [T] -> private object authorization + jobs [E6]
|   +-- Change feed [T] -> authorized revisions/tombstones/cursor -> clients [E7]
|
+-- 4. AUTHORITATIVE DATA [C account/billing; other domain stores T]
|   +-- Firebase Authentication: verified identity/credentials, never own passwords
|   +-- Firestore named Native database: default / asia-south1
|   |   +-- visionary_accounts/{uid}: identity/profile/onboarding/preferences
|   |   +-- devices/{hash}, authEvents/{eventId}: bounded session/security records
|   |   +-- billing/test: subscription/attempt/revision
|   |   |   +-- commands/{id}, invoices/{id}: durable owner-only history
|   |   +-- operational session/provider/dedup/family/abuse/due indexes
|   |   +-- target outbox/usage reservations; no client direct Firestore access
|   +-- Cloud SQL PostgreSQL regional HA, explicitly selected edition [T]
|   |   +-- product schema: persons.uid -> workspace/membership/consent
|   |   +-- content: source -> immutable version -> reviewed publication
|   |   +-- learning: attempt -> immutable evidence -> policy-versioned projection
|   |   +-- classroom: assignment version -> learner submission revision -> feedback
|   |   +-- private projects/conversations/AI runs/share grants/audit
|   |   +-- idempotency results/outbox/change log; bounded tenant-safe pools
|   |   +-- retrieval schema: published chunks + language/model-scoped embeddings
|   +-- Cloud Storage private: quarantine / approved content / exports / invoices
|   +-- Cache [optional T]: acceleration only; permission/version scoped
|   +-- Cross-store workflow: durable event -> idempotent provision -> acknowledgment
|
+-- 5. PRIVATE AI AND CONTENT PIPELINE [T; pinned ML internals are references]
|   +-- E4 caller IAM -> validate signed bounded context/run/deadline
|   +-- Authorized retrieval: UID/workspace/policy/source release filters
|   +-- Managed model adapter: configured version, token budget, cancellation
|   +-- Output checks: schema/citations/locale/safety/allowed action IDs
|   +-- Product API rechecks policy -> final run + settle usage -> client
|   +-- E6 ingestion: quarantine -> scan -> parse -> chunk -> embed -> evaluate
|   |   +-- reviewed publication/index release -> cache invalidation [E7]
|   +-- Optional owned video: process renditions/transcript -> private delivery [E6]
|   +-- Public external video: approved official embed -> provider media origin
|   +-- Model/source/evaluation registry; no automatic training on student work
|
+-- 6. DURABLE ASYNC WORK [T; current low-volume billing sweep C]
|   +-- Firestore/SQL transaction -> own outbox intent
|   +-- Dispatcher + recovery Scheduler -> Cloud Tasks (OIDC) -> private worker [E8]
|   +-- Billing queue: reconcile provider facts -> entitlement/invoice -> revision
|   +-- Content queue/jobs: scan/parse/embed/transcode with checkpoints
|   +-- Learning/report queue: rebuild projection, generate scoped summary
|   +-- Privacy queue: export/delete/tombstone/verification
|   +-- Notification queue: permitted in-app/email summaries, dedup + preference
|   +-- Expired lease/retry/dead-letter records -> replay using original IDs
|
+-- 7. EXTERNAL SYSTEMS
|   +-- Firebase Identity [E1]; Razorpay test provider/webhooks [E5 C]
|   +-- Managed model/embedding APIs [E4 T]; email delivery configuration
|   +-- Optional approved YouTube player [T], no scraping/rehosting assumptions
|   +-- No Google Classroom/Khan account integration implied by the research
|
+-- 8. PLATFORM OPERATIONS [T]
    +-- One primary GCP region; dev/staging/prod isolation, private networking
    +-- Dedicated service identities + ADC + Secret Manager + scoped KMS signing
    +-- CI source/provenance/tests -> image/SBOM -> staging -> canary -> rollout [E9]
    +-- Metrics/traces/redacted logs -> SLO/cost/queue alerts -> runbooks
    +-- SQL HA/PITR + Firestore backup/PITR + object lifecycle -> restore drills
    +-- Audit/deletion tombstones -> consistent replay after restore
    +-- Cost admission + rate/retention/egress controls; no immediate AWS replica
```

## Proposed implementation package tree

These are target responsibilities within the existing repository ownership, not a new repository relocation or generated skeleton. Existing filenames remain until their adapter cutover is tested.

```text
frontend/src/
  pages/, components/              presentation and accessible task states
  api/firebase/                    existing identity/session HTTP boundary
  services/                        existing content/teaching/mentor/billing facades
  domain/                          UI/domain types, source and role vocabulary
  target adapters/                  HTTP DTO validation; cache key and cancellation
  target draft/sync coordinator/    local recovery, expected revision, cursors
backend/upstream/backend/src/
  main-auth.ts                     selected product composition root (existing)
  auth/firebase-product/, billing/  existing connected modules
  target platform/                 actor, policy, validation, command/UoW, outbox
  target workspaces/, consent/      verified membership and purpose scopes
  target catalog/, learning/        publication, attempt/evidence/progress
  target artifacts/, classrooms/    revision/submission/feedback workflows
  target reports/, privacy/, media/ scoped projections and bounded jobs
  target ai-application/            context construction, reservation, output policy
ml/
  upstream/                        pinned reference components; no direct cutover
  target product runtime/          private service boundary + adapted retrieval
  target evaluation/               versioned corpora/prompts/models/release gates
integration/
  current *_CONTRACT.md             actual connected contracts
  target contracts/                OpenAPI/JSON schema/event version definitions
infrastructure/
  local/                           existing development provisioning
  cost/                            executable planning inputs, not cloud resources
  target GCP IaC/                  reviewed regional edge/data/runtime/queue stacks
scripts/                           product commands, cost and integrity checks
reverse-engineering/upstream/       pinned REA toolkit only, outside runtime
research/                          Visionary studies, reports and evidence indexes
```

The physical module directory names can change during implementation; logical ownership and protocol/version rules are the required architecture. [Low-level design](LOW_LEVEL_DESIGN.md) defines the data/transaction boundary behind these names.
