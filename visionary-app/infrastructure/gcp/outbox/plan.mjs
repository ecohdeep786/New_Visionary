import { production } from '../release.mjs';

const sqlRoles = Object.freeze({ sender: 'visionary_consent_send', receiver: 'visionary_consent_receive' });
const command = 'dist/src/outbox/main-consent-outbox.js';
const sha256 = /^[a-f0-9]{64}$/;
const account = local => `${local}@${production.project}.iam.gserviceaccount.com`;
const instanceName = 'visionary-product-db';
const project = '--project=' + production.project;
const region = '--region=' + production.region;
const location = '--location=' + production.region;

function secretVersion(reference, identity) {
  if (typeof reference !== 'string' || !reference.startsWith(`visionary-consent-production-${identity}:`) ||
      !/^[1-9][0-9]*$/.test(reference.split(':')[1] ?? '') || reference.split(':').length !== 2) {
    throw Error('Each workload requires its own pinned production SQL secret.');
  }
  return reference;
}

export function outboxProductionSqlPlan() {
  return {
    instance: instanceName,
    productionDatabase: 'visionary_product',
    stagingDatabase: 'visionary_data_staging_outbox',
    schema: 'product',
    create: ['sql', 'instances', 'create', instanceName, project, region, '--edition=ENTERPRISE',
      '--database-version=POSTGRES_16', '--tier=db-custom-1-3840', '--availability-type=regional',
      '--storage-type=SSD', '--storage-size=10GB', '--storage-auto-increase', '--storage-auto-increase-limit=20GB',
      '--assign-ip', '--connector-enforcement=REQUIRED', '--backup-start-time=21:00', '--retained-backups-count=7',
      '--enable-point-in-time-recovery', '--retained-transaction-log-days=7', '--deletion-protection'],
  };
}

/** Build the Mumbai production deployment without mutating Cloud Run, Tasks or Scheduler. */
export function outboxProductionPlan({ source, image, instance, database, schema, afterCursor,
  invokerSubject, senderSecret, receiverSecret, stagingReceiptSha256 }) {
  if (!/^[a-f0-9]{40}$/.test(source ?? '') || typeof image !== 'string' || !image.startsWith(production.image + '@sha256:') ||
      !sha256.test(image.slice((production.image + '@sha256:').length)) || !sha256.test(stagingReceiptSha256 ?? '')) {
    throw Error('An exact source, immutable product image and staging receipt are required.');
  }
  if (instance !== instanceName || database !== 'visionary_product' || schema !== 'product') {
    throw Error('The canonical production Cloud SQL target is required.');
  }
  if (typeof afterCursor !== 'string' || !/^(0|[1-9][0-9]{0,18})$/.test(afterCursor) ||
      BigInt(afterCursor) > 9223372036854775807n || !/^[0-9]{21}$/.test(invokerSubject ?? '')) {
    throw Error('An explicit replay checkpoint and the numeric Cloud Tasks invoker identity are required.');
  }
  const cloudSql = `${production.project}:${production.region}:${instance}`;
  const receiver = 'visionary-consent-receive-prod';
  const sender = 'visionary-consent-send-prod';
  const trigger = 'visionary-consent-trigger-prod';
  const queue = 'visionary-consent-production';
  const invoker = account('visionary-outbox-invoke-prod');
  const serviceAgent = `service-${production.projectNumber}@gcp-sa-cloudtasks.iam.gserviceaccount.com`;
  const receiverOrigin = `https://${receiver}-${production.projectNumber}.${production.region}.run.app`;
  const variables = `OUTBOX_DATABASE_MODE=production,OUTBOX_DATABASE_NAME=${database},OUTBOX_DATABASE_SCHEMA=${schema},OUTBOX_SQL_INSTANCE=${instance},OUTBOX_WORKER_ORIGIN=${receiverOrigin}`;
  const imageFlags = ['--image=' + image, '--set-cloudsql-instances=' + cloudSql, '--cpu=1', '--memory=512Mi', '--command=node'];
  return {
    source, image, stagingReceiptSha256, cloudSql, database, schema, receiverOrigin, queue,
    identities: { sender: account(sender), receiver: account(receiver), invoker, trigger: account(trigger), serviceAgent },
    sqlRoles,
    queueCreate: ['tasks', 'queues', 'create', queue, project, location, '--max-attempts=3', '--max-retry-duration=45s',
      '--min-backoff=5s', '--max-backoff=10s', '--max-doublings=1', '--max-concurrent-dispatches=1', '--max-dispatches-per-second=1'],
    receiverDeploy: ['run', 'deploy', receiver, project, region, ...imageFlags, '--service-account=' + account(receiver),
      '--ingress=internal', '--no-allow-unauthenticated', '--invoker-iam-check', '--execution-environment=gen2',
      '--min=0', '--max-instances=1', '--concurrency=1', '--timeout=20s', '--args=' + command + ',receive',
      `--set-env-vars=${variables},OUTBOX_DATABASE_ROLE=${sqlRoles.receiver},OUTBOX_CALLER_SUBJECT=${invokerSubject}`,
      '--set-secrets=OUTBOX_DATABASE_URL=' + secretVersion(receiverSecret, 'receiver')],
    senderDeploy: ['run', 'jobs', 'deploy', sender, project, region, ...imageFlags, '--service-account=' + account(sender),
      '--tasks=1', '--parallelism=1', '--max-retries=0', '--task-timeout=120s', '--args=' + command + ',dispatch',
      `--set-env-vars=${variables},OUTBOX_DATABASE_ROLE=${sqlRoles.sender},OUTBOX_INVOKER_SERVICE_ACCOUNT=${invoker},OUTBOX_AFTER_CURSOR=${afterCursor}`,
      '--set-secrets=OUTBOX_DATABASE_URL=' + secretVersion(senderSecret, 'sender')],
    senderExecute: ['run', 'jobs', 'execute', sender, project, region, '--wait'],
    triggerCreate: ['scheduler', 'jobs', 'create', 'http', trigger, project, location, '--schedule=*/5 * * * *',
      '--time-zone=UTC', '--http-method=POST', '--headers=Content-Type=application/json', '--message-body={}',
      '--attempt-deadline=30s', '--max-retry-attempts=0', '--oauth-service-account-email=' + account(trigger),
      `--uri=https://run.googleapis.com/v2/projects/${production.project}/locations/${production.region}/jobs/${sender}:run`],
  };
}
