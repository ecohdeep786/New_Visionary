import { useEffect, useMemo, useState } from 'react';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import { createBillingClient } from '@/services/billingClient';

const names = { start: 'Start', personal: 'Personal', family: 'Family' };

// Mounted when the account menu opens, so it reads the same saved account plan
// as Plans without treating a browser-local preview as a paid entitlement.
export default function ConnectedPlanBadge() {
  const { account } = useAuth();
  const [label, setLabel] = useState('Checking plan…');
  const client = useMemo(() => createBillingClient({ getAccountId: () => appClient.auth.currentProfile?.()?.id }), []);
  useEffect(() => {
    let current = true;
    setLabel('Checking plan…');
    if (account?.id) client.account().then(value => {
      if (current && value.uid === account.id && names[value.plan]) setLabel(value.plan === 'start' ? 'Free account' : `${names[value.plan]} · Test billing`);
    }).catch(() => { if (current) setLabel('Billing status unavailable'); });
    return () => { current = false; };
  }, [account?.id, client]);
  return <span lang="en" data-account-billing className="rounded-full border border-[#dadce0] px-3 py-1 text-xs text-[#5f6368]">{label}</span>;
}
