import { safeReturnTo } from '@/lib/authReturnTo';
import { billingSelection } from '@/lib/billingIntent';

export default function BillingAuthNotice({ action = 'Sign in' }) {
  const destination = new URL(safeReturnTo(), window.location.origin);
  const selected = billingSelection(destination.search);
  if (selected) return <p lang="en" className="mb-6 rounded-xl bg-[rgba(0,102,204,0.10)] p-4 text-sm leading-6 text-[#0066cc]">{action} to review {selected.plan === 'family' ? 'Family' : 'Personal'} with {selected.interval === 'annual' ? 'annual' : 'monthly'} billing. Payment starts only after you review the amount and confirm secure checkout.</p>;
  if (destination.pathname === '/dashboard/subscription' && destination.searchParams.has('invite')) return <p lang="en" className="mb-6 rounded-xl bg-[rgba(0,102,204,0.10)] p-4 text-sm leading-6 text-[#0066cc]">Sign in with the invited account to review your Family billing invitation. Joining requires your explicit acceptance.</p>;
  if (destination.pathname === '/dashboard/subscription') return <p lang="en" className="mb-6 rounded-xl bg-[rgba(0,102,204,0.10)] p-4 text-sm leading-6 text-[#0066cc]">{action} to manage your plan and payments. Your saved subscription and invoices stay with your account.</p>;
  return null;
}
