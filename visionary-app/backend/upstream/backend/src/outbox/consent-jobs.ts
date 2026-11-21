import type { PrismaClient } from '@prisma/client';
import type { WorkspaceRepository } from '../workspaces/workspace.repository';
import { CONSENT_REVOCATION_TOPIC } from './postgres-outbox.store';

type Workload = 'downloads' | 'model_context';

/** The caller supplies a server-authorized subject and a stable command UUID. */
export async function enqueueConsentJob(
  repository: WorkspaceRepository,
  input: { id: string; uid: string; workload: Workload; resourceId?: string; consentVersion: string },
) {
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(input.id) ||
      (input.workload !== 'downloads' && input.workload !== 'model_context')) throw Error('Invalid consent job.');
  return repository.withConsentDelivery(input.uid, input.workload, input.resourceId, input.consentVersion, async (tx, grantId) => {
    const job = await tx.consentJob.upsert({
      where: { id: input.id }, create: { id: input.id, grantId, workload: input.workload }, update: {},
    });
    if (job.grantId !== grantId || job.workload !== input.workload) throw Error('Consent job ID conflict.');
    return job;
  });
}

export async function applyConsentRevocation(db: PrismaClient, cursor: bigint, attempt: number): Promise<boolean> {
  return db.$transaction(async tx => {
    const [row] = await tx.$queryRaw<Array<{
      status: string; attempts: number; effectAppliedAt: Date | null;
    }>>`
      SELECT status::text, attempts, "effectAppliedAt"
      FROM outbox_deliveries WHERE cursor = ${cursor} FOR UPDATE
    `;
    if (!row) return false;
    if (row.status === 'DONE' && row.effectAppliedAt) return true;
    if (row.status !== 'LEASED' || row.attempts !== attempt) return false;
    const [lease] = await tx.$queryRaw<Array<{ active: boolean }>>`
      SELECT "availableAt" > timezone('UTC', clock_timestamp()) AS active
      FROM outbox_deliveries WHERE cursor = ${cursor}
    `;
    if (!lease?.active) return false;

    const event = await tx.outboxEvent.findUnique({ where: { cursor }, select: { uid: true, topic: true, payload: true } });
    if (!event || event.topic !== CONSENT_REVOCATION_TOPIC || !event.payload ||
        typeof event.payload !== 'object' || Array.isArray(event.payload)) return false;
    const { id, purpose, resourceId, consentVersion, revokedAt } = event.payload;
    if (typeof id !== 'string' || typeof purpose !== 'string' || typeof consentVersion !== 'string' ||
        (resourceId !== null && typeof resourceId !== 'string') || typeof revokedAt !== 'string') return false;
    const grant = await tx.consentGrant.findUnique({ where: { id }, select: {
      uid: true, purpose: true, resourceId: true, consentVersion: true, revokedAt: true,
    } });
    if (!grant?.revokedAt || grant.uid !== event.uid || grant.purpose !== purpose || grant.resourceId !== resourceId ||
        grant.consentVersion !== consentVersion || grant.revokedAt.toISOString() !== revokedAt) return false;

    await tx.consentJob.updateMany({
      where: { grantId: id, state: 'PENDING' }, data: { state: 'CANCELLED', cancelledAt: grant.revokedAt },
    });
    await tx.$executeRaw`
      UPDATE outbox_deliveries SET status = 'DONE', "effectAppliedAt" = timezone('UTC', clock_timestamp()), "lastError" = NULL
      WHERE cursor = ${cursor}
    `;
    return true;
  });
}
