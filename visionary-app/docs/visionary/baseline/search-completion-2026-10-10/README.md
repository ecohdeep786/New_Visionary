# Shared search evidence — 2026-10-10

[D-053 implementation handoff](../../SHARED_SEARCH_HANDOFF_2026_10_10.md). Fictional local data; original user records were not edited.

| Artifact | Actual coverage |
| --- | --- |
| `observations.json` | 20 rendered compiled observations. First 13 use index-BIpwBhTS.js. Last seven, labelled final, use index-CtpcUbPc.js after the result-count wording refinement. Both are compiled; no development captures are counted. |
| `search-desktop.png` | Final 1280×720 grouped populated search. Query and footer remain fixed while results scroll. |
| `search-phone.png` | Final 390×844 search with reachable close/query/result controls. |
| `search-hindi.png` | Final 1280×720 Hindi interface with unchanged English authored sample title/subject. |
| `search-bengali-narrow.png` | Final requested320×740, measured321px viewport. Actual document width is321; dialog approximately289px. Titles wrap without page overflow. |
| `conversation-retained-draft.png` | Final exact contextual conversation after search, with the original unsent fictional text. |
| `final-verification.json` | Final URL/assets, exact draft value, main focus and original-unit return URL. |
| `browser-errors.json` | Historical captured errors are preserved. Zero errors after the final document reload timestamp. |

Fixture: Anika · Parent of two, Personal Learner on isolated port5176. UI-created private project `58a3c09b-f9f9-443b-931f-896164a2f2a7`, title Frontend search rehearsal; body includes Bluebird blueprint. Authored Geometry workbook/cube activity `8a2556c1-885d-432f-86aa-75a7b50ebfc6`; contextual conversation `2e429fe6-61ae-43ae-974e-e3d0ef6c8f49` with an unsent bluebird draft. Searching bluebird gives no result; searching the title opens each exact object. No teaching response/assessment/completion was requested for this activity. Source/book/chapter return remains associated with the sample.

Actual interaction: create/save private project → authored multi-book outline → Geometry workbook → cube chapter → Start activity → contextual Ask → type unsent draft → Home → search → no-match for private word → clear → Enter project → search activity by cube math → Tab through clear to activity → Enter → search conversation → Enter → exact draft/canvas → reload. Ctrl+K opens; Escape restores trigger focus. Parent/teacher/professional/organization searches for cube yield zero matches. Secondary Notifications page is discoverable through a typed query and opens with main focus. Local en→hi→bn→en changes preserve saved content; native-language meaning and real device acceptance are not inferred.

The initial preview used the earlier D-052 build while creating the project. Rebuilding replaced its lazy assets, so the app's existing Reload page recovery was used. Subsequent observations verify actual compiled script names; loading/error captures were not counted. The final wording-only rebuild was explicitly reloaded before final captures.

Checks:490 full regressions; seven focused checks after the copy adjustment; full lint, both type configurations and final build pass. Service-only coverage includes unreadable records, forged ownership and revoked company membership; those fault cases were not manually injected/rendered here. No new successful tab attachment was created; the existing user tab was reused and restored to original port5173 learner Home/default viewport. Temporary preview stopped. Existing dependency junction retained.
