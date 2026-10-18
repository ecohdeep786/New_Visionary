# D-056 — Cross-platform product design and frontend specification

2026-10-11. Extends D-050–055; preserves their implementations and evidence. Status terms: **implemented** means current React/Vite code; **specified** means the adapter/acceptance contract, not a shipped native app. This repository contains a web frontend with browser-local services. Assumptions: web is the current delivery platform; native Android/iOS/macOS clients come later; real curriculum supplies chapter/page metadata and licensed covers. The supplied scanned book is a content example, not an official imported catalogue.

## 1. Executive Summary

Visionary should make education feel manageable: see the right object, choose one useful action and return without losing work. The shared product family uses quiet surfaces, clear type, blue for action, semantic status and a single task hierarchy. Student, teacher, parent, professional and organization workspaces share this grammar while retaining different tasks and permissions. Google/Apple are craft references; equivalence, accessibility certification and AGI are not demonstrated by appearance.

Implemented in this pass: fresh Learn book catalogue; explicit single-book selection; subject/course grouping; title search, progress filter and title sort; exact source-version chapter completion; named book-reader return; partial-source retry; static skeletons; offline notice; System/Light/Dark workspace setting; scalable platform-font tokens; stronger field/focus contrast; reduced-motion/transparency/forced-color rules. These are frontend changes, not new backend identity, curriculum ingestion, model inference or synchronization.

## 2. Design Philosophy

1. Name the object before the action: course context, book, chapter, lesson.
2. Give each screen one main task; supporting explanation is available on demand.
3. Preserve work, source and location; recovering is easier than recreating.
4. Let content lead. Decoration, sound and motion must explain something.
5. Use honest evidence: started activity, completed chapter and assessed mastery are different.
6. Make the safe path obvious; scope and consequential permission remain visible.
7. Adapt to platform, input and accessibility preference rather than detecting a browser brand.
8. Prove quality with tasks and observable states, not self-awarded parity.

## 3. Role-Based Review

| Specialty | Finding | Decision / implementation |
| --- | --- | --- |
| Typography | Proprietary-first font stacks and pixel overrides reduce portability | System UI resolves to SF on Apple, Segoe on Windows and platform defaults on Android; optional native Roboto Flex uses Material roles. Rem-based new titles/fields, 400 headings, 500 labels, 1.65 body and 1.8 reading leading. Hindi/Bengali retain appropriate script fallbacks. Native Dynamic Type is specified, not simulated by web zoom. |
| Visual | Calm light layout, but incomplete semantic and dark surface roles | Central token stylesheet and JSON define surface/container/text/outline/action/error/success/warning/focus; explicit theme selector. Border signals controls; color is never the only state cue. Existing Visionary art remains for first use; unavailable book covers use a readable neutral book symbol. |
| Interaction | Single-book auto-selection skipped a required decision | Remove implicit selection. Fresh Learn renders book groups; book link renders contents; chapter renders its concept list; explicit concept selection opens reader. Search, filters and return context have bounded workspace-scoped memory. |
| Motion | Existing fade and scattered durations lack a common contract | 120/160/180/220ms semantic timings; subtle route opacity, immediate pressed/selected state. No bouncing, parallax or mandatory celebration. Reduced motion disables transitions, animations and smooth scrolling. |
| Sound/haptics | More feedback would compete with study and assistive speech | Web interactions are silent by default. Existing voice remains opt-in. Native feedback is specified only for answer/completion or a consequential invalid action; no fabricated native vibration in browser. |
| Human interface engineering | Catalogue needed partial errors, loading geometry and query navigation focus | Four concurrent subject reads, cancellation/access recheck, retained readable books, retry, labelled static skeleton, route-query main focus, existing scoped scroll restoration and offline notice. No answer/learning unit is created by browsing. |
| Google/Apple audit | A collection of visual similarities is insufficient | Apply semantic type/color, content deference, platform target sizes, system preferences and reversible navigation. Treat native feel, screen-reader behavior, actual devices and representative-user performance as release gates. |

## 4. Material Design 3 Alignment

Web uses Material-informed semantic roles, scalable type categories, labelled fields, focus/hover/pressed/selected states, rail/sidebar at wider widths and bottom navigation on phone. Shape varies by function rather than random radius: field10, panel12, sheet24, action pill. Elevation is reserved for overlays; main surfaces use tonal separation. Android native adapter will map the same semantics to Material components, 48dp targets, system Back and optional dynamic color with brand fallback. Dynamic device palettes are **specified**, not invented in the web implementation. Reference: [official Material theming codelab](https://developer.android.com/codelabs/m3-design-theming), [Material typography roles](https://m3.material.io/styles/typography/applying-type).

## 5. Apple HIG Alignment

Content deference means readable lesson content, named back destination, restrained state feedback and familiar sheets/popovers. Web uses Apple system fonts through system-ui on supported platforms, safe-area-aware bottom navigation and browser text sizing. Native Apple adapter uses SF text styles/Dynamic Type, 44pt controls, navigation stack, native sheets and OS accessibility settings; it must expand rows at accessibility text sizes. Blur is optional decoration with an opaque alternative, not a source of legibility. Native back-swipe may complement a visible back action, never replace it. Reference: [Apple HIG foundations](https://developer.apple.com/design/human-interface-guidelines/foundations), [Apple Dynamic Type guidance](https://developer.apple.com/videos/play/wwdc2024/10074/).

## 6. Learn Section Information Architecture

Canonical hierarchy: **learning context / course type → subject group → book → chapter/page collection → lesson reader → Understand / Ask / Check / Practice / Build → recorded progress / review**.

Fresh /dashboard/learn is the book catalogue. Onboarding provides stage, board/institution/exam, level and subjects. The catalogue asks the existing repository for these subjects and books; it does not manufacture official subject coverage. A provisional outline is clearly Content pending. Course/subject metadata is visible on each card. Page counts and estimated times remain absent until real metadata exists; current objects are chapters, so the UI says chapters.

Book contents and reader use the existing query routing and exact IDs. book + catalogueSubject/Board/Level identify contents; chapter identifies the collection; unit identifies saved lesson activity. An explicit source-bound Home/assignment/bridge resume may open known work directly; this is deliberate resume, not a fresh catalogue visit. Unknown/foreign book and chapter/source conflicts retain recovery controls.

| Category / supported variants | Main navigation and interconnection |
| --- | --- |
| Student: school1–5/6–8/9–10/11–12; higher education; exam; vocational; independent | Home, Learn, Ask, Practice, Build; Classes, Connections, Progress. Foundational prioritizes Home/Learn/Ask and keeps large targets. Institution/year, exam/preparation and course/goal context replace school-only labels. Assignments and private exploration remain separate. |
| Teacher: school/faculty/university/coaching/independent | Home, Prepare, Classes, Learners, Insights; Growth, Library, Connections. Prepare objectives lead to explicit class assignment/review; learner submitted evidence opens from roster. |
| Parent: mother/father/guardian | Home, Children, Reports, Connections; notifications and shared settings. Selected child and accepted sharing determine evidence, not relationship wording or family billing. |
| Professional: personal/job seeker; work-connected employee | Home, Career, Learn, Practice, Build, Progress; Connections. Capability books lead to applied practice and private portfolio; work delivery/share is explicit. |
| Organization: school/college/university/coaching/training/company scenarios | Home, People, Cohorts, Content, Curriculum, Insights, Audit, Settings, Billing. Owner/admin/academic/analyst/billing capabilities filter navigation and actions. Typed organization names grant no permission. |

Shared: scoped workspace switch, saved-work search, Profile, Personalization, Privacy, Plans and Support. Teacher/parent/organization use the same typography/theme/target/motion/state rules, without pretending their tasks are student lessons. Board names, degrees and exam targets are contexts within these templates, not proof of catalogue breadth or university administrative completeness.

## 7. Learn Section User Flow

1. Tap Learn: show Your books and current course context; **zero chapters/readers**.
2. Browse a subject/course group or search a book title; optional progress filter/sort.
3. Select a book: heading becomes the book title; show exact source/course and its chapter list.
4. Select a chapter/page: show its ordered lessons and actual saved state. No implicit answer or completion.
5. Select lesson: open its saved reader/model, language, stages and source caveat.
6. Ask preserves the exact unit; Check/Practice/Build use the same source and saved activity contracts.
7. Back to book names that book and returns to the selected chapter. All books returns to the matching catalogue context. Filter/sort and in-shell scroll memory persist within the workspace.
8. Home or browser/system Back remains available. Reload resolves stored IDs and source availability; stale/removed content shows recovery, never silently retargets another book.

Book browsing is not assessment. Chapter completion requires all actual concepts completed on this version, in private learning; empty chapters and class attempts are excluded. No mastery percentage is inferred.

## 8. Screen Specifications

| Screen / primary action | Layout and hierarchy | Important states / accessibility |
| --- | --- | --- |
| Student Home / Continue | Single next task, quiet daily rows, disclosed context | First use one illustration/action; real saved-work unavailable notice; complete/unstarted differ; named row overflow and focus return. |
| Book catalogue / Open book | Title → course context → search/filter/sort → labelled subject groups → cover/title/course/count/progress cards | Static card skeleton, first-use authored sample, no-match Clear filters, partial/full error Retry books, offline shell notice, textual completion. Full card is a link; cover symbol is decorative. |
| Book contents / Choose chapter | Exact book h1; visible context/source; All books; ordered numbered chapters; selected chapter lesson path | No automatic book selection. Invalid parent/source keeps explicit recovery. Rows have full accessible names, selected state and 44/48px targets. |
| Chapter lessons / Open lesson | Chapter title; started count distinct from mastery; ordered concepts; one next available action | Empty chapter clearly unavailable; completed and current saved activity differ; prerequisite path remains reachable. |
| Reader / Understand | Named book return; lesson title, source/language, stage navigation; reading/model/check area; contextual Ask | Saved restore skeleton; unavailable teaching/source conflict/retry/export; offline local state; completion stays source-bound. Model has sliders and a text alternative. Reading measure 65–70ch; no fixed body height. |
| Practice / Resume due review | Due/available rows followed by selected practice activity | Empty suggests Learn, not weakness. Authored/previous practice explicitly separated; answer errors remain visible; status announcement follows feedback. |
| Build / Open or save project | Named project destinations; editor and scoped preview; rubric/details | Unfinished recovery, changed record/source, save failure and completion retain work. Destructive or sharing actions name their scope. |
| Progress/Career / Review evidence or set goal | Quiet evidence metrics, period/context, detailed history disclosure; career direction form | No-data differs from unreadable source. Real dates/status and fixed-copy caveats remain; no inferred job/ability outcome. |
| Teacher Prepare/Growth/Library / Create or edit | Clear resource list/editor; About disclosure; one main first-use action | Existing editor backup/conflict/source-preview/archive recovery; visible approval/import boundaries. |
| Teacher/Student Classes / Create, join or open exact class | Neutral named class cards, context and actual counts; tabs inside class | One empty primary; long name visible in detail/accessibility; join/access error and draft recovery remain. |
| Teacher Learners/Insights / Open submitted evidence | Compact roster and divided actual metrics; full detail opens deliberately | Private work excluded; missing evidence not zero ability; labelled detail dialog and close focus. |
| Parent Children/Reports/Connections / Select child and report | Child/period controls precede evidence summaries and expandable details | Accepted scope, revocation/expiry, no evidence/read failure and retry are visible. Never expose private doubts/drafts. |
| Organization People/Cohorts/Content/Curriculum / Authorized management | Named list, exact selected record, authoring/review panel; clear fixed-version provenance | Membership access, source approval, publication/withdrawal, conflict, aggregate suppression and billing limits remain explicit. |
| Organization Insights/Audit/Settings/Billing / Review or configure permitted action | Period metrics, dated audit rows, scoped settings forms | Capability-filtered navigation; unavailable service differs from absence; no payment processing is represented as complete. |
| Shared Search/Personalization/Privacy/Plans/Support | Scoped exact-work search, labelled preferences, permission inventory, honest local-preview plans | Esc closes overlay and restores focus; theme is System/Light/Dark per workspace; preferences/save failures are visible; voice never auto-starts. |

All families share default/loading/empty/error/offline/completed vocabulary. Existing recovery is preserved; new offline notice signals browser connectivity only. Browser-local data may remain readable offline, but uncached app code, media, remote curriculum and voice are not guaranteed. No service-worker offline-complete claim.

Platform adaptation: web keeps links, browser Back, keyboard, pointer hover and native selects; Android uses app bar/back/rail/navigation bar and Material sheets; iOS uses navigation stack/tab bar/sheets and system menus. Tablet uses wider split view only when both columns remain usable at current text size. Native components are specified adapters, not imported UI imitations.

## 9. Design Tokens

Source of truth: [machine-readable token contract](DESIGN_TOKENS_2026_10_11.json); implemented web stylesheet: src/components/dashboard/workspace-tokens.css.

| Semantic role | Light | Dark |
| --- | --- | --- |
| primary / on-primary | #0b57d2 / #ffffff | #a8c7fa / #062e6f |
| secondary / tertiary | #52627c / #66558f | #b8c7e3 / #d1bcf3 |
| surface / container | #ffffff / #f0f2f6 | #181c22 / #242a33 |
| on-surface / variant | #1d1d1f / #60646c | #edf0f5 / #b7bfcc |
| outline / outline-variant | #747982 / #dfe2e7 | #8993a3 / #46505f |
| error / container | #b3261e / #fce8e6 | #ffb4ab / #4b211f |
| success / container | #146c2e / #e6f4ea | #8bda9e / #183c26 |
| warning / container | #805200 / #fff1cc | #f2c66b / #3d3017 |
| focus | #0b57d2 | #a8c7fa |

Twenty semantic pair calculations meet the intended4.5:1 text /3:1 control-focus thresholds; [ratios](baseline/cross-platform-2026-10-11/contrast.json) audit these pairs, not every rendered pixel. Outline-variant divides content; stronger outline is used for field affordance. Correctness also has text/icon, never color alone. Dynamic Android palettes must revalidate all roles before use.

Type roles: display48/400/1.15 (rare); headline28–40/400/1.25; title24/500/1.4; body16/400/1.65; reading17/400/1.8; label14/500/1.5; caption12/400/1.7; code15/400/1.65 with ui-monospace/SFMono/Consolas. Interface families use platform defaults; script text uses local script fallbacks. Values are product choices, not literal copies of every Material or Apple text style. Existing older consumers still have some pixel-based rules requiring actual text-scale review.

Spacing4/8/12/16/24/32/40/64; page max1040 including margins; desktop40 sides/48 top/64 major rhythm; phone20 sides/32 top/40 major rhythm. Catalogue internals24. Shape8 small,10 field,12 panel,24 sheet,full button. Elevation0 surfaces; overlay0 8px 32px #00000024, darker equivalent #00000066. Icons16 inline/20 control/24 navigation/36 book symbol; keep1.5–1.75 stroke. Targets44 CSS px web minimum,48 coarse input,52 foundational; native44pt Apple/48dp Android. Phone≤767, desktop expanded rail/sidebar≥1200; between uses compact navigation. Use env safe areas and content reflow, not device model names.

## 10. Component Specifications

| Component | Contract |
| --- | --- |
| App bar / rail / bottom nav | Current workspace, search, account; active destination has text+state; role capability filters; More exposes secondary navigation. No competing screen-primary action. |
| Book card | One link; neutral cover fallback or licensed real cover later, full title, subject/course, real chapter count and source-bound progress. No nested button or fabricated page count/time. |
| Course section | h2 subject/program + board/institution/exam/level + source status. Stable source ID key; no duplicate unlabelled groups. |
| Chapter/page row | Number, full title, named action, selected/completed text; preserve book ID; show unavailable rather than dead tap. |
| Reader | Parent return, source/version, lesson h1, text/model alternative, teaching language, stages, recorded feedback, contextual Ask and save recovery. |
| Progress badge | Explicit Not started/In progress/Completed/Content pending; assessed score is separately sourced. Unreadable progress is a notice, not0. |
| Buttons | Primary next action; outlined secondary; quiet navigation; destructive names object/scope. Disabled only for unavailable/busy state, with explanation. |
| Fields / filters / chips | Persistent labels,16px fields, stronger outline/focus, inline error; native search/select now; chips only for bounded mutually clear choices. |
| Tabs / segmented controls | Use tabs for peer views, segmented controls for same-object representation; keyboard follows component semantics, not generic div clicks. |
| Sheet / dialog / popover | Named title/description, focus trap, Esc close, originating focus return; visual scrim and safe area; confirmation only for consequential action. |
| Snackbar | Brief successful save/plan change; polite live announcement; Undo only when domain recovery is safe. Never put blocking errors solely in timeout toast. |
| Skeleton | Static geometry and one announced loading label; no focusable placeholders, no endless shimmer. |
| Empty / error / offline | One useful empty primary, available original art; errors name failed source with Retry and preserve work; offline banner does not claim all resources cached. |

## 11. Motion Specification

| Event | Standard | Reduced motion |
| --- | --- | --- |
| Open Learn |180ms opacity .96→1; no large displacement |Instant content |
| Expand course/help |Native disclosure opens immediately; no height animation delays |Same instant expansion |
| Book→contents / contents→reader |New title/context first;180ms subtle enter; focus main; no fake shared-cover transform |Instant switch/focus |
| Return |Restore retained scope/filter/scroll; never autoplay smooth scroll |Same retained position |
| Loading |Static skeleton geometry, replace when real data arrives |Same static geometry |
| Complete lesson |Text/status and next available action; optional220ms icon state change in native adapter |Static completed label |
| Save progress |Status while saving; brief visual confirmation only after actual write |Same confirmation |
| Error recovery |Retain content; clear error only after successful retry; no shaking controls |Same stable recovery |

Hover/pressed states use160/120ms, standard cubic-bezier(.2,0,0,1). Exit120ms cubic(.4,0,1,1) is reserved for overlays. Interruptible CSS never controls source fetch/save completion. Reduced-transparency removes overlay blur; forced colors use OS field/focus colors. No new looping decorative animation is introduced.

## 12. Sound and Haptic Specification

Web completion/error/navigation is silent by default. Current Guide voice remains explicit and existing audio state is visible. Native adapter specification: optional≤120ms soft completion tone plus one success haptic after a real completed action; correct answer may use one small confirmation only when audio feedback enabled; invalid consequential submission uses the system notification-error pattern with visible inline explanation, never every keystroke. One milestone cue per real milestone, not each page open. Essential notifications respect OS settings/quiet hours and consent; routine study progress never interrupts another task. No sound on hover/back/search or duplicate feedback over VoiceOver/TalkBack speech. Settings separate teaching speech, feedback sounds and haptics; mute is immediate and choice persists. Native patterns are capability-checked, not assumed on every iPad/macOS device. [Apple's intentional haptic guidance](https://developer.apple.com/documentation/applepencil/playing-haptic-feedback-in-your-app), [audio-haptic design principles](https://developer.apple.com/videos/play/wwdc2019/810/).

## 13. Accessibility Specification

Product targets exceed bare WCAG target-size minimum:44 CSS px,48 on touch. [WCAG2.2 target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [Android48dp guidance](https://developer.android.com/guide/topics/ui/accessibility/apps).

- Body/labels≥4.5:1; large text≥3:1; focus/control affordance≥3:1. Audit actual states and backgrounds, not just token pairs.
- One h1, ordered headings, main/nav/search landmarks; current/selected state announced. Labels persist and no decorative icon duplicates card text.
- Keyboard Tab/Shift+Tab, Enter/Space, component arrow keys, Esc; Ctrl/Cmd+K search. No keyboard override while editing prose. Browser/system Back remains native; no mandatory long-press/swipe.
- Route and query navigation move focus to main with preventScroll; existing in-shell scroll memory remains scoped. Overlays return focus; errors stay visible and identifiable.
- Web200% text/400% zoom and320 CSS px reflow acceptance required. Native Dynamic Type/TalkBack scaling must increase row heights and allow wrapping, never clamp lesson text.
- Reduced motion/transparency and forced colors; selected status has text/icon; no reliance on haptic/audio.
- Model has labelled sliders, meaningful accessible description and equivalent text view. Figures need authored alt text; equations need readable semantic alternatives. Captions/transcript required for future educational video/audio.
- Correct lang on interface and teaching; Hindi/Bengali review includes conjuncts/line height and full translated error/action labels. Source text may be English and must be marked.
- Child/family sharing, expiry and source failures remain visible and focusable. Accessibility preference never changes permission or inferred ability.

## 14. Frontend Implementation Plan

Implemented component seams: BookCatalogue, bookCatalogueService, booksForOutline/bookCompletion/filterCatalogueBooks, WorkspaceSkeleton, WorkspaceConnectionStatus, WorkspaceAppearance and workspace-tokens.css. Existing LearningWorkspace handles book/chapter/unit, model, answer drafts, source checks and contextual Ask/Build. Existing DashboardLayout handles lazy routes, scoped navigation/search, query focus and in-shell scroll memory. Existing class/report/editor/domain adapters remain authoritative for other categories.

State: component state for filters/pending/error; bounded memory keyed by person/workspace/course for catalogue view; repository-owned graphs/units for content/progress; existing preference service for theme. Fetch cancellation and access recheck prevent old-scope delivery. At most four concurrent subject reads; partial failures do not discard readable groups. A malformed progress store shows unavailable rather than fake0.

Proposed backend API contract (not implemented server):

```ts
CourseType { id, name, description?, context, bookIds[] }
Book { id, title, courseTypeId, subjectId, coverImage?,
       source: {provider, sourceId, version, language},
       totalPages?: number, chapterIds[], pageIds[], progress }
Page { id, bookId, chapterId?, title, contentType,
       estimatedMinutes?: number, completed, contentBlocks[] }
Progress { sourceVersion, completedPageIds[], lastPageId?, savedAt }
ContentBlock { id, type: 'text'|'figure'|'model'|'equation'|'check',
               content, altText?, transcript? }
```

Example: CourseType school-math → Book geometry-v1 → chapter cube-volume → page cube-introduction → text/model/check blocks. Current adapter maps ContentSelection→syllabus, ContentTextbook→Book, ContentChapter→collection and concept→lesson. Real physical page number/count/time is optional until extracted/verified; published source versions are immutable. User progress and source-owned content remain separate; completion cannot be trusted to a client alone in backend phase.

Route architecture: retain current query URLs for compatibility, introduce typed course/book/page paths only with a migration/resolver and tests for old exact-work links. Fetch content/progress separately; scoped cache keys include account/workspace/source version/language. Lazy load readers/models, preserve dimensions for images, avoid eager voice/media. Native adapters share object IDs/domain contracts but use native navigation and accessibility APIs.

Offline roadmap: currently cached browser-local graphs/progress, no offline-complete guarantee. Later use IndexedDB/versioned manifests with explicit downloaded-book state, opt-in storage and safe quotas; conflict-aware write queue, server acknowledgement, logout/privacy cache purge and revocation checks. Do not service-worker-cache authenticated responses without scope/retention design.

Analytics specification only: catalog_view, book_open, chapter_open, lesson_resume, source_retry, save_failure, navigation_return. Payload pseudonymous scope, object IDs/source version, outcome and latency; no raw child book-search, questions, drafts, voice or lesson bodies. Disabled until telemetry consent/retention and backend exist; never add external trackers for design QA.

Test hooks: book-catalogue, book-card, book-search; prefer role/label selectors for interaction. Service tests cover single-book gate, source-version completion, classroom exclusion, filters, partial failures/cancellation and scoped theme persistence. Performance acceptance targets: p75LCP≤2.5s, INP≤200ms, CLS≤0.1 on representative midrange devices; cached navigation visible within150ms; catalogue image<100KiB, dimensions reserved; no automatic audio/model loading. These are budgets, not achieved measurements. Vite bundle output and actual device measurements must corroborate before release.

## 15. QA Checklist

- [ ] Fresh Learn contains books/course groups and no chapter rows or lesson reader, including single-book courses.
- [ ] A student finds a named book in≤10s and reaches its page without assistance; target≥90% success with representative students. This human result is not inferred from screenshots.
- [ ] Book selection, identical chapter titles in different books, invalid/removed ID, source-version/language mismatch, refresh and exact resume behave predictably.
- [ ] Back restores parent book/chapter, filters and in-shell scroll; workspace switching excludes another person's records.
- [ ] Default/loading/empty/no-match/partial-error/full-error/offline/completed are rendered and announced; retry never erases readable work.
- [ ] Light/dark/system, hover/pressed/selected/focus/disabled, increased contrast/forced colors and reduced transparency are visually checked.
- [ ] Keyboard, screen-reader labels/order/dialog focus,200% text,400% zoom,320px reflow and native Dynamic Type are tested on actual target platforms.
- [ ] Model has text alternative; authored media has alt/captions/transcript; no mandatory motion/audio/haptic.
- [ ] Student/teacher/parent/professional/organization and their supported stage/capability variants retain correct permissions, drafts and connected destinations.
- [ ] Errors/consent/source provenance stay visible. Shares/assessments/production publication are not triggered by decorative interaction.
- [ ] Regression suite, lint, both type configurations, production build and diff whitespace pass; production captures identify their exact build.
- [ ] Performance budgets and representative-user confidence/task completion are measured before claiming best-in-class quality.

See [evidence index](baseline/cross-platform-2026-10-11/README.md) for actual checked observations; unchecked items remain acceptance criteria, not fabricated passes.

## 16. Final Quality Score and Remaining Risks

Scoring rubric0–5 across clarity, typography, visual consistency, interaction, accessibility, motion/sound restraint and engineering reliability. **Design-intent self-review4/5 for each**: concrete hierarchy, semantic roles and state contracts now exist. This is a qualitative hypothesis. **Measured whole-product score: not yet rated**; representative-user/native-device and wider permission/failure/language acceptance are incomplete. Passing service tests cannot certify visual/screen-reader performance, and colour-pair math cannot certify every card/dialog state.

Remaining risks: current adapters are browser-local; official content breadth and source ingestion are incomplete; native Dynamic Type/haptics/dynamic color are specified only; some legacy classes retain hardcoded/pixel styles requiring wider rendered checks; uncached offline availability is limited; full typography/script and assistive-device acceptance is open; backend identity/authorization/database/synchronization, real model quality and AGI evaluation remain future phases. Previous D-050–055 gates retain their evidence, not upgraded by this document.
