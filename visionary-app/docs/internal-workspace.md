# Visionary internal workspace

## Product model

Visionary is a personal learning and building workspace, not a course storefront. A learner's personal space survives joining classes or organizations. Professional and independent learners use the learner identity with an appropriate onboarding stage, rather than a separate silo. Teachers and parents retain their own learning and project space.

The shared shell uses a restrained white workspace, role-specific navigation, contextual add/connect action, search, and one account menu for profile, settings, connections, plans, and sign-out. Mobile navigation uses a labelled, keyboard-accessible drawer. Signed-in root and authentication entry points return to onboarding or the dashboard, not the marketing landing page.

## Frontend architecture

- `src/api/appClient.js` is the replaceable local repository. Personal entities are scoped to the current account. React Query workspace keys and workspace-change events refresh connected screens.
- `src/lib/dashboardNavigation.js` defines role navigation and page availability.
- `src/lib/learningMetrics.js` derives progress without writing during reads. Dashboard visits do not create study logs. Grades are normalized against assignment points; starting confidence is not assessed mastery.
- `src/lib/learningProfile.js` initializes missing learning areas idempotently before onboarding completion.
- `src/lib/productAccess.js` is the common source for the preview's Free plan and unavailable billing/model state. It must not become the authority for production entitlements.
- Learn, Ask, Practice, and Build pass subject/topic context. Questions and project notebooks persist privately. The cube lab and its example practice work without an AI service; arbitrary generated lessons and responses do not pretend to work.

## Connection boundaries

Enrollment joins a learner to a class. Classwork, submissions, grading, and feedback connect student and teacher views. Organization membership needs recipient acceptance; accepted teachers choose independent teaching or a connected organization when creating a class. Organization analytics count explicitly linked classes and accepted people, not pending invitations.

FamilyLink requires acceptance before the parent repository can read shared learning areas, topics, and study logs. Questions and projects are not included. Disconnecting revokes that preview read path. General connections record a relationship; they do not implement messaging or grant access to private work.

These are frontend workflow boundaries, **not a security boundary**. Browser storage can be inspected or modified, and relational entities still require server-side authorization. Never deploy this adapter with real learner records.

## Verification performed, 2026-09-13

Automated regression coverage: six Node tests for read-only metrics, normalized grades, real-activity streaks, practice scoring, internal-only auth return paths, personal account isolation, family consent/revocation, unavailable AI, and idempotent onboarding. Lint and TypeScript checks also pass.

Browser QA used fictional accounts and browser-local data:

- Added learning areas/topics, saved a question and bookmark, used cube controls, saved a lab topic, created a contextual project, and completed the three-question example practice.
- Created a teacher class and assignment, checked invalid/valid join codes, submitted as a student, and returned teacher feedback. A grade of 60/50 was rejected; 40/50 rendered as 80% in assessment insights and the heatmap.
- Requested a parent connection, accepted as the learner, and confirmed the parent shared-progress empty state rendered without runtime errors.
- Invited a teacher to an organization, accepted the invitation, created a linked class, and verified organization analytics included that class but excluded the teacher's independent class.
- Checked mobile Home/Learn at 390px: no document horizontal overflow, drawer navigation closes on selection, and the account menu exposes settings. Saved Tamil as a preference and verified persistence after root navigation.
- Verified signed-in `/` redirects to `/dashboard/home`, and sign-out ends at `/login`.

This is targeted frontend QA, not exhaustive accessibility, browser compatibility, load, security, or pedagogical validation. The temporary local account-fixture page was removed after testing.

## Required before production launch

1. Replace local auth with verified Firebase/GCP or another chosen provider, including real verification, recovery, session expiration, and provider sign-in. Enforce all ownership, membership, class access, and family consent on the server; add audit trails and revoke access consistently.
2. Replace local entities with a database/API, migrations, pagination, concurrency handling, retention, backups, and cross-device invitation delivery. Evaluate guardian verification and age-appropriate consent before using real child data.
3. Connect the PA model behind a server boundary with streaming/cancellation, language evaluation, safety controls, grounded learning content, cost limits, and explicit failure states. Current interface language is English; saving a preferred language does not translate the interface.
4. Define verified Free/Premium allowances and connect checkout, server-verified webhooks, idempotent entitlement changes, metering, refunds/cancellation, and billing history. No payment or quota consumption occurs in this preview.
5. Define ad placements and age-appropriate protections, then integrate delivery without interrupting lesson focus or disclosing private learner data. Ads are planned, not currently served.
6. Complete production accessibility, responsive/browser coverage, security/privacy review, observability, performance testing, and recovery drills. No claim of launch readiness is made until these integrations and checks are complete.
