ALTER TABLE "workload_jobs" ADD COLUMN "provider" TEXT;

CREATE INDEX "workload_jobs_owner_state_idx" ON "workload_jobs" ("uid", "state");
CREATE INDEX "workload_jobs_workspace_state_idx" ON "workload_jobs" ("workspaceId", "state");
CREATE INDEX "workload_jobs_queue_state_idx" ON "workload_jobs" ("queue", "state");

CREATE TABLE "workload_admission_policy" (
    "id" INTEGER NOT NULL PRIMARY KEY CHECK ("id" = 1),
    "perUser" INTEGER NOT NULL CHECK ("perUser" > 0),
    "perWorkspace" INTEGER NOT NULL CHECK ("perWorkspace" > 0),
    "perQueue" INTEGER NOT NULL CHECK ("perQueue" > 0),
    "fleet" INTEGER NOT NULL CHECK ("fleet" > "perQueue")
);

CREATE TABLE "workload_provider_limits" (
    "provider" TEXT NOT NULL PRIMARY KEY,
    "dailyAttempts" INTEGER NOT NULL CHECK ("dailyAttempts" > 0)
);

CREATE TABLE "workload_provider_usage" (
    "provider" TEXT NOT NULL REFERENCES "workload_provider_limits" ("provider") ON DELETE RESTRICT ON UPDATE CASCADE,
    "day" DATE NOT NULL,
    "used" INTEGER NOT NULL CHECK ("used" > 0),
    PRIMARY KEY ("provider", "day")
);

CREATE TABLE "workload_queue_turns" (
    "queue" TEXT NOT NULL PRIMARY KEY,
    "turn" BIGINT NOT NULL CHECK ("turn" > 0)
);

CREATE INDEX "workload_queue_turn_idx" ON "workload_queue_turns" ("turn");

INSERT INTO "workload_queue_turns" ("queue", "turn")
    SELECT "queue", row_number() OVER (ORDER BY min("createdAt"), "queue")
    FROM "workload_jobs" WHERE "state" IN ('PENDING', 'CLAIMED', 'RUNNING') GROUP BY "queue";

CREATE TABLE "workload_job_events" (
    "jobId" TEXT NOT NULL REFERENCES "workload_jobs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "cursor" INTEGER NOT NULL CHECK ("cursor" > 0),
    "state" "WorkloadJobState" NOT NULL,
    "attempt" INTEGER NOT NULL CHECK ("attempt" >= 0),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("jobId", "cursor")
);

INSERT INTO "workload_job_events" ("jobId", "cursor", "state", "attempt")
    SELECT "id", "revision" + 1, "state", "attempt" FROM "workload_jobs";
