import ConnectedBilling from '@/components/dashboard/ConnectedBilling';
import { useAuth } from '@/lib/AuthContext';

export default function Plans() {
  const { account } = useAuth();
  return <ConnectedBilling key={account?.id} profile={account} />;
}
