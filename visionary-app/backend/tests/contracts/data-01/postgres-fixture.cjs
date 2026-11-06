const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const { existsSync, readFileSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const backend = resolve(__dirname, '../../../upstream/backend');
const req = createRequire(resolve(backend, 'package.json'));
const { PrismaClient } = req('@prisma/client');

function testUrl() {
  const raw = process.env.DATA_TEST_DATABASE_URL;
  if (!raw) throw Error('DATA_TEST_DATABASE_URL must name a disposable local synthetic PostgreSQL database.');
  const url = new URL(raw);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !/^\/visionary_data_test(?:_|$)/.test(url.pathname)) {
    throw Error('Refusing a non-local or non-synthetic database.');
  }
  return url;
}
const client = (url) => new PrismaClient({ datasources: { db: { url: String(url) } } });
async function domainDatabase({ historical = false } = {}) {
  const base = testUrl();
  const admin = client(base);
  const schema = 'data01_' + randomUUID().replaceAll('-', '');
  await admin.$executeRawUnsafe('CREATE SCHEMA "' + schema + '"');
  const url = new URL(base);
  url.searchParams.set('schema', schema);
  const db = client(url);
  for (const name of ['20261024000001_data_01_workspaces', '20261102000002_data_04_invitation_reissue', '20261103000003_data_04_institution_approval', '20261106000004_file_03_downloads', '20261106000005_data_06_command_revision']) {
    if (historical && name !== '20261024000001_data_01_workspaces') break;
    const file = resolve(backend, 'prisma/migrations', name, 'migration.sql');
    if (!existsSync(file) && name !== '20261024000001_data_01_workspaces') continue;
    for (const statement of readFileSync(file, 'utf8').split(';').map(s => s.trim()).filter(Boolean)) {
      await db.$executeRawUnsafe(statement);
    }
  }
  return { db, schema, url, client: () => client(url), async close() {
    await db.$disconnect();
    if (!/^data01_[0-9a-f]{32}$/.test(schema)) throw Error('Synthetic schema cleanup boundary mismatch.');
    await admin.$executeRawUnsafe('DROP SCHEMA "' + schema + '" CASCADE');
    await admin.$disconnect();
  } };
}
module.exports = { backend, req, PrismaClient, testUrl, client, domainDatabase };
