# KAN-82 / BUILD-08 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-82-adapter-proofs` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections + the corrected-sibling stack integration (KAN-75/78/80 corrected branches merged so the composed adapter composes the CORRECTED services), data-04 rolling-clock fix (byte-identical, via the siblings).

## STACKING NOTE (important for merge order)

This branch's 19-commit stack carries the principal lane's OWN uncorrected BUILD-04..07 deliveries in its history. Merging the corrected KAN-75/78/80 branches into it means the composed `DeviceAdapterStore`/services now carry the corrected atomic laws. **Merge order guidance: merge the corrected KAN-75/76/77/78/80/81 per-task branches FIRST, then this branch — resolving any conflicts to the corrected per-task versions (the corrected laws supersede this stack's older generations).** This branch's UNIQUE content is the device-adapter composition slice + its proofs.

## Corrections

1. **Device-session ids use `randomUUID`** (instance counters collided across service instances).
2. **The composed store's atomic ops advance the project's currentRevision** — the first `commitSave`/`commitRestore` draft appended to the ledger WITHOUT advancing `projects.currentRevision`, so the next save's revision pre-check saw a stale base and refused (`revision_conflict`); both now advance the project record together with the ledger.
3. **`projectOwnerOf` falls back to the adapter-created projects map** — adapter-created projects are owned by their creating actor, so the sharing ownership guard (KAN-80's law) composes correctly across the adapter's own flows.
4. The composed services now carry the corrected siblings' laws: `acceptProposalAtomic` (runs), `commitSave`/`commitRestore` (projects), server-derived `projectOwnerOf`/`consentFor` (sharing).

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Composed battery in ONE serialized invocation | device-adapter + run-contract + private-projects + sharing | **22/22 pass** |
| Data contracts | `npm run data:check` (disposable loopback PostgreSQL 16 + Java 21 under `nv-tools/`) | **exit 0 — 315/315 across 11 suites**, incl. data-04 37/37 |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Notes for the reviewer

- The device-adapter composition itself (session binding, guard flow, manifest-integrity restore check, two-device agreement, revocation stripping) verified defect-free — its suite now runs over the CORRECTED composed services.
- Hosted device journeys at scale stay founder-gated as originally recorded (ACCEPT-01's chain).
