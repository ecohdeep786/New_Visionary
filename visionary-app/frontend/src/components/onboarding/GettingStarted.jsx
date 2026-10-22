import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Compass, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import SpotIllustration from '@/components/landing/SpotIllustration';
import { Spinner, primaryBtnAutoClass } from '@/components/auth/AuthUI';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { authErrorMessage } from '@/lib/authErrors';
import './product-onboarding.css';

const firstSteps = {
  student: { title: 'Start with something to learn', text: 'Choose a subject or learning journey. Your own interests are a good starting point.', path: '/dashboard/learn', label: 'Explore learning' },
  professional: { title: 'Turn an interest into a next step', text: 'Explore a skill, a career goal or a project you want to build.', path: '/dashboard/career', label: 'Explore career goals' },
  teacher: { title: 'Bring your next lesson to life', text: 'Prepare a lesson. Connect a class when you are ready to work with learners.', path: '/dashboard/prepare', label: 'Open lesson preparation' },
  parent: { title: 'Begin with a family connection', text: 'An approved connection determines which child learning summaries you can see.', path: '/dashboard/child', label: 'Review family connections' },
  organization: { title: 'Get your organization ready', text: 'Review your organization details. People and access are configured separately.', path: '/dashboard/cohorts', label: 'Open organization setup' },
};
export default function GettingStarted() {
  const { account } = useAuth();
  return account?.onboarding_complete ? <ProductIntroduction key={account.id} /> : null;
}
function ProductIntroduction() {
  const { account, user, completeIntroduction, updateUser } = useAuth();
  const [open, setOpen] = useState(account.getting_started_complete === false);
  const [page, setPage] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false), title = useRef(null);
  const live = base44.auth.source === 'firebase', first = firstSteps[user?.identity] || firstSteps.student;
  useEffect(() => { if (open) title.current?.focus({ preventScroll: true }); }, [page, open]);
  async function finish() {
    if (lock.current) return;
    if (account.getting_started_complete !== false) { setOpen(false); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      if (live) { const profile = await completeIntroduction(); if (!profile?.getting_started_complete) throw new Error('Introduction could not be confirmed'); }
      else await updateUser({ getting_started_complete: true });
      setOpen(false);
    } catch (failure) { setError(authErrorMessage(failure, 'We couldn’t save your introduction. Try again; your Visionary setup is safe.')); }
    finally { lock.current = false; setBusy(false); }
  }
  const screens = [
    { title: 'Welcome to Visionary', text: 'A place to learn, explore ideas and build what comes next. Here’s a quick look around.', art: 'compass' },
    { title: 'Find your next step', text: 'Home brings your next action together. Use the navigation to explore learning, tools and your saved activity.', art: 'growth' },
    { title: 'You’re in control', text: 'Your goals and your privacy belong to you. Review preferences and permissions whenever you need to.', art: 'shield' },
  ];
  const screen = screens[page];
  return <Dialog.Root open={open} onOpenChange={value => { if (!lock.current) { setOpen(value); if (value) { setPage(0); setError(''); } } }}>
    <Dialog.Trigger asChild><button type="button" className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-[#0066cc] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc]"><Compass size={17} aria-hidden="true" />Show getting started</button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1d1d1f]/45 backdrop-blur-[2px]" />
      <Dialog.Content data-font-surface="product" onOpenAutoFocus={event => { event.preventDefault(); title.current?.focus(); }}
        className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-[760px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-[#d2d2d7]/30 bg-white shadow-[0_1px_2px_rgba(60,64,67,0.08),0_2px_6px_2px_rgba(60,64,67,0.06)] outline-none">
        <div className="flex shrink-0 items-center justify-between px-5 py-4 sm:px-8"><p className="text-xs text-[#6e6e73]">Getting started · {page + 1} of 3</p><Dialog.Close asChild><button type="button" disabled={busy} aria-label="Close introduction" className="flex h-11 w-11 items-center justify-center rounded-full text-[#6e6e73] hover:bg-[#f5f5f7] focus-visible:outline focus-visible:outline-2"><X size={20} /></button></Dialog.Close></div>
        <div className="min-h-0 overflow-y-auto px-5 pb-6 sm:px-10 sm:pb-8">
          <div className="rounded-2xl bg-[#f5f5f7] px-4 py-7 text-center sm:py-9">
            <SpotIllustration subject={screen.art} className="mx-auto h-24 w-24 sm:h-32 sm:w-32" />
            <Dialog.Title ref={title} tabIndex={-1} id="getting-started-title" className="mt-5 text-[26px] font-medium leading-tight text-[#1d1d1f] outline-none sm:text-[34px]">{screen.title}</Dialog.Title>
            <Dialog.Description className="mx-auto mt-4 max-w-[520px] text-sm leading-6 text-[#6e6e73] sm:text-base sm:leading-7">{screen.text}</Dialog.Description>
          </div>
          {page === 0 && <div className="mx-auto mt-6 max-w-[420px] rounded-2xl border border-[#d2d2d7]/60 px-4 py-4 text-center"><p className="text-sm font-medium">{account.full_name || 'Your Visionary account'}</p><p className="mt-1 truncate text-xs text-[#6e6e73]" title={account.email}>{account.email}</p><p className="mt-3 text-xs text-[#6e6e73]">Setup is saved to this account.</p></div>}
          {page === 1 && <div className="mt-6 rounded-2xl border border-[#d2d2d7]/60 p-5"><div className="flex items-start gap-4"><Compass size={36} strokeWidth={1.5} className="shrink-0 text-[#0066cc]" aria-hidden="true" /><div><h3 className="text-base font-medium">{first.title}</h3><p className="mt-2 text-sm leading-6 text-[#6e6e73]">{first.text}</p><Link to={first.path} onClick={() => setOpen(false)} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#0066cc] hover:underline">{first.label}<ArrowRight size={17} aria-hidden="true" /></Link></div></div></div>}
          {page === 2 && <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[{ icon: SlidersHorizontal, title: 'Make it yours', text: 'Review learning preferences and languages.', path: '/dashboard/personalization', label: 'Review preferences' }, { icon: ShieldCheck, title: 'Keep sharing intentional', text: 'Private activity is never automatically shared.', path: '/dashboard/privacy', label: 'Review privacy' }].map(({ icon: Icon, title: heading, text, path, label }) => <article key={heading} className="rounded-2xl border border-[#d2d2d7]/60 p-4"><Icon size={36} strokeWidth={1.5} className="text-[#0066cc]" aria-hidden="true" /><h3 className="mt-3 text-sm font-medium">{heading}</h3><p className="mt-2 text-xs leading-5 text-[#6e6e73]">{text}</p><Link to={path} onClick={() => setOpen(false)} className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-[#0066cc] hover:underline">{label}</Link></article>)}
          </div>}
          {page === 2 && <p className="mt-4 text-xs leading-5 text-[#6e6e73]">{live ? 'Your account setup is saved online. Learning activity is currently saved on this device.' : 'This preview saves activity in this browser.'}</p>}
          {error && <p role="alert" className="mt-4 rounded-xl bg-[#fce8e6] p-4 text-sm leading-6 text-[#e30000]">{error}</p>}
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#d2d2d7]/60 px-5 py-4 sm:px-8">
          {page === 0 ? <button type="button" disabled={busy} onClick={finish} className="min-h-11 rounded-full px-3 text-sm font-medium text-[#0066cc] hover:underline">Skip introduction</button> : <button type="button" disabled={busy} onClick={() => setPage(previous => previous - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-[#0066cc] hover:underline"><ArrowLeft size={17} aria-hidden="true" />Back</button>}
          <button type="button" disabled={busy} onClick={page === 2 ? finish : () => setPage(previous => previous + 1)} className={`${primaryBtnAutoClass} disabled:cursor-not-allowed`}>{busy ? <><Spinner />Saving…</> : page === 2 ? 'Start exploring' : 'Continue'}{!busy && <ArrowRight size={17} aria-hidden="true" />}</button>
        </footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
