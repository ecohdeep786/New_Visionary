import { familyClassworkDigest } from '@/services/workspaceService';

export default function ParentClassworkDigest({ ctx, childId }) {
  let digest;
  try { digest = familyClassworkDigest(ctx, childId); }
  catch { return <section className="mt-6 rounded-2xl border border-[#dadce0] p-4" role="status"><h3 className="text-base font-medium">Classwork updates unavailable</h3><p className="v-muted mt-2">The local classwork records could not be read or sharing changed. Reopen this report to try again.</p></section>; }
  return <section className="mt-6 rounded-2xl border border-[#dadce0] p-4" aria-label="Returned classwork">
    <h3 className="text-base font-medium">Returned classwork</h3>
    <p className="v-muted mt-1">{digest.period} · Shared progress summary from this device. Answers, grades and private teacher feedback are not included.</p>
    {digest.returned.length ? <ul className="mt-3 divide-y divide-[#dadce0]">{digest.returned.map(item => <li key={item.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{item.title}</span><span className="text-[#5f6368]">Returned {item.date}</span></li>)}</ul> : <p className="v-muted mt-3">No classwork was returned in this period. This does not describe the learner’s ability.</p>}
    <h4 className="mt-5 border-t border-[#dadce0] pt-4 text-sm font-medium">Due in the next 7 days</h4>
    {digest.upcoming.length ? <ul className="mt-2 divide-y divide-[#dadce0]">{digest.upcoming.map(item => <li key={item.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{item.title}</span><span className="text-[#5f6368]">Due {item.dueDate}</span></li>)}</ul> : <p className="v-muted mt-2">No upcoming classwork due date is recorded for this learner’s active classes.</p>}
  </section>;
}
