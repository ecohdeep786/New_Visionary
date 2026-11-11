# KAN-80 / BUILD-06 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-80-explicit-sharing` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `2e0b1fbb`; package.json scripts unioned — all twenty family checks live), data-04 rolling-clock fix (byte-identical).

## Corrections — TWO authorization/privacy defects closed

1. **Missing owner authorization in `shareRevision`**: the revision lookup (`payloadAt`) carried no owner argument, so ANY actor could share ANOTHER USER's revision (an information-disclosure vector: the actor chooses the recipients). Ownership is now resolved SERVER-SIDE (`projectOwnerOf`/`recordProjectOwner` — the sharing domain never trusts a caller's claim; an unknown owner fails closed) and `shareRevision` enforces uid+workspace. The tests seed ownership accordingly.
2. **Client-supplied consent flag removed from authority**: `parentSummary` trusted the request's `consentActive` boolean — a client flag deciding privacy exposure, violating the same client-flags-never-authoritative law LEARN-08 enforces. Consent is now resolved SERVER-SIDE (`consentFor` lookup); server-side revocation wins over any client flag. Tests drive the consent seam directly (`setConsent`).
3. Share ids use `randomUUID` (instance counters collided across service instances).

## Review finding (verified, no further defect)

Exact-revision sharing binds ONE immutable revision (later private edits never leak); viewShared is accepted-recipient-only; the classroom copy carries ONLY the shared revision payload with an explicit private-state assertion; unknown shares/revisions fail closed.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Sharing suite (BUILD-06's own acceptance) | `node --test backend/tests/contracts/sharing/sharing.test.mjs` (after `npx tsc -p tsconfig.sharing.json`, exit 0) | **4/4 pass** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- The SQL adapter implements `projectOwnerOf` (join to the owning-projects table) and `consentFor` (join to the consent store) — both are the enforcement sources; the sharing domain stores none of it.
- Hosted sharing at scale stays founder-gated as originally recorded; guardian-consent UI flows ride the PRIV family.
