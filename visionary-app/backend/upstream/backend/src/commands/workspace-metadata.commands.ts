import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';

export class CommandPolicyError extends Error {
  constructor(public readonly code:'invalid_command'|'unauthorized'|'conflict'|'stale_revision'|'unavailable') { super(code); }
}
type Target=Readonly<{role:string;schema:string;database:string}>;
const operations=['workspace.metadata.rename','workspace.metadata.describe'];
type Command={commandId:string;workspaceId:string;operation:typeof operations[number];expectedRevision:number;value:string};
export interface MetadataReceipt {
  commandId:string;workspaceId:string;operation:string;revision:number;
  result:{id:string;name:string;description:string|null};committedAt:string;replayed:boolean;
}
function command(input:unknown):Command {
  if(!input || typeof input!=='object' || Array.isArray(input))throw new CommandPolicyError('invalid_command');
  const c=input as Record<string,unknown>;
  if(Object.keys(c).sort().join(',')!=='commandId,expectedRevision,operation,value,workspaceId' ||
    typeof c.commandId!=='string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(c.commandId) ||
    typeof c.workspaceId!=='string' || !c.workspaceId.trim() || c.workspaceId.length>128 ||
    typeof c.operation!=='string' || !operations.includes(c.operation) ||
    !Number.isSafeInteger(c.expectedRevision) || Number(c.expectedRevision)<0 || Number(c.expectedRevision)>2147483646 ||
    typeof c.value!=='string')throw new CommandPolicyError('invalid_command');
  const value=c.value.trim();
  if((c.operation==='workspace.metadata.rename' && (!value || value.length>160)) || value.length>2000)throw new CommandPolicyError('invalid_command');
  return {commandId:c.commandId,workspaceId:c.workspaceId,operation:c.operation,expectedRevision:Number(c.expectedRevision),value};
}

/** Durable owning-domain commands, deliberately absent from the product module.
 * The eventual caller must obtain uid from the verified server session. Neither
 * a UID argument nor this repository establishes Firebase admission. Only the
 * workspace owner's metadata is supported; no generic payload echo, deletion,
 * learner-record mutation or pretend outbox dispatch is exposed here. */
export class WorkspaceMetadataCommands {
  private readonly target:Target;
  constructor(private readonly db:PrismaClient,target:Target) { this.target=Object.freeze({...target}); }

  async execute(uid:string,input:unknown):Promise<MetadataReceipt> {
    if(typeof uid!=='string' || !uid.trim() || uid.length>128)throw new CommandPolicyError('unauthorized');
    const c=command(input),hash=createHash('sha256').update(JSON.stringify({uid,...c})).digest('hex');
    try {
      return await this.db.$transaction(async tx=>{
        const [identity]=await tx.$queryRawUnsafe<Array<{role:string;schema:string;database:string;privileged:boolean;controls:boolean}>>(`
          SELECT current_user AS role,current_schema() AS schema,current_database() AS database,
            EXISTS(SELECT 1 FROM pg_roles d WHERE pg_has_role(current_user,d.oid,'MEMBER') AND
              (d.rolsuper OR d.rolcreatedb OR d.rolcreaterole OR d.rolbypassrls OR
               has_schema_privilege(d.oid,current_schema(),'CREATE') OR has_database_privilege(d.oid,current_database(),'CREATE'))) AS privileged,
            EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
              WHERE n.nspname=current_schema() AND (pg_has_role(current_user,c.relowner,'MEMBER') OR
                (left(c.relname,11)='_visionary_' AND EXISTS(SELECT 1 FROM pg_roles d WHERE pg_has_role(current_user,d.oid,'MEMBER') AND CASE
                  WHEN c.relkind IN ('r','p') THEN has_table_privilege(d.oid,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
                  WHEN c.relkind='S' THEN has_sequence_privilege(d.oid,c.oid,'USAGE,UPDATE') ELSE FALSE END)))) AS controls`);
        if(!identity || identity.role!==this.target.role || identity.schema!==this.target.schema || identity.database!==this.target.database || identity.privileged || identity.controls)throw new CommandPolicyError('unavailable');
        // Canonical account-before-workspace order also serializes outbox cursors.
        const accounts=await tx.$queryRaw<Array<{uid:string}>>`SELECT uid FROM persons WHERE uid=${uid} FOR UPDATE`;
        if(!accounts.length)throw new CommandPolicyError('unauthorized');
        const workspaces=await tx.$queryRaw<Array<{id:string;uid:string}>>`SELECT id,uid FROM workspaces WHERE id=${c.workspaceId} FOR UPDATE`;
        if(!workspaces.length || workspaces[0].uid!==uid)throw new CommandPolicyError('unauthorized');
        if(await tx.deletionTombstone.findFirst({where:{uid,OR:[{resourceType:'person'},{resourceType:'workspace',resourceId:c.workspaceId}]}}))throw new CommandPolicyError('unauthorized');
        // Reauthorize BEFORE replay. Retained receipts never recover lost rights.
        const prior=await tx.commandResult.findUnique({where:{commandId:c.commandId}});
        if(prior) {
          if(prior.uid!==uid)throw new CommandPolicyError('unauthorized');
          if(prior.workspaceId!==c.workspaceId || prior.kind!==c.operation || prior.payloadDigest!==hash || prior.status!=='COMMITTED' || !prior.resultJson || !prior.committedAt)throw new CommandPolicyError('conflict');
          return {commandId:c.commandId,workspaceId:c.workspaceId,operation:c.operation,revision:prior.revision,result:prior.resultJson as MetadataReceipt['result'],committedAt:prior.committedAt.toISOString(),replayed:true};
        }
        const latest=await tx.commandResult.aggregate({where:{uid,workspaceId:c.workspaceId,kind:{in:operations},status:'COMMITTED'},_max:{revision:true}});
        const current=latest._max.revision??0;
        if(current!==c.expectedRevision || current>=2147483647)throw new CommandPolicyError('stale_revision');
        const revision=current+1;
        const [clock]=await tx.$queryRaw<Array<{now:Date}>>`SELECT clock_timestamp() AS now`;
        const result=await tx.workspace.update({where:{id:c.workspaceId},data:c.operation==='workspace.metadata.rename'?{name:c.value}:{description:c.value||null},select:{id:true,name:true,description:true}});
        await tx.auditEvent.create({data:{uid,workspaceId:c.workspaceId,actorType:'user',actorUid:uid,operation:c.operation,resourceType:'workspace',resourceId:c.workspaceId,outcome:'SUCCESS',createdAt:clock.now}});
        await tx.outboxEvent.create({data:{uid,workspaceId:c.workspaceId,topic:'workspace.metadata.changed',payload:{commandId:c.commandId,operation:c.operation,revision},createdAt:clock.now}});
        const [committed]=await tx.$queryRaw<Array<{now:Date}>>`SELECT clock_timestamp() AS now`;
        await tx.commandResult.create({data:{uid,workspaceId:c.workspaceId,commandId:c.commandId,kind:c.operation,payloadDigest:hash,status:'COMMITTED',resultJson:result,revision,attemptedAt:clock.now,committedAt:committed.now}});
        return {commandId:c.commandId,workspaceId:c.workspaceId,operation:c.operation,revision,result,committedAt:committed.now.toISOString(),replayed:false};
      },{maxWait:5000,timeout:10000});
    } catch(error) {
      if(error instanceof CommandPolicyError)throw error;
      if((error as {code?:string})?.code==='P2002')throw new CommandPolicyError('conflict');
      throw new CommandPolicyError('unavailable');
    }
  }
}
