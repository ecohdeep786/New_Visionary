import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { BILLING_PLANS, CATALOG_VERSION, externalId, offer, recordInput } from './catalog';
import { BillingRepository } from './billing.repository';
import { freeBillingAccount } from './billing-account';
import { invoiceDocument } from './invoice';
import { BILLING_QUEUE, LEGACY_BILLING_ACCOUNTS } from '../auth/firebase-product/account-storage';
import { PaymentProviderError, RazorpayProvider, validSignature } from './razorpay.provider';

const terminal = new Set(['cancelled', 'completed', 'expired']);
const statuses = new Set(['created', 'authenticated', 'active', 'pending', 'halted', 'paused', ...terminal]);
const fingerprint = (value: string) => createHash('sha256').update(value).digest('hex');
const seconds = () => Math.floor(Date.now() / 1000);
const iso = (value: number) => value > 0 ? new Date(value * 1000).toISOString() : null;

@Injectable()
export class BillingService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private running = false;
  private stopping = false;
  constructor(private readonly repo: BillingRepository, private readonly provider: RazorpayProvider, private readonly auth: FirebaseProductService) {}
  catalog() {
    this.provider.settings();
    return { mode: 'test', version: CATALOG_VERSION, currency: 'INR', taxNote: 'Test prices only. No real money is collected. Live tax invoices are not enabled.', plans: BILLING_PLANS, maximumYears: 10 };
  }
  private async payer(uid: string) {
    const profile = await this.auth.me(uid);
    if (!profile.onboarding_complete || profile.age_band !== 'adult') throw new ForbiddenException('Finish adult account setup before managing payments.');
    return profile;
  }
  private async update(uid: string, change: (current: any, tx: FirebaseFirestore.Transaction) => any) {
    return this.repo.transaction(async tx => {
      const ref = this.repo.account(uid), snapshot = await tx.get(ref);
      const account = await tx.get(this.repo.db().collection('visionary_accounts').doc(uid));
      const legacy = !snapshot.exists ? await tx.get(this.repo.db().collection(LEGACY_BILLING_ACCOUNTS).doc(uid)) : null;
      if (legacy?.exists || account.data()?.storageMigration?.status === 'copying') throw new ServiceUnavailableException('Your saved account storage upgrade must finish before payment.');
      const current: any = snapshot.data() || freeBillingAccount(uid);
      if (current.uid && current.uid !== uid) throw new ServiceUnavailableException('Billing identity could not be verified.');
      const next = await change(current, tx);
      if (!next) return current;
      const saved = { ...next, uid, basePlan: 'start', schemaVersion: 1, revision: current.revision + 1, updatedAt: Date.now() };
      tx.set(ref, saved);
      // Global operational index; account data remains under the verified UID.
      tx.set(this.repo.queue(uid), { uid, nextSyncAt: saved.nextSyncAt || null, revision: saved.revision });
      return saved;
    });
  }
  private view(uid: string, data: any) {
    const sub = data.subscription;
    const paid = sub?.paidThrough > seconds() && sub?.paidFrom <= seconds();
    return {
      uid, mode: 'test', revision: data.revision, asOf: new Date().toISOString(), lastSyncedAt: data.lastSyncedAt || null,
      plan: paid ? sub.plan : 'start', entitlement: { plan: paid ? sub.plan : 'start', validUntil: paid ? iso(sub.paidThrough) : null, source: paid ? 'personal-subscription' : 'free' },
      subscription: sub ? { id: sub.id, plan: sub.plan, interval: sub.interval, amount: sub.amount, currency: 'INR', status: sub.status, paidThrough: iso(sub.paidThrough), periodStart: iso(sub.periodStart), periodEnd: iso(sub.periodEnd), cancelAtPeriodEnd: !!sub.cancelAtPeriodEnd, renewalAt: sub.cancelAtPeriodEnd || terminal.has(sub.status) ? null : iso(sub.chargeAt), paymentMethod: sub.paymentMethod || null } : null,
      pending: data.attempt && !['ended', 'failed'].includes(data.attempt.state) && !paid ? { id: data.attempt.id, plan: data.attempt.plan, interval: data.attempt.interval, state: data.attempt.state, subscriptionId: data.attempt.subscriptionId || null, recoverable: !!data.attempt.subscriptionId && ['created', 'authenticated'].includes(sub?.status) } : null,
      invoices: data.invoices || [], syncPending: !!data.syncLease && data.syncLease.until > Date.now(), cancellationPending: !!data.cancelRequested,
    };
  }
  async account(uid: string) {
    const data = await this.repo.read(uid);
    const own = this.view(uid, data);
    const membership = await this.repo.safely(async () => (await this.repo.db().collection('visionary_billing_test_memberships').doc(uid).get()).data());
    if (membership?.owner && membership.owner !== uid) {
      const owner = this.view(membership.owner, await this.repo.read(membership.owner));
      if (owner.plan === 'family') { own.plan = 'family'; own.entitlement = { ...owner.entitlement, source: 'family-membership' }; }
      return { ...own, family: { owner: false, member: true, active: owner.plan === 'family' } };
    }
    return { ...own, family: { owner: data.subscription?.plan === 'family', member: false, members: (data.familyMembers || []).map(row => ({ uid: row.uid, email: row.email, joinedAt: row.joinedAt })), invitations: (data.familyInvitations || []).filter(row => row.expiresAt > Date.now()).map(row => ({ id: row.id, email: row.email, expiresAt: row.expiresAt })) } };
  }
  private checkoutView(data: any) {
    const attempt = data.attempt;
    if (!attempt?.subscriptionId) throw new ConflictException('This payment is being reconciled. Refresh its status before starting another checkout.');
    return { attemptId: attempt.id, subscriptionId: attempt.subscriptionId, keyId: this.provider.settings().keyId, mode: 'test', offer: offer(attempt.plan, attempt.interval) };
  }
  async checkout(uid: string, input: unknown) {
    const payer = await this.payer(uid); this.provider.settings();
    const body = recordInput(input, ['plan', 'interval', 'commandId', 'catalogVersion']);
    const selected = offer(body.plan, body.interval), providerPlan = this.provider.planId(selected);
    if (body.catalogVersion !== CATALOG_VERSION) throw new ConflictException('Pricing changed. Review the latest price before continuing.');
    if (typeof body.commandId !== 'string' || !/^[a-f0-9-]{36}$/.test(body.commandId)) throw new BadRequestException('A payment command identifier is required.');
    const id = randomUUID(), now = Date.now();
    const data = await this.update(uid, async (current, tx) => {
      const commandRef = this.repo.account(uid).collection('commands').doc(body.commandId);
      const previousCommand = (await tx.get(commandRef)).data();
      const membership = await tx.get(this.repo.db().collection('visionary_billing_test_memberships').doc(uid));
      if (membership.exists) throw new ConflictException('Leave your billing family before purchasing another subscription.');
      if (previousCommand && (previousCommand.plan !== body.plan || previousCommand.interval !== body.interval || previousCommand.attemptId !== current.attempt?.id || ['ended', 'failed', 'succeeded'].includes(current.attempt?.state))) throw new ConflictException('This checkout request was already completed or closed. Refresh billing before choosing a new payment.');
      if (current.attempt?.commandId === body.commandId && (current.attempt.plan !== body.plan || current.attempt.interval !== body.interval)) throw new ConflictException('This checkout request was already used for another plan.');
      const sub = current.subscription;
      if (sub && (!terminal.has(sub.status) || sub.paidThrough > seconds())) {
        if (current.attempt?.subscriptionId === sub.id && ['created', 'authenticated'].includes(sub.status) && current.attempt.plan === body.plan && current.attempt.interval === body.interval) return null;
        throw new ConflictException('You already have a subscription or unfinished payment. Review it before starting another.');
      }
      if (current.attempt && ['creating', 'reconciling', 'awaiting_customer'].includes(current.attempt.state)) {
        if (current.attempt.plan !== body.plan || current.attempt.interval !== body.interval) throw new ConflictException('Resolve your unfinished checkout before choosing another plan.');
        return null;
      }
      tx.create(commandRef, { uid, attemptId: id, plan: body.plan, interval: body.interval, createdAt: now });
      return { ...current, attempt: { id, commandId: body.commandId, ...selected, providerPlan, billedTo: { name: payer.full_name, email: payer.email }, state: 'creating', createdAt: now }, nextSyncAt: now };
    });
    if (data.attempt.id !== id) {
      if (!data.attempt.subscriptionId) await this.recoverCreation(uid, data);
      return this.checkoutView(await this.repo.read(uid));
    }
    let created: any;
    try {
      created = await this.provider.request('POST', 'subscriptions', { plan_id: providerPlan, quantity: 1, total_count: selected.interval === 'annual' ? 10 : 120, customer_notify: false, notes: { visionary_attempt: id, visionary_catalog: CATALOG_VERSION }, expire_by: seconds() + 86400 });
      externalId(created.id, 'sub');
      if (created.plan_id !== providerPlan) throw new PaymentProviderError(true);
    } catch (error) {
      await this.update(uid, current => current.attempt?.id === id ? { ...current, attempt: { ...current.attempt, state: error instanceof PaymentProviderError && !error.ambiguous ? 'failed' : 'reconciling' } } : null);
      throw error;
    }
    await this.attachSubscription(uid, id, created);
    return this.checkoutView(await this.repo.read(uid));
  }
  private async attachSubscription(uid: string, attemptId: string, sub: any) {
    const merchant = fingerprint(this.provider.settings().keyId);
    await this.update(uid, (current, tx) => {
      if (current.attempt?.id !== attemptId || current.attempt.providerPlan !== sub.plan_id) throw new ConflictException('The saved payment changed. Refresh billing.');
      if (current.attempt.subscriptionId && current.attempt.subscriptionId !== sub.id) throw new ConflictException('This payment needs reconciliation.');
      tx.set(this.repo.mapping(sub.id), { uid, attemptId, merchant });
      return { ...current, attempt: { ...current.attempt, subscriptionId: sub.id, state: 'awaiting_customer' }, subscription: { id: sub.id, plan: current.attempt.plan, interval: current.attempt.interval, amount: current.attempt.amount, billedTo: current.attempt.billedTo, providerPlan: sub.plan_id, status: sub.status || 'created', paidFrom: 0, paidThrough: 0, periodStart: 0, periodEnd: 0, chargeAt: 0, cancelAtPeriodEnd: false }, nextSyncAt: Date.now() };
    });
  }
  private async recoverCreation(uid: string, data: any) {
    if (!data.attempt || data.attempt.subscriptionId) return;
    if (Date.now() - data.attempt.createdAt < 30000) throw new ConflictException('Your checkout is still being prepared. Refresh in a moment.');
    // Bound lookup to the creation window. Never repeat a non-idempotent POST.
    const result = await this.provider.request('GET', `subscriptions?from=${Math.floor(data.attempt.createdAt / 1000) - 5}&count=100`);
    const matching = result.items?.filter(item => item.notes?.visionary_attempt === data.attempt.id) || [];
    if (matching.length === 1) return this.attachSubscription(uid, data.attempt.id, matching[0]);
    throw new ConflictException('Razorpay has not resolved the earlier checkout. No second subscription was created. Contact support with the saved attempt reference.');
  }
  async verify(uid: string, input: unknown) {
    const body = recordInput(input, ['attemptId', 'razorpay_payment_id', 'razorpay_subscription_id', 'razorpay_signature']);
    const data = await this.repo.read(uid), attempt = data.attempt;
    if (!attempt?.subscriptionId || attempt.id !== body.attemptId || body.razorpay_subscription_id !== attempt.subscriptionId) throw new ConflictException('This checkout belongs to a different saved payment.');
    const paymentId = externalId(body.razorpay_payment_id, 'pay');
    if (!validSignature(`${paymentId}|${attempt.subscriptionId}`, body.razorpay_signature, this.provider.settings().secret)) throw new ForbiddenException('The payment signature could not be verified.');
    // Signature authenticates the callback, not a paid service period.
    await this.sync(uid, true);
    return this.account(uid);
  }
  async sync(uid: string, force = false) {
    let data = await this.repo.read(uid);
    if (data.attempt && !data.attempt.subscriptionId && ['creating', 'reconciling'].includes(data.attempt.state)) {
      await this.recoverCreation(uid, data); data = await this.repo.read(uid);
    }
    if (!data.subscription?.id) return this.account(uid);
    if (!force && data.lastSyncedAt && Date.now() - data.lastSyncedAt < 30000) return this.account(uid);
    const lease = randomUUID(), subId = data.subscription.id;
    const claimed = await this.update(uid, current => {
      if (current.subscription?.id !== subId || current.syncLease?.until > Date.now() || current.commandLease?.until > Date.now()) return null;
      return { ...current, syncLease: { id: lease, until: Date.now() + 180000 }, nextSyncAt: Date.now() + 180000 };
    });
    if (claimed.syncLease?.id !== lease) return this.account(uid);
    try {
      const deadline = Date.now() + 120000;
      const withinBudget = () => { if (Date.now() > deadline) throw new ServiceUnavailableException('Payment reconciliation will continue in the next batch.'); };
      const sub = await this.provider.getSubscription(subId);
      if (sub.id !== subId || sub.plan_id !== claimed.subscription.providerPlan || !statuses.has(sub.status) || sub.quantity !== 1) throw new ServiceUnavailableException('Razorpay returned an unexpected subscription. Access has not changed.');
      const invoiceResult = await this.provider.invoices(subId);
      if (!Array.isArray(invoiceResult.items)) throw new ServiceUnavailableException('Razorpay invoice confirmation is unavailable.');
      const receipts = [], candidates = invoiceResult.items.filter(inv => inv.subscription_id === subId && inv.status === 'paid');
      let paidThrough = 0, paidFrom = 0;
      for (const invoice of candidates) {
        withinBudget();
        if (invoice.currency !== 'INR' || invoice.amount !== claimed.subscription.amount || invoice.amount_paid !== invoice.amount || !Number.isInteger(invoice.billing_start) || !Number.isInteger(invoice.billing_end) || invoice.billing_end <= invoice.billing_start || !/^pay_[A-Za-z0-9]+$/.test(invoice.payment_id) || !/^inv_[A-Za-z0-9]+$/.test(invoice.id)) continue;
        const retained = (claimed.invoices || []).find(row => row.id === invoice.id);
        let refund = Number(retained?.amountRefunded || 0), paymentState = retained?.status === 'processing' ? 'unconfirmed' : 'captured';
        if (invoice.billing_end > seconds()) {
          const payment = await this.provider.payment(invoice.payment_id);
          if (payment.invoice_id !== invoice.id || payment.id !== invoice.payment_id || payment.amount !== invoice.amount || payment.currency !== 'INR' || payment.status !== 'captured' || payment.captured !== true) { paymentState = 'unconfirmed'; }
          refund = Number(payment.amount_refunded || 0);
          if (!Number.isInteger(refund) || refund < 0 || refund > invoice.amount) paymentState = 'unconfirmed';
          if (paymentState === 'captured' && refund < invoice.amount && invoice.billing_start <= seconds() && invoice.billing_end > paidThrough) { paidFrom = invoice.billing_start; paidThrough = invoice.billing_end; }
        }
        receipts.push(invoiceDocument(uid, { id: invoice.id, number: `VTEST-${invoice.id.slice(4)}`, mode: 'test', plan: claimed.subscription.plan, interval: claimed.subscription.interval, amount: invoice.amount, billedTo: claimed.subscription.billedTo, currency: 'INR', issuedAt: iso(invoice.issued_at || invoice.date || invoice.paid_at), paidAt: iso(invoice.paid_at), periodStart: iso(invoice.billing_start), periodEnd: iso(invoice.billing_end), subscriptionId: subId, paymentId: invoice.payment_id, status: refund >= invoice.amount ? 'refunded' : refund > 0 ? 'partially_refunded' : paymentState === 'captured' ? 'paid' : 'processing', amountRefunded: refund }));
      }
      const adjustments = (claimed.paymentAdjustments || []).slice(0, 10);
      for (const paymentId of adjustments) {
        withinBudget();
        const mapping = await this.repo.safely(async () => (await this.repo.db().collection('visionary_billing_test_payments').doc(paymentId).get()).data());
        if (!mapping || mapping.uid !== uid) continue;
        const original = await this.repo.safely(async () => (await this.repo.receipt(uid, mapping.invoiceId).get()).data());
        if (!original) continue;
        const payment = await this.provider.payment(paymentId);
        if (payment.id !== paymentId || payment.invoice_id !== original.id || payment.amount !== original.amount || payment.currency !== original.currency || !Number.isInteger(payment.amount_refunded || 0) || payment.amount_refunded < 0 || payment.amount_refunded > original.amount) throw new ServiceUnavailableException('A payment adjustment could not be confirmed.');
        const refunded = payment.amount_refunded || 0;
        receipts.push({ ...original, amountRefunded: refunded, status: refunded >= original.amount ? 'refunded' : refunded > 0 ? 'partially_refunded' : original.status });
      }
      await this.update(uid, (current, tx) => {
        if (current.syncLease?.id !== lease || current.subscription?.id !== subId) return null;
        const history = new Map((current.invoices || []).map(row => [row.id, row]));
        for (const receipt of receipts) { history.set(receipt.id, receipt); tx.set(this.repo.receipt(uid, receipt.id), { ...receipt, uid }); tx.set(this.repo.db().collection('visionary_billing_test_payments').doc(receipt.paymentId), { uid, invoiceId: receipt.id, subscriptionId: receipt.subscriptionId, merchant: fingerprint(this.provider.settings().keyId) }); }
        current.paymentAdjustments = (current.paymentAdjustments || []).filter(id => !adjustments.includes(id));
        if (terminal.has(sub.status)) current.cancelRequested = false;
        return { ...current, subscription: { ...current.subscription, status: sub.status, periodStart: sub.current_start || 0, periodEnd: sub.current_end || 0, chargeAt: sub.charge_at || 0, paidFrom, paidThrough, paymentMethod: sub.payment_method || null }, attempt: current.attempt?.subscriptionId === subId ? { ...current.attempt, state: paidThrough > seconds() ? 'succeeded' : terminal.has(sub.status) ? 'ended' : 'processing' } : current.attempt, invoices: [...history.values()].sort((a: any, b: any) => String(b.paidAt).localeCompare(String(a.paidAt))).slice(0, 50), lastSyncedAt: Date.now(), syncLease: null, nextSyncAt: terminal.has(sub.status) && !paidThrough ? Date.now() + 86400000 : Date.now() + 60000 };
      });
    } catch (error) {
      await this.update(uid, current => current.syncLease?.id === lease ? { ...current, syncLease: null, nextSyncAt: Date.now() + 60000 } : null);
      throw error;
    }
    return this.account(uid);
  }
  async cancel(uid: string, input: unknown) {
    await this.payer(uid);
    const body = recordInput(input, ['subscriptionId', 'revision']);
    const data = await this.repo.read(uid), id = externalId(body.subscriptionId, 'sub');
    if (data.subscription?.id !== id) throw new NotFoundException('This subscription is unavailable.');
    if (data.subscription.cancelAtPeriodEnd || terminal.has(data.subscription.status)) return this.account(uid);
    if (body.revision !== data.revision) throw new ConflictException('Your billing changed on another device. Refresh before cancelling.');
    const lease = randomUUID();
    const locked = await this.update(uid, current => {
      if (current.revision !== body.revision || current.syncLease?.until > Date.now() || current.commandLease?.until > Date.now()) throw new ConflictException('Another billing change is in progress. Refresh before continuing.');
      return { ...current, commandLease: { id: lease, until: Date.now() + 30000 }, cancelRequested: true };
    });
    try {
      const pending = ['created', 'authenticated'].includes(locked.subscription.status) && !locked.subscription.paidThrough;
      const result = await this.provider.request('POST', `subscriptions/${id}/cancel`, { cancel_at_cycle_end: !pending });
      if (result.id !== id || !statuses.has(result.status)) throw new PaymentProviderError(true);
      await this.update(uid, current => current.commandLease?.id === lease ? { ...current, commandLease: null, cancelRequested: false, subscription: { ...current.subscription, cancelAtPeriodEnd: !pending, status: result.status }, attempt: pending ? { ...current.attempt, state: 'ended' } : current.attempt, nextSyncAt: Date.now() } : null);
    } catch (error) {
      // Keep the unknown command visible; reconciliation cannot assert a rollback.
      await this.update(uid, current => current.commandLease?.id === lease ? { ...current, commandLease: null, cancelRequested: true, nextSyncAt: Date.now() } : null);
      throw error;
    }
    return this.account(uid);
  }
  async invoice(uid: string, id: string) {
    externalId(id, 'inv');
    const row = await this.repo.safely(async () => (await this.repo.receipt(uid, id).get()).data());
    if (!row || row.uid !== uid) throw new NotFoundException('This invoice is unavailable for your account.');
    return row;
  }
  async inviteFamily(uid: string, input: unknown) {
    await this.payer(uid);
    const body = recordInput(input, ['email']);
    if (typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) throw new BadRequestException('Enter the member’s account email address.');
    const email = body.email.trim().toLowerCase(), profile = await this.auth.me(uid);
    if (email === profile.email.toLowerCase()) throw new BadRequestException('Your account already occupies the owner seat.');
    const token = randomUUID(), invitation = { id: token, email, expiresAt: Date.now() + 7 * 86400000 };
    await this.update(uid, (current, tx) => {
      if (this.view(uid, current).plan !== 'family') throw new ForbiddenException('An active Family subscription is required.');
      const pending = (current.familyInvitations || []).filter(row => row.expiresAt > Date.now());
      if (pending.some(row => row.email === email) || (current.familyMembers || []).some(row => row.email === email)) throw new ConflictException('This member already has a seat or pending invitation.');
      if ((current.familyMembers?.length || 0) + pending.length >= 5) throw new ConflictException('All six Family places are reserved, including yours. Remove a member or pending invitation first.');
      tx.create(this.repo.db().collection('visionary_billing_test_invitations').doc(token), { ...invitation, owner: uid, ownerName: profile.full_name, status: 'pending' });
      return { ...current, familyInvitations: [...pending, invitation] };
    });
    return { ...invitation, path: `/dashboard/subscription?invite=${token}` };
  }
  async familyInvitation(uid: string, token: string) {
    if (!/^[a-f0-9-]{36}$/.test(token)) throw new NotFoundException('This invitation is unavailable.');
    const profile = await this.payer(uid), row = await this.repo.safely(async () => (await this.repo.db().collection('visionary_billing_test_invitations').doc(token).get()).data());
    if (!row || row.status !== 'pending' || row.expiresAt <= Date.now() || row.email !== profile.email.toLowerCase()) throw new NotFoundException('This invitation is expired, unavailable, or addressed to another account.');
    return { id: token, ownerName: row.ownerName, expiresAt: row.expiresAt };
  }
  async acceptFamily(uid: string, input: unknown) {
    const body = recordInput(input, ['invitationId']);
    await this.familyInvitation(uid, body.invitationId);
    await this.repo.transaction(async tx => {
      const inviteRef = this.repo.db().collection('visionary_billing_test_invitations').doc(body.invitationId), invite = (await tx.get(inviteRef)).data();
      if (invite.status !== 'pending' || invite.expiresAt <= Date.now()) throw new ConflictException('This invitation is no longer available.');
      const ownerRef = this.repo.account(invite.owner), owner: any = (await tx.get(ownerRef)).data(), own: any = (await tx.get(this.repo.account(uid))).data();
      const memberRef = this.repo.db().collection('visionary_billing_test_memberships').doc(uid), member = await tx.get(memberRef);
      if (invite.owner === uid || member.exists || (own?.subscription && (!terminal.has(own.subscription.status) || own.subscription.paidThrough > seconds())) || (own?.attempt && ['creating', 'reconciling'].includes(own.attempt.state))) throw new ConflictException('Resolve your existing subscription or billing family before joining.');
      if (!owner || this.view(invite.owner, owner).plan !== 'family' || (owner.familyMembers?.length || 0) >= 5 || !owner.familyInvitations?.some(row => row.id === body.invitationId)) throw new ConflictException('A Family place is no longer available.');
      tx.set(memberRef, { owner: invite.owner, joinedAt: Date.now() });
      tx.update(inviteRef, { status: 'accepted', beneficiary: uid });
      tx.update(ownerRef, { revision: owner.revision + 1, familyMembers: [...(owner.familyMembers || []), { uid, email: invite.email, joinedAt: Date.now() }], familyInvitations: owner.familyInvitations.filter(row => row.id !== body.invitationId) });
    });
    return this.account(uid);
  }
  async removeFamily(uid: string, input: unknown) {
    const body = recordInput(input, ['memberUid', 'invitationId']);
    if ((!body.memberUid && !body.invitationId) || body.memberUid && body.invitationId || body.memberUid === uid) throw new BadRequestException('Choose one member or invitation to remove.');
    await this.repo.transaction(async tx => {
      const ownerRef = this.repo.account(uid), owner: any = (await tx.get(ownerRef)).data();
      if (!owner || owner.subscription?.plan !== 'family') throw new ForbiddenException('Only the Family billing owner can manage places.');
      if (body.memberUid) {
        if (!owner.familyMembers?.some(row => row.uid === body.memberUid)) throw new NotFoundException('This member is unavailable.');
        const ref = this.repo.db().collection('visionary_billing_test_memberships').doc(body.memberUid), membership = await tx.get(ref);
        if (membership.data()?.owner !== uid) throw new ConflictException('This membership changed. Refresh billing.');
        tx.delete(ref); tx.update(ownerRef, { revision: owner.revision + 1, familyMembers: owner.familyMembers.filter(row => row.uid !== body.memberUid) });
      } else {
        if (!owner.familyInvitations?.some(row => row.id === body.invitationId)) throw new NotFoundException('This invitation is unavailable.');
        tx.update(this.repo.db().collection('visionary_billing_test_invitations').doc(body.invitationId), { status: 'revoked' });
        tx.update(ownerRef, { revision: owner.revision + 1, familyInvitations: owner.familyInvitations.filter(row => row.id !== body.invitationId) });
      }
    });
    return this.account(uid);
  }
  async leaveFamily(uid: string) {
    await this.repo.transaction(async tx => {
      const ref = this.repo.db().collection('visionary_billing_test_memberships').doc(uid), member = (await tx.get(ref)).data();
      if (!member) return;
      const ownerRef = this.repo.account(member.owner), owner: any = (await tx.get(ownerRef)).data();
      tx.delete(ref);
      if (owner) tx.update(ownerRef, { revision: owner.revision + 1, familyMembers: (owner.familyMembers || []).filter(row => row.uid !== uid) });
    });
    return this.account(uid);
  }
  async webhook(raw: Buffer, signature: string, eventId: string) {
    const settings = this.provider.settings();
    if (!Buffer.isBuffer(raw) || !validSignature(raw, signature, settings.webhookSecret)) throw new ForbiddenException('Invalid payment notification signature.');
    if (typeof eventId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(eventId)) throw new BadRequestException('Missing payment event identity.');
    let payload: any;
    try { payload = JSON.parse(raw.toString('utf8')); } catch { throw new BadRequestException('Invalid payment notification.'); }
    let subscriptionId = payload.payload?.subscription?.entity?.id || payload.payload?.invoice?.entity?.subscription_id || payload.payload?.payment?.entity?.subscription_id;
    const paymentId = payload.payload?.payment?.entity?.id || payload.payload?.refund?.entity?.payment_id || payload.payload?.dispute?.entity?.payment_id;
    const digest = fingerprint(raw.toString('utf8')), key = fingerprint(`${settings.keyId}:${eventId}`);
    let mapping = subscriptionId && /^sub_[A-Za-z0-9]+$/.test(subscriptionId) ? await this.repo.safely(async () => (await this.repo.mapping(subscriptionId).get()).data()) : null;
    if (!mapping && /^pay_[A-Za-z0-9]+$/.test(paymentId || '')) {
      mapping = await this.repo.safely(async () => (await this.repo.db().collection('visionary_billing_test_payments').doc(paymentId).get()).data());
      subscriptionId = mapping?.subscriptionId;
    }
    await this.repo.transaction(async tx => {
      const event = this.repo.event(key), existing = await tx.get(event);
      if (existing.exists) { if (existing.data().digest !== digest) throw new ConflictException('Payment event identity conflict.'); return; }
      const account = mapping?.merchant === fingerprint(settings.keyId) ? this.repo.account(mapping.uid) : null;
      const saved = account ? await tx.get(account) : null;
      const owner = account ? await tx.get(this.repo.db().collection('visionary_accounts').doc(mapping.uid)) : null;
      if (owner?.data()?.storageMigration?.status === 'copying') throw new ServiceUnavailableException('Account storage upgrade in progress; retry notification.');
      const pending = [...new Set([...(saved?.data()?.paymentAdjustments || []), ...(/^pay_[A-Za-z0-9]+$/.test(paymentId || '') ? [paymentId] : [])])];
      if (pending.length > 100) throw new ServiceUnavailableException('Payment adjustment processing is busy. Retry this notification.');
      tx.create(event, { digest, event: String(payload.event || '').slice(0, 100), receivedAt: Date.now(), subscriptionId: subscriptionId || null, uid: mapping?.uid || null, state: account ? 'accepted' : 'unmapped' });
      if (saved?.exists) {
        const nextSyncAt = Date.now();
        tx.update(account, { nextSyncAt, paymentAdjustments: pending });
        tx.set(this.repo.queue(mapping.uid), { uid: mapping.uid, nextSyncAt, revision: saved.data().revision || 0 });
      }
    });
    return { received: true };
  }
  onModuleInit() {
    // Durable due times + transactional leases allow restart and multiple workers.
    if (process.env.K_SERVICE) return; // Cloud Run uses authenticated scheduled HTTP work.
    this.timer = setInterval(() => { void this.reconcileDue(); }, 15000); this.timer.unref();
  }
  async scheduledReconciliation(token: unknown) {
    this.provider.authorizeReconciliation(token);
    return this.reconcileDue(true);
  }
  async reconcileDue(reportFailure = false) {
    if (this.running || this.stopping) return { skipped: true, processed: 0, failed: 0 };
    this.running = true;
    let processed = 0, failed = 0;
    try {
      this.provider.settings();
      const due = await this.repo.db().collection(BILLING_QUEUE).where('nextSyncAt', '>', 0).where('nextSyncAt', '<=', Date.now()).limit(20).get();
      const startedAt = Date.now();
      for (const row of due.docs) {
        if (this.stopping || Date.now() - startedAt > 45000) break;
        try { await this.sync(row.id); processed++; }
        catch { failed++; await this.update(row.id, current => ({ ...current, nextSyncAt: Date.now() + 60000 })).catch(() => {}); }
      }
      if (reportFailure && failed) throw new ServiceUnavailableException('Some billing work remains due. Retry reconciliation.');
      return { skipped: false, processed, failed };
    } catch {
      if (reportFailure) throw new ServiceUnavailableException('Billing reconciliation is temporarily unavailable. Retry this job.');
      // Missing configuration/storage does not take browser auth offline.
    }
    finally { this.running = false; }
  }
  onModuleDestroy() { this.stopping = true; if (this.timer) clearInterval(this.timer); }
}
