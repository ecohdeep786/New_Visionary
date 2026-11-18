# FHE-10 / FHE-12 — BUILD PROJECTS AND CLASSROOM SERVICE HANDOFF TO THE BACKEND OWNERS

**Status:** exact frontend-side contract handoff (V6 §7 FHE-10/FHE-12, FHE-24
deliverable). **Written:** 2026-11-18 on `dev` = `4d85a13e`. **Owners:** backend data
lane for both parts; ML not required. **Companion to:**
`docs/visionary/FHE07_08_CONTENT_TEACHING_HANDOFF.md` (transport idiom, law and
frontend guarantees carry over unchanged).

The contracts below transcribe the accepted preview UX's domain model —
`workspaceService.ts` artifact operations and `classroomService.js` classwork
operations — into the selected backend's registered command idiom
(`learning.contract.ts`: `version: 1`, UUIDv4 `commandId`, `expectedRevision`
optimistic concurrency, strict key sets, bounded fields). The preview
implementations stay DEV-only; the production build keeps honest rooms until
these services are registered, qualified and reviewed.

---

## Part A — Build: durable projects, revisions, controlled sharing (backend data lane)

**User outcome (V6 FHE-10):** work created from learning saves as durable,
versioned, private-by-default revisions; suggestions are accepted/rejected
explicitly; export/sharing release exactly the intended saved version.

### Domain model (from the accepted preview UX)

```jsonc
{
  "projectId": "uuidv4",
  "title": "1–200 chars, trimmed, required",
  "body": "≤100k chars; every content change archives the previous body",
  "versions": [{"body": "…", "savedAt": "ISO-8601"}],   // newest first, bounded history
  "journeyId": "owned learning journey reference or null",
  "conceptId": "concept reference or null",
  "learningSessionId": "owned session uuid or null",
  "projectBrief": "≤4k chars or null",
  "rubric": "≤4k chars or null",
  "milestones": [false, false, false],                   // exactly 3 booleans
  "status": "draft",                                     // server-owned lifecycle
  "visibility": "private",
  "updatedAt": "ISO-8601"
}
```

Revision key (the UI's conflict contract): `JSON.stringify([updatedAt, title,
body, milestones, status, projectBrief, rubric])`. The client sends it as
`expectedRevision`; a mismatch is `409` and the UI already renders the exact
conflict flow ("This project changed since you opened it. Your edits remain in
the editor…"). Preserve this receipt shape.

### A1. Endpoints

| Operation | Call | Notes |
| --- | --- | --- |
| Create | `POST /api/account/projects` `{version:1, commandId, title, body?, conceptId?, learningSessionId?, journeyId?}` | idempotent by `commandId`; created private, `status:'draft'` |
| Save revision | `PATCH /api/account/projects/:projectId` `{version:1, commandId, expectedRevision, title, body, projectBrief?, rubric?, milestones?}` | `409` on stale revision; archives prior body into `versions` server-side |
| List | `GET /api/account/projects?after&limit(1–50)` | cursor-stable like the learning sessions page |
| Read | `GET /api/account/projects/:projectId` | full record incl. `versions` |
| Share | `POST /api/account/projects/:projectId/shares` `{version:1, commandId, recipientUid, expectedRevision, message?}` | snapshots `{title, body, version: updatedAt, sharedAt}` at share time |
| Stop sharing | `POST /api/account/projects/:projectId/unshare` `{version:1, commandId}` | resets `visibility:'private'`, clears recipients/shares |
| Export | `GET /api/account/projects/:projectId/export` | exact saved revision bytes, owner only |

### A2. Server invariants

1. **Private by default; sharing is explicit and permission-checked** — the
   server verifies the recipient is an accepted connection with
   shared-resource permission (`403` otherwise); revocation removes future
   reads without rewriting the owner's record (E18).
2. **Minor safety:** sharing requires the account's verified adult/guardian
   workflow server-side (`403` for minors until guardian-first admission is
   qualified) — the preview already refuses this client-side; the server must
   not depend on that.
3. **Ownership:** every read/write resolves the project through the session
   uid; another account's projectId is `404` — no cross-account leaks (E20).
4. **Versions:** the server owns the revision history; `versions` entries are
   immutable; export serves the exact requested revision.
5. **Model suggestions** (bounded, when the teaching lane lands): proposals
   arrive as server records on the project, applied only by an explicit
   accept command from the owner; reject discards them; nothing executes or
   shares automatically (E14).
6. Errors mirror Part 0 of the FHE-07/08 handoff (`401/403/409/503`), no
   200-with-garbage.

---

## Part B — Classroom: verified teacher authority, assignments, durable classwork lifecycle (backend data lane)

**User outcome (V6 FHE-12):** a verified teacher manages an authorized class,
publishes an assignment, receives a real learner submission, reviews and
returns feedback; the full loop survives devices and reloads.

### B1. Class and membership authority

- `POST /api/account/classroom/classes` `{version:1, commandId, name(1–120),
  description?(≤500)}` — creates a class owned by the authenticated **verified
  teacher**; a role label in onboarding is not authority (the server must
  verify teacher authorization independently; until the verification service
  exists the endpoint honestly 503s).
- `GET /api/account/classroom/classes` — only classes the uid currently owns
  or is enrolled in as a verified learner; revoked membership disappears
  immediately from lists and reads (E26).
- `GET /api/account/classroom/classes/:classId/learners` — owner only;
  membership records are server truth with join/leave history.

### B2. Assignment publication

`POST /api/account/classroom/classes/:classId/assignments`
`{version:1, commandId, expectedClassRevision, objectiveSnapshot:{conceptId,
sourceVersion, criteriaVersion, criteria:[{id, label, prompt}]}, dueDate?,
points(1–100)}`

- `objectiveSnapshot` is frozen at publication: later source withdrawal or
  criteria changes never mutate a published assignment (the learner's
  assigned work is a fixed copy; E30). The server validates the snapshot
  against the authorized source at publish time.
- Lifecycle (server-owned state machine, transitions only via
  `POST …/assignments/:assignmentId/state {expectedStatus, nextStatus}`):
  `draft → published → closed`, with `revision_requested` and `reviewed` as
  per-submission states. Unknown transitions are `409`.

### B3. Submissions and review

| Operation | Call | Invariants |
| --- | --- | --- |
| Learner submits text/responses | `POST …/assignments/:assignmentId/submissions` `{version:1, commandId, expectedRevision, text?(≤20k), responses?[], selfReview?{criterionId→≤2000 chars}}` | immutable attempts; a different response over a non-`revision_requested` submission is `409` with the preview's exact duplicate-protection copy; `selfReview` keys must match the snapshot's criteria exactly |
| Learner submits a project | `POST …/assignments/:assignmentId/project` `{version:1, commandId, expectedRevision, projectId}` | the projectId must be an owned, non-empty project; the submitted copy is fixed at submit time |
| Teacher requests revision | `POST …/submissions/:submissionId/revision-request` `{expectedStatus, note?(≤2k)}` | only on `submitted`; reopens for the learner |
| Teacher returns feedback | `POST …/submissions/:submissionId/review` `{expectedStatus, feedback(≤4k), results:[{criterionId, verdict}]}` | server stores the review; the learner sees returned feedback only for their own submission |
| Learner reads assigned work | `GET …/assignments?classId` | published + own submissions only; withdrawn/unpublished bodies are never served after a read began (E30) |

### B4. Server invariants

1. Role labels never grant authority: teacher operations require verified
   teacher authorization; learner operations require verified enrollment
   (matrix rows 11–12; E15/E16/E26).
2. Every mutation carries `commandId` + the relevant `expectedRevision`/
   `expectedStatus`; concurrent editors get `409`, never silent overwrite.
3. Grades, feedback and private submissions are owner/teacher-scoped records;
   they survive reload, second device and account return (E16); revoked
   members lose access immediately without data destruction.
4. No notification or guardian summary is emitted by these endpoints —
   cross-role events are the separate FHE-16 lane with its own authorization.
