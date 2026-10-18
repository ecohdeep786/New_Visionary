import { ConflictException, Injectable, NotFoundException, ServiceUnavailableException, HttpException } from '@nestjs/common';
import { FieldPath } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { accountPath } from '../auth/firebase-product/account-storage';
import { knowledgeEvidence, knowledgeScope } from './knowledge-command';
import { selectCalibratedModel, readCalibration } from './knowledge-calibration';
import { updateKnowledge, sameLearningScope, TeachingPolicyError, AssessedReceipt, KnowledgeProjection } from './teaching-policy';

export const KNOWLEDGE_VERSION = 1;
const scopeKey = (scope: { uid: string; workspaceId: string; conceptId: string; sourceVersion: string; criteriaVersion: string }) =>
  'u' + createHash('sha256').update([scope.workspaceId, scope.conceptId, scope.sourceVersion, scope.criteriaVersion].join('|')).digest('hex').slice(0, 32);
const receiptPath = (uid: string) => `${accountPath(uid)}/knowledge/receipts`;
const projectionPath = (uid: string) => `${accountPath(uid)}/knowledge/projections`;
const outboxPath = (uid: string) => `${accountPath(uid)}/knowledge/outbox`;
function mapTeachingError(error: TeachingPolicyError) {
  if (error.code === 'scope_mismatch') return new ConflictException('The learning evidence scope does not match your account.');
  if (error.code === 'conflict') return new ConflictException('This receipt conflicts with existing assessed evidence.');
  if (error.code === 'rebuild_required') return new ConflictException('Send the calibrated evidenced projection after rebuilt assessment output. Original receipt retained.');
  return new ServiceUnavailableException('Knowledge projection could not be confirmed. Retry with the same receipt.');
}
const serverEvidenceError = () => new ServiceUnavailableException('Knowledge projection is currently unavailable. Retry later.');

@Injectable()
export class KnowledgeProjectionService {
  constructor(private readonly accounts: FirebaseProductService) {}
  private db() { return this.accounts.getDatabase(); }
  private async stored<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); }
    catch (error) { if (error instanceof HttpException) throw error; throw serverEvidenceError(); }
  }
  /** Model selection is server-owned and scoped to source/criteria; returns
   *  durable model / raw material for projection compute. */
  async model(uid: string, sourceVersion: string, criteriaVersion: string) {
    return this.stored(async () => readCalibration().models.find(m => (m.requires.sourceVersion === '*' || m.requires.sourceVersion === sourceVersion) && (m.requires.criteriaVersion === '*' || m.requires.criteriaVersion === criteriaVersion)) || null);
  }
  async submit(uid: string, input: unknown) {
    const evidence = knowledgeEvidence(input);
    const scope = knowledgeScope(uid, evidence);
    return this.stored(async () => {
      const db = this.db(), projectionRef = db.collection(projectionPath(uid)).doc(scopeKey(scope));
      const receiptRef = db.collection(receiptPath(uid)).doc(evidence.commandId);
      const fingerprint = createHash('sha256').update(JSON.stringify(evidence)).update(uid).digest('hex');
      return db.runTransaction(async tx => {
        const existing = (await tx.get(receiptRef)).data();
        if (existing) {
          if (existing.uid !== uid || existing.fingerprint !== fingerprint) throw new ConflictException('This receipt already has different evaluated evidence.');
          const projection = (await tx.get(projectionRef)).data();
          if (!projection) throw new ServiceUnavailableException('Projection continuity data is incomplete for this scope.');
          return this.receipt(uid, projection, { replay: true });
        }
        const saved = (await tx.get(projectionRef)).data();
        const model = selectCalibratedModel(scope);
        const state: KnowledgeProjection = saved && saved.uid === uid ? {
          uid: saved.uid, workspaceId: saved.workspaceId, conceptId: saved.conceptId, sourceVersion: saved.sourceVersion, criteriaVersion: saved.criteriaVersion,
          modelVersion: saved.modelVersion, pKnown: saved.pKnown, revision: saved.revision, lastSequence: saved.lastSequence,
          lastReceiptId: saved.lastReceiptId ?? null, lastReceiptDigest: saved.lastReceiptDigest ?? null, assessedCount: saved.assessedCount,
        } : { ...scope, modelVersion: model.version, pKnown: model.initial, revision: 0, lastSequence: 0, lastReceiptId: null, lastReceiptDigest: null, assessedCount: 0 };
        if (state.lastSequence > 0 || state.revision > 0) { try { sameLearningScope(state, scope); } catch (error: any) { throw new ConflictException(error.message || 'Knowledge evidence scope changed.'); } }
        if (state.modelVersion !== model.version) throw new ConflictException('Knowledge model changed for this source; rebuild required. Original receipt retained.');
        const receipt: AssessedReceipt = { ...scope, id: evidence.commandId, digest: fingerprint.slice(0, 64), sequence: state.lastSequence + 1, correct: evidence.correct, origin: 'server_assessment', assessedAt: evidence.assessedAt };
        let outcome: { projection: KnowledgeProjection; replay: boolean };
        try { outcome = updateKnowledge(state, receipt, model); }
        catch (error) { if (error instanceof TeachingPolicyError) throw mapTeachingError(error); throw error; }
        tx.create(receiptRef, { uid, scope: 'knowledge-receipt', ...receipt, fingerprint, schemaVersion: KNOWLEDGE_VERSION, createdAt: new Date().toISOString() });
        tx.set(projectionRef, { uid, scope: 'knowledge-projection', ...outcome.projection, schemaVersion: KNOWLEDGE_VERSION, updatedAt: new Date().toISOString() });
        const eventId = createHash('sha256').update(uid + '|' + evidence.commandId).digest('hex').slice(0, 32);
        tx.create(db.collection(outboxPath(uid)).doc(eventId), { uid, scope: 'knowledge-outbox', event: 'knowledge_projected', receiptId: evidence.commandId, sequence: receipt.sequence, schemaVersion: KNOWLEDGE_VERSION, createdAt: new Date().toISOString() });
        return this.receipt(uid, outcome.projection, { replay: false });
      });
    });
  }
  async projection(uid: string, options: { workspaceId: string; conceptId: string; sourceVersion: string; criteriaVersion: string }) {
    return this.stored(async () => {
      const scope = knowledgeScope(uid, { version: 1, commandId: '00000000-0000-4000-8000-000000000000', workspaceId: options.workspaceId, conceptId: options.conceptId, sourceVersion: options.sourceVersion, criteriaVersion: options.criteriaVersion, correct: true, assessedAt: 0 });
      const existing = (await this.db().collection(projectionPath(uid)).doc(scopeKey(scope)).get()).data();
      if (!existing) throw new NotFoundException('No assessments are projected for this scope yet.');
      return this.receipt(uid, existing, { replay: false });
    });
  }
  async list(uid: string, after?: string, limit = 20) {
    return this.stored(async () => {
      let query = this.db().collection(projectionPath(uid)).orderBy(FieldPath.documentId());
      if (after) query = query.startAfter(after);
      const rows = await query.limit(limit + 1).get(), items = rows.docs.slice(0, limit);
      return { uid, version: KNOWLEDGE_VERSION, items: items.map(row => this.receipt(uid, row.data(), { replay: false })), nextCursor: rows.docs.length > limit ? items.at(-1).id : null };
    });
  }
  private receipt(uid: string, state: any, outcome: { replay: boolean }) {
    if (!state || state.uid !== uid) throw new ServiceUnavailableException('Knowledge projection records are unavailable for this account.');
    return { version: KNOWLEDGE_VERSION, uid, replay: outcome.replay, modelVersion: state.modelVersion, pKnown: state.pKnown,
      revision: state.revision, lastSequence: state.lastSequence, lastReceiptId: state.lastReceiptId ?? null, lastReceiptDigest: state.lastReceiptDigest ?? null, assessedCount: state.assessedCount };
  }
}
