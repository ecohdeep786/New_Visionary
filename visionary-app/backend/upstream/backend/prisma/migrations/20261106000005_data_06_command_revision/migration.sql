-- Resource revision survives actor transfers and receipt lifecycle.
CREATE TABLE "workspace_command_revisions" (
  "workspaceId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "workspace_command_revisions_pkey" PRIMARY KEY ("workspaceId"),
  CONSTRAINT "workspace_command_revisions_nonnegative" CHECK ("revision" >= 0)
);
ALTER TABLE "workspace_command_revisions" ADD CONSTRAINT "workspace_command_revisions_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
