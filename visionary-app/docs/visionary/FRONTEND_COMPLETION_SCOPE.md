# Frontend completion scope before backend

2026-10-09 founder clarification. The supplied book illustrates the hierarchy and connected student experience. Its full import, official curriculum certification and chemistry model implementation are not prerequisites for agreeing the general frontend flow. Do not start backend/database/model work during this frontend phase.

## Required outcome

Every supported category and subcategory needs a coherent, usable page sequence with realistic local fixtures and a defined data contract. Verify navigation, context, primary actions, back/return, saved drafts, resume, responsive layout and loading/empty/error/access states. Shared components should preserve each category's own user task. Attractive screenshots and a passing build are supporting checks, not the entire completion gate.

Student example: onboarding context -> Academy/subject overview -> subject -> book -> chapter -> topic/concept -> Teach -> contextual Ask -> understanding check -> Practice -> guided Build -> evidence/feedback/resume. Board, class, subject, source version and content language remain associated with the selected content. Onboarding preferences choose the requested context; the later backend determines available authorized content. An absent curriculum has a real unavailable state, not invented official coverage.

## Initial inspection findings (resolved in D-050 where stated)

- `src/services/contentRepository.ts` already defines subject selection, textbooks, chapters, topics, concepts, provenance and the asynchronous `ContentRepositoryAdapter` boundary.
- Before D-050, `src/pages/dashboard/LearningWorkspace.jsx` initialized from saved selection or onboarding board/class/first subject and listed chapters directly. D-050 adds a current-context subject shelf, explicit book selection and book-scoped chapters. The new multi-book sample preserves the older sample IDs and source version. Connected browser rehearsal confirms two subjects, distinct book chapters, reload and a complete authored learning-to-project route.
- The existing learning pipeline supports Teach/check/practice/project stages, contextual Ask, answer drafts and artifact linkage. Earlier authored example rehearsals are retained evidence. This does not verify arbitrary chapter content or every student subcategory.
- The five-role ledger in CURRENT_PRODUCT_STATUS.md records implemented teacher, parent, professional and organization flows plus broader state/permission/manual acceptance still open. Audit these existing flows; preserve completed behavior and fix specific gaps rather than restart every screen.

## Category coverage for the next implementation pass

| Category | Connected frontend path to verify |
| --- | --- |
| Student and its supported stages/subcategories | Onboarding context -> relevant curriculum/course/goal overview -> content hierarchy -> Teach/Ask/check/Practice/Build -> progress and resume; assigned classwork alongside private learning |
| Teacher | Onboarding/workspace -> sourced preparation -> class and assignment -> learner submission -> review/return/revision -> teaching insights; own growth remains separate |
| Parent | Onboarding -> child connection and active scope -> child selection -> permitted reports/shared artifacts -> support action; expired/revoked/empty states |
| Professional | Onboarding/personal or company context -> goal/capability -> Learn/Ask/Practice/Build -> evidence/portfolio -> explicit share/review |
| Organization | Setup/admin capability -> people/cohorts -> content/curriculum review -> teacher delivery/publication -> authorized insights/audit; roles and access remain scoped |
| Shared | Workspace switching, search, notifications, preferences, privacy, plans, support, unavailable routes, recovery and context-preserving return |

Use the existing category definitions and DESIGN_INVENTORY identifiers for the exhaustive subcategory ledger. Distinguish implemented, locally exercised, missing and awaiting manual acceptance. Confirm each connection with populated fixtures as well as empty states. Mock data should be replaceable through service/adapter boundaries without redesigning the page hierarchy.

## Phase boundary

Frontend completion means the intended experiences and data-dependent states are implemented and reviewed locally, with exact unresolved acceptance items documented. Then backend work implements catalog queries, persistence, identity/authorization, source/version ownership and reliable operations against those contracts. System design and model/learning evaluation proceed in their appropriate phases. The long-term AGI ambition is not an acceptance result of the frontend.

The initial inspection itself made no runtime changes. [CATALOGUE_FRONTEND_HANDOFF.md](CATALOGUE_FRONTEND_HANDOFF.md) records the subsequent D-050 implementation and bounded verification. [CATEGORY_FLOW_ACCEPTANCE_2026_10_09.md](CATEGORY_FLOW_ACCEPTANCE_2026_10_09.md) maps all supported category/context choices and the remaining manual and wider-state acceptance. Backend implementation remains deferred.
