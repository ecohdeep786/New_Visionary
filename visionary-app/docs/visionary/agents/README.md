# Chained agent protocol

Authority: v2.2 Parts U and V. Start with MASTER_SPEC, read v2.2 fully, your charter, and the last STATUS entry. Read DECISIONS and QA. Never infer shipped waves from file existence.

Sequence per wave: **01-PM → 02-UX → 03-DesignSystem → 04-Frontend → 05-Motion → 06-A11y → 07-QA → Head-of-Product gate → 08-Release (Wave 6 only)**.

Role pods may divide work within the same stage; no next-stage agent starts before the prior handoff. Coordinate append-only log writes. Do not edit another agent's in-wave deliverable. If blocked, append the blocker and stop.

Each agent appends Done / Files / Decisions / Open for next / QA notes to STATUS; relevant decisions and verification evidence go to DECISIONS and QA. Then stop. The user has requested review between handoffs.

All twelve Part AA gates are required after QA. No gate is inferred from a successful build. A fail names the G-number and owner, blocks merge, and requires owner fix → QA → re-gate. No release agent before Wave 6.

Do not open or modify `docs/Frontend(Head Of Product Agent)/`. Do not revert other teams' changes. Public output is frozen for this internal work.
