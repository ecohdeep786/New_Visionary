import { BadRequestException, ConflictException, HttpException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { FieldPath, Firestore } from 'firebase-admin/firestore';
import { createHash, randomUUID } from 'node:crypto';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { accountPath } from '../auth/firebase-product/account-storage';
import { TeachingLoop, TeachingPolicyError, presentTeachingCheck, recordTeachingCheck, startTeachingLoop, teachingLoopState } from './teaching-policy';
import { assessTeachingCheckCommand, cancelLearningSessionCommand, presentTeachingCheckCommand, startLearningSessionCommand } from './learning.contract';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const now = () => new Date().toISOString();
const changed = () => new ConflictException('This learning activity changed on another device or tab. Load the saved activity before continuing.');

// Owner-scoped durable teaching sessions. The server holds authored criteria,
// assesses every answer itself and keeps bounded loop revisions; a browser
// flag, model reply or elapsed time never creates trusted evidence.
@Injectable()
export class LearningService {
  constructor(private readonly accounts: FirebaseProductService) {}
  private sessions(db: Firestore, uid: string) { return db.collection(`${accountPath(uid)}/learningSessions`); }
  private commands(db: Firestore, uid: string) { return db.collection(`${accountPath(uid)}/learningCommands`); }
  private async stored<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); }
    catch (error) {
      if (error instanceof HttpException) throw error;
      if (error instanceof TeachingPolicyError) {
        if (error.code === 'invalid') throw new BadRequestException('This learning command or saved activity is not valid. Load the saved activity and retry.');
        throw new ConflictException('This learning activity changed or belongs to another source revision. Load the saved activity and retry.');
      }
      throw new ServiceUnavailableException('Learning progress could not be confirmed. Your saved work is kept; retry when connected.');
    }
  }
  private replay(data: any, uid: string, kind: string, fingerprint: string) {
    if (!data || data.uid !== uid || data.kind !== kind || data.fingerprint !== fingerprint) throw new ConflictException('This learning command already has different content. Load the saved activity and retry.');
    return data.receipt;
  }
  private projection(data: any, extra: Record<string, unknown> = {}) {
    const loop = data.loop as TeachingLoop;
    return { version: 1, uid: data.uid, sessionId: data.sessionId, workspaceId: data.workspaceId, status: data.status,
      concept: { conceptId: data.concept.conceptId, provider: data.concept.provider, sourceId: data.concept.sourceId,
        sourceVersion: data.concept.sourceVersion, criteriaVersion: data.concept.criteriaVersion },
      phase: loop.phase, revision: loop.revision, failedChecks: loop.failedChecks, maxFailedChecks: loop.maxFailedChecks,
      previousStrategy: loop.previousStrategy, checkPassed: loop.phase === 'check_passed', reviewSuggested: loop.phase === 'review_suggested',
      check: data.check ? { checkId: data.check.checkId, strategy: data.check.strategy, optionCount: data.check.optionCount } : null,
      createdAt: data.createdAt, updatedAt: data.updatedAt, ...(data.cancelledAt ? { cancelledAt: data.cancelledAt } : {}), ...extra };
  }
  private read(data: any, uid: string) {
    if (data.uid !== uid) throw new ServiceUnavailableException('Learning progress is unavailable.');
    try { teachingLoopState(data.loop); }
    catch { throw new ServiceUnavailableException('Learning progress could not be confirmed. Load your saved activity.'); }
    return this.projection(data);
  }
  private active(data: any, uid: string) {
    if (data.uid !== uid) throw new ServiceUnavailableException('Learning progress is unavailable.');
    let loop: TeachingLoop;
    try { loop = teachingLoopState(data.loop); }
    catch { throw new ServiceUnavailableException('Learning progress could not be confirmed. Load your saved activity.'); }
    if (data.status !== 'active') throw new ConflictException('This learning session is closed. Start a new activity or resume another saved activity.');
    return loop;
  }
  private scope(data: any, command: { workspaceId: string; sourceVersion: string; criteriaVersion: string }) {
    if (data.workspaceId !== command.workspaceId || data.concept.sourceVersion !== command.sourceVersion || data.concept.criteriaVersion !== command.criteriaVersion)
      throw new ConflictException('This learning activity belongs to another workspace or source revision. Load the saved activity and retry.');
  }

  async start(uid: string, input: unknown) {
    const command = startLearningSessionCommand(input);
    return this.stored(async () => {
      const db = this.accounts.getDatabase(), fingerprint = digest(JSON.stringify(command));
      const receiptRef = this.commands(db, uid).doc(command.commandId);
      return db.runTransaction(async tx => {
        const previous = await tx.get(receiptRef);
        if (previous.exists) return this.replay(previous.data(), uid, 'start', fingerprint);
        // Explicit identifier: the client and controller validate one opaque UUID shape.
        const sessionId = randomUUID(), sessionRef = this.sessions(db, uid).doc(sessionId), at = now();
        const loop = startTeachingLoop({ uid, workspaceId: command.workspaceId, conceptId: command.conceptId,
          sourceVersion: command.sourceVersion, criteriaVersion: command.criteriaVersion }, sessionId, command.maxFailedChecks);
        const data = { schemaVersion: 1, uid, sessionId, workspaceId: command.workspaceId,
          concept: { conceptId: command.conceptId, provider: command.provider, sourceId: command.sourceId,
            sourceVersion: command.sourceVersion, criteriaVersion: command.criteriaVersion },
          status: 'active', createdAt: at, updatedAt: at, loop, check: null };
        const receipt = this.projection(data);
        tx.create(sessionRef, data);
        tx.set(receiptRef, { uid, commandId: command.commandId, kind: 'start', fingerprint, sessionId, receipt, createdAt: at });
        return receipt;
      });
    });
  }

  async get(uid: string, sessionId: string) {
    return this.stored(async () => {
      const stored = await this.sessions(this.accounts.getDatabase(), uid).doc(sessionId).get();
      if (!stored.exists) throw new NotFoundException('This learning session is unavailable.');
      return this.read(stored.data(), uid);
    });
  }

  async list(uid: string, options: { workspaceId?: string; after?: string; limit?: number }) {
    return this.stored(async () => {
      let query = this.sessions(this.accounts.getDatabase(), uid).orderBy(FieldPath.documentId());
      if (options.workspaceId) query = query.where('workspaceId', '==', options.workspaceId);
      if (options.after) query = query.startAfter(options.after);
      const maximum = options.limit ?? 20;
      const result = await query.limit(maximum + 1).get(), rows = result.docs.slice(0, maximum);
      return { version: 1, uid, items: rows.map(row => this.read(row.data(), uid)),
        nextCursor: result.docs.length > maximum ? rows.at(-1).id : null };
    });
  }

  async present(uid: string, sessionId: string, input: unknown) {
    const command = presentTeachingCheckCommand(input);
    return this.stored(async () => {
      const db = this.accounts.getDatabase(), fingerprint = digest(JSON.stringify(command));
      const receiptRef = this.commands(db, uid).doc(command.commandId);
      const sessionRef = this.sessions(db, uid).doc(sessionId);
      return db.runTransaction(async tx => {
        const previous = await tx.get(receiptRef);
        if (previous.exists) return this.replay(previous.data(), uid, 'present', fingerprint);
        const stored = await tx.get(sessionRef);
        if (!stored.exists) throw new NotFoundException('This learning session is unavailable.');
        const data = stored.data(), loop = this.active(data, uid);
        this.scope(data, command);
        if (command.expectedRevision !== loop.revision) throw changed();
        const next = presentTeachingCheck(loop, { uid, workspaceId: data.workspaceId, conceptId: data.concept.conceptId,
          sourceVersion: data.concept.sourceVersion, criteriaVersion: data.concept.criteriaVersion,
          sessionId, strategy: command.strategy, checkId: command.checkId, validation: 'passed' });
        const at = now();
        const updated = { ...data, loop: next, updatedAt: at,
          check: { checkId: command.checkId, prompt: command.prompt, optionCount: command.options.length, answerIndex: command.answerIndex, strategy: command.strategy } };
        const receipt = this.projection(updated);
        tx.set(sessionRef, updated);
        tx.set(receiptRef, { uid, commandId: command.commandId, kind: 'present', fingerprint, sessionId, receipt, createdAt: at });
        return receipt;
      });
    });
  }

  async assess(uid: string, sessionId: string, input: unknown) {
    const command = assessTeachingCheckCommand(input);
    return this.stored(async () => {
      const db = this.accounts.getDatabase(), fingerprint = digest(JSON.stringify(command));
      const receiptRef = this.commands(db, uid).doc(command.commandId);
      const sessionRef = this.sessions(db, uid).doc(sessionId);
      return db.runTransaction(async tx => {
        const previous = await tx.get(receiptRef);
        if (previous.exists) return this.replay(previous.data(), uid, 'assess', fingerprint);
        const stored = await tx.get(sessionRef);
        if (!stored.exists) throw new NotFoundException('This learning session is unavailable.');
        const data = stored.data(), loop = this.active(data, uid);
        this.scope(data, command);
        if (command.expectedRevision !== loop.revision) throw changed();
        const check = data.check;
        if (loop.phase !== 'check' || !check || check.checkId !== command.checkId)
          throw new ConflictException('This check is no longer awaiting an assessment. Load the saved activity before answering.');
        if (!Number.isSafeInteger(check.optionCount) || check.optionCount < 2 || check.optionCount > 8 ||
          !Number.isSafeInteger(check.answerIndex) || check.answerIndex < 0 || check.answerIndex >= check.optionCount)
          throw new ServiceUnavailableException('The authored check could not be verified. Load the saved activity and retry.');
        if (command.selection >= check.optionCount) throw new BadRequestException('Choose one of the available answers.');
        const passed = command.selection === check.answerIndex;
        const receiptDigest = digest([uid, sessionId, command.checkId, command.selection, passed, loop.revision].join('|'));
        const recorded = recordTeachingCheck(loop, { uid, workspaceId: data.workspaceId, conceptId: data.concept.conceptId,
          sourceVersion: data.concept.sourceVersion, criteriaVersion: data.concept.criteriaVersion,
          sessionId, checkId: command.checkId, id: command.commandId, digest: receiptDigest, origin: 'server_assessment', passed });
        const at = now();
        const updated = { ...data, loop: recorded.loop, updatedAt: at };
        const receipt = this.projection(updated, { receipt: { id: command.commandId, checkId: command.checkId, passed } });
        tx.set(sessionRef, updated);
        tx.create(sessionRef.collection('assessments').doc(command.commandId), { uid, sessionId, checkId: command.checkId,
          strategy: check.strategy, receiptId: command.commandId, digest: receiptDigest, passed, at });
        tx.set(receiptRef, { uid, commandId: command.commandId, kind: 'assess', fingerprint, sessionId, receipt, createdAt: at });
        return receipt;
      });
    });
  }

  async cancel(uid: string, sessionId: string, input: unknown) {
    const command = cancelLearningSessionCommand(input);
    return this.stored(async () => {
      const db = this.accounts.getDatabase(), fingerprint = digest(JSON.stringify(command));
      const receiptRef = this.commands(db, uid).doc(command.commandId);
      const sessionRef = this.sessions(db, uid).doc(sessionId);
      return db.runTransaction(async tx => {
        const previous = await tx.get(receiptRef);
        if (previous.exists) return this.replay(previous.data(), uid, 'cancel', fingerprint);
        const stored = await tx.get(sessionRef);
        if (!stored.exists) throw new NotFoundException('This learning session is unavailable.');
        const data = stored.data();
        if (data.uid !== uid) throw new ServiceUnavailableException('Learning progress is unavailable.');
        let loop: TeachingLoop;
        try { loop = teachingLoopState(data.loop); }
        catch { throw new ServiceUnavailableException('Learning progress could not be confirmed. Load your saved activity.'); }
        this.scope(data, command);
        if (command.expectedRevision !== loop.revision) throw changed();
        const at = now();
        const updated = data.status === 'active' ? { ...data, status: 'cancelled', cancelledAt: at, updatedAt: at } : data;
        const receipt = this.projection(updated);
        if (updated !== data) tx.set(sessionRef, updated);
        tx.set(receiptRef, { uid, commandId: command.commandId, kind: 'cancel', fingerprint, sessionId, receipt, createdAt: at });
        return receipt;
      });
    });
  }
}
