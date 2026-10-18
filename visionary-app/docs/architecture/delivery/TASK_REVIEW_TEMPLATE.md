# Task review and verification handoff

Copy this structure into the task's Jira review comment or a linked review document. Fill actual values; placeholders never count as evidence. No secrets, payment details or identifiable learner records.

```text
Jira key / source ID:
Acceptance scope: enabler / connected feature / release gate
Implementer (person or agent):
Reviewer: qa-review (record the actual reviewing agent identity; founder for required product decisions):
Worker branch / base commit / candidate head commit:
Current dev commit / comparison range:
Owned files, contracts and migrations:
Prerequisites: live Jira keys and accepted evidence

Acceptance criteria → evidence:
- Criterion / test or inspected outcome / result / environment / artifact or CI link
- Positive, failure, authority and recovery cases relevant to the change
- Frontend → API → backend → data → jobs/ML → cache/observation → device outcome,
  marking each applicable or N/A with a reason; no requirement to invent services

Commands, exit codes, test counts and timestamps:
Remaining defects, limitations and linked open gates:
Hosted verification / migration / rollback evidence, when required by scope:

Reviewer decision: pending / changes requested / approved
Reviewer identity, exact reviewed commit, date and written rationale:
Verification result: pending / failed / passed
Verifier identity, exact verified commit, environment and evidence:
Dev integration commit and checks on the integrated result:
Jira transition/comment receipt:
Next dependent task and proof its other prerequisites are accepted:
```

The implementer supplies evidence and requests review; they cannot approve their own implementation. D-096 assigns independent testing/review to qa-review. That agent can review code and tests, but cannot replace founder/product approval where acceptance requires a human decision. Do not record approval without the actual review. The reviewer may also perform verification; every required product/operational gate still applies. Post the final review in Jira against the exact SHA; the integrator checks live status and records the accepted integration before selecting dependent work.

Use the existing Jira **Testing** status for review and verification. Changes requested return the issue to **In Progress**. New code invalidates the previous approval for the changed candidate and requires review/checks again. Merge conflicts, changed shared contracts or relevant changes on `dev` require renewed integration review.

**Done requires:** accepted scope, separate reviewer approval on the exact candidate, passed relevant verification, accepted `dev` integration and recorded evidence in Jira/current execution receipts. A user-facing launch feature also needs its specified hosted acceptance. `main` promotion and production rollout retain their separate release gates.

The integrator moves the issue to Done only after those conditions, then checks its dependent tasks' remaining blockers. Each worker waits for acceptance before taking its next implementation task. Separately owned, independent tasks with accepted prerequisites may proceed in parallel; they do not bypass the review gate.

This is the delivery policy used by agents and the integrator. It does not install a server-side Jira transition validator, GitHub branch protection or CI enforcement. Jira's current workflow still technically permits manual transitions; no automatic Done or calendar-triggered work is configured.
