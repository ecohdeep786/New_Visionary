# KAN-150 — AI-16 — versioned approved representation/scene registry + structured action protocol

## Task review and verification handoff

Jira key / source ID: KAN-150 (AI-16)
Acceptance scope: feature-enabler (backend-owned scene registry + structured action protocol domain; renderer/controller wiring happens at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-150-scene-registry`; based on the latest lane head `e90812c0` (KAN-139 SYNC-01 changefeed), per D-098 (lane lineage KAN-83 → 84 → 85 → 86 → 88 → 89 → 90 → 92 → 138 → 91 → 149 → 143 → 142 → 139 → 150).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-150-scene-registry`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/sceneprotocol/scene-types.ts` (SceneOwner, SceneOperation, SceneFallback, SceneCapability, ParamBound, SceneDefinition, SceneAction, SceneEvent, SceneObservation, SceneProtocolError)
- `backend/upstream/backend/src/sceneprotocol/scene-lookups.ts` (SceneProtocolStore seam + SceneRun + InMemorySceneProtocolStore contract-true state)
- `backend/upstream/backend/src/sceneprotocol/scene-service.ts` (SceneProtocolService — registerScene, approveScene, advertiseCapabilities, executeAction, recordSceneEvent, replayEvents, openRun, cancelRun)
- `backend/upstream/backend/src/sceneprotocol/index.ts`
- `backend/upstream/backend/tsconfig.sceneprotocol.json`
- `backend/tests/contracts/sceneprotocol/scene-protocol.test.mjs` (AI-16 suite, 12 tests)
- `scripts/sceneprotocol-check.mjs`, `package.json` (`sceneprotocol:check`)
Prerequisites: parent KAN-9; SCOPE-03 (KAN-30), CONTENT-03 (KAN-62) and SYNC-01 (KAN-139, delivered `e90812c0` on this lane) — all satisfied.

## Requirement

Implement a versioned approved representation/scene registry and structured action protocol tied to permitted concept/source/run revisions: bounded parameters and allowlisted read-only math/scene operations, no generated JavaScript/URLs or raw-token execution. Synchronize approved narration/events with replay/cancellation and stale-run rejection; provide keyboard/text/2D/reduced-motion/device fallbacks, and evaluate only actually released scene/language coverage before advertising 3D or voice capability (source: docs/architecture/BACKEND_LAUNCH_CHECKLIST.md AI-16; KAN-150 description).

## Acceptance criteria → evidence

- VERSIONED registry — conflicting same-version redefinition refuses (`scene_version_conflict`); identical re-set is idempotent and preserves approval; registration requires the concept + permitted source revision binding (`scene_definition_invalid`).
  - Evidence: test "VERSIONED registry…".
- APPROVED only — an unapproved scene never executes (`scene_not_approved`); explicit approval records the approver.
  - Evidence: test "APPROVAL: an unapproved scene never executes…".
- DEVICE FALLBACK floor — registration without keyboard+text refuses (`fallback_floor_required`); 2D and reduced-motion are declared per scene.
  - Evidence: test "FALLBACK floor…".
- NO generated execution — a scene embedding code/script/url/token fields refuses at registration (`generated_execution_refused`); action params carrying generated code/URLs/raw SCENE tokens refuse at the action boundary; the registry keeps no such entry.
  - Evidence: test "NO generated execution…".
- ALLOWLISTED READ-ONLY operations — an operation not allowlisted for the scene refuses (`operation_not_allowlisted`); math/state/narration reads observe deterministically; divide-by-zero and unknown keys return honest observed failures; nothing writes.
  - Evidence: tests "ALLOWLISTED read-only operations…" and "READ-ONLY + narration reads…".
- BOUNDED parameters — out-of-range numbers, over-length strings and unregistered param keys refuse (`param_out_of_bounds`).
  - Evidence: test "BOUNDED parameters…".
- PERMITTED revisions + stale-run rejection — a run whose recorded revision/concept differs from the scene's binding rejects (`stale_run_rejected`); a cancelled run rejects further actions and events (`run_cancelled`); replay positions are validated (`replay_seq_invalid`).
  - Evidence: tests "PERMITTED revisions…" and "SYNCHRONIZED approved narration/events…".
- LANGUAGE coverage — actions in languages not released for the scene refuse (`language_not_released`).
  - Evidence: test "LANGUAGE coverage…".
- RELEASED-coverage honesty — 3D/voice are advertised ONLY where the server released them for the scene AND the language is covered; an unreleased capability or language advertises nothing.
  - Evidence: test "RELEASED-coverage honesty…".
- ONE context owner — unknown run, wrong uid and foreign workspace deny uniformly (`not_owner`, no existence leak) across execute/replay/cancel.
  - Evidence: test "ONE context owner…".
- Cross-layer closure: Frontend — the current renderer stays; the structured protocol replaces any raw-token path at cutover. API — controller wiring binds validated schemas at cutover. Backend — SceneProtocolService ties scenes to the durable run protocol (BUILD-04/AI-14 lineage). Data — Cloud SQL adapter at integration resolves from scene_definition (unique scene_id+version), scene_run and scene_event tables. ML/renderer — narration/events replay deterministically for the synchronization layer; 3D/voice advertisement follows released coverage only.

## Commands, exit codes, test counts and timestamps

- Scene protocol compile + suite: `node scripts/sceneprotocol-check.mjs` → tsc `tsconfig.sceneprotocol.json` exit 0; `node --test` → 12 tests, 12 pass, 0 fail (2026-10-29).
- Lane regressions (all 31 modules on this candidate, 0 failures): sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; renderer/controller wiring and actual 2D/3D rendering happen at cutover with the current renderer preserved.
- Real released scene/language coverage evaluation (which scenes, which languages, which devices) is cutover evidence; this enabler proves the registry/protocol contract and keeps unreleased capabilities unadvertised.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates; no 3D/voice capability is advertised by this task.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
