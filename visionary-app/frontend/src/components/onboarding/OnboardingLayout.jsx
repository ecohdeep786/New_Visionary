import { useEffect, useRef } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import VisionaryLogo from '@/components/VisionaryLogo';
import LanguageSelector from '@/components/auth/LanguageSelector';
import SpotIllustration from '@/components/landing/SpotIllustration';
import { Spinner } from '@/components/auth/AuthUI';
import './product-onboarding.css';

export default function OnboardingLayout({ step = 1, totalSteps = 4, stepLabels = ['Your role', 'About you', 'Preferences', 'Review'], title, subtitle,
  onBack, onContinue, canContinue, isSubmitting, children, showNav = true, illustration = 'compass',
  continueLabel = 'Continue', optional = false, onSkip, accountEmail }) {
  const heading = useRef(null);
  const completed = Math.max(0, step - 1);
  const portrait = ['student', 'teacher', 'parent', 'team'].includes(illustration);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); heading.current?.focus({ preventScroll: true }); }, [title]);
  return <form data-font-surface="product" aria-busy={isSubmitting || undefined}
    onSubmit={event => { event.preventDefault(); if (canContinue && !isSubmitting) onContinue?.(); }} className="flex min-h-dvh flex-col bg-[#f7f9fc] text-[#202124]">
    <header className="bg-white px-5 py-4 sm:px-8"><div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4"><VisionaryLogo /><LanguageSelector /></div></header>
    <div className="mx-auto w-full max-w-[1024px] px-5 pt-6 sm:px-8 sm:pt-8">
      <div className="mb-4 flex items-center justify-between gap-3 text-xs text-[#5f6368]"><span>Set up Visionary</span><span>Step {step} of {totalSteps}</span></div>
      <div role="progressbar" aria-label="Completed setup steps" aria-valuemin={0} aria-valuemax={totalSteps} aria-valuenow={completed} className="h-1 overflow-hidden rounded-full bg-[#dfe4ed]"><div className="h-full rounded-full bg-[#0b57d0] transition-[width] motion-reduce:transition-none" style={{ width: `${completed / totalSteps * 100}%` }} /></div>
      <ol aria-label="Setup steps" className="mt-4 flex justify-between gap-2">{stepLabels.map((label, index) => <li key={label} aria-current={index + 1 === step ? 'step' : undefined} className="flex min-w-0 flex-col items-center gap-2 sm:flex-row">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${index + 1 < step ? 'bg-[#0b57d0] text-white' : index + 1 === step ? 'border-2 border-[#0b57d0] text-[#0b57d0]' : 'border border-[#c6cbd3] text-[#80868b]'}`}>{index + 1 < step ? <Check size={13} aria-hidden="true" /> : index + 1}</span>
        <span className={`text-center text-[10px] leading-4 sm:text-xs ${index + 1 === step ? 'font-medium text-[#0b57d0]' : 'text-[#5f6368]'}`}>{label}</span>
      </li>)}</ol>
    </div>
    <main className="mx-auto w-full max-w-[1024px] flex-1 px-5 pb-8 pt-7 sm:px-8 sm:pb-12">
      <div className="overflow-hidden rounded-[28px] border border-[#e3e7ee] bg-white shadow-[0_8px_40px_-24px_rgba(32,33,36,0.25)] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside aria-hidden="true" className="flex items-center justify-center bg-[#f3f6fc] px-6 py-5 lg:flex-col lg:gap-7 lg:py-12">
          <div className={portrait ? 'h-24 w-[72px] lg:h-56 lg:w-[168px]' : 'h-20 w-20 lg:h-48 lg:w-48'}><SpotIllustration subject={illustration} className="h-full w-full" /></div>
          <div className="hidden text-center lg:block"><Sparkles size={32} strokeWidth={1.5} className="mx-auto mb-3 text-[#0b57d0]" /><p className="text-xl font-medium">Made for your next step.</p><p className="mt-3 text-sm leading-6 text-[#5f6368]">Learn. Explore. Build.</p></div>
        </aside>
        <section className="min-w-0 p-5 sm:p-8 lg:p-9" aria-labelledby="onboarding-title">
          <h1 ref={heading} tabIndex={-1} id="onboarding-title" className="text-[26px] font-medium leading-tight outline-none sm:text-[32px]">{title}</h1>
          {subtitle && <p className="mt-3 text-sm leading-6 text-[#5f6368]">{subtitle}</p>}
          {accountEmail && <p className="mt-4 truncate text-xs text-[#5f6368]" title={accountEmail}>Using {accountEmail}</p>}
          {optional && <p className="mt-3 text-xs font-medium text-[#5f6368]">Optional · choose your details now or skip for later.</p>}
          <fieldset disabled={isSubmitting} className="mt-6 min-w-0">{children}</fieldset>
        </section>
      </div>
    </main>
    {showNav && <footer className="sticky bottom-0 border-t border-[#e3e7ee] bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-8"><div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-3">
      {onBack ? <button type="button" disabled={isSubmitting} onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-[#0b57d0] hover:bg-[#e8f0fd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"><ArrowLeft size={18} aria-hidden="true" />Back</button> : <span className="text-xs text-[#5f6368]">Your preferences. Your pace.</span>}
      <div className="flex flex-wrap items-center justify-end gap-2">{optional && onSkip && <button type="button" disabled={isSubmitting} onClick={onSkip} className="min-h-11 rounded-full px-4 text-sm font-medium text-[#0b57d0] hover:bg-[#e8f0fd]">Skip for now</button>}
        <button type="submit" disabled={!canContinue || isSubmitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#0b57d0] px-6 py-3 text-sm font-medium text-white hover:bg-[#0842a0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b57d0] disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? <><Spinner />Saving…</> : continueLabel}</button>
      </div>
    </div></footer>}
  </form>;
}
