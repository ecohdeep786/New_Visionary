import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { assertCloudSqlUrl } from '../data/migration-identities';
import { cloudRunWorkerOrigin, createConsentRevocationDispatcher } from './cloud-run-outbox.delivery';
import { createConsentRevocationServer } from './consent-revocation.http';
import { outboxCursorKey } from './outbox-types';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw Error('Outbox configuration required.');
  return value;
}

async function main(mode: string) {
  const environment = required('OUTBOX_DATABASE_MODE');
  if (environment !== 'staging' && environment !== 'production') throw Error('Invalid outbox environment.');
  const database = required('OUTBOX_DATABASE_NAME');
  const schema = required('OUTBOX_DATABASE_SCHEMA');
  const role = required('OUTBOX_DATABASE_ROLE');
  const url = assertCloudSqlUrl(required('OUTBOX_DATABASE_URL'), {
    environment, database, project: 'visionary-research', region: 'asia-south1', instance: required('OUTBOX_SQL_INSTANCE'),
  });
  if (url.searchParams.get('schema') !== schema || decodeURIComponent(url.username) !== role) {
    throw Error('Outbox SQL role and schema must match.');
  }
  const origin = cloudRunWorkerOrigin(required('OUTBOX_WORKER_ORIGIN'));
  const db = new PrismaClient({ datasources: { db: { url: String(url) } } });
  let serving = false;
  try {
    const [identity] = await db.$queryRaw<Array<{ role: string; schema: string; database: string; privileged: boolean }>>`
      SELECT current_user AS role, current_schema() AS schema, current_database() AS database,
        rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls
        OR has_schema_privilege(current_user, current_schema(), 'CREATE')
        OR has_database_privilege(current_user, current_database(), 'CREATE') AS privileged
      FROM pg_roles WHERE rolname = current_user
    `;
    if (!identity || identity.privileged || identity.role !== role || identity.schema !== schema ||
        identity.database !== database) throw Error('Outbox SQL identity rejected.');
    await db.$queryRaw`SELECT "effectAppliedAt" FROM outbox_deliveries LIMIT 0`;

    if (mode === 'dispatch') {
      const raw = required('OUTBOX_AFTER_CURSOR');
      if (!/^(0|[1-9][0-9]{0,18})$/.test(raw)) throw Error('Invalid outbox replay checkpoint.');
      const checkpoint = raw === '0' ? 0n : outboxCursorKey(BigInt(raw));
      const outcomes = await createConsentRevocationDispatcher(db, origin, checkpoint).dispatch(1);
      console.info(JSON.stringify({ processed: outcomes.length, completed: outcomes.filter(row => row.status === 'DONE').length }));
      return;
    }

    const subject = required('OUTBOX_CALLER_SUBJECT');
    const port = Number(required('PORT'));
    if (mode !== 'receive' || !/^[0-9]{21}$/.test(subject) || !Number.isInteger(port) || port < 1 || port > 65535) {
      throw Error('Outbox receiver identity or port is invalid.');
    }
    const google = new OAuth2Client();
    const server = createConsentRevocationServer(db, async token => {
      const ticket = await google.verifyIdToken({ idToken: token, audience: origin });
      return ticket.getPayload()?.sub === subject;
    });
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '0.0.0.0', () => {
        server.off('error', reject);
        resolve();
      });
    });
    serving = true;
    const close = () => server.close(() => { void db.$disconnect(); });
    process.once('SIGTERM', close);
    process.once('SIGINT', close);
  } finally {
    if (!serving) await db.$disconnect();
  }
}

if (require.main === module) {
  void main(process.argv[2]).catch(() => {
    console.error('Consent outbox startup or dispatch failed.');
    process.exitCode = 1;
  });
}
