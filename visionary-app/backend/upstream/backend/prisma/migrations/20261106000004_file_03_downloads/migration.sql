-- Additive FILE-03 tables. Accepted migration versions remain immutable.
-- CreateTable
CREATE TABLE "download_grants" (
    "id" TEXT NOT NULL,
    "ownerUid" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "generation" INTEGER NOT NULL,
    "digest" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT,
    "remainingReads" INTEGER NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastReadAt" TIMESTAMP(3),
    "bytesDelivered" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_exports" (
    "id" TEXT NOT NULL,
    "ownerUid" TEXT NOT NULL,
    "objects" JSONB NOT NULL,
    "state" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredBytes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "download_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "download_grants_token_key" ON "download_grants"("token");

-- CreateIndex
CREATE INDEX "download_grants_ownerUid_idx" ON "download_grants"("ownerUid");

-- CreateIndex
CREATE INDEX "download_grants_objectId_generation_idx" ON "download_grants"("objectId", "generation");

-- CreateIndex
CREATE INDEX "download_grants_state_idx" ON "download_grants"("state");

-- CreateIndex
CREATE INDEX "download_exports_ownerUid_idx" ON "download_exports"("ownerUid");

-- CreateIndex
CREATE INDEX "download_exports_state_idx" ON "download_exports"("state");
-- AddForeignKey
ALTER TABLE "download_grants" ADD CONSTRAINT "download_grants_ownerUid_fkey" FOREIGN KEY ("ownerUid") REFERENCES "persons"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "download_exports" ADD CONSTRAINT "download_exports_ownerUid_fkey" FOREIGN KEY ("ownerUid") REFERENCES "persons"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
