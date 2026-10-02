# Local store inventory and future cutover

Updated 2026-09-30. This inventory describes browser records; it does not authorize deletion or implement server transfer. A namespace or sample-looking ID does not prove a record is disposable. Preserve authored work and consent history.

| Namespace | Shape / owner | Current service | Future replacement / review |
| --- | --- | --- | --- |
| `visionary_workspace_v2` | Version 2; people, active workspaces, per-workspace records, relationships. Organization resources live in the owner organization workspace; connected academic administrators share that scope. | workspaceService | Authenticated owners, workspace records, scoped resources and consent; server mapping required. Content review stores revision, source, language, author, history, approval checklist and earlier versions on the resource. |
| `visionary_content_v1` | Version 1; graphs and aliases by workspace. Representation payloads include authored number-line bounds/parts or chart series. | contentRepository | Reviewed curriculum, provenance/version/language and assets; imported graphs need validation. |
| `visionary_learning_pipeline_v1` | Version 1; units by workspace, exact progress and representation controls. | learningPipelineService | Idempotent objective, assessment, learning and representation services. Moving a visual control is not learning evidence. |
| `visionary_mentor_v1` | Version 1; owner/role-scoped evidence, events and optional memory. | mentorStateService | Permission-scoped evidence and memory services; raw personal content excluded from role summaries. |
| `visionary_artifact_editor_v1` | Version 1; workspace → artifact/tab draft; includes base content revision. Earlier artifact-only draft keys remain readable. | artifactEditorDraft | Durable draft recovery and optimistic version checks; preserve every owned draft before reconciliation. |
| `visionary_resource_editor_v1` | Version 1; workspace → resource/tab draft, including new unsaved resource keys and the original saved revision. | resourceEditorDraft | Owner-scoped editor recovery and optimistic resource revisions; exclude unsaved edits from assignments until saved and reviewed. |
| `visionary_resource_editor_tab` | **sessionStorage** tab identifier for resource editor backups. | resourceEditorDraft | Browser session state; never server ownership or a shared identity. |
| `visionary_project_editor_tab` | **sessionStorage** tab identifier; draft key suffix `:tab:<id>`. | artifactEditorDraft | Browser session state; never an authenticated owner identifier. |
| `visionary_review_drafts_v1:<scope>` | Classroom/attempt-scoped teacher review drafts. | reviewDraftService | Durable review drafts plus server classroom/attempt authorization. |
| `visionary_stage_transitions_v1` | Versioned per-person transition records. | stageTransitionService | Authorized transitions, objective mappings, bridge plans and committed audience events. |
| `visionary_daily_deferrals_v1` | Local daily-plan deferrals. | dailyPlanService | Owned planning preferences with dates preserved. |
| `visionary_community_v1` | Local community records. | communityService | Authorized moderation and audience services; feature gates retained. |
| `visionary_organization_billing_v1` | Array; organization email scope, requester, seat count, purpose, status and dated owner acknowledgment. | organizationBillingService | Verified organization ownership and seat-request workflow. No payment, invoice or access activation exists. |
| `visionary_entity_OrganizationInvite` | Array; organization, role, membership state, expiry, explicit admin capability, dated actor events and read acknowledgments. | workspaceService / previewPermissions | Server membership and least privilege, renewable consent and audit. Unknown capabilities fail closed; imported actor history is not invented. |
| `visionary_entity_<name>` | Legacy entity arrays; ownership varies by entity. Classroom, Enrollment, Assignment, Submission, OrganizationCurriculum and connection records need explicit scope reconciliation. | appClient / classroomService / legacyConnections | Entity-specific owner, membership, immutable lesson version and attempt policy; a prefix is not a retirement manifest. |
| `visionary_users`, `visionary_sessions`, `visionary_session_token`, `visionary_pending_registration`, `visionary_reset_tokens`, `visionary_session` | Local preview authentication; no server credential authority. | appClient | Real authentication; prevent any mock/live identity or credential mixing. |
| `visionary_connected_demo_v1` | Connected-fixture seed marker. Connected entity seeds use deterministic `demo-*` IDs and `demo:true`; user-created records may share their stores. | demoFixtures | Fixture-only retirement after exact ID/provenance review and recovery preview. Never wipe the whole store. |

The Privacy inspector counts only core workspace/content/learning/mentor records. Presence of separately owned editor, stage, plan, community, review-draft or seat-request stores now blocks automatic mapping and discloses the excluded record types. Full record-by-record reconciliation and authenticated target ownership remain pending. Legacy entity arrays and preview credentials also require the later explicit cutover manifest; this table is not a complete transfer implementation.

Approved organization content delivery is stored on `Resource.contentReview.deliveries`: an explicit fixed title/body/source/language/revision copy, accepted teacher membership ID, recipient, actor and time. The teacher sees only deliveries matching their current Work membership. A renewed membership does not revive an old inbox delivery. Import creates an idempotent teacher-owned draft with immutable `sourceSnapshot`; classroom assignment copies that provenance into `source_provenance`. Later organization and teacher edits do not rewrite the delivered or assigned copy. Already imported preparation remains an owned Work record under the local retention rules; revocation closes Work access.

Authored sample content now declares source version **2** for the added representation payloads. Earlier saved projects retain their original rubric source version; this does not establish real-book coverage or independent content approval.

Sequence: finish internal frontend acceptance → founder-supplied sample book rehearsal through local adapters → connected category acceptance → backend/API/database/model. Do not discard local originals or claim server synchronization before that cutover.

Organization authoring also uses the resource editor store: a new-content key or resource ID under the author/reviewer workspace and tab, plus private review note/checklist fields. These backups are excluded from deliveries and learner evidence. The saved content revision remains authoritative for review actions.

Classwork recovery namespace: `visionary_classwork_drafts_v1:<personId>` contains assignment-keyed text/answers, revision-attempt metadata and optional `playerStage` (understand/respond/review). Classes and the classroom Learn player use the same validated draft service. Unreadable originals remain intact; current edits and saved backups can be explicitly exported. Updates re-read the latest map, alter only the current assignment and compare its expected saved revision before saving or clearing. A stale screen retains its current edits and offers an explicit discard/load action. Unrelated assignment drafts remain intact. Migration inspection flags the signed-in person's store for separate ownership review; it excludes response text from its summary. Future replacement requires authenticated learner/workspace/assignment ownership and attempt-aware draft recovery. The saved stage is navigation state, never learning evidence.

Entity arrays now reject malformed JSON/non-record entries before reads or writes. Submission creation enforces one local record per class/assignment/learner; identical replay returns the saved record, conflicting copies and bulk duplicates are rejected. A submitted project is an explicit fixed text response with criteria provenance; private artifact records remain in the workspace store and are not transferred wholesale. Server atomic uniqueness and optimistic attempt versions remain future work.

Assignment records also contain browser-local publish_at and state_history (from, to, actor, at). Future schedules use a shared read/write availability rule; exact server-clock publication, durable notifications and concurrency remain API responsibilities. Organization classwork audit projects only IDs/action metadata from organization-owned classes, never assignment instructions or submissions.

2026-10-01 objective attachment: teacher `Resource.objectiveSnapshot` stores a validated concept ID/title, sample/official status, selection, actual source/version/language, explanation and whitelisted representation descriptors. It contains no check/practice answer keys, private learning history or learner evidence. Source choices use the teacher's scoped content repository; this introduces no new namespace. The resource editor backup retains an unfinished attachment across refresh. Attaching/removing returns the UI lesson to draft; resource conflict detection includes the objective payload. Older editor revision tokens may require the existing latest-version review/recovery action; originals are retained.

Assignment `objective_snapshot` is a fixed copy of the reviewed teacher resource. `source_revision` identifies the assigned payload only; private audience/member/cohort metadata is excluded. Same-clock changed payloads cannot silently replay an earlier assigned copy. Existing assignments without an objective stay usable with an explicit unavailable-representation explanation. Classwork drafts optionally include `objectiveRevision` and bounded `objectiveView` mode/size/rotation/point; controls restore only against the same assigned objective. Submitting clears only the expected current draft. These controls and navigation never create learning evidence. Malformed objective or visual records are refused without replacing saved bytes.


## 2026-10-01 — Assignment study and criterion reviews

`visionary_classwork_study_v1:<personId>` holds workspace/assignment-scoped private question drafts, source revisions and authored rehearsal position/round/attempts. Saved attempts contain public question copies, question fingerprints and local correctness, never assessment keys. Study data is excluded from submissions, teacher review, analytics and learning mastery. Reads recheck active enrollment/workspace and source; malformed bytes are preserved for explicit export. Optimistic saves compare the assignment record while preserving other assignments. Migration inspection flags this namespace for separate ownership reconciliation.

Classwork drafts now optionally hold criterion `selfReview` notes. Submitted `self_review` is explicitly included in the classroom copy. Teacher `criterion_feedback` maps assigned criterion IDs to met/needs-work/not-assessed plus a bounded note. Review drafts retain unfinished criterion selections/notes per submission attempt in the existing teacher review namespace. A new learner attempt clears current teacher feedback and retains prior feedback/self-review in revision history. These records establish neither independent mastery nor model evaluation.


Teacher review drafts optionally carry the loaded `reviewRevision`. The current review UI checks this token against the saved submission before returning and retains stale edits for explicit export/load-latest recovery, including after refresh. Backend review writes must make revision checks mandatory and atomic; direct preview entity writes are not server security or a transaction.


2026-10-01 stage continuity adds no namespace. It reads the existing stage/profile, learning, review and classwork stores within the current personal workspace. Source outline, steps and due dates stay unchanged; its explicit pending-mapping status is not evidence or a migrated curriculum. Stage notice mutations now compare the current profile/latest effective notice and refuse stale writes. Unreadable retained evidence blocks the profile swap.


2026-10-01: existing content graphs optionally retain `continuityMappings` with exact from selection/provenance/concept, equivalent target or archive disposition, reason and review metadata. New pipeline units optionally retain `sourceContext` (selection plus provenance); original units are never guessed/backfilled. Bridge guidance uses current owned cached graphs, has no new namespace and creates no learning outcome. Explicitly starting a sourced objective creates/reuses a compatible source-version activity. Older-source work remains separate and recoverable. Migration must retain these source versions/review declarations and independently authenticate their authority.

## 2026-10-01 — Stage editor drafts and trigger metadata

`visionary_stage_editor_v1:<workspaceId>` stores version 1, personId, original clean profile revision and bounded stage field strings. Only a current personal student/professional workspace can read/write it. Optimistic draft revisions reject stale saves/clears; malformed original bytes are retained for explicit export. It is private recovery data, excluded from learning evidence, parent reports, teacher submissions and organization analytics. The migration inspector flags it for separate ownership review; no automatic migration occurs.

Stage profiles now optionally retain institution. Stage records optionally retain trigger, stable eventId, actor and boundaryReasons, plus suggested/superseded states. Existing legacy notices remain usable without invented actor/trigger values. Accepted suggestions retain their history; ageBand and consent are separate and unchanged.

## 2026-10-01 — Itemized auxiliary ownership review

Privacy now inventories supporting records separately from core workspace counts: project/resource backups, response and review drafts, private classroom study, stage history/editor drafts, deferrals, community authorship and seat-request authorship. It classifies personal, connected and unresolved record counts with an unreadable marker. Known foreign account scopes are excluded, and empty validated stores no longer block merely by existing. Multiple matching review-key workspace prefixes remain unresolved rather than guessed. Supporting-record ownership is not full schema/source/permission approval; any nonempty or unreadable supporting store continues to block mapping.

The review spans this person's owned roles, including stage drafts outside the active workspace. Unreadable originals remain untouched. Counts-only export re-inspects current records and excludes private question, answer, feedback and editor text. Changes in another tab invalidate the displayed preview and require a fresh review; errors remove stale counts. No record is transferred, merged, deleted or automatically repaired. Core export and entity/auth retirement remain separate future gates.

Focused ownership regression: 13/13 pass. Final full-suite, build, typecheck, lint and production mobile evidence follow after completion. Broader auxiliary schema reconciliation and independent/server ownership verification remain open, along with the role/shared/frontend completion ledger. Preserve landing exclusion and founder-book-before-backend order.

Auxiliary classification correction: legacy response draft keys identify a person but omit workspace identity. Their counts are unresolved pending assignment/classroom reconciliation; they are not automatically classified as personal work. Counts-only reports remain read-only and do not approve schema/source integrity or transfer. Later server migration must resolve these exact assignment, enrollment and Work/personal scopes under current authorization.


2026-10-02 organization configuration: optional versioned organizationSettings lives in the organization owner's visionary_workspace_v2 WorkspaceData alongside its audit. It does not introduce a new namespace. Organization-settings draft recovery uses visionary_resource_editor_v1 with a new:organization-settings key scoped to the owned workspace/tab, already included in supporting ownership counts. This is not schema/migration approval.


2026-10-02 reviewed curriculum uses Resource.kind=curriculum in the existing owner workspace. New curriculum recovery uses new:organization-curriculum in the existing resource-editor store; new lesson recovery retains new:organization-content. No new namespace. Earlier visionary_entity_OrganizationCurriculum records remain unchanged/read-only; preparing a template copies selected notes, without approval, ownership migration or removal.


2026-10-02 Progress adds no namespace or persistence. It reads existing owned mentor evidence, pipeline source metadata and earlier workspace sessions. Interface language drives navigation/search/account/Progress labels; source titles retain content locale. The report neither migrates evidence across sources nor writes on review.


2026-10-02 Profile editor uses new:account-profile in the existing workspace/tab-scoped resource-editor store. title holds the unsaved display name, body the unfinished learning area and baseRevision the originally loaded account name. It is private recovery, not a saved profile, a new area, learning evidence or a transfer approval.


2026-10-02 connection integrity: derived unavailable/expired states are read-only, add no namespace and do not rewrite imported dates. Explicit lifecycle closures retain original expiry fields. Profile translations and activity-view downloads add no persistence. Existing source ownership/schema/migration gates remain open.


2026-10-02 structured curriculum: optional CurriculumTemplate is stored within existing versioned Resource, earlier-version and approved-delivery snapshots in visionary_workspace_v2. It includes source selection/provenance, chapters/objectives/prerequisites/representations/criteria. Teacher copies retain only the chosen objective snapshot plus immutable delivery/objective identity. No new namespace or automatic graph migration/publication. Existing per-workspace/tab editor backups now retain the optional structure.


2026-10-02 curriculum banks: optional practice questions/keys are kept only in existing organization template/revision/fixed-delivery records. Learner assignment objective snapshots omit keys; private rehearsal uses existing visionary_classwork_study_v1:<personId>, scoped again by workspace/assignment. Public question/attempt projections include no keys. No new namespace or automatic evidence/source migration.


2026-10-02 assigned outline: optional sourceChapter and objectivePosition live in existing assigned objective snapshots. The reader stores nothing and exposes only authorized assignment/source headings, status and original links. Older copies retain their original metadata; their practice lookup ignores only absent new optional labels while comparing the original pinned source.

2026-10-02 class publication: optional curriculum_publications lives on the existing visionary_entity_Classroom record. Each class-owned fixed copy records delivery/resource/editorial revision, source/language, ordered learner-safe objective snapshots, publication time and reviewed availability history. No keys, banks, editorial notes, learner answers or new evidence are included. Invited and organization-summary readers receive no body; learner entity/service reads exclude withdrawn copies. Existing assignments keep their original snapshots. URL parameters retain selected copy/objective; interactive exploration is transient. No new namespace or automatic migration is introduced. Future cutover must resolve authenticated teacher/class ownership, enrollment, current Work membership, source authority and every retained version/lifecycle event.
