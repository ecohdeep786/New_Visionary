-- Minimal reviewer-mediated assurance; no birth date or raw identity documents.
CREATE TABLE "admission_assurances" (
  "uid" TEXT NOT NULL PRIMARY KEY,
  "classification" TEXT NOT NULL,
  "reviewerUid" TEXT NOT NULL,
  "evidenceRef" TEXT NOT NULL,
  "policy" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "revision" INTEGER NOT NULL,
  CONSTRAINT "admission_assurances_uid_fkey" FOREIGN KEY ("uid") REFERENCES "persons"("uid") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "admission_assurances_scope" CHECK (
    "classification" IN ('adult','minor') AND "reviewerUid" <> "uid" AND
    "policy" = 'admission-all-ages-v1' AND "revision" > 0 AND
    "evidenceRef" ~ '^proof_[A-Za-z0-9_-]{16,100}$' AND
    "expiresAt" > "issuedAt" AND "expiresAt" <= "issuedAt" + INTERVAL '90 days' AND
    ("revokedAt" IS NULL OR "revokedAt" >= "issuedAt")
  )
);
CREATE TABLE "guardian_admission_links" (
  "minorUid" TEXT NOT NULL PRIMARY KEY,
  "guardianUid" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "policy" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "minorAssuranceRevision" INTEGER NOT NULL,
  "guardianAssuranceRevision" INTEGER NOT NULL,
  "reviewerUid" TEXT,
  "evidenceRef" TEXT,
  "expiresAt" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "guardian_admission_links_minorUid_fkey" FOREIGN KEY ("minorUid") REFERENCES "persons"("uid") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "guardian_admission_links_guardianUid_fkey" FOREIGN KEY ("guardianUid") REFERENCES "persons"("uid") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "guardian_admission_links_scope" CHECK (
    "minorUid" <> "guardianUid" AND "policy" = 'admission-all-ages-v1' AND
    "state" IN ('requested','approved','linked','revoked') AND "revision" > 0 AND
    "minorAssuranceRevision" > 0 AND "guardianAssuranceRevision" > 0 AND
    ("state" NOT IN ('approved','linked') OR
      ("reviewerUid" IS NOT NULL AND "reviewerUid" <> "minorUid" AND "reviewerUid" <> "guardianUid" AND
       "evidenceRef" IS NOT NULL AND "evidenceRef" ~ '^proof_[A-Za-z0-9_-]{16,100}$' AND "expiresAt" IS NOT NULL)) AND
    ("state" <> 'linked' OR ("confirmedAt" IS NOT NULL AND "confirmedAt" < "expiresAt")) AND
    ("state" <> 'revoked' OR "revokedAt" IS NOT NULL)
  )
);
CREATE INDEX "guardian_admission_links_guardianUid_idx" ON "guardian_admission_links" ("guardianUid");
