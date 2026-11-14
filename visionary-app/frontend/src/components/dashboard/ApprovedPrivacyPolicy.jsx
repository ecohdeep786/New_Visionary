import { useEffect, useMemo, useState } from 'react';
import { appClient } from '@/api/appClient';
import { createPrivacyPolicyClient } from '@/services/privacyPolicyClient';
const labels = { auth_device: 'Account and device security', learning_text: 'Private learning text', source_files: 'Source files', billing_audit: 'Billing and audit records', model_artifacts: 'Model operation metadata', admission_proof: 'Admission and relationship proof', voice_transcript: 'Requested voice input', offline_pack: 'Offline learning packs', pilot_feedback: 'Reviewed pilot feedback' };
export default function ApprovedPrivacyPolicy({ accountId }) {
  const [state, setState] = useState({ loading: true, value: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const client = useMemo(() => createPrivacyPolicyClient({ getAccountId: () => appClient.auth.currentProfile?.()?.id === accountId ? accountId : null }), [accountId]);
  useEffect(() => {
    let active = true; setState({ loading: true, value: null, error: null });
    client.read().then(value => { if (active) setState({ loading: false, value, error: null }); }, () => { if (active) setState({ loading: false, value: null, error: 'The approved policy is unavailable. Your records are preserved. Retry when your account connection is ready.' }); });
    return () => { active = false; };
  }, [client, attempt]);
  return <section className="max-w-2xl rounded-2xl border bg-white p-6" lang="en" aria-labelledby="approved-policy-title">
    <h1 id="approved-policy-title" className="text-2xl font-semibold">Approved data policy</h1>
    {state.loading && <p role="status" className="v-muted mt-3">Checking the approved policy for your account…</p>}
    {state.error && <><p role="alert" className="v-notice v-error mt-3">{state.error}</p><button type="button" className="mt-3 min-h-11 rounded-lg border px-4" onClick={() => setAttempt(v => v + 1)}>Retry policy</button></>}
    {state.value && <>
      <p className="v-muted mt-3">Approved by {state.value.approvedBy.name}, {state.value.approvedBy.role}.</p>
      <p className="mt-3">Your existing records are preserved. There is no automatic purge or default use for model training.</p>
      <p className="v-muted mt-3">Under-18 activation remains blocked. Cloud deletion and verified guardian workflows are not available through this policy view.</p>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">{state.value.dataClasses.map(c => <div key={c.dataClass}><dt className="font-medium">{labels[c.dataClass]}</dt><dd className="v-muted mt-1">{c.purpose} Records are preserved under your controls; lifecycle requests need their supported workflow.</dd></div>)}</dl>
      <details className="mt-5"><summary>Policy reference</summary><p className="v-muted mt-3 break-all">Version: {state.value.policyVersion}</p><p className="v-muted mt-2 break-all">Policy digest: {state.value.policyDigest}</p></details>
    </>}
  </section>;
}
