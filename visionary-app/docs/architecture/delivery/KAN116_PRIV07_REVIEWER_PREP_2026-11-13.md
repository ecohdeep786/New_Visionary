# KAN-116 / PRIV-07 — reviewer-corrector pass (2026-11-13)

Branch `codex/principal-kan-116-disclosures` @ (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE

The accountable-disclosure law reviewed clean; every ticket requirement enforced (disclosures suite 5/5):

1. **Accountable owner required** — a disclosure draft without an accountable owner (id + role) refuses `owner_required`.
2. **Approvals are SEPARATE records binding the EXACT version** — approver identity required; approving v1 does NOT approve v2 (`approvalFor` is version-keyed); the disclosure object itself never carries an approved flag.
3. **Publish is honest** — requires a matching approval for the exact version; unapproved or version-mismatched refuses `not_approved`; the result attributes the approver.
4. **Rights reviews accountable** — every content source / model / provider in the launch set requires a rights review with an accountable owner and a non-empty rights scope.
5. **The launch checklist never blanket-claims** — per-item `approved|pending` for disclosures and `reviewed|missing` for rights subjects; a missing review reports missing, never invented.

## Superseded-variant cleanup (same as KAN-110–115)

The dev merge resolved the privacycore add/add conflicts to **dev's approved baseline** and removed the stacked superseded KAN-110 variant. The branch's OWN KAN-116 payload — the `disclosures` package (types/lookups/registry + `tsconfig.disclosures.json` + check script + family test + its own review doc) — is genuinely new in dev and is kept.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| Disclosures suite | `node --test backend/tests/contracts/disclosures/disclosure.test.mjs` | **5/5 pass** |
| Backend compile (nest) + disclosures tsconfig | `npm run build` + `tsc -p tsconfig.disclosures.json` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-13)

The public disclosure surfaces render and carry the accountable content: /privacy (verified in the KAN-115 pass — per-class what/why/who, grievance officer, honest export boundary) and /terms — "Clear rules, written to be understood." with content-rights and provider/service terms present and the contact path reachable. The approvals registry itself is founder-owned (approvals are the founder's accountability, recorded separately from engineering tests — exactly the ticket's boundary).

## Notes for the reviewer

- **Approver trust at integration**: the registry records approvals with an accountable owner id; the real approver directory should validate approver identity against a trust list (the privacy policy's approver-trust pattern from KAN-110 composes here).
- The launch checklist's per-item honesty is the invariant to preserve — never reduce it to a blanket "all approved" claim.
