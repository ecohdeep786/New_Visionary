import { Injectable, HttpException, ServiceUnavailableException } from '@nestjs/common';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { BILLING_ACCOUNTS, freeBillingAccount } from './billing-account';

@Injectable()
export class BillingRepository {
  constructor(private readonly auth: FirebaseProductService) {}
  db() { return this.auth.getDatabase(); }
  account(uid: string) { return this.db().collection(BILLING_ACCOUNTS).doc(uid); }
  mapping(id: string) { return this.db().collection('visionary_billing_test_subscriptions').doc(id); }
  event(id: string) { return this.db().collection('visionary_billing_test_events').doc(id); }
  receipt(uid: string, id: string) { return this.account(uid).collection('invoices').doc(id); }
  async safely<T>(action: () => Promise<T>): Promise<T> {
    try { return await action(); }
    catch (error) { if (error instanceof HttpException) throw error; throw new ServiceUnavailableException('Billing storage is unavailable. Your saved payment is retained; check its status before paying again.'); }
  }
  transaction<T>(action: (tx: FirebaseFirestore.Transaction) => Promise<T>) { return this.safely(() => this.db().runTransaction(action)); }
  async read(uid: string): Promise<any> {
    return this.safely(async () => {
      const ref = this.account(uid), existing = (await ref.get()).data();
      if (existing?.uid === uid && existing.basePlan === 'start') return existing;
      // Backfill older accounts atomically; a simultaneous purchase always wins
      // over the default. Never replace an existing subscription with Free.
      return this.transaction(async tx => {
        const saved = (await tx.get(ref)).data();
        if (saved?.uid && saved.uid !== uid) throw new ServiceUnavailableException('Billing identity could not be verified.');
        const account = saved ? { ...saved, uid, basePlan: 'start', schemaVersion: 1 } : freeBillingAccount(uid);
        if (!saved) tx.create(ref, account); else tx.set(ref, account);
        return account;
      });
    });
  }
}
