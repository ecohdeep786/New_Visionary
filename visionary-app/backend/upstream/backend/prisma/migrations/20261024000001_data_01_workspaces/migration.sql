-- DATA-01: Review product SQL DDL and indexes for UID linkage,
-- workspaces/memberships, consent, sources/releases, sessions/evidence,
-- classrooms/projects and operational records; exclude legacy account/plan authority.
--
-- PostgreSQL owns domain/membership/evidence/run state, linked by the canonical
-- Firebase UID (Person.uid). Firestore retains authority for account/billing/
-- profile; SQL does NOT duplicate or replace those fields.

-- ── persons (references Firestore UID, no auth fields) ──────────────────────────
CREATE TABLE IF NOT EXISTS "persons" (
    "uid"        TEXT          NOT NULL,
    "createdAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "persons_pkey" PRIMARY KEY ("uid")
);

-- ── workspaces ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "workspaces" (
    "id"          TEXT          NOT NULL,
    "uid"         TEXT          NOT NULL,
    "name"        TEXT          NOT NULL,
    "slug"        TEXT          NOT NULL,
    "description" TEXT,
    "isPersonal"  BOOLEAN       NOT NULL DEFAULT FALSE,
    "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "workspaces_slug_key" UNIQUE ("slug"),
    CONSTRAINT "workspaces_uid_fkey" FOREIGN KEY ("uid") REFERENCES "persons" ("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "workspaces_uid_idx" ON "workspaces" ("uid");

-- ── workspace memberships ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "workspace_memberships" (
    "id"            TEXT          NOT NULL,
    "uid"           TEXT          NOT NULL,
    "workspaceId"   TEXT          NOT NULL,
    "role"          TEXT          NOT NULL DEFAULT 'MEMBER',
    "source"        TEXT          NOT NULL,
    "sourceVersion" TEXT          NOT NULL DEFAULT 'v1',
    "purpose"       TEXT,
    "consentVersion" TEXT,
    "joinedAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_memberships_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "workspace_memberships_uid_workspaceId_key" UNIQUE ("uid", "workspaceId"),
    CONSTRAINT "workspace_memberships_uid_fkey" FOREIGN KEY ("uid") REFERENCES "persons" ("uid") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workspace_memberships_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "workspace_memberships_workspaceId_idx" ON "workspace_memberships" ("workspaceId");

-- ── invitations ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "invitations" (
    "id"          TEXT          NOT NULL,
    "workspaceId" TEXT          NOT NULL,
    "email"       TEXT          NOT NULL,
    "role"        TEXT          NOT NULL DEFAULT 'MEMBER',
    "tokenHash"   TEXT,
    "status"      TEXT          NOT NULL DEFAULT 'PENDING',
    "expiresAt"   TIMESTAMP(3)  NOT NULL,
    "issuedAt"    TIMESTAMP(3),
    "acceptedAt"  TIMESTAMP(3),
    "revokedAt"   TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invitations_workspaceId_email_key" UNIQUE ("workspaceId", "email"),
    CONSTRAINT "invitations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "invitations_email_idx" ON "invitations" ("email");

-- ── consent grants ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "consent_grants" (
    "id"              TEXT          NOT NULL,
    "uid"             TEXT          NOT NULL,
    "purpose"         TEXT          NOT NULL,
    "resourceId"      TEXT,
    "grantedAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"       TIMESTAMP(3),
    "revokedAt"       TIMESTAMP(3),
    "version"         TEXT          NOT NULL,
    "consentVersion"  TEXT          NOT NULL,
    CONSTRAINT "consent_grants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "consent_grants_uid_purpose_resourceId_consentVersion_key" UNIQUE ("uid", "purpose", "resourceId", "consentVersion"),
    CONSTRAINT "consent_grants_uid_fkey" FOREIGN KEY ("uid") REFERENCES "persons" ("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "consent_grants_uid_idx" ON "consent_grants" ("uid");
CREATE INDEX IF NOT EXISTS "consent_grants_purpose_idx" ON "consent_grants" ("purpose");

-- ── share grants ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "share_grants" (
    "id"              TEXT          NOT NULL,
    "uid"             TEXT          NOT NULL,
    "resourceType"    TEXT          NOT NULL,
    "resourceId"      TEXT          NOT NULL,
    "grantedToUid"    TEXT,
    "purpose"         TEXT          NOT NULL,
    "scope"           TEXT          NOT NULL,
    "grantedAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"       TIMESTAMP(3),
    "revokedAt"       TIMESTAMP(3),
    "consentVersion"  TEXT          NOT NULL,
    CONSTRAINT "share_grants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "share_grants_uid_resourceType_resourceId_purpose_consentVersion_key" UNIQUE ("uid", "resourceType", "resourceId", "purpose", "consentVersion"),
    CONSTRAINT "share_grants_uid_fkey" FOREIGN KEY ("uid") REFERENCES "persons" ("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "share_grants_resourceType_resourceId_idx" ON "share_grants" ("resourceType", "resourceId");
CREATE INDEX IF NOT EXISTS "share_grants_grantedToUid_idx" ON "share_grants" ("grantedToUid");

-- ── command results (idempotency / duplicate-command detection) ────────────────
CREATE TABLE IF NOT EXISTS "command_results" (
    "id"           TEXT          NOT NULL,
    "uid"          TEXT          NOT NULL,
    "commandId"    TEXT          NOT NULL,
    "kind"         TEXT          NOT NULL,
    "payloadDigest" TEXT         NOT NULL,
    "workspaceId"  TEXT,
    "status"       TEXT          NOT NULL DEFAULT 'PENDING',
    "resultJson"   JSONB,
    "error"        TEXT,
    "attemptedAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committedAt"  TIMESTAMP(3),
    "revision"     INTEGER       NOT NULL DEFAULT 1,
    CONSTRAINT "command_results_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "command_results_commandId_key" UNIQUE ("commandId"),
    CONSTRAINT "command_results_uid_fkey" FOREIGN KEY ("uid") REFERENCES "persons" ("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "command_results_uid_idx" ON "command_results" ("uid");
CREATE INDEX IF NOT EXISTS "command_results_kind_idx" ON "command_results" ("kind");
CREATE INDEX IF NOT EXISTS "command_results_committedAt_idx" ON "command_results" ("committedAt");

-- ── outbox events (SYNC-01) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "outbox_events" (
    "id"            TEXT          NOT NULL,
    "uid"           TEXT          NOT NULL,
    "workspaceId"   TEXT,
    "topic"         TEXT          NOT NULL,
    "payload"       JSONB         NOT NULL,
    "cursor"        TEXT          NOT NULL,
    "status"        TEXT          NOT NULL DEFAULT 'PENDING',
    "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatchedAt"  TIMESTAMP(3),
    "failureReason" TEXT,
    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "outbox_events_uid_fkey" FOREIGN KEY ("uid") REFERENCES "persons" ("uid") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "outbox_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "outbox_events_uid_cursor_idx" ON "outbox_events" ("uid", "cursor");
CREATE INDEX IF NOT EXISTS "outbox_events_status_idx" ON "outbox_events" ("status");
CREATE INDEX IF NOT EXISTS "outbox_events_createdAt_idx" ON "outbox_events" ("createdAt");
CREATE INDEX IF NOT EXISTS "outbox_events_workspaceId_idx" ON "outbox_events" ("workspaceId");

-- ── audit events (PRIV-01/PRIV-03) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "audit_events" (
    "id"          TEXT          NOT NULL,
    "uid"         TEXT          NOT NULL,
    "workspaceId" TEXT,
    "operation"   TEXT          NOT NULL,
    "actorType"   TEXT          NOT NULL,
    "actorUid"    TEXT,
    "resourceType" TEXT         NOT NULL,
    "resourceId"   TEXT,
    "outcome"     TEXT          NOT NULL,
    "ip"          TEXT,
    "userAgent"   TEXT,
    "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_events_uid_fkey" FOREIGN KEY ("uid") REFERENCES "persons" ("uid") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "audit_events_uid_createdAt_idx" ON "audit_events" ("uid", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_events_operation_createdAt_idx" ON "audit_events" ("operation", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_events_workspaceId_createdAt_idx" ON "audit_events" ("workspaceId", "createdAt");

-- ── deletion tombstones (PRIV-02/PRIV-03) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "deletion_tombstones" (
    "id"          TEXT          NOT NULL,
    "uid"         TEXT          NOT NULL,
    "resourceType" TEXT         NOT NULL,
    "resourceId"   TEXT          NOT NULL,
    "reason"      TEXT,
    "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"   TIMESTAMP(3),
    CONSTRAINT "deletion_tombstones_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "deletion_tombstones_uid_resourceType_resourceId_key" UNIQUE ("uid", "resourceType", "resourceId"),
    CONSTRAINT "deletion_tombstones_uid_fkey" FOREIGN KEY ("uid") REFERENCES "persons" ("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "deletion_tombstones_expiresAt_idx" ON "deletion_tombstones" ("expiresAt");
