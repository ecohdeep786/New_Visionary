import type { PrismaClient } from '@prisma/client';
import { hash, ProvisionError, ProvisionIdentity, ProvisionResult } from './provision-types';
export interface ProvisionStore { commit(identity: ProvisionIdentity): Promise<ProvisionResult>; }
export interface ProvisionLinkStore {
  begin(identity: ProvisionIdentity): Promise<{ recovered: boolean }>;
  complete(identity: ProvisionIdentity, workspaceId: string): Promise<void>;
}
/** All domain writes and their receipt share one PostgreSQL transaction.
 * Receives a DML-only client; never creates schemas or runs migrations. */
export class PostgresProvisionStore implements ProvisionStore {
  constructor(private readonly db: PrismaClient, private readonly identity: { role: string; schema: string }) {}
  async commit(i: ProvisionIdentity): Promise<ProvisionResult> {
    return this.db.$transaction(async tx => {
      const roles = await tx.$queryRawUnsafe<any[]>(`SELECT current_user AS role, current_schema() AS schema, current_database() AS database,
        r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolbypassrls AS privileged,
        EXISTS(SELECT 1 FROM pg_roles d WHERE pg_has_role(r.oid,d.oid,'MEMBER') AND
          (d.rolsuper OR d.rolcreatedb OR d.rolcreaterole OR d.rolbypassrls OR
           has_schema_privilege(d.oid,current_schema(),'CREATE') OR has_database_privilege(d.oid,current_database(),'CREATE'))) AS delegated,
        EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname=current_schema() AND (pg_has_role(r.oid,c.relowner,'MEMBER') OR
            (left(c.relname,11)='_visionary_' AND EXISTS(SELECT 1 FROM pg_roles d WHERE pg_has_role(r.oid,d.oid,'MEMBER') AND CASE
              WHEN c.relkind IN ('r','p') THEN has_table_privilege(d.oid,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
              WHEN c.relkind='S' THEN has_sequence_privilege(d.oid,c.oid,'USAGE,UPDATE') ELSE FALSE END)))) AS owns_or_controls
        FROM pg_roles r WHERE r.rolname=current_user`);
      if (!roles[0] || roles[0].role !== this.identity.role || roles[0].schema !== this.identity.schema || roles[0].schema !== i.target.schema || roles[0].database !== i.target.database || roles[0].privileged || roles[0].delegated || roles[0].owns_or_controls) throw new ProvisionError('UNAVAILABLE', 503);
      await tx.person.upsert({ where: { uid: i.uid }, create: { uid: i.uid }, update: { updatedAt: new Date() } });
      // Lock the UID anchor before receipt lookup and personal workspace allocation.
      await tx.person.update({ where: { uid: i.uid }, data: { updatedAt: new Date() } });
      const prior = await tx.commandResult.findUnique({ where: { commandId: i.key } });
      if (prior && (prior.uid !== i.uid || prior.kind !== 'personal-workspace.provision' || prior.payloadDigest !== i.digest || prior.status !== 'COMMITTED')) throw new ProvisionError('CONFLICT', 409);
      let ws = await tx.workspace.findFirst({ where: { uid: i.uid, isPersonal: true } });
      const recovered = !!ws;
      if (prior && (!ws || ws.id !== prior.workspaceId)) throw new ProvisionError('CONFLICT', 409);
      if (await tx.deletionTombstone.findFirst({ where: { uid: i.uid, resourceType: 'workspace', ...(ws ? { resourceId: ws.id } : {}) } })) throw new ProvisionError('CONFLICT', 409);
      if (!ws) ws = await tx.workspace.create({ data: { uid: i.uid, name: 'Personal workspace', slug: 'personal-' + hash(i.uid), isPersonal: true } });
      const membership = await tx.workspaceMembership.findUnique({ where: { uid_workspaceId: { uid: i.uid, workspaceId: ws.id } } });
      if (membership && membership.role !== 'OWNER') throw new ProvisionError('CONFLICT', 409);
      if (!membership) await tx.workspaceMembership.create({ data: { uid: i.uid, workspaceId: ws.id, role: 'OWNER', source: 'direct' } });
      const result = { personalWorkspaceId: ws.id, name: ws.name, slug: ws.slug };
      if (!prior) {
        await tx.commandResult.create({ data: { uid: i.uid, commandId: i.key, kind: 'personal-workspace.provision', payloadDigest: i.digest, workspaceId: ws.id, status: 'COMMITTED', committedAt: new Date(), resultJson: result } });
        if (!recovered) {
          await tx.outboxEvent.create({ data: { uid: i.uid, workspaceId: ws.id, topic: 'workspace.created', payload: result } });
          await tx.auditEvent.create({ data: { uid: i.uid, workspaceId: ws.id, operation: 'workspace.personal.provision', actorType: 'user', resourceType: 'workspace', resourceId: ws.id, outcome: 'SUCCESS' } });
        }
      }
      return { ...result, replay: !!prior, recovered };
    }, { maxWait: 5000, timeout: 10000 });
  }
}
