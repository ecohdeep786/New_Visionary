# Shared product acceptance and integration boundary — 01-PM

Wave 0.5, 2026-09-19. Product requirements for subsequent UX/engineering, **not implemented architecture or QA sign-off**. v2.2 Parts F–O/W/Z remain authoritative. All role addenda inherit this file.

## One lifelong product, user-controlled intelligence

Visionary Guide supports a continuing learning/building relationship: goal, current understanding, next useful activity, permitted history, language and pace. Role and stage change the treatment, not the person's ownership of their work. An enduring relationship does not mean a dependency claim, guaranteed general intelligence, background surveillance, or access across privacy boundaries.

- Home identifies the role/workspace and gives an evidence-backed next action. Guide can explain, teach, check, remediate, plan or help build in context. Forms and review controls remain directly usable.
- The future model may offer broader understanding; this frontend uses curated, labelled journeys and honest unsupported-topic alternatives. No claim that AGI is implemented.
- Memory is inspectable and optional: item, source/provenance, reason, scope, last use, edit/disable/delete. User-told vs inferred vs organization-provided data is explicit. Declining personalization is not equivalent to deleting their work.
- Voice is user-invoked. Required states: unavailable, permission explanation, listening indicator, stop/cancel, processing, transcript review, error/retry, text fallback. No passive microphone activation, unsupported generated audio, or claim that the app is always listening. Listening stops on navigation/sign-out unless a separately designed and authorized session contract says otherwise.
- Interface, teaching, source, input, voice and bilingual preferences are distinct. English/Hindi/Bengali fixtures and script-appropriate layout are the starting coverage, not an all-language capability claim.
- Future device sync is capability-gated: show this-device-only now. Later show syncing/saved/offline/conflict, explain authoritative version and recovery. Never say cloud saved before acknowledgment.

## Existing architecture and incremental target

Keep React/Vite, Router, Query, Radix and Lucide. `App.jsx` retains dashboard URLs; `AuthContext` and WorkspaceSwitcher retain identity/context handling. `domain/workspace.ts`, `workspaceService.ts`, `journeys.ts`, `classroomService.js`, `legacyConnections.ts` and scoped `appClient` are foundations, not disposable prototypes.

| Boundary | Current foundation | Required next acceptance |
|---|---|---|
| Account/workspace | Person, five roles, per-workspace records, lastPath, local auth | Explicit RoleProfile/stageProfile, membership capability and consent state; role vocabulary and personal/org isolation |
| Learning/Guide | Persistent conversation/session, curated representations and question evidence | Goal/objective identity, guided intents, representation availability, mapped exact resume, cancellation and durable failure states |
| Evidence/planning | Named mastery function, first-answer records, delayed review | Versioned objective rubrics, application evidence, due queue, explained recommendations, no grade-as-mastery |
| Projects | Document/milestones/versions/export, explicit relationship sharing | Durable edits, artifact criterion/evidence, versioned share preview and role-specific portfolio |
| Classes/org | Scoped classroom policies, reviewed lesson snapshot, submissions/grades, accepted cohort selectors | Full lifecycle, permitted view models, organization least privilege, content review, audience-specific derived summaries |
| Connections | Legacy relationship bridge and v2 scopes/reports | One canonical all-role center; scope/approver/expiry, lifecycle events and immediate revocation in every consumer |
| Commercial | Central plan prices, mock usage, family entitlements/invoices | Owner vs beneficiary, complete checkout/limit outcomes, flag-gated marketplace, adult-only discovery sponsorship rules |
| Trust | Local disclosures, explicit preference controls, workspace export | Itemized consent/memory, safe report/voice states, retention/request placeholders, no legal certification |
| Transition | No stageProfile/atomic transition record in current domain | Part W engine through services; no isolated UI-only class increment |

The UI must receive already-scoped view models, not fetch broad sensitive entity collections and hide fields afterward. Person/workspace/role/locale/cancellation belong in request context and cache keys. Context switches abort stale work; late responses cannot render in another workspace. Client-side mock checks are demonstrative, not server security.

## State acceptance (all data-bearing screens)

For each touched screen 02 designs, 04 implements and 07 verifies: loading skeleton; background refresh retaining content; populated; new-empty with next action; filtered-empty with clear/reset; partial with missing sources; retryable error retaining drafts; terminal/permission without leaking object details; offline cached with saved status; daily quota preserving saved/required work; unavailable entitlement with explanation; consent pending/revoked; org invitation pending/expired; preparing content; unavailable content with alternative; destructive review; success with undo where safe. Explicitly justify N/A rather than adding meaningless UI.

Every mutation has a clear pending state and honest success/error. Navigation, refresh, cancellation and storage failure must not silently discard input. An accessible status message must not claim success on rejected persistence. Repeated submit/retry is idempotent where appropriate.

## Part W product clarifications awaiting 00 arbitration

The automatic policy is settled by the user: eligible stage changes need zero action, then notice + diff + Postpone 7d / Undo 14d. Evidence inference alone is suggestion-only. Safety-tier, institution/board, multi-stage and policy boundaries keep blocking confirmation.

Two edge semantics need the chief's recorded decision before implementation, not a new user preference questionnaire:

1. Postpone after an already committed change should restore the old active mapping and schedule reapplication in seven days, not merely hide the notice; do not let a lower-priority calendar trigger bypass that postponement.
2. Undo should restore the exact prior active mapping/snapshot but preserve any new work created since transition in a separate accessible history branch. Never delete legitimate new work to obtain snapshot equality.

These are PM proposals, not amendments to the master. Required evidence regardless: 1:1-or-archived objectives, reasoned Bridge Plan, due dates retained, original-stage open assignments, mapped resume, preferences retained, audience updates only after commit, auditable idempotency and rollback on storage failure. Do not notify people without valid existing scopes.

## Commercial/trust acceptance

Prices remain config-only: Premium ₹299/month, Family ₹499 provisional, ≤6 separate profiles; org TBD, marketplace commission 30% provisional. No annual offer, live taxes or production allowance invented. No card/UPI collection. Mock failures/cancellation preserve saved work. Family payer never becomes guardian implicitly; beneficiary cannot cancel manager-owned billing.

Adult Free discovery sponsorship is a required **labelled mock scenario**, not an integrated ad network. No ads for child/unknown-age users or inside explanation, doubt, assessment, feedback, reports or safety. Marketplace and live-teaching simulation remain disabled by default; any active scenario visibly states what is simulated. No covert device monitoring. Privacy/regulatory assertions need later expert review; frontend success is not legal compliance.

## Backend/model cutover and test-data retirement

The user's goal is replacement of temporary demo data when backend/model integration begins. This stage performs **no deletion or live integration**.

Required future cutover acceptance:

1. Adapter choice explicitly separates mock and live environments; no silent fallback from failed live service to fictional success. No mixed mock/live person, consent, invoice or evidence records.
2. Services provide capabilities for model, speech, representation, persistence, verification, billing and delivery. Unsupported capabilities show truthful alternatives.
3. Maintain a fixture manifest: storage namespace, schema version, deterministic fixture IDs, service owner and production replacement. Current examples include `visionary_workspace_v2`, `visionary_entity_*`, auth/onboarding keys and `visionary_connected_demo_v1`; inventory exact keys before deletion. A key prefix alone is **not** proof every record is disposable.
4. Identify seeded fictional records by manifest/provenance. Retire only those records in the explicit test environment, with count/preview and recovery where practical. Never run `localStorage.clear()` or wipe all accounts/owned drafts. Non-fixture user work requires export/migration or an explicit discard choice.
5. Disable demo entry/fixtures and prove they cannot pollute live requests. Replace mock authorization with server-enforced ownership/consent/roles, deterministic cancellation/retry semantics and migration checks.
6. Contract tests run against both adapters: same view-model shape, boundary decisions, state machine and errors. Model evaluation separately covers factuality, pedagogy, native languages, age/safety and unsupported requests; a plugged-in model is not proof of human-level ability.

Part T maps account/workspace/curriculum/learning/representation/Ask/mastery/practice/project/class/organization/connection/notification/subscription/payment/sponsorship/marketplace/analytics/safety/privacy to future services. 04 defines technical contracts; 08 publishes the final integration and fixture-removal checklist only at Wave 6.

## 2026-10-01 — Final ownership, trust and notification evidence

269/269 full service tests and 15/15 focused ownership/notification tests pass. Both typechecks, touched-file lint and the final standard npm run build pass. One preceding build hit a machine-memory error during gzip reporting; the isolated retry passed, and the final production output was used for all browser checks. Standard npm run lint still reports only the unrelated scripts-tmp/copyaudit/scan.js:84:53 parser error.

Three production 390px journeys pass with zero page errors/horizontal overflow: (1) owned cross-role supporting counts, foreign review exclusion, sanitized counts export, same-app and real second-tab invalidation, fresh review and unreadable-original preservation; (2) failed language/checkbox/reset persistence, retained saved state, successful retry/refresh, preserved animation/learning and export failure/retry; (3) failed notification preference/read persistence, opening content without read-state writes, read retry/refresh, unread-empty return to history and parent read failure/retry. The ownership review and unread-filter mobile captures were visually inspected. These are fictional local fixtures, not complete assistive-technology, language, device, security, server-ownership or AGI certification.

Evidence: scripts-tmp/trust-final-tests.txt, trust-final-focused.txt, trust-final-build.txt, trust-final-typecheck.txt, trust-final-lint.txt, trust-final-lint-full.txt, ownership-browser.txt, trust-recovery-browser.txt and notification-recovery-browser.txt. Scripts: ownership-verify.mjs, trust-recovery-verify.mjs and notification-recovery-verify.mjs. Captures: baseline/design-2026-09-27/local-ownership-review-390.png and notifications-unread-recovery-390.png.

Exact resume: broader connected-role permission/revocation and storage/conflict/empty/error acceptance, auxiliary schema/source reconciliation, organization policies, reviewed real-curriculum migration and language/accessibility/live-device voice gates. The current report is an ownership inventory, not an approved migration manifest. Frontend-wide acceptance remains open; preserve the landing exclusion and complete frontend acceptance before founder-book rehearsal and backend/API/database/model work.

## 2026-10-01 — Explicit voice session and transcript-review lifecycle

The shell no longer starts listening on generic gestures or a granted microphone permission. Saved audio preferences govern output; the user explicitly starts input. Recognized words remain in an editable review field until Send, with no silence-triggered automatic submission. Closing/stopping the panel, navigation, scope/language changes, hidden/pagehide and sign-out stop recognition/output and abort pending mentor work. Text fallback carries the unsent reviewed words into Ask. Session generations prevent old mentor responses and speech callbacks affecting new scopes; pending analyser streams check their generation and release late tracks. Recoverable errors distinguish saved drafts from words still only in the review field. The Boy/Girl visuals and shared conversations remain unchanged.

The speech seam isolates replaced/stopped recognizers, respects resultIndex and replayed final indexes, resets result delivery for a new listening cycle, invalidates cancelled/superseded output completion, reports start/device errors and restores half-duplex state after an output-engine failure. Browser permission retry stays explicit. Full regression 274/274, voice-focused 13/13, both typechecks, production build and touched-file lint pass. Standard lint remains blocked only by scripts-tmp/copyaudit/scan.js:84:53.

Production voice-lifecycle-verify.mjs passes at 390px with synthetic recognition/output and the hardware device API disabled: no automatic start on load/panel open, explicit start, transcript review/no auto-send after silence, explicit saved conversation send, denied/retry, panel close, stale recognition rejection, text fallback retaining words and sign-out. Zero page errors/horizontal overflow. voice-transcript-review-390.png was visually inspected. This proves local UI/service sequencing, not real microphone permission timing, language recognition quality, screen-reader behavior or native-device reliability. Pending visualizer-stream release is implemented but real delayed device acquisition remains an open acceptance check.

Evidence: scripts-tmp/voice-lifecycle-tests.txt, voice-lifecycle-focused.txt, voice-lifecycle-typecheck.txt, voice-lifecycle-build.txt, voice-lifecycle-lint.txt, voice-lifecycle-lint-full.txt and voice-lifecycle-browser.txt. Script: scripts-tmp/voice-lifecycle-verify.mjs; snapshot: baseline/design-2026-09-27/voice-transcript-review-390.png.

Resume with connected-role/shared failure and ownership/schema/source gates, broader keyboard/zoom/languages and native voice devices. Full frontend and AGI capability are not signed off. Preserve src/pages/landing and finish frontend acceptance before requesting the founder book and doing local rehearsal, backend/API/database/model work.


2026-10-02 shared Settings alignment: non-organization Settings now renders the canonical workspace Personalization controls, so language/Guide changes update the same scoped preferences used by learning. The account accent remains separate and retries failed account storage without losing the selected color. settings-canonical-verify.mjs passes: Settings → Personalization shows the same saved teaching/interface language, keyboard Space selects the account accent, failed save retains it, retry/refresh preserves the accent and workspace language, and no obsolete account learning-language field is introduced. 640px reflow reports zero overflow/page errors. This is not full interface-language, real-browser zoom or screen-reader sign-off. Evidence: scripts-tmp/settings-canonical-browser.txt.


## 2026-10-02 — Personal evidence periods, source timelines and multilingual shell

Progress now reads owner-scoped evidence through a read-only report seam. Last 7 days, Last 30 days and All history affect answer counts/timeline; current stage/review dates explicitly use all saved evidence and local policy. Application and unverified records are excluded from answer accuracy. Stable objectives group multiple activities without merging the earlier-journey and pipeline evidence systems. Every known activity retains its exact original unit/session link and source version; no questions, answer text, conversations or memory events enter the report. Duplicate/malformed evidence makes that source unavailable instead of partially counting it. Readable sources remain visible and retry never repairs original bytes.

Navigation, search and account menus now use the saved workspace interface language in English/Hindi/Bengali. Search also accepts stable English route keys. Organization destinations and actions follow the authoritative current capability policy; analyst/billing search does not offer unavailable academic/analytics/billing controls. Scope changes close the search; changed permissions show a recoverable error instead of an unhandled navigation exception. Progress controls, explanations, stages and empty states have Hindi/Bengali copy; source titles keep their declared teaching language. Other page content remains partly English, with no automatic translation claim.

304/304 full tests and 8/8 focused Progress tests pass; final production build, both typechecks and scoped lint pass. Three production browser journeys pass: period/source timeline with original links, keyboard search/empty reset, unreadable-source preservation/retry and 390/640 reflow; Bengali/Hindi navigation/search/account and localized Progress filters with 320/390/1024 reflow; organization analyst/billing destination/action filtering. Zero page errors/overflow. The Hindi shell capture was visually inspected. Reduced-motion context was exercised, but real browser zoom, screen-reader/native-device and independent native-language quality remain open. Standard lint retains the unrelated copyaudit parser error.

Evidence: scripts-tmp/progress-evidence-focused.txt, progress-localization-tests.txt, progress-localization-build.txt, progress-localization-typecheck.txt, progress-localization-lint.txt, progress-evidence-browser.txt, shell-language-browser.txt and shell-permissions-browser.txt. Scripts: progress-evidence-verify.mjs, shell-language-verify.mjs and shell-permissions-verify.mjs. No frontend-wide, AGI or launch sign-off. Continue Profile recovery, role Help and broader state/source/language/accessibility acceptance before the founder book and backend.


## 2026-10-02 — Profile recovery, concurrent names and role Help

Profile uses the active workspace teaching language, rather than the obsolete account language field. Name and unfinished learning-area edits recover per workspace/tab through the existing resource-editor store. Export, explicit discard/load-latest, rejected persistence and concurrent account-name writes retain reviewable edits. Name save compares the actual stored account ID and loaded name in the local auth write before replacement. Other saved account fields remain intact. This optional preview API guard is not server authorization; a future server must enforce account binding and revision checks atomically.

Only student/professional workspaces offer personal learning-area creation. Missing/retryable area data is visible; duplicate adds retain the field. Adding an area does not generate a curriculum graph or mastery. Help now offers a different starting job for each role and accurate connection, voice, local storage/recovery, language and live-service boundaries. Organization Help suppresses unavailable destination links through current capability policy.

307/307 full tests, 3/3 profile update tests, final production build, both typechecks and touched-file lint pass. profile-recovery-verify.mjs passes at 390px: canonical Bengali teaching label, name/area refresh recovery, failed account save/export, real second-tab conflict without overwrite, explicit latest reload/retry, refreshed saved name, area creation and duplicate draft preservation. profile-help-roles-verify.mjs passes all five role Help starts and eligible Profile controls at 390px. Zero page errors/overflow. profile-conflict-390.png was visually inspected. Standard lint still reports only scripts-tmp/copyaudit/scan.js:84:53.

Evidence: scripts-tmp/profile-recovery-tests.txt, profile-recovery-focused.txt, profile-recovery-build.txt, profile-recovery-typecheck.txt, profile-recovery-lint.txt, profile-recovery-lint-full.txt, profile-recovery-browser.txt and profile-help-roles-browser.txt. Full native-language/assistive-technology/device and frontend-wide acceptance remain open. Continue with role switching and remaining source/state gates before the founder book and backend.


## 2026-10-02 — Role entry, keyboard page focus and five-role route audit

Eligible adults with one workspace can now use Add role; minors do not receive that action. New personal roles retain separate data, original-role notes/language and exact last-page return. Role creation rejects unsupported/prototype role names before writing and idempotent existing-role retries require no new write. Failed creation preserves the original store. Workspace-switcher and role-dialog controls now use English/Hindi/Bengali interface labels.

Keyboard search includes Help. After an internal path/workspace change, focus moves into main content after dialog closure; an open dialog retains focus. Parent navigation uses child Reports rather than offering personal Progress, and a direct parent Progress URL gives the appropriate reports/role-switch continuation.

309/309 full tests and 2/2 focused role-entry tests pass; final production build, both typechecks and scoped lint pass. Production role-entry-verify.mjs passes adult single-workspace entry, teacher separation, original student notes/language/refresh, 320px reflow and minor exclusion. navigation-focus-verify.mjs passes keyboard search → Help/main, mobile drawer → Learn/main, role-dialog focus retention and browser-history focus under reduced-motion context. role-route-audit.mjs passes every visible primary/secondary/profile/settings/help destination for all five roles at 390px: one main heading, no page errors or document overflow. This is empty-route smoke coverage, not complete interaction/state or assistive-technology acceptance. Standard lint remains limited by the unrelated copyaudit parser error.

Evidence: scripts-tmp/navigation-focus-tests.txt, role-entry-focused.txt, navigation-focus-build.txt, navigation-focus-typecheck.txt, navigation-focus-lint.txt, navigation-focus-lint-full.txt, role-entry-browser.txt, navigation-focus-browser.txt, role-route-browser.txt, role-route-build.txt, role-route-typecheck.txt and role-route-lint.txt. Broader source integrity, native languages/device/screen-reader and full frontend gates remain open.


## 2026-10-02 — Canonical sharing, expiry integrity, activity-view export and Profile languages

Privacy now links to the canonical Connections center instead of exposing a second request/accept/revoke workflow. Existing records remain intact; the center retains scopes, approvers, lifecycle/history and actual mutation outcomes. A shared derived expiry state distinguishes unavailable metadata from expired permissions without inventing a transition or repairing bytes. Unreadable/blank/non-string dates block approval and summary/resource/organization access, including legacy readers. Explicit decline/cancel/revoke remains available for affected open records; original date fields are retained. Children shows the unavailable state without a report link or Invalid Date and allows closing before a new learner-approved request. Billing requests with invalid deadlines cannot activate a plan; this does not merge billing with learning consent.

An already-open learning activity's recovery export is now production-browser verified: visible question/options/current selection only, no assessment keys, no replacement of unreadable storage and no scored evidence. Restoring a valid saved copy and retrying restores the saved selection. Profile labels, accessible names and recovery/success messages now have Hindi/Bengali copy driven by interfaceLocale. User learning-area titles stay unchanged; teaching language remains independently scoped. Unmapped service errors retain their English fallback; no full translation claim.

316/316 full service tests and 6/6 focused connection-integrity tests pass. Final production build, both typechecks and scoped lint pass. Production browser checks pass for Privacy link/export/no permission mutation, valid request acceptance, unavailable legacy/v2 records and explicit close/date retention/refresh; parent blank-expiry report denial/close/renewal, malformed billing denial/Leave/date retention; already-open activity export/retry; Hindi/Bengali Profile draft recovery/export/name save/area duplicate/discard at 320px. Zero page errors/document overflow in these scenarios. A first parent browser run used the wrong /plans test URL; the corrected /subscription final run passes. Standard lint retains only the existing scripts-tmp/copyaudit/scan.js:84 parser error.

Evidence: scripts-tmp/connection-final-tests.txt, connection-integrity-focused.txt, connection-access-build.txt, connection-final-typecheck.txt, connection-final-lint.txt, connection-final-lint-full.txt, connection-integrity-browser.txt, parent-access-integrity-final-browser.txt, learning-view-export-browser.txt, profile-language-browser.txt. The shared expiry projection adds no storage namespace or fabricated lifecycle history. Broader curriculum/category/state/language/assistive-technology/native-device and full frontend gates remain open; no backend or founder-book request yet.


## 2026-10-02 — Structured reviewed curriculum and objective preparation

Curriculum templates can now carry explicit framework/level/subject, source provider/identifier/version, ordered chapters and source sections, stable objectives, prerequisite IDs, authored explanations, text/cube/number-line representations and review criteria. Drafts retain unfinished text; submission/approval requires complete source and teaching/criterion fields. Saving rejects duplicate identities, orphan prerequisites, cycles and invalid representations without replacing original records. Deleting an objective/chapter with incoming dependencies is blocked until the author reviews those dependencies. This is authored structure, not generated book conversion or official source certification.

Structure is pinned in revision history and explicit approved teacher deliveries. A teacher chooses one objective to create or reopen its own preparation draft. Each objective has a separate idempotent copy; later organization revisions do not replace old deliveries, prepared objectives or assignments. The snapshot has explicit reviewed status, original source section/version, representations, criteria and prerequisite titles. Submitted learners see this fixed source and criterion-gated response flow; prerequisite labels are guidance, not automatically copied readiness. Malformed delivered structures produce recoverable inbox failure without partial import or byte repair. Revoked memberships cannot import earlier deliveries.

321/321 full service tests, 5/5 structured-curriculum tests, final production build, both typechecks and scoped lint pass. Production curriculum-structure-verify.mjs passes source/chapter/two-objective/prerequisite/number-line/criterion authoring, dependency-safe deletion, refresh recovery, failed-save/export, different-author approval, fixed teacher preparation/assignment, later revision isolation and revocation at390px. structured-learner-verify.mjs passes assigned reviewed source, prerequisite/representation render, criterion-gated response, refresh and explicit ungraded submission with no mastery fabrication. Zero page errors/overflow. The mobile authoring capture was inspected; long criterion prompts use multiline fields. Early browser runs caught unstable select/textarea accessible names; explicit names fixed these and the final journey passes.

Evidence: scripts-tmp/curriculum-structure-tests.txt, curriculum-structure-focused.txt (initial4; full suite includes the fifth corrupt-delivery test), curriculum-structure-build.txt, curriculum-structure-typecheck.txt, curriculum-structure-lint.txt, curriculum-structure-browser.txt and structured-learner-browser.txt. Captures: structured-curriculum-recovery-390.png, structured-teacher-inbox-390.png, structured-teacher-recovery-390.png and structured-learner-submitted-390.png. Standard lint retains its existing unrelated copyaudit parser limitation. No new persistence namespace: structure lives in current Resource, revision and fixed-delivery records; recovery uses the existing editor store.

Remaining: authored practice-bank preparation for new reviewed objectives, learner outline publication/scoped curriculum graph continuity, wider category/source/state fixtures, remaining native-language/assistive-technology/device gates and full frontend acceptance. The book has not been processed; no backend or AGI capability sign-off.


## 2026-10-02 — Reviewed curriculum practice banks and private rehearsal

Structured objectives can include up to twenty authored exercises, two to six distinct answer options and an explicitly selected reviewed correct option. An unfinished key remains a private draft and blocks editorial submission. Author/teacher previews show the bank for review; fixed learner assignment snapshots omit keys. The private grading service resolves only the exact original delivery/objective under current assignment, enrollment, role, Work membership and source-snapshot equality. No organization-wide library or private review notes enter learner views.

Practice uses the existing private classwork study flow: hashed exact questions, saved attempts, refresh, explicit distinct retries and export without keys. Later organization drafts cannot replace delivered questions. Changed source pointers, corrupted banks, stale keys, wrong role and revocation reject before private grading/write. Response submission, grades and concept mastery remain separate. Existing sample/official practice remains on its original repository path. Reviewed-source study revisions now bind the immutable source-provenance pointer as well as assigned content; older unmatched study remains retained instead of silently migrated.

325/325 full service tests, final production build, both typechecks and touched-file lint pass. Four meaningful bank tests cover private key projection/idempotence/no grade/mastery, invalid pointers/banks without repair, fixed delivery/stale key/revocation, and unselected draft key rejection. Production author-bank browser flow passes authoring with explicit key selection, refresh/export/failed-save, different-author review, teacher objective copy and fixed assignment at390px. Production learner flow passes correct and incorrect distinct retries, refresh, key-free attempt history, source/prerequisite/representation, criterion-gated response and explicit ungraded submission. Zero page errors/document overflow. No authored exercises are invented for a missing bank.

Evidence: scripts-tmp/curriculum-practice-tests.txt, curriculum-practice-focused.txt (initial three; full suite includes unselected-key test), curriculum-practice-build.txt, curriculum-practice-typecheck.txt, curriculum-practice-lint.txt, curriculum-practice-author-browser.txt and curriculum-practice-learner-browser.txt. Captures: curriculum-practice-author-390.png, curriculum-practice-inbox-390.png, curriculum-practice-preparation-390.png and curriculum-practice-learner-submitted-390.png. Standard lint retains the documented copyaudit parser limitation. This is browser-local rehearsal, not server-protected assessment or a real-model evaluation.

Next: scoped learner curriculum-outline publication with explicit source-version continuity and no automatic mastery transfer, broader role/category/state and native-language/accessibility/device acceptance, then the full frontend gates. Founder-book rehearsal/backend stay after frontend acceptance. Full frontend/AGI capability remains open.


## 2026-10-02 — Learner assigned chapter and objective outline

Classes now offers Learning outline for the active enrolled learner. It projects only actually visible assignment source copies, grouped by declared chapter/framework/source/version/language; ordered chapter/objective metadata is pinned in new reviewed snapshots. Older snapshots retain their original fields and receive no invented chapter mapping. Original Learn/Ask/Practice links remain assignment-scoped. Filtering has a clear empty/reset path; assignments with no attached objective retain their instructions link. Malformed/duplicate source records are partial unavailable data, not repaired bytes or zero knowledge. Grades, private response text, rubric answers, explanation text and assessment keys are absent from the outline projection. Response/feedback status does not indicate mastery.

The reader checks current account/workspace/role, active enrollment and class visibility before and after read. Foreign classes, closed enrollment and wrong roles are refused. Earlier reviewed practice snapshots without newly added optional chapter metadata still resolve their exact old delivered source; no assignment is upgraded in place. Class section controls wrap at mobile widths.

329/329 full service tests, 8/8 focused outline/practice tests, final production build, both typechecks and scoped lint pass. Production assigned-outline-verify.mjs passes assigned chapter/objective display, filtered-empty reset, exact original-activity navigation, reviewed bank/retry/refresh, criterion-gated response and explicit ungraded submission at320/390px. Zero page errors/document overflow. The first link check found a whitespace-dependent accessible name; explicit link names fixed it and the final journey passes. Full-book publication remains separate: this view does not expose unassigned editorial content or imply all chapters were assigned/completed.

Evidence: scripts-tmp/assigned-outline-tests.txt, assigned-outline-focused.txt, assigned-outline-build.txt, assigned-outline-typecheck.txt, assigned-outline-lint.txt and assigned-outline-browser.txt. No new storage namespace: optional chapter/position metadata lives in existing fixed objective snapshots; outline is read-only. Current frontend acceptance, full curriculum publication/continuity, broader category/state/language/native-device and assistive-technology gates remain open. No book request, backend or AGI sign-off.
