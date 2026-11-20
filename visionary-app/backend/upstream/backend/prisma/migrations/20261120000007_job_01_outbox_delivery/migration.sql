CREATE TYPE "OutboxDeliveryStatus" AS ENUM ('PENDING', 'LEASED', 'DONE', 'FAILED');

CREATE TABLE "outbox_deliveries" (
    "cursor" BIGINT NOT NULL,
    "status" "OutboxDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "lastError" TEXT,
    CONSTRAINT "outbox_deliveries_pkey" PRIMARY KEY ("cursor"),
    CONSTRAINT "outbox_deliveries_cursor_fkey" FOREIGN KEY ("cursor")
        REFERENCES "outbox_events" ("cursor") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "outbox_deliveries_status_availableAt_cursor_idx" ON "outbox_deliveries" ("status", "availableAt", "cursor");

CREATE INDEX "outbox_events_topic_cursor_idx" ON "outbox_events" ("topic", "cursor");
