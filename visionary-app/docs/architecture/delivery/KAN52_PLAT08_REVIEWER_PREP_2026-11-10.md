# KAN-52 / PLAT-08 — reviewer-corrector pass (2026-11-10)

This historical checkpoint records local model results. See the [current runbook](../../../infrastructure/drills/README.md) for hosted workflow and evidence.

Reviewer-prep for `codex/principal-kan-52-backup-drills` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits on the branch: corrections `c9e323ff`, dev integration `81edd82c` (merge of `2e0b1fbb`), data-04 rolling-clock fixup `0d41272d` (byte-identical to the fix carried on the prepared Testing branches).

## Corrections (all in `infrastructure/drills/`)

1. **`restore_point_in_time` now enforces the same guarantees as `restore_latest`**: the PITR path restored `deepcopy(state)` without the digest verification or the owner-identity check the latest-restore path always ran — a diverged or identity-losing rebuild would have passed silently. Both checks now refuse, with a white-box corruption test proving the refusal.
2. **Duplicate snapshot labels refuse**: a repeated label made point-in-time recovery ambiguous (restore resolved the FIRST match, delete removed ALL matches). Labels are now unique by contract, with a test.
3. **`tests/__init__.py` added** (runbook defect): the documented `python3 -m unittest discover -s …` invocation could not load the suite without a package marker, so the drill had never been executable via its own documented command.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Backup drill suite (KAN-52's own acceptance) | `python -m unittest discover -s infrastructure/drills/tests -t infrastructure/drills` | **6/6 OK** (4 original + 2 new verification tests), executed under a real CPython 3.12.9 (official python.org installer, per-user install under `nv-tools/python312-full`) |
| Infrastructure gcp suite | `node --test infrastructure/gcp/tests/*.test.mjs` | **34/34 pass — fully green including the four `python`-shelling tests for the first time on this host** |
| VMM suite carried by the branch | `node scripts/vmm.mjs test` | **296/296 OK** (matches the lane's recorded count, now re-verified here) |
| Data contracts | `npm run data:check` (disposable loopback PostgreSQL 16 on 127.0.0.1:5433 + Java 21 under `nv-tools/`) | **exit 0 — 315/315 across 11 suites**, incl. data-04 invitations 37/37 |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Notes for the reviewer

- The branch is a cumulative principal-lane stack (69 commits over the old `f61292ef` base: the VMM deliveries plus this drill). The dev merge integrates the whole tip with current dev; the post-merge full battery above is the integration proof.
- The drill remains synthetic-first by contract (real-user records refused at `seed`), so running it locally touches no real data; the LIVE cloud-side verification of backups/PITR/object-protection on the actual Cloud SQL/Firestore/GCS estate stays founder-gated exactly as the lane's original evidence records (owner session + real infrastructure). This pass adds no claim there.
- Host capability note: the official Python 3.12.9 runtime (full installer) now lives at `nv-tools/python312-full` (`python`/`python3` on PATH for gate runs), which is what unlocked the previously Python-gated suites on this machine.
