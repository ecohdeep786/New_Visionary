# Current-build design inventory — Wave 0.5

01-PM, 2026-09-19. **Product-side inventory only; 02-UX and 03-DesignSystem review pending. No screen replaced.** Source anchor at discovery: `043a80c85d2b514c7b867dedde6786f408908306`, plus the user's current working tree. Public team changes in that tree are not internal regressions and must not be reverted. Source paths below are relative to the repository root.

## Inheritance boundary

Keep the light surrounding canvas, rounded white workspace, slim labelled rail, top-right account menu, blue emphasis, Lucide icons, current React/Vite/Router/Query/Radix stack and existing deep links. Retain persistent local sessions, cube/fraction/data-table representations, class submission/grading, consent-scoped reports, projects and mock subscriptions. Home hierarchy must be enhanced for the new contract, not replaced with a new visual language.

Labels: **K** = keep existing interaction/layout foundation; **E** = enhance within current DNA; **T** = replace-with-token-equivalent, only after agent 03 approval. An E classification is not blanket authority to rewrite a component. Each future implementation names its acceptance ID, screenshot pair and decision. No obsolete component is deleted based on filename alone.

All entries below are **source inspected**. Selected current-build screenshots are indexed in `baseline/wave-0.5/README.md`; other entries still require before capture prior to enhancement. No after images exist because this stage changes no UI.

## Shell, onboarding and shared screens

| ID | Current screen / consumer | Decision | User job and next action | Necessary enhancement / contract |
|---|---|---|---|---|
| SH-01 | `/dashboard` shell; DashboardLayout/Sidebar/Topbar | K+E | Know active space; choose relevant destination | Keep white workspace and rail; role-scoped search, org badge, sibling scroll restore, 44px controls. Current layout scrolls to top on every pathname. G/H |
| SH-02 | WorkspaceSwitcher | K+E | Switch context without losing work | Preserve drafts/last destination; show active boundary and unavailable membership; no role vocabulary leakage. F/G |
| SH-03 | Search dialog in Topbar | E | Find an authorized object | Currently navigation and legacy topics only, same placeholder for all roles. Add scoped classes/resources/artifacts, filtered-empty/error. Search is not Ask. G/O |
| SH-04 | Account dropdown | K+E | Manage own account, plan and sign out | Keep placement; role-aware account copy and billing-owner distinction; visible focus/return. G/L |
| ON-01 | `/onboarding`; Onboarding + stepConfigs + existing steps | E | Establish role, stage, language and safe first goal | Keep autosave/back/review; add stageProfile, manual objective structure, consent-before-processing; inspect AGIIntro copy. I/X |
| SH-05 | `/dashboard/profile`; Profile | E | Update identity/context | Keep name and learning-area management; route stage changes through W; role-specific context, not student controls for every role. I/W |
| SH-06 | `/dashboard/settings`; Settings | E | Set preferences | Legacy language/accent form overlaps personalization; one authoritative preference view, no public token changes. H/K |
| SH-07 | `/dashboard/personalization`; WorkspaceTools/Trust | E | Control what Guide uses | Keep explicit language/text preference; add item/provenance/scope/edit/disable/delete and separate source/input/voice. K |
| SH-08 | `/dashboard/privacy`; WorkspaceTools/Trust | E | Understand and control sharing | Retain export and honest demo notice; consolidate relationship consumers, consent history, data-request states. F/M/Z |
| SH-09 | `/dashboard/connections`; Connections | E | Review scope and approve/decline/remove/renew | Old entity records and v2 records currently split across Connections/Privacy/Children. One scoped center, approver/expiry and lifecycle insights. F/Z |
| SH-10 | `/dashboard/notifications`; WorkspaceTools | E | Act on a relevant update | Keep read state/frequency; current seeded welcome item is not lifecycle delivery. Add local typed updates and no live-delivery claims. N/Z |
| SH-11 | `/dashboard/support`; Support | E | Get help or report a problem | Keep internal help links; add report/block/safety/offline states, never fabricated human contact. M |
| SH-12 | `/dashboard/subscription`; Plans + FamilyBilling | E | Understand access and billing ownership | Retain configured prices/mock checkout; borrowed Family entitlement must not expose owner cancellation; all outcomes/limits and invoice details. L |
| SH-13 | RouteFallback, AppErrorBoundary, PageNotFound, protected gates | E | Recover or return safely | Distinguish unavailable/missing/unauthorized/internal 404; avoid unsupported 'data safe' promises after unknown errors. Preserve auth return behavior. O |

Authentication routes (`/login`, `/register`, recovery routes) are retained entry dependencies, not redesigned in this wave. Public routes are frozen and outside this inventory's enhancement authorization.

## Role and activity screens

| ID | Current route / consumer | Decision | User job / primary next action | Gap / traceability |
|---|---|---|---|---|
| ST-01 | Student `/dashboard/home` → Guide | E | Continue the best next learning step | Current shared composer; add evidence/stage-selected ≤5 modules without discarding sessions. J/X |
| ST-02 | `/dashboard/learn`; Learn/JourneyCatalogue | E | Choose next objective | Keep subjects/chips/topics; reconcile curated and legacy sources, compact curriculum context and stage eligibility. J |
| ST-03 | `/dashboard/learn/:topicId`; TopicDetail | E | Understand outcome and resume | Keep bookmark and contextual links; objective/version/prerequisites, safe missing/access states. J/K |
| ST-04 | `/dashboard/ask` alias → Guide | E | Choose guided help intent | Preserve URLs/drafts/context; distinct intent-first destination, not duplicate Home or generic chat. G/J |
| ST-05 | GuideActivity in Home query journey canvas | E | Explore/check an idea, resume after doubt | Keep controls and exact snapshot; canvas-first lesson hierarchy, purposeful representation, bilingual controls/remediation. J/K |
| ST-06 | `/dashboard/explore`; Explore/cube lab | K+E | Manipulate volume and save discovery | Preserve safe cube and text alternative; unify objective/session identity with player. J |
| ST-07 | `/dashboard/practice`; Practice/QuizView | E | Retrieve next due idea | Durable one-task attempts, due queue/review/correction, no repeated evidence; retain scoring foundations. J/K |
| ST-08 | `/dashboard/build`; ArtifactStudio | E | Create a meaningful artifact | Keep document/preview/milestones/versions/export; scoped recommendation, durable draft, criteria and applied evidence. J/K |
| ST-09 | `/dashboard/progress`; WorkspaceTools/Progress | E | Understand evidence and next review | Keep named stages/calculation disclosure; objective aggregation, periods, retention and chart/list parity. K |
| ST-10 | Learner `/dashboard/classes`; StudentClasses | K+E | Connect and finish assigned work | Retain join/submission/feedback; scoped view model, draft resume, original-stage labels. F/J/W |
| ST-11 | `/dashboard/class/:classId`; ClassDetail | K+E | Open authorized classroom context | Retain classwork; audit student/teacher entry parity, missing/access states and permission-safe details. F/J |
| TE-01 | Teacher Home → Guide | E | Prepare next lesson or return feedback | Direct action, not suggestion→composer→send before opening existing form. ≤5 priority modules. J |
| TE-02 | `/dashboard/prepare`; WorkspaceTools | E | Edit and review lesson for a class | Keep draft/preview/assign; structured objectives, sources, rubric, accommodations and durable state. J |
| TE-03 | Teacher `/dashboard/classes`; role/TeacherHome | K+E | Open class or create one | Preserve cards/create dialog and linked organization selection; scheduled/closed lifecycle. J/Z |
| TE-04 | Class tabs + AssignmentGrader | K+E | Assign, review and return scoped work | Keep functioning submission/grade flow; full lifecycle, draft persistence, same lesson canvas and audience preview. J/Z |
| TE-05 | `/dashboard/learners`; Learners | K+E | Review permitted evidence | Keep scoped roster/details; class/objective filters and privacy-safe attention reasons. F/J |
| TE-06 | `/dashboard/insights`; RoleWorkspace | E | Identify next teaching action | Current operational counts; evidence period + useful drill-down without private doubts. J/K |
| TE-07 | `/dashboard/growth`; WorkspaceTools | E | Develop own teaching skill | Goal editor retained; connect own learning/practice/build separately from admin. J |
| TE-08 | `/dashboard/library`; WorkspaceTools | E | Reuse reviewed work | Keep search/archive/export; ownership/source/license/version/duplicate/share. J |
| PA-01 | Parent Home → Guide | E | Understand one child's week | Child switch + plain summary + one support action, not blank composer. J |
| PA-02 | `/dashboard/child`; Children | K+E | Establish permitted child connection | Keep request/report link/revoke; derived expiry, approver and safe pending/declined states. F/Z |
| PA-03 | `/dashboard/reports`; WorkspaceTools/Reports | E | Understand shared evidence and support next step | Keep child switch/period/private exclusions; report sections and teacher/transition digest pipeline. J/Z |
| PR-01 | Professional Home → Guide | E | Continue goal-linked work or learning | Personal/work treatment, relevant goal/evidence/next action, no school vocabulary. J/X |
| PR-02 | Professional Learn/Practice/Build/Progress | E | Improve a skill and demonstrate it | Shared controls retained; scenario/skill rubrics, confidentiality and explicit employer sharing. J/F |
| PR-03 | `/dashboard/career`; WorkspaceTools | E | Connect target skill to portfolio evidence | Current goal text editor; staged skill plan, interview scenario, evidence links; no live jobs claim. J |
| OR-01 | Organization Home → Guide | E | Complete setup or resolve next operational issue | Current suggestion routes to cohorts; actual setup checklist and actionable scoped overview. J |
| OR-02 | `/dashboard/people`; RoleWorkspace → Connections | E | Manage membership with least privilege | Retain invite/accept foundation; admin/billing/academic/viewer roles, deactivation and audit. F/M/Z |
| OR-03 | `/dashboard/cohorts`; Cohorts | K+E | Give accepted members a shared objective | Keep member/class selectors and validation; leads/term/schedule/archive lifecycle. J |
| OR-04 | `/dashboard/curriculum`; RoleWorkspace | E | Map approved objectives to organization work | Current framework/subject drafts do not distribute assignments; versioned map/review/approval. J |
| OR-05 | Organization `/dashboard/library`; WorkspaceTools | E | Review and distribute content | Current generic lesson library; org approval/source audit and scoped distribution. J |
| OR-06 | `/dashboard/analytics`; RoleWorkspace | E | Act on permitted cohort evidence | Counts only; coverage/retention, small-group suppression and scoped exports. F/J/M |
| OR-07 | `/dashboard/audit`; WorkspaceTools | E | Explain who changed authorized state | Current resource/preference audit; add membership/permission/transition outcome events. M/W/Z |
| OR-08 | Organization settings/billing via shared routes | E | Govern policy and seats | Dedicated policy/role/seat semantics missing; do not imply personal Settings is full governance. J/L/M |

Missing surfaces are requirements, not permission to invent a separate application: auto-transition notice/diff/undo, itemized personalization memory, safe voice/transcript states, marketplace moderation/earnings (flagged), live-session simulation (flagged), full scoped report/detail states. UX determines placement using existing route conventions. Preserve aliases; add routes only for real object/workflow needs.

## Design-system facts for agent 03

| Current source | Observed values / pattern | Proposed classification, not implementation |
|---|---|---|
| `components/dashboard/workspace.css` | canvas #f8fafd, text #202124, brand #1967d2, border #dadce0; .v-title 24px/-0.025em; card radius16; fields10; 44px .v-button | T: normalize authenticated tokens to Part H; preserve layout and clear contrast, do not blindly assign muted text colors to small labels |
| `DashboardLayout/Topbar`, legacy role pages | Repeated literal colors; 20px workspace radius; several 36/40px controls | E+T: scoped semantic variants and target correction; current shell remains base |
| `components/ui/button.jsx`, `dialog.jsx` | Shared global tokens, smaller base targets, Radix behavior/portal | K behavior; authenticated variant only after consumer map. Do not recolor public consumers globally |
| `index.css`, `tailwind.config.js` | Google Sans families plus older Figma/global tokens; public team has live edits | Read-only inheritance source; no global rewrite in internal wave |
| `.guide-*` | ≥1200 split, <1200 tabs; mobile bottom nav <768 | Keep responsive capabilities, UX to reorder focus for lesson vs Home jobs |
| reduced-motion rule | Scoped animation/transition suppression exists | Keep; agent 05/06 must inspect portals and outside-scope animations |

Existing role/StudentHome, ParentHome, OrgHome, older Ask/Build/Subscription and card components may be reusable or unconsumed. **No deletion decision**: verify import graph first; TeacherHome is actively routed as Classes despite its filename.

## Product-side co-sign and next owners

PM approves **inheritance and gap classification**, not visual compliance or fixture completeness. Existing work is retained; no completed wave is restarted. 02-UX maps gaps into the current screen grammar and all applicable states; 03 validates token equivalents; 04 implements only that approved enhancement list. Before/after screenshots and DECISIONS references remain prerequisites. 07 owns exhaustive seven-width/zoom/keyboard/language verification. G11 and G12 are not passed by this document.
