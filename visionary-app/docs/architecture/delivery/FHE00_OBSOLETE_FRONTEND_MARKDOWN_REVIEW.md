# FHE-00 obsolete frontend-agent Markdown review

- Source ID: FHE-00 (V7.1 founder assignment; no Jira key issued).
- Acceptance scope: controlled cleanup enabler; no product/runtime or hosted feature acceptance.
- Implementer: Kimi frontend engineering agent.
- Reviewer: independent QA agent `agent_47945e82-77dc-4d90-92fc-a08704d2402b`.
- Worker branch: `codex/kimi-fhe-00-obsolete-frontend-markdown`.
- Base: `04276ddf72dac7653457fcf443b5c0cd38cf4ef3` (`origin/dev`).
- Exact approved implementation: `18904aeb4a390e9f0e57de4d17bb58a55473c016`.
- Integrated merge: `d445a8a744940c4f5f48c7e5a8ee9063918275ea`.

## Approved scope

Delete only eight obsolete September-era role prompts under
`docs/Frontend(Head Of Product Agent)/council/agents/`:
`01-design-research.md` through `08-qa-integrity.md`.

The initial nine-file candidate `43084cbafbbfadcfbe6cc46a46cd3aa2bb006ab6`
received CHANGES REQUESTED because retained `prompt.txt` treats `DIRECTOR.md`
as an operational contract and `frontend/src/styles/rhythm.css` references it.
The implementer restored `DIRECTOR.md` byte-for-byte and narrowed the cleanup to
the eight unreferenced numbered prompts. The reviewer approved the revised exact
SHA on 2026-11-20.

## Evidence

- Exact net diff: eight deletions, zero additions/modifications, zero non-Markdown
  changes, zero protected-path or dependency-manifest changes.
- Case-insensitive tracked-file reference search for all eight filenames and stems:
  zero retained references. No matching active task-ledger or worktree owner.
- Preserved: `DIRECTOR.md`, `00-START-HERE.md`, all status/QA/release evidence,
  README/AGENTS files, branch governance, architecture/security/API contracts,
  production source, tests, assets, and other agents' worktrees.
- Implementer candidate `npm run check`: exit 0; layout/import integrity,
  contract/runtime checks, lint/typecheck, 870/870 frontend tests, scope audit,
  and production build passed.
- Independent QA `product:verify-layout`: exit 0.
- Independent QA `product:verify-imports`: exit 0; 3,842 imported files matched
  the baseline plus recorded patches; credential files and embedded repositories
  remained excluded/absent.
- Independent QA `scope:audit`: exit 0; 67 routes, 55 registered endpoints,
  1,533 control declarations.
- Integrated `dev` `npm run check`: exit 0; the same complete chain passed,
  including 870/870 frontend tests and production build.

Browser and hosted verification: N/A; this scope deletes unreferenced legacy
agent prompts and changes no rendered or service behavior. No real-user or
production-readiness claim is made. Remote task and integration refs are verified
with Git; GitHub CLI was unavailable in the runner.

Reviewer decision: **APPROVED** at
`18904aeb4a390e9f0e57de4d17bb58a55473c016`; previous blocker resolved, exact
scope/reference/ownership checks passed.

Verification result: **PASSED** on integrated merge
`d445a8a744940c4f5f48c7e5a8ee9063918275ea`.

Jira transition: N/A; FHE-00 is the founder-assigned V7.1 source identifier.
Next task: FHE-01 public home, only after `origin/dev` ancestry verification and
safe FHE-00 worktree retirement.
