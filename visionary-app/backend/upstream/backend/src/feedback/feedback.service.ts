import { ConflictException, HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { FieldPath } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { accountPath } from '../auth/firebase-product/account-storage';
import { feedbackCommand } from './feedback.contract';

// Account-level product feedback. Never a source of workspace permissions or training consent.
@Injectable()
export class FeedbackService {
  constructor(private readonly accounts: FirebaseProductService) {}
  private async stored<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); }
    catch (error) { if (error instanceof HttpException) throw error; throw new ServiceUnavailableException('Feedback could not be confirmed. Keep your note and retry.'); }
  }
  async submit(uid: string, input: unknown) {
    const command = feedbackCommand(input);
    return this.stored(async () => {
      const db = this.accounts.getDatabase();
      const ref = db.collection(`${accountPath(uid)}/feedback`).doc(command.commandId);
      const limiter = db.collection(`${accountPath(uid)}/feedbackState`).doc('admission');
      const fingerprint = createHash('sha256').update(JSON.stringify(command)).digest('hex');
      return db.runTransaction(async tx => {
        const previous = await tx.get(ref);
        if (previous.exists) {
          const data = previous.data();
          if (data.uid !== uid || data.fingerprint !== fingerprint) throw new ConflictException('This feedback request already has different content.');
          return this.receipt(ref.id, data);
        }
        const now = Date.now(), hour = Math.floor(now / 3600000);
        const admission = (await tx.get(limiter)).data();
        const count = admission?.hour === hour ? admission.count : 0;
        if (!Number.isSafeInteger(count) || count < 0) throw new ServiceUnavailableException('Feedback admission is unavailable. Keep your note and retry.');
        if (count >= 10) throw new HttpException('You have sent several notes. Please try again in an hour.', 429);
        const data = { ...command, uid, fingerprint, status: 'submitted', createdAt: new Date(now).toISOString() };
        tx.create(ref, data);
        tx.set(limiter, { uid, hour, count: count + 1 });
        return this.receipt(ref.id, data);
      });
    });
  }
  private receipt(id: string, data: any) { return { version: 1, uid: data.uid, id, status: data.status, createdAt: data.createdAt }; }
  async list(uid: string, after?: string, limit = 20) {
    return this.stored(async () => {
      let query = this.accounts.getDatabase().collection(`${accountPath(uid)}/feedback`).orderBy(FieldPath.documentId());
      if (after) query = query.startAfter(after);
      const result = await query.limit(limit + 1).get(), rows = result.docs.slice(0, limit);
      return { version: 1, uid, items: rows.map(row => {
        const data = row.data();
        if (data.uid !== uid) throw new ServiceUnavailableException('Feedback records are unavailable.');
        return { ...this.receipt(row.id, data), surface: data.surface, rating: data.rating, comment: data.comment, locale: data.locale };
      }), nextCursor: result.docs.length > limit ? rows.at(-1).id : null };
    });
  }
}
