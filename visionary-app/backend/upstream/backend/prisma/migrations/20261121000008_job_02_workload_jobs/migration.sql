CREATE TYPE "WorkloadJobState" AS ENUM ('PENDING', 'CLAIMED', 'RUNNING', 'DONE', 'FAILED', 'CANCELLED', 'QUARANTINED');

CREATE TABLE "workload_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uid" TEXT NOT NULL REFERENCES "persons" ("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    "workspaceId" TEXT,
    "queue" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "state" "WorkloadJobState" NOT NULL DEFAULT 'PENDING',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedUntil" TIMESTAMPTZ(3),
    "leaseToken" TEXT,
    "attemptToken" TEXT,
    "runBy" TIMESTAMPTZ(3),
    "nextAttemptAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "cancellationToken" TEXT,
    "lastError" TEXT,
    "cleanupAttempts" INTEGER NOT NULL DEFAULT 0,
    "cleanupError" TEXT,
    CONSTRAINT "workload_jobs_bounds" CHECK ("attempt" BETWEEN 0 AND "maxAttempts"
      AND "maxAttempts" > 0 AND "revision" >= 0 AND "cleanupAttempts" >= 0),
    CONSTRAINT "workload_jobs_active_lease" CHECK (
      ("state" IN ('CLAIMED', 'RUNNING')) = ("claimedUntil" IS NOT NULL)
      AND ("claimedUntil" IS NULL OR ("leaseToken" IS NOT NULL AND "attemptToken" IS NOT NULL))
    ),
    CONSTRAINT "workload_jobs_completion" CHECK ("state" <> 'DONE' OR (
      "completedAt" IS NOT NULL AND "leaseToken" IS NOT NULL AND "attemptToken" IS NOT NULL
    ))
);

CREATE INDEX "workload_jobs_queue_idx" ON "workload_jobs" ("queue", "createdAt", "id");
CREATE INDEX "workload_jobs_lease_idx" ON "workload_jobs" ("state", "claimedUntil", "id");
CREATE INDEX "workload_jobs_deadline_idx" ON "workload_jobs" ("state", "runBy", "id");
