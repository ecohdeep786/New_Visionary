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
