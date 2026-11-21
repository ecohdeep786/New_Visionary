import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import fixture from '../data-01/postgres-fixture.cjs';
import roles from '../data-02/postgres-fixture.cjs';

const { canonicalMigrations } = fixture.req('./dist/src/data/migration-registry.js');
const { MigrationRunner } = fixture.req('./dist/src/data/migration-runner.js');
const { WorkspaceRepository } = fixture.req('./dist/src/workspaces/workspace.repository.js');
const { JobDispatcher } = fixture.req('./dist/src/outbox/outbox.dispatcher.js');
const { OutboxSweeper } = fixture.req('./dist/src/outbox/outbox.sweeper.js');
const { PostgresJobStore } = fixture.req('./dist/src/outbox/postgres-job.store.js');

async function setup(t) {
  const env = await roles.stagingDatabase();
  t.after(() => env.close());
  await new MigrationRunner(env.store(), canonicalMigrations(fixture.backend)).applyAll();
  const { db, runtime, runtimeRole, schema } = env;
  for (const statement of [
    `GRANT SELECT, INSERT, UPDATE ON "${schema}".workload_jobs TO "${runtimeRole}"`,
    `GRANT INSERT ON "${schema}".workload_job_events TO "${runtimeRole}"`,
    `GRANT SELECT ON "${schema}".workload_admission_policy, "${schema}".workspaces, "${schema}".workspace_memberships,
      "${schema}".workload_provider_limits TO "${runtimeRole}"`,
    `GRANT SELECT, INSERT, UPDATE ON "${schema}".workload_queue_turns, "${schema}".workload_provider_usage TO "${runtimeRole}"`,
    `GRANT SELECT (uid), UPDATE ("updatedAt") ON "${schema}".persons TO "${runtimeRole}"`,
    `GRANT SELECT (uid, "resourceType", "resourceId") ON "${schema}".deletion_tombstones TO "${runtimeRole}"`,
  ]) await db.$executeRawUnsafe(statement);
  const peer = fixture.client(env.config.runtimeUrl);
  t.after(() => peer.$disconnect());
  const repo = new WorkspaceRepository(db);
  for (const uid of ['qa-worker-owner', 'global']) await repo.ensurePerson(uid);
  return { db, store: new PostgresJobStore(runtime), second: new PostgresJobStore(peer), owner: 'qa-worker-owner' };
}

test('JOB-02 PostgreSQL admits one claim across clients and replays completion without a second write', async t => {
  const { db, store, second, owner } = await setup(t);
  const first = new JobDispatcher(store), peer = new JobDispatcher(second);
  await assert.rejects(first.enqueue('global', 'global:' + owner, 'learning.prepare'), /unauthorized_queue/);
  await assert.rejects(first.enqueue('unknown-user', 'unknown-user:learning', 'learning.prepare'), /unauthorized_queue/);
  const job = await first.enqueue(owner, owner + ':learning', 'learning.prepare');
  const claims = await Promise.allSettled([first.claim(job.id, 30_000), peer.claim(job.id, 30_000)]);
  assert.equal(claims.filter(result => result.status === 'fulfilled').length, 1);
  assert.match(claims.find(result => result.status === 'rejected').reason.message, /conflict/);
  const holder = claims.find(result => result.status === 'fulfilled').value;
  assert.equal(holder.job.attempt, 1);
  await peer.startRun(job.id, holder);
  const done = await first.complete(job.id, holder);
  assert.equal(done.state, 'DONE');
  assert.deepEqual(await peer.complete(job.id, holder), done);
  await assert.rejects(peer.complete(job.id, { ...holder, attemptToken: 'unexpected' }), /fenced/);
  const receipt = await db.workloadJob.findUniqueOrThrow({ where: { id: job.id } });
  assert.ok(receipt.completedAt);
  assert.equal(receipt.revision, done.revision);
});

test('JOB-02 PostgreSQL fences expired holders and another client recovers the persisted attempt', async t => {
  const { store, second, owner } = await setup(t);
  const first = new JobDispatcher(store), next = new JobDispatcher(second);
  const job = await first.enqueue(owner, owner + ':learning', 'learning.prepare');
  const holder = await first.claim(job.id, 550);
  await first.startRun(job.id, holder);
  await sleep(600);
  await assert.rejects(first.complete(job.id, holder), /fenced/);
  const sweep = await new OutboxSweeper(second).sweep();
  assert.equal(sweep.reclaimed.length, 1);
  assert.equal(sweep.reclaimed[0].attempt, 1);
  await sleep(220);
  const recovered = await next.claim(job.id, 30_000);
  assert.equal(recovered.job.attempt, 2);
  assert.notEqual(recovered.attemptToken, holder.attemptToken);
  await next.startRun(job.id, recovered);
  await assert.rejects(first.complete(job.id, holder), /fenced/);
  await next.cancel(job.id);
  await assert.rejects(next.complete(job.id, recovered), /fenced/);
  assert.equal((await store.jobById(job.id)).state, 'CANCELLED');
});

test('JOB-02 the SQL clock fences updates whose wait for a row lock outlasts the lease', async t => {
  const { db, store, second, owner } = await setup(t);
  const dispatcher = new JobDispatcher(store);
  for (const action of ['complete', 'heartbeat']) {
    const job = await dispatcher.enqueue(owner, owner + ':learning', 'learning.prepare');
    const holder = await dispatcher.claim(job.id, 1_500);
    const started = await dispatcher.startRun(job.id, holder);
    let locked, release;
    const ready = new Promise(resolve => { locked = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    const blocker = db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM workload_jobs WHERE id = ${job.id} FOR UPDATE`;
      locked();
      await gate;
    }, { timeout: 5_000 });
    await Promise.race([ready, blocker]);
    const mutation = action === 'complete' ? dispatcher.complete(job.id, holder) : dispatcher.heartbeat(job.id, holder, 30_000);
    const rejected = assert.rejects(mutation, /conflict|fenced/);
    try {
      await sleep(1_700);
    } finally {
      release();
    }
    await blocker;
    await rejected;
    const saved = await second.jobById(job.id);
    assert.equal(saved.revision, started.revision);
    assert.equal(saved.state, 'RUNNING');
    assert.equal(saved.claimedUntil, started.claimedUntil);
  }
});

test('JOB-02 a least-privilege sweeper can expire due deadlines without account or migration access', async t => {
  const env = await roles.stagingDatabase();
  t.after(() => env.close());
  await new MigrationRunner(env.store(), canonicalMigrations(fixture.backend)).applyAll();
  const { db, runtime, runtimeRole, schema } = env;
  await db.$executeRawUnsafe(`GRANT SELECT, UPDATE ON "${schema}".workload_jobs TO "${runtimeRole}"`);
  await db.$executeRawUnsafe(`GRANT INSERT ON "${schema}".workload_job_events TO "${runtimeRole}"`);
  await new WorkspaceRepository(db).ensurePerson('qa-sweep-owner');
  const actor = new JobDispatcher(new PostgresJobStore(db));
  const job = await actor.enqueue('qa-sweep-owner', 'qa-sweep-owner:learning', 'learning.prepare',
    { runBy: (await new PostgresJobStore(db).clock()).toISOString() });
  const sweep = new OutboxSweeper(new PostgresJobStore(runtime));
  assert.equal((await sweep.sweep()).deadlineExpired[0].id, job.id);
  assert.deepEqual((await sweep.sweep()).deadlineExpired, []);
  await assert.rejects(runtime.$queryRaw`SELECT uid FROM persons`, /permission denied/);
  await assert.rejects(runtime.$queryRaw`SELECT version FROM "_visionary_migrations"`, /permission denied/);
});
