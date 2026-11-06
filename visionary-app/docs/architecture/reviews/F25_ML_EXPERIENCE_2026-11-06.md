# F-25 — ML experience integration (2026-11-06)

Jira key / source ID: F-25 (Visionary Frontend Agent task — ML experience integration)
Acceptance scope: enabler (education + platform audit; findings without broad implementation — the
only implemented artifact is the review harness itself)
Implementer: ZCode agent (Education + Platform Engineers; lane completed by principal engineer)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f25-ml-experience` / beta `9f3cbebb` (F-24 landing)
Owned files: `frontend/scripts/ml-experience-review.mjs` (new dependency-free browser harness),
evidence directory, this receipt. **No product source file changed.**

## Objective and method

Validate model request/response rendering, streaming where supported, explanations, uncertainty,
failures and user-facing learning workflows — without inventing endpoints, model outputs or
capabilities. Method:

1. **Source inspection** — the ML seam and every model-facing surface, with the pinned tests:
   `services/backendTransport.ts` (the authenticated exchange contract: session re-verified before
   AND after each call, 20 s whole-operation deadline, abort propagation, requestId;
   `configureBackendTransport` "installs only a contract, never a URL, token, backend response, or
   local model" — `backendTransport.ts:76`), `services/teachingInterface.ts` (the
   `ready | not_connected | blocked` response union, L1 crisis regex across en/hi/bn evaluated on
   the raw input AND the JSON context before any adapter sees it, adult-audience age gate,
   stage-presentation stability check, schema-smuggling guard "Unavailable teaching responses
   cannot start an activity", contract-fields-only persistence), `services/mentorModelService.ts`
   (returns `null` with no adapter; fail-closed validation of every reply field; role-scoped
   action allowlist; safety check before model contact), `services/mentorCompanionService.ts`
   (safety takes precedence over intent and over any model; replies composed from saved records
   always carry "From your saved records — not an AI assessment."), and
   `services/learningPipelineService.ts` (explanation request → honest not-connected fallback to
   authored sample, private answer drafts scored only on Check answer, durable server-authoritative
   sessions, bounded check limit after three failed checks, explicit cancellation that voids the
   open check but never removes recorded evidence, outbox retention when the cognition adapter
   cannot write).
2. **Test baseline** — the 10 pinned ML-related test files pass before any harness work:
   `content-teaching`, `mentor-model`, `mentor-companion`, `mentor-state`, `role-mentor`,
   `backend-transport`, `learning-pipeline`, `learning-durable-session`, `learning-session-client`,
   `learning-source-recovery` → **128/128**.
3. **Live harness** — new `frontend/scripts/ml-experience-review.mjs` drives a real registered
   learner through the model-facing journey (preview repository mode; no adapter registered; zero
   network calls by design) and fails closed on any missing honest marker. Evidence:
   `docs/visionary/baseline/f25-ml-experience-2026-11-06/` (receipt.json + 10 captures).
4. **Contract cross-check** — the F-24 fail-closed audit re-run: every frontend call still has a
   product route or a recorded dependency (30 calls / 28 matched / 2 recorded / 0 unexpected).

## A. Verified-correct (protect)

| Surface | Verified behaviour | Source |
| --- | --- | --- |
| Response-status rendering | every guide message carries an explicit status label: "Teaching service not connected" / "Safety response" / "Connected teaching response" / "From your saved records" / "Connected mentor response" / "Authored demo response" — the reader can always tell where an answer came from | `Guide.jsx:268` |
| Not-connected honesty | open question → honest not-connected teaching response: "…no model answer has been generated"; the question stays saved locally | `teachingInterface.ts:31-34`, verified live |
| Streaming | **no streaming transport exists in the product frontend** (no SSE/WebSocket consumers — F-24 audit-verified). The supported control is the busy-scoped Stop/abort button on the in-flight turn; preview not-connected turns resolve without a network round-trip so no busy window is observable — recorded, not invented | `Guide.jsx:245` |
| Explanations + provenance | the unit explanation renders with an explicit source label: "explicitly authored sample content, not a generated model answer" (sample) / "Source: connected teaching adapter." (ready) / "Source: {provider} · version {version}." (provenanced) — verified live on the authored sample | `LearningWorkspace.jsx:411-412` |
| Uncertainty | no model confidence scores exist anywhere; uncertainty is expressed as source provenance plus the mastery honesty law — "Accuracy is evidence, not a claim of overall mastery." — verified live next to the recorded check result | `LearningWorkspace.jsx` check view |
| Safety failure | crisis input → "Safety response" label + verbatim copy ending "Crisis support is not connected here."; teaching paused; no model contact; safety takes precedence over intent match and over any model | `teachingInterface.ts:23-26`, `mentorCompanionService.ts:153-154`, verified live |
| Language failure | the authored sample carries a real Hindi variant — switching the teaching language serves actual Devanagari teaching content and never relabels one language's content as another's translation (official-concept cross-language requests strip teaching and render "…not loaded in {language}… A teaching response requires the connected model.") | `contentRepository.ts:186-190`, verified live |
| Learning workflow | 4-stage path (Understand/Check/Practice/Build); answer selection is a private draft until "Check answer"; scored result with honest copy; post-check controls (continue/retry/review/build); multi-representation panel with the exploration law ("does not count as a correct answer") | verified live |
| Continuity door | "Ask a doubt" from a learning unit opens Ask as `ask?learning={unitId}` with "Return to {title} · Your position is saved" — learning↔ask stay linked without merging surfaces | `Guide.jsx:99`, verified live |
| Model seam | no adapter is registered; `requestMentorModelTurn` returns null → intent replies come from saved records only; zero "connected" labels rendered anywhere in the journey — nothing invented | `mentorModelService.ts:47-53`, verified live |

## B. Findings

**F-25-F1 (INFO, ML experience law verified live):** 27/27 harness checks pass — model
request/response rendering carries an explicit per-message status label; the not-connected state
is honest ("no model answer has been generated"); explanations carry source provenance;
uncertainty is provenance + the mastery honesty law rather than invented confidence numbers; the
safety block, the language-variant behaviour and the learning↔ask continuity door all render
exactly as recorded in source.

**F-25-F2 (INFO, streaming law):** streaming is not supported anywhere in the product frontend —
no SSE/WebSocket consumer exists (F-24 audit), requests are single-shot with a 20 s deadline, and
the only in-flight control is the busy-scoped Stop abort button. The legacy backend's chat SSE
route belongs to the legacy app the frontend does not consume. Any future streaming must arrive
as a backend-owned contract through `backendTransport.ts`, not a frontend invention.

**F-25-F3 (P3, dead component cluster with invented ML content):** `AGIHero.jsx`,
`AITeacherHero.jsx` and `RoleGreeting.jsx` have zero importers (verified) yet contain invented
teaching voice and metrics — hardcoded mastery/confidence percentages, fabricated teacher messages
("I noticed you're still building confidence in {topic}") and a fictional streak model. Nothing
renders them, so no user sees them today, but they are a latent honesty-law hazard: wiring any of
them would present invented model assessment as if it came from records. Recorded for removal or
contract-backed rewrite in a future task-scoped lane (same disposition as F-24-F2's dead
OAuthConsent page). `RoleGreeting.jsx:7` even references the pattern in a comment while its
implementations diverge from the product's evidence-only law.

**F-25-F4 (INFO, recorded dependency — the ML seam):** `backendTransport.ts` remains the prepared
seam with zero registrants in the product (content serves authored samples, teaching returns
`not_connected`, mentor replies come from saved records). The four operations it defines
(`content.syllabus`, `content.concept`, `teaching.request`, `mentor.turn`) are the contract shape
the backend/ML lanes must implement; no endpoint, URL or model output is invented on the frontend
side. Real model quality, latency and streaming behaviour remain backend-lane gates.

**F-25-F5 (INFO, environment):** the F-16-F4 chunk flip recurred on this lane's build
(`organizationAuthorCopy` merged back into `OrganizationContent`; 137 chunks); handled per the
documented interim protocol with an explicit F-25 note (totals 3,087,230 B raw / 881,241 B gzip —
byte-identical to the pre-flip record, confirming churn-only). The harness is deterministic on
back-to-back runs (27/27 checks, 0 defects, 38 records both runs). Per F-24-F8, the battery ran
against the worktree dev server started with `VITE_AUTH_MODE=preview`.

**No product defects in the live ML experience. No product changes needed or made.**

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| ML-related pinned tests | **128/128 PASS** (content-teaching, mentor-model, mentor-companion, mentor-state, role-mentor, backend-transport, learning-pipeline, learning-durable-session, learning-session-client, learning-source-recovery) |
| `node scripts/ml-experience-review.mjs` | **PASS — 27/27 checks, 0 defects, 10 captures, deterministic ×2** (register → Learn sample → unit → provenance → check scored → Ask not-connected → saved-records mentor → safety block → Hindi variant + mastery law → continuity door → no-invented-model) |
| Full battery | **PASS — all 10 stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (20.1 s); qa:perf **re-recorded per the F-16-F4 interim protocol with an explicit F-25 note** (chunk-assignment churn only; totals 3,087,230 B raw / 881,241 B gzip) and verify PASS (137 chunks); qa:taps PASS (243/126, 3 exceptions); qa:motion PASS (439); qa:continuity PASS; `npm run check` exit 0 |
| Release gate | **RELEASE GATE PASS 5/5** (route-sweep 27 routes, keyboard-skip-link, keyboard-focus-visible, accessibility-spot 0 low-contrast / 0 small controls, critical-navigation reached-dashboard) on the preview-mode worktree server (F-24-F8 law) |
| Contract audit re-run | **PASS** — 30 frontend calls / 28 matched / 2 recorded deps / 0 unexpected; committed F-24 evidence left untouched |
| Live backend exercise | **Not possible in this environment** — the product backend requires Firebase/Firestore credentials; ML model exercises remain backend/ML-lane gates (recorded, not assumed) |

## D. Backend / ML dependencies

- **Teaching/ML adapter wiring** (F-25-F4): the backend lane owns real adapter registration
  through `configureBackendTransport` — content syllabus/concept, teaching request, mentor turn.
  Until then the frontend honestly renders not-connected and saved-records replies only.
- **Streaming contract** (F-25-F2): does not exist; the legacy chat SSE route is not a product
  contract. Any future streaming needs a backend-owned contract before the frontend can consume it.
- **Official-content language availability** (A/Language): the cross-language
  `languageUnavailable` stripping and its honest notice are exercisable only against an official
  connected curriculum; the preview sample carries real en/hi/bn variants.
- **Live model exercise**: quality/latency/safety-at-scale verification requires the credentialed
  hosted environment already recorded in CONTRACT_GAPS.

## E. Remaining issues and risks

- The dead hero cluster (F-25-F3) carries invented ML content; removal or rewrite is a future
  task-scoped change, not done in this audit lane.
- The mentor's evidence-based replies are as good as the saved records behind them; in preview the
  records are local fixtures — real-record behaviour is a backend-lane gate.
- The busy/Stop control is unobservable for preview not-connected turns (they resolve without a
  network round-trip); its behaviour under a real connected model is unverified here.
- Chunk-assignment nondeterminism (F-16-F4) continues to require per-lane re-records until the
  law owner adopts a totals-level rule.

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f25-ml-experience` on `zcode/f25-ml-experience` = beta `9f3cbebb` +
`frontend/scripts/ml-experience-review.mjs` + evidence + this receipt + the F-16-F4 interim
re-record of `frontend/scripts/perf-budget.json` (chunk-assignment churn only; totals stable;
explicit F-25 note). No product source change. Junction-based node_modules runtime arrangement
(nothing committed). Worktree removed after the beta landing per the operator's standing
instruction; branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-25
Acceptance scope: enabler (ML experience integration review)
Implementer: ZCode agent (Education + Platform Engineers; lane completed by principal engineer)
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f25-ml-experience / 9f3cbebb / <receipt commit>
Owned files: frontend/scripts/ml-experience-review.mjs; docs/visionary/baseline/f25-ml-experience-2026-11-06/ (receipt.json + 10 captures); frontend/scripts/perf-budget.json (F-16-F4 interim re-record); this receipt
Verification: 27/27 live ML-experience checks PASS deterministic x2 (0 defects, 10 captures); ML pinned tests 128/128; battery all 10 stages exit 0 (653/653); RELEASE GATE PASS 5/5 (preview-mode worktree server per F-24-F8)
Findings: F-25-F1 INFO ML experience law verified live; F-25-F2 INFO no streaming transport (Stop/abort is the supported in-flight control); F-25-F3 P3 dead hero cluster with invented ML content (AGIHero/AITeacherHero/RoleGreeting); F-25-F4 INFO backendTransport seam dependency (no adapter registered; nothing invented); F-25-F5 INFO environment (F-16-F4 chunk flip re-recorded, harness deterministic x2); no product changes
Reviewer decision: pending
Dev integration commit: pending
```
