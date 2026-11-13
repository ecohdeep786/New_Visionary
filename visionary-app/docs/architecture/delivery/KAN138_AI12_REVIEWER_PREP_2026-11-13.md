# KAN-138 / AI-12 scoped quality collection — reviewer-corrector pass (2026-11-13)

Branch `codex/principal-kan-138-scoped-collection` @ 3314faf3 (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE

The scoped quality-collection law reviewed clean (qualityscope suite 6/6):

1. **The legacy raw-text quality export is PERMANENTLY disconnected** — `legacyExport` ALWAYS refuses (`legacy_export_disconnected`); no flag, role, or purpose re-enables it. Raw dumps, global-key exports and training-style dataset generation stay disconnected.
2. **Collection is double-gated** — an approved, ACTIVE purpose AND a scoped operator carrying the purpose-bound scope `quality.review:<purposeId>`; the ordinary authenticated identity is never sufficient.
3. **Raw private text refuses at the door** — the presence of `rawQuery`/`rawResponse`/`retrievedContext`/`fullTranscript` refuses the entry (`raw_text_forbidden`) BEFORE anything is saved; the saved entry carries scoped fields only.
4. **Ground truth is human** — an entry without a human review record (`reviewedRef`) refuses (`not_ground_truth`); the feedback judge's generated response can never be ground truth.
5. **Scope binding enforced per entry** — conceptId/sourceVersion/locale outside the approved scopeFilters refuse (`beyond_approved_scope`).
6. **Exports inherit the same gates** — scoped operator + active purpose; entries are scope-safe by construction (collect enforced the binding per entry).

No correction needed.

## Re-integration

Merged `origin/dev` — package.json resolved to the union; the privacycore directory already matches dev's approved baseline exactly (no superseded variant on this branch's path). The branch's OWN payload — the `qualityscope` package (types/lookups/service + `tsconfig.qualityscope.json` + check script + family test) — is genuinely new in dev and is kept.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| Qualityscope suite | `node --test backend/tests/contracts/qualityscope/quality-scope.test.mjs` | **6/6 pass** |
| Backend compile (nest) + qualityscope tsconfig | `npm run build` + `tsc -p tsconfig.qualityscope.json` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-13)

Quality collection is a scoped ML-lane operation (no public surface; the ordinary user never sees it — which is itself the law). The public product's honesty boundary was verified in the KAN-132 pass (/research makes no unqualified model claims). The law is proven by the 6/6 suite over the contract store.

## Notes for the reviewer

- **`recordPurpose` must be owner-gated at integration**: it is the product/education review decision record, and the contract store deliberately carries no auth surface — the real integration must restrict purpose recording to the accountable owner (the PRIV-07 accountable-owner pattern composes).
- Entry ids are caller-supplied (`entryId` in the record); the real store should enforce unique-key semantics per purpose.
