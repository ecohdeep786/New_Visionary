import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { mentorGreeting } from '@/services/mentorCompanionService';

const COPY = {
  en: { title: 'Your mentor checked in', source: 'From your saved records — not an AI assessment.' },
  hi: { title: 'आपका मार्गदर्शक आया है', source: 'आपके सहेजे अभिलेखों से — यह कोई AI मूल्यांकन नहीं है।' },
  bn: { title: 'আপনার মেন্টর এসেছে', source: 'আপনার সংরক্ষিত রেকর্ড থেকে — এটি কোনো AI মূল্যায়ন নয়।' },
};

// The category mentor proactively checks in on the Ask surface with one evidence-based
// next step from the user's own records, in the user's language. It offers, never acts
// on its own: every suggestion is an explicit link the user chooses to follow.
export default function MentorGreeting() {
  const { ctx } = useWorkspace();
  const greeting = useMemo(() => {
    if (!ctx) return null;
    try { return mentorGreeting(ctx); } catch { return null; }
  }, [ctx?.personId, ctx?.workspaceId, ctx?.locale]);
  if (!ctx || !greeting) return null;
  const copy = COPY[ctx.locale] || COPY.en;
  return <section className="v-mentor-continuation" aria-labelledby="mentor-greeting-title">
    <span className="v-mentor-mark"><Sparkles size={20} aria-hidden="true" /></span>
    <div className="v-mentor-copy">
      <h3 id="mentor-greeting-title" className="v-mentor-label">{copy.title}</h3>
      <p className="v-mentor-next">{greeting.text}</p>
      <p className="v-mentor-source">{copy.source}</p>
    </div>
    {!!greeting.actions.length && <div className="v-mentor-actions">{greeting.actions.map(item => <Link key={item.path + item.label} className="v-button" to={item.path}>{item.label}<ArrowUpRight size={16} aria-hidden="true" /></Link>)}</div>}
  </section>;
}
