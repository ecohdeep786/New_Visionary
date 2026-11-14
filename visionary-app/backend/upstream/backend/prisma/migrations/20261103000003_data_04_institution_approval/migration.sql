-- Retain historical approvals and bind each new invitation to its issuance approval.
CREATE TABLE "institution_approvals" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "administratorUid" TEXT NOT NULL,
  "reviewerUid" TEXT NOT NULL,
  "policy" TEXT NOT NULL,
  "evidenceRef" TEXT NOT NULL,
  "approvedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "revokedByUid" TEXT,
  CONSTRAINT "institution_approvals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "institution_approvals_scope_check" CHECK (
    "administratorUid" <> "reviewerUid"
    AND "policy" = 'institution-invitations-v1'
    AND "evidenceRef" ~ '^proof_[A-Za-z0-9_-]{16,100}$'
    AND "expiresAt" > "approvedAt"
    AND "expiresAt" <= "approvedAt" + INTERVAL '90 days'
    AND (("revokedAt" IS NULL AND "revokedByUid" IS NULL) OR
         ("revokedAt" IS NOT NULL AND "revokedByUid" IS NOT NULL AND "revokedAt" >= "approvedAt"))
  )
);

CREATE UNIQUE INDEX "institution_approvals_id_workspaceId_key" ON "institution_approvals" ("id", "workspaceId");
CREATE INDEX "institution_approvals_workspaceId_expiresAt_idx" ON "institution_approvals" ("workspaceId", "expiresAt");
ALTER TABLE "institution_approvals" ADD CONSTRAINT "institution_approvals_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invitations" ADD COLUMN "institutionApprovalId" TEXT;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_institutionApprovalId_workspaceId_fkey" FOREIGN KEY ("institutionApprovalId", "workspaceId") REFERENCES "institution_approvals"("id", "workspaceId") ON DELETE NO ACTION ON UPDATE CASCADE;
