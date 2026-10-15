// Selection is navigation intent only. The backend owns offers, amounts and access.
export function billingPath(plan, interval = 'monthly') {
  if (!['personal', 'family'].includes(plan)) return '/dashboard/subscription';
  return `/dashboard/subscription?plan=${plan}&billing=${interval === 'annual' ? 'annual' : 'monthly'}`;
}
export function billingSelection(search) {
  const params = new URLSearchParams(search);
  return ['personal', 'family'].includes(params.get('plan')) ? { plan: params.get('plan'), interval: params.get('billing') === 'annual' ? 'annual' : 'monthly' } : null;
}
