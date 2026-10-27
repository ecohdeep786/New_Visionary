# KAN-66 — CONTENT-07 — preserve official approved embeds where suitable; add owned media processing/delivery only when released content requires it and rights, privacy and cost gates pass

## Task review and verification handoff

Jira key / source ID: KAN-66 (CONTENT-07)
Acceptance scope: feature-enabler (backend-owned media delivery authorization domain; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-66-media-delivery`; based on the previous content worktree `codex/principal-kan-65-coverage-evaluation` head `c2e55530` (KAN-65 CONTENT-06 coverage evaluation), per D-098 — the next content-lane task creates its worktree from the latest working content worktree, which is the KAN-65 head (not `dev`, which has not merged the lane).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-66-media-delivery`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/mediagate/media-gate-types.ts` (MediaKind, MediaGateState, MediaPointer, SourceMediaFacts, MediaDeliveryItem, NodeMediaDelivery, MediaDeliveryReport, MediaClaim, ClaimMediaEvaluation, DeliveryBlockReason)
- `backend/upstream/backend/src/mediagate/media-gate-lookups.ts` (MediaLookup seam + InMemoryMediaStore contract-true state)
- `backend/upstream/backend/src/mediagate/media-gate.ts` (MediaDeliveryGate — evaluateAll, evaluateNode, evaluateClaim; server-live, media labels never establish delivery)
- `backend/upstream/backend/src/mediagate/index.ts`
- `backend/upstream/backend/tsconfig.mediagate.json`
- `backend/tests/contracts/mediagate/media-gate.test.mjs` (CONTENT-07 suite, 7 tests)
- `scripts/mediagate-check.mjs`, `package.json` (`mediagate:check`)
Prerequisites: parent KAN-6 (P04), phase prerequisites P01/P03 (CONTENT-01..06 and DATA/ROLE foundations); the content lane is sequenced KAN-60→61→62→64→65 and now 66. CONTENT-07 preserves official embeds and gates owned media delivery (rights/privacy/cost) for released content.

## Requirement

Preserve official approved embeds where suitable; add owned media processing/delivery only when released content requires it and rights, privacy and cost gates pass. Exit: learners receive only authorized, supported, published versions. D-085 trace: catalog/source-version/media delivery for released sources; official embeds preserved, no invented owned media.

## Acceptance criteria → evidence

- Criterion: official approved embeds are preserved for released eligible nodes with an approved rights gate — the official host reference is delivered, not replaced.
  - Evidence: test "official approved embeds are preserved for released eligible nodes with an approved rights gate".
- Criterion: owned media processing/delivery is added only when released content requires it AND rights, privacy and cost gates all approve; a blocked gate (e.g. cost) fails closed.
  - Evidence: test "owned media delivery requires released content AND rights + privacy + cost gates all approved".
- Criterion: withdrawal / pointer demotion / source rejection immediately remove delivery (server-live, no authoritative cache).
  - Evidence: test "withdrawal / pointer demotion / source rejection immediately remove the item from delivery (server-live, no cache)".
- Criterion: media labels are claims — an unknown node/media or a blocked item is never "deliverable"; claim evaluation fails closed.
  - Evidence: test "media labels are claims: an unknown node/media or a blocked item is never deliverable".
- Criterion: a node with no media pointer delivers nothing — no invented media.
  - Evidence: test "a node with no media pointer delivers nothing — no invented media".
- Criterion: not-published / pending source nodes deliver nothing even with declared media.
  - Evidence: test "not_published / pending source nodes deliver nothing even with declared media".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; media/embed labels in the curriculum/learn UI become CLAIMS consumed by the gate at cutover — a label is never delivery proof.
  - API: N/A in the enabler; media delivery controllers call the gate at cutover.
  - Backend: MediaDeliveryGate implements the honest, server-owned delivery authorization.
  - Data: in-memory MediaStore interface mirrors catalog (CONTENT-01), published pointer (CONTENT-03), retrieval gate (CONTENT-05) + object/file stores (FILE-01..04); Cloud SQL/object adapter at integration resolves from source_versions/publications/content_nodes and object manifests.
  - Jobs/ML: owned-media processing jobs (CONTENT-02 style) feed the gate at cutover; official embeds are preserved, never re-encoded by default.

## Commands, exit codes, test counts and timestamps

- Media gate compile + suite: `node scripts/mediagate-check.mjs` → tsc `tsconfig.mediagate.json` exit 0; `node --test` → 7 tests, 7 pass, 0 fail (2026-10-27).
- Baseline regression: `node scripts/coverage-check.mjs` (KAN-65 suite) → 7 tests, 7 pass, 0 fail (unchanged base; media gate candidate does not regress the content lane).
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/object store and no Nest controller/worker wired yet; the real adapter swap + controller wiring happen at integration cutover (source_versions/publications/content_nodes DDL resolved by DATA; object-manifest/private-download FILE lane).
- Official approved embed preservation is evaluated for released sources today; adding NEW owned media for a source is a content/rights/cost decision, not made by this gate.
- Hosted verification, real media delivery, production source-provider approval and paid-media gates remain out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-66 → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: the content lane continues with CONTENT-08 (KAN-144) versioned prerequisite graph / curriculum-exam views; CONTENT-07 preserves media delivery for the released sources those views point at.
