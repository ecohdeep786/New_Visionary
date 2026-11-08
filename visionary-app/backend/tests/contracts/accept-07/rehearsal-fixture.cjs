// ACCEPT-07 (KAN-123) rehearsal fixture: disposable synthetic PostgreSQL
// bootstrap with the reviewed identity separation. Mirrors the DATA-02
// fixture discipline (distinct migration/runtime LOGIN roles, schema owned by
// the migration role, least-privilege runtime grants, control tables never
// runtime-writable) under an accept07_ cleanup boundary. Synthetic local data
// only; no cloud target, credential or production record is touched.
const { createRequire } = require('node:module');
const { randomUUID } = require('node:crypto');
const { resolve } = require('node:path');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');

const backend = resolve(__dirname, '../../../upstream/backend');
const req = createRequire(resolve(backend, 'package.json'));

function testUrl() {
  const raw = process.env.DATA_TEST_DATABASE_URL;
  if (!raw) throw Error('DATA_TEST_DATABASE_URL must name a disposable local synthetic PostgreSQL database.');
  const url = new URL(raw);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !/^\/visionary_data_test(?:_|$)/.test(url.pathname)) {
    throw Error('Refusing a non-local or non-synthetic database.');
  }
  return url;
}

const client = (url) => new PrismaClientFor(url);
function PrismaClientFor(url) { const { PrismaClient } = req('@prisma/client'); return new PrismaClient({ datasources: { db: { url: String(url) } } }); }

async function rehearsalDatabase() {
  const base = testUrl(), admin = client(base), id = randomUUID().replaceAll('-', '');
  const schema = 'accept07_' + id;
  // The legacy SOURCE lives in its own schema: the reviewed schema migration
  // must apply to an EMPTY target domain (isDomainEmpty law), so the source
  // and target sides of the cutover are strictly separated — exactly as in a
  // real local-data migration where the legacy store is a distinct database.
  const legacySchema = 'accept07l_' + id;
  const migrationRole = 'accept07m_' + id, runtimeRole = 'accept07r_' + id;
  const password = 'synthetic-local-only';
  for (const role of [migrationRole, runtimeRole]) {
    await admin.$executeRawUnsafe(`CREATE ROLE "${role}" LOGIN PASSWORD '${password}'`);
  }
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}" AUTHORIZATION "${migrationRole}"`);
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${legacySchema}" AUTHORIZATION "${migrationRole}"`);
  await admin.$executeRawUnsafe(`REVOKE ALL ON SCHEMA "${schema}" FROM PUBLIC`);
  await admin.$executeRawUnsafe(`GRANT USAGE ON SCHEMA "${schema}" TO "${runtimeRole}"`);
  const urlFor = (role) => { const u = new URL(base); u.username = role; u.password = password; u.searchParams.set('schema', schema); u.searchParams.set('connection_limit', '3'); return String(u); };
  const config = { migrationUrl: urlFor(migrationRole), runtimeUrl: urlFor(runtimeRole), migrationRole, runtimeRole, schema };
  const stores = [];
  return {
    admin, schema, legacySchema, migrationRole, runtimeRole, config,
    store() { const s = new (req('./dist/src/data/migration-store.js')).PostgresMigrationStore(config); stores.push(s); return s; },
    runtimeClient() { return client(config.runtimeUrl); },
    migrationClient() { return client(config.migrationUrl); },
    async grantRuntime() {
      await admin.$executeRawUnsafe(`GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA "${schema}" TO "${runtimeRole}"`);
      const sequences = await admin.$queryRawUnsafe(`SELECT sequencename FROM pg_sequences WHERE schemaname=$1 AND left(sequencename,11)<>'_visionary_'`, schema);
      for (const sequence of sequences) await admin.$executeRawUnsafe(`GRANT USAGE,SELECT ON SEQUENCE "${schema}"."${sequence.sequencename}" TO "${runtimeRole}"`);
      for (const name of ['_visionary_migrations', '_visionary_backfills', '_visionary_backfill_rows', '_visionary_backfill_cursors'])
        await admin.$executeRawUnsafe(`REVOKE ALL ON TABLE "${schema}"."${name}" FROM "${runtimeRole}"`).catch(e => { if (!String(e).includes('does not exist')) throw e; });
    },
    async close() {
      await Promise.all(stores.map(s => s.close().catch(() => {})));
      await admin.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
      await admin.$executeRawUnsafe(`DROP SCHEMA "${legacySchema}" CASCADE`);
      for (const role of [migrationRole, runtimeRole]) {
        await admin.$executeRawUnsafe(`DROP ROLE "${role}"`).catch(e => {
          if (!String(e).includes('cannot be dropped because some objects depend')) throw e;
        });
      }
      await admin.$disconnect();
    },
  };
}

// The originals ledger: immutable counts + per-row digests of the legacy data,
// snapshotted once and re-verified after every stage. Ownership linkage is
// recorded per row so the canonical copies can be proven owner-faithful.
async function seedOriginals(admin, schema, learners) {
  await admin.$executeRawUnsafe(`CREATE TABLE "${schema}"."legacy_learners" (
    id TEXT PRIMARY KEY, email TEXT NOT NULL, "fullName" TEXT NOT NULL, stage TEXT NOT NULL,
    "legacyOwnerEmail" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  for (const learner of learners) {
    await admin.$executeRawUnsafe(
      `INSERT INTO "${schema}"."legacy_learners"(id,email,"fullName",stage,"legacyOwnerEmail") VALUES($1,$2,$3,$4,$5)`,
      learner.id, learner.email, learner.fullName, learner.stage, learner.legacyOwnerEmail);
  }
}

// The migration identity must be able to READ the retained legacy data (it is
// the cutover executor); it must never need to write it.
async function grantLedgerRead(admin, schema, migrationRole) {
  await admin.$executeRawUnsafe(`GRANT SELECT ON "${schema}"."legacy_learners" TO "${migrationRole}"`);
}

const rowDigest = (row) => createHash('sha256').update(JSON.stringify(row)).digest('hex');

async function ledgerOriginals(admin, schema) {
  const rows = (await admin.$queryRawUnsafe(`SELECT id,email,"fullName",stage,"legacyOwnerEmail" FROM "${schema}"."legacy_learners" ORDER BY id`))
    .map(r => ({ ...r, digest: rowDigest(r) }));
  const digest = createHash('sha256').update(JSON.stringify(rows)).digest('hex');
  return { table: 'legacy_learners', count: rows.length, digest, rows };
}

module.exports = { rehearsalDatabase, seedOriginals, ledgerOriginals, grantLedgerRead, rowDigest, req, backend, testUrl, client };
