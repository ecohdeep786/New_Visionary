CREATE TYPE "OutboxDeliveryStatus" AS ENUM ('PENDING', 'LEASED', 'DONE', 'FAILED');

CREATE TABLE "outbox_deliveries" (
    "cursor" BIGINT NOT NULL,
    "status" "OutboxDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "effectAppliedAt" TIMESTAMP(3),
    CONSTRAINT "outbox_deliveries_pkey" PRIMARY KEY ("cursor"),
    CONSTRAINT "outbox_deliveries_completion_receipt_check"
        CHECK (("status" = 'DONE') = ("effectAppliedAt" IS NOT NULL)),
    CONSTRAINT "outbox_deliveries_cursor_fkey" FOREIGN KEY ("cursor")
        REFERENCES "outbox_events" ("cursor") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "outbox_deliveries_status_availableAt_cursor_idx" ON "outbox_deliveries" ("status", "availableAt", "cursor");

CREATE INDEX "outbox_events_topic_cursor_idx" ON "outbox_events" ("topic", "cursor");

CREATE TYPE "ConsentJobState" AS ENUM ('PENDING', 'CANCELLED');

CREATE TABLE "consent_jobs" (
    "id" UUID NOT NULL,
    "grantId" TEXT NOT NULL,
    "workload" TEXT NOT NULL,
    "state" "ConsentJobState" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    CONSTRAINT "consent_jobs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "consent_jobs_grantId_fkey" FOREIGN KEY ("grantId")
        REFERENCES "consent_grants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "consent_jobs_grantId_state_idx" ON "consent_jobs" ("grantId", "state");
CREATE INDEX "consent_jobs_workload_state_createdAt_idx" ON "consent_jobs" ("workload", "state", "createdAt");
