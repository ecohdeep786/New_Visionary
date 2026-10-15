/** Keep the current daily task in the illustrated action panel, once.
 * The service's complete plan remains unchanged; completed and distinct work
 * stay visible. A shared destination alone does not identify the same task.
 */
export function homePlanPresentation(modules, priority) {
  const plan = modules.find(module => module.id === 'daily-plan');
  const currentStep = plan?.rows.find(row => row.deferId && (
    row.id === priority.id ||
    (row.id === `unit:${priority.id}` && row.action.path === priority.action.path)
  ));
  const visibleModules = modules.flatMap(module => {
    if (module.id !== 'daily-plan' || !currentStep) return [module];
    const rows = module.rows.filter(row => row !== currentStep);
    return rows.length ? [{ ...module, rows }] : [];
  });
  return { currentStep, modules: visibleModules };
}

export function currentPlanDeferralLabel(locale) {
  return {
    en: 'Remove from today’s plan',
    hi: 'आज की योजना से हटाएँ',
    bn: 'আজকের পরিকল্পনা থেকে সরান',
  }[locale] || 'Remove from today’s plan';
}

export function planDeferralFailureHelp(locale) {
  return {
    en: 'Your plan is unchanged. Check browser storage, then try again.',
    hi: 'योजना नहीं बदली है। ब्राउज़र का स्टोरेज जाँचकर फिर प्रयास करें।',
    bn: 'পরিকল্পনা বদলায়নি। ব্রাউজারের স্টোরেজ যাচাই করে আবার চেষ্টা করুন।',
  }[locale] || 'Your plan is unchanged. Check browser storage, then try again.';
}
