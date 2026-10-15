import type { Locale, RequestContext } from '../domain/workspace.ts';
import { familyReports, snapshot, visibleRelationships } from './workspaceService.ts';

const copy = {
 en: {
  active: (name: string) => `${name} currently shares progress summaries.`,
  pending: (name: string) => `Waiting for ${name} to accept the sharing request.`,
  declined: (name: string) => `${name} declined the sharing request.`,
  expired: (name: string) => `${name}’s sharing request or permission expired.`,
  revoked: (name: string) => `Progress sharing with ${name} was stopped.`,
  restricted: (name: string) => `Progress summaries for ${name} are not available under this connection. Review its sharing scope.`,
  cancelled: (name: string) => `The sharing request for ${name} was cancelled.`,
  unavailable: (name: string) => `The sharing status for ${name} could not be read. Progress access is unavailable; review the connection.`,
  digest: (name: string, completed: number, returned: number | null) => `${name}: ${completed} completed guided activities; ${returned === null ? 'returned classwork unavailable' : `${returned} returned classwork items`} in the last 7 days.`,
 },
 hi: {
  active: (name: string) => `${name} अभी प्रगति का सारांश साझा कर रहे हैं।`,
  pending: (name: string) => `${name} की साझा करने की स्वीकृति की प्रतीक्षा है।`,
  declined: (name: string) => `${name} ने साझा करने का अनुरोध अस्वीकार किया।`,
  expired: (name: string) => `${name} का साझा करने का अनुरोध या अनुमति समाप्त हो गई।`,
  revoked: (name: string) => `${name} के साथ प्रगति साझा करना बंद हुआ।`,
  restricted: (name: string) => `${name} की प्रगति का सारांश इस संबंध के अंतर्गत उपलब्ध नहीं है। साझा करने की सीमा देखें।`,
  cancelled: (name: string) => `${name} के लिए साझा करने का अनुरोध रद्द किया गया।`,
  unavailable: (name: string) => `${name} की साझा करने की स्थिति नहीं पढ़ी जा सकी। प्रगति की पहुँच उपलब्ध नहीं है; संबंध की समीक्षा करें।`,
  digest: (name: string, completed: number, returned: number | null) => `${name}: पिछले 7 दिनों में ${completed} निर्देशित गतिविधियाँ पूरी हुईं; ${returned === null ? 'लौटाए गए कक्षा कार्य उपलब्ध नहीं हैं' : `${returned} कक्षा कार्य शिक्षक ने लौटाए` }।`,
 },
 bn: {
  active: (name: string) => `${name} এখন অগ্রগতির সারাংশ শেয়ার করছে।`,
  pending: (name: string) => `${name} শেয়ার করার অনুরোধ গ্রহণ করবে কি না তার অপেক্ষায়।`,
  declined: (name: string) => `${name} শেয়ার করার অনুরোধ প্রত্যাখ্যান করেছে।`,
  expired: (name: string) => `${name}-এর শেয়ার করার অনুরোধ বা অনুমতির মেয়াদ শেষ।`,
  revoked: (name: string) => `${name}-এর সঙ্গে অগ্রগতি শেয়ার বন্ধ হয়েছে।`,
  restricted: (name: string) => `${name}-এর প্রগতির সারাংশ এই সংযোগে উপলব্ধ নয়। ভাগ করার পরিসর দেখুন।`,
  cancelled: (name: string) => `${name}-এর শেয়ার করার অনুরোধ বাতিল হয়েছে।`,
  unavailable: (name: string) => `${name}-এর ভাগ করার অবস্থা পড়া যায়নি। অগ্রগতির প্রবেশাধিকার নেই; সংযোগ পর্যালোচনা করুন।`,
  digest: (name: string, completed: number, returned: number | null) => `${name}: গত ৭ দিনে ${completed}টি নির্দেশিত কার্যকলাপ সম্পন্ন; ${returned === null ? 'ফেরত দেওয়া ক্লাসওয়ার্কের তথ্য নেই' : `${returned}টি ক্লাসওয়ার্ক শিক্ষক ফেরত দিয়েছেন`}।`,
 },
};
const eventCopy = {
 en: { requested: (name: string) => `Requested progress sharing with ${name}.`, accepted: (name: string) => `${name} accepted progress sharing.`, declined: (name: string) => `${name} declined progress sharing.`, cancelled: (name: string) => `Cancelled the sharing request for ${name}.`, revoked: (name: string) => `Progress sharing with ${name} was stopped.` },
 hi: { requested: (name: string) => `${name} से प्रगति साझा करने का अनुरोध किया।`, accepted: (name: string) => `${name} ने प्रगति साझा करना स्वीकार किया।`, declined: (name: string) => `${name} ने प्रगति साझा करना अस्वीकार किया।`, cancelled: (name: string) => `${name} के लिए साझा करने का अनुरोध रद्द किया।`, revoked: (name: string) => `${name} के साथ प्रगति साझा करना बंद हुआ।` },
 bn: { requested: (name: string) => `${name}-এর সঙ্গে অগ্রগতি শেয়ারের অনুরোধ করা হয়েছে।`, accepted: (name: string) => `${name} অগ্রগতি শেয়ার করতে সম্মত হয়েছে।`, declined: (name: string) => `${name} অগ্রগতি শেয়ার করতে অস্বীকার করেছে।`, cancelled: (name: string) => `${name}-এর শেয়ার অনুরোধ বাতিল হয়েছে।`, revoked: (name: string) => `${name}-এর সঙ্গে অগ্রগতি শেয়ার বন্ধ হয়েছে।` },
};

/** Current local status and manual digest preview; no delivery or historical alert is implied. */
export function getParentNotificationPreview(ctx: RequestContext) {
 if (ctx.role !== 'parent') throw new Error('Open your parent workspace to view family updates.');
 const data = snapshot(ctx);
 const locale: Locale = data.preferences.notificationLocale || data.preferences.interfaceLocale || 'en';
 const words = copy[locale] || copy.en;
 const relationships = visibleRelationships(ctx).filter(row => row.type === 'guardian' && row.from === ctx.personId);
 const reports = new Map(familyReports(ctx).map(report => [report.id, report]));
 const latest = new Map(relationships.map(row => [row.to, row]));
 for (const row of relationships) if (row.status === 'active' && reports.has(row.to)) latest.set(row.to, row);
 const connections = [...latest.values()].map(row => {
  const active = row.status === 'active' && reports.has(row.to);
  const projected = active ? 'active' : row.status === 'active' ? 'restricted' : row.status;
  const status = ['active','pending','declined','expired','revoked','cancelled','unavailable','restricted'].includes(projected) ? projected : 'unavailable';
  return { id: row.id, childId: row.to, status, text: (words[status as keyof typeof words] as (name: string) => string)(row.name), path: active ? `/dashboard/reports?child=${encodeURIComponent(row.to)}` : '/dashboard/child' };
 });
 const digest = data.preferences.notifications === 'off' ? [] : [...reports.values()].map(report => ({ childId: report.id, text: words.digest(report.name, report.completed, report.returnedClasswork), path: `/dashboard/reports?child=${encodeURIComponent(report.id)}` }));
 const names = new Map(relationships.map(row => [row.to, row.name]));
 const history = data.notifications.filter(item => item.kind === 'guardian' && item.childId && item.event && Object.hasOwn(eventCopy[locale], item.event)).slice(0, 20).map(item => ({ id: item.id, text: eventCopy[locale][item.event!](names.get(item.childId!) || 'Learner'), at: item.at, read: item.read, path: '/dashboard/child' }));
 return { locale, frequency: data.preferences.notifications, connections, digest, history };
}
