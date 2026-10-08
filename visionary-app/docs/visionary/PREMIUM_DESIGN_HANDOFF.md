# Internal design handoff — D-047

Implemented 2026-10-08 for the learner, teacher, parent, professional and organization workspaces. This completes the current shared visual-system implementation pass. Whole-product acceptance and backend work remain separate.

## Design direction

Use space and typography to establish hierarchy, blue for interaction and selection, and neutral surfaces for content. Keep one clear next task on Home. Retain Visionary's own illustrations and existing source-aware journeys rather than introducing a second visual identity.

The authenticated shell now uses a labelled 240px desktop navigation, grouped secondary destinations, and an accessible More control on compact layouts. Expanded navigation starts at 1200px; phone navigation retains the existing primary destinations and More sheet. Page widths, gutters, heading roles, icon strokes, fields, tables, list rows, cards and dialogs share a scoped design layer. Public landing styles are independent. One build repair removed an unused shared-component import from CollegePage.jsx that duplicated its existing local declarations; other concurrent public edits were preserved.

Controls use 12px corners, panels generally 20px, and primary controls have 44–46px minimum height. Desktop page padding is 48px; phone content uses 20px horizontal gutters. Short opacity transitions and interaction feedback respect reduced motion. Hindi/Bengali headings retain natural tracking and line spacing. This does not certify native-language typography on every device.

## Applied coverage

| Workspace | Primary sections and related surfaces |
| --- | --- |
| Learner | Home, Learn/subject/chapter/representation, Ask, Practice, Build, classes, connections and progress |
| Teacher | Home, Prepare, classes and their Stream/Classwork/Curriculum/People/Insights/Community sections, learners, insights, growth, library and review |
| Parent | Home, children, reports, connections and contextual support |
| Professional | Home, Learn, Ask, Practice, Build, Career, classes, connections and progress |
| Organization | Home, people, cohorts, curriculum, content, insights, audit and seats/billing |
| Shared | Notifications, personalization, privacy, plans/usage, navigation, search, forms, dialogs and empty states |

These existing consumers inherit the shared design system; this is not a claim that every component or permission/error permutation was independently rewritten or accepted. Empty states in tools, classes, learners, children, notifications, organization content and practice now use the existing Visionary artwork with a clear action where available. Teacher review feedback has a labelled full-width multiline field, preserving its existing draft and submission handlers.

## Verification and evidence

The full service suite passed **462/462** during this pass. Final production build, ESLint, both TypeScript configurations and whitespace validation are recorded in QA.md. The final review-field refinement changes layout/input presentation; service behavior remains covered by the existing regression suite.

Browser inspection traversed the primary and secondary role destinations on desktop and narrow phone layouts. Successfully rendered screens showed no document/main horizontal overflow in the measured samples. Populated fixture checks covered the cube lesson and its text alternative, classroom assignment, roster and existing review dialog. Fixtures are fictional, local records. No invitation, grade, permission change or payment was submitted.

See [capture index](baseline/premium-system-2026-10-08/README.md). Several long browser batches timed out and reset the automation session; their complete raw route arrays were not retained. They are not represented as a reproducible exhaustive acceptance matrix. The retained screenshots and focused observations are the evidence for this handoff.

## Remaining acceptance and next work

Owner visual review, native English/Hindi/Bengali review, physical devices, screen readers, browser zoom and voice/audio remain open, alongside wider source/permission/legacy states in FRONTEND_REVIEW_WORKSHEET.md. No claim of Google/Apple product parity, release readiness or AGI acceptance follows from a visual pass.

The next content rehearsal is the user's Chapter 1: academy subject → chapter → authored learning sequence → appropriate interactive representation → contextual Ask → checks/practice → connected Build. The actual chapter determines the model and activities; the cube sample does not establish automatic conversion of arbitrary books. Backend integration remains deferred until that journey is reviewed.

Official design references: [Apple layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Apple typography](https://developer.apple.com/design/human-interface-guidelines/typography), [Apple motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Material foundations](https://m3.material.io/foundations/) and [Material type application](https://m3.material.io/styles/typography/applying-type).
