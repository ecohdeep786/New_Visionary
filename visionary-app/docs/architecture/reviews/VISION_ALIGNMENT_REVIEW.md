# Vision alignment: one continuous education journey

17 October 2026 · D-089 · Source review against the founder's clarified vision. [Current launch plan](../EDUCATION_LAUNCH_PLAN.md) · [VATS ownership](../VATS_IMPLEMENTATION.md) · [product contract](../../visionary/VISIONARY_MASTER_v2.2.md) · [verified backlog](../tracking/JIRA_SYNC.md).

## Assessment

The product direction matches the vision. The current connected implementation does not yet deliver the complete vision. The existing contract already describes a continuous relationship across school, exams, higher education, work and life (Part B), connected roles with privacy boundaries (Parts F/Z), and stage adaptation/transition (Parts W/X). Keep the current product and complete its integration; a replacement frontend or an eighth VATS layer is unnecessary.

The strongest missing pieces are durable learning/role integration, production stage and curriculum continuity, an explicit equitable-access policy, and measured personalized guidance for each role. The D-088 backlog covers many foundations but does not yet provide complete acceptance criteria for every lifelong transition or commercial implication of this clarified vision. No completion percentage is inferred from ticket counts.

This review reads source and the saved D-088 Jira read-back, verified at 09:12:10 UTC: 142 tasks plus 15 epics, 137 native dependencies. It does not claim a new live Jira read-back, browser walkthrough, runtime test or user-outcome study. No Jira issue, price, permission or runtime behavior is changed by this audit.

## Vision-to-current-product comparison

| Founder outcome | Evidence already present | Current gap and acceptance needed |
| --- | --- | --- |
| One person across devices and life stages | Firebase UID/account/onboarding/device foundation; [account storage](../../../integration/USER_ACCOUNT_STORAGE.md); DATA-01/03, SYNC-01/02, AI-15 | Learning evidence, personal goals, project revisions and permitted memory need durable integration. Reinstall, lost device, changed school/employer and long absence must preserve authorized personal continuity without copying institutional confidential data. |
| Rich/poor and government/private education can learn meaningfully | Free default; [pricing configuration](../../../frontend/src/data/pricingConfig.js); LEARN-13 offline work and RELEASE cost gates | Define a financially viable foundational learning journey for Free/eligible sponsored access. The visible Free promise is currently narrower than the vision. Test low-end/shared devices, bandwidth/data burden and meaningful task completion. Do not infer income or create financial eligibility from a model guess. No new price or subsidy is approved here. |
| State/central boards, school/higher education and other topics | Source-aware onboarding and [context adapter](../../../frontend/src/lib/onboardingLearningContext.js); CONTENT-01–08; SCOPE-02 | Actual approved syllabus editions, medium/language, prerequisites, assessment criteria and reviewed cross-curriculum mappings are required per released slice. User-entered board/subject names are not content coverage. Broader goals can use suitable approved sources; distinguish formal curricula from independent goals. |
| Step-by-step teaching with useful visualization | Existing Learn/Ask/Practice UI, [stage presentation](../../../frontend/src/services/stagePresentation.ts), local VATS policies; LEARN-08/09/10, AI-16/17/18 | Connect authorized source → explanation → learner attempt → server assessment → changed remediation → review. Use the representation that teaches: text, audio, diagram, simulation or 3D. Require independent learner outcomes and accessible low-bandwidth alternatives, not a 3D promise for every topic. |
| Every supported topic can lead from Learn to Build | ArtifactStudio and [separate Build design](../build/README.md); BUILD-03/04/07/08/09 | Implement a source/objective/evidence-bound brief, appropriate project choices, explicit revision acceptance and assessed demonstration where supported. Explain when an artifact is unsupported; document/activity launch does not enable arbitrary code execution. Projects remain private until explicitly shared. |
| Teachers both teach and improve themselves | Preparation/class/review journeys; [TeacherUpskillCard](../../../frontend/src/components/dashboard/teacher/TeacherUpskillCard.jsx); founder addenda on ROLE-01/02/03/07 | The upskill card currently chooses from six authored tips with a random initial choice; that component is not evidence-based coaching. Define durable personal subject/pedagogy goals, practice and reflection, with reasons and independent evaluation. Class management and teachers' private learning need separate scopes. |
| Parents know what/how/where to support | Parent reports and [parent Ask service](../../../frontend/src/services/parentReportAskService.ts); ROLE-04/07 | Verify relationships and deliver current, understandable actions grounded in permitted summaries: an explanation to discuss, a practice routine or a question for the teacher. No private doubt transcript disclosure or automatic contact. Show the evidence period, uncertainty and next step. |
| Schools, colleges, NGOs and companies connect appropriately | Workspace/connection/org UI; organization types in [workspace service](../../../frontend/src/services/workspaceService.ts); DATA-04/05, ROLE-01–09 | Implement invite/verify/accept/expire/revoke and current role/source checks. Sponsoring access, paying, teaching, guardianship and administration are distinct grants. Treat NGOs as an existing organization context before adding another role. Financial aid or donor matching is not an implemented feature. |
| Product adapts as a person grows and resumes exactly | [Stage transition service](../../../frontend/src/services/stageTransitionService.ts), [curriculum bridge](../../../frontend/src/services/curriculumBridgeService.ts), Part W/X | Current stage/history/bridge behavior is local; getStageContinuity explicitly reports awaiting-reviewed-mapping. Need authoritative transition events, reviewed remaps, old-work access, bridge gaps, due-date preservation, conflict recovery, post-commit views and durable postpone/undo. This needs explicit end-to-end acceptance beyond general source/memory tasks. |
| Guide understands the person better over time | Local mentor evidence/memory; AI-15/L2/L6 and permitted-context contracts | Store attributed, scoped, correctable facts and assessed evidence, with freshness and uncertainty. A transcript, latency, self-report or old preference is not permanent truth. Ask after long absence or conflicting evidence; preserve user control and separate personal/work contexts. |
| Product gets better across its user population | Optional connected feedback; L7, AI-12/13, ACCEPT-08 | Reviewed permitted outcomes → evaluation → approved version change/rollback. Personal learner-state updates, stage adaptation and global model training are different operations. No automatic retraining on every user's conversations or automatic rollout from a score. |

## Concrete mismatches to reconcile

### 1. Lifelong continuity versus current pricing claims

The active pricing page [imports and renders PLANS/COMPARISON](../../../frontend/src/pages/landing/AILearningPage.jsx) from pricingConfig.js. Its Free copy says “7-day memory of your journey”; its comparison marks Practice/Build and voice as absent for Free; paid copy advertises “All 20+ languages, voice & text.” Those are displayed commercial claims, not proof of enforced entitlements, deletion behavior or released language capability. The backend's current [test catalog](../../../backend/upstream/backend/src/billing/catalog.ts) defines prices, intervals and member counts, not this complete learning/memory feature policy.

Separate saved history/progress/artifacts from the bounded context sent to a model. A short context window must not imply lost learner records. If lifelong continuity includes Free users, its promise must survive payment lapse and reactivation under an explicit retention/access policy. Reconcile language/voice claims with SCOPE-02 and AI-18 qualification. Decide how meaningful foundational learning-to-Build is funded for Free or institution-supported users; limits can manage cost, but a meaningful learning loop needs to remain possible for the audiences the vision promises. Review commercial terms before changing configured benefits; this audit changes none.

### 2. School inclusion versus present admission

[profile.ts](../../../backend/upstream/backend/src/auth/firebase-product/profile.ts) currently rejects non-adult activation until verified guardian services exist. That is a deliberate current boundary, not an implementation of school-age admission. A launch advertised for children requires the existing admission/consent, guardian relationship, role isolation and recovery work first. Keep these prerequisites in the first school-user slice rather than treating them as optional late polish. Do not remove the guard to make the vision appear delivered.

### 3. Role coverage versus an accepted lifecycle

The saved Jira descriptions retain broad lifelong intent in SCOPE-02/AI-15 founder addenda and teacher-learning intent in ROLE tasks. This is real coverage, but not yet the exact server transition/teacher-coaching acceptance described above. The checklist has no dedicated stage-transition deliverable with the full Part W invariants. Strengthen existing tasks or add a narrowly scoped deliverable during backlog reconciliation; do not duplicate existing generic memory, source, role or sync tasks.

## What “knows the user for life” should mean technically

```text
Verified person UID
  ├─ current profile, language, accessibility and declared goals
  ├─ separate personal and institutional role/workspace memberships
  ├─ reviewed curriculum/source versions and recorded stage changes
  ├─ immutable assessed attempts + uncertain knowledge projections
  ├─ private lesson checkpoints, review queue and project revisions
  ├─ scoped memory with source, date, correction and permitted purpose
  └─ relationship grants controlling what each other person may see
       → current permitted context for the role and task
       → reasoned next action: learn / practice / build / teach / support
       → user correction or choice
       → authorized durable outcome
       → next device or next visit continues from accepted state
```

This is a logical view under one identity, not one giant database row/document or one unrestricted prompt. Backend authority and domain stores retain their existing ownership. The same teacher may learn personally, teach a class and be a parent without merging those private records. Leaving a school/company revokes that organization's access while personal records follow their own policy. Transfer/import institutional work only where explicitly permitted; a stable UID does not grant unrestricted portability.

“For life” should describe dependable continuity while the person chooses to maintain the relationship and relevant policies permit it. It cannot be a promise of perfect recall, unlimited storage of everything or zero user correction. No retention expiry or deletion is introduced by this review; existing records remain intact.

Three kinds of adaptation remain distinct:

1. **Personal learning adaptation:** assessed attempts, current goals and feedback update a scoped estimate and next-step recommendation. No weight training is needed for every update.
2. **Journey adaptation:** approved stage/curriculum/role changes update presentation and plans while preserving history. Evidence inference alone suggests a change; board/institution/safety boundaries require their existing checks. Being good at a topic does not automatically promote a child or change permission.
3. **Product/model improvement:** accountable review, approved data purpose, held-out evaluation and controlled release. Shared improvements must not leak another person's memories. Own-model training remains separately qualified.

The seven VATS capabilities already support this division: L1 understands input; L2 models assessed knowledge; L3 proposes teaching/next steps; L4 grounds output; L5 selects useful representations; L6 supplies scoped continuity; L7 supports reviewed improvement. Their existence does not establish AGI or validated outcomes.

## Backlog reconciliation and delivery order

| Priority | Make explicit | Existing task owners / where to reconcile |
| --- | --- | --- |
| First | Define a meaningful supported journey for low-income/shared-device users, with Free/sponsored limits and honest memory/coverage copy | SCOPE-01/02, BILL-04, ROLE-09, PRIV-01, RELEASE-04, ACCEPT-05/08 |
| First for school launch | Verified child admission, guardian/organization relationships and revocation/reconsent recovery | SCOPE-02/04, DATA-04/05, ROLE-04/06/08, PRIV-01, SAFE-01 |
| Before lifecycle claim | Backend-owned stage event/revision/remap/checkpoint/bridge/postpone/undo, preserved evidence and institution exit | DATA-01/06, CONTENT-08, LEARN-04/09/11, AI-15, SYNC-01/02, ACCEPT-01/02; add a focused task only if these owners cannot express a clear accountable deliverable |
| Before personalized-coaching claim | Teacher's own learning loop and parent's actionable support plan, each from permitted evidence | ROLE-01/02/07/08, LEARN-04/10, AI-14/15, ACCEPT-02/08 |
| Before broad coverage claim | Approved board/medium/stage/source/modality/device matrix and actual learning-to-Build examples | SCOPE-02, CONTENT-01/06/08, AI-16/18, BUILD-03/09, ACCEPT-05/08 |

Complete one integrated vertical journey first: valid account/admission → selected supported source → diagnostic/teaching/check → purposeful Build → durable save → second-device resume → permitted teacher/parent action. Then prove a stage/source transition and leaving/joining an institution without losing or leaking personal work. The first cohort may be restricted; describe it accurately instead of calling it universal coverage.

Use synthetic multi-stage histories to test transitions, long absence and changed relationships before involving actual users. Simulation proves software behavior, not years of learning benefit. Extend the controlled educational pilot to eligible released groups; assess independent learning, teacher usefulness, parent comprehension, access burden and continuity failures. Expansion across income groups/boards/languages must follow evidence and viable cost, not merely enabled menus.

## Result of this review

The architecture and current product contract provide a coherent base for the founder's connected lifelong vision. Current local account/test billing and frontend/service/policy work are foundations. The complete connected teaching, role network, lifelong adaptation, equitable access and measured intelligence are still delivery and qualification work. Resolve the explicit gaps above before claiming that all audiences can already use the complete system. This audit adds no runtime completion or AGI certification.
