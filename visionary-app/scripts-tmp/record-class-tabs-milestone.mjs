import fs from 'node:fs';
const root='docs/visionary/';const date='2026-10-03';
const summary=`

## ${date} — Teacher class tabs and recorded assessment

Stream, People, Classwork, Insights, teacher review, class promotion and class community now use en/hi/bn controls. Authored announcements, instructions, concepts, responses, feedback, criterion labels and promotion reasons retain their original language; status/criterion-rating protocol values remain unchanged. Known UI errors localize; original service errors remain English with language attribution.

Class record reads use request generations, unmount cancellation and workspace/storage refresh. Failed reads hide stale class updates, rosters and insight summaries without replacing original bytes or presenting a false empty state. Retry restores the view. Announcement, invitation, assignment and community failed writes retain their drafts. Busy controls prevent edits from being lost during a pending save. Closed enrollment records show their actual state, including Left/Inactive, instead of a false Invited label; existing closed records are retained and the teacher is directed to share the class code rather than creating duplicate enrollment records.

A shared recorded-score summary validates finite grades, positive point totals, matching assignments and learner identifiers; real zero remains valid, while absent/invalid scores are excluded and disclosed. Duplicate concept tags count each assignment once. Map-backed aggregation accepts authored keys such as __proto__ safely. Class averages and learner heatmap use the same evidence. Heatmap score bands describe numbers rather than mastery, show numeric percentages, have table headers/caption and a keyboard-scrollable region, and use dark text on pale cell backgrounds. AI analysis remains explicitly unconnected; Refresh reads local class records and does not automatically invoke a model.

Teachers can now remove a reported community post directly while it remains hidden from learners. The service still checks the assigned teacher; removed posts cannot be restored through the reported-post control. A regression verifies denied learner moderation preserves bytes and interaction events omit post text. Community source/access failures hide posts, disable posting, retain drafts and expose Retry. Workspace/storage changes recheck the current view.

Final snapshot: visionary-class-tabs-final4-20261003. Full suite 366/366; build, full lint, both typechecks and final assessment JSX lint pass. All three language browser journeys pass failed-write retention, source retry/byte preservation, closed membership, 70% recorded score with missing-score exclusion, unique coverage, localized review/promotion/community and reported-post removal. Each tests 320/390/768/1440px with reduced motion and no page errors. Separate en/hi/bn promotion journeys prove failed notice writes roll back class 8 to class 7, retain reason/level inputs, then save a localized result on retry with the original reason. Teacher→learner persisted review draft→revision→resubmission→return→scoped parent digest→revocation regression passes. All74 five-role route checks pass.

Evidence: scripts-tmp/class-tabs-final3-tests.txt; class-tabs-final4-build.txt; class-tabs-final3-lint.txt, types-js.txt and types-domain.txt; class-tabs-final4-lint.txt, browser.txt, promotion.txt, review.txt and routes.txt. class-insights-hi.png inspected for localized layout; authored concept labels stay unchanged.

These are bounded local acceptance results. Whole frontend acceptance remains OPEN for organization source authoring, remaining shared controls, broader legacy/source/state reconciliation and native/assistive-technology acceptance. Public source work is preserved. No backend, book request, production authentication, payment or model connection is added.
`;
for(const file of ['STATUS.md','QA.md'])fs.appendFileSync(root+file,summary);
fs.appendFileSync(root+'DECISIONS.md',`

### D-023 — ${date}: Recorded class assessment and localized class controls

Use one validated summary for concept assessment and the learner heatmap. Missing grades are unavailable evidence, never invented zero; genuine zero is valid. Each assignment counts once per authored topic. Score bands do not establish mastery. AI class analysis is explicitly unconnected and class refresh reads recorded work without an automatic model call. Failed source reads hide stale evidence, preserve stored originals and offer Retry. Interface localization preserves authored text, source revisions and protocol values. Teachers may remove reported posts directly without first restoring learner visibility; existing class authority and privacy checks apply. Full frontend acceptance remains open.
`);
fs.appendFileSync(root+'BACKEND_CONTRACT.md',`

### ${date} — Class-tab frontend continuity

D-023 adds one validated recorded-score summary, localized class controls and teacher moderation of reported posts. Preserve absent-versus-zero grades, positive original point totals, assignment/learner scope, unique authored topic coverage and fixed source text. Fetch failure must hide stale evidence without replacing records; retry must preserve composer/review inputs. Model analysis remains unconnected. Reported posts stay hidden for learners during direct teacher removal; removed posts are not restored via the reported-post action. Browser-local tests are not backend or production authorization acceptance.
`);
fs.appendFileSync(root+'PRODUCT_GATE.md',`

### ${date} — Class-tab evidence update

Teacher class Stream/People/Classwork/Insights/review/promotion/community local flows pass in en/hi/bn. Shared summary excludes invalid grades, distinguishes real zero, deduplicates concept coverage and makes no mastery claim. Failed source recovery, failed-write draft retention, reported-post moderation and promotion rollback/retry pass. Final class snapshot: visionary-class-tabs-final4-20261003;366 tests and74 route checks pass, plus build/lint/types and teacher–learner–parent review regression. Whole frontend gate remains OPEN; broader organization/shared/legacy/native acceptance still required.
`);
fs.appendFileSync(root+'CURRENT_PRODUCT_STATUS.md',summary.replace('## '+date+' — Teacher class tabs and recorded assessment','## Latest verified milestone — Teacher class tabs and recorded assessment'));
