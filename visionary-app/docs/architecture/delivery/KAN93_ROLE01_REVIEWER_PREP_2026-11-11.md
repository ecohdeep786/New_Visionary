# KAN-93 / ROLE-01 — reviewer-corrector pass (2026-11-11)

Reviewer-prep for `codex/principal-kan-93-classroom-roles` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections + RE-INTEGRATION with dev `c260894e` (Codex advanced dev again: KAN-46/47 merged; package.json scripts unioned — all thirty-two family checks live), data-04 settled to dev's evolved version (Codex's own `b0cd7507` anchors the SQL invitation fixtures to the test run — superseding the reviewer-prep frozen-clock fix; the merge had briefly restored the older generation, now settled to dev's).

## Corrections

1. **Join/revoke TOCTOU closed**: `joinByInvite` read the invite then wrote the enrollment + accepted status in two writes — a concurrent revocation could land between and the join would overwrite it back to accepted (**a revoked invite admitting the learner**). The store gains `claimEnrollment` (atomic: the invite flips pending→accepted and the enrollment inserts together, conditional on the invite still being pending — a concurrent revocation wins and the join refuses). SQL adapter law: one `UPDATE … WHERE status = 'pending'` + INSERT inside the transaction.
2. **Class/invite/attachment ids use `randomUUID`** (instance counters collided across service instances).
3. **The join code is cryptographically random** (`join_<uuid>`) — the `Math.random` code was a guessable authorization artifact (possession = enrollment right).

## Review finding (verified, no further defect)

Verified-teacher-only class creation (server-recorded status, never self-claim); uniform `invite_invalid` for unknown code/wrong learner (no leak); expiry and archived-class refusals; idempotent duplicate join (exactly one enrollment record); CURRENT-enrollment-only attachment reads (a removed learner loses access immediately); archived classes refuse new invites/material.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Classroom suite (ROLE-01's own acceptance) | `node --test backend/tests/contracts/classroom/classroom.test.mjs` (after `npx tsc -p tsconfig.classroom.json`, exit 0) | **6/6 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-11)

Pricing renders (full plan table, Start-for-free CTA); register renders all three reviewed methods (Email/phone/Google); the email-entry step renders on click; the protected-route guard renders in-place with the Create-account link preserving the full `returnTo` deep link. Credential step founder-gated as always.

## Notes for the reviewer

- The store is the in-memory reference; the SQL adapter implements `claimEnrollment` in one transaction (interface comment carries the law).
- Hosted classroom flows at scale stay founder-gated as originally recorded.
