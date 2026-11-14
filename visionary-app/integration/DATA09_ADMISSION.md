# DATA-09 admission domain contract

Founder clarification in the 8 November 2026 review: **“all age approved.”**
All ages are eligible; the rejected candidate's arbitrary 13-year cutoff is
removed. An eligible minor still needs verified guardian-first admission.
Eligibility is separate from activation and from guardian access to reports.

## Server-owned workflow

`AdmissionRepository` is a durable backend enabler, with no public controller.
The caller must obtain the actor UID from the accepted verified-session boundary.
Reviewer UIDs are copied from server-owned deployment configuration. Request
roles, claimed birth years, parent preferences and payment do not configure trust.
The initial verification mechanism is an independent, configured human reviewer:
the repository records a completed age/relationship review, not an assertion
that a provider, email, parent role or identity document automatically proves it.
Reviewer onboarding and actual operational verification remain release gates.

1. An independent reviewer records a current `adult` or `minor` assurance for
   the canonical existing UID, with an opaque evidence reference and expiry.
   No raw identity document or birth date is collected by this implementation.
2. A currently assured adult requests admission linking to an assured minor.
   Self requests, unknown people and unassured guardians fail closed.
3. An independent configured reviewer, different from both participants,
   reviews the actual relationship and consent for account admission. This
   approval cannot outlive either assurance.
4. The same guardian explicitly confirms the approved relationship. A request
   or review alone never activates a minor. Confirmation records admission
   consent only; reporting, conversation, content, billing and classroom rights
   retain their own purpose-scoped authority.
5. Guardian or configured reviewer can revoke the link. Reviewers can revoke
   assurance. Current expiry, tombstones, reviewer removal, policy and assurance
   revisions are rechecked on admission and authorized transaction callbacks.
   Renewal never revives an old relationship; new review and consent are needed.

Expiry is bounded to 90 days as an engineering freshness ceiling, following the
existing reviewer-mediated institutional approval pattern. It is neither a
legal age rule nor a retention/deletion schedule. Reviews can expire earlier.
Reaching adulthood requires a new reviewed classification; no year arithmetic
or client birthday automatically upgrades authority.

## Transactions, privacy and recovery

Migration 6 adds minimal assurance and guardian-link tables. Native constraints
reinforce state, non-self links, policy and review metadata. Runtime is DML-only;
target/role/privilege checks precede transactions. Canonically ordered person
locks serialize guardian/child assurance, link state and current admission.
Expected revisions reject stale work. Commands, audit and outbox commit together;
unchanged retries return a revision-only receipt after current authorization.
Minimal historical review metadata remains in retained command receipts when a
current assurance is superseded. It is not returned in admission projections.

`withAdmission(uid, callback)` checks current admission and holds owning locks
for DB work in the same bounded transaction. The callback must use that SQL
transaction. Network effects require the owning-domain outbox; a SQL lock is
not distributed rollback. An outbox here is durable pending work, not a claim
that delivery/invalidation workers are installed.

This module installs no automatic verification provider, reviewer trust list,
child onboarding route, guardian notification or permission to inspect a child's
records. Current registered onboarding remains restricted until the separately
reviewed connected replacement is integrated. The backend browser gate tests
that compatibility boundary, while actual SQL tests exercise the full enabler
workflow and deny/revoke/recovery cases.

Connected activation and reviewer operations: DATA-09 cutover with
[ROLE-04 / KAN-96](https://visionary-team.atlassian.net/browse/KAN-96),
[ROLE-07 / KAN-99](https://visionary-team.atlassian.net/browse/KAN-99),
[ROLE-08 / KAN-100](https://visionary-team.atlassian.net/browse/KAN-100),
[SAFE-01 / KAN-151](https://visionary-team.atlassian.net/browse/KAN-151), and
[RELEASE-04 / KAN-127](https://visionary-team.atlassian.net/browse/KAN-127)
remain open acceptance gates. No hosted child release or compliance certification
follows from engineering acceptance of this enabler.
