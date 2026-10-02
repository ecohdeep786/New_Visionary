import fs from 'node:fs';const p='docs/visionary/CURRENT_PRODUCT_STATUS.md';let s=fs.readFileSync(p,'utf8').replace('Updated 2026-10-01.','Updated 2026-10-02.');s=s.replace('## Latest build — career direction recovery and conflicts',`## Latest build — recoverable portfolio self-review

Portfolio ratings, evidence notes and reflection recover after closing/reopening and refresh. Edits retain the reviewed project version and original review history, so concurrent project changes and same-project review saves are rejected without replacing fields. Recovery stays scoped to the owned project/workspace/tab in the existing resource-editor store; malformed originals are retained. Export and explicit latest-review reload are available. Saved self-review history now exposes its private ratings/reflections and current-versus-earlier project versions. Independent reviewer feedback and credentials are explicitly unavailable.

**Next:** wider professional scenario/portfolio and connected-role permission/state gates, organization policy/curriculum distribution, auxiliary schema/source reconciliation and language/accessibility/native-device acceptance. Full frontend acceptance remains open before founder-book rehearsal and backend work.

## Previous build — career direction recovery and conflicts`);fs.writeFileSync(p,s);
