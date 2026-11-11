# KAN-81 / BUILD-07 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-81-completion-criteria` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `2e0b1fbb`; package.json scripts unioned — all twenty-one family checks live), data-04 rolling-clock fix (byte-identical).

## Correction — MISSING OWNERSHIP ENFORCEMENT closed

The completion domain's owner parameters went **entirely unused**: `defineCriteria`, `assessCompletion`, `submitSelfReview`, `submitEvidence` had NO owner check — any actor could define/assess another professional's completion criteria (the same defect class as KAN-80's `shareRevision`). A server-derived `projectOwnerOf` seam now guards **all five** methods (unknown owner fails closed before any lookup; the same client-flags-never-authoritative / server-derived-ownership class). Tests seed ownership accordingly; a ghost project now refuses `unknown_project` before the criteria lookup (no caller claim trusted).

Also: criteria/review ids use `randomUUID` (instance counters collided across service instances); the error union extended (`unknown_project`, `version_conflict` reserved for the SQL adapter's conditional version write).

## Review finding (verified, no further defect)

Versioned criteria (amendments append versions, previous stays byte-stable); deterministic completion verdicts measured against ONE explicit criteria version; self-reviews are versioned and append-only; application evidence lands UNVERIFIED and never auto-verifies — the ONLY path to verified is the explicit assessment; double assessment refused.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Completion suite (BUILD-07's own acceptance) | `node --test backend/tests/contracts/completion/completion.test.mjs` (after `npx tsc -p tsconfig.completion.json`, exit 0) | **4/4 pass** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- The SQL adapter implements `projectOwnerOf` (join to the owning-projects table) — it is the enforcement source; the completion domain stores none of it. `version_conflict` is reserved for the adapter's conditional criteria-version write.
- Hosted completion flows at scale stay founder-gated as originally recorded.
