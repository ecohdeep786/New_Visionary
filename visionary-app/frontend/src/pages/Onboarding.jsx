import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { authErrorMessage, authFlowError } from '@/lib/authErrors';
import { initializeLearningWorkspace } from '@/lib/learningProfile';
import { changeOnboardingField, changeOnboardingRole, parseOnboardingDraft } from '@/lib/onboardingDraft';
import { productSetupSteps, setupPayload, setupRoles, setupStepReady } from '@/lib/productSetup';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import ProductSetupFields from '@/components/onboarding/ProductSetupFields';
import IdentitySelection from '@/components/onboarding/steps/IdentitySelection';
import { authLink, safeReturnTo } from '@/lib/authReturnTo';

export default function Onboarding() {
  const { account } = useAuth();
  return <ProductSetup key={account?.id} />;
}
function ProductSetup() {
  const { account, updateUser, completeOnboarding, logout } = useAuth();
  const navigate = useNavigate();
  const live = base44.auth.source === 'firebase', draftKey = `visionary_onboarding_${account?.id}`;
  const [saved] = useState(() => { try { return parseOnboardingDraft(localStorage.getItem(draftKey)); } catch { return null; } });
  const [phase, setPhase] = useState(saved?.phase || 'identity');
  const [data, setData] = useState(saved?.data || { full_name: account?.full_name || '', preferred_language: 'English' });
  const [currentStepId, setCurrentStepId] = useState(saved?.currentStepId || 'about');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const lock = useRef(false);
  const steps = useMemo(() => productSetupSteps(data), [data]);
  const current = steps.find(step => step.id === currentStepId) || steps[0];
  const index = steps.indexOf(current), total = steps.length + 2;
  const labels = data.identity === 'student' ? ['Your role', 'About you', 'Your focus', 'Details', 'Review'] : ['Your role', 'About you', 'Preferences', 'Review'];
  const updateData = (field, value) => { setError(''); setData(previous => changeOnboardingField(previous, field, value)); };
  useEffect(() => {
    if (account?.onboarding_complete) return;
    try { localStorage.setItem(draftKey, JSON.stringify({ phase, data, currentStepId })); }
    catch { setNotice('Keep this page open: your browser cannot save an unfinished draft. Completed setup will still be saved to your account.'); }
  }, [draftKey, phase, data, currentStepId, account?.onboarding_complete]);
  function chooseRole(identity) {
    if (lock.current) return;
    setData(previous => changeOnboardingRole(previous, identity)); setPhase('flow'); setCurrentStepId('about'); setError('');
  }
  function next() {
    if (lock.current || !setupStepReady(current, data, live)) return;
    if (steps[index + 1]) setCurrentStepId(steps[index + 1].id); else setPhase('review');
  }
  function back() {
    setError('');
    if (index > 0) setCurrentStepId(steps[index - 1].id); else setPhase('identity');
  }
  async function switchAccount() {
    if (lock.current) return;
    lock.current = true; setSwitchingAccount(true); setError('');
    try {
      await logout();
      navigate(authLink('/login'), { replace: true });
    } catch (failure) {
      setError(failure?.status >= 500
        ? 'We couldn’t sign you out. Your setup draft is kept. Please try again shortly.'
        : authErrorMessage(failure, 'We couldn’t sign you out. Your setup draft is kept. Please try again.'));
    } finally { lock.current = false; setSwitchingAccount(false); }
  }
  const accountActions = { onChangeAccount: switchAccount, isSubmitting: busy || switchingAccount, isSwitchingAccount: switchingAccount };
  async function finish() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (!data.age_band) throw authFlowError('auth/age-required');
      if (live && data.age_band !== 'adult') throw authFlowError('auth/guardian-required');
      if (!steps.every(step => setupStepReady(step, data, live))) throw new Error('Incomplete product setup');
      const payload = setupPayload(data);
      if (live) {
        const profile = await completeOnboarding(payload);
        if (!profile?.onboarding_complete) throw authFlowError('auth/profile-unavailable');
      } else {
        await initializeLearningWorkspace(base44, account, { ...payload, identity: payload.identity === 'professional' ? 'student' : payload.identity });
        await updateUser({ ...payload, onboarding_complete: true, getting_started_complete: false });
      }
      try { localStorage.removeItem(draftKey); } catch { /* A completed profile is authoritative even without browser storage. */ }
    } catch (failure) { setError(authErrorMessage(failure, 'We couldn’t finish setting up Visionary. Review your details and try again.')); }
    finally { lock.current = false; setBusy(false); }
  }
  if (account?.onboarding_complete && !busy) return <Navigate to={safeReturnTo()} replace />;
  if (phase === 'identity') return <IdentitySelection onContinue={chooseRole} initialRole={data.identity} accountEmail={account?.email || account?.phone_number} error={error} {...accountActions} />;
  const alerts = <>{error && <p role="alert" className="mb-5 rounded-xl bg-[#fce8e6] p-4 text-sm leading-6 text-[#e30000]">{error}</p>}{notice && <p role="status" className="mb-5 text-xs leading-6 text-[#6e6e73]">{notice}</p>}</>;
  if (phase === 'review') {
    const payload = setupPayload(data);
    const rows = [['Using Visionary as', setupRoles[data.identity]], ['Name', data.full_name], ['Age range', data.age_band === 'adult' ? '18 or older' : data.age_band === 'minor' ? 'Under 18' : 'Choose your age range'], ['Learning language', payload.preferred_language],
      ...(data.identity === 'student' ? [['Learning focus', {school:'School',higher_ed:'Higher education',competitive:'Exam preparation',professional:'Independent learning'}[data.education_stage]], ['Board', data.board], ['Class', data.grade_level], ['State', data.state], ['Course', data.degree_program], ['Exam', data.target_exam], ['Subjects', data.subjects?.join(', ')]] : []),
      ...(data.identity === 'teacher' ? [['Teaching context', {school:'School',higher_ed:'Higher education',university:'University',coaching:'Coaching',independent:'Independent teaching'}[data.teacher_category]], ['Subjects', data.teacher_subjects?.join(', ')]] : []),
      ...(data.identity === 'organization' ? [['Organization', data.org_name], ['Organization type', data.org_type]] : []), ['Goal or interest', data.career_goal]].filter(([, value]) => value);
    const ready = steps.every(step => setupStepReady(step, data, live));
    return <OnboardingLayout title="Ready to start with Visionary?" subtitle="A quick check before we save your preferences to this account." step={total} totalSteps={total} stepLabels={labels} illustration="shield" accountEmail={account?.email || account?.phone_number}
      onBack={() => { setPhase('flow'); setCurrentStepId(steps.at(-1).id); }} onContinue={finish} canContinue={ready} {...accountActions} continueLabel="Start using Visionary">
      {alerts}
      <div className="mb-5 flex flex-wrap gap-4"><button type="button" onClick={() => setPhase('identity')} className="min-h-11 text-sm font-medium text-[#0066cc] hover:underline">Change role</button><button type="button" onClick={() => { setCurrentStepId('about'); setPhase('flow'); }} className="min-h-11 text-sm font-medium text-[#0066cc] hover:underline">Edit details</button></div>
      <dl className="divide-y divide-[#d2d2d7]/60 text-sm">{rows.map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-2 sm:gap-4"><dt className="text-[#6e6e73]">{label}</dt><dd className="break-words font-medium leading-6">{value}</dd></div>)}</dl>
      {!ready && <p role="status" className="mt-4 rounded-xl bg-[#f5f5f7] p-4 text-sm leading-6">{data.age_band === 'minor' && live ? 'Under-18 setup needs a verified guardian connection. Your account and draft are kept.' : 'A required detail is missing. Select Edit details to finish it.'}</p>}
      <p className="mt-5 text-xs leading-6 text-[#6e6e73]">{live ? 'Your account preferences are saved online. Learning activity is currently saved on this device.' : 'This local preview saves information in your browser. Use fictional details.'} Private activity is never automatically shared.</p>
    </OnboardingLayout>;
  }
  return <OnboardingLayout step={index + 2} totalSteps={total} stepLabels={labels} title={current.title} subtitle={current.subtitle} illustration={current.illustration} accountEmail={account?.email || account?.phone_number}
    onBack={back} onContinue={next} canContinue={setupStepReady(current, data, live)} {...accountActions} optional={current.optional} onSkip={next}>
    {alerts}<ProductSetupFields key={`${current.id}:${data.education_stage || ''}`} step={current} data={data} updateData={updateData} live={live} />
  </OnboardingLayout>;
}
