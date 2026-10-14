# Visionary product entry — D-066

14 October 2026. The founder clarifies that onboarding introduces a product, asks for visible top progress and larger illustrations, and supplies a Classroom welcome-dialog reference. Use its hierarchy and focused introduction pattern with Visionary's own assets and privacy behavior. Do not copy its implicit contact-sharing language or invent an account-switch dropdown.

## Questions that earn their place

Every user chooses a role, confirms a display name and declares an age range. The age check happens before preferences. It is not identity verification; verified guardian admission is still required for under18 live activation. Default learning language is visibly English and can be changed. It is a preference, separate from interface and source language availability.

| Category | Needed before product entry | Optional or later | Reason |
| --- | --- | --- | --- |
| School learner | Learning focus, board, class; state for a State Board | Subjects/interests; books, routine, goals, notifications later | Locate the appropriate source context without a study-plan interview |
| Higher education learner | Learning focus | Course/degree and subjects; institution, semester, department later | Useful exploration does not require enrollment details |
| Exam learner | Learning focus and target exam | Subjects; attempt year, daily hours, coaching later | Exam choice identifies the starting context |
| Independent learner / professional | Role or learning focus | Skill/goal; employment and portfolio details later | A user can explore before committing to a goal |
| Teacher | Teaching category | Subjects; classes, institution, years of experience, teaching job title later | Start lesson preparation without suggesting a verified classroom exists |
| Parent / guardian | Adult account and role | Family connection, child profile and sharing scopes later | Do not collect child information before an approved relationship |
| Organization | Name and type | People, verification, contact details and curriculum later | Save a starting preference without publishing or granting membership |

## Screen budget and visual structure

Most roles use four screens: Your role → About you → Preferences → Review. Learners use five: Your role → About you → Your focus → Details → Review. Optional details have an explicit Skip for now action. Questions are grouped only when they support the same decision. Dropdowns keep large board/language/exam lists compact. Comma-separated subject inputs preserve the typed buffer while saving a bounded list.

A persistent top step list shows the current screen and completed screens. The progress bar counts completed screens, so review does not claim setup is saved. The shell uses one aligned content width, a large role/step illustration, generous spacing, mobile illustration sizes and sticky navigation with native page scrolling. Use existing first-party SVG assets rather than third-party logos or generated filler. Static headings receive focus for announcements; interactive controls retain visible focus indicators.

## First-use introduction

After successful saved setup, show a centered three-screen welcome dialog over the real dashboard: Welcome to Visionary → Find your next step → You're in control. Show the actual account, a role-specific starting action, preference/privacy entry points and an accurate local-learning boundary. Display one clear primary action per screen with back, close and skip controls.

Use the existing Radix Dialog dependency for modality, focus containment, Escape and focus restoration, following the [WAI modal-dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). The dialog fits short mobile screens with scrollable content and reachable footer controls. Finish or explicitly skip records acknowledgement on the existing authenticated account; Close/Escape only closes the current view. Reopening does not reset saved state. This is an introduction, not acceptance of sharing terms or consent.

## Backend alignment

Keep bounded typed values, verified UID/cookie/Origin/CSRF checks, adult admission, first-completion transactions and account-scoped introduction acknowledgement. Require the minimum fields above; richer valid legacy preferences remain accepted. Do not fabricate goals, course terms, teacher experience, family relationships or organization membership to satisfy old validation. Existing completed profiles are not rewritten. See [connected onboarding](../../../integration/ONBOARDING_CONTRACT.md) and append-only QA for tests and limits.
