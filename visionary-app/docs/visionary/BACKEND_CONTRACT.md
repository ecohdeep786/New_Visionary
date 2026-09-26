# BACKEND CONTRACT — Visionary AGI (backend phase, v1)

The client boundary already exists and is verified: `src/services/backendTransport.ts` (team Gate 1).
The server implements **one exchange shape** and the operations below. This document is the
build spec for the backend phase; the client installs it through `configureBackendTransport`
and needs **no rewrites** when the real transport arrives.

## Session and authorization (every operation, no exceptions)
- `getSession()` returns the authenticated `{ personId, workspaceId, role, expiresAt? }` from
  the real credential (token/cookie) — never from preview storage. The client re-checks the
  session **before and after** every exchange and rejects changed sessions.
- The server independently authorizes every operation and object:
  student → own data only · teacher → assigned classes only · parent → connected children,
  `progress-summary` scope only · professional → own data · organization → aggregate only.
- Deadline: the whole exchange (both session checks included) defaults to 20s, max 120s.

## Operations live in the client today
### `content.syllabus`
request `{ selection: { board, classLevel, subject } }` → response `ContentGraph | null`.
A miss is `null` (the client serves provisional mode) — **never invented curriculum**.
Graphs must carry status `official`, unique ids, intact hierarchy (client validates and
rejects incomplete graphs), and per-concept language availability (team Gate 2).

### `content.concept`
request `{ conceptId }` → response `ContentConcept | null`. Same validation; concept
responses must respect audience eligibility (`adult` gating) and locale variants.

### `teaching.request`
request `{ mode: 'explanation'|'practice'|'feedback'|'project', packet: PromptPacket }` →
response `TeachingResponse { status, text, question?, representations?, promptVersion? }`.
The server runs its own crisis/safety interception on every input. When the model is
unavailable the response is `status: 'not_connected'` — **never a fabricated answer**.

### `mentor.turn`
request `{ input, context: MentorContextPacket (promptVersion mentor-context-v1) }` →
response `MentorModelReply { status:'ready', source:'connected_model', locale, promptVersion,
text, actionIds[] }`. `actionIds` must be within the role's allowed list
(`mentorModelService.ts`). The client speaks/displays `text` verbatim.

## Operations required for launch (specified now, wired after founder decisions)
### `auth.session`
register / sign-in / sign-out / refresh against the real account store, replacing the local
preview users store. Issues the credential that `getSession()` resolves. Age band and
guardian links are part of the account record (minor eligibility depends on it).

### `data.sync`
Owner-scoped pull/push of the local stores inventoried by `localMigrationService.ts`
(workspace, learning pipeline, cognition/evidence, community) using its target-owner mapping.
Incremental and resumable; **never destructive** — the local originals stay until the server
acknowledges ownership. Supports the DPDP-style view/export/delete the client already exposes.

### `classroom.entity`
Classes, enrollments, assignments, submissions and announcements (today's
`visionary_entity_*` rows) with the Gate 5 rules enforced server-side: teacher-ownership
filters, active-enrollment checks, immutable assignment snapshots on publish.

### `community.post`
List / post / remove for class communities. The server enforces enrollment and assignment
exactly like `communityService.ts`, stores moderation (`removedById`), and keeps post text
out of telemetry.

### `notifications.push`
Delivery of due reviews, classwork, and live-class updates (the client's notifications feed
is local today).

## Non-negotiables carried from the mission
PII never enters telemetry · crisis interception on every input path, client and server ·
minors only in teacher-moderated/guardian-scoped spaces · no invented curriculum or model
output · the local preview keeps working whenever the transport is absent.
