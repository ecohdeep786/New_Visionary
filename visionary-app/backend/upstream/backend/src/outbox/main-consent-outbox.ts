import { PrismaClient } from '@prisma/client';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { assertCloudSqlUrl } from '../data/migration-identities';
import { WorkspaceRepository } from '../workspaces/workspace.repository';
import { cloudRunWorkerOrigin, createConsentRevocationDispatcher } from './cloud-tasks-outbox.delivery';
import { createConsentRevocationServer } from './consent-revocation.http';
import { outboxCursorKey } from './outbox-types';
import { OutboxSweeper } from './outbox.sweeper';
import { PostgresJobStore } from './postgres-job.store';

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
  const db = new PrismaClient({ datasources: { db: { url: String(url) } } });
  let serving = false;
  try {
    await WorkspaceRepository.assertRuntimeIdentity(db, { role, schema, database });
    if (mode === 'sweep-jobs') {
      const result = await new OutboxSweeper(new PostgresJobStore(db)).sweep();
      console.info(JSON.stringify({
        reclaimed: result.reclaimed.length,
        deadlineExpired: result.deadlineExpired.length,
        quarantined: result.quarantinedStale.length,
      }));
      return;
    }
    const origin = cloudRunWorkerOrigin(required('OUTBOX_WORKER_ORIGIN'));
    await db.$queryRaw`SELECT "effectAppliedAt" FROM outbox_deliveries LIMIT 0`;

    if (mode === 'dispatch') {
      const raw = required('OUTBOX_AFTER_CURSOR');
      if (!/^(0|[1-9][0-9]{0,18})$/.test(raw)) throw Error('Invalid outbox replay checkpoint.');
      const checkpoint = raw === '0' ? 0n : outboxCursorKey(BigInt(raw));
      const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-tasks'] });
      const dispatcher = createConsentRevocationDispatcher(db, {
        environment,
        workerOrigin: origin,
        invokerServiceAccount: required('OUTBOX_INVOKER_SERVICE_ACCOUNT'),
        afterCursor: checkpoint,
        accessToken: () => auth.getAccessToken(),
      });
      const outcomes = await dispatcher.dispatch(5);
      console.info(JSON.stringify({
        processed: outcomes.length,
        awaitingReceipt: outcomes.filter(row => row.status === 'DISPATCHED').length,
        completed: outcomes.filter(row => row.status === 'DONE').length,
        failed: outcomes.filter(row => row.status === 'FAILED').length,
      }));
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
    console.error('Outbox worker startup or execution failed.');
    process.exitCode = 1;
  });
}
