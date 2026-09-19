# Connection completeness matrix (closes "connected but not fully")
For EACH pair: relationship type · init flow · what A sees of B · what B sees of A · screens · states · acceptance test.

| Pair | Init | A sees | B sees | Screens | Gap to close |
|---|---|---|---|---|---|
| Student↔Teacher (independent) | request/accept, scope+expiry; minor→guardian approval | teacher tab: activity, feedback, resources | authorized evidence, misconceptions, assigned work; NEVER private doubts | student org/teacher tab · teacher Learners | add minor-approval fixture + test |
| Student↔Org | invite/join/roster | org space: classes, assigned, schedule, feedback, announcements, "what my teacher is teaching this week" | cohort insights, assignment status, adoption | student org space · admin Insights | add teacher-activity feed item |
| Teacher↔Org | verified-domain/admin invite | classes/cohorts, org resources/policy, announcements | prep/adoption activity, content reviews | teacher Classes · admin People/Cohorts | audit-log entry per membership change |
| Parent↔Child | invite+verify | plain-language report, practice/retention, projects, org work, transitions | connection visibility ("who can see my summary") | parent Children/Reports · student privacy notice | add child-side visibility card |
| Parent↔Teacher/Org (indirect) | derived, no direct chat | teacher/org updates digest, suggested questions to ask teacher | nothing of parent except consent/notification scope | parent Home/Reports | **add Insight event pipeline: teacher assign/feedback → parent-visible update fixture** |
| Teacher↔Learner (in org) | cohort/assignment scope | roster, evidence timeline, feedback queue | assignment, feedback, class stream | teacher Classes/Learners | aggregate "learners needing attention" from doubt+practice evidence (privacy-safe) |
| Professional↔Company Org | membership | assigned skills/projects only | assigned activity, submitted artifacts, agreed evidence | professional org space · admin Insights | boundary warning before artifact move |
| Guardian↔Guardian (family) | family manager invite | billing, member list | own profile only | Plans/family | payer ≠ guardian assertion test |
| Teacher↔Teacher (peer/market) | library share / marketplace | listings, licenses, ratings | same | Library/Marketplace | moderation states already specced |

Uniform requirements (the "not fully" fixes):
1. Shared /connections center for EVERY role (not only Parent): list all relationships with
   type, scope, approver, expiry, state + actions (approve/decline/remove/renew).
2. Connection lifecycle events appear in each role's Notifications (invite received/accepted/
   expired/removed) with deterministic fixtures.
3. Org-side audit log records every membership/permission mutation.
4. Fixture coverage: at least one seeded instance of EVERY pair above across the 12 personas
   (add: independent-teacher↔minor-student with guardian approval; parent↔teacher update digest).
5. Acceptance tests per pair added to MASTER §21.3 (request→accept→scope-check→expire→remove).
6. Fixture-removal checklist for backend phase: every mock connection record maps to a
   ConnectionService endpoint in MASTER §23; delete-with-backend list maintained in STATUS.md.