# Backend/ML lane readiness package — 2026-11-19

**Purpose:** turn the accepted frontend handoff contracts into per-lane,
implementation-ready tickets with acceptance criteria and the exact frontend
surface each service unlocks — so the next phase can start without
re-deriving anything. **Owner of this document:** Head of Frontend (the
frontend side is complete and waiting; the tickets are the backend/ML
owners' to execute).

**Source contracts (authoritative, do not re-derive):**
- `FHE07_08_CONTENT_TEACHING_HANDOFF.md` — catalogue (data lane) + grounded teaching turn (ML lane)
- `FHE10_12_BUILD_CLASSROOM_HANDOFF.md` — durable Build + classroom authority (data lane)
- `FHE13_16_ROLES_EVENTS_HANDOFF.md` — guardian, professional, organization, cross-role events (data lane)
- The frontend adapters for all of the above are implemented and idle: the honest rooms flip to connected surfaces when each service registers.

---

## Lane 1 — backend data lane (highest unlock; five tickets)

### T1 · Published curriculum catalogue (FHE07/08 Part A)
- **Build:** `GET /api/account/learning/catalog` per the contract's response shape and A2 invariants (owner-source qualification, version pinning, no inferred coverage).
- **Acceptance:** a signed-in student receives a server-owned catalogue; every A2 invariant passes the backend's own tests; the frontend flips `/dashboard/learn` + `/dashboard/learn/:topicId` from honest rooms to the connected catalogue viewer with zero frontend edits (the adapter is wired to the honest-room's data seam).
- **Unlocks:** the learning journey's entry surface for student + professional.

### T2 · Durable Build: projects, revisions, controlled sharing (FHE10/12 Part A)
- **Build:** the project/revision/share endpoints per the domain model and A2 invariants (private by default, explicit share, server-side provenance).
- **Acceptance:** a project created on device A is readable on device B after hard reload; revocation removes visibility immediately; every A2 invariant passes.
- **Unlocks:** `/dashboard/build` + the professional portfolio seam (C14).

### T3 · Classroom authority: classes, assignments, classwork lifecycle (FHE10/12 Part B)
- **Build:** class/membership authority, assignment publication, submissions and review per B1–B3 (teacher authority verified server-side; role scope enforced on every read).
- **Acceptance:** a teacher assigns, a student submits, the teacher reviews, the student sees feedback and may revise — with server-owned history at every step (the C12 release command chain).
- **Unlocks:** `/dashboard/classes`, `/dashboard/class/:classId`, the teacher's prepare/classes/learners surfaces.

### T4 · Guardian relationships + permitted summaries (FHE13-16 Part A)
- **Build:** the relationship endpoints per A2 (pending/7-day expiry, accept/decline/renew/revoke, the three summary reads — computed server-side, never client-calculated).
- **Acceptance:** a verified guardian sees ONLY the progress-summary scope; revocation ends visibility mid-session (fail closed); family billing never grants authority (A3).
- **Unlocks:** `/dashboard/child` + `/dashboard/reports` for the parent role.

### T5 · Organization people, cohorts, curriculum, governance (FHE13-16 Part C)
- **Build:** people/cohorts/curriculum-publication/governance endpoints per Part C (scoped member listing, audited permissions, verified group creation).
- **Acceptance:** an organization admin provisions people and cohorts with audited permissions; aggregate analytics expose nothing about private learner work.
- **Unlocks:** `/dashboard/people`, `/dashboard/cohorts`, `/dashboard/curriculum`, `/dashboard/analytics`, `/dashboard/library` for the organization role.

## Lane 2 — ML lane (depends on Lane 1's transport idiom, not its data)

### T6 · Grounded teaching model turn (FHE07/08 Part B)
- **Build:** `POST /api/account/learning/sessions/:sessionId/guide-turn` per B1/B2 (grounded in the learner's own records, abstention supported, session-bound, no cross-account context, cancellation honoured).
- **Acceptance:** a teaching turn grounds in server-owned records only; abstention and cancellation behave per contract; B2's safety invariants pass.
- **Unlocks:** `/dashboard/ask` (the Guide conversation) for every role.

## Lane 3 — cross-role events (small; ride Lane 1's infrastructure)

### T7 · Notifications and cross-role events (FHE13-16 Part D)
- **Build:** the event/notification endpoints per Part D (recipient-scoped delivery, read-state convergence, delivery status).
- **Acceptance:** a notification reaches only its recipient with converging read state; the support-receipt path works.
- **Unlocks:** `/dashboard/notifications` for every role.

## Lane 4 — billing (separate owner; the commercial gate)

### T8 · Billing backend registration (the recorded one-field/plan contracts)
- **Build:** the Razorpay plan/subscription registration per the billing handoff; TEST-mode first.
- **Acceptance:** the plans surface flips from the honest "Test billing is not configured" state to a working TEST checkout; entitlements and payer-only invoices read back; no live-money claim until the PSP approval.
- **Unlocks:** the full `/dashboard/subscription` experience.

## Lane 5 — hosting (the FHE-23 checklist owner)

### T9 · Hosted staging per `FHE23_STAGING_QUALIFICATION_CHECKLIST.md`
- Provisioning, hosted identity/origins, migrations, rollback drills, synthetic monitoring — the checklist is the ticket.

---

## Integration order recommendation (value per unit of work)

1. **T1 (catalogue)** — unlocks the widest learner surface with one read endpoint.
2. **T2 (Build)** — unlocks the professional + student portfolio story.
3. **T3 (classrooms)** — unlocks the teacher role's entire reason to exist.
4. **T4 (guardian)** — unlocks the parent role.
5. **T5 (organization)** — unlocks the institution role.
6. **T6 (teaching turn)** — after T1 (it grounds in the catalogue's records).
7. **T7 (notifications)** — rides the same infrastructure.
8. **T8 (billing)** — commercial gate; TEST-mode can precede T1.
9. **T9 (hosted staging)** — continuous; required before any public hosted claim.

## Frontend readiness statement

Every honest room's frontend adapter is implemented and idle: when a
service registers, the room's data seam flips to the connected surface with
no screen redesign. The per-page closeouts (A00–A23, C01–C20) record the
exact seam for each. The frontend program holds: 51 receipts, 870/870
tests, the final regression clean on the exact production bundle.
