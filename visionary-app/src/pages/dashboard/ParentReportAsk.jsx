import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '@/hooks/useWorkspace';
import { answerParentReportQuestion, getParentReportAsk } from '@/services/parentReportAskService';

const prompts = ['What does this evidence mean?', 'What could I ask their teacher?', 'What support activity can we try at home?'];

export default function ParentReportAsk() {
 const { ctx, error: loadError } = useWorkspace();
 const [params] = useSearchParams();
 const childId = params.get('child') || '';
 const days = params.get('period') === '30' ? 30 : 7;
 const [question, setQuestion] = useState(prompts[0]);
 const [answer, setAnswer] = useState(null);
 const [, setRevision] = useState(0);
 useEffect(() => {
  const refresh = () => { setAnswer(null); setRevision(value => value + 1); };
  window.addEventListener('visionary:v2-change', refresh);
  window.addEventListener('storage', refresh);
  window.addEventListener('focus', refresh);
  return () => { window.removeEventListener('visionary:v2-change', refresh); window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); };
 }, []);
 useEffect(() => { setQuestion(prompts[0]); setAnswer(null); }, [childId]);
 if (loadError) return <div className="v-page" role="alert">{loadError}</div>;
 if (!ctx) return <div className="v-page" role="status">Opening your report…</div>;
 let report;
 let permissionError = '';
 try { report = getParentReportAsk(ctx, childId, days); } catch (error) { permissionError = error.message; }
 if (permissionError) return <div className="v-page"><section className="v-card" role="alert"><h1 className="v-title">Shared report unavailable</h1><p className="v-muted mt-3">{permissionError}</p><Link className="v-button mt-5" to="/dashboard/connections">Review connections</Link></section></div>;
 function ask(event) {
  event.preventDefault();
  try { setAnswer({ ...answerParentReportQuestion(ctx, childId, question, days), childId, days, personId: ctx.personId, workspaceId: ctx.workspaceId }); }
  catch { setAnswer(null); setRevision(value => value + 1); }
 }
 return <div className="v-page"><header><p className="v-muted">Parent workspace · shared report</p><h1 className="v-title">Ask about {report.name}’s learning</h1><p className="v-muted mt-2">{report.period} · Guidance from consented summary counts. Private conversations, answers, grades and drafts are excluded.</p></header>
  <section className="v-card"><h2 className="text-lg font-medium">What would help you support them?</h2><div className="mt-4 flex flex-wrap gap-2">{prompts.map(prompt => <button type="button" className="v-button" key={prompt} onClick={() => { setQuestion(prompt); setAnswer(null); }}>{prompt}</button>)}</div><form onSubmit={ask} className="mt-5"><label className="text-sm" htmlFor="parent-report-question">Your question</label><textarea id="parent-report-question" className="v-field mt-2" rows={3} maxLength={500} value={question} onChange={event => setQuestion(event.target.value)} /><p className="v-muted mt-2">This local helper covers these three topics using only the selected child’s currently shared summary. Other questions need a connected teaching service. Your question and its reply are not saved.</p><button className="v-button primary mt-4" disabled={!question.trim()}>Get guidance</button></form></section>
  {answer?.childId === childId && answer?.days === days && answer?.personId === ctx.personId && answer?.workspaceId === ctx.workspaceId && <section className="v-card" aria-live="polite"><h2 className="text-lg font-medium">From {answer.name}’s shared report</h2><p className="mt-3 text-base leading-7">{answer.answer}</p><details className="mt-4 text-sm"><summary className="cursor-pointer">Evidence and other ways to help</summary><p className="mt-3">{answer.evidence}</p><p className="mt-3">{answer.teacherQuestion}</p><p className="mt-3">{answer.activity}</p></details><p className="v-muted mt-4">{answer.source}. This is a local guide, not an AI assessment or teacher instruction.</p></section>}
  <Link className="v-button" to={`/dashboard/reports?child=${encodeURIComponent(childId)}&period=${days}`}>Return to shared report</Link>
 </div>;
}
