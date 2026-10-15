# Design review evidence · 2026-10-10

See [the review handoff](../../PRINCIPAL_DESIGN_REVIEW_2026_10_10.md). Fictional browser-local data only; no messages, external sharing, assessment submissions or payment actions were performed.

| File | Actual provenance |
| --- | --- |
| `before-audit.json` | 50 source-mode observations on port5173 across five roles. Chronological source-review record, including hot reload during changes. Exclude three entries with no headings: student Build, teacher Build, professional Classes. They captured loading shells. 47 rendered observations remain. |
| `before-student-home.png` | Source-mode Home before the new current-task disclosure. |
| `source-catalogue.png` | Source-mode catalog captured after hot reload; deliberately not labelled a before screenshot. |
| `after-primary-home-desktop.png`, `after-primary-catalogue-phone.png` | Isolated development Aarav early-reader presentation. These precede the final demo-stage fix, which does not change Aarav’s foundational presentation. |
| `after-class-people.png` | Development connected Work classroom, actual Dev/Aarav roster and selected People section. |
| `scenario-review.json` | Loaded development observations only: corrected exam/higher education; teacher personal and school Work classes/people/empty curriculum; two-child parent report/contextual Ask; professional personal/employer learning; school/company organization and cohort roster. Initial stale picker captures were replaced, not counted. |
| `compiled-review.json` | Six final production observations on port5174, compiled index-MHhczJFU.js: recovered Learn, two-book phone, current-task Home phone, contextual Ask desktop, current-task Home desktop, Build through More phone. |
| `compiled-primary-catalogue-phone.png` | 390×844 foundational two-book layout with content above optional setup. |
| `compiled-primary-books-phone.png` | Same production catalog after real PageDown scrolling of main: both133.5px book rows and optional setup below them are visible. |
| `compiled-current-home-desktop.png` | 1440×1000 current lesson, primary continuation and closed Change plan. Main was returned to the top before final capture. |
| `compiled-contextual-ask-desktop.png` | 1440×1000 contextual Ask and adjoining lesson. Measured lesson begins32px inside canvas; margin-top0. |
| `compiled-build-more-phone.png` | 390×844 empty Build with More active. No project was created. |
| `browser-errors.json` | Historical errors retained. Zero errors after recovered compiled document08:56:38UTC. Development-to-preview transition first retained stale dev assets; the new Reload page control actually recovered to /assets/index-MHhczJFU.js. The initial Home with /@vite/client was excluded from compiled-review.json. |

Final compiled interaction: authored sample library -> Geometry workbook -> Understand cube volume chapter -> Start creates local activity6b29e5b2-86cd-4ce0-8805-ffae6297f021 -> Home -> expand/collapse Change plan -> resume -> contextual Ask -> Home -> More -> Build. No answer, explanation request, completion, plan removal or sharing occurred. The isolated demonstration outline/activity remain on port5174; the user’s port5173 learning records were not changed by that rehearsal.

All six compiled observations have no document overflow at their measured390/1280/1440 widths. Phone navigation links measure60px and current plan-removal button52px. Development cohort Manage people/Refresh roster measure44px, allowing fractional browser rounding. Actual cohort create dialog focused Name; close and refresh were exercised without saving a cohort. Classroom Classwork survived a document reload, with selected background rgb245,248,255. Maya +30 days remained in the report’s contextual Ask/return URL.

Checks: 483/483 tests, full lint, both type checks and production build. Logs: `scripts-tmp/principal-review-20261010-{tests,lint,typecheck,build}.txt`; final git diff whitespace check passed. No whole-state or physical accessibility acceptance is inferred from these bounded checks. Full-page capture does not scroll the internal main region. User tab and default viewport restored; temporary preview tabs/servers closed.
