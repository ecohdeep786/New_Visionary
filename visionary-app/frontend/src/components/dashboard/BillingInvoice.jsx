import { useState } from 'react';
import { ChevronDown, Printer } from 'lucide-react';
import VisionaryLogo from '@/components/VisionaryLogo';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value / 100);
const date = value => value && Number.isFinite(new Date(value).getTime()) ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value)) : 'Not available';
const names = { personal: 'Personal', family: 'Family' };
const statusLabels = { paid: 'Paid', partially_refunded: 'Partially refunded', refunded: 'Refunded', processing: 'Payment being confirmed' };

export default function BillingInvoice({ receipt, onClose, returnFocus }) {
  const [expanded, setExpanded] = useState(false);
  if (!receipt) return null;
  const items = receipt.lineItems || [{ description: `${names[receipt.plan]} subscription`, interval: receipt.interval, quantity: 1, unitAmount: receipt.amount, amount: receipt.amount, periodStart: receipt.periodStart, periodEnd: receipt.periodEnd }];
  const totals = receipt.totals || { subtotal: receipt.amount, discount: 0, total: receipt.amount };
  const refunded = receipt.amountRefunded || 0;
  const detailsId = `invoice-details-${receipt.id}`;
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent lang="en" data-billing-invoice="true" className="billing-invoice-dialog max-w-[760px]" onCloseAutoFocus={event => { event.preventDefault(); requestAnimationFrame(() => returnFocus?.current?.focus()); }}>
      <DialogTitle className="sr-only">Visionary test invoice</DialogTitle>
      <DialogDescription className="sr-only">Your subscription, service dates and payment total. Test invoice; no real money was collected.</DialogDescription>
      <div className="billing-invoice-tools" data-invoice-actions>
        <span>Invoice</span><div><button className="v-button primary" onClick={() => window.print()}><Printer size={16} />Print / save as PDF</button><button className="v-button" onClick={onClose}>Close invoice</button></div>
      </div>
      <article className="billing-invoice-sheet" aria-label="Invoice document">
        <header className="billing-invoice-heading">
          <div><VisionaryLogo className="billing-invoice-logo" /><h2>Invoice</h2></div>
          <div className="billing-invoice-number"><strong>{receipt.number}</strong><span>{date(receipt.issuedAt || receipt.paidAt)}</span></div>
        </header>
        <p className="billing-invoice-disclaimer">Test invoice. No real money was collected. Not a tax invoice.</p>
        <section className="billing-invoice-customer-row"><div><h3>Billed to</h3><p className="billing-invoice-customer">{receipt.billedTo?.name || 'Account holder'}</p><p>{receipt.billedTo?.email || 'Email not recorded'}</p></div><span className="billing-invoice-status">{statusLabels[receipt.status] || 'Payment status unavailable'}</span></section>
        <table className="billing-invoice-items"><caption className="sr-only">Subscription charges</caption><thead><tr><th scope="col">Plan</th><th scope="col">Amount</th></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td><strong>{item.description}</strong><span>{item.interval === 'annual' ? 'Annual billing' : 'Monthly billing'}</span><span>{date(item.periodStart)} - {date(item.periodEnd)}</span>{item.quantity !== 1 && <span>{item.quantity} × {money(item.unitAmount)}</span>}</td><td>{money(item.amount)}</td></tr>)}</tbody></table>
        <div className="billing-invoice-total-wrap"><dl className="billing-invoice-totals">{totals.discount > 0 && <><dt>Subtotal</dt><dd>{money(totals.subtotal)}</dd><dt>Discount</dt><dd>-{money(totals.discount)}</dd></>}<dt className="billing-invoice-grand-total">{receipt.status === 'processing' ? 'Total' : refunded ? 'Original payment' : 'Total paid'}</dt><dd className="billing-invoice-grand-total">{money(totals.total)}</dd>{refunded > 0 && <><dt>Refunded</dt><dd>{money(refunded)}</dd><dt>Net payment</dt><dd>{money(totals.total - refunded)}</dd></>}</dl></div>
        <section className="billing-invoice-payment" data-expanded={expanded}>
          <button type="button" className="billing-invoice-details-toggle" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(value => !value)}>Payment details<ChevronDown size={16} aria-hidden="true" /></button>
          <h3 className="billing-invoice-print-label">Payment details</h3>
          <dl id={detailsId}><dt>Billing account ID</dt><dd>{receipt.billingAccountId || receipt.uid}</dd><dt>Payment date</dt><dd>{date(receipt.paidAt)}</dd><dt>Payment provider</dt><dd>Razorpay · Test mode</dd><dt>Payment ID</dt><dd>{receipt.paymentId}</dd><dt>Subscription ID</dt><dd>{receipt.subscriptionId}</dd></dl>
        </section>
        <footer className="billing-invoice-footer">Need help? Open Support in Visionary and include invoice {receipt.number}.</footer>
      </article>
    </DialogContent>
  </Dialog>;
}
