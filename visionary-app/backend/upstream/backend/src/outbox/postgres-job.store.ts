import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import type { Job } from './outbox-types';
import type { JobPatch, JobStore } from './outbox-store';
import { ownsJobQueue } from './outbox-store';
import { JobPolicyError } from './outbox.dispatcher';
import { AdmissionError } from './outbox.limits';
import type { JobEvent, JobObservation } from './outbox.limits';

type JobRow = Omit<Job, 'createdAt' | 'claimedUntil' | 'runBy' | 'nextAttemptAt' | 'completedAt'> & {
  createdAt: Date;
  claimedUntil: Date | null;
  runBy: Date | null;
  nextAttemptAt: Date | null;
  completedAt: Date | null;
};

const toJob = (row: JobRow): Job => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  claimedUntil: row.claimedUntil?.toISOString() ?? null,
  runBy: row.runBy?.toISOString() ?? null,
  nextAttemptAt: row.nextAttemptAt?.toISOString() ?? null,
  completedAt: row.completedAt?.toISOString() ?? null,
});

const activeSubject = (uid: Prisma.Sql) => Prisma.sql`
  EXISTS (SELECT 1 FROM persons p WHERE p.uid = ${uid})
  AND NOT EXISTS (SELECT 1 FROM deletion_tombstones t WHERE t.uid = ${uid} AND t."resourceType" = 'person')
`;
const workspaceAccess = (uid: Prisma.Sql, workspaceId: Prisma.Sql) => Prisma.sql`
  (${workspaceId} IS NULL OR EXISTS (
    SELECT 1 FROM workspaces w WHERE w.id = ${workspaceId}
      AND NOT EXISTS (SELECT 1 FROM deletion_tombstones t WHERE t.uid = w.uid AND t."resourceType" = 'workspace'
        AND t."resourceId" = w.id)
      AND (w.uid = ${uid} OR EXISTS (
        SELECT 1 FROM workspace_memberships m WHERE m."workspaceId" = w.id AND m.uid = ${uid}
          AND m.role IN ('MEMBER', 'ADMIN')
      ))
  ))
`;
const budgetDay = Prisma.sql`(clock_timestamp() AT TIME ZONE 'UTC')::date`;
const providerAvailable = (provider: Prisma.Sql) => Prisma.sql`
  (${provider} IS NULL OR EXISTS (
    SELECT 1 FROM workload_provider_limits l
    LEFT JOIN workload_provider_usage u ON u.provider = l.provider AND u.day = ${budgetDay}
    WHERE l.provider = ${provider} AND COALESCE(u.used, 0) < l."dailyAttempts"
  ))
`;
const liveStates = Prisma.sql`state IN ('PENDING', 'CLAIMED', 'RUNNING')`;
const standardLimits = { perUser: 4, perWorkspace: 12, perQueue: 8, fleet: 80 };

async function lockAdmission(tx: Prisma.TransactionClient) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(current_schema() || ':workload-admission', 0))::text`;
}

async function reserveProvider(tx: Prisma.TransactionClient, provider: string) {
  const count = await tx.$executeRaw`
    INSERT INTO workload_provider_usage (provider, day, used)
    SELECT provider, ${budgetDay}, 1 FROM workload_provider_limits WHERE provider = ${provider}
    ON CONFLICT (provider, day) DO UPDATE SET used = workload_provider_usage.used + 1
      WHERE workload_provider_usage.used < (SELECT "dailyAttempts" FROM workload_provider_limits WHERE provider = ${provider})
  `;
  if (!count) throw new AdmissionError('provider_budget');
}

async function recordEvent(tx: Prisma.TransactionClient, row: Pick<Job, 'id' | 'revision' | 'state' | 'attempt'>) {
  await tx.$executeRaw`
    INSERT INTO workload_job_events ("jobId", cursor, state, attempt)
    VALUES (${row.id}, ${row.revision + 1}, ${row.state}::"WorkloadJobState", ${row.attempt})
  `;
}

async function advanceQueue(tx: Prisma.TransactionClient, queue: string) {
  await tx.$executeRaw`
    INSERT INTO workload_queue_turns (queue, turn)
    VALUES (${queue}, (SELECT COALESCE(MAX(turn), 0) + 1 FROM workload_queue_turns))
    ON CONFLICT (queue) DO UPDATE SET turn = EXCLUDED.turn
  `;
}

const writable = {
  state: Prisma.sql`"state"`, attempt: Prisma.sql`"attempt"`,
  claimedUntil: Prisma.sql`"claimedUntil"`, leaseToken: Prisma.sql`"leaseToken"`,
  attemptToken: Prisma.sql`"attemptToken"`, nextAttemptAt: Prisma.sql`"nextAttemptAt"`,
  completedAt: Prisma.sql`"completedAt"`, cancellationToken: Prisma.sql`"cancellationToken"`,
  lastError: Prisma.sql`"lastError"`, cleanupAttempts: Prisma.sql`"cleanupAttempts"`, cleanupError: Prisma.sql`"cleanupError"`,
} satisfies Record<keyof JobPatch, Prisma.Sql>;

export class PostgresJobStore implements JobStore {
  constructor(private readonly db: PrismaClient) {}

  async clock(): Promise<Date> {
    const [row] = await this.db.$queryRaw<Array<{ now: Date }>>`SELECT clock_timestamp() AS now`;
    return row.now;
  }

  async createJob(job: Job): Promise<void> {
    if (!ownsJobQueue(job.uid, job.queue) || !/^[a-zA-Z][a-zA-Z0-9_.-]{0,95}$/.test(job.kind)) {
      throw Error('Invalid job owner, queue or workload.');
    }
    if (job.provider !== null && !/^[a-z][a-z0-9-]{0,47}$/.test(job.provider)) throw new AdmissionError('provider_budget');
    await this.db.$transaction(async tx => {
      await lockAdmission(tx);
      await tx.$queryRaw`SELECT uid FROM persons WHERE uid = ${job.uid} FOR UPDATE`;
      await this.lockWorkspace(tx, job.uid, job.workspaceId);
      const [available] = await tx.$queryRaw<Array<{ allowed: boolean; budget: boolean }>>`
        SELECT (${activeSubject(Prisma.sql`${job.uid}`)} AND
          ${workspaceAccess(Prisma.sql`${job.uid}`, Prisma.sql`${job.workspaceId}::text`)}) AS allowed,
          ${providerAvailable(Prisma.sql`${job.provider}::text`)} AS budget
      `;
      if (!available.allowed) throw new AdmissionError('scope_denied');
      if (!available.budget) throw new AdmissionError('provider_budget');
      const [configured] = await tx.$queryRaw<typeof standardLimits[]>`
        SELECT "perUser", "perWorkspace", "perQueue", fleet FROM workload_admission_policy WHERE id = 1
      `;
      const limits = configured ?? standardLimits;
      const [counts] = await tx.$queryRaw<Array<{ owner: bigint; workspace: bigint; queue: bigint; fleet: bigint }>>`
        SELECT count(*) FILTER (WHERE uid = ${job.uid}) AS owner,
          count(*) FILTER (WHERE "workspaceId" = ${job.workspaceId}) AS workspace,
          count(*) FILTER (WHERE queue = ${job.queue}) AS queue, count(*) AS fleet
        FROM workload_jobs WHERE ${liveStates}
      `;
      if (counts.owner >= limits.perUser) throw new AdmissionError('admission_per_user');
      if (counts.workspace >= limits.perWorkspace) throw new AdmissionError('admission_per_workspace');
      if (counts.queue >= limits.perQueue) throw new AdmissionError('admission_per_queue');
      if (counts.fleet >= limits.fleet) throw new AdmissionError('admission_fleet');
      await tx.$executeRaw`
        INSERT INTO workload_jobs (id, uid, "workspaceId", queue, provider, kind, "maxAttempts", "createdAt", "runBy")
        VALUES (${job.id}, ${job.uid}, ${job.workspaceId}, ${job.queue}, ${job.provider}, ${job.kind}, ${job.maxAttempts},
          ${job.createdAt}::timestamptz, ${job.runBy}::timestamptz)
      `;
      // A newly active queue joins behind queues already waiting for a turn.
      if (counts.queue === 0n) await advanceQueue(tx, job.queue);
      await recordEvent(tx, job);
    });
  }

  private async lockWorkspace(tx: Prisma.TransactionClient, uid: string, workspaceId: string | null) {
    if (workspaceId === null) return;
    await tx.$queryRaw`SELECT id FROM workspaces WHERE id = ${workspaceId} FOR SHARE`;
    await tx.$queryRaw`
      SELECT id FROM workspace_memberships WHERE uid = ${uid} AND "workspaceId" = ${workspaceId} FOR SHARE
    `;
  }

  async nextReadyJob(tx: Prisma.TransactionClient = this.db): Promise<string | null> {
    const [row] = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT j.id FROM workload_jobs j LEFT JOIN workload_queue_turns q ON q.queue = j.queue
      WHERE j.state = 'PENDING' AND j.attempt < j."maxAttempts"
        AND (j."nextAttemptAt" IS NULL OR j."nextAttemptAt" <= clock_timestamp())
        AND (j."runBy" IS NULL OR clock_timestamp() < j."runBy")
        AND ${activeSubject(Prisma.sql`j.uid`)} AND ${workspaceAccess(Prisma.sql`j.uid`, Prisma.sql`j."workspaceId"`)}
        AND ${providerAvailable(Prisma.sql`j.provider`)}
      ORDER BY q.turn NULLS FIRST, j."createdAt", j.id LIMIT 1
    `;
    return row?.id ?? null;
  }

  async jobById(id: string): Promise<Job | null> {
    const [row] = await this.db.$queryRaw<JobRow[]>`SELECT * FROM workload_jobs WHERE id = ${id}`;
    return row ? toJob(row) : null;
  }

  async jobsInQueue(queue: string): Promise<Job[]> {
    const rows = await this.db.$queryRaw<JobRow[]>`
      SELECT * FROM workload_jobs WHERE queue = ${queue} ORDER BY "createdAt", id
    `;
    return rows.map(toJob);
  }

  async compareJob(id: string, revision: number, patch: JobPatch, validUntil?: string | null, fair = false): Promise<Job | null> {
    const assignments = (Object.keys(writable) as Array<keyof JobPatch>)
      .filter(key => patch[key] !== undefined)
      .map(key => {
        const value = patch[key];
        if (key === 'state') return Prisma.sql`${writable[key]} = ${value}::"WorkloadJobState"`;
        if (key === 'claimedUntil' || key === 'nextAttemptAt' || key === 'completedAt') {
          return Prisma.sql`${writable[key]} = ${value}::timestamptz`;
        }
        return Prisma.sql`${writable[key]} = ${value}`;
      });
    assignments.push(Prisma.sql`revision = revision + 1`);
    const claiming = patch.state === 'CLAIMED' && patch.attempt !== undefined;
    const requiresOwner = Boolean(validUntil) || claiming;
    const stillAuthorized = requiresOwner ?
      Prisma.sql`${activeSubject(Prisma.sql`j.uid`)} AND ${workspaceAccess(Prisma.sql`j.uid`, Prisma.sql`j."workspaceId"`)}` : Prisma.sql`TRUE`;
    const cutoff = claiming ? patch.claimedUntil : validUntil;
    const bound = cutoff ? Prisma.sql`clock_timestamp() < ${cutoff}::timestamptz` : Prisma.sql`TRUE`;
    const change = (tx: Prisma.TransactionClient) => tx.$queryRaw<JobRow[]>`
        UPDATE workload_jobs j SET ${Prisma.join(assignments)}
        WHERE j.id = ${id} AND j.revision = ${revision} AND ${bound} AND ${stillAuthorized}
        RETURNING j.*
      `;
    return this.db.$transaction(async tx => {
      if (claiming) {
        await lockAdmission(tx);
        if (fair && await this.nextReadyJob(tx) !== id) return null;
      }
      if (requiresOwner) {
        const [owner] = await tx.$queryRaw<Array<{ uid: string; workspaceId: string | null }>>`
          SELECT p.uid, j."workspaceId" FROM persons p JOIN workload_jobs j ON j.uid = p.uid
          WHERE j.id = ${id} FOR UPDATE OF p
        `;
        if (!owner) return null;
        await this.lockWorkspace(tx, owner.uid, owner.workspaceId);
        // The UPDATE must evaluate the clock after acquiring the row lock.
        await tx.$queryRaw`SELECT id FROM workload_jobs WHERE id = ${id} FOR UPDATE`;
      }
      const [row] = await change(tx);
      if (!row) return null;
      if (claiming) {
        if (row.provider !== null) await reserveProvider(tx, row.provider);
        await advanceQueue(tx, row.queue);
      }
      await recordEvent(tx, row);
      if (cutoff) {
        const [receipt] = await tx.$queryRaw<Array<{ live: boolean }>>`
          SELECT clock_timestamp() < ${cutoff}::timestamptz AS live
        `;
        if (!receipt.live) throw new JobPolicyError('fenced');
      }
      return toJob(row);
    });
  }

  async observe(uid: string, id: string, afterCursor = 0, limit = 100): Promise<JobObservation | null> {
    if (!Number.isSafeInteger(afterCursor) || afterCursor < 0 || afterCursor > 2147483647 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw Error('Invalid job replay cursor or page size.');
    return this.db.$transaction(async tx => {
      const [job] = await tx.$queryRaw<Array<{ state: Job['state']; attempt: number; cursor: number }>>`
        SELECT j.state, j.attempt, j.revision + 1 AS cursor FROM workload_jobs j
        WHERE j.id = ${id} AND j.uid = ${uid} AND ${activeSubject(Prisma.sql`j.uid`)}
          AND ${workspaceAccess(Prisma.sql`j.uid`, Prisma.sql`j."workspaceId"`)}
      `;
      if (!job) return null;
      const rows = await tx.$queryRaw<Array<Omit<JobEvent, 'createdAt'> & { createdAt: Date }>>`
        SELECT cursor, state, attempt, "createdAt" FROM workload_job_events
        WHERE "jobId" = ${id} AND cursor > ${afterCursor} ORDER BY cursor LIMIT ${limit + 1}
      `;
      const last = rows.at(-1)?.cursor ?? afterCursor;
      if (afterCursor > job.cursor || rows.some((row, i) => row.cursor !== afterCursor + i + 1) ||
          (rows.length <= limit && last !== job.cursor)) {
        return { status: job, events: [], nextCursor: job.cursor, hasMore: false, refetchRequired: true };
      }
      const events = rows.slice(0, limit).map(row => ({ ...row, createdAt: row.createdAt.toISOString() }));
      return { status: job, events, nextCursor: events.at(-1)?.cursor ?? afterCursor,
        hasMore: rows.length > limit, refetchRequired: false };
    }, { isolationLevel: 'RepeatableRead' });
  }

  async dueJobs(now: Date, limit: number): Promise<Job[]> {
    const rows = await this.db.$queryRaw<JobRow[]>`
      SELECT * FROM workload_jobs
      WHERE (state IN ('PENDING', 'CLAIMED', 'RUNNING') AND "runBy" <= ${now})
        OR (state IN ('CLAIMED', 'RUNNING') AND "claimedUntil" <= ${now})
      ORDER BY LEAST("runBy", "claimedUntil"), id LIMIT ${limit}
    `;
    return rows.map(toJob);
  }

  async queues(): Promise<string[]> {
    const rows = await this.db.$queryRaw<Array<{ queue: string }>>`SELECT DISTINCT queue FROM workload_jobs ORDER BY queue`;
    return rows.map(row => row.queue);
  }

  async assertAuthorized(uid: string, queue: string): Promise<boolean> {
    if (!ownsJobQueue(uid, queue)) return false;
    const [row] = await this.db.$queryRaw<Array<{ allowed: boolean }>>`
      SELECT (${activeSubject(Prisma.sql`${uid}`)}) AS allowed
    `;
    return row.allowed;
  }
}
