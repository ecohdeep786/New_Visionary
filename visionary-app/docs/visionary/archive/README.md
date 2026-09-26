# Archived internal pack — evidence only

On 2026-09-19 the user requested consolidation and archival of leftover partial pack files. The following exact loose files were moved, without content changes, from `docs/` to `legacy-pack/`:

- `MASTER_SPEC.md` (older v2 contract)
- `PRODUCT_GATE.md` (older ten-gate checklist)
- `CONNECTION_MATRIX.md`
- `AUTO_TRANSITION.md`
- `STAGE_ADAPTATION_MATRIX.md`
- `00…08.md` (packed role charters)
- `00-START-HERE.md`
- `README.md`

`VISIONARY_MASTER_v2.2.md`, `DECISIONS.md` and `QA.md` were moved from docs/ into docs/visionary/, preserving their content before append-only log updates. STATUS did not exist for the internal pack; it was created with an explicit reconciliation entry. New MASTER_SPEC/README/agents pointers lead to v2.2 and do not duplicate its authority.

No recursive folder move/delete, overwrite, or permanent deletion occurred. The protected public-team folder was not opened or changed. Pre-existing deleted `docs/frontend-completion.md` and `docs/internal-workspace.md` were not restored or reclassified as current status. All archived documents are recoverable at these paths; v2.2 wins on conflicts, particularly transitions, stage parameters and all twelve gates.
