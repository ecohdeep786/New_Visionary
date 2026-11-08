import { createHash } from 'node:crypto';
import type { PrismaClient, Prisma, AdmissionAssurance, GuardianAdmissionLink } from '@prisma/client';

export const ADMISSION_POLICY = 'admission-all-ages-v1';
const MAX_PROOF_MS = 90 * 86400_000; // Engineering expiry ceiling, not a retention/legal age rule.
type Tx = Prisma.TransactionClient;
type Target = Readonly<{ role: string; schema: string; database: string }>;
export class AdmissionError extends Error {
  constructor(public readonly code: 'invalid_command' | 'unauthorized' | 'conflict' | 'stale_revision' | 'unavailable') { super(code); }
}
function deny(): never { throw new AdmissionError('unauthorized'); }
function validUid(value: unknown): value is string { return typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value) && !/^__.*__$/.test(value); }
function exact(value: unknown, keys: string): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join(',') === keys;
}
type Command = { commandId: string; subjectUid: string; expectedRevision: number; operation: string; payload: Record<string, unknown> };
function command(input: unknown): Command {
  if (!exact(input, 'commandId,expectedRevision,operation,payload,subjectUid') ||
      typeof input.commandId !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(input.commandId) || !validUid(input.subjectUid) ||
      !Number.isSafeInteger(input.expectedRevision) || Number(input.expectedRevision) < 0 || Number(input.expectedRevision) > 2147483646 ||
      typeof input.operation !== 'string') throw new AdmissionError('invalid_command');
  const keys = { 'age.assure': 'classification,evidenceRef,expiresAt', 'age.revoke': '',
    'link.request': '', 'link.review': 'evidenceRef,expiresAt', 'link.confirm': '', 'link.revoke': '' }[input.operation];
  if (keys === undefined || !exact(input.payload, keys)) throw new AdmissionError('invalid_command');
  if (input.operation === 'age.assure' && (typeof input.payload.classification !== 'string' || !['adult', 'minor'].includes(input.payload.classification))) throw new AdmissionError('invalid_command');
  if (keys) {
    if (typeof input.payload.evidenceRef !== 'string' || !/^proof_[A-Za-z0-9_-]{16,100}$/.test(input.payload.evidenceRef) ||
        typeof input.payload.expiresAt !== 'string' || !Number.isFinite(Date.parse(input.payload.expiresAt)) ||
        new Date(input.payload.expiresAt).toISOString() !== input.payload.expiresAt) throw new AdmissionError('invalid_command');
  }
  return structuredClone(input) as Command;
}

/** Durable reviewer-mediated enabler. No public controller or automatic age
 * verification is installed. The caller MUST supply the verified session UID;
 * configured reviewer UIDs are deployment trust, never request/profile roles.
 * Proof references attest a completed human review; they are not self-service
 * identity documents or automatic relationship verification. All ages eligible;
 * minors require independent relationship review plus guardian confirmation.
 * Account admission alone grants no reports/content/memory/billing permission. */
export class AdmissionRepository {
  private readonly target: Target;
  private readonly reviewers: ReadonlySet<string>;
  constructor(private readonly db: PrismaClient, target: Target, configuredReviewers: ReadonlySet<string>) {
    if (!target || [target.role, target.schema, target.database].some(x => typeof x !== 'string' || !/^[A-Za-z_][A-Za-z0-9_.@-]{0,62}$/.test(x)) ||
        configuredReviewers.size > 100 || [...configuredReviewers].some(x => !validUid(x))) throw new AdmissionError('invalid_command');
    this.target = Object.freeze({ ...target }); this.reviewers = new Set(configuredReviewers);
  }
  private active(proof: AdmissionAssurance | null, classification: string, now: Date) {
    return !!proof && proof.classification === classification && proof.policy === ADMISSION_POLICY &&
      proof.revokedAt === null && this.reviewers.has(proof.reviewerUid) && proof.reviewerUid !== proof.uid &&
      proof.issuedAt <= now && now < proof.expiresAt;
  }
  private expiry(c: Command, now: Date) {
    const expiry = new Date(String(c.payload.expiresAt)), duration = +expiry - +now;
    if (!(duration > 0 && duration <= MAX_PROOF_MS)) throw new AdmissionError('invalid_command');
    return expiry;
  }
  private reviewer(uid: string, parties: string[]) { if (!this.reviewers.has(uid) || parties.includes(uid)) deny(); }
  private async run<T>(subjectUid: string, actorUid: string, fn: (tx: Tx, link: GuardianAdmissionLink | null, now: Date) => Promise<T>): Promise<T> {
    if (!validUid(subjectUid) || !validUid(actorUid)) throw new AdmissionError('invalid_command');
    try {
      return await this.db.$transaction(async tx => {
        const [identity] = await tx.$queryRawUnsafe<Array<{ role: string; schema: string; database: string; privileged: boolean; controls: boolean }>>(`
          SELECT current_user AS role,current_schema() AS schema,current_database() AS database,
            EXISTS(SELECT 1 FROM pg_roles d WHERE pg_has_role(current_user,d.oid,'MEMBER') AND
              (d.rolsuper OR d.rolcreatedb OR d.rolcreaterole OR d.rolbypassrls OR d.rolreplication OR
               has_schema_privilege(d.oid,current_schema(),'CREATE') OR has_database_privilege(d.oid,current_database(),'CREATE'))) AS privileged,
            EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
              WHERE n.nspname=current_schema() AND (pg_has_role(current_user,c.relowner,'MEMBER') OR
                (left(c.relname,11)='_visionary_' AND EXISTS(SELECT 1 FROM pg_roles d WHERE pg_has_role(current_user,d.oid,'MEMBER') AND CASE
                  WHEN c.relkind IN ('r','p') THEN has_table_privilege(d.oid,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
                  WHEN c.relkind='S' THEN has_sequence_privilege(d.oid,c.oid,'USAGE,UPDATE') ELSE FALSE END)))) AS controls`);
        if (!identity || identity.role !== this.target.role || identity.schema !== this.target.schema || identity.database !== this.target.database ||
            identity.privileged || identity.controls) throw new AdmissionError('unavailable');
        const before = await tx.guardianAdmissionLink.findUnique({ where: { minorUid: subjectUid } });
        const required = [subjectUid, actorUid];
        // Even a revoked link can be re-established with the same guardian
        // before lock acquisition. Lock its guardian regardless of state.
        const uids = [...new Set([...required, ...(before ? [before.guardianUid] : [])])].sort();
        // Canonical per-person lock order serializes assurance/revocation and
        // authorized DB work with each other, without a global admission lock.
        const persons = await tx.$queryRawUnsafe<Array<{ uid: string }>>('SELECT uid FROM persons WHERE uid=ANY($1::text[]) ORDER BY uid FOR UPDATE', uids);
        if (required.some(uid => !persons.some(p => p.uid === uid)) || await tx.deletionTombstone.findFirst({ where: { uid: { in: required }, resourceType: 'person' } })) deny();
        const link = await tx.guardianAdmissionLink.findUnique({ where: { minorUid: subjectUid } });
        if (before?.guardianUid !== link?.guardianUid) throw new AdmissionError('conflict');
        const [clock] = await tx.$queryRaw<Array<{ now: Date }>>`SELECT clock_timestamp() AS now`;
        return fn(tx, link, clock.now);
      }, { maxWait: 5000, timeout: 10000 });
    } catch (error) {
      if (error instanceof AdmissionError) throw error;
      if ((error as { code?: string })?.code === 'P2002') throw new AdmissionError('conflict');
      throw new AdmissionError('unavailable');
    }
  }
  private async status(tx: Tx, uid: string, link: GuardianAdmissionLink | null, now: Date) {
    const proof = await tx.admissionAssurance.findUnique({ where: { uid } });
    if (this.active(proof, 'adult', now)) return 'admitted' as const;
    if (!this.active(proof, 'minor', now)) return 'blocked' as const;
    const guardian = link && await tx.admissionAssurance.findUnique({ where: { uid: link.guardianUid } });
    if (link && await tx.deletionTombstone.findFirst({ where: { uid: link.guardianUid, resourceType: 'person' } })) return 'pending_guardian' as const;
    if (link?.state === 'linked' && link.policy === ADMISSION_POLICY && link.confirmedAt && link.confirmedAt <= now &&
        link.revokedAt === null && link.expiresAt && now < link.expiresAt && this.reviewers.has(link.reviewerUid) &&
        link.reviewerUid !== uid && link.reviewerUid !== link.guardianUid &&
        link.minorAssuranceRevision === proof.revision && this.active(guardian, 'adult', now) &&
        link.guardianAssuranceRevision === guardian.revision) return 'admitted' as const;
    return 'pending_guardian' as const;
  }
  async admission(verifiedUid: string) {
    return this.run(verifiedUid, verifiedUid, async (tx, link, now) =>
      ({ uid: verifiedUid, status: await this.status(tx, verifiedUid, link, now), policy: ADMISSION_POLICY }));
  }
  /** DB-only callback must use this transaction. External effects require the
   * owning-domain outbox; holding a SQL lock cannot roll back a network send. */
  async withAdmission<T>(verifiedUid: string, operation: (tx: Tx) => Promise<T>): Promise<T> {
    return this.run(verifiedUid, verifiedUid, async (tx, link, now) => {
      if (await this.status(tx, verifiedUid, link, now) !== 'admitted') deny();
      return operation(tx);
    });
  }
  async execute(verifiedActorUid: string, input: unknown) {
    const c = command(input), digest = createHash('sha256').update(JSON.stringify({ actor: verifiedActorUid,
      commandId: c.commandId, subjectUid: c.subjectUid, expectedRevision: c.expectedRevision, operation: c.operation,
      payload: Object.fromEntries(Object.entries(c.payload).sort(([a], [b]) => a.localeCompare(b))) })).digest('hex');
    return this.run(c.subjectUid, verifiedActorUid, async (tx, link, now) => {
      const assurance = await tx.admissionAssurance.findUnique({ where: { uid: c.subjectUid } });
      const isAge = c.operation.startsWith('age.');
      if (isAge) this.reviewer(verifiedActorUid, [c.subjectUid]);
      else if (c.operation === 'link.review') this.reviewer(verifiedActorUid, [c.subjectUid, link?.guardianUid]);
      else if (c.operation === 'link.revoke') {
        if (!link || (verifiedActorUid !== link.guardianUid && !this.reviewers.has(verifiedActorUid))) deny();
      } else if (c.operation === 'link.request') {
        const guardian = await tx.admissionAssurance.findUnique({ where: { uid: verifiedActorUid } });
        if (verifiedActorUid === c.subjectUid || !this.active(guardian, 'adult', now) || !this.active(assurance, 'minor', now)) deny();
      } else if (!link || link.guardianUid !== verifiedActorUid) deny();
      if (c.operation === 'link.review' || c.operation === 'link.confirm') {
        const guardian = link && await tx.admissionAssurance.findUnique({ where: { uid: link.guardianUid } });
        if (!link || link.policy !== ADMISSION_POLICY || !this.active(assurance, 'minor', now) || !this.active(guardian, 'adult', now) ||
            link.minorAssuranceRevision !== assurance.revision || link.guardianAssuranceRevision !== guardian.revision ||
            await tx.deletionTombstone.findFirst({ where: { uid: link.guardianUid, resourceType: 'person' } })) deny();
        if (c.operation === 'link.confirm' && (!this.reviewers.has(link.reviewerUid) || !link.expiresAt || now >= link.expiresAt)) deny();
      }
      const row = isAge ? assurance : link;
      const prior = await tx.commandResult.findUnique({ where: { commandId: c.commandId } });
      // Current reviewer/relationship authority is checked before receipt replay.
      if (prior) {
        if (prior.uid !== c.subjectUid || prior.kind !== 'admission.' + c.operation || prior.payloadDigest !== digest || prior.status !== 'COMMITTED') throw new AdmissionError('conflict');
        if (prior.revision !== row?.revision) throw new AdmissionError('stale_revision');
        return { revision: prior.revision, replayed: true };
      }
      if ((row?.revision ?? 0) !== c.expectedRevision) throw new AdmissionError('stale_revision');
      const revision = c.expectedRevision + 1;
      if (c.operation === 'age.assure') {
        const data = { classification: String(c.payload.classification), reviewerUid: verifiedActorUid, evidenceRef: String(c.payload.evidenceRef),
          policy: ADMISSION_POLICY, issuedAt: now, expiresAt: this.expiry(c, now), revokedAt: null, revision };
        await tx.admissionAssurance.upsert({ where: { uid: c.subjectUid }, create: { uid: c.subjectUid, ...data }, update: data });
      } else if (c.operation === 'age.revoke') {
        if (!assurance || assurance.revokedAt) deny();
        await tx.admissionAssurance.update({ where: { uid: c.subjectUid }, data: { revokedAt: now, revision } });
      } else if (c.operation === 'link.request') {
        if (link && link.state !== 'revoked') throw new AdmissionError('conflict');
        const guardian = await tx.admissionAssurance.findUnique({ where: { uid: verifiedActorUid } });
        const data = { guardianUid: verifiedActorUid, state: 'requested', policy: ADMISSION_POLICY, revision,
          minorAssuranceRevision: assurance.revision, guardianAssuranceRevision: guardian.revision,
          reviewerUid: null, evidenceRef: null, expiresAt: null, confirmedAt: null, revokedAt: null };
        await tx.guardianAdmissionLink.upsert({ where: { minorUid: c.subjectUid }, create: { minorUid: c.subjectUid, ...data }, update: data });
      } else if (c.operation === 'link.revoke') {
        if (link.state === 'revoked') deny();
        await tx.guardianAdmissionLink.update({ where: { minorUid: c.subjectUid }, data: { state: 'revoked', revokedAt: now, revision } });
      } else {
        const guardian = link && await tx.admissionAssurance.findUnique({ where: { uid: link.guardianUid } });
        if (!link || link.policy !== ADMISSION_POLICY || await tx.deletionTombstone.findFirst({ where: { uid: link.guardianUid, resourceType: 'person' } }) ||
            !this.active(assurance, 'minor', now) || !this.active(guardian, 'adult', now) ||
            link.minorAssuranceRevision !== assurance.revision || link.guardianAssuranceRevision !== guardian.revision) deny();
        if (c.operation === 'link.review') {
          if (link.state !== 'requested') deny();
          const expiresAt = this.expiry(c, now);
          if (expiresAt > assurance.expiresAt || expiresAt > guardian.expiresAt) throw new AdmissionError('invalid_command');
          await tx.guardianAdmissionLink.update({ where: { minorUid: c.subjectUid }, data: { state: 'approved', reviewerUid: verifiedActorUid,
            evidenceRef: String(c.payload.evidenceRef), expiresAt, revision } });
        } else {
          if (link.state !== 'approved' || !this.reviewers.has(link.reviewerUid) || !link.expiresAt || now >= link.expiresAt) deny();
          await tx.guardianAdmissionLink.update({ where: { minorUid: c.subjectUid }, data: { state: 'linked', confirmedAt: now, revision } });
        }
      }
      await tx.auditEvent.create({ data: { uid: c.subjectUid, actorUid: verifiedActorUid, actorType: isAge || c.operation === 'link.review' ? 'operator' : 'user',
        operation: 'admission.' + c.operation, resourceType: isAge ? 'admission-assurance' : 'guardian-admission-link', resourceId: c.subjectUid, outcome: 'SUCCESS' } });
      await tx.outboxEvent.create({ data: { uid: c.subjectUid, topic: 'admission.changed', payload: { policy: ADMISSION_POLICY, revision, kind: isAge ? 'assurance' : 'guardian-link' } } });
      await tx.commandResult.create({ data: { uid: c.subjectUid, commandId: c.commandId, kind: 'admission.' + c.operation, payloadDigest: digest,
        // Retain minimal historical review metadata when current assurance is
        // superseded. No raw document/DOB is collected or returned to callers.
        status: 'COMMITTED', revision, resultJson: { revision, policy: ADMISSION_POLICY, actorUid: verifiedActorUid,
          ...(c.operation === 'age.assure' || c.operation === 'link.review' ? { review: {
            evidenceRef: String(c.payload.evidenceRef), expiresAt: String(c.payload.expiresAt),
            ...(c.operation === 'age.assure' ? { classification: String(c.payload.classification) } : {}),
          } } : {}) }, committedAt: now } });
      return { revision, replayed: false };
    });
  }
}
