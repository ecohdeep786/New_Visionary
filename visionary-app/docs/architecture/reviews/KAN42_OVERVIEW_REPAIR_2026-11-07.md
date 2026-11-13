# KAN-42 overview review and repair checkpoint

7 November 2026. Backend scope only; frontend agent checkout and source excluded.

## Original review

Reviewer: Codex in this chat, separate from the original deepseek implementer.
Exact original candidate: `2947c3860e5fc74f20c4cc9dc907e63e4967269f`
on `codex/deepseek-kan-42-owner-projections`. Decision: changes requested.
Current integration baseline: `d3bc3630` (`origin/dev` at review start).

The original isolated TypeScript build and all eight tests passed. Additional
executable probes nevertheless returned `profile.refreshToken` from an extra
runtime store field, displayed a shared workspace's OWNER role to its MEMBER,
and accepted a 400-digit limit string converted to Infinity. Workspace,
membership and consent lists were unbounded. Original redaction assertions did
not seed the forbidden fields. Original module is not registered in the product
runtime and supplies only an in-memory store, not a real owning-store adapter.

Jira review comments: 10642 (claim), 10643 (findings). Actual transition to
In Progress: 31. The passing original tests are not acceptance evidence for the
missing security and integration behavior.

## Repair candidate

Implementer: Codex in this chat. Reviewer of this replacement: **pending**;
original review does not approve the implementer's subsequent changes.

Branch: `codex/principal-kan-42-overview-repair`.
Checkout: `C:/Users/Administrator/nv-worktrees/qa-kan-42-overview`.
Merge checkpoint `b01799f9` incorporates current dev and resolves the add/add
TypeScript configuration conflict by preserving both sets of compilation roots.

Owned changes:

- Explicit runtime field allowlists for all six DTO families, including nested
  account/billing fields; reject objects in scalar fields and hide raw command
  error details. Redaction metadata is a fixed list, not arbitrary stored data.
- Workspace role derives from the current viewer's membership or ownership,
  and subsequent downgrade/removal is reflected on the next read.
- All five record collections are bounded cursor pages; overview contains first
  pages and continuation references. Tied timestamps have deterministic ID order.
  Pagination limits are safe integers from 1 through 50, with validation before
  store access. Service methods reject missing/invalid UID and malformed cursors.
- Standalone controller uses `overview`, allowing the normal global `/api`
  prefix exactly once; exposes continuation routes, no-store headers and 400
  responses for invalid pagination. It remains **unregistered** in the product.
- Tests seed real forbidden runtime columns and nested credentials, exercise
  role changes, 125-row pagination in every collection, wrong users/cursors,
  invalid input, and actual Nest request-authority composition. The HTTP test
  uses an explicitly synthetic identity boundary; it is not Firebase or hosted
  authentication acceptance.

No frontend code, production configuration, migrations, provider or ML behavior
is changed. No database or live user record has been read or written.

## Verification and remaining gates

- Locked backend install: `npm ci --ignore-scripts --no-audit --no-fund` passed;
  explicit local Prisma client generation passed.
- `npm run build` in backend package: passed (whole Nest source compilation).
- `node --test backend/tests/contracts/data-07/*.test.mjs`: 22 tests passed in
  the final run (original eight plus security, pagination and HTTP regressions).
- `node --test backend/tests/*.test.cjs`: 110 passed, one failed to start:
  privacycore explicitly requires `FIRESTORE_EMULATOR_HOST` pointing at a live
  loopback emulator. This is an incomplete broad verification result, not green.
- Docker CLI is installed but `docker info` and `docker ps` fail because
  `dockerDesktopLinuxEngine` is unavailable. No SQL adapter/database test or
  connected browser journey has been claimed.

**Not ready to merge or close.** Replacement needs a separate exact-SHA review.
Full DATA-07 still needs an authorized real owning-store adapter, product
registration, current authority/deletion behavior, real database failure/recovery
checks, and the applicable connected/browser acceptance. Reconcile live DATA-04,
DATA-05 and DATA-06 acceptance before dependent integration; their tickets were
In Progress when this checkpoint began. Local preparation does not close those
gates or authorize production activation.

No dev merge, main promotion, deployment or Jira Done transition. Keep this
unfinished worktree. Resume KAN-42 at the pushed repair SHA recorded in Jira;
do not move to a dependent implementation because the synthetic tests pass.

## Completed branch cleanup

Primary checkout is clean on dev. Thirteen local refs for actual Jira Done
KAN-31/33/35/37/38 were removed only after verifying the exact tips matched
origin and were ancestors of origin/dev. Published refs remain recovery records;
unmerged/unfinished refs were retained. The only pre-existing secondary checkout
was active frontend F-04, with uncommitted files; it was not removed or edited.
