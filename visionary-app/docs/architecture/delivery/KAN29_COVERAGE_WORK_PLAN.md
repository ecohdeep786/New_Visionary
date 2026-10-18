# KAN-29 / SCOPE-02 — launch coverage matrix

18 October 2026 · Codex implementation lane · `codex/kan-29-coverage-matrix` · base `ec7bab9883bfc84b86c44fc37821cdfadac14b8f`.

Preceding task KAN-28: approved by qa-review in Jira comment10006; the exact accepted candidate is integrated and published to `dev`. Comment10007 and native transition51 record scoped Done. No later unreviewed `cdcc5d5` content is included. KAN-29 has no native incoming Blocks links and no task-specific blockedBy entries in the current VATS manifest; parent P00 is the phase this task contributes to, not evidence that the phase is complete. Check live ownership before changing shared contracts.

## First implementation boundary

Freeze a reviewable, machine-readable **candidate** coverage contract for every exposed role/category, with explicit supporting source, unknown/unsupported states and release gates. Preserve the product's full education vision; do not silently narrow the product or activate unsupported school, curriculum, speech or native journeys. Candidate matrix acceptance requires qa-review evidence and founder approval of release/commercial/source decisions. This plan alone does not complete KAN-29.

| Dimension | Source-backed starting point | Required next evidence |
| --- | --- | --- |
| Five roles | `integration/contracts/product-surface-review.json`: student, teacher, parent, professional, organization | Enumerate each role's actual account versus domain capabilities; a selected role is not verified class/child/employer membership. |
| Nine category scenarios | Same source: primary, secondary, higher-secondary, competitive, vocational, higher-education, independent-adult, professional, employer-sponsored | Map scenarios to actual onboarding stage/category values and allowed age/admission; synthetic fixtures do not establish coverage. |
| Age and school entry | `backend/upstream/backend/src/auth/firebase-product/profile.ts` rejects non-adult activation pending verified guardian flow | Test actual current deny behavior; school/guardian release remains gated by privacy/admission work. Adult school-profile selection must not be mistaken for child admission. |
| UI versus teaching languages | Source audit types en/hi/bn separately from onboarding choices | Enumerate interface, source/edition/medium, input/output/script and speech separately. No ASR/TTS or curriculum coverage inferred from UI translation. |
| Curriculum and sources | `frontend/src/components/onboarding/stepConfigs.jsx`, `frontend/src/components/onboarding/steps/student/StudentContextForm.jsx`, source services/catalogue | Enumerate board/exam/stage/medium choices and actual edition, provenance and publication rights; unknown source support stays unavailable. |
| Modalities, device and connectivity | Current browser journeys and local source audit; voice/offline/native require qualified integrations | Explicit text/voice/visual/Build, browser/device and online/offline slices; preserve honest preview, reconnect and unavailable states. |
| Linked roles and organizations | Account role/profile is a preference, not membership authority | Verified guardian-child/teacher-class/org/employer relationship requirements and revocation/expiry; no preview relationship can authorize records. |
| Free/paid/institution access | Existing test billing and `integration/LIFELONG_EDUCATION_CONTRACT.md` | Coordinate SCOPE-09/KAN-158; retain history versus bounded model usage, approved benefits and payment-lapse behavior. No new price/benefit grant here. |

## Owned next deliverables

- Candidate coverage contract under `integration/contracts/` and a readable matrix under `docs/architecture/`; exact filenames and shared ownership recorded in the Jira handoff before implementation.
- Drift validation against source dimensions and evidence anchors. Unknown combinations fail closed in the contract; runtime authority remains server-owned and requires its own connected acceptance.
- Meaningful tests for missing dimensions, unsupported source/language/modality claims, minor admission, unverified linked-role claims and accidental promotion of preview to release. A selector label or source file existence cannot satisfy a release gate.
- QA handoff with exact candidate SHA, affected contracts, test/environment evidence, explicit product decisions and remaining linked gates. Keep KAN-29 open until its stated matrix acceptance is met.

Follow [the qa-review loop](../BRANCH_WORKFLOW.md). Shared auth/domain/backend/ML source edits and migrations are outside this initial contract slice; coordinate them under the owning implementation tickets. Current work is preparation and contract analysis, not a completed coverage feature.
