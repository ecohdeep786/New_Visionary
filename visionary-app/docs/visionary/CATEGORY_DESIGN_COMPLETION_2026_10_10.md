# D-055 — Category and subcategory design continuation

Screen job: help each person find their next task, open it, and retain their place.

This applies the founder's reduction-first brief to the existing internal frontend. Apple and Google are references for clarity and craft, not an assertion of product parity. Public landing pages, authentication, backend implementation and source ingestion remain outside this pass. D-052 through D-054 and their uncommitted changes are retained.

## A — Diagnosis

The connected category flows already exist. Their visual grammar drifted: 18–24px panel radii, several heading weights, colored class banners, repeated create controls, bordered white inputs and explanatory opening paragraphs. Catalogue hierarchy was explicit but every level competed vertically, pushing the actual chapter action below the initial desktop view. Course and examination learners also encountered school-only labels in optional catalogue context editing.

## B — Old → new by screen family

| Screens | Old | New and retained behavior |
| --- | --- | --- |
| Shared internal pages, SH-01–13 | Variable spacing, heavier headings, numerous panel treatments | Centered 1040px page, 40/400 desktop title, 12px panels, quiet filled fields, sparse neutral icons. Visible focus, role navigation, error recovery, permission/consent and local-preview notices remain. |
| Learn/Practice, ST-02/07 and PR-02 | Opening instructional paragraphs on every return | Optional introductory guidance becomes a native About disclosure. Foundational Learn retains its short visible “Pick a subject, then choose a book” instruction. Questions, authored teaching and feedback remain readable. |
| Subjects → books → chapters, ST-02/03 | Persistent subject shelf, decorative artwork in a populated outline, large gaps between every hierarchy level | A selected book folds subject switching into Change subject; the hierarchy has a 24px internal rhythm. No decorative outline illustration. Book titles and chapter rows scan on one line while full text remains in the DOM/accessibility name. Book-scoped chapters and exact return parameters are preserved. |
| School/course/exam/vocational/independent context | Optional editor always asked for board/class | School retains board/class; higher education uses institution/course and year/level; examination uses exam/preparation level; vocational and independent use course/goal and level; professional retains goal/industry. Protocol keys and repository adapters remain unchanged. |
| Learner Classes, ST-10 | Duplicate join actions and saturated card banners | One main empty-state join action; populated class destinations use neutral cards, one context line and assignment metadata. Invitations, join authorization, classwork drafts, feedback, curriculum and private study links retain their handlers. |
| Teacher Classes, TE-03 | Duplicate create actions, multi-paragraph first use, colorful class banners | One main first-class action, product illustration and optional guidance; populated cards use class name, section/room and actual student count. Full names remain available in the accessible link and classroom heading. Creation modal scope and draft recovery are retained. |
| Teacher Learners, TE-05 | Multiline roster descriptions and colored evidence pills | Single-line roster names/context with quiet right-aligned evidence metadata. Opening a learner still reveals the full submitted work and feedback; privacy exclusions remain visible. |
| Prepare/Growth/Library, TE-02/07/08 | Always-visible explanatory introductions and duplicate first-use create controls | About guidance, consistent fields and one first-use primary create control. Existing resource drafts, source preview, approval/import boundaries, archive and recovery are retained. |
| Build/Progress/Career, ST-08/09 and PR-02/03 | Heavier headings and different panels across the same loop | Shared title, fields, panels and introductory disclosure; exact project, saved unit, evidence and source links remain. D-052 evidence disclosures and D-054 plan feedback are preserved. |
| Parent Children/Reports, PA-02/03 | Separate page treatment | Shared page rhythm/panel grammar, with existing child/period controls and D-052 section disclosures. Sharing scope, unavailable reports, expiry and private exclusions stay visible. |
| Organization People/Cohorts/Content/Curriculum/Insights/Audit/Settings, OR-02–08 | Another set of page/card treatments | Shared heading, spacing, filled fields and 12px panels. Source/version reviews, publication limits, membership permissions, billing boundaries and audit facts remain visible and functional. |
| Home in every role, ST/TE/PA/PR/OR-01 | Already reduced in D-054 | Preserved: one next task, details, localized plan rows and bottom snackbar. New page-spacing rules deliberately exclude Home. |
| Previous saved topics, interactive lab and practice | Separate page widths, padding and rounded surfaces; repeated journey objective prose | Same page/title/panel grammar as current workspaces. Journey objectives remain inside the existing Why this disclosure. Original topic IDs, lab save, lesson return and current-versus-previous assessment boundaries remain. |

## C — Concrete specification

- Desktop page: 1040px maximum including padding; 48px top, 40px sides, 80px bottom; 64px between major sections above 1200px viewport, 48px otherwise. Catalogue hierarchy uses 24px internally rather than treating every breadcrumb as a major section.
- Phone: 32px top, 20px sides, 56px bottom; 40px major gaps. Existing bottom navigation and safe-area handling remain. Guide's embedded activity pane retains its own 24px rhythm.
- Type: page title 28–40px/400/1.25; row title 16px/500; class destination 18px/500; metadata 12px; controls 14px/500. Hindi/Bengali title line height and existing foundational large targets remain.
- Surfaces: white canvas, neutral `#f5f6f8` filled controls, `#dfe2e7` control borders; panels 12px, fields 10px, primary buttons pills. No button/card elevation; overlay shadows remain.
- Interaction: existing 44px minimum targets, foundational 52px controls, keyboard-openable native disclosures and visible focus. Existing reduced-motion rule disables transition/animation. No automatic audio or new motion.
- Art: existing Visionary spot art in empty states; no generated replacement, no Apple/Google brand assets, no illustration added to a populated catalogue. Subject/book/concept symbols convey object or representation type.
- Data: no fake official book coverage, invented scores, mastery or classroom enrollment. These changes keep the existing service contracts, source checks and current-workspace scoping.

## Complete supported-context mapping

| Category and subcategories | Design template and context behavior |
| --- | --- |
| School students: 1–5, 6–8, 9–10, 11–12 | Shared catalogue/lesson loop; foundational keeps simpler navigation, larger targets and visible one-sentence instruction. Board/class stays tied to selected source; later tiers retain their stage presentation. |
| Higher education: college/university/autonomous/diploma | Same book/chapter/concept hierarchy with course/institution/year labels. No implication that thesis/research administration or every degree's content is implemented. |
| Competitive examination | Exam/preparation labels; actual authored/sourced or unavailable content. School level can remain concurrent without changing exam source identity. |
| Vocational and existing independent learners | Course/goal/level context; same saved Teach → Ask → check → Practice → Build connections. Vocational remains an existing stage-editor context, not a new onboarding choice. |
| Teacher: school, higher-education faculty, university, coaching, independent | Shared Prepare → Classes → assignment/review → Learners/Insights grammar. Onboarding context remains role-specific; a typed institution does not grant membership. |
| Parent: mother, father, guardian | Same accepted sharing/child selection/report flow. Relationship label never changes permission. |
| Professional: personal/job seeker, organization-connected employee | Capability/goal language and portfolio loop. Personal and Work context remain distinct; sharing requires the existing explicit action. |
| Organization: school, college, university, coaching, training, company scenario | Shared authorized People/Cohorts/Content/Curriculum/Insights/Audit grammar. Owner/admin/academic/analyst/billing capability filters remain; title or organization type grants no extra access. |

CBSE/CISCE/IB/Cambridge/State, degree names and exam targets are contextual choices within these templates. This pass does not manufacture catalogs for unavailable choices. Category-specific differences belong in context, task and permission, rather than a disconnected visual system for each label.

## D — Qualitative design self-review

Scores are designer assessments after revision, not a human study or measured quiet-space percentage. Order: glance, paragraph reduction, rows, whitespace, functional color, icon/art usefulness, earns its place. Each row meets the brief's minimum four.

| Screen family | Scores / 5 | Rationale |
| --- | --- | --- |
| Catalogue/book/chapter | 4, 4, 5, 4, 5, 4, 4 | Hierarchy and Continue are visible together on desktop; source caveats stay visible. Mobile intentionally scrolls through the hierarchy. |
| Learner/teacher Classes | 5, 5, 5, 5, 5, 4, 5 | One main first-use task; neutral named destinations and real metadata. Persistent topbar shortcuts remain available. |
| Teacher preparation/growth/library | 4, 4, 4, 4, 5, 4, 4 | Supporting intro is optional; organization delivery/source constraints remain readable. |
| Teacher roster/insights | 4, 4, 5, 4, 5, 4, 4 | Compact roster; full evidence opens in its existing detail view. Privacy exclusions are intentionally retained. |
| Learning/Ask/Practice/Build/Progress | 4, 4, 4, 4, 4, 5, 4 | Model, saved activity and project remain connected. Actual teaching/response/rubric content is not treated as decorative prose. |
| Parent reports/connections | 4, 4, 4, 4, 4, 4, 4 | Child/period and permitted evidence are clear; consent and scope are visible. |
| Organization and shared controls | 4, 4, 4, 4, 4, 4, 4 | One visual grammar; consequential source, approval, permission and billing text remains visible. |

## Verification and phase status

The retained regression suite passes 491/491. Final lint, both type configurations and production build pass (3m29s; `index-BBfWaQOr.js`). Browser evidence retains 56 screenshots, including nine captures of this final build; 28 captures have accompanying DOM metadata. Hindi/Bengali About disclosures open with Enter on the measured 321px phone viewport. A UI-created previous cube topic opens by its exact ID and returns to the separate current/previous practice entry. Final chapter selection preserves both book and chapter IDs, with Continue visible on desktop. No review-tab browser errors were recorded. Logs and limitations are indexed in [the evidence folder](baseline/category-design-2026-10-10/README.md).

This is an implementation/design pass across every supported category template, not a claim that every populated/failure/language/permission combination received new manual acceptance. Earlier connected rehearsals remain in D-050–054; their evidence is not silently upgraded. Changes are in this managed worktree; the original `:5173` checkout was not copied over or restarted. Its Home was reopened in a fresh tab after a temporary review-server connection error; the old errored tab could not be restored through the browser API. Review fixtures remain isolated on `:5176`, English is restored, viewport override is reset and the owned review preview is stopped.

The wider [category acceptance ledger](CATEGORY_FLOW_ACCEPTANCE_2026_10_09.md) still distinguishes implemented frontend behavior from physical-device, assistive-technology, representative-user and owner acceptance. Official chapter ingestion, backend identity/database, cloud synchronization and model quality remain later phases. Frontend design is implemented locally; those external gates cannot be certified from screenshots.
