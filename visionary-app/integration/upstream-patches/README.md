# Intentional upstream patches

`../upstream-lock.json` remains the immutable reviewed import baseline: source commit/blob IDs, original imported hashes, exclusions and sanitization. `../upstream-patches.json` records intentional product changes separately. `npm run product:verify-imports` validates baseline plus the recorded chain; it never updates hashes automatically.

Each patch has an ID, reason, decision reference, unified diff and SHA-256 of that diff. Each changed, manifest-listed file names its component/source-relative path and before/after SHA-256. A later patch must begin at the previous recorded after hash. Unknown files, duplicated entries, changed evidence and unexpected source bytes fail verification. New product files outside the original import list remain normal first-party source; this ledger covers changes to pinned imported files.

For a change, retain the reviewed before bytes, generate the exact diff, inspect scope and record the after hashes. Do not replace the baseline or add a hash exception to conceal unreviewed work. Include the ledger and diff with the implementation review. The dependency-free tests under `scripts/tests/` exercise rejection of corrupted evidence, unknown files and broken chains; root `npm run check` includes them.

D-060 records Firebase SDK installation: the backend package/lock gain Firebase Admin, its engine declaration and local version files move to supported Node LTS, and the unused deployment image source moves from Node 20 to Node 24. Root backend commands use the installed supported Node 22/24 runtime (Node 24 recommended). No deployment is performed by changing the image source. ML/REA imports are unchanged.
