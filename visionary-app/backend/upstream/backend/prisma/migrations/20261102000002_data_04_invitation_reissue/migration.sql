-- Preserve every invitation and its lifecycle. Only current deliveries conflict.
DROP INDEX "invitations_workspaceId_email_key";
CREATE INDEX "invitations_workspaceId_email_idx" ON "invitations"("workspaceId", "email");
CREATE UNIQUE INDEX "invitations_one_pending_email" ON "invitations"("workspaceId", lower("email")) WHERE "status" IN ('PENDING', 'ISSUED');
