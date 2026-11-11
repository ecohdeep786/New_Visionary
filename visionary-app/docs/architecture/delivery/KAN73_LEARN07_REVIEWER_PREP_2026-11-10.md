# KAN-73 / LEARN-07 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-73-journey-verify` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections + id-format test update, stack integration (merge of dev `2e0b1fbb`; package.json scripts unioned — all thirteen family checks live), data-04 rolling-clock fix (byte-identical).

## Corrections

1. **Journey-command double-advance closed**: `practice`/`saveDraft` read-fence-inserted — two concurrent commands with the same `expectedRevision` could both advance (breaking the revision-fence law on concurrent devices). The store gains `commitAttempt`/`commitDraft` (atomic: unseen submissionId + current revision == expected, row + revision advance together; the loser receives the current revision for a preserved-local retry). SQL adapter law: one conditional `UPDATE … WHERE revision = expectedRevision` inside the insert transaction.
2. **Journey ids use `randomUUID`** (instance counters collided across service instances); the id-format assertion updated in the same visible change.
3. Narrowing-style fix (`ok === false`) — truthiness did not narrow under this TS config.

## Review finding (verified, no further defect)

The composed journey reviewed clean otherwise: start requires a RELEASED (concept, revision) before anything persists; practice is idempotent by submission id with the duplicate check answered BEFORE the state guard (a replayed commit on an expired journey still converges); withdrawal is checked server-live AFTER the fence (a withdrawal stops new commands, not committed history); save failures are visible preserved-local refusals with nothing partial persisted; resume returns the committed journey (attempts + latest draft + server-live availability + state) for a second device.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Journey suite (LEARN-07's own acceptance) | `node --test backend/tests/contracts/journey/journey.test.mjs` (after `npx tsc -p tsconfig.journey.json`, exit 0) | **8/8 pass** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- The store is the in-memory reference; the SQL adapter implements `commitAttempt`/`commitDraft` atomically (interface comments carry the law).
- Real second-device journeys over hosted sessions stay founder-gated as originally recorded (ACCEPT-01's chain).
