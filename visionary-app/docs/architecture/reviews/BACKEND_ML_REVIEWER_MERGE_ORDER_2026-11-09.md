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
| 3 | parallel to 1 | `zcode/kan-123-accept07-migration-rehearsal` | ACCEPT-07 | `4bb3c22d` | `42b08be6` | KAN123 review |
| 4 | after 3 | `zcode/kan-128-release05-restore-drills` | RELEASE-05 | `4bb3c22d` | `f2a6e4ce` | KAN128 review |
| 5 | depends on 4 | `zcode/kan-129-release06-release-security` | RELEASE-06 | `4bb3c22d` | `40824fe8` | KAN129 review |
| 6 | after 5 | `zcode/kan-125-realistic-load-soak` | RELEASE-02 | `9b0102df` | `1f3343d3` | KAN125 review |
| 7 | independent | `zcode/kan-108-bill07-live-mode` | BILL-07 | `2e0b1fbb` | `a85acd34` | KAN108 review |
| 8 | independent | `zcode/kan-124-release01-workload` | RELEASE-01 | `2e0b1fbb` | `b5771920` | KAN124 review |
| 9 | **resolve conflict** | `zcode/kan-126-release03-admission-ceilings` | RELEASE-03 | `2e0b1fbb` | `f9ef880e` | KAN126 review |
| 10 | **resolve conflict** | `zcode/kan-127-release04-per-task-economics` | RELEASE-04 | `2e0b1fbb` | `6d831a79` | KAN127 review |
| 11 | **resolve conflict** | `zcode/kan-107-bill06-invoice-integrity` | BILL-06 | `2e0b1fbb` | `23b2cce8` | KAN107 review |
| 12 | any time | `zcode/kan-117-accept01-journey-rehearsal` | ACCEPT-01 | `2e0b1fbb` | `c92f9820` | KAN117 review |

> **REVIEWER-READY (2026-11-09): all 12 branches have completed the reviewer-
> corrector pass.** Each worktree is clean, committed on its own branch and pushed
> in sync. Registered gates re-run and green on every branch; the `[REVIEWER-PREP]`
> additions (data-04 clock base on kan-123/125/128/129/108/124/126/117, byte-identical
> to the pre-existing kan-107/kan-127 fixes) are the only corrections made. No
> product source was changed beyond what each delivery's own gate required. Full
> per-branch gate evidence in the tracing table below and in this directory's
> per-task handoffs.

## Re-run gate evidence (reviewer-corrector pass, 2026-11-09)

| Branch | Tip | Registered gates (exit / pass-fail) |
|---|---|---|
| `kan-102` | `5373b268` | protocol 11/11 + browser 7/7; check 0 — no fixes |
| `kan-103` | `0eb757a9` | webhook 8/8; check 0 — no fixes |
| `kan-123` | `42b08be6` | rehearsal 10/10; data:check 0; check 0 |
| `kan-128` | `f2a6e4ce` | restore drill 5/5; data:check 0; webhook PASS; check 0 |
| `kan-129` | `40824fe8` | security review 5/5; data:check 0; webhook PASS; restore 5/5; check 0 |
| `kan-125` | `1f3343d3` | release:load:soak PASS; data:check 0; check 0 |
| `kan-108` | `a85acd34` | billing:live:mode 11/11; production-check 0 (111?/11/37/52); check 0; npm test 672/672 |
| `kan-124` | `b5771920` | workload:test 10/10; cost:test 10/10; data:check 0; check 0 |
| `kan-126` | `f9ef880e` | release:admission 9/9 + 9/9; data:check 0; check 0 |
| `kan-127` | `6d831a79` | release:economics 6/6 + 8/8; production-check 0 (102/11/37/52); check 0 |
| `kan-107` | `23b2cce8` | production-check 0 (111/11/37/52; billing 71/71); check 0 |
| `kan-117` | `c92f9820` | accept:journey 11/11; data:check 0; check 0 |

`data:check 0` and `production-check`'s 37-test block both include data-04 37/37,
proving the clock fix on every branch that re-runs it.

## Ancestry (verified with `git merge-base`)

- `kan-103` **contains** `kan-102`; `kan-129` **contains** `kan-128`. Their merge-base
  is their predecessor's tip — merge the predecessor first.
- `kan-102/103/123/128/129` base on `4bb3c22d`, `kan-125` on `9b0102df`, the rest on
  `2e0b1fbb`. `4bb3c22d` and `9b0102df` are ancestors of `2e0b1fbb`, so all merge
  cleanly in the order above (no rebase required, but rebasing is fine).

## Known conflicts and how to resolve (three, all mechanical)

1. **`backend/tests/contracts/data-04/invitations.test.mjs` — carried on ALL
   TEN of the middle/later branches, byte-identically.**
   `kan-107` (`61ecc15e`) and `kan-127` (`20cf2bbf`) fixed this first; the
   reviewer-corrector pass re-applied the same rolling per-run base
   (`Date.now() - 1 day` replacing the hardcoded `2026-11-02T00:00:00Z`)
   on `kan-123` (`42b08be6`), `kan-128` (`f2a6e4ce`), `kan-129` (`40824fe8`),
   `kan-125` (`1f3343d3`), `kan-108` (`a85acd34`), `kan-124` (`b5771920`),
   `kan-126` (`f9ef880e`) and `kan-117` (`c92f9820`). Whichever branches merge
   after the first hit a conflict — resolve by keeping either version (they are
   identical), or drop the fix from later branches once one candidate lands in
   `dev`. Until one lands, every fresh dev worktree must re-apply this fix or the
   22 data-04 invitation tests fail on/after 2026-11-09.

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

## STACK 2 — the reviewer-corrector lane (13 more REVIEWER-READY branches, 2026-11-10)

Beyond the 12-branch stack above, the reviewer-corrector lane finalized 13 more
Testing branches (each: reviewed, corrected, dev-integrated at `2e0b1fbb`,
byte-identical data-04 fix, executed gates incl. real-SQL suites, live product
verification, receipt doc + Jira handoff). All pushed; worktrees under
`nv-worktrees/` are NOT kept for this stack — the main repo checkout was swapped
per task and restored to beta after.

### Group B — platform audits (independent of each other; each contains dev)

| Order | Branch | Task | Tip | Gates at head |
|---|---|---|---|---|
| any | `zcode/codex/deepseek-kan-47-identity-isolation` | PLAT-03 | `6d11fce3` | identity suite 9/9; data:check 315/315; check 0 |
| any | `zcode/codex/deepseek-kan-48-origin-routing` | PLAT-04 | `a2fee4b3` | origin 8/8; **LIVE 7/7 PASS** vs visionary.org.in rev 23921342 |
| any | `zcode/codex/deepseek-kan-49-session-boundary` | PLAT-05 | `d52f5c65` | session 7/7; **LIVE 6/6 PASS** |
| any | `zcode/codex/deepseek-kan-50-ci-audit` | PLAT-06 | `f6c222af` | ci suite 12/12; audit CLI 9/9 vs current workflow |
| any | `zcode/codex/principal-kan-52-backup-drills` | PLAT-08 | `64443844` | drill 6/6; gcp 34/34; vmm 296/296 |

Conflict map: these five touch disjoint code (gcp audit tools / drills); they
share only `tsconfig.data.json` includes and `production.yml` (kan-50) — union
resolutions, mechanical. Merge BEFORE Group C if you want their audit tools
present when C's batteries run (not required).

### Group C — outbox/file/content (STACKED: merge in ascending numeric order)

| Order | Branch | Task | Tip | Contains | Gates at head |
|---|---|---|---|---|---|
| **C1** | `zcode/codex/deepseek-kan-53-outbox-jobs` | JOB-01 | `dd520a57` | dev + corrections `6af47b16` | outbox 10/10 |
| C2 | `zcode/codex/deepseek-kan-54-job-fencing` | JOB-02 | `d2099d82` | ⊇ 53 | data-jobs 19/19 |
| C3 | `zcode/codex/deepseek-kan-55-admission-limits` | JOB-03 | `77b03774` | ⊇ 53 | data-jobs 26/26 |
| C4 | `zcode/codex/deepseek-kan-56-upload-lifecycle` | FILE-01 | `8623dd4f` | ⊇ 53 | family 36/36 |
| C5 | `zcode/codex/deepseek-kan-57-object-manifests` | FILE-02 | `d7dd1f6a` | ⊇ 53 | family 44/44 |
| C6 | `zcode/codex/deepseek-kan-58-private-downloads` | FILE-03 | `f23c2819` | ⊇ 53 | download 10/10 + **SQL 13/13** |
| C7 | `zcode/codex/deepseek-kan-59-file-security` | FILE-04 | `689b64a3` | ⊇ {53, 58} | full battery 74/74 |
| C8 | `zcode/codex/deepseek-kan-60-content-catalog` | CONTENT-01 | `ed0ff00b` | ⊇ 53 | full battery 89/89 |

**Merge C1 first** — it carries the corrected JOB-01 laws (pendingOutbox
due-filter, propagating claim failures, ack-clears-backoff, UUID ids) that the
later branches already contain byte-identically, so C2..C8 merge with identical-
hunk auto-resolution. Do NOT merge a C-branch before C1: their bases predate
the JOB-01 corrections and the corrections live in the stack, not in dev.
`download-store.sql.ts`/download files: KAN-58's side is authoritative (its SQL
adapter implements the atomic `consumeRead`; 53's incidental older download
generation is superseded — resolved ours-in-58, keep that resolution).
`src/file/index.ts` unions on C5/C7 (all four FILE surfaces exported).
`content`/`file` tsconfig includes union mechanically.

The C-family's real-SQL suites (`download.sql.test.mjs` et al.) run inside
`data:check` against the disposable PostgreSQL — after C6 lands, dev's
data:check exercises the durable download store too.

### Stack 2 gate evidence (this host, single serialized invocations)

- Full FILE+JOB+CONTENT battery at C8's head: **89/89** (content, security,
  download, download.sql on real PostgreSQL 16, upload, manifest, outbox, jobs,
  admission).
- Live real-user journey (in-app browser, 2026-11-10): pricing → register →
  email step → auth guards with `returnTo` — verified against the live origin.
- data-04 fix: byte-identical on every Stack-2 branch (17 branches total now
  carry it); first landing fixes dev permanently; later branches drop theirs.

### KAN-51 and KAN-46 (not in any stack)

KAN-46 (PLAT-02) is Codex's active In-Progress task; KAN-51 (PLAT-07) is
In-Progress/actively owned — both deliberately untouched by this lane.
