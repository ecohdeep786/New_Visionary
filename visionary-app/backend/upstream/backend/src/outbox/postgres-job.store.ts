import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import type { Job } from './outbox-types';
import type { JobPatch, JobStore } from './outbox-store';
import { ownsJobQueue } from './outbox-store';

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
    const count = await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT uid FROM persons WHERE uid = ${job.uid} FOR UPDATE`;
      return tx.$executeRaw`
        INSERT INTO workload_jobs (id, uid, queue, kind, "maxAttempts", "createdAt", "runBy")
        SELECT ${job.id}, ${job.uid}, ${job.queue}, ${job.kind}, ${job.maxAttempts},
          ${job.createdAt}::timestamptz, ${job.runBy}::timestamptz
        WHERE ${activeSubject(Prisma.sql`${job.uid}`)}
      `;
    });
    if (count !== 1) throw Error('Job subject unavailable.');
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

  async compareJob(id: string, revision: number, patch: JobPatch, validUntil?: string | null): Promise<Job | null> {
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
    const requiresOwner = Boolean(validUntil) || patch.state === 'CLAIMED';
    const stillAuthorized = requiresOwner ? activeSubject(Prisma.sql`j.uid`) : Prisma.sql`TRUE`;
    const cutoff = patch.state === 'CLAIMED' ? patch.claimedUntil : validUntil;
    const bound = cutoff ? Prisma.sql`clock_timestamp() < ${cutoff}::timestamptz` : Prisma.sql`TRUE`;
    const change = (tx: Prisma.TransactionClient) => tx.$queryRaw<JobRow[]>`
        UPDATE workload_jobs j SET ${Prisma.join(assignments)}
        WHERE j.id = ${id} AND j.revision = ${revision} AND ${bound} AND ${stillAuthorized}
        RETURNING j.*
      `;
    const [row] = requiresOwner ? await this.db.$transaction(async tx => {
      await tx.$queryRaw`
        SELECT p.uid FROM persons p JOIN workload_jobs j ON j.uid = p.uid WHERE j.id = ${id} FOR UPDATE OF p
      `;
      return change(tx);
    }) : await change(this.db);
    return row ? toJob(row) : null;
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
