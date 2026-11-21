import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import fixture from '../data-01/postgres-fixture.cjs';
import roles from '../data-02/postgres-fixture.cjs';

const { canonicalMigrations } = fixture.req('./dist/src/data/migration-registry.js');
const { MigrationRunner } = fixture.req('./dist/src/data/migration-runner.js');
const { JobDispatcher } = fixture.req('./dist/src/outbox/outbox.dispatcher.js');
const { AdmissionError } = fixture.req('./dist/src/outbox/outbox.limits.js');
const { PostgresJobStore } = fixture.req('./dist/src/outbox/postgres-job.store.js');

const leaseMs = 15_000;
const refused = code => error => error instanceof AdmissionError && error.code === code;

async function setup(t, limits = {}) {
  const env = await roles.stagingDatabase();
  t.after(() => env.close());
  const { db, runtime, runtimeRole, schema } = env;
  await new MigrationRunner(env.store(), canonicalMigrations(fixture.backend)).applyAll();
  for (const grant of [
    ['SELECT, INSERT, UPDATE', 'workload_jobs'],
    ['SELECT, INSERT', 'workload_job_events'],
    ['SELECT', 'workload_admission_policy,workload_provider_limits'],
    ['SELECT, INSERT, UPDATE', 'workload_queue_turns,workload_provider_usage'],
    ['SELECT (uid), UPDATE ("updatedAt")', 'persons'],
    ['SELECT (uid, "resourceType", "resourceId")', 'deletion_tombstones'],
    ['SELECT (id, uid), UPDATE ("updatedAt")', 'workspaces'],
    ['SELECT (id, uid, "workspaceId", role), UPDATE ("updatedAt")', 'workspace_memberships'],
  ]) {
    const tables = grant[1].split(',').map(table => '"' + schema + '".' + table);
    await db.$executeRawUnsafe('GRANT ' + grant[0] + ' ON ' + tables.join(', ') + ' TO "' + runtimeRole + '"');
  }
  await db.person.createMany({ data: ['owner', 'member', 'guest', 'peer'].map(uid => ({ uid })) });
  const workspace = await db.workspace.create({ data: { uid: 'owner', name: 'Admission QA', slug: 'admission-qa' } });
  await db.workspaceMembership.createMany({ data: [
    { uid: 'member', workspaceId: workspace.id, role: 'MEMBER', source: 'direct' },
    { uid: 'guest', workspaceId: workspace.id, role: 'GUEST', source: 'direct' },
  ] });
  await db.workloadAdmissionPolicy.create({ data: { id: 1, perUser: 4, perWorkspace: 4, perQueue: 3, fleet: 8, ...limits } });
  const peer = fixture.client(env.config.runtimeUrl);
  t.after(() => peer.$disconnect());
  const store = new PostgresJobStore(runtime);
  const reader = new PostgresJobStore(peer);
  const policy = { maxAttempts: 2, baseDelayMs: 5, multiplier: 2, maxDelayMs: 20 };
  return { db, runtime, store, reader, first: new JobDispatcher(store, policy),
    second: new JobDispatcher(reader, policy), workspaceId: workspace.id };
}

test('JOB-03 counts pending jobs in atomic user, workspace, queue and fleet limits', async t => {
  const { first, second, workspaceId } = await setup(t, { perUser: 2, perWorkspace: 2, perQueue: 1, fleet: 4 });
  const scoped = { workspaceId };
  const racing = await Promise.allSettled([
    first.enqueue('owner', 'owner:prepare', 'learning.prepare', scoped),
    second.enqueue('owner', 'owner:prepare', 'learning.prepare', scoped),
  ]);
  assert.equal(racing.filter(result => result.status === 'fulfilled').length, 1);
  assert.ok(refused('admission_per_queue')(racing.find(result => result.status === 'rejected').reason));
  const workspaceRace = await Promise.allSettled([
    first.enqueue('owner', 'owner:next', 'learning.prepare', scoped),
    second.enqueue('member', 'member:prepare', 'learning.prepare', scoped),
  ]);
  assert.equal(workspaceRace.filter(result => result.status === 'fulfilled').length, 1);
  assert.ok(refused('admission_per_workspace')(workspaceRace.find(result => result.status === 'rejected').reason));
  await first.cancel(racing.find(result => result.status === 'fulfilled').value.id);
  const ownerPersonal = await first.enqueue('owner', 'owner:personal', 'learning.prepare');
  if (workspaceRace[0].status === 'rejected') await second.enqueue('owner', 'owner:next', 'learning.prepare');
  await assert.rejects(first.enqueue('owner', 'owner:extra', 'learning.prepare'), refused('admission_per_user'));
  await first.enqueue('member', 'member:personal', 'learning.prepare');
  if (workspaceRace[0].status === 'fulfilled') await second.enqueue('peer', 'peer:personal', 'learning.prepare');
  await assert.rejects(second.enqueue('guest', 'guest:personal', 'learning.prepare'), refused('admission_fleet'));
  await first.cancel(ownerPersonal.id);
  await second.enqueue('guest', 'guest:personal', 'learning.prepare');
});

test('JOB-03 denies unauthorized workspace admission, claims and replay after revocation', async t => {
  const { db, first, second, reader, workspaceId } = await setup(t);
  for (const uid of ['guest', 'peer']) {
    await assert.rejects(first.enqueue(uid, uid + ':work', 'learning.prepare', { workspaceId }), refused('scope_denied'));
  }
  const job = await first.enqueue('member', 'member:work', 'learning.prepare', { workspaceId });
  assert.equal((await reader.observe('member', job.id)).status.state, 'PENDING');
  assert.equal(await reader.observe('owner', job.id), null);
  await db.workspaceMembership.delete({ where: { uid_workspaceId: { uid: 'member', workspaceId } } });
  assert.equal(await reader.observe('member', job.id), null);
  assert.equal(await second.claimNext(leaseMs), null);
  await assert.rejects(second.claim(job.id, leaseMs), /conflict/);
});

test('JOB-03 shares provider budgets across concurrent attempts, retries and dispatcher instances', async t => {
  const { db, first, second } = await setup(t);
  await assert.rejects(first.enqueue('owner', 'owner:provider', 'learning.generate', { provider: 'unknown' }), refused('provider_budget'));
  await db.workloadProviderLimit.create({ data: { provider: 'qa-provider', dailyAttempts: 2 } });
  const options = { provider: 'qa-provider' };
  const firstJob = await first.enqueue('owner', 'owner:generator', 'learning.generate', options);
  const secondJob = await second.enqueue('peer', 'peer:generator', 'learning.generate', options);
  assert.equal(await db.workloadProviderUsage.count(), 0);
  const lease = await first.claim(firstJob.id, leaseMs);
  await first.startRun(firstJob.id, lease);
  await first.fail(firstJob.id, lease, 'internal-provider-error');
  await sleep(30);
  const racing = await Promise.allSettled([first.claim(firstJob.id, leaseMs), second.claim(secondJob.id, leaseMs)]);
  assert.equal(racing.filter(result => result.status === 'fulfilled').length, 1);
  assert.ok(refused('provider_budget')(racing.find(result => result.status === 'rejected').reason));
  assert.equal((await db.workloadProviderUsage.findFirstOrThrow()).used, 2);
  await assert.rejects(second.enqueue('member', 'member:generator', 'learning.generate', options), refused('provider_budget'));
  if (racing[0].status === 'rejected') {
    await db.workloadProviderLimit.update({ where: { provider: 'qa-provider' }, data: { dailyAttempts: 3 } });
    racing[0] = { status: 'fulfilled', value: await second.claim(firstJob.id, leaseMs) };
  }
  await second.startRun(firstJob.id, racing[0].value);
  const quarantined = await second.fail(firstJob.id, racing[0].value, 'internal-provider-error');
  assert.equal(quarantined.state, 'QUARANTINED');
  assert.equal(quarantined.attempt, 2);
  await assert.rejects(first.claim(firstJob.id, leaseMs), /conflict/);
});

test('JOB-03 fair claims take turns across queues and skip work fenced by provider budget', async t => {
  const { db, first, second } = await setup(t);
  await db.workloadProviderLimit.create({ data: { provider: 'qa-provider', dailyAttempts: 1 } });
  const options = { provider: 'qa-provider' };
  const debit = await first.enqueue('guest', 'guest:provider', 'learning.generate', options);
  const blocked = await first.enqueue('member', 'member:provider', 'learning.generate', options);
  await first.claim(debit.id, leaseMs);
  const queueOne = await first.enqueue('owner', 'owner:interactive', 'learning.prepare');
  await sleep(5);
  const queueOneLater = await first.enqueue('owner', 'owner:interactive', 'learning.prepare');
  await sleep(5);
  const queueTwo = await second.enqueue('peer', 'peer:background', 'learning.prepare');
  const queueTwoLater = await second.enqueue('peer', 'peer:background', 'learning.prepare');
  const racing = await Promise.all([first.claimNext(leaseMs), second.claimNext(leaseMs)]);
  assert.deepEqual(new Set(racing.map(holder => holder.job.queue)), new Set([queueOne.queue, queueTwo.queue]));
  const newcomer = await second.enqueue('guest', 'guest:new', 'learning.prepare');
  assert.equal((await second.claimNext(leaseMs)).job.id, queueOneLater.id);
  const remaining = await first.claimNext(leaseMs);
  assert.equal(remaining.job.queue, queueTwoLater.queue);
  assert.equal((await first.claimNext(leaseMs)).job.id, newcomer.id);
  assert.equal(await first.claimNext(leaseMs), null);
  assert.equal((await db.workloadJob.findUniqueOrThrow({ where: { id: blocked.id } })).state, 'PENDING');
});

test('JOB-03 replays redacted events by cursor and requires a refetch when history is incomplete', async t => {
  const { db, first, reader } = await setup(t);
  const job = await first.enqueue('owner', 'owner:work', 'learning.prepare');
  const lease = await first.claim(job.id, leaseMs);
  await first.startRun(job.id, lease);
  await first.complete(job.id, lease);
  const initial = await reader.observe('owner', job.id, 0, 2);
  assert.deepEqual(initial.status, { state: 'DONE', attempt: 1, cursor: 4 });
  assert.deepEqual(initial.events.map(event => event.state), ['PENDING', 'CLAIMED']);
  assert.equal(initial.hasMore, true);
  const later = await reader.observe('owner', job.id, initial.nextCursor);
  assert.deepEqual(later.events.map(event => [event.cursor, event.state]), [[3, 'RUNNING'], [4, 'DONE']]);
  assert.deepEqual(Object.keys(later.events[0]).sort(), ['attempt', 'createdAt', 'cursor', 'state']);
  assert.equal(later.hasMore, false);
  assert.deepEqual((await reader.observe('owner', job.id, later.nextCursor)).events, []);
  assert.equal(await reader.observe('guest', job.id, 2), null);
  await assert.rejects(reader.observe('owner', job.id, -1), /cursor/);
  assert.equal((await reader.observe('owner', job.id, 999)).refetchRequired, true);
  await db.workloadJobEvent.delete({ where: { jobId_cursor: { jobId: job.id, cursor: 3 } } });
  const gap = await reader.observe('owner', job.id, 2);
  assert.deepEqual(gap, { status: initial.status, events: [], nextCursor: 4, hasMore: false, refetchRequired: true });
});

test('JOB-03 an event write failure rolls back the claim, provider debit and scheduling turn', async t => {
  const { db, runtime, first, reader } = await setup(t);
  await db.workloadProviderLimit.create({ data: { provider: 'qa-provider', dailyAttempts: 1 } });
  const job = await first.enqueue('owner', 'owner:work', 'learning.generate', { provider: 'qa-provider' });
  const turn = await db.workloadQueueTurn.findUniqueOrThrow({ where: { queue: job.queue } });
  await db.workloadJobEvent.create({ data: { jobId: job.id, cursor: 2, state: 'PENDING', attempt: 0 } });
  await assert.rejects(first.claim(job.id, leaseMs), /duplicate key|23505/);
  assert.equal((await reader.jobById(job.id)).state, 'PENDING');
  assert.equal(await db.workloadProviderUsage.count(), 0);
  assert.deepEqual(await db.workloadQueueTurn.findUniqueOrThrow({ where: { queue: job.queue } }), turn);
  await assert.rejects(runtime.$queryRawUnsafe('SELECT version FROM "_visionary_migrations"'), /permission denied/);
  await assert.rejects(runtime.workloadProviderLimit.update({ where: { provider: 'qa-provider' }, data: { dailyAttempts: 2 } }), /permission denied/);
});
