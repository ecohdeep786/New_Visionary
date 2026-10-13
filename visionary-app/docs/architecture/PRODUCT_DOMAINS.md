# Frontend-to-service product domains

Shared terminology comes from existing frontend routes and service boundaries. Backend/ML responsibilities include future work; existing imported capabilities and gaps remain in [CONTRACT_GAPS.md](../../integration/CONTRACT_GAPS.md).

| Product job | Frontend ownership under `frontend/src/` | Backend responsibility | ML responsibility |
| --- | --- | --- | --- |
| Account/setup | AuthContext, auth pages, onboarding | Verified account/session, age/role profiles and active workspace | Consume approved learning context |
| Workspaces/connections | workspaceService, Connections, switcher | Membership, consent scopes, expiry/revocation and audit | Honor authorized context and cancellation |
| Learn/content | LearningWorkspace; contentRepository, curriculum/source services | Catalog, source/version/provenance, eligible languages and publication | Permitted ingestion, embedding/retrieval and grounded explanations |
| Ask/Guide | teachingInterface, mentorModelService, backendTransport | Authorized lesson/context, safety, allowed actions and bounded requests | Contextual turns, hints, locale/prompt version and valid sources |
| Practice/checks | Practice, learningPipeline, authored rehearsal | Private attempts, revisions, due review and distinct learning evidence | Reviewed feedback/remediation proposals |
| Build/artifacts | ArtifactStudio, artifact draft/review services | Private projects, criteria, revisions, sharing and submissions | Guided creation/critique tied to permitted concepts |
| Teacher/classroom | Classwork/Class/Learners, classroom services | Owned classes, enrollment, fixed assignments, response/return/revision lifecycle | Reviewed preparation and scoped feedback assistance |
| Parent/reports | Children/ParentReport, summary/report services | Verified child relationship and permitted, expiring summaries | Guidance from authorized summaries only |
| Professional/employer | Career/portfolio, personal/company workspaces | Portable personal records, membership and agreed shares | Context-appropriate learning preserving work/personal boundaries |
| Organization | People/content/curriculum/audit/settings | Least privilege, publication, aggregate suppression and audit | Approved-source and aggregate assistance |
| Progress/Home | Progress, daily-plan/progress services | Trusted evidence and reproducible, distinct progress metrics | Evaluated recommendations with reasons |
| Plans/billing | Plans/Subscription, pricing metadata | Entitlements, billing ownership and server-side usage | Respect permitted usage |
| Privacy/safety/support | Settings/Privacy/Support, access services | Export/delete/retention, consent, safety/report policy | Permitted memory/input/output policy |

Use stable person/workspace/content/source/version identifiers and explicit operation names. Derive actor/permissions server-side. Keep interface/source/input/output languages distinct. Define loading/empty/partial/unavailable/denied/revoked/cancelled/conflict/retry behavior with each operation and preserve drafts on failure.

Personal learning, classroom submissions, teacher ratings, guardian summaries, employer shares and billing retain separate ownership. Model certainty is not learner mastery. Reviewed API/schema contracts belong under `integration/contracts/` when implemented. Tests belong to their component; cross-component scenarios cover explicitly connected flows. The upcoming design discussion chooses deployment units and concrete modules from these responsibilities.
