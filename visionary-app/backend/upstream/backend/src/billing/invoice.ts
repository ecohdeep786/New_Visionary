// A product document snapshot, derived only from the verified provider receipt.
//
// No mode has legal supplier address, GST registration or digital signature here
// — those are BILL-06 (KAN-107) commercial deliverables and are deliberately NOT
// invented. What this change adds (BILL-07 / KAN-108) is that a document always
// states the environment that produced it and carries a mode-distinct number
// prefix, so a test receipt can never be mistaken for — or numbered as — a live
// invoice. `tax` remains `null` in every mode until the approved tax policy and
// merchant data exist.
export function invoiceDocument(uid: string, receipt: any) {
  const mode = receipt.mode === 'live' ? 'live' : 'test';
  const plan = receipt.plan === 'family' ? 'Family' : 'Personal';
  return { ...receipt, uid, billingAccountId: uid, documentVersion: 1,
    issuedAt: receipt.issuedAt || receipt.paidAt, seller: { name: 'Visionary' },
    lineItems: [{ description: `${plan} subscription`, interval: receipt.interval,
      quantity: 1, unitAmount: receipt.amount, amount: receipt.amount,
      periodStart: receipt.periodStart, periodEnd: receipt.periodEnd }],
    totals: { currency: receipt.currency, subtotal: receipt.amount, discount: 0, tax: null, total: receipt.amount },
    // Explicit provenance, never a legal claim.
    legalTaxInvoice: false, mode,
  };
}
