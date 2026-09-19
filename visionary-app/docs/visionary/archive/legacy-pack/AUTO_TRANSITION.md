# Auto-Transition Engine — the product upgrades itself
Purpose: when a learner's stage changes (class 5→6, secondary→higher secondary, exam cycle,
role change), Visionary applies the upgrade ITSELF. The user is informed, never required to act.
Supersedes v1 §8.10 "confirm before promote": confirmation is now a non-blocking safety valve.
Blocking confirm remains REQUIRED only for: minor→adult safety-tier change, board/institution
switch, jump >1 stage, org policy demand. Evidence is never deleted — only archived.

## Triggers (priority order)
1 Organization promotion event (roster/term update) — authoritative.
2 Guardian-confirmed promotion (minor) or self-confirmation (adult), when provided.
3 User-declared change (profile edit, onboarding re-run).
4 Academic-calendar rollover fixture (board-specific month) — applies automatically.
5 Evidence-based inference — NEVER applies alone; shows "We think you're ready for…" suggestion;
  auto-applies only after explicit accept or two consecutive confirmations from triggers 1–4.

## What the engine changes automatically (one atomic transition job)
- stageProfile swap (STAGE_ADAPTATION_MATRIX): vocabulary, density, session length, home modules.
- Curriculum remap: class N→N+1 in same board; new subjects added; dropped subjects archived
  with progress preserved + "Resume anytime" entry.
- Mastery carry-forward: every MasteryRecord maps 1:1 to the new objective graph or is archived
  with reason; no orphan objectives; gaps become a generated Bridge Plan.
- Practice/retention queue remapped; due dates preserved where the concept persists.
- Assignments re-scoped: open org work keeps its original stage label; new work uses new stage.
- Home/Today regenerated; Continue resumes at the MAPPED position — never resets.
- Audience views flip only post-commit: parent report, teacher cohort, org insights each receive
  a plain-language transition insight ("Moved to Class 6 — here's what changed").
- Preferences preserved: languages, pace, accessibility, personalization memory.

## User-facing contract (zero required action)
- Non-blocking Home card + notification: "You're now learning in Class 6."
  Actions: See what changed (diff) · Postpone 7 days · Undo (14 days) · implicit keep.
- No modal wall, no forced wizard, no lost position if ignored.
- Minor → guardian notified; adult → self only; org-connected → teacher/org see cohort move.
- Every auto-change reversible inside the undo window and logged (audit + insight).

## Mock & test requirements
- Fixture: seeded CBSE class 5→6 promotion for the minor persona with full before/after state.
- Dev scenario switcher: "Simulate promotion" (excluded from production).
- Invariants: mastery remap 1:1-or-archived · practice denominators consistent · audience views
  flip post-commit only · undo restores exact prior state · transition insight per audience.
- Flow test: promotion commits mid-lesson → resume lands on the mapped Class 6 objective.