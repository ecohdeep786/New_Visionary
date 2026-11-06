# KAN-41 DATA-06 durable metadata command replacement

Acceptance scope: dormant owning-store command slice, not full product cutover.
Implementer: principal/root. Independent reviewer and exact decision pending.
Fresh branch: codex/principal-kan-41-durable-commands, base verified dev
e12de19c5af5a623a1cd3743fbba16d745ef5188. Original9c887be1 remains rejected
and preserved on its original and old rework refs.

The replacement writes actual workspace metadata and its receipt, audit and
pending outbox event atomically. It supports explicit rename/describe operations
with one workspace-metadata revision sequence, rather than pretending arbitrary
client JSON is a domain commit. It exposes no generic deletion or dispatch API.

Current DML role/schema/database identity, owner authority and retained person/
workspace tombstones are checked inside the transaction before replay. The
canonical account lock precedes the workspace lock. Replay binds owner,
workspace, operation, expected revision and normalized value. Revision comparison
and writes share those locks; retries recover the original snapshot and cannot
reuse a key for another operation/workspace. Timestamps come from PostgreSQL.
No new schema or historical migration rewrite is needed.

Verification: TypeScript data compilation and ten actual PostgreSQL cases passed
against isolated loopback schemas using the existing canonical migration chain
and DML-only runtime role. Independent connections prove one of two same-revision
commands commits, simultaneous retries converge, and a cold client recovers a
receipt. Tests also prove actual write/readback, scope conflicts, ownership loss,
forged OWNER membership denial, retained tombstone denial, injected outbox outage
rolling back domain/audit/receipt writes, trusted time/input checks and privileged
or mismatched SQL target refusal. The suite is registered in data:check.
Layout and imported-source provenance checks passed; no credentials changed.
Local test logs live outside Git in Visionary-local. Full candidate CI is pending.

Remaining gates: verified Firebase caller/controller, released workspace admission
and frontend adapter, connected browser/two-device observations, broader per-domain
revision/deletion operations, consent/source checks where those operations require
them, real outbox delivery via KAN-53, and hosted acceptance. This slice does not
publish new SQL workspace permissions or mutate retained learner records. No full
KAN-41 Done or browser acceptance is claimed. No implementation self-approval.
