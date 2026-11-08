// ACCEPT-07 (KAN-123) — reviewed schema/local-data migration REHEARSAL.
//
// Executes the complete operational cutover rehearsal against a disposable
// synthetic PostgreSQL instance with the reviewed identity separation, exactly
// as a staging operator would run it: an immutable originals ledger, the
// reviewed schema migration through the operator command path, a bounded
// canary cutover of the local-data migration with originals retained and
// owner-faithful copies, the full cutover with counts/digests/ownership
// verification, rollback rehearsals (including the law that a populated
// domain can never be silently rolled back), and the exactly-one-executor
// evidence for side-effecting commands. A rehearsal is practice evidence; the
// real staging cutover remains the operator's action per the report checklist.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const local = createRequire(import.meta.url);
const { rehearsalDatabase, seedOriginals, ledgerOriginals, grantLedgerRead, req, backend } = local('./rehearsal-fixture.cjs');
const { MigrationRunner } = req('./dist/src/data/migration-runner.js');
const { canonicalMigrations, registerMigration } = req('./dist/src/data/migration-registry.js');
const { BackfillRunner } = req('./dist/src/data/backfill-runner.js');
const { runMigrationCommand, assertProductionAdmission } = req('./dist/src/data/migration-command.js');
const { assertSeparateIdentities } = req('./dist/src/data/migration-identities.js');

const productRoot = resolve(fileURLToPath(new URL('../../../..', import.meta.url)));

// The reviewed UID-linkage rule: a legacy learner's canonical identity is
// derived deterministically from the legacy identity; the migration never
// invents owners or merges identities.
const canonicalUid = (email) => 'v' + createHash('sha256').update('visionary-legacy-identity:' + email).digest('hex').slice(0, 40);
const REVIEWED_MAPPING_DEFINITION = createHash('sha256')
  .update(JSON.stringify({ source: 'legacy_learners', targets: ['persons', 'workspaces', 'workspace_memberships'], uidRule: 'v+sha256(visionary-legacy-identity:email).slice(0,40)', originalsRetained: true }))
  .digest('hex');

const N = 24;
const learners = Array.from({ length: N }, (_, i) => ({
  id: `legacy-${String(i + 1).padStart(4, '0')}`,
  email: `learner-${i + 1}@synthetic.example`,
  fullName: `Synthetic Learner ${i + 1}`,
  stage: ['school', 'higher_ed', 'competitive'][i % 3],
  legacyOwnerEmail: `learner-${i + 1}@synthetic.example`,
}));

test('ACCEPT-07: the complete migration cutover rehearsal with originals retained', async () => {
  const stages = [];
  const step = (name, ok, detail) => { stages.push({ name, ok, detail }); if (!ok) throw Error(`REHEARSAL_STAGE_FAILED: ${name} — ${detail}`); };

  const db = await rehearsalDatabase();
  try {
    // ---- Phase 0: bootstrap — the operator's separate identities -------- //
    step('bootstrap: distinct migration/runtime roles own or read the schema', true, `${db.migrationRole} / ${db.runtimeRole}`);
    assert.throws(() => assertSeparateIdentities({ ...db.config, runtimeUrl: db.config.migrationUrl, runtimeRole: db.migrationRole }), /IDENTITY_CONFLICT/, 'One role cannot hold both identities.');

    // ---- Phase 1: originals ledger (legacy SOURCE schema) --------------- //
    await seedOriginals(db.admin, db.legacySchema, learners);
    await grantLedgerRead(db.admin, db.legacySchema, db.migrationRole);
    const originals = await ledgerOriginals(db.admin, db.legacySchema);
    assert.equal(originals.count, N);
    step('originals ledger snapshotted', true, `${N} rows, digest ${originals.digest.slice(0, 12)}…`);

    // ---- Phase 2: reviewed schema migration through the command path ---- //
    const env = {
      DATA_DATABASE_MODE: 'synthetic',
      DATA_MIGRATION_DATABASE_URL: db.config.migrationUrl,
      DATA_RUNTIME_DATABASE_URL: db.config.runtimeUrl,
      DATA_MIGRATION_ROLE: db.migrationRole,
      DATA_RUNTIME_ROLE: db.runtimeRole,
      DATA_DATABASE_SCHEMA: db.schema,
      VISIONARY_RELEASE_COMMIT: 'a'.repeat(40),
    };
    const plan = await runMigrationCommand('plan', env, backend);
    assert.equal(plan.status, undefined); // plan is a plan, not a receipt
    assert.ok(plan.registryDigest.length === 64);
    assert.ok(plan.versions.length >= 1);
    step('reviewed plan artifact', true, `registry ${plan.registryDigest.slice(0, 12)}…, versions ${plan.versions.join(',')}`);

    const apply = await runMigrationCommand('apply', env, backend);
    assert.equal(apply.status, 'verified');
    assert.deepEqual(apply.appliedVersions, plan.versions);
    step('schema migration applied and verified', true, `${apply.appliedVersions.length} migrations, environment ${apply.environment}`);

    const afterSchema = await ledgerOriginals(db.admin, db.legacySchema);
    assert.deepEqual({ count: afterSchema.count, digest: afterSchema.digest }, { count: originals.count, digest: originals.digest },
      'The schema migration must not touch a single retained row.');
    step('originals retained through the schema migration', true, `digest unchanged ${originals.digest.slice(0, 12)}…`);

    // The runtime identity is least-privilege in PostgreSQL itself.
    const runtime = db.runtimeClient();
    await assert.rejects(() => runtime.$executeRawUnsafe(`CREATE TABLE "${db.schema}"."runtime_ddl_probe" (id TEXT)`), /permission denied/, 'The runtime role must have no DDL rights.');
    await assert.rejects(() => runtime.$executeRawUnsafe(`INSERT INTO "${db.schema}"."_visionary_migrations"(version,name,checksum,status,"schemaDigest") VALUES(999,'probe','x','applied','y')`), /permission denied/, 'The runtime role must have no control-table writes.');
    step('runtime identity denied DDL and control writes (PostgreSQL ground truth)', true, 'CREATE TABLE + control INSERT both permission-denied');
    await runtime.$disconnect();

    // Production admission: a production target is refused unless the source
    // commit is the approved SHA and a verified staging receipt (integrity-
    // checked, ≤7 days old, matching registry/versions/schema) accompanies it.
    const productionConfig = { migrationUrl: 'postgresql://localhost/x', runtimeUrl: 'postgresql://localhost/y', migrationRole: db.migrationRole, runtimeRole: db.runtimeRole, schema: db.schema, cloudSql: { environment: 'production', project: 'visionary-research', region: 'asia-south1', instance: 'visionary-product-data', database: 'visionary_product' } };
    const commit = 'a'.repeat(40);
    assert.throws(() => assertProductionAdmission({ VISIONARY_RELEASE_COMMIT: commit }, productionConfig, plan.registryDigest, undefined, plan.versions),
      /MIGRATION_SOURCE_NOT_APPROVED/, 'A production cutover from an unapproved source commit must be refused.');
    const approvedEnv = { VISIONARY_RELEASE_COMMIT: commit, DATA_MIGRATION_APPROVED_SHA: commit };
    assert.throws(() => assertProductionAdmission(approvedEnv, productionConfig, plan.registryDigest, undefined, plan.versions),
      /STAGING_RECEIPT_REQUIRED/, 'A production cutover without a verified staging receipt must be refused.');
    const receiptBytes = JSON.stringify({ environment: 'staging', sourceCommit: commit, registryDigest: plan.registryDigest, project: 'visionary-research', region: 'asia-south1', instance: 'visionary-product-data', database: 'visionary_data_staging_accept07', schema: db.schema, status: 'verified', appliedVersions: plan.versions, verifiedAt: new Date().toISOString() });
    assert.doesNotThrow(() => assertProductionAdmission({ ...approvedEnv, DATA_STAGING_RECEIPT_SHA256: createHash('sha256').update(receiptBytes).digest('hex') },
      productionConfig, plan.registryDigest, receiptBytes, plan.versions), 'A valid verified staging receipt must admit the production cutover.');

    // ---- Phase 3: canary cutover of the local-data migration ------------ //
    const canonicalTables = {
      persons: db.migrationClient(), workspaces: db.migrationClient(), memberships: db.migrationClient(),
    };
    const canonicalState = async () => ({
      persons: (await canonicalTables.persons.$queryRawUnsafe(`SELECT "uid" FROM "${db.schema}"."persons" ORDER BY "uid"`)).map(r => r.uid),
      workspaces: (await canonicalTables.workspaces.$queryRawUnsafe(`SELECT id,"uid",name,slug,"isPersonal" FROM "${db.schema}"."workspaces" ORDER BY id`)),
      memberships: (await canonicalTables.memberships.$queryRawUnsafe(`SELECT id,"uid","workspaceId",role,source FROM "${db.schema}"."workspace_memberships" ORDER BY id`)),
    });

    // The reviewed write: one legacy row becomes the canonical UID-linked
    // person + personal workspace + OWNER membership, inside the runner's
    // transaction; the legacy row is never rewritten.
    const write = async (tx, row) => {
      const uid = canonicalUid(row.email);
      const workspaceId = 'ws_' + row.id, membershipId = 'm_' + row.id;
      await tx.$executeRawUnsafe(`INSERT INTO "persons"("uid","updatedAt") VALUES($1, CURRENT_TIMESTAMP) ON CONFLICT("uid") DO NOTHING`, uid);
      await tx.$executeRawUnsafe(`INSERT INTO "workspaces"(id,"uid",name,slug,"isPersonal","updatedAt") VALUES($1,$2,$3,$4,TRUE,CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO NOTHING`, workspaceId, uid, `${row.fullName} — personal`, 'personal-' + row.id);
      await tx.$executeRawUnsafe(`INSERT INTO "workspace_memberships"(id,"uid","workspaceId",role,source,"updatedAt") VALUES($1,$2,$3,'OWNER','legacy-migration',CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO NOTHING`, membershipId, uid, workspaceId);
    };
    const legacySource = {
      async next(cursor, limit) {
        const rows = (await db.admin.$queryRawUnsafe(
          `SELECT id,email,"fullName",stage,"legacyOwnerEmail" FROM "${db.legacySchema}"."legacy_learners" WHERE id > $1 ORDER BY id LIMIT $2`, cursor ?? '', limit));
        const last = rows[rows.length - 1];
        return { rows: rows.map(r => ({ key: r.id, ...r })), nextCursor: last ? last.id : null, done: rows.length < limit };
      },
    };

    const canary = await new BackfillRunner(db.store(), legacySource, write)
      .run({ name: 'accept07-legacy-learners', definition: REVIEWED_MAPPING_DEFINITION, batchSize: 2, maxRows: 5, maxBatches: 10, maxDurationMs: 30000 });
    assert.equal(canary.processed, 5);
    assert.equal(canary.done, false);
    const canaryState = await canonicalState();
    assert.equal(canaryState.persons.length, 5, 'The canary must migrate exactly the bounded subset.');
    const afterCanary = await ledgerOriginals(db.admin, db.legacySchema);
    assert.equal(afterCanary.digest, originals.digest, 'The canary cutover must not touch the retained originals.');
    step('canary cutover: bounded subset migrated, originals untouched', true, `5/${N} rows; original digest unchanged`);

    // ---- Phase 4: full cutover and global verification ------------------ //
    const full = await new BackfillRunner(db.store(), legacySource, write)
      .run({ name: 'accept07-legacy-learners', definition: REVIEWED_MAPPING_DEFINITION, batchSize: 4, maxRows: 10000, maxBatches: 100, maxDurationMs: 30000 });
    assert.equal(full.done, true);
    assert.equal(full.processed, N, 'The resumed run reports the cumulative checkpoint: all N rows complete, none written twice.');

    const finalState = await canonicalState();
    assert.equal(finalState.persons.length, N);
    assert.equal(finalState.workspaces.length, N);
    assert.equal(finalState.memberships.length, N);
    for (const workspace of finalState.workspaces) {
      assert.equal(workspace.isPersonal, true);
      assert.ok(workspace.uid === canonicalUid(learners.find(l => 'ws_' + l.id === workspace.id).email), `Workspace ${workspace.id} must be owner-faithful to the reviewed UID rule.`);
    }
    for (const membership of finalState.memberships) {
      assert.equal(membership.role, 'OWNER');
      assert.equal(membership.source, 'legacy-migration');
      assert.equal(membership.uid, finalState.workspaces.find(w => w.id === membership.workspaceId).uid, 'Membership, workspace and person must share the canonical UID.');
    }
    const afterFull = await ledgerOriginals(db.admin, db.legacySchema);
    assert.equal(afterFull.digest, originals.digest, 'The full cutover must leave the originals byte-identical.');
    step('full cutover: counts, digests and ownership verified; originals retained', true, `${N} persons/workspaces/memberships; original digest unchanged`);

    // A drifted definition cannot attach to the completed backfill.
    await assert.rejects(() => new BackfillRunner(db.store(), legacySource, write)
      .run({ name: 'accept07-legacy-learners', definition: 'b'.repeat(64), maxRows: 1 }), /BACKFILL_DEFINITION_DRIFT/,
      'A changed mapping definition must be refused against the recorded checkpoint.');

    // ---- Phase 5: rollback rehearsals ------------------------------------ //
    // The reviewed registry is FORWARD-ONLY BY DESIGN: every canonical
    // migration is non-reversible, so rollbackLast over the populated domain
    // is refused (reversibility guard) — recovery is snapshot-based, never a
    // silent downgrade that could destroy retained originals.
    await assert.rejects(() => new MigrationRunner(db.store(), canonicalMigrations(backend)).rollbackLast(), /ROLLBACK_DENIED/,
      'The reviewed registry must refuse rollback — forward-only recovery by design.');
    const scratch = await rehearsalDatabase();
    try {
      const scratchRunner = new MigrationRunner(scratch.store(), canonicalMigrations(backend));
      await assert.rejects(() => scratchRunner.rollbackLast(), /NOTHING_TO_ROLLBACK/, 'An empty domain has no receipts to roll back.');
      // The runner's rollback PATH is real: a reversible synthetic probe
      // migration rolls back cleanly; the reviewed ones never do.
      const probeRegistry = [...canonicalMigrations(backend), registerMigration({
        version: 100, name: 'accept07-reversible-probe', requires: [5], reversible: true,
        statements: [`CREATE TABLE "${scratch.schema}"."accept07_probe" (id TEXT)`],
        down: [`DROP TABLE "${scratch.schema}"."accept07_probe"`],
      })];
      const probeRunner = new MigrationRunner(scratch.store(), probeRegistry);
      const applied = await probeRunner.applyAll();
      assert.ok(applied.applied >= 1);
      const rollback = await probeRunner.rollbackLast();
      assert.equal(rollback.status, 'rolled_back');
      assert.deepEqual([...rollback.remainingVersions].sort((a, b) => a - b), applied.receipts.map(r => r.version).sort((a, b) => a - b).slice(0, -1));
      const verified = await probeRunner.verify(rollback.remainingVersions);
      assert.equal(verified.consistent, true);
      const reapplied = await probeRunner.applyAll();
      assert.equal(reapplied.applied, 1);
      step('rollback rehearsal: reviewed registry forward-only by design; reversible probe applies, rolls back, re-applies', true,
        `ROLLBACK_DENIED on canonical; probe schema ${scratch.schema.slice(0, 18)}…`);
    } finally { await scratch.close(); }

    // ---- Phase 6: exactly one executor per side-effecting command ------- //
    const concurrent = await rehearsalDatabase();
    try {
      const runnerA = new MigrationRunner(concurrent.store(), canonicalMigrations(backend));
      const runnerB = new MigrationRunner(concurrent.store(), canonicalMigrations(backend));
      const [first, second] = await Promise.all([runnerA.applyAll(), runnerB.applyAll()]);
      const applied = [first.applied, second.applied];
      assert.deepEqual(applied.sort((a, b) => b - a), [canonicalMigrations(backend).length, 0],
        'Two concurrent applies must yield exactly one side-effecting execution.');
      // The probe write is deliberately NON-idempotent: if two executors ever
      // wrote the same row without the checkpoint fence, PostgreSQL would
      // raise a unique violation — silent duplication is impossible by
      // construction, so an exact final count proves the serialization law.
      const probeWrite = async (tx, row) => {
        const uid = canonicalUid(row.email);
        await tx.$executeRawUnsafe(`INSERT INTO "persons"("uid","updatedAt") VALUES($1, CURRENT_TIMESTAMP)`, uid);
      };
      const probeSource = {
        async next(cursor, limit) {
          const rows = (await concurrent.admin.$queryRawUnsafe(
            `SELECT id,email FROM "${concurrent.legacySchema}"."legacy_learners" WHERE id > $1 ORDER BY id LIMIT $2`, cursor ?? '', limit));
          const last = rows[rows.length - 1];
          return { rows: rows.map(r => ({ key: r.id, ...r })), nextCursor: last ? last.id : null, done: rows.length < limit };
        },
      };
      await concurrent.admin.$executeRawUnsafe(`CREATE TABLE "${concurrent.legacySchema}"."legacy_learners" (id TEXT PRIMARY KEY, email TEXT NOT NULL, "fullName" TEXT NOT NULL, stage TEXT NOT NULL, "legacyOwnerEmail" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
      for (const learner of learners) await concurrent.admin.$executeRawUnsafe(
        `INSERT INTO "${concurrent.legacySchema}"."legacy_learners"(id,email,"fullName",stage,"legacyOwnerEmail") VALUES($1,$2,$3,$4,$5)`,
        learner.id, learner.email, learner.fullName, learner.stage, learner.legacyOwnerEmail);
      await grantLedgerRead(concurrent.admin, concurrent.legacySchema, concurrent.migrationRole);
      const runProbe = () => new BackfillRunner(concurrent.store(), probeSource, probeWrite)
        .run({ name: 'accept07-concurrent-probe', definition: REVIEWED_MAPPING_DEFINITION, batchSize: 5, maxRows: N, maxBatches: 100, maxDurationMs: 30000 });
      const outcomes = await Promise.allSettled([runProbe(), runProbe()]);
      const fulfilled = outcomes.filter(o => o.status === 'fulfilled');
      const rejected = outcomes.filter(o => o.status === 'rejected');
      assert.ok(fulfilled.length >= 1, 'At least one executor must complete the probe backfill.');
      for (const o of fulfilled) assert.ok(o.value.processed <= N, 'The cumulative checkpoint can never exceed the source size.');
      const persons = (await concurrent.admin.$queryRawUnsafe(`SELECT count(*)::int AS count, count(DISTINCT "uid")::int AS distinct_uids FROM "${concurrent.schema}"."persons"`))[0];
      assert.equal(persons.count, N, 'Concurrent executors must serialize on the checkpoint with zero duplicates.');
      assert.equal(persons.distinct_uids, N);
      step('exactly one executor: concurrent applies serialize; concurrent backfills fence on the checkpoint', true,
        `${canonicalMigrations(backend).length} applied once; probe ${fulfilled.length} fulfilled / ${rejected.length} fenced (${rejected.map(o => String(o.reason.message || o.reason).split('\n')[0]).join('; ') || 'none'}); ${N} persons exactly once`);
    } finally { await concurrent.close(); }
    [canonicalTables.persons, canonicalTables.workspaces, canonicalTables.memberships].forEach(c => c.$disconnect());

    // ---- Phase 7: the operator's staging checklist ----------------------- //
    const report = {
      task: 'ACCEPT-07 / KAN-123', kind: 'migration-cutover-rehearsal', date: new Date().toISOString(),
      database: 'disposable synthetic PostgreSQL (local)', identitySeparation: { migrationRole: db.migrationRole.slice(0, 20) + '…', runtimeRole: db.runtimeRole.slice(0, 20) + '…' },
      registryDigest: plan.registryDigest, versions: plan.versions,
      originals: { table: originals.table, count: originals.count, digest: originals.digest, retainedAfterEveryStage: true },
      canary: { processed: 5, definition: REVIEWED_MAPPING_DEFINITION },
      cutover: { processed: N, persons: N, workspaces: N, memberships: N, ownerFaithful: true },
      rollback: { reviewedRegistry: 'FORWARD-ONLY BY DESIGN — ROLLBACK_DENIED on every canonical migration', probe: 'reversible synthetic migration: applied → rolled_back → verified → re-applied', recovery: 'snapshot-based, never downgrade' },
      singleExecutor: { concurrentApplies: 'exactly one side-effecting', concurrentBackfills: 'checkpoint serialization, zero duplicates' },
      operatorChecklist: [
        'Freeze writers: stop every product instance writing the target database before any side-effecting command (exactly one executor).',
        'Snapshot the originals: full backup + the counts/digests ledger of every legacy table, recorded before the first command.',
        'Separate identities: DATA_MIGRATION_ROLE (schema owner) and DATA_RUNTIME_ROLE (least-privilege DML only) must be distinct LOGIN roles.',
        'Plan first: run the plan command and archive the registry digest + version list as the cutover record.',
        'Apply the reviewed schema migration; re-verify the originals ledger digest is byte-identical afterwards.',
        'Canary: run the local-data backfill bounded (maxRows) to a subset; verify ownership linkage and original digests before proceeding.',
        'Resume to completion; verify global counts, per-row ownership faithfulness and the retained originals.',
        'A populated-domain rollback is FORBIDDEN: the reviewed registry is forward-only by design (ROLLBACK_DENIED) — recovery is forward-only from the snapshot.',
        'Archive the verified receipt with the release commit; production admission requires it (STAGING_RECEIPT_REQUIRED).',
      ],
      stages: stages.map(s => ({ name: s.name, ok: s.ok })),
    };
    const dir = resolve(productRoot, 'artifacts/qa/accept-07-rehearsal', new Date().toISOString().replace(/[:.]/g, '-'));
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'rehearsal-report.json'), JSON.stringify(report, null, 2));
    console.log(`ACCEPT-07 rehearsal PASSED — ${stages.length} stages, report: artifacts/qa/accept-07-rehearsal/`);
  } finally { await db.close(); }
});
