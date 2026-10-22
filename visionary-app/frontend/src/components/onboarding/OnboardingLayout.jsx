import { useEffect, useRef } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import VisionaryLogo from '@/components/VisionaryLogo';
import LanguageSelector from '@/components/auth/LanguageSelector';
import SpotIllustration from '@/components/landing/SpotIllustration';
import { Spinner, primaryBtnAutoClass } from '@/components/auth/AuthUI';
import './product-onboarding.css';

export default function OnboardingLayout({ step = 1, totalSteps = 4, stepLabels = ['Your role', 'About you', 'Preferences', 'Review'], title, subtitle,
  onBack, onContinue, canContinue, isSubmitting, children, showNav = true, illustration = 'compass',
  continueLabel = 'Continue', optional = false, onSkip, accountEmail, onChangeAccount, isSwitchingAccount }) {
  const heading = useRef(null);
  const completed = Math.max(0, step - 1);
  const portrait = ['student', 'teacher', 'parent', 'team'].includes(illustration);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); heading.current?.focus({ preventScroll: true }); }, [title]);
  return <form data-font-surface="product" aria-busy={isSubmitting || undefined}
    onSubmit={event => { event.preventDefault(); if (canContinue && !isSubmitting) onContinue?.(); }} className="flex min-h-dvh flex-col bg-[#f5f5f7] text-[#1d1d1f]">
    <header className="bg-white px-5 py-4 sm:px-8"><div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4"><VisionaryLogo /><LanguageSelector /></div></header>
    <div className="mx-auto w-full max-w-[1024px] px-5 pt-6 sm:px-8 sm:pt-8">
      <div className="mb-4 flex items-center justify-between gap-3 text-xs text-[#6e6e73]"><span>Set up Visionary</span><span>Step {step} of {totalSteps}</span></div>
      <div role="progressbar" aria-label="Completed setup steps" aria-valuemin={0} aria-valuemax={totalSteps} aria-valuenow={completed} className="h-1 overflow-hidden rounded-full bg-[#d2d2d7]/40"><div className="h-full rounded-full bg-[#1d1d1f] transition-[width] motion-reduce:transition-none" style={{ width: `${completed / totalSteps * 100}%` }} /></div>
      <ol aria-label="Setup steps" className="mt-4 flex justify-between gap-2">{stepLabels.map((label, index) => <li key={label} aria-current={index + 1 === step ? 'step' : undefined} className="flex min-w-0 flex-col items-center gap-2 sm:flex-row">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${index + 1 < step ? 'bg-[#1d1d1f] text-white' : index + 1 === step ? 'border-2 border-[#1d1d1f] text-[#1d1d1f]' : 'border border-[#d2d2d7] text-[#6e6e73]'}`}>{index + 1 < step ? <Check size={13} aria-hidden="true" /> : index + 1}</span>
        <span className={`text-center text-xs leading-4 ${index + 1 === step ? 'font-medium text-[#1d1d1f]' : 'text-[#6e6e73]'}`}>{label}</span>
      </li>)}</ol>
    </div>
    <main className="mx-auto w-full max-w-[1024px] flex-1 px-5 pb-8 pt-7 sm:px-8 sm:pb-12">
      <div className="overflow-hidden rounded-[28px] border border-[#d2d2d7]/30 bg-white shadow-[0_1px_2px_rgba(60,64,67,0.08),0_2px_6px_2px_rgba(60,64,67,0.06)] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside aria-hidden="true" className="flex items-center justify-center bg-[#f5f5f7] px-6 py-5 lg:flex-col lg:gap-7 lg:py-12">
          <div className={portrait ? 'h-24 w-[72px] lg:h-56 lg:w-[168px]' : 'h-20 w-20 lg:h-48 lg:w-48'}><SpotIllustration subject={illustration} className="h-full w-full" /></div>
          <div className="hidden text-center lg:block"><Sparkles size={32} strokeWidth={1.5} className="mx-auto mb-3 text-[#0066cc]" /><p className="text-xl font-medium">Made for your next step.</p><p className="mt-3 text-sm leading-6 text-[#6e6e73]">Learn. Explore. Build.</p></div>
        </aside>
        <section className="min-w-0 p-5 sm:p-8 lg:p-9" aria-labelledby="onboarding-title">
          <h1 ref={heading} tabIndex={-1} id="onboarding-title" className="text-[26px] font-medium leading-tight outline-none sm:text-[32px]">{title}</h1>
          {subtitle && <p className="mt-3 text-sm leading-6 text-[#6e6e73]">{subtitle}</p>}
          {accountEmail && <p className="mt-4 truncate text-xs text-[#6e6e73]" title={accountEmail}>Using {accountEmail}</p>}
          {accountEmail && onChangeAccount && <button type="button" disabled={isSubmitting} onClick={onChangeAccount} className="mt-2 min-h-11 rounded-full px-3 text-sm font-medium text-[#0066cc] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50">{isSwitchingAccount ? 'Signing out…' : 'Use a different account'}</button>}
          {optional && <p className="mt-3 text-xs font-medium text-[#6e6e73]">Optional · choose your details now or skip for later.</p>}
          <fieldset disabled={isSubmitting} className="mt-6 min-w-0">{children}</fieldset>
        </section>
      </div>
    </main>
    {showNav && <footer className="sticky bottom-0 border-t border-[#d2d2d7]/60 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-8"><div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-3">
      {onBack ? <button type="button" disabled={isSubmitting} onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-[#0066cc] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] disabled:opacity-50"><ArrowLeft size={18} aria-hidden="true" />Back</button> : <span className="text-xs text-[#6e6e73]">Your preferences. Your pace.</span>}
      <div className="flex flex-wrap items-center justify-end gap-2">{optional && onSkip && <button type="button" disabled={isSubmitting} onClick={onSkip} className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-[#0066cc] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc]">Skip for now</button>}
        <button type="submit" disabled={!canContinue || isSubmitting} className={`${primaryBtnAutoClass} disabled:cursor-not-allowed`}>{isSubmitting ? <><Spinner />{isSwitchingAccount ? 'Signing out…' : 'Saving…'}</> : continueLabel}</button>
      </div>
    </div></footer>}
  </form>;
}
