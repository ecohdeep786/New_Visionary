# Principal design and usability review

2026-10-10 · D-051. Internal frontend only. The review covers the five workspace roles and the supported stage/setup choices in [the category ledger](CATEGORY_FLOW_ACCEPTANCE_2026_10_09.md). It uses the existing Visionary illustrations, icons and visual tokens. Public-site edits belong to concurrent work and were preserved.

## Delivered improvements

- **An easier first choice for emerging readers.** Foundational learner navigation starts with Home, Learn and Ask. Practice and Build remain available through More and the connected learning flow. Phone targets are 60px; principal controls are at least 52px. Books become readable horizontal rows on phones. Other learner stages and adult roles retain their full navigation.
- **Content before configuration.** Learn places available subjects, books, chapters and concepts before the optional source chooser and demonstration launcher. Foundational learners see “Let’s learn” and a short instruction. Missing content still exposes setup; no official curriculum is invented.
- **One clear continuation on Home.** The current plan-removal action lives under Change plan rather than competing with Continue. Its existing explicit label and removal behavior remain. Other plan rows put Open before the quieter Not today action.
- **Consistent deeper controls.** Child history, classroom growth, class/child connections, Build outline return, cohort roster actions and audit recovery have larger action areas. More visibly indicates a secondary phone destination. Class section styling recognizes the actual pressed state.
- **A useful Ask canvas.** The lesson starts at the top of the adjoining canvas instead of leaving a large vertically centered blank area.
- **Recoverable app updates.** A stale stylesheet/lazy-import error offers Reload page; another render cannot resolve a rejected asset import. Ordinary errors keep retry. Internal error copy does not promise unsaved work survived.
- **Accurate demonstration categories.** Exam, higher-education and professional demo accounts now seed their missing stage. Re-entering a demo preserves subsequent stage changes. They contain no inferred subjects, board catalog or readiness assessment.

The design direction follows progressive disclosure and task-first hierarchy described in [Apple disclosure guidance](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls), [Material layouts](https://m3.material.io/foundations/layout/canonical-examples/overview) and [Material typography](https://m3.material.io/styles/typography/applying-type). Those references guide judgment; this result is not Apple/Google certification.

## Category and section coverage

The initial source-mode browser review retained **50 route observations**. Three captured loading shells (learner Build, teacher Build and professional Classes) are excluded as acceptance evidence. The other 47 include real empty and populated views; the file is a chronological observation record, not an all-before screenshot baseline. Some observations occurred while source changes hot-reloaded.

| Category | Pages/sections reviewed | Scope of verification |
| --- | --- | --- |
| Learner | Home, Learn, Ask, Practice, Build, Classes, Progress; subject/book/chapter/concept navigation; shared settings | Foundational phone navigation and two-book outline exercised; More -> Build exercised. Exam and higher-education demo stage labels separately verified. Existing category/source regressions cover developing, secondary, higher-secondary, vocational and independent stages. Every stage does not have a separately populated manual browser run. |
| Teacher | Home, Prepare, Classes, Learners, Insights, Growth, Library, Ask; class sections | Personal and connected Work views checked separately. Work class -> Classwork -> reload -> People -> Curriculum exercised using an actual demo class, assignment and roster. No assignment/review or announcement was submitted in this pass. |
| Parent | Home, Children, Reports, Connections, Ask, Notifications, Privacy, Plans | Two permitted children checked. Maya + 30 days -> contextual Ask preserves identity and return context. Empty shared evidence remains empty rather than a fabricated score. Mother/father/guardian labels share this permission model. |
| Professional | Home, Career, Learn, Practice, Build, Progress, Connections, Ask | Personal versus employer Work boundaries inspected. Existing service regressions cover sponsored-source revocation, career recovery and portfolio review. No live jobs, interviews or external review are added. |
| Organization | Home, People, Cohorts, Curriculum, Library, Analytics, Audit, Settings, Seats, Connections | Owner views and populated demo membership reviewed; current permission filters remain. School/company setup types and delegated policies are covered by the existing category/policy ledger and regressions, not a separate real institution deployment. |
| Shared | Settings, Personalization, Privacy, Notifications, Profile, Support, Plans; navigation, source retry and error boundary | Existing route/service checks retained. The new helper tests verify route preservation, More state, immutable navigation inputs and asset-failure classification. Small inline prose links are not treated as primary controls. |

Higher-education institution variants, teacher faculty/coaching/independent variants, parent relationship labels and organization institution types use the existing explicit setup/context policies. This pass does not invent dedicated research/thesis, admissions, HR or clinical workflows for labels that currently share a supported route.

## Validation and remaining acceptance

Final code checks: **483/483 regressions pass**, no failed/skipped/cancelled tests; full lint, both type checks and production build pass. Logs are `scripts-tmp/principal-review-20261010-{tests,lint,typecheck,build}.txt`. New stage regression checks the observed demo mismatch and preservation of later changes. Earlier source/content/consent/draft/conflict tests remain intact.

Evidence is indexed in [the review evidence directory](baseline/principal-review-2026-10-10/README.md). Browser observations distinguish source mode, final compiled checks, empty states and populated fictional records. The user’s original workspace and normal viewport are restored after review. No external communication, payment, publication or backend integration is performed.

This is a completed implementation/review pass, not whole-product launch acceptance. Native screen readers, physical devices, zoom, all language/state combinations and representative users still need the tasks in the existing acceptance worksheet. A two-year-old needs adult-supported testing and an age-appropriate product mode; larger targets and fewer choices alone cannot establish independent usability. Chemistry Chapter 1 authoring and its real representations remain as documented in the source analysis. Backend work remains deferred pending the agreed frontend acceptance gates.
