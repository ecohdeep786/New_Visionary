# D-055 category design evidence — 2026-10-10

Companion: [category design review](../../CATEGORY_DESIGN_COMPLETION_2026_10_10.md). All captures were taken from this managed worktree on isolated localhost :5176, with fictional development profiles. They are bounded layout/navigation evidence, not a representative-user or whole-product acceptance result.

## Validation

- [Regression suite](tests.txt): 491 passed, zero failures/skips/cancellations, 326773ms.
- [Lint](lint.txt): npm run lint, exit 0.
- [Both type configurations](typecheck.txt): npm run typecheck, exit 0.
- [Final production build](build.txt): npm run build, exit 0, 3m29s, index-BBfWaQOr.js. Legacy layout refinements followed the full test run; they changed presentation only. Final lint/types/build include those refinements.
- git diff --check: passed (line-ending notices only).
- [Browser errors](browser-errors.json): empty review-tab error array.
- [Persisted DOM observations](observations.json): 28 captures with URL, actual viewport/document widths, heading style and disclosure state. All these observations have document width no greater than viewport width. Earlier captures have PNGs only: a browser-control session reset lost their in-memory metadata; it did not delete the images.

## Coverage and limits

56 retained screenshots: 13 development, 43 compiled; nine use the final build after the legacy presentation refinement. First compiled Teacher Prepare/Classes/Learners/Insights captures used the normal 1280px viewport. Subsequent desktop captures use 1440px; requested 320px phones report 321px. The earlier built pages remain valid for the common grammar, which was unchanged in the last legacy-only revision.

School foundational, higher-education and competitive-exam context are rendered in development mode. Independent learner, teacher, parent, professional and organization templates are rendered in compiled mode. Other supported subcategory labels share these templates and retain their existing role/stage/capability filters; this pass does not certify every context/state/language permutation.

The learner rehearsal opens Mathematics in the authored Sample library, both book choices, Geometry workbook and its cube chapter. Continue resumes unit 8a2556c1-885d-432f-86aa-75a7b50ebfc6; contextual Ask preserves the unsent fictional bluebird draft and returns to that unit. No answer was submitted or mastery invented. Final compiled catalogue retains book sample:library:geometry-book and chapter sample:library:geometry together, with the chapter Continue visible on desktop.

Teacher empty first use has one primary action. A UI-created fictional class 42a7c1dd-7f1c-4999-acc6-dbfac25bf260 has a deliberately long name, Semester 2 / Studio 204 and zero students. Card names visually truncate while their full accessible link/title and classroom heading remain; the class opens by exact ID on phone. No assignment or curriculum was published and no enrollment was created.

Compiled Parent child/period reports retain the fixed-share/privacy explanation. Professional Career/Learn/Practice/Build/Progress, organization People/Cohorts/Curriculum/Content/Insights/Audit/Settings/Billing and shared Personalization/Privacy/Plans/Support use the common layout. Empty states represent actual fixture availability. Parent Reports, Career and organization Content were also reviewed on the measured 321px viewport. Permission/source/billing notices remain visible; new failure injection was not performed.

Final build Hindi and Bengali Learn About disclosures open with Enter at 321px; teaching language remains English. Previous-topic/lab/practice templates use the same grammar. Saving the authored old cube lab creates fictional topic 24d06976-279f-49b7-a7d8-2cf64937bcc9, returns to Geometry and opens that exact lesson. Its practice link exposes the current authored entry and the explicit separate previous-practice link. The old lab is recorded as exploration, not assessed mastery.

Cold lazy route navigation sometimes captured Loading; only loaded page screenshots are indexed. One detached heading wait was resolved by observing the loaded page. A five-page batch exceeded the browser-control call time limit; four screenshots were already saved and the fifth was recaptured with a fresh binding. These attempts are not counted as successful page observations.

During the owned development-to-preview switch, the old user tab briefly displayed a local connection error. Its embedded error URL prevented ordinary API restoration. The existing :5173 server and records were preserved; a fresh tab visibly reopens original Personal Learner Home at default 1280x721. The old errored tab was retained, not deleted. Temporary :5176 preview stopped after review, interface restored to English and viewport override reset. Source changes remain in the managed worktree; no synchronization into the original checkout or deployment occurred.

Actual screen-reader/device/zoom/voice, representative-user glance/usability and complete expanded-role localization remain acceptance work. The designer scores are qualitative; no 3-second user study, 40% pixel-whitespace measure, Apple/Google parity or AGI claim is established.

## Capture index

| Screenshot | Build stage | Metadata |
| --- | --- | --- |
| [exam-context-desktop](exam-context-desktop.png) | Development | PNG; session metadata was not retained |
| [final-catalogue-chapter-desktop](final-catalogue-chapter-desktop.png) | Final compiled index-BBfWaQOr.js | [DOM metadata](final-catalogue-chapter-desktop.json) |
| [final-learner-bengali-help-phone](final-learner-bengali-help-phone.png) | Final compiled index-BBfWaQOr.js | [DOM metadata](final-learner-bengali-help-phone.json) |
| [final-learner-build](final-learner-build.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-learner-build.json) |
| [final-learner-hindi-help-phone](final-learner-hindi-help-phone.png) | Final compiled index-BBfWaQOr.js | [DOM metadata](final-learner-hindi-help-phone.json) |
| [final-learner-learn](final-learner-learn.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-learner-learn.json) |
| [final-learner-practice](final-learner-practice.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-learner-practice.json) |
| [final-learner-progress](final-learner-progress.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-learner-progress.json) |
| [final-organization-audit](final-organization-audit.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-organization-audit.json) |
| [final-organization-billing](final-organization-billing.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-organization-billing.json) |
| [final-organization-cohorts](final-organization-cohorts.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-organization-cohorts.json) |
| [final-organization-content-phone](final-organization-content-phone.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-organization-content-phone.json) |
| [final-organization-content](final-organization-content.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-organization-content.json) |
| [final-organization-curriculum](final-organization-curriculum.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-organization-curriculum.json) |
| [final-organization-insights](final-organization-insights.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-organization-insights.json) |
| [final-organization-people](final-organization-people.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-organization-people.json) |
| [final-organization-settings](final-organization-settings.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-organization-settings.json) |
| [final-parent-children](final-parent-children.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [final-parent-connections](final-parent-connections.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [final-parent-notifications](final-parent-notifications.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [final-parent-reports-phone](final-parent-reports-phone.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [final-parent-reports](final-parent-reports.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [final-previous-lab-desktop](final-previous-lab-desktop.png) | Final compiled index-BBfWaQOr.js | [DOM metadata](final-previous-lab-desktop.json) |
| [final-previous-practice-desktop](final-previous-practice-desktop.png) | Final compiled index-BBfWaQOr.js | [DOM metadata](final-previous-practice-desktop.json) |
| [final-previous-practice-phone](final-previous-practice-phone.png) | Final compiled index-BBfWaQOr.js | [DOM metadata](final-previous-practice-phone.json) |
| [final-previous-topic-desktop](final-previous-topic-desktop.png) | Final compiled index-BBfWaQOr.js | [DOM metadata](final-previous-topic-desktop.json) |
| [final-previous-topic-phone](final-previous-topic-phone.png) | Final compiled index-BBfWaQOr.js | [DOM metadata](final-previous-topic-phone.json) |
| [final-previous-topics-desktop](final-previous-topics-desktop.png) | Final compiled index-BBfWaQOr.js | [DOM metadata](final-previous-topics-desktop.json) |
| [final-professional-build](final-professional-build.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [final-professional-career-phone](final-professional-career-phone.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-professional-career-phone.json) |
| [final-professional-career](final-professional-career.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [final-professional-learn](final-professional-learn.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [final-professional-practice](final-professional-practice.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [final-professional-progress](final-professional-progress.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-professional-progress.json) |
| [final-shared-personalization](final-shared-personalization.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-shared-personalization.json) |
| [final-shared-plans](final-shared-plans.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-shared-plans.json) |
| [final-shared-privacy](final-shared-privacy.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-shared-privacy.json) |
| [final-shared-support](final-shared-support.png) | Compiled index-D6Tod7PW.js | [DOM metadata](final-shared-support.json) |
| [final-teacher-classes](final-teacher-classes.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [final-teacher-growth](final-teacher-growth.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [final-teacher-insights](final-teacher-insights.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [final-teacher-learners](final-teacher-learners.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [final-teacher-library](final-teacher-library.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [final-teacher-prepare](final-teacher-prepare.png) | Compiled index-D6Tod7PW.js | PNG; session metadata was not retained |
| [higher-education-context-desktop](higher-education-context-desktop.png) | Development | PNG; session metadata was not retained |
| [learner-ask-phone](learner-ask-phone.png) | Development | PNG; session metadata was not retained |
| [learner-books-desktop](learner-books-desktop.png) | Development | PNG; session metadata was not retained |
| [learner-chapter-desktop](learner-chapter-desktop.png) | Development | PNG; session metadata was not retained |
| [learner-chapter-phone](learner-chapter-phone.png) | Development | PNG; session metadata was not retained |
| [learner-lesson-phone](learner-lesson-phone.png) | Development | PNG; session metadata was not retained |
| [school-learn-desktop](school-learn-desktop.png) | Development | PNG; session metadata was not retained |
| [teacher-class-card-desktop](teacher-class-card-desktop.png) | Development | PNG; session metadata was not retained |
| [teacher-class-card-phone](teacher-class-card-phone.png) | Development | PNG; session metadata was not retained |
| [teacher-class-detail-phone](teacher-class-detail-phone.png) | Development | PNG; session metadata was not retained |
| [teacher-classes-desktop](teacher-classes-desktop.png) | Development | PNG; session metadata was not retained |
| [teacher-prepare-desktop](teacher-prepare-desktop.png) | Development | PNG; session metadata was not retained |
