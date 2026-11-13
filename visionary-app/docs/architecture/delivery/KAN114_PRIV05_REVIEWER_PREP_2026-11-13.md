# KAN-114 / PRIV-05 — reviewer-corrector pass (2026-11-13)

Branch `codex/principal-kan-114-support-cases` @ c0d164e0 (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — one REAL cross-owner hazard, corrected

The support-case law reviewed sound: case filing is owner-scoped with an explicit reason (empty detail refuses `reason_required`); operator access is DEFAULT-CLOSED (`support.review` scope + a per-case recorded reason, every access appending an append-only audit entry; the ordinary user identity is never an operator); `operatorDump` is ALWAYS refused (`operator_dump_refused`) — no bulk user access for any operator, any reason; abuse/content reports open an incident with the reported content RESTRICTED pending review; resolution records the outcome, closes the case honestly, and audits the decision.

**Correction — counter-based ids were the lane's proven collision class.** `caseId: case_${++this.caseCounter}`, `incidentId: inc_${++…}`, `accessId: acc_${++…}` collide across service instances and restarts: the store keys by id, so after a restart `case_1` belongs to whoever filed next — **one owner's case becomes readable under another's id with cross-contaminated audit entries**. This is the exact class recorded in lane memory ("counter-id collisions across service instances made several tests falsely pass — UUID ids exposed them"). All three ids now use `randomUUID()`. Tests do not hardcode generated ids; the suite stayed green. Suite **6/6**.

## Superseded-variant cleanup (same as KAN-110–113)

The dev merge resolved the privacycore add/add conflicts to **dev's approved baseline** and removed the stacked superseded KAN-110 variant. The branch's OWN KAN-114 payload — the `supportcases` package (types/lookups/service + `tsconfig.supportcases.json` + check script + family test + its own review doc) — is genuinely new in dev and is kept.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| Support-case suite (incl. the UUID-id correction) | `node --test backend/tests/contracts/supportcases/support-case.test.mjs` | **6/6 pass** |
| Backend compile (nest) + supportcases tsconfig | `npm run build` + `tsc -p tsconfig.supportcases.json` | **exit 0** |
| Privacycore suite (KAN-110 baseline intact) | `node scripts/provision-check.mjs --suite privacycore` | **52/52 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-13)

The help surface renders and states the commitments the server law backs: "Find your answer." with the **Safety & reporting** topic ("Report content, family controls, and how we review"); "How do I report content?" → **"Tap report on any answer. A human reviews every report."** (the honest human-review promise matching scoped-operator-only access + no impersonation); "How fast are urgent reports handled?" → **"Within 24 hours, every time."**; the "Report a safety issue" mail path reachable. The signed-in case-filing surface is credential-gated (founder-gated as always); the server law is proven by the 6/6 suite.

## Notes for the reviewer

- The operator-identity law at integration must come from the real operator directory (`op_`-prefixed operator ids are the contract-store shape); the scope check (`support.review`) and the always-refused dump are the invariants to preserve.
- Incident ids, case ids and audit-access ids are now UUIDs — the real store should keep unique-key semantics (no counter columns).
