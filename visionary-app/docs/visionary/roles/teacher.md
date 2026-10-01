# Teacher acceptance addendum — 01-PM / Wave 0.5

Authority: v2.2 F/J/K/M/X/Z and shared acceptance. Source review, not fixture or QA approval. Inventory TE-01–08 defines preserved consumers. No frontend changes.

## Job and Home

Help someone understand, review their evidence, and grow as a teacher. Independent, organization and both contexts use the same product with explicit workspace boundaries. Home chooses one priority from: next lesson preparation, submitted work awaiting feedback, authorized learners needing attention, recent class change, own growth (≤5 modules). Empty sections disappear. Organization announcements/resources are contextual; marketplace never leads.

Primary action is **Continue preparation**, **Review next submission**, or **Prepare a lesson** when new. Each reason cites the class/objective/date or an actual submitted attempt; never infer a learner's emotional state or expose private questions. Directly open existing controls; Guide may help but sending a chat message is not mandatory navigation.

## Route acceptance

| ID / current route | Required outcome | States / evidence |
|---|---|---|
| TE-A1 `/prepare` | Context, objective, prerequisites, representations, misconceptions, checks, rubric, accommodations, language, duration and sources editable; learner preview; explicit review before assign | Existing WorkspaceTools text draft/preview/AssignLesson retained. Save failure keeps edits; incomplete source review blocks assignment with reason; no model claim |
| TE-A2 `/library` | Save/version/duplicate/preview/export/share with ownership and license | Empty/filtered-empty/archive restore; old versions do not change published assignments; private/org boundary shown |
| TE-A3 `/classes`, `/class/:classId` | Create class, select accepted org, compose draft/scheduled/active/closed/returned work; learner audience and due date review | Preserve ClassworkTab/AssignmentGrader. Missing/expired membership prevents new writes; never erase returned feedback |
| TE-A4 `/learners` | Roster → authorized evidence → one teaching action | Existing teacherLearners returns scoped submissions. Add class/objective/missing/review filters; absence of evidence ≠ low ability; no private doubt body |
| TE-A5 `/insights` | Period, denominator, objective evidence, meaningful drill-down | Current RoleWorkspace counts are not pedagogy. Suppressed/partial/stale views must explain limits; score is not mastery |
| TE-A6 `/growth` and personal loop | A teacher can learn/practice/build independently | Keep goal editor; connect evidence-backed next step without contaminating class analytics |
| TE-A7 contextual Ask | Explain feedback, adapt explanation or suggest plan with teacher control | Hints in assessment contexts; suggestions reviewed, not silently published; unsupported request honest |
| TE-A8 future flagged marketplace | Complete listing/license/moderation/appeal and itemized earnings simulation | Disabled by default; adult eligibility is unverified placeholder. No actual sale/payout or invented tax policy |

Every screen inherits shared state acceptance. A consequential assignment/share/grade is reviewed through direct controls; failure does not report success. Teacher-created activity must open in the learner's existing player/canvas, not an unrelated static document path indefinitely.

## Fixtures and connected acceptance

Retain Dev/Aarav and Nila/Maya class fixtures, including existing submissions/feedback. They demonstrate connected records, not full Teacher completion. Require independent adult teacher, accepted org teacher, both-workspace teacher, pending/revoked membership, minor independent connection with guardian approval, and unavailable source/content variants.

TE-F1: edit reviewed lesson → preview → assign immutable source version → learner receives same objective/rubric → submit → teacher returns feedback → parent sees only permitted digest → org sees only authorized operational/evidence view. Retry assignment must not duplicate it.

TE-F2: private learner doubt/notes and personal teacher growth canaries never occur in class/org service responses. Independent-teacher access expires/revokes in every consumer. Membership mutations generate local audit and notifications.

TE-F3: after Part W commit, original open assignments retain their stage labels; mapped cohort/evidence views update after commit only. No silent grade rewrite. Undo preserves audit and work created since transition.

Metrics: review queue counts unreturned submissions, workload counts scoped assignments, accuracy retains points/total and period, attention reason uses permitted evidence; never rank children or claim mastery from a grade. Fixtures remain unapproved until these cases and the applicable Part O states are evidenced.

Next: 02-UX designs states inside existing class/library/editor grammar; 03 reviews tokens; 04 implements scoped service outputs. No UI redesign or release verdict authorized by this addendum.

2026-09-30 implementation evidence: completed saved learner projects can be explicitly previewed and submitted to written-response classwork. Teacher review, requested revision, resubmission and return retain earlier fixed responses and feedback. This closes the local project-copy feedback slice; it does not sign TE-F1 objective/player mapping or full Teacher acceptance. Private artifact history, unsubmitted edits and parent permissions are not part of the class response.

2026-09-30 lifecycle evidence: private draft → publish → close → archive → restore closed → reopen retains all submitted copies and review attempts. Closure denies learner writes while teachers may finish reviews. Submitted learners retain archived feedback; unsubmitted archived activities stay hidden. Stale state and failed save preserve originals. Scheduling, stage/objective/player mappings and full Teacher acceptance remain open.

2026-09-30 scheduling and audit continuation: future scheduled assignments stay private until their saved publication instant, allow Publish now/Cancel to draft, and reject premature learner writes. Local availability is checked in classwork, plans and family due summaries. Organization audit receives only scoped action metadata, with honest absent/partial historical sources. Full Teacher acceptance still needs the objective/player and other state gates.

## 2026-10-01 — Reviewed objectives and authored visuals in classroom Learn

Teachers can load a sourced curriculum selection, choose a concept and language, attach a validated objective snapshot, preview explanation/visuals/questions, then review and save before assignment. Attaching/removing returns the editor to draft. Unfinished attachments recover from the existing per-workspace/tab editor backup. Missing/provisional sources, stale source versions, unavailable languages and changed teacher context reject attachment without changing the lesson. Invalid recovered objective shapes show a recovery notice instead of crashing the editor.

Assignment stores an immutable learner-safe objective/source/version/language and whitelisted representations. Check/practice answer keys and private preparation metadata are excluded. Expected full resource revisions reject same-clock stale assignment actions; replay distinguishes assigned payloads, including older copies by their actual delivered fields. Later lesson edits/removal do not rewrite assigned content. The learner's Understand stage renders the fixed explanation and existing 3D/number-line/chart/text component where authored descriptors support it. Visual draft controls are bounded and match the exact objective revision; saved 3D size/rotation and text mode restore after refresh. Exploring/submitting written teacher work creates no automatic score or concept mastery.

Verification: 238/238 full Node service tests pass. The final assignment-copy revision adjustment also passes 13 focused lesson/workspace tests. Both typechecks, production build and scoped lint pass. Standard npm run lint reports only the pre-existing scripts-tmp/copyaudit/scan.js:84 parser error. lesson-objective-verify.mjs passes at 390px on development and production: teacher attach, draft refresh recovery, learner preview, review/assign, later teacher removal isolation, learner 3D/text refresh and written submission, plus unavailable-source preservation. No page errors or horizontal overflow. organization-content-delivery-verify.mjs passes against the final production build, retaining approved copy delivery, teacher adaptation/source isolation and revocation. Evidence: scripts-tmp/lesson-objective-final.txt and objective-delivery-regression.txt. teacher-objective-390.png and classwork-objective-3d-390.png were visually inspected.

Resume: objective-linked Ask/Practice and assignment rubric behavior, broader reviewed content/distribution, Part W bridge/stage mappings, ownership reconciliation and remaining role/shared accessibility/language/device/failure-state gates. This closes the local teacher objective/visual attachment slice; TE-F1 and full frontend acceptance remain open. Existing sample activities are demonstrations, not the founder's sample book or independent content approval. Keep src/pages/landing excluded. Finish frontend acceptance, then request the founder's book and complete local/connected-category rehearsal before backend/API/database/model work.

## 2026-10-01 — Assignment-scoped Ask, private authored rehearsal and criterion self-review

Ask now opens the authorized assignment/source, saves a private question across refresh, returns the exact assigned explanation/instructions, and uses the existing teaching adapter for other questions with explicit disconnected, blocked and cancellable states. Model packets exclude saved private study and submitted answers; delayed replies are discarded after revoked class access. Replies are transient. Private question conflicts, unreadable originals and failed saves retain records and offer recovery/export.

Practice resolves authored exercises against the exact assigned source/version/language/explanation/representation/rubric. Public exercise packets omit answer keys; opaque question revision tokens reject changed questions. Private attempts, position and distinct retry rounds survive refresh; identical replay does not duplicate an attempt. These rehearsal results never become teacher grades or concept mastery. A separate learner/workspace/assignment namespace retains study after submission and is flagged for its own migration ownership review.

New objective copies can carry authored review criteria. Learners review each criterion in Learn before submitting; the preview, fixed response and structured self_review agree. Source-matching project previews include the exact criterion appendix and reject changed objective/rubric versions. Teacher revisions retain earlier notes, and prose prefill removes only the generated criterion appendix so resubmission cannot duplicate it. Private questions/rehearsal stay excluded. Classes routes required-criterion responses into Learn. Older assignments without criteria retain their existing workflow.

Verification: 243/243 full service regression and 24 focused tests after final source/prefill hardening pass. Production build, both typechecks and scoped lint pass. Standard npm run lint still reports only the existing scripts-tmp/copyaudit/scan.js:84 parser error. classwork-study-verify.mjs passes on development and production at 390px with zero page errors/overflow; classwork-project-verify.mjs passes against the final production bundle, retaining existing project/revision/storage/lifecycle/scheduling behavior. classwork-source-ask-390.png and classwork-private-practice-390.png were visually inspected. Reports: scripts-tmp/classwork-study-final.txt and classwork-study-project-regression.txt.

Next: structured teacher feedback against each assigned criterion, then wider content/role/stage/Part W and shared acceptance. This entry closes source Ask/private rehearsal/learner criterion review locally, not full frontend or AGI acceptance. Preserve the landing exclusion and founder-book/backend sequence.


## 2026-10-01 — Teacher criterion return and review conflict recovery

Teacher reviews now retain per-criterion ratings/notes in attempt-scoped drafts. Complete graded returns require every assigned criterion; revision requests can target selected criteria. Learner revisions preserve previous feedback and clear current ratings. Learn, Classes and teacher history display the fixed assigned rubric feedback. The review UI stores its loaded submission revision with the draft, checks before returning, retains stale edits for export and offers explicit discard/load-latest recovery. This is browser-local optimistic recovery, not an atomic server transaction or client-tamper protection.

Service tests cover required criteria, learner tamper denial, stale attempts, matching project copy/rubric, failed/malformed draft preservation and same-attempt review conflict. Frontend completion remains open for broader roles/shared states, Part W mappings, auxiliary ownership, accessibility, native language and live voice devices. Real-book rehearsal and backend/model work remain later.


## Final 2026-10-01 verification — classroom source and rubric loop

247/247 service tests and 23/23 focused review/conflict tests pass. Typechecks, production build and scoped lint pass. Standard lint remains blocked only by the existing `scripts-tmp/copyaudit/scan.js:84:53` unterminated-string parser error.

Production 390px journey passes sourced teacher objective attachment/recovery/preview/assignment → learner 3D/text controls and refresh → private Ask draft/exact source/disconnected free-question state → authored private Practice retries/resume → criterion self-review submission → teacher partial criterion revision → learner resubmission → teacher full criterion draft refresh → stale same-attempt review rejection/export/load-latest → returned current and historical feedback in Learn and Classes. Private rehearsal remains excluded from submitted copies and mastery. The project preview/revision/return/storage-recovery/assignment lifecycle regression also passes. Both journeys report no page errors or horizontal overflow.

Evidence: `scripts-tmp/criterion-feedback-browser-final.txt`, `criterion-feedback-project-regression.txt`, `criterion-feedback-tests-final.txt`, `criterion-feedback-conflict-tests.txt`, `criterion-feedback-build-final.txt`, `criterion-feedback-typecheck-final.txt`, `criterion-feedback-lint-scoped-final.txt`. Visually inspected [teacher criterion review](baseline/design-2026-09-27/teacher-criterion-review-390.png), [learner criterion return](baseline/design-2026-09-27/learner-criterion-return-390.png), source Ask and private rehearsal mobile captures.

Next frontend work: complete broader content/distribution and role permission/failure coverage, Part W stage/bridge mappings, auxiliary and legacy local-record reconciliation, accessibility/native-language/live-device voice acceptance. Full frontend acceptance remains open. The founder book comes after this gate; backend/API/database/model work remains deferred.
