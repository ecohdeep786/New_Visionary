// Child process owns one real PostgreSQL pool/socket. Never loads .env or ADC.
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const req = createRequire(resolve(__dirname, '../../../upstream/backend/package.json'));
const { PrismaClient } = req('@prisma/client');
const url = new URL(process.env.DATA08_WORKER_URL || '');
if (url.hostname !== '127.0.0.1' || !/^\/visionary_data_test_/.test(url.pathname) || url.searchParams.get('connection_limit') !== '1') throw Error('Disposable worker target required');
const db = new PrismaClient({ datasources: { db: { url: String(url) } } });
async function query() {
  try {
    const [row] = await db.$queryRawUnsafe('SELECT pg_backend_pid() AS pid');
    process.send?.({ type: 'connected', pid: row.pid });
  } catch (error) {
    process.send?.({ type: 'failed', roleLimit: /too many connections|connection limit/i.test(error.message) });
  }
}
process.on('message', async message => {
  if (message === 'close') { await db.$disconnect(); process.exit(0); }
  if (message === 'query') await query();
});
query();
