# Shared workspace search — D-053

2026-10-10. Continued the frontend completion audit and resolved a concrete cross-page gap: top-bar search previously indexed navigation and legacy learner topics, but could not find current learning activities, saved projects or conversation drafts. The professional prompt promised projects that were absent from its results.

## Delivered behavior

Search now groups current-workspace learning activities, projects, conversations, earlier learner topics and authorized pages. Each result opens the exact saved object. Learning retains its captured source/book/chapter return; conversation links select the requested saved conversation and restore its draft/canvas rather than whichever conversation was most recently active. Invalid conversation IDs fail before writing.

Only titles and subject metadata are indexed. Documents, messages, answer keys, drafts and another workspace's records are excluded from matching. Workspace snapshot authorization applies before reading saved results. Company revocation fails closed; organization route permissions are checked again when opening a result. Removed saved objects are rechecked at click time. Changing person/workspace remounts the top bar, clearing the former search state.

Unreadable learning records produce a partial-result notice and Retry, retaining readable projects/conversations and original records. Legacy-topic loading/failure is explicit. Search does not claim to query an unavailable backend catalog, every person/cohort, or unsaved editor backups. Organization prompt now accurately describes pages/tools.

Multi-word matching normalizes case/width, ranks exact titles first and deduplicates destinations. The initial view shows up to six saved items and eight pages; typed queries show up to 24 matches. The count explicitly says Results shown. Groups, icons, wrapping titles, a fixed query field, scrollable results and generous action targets follow the existing internal design system. Clear returns focus to the field; Ctrl/Command+K opens search; Tab/Enter operate native controls; Escape returns to the trigger; opening a result focuses main. All new copy is available in en/hi/bn. Recorded learning language is retained on activity titles.

## Code and checks

- `workspaceSearchService.ts`: authorized saved-title read boundary with partial learning recovery.
- `workspaceSearch.js`: matching/ranking/deduplication.
- `WorkspaceSearch.jsx`, `DashboardTopbar.jsx`, `DashboardLayout.jsx`: grouped dialog, recovery, context reset and keyboard focus.
- `guideEntryService.ts`, `Guide.jsx`: exact conversation URL entry.
- `workspaceSearchCopy.js`, `workspace-design.css`: localized states and responsive layout.
- `tests/workspace-search.test.mjs`: seven behavior regressions, including private-body exclusion, exact deep links/drafts, isolated/forged contexts, unreadable records, matching and revoked company access.

490/490 full regressions pass with zero failed/skipped/cancelled (181815ms). Full lint, both type configurations and production build pass. A final wording-only correction to Results shown was followed by seven focused tests, lint and a fresh build (2m6s); no service logic changed after the full suite. Whitespace checks pass. Logs: `scripts-tmp/search-completion-20261010-{tests,focused,lint,typecheck,build}.txt`.

## Rendered evidence

Twenty compiled observations include seven from the final `index-CtpcUbPc.js` document. Exact project, learning and conversation links, conversation reload, private-text no-match, Ctrl+K, Tab/Enter, Escape/trigger focus, four-role exclusion and secondary Notifications discovery were exercised. English/Hindi/Bengali and 1280/390/requested-320-measured-321 widths have no document overflow. Final browser errors after reload are empty; historical asset mismatch during rebuilding is retained separately. See [the evidence index](baseline/search-completion-2026-10-10/README.md).

Fictional Anika learner on isolated port 5176 now retains one clearly labelled private search project, one unscored authored cube activity and one unsent contextual draft. No message was sent, assessment answered, completion marked, artifact shared, permission changed or payment made. Fixture interface language was restored to English. Original port 5173 learner records/server were preserved and Home/default viewport restored. Temporary preview was stopped.

## Frontend completion boundary

The shared saved-work search gap is resolved. This is not a full acceptance result for every category/state. The category ledger, frontend acceptance matrix and human/device worksheet still require broader populated/failed/withdrawn-source linked-role cases, native-language reviewers, screen-reader/actual-zoom/physical-device tasks and owner/representative-user acceptance. This run adds meaningful implementation and regression coverage; it does not turn those remaining tasks into passes. Backend and model integration remain deferred.
