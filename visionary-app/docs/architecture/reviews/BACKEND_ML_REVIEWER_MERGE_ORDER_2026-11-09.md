# D-095 reviewer guide — backend/ML merge order and conflict map

9 November 2026. Maintained by the backend/ML lane for the single D-095 reviewer who
integrates the Testing stack into `dev` (currently `2e0b1fbb`).

## The stack (12 branches)

Every branch is pushed, receipt-recorded, and carries its own working tree under
`C:/Users/Administrator/nv-worktrees/` for inspection.

| # | Order | Branch | Task | Base | Tip | Evidence |
|---|---|---|---|---|---|---|
| 1 | **merge first** | `zcode/kan-102-bill01-ingress-acceptance` | BILL-01 | `4bb3c22d` | `5373b268` | KAN102 review |
| 2 | depends on 1 | `zcode/kan-103-bill02-webhook-acceptance` | BILL-02 | `4bb3c22d` | `0eb757a9` | KAN103 review |
| 3 | parallel to 1 | `zcode/kan-123-accept07-migration-rehearsal` | ACCEPT-07 | `4bb3c22d` | `3b61b4dd` | KAN123 review |
| 4 | after 3 | `zcode/kan-128-release05-restore-drills` | RELEASE-05 | `4bb3c22d` | `033eadfb` | KAN128 review |
| 5 | depends on 4 | `zcode/kan-129-release06-release-security` | RELEASE-06 | `4bb3c22d` | `53cc0298` | KAN129 review |
| 6 | after 5 | `zcode/kan-125-realistic-load-soak` | RELEASE-02 | `9b0102df` | `b9e35982` | KAN125 review |
| 7 | independent | `zcode/kan-108-bill07-live-mode` | BILL-07 | `2e0b1fbb` | `7e09ac54` | KAN108 review |
| 8 | independent | `zcode/kan-124-release01-workload` | RELEASE-01 | `2e0b1fbb` | `38a7030b` | KAN124 review |
| 9 | **resolve conflict** | `zcode/kan-126-release03-admission-ceilings` | RELEASE-03 | `2e0b1fbb` | `311171e2` | KAN126 review |
| 10 | **resolve conflict** | `zcode/kan-127-release04-per-task-economics` | RELEASE-04 | `2e0b1fbb` | `6d831a79` | KAN127 review |
| 11 | **resolve conflict** | `zcode/kan-107-bill06-invoice-integrity` | BILL-06 | `2e0b1fbb` | `23b2cce8` | KAN107 review |
| 12 | any time | `zcode/kan-117-accept01-journey-rehearsal` | ACCEPT-01 | `2e0b1fbb` | `20a3652e` | KAN117 review |

## Ancestry (verified with `git merge-base`)

- `kan-103` **contains** `kan-102`; `kan-129` **contains** `kan-128`. Their merge-base
  is their predecessor's tip — merge the predecessor first.
- `kan-102/103/123/128/129` base on `4bb3c22d`, `kan-125` on `9b0102df`, the rest on
  `2e0b1fbb`. `4bb3c22d` and `9b0102df` are ancestors of `2e0b1fbb`, so all merge
  cleanly in the order above (no rebase required, but rebasing is fine).

## Known conflicts and how to resolve (three, all mechanical)

1. **`backend/tests/contracts/data-04/invitations.test.mjs` — kan-107 AND kan-127
   both fix the same pre-existing clock time-bomb.**
   `kan-107` carries `61ecc15e`, `kan-127` carries `20cf2bbf`; both replace
   `const at = new Date('2026-11-02T00:00:00Z')` with the rolling per-run base
   (`Date.now() - 1 day`) **byte-identically**. Whichever merges second hits a
   conflict — resolve by keeping either version (they are identical). Until one
   lands in `dev`, every fresh dev worktree must re-apply this fix or the 22
   data-04 invitation tests fail on/after 2026-11-09.

2. **`backend/upstream/backend/src/billing/razorpay.provider.ts` — kan-108, kan-126,
   kan-127 all extend this one file.** The changes are additive and orthogonal
   (BILL-07 adds the mode gate; RELEASE-03 adds the provider circuit breaker;
   RELEASE-04 adds the enforced spend-admission consult). Merge `108 → 126 → 127`
   in that order and keep all three additions in the provider
   (constructor + `request()`); a three-way manual resolution is expected.

3. **`backend/upstream/backend/src/billing/billing.service.ts` — kan-108 and kan-127
   both edit it.** Again additive (mode routing vs committed-spend argument on the
   subscription POST); keep both.

## Not a conflict, but flagged for the reviewer

- `kan-117`'s `backend/tests/contracts/accept-01/journey-stack.cjs` is **adapted
  from** `kan-126`'s `release-03/admission-stack.cjs` (same lane/author). Different
  paths, so no git conflict — but there is deliberate driver overlap the reviewer
  may choose to dedupe later. The ACCEPT-01 receipt records this lineage.
- `kan-125` (load soak) rests on the `9b0102df` dev generation; its `scripts/check.mjs`
  touch may be superseded by the newer base — trivial to re-apply.

## After the merge

- Landing kan-107 **or** kan-127 permanently fixes the data-04 clock time-bomb in
  dev for every future worktree.
- Landing the classroom stack (kan-93…99) and upload/Build stack (kan-56/57/58) will
  unlock the ACCEPT-02 and ACCEPT-04 journey rehearsals, which the lane stands ready
  to build next.
- Remaining owner gates after the merge: hosted acceptance walks, real merchant
  wiring, real device QA, release/growth decisions (see LAUNCH_READINESS_MAP.md).
