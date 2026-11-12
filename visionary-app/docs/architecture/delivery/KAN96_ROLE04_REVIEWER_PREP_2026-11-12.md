# KAN-96 / ROLE-04 — reviewer-corrector pass (2026-11-12)

Reviewer-prep for `codex/principal-kan-96-guardian-grants` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `c260894e`; package.json scripts unioned — all thirty-five family checks live incl. the domain's own registered gate), data-04 settled to dev's evolved version.

## Correction — the verified-link lookup was structurally broken

`findVerifiedLink` PROBED constructed ids (`lnk_1` … `lnk_N` by the service's own counter): it only ever saw links created by that very service instance — a second instance (or a restart) would find ZERO verified links, silently breaking `grantAccess` and `readDigest` (the guardian would be told `guardian_unverified` for a legitimately verified link). The construction also breaks entirely under UUID ids. The store gains `linksFor(learnerUid, guardianUid)` — the server-derived authority source for which links exist (SQL adapter: a SELECT on the guardian-links table). Service rewritten to use it.

Also: link/grant/digest/share ids use `randomUUID` (instance counters collided across service instances).

## Review finding (verified, no further defect)

The guardian law reviewed clean: verified-only links (named verifier, never self-claim); learner-only granular purpose grants with expiry; PERMANENT revocation with cascade (outstanding shares end with the grant — append-only history keeps them revoked; re-consent never revives them); digests generated from permitted fields only (private-hint keys refuse); digest sharing bound to an ACTIVE, matching-purpose, unexpired grant; guardian reads re-validate everything server-side (share active + grant active/unexpired + link verified); share revocation owner-only with append-only history.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Guardian suite (ROLE-04's own acceptance) | `node --test backend/tests/contracts/guardian/guardian.test.mjs` (after `npx tsc -p tsconfig.guardian.json`, exit 0) | **6/6 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` (after the coupled artifact chain) | **exit 0 — 866 ok lines, frontend build ok** |
| Data-04 fix | settled to dev's evolved version | **exact** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-12)

All four stages re-verified: pricing renders; register renders all three reviewed methods; the email-entry step renders on click; the protected-route guard renders in-place with the Create-account link preserving the full `returnTo` deep link. Credential step founder-gated as always.

## Notes for the reviewer

- The store is the in-memory reference; the SQL adapter implements `linksFor` (SELECT on guardian-links) — it is the authority source.
- Hosted guardian-consent flows at scale stay founder-gated as originally recorded (PRIV family).
