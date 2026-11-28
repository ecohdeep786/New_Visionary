CREATE TYPE "FileUploadState" AS ENUM ('INTENT', 'UPLOADING', 'SCANNING', 'READY', 'REJECTED', 'CANCELLED');

CREATE TABLE "file_uploads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uid" TEXT NOT NULL REFERENCES "persons" ("uid") ON DELETE CASCADE ON UPDATE CASCADE,
    "workspaceId" TEXT,
    "name" TEXT NOT NULL,
    "declaredType" TEXT NOT NULL,
    "declaredSize" INTEGER NOT NULL,
    "expectedDigest" TEXT NOT NULL,
    "state" "FileUploadState" NOT NULL DEFAULT 'INTENT',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "bytesReceived" INTEGER NOT NULL DEFAULT 0,
    "chunkBytes" INTEGER NOT NULL,
    "digest" TEXT,
    "sniffedType" TEXT,
    "scanResult" TEXT,
    "rejectionReason" TEXT,
    "parserOutputBytes" INTEGER NOT NULL DEFAULT 0,
    "archiveEntries" INTEGER NOT NULL DEFAULT 0,
    "maxParserOutputBytes" INTEGER NOT NULL,
    "maxArchiveEntries" INTEGER NOT NULL,
    CONSTRAINT "file_uploads_bounds" CHECK (
        "declaredSize" BETWEEN 1 AND 26214400 AND "chunkBytes" BETWEEN 1 AND 1048576
        AND "declaredSize" <= "chunkBytes"::bigint * 128 AND "bytesReceived" BETWEEN 0 AND "declaredSize"
        AND "maxParserOutputBytes" BETWEEN 1 AND 52428800 AND "parserOutputBytes" BETWEEN 0 AND "maxParserOutputBytes"
        AND "maxArchiveEntries" BETWEEN 1 AND 1000 AND "archiveEntries" BETWEEN 0 AND "maxArchiveEntries"
        AND "revision" >= 0 AND "expiresAt" > "createdAt"
    ),
    CONSTRAINT "file_uploads_integrity" CHECK (
        "expectedDigest" ~ '^[a-f0-9]{64}$'
        AND ("digest" IS NULL OR "digest" = "expectedDigest")
        AND ("scanResult" IS NULL OR "scanResult" IN ('clean', 'infected'))
        AND ("state" NOT IN ('SCANNING', 'READY') OR (
            "bytesReceived" = "declaredSize" AND "digest" IS NOT NULL
            AND "sniffedType" IS NOT NULL AND "sniffedType" = "declaredType"
        ))
        AND ("state" <> 'READY' OR COALESCE("scanResult" = 'clean', FALSE))
    )
);

CREATE INDEX "file_uploads_uid_state_idx" ON "file_uploads" ("uid", "state");

CREATE TABLE "file_upload_chunks" (
    "uploadId" TEXT NOT NULL REFERENCES "file_uploads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "offset" INTEGER NOT NULL CHECK ("offset" >= 0),
    "size" INTEGER NOT NULL CHECK ("size" BETWEEN 1 AND 1048576),
    "digest" TEXT NOT NULL CHECK ("digest" ~ '^[a-f0-9]{64}$'),
    "objectName" TEXT NOT NULL UNIQUE CHECK ("objectName" =
        'file-01/' || "uploadId" || '/' || "offset"::text || '-' || "digest"),
    "generation" TEXT CHECK ("generation" ~ '^[1-9][0-9]{0,19}$'),
    PRIMARY KEY ("uploadId", "offset")
);
