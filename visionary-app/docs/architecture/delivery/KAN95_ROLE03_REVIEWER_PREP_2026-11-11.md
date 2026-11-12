# KAN-95 / ROLE-03 — reviewer-corrector pass (2026-11-11)

Reviewer-prep for `codex/principal-kan-95-submission-grading` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `c260894e`; package.json scripts unioned — all thirty-four family checks live incl. the domain's own registered gate), data-04 settled to dev's evolved version.

## Corrections

1. **Attempt-bound TOCTOU closed**: `submit` read the attempt count, checked the granted bound, then appended non-atomically — two concurrent ungranted resubmissions could both pass and exceed the bound. The store gains `appendAttemptCas` (atomic: the CAS checks the CURRENT count against the granted bound — the concurrent loser deterministically loses; a same-idempotency-key retry still converges via the pre-check). SQL adapter law: one conditional `INSERT … SELECT` with the count computed in-transaction.
2. **Attempt ids use `randomUUID`** (instance counters collided across service instances).

## Review finding (verified, no further defect)

The grading law reviewed clean: immutable submission copies; duplicate-safe submit (same idempotency key returns the SAME attempt); no silent resubmission replacement (an ungranted resubmission is a missing revision request; a consumed revision is the hard bound); teacher-only mutable DRAFT grade (release makes it byte-stable; returned becomes visible; revision_requested grants attempt N+1 with visible feedback); learner history shows attempts always, feedback only when visible; CURRENT-enrollment and assignment-open gating before anything persists.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Submissions suite (ROLE-03's own acceptance) | `node --test backend/tests/contracts/submissions/submissions.test.mjs` (after `npx tsc -p tsconfig.submissions.json`, exit 0) | **7/7 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-11)

Pricing renders (full plan table); register renders all three reviewed methods; the email-entry step renders on click; the protected-route guard renders in-place with the Create-account link preserving the full `returnTo` deep link. Credential step founder-gated as always.

## Notes for the reviewer

- The store is the in-memory reference; the SQL adapter implements `appendAttemptCas` in one transaction (the interface comment carries the law).
- Hosted grading flows at scale stay founder-gated as originally recorded.
