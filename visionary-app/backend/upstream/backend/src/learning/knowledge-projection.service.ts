import { ConflictException, HttpException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { accountPath } from '../auth/firebase-product/account-storage';
import { boundedReference, knowledgeProjectionCommand, KnowledgeProjectionCommand } from './knowledge-command';
import { selectCalibratedModel } from './knowledge-calibration';
import { updateKnowledge, TeachingPolicyError, AssessedReceipt, KnowledgeProjection, LearningScope } from './teaching-policy';

export const KNOWLEDGE_VERSION = 1;
const scopeKey = (scope: LearningScope) =>
  'u' + createHash('sha256').update([scope.workspaceId, scope.conceptId, scope.sourceVersion, scope.criteriaVersion].join('|')).digest('hex').slice(0, 32);
const eventKey = (uid: string, receiptId: string) => createHash('sha256').update(uid + '|' + receiptId).digest('hex').slice(0, 32);
const unavailable = () => new ServiceUnavailableException('The assessed evidence could not be verified for this account.');
const serverEvidenceError = () => new ServiceUnavailableException('Knowledge projection could not be confirmed from saved evidence. Retry with the same receipt.');
function mapTeachingError(error: TeachingPolicyError) {
  if (error.code === 'scope_mismatch') return new ConflictException('Saved knowledge state does not match this assessed scope. Load the saved activity.');
  if (error.code === 'conflict') return new ConflictException('This assessed receipt conflicts with existing knowledge evidence.');
  if (error.code === 'rebuild_required') return new ConflictException('The knowledge model for this source changed; evidence must replay before continuing. Original receipt retained.');
  return serverEvidenceError();
}

// Owner-scoped knowledge projections. Every estimate is a bounded view over
// immutable server-assessed receipts from the durable learning store: the
// browser references a receipt, never a verdict, digest or timestamp. Receipt,
// projection and outbox commit in one transaction; already-projected evidence
// replays instead of double-counting, and a model change refuses to inherit
// probability until ordered replay. No mastery, teacher contact or escalation
// is inferred from a probability.
@Injectable()
export class KnowledgeProjectionService {
  constructor(private readonly accounts: FirebaseProductService) {}
  private db() { return this.accounts.getDatabase(); }
  private sessions(db: Firestore, uid: string) { return db.collection(`${accountPath(uid)}/learningSessions`); }
  private commands(db: Firestore, uid: string) { return db.collection(`${accountPath(uid)}/knowledge/commands`); }
  private receipts(db: Firestore, uid: string) { return db.collection(`${accountPath(uid)}/knowledge/receipts`); }
  private projections(db: Firestore, uid: string) { return db.collection(`${accountPath(uid)}/knowledge/projections`); }
  private outbox(db: Firestore, uid: string) { return db.collection(`${accountPath(uid)}/knowledge/outbox`); }
  private async stored<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); }
    catch (error) { if (error instanceof HttpException) throw error; throw serverEvidenceError(); }
  }
  private scopeOf(record: any, uid: string): LearningScope {
    if (!record || record.uid !== uid) throw unavailable();
    const scope = { uid, workspaceId: record.workspaceId, conceptId: record.conceptId, sourceVersion: record.sourceVersion, criteriaVersion: record.criteriaVersion };
    if (![scope.workspaceId, scope.conceptId, scope.sourceVersion, scope.criteriaVersion].every(boundedReference)) throw unavailable();
    return scope;
  }
  /** The reviewed evidence source: one session and its immutable assessment
   *  from the owner's durable learning store. The verdict, digest and timestamp
   *  come from that record, never from the command. */
  private assessed(uid: string, command: KnowledgeProjectionCommand, session: any, assessment: any) {
    if (!session || typeof session !== 'object' || session.uid !== uid || session.sessionId !== command.sessionId) throw unavailable();
    const concept = session.concept;
    if (!concept || typeof concept !== 'object') throw unavailable();
    const scope = this.scopeOf({ uid, workspaceId: session.workspaceId, conceptId: concept.conceptId,
      sourceVersion: concept.sourceVersion, criteriaVersion: concept.criteriaVersion }, uid);
    if (!assessment || typeof assessment !== 'object' || assessment.uid !== uid ||
      assessment.sessionId !== command.sessionId || assessment.receiptId !== command.receiptId) throw unavailable();
    if (typeof assessment.passed !== 'boolean' || !boundedReference(assessment.digest)) throw unavailable();
    const assessedAt = Date.parse(assessment.at);
    if (!Number.isSafeInteger(assessedAt) || assessedAt < 0) throw unavailable();
    return { scope, correct: assessment.passed, digest: assessment.digest, assessedAt };
  }
  private receipt(uid: string, state: any, replay: boolean) {
    if (!state || state.uid !== uid) throw unavailable();
    if (![state.workspaceId, state.conceptId, state.sourceVersion, state.criteriaVersion, state.modelVersion].every(boundedReference)) throw unavailable();
    if (typeof state.pKnown !== 'number' || !Number.isFinite(state.pKnown) || state.pKnown < 0 || state.pKnown > 1) throw unavailable();
    if (![state.revision, state.lastSequence, state.assessedCount].every(value => Number.isSafeInteger(value) && value >= 0)) throw unavailable();
    return { version: KNOWLEDGE_VERSION, uid, replay, workspaceId: state.workspaceId, conceptId: state.conceptId,
      sourceVersion: state.sourceVersion, criteriaVersion: state.criteriaVersion, modelVersion: state.modelVersion, pKnown: state.pKnown,
      revision: state.revision, lastSequence: state.lastSequence, lastReceiptId: state.lastReceiptId ?? null,
      lastReceiptDigest: state.lastReceiptDigest ?? null, assessedCount: state.assessedCount };
  }
  /** Server-selected calibrated parameters for the scope. No mastery label is
   *  attached: a probability and its parameters are not an assessed mastery. */
  async model(uid: string, sourceVersion: string, criteriaVersion: string) {
    return this.stored(async () => {
      try { return selectCalibratedModel({ sourceVersion, criteriaVersion }); }
      catch (error) { if (error instanceof TeachingPolicyError) throw mapTeachingError(error); throw error; }
    });
  }
  async project(uid: string, input: unknown) {
    const command = knowledgeProjectionCommand(input);
    return this.stored(async () => {
      const db = this.db();
      const fingerprint = createHash('sha256').update([uid, command.sessionId, command.receiptId].join('|')).digest('hex');
      const commandRef = this.commands(db, uid).doc(command.commandId);
      const evidenceRef = this.receipts(db, uid).doc(command.receiptId);
      return db.runTransaction(async tx => {
        const previousCommand = (await tx.get(commandRef)).data();
        if (previousCommand) {
          if (previousCommand.uid !== uid || previousCommand.kind !== 'knowledge-projected' ||
            previousCommand.fingerprint !== fingerprint || !boundedReference(previousCommand.projectionKey))
            throw new ConflictException('This projection command already has different evidence. Load the saved activity.');
          const projection = (await tx.get(this.projections(db, uid).doc(previousCommand.projectionKey))).data();
          if (!projection) throw new ServiceUnavailableException('Projection continuity data is incomplete for this scope.');
          return this.receipt(uid, projection, true);
        }
        const evidence = (await tx.get(evidenceRef)).data();
        if (evidence) {
          const scope = this.scopeOf(evidence, uid);
          const projection = (await tx.get(this.projections(db, uid).doc(scopeKey(scope)))).data();
          if (!projection) throw new ServiceUnavailableException('Projection continuity data is incomplete for this scope.');
          tx.set(commandRef, { uid, commandId: command.commandId, kind: 'knowledge-projected', fingerprint,
            sessionId: command.sessionId, receiptId: command.receiptId, projectionKey: scopeKey(scope), schemaVersion: KNOWLEDGE_VERSION, createdAt: new Date().toISOString() });
          return this.receipt(uid, projection, true);
        }
        const session = (await tx.get(this.sessions(db, uid).doc(command.sessionId))).data();
        if (!session) throw new NotFoundException('No server-assessed learning session was found for this reference.');
        const assessment = (await tx.get(this.sessions(db, uid).doc(command.sessionId).collection('assessments').doc(command.receiptId))).data();
        if (!assessment) throw new NotFoundException('No server-assessed receipt was found for this reference.');
        const { scope, correct, digest, assessedAt } = this.assessed(uid, command, session, assessment);
        let model; try { model = selectCalibratedModel(scope); }
        catch (error) { if (error instanceof TeachingPolicyError) throw mapTeachingError(error); throw error; }
        const projectionRef = this.projections(db, uid).doc(scopeKey(scope));
        const saved = (await tx.get(projectionRef)).data();
        if (saved && saved.uid !== uid) throw unavailable();
        const state: KnowledgeProjection = saved ? {
          uid: saved.uid, workspaceId: saved.workspaceId, conceptId: saved.conceptId, sourceVersion: saved.sourceVersion, criteriaVersion: saved.criteriaVersion,
          modelVersion: saved.modelVersion, pKnown: saved.pKnown, revision: saved.revision, lastSequence: saved.lastSequence,
          lastReceiptId: saved.lastReceiptId ?? null, lastReceiptDigest: saved.lastReceiptDigest ?? null, assessedCount: saved.assessedCount,
        } : { ...scope, modelVersion: model.version, pKnown: model.initial, revision: 0, lastSequence: 0, lastReceiptId: null, lastReceiptDigest: null, assessedCount: 0 };
        const receipt: AssessedReceipt = { ...scope, id: command.receiptId, digest, sequence: state.lastSequence + 1, correct, origin: 'server_assessment', assessedAt };
        let outcome: { projection: KnowledgeProjection; replay: boolean };
        try { outcome = updateKnowledge(state, receipt, model); }
        catch (error) { if (error instanceof TeachingPolicyError) throw mapTeachingError(error); throw error; }
        const at = new Date().toISOString(), key = scopeKey(scope);
        tx.create(evidenceRef, { uid, scope: 'knowledge-receipt', sessionId: command.sessionId, ...receipt, schemaVersion: KNOWLEDGE_VERSION, createdAt: at });
        tx.set(projectionRef, { uid, scope: 'knowledge-projection', ...outcome.projection, schemaVersion: KNOWLEDGE_VERSION, updatedAt: at });
        tx.create(this.outbox(db, uid).doc(eventKey(uid, command.receiptId)), { uid, scope: 'knowledge-outbox', event: 'knowledge_projected',
          receiptId: command.receiptId, sequence: receipt.sequence, modelVersion: model.version, schemaVersion: KNOWLEDGE_VERSION, createdAt: at });
        tx.set(commandRef, { uid, commandId: command.commandId, kind: 'knowledge-projected', fingerprint,
          sessionId: command.sessionId, receiptId: command.receiptId, projectionKey: key, schemaVersion: KNOWLEDGE_VERSION, createdAt: at });
        return this.receipt(uid, outcome.projection, false);
      });
    });
  }
  async projection(uid: string, options: { workspaceId: string; conceptId: string; sourceVersion: string; criteriaVersion: string }) {
    return this.stored(async () => {
      const existing = (await this.projections(this.db(), uid).doc(scopeKey({ uid, ...options })).get()).data();
      if (!existing) throw new NotFoundException('No assessments are projected for this scope yet.');
      return this.receipt(uid, existing, false);
    });
  }
}
