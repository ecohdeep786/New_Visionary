import { CheckCheck, Layers, Hammer } from 'lucide-react';

const copy = {
  en: { title: 'Your work in this period', objectives: 'Objectives worked on', answers: 'Recorded answers', correct: '{count} correct', applications: 'Applications recorded', unassessed: 'Work recorded; not independently assessed', next: 'Open an activity below to revisit an idea or choose your next step.', partial: 'Some sources are unavailable. This summary includes only the records that could be read.', unmeasured: 'No measured answers yet' },
  hi: { title: 'इस अवधि में आपका काम', objectives: 'जिन उद्देश्यों पर काम किया', answers: 'दर्ज उत्तर', correct: '{count} सही', applications: 'दर्ज उपयोग', unassessed: 'काम दर्ज है; स्वतंत्र मूल्यांकन नहीं हुआ', next: 'किसी विचार को फिर देखने या अगला कदम चुनने के लिए नीचे गतिविधि खोलें।', partial: 'कुछ स्रोत उपलब्ध नहीं हैं। इस सारांश में केवल पढ़े जा सके रिकॉर्ड हैं।', unmeasured: 'अभी कोई मापे गए उत्तर नहीं' },
  bn: { title: 'এই সময়সীমায় আপনার কাজ', objectives: 'যে উদ্দেশ্যগুলিতে কাজ করেছেন', answers: 'নথিভুক্ত উত্তর', correct: '{count}টি সঠিক', applications: 'নথিভুক্ত প্রয়োগ', unassessed: 'কাজ নথিভুক্ত; স্বাধীন মূল্যায়ন হয়নি', next: 'কোনো ধারণা আবার দেখতে বা পরের কাজ বেছে নিতে নিচে একটি কার্যকলাপ খুলুন।', partial: 'কিছু উৎস পাওয়া যাচ্ছে না। এই সারাংশে শুধু পড়া সম্ভব হয়েছে এমন রেকর্ড আছে।', unmeasured: 'এখনও কোনো মাপা উত্তর নেই' },
};

/** The service already validates evidence and excludes unverified work from accuracy. */
export default function ProgressOverview({ report, locale, periodLabel }) {
  if (!report.objectives.length) return null;
  const t = copy[locale] || copy.en;
  const number = new Intl.NumberFormat(locale);
  const totals = report.objectives.reduce((sum, row) => ({answers: sum.answers + row.total, correct: sum.correct + row.correct, applications: sum.applications + row.applications}), {answers: 0, correct: 0, applications: 0});
  return <section className="v-card v-progress-overview" aria-labelledby="progress-overview-title">
    <p className="v-home-eyebrow">{periodLabel}</p>
    <h2 id="progress-overview-title" className="text-lg font-medium">{t.title}</h2>
    <dl className="v-evidence-metrics">
      <Metric icon={Layers} label={t.objectives} value={number.format(report.objectives.length)} />
      <Metric icon={CheckCheck} label={t.answers} value={totals.answers ? number.format(totals.answers) : t.unmeasured} note={totals.answers ? t.correct.replace('{count}', number.format(totals.correct)) : undefined} />
      {totals.applications > 0 && <Metric icon={Hammer} label={t.applications} value={number.format(totals.applications)} note={t.unassessed} />}
    </dl>
    <p className="v-muted mt-4">{report.unavailable.length ? t.partial : t.next}</p>
  </section>;
}

function Metric({ icon: Icon, label, value, note }) {
  return <div className="v-evidence-metric"><dt><Icon size={18} aria-hidden="true" />{label}</dt><dd>{value}</dd>{note && <dd className="v-evidence-metric-note">{note}</dd>}</div>;
}
