import { Injectable, HttpException, ServiceUnavailableException } from '@nestjs/common';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { freeBillingAccount } from './billing-account';
import { billingDocument, LEGACY_BILLING_ACCOUNTS, BILLING_QUEUE } from '../auth/firebase-product/account-storage';
import { INVOICE_IMMUTABLE_FIELDS, assertNoInventedLegalFields } from './invoice';

@Injectable()
export class BillingRepository {
  constructor(private readonly auth: FirebaseProductService) {}
  db() { return this.auth.getDatabase(); }
  account(uid: string) { return billingDocument(this.db(), uid); }
  queue(uid: string) { return this.db().collection(BILLING_QUEUE).doc(uid); }
  mapping(id: string) { return this.db().collection('visionary_billing_test_subscriptions').doc(id); }
  event(id: string) { return this.db().collection('visionary_billing_test_events').doc(id); }
  receipt(uid: string, id: string) { return this.account(uid).collection('invoices').doc(id); }
  // BILL-06 (KAN-107): per-payment refund adjustment, written ONCE idempotently
  // under the immutable invoice document it modifies. Never touches the original.
  adjustment(uid: string, invoiceId: string, paymentId: string) {
    return this.receipt(uid, invoiceId).collection('adjustments').doc(paymentId);
  }
  // BILL-06 (KAN-107): pure immutability check, no I/O. A stored invoice document
  // is accepted on rewrite ONLY if every immutable charge fact is unchanged — a
  // mutation is a hard error, never a silent overwrite. Legal-field invention is
  // refused before anything is stored. Callers do all reads, then all writes, in
  // the surrounding transaction (reads-before-writes), matching both the memory
  // double's contract and Firestore best practice.
  assertImmutableInvoice(existing: any, candidate: any) {
    assertNoInventedLegalFields(candidate);
    if (!existing) return;
    for (const key of INVOICE_IMMUTABLE_FIELDS) {
      const a = existing[key], b = candidate[key];
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        throw new ServiceUnavailableException('Invoice records are immutable; the original charge could not be preserved.');
      }
    }
  }
  async safely<T>(action: () => Promise<T>): Promise<T> {
    try { return await action(); }
    catch (error) { if (error instanceof HttpException) throw error; throw new ServiceUnavailableException('Billing storage is unavailable. Your saved payment is retained; check its status before paying again.'); }
  }
  transaction<T>(action: (tx: FirebaseFirestore.Transaction) => Promise<T>) { return this.safely(() => this.db().runTransaction(action)); }
  async read(uid: string): Promise<any> {
    return this.safely(async () => {
      const ref = this.account(uid), existing = (await ref.get()).data();
      if ((await this.db().collection('visionary_accounts').doc(uid).get()).data()?.storageMigration?.status === 'copying') throw new ServiceUnavailableException('Your account storage upgrade is in progress.');
      if (!existing && (await this.db().collection(LEGACY_BILLING_ACCOUNTS).doc(uid).get()).exists) throw new ServiceUnavailableException('Your saved billing needs its account storage upgrade before continuing.');
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
