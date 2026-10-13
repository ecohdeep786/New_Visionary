import { Link } from 'react-router-dom';

const copy = {
 en: { stages: {'primary':'Primary learning','secondary':'Secondary learning','higher-secondary':'Higher secondary learning','competitive':'Competitive exam preparation','vocational':'Vocational learning','higher-education':'Higher education','independent':'Independent learning','professional':'Professional learning'},
  duration:(min,max)=>`Suggested session: ${min}–${max} minutes.`,
  optional:'Take breaks or continue at your own pace. This guidance follows your saved stage; it is not an ability assessment.',
  review:'Review learning stage', voice:'Read-aloud is available from Guide when supported by your browser. Start it yourself; text remains available.' },
 hi: { stages: {'primary':'प्राथमिक शिक्षा','secondary':'माध्यमिक शिक्षा','higher-secondary':'उच्च माध्यमिक शिक्षा','competitive':'प्रतियोगी परीक्षा की तैयारी','vocational':'व्यावसायिक शिक्षा','higher-education':'उच्च शिक्षा','independent':'स्वतंत्र अध्ययन','professional':'पेशेवर अध्ययन'},
  duration:(min,max)=>`सुझाया गया सत्र: ${min}–${max} मिनट।`,
  optional:'विराम लें या अपनी गति से आगे बढ़ें। यह मार्गदर्शन आपके सहेजे गए शिक्षा स्तर पर आधारित है; यह क्षमता का आकलन नहीं है।',
  review:'शिक्षा स्तर की समीक्षा करें', voice:'ब्राउज़र समर्थित होने पर Guide से पढ़कर सुनना उपलब्ध है। इसे स्वयं शुरू करें; पाठ उपलब्ध रहता है।' },
 bn: { stages: {'primary':'প্রাথমিক শিক্ষা','secondary':'মাধ্যমিক শিক্ষা','higher-secondary':'উচ্চ মাধ্যমিক শিক্ষা','competitive':'প্রতিযোগিতামূলক পরীক্ষার প্রস্তুতি','vocational':'বৃত্তিমূলক শিক্ষা','higher-education':'উচ্চশিক্ষা','independent':'স্বাধীন অধ্যয়ন','professional':'পেশাগত অধ্যয়ন'},
  duration:(min,max)=>`প্রস্তাবিত সেশন: ${min}–${max} মিনিট।`,
  optional:'বিরতি নিন বা নিজের গতিতে এগিয়ে যান। এই নির্দেশনা আপনার সংরক্ষিত শিক্ষার পর্যায়ের ভিত্তিতে; এটি সক্ষমতার মূল্যায়ন নয়।',
  review:'শিক্ষার পর্যায় পর্যালোচনা করুন', voice:'ব্রাউজার সমর্থন করলে Guide থেকে পড়ে শোনা যায়। নিজে শুরু করুন; পাঠ্য উপলব্ধ থাকে।' },
};
export default function StagePresentationSummary({presentation,locale='en'}) {
 const t=copy[locale]||copy.en;
 return <details className="v-home-reason" lang={locale}>
  <summary>{t.stages[presentation.stage]}</summary>
  <p>{t.duration(presentation.sessionMinutes.minimum,presentation.sessionMinutes.maximum)} {t.optional}</p>
  {presentation.voiceFirst&&<p>{t.voice}</p>}
  <Link className="v-button mt-3" to="/dashboard/personalization">{t.review}</Link>
 </details>;
}
