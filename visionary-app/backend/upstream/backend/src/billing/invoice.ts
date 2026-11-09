// A product document snapshot, derived only from the verified provider receipt.
// Test mode has no legal supplier address, GST registration or digital signature.
export function invoiceDocument(uid: string, receipt: any) {
  const plan = receipt.plan === 'family' ? 'Family' : 'Personal';
  return { ...receipt, uid, billingAccountId: uid, documentVersion: 1,
    issuedAt: receipt.issuedAt || receipt.paidAt, seller: { name: 'Visionary' },
    lineItems: [{ description: `${plan} subscription`, interval: receipt.interval,
      quantity: 1, unitAmount: receipt.amount, amount: receipt.amount,
      periodStart: receipt.periodStart, periodEnd: receipt.periodEnd }],
    totals: { currency: receipt.currency, subtotal: receipt.amount, discount: 0, tax: null, total: receipt.amount },
  };
}

// BILL-06 (KAN-107): immutable invoice document.
//
// The launch checklist requires "Preserve immutable original invoices and
// accurate refunds; do not invent legal fields." An invoice DOCUMENT records the
// charge exactly as the provider confirmed it and is written ONCE. Derived
// display state (status / amountRefunded) is NOT stored on the document — a
// refund is recorded as a separate per-payment adjustment under the invoice (see
// BillingRepository.adjustment) and projected into the account view at read time.
// Mutating any charge fact on an existing document is refused by
// BillingRepository.writeOnceInvoice.
export const INVOICE_IMMUTABLE_FIELDS = ['id', 'uid', 'billingAccountId', 'documentVersion', 'recordKind', 'number',
  'currency', 'amount', 'plan', 'interval', 'periodStart', 'periodEnd', 'issuedAt', 'paidAt',
  'subscriptionId', 'paymentId', 'billedTo', 'seller', 'lineItems', 'totals'];

// Build the immutable charge document for a provider-confirmed invoice. Strips
// the derived display fields (status, amountRefunded) so they can never be
// stored on — and thereby mutate — the original document.
export function chargeDocument(uid: string, receipt: any) {
  const { status: _status, amountRefunded: _amountRefunded, ...charge } = invoiceDocument(uid, receipt);
  return { ...charge, recordKind: 'charge' };
}

// Fail-closed no-invented-legal-fields guard: an invoice document must never
// carry a tax figure, GST number, seller registration or "legal invoice" claim
// unless it was supplied by a REVIEWED merchant-policy record (BILL-06's owner
// gate). No such record exists on this host, so tax stays null and seller stays
// name-only; any attempt to plant a legal field is a hard error, not a silent
// omission.
export function assertNoInventedLegalFields(document: any) {
  const totals = document?.totals || {};
  if (totals.tax != null) throw new Error('Invoice legal-tax field refused: no reviewed merchant/tax policy exists to authorize a tax figure.');
  const seller = document?.seller || {};
  for (const key of ['gstin', 'gstNumber', 'pan', 'registrationNumber', 'legalName', 'address', 'digitalSignature']) {
    if (seller[key] != null) throw new Error(`Invoice seller field "${key}" refused: no reviewed merchant policy authorizes it.`);
  }
  if (document?.legalTaxInvoice === true) throw new Error('Invoice legal-tax claim refused: no reviewed merchant/tax policy exists.');
  return document;
}
