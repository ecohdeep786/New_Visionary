import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import ConnectedLearningHistory from './ConnectedLearningHistory';
import ConnectedProfile from './ConnectedProfile';
import { useAuth } from '@/lib/AuthContext';

export default function ConnectedAccountLayout() {
  const { account, logout } = useAuth();
  const { pathname } = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const page = pathname.toLowerCase().replace(/\/+$/, '');
  async function signOut() {
    setBusy(true);
    setError('');
    try { await logout(); }
    catch { setError('We couldn’t sign you out. Please try again.'); setBusy(false); }
  }
  return <div data-font-surface="product" className="min-h-screen bg-slate-50 text-[#202124]">
    <header className="border-b bg-white px-5 py-3">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-2">
        <nav aria-label="Account" className="flex flex-wrap items-center gap-x-6 text-sm">
          <NavLink className="inline-flex min-h-11 items-center underline-offset-4 aria-[current=page]:underline" to="/dashboard/home" end>Account home</NavLink>
          <NavLink className="inline-flex min-h-11 items-center underline-offset-4 aria-[current=page]:underline" to="/dashboard/profile" end>Profile</NavLink>
          <NavLink className="inline-flex min-h-11 items-center underline-offset-4 aria-[current=page]:underline" to="/dashboard/learn" end>Saved learning</NavLink>
          <NavLink className="inline-flex min-h-11 items-center underline-offset-4 aria-[current=page]:underline" to="/dashboard/subscription" end>Plans</NavLink>
        </nav>
        <button className="min-h-11 rounded-lg border px-4 text-sm disabled:opacity-60" onClick={signOut} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</button>
      </div>
    </header>
    <main id="main" tabIndex={-1} className="visionary-workspace mx-auto max-w-5xl px-5 py-8 sm:py-12">
      {error && <p role="alert" className="mb-4 text-[#b3261e]">{error}</p>}
      {page === '/dashboard/subscription' ? <Outlet /> : page === '/dashboard/profile' ? <ConnectedProfile key={account.id} />
        : page === '/dashboard/learn' ? <ConnectedLearningHistory key={account.id} accountId={account.id} /> : <section className="max-w-xl rounded-2xl border bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold">{page === '/dashboard' || page === '/dashboard/home' ? 'Your Visionary account' : 'This workspace page is unavailable'}</h1>
        {account?.full_name && <p className="mt-2 break-words">{account.full_name}</p>}
        <p className="mt-4 text-slate-700">Use your account to view saved learning, edit your profile, or manage your plan. Interactive learning and shared workspaces are unavailable here.</p>
      </section>}
    </main>
  </div>;
}
