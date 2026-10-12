/** Reduce the first set of choices for emerging readers without removing routes. */
export function presentNavigation(role, tier, primary, secondary, pathname = '', mobileLimit = 4) {
  const simplified = role === 'student' && tier === 'foundational';
  const first = simplified ? primary.filter(item => ['home', 'learn', 'ask'].includes(item.key)) : primary;
  const more = [...primary.filter(item => !first.includes(item)), ...secondary];
  const mobile = first.slice(0, Math.max(2, Math.min(4, mobileLimit)));
  const mobileMoreActive = !mobile.some(item => item.to === pathname) && [...first, ...more].some(item => item.to === pathname);
  return {primary:first, secondary:more, mobile, mobileMoreActive};
}
