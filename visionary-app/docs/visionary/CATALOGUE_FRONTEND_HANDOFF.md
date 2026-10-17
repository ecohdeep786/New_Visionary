# Subject, book and connected category frontend handoff

2026-10-09, D-050. Implements the founder's clarification: the supplied chapter demonstrates a real hierarchy, while the current phase completes reusable frontend flows. It does not import that PDF, publish an official curriculum, implement a backend or certify AGI.

## Implemented behavior

- Learn shows several subjects from the current person context, an optional connected catalog and saved outlines in the same board/course/exam and class/term. Switching context does not silently reuse an old school outline. Explicit browsing remains addressable in the URL; earlier learning units preserve their original source.
- A subject contains books, a book contains its own chapters, and a chapter exposes topics/concepts and their learning path. Book IDs and declared parents separate matching chapter titles. Foreign book/chapter combinations fail with recovery. Multiple books initially require selection; a single book opens its chapters directly.
- The isolated Sample library contains Fractions workbook and Geometry workbook with authored fraction and cube activities. Its source is `sample:library`, version `1`. Existing samples retain their original IDs and version `2`; saved old units are not migrated or rewritten.
- The existing Teach, contextual Ask, understanding check, Practice and guided Build handlers remain connected. Unit-only return links from Ask/Build infer the original book/chapter from the owned cached graph matching the unit's captured selection and provenance. They do not use the most recently browsed subject as the source of an old activity.
- Subject cards, book covers, context trail, chapter controls and optional chooser use the internal design system, responsive layouts, labelled controls and en/hi/bn interface text. Code-native book covers and existing Visionary spot artwork are used. Authored source titles retain their own language.

## Categories and shared connections

The exhaustive supported context choices and route owners are in [CATEGORY_FLOW_ACCEPTANCE_2026_10_09.md](CATEGORY_FLOW_ACCEPTANCE_2026_10_09.md). Shared routes are reused according to current stage and permission; a setup label does not grant access.

| Category | Changes in this integration |
| --- | --- |
| Student: school, higher education and exam contexts | Several optional onboarding subjects; institution/degree/semester or exam context survives initial bootstrap. Current context drives new browsing; saved source survives later stage changes. No official subject list is inferred from a chosen board or exam. |
| Teacher: school, faculty, coaching and independent | School board/class questions are school-specific; faculty and independent teachers use course context, coaching uses exam context. Objective choices identify Book · Chapter · Objective. Class sections are URL-addressable; learner review and saved assignment returns open Classwork. |
| Parent: mother, father and guardian | Child setup can describe course/exam preferences independently of the consented child's actual profile. Children can open permitted contextual Ask. Reports and Ask have usable return/current-child recovery, retaining period while clearing obsolete question/answer state when context changes. |
| Professional: personal and explicitly connected work | Setup omits hidden school fields. Saved career capabilities link to contextual Ask and objective evidence alongside their existing learning continuation. Personal and employer scope remains enforced by existing services. |
| Organization: school, college, university, coaching and training | Setup distinguishes school board/classes, programs and course/exam focus. Empty teacher-delivery state links to People only when the current capability permits member management. Publication/delivery/assignment permissions remain unchanged. |

## Backend-facing frontend contract

`ContentRepositoryAdapter` now optionally exposes `getSubjects({board, classLevel}, ctx)` returning `{board, classLevel, subjects: string[]}` or `null`. The repository validates matching context and bounded subject strings, deduplicates the response and combines it with current profile subjects and owned saved outlines. Authentication/cancellation is rechecked after the await. Listing subjects does not create/persist curricula. `getSyllabus` remains the graph boundary for textbooks, chapters, topics, concepts, source version and language availability.

New browsing URLs use `catalogueSubject`, `catalogueBoard`, `catalogueLevel`, `book` and `chapter`. The existing `subject` query belongs to the legacy learning route and is deliberately not reused. Unit URLs continue to use `unit`; class-learning URLs retain `fromClass`. Back/refresh/return preserve the source path without a backend request. Stage bootstrap normalizes initial category context once and does not overwrite later stage transitions.

## Verification

- Full regression suite: **478/478 pass**, zero failed/skipped/cancelled. Includes new context normalization, multiple-book separation, current/saved/catalog subject listing, adapter mismatch and post-await access revocation, isolated sample language/source preservation, and teacher objective lineage checks.
- Full ESLint, both TypeScript configurations, production build and whitespace checks pass. Logs: `scripts-tmp/catalogue-20261009-{tests,lint,typecheck,build}.txt`. The suite ran before the last presentation-only breadcrumb and singular chapter-label changes; final lint/types/build and compiled browser checks cover those changes.
- Actual compiled browser: initial no-subject state; multi-book sample; Geometry book -> cube chapter -> refresh -> start -> Teach -> contextual Ask -> same unit -> authored check (27 cubic units) -> Practice (side 4 units) -> Build -> save/reload -> return to original Geometry book/cube chapter. Fraction book shows only its fraction chapter and survives refresh. Manually added Science shows a clearly provisional outline; returning to Mathematics retains both subject cards and authored books.
- Phone390 and desktop1440 book/subject views have no document horizontal overflow. Retained screenshots and measured layouts are in [baseline/catalogue-2026-10-09/README.md](baseline/catalogue-2026-10-09/README.md). Focused browser errors after the final compiled reload are recorded there.

### Explicit local rehearsal data

The existing fictional School personal learner was used. A new authored unit `70a9081f-2dac-4e83-8022-00f63b600a86` has two genuinely submitted demo answers. Private draft project `6cbfa810-cb76-4f22-87b6-7cca9ce4f3b3`, **Design a storage box**, retains a clearly labelled fictional frontend rehearsal document. No criteria or milestones were marked complete, no project was submitted/shared and no guardian permission was changed. Science is a local provisional selection under Sample library, not an authored science curriculum. Earlier design rehearsal records remain intact.

## Acceptance boundaries

This resolves the specific missing multi-subject/book presentation, category onboarding context and reproduced linked return defects. Newly changed populated parent/professional/organization links and all teacher section/history combinations are covered by source/service checks but were not all manually replayed in this integration's browser fixture. Earlier linked-role evidence remains bounded by its original fixture and timestamp. The category ledger records the wider populated/empty/loading/error/revoked-source matrix still to accept.

Native-language review, actual screen-reader/device speech/clipboard/zoom, owner task acceptance, broader course/source fixtures and real content quality remain open. Degree/course preferences do not constitute complete university laboratory, research or administrative workflows. This integration is ready for frontend review against those explicit gates; backend/database and content/model work remains deferred until the agreed frontend gate is accepted.
