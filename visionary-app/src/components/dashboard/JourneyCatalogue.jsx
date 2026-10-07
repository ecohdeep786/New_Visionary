import { legacyLearningCopy } from '@/lib/legacyLearningCopy';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { eligibleJourneys } from '@/services/journeyEligibility';
import { useWorkspace } from '@/hooks/useWorkspace';
export default function JourneyCatalogue({
  practice = false
}) {
  const {
    ctx,
    data,
    person
  } = useWorkspace();
  const locale = data?.preferences.interfaceLocale || 'en';
  const copy = legacyLearningCopy(locale);
  return <section className="rounded-2xl border border-[#dadce0] p-5" lang={locale}><div className="mb-5"><h2 className="text-lg font-medium">{practice ? copy("Practice with purpose") : copy("Guided journeys")}</h2><p className="mt-2 text-sm text-[#5f6368]">{copy("Curated interactive examples \xB7 English, \u0939\u093F\u0928\u094D\u0926\u0940, \u09AC\u09BE\u0982\u09B2\u09BE")}</p></div><div className="grid gap-4 lg:grid-cols-3">{eligibleJourneys(ctx?.role || copy("student"), person?.ageBand || 'unknown', ctx?.locale || 'en').map(j => <div className="min-w-0 rounded-xl bg-[#ffffff] p-4" key={j.id}><h3 className="text-base font-medium" lang={ctx?.locale}>{j.title}</h3><p className="mt-2 text-sm leading-6 text-[#5f6368]" lang={ctx?.locale}>{j.objective}</p><details className="mt-3 text-xs text-[#5f6368]"><summary className="cursor-pointer">{copy("Why this?")}</summary><p lang={ctx?.locale} className="mt-2 leading-6">{j.why}</p></details><Link className="v-button mt-4" to={`/dashboard/home?journey=${j.id}${practice ? '&stage=practicing' : ''}`}>{practice ? copy("Start practice") : copy("Open with Guide")}<ArrowUpRight size={15} /></Link></div>)}</div></section>;
}
