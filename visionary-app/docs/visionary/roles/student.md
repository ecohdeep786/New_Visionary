# Student product acceptance — Wave 0.5 / 01-PM

Date: 2026-09-19. Scope: product requirements and current-source inventory only. This is not a visual approval, implementation completion, or QA gate pass.

Authority: `../VISIONARY_MASTER_v2.2.md`, especially A, F–K, O, V–Z. v2.2 wins over the archived v2 pack: Home is an evidence-led decision surface, Ask is guided rather than a blank-chat opening, and eligible transitions apply automatically. Earlier conversation-first work is a reusable implementation foundation, not authority to ignore the new contract. UX owns layout choices; Design System owns token changes; Frontend owns implementation. No source files changed for this addendum.

## 1. Student job and inherited foundation

The learner should know what to do next, why that action helps their goal, and how to return to exactly where they stopped. The loop is goal → prior understanding → explanation/representation → question without losing place → check/remediate → spaced practice → application → reflection. Do not position this as buying courses or getting arbitrary answers.

Retain the current blue/white workspace, labelled rail, top-right account controls, workspace boundary, rounded surfaces, existing lesson controls, text alternatives, persisted notes and local artifact work. Enhance inside this DNA. Do not remove the existing cube lab, classwork, or topic URLs because another route has newer components. The source review does not substitute for current-build screenshots and DESIGN_INVENTORY co-signing.

## 2. Current route inventory and actionable gaps

All paths below are current `src/App.jsx` routes. Evidence paths are relative to the repository root; observations are static source review, not runtime test results.

| Route / current consumer | Keep or enhance | Evidence-backed gap and required acceptance |
|---|---|---|
| `/onboarding` — `src/pages/Onboarding.jsx` | Enhance autosaved role flow, Back/review, curriculum notes | Age is collected at review; guardian verification is disclosed as future service. Add explicit policy-precision age/stage and pending/declined/revoked consent gates before consent-requiring processing. Manual curriculum must become structured, reviewable objectives, not only free text. |
| `/dashboard`, `/dashboard/home` — `DashboardHome.jsx` → `Guide.jsx` | Enhance shell, persisted continuation and curated entries | Home currently opens Guide greeting/composer; all student personas receive `listJourneys`, including professional data interpretation. Deliver stage-selected decision modules and one evidence-backed next action, not an empty-input hero. Preserve conversations and sessions when entry hierarchy changes. |
| `/dashboard/ask` — same `DashboardHome` alias | Enhance compatible entry | Add intent-first Ask studio, topic/goal history, rename/export/detach and contextual question entry. Preserve `topic` and `initialQuestion` compatibility; do not erase Home/Ask context while separating their jobs. |
| `/dashboard/learn` — `Learn.jsx`, `JourneyCatalogue.jsx` | Enhance subject pills, topic search, filters, list/grid, add topic | Two learning sources coexist: legacy Subject/Topic entities plus three curated journeys. Need compact board/class/term or goal context, subject add/remove/reorder, objective-level evidence/prerequisites, assigned/review filters, curriculum vs personal-goal distinction. No professional fixture offered to a child by default. |
| `/dashboard/learn/:topicId` — `TopicDetail.jsx` / `CourseViewer` | Enhance breadcrumbs, bookmark/focus, contextual links | Topic unavailable conflates missing and wrong-workspace cases. Add safe distinct invalid/missing/permission views without leaking names; outcome, source/version, prerequisite refresh, representation availability and report-issue states. Existing Ask/Practice/Build links must resolve the same objective. |
| `/dashboard/explore` and `/dashboard/home?journey=…` — lab / `GuideActivity.jsx` | Enhance existing cube, fraction and table interactions | Two players coexist. Consolidate session ownership through service contracts, preserving routes. Current stage labels and controls are mostly English, session diagnosis is introductory text rather than evidence, remediation repeats the same explanation, and preparing/interrupted are not full domain stages. Add real curated smaller-example/alternate-representation branches and stage-aware language. |
| `/dashboard/practice` — `Practice.jsx` | Enhance feedback and idempotent saved results | Legacy cube practice imports exercise data into the page, shows all three questions, and keeps unsaved attempt in component state; journey practice is separate. Add one-task flow, durable draft, due queue, attempt review/history, error classification, next review, optional scoped simulation. Both entry paths must yield one consistent attempt/evidence view. |
| `/dashboard/build` — `ArtifactStudio.jsx` | Enhance editable document, live preview, milestones, versions, export and explicit sharing | Current catalogue displays all three project cards; editor state and unsaved title/milestones can be lost before explicit save. Make one relevant recommendation, durable project snapshot, criteria/concept links, controlled share review and feedback states. Completing a checkbox is not application evidence. |
| `/dashboard/progress` — `WorkspaceTools.jsx` `Progress` | Enhance named evidence stages and calculation disclosure | Shows per-session answers/confidence, no date range, objective aggregation, retention schedule or graph/list mastery map. Add explained period, denominators and evidence timeline; avoid duplicate objectives counted once per conversation. |
| `/dashboard/classes` (including `?join=1`, `?class=…`) — `StudentClasses.jsx`; `/dashboard/class/:classId` — `ClassDetail.jsx` | Enhance existing join, updates, submission and returned feedback | Student page uses entity collections and local draft state. Add service-scoped class view models, persistent drafts, consent-aware join, invalid/expired invitation states, submission review and explicit original-stage assignment labels during promotion. Keep teacher feedback intact. |
| `/dashboard/connections`, `/dashboard/privacy` | Enhance existing relationship controls | Legacy connections and v2 privacy connections are separate consumers. Student needs one canonical scope/approver/expiry/state view with guardian visibility and independent-teacher minor approval. Acceptance depends on Part Z paired views, not just a request button. |
| `/dashboard/profile`, `/dashboard/settings`, `/dashboard/personalization`, `/dashboard/notifications`, `/dashboard/support`, `/dashboard/subscription` | Enhance shared controls, local disclosure and retained saved-work access | Personalization currently lists explicit preferences, not item-level provenance; interface translation is explicitly incomplete; voice/source/input settings absent. Notification fixture is a welcome item, not full connection/transition lifecycle. These need scoped service-produced state, never claims of live delivery or cross-device sync. |

Source anchors: `src/domain/workspace.ts` lacks RoleProfile/stageProfile and transition records; `src/services/workspaceService.ts` contains scoped workspace access, session persistence, evidence derivation, twelve persona labels and local failure simulation; `src/hooks/useStudentData.js` and old pages still consume legacy entity collections. `src/lib/dashboardNavigation.js` has Home/Learn/Practice/Build primary student destinations, while Ask exists as an alias; UX must reconcile the operative Ask destination without adding a duplicate floating action.

## 3. Home modules and stage adaptation

One dominant next action is chosen by the service from permitted context: unfinished activity first unless a user-edited plan or required assignment makes another next step appropriate. Its reason cites evidence IDs and the active goal, not assumed ability. Additional options remain secondary. Connected organization entry is a compact boundary/status row, not a sixth recommendation module.

| Stage profile | Ordered Home modules (maximum) | Session treatment and next action |
|---|---|---|
| Primary, abstraction/intensity 1/1 | Continue; Today (≤2 tasks); evidence-backed encouragement (3) | Concrete language; Explore-first, picture/story/read-aloud preference; 5–8 min; large direct controls. Next: manipulate one idea, then explain it. No score-first view, shame, ads, marketplace or public sharing. |
| Secondary, 2/2 | Continue; Today; Needs attention; Subjects (4) | Everyday language and glossary; Explain→Explore→Try→Check, 8–12 min; diagram/simulation and visible bilingual option. Next: resume or one due retrieval. |
| Higher secondary, 3/3 | Continue; Today; Needs attention; Subjects; Build opportunity (5) | Subject-standard terms, 12–18 min, worked example and prerequisite refresh. Board-pattern practice is labelled; readiness claims require explicit coverage/date/uncertainty. |
| Competitive, 3/4 | Continue; Mocks/review due; Evidence gaps; Coverage; secondary Build (5) | Error analysis first, optional timing and section denominators; no fabricated percentile/rank. Next: review a specific mistake or due set. Apply minor safety independently of exam stage. |
| Vocational, 3/3 applied | Continue project; Skill gap; Practice due; connected assignment when applicable (≤4) | Tool sequence/checklist, safe simulation and artifact evidence; Learn is contextual. No arbitrary code execution required. Next: one project milestone with success criteria. |
| Higher education, 4/5 | Continue; Course objectives; Recall; Artifact; scoped organization activity (≤5) | Dataset/model/paper placeholders, citation-aware review, 20–30 min with save points. Next: evaluate or apply a specific objective; sources are supplied, never invented. |
| Independent adult, configurable (default 3/3) | Continue; Today; Review due; Build (≤4) | User-set pace and goal vocabulary; no school board imposed. Next: goal-linked learning or application. Optional adult discovery sponsorship never enters the active lesson. |

Values come from a service-delivered RoleProfile, not hard-coded persona branches in pages. Preserve language, accessibility, pace and preferred representation across stage changes. Read-aloud preference does not mean browser autoplay or a fabricated voice: unsupported speech provides transcript/text and a clear unavailable state. A user can ask in their native language without every control pretending to be fully localized when it is not.

## 4. Required behavior per module

| Module | Primary action | Why this? / required evidence | Essential states beyond populated |
|---|---|---|---|
| Continue | Resume exact lesson/practice/project snapshot | Last activity, objective and saved point, not merely last conversation title | New learner → Start an idea; missing representation → Text/2D; save failure → keep draft and retry; promotion → mapped continuation |
| Today | Start first of ≤3 sequenced tasks; Change plan secondary | Goal, due time and estimated total time from fixture | No plan → choose goal; partial source → mark missing estimate; dismiss/change persists without inferring low motivation |
| Needs attention | Review one explanation or retrieve one idea | Recent answers and dates or due review; use “may need a refresh” | No evidence ≠ poor ability; no gaps → omit; stale data → label date |
| Subjects | Continue next objective | Curriculum version, evidence stage, review due and assigned marker | Empty → Add/manual; filtered empty → clear; preparing/unavailable → safe alternative; archived → Resume anytime |
| Build opportunity | Preview project then start milestone | Secured/relevant concepts, transparent prerequisites and criterion | No concept evidence → explore with support; strict lock only safety/cost; retained draft at quota; sharing unavailable explains consent boundary |
| Ask studio | Choose intent or ask about current activity | Active objective/project/assignment and chosen intent | Unsupported arbitrary question → honest curated fallback/save; stop/retry preserve question; sensitive prompt → bounded safety state; active assessment → hints/reasoning |
| Lesson player | Continue current stage | Outcome, current stage and representation rationale | Preparing, diagnosis, explanation, exploration, check, remediation, practice, build, reflection, completion, interruption each has content and allowed actions |
| Practice | Start next due task | Last attempt, error class and spaced-review date | Draft resume, empty due queue, partial question set, unavailable language alternative, error retry, results and answer review; no repeated-click evidence inflation |
| Progress | Review next objective needing evidence | Evidence type/time/rubric and calculation | No evidence, period empty, stale/partial records, permission boundary; list equivalent for every graph |
| Classwork | Continue or submit assigned activity | Teacher objective, class, due date, rubric | Pending/expired invite; consent pending; draft/submitted/returned/closed; unavailable content with retained response; no private transcript included |

All data-bearing modules additionally inherit Part O: skeleton, background refresh with prior content, populated, new-empty, filtered-empty, partial, recoverable error, terminal/permission, offline-cached, limit reached, plan feature unavailable, consent pending/revoked, org invite pending/expired, preparing, unavailable-with-alternative, destructive confirmation and success-with-undo where possible. UI must not flash empty while refreshing. For an inapplicable state, QA records why rather than fabricating a useless control.

## 5. Metrics, reasons and memory contract

- **Completion:** completed required activity stages / required stages in the disclosed fixture. It is not mastery and does not increase because time passes.
- **Accuracy:** first valid recorded answers correct / valid answered items for the chosen attempt/period; unanswered/unsupported items are distinct. Retry feedback can teach without rewriting the first-attempt denominator. Aggregate objectives once by stable objective ID.
- **Mastery:** named evidence stages from versioned fixture rubrics. Secure requires successful explanation/check plus distinct practice; Mastered additionally requires application evidence and delayed retrieval. Current `mastery()` uses 70% evidence success and a seven-day stale threshold: retain only as labelled demo policy until stronger objective rubrics are implemented and tested. One grade, completion, checkbox or elapsed duration never establishes mastery.
- **Retention:** actual delayed recall with a recorded timestamp and next review date; an overdue recommendation is not proof of forgetting. Current `beginReview` is a useful foundation, not a full due-queue service.
- **Confidence:** optional learner self-report, shown as their own words where practical; never infer it from marks or display model certainty under this label.
- **Applied concept:** artifact criterion reviewed against the objective with source/rubric/version; no current application evidence creation path was established in this audit. Do not claim the north-star metric is measurable before it exists.
- **Why this?** fixtures return reason, evidence references, time window, goal and available change/dismiss action. With no evidence: “This is a starting activity for your chosen goal,” not “We know you struggle.”
- **Memory:** each item exposes what is used, why, source (told/inferred/org), workspace scope, last use, edit/disable/delete. Disabling personalization retains user-owned history unless separately deleted. Organization data never silently becomes personal memory.

Analytics acceptance uses typed no-op events from Part N and IDs/state only, never free-text doubts, child names or artifact bodies. Lifetime companionship is a product aspiration; this frontend must say saved on this device and must not imply cloud sync, continuous listening, human awareness or an implemented AGI. Voice is user-invoked with visible listening/stop/permission states, not always-on surveillance.

## 6. Fixture approval requirements (not yet approved as complete)

Existing twelve persona labels in `scenarioPersonas` are retained. Student seeds currently distinguish role/age and Bengali teaching locale, but do not establish stageProfile, board-objective graph or transition records. Labels alone do not satisfy stage adaptation.

| Fixture | Required acceptance before PM approval |
|---|---|
| Minor CBSE primary, Class 5 | Guardian/institution consent lifecycle; 3-module Home; 5–8 min Explore-first cube or fractions path; no professional card, ad or adult sharing; seeded Class 5→6 before/after mapping |
| WB Bengali learner | WB version/term/manual fallback; correct বাংলা teaching content and long interface labels; source/teaching/interface separate; mid-session language switch preserves point and input |
| Competitive learner, adult plus under-18 variant | Exam goal, scoped mock sections, optional time, mistake review, numerator/denominator and no percentile; child policy inherited when minor |
| Higher-education learner | Course/goal objective with supplied source placeholder, save points, artifact rubric; no primary-school vocabulary or compulsory school board |
| Independent adult | Personal goal/pace with no institution; explanation→practice→project; contextual adult discovery eligibility separated from active learning |
| Secondary, higher-secondary and vocational variants | Same service/domain and components, distinct stage defaults and safety tier; do not add extra account identities merely to show treatment |
| Connected student | Teacher-reviewed assignment → learner draft/submission → returned feedback, guardian permitted summary, organization assigned-only scope; private doubt canary absent from all audience responses |
| Failure/limit fixtures | Offline, service error, storage-write failure, invalid/missing/unauthorized objective, revoked connection, no-data and stale evidence, free quota last/at limit; required work and saved content remain accessible |

The curated cube, fractions and data-interpretation content is reusable. Assign availability and representation policy by stage and goal through services. Test unsupported topics as honest bounded fallbacks; do not use fixtures to imply general model understanding.

## 7. Part W transition PRD and acceptance

The operative policy is **AUTO**, not the archived confirm-before-promotion behavior. Triggers are ordered: authoritative org promotion → guardian/self confirmation → user declaration → calendar fixture → evidence-only suggestion. Inference alone never changes stage. Conflicting/lower-priority stale events cannot silently overwrite a committed authoritative transition.

Normal same-board Class 5→6 promotion needs no required action. It commits a versioned before/after snapshot atomically, then shows: **“You’re now learning in Class 6.”** Actions: **See what changed**, **Postpone 7 days**, **Undo** (available for 14 days). Ignoring the notice leaves the upgrade active without blocking the lesson. Deadline dates use explicit local display and service time; actual expiry semantics must be tested, not client clock assumptions.

Diff content: reason/source and effective date; class/stage and vocabulary change; added subjects; retained mapped objectives; archived items with reason and **Resume anytime**; Bridge Plan gaps; preserved practice due dates; open assignments retaining original class label; language/pace/accessibility retained; exactly what each authorized audience can see. Do not frame promotion as proof of mastery.

PM acceptance cases:

1. **Mid-lesson:** an eligible event commits while exploring a model. Continue resolves the mapped objective with stage, position, model controls, answers, notes, draft doubt and representation preserved. If no map exists, archive with reason and keep the old activity resumable; never reset or orphan it.
2. **Carry-forward:** every old evidence objective maps 1:1 or to a named archive record. New objectives do not inherit invented scores; Bridge Plan explains genuine gaps. Practice due dates and historical answer denominators remain unchanged.
3. **Audience timing:** guardian/teacher/org permitted views see only the previous committed revision until the full new revision succeeds. Then each receives scoped plain-language insight; no draft event or personal doubt transcript leaks. No live message delivery is claimed.
4. **Undo ≤14 days:** restore the exact prior stage/curriculum/queue/session mappings, preferences and audience revision; retain an audit record. Work created after promotion must not be destroyed: preserve it separately as post-transition history. Engineering must resolve this preservation rule before implementation and test full snapshot fidelity plus later-work retention.
5. **Postpone 7 days:** restore the prior active stage through the same reversible transaction and schedule reapplication seven days later, retaining the diff/history. It cannot be a cosmetic snooze while the learner remains silently promoted. Reapplication remains subject to newer authoritative events and safety boundaries. This interpretation requires chief acceptance before implementation.
6. **Boundary changes:** minor→adult safety tier, board/institution switch, >1-stage jump or explicit organization policy require blocking confirmation. Until confirmation, prior safe state remains usable. Birthday/time alone cannot remove youth controls. Promotion never creates additional roles or shares personal history.
7. **Failure/idempotence:** write failure leaves both learner and audience on the prior committed state and keeps the source event retryable; replay does not duplicate evidence, notifications or assignments. Undo/retry is unavailable only with a specific reason, not fake success.
8. **Inference:** “This evidence suggests a next step” has source and accept/dismiss, never “You have been promoted.” An accepted suggestion becomes a user-declared trigger; unaccepted inference stays a suggestion.

There is no transition engine in the inspected domain/service. This is a blocking implementation gap for G12, not a claim that the present build violates a test already run. Dev-only **Simulate promotion** must operate on the complete seeded before/after record, not directly change a visible class label.

## 8. Traceability and handoff priorities

| Acceptance IDs | Vision behavior / v2.2 source | Screen/service boundary | Required later evidence |
|---|---|---|---|
| STU-01 | Knows doing/next/why — J Home, K, Y | Home decision view / goal+recommendation service | Primary vs competitive walkthrough; ≤5 modules, one next action, reason/change |
| STU-02 | Native-language staged learning — B, J lesson, K | Objective/player / learning+representation services | EN/HI/BN, smaller-example remediation, exact doubt/resume, no fake audio |
| STU-03 | Practice over time — J Practice, K/O | Practice/history/progress / practice+mastery services | Denominators, delayed recall, no completion=mastery, retention due |
| STU-04 | Build from understanding — J Build | Project workspace / project+evidence services | Durable draft, milestone/criteria/version/export, evidence not checkbox |
| STU-05 | One connected private ecosystem — F/Z | Classes/connections/org boundary / scoped class+connection services | Teacher assignment and returned feedback; guardian lifecycle; private canary excluded |
| STU-06 | Learner control and trust — K/M/N | Personalization/support/privacy / privacy+safety+analytics | Provenance/edit/delete; no always-listening or live-sync claims; private event payload exclusion |
| STU-07 | Product upgrades itself — A6/W/X | Home notice/diff/player/audience summaries / transition service | Atomic promotion, map/archive, postpone, undo, boundary confirmation, audience timing |
| STU-08 | Current design as property — A1/A7/A10/H | All touched student surfaces / shared primitives | DESIGN_INVENTORY co-sign, before/after shots, no public output change |
| STU-09 | First-time and failure usability — I/O/R | All routes / service scenario controls | Consent, loading/empty/partial/error/offline/limit, seven widths, keyboard/SR/zoom/reduced motion |

Next UX stage: reconcile Home decision surface and existing Guide canvas without a new visual language; define Ask intent entry and mobile canvas-first flow; design all state classes and transition diff/postpone/undo. Next Design System stage: normalize inherited tokens and stage variants, not page-specific styles. Frontend must wait for those handoffs and approved enhancement inventory. QA must subsequently verify the listed invariants; this PM handoff does not run or replace 07-QA or the twelve-gate review.
