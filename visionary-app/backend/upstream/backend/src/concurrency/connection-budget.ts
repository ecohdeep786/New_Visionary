import type { PrismaClient } from '@prisma/client';

export interface ConnectionBudget {
  databaseConnections: number;
  reservedConnections: number;
  workloads: Array<{
    role: string;
    maxInstances: number;
    revisionOverlap: number;
    poolsPerInstance: number[];
    roleConnectionLimit: number;
  }>;
}
const fail = () => { throw new Error('INVALID_CONNECTION_BUDGET'); };
const integer = (n: unknown, minimum = 1): n is number => Number.isSafeInteger(n) && Number(n) >= minimum;
const keys = (value: unknown, names: string) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).sort().join(',') === names;

/** Includes every pool, instance and overlapping revision, not just busy
 * connections in one process. PostgreSQL role limits govern normal database
 * connection admission; this pure calculation cannot install them or certify
 * hosted fairness/availability under connection-start races. */
export function connectionBudget(input: unknown) {
  if (!keys(input, 'databaseConnections,reservedConnections,workloads')) fail();
  const plan = input as ConnectionBudget;
  if (!integer(plan.databaseConnections) || !integer(plan.reservedConnections) ||
      !Array.isArray(plan.workloads) || !plan.workloads.length || plan.workloads.length > 32) fail();
  const roles = new Set<string>(); let planned = 0, capped = 0;
  for (const w of plan.workloads) {
    if (!keys(w, 'maxInstances,poolsPerInstance,revisionOverlap,role,roleConnectionLimit') ||
        typeof w.role !== 'string' || !/^[A-Za-z_][A-Za-z0-9_.@-]{0,62}$/.test(w.role) || roles.has(w.role) ||
        !integer(w.maxInstances) || !integer(w.revisionOverlap) || !integer(w.roleConnectionLimit) ||
        !Array.isArray(w.poolsPerInstance) || !w.poolsPerInstance.length || w.poolsPerInstance.length > 32 ||
        w.poolsPerInstance.some(n => !integer(n))) fail();
    roles.add(w.role);
    const demand = w.maxInstances * w.revisionOverlap * w.poolsPerInstance.reduce((a, b) => a + b, 0);
    if (!integer(demand) || demand > w.roleConnectionLimit) fail();
    planned += demand; capped += w.roleConnectionLimit;
  }
  if (!integer(planned) || !integer(capped) || !integer(capped + plan.reservedConnections) ||
      capped + plan.reservedConnections > plan.databaseConnections) fail();
  return Object.freeze({ plannedConnections: planned, cappedConnections: capped,
    reservedConnections: plan.reservedConnections, databaseConnections: plan.databaseConnections });
}

/** Read-only preflight against the actual server. An unlimited or privileged
 * role cannot be certified. No credential, connection URL or user data leaves
 * this diagnostic; no schema/role/production configuration is changed. */
export async function verifyPostgresConnectionBudget(db: PrismaClient, plan: ConnectionBudget) {
  const pinned = structuredClone(plan);
  const result = connectionBudget(pinned);
  try {
    await db.$transaction(async tx => {
      await tx.$queryRawUnsafe("SELECT set_config('statement_timeout','4000',true)");
      const [server] = await tx.$queryRawUnsafe<Array<{ maximum: number; reserved: number }>>(`SELECT current_setting('max_connections')::integer AS maximum,
        current_setting('superuser_reserved_connections')::integer + COALESCE(current_setting('reserved_connections',true),'0')::integer AS reserved`);
      if (!integer(server?.maximum) || !integer(server?.reserved, 0) || server.maximum !== pinned.databaseConnections ||
          pinned.reservedConnections < server.reserved) throw new Error('DATABASE_CAPACITY_DRIFT');
      for (const w of pinned.workloads) {
        const [role] = await tx.$queryRawUnsafe<Array<{ connection_limit: number; can_login: boolean; privileged: boolean }>>(`
          SELECT r.rolconnlimit AS connection_limit,r.rolcanlogin AS can_login,
            EXISTS(SELECT 1 FROM pg_roles d WHERE pg_has_role(r.oid,d.oid,'MEMBER') AND
              (d.rolsuper OR d.rolcreatedb OR d.rolcreaterole OR d.rolbypassrls OR d.rolreplication)) AS privileged
          FROM pg_roles r WHERE r.rolname=$1`, w.role);
        if (!role || !role.can_login || role.privileged || role.connection_limit !== w.roleConnectionLimit) throw new Error('DATABASE_ROLE_CAPACITY_DRIFT');
      }
    }, { isolationLevel: 'RepeatableRead', maxWait: 2000, timeout: 5000 });
  } catch (error) {
    if (error instanceof Error && ['DATABASE_CAPACITY_DRIFT', 'DATABASE_ROLE_CAPACITY_DRIFT'].includes(error.message)) throw error;
    throw new Error('DATABASE_CAPACITY_UNAVAILABLE');
  }
  if (JSON.stringify(plan) !== JSON.stringify(pinned)) throw new Error('CONNECTION_BUDGET_CHANGED');
  return result;
}
