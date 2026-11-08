import { Injectable, HttpException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { freeBillingAccount } from './billing-account';
import { billingDocument } from '../auth/firebase-product/account-storage';
import { modePaths, resolveMode, type BillingMode, type BillingPaths } from './billing-mode';

// All billing record access is mode-scoped (BILL-07 / KAN-108). The repository
// resolves its namespace once and every caller reads through these methods, so
// no code path can open a raw `visionary_billing_*` collection and accidentally
// mix test and live records. `config` is optional purely so pre-existing
// single-argument test constructions keep the historical test namespace; the
// product always injects it.
@Injectable()
export class BillingRepository {
  readonly mode: BillingMode;
  readonly paths: BillingPaths;
  constructor(private readonly auth: FirebaseProductService, config?: ConfigService) {
    this.mode = config ? resolveMode(config) : 'test';
    this.paths = modePaths(this.mode);
  }
  db() { return this.auth.getDatabase(); }
  account(uid: string) { return billingDocument(this.db(), uid, this.mode); }
  queue(uid: string) { return this.db().collection(this.paths.queue).doc(uid); }
  mapping(id: string) { return this.db().collection(this.paths.subscriptions).doc(id); }
  event(id: string) { return this.db().collection(this.paths.events).doc(id); }
  membership(uid: string) { return this.db().collection(this.paths.memberships).doc(uid); }
  invitation(token: string) { return this.db().collection(this.paths.invitations).doc(token); }
  payment(id: string) { return this.db().collection(this.paths.payments).doc(id); }
  receipt(uid: string, id: string) { return this.account(uid).collection('invoices').doc(id); }
  async safely<T>(action: () => Promise<T>): Promise<T> {
    try { return await action(); }
    catch (error) { if (error instanceof HttpException) throw error; throw new ServiceUnavailableException('Billing storage is unavailable. Your saved payment is retained; check its status before paying again.'); }
  }
  transaction<T>(action: (tx: FirebaseFirestore.Transaction) => Promise<T>) { return this.safely(() => this.db().runTransaction(action)); }
  async read(uid: string): Promise<any> {
    return this.safely(async () => {
      const ref = this.account(uid), existing = (await ref.get()).data();
      if ((await this.db().collection('visionary_accounts').doc(uid).get()).data()?.storageMigration?.status === 'copying') throw new ServiceUnavailableException('Your account storage upgrade is in progress.');
      // The legacy pre-migration collection belongs to the test lineage only;
      // in live mode `paths.legacyAccounts` is the (always empty) live name, so
      // a test-lineage legacy account can never block or seed a live account.
      if (!existing && (await this.db().collection(this.paths.legacyAccounts).doc(uid).get()).exists) throw new ServiceUnavailableException('Your saved billing needs its account storage upgrade before continuing.');
      if (existing?.uid === uid && existing.basePlan === 'start') return existing;
      // Backfill older accounts atomically; a simultaneous purchase always wins
      // over the default. Never replace an existing subscription with Free.
      return this.transaction(async tx => {
        const saved = (await tx.get(ref)).data();
        if (saved?.uid && saved.uid !== uid) throw new ServiceUnavailableException('Billing identity could not be verified.');
        const account = saved ? { ...saved, uid, basePlan: 'start', schemaVersion: 1 } : freeBillingAccount(uid, Date.now(), this.mode);
        if (!saved) tx.create(ref, account); else tx.set(ref, account);
        return account;
      });
    });
  }
}
