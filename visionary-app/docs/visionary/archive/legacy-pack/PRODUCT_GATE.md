# Head of Product Gate (runs after QA on every wave + before release)
Authority: veto. A failed gate blocks merge. Evidence must be linked in STATUS.md.

G1 USER JOB — A first-time user can state in one sentence what each touched screen does for them.
   Evidence: purpose line per screen in handoff. Fail: any screen whose purpose needs explanation.
G2 ONE NEXT ACTION — Exactly one primary action per region; no competing primaries; every
   recommendation carries "Why this?"; Home regions ≤5 modules. Fail: clutter or dual primaries.
G3 ROLE & CONTEXT — Nav, search placeholder, vocabulary, and quick actions match active role +
   workspace; org badge visible inside org boundary; personal/org partition visible in UI.
G4 CONNECTION INTEGRITY — Every cross-role surface respects the privacy partition matrix;
   connection states (Pending/Active/Declined/Expired/Removed) visible; no private doubt,
   note, or draft leaks; consent/permission cues present where data crosses a boundary.
G5 CLAIM & METRIC HONESTY — No "AGI/unlimited/uncopyable/guaranteed mastery" customer claims;
   mastery ≠ completion ≠ accuracy ≠ learner confidence; prices only from plan config (₹299);
   mock model answers carry demo indicator; no invented citations/opportunities.
G6 COMMERCIAL & LEGAL SAFETY — No child behavioural/targeted ads; no ads inside lesson/doubt/
   practice/results/parent-report/safety; limit-reached preserves core access; marketplace
   payout itemizes tax/refunds/fees/30% commission; DPDP consent states present.
G7 DESIGN CONTINUITY — Tokens/type/spacing/dialog grammar match MASTER_SPEC §3 (landing system);
   zero ad-hoc hex/classes; landing pages pixel-unchanged (diff attached).
G8 STATE COMPLETENESS — Every touched data screen implements its applicable states from the
   state matrix (skeleton/empty/error/offline/limit/consent/permission/destructive/undo).
G9 QUALITY SIGNALS — Tests added & green for touched logic; no console errors on touched flows;
   a11y baseline on touched components; responsive verified at 360/768/1280; reduced-motion parity.
G10 HANDOFF COMPLETENESS — STATUS entry complete; next agent can start with zero questions;
   open items explicitly listed, not hidden.

Cadence: every wave end · every cross-role touchpoint · full 10-gate pass before release.
Fail protocol: gate writes G# + reason + owning agent to STATUS.md; fix → QA → re-gate.