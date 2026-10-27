# KAN-92 — AI-10 — released voice/image/structured-activity operations with explicit schemas, permitted context, device/locale recovery and separate cost limits; unreleased modalities stay unavailable

## Task review and verification handoff

Jira key / source ID: KAN-92 (AI-10)
Acceptance scope: feature-enabler (backend-owned modality gate; wired into the connected ML/runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-92-multimodal-schemas`; based on the latest lane head `a669c9e7` (KAN-90 AI-08 deadline reconciliation), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-92-multimodal-schemas`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/modalities/modality-types.ts` (ModalityOwner, Modality, ModalityOperation, ModalityError)
- `backend/upstream/backend/src/modalities/modality-lookups.ts` (ModalityStore seam with release registry + per-modality allowance buckets + InMemoryModalityStore contract-true state)
- `backend/upstream/backend/src/modalities/modality-gate.ts` (ModalityGate — authorize with release/schema/context/locale checks, consumeAllowance with separate buckets)
- `backend/upstream/backend/src/modalities/index.ts`
- `backend/upstream/backend/tsconfig.modalities.json`
- `backend/tests/contracts/modalities/modality-gate.test.mjs` (AI-10 suite, 5 tests)
- `scripts/modalities-check.mjs`, `package.json` (`modalities:check`)
Prerequisites: parent KAN-9; the lane head (CONTENT+LEARN+BUILD+AI-02/03/04/06/07/08 lineage) is the base. The voice/image/activity ML clients bind to this gate at cutover.

## Requirement

Implement any released voice/image/structured-activity operations with explicit schemas, permitted context, device/locale recovery and separate cost limits; unreleased modalities stay unavailable. Exit: evaluated, authorized assistance with bounded costs and no cross-user leakage.

## Acceptance criteria → evidence

- Criterion: an UNRELEASED modality reports unavailable honestly (`modality_unreleased`) — no silent fallback to another modality.
  - Evidence: test "an UNRELEASED modality reports unavailable honestly — no silent fallback to another modality".
- Criterion: each released modality validates against its EXPLICIT schema (voice: audioRef+audioLocale; image: imageRef+conceptId; structured activity: activityKind+steps) — a violating payload refuses (`schema_invalid`), never guessed.
  - Evidence: test "each released modality validates against its EXPLICIT schema; a violating payload is refused".
- Criterion: permitted context only — a wrong owner is denied (`not_owner`); a pinned-revision mismatch refuses (no context drift).
  - Evidence: test "permitted context only: wrong owner denied; pinned-revision mismatch refused (no context drift)".
- Criterion: device/locale recovery — a request locale mismatching the conversation's locale refuses (`locale_mismatch`); no silent locale drift.
  - Evidence: test "device/locale recovery: a request locale mismatching the conversation is refused (no silent locale drift)".
- Criterion: SEPARATE cost limits — each modality draws from its own allowance bucket; exhausting the voice allowance never spends the image allowance (image bucket independently exhaustible, proven exactly).
  - Evidence: test "SEPARATE cost limits: exhausting the voice allowance never spends the image allowance".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; voice/image/activity surfaces consume the gate at cutover; unreleased modalities render unavailable.
  - API: N/A in the enabler; modality controllers call the gate at cutover with validated schemas.
  - Backend: ModalityGate implements release gating, schema validation, context/locale integrity, separate allowances.
  - Data: in-memory store mirrors release registry/conversations/allowances; Cloud SQL adapter at integration resolves from modality_release/allowance tables.
  - Jobs/ML: voice/image/activity ML clients bind to the gate at cutover; usage reservation (KAN-89) composes for the measured spend.

## Commands, exit codes, test counts and timestamps

- Modality gate compile + suite: `node scripts/modalities-check.mjs` → tsc `tsconfig.modalities.json` exit 0; `node --test` → 5 tests, 5 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `deadline:check` (KAN-90) → 6 pass/0 fail; `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Structured activity is intentionally unreleased in this candidate — releasing it is a product/education review decision, not a code change.
- Hosted verification, real device-farm voice/image checks and production keys remain open gates; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-92 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: AI-12 (KAN-138) legacy raw-text collection disconnection; the AI lane continues AI-10→12.
