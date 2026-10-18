# D-056 — Cross-platform design and explicit book-first Learn

Review date: 2026-10-11. This evidence belongs to the managed `0b07` worktree. The original checkout and its :5173 server were not overwritten. Updated compiled preview: http://127.0.0.1:5176/dashboard/learn. Its local preview process is left running for review; it is not a deployment.

## Implementation and specification

[Complete 16-part design specification](../../CROSS_PLATFORM_PRODUCT_DESIGN_2026_10_11.md) and [JSON token contract](../../DESIGN_TOKENS_2026_10_11.json) cover all five supported role templates and their category/stage variants. Fresh Learn is grouped books → selected book chapters → selected lesson reader. Named parent return, scoped catalog filters, exact-source completion, partial source recovery, semantic theme preferences, platform typography, static skeletons, offline feedback and query focus are implemented. Native adaptation and future backend/offline/analytics work are identified as specifications rather than shipped features.

## Validation

| Check | Result | Evidence |
| --- | --- | --- |
| Complete regression suite | 496 passed; 0 failed/skipped | [tests.txt](tests.txt) |
| Final catalog regressions | 5 passed; 0 failed/skipped | [focused.txt](focused.txt) |
| Full ESLint | Exit 0 | [lint.txt](lint.txt) |
| JS and domain TypeScript checks | Exit 0 | [typecheck.txt](typecheck.txt) |
| Final production build | Exit 0; 1m26s | [build.txt](build.txt) |
| Whitespace validation | Exit 0; CRLF notices only | [whitespace.txt](whitespace.txt) |
| Semantic contrast | 20 light/dark pairs meet their 4.5:1 text or 3:1 control threshold | [contrast.json](contrast.json) |
| Compiled :5176 document errors | 0 recorded | [compiled-browser-errors.json](compiled-browser-errors.json) |

Final build identity: `index-D6f4oUt3.js`, layout `DashboardLayout-C-U0phZK.js`, reader `LearningWorkspace-BqXzB1l8.js`. [compiled-index.html](compiled-index.html) retains the exact entry manifest. Browser snapshots below all marked `compiled-` were taken against this final output. The full suite preceded the last presentational fixes; the final focused tests, lint/types and production build corroborate the final implementation. No service changes followed the full regression run.

## Browser observations

30 PNGs and matching DOM metadata: 16 development observations and 14 final compiled observations. [observations.json](observations.json) records URL, viewport, document width, appearance, actual title/font, book/chapter/reader counts and focus. Screenshot and JSON share the same basename.

| Final compiled capture | Observed behavior |
| --- | --- |
| [organization people](compiled-organization-people-dark.png) | Existing fictional Aarav/Maya connections; readable dark status badges; no connection action performed |
| [professional career](compiled-professional-career-dark.png) | Three-step direction/evidence/work hierarchy; empty evidence is stated; dark forms retain original boundaries |
| [teacher classes](compiled-teacher-classes-dark.png) | Existing fictional class, 1 class/0 students/0 assignments; Open class computed color is `rgb(168,199,250)` rather than dark fixed blue |
| [parent reports](compiled-parent-reports-dark.png) | Aarav and last 7 days; real empty shared evidence and consent/source limitations remain visible |
| [fresh Learn](compiled-fresh-learn-dark.png) | Current independent profile has no available books; one explicit authored-sample action; no chapter/reader |
| [book catalog](compiled-books-dark.png) | Two authored Mathematics books; zero chapters and zero lesson reader |
| [book contents](compiled-book-contents.png) | Geometry workbook selected; exactly its chapter row; reader absent |
| [selected chapter](compiled-chapter-selected.png) | Geometry parent and one concept; explicit Continue; reader absent |
| [reader](compiled-reader.png) | Exact existing cube unit; book-labelled return, Understand/Check/Practice/Build stages, 3D sliders and equivalent Read description control |
| [filter return](compiled-filter-return.png) | Reader → named book/chapter → All books retains `geometry` search and one matching book; focus returns to main |
| [Hindi phone](compiled-books-hi-phone-light.png) | Localized catalog controls, Devanagari fallback stack; source book titles stay English; 321px document/viewport, no horizontal overflow |
| [Bengali phone](compiled-books-bn-phone-light.png) | Localized catalog controls, Bengali fallback stack; source book titles unchanged; 321px document/viewport, no horizontal overflow |
| [device theme desktop](compiled-books-system-desktop.png) | English restored, appearance System, actual light surface; two books and no chapter/reader |
| [default viewport](compiled-books-default-viewport.png) | Temporary viewport override reset; 637×785, no horizontal overflow; preview left on book catalog |

Development observations additionally cover title search, no-match/Clear filters, dark phone catalog and filter return. `source-books-dark.png` is a **superseded failed visual observation**: header retained white and inactive navigation retained dark text. `source-teacher-classes-dark.png` and `source-organization-people-dark.png` predate the final action-link/badge corrections and are also superseded for theme acceptance. Their final compiled equivalents show the corrections. These initial defects are not counted as accepted visual results.

## Data and actions

Used existing fictional Anika workspaces at :5176. Sample catalog: `Sample library` / level `6` / `Mathematics`; Geometry parent `sample:library:geometry-book`, chapter `sample:library:geometry`, saved cube unit `8a2556c1-885d-432f-86aa-75a7b50ebfc6`. Teacher class: `42a7c1dd-7f1c-4999-acc6-dbfac25bf260`. Sample books are explicitly labelled authored and non-official. No physical page count is invented; cards use actual chapter counts.

Theme choices were exercised in all five fictional workspaces. Learner interface language is restored to English and theme to System; other reviewed fictional roles retain Dark. Catalog filters were cleared at the end. The reader's Start, answer/check, score, assignment/submission, share, invite, disconnect, billing and permission controls were not activated. No new learning unit or book import was created by this review.

## Diagnostics and remaining acceptance

[browser-errors.json](browser-errors.json) retains the full tab error log. Four entries came from a brief navigation to the **separate original :5173 checkout**, where `src/components/landing/SpotIllustration.jsx` references undefined `headShaded`. They are not :5176 compiled errors and were not hidden or fixed by changing unrelated public/original-checkout work. A transient Reports click dispatch timeout was followed by a fresh state observation and successful retry; final report rendering is captured above.

Actual screen readers, 200% text/400% zoom, native Dynamic Type/haptics/dynamic color, injected offline/media preferences, full legacy state/language/permission coverage and representative-student task timings are not verified by these captures. Contrast math verifies these token pairs, not every rendered pixel. Performance figures in the specification are budgets, not measurements. Native clients, official curriculum ingestion, server identity/authorization/database/cloud sync and model/AGI evaluation remain later phases. Existing D-050–055 evidence is retained on its own snapshots. Whole-product frontend acceptance remains tracked in the category ledger and human/device review worksheet.
