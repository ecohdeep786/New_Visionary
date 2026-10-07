# Reference-driven internal design handoff — 2026-10-07

D-046 follows the founder's request to inspect local JPEG references and complete the internal design. All six were inspected individually in C:/Users/Administrator/Downloads; C:/download does not exist. The supplied screens are Google Classroom, rather than separate Apple references. Their layout principles inform Visionary's own interface; no reference assets, logos or illustrations were copied into the app.

## Reference observations and implementation

| JPEG suffix (all start Screenshot_7-10-2026_) | Screen / useful pattern | Applied in Visionary |
| --- | --- | --- |
| 173455_refero.design.jpeg | Centered welcome dialog, one action, separate disclosure | Preserve focused dialogs, clear primary actions and keyboard close; review classroom dialog behavior |
| 173533_refero.design.jpeg | Classwork tabs, restrained rows, consistent reading edge | White class heading and code panel; section navigation immediately follows the heading; aligned assignment rows; Review stays visible while lifecycle actions sit in a disclosure |
| 173623_refero.design.jpeg | Teacher/student sections, counts, aligned membership rows | Semantic teacher/student headings, readable names/emails and status; invitation form opens from Invite students |
| 17364_refero.design.jpeg | Useful illustrated empty state with a clear next step | Existing Visionary study/teach/teamwork/build artwork on empty class, assignment, people and project surfaces |
| 173649_refero.design.jpeg | Quiet grouped settings, clear field labels | Shared restrained 12–16px form/card surfaces and consistent settings reading width; settings review and recovery controls retained |
| 173811_refero.design.jpeg | Open white shell, stable navigation, focused first task | Remove the outer floating workspace frame, decorative Home orbit and intro sculptures; retain labels, active states and a quiet next-step panel |

## Result across roles

All five roles use the same white shell, reading width, focus treatment and responsive spacing. Home's optional role summary uses section dividers. Learn and Build have open headers. Chapters use ordered, full-width rows that keep selection and existing chapter/concept continuation. Learner and teacher class pages share the reading edge. Teacher Classes hides empty metrics, retains actual teaching insight/counts, and collapses the optional growth suggestion. Class promotion remains available below classroom content instead of interrupting the heading and section navigation.

Connections and organization People use divided rows and plain empty messages. A keyboard-accessible invitation disclosure keeps the initial list focused; existing scope, approval, expiry, history, permission and recovery controls remain available. Existing product illustrations are imported without modifying the public illustration component. Square art retains a square viewport. No public source or backend service was changed by this pass.

## Validation and evidence

462/462 regression tests pass. Final full lint, both type checks, production build and diff whitespace check pass. Logs are in scripts-tmp/reference-design-{tests,lint,types,build}.txt.

The [capture index](baseline/reference-design-2026-10-07/README.md) and layout-checks.json retain 93 successful layout observations: 70 development and 23 compiled-preview checks, with no measured document/main horizontal overflow. Home covers five roles at requested 320/390/768/1440px in each mode. Primary-route checks cover the visible role navigation at 390/1440px in development. Compiled checks also cover organization settings, Build and selected chapter rows. Some requested 320/768 overrides report 321/769 CSS pixels from browser scaling.

Actual UI checks include chapter selection and saved concept resume, class section changes, Invite students keyboard open/close, assignment lifecycle disclosure keyboard open/close, existing submission Review dialog and Escape close, assignment form cancellation, organization invitation disclosure keyboard collapse and settings layout. No invitation, grade, promotion, permission or source content was submitted during this review. Final captured browser error log is empty. The original School demo account / personal learner Home is restored, temporary viewport overrides are reset, and port 5173 serves the final compiled preview.

The same fictional School learner/cube fixture provides the before Home and final after Home. The before viewport is 1440×1000 and final desktop captures are 1440×900. Classroom captures use Dev's existing Work teacher workspace, connected Aarav enrollment and submitted cube assignment; School's personal teacher Home has no assigned class. Do not compare them as the same classroom fixture.

This completes this reference-driven implementation pass. Final owner visual review, broader source/state coverage and native-language/device/accessibility review remain in FRONTEND_ACCEPTANCE_MATRIX.md and FRONTEND_REVIEW_WORKSHEET.md. Backend work remains deferred. The founder's Chapter 1 is the next content rehearsal: subject → chapter → concept representation → Ask → check/practice → project, using 3D where it explains the source. This work does not establish general book-to-3D generation, AGI or production parity with Google/Apple.
