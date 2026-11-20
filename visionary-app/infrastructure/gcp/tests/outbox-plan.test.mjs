import assert from 'node:assert/strict';
import test from 'node:test';
import { outboxProductionPlan, outboxProductionSqlPlan } from '../outbox/plan.mjs';

const config = {
  source: 'a'.repeat(40), image: 'asia-south1-docker.pkg.dev/visionary-research/visionary-product/product@sha256:' + 'b'.repeat(64),
  instance: 'visionary-product-db', database: 'visionary_product', schema: 'product',
  afterCursor: '9223372036854775807', invokerSubject: '123456789012345678901',
  senderSecret: 'visionary-consent-production-sender:3', receiverSecret: 'visionary-consent-production-receiver:2',
  stagingReceiptSha256: 'c'.repeat(64),
};

test('the production SQL plan fixes the regional connector, recovery settings and disk ceiling', () => {
  const plan = outboxProductionSqlPlan();
  assert.equal(plan.instance, config.instance);
  assert.equal(plan.productionDatabase, config.database);
  assert.equal(plan.stagingDatabase, 'visionary_data_staging_outbox');
  for (const option of ['--project=visionary-research', '--region=asia-south1', '--availability-type=regional',
    '--database-version=POSTGRES_16', '--tier=db-custom-1-3840', '--connector-enforcement=REQUIRED',
    '--enable-point-in-time-recovery', '--deletion-protection', '--storage-auto-increase-limit=20']) {
    assert.ok(plan.create.includes(option), option);
  }
});

test('the production plan scopes Cloud Tasks, receiver and scheduler to their intended identities and endpoints', () => {
  const plan = outboxProductionPlan(config);
  assert.equal(plan.cloudSql, 'visionary-research:asia-south1:visionary-product-db');
  assert.equal(plan.queue, 'visionary-consent-production');
  assert.match(plan.receiverOrigin, /^https:\/\/visionary-consent-receive-prod-174851137514\.asia-south1\.run\.app$/);
  assert.ok(plan.queueCreate.includes('--max-retry-duration=45s'));
  assert.ok(plan.receiverDeploy.includes('--ingress=internal'));
  assert.ok(plan.receiverDeploy.includes('--invoker-iam-check'));
  assert.ok(plan.receiverDeploy.includes('--no-allow-unauthenticated'));
  assert.ok(plan.receiverDeploy.includes('--set-secrets=OUTBOX_DATABASE_URL=visionary-consent-production-receiver:2'));
  assert.ok(plan.receiverDeploy.some(arg => arg.endsWith('OUTBOX_CALLER_SUBJECT=123456789012345678901')));
  assert.ok(plan.senderDeploy.includes('--max-retries=0'));
  assert.ok(plan.senderDeploy.includes('--set-secrets=OUTBOX_DATABASE_URL=visionary-consent-production-sender:3'));
  assert.ok(plan.senderDeploy.some(arg => arg.endsWith('OUTBOX_AFTER_CURSOR=9223372036854775807')));
  assert.equal(new Set(Object.values(plan.identities)).size, 5);
  assert.ok(plan.triggerCreate.includes('--schedule=*/5 * * * *'));
  assert.ok(plan.triggerCreate.includes('--max-retry-attempts=0'));
  assert.ok(plan.triggerCreate.includes('--uri=https://run.googleapis.com/v2/projects/visionary-research/locations/asia-south1/jobs/visionary-consent-send-prod:run'));
});

test('the production plan rejects temporary images, mutable secrets and out-of-scope SQL configuration', () => {
  for (const change of [
    { source: 'main' }, { stagingReceiptSha256: '' },
    { image: config.image.replace('/product@', '/kan53-stg-product@') },
    { image: config.image.split('@')[0] + ':latest' },
    { instance: 'visionary-kan53-stg' }, { database: 'visionary_data_staging_kan53' },
    { schema: 'public' }, { afterCursor: '9223372036854775808' }, { afterCursor: '00' },
    { senderSecret: 'visionary-consent-production-sender:latest' }, { senderSecret: config.receiverSecret },
    { receiverSecret: 'visionary-consent-staging-receiver:1' }, { invokerSubject: 'someone@example.org' },
  ]) assert.throws(() => outboxProductionPlan({ ...config, ...change }));
});
