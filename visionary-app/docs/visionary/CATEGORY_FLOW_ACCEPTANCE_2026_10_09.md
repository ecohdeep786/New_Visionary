# Category and connected-flow frontend acceptance

2026-10-09. Source inspection of the current React routes, onboarding definitions, navigation, stage services and content adapter. This is an implementation ledger and a concrete acceptance plan, not a claim that every variant has received browser, accessibility or user acceptance. Backend, official catalog ingestion and model work are deferred.

## Categories actually supported

The five workspace roles are learner (`student`), teacher, parent, professional and organization. Onboarding offers learner stages school, higher education, competitive examination and career/independent learning. The last maps to the professional workspace. A separately added adult learner workspace can use independent learning. Vocational is already supported by the stage editor and presentation service; it is not a new onboarding choice in this pass.

| Category / supported subcategory | Context and implemented route sequence | Current acceptance boundary |
| --- | --- | --- |
| School, classes 1–5 | `/onboarding` -> `/dashboard/home` -> `/dashboard/learn` -> selected subject/book/chapter/concept -> contextual `/dashboard/ask` -> check and `/dashboard/practice` -> `/dashboard/build` -> `/dashboard/progress` | Foundational presentation derives from class and age. Verify two-module Home, short copy, text/visual parity and accessible interactions with a populated multi-subject fixture; do not infer skill from age. |
| School, classes 6–8 | Same learner routes, with developing presentation | Verify three-module Home, current-context subject selection and several books with overlapping chapter titles. Sample activities do not certify any board coverage. |
| School, classes 9–10 | Same learner routes, secondary presentation | Verify diagram/simulation/text availability, draft/resume and preserved source revision across stages. |
| School, classes 11–12 | Same routes; higher-secondary learning-stage policy | Verify worked-example/check/practice/build and current-stage context without discarding work from earlier classes. |
| Higher education: college, university, autonomous college, diploma/polytechnic | Onboarding institution/degree/department/semester/preferences -> Home -> Learn -> sourced course subjects/books/chapters -> Ask/Practice/Build/Progress; `/dashboard/classes` for assigned work | Degree and semester are retained as a course-context label; institution is user-entered or an institution type. No official degree subject catalog is inferred. Verify term changes and original-source resume. |
| Competitive examination | Exam/year/preparation/preferences -> Home -> Learn -> exam subjects/books/objectives -> Ask/Practice/Build/Progress; Classes when explicitly connected | The exam supplies a requested source context, not a verified syllabus or readiness score. Verify unavailable content and authored sample separation. |
| Career/independent learner onboarding | `/onboarding` -> professional Home/Learn/Ask/Practice/Build/Progress/Career | Goal-driven presentation; no forced school board/class. Verify empty target, selected capability, saved artifact and resume. |
| Existing independent adult learner workspace | Home/Learn/Ask/Practice/Build/Progress, optional Classes | Adult stage fallback is independent. Verify absence of school labels and no automatic organization access. |
| Vocational stage editor context | `/dashboard/personalization` -> stage decision on Home -> Learn/Practice/Build/Progress | Existing service/editor stage, not offered as a new onboarding option. Verify applied task/evidence vocabulary with suitable sourced content before claiming a complete vocational catalog. |
| School teacher | Onboarding board/classes/subjects -> Home -> `/dashboard/prepare` -> `/dashboard/classes` -> `/dashboard/class/:classId` -> assignment -> learner response -> review/return -> `/dashboard/learners` and `/dashboard/insights` | Teacher/class/submission services exist. Verify several classes/subjects, assignment revision, resubmission and private-learning exclusions. |
| Higher-education faculty | Onboarding institution/course level/subjects -> same teacher routes | Setup no longer forces school board or classes 1–12. Course context remains a preference; classes and assignments are created explicitly. Verify actual course fixture. |
| University faculty | Same teacher path with university course context | UG/PG/doctoral descriptions are labels, not a complete research/laboratory/thesis workflow. Verify reusable course/assignment flow; do not claim those additional workflows implemented. |
| Coaching faculty | Onboarding exam/subjects -> Prepare -> Classes -> assignment/review -> Learners/Insights | Setup uses exam context. Verify fixed authored questions, feedback and source snapshots; no generated exam bank or official exam certification. |
| Independent teacher | Onboarding optional institution/course context/subjects -> Prepare/Classes/Library/Insights | Connection is optional and must not be inferred from a typed institution. Verify private preparation and explicit enrollment. |
| Parent: mother, father, guardian | Onboarding relationship + child school/higher-ed/exam preference -> `/dashboard/child` and `/dashboard/connections` -> permitted child selection -> `/dashboard/reports` -> contextual Ask/support action | All three relationship labels use the same permission model. Typed child details create no entitlement. Verify several children, approved scopes, period, expiry/revocation and private exclusions. |
| Personal professional / job seeker | Home -> `/dashboard/career` -> capability Learn/Ask/Practice -> Build -> Progress/portfolio | Saved direction, objective evidence and artifacts exist. Verify actual populated evidence and rubric, without implying live jobs/interviews or mastery. |
| Organization-connected professional / employee | Explicit Connections/workspace switch -> assigned capability/classwork or cohort -> learning/application -> explicitly shared artifact/review | Local connected workspace and sharing flows exist. Personal work stays separate. Verify membership removal, scoped reviewer access and original source version. |
| School organization | Onboarding board/classes -> Home -> `/dashboard/people` -> `/dashboard/cohorts` -> `/dashboard/curriculum` -> `/dashboard/library` -> content review/delivery -> teacher assignment -> `/dashboard/analytics` / `/dashboard/audit` | Verify actual accepted membership and linked classes, not roster drafts as access. |
| College organization | Onboarding programs -> same organization route sequence | School-only board questions hidden. Verify course/cohort publication and authorized insight fixture. |
| University organization | Onboarding programs -> same organization routes | Shared course/curriculum administration exists; no claim of complete university research administration. |
| Coaching organization | Onboarding examination/course focus -> same organization routes | Focus is a preference, not an official syllabus or automatic content distribution. Verify review/publish/delivery context. |
| Training organization | Onboarding skill/course focus -> same organization routes | Verify objective/rubric/cohort flow with explicitly authorized people. |
| Company learning organization scenario | Existing company administrator scenario -> role-scoped organization routes and employee connection | Company exists as a scenario/context; it is not a newly added organization-type onboarding choice. Verify employer confidentiality and sharing separately. |

Existing contextual choices are intentionally not described as separately implemented products: school boards CBSE, CISCE, IB, Cambridge and State; higher-education degrees B.Tech, BCA, B.Sc, BA, B.Com, MBA, MCA and Other; exam targets JEE Main, JEE Advanced, NEET, UPSC, CAT, CLAT, GATE, SSC, Banking and Railway. The frontend must accept missing or unavailable content for every choice. Listing a choice is not evidence that books or learning activities exist for it.

Teacher role labels (class teacher, subject teacher, coordinator, head of department, administrator, principal) are onboarding preferences. Administrative permission must still come from the organization access model. Organization profiles are Owner, Organization administrator, Academic administrator, Analyst and Billing administrator; their route access is derived from capabilities, not their setup label.

## Interconnections to exercise

| Connection | Existing owner and route | Required observable result |
| --- | --- | --- |
| Learner profile -> curriculum catalog | `workspaceService`, `stageTransitionService`, `ContentRepositoryAdapter`; Learn | Active stage/source/class or term chooses requested subjects. No first-subject-only assumption, hidden school context or invented official catalog. Loading, null/missing and invalid response states have usable recovery. |
| Subject -> several books -> chapters -> concepts | `contentRepository` graph; Learn | Book ID separates duplicate chapter titles. Chapter/topic/concept parent IDs are checked. Selection and contextual return preserve the correct source and revision. |
| Teach -> Ask -> resume -> Practice -> Build | `learningPipelineService`, `LearningWorkspace`, `ArtifactStudio` | Asking pauses/restores the same activity. Answers and drafts survive navigation. A build draft references the actual objective; rubric/application evidence is distinguished from merely finishing an activity. |
| Organization -> teacher -> class -> learner | `OrganizationContent`, `TeacherContentInbox`, `ClassCurriculum`, classroom services | Approved delivered version is explicit. Teacher chooses the authorized class. Learner sees assignment without answer-key leakage; return/revision remains attached to the same assignment. |
| Learner -> parent | Children/Connections/ParentReport | Only approved, currently valid scopes contribute to the selected child's report. Family billing does not establish guardian access. No private doubts, notes or drafts leak. |
| Professional -> employer/reviewer | Career/Build, explicit connection and sharing services | Personal target and artifacts remain private until the supported explicit action shares them. The reviewer sees permitted work and a review history, not the whole personal workspace. |
| Stage progression -> existing work | Stage editor/notice/transition service | Adjacent updates, boundary confirmation, postpone/undo and source history remain coherent. Old activities resume with their captured source; new browsing uses the current stage. |
| Notifications/search -> authorized object | Shared topbar/notifications | Relevant object opens with correct workspace/context. A removed permission yields an unavailable/access state, not another user's data. |

## Source-confirmed fixes made in this pass

- School onboarding accepts several optional subjects rather than one initial label. Higher education and examination onboarding also accept several optional starting subjects, without generating curriculum.
- Higher education collects an optional institution name; degree and semester now survive new-account workspace bootstrap as the class/course-context label. Existing Auth fields are retained. Later bootstrap still does not overwrite a stage transition.
- Exam setup initializes source/exam from the chosen examination. A previously declared school class is retained for concurrent school/exam stage policy and promotion history; it does not turn the examination into an official school syllabus. Professional setup omits school board/class fields.
- Teacher setup asks board/classes only for school teachers, course context for faculty/independent teachers and examination context for coaching. Organization board/classes are school-only; college/university programs and coaching/training focus are distinct.
- Parent higher-education/examination setup can describe an optional course/examination, explicitly separate from the connected child's learning profile and consent.
- Setup review displays the selected category's actual context. Age, consent and connection checks are unchanged. Supported school medium initializes teaching locale only when a more explicit preference is absent.

These changes are implemented source behavior. The integrating pass also completed the subject/book browser and connected-role fixes. CATALOGUE_FRONTEND_HANDOFF.md records 478 passing regressions and the actual compiled two-subject/two-book learner journey through Teach, Ask, check, Practice, saved Build and original-source return. This bounded fixture does not upgrade every row above to manually accepted status.

## Frontend completion gate

For each row above, exercise populated data, first use/empty, loading, unavailable source, failed read/write and removed access where applicable. Record expected and observed behavior for primary action, back/return, refresh/resume, several objects, workspace switch, source/version/language and private/shared boundary. Verify phone and desktop plus keyboard/focus and reduced motion. Automated tests corroborate service behavior; screenshots corroborate the exercised layout. Neither automatically certifies the other rows.

The current in-app routes and local service seams support a phased frontend. Official subject discovery, server identity/authorization, persistent database, ingestion/publication, cloud synchronization and model quality belong to later phases. This ledger does not claim full frontend acceptance, official curriculum breadth, university administration completeness or AGI.

## Source anchors

- `src/App.jsx`: actual routes and lazy route consumers (Build resolves to ArtifactStudio).
- `src/components/onboarding/stepConfigs.jsx` and `src/pages/Onboarding.jsx`: role/stage/category setup and review.
- `src/lib/onboardingLearningContext.js`, `src/services/workspaceService.ts`: context normalization and one-time bootstrap.
- `src/services/stagePresentation.ts`, `src/services/stageTransitionService.ts`: stage-derived presentation, transitions and saved-work preservation.
- `src/services/contentRepository.ts`: existing selection, graph hierarchy, provenance, localization and async adapter.
- `src/lib/dashboardNavigation.js`, `src/services/organizationPolicy.js`: visible navigation and scoped capabilities.
- `DESIGN_INVENTORY.md`: retained ON/SH/ST/TE/PA/PR/OR identifiers; this audit supplements rather than replaces that inventory.
