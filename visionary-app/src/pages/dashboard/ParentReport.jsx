import { Link, useSearchParams } from 'react-router-dom';
import { familyGoalSummaries, familyProjectSummaries, familyReports } from '@/services/workspaceService';
import { getParentSummary } from '@/services/mentorStateService';
import { getParentStageInsight } from '@/services/stageTransitionService';
import ParentClassworkDigest from '@/components/dashboard/ParentClassworkDigest';

export default function ParentReport({ ctx }) {
 const [params, setParams] = useSearchParams();
 const requested = params.get('child') || '';
 const days = params.get('period') === '30' ? 30 : 7;
 const rows = familyReports(ctx, days);
 const report = requested ? rows.find(row => row.id === requested) : rows[0];
 let learning = null;
 let learningError = '';
 let projects = [];
 let projectsError = '';
 let goals = [];
 let goalsError = '';
 if (report) try { learning = getParentSummary(ctx, report.id, days); }
 catch { learningError = 'Guided-learning evidence could not be read on this device. Other shared sections remain available.'; }
 if (report) try { projects = familyProjectSummaries(ctx, report.id); }
 catch { projectsError = 'Shared project summaries could not be read on this device.'; }
 if (report) try { goals = familyGoalSummaries(ctx, report.id); }
 catch { goalsError = 'Shared learning goals could not be read on this device.'; }
 const select = (child, period) => setParams({ child, period: String(period) });
 return <div className="v-page">
  <header><h1 className="v-title">Their learning, in context</h1><p className="v-muted mt-2">Shared learning summaries, not private conversations. This local report is updated when you open it.</p></header>
  {rows.length > 0 && <div className="grid max-w-2xl gap-4 sm:grid-cols-2"><label className="text-sm">Child<select className="v-field mt-2" value={report?.id || ''} onChange={event => select(event.target.value, days)}>{!report && <option value="">Choose an available child</option>}{rows.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label className="text-sm">Report period<select className="v-field mt-2" value={days} onChange={event => select(report?.id || '', Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select></label></div>}
  {report ? <>
   <section className="v-card"><p className="v-muted">{report.period} · Source: active progress-summary sharing on this device</p><h2 className="mt-2 text-lg font-medium">{report.name}’s overview</h2><p className="mt-3 text-base leading-7">{report.summary}</p><p className="v-muted mt-3">{report.completed} completed guided-learning activities. Completion shows participation; it does not establish mastery.</p><Link className="v-button primary mt-5" to={`/dashboard/ask?child=${encodeURIComponent(report.id)}&period=${days}`}>Ask about this report</Link></section>
   <section className="v-card"><h2 className="text-lg font-medium">Progress and retention</h2><p className="v-muted mt-2">Recorded checks and review evidence in this period. No activity is not a score for ability.</p>{learningError && <p className="v-notice mt-3" role="status">{learningError}</p>}{learning && <><p className="mt-4 text-sm">{learning.concepts.reduce((sum, concept) => sum + concept.correct, 0)} of {learning.concepts.reduce((sum, concept) => sum + concept.total, 0)} recorded answers correct across {learning.concepts.length} concept{learning.concepts.length === 1 ? '' : 's'}.</p>{report.objectives.length ? report.objectives.map((objective, index) => <div className="v-list-row" key={`${objective.title}-${index}`}><span className="text-sm">{objective.title}</span><span className="v-evidence">{objective.stage}</span></div>) : <p className="v-muted mt-3">No guided journey was updated in this period.</p>}<h3 className="mt-5 text-sm font-medium">Shared observations</h3>{learning.observations.length ? <ul className="mt-2 list-disc pl-5 text-sm">{learning.observations.map(item => <li key={item.id}>{item.text}</li>)}</ul> : <p className="v-muted mt-2">No retained observations were shared for this period.</p>}</>}</section>
   <section className="v-card"><h2 className="text-lg font-medium">Applications and projects</h2><p className="mt-3 text-sm">{learning ? `${learning.completedApplications} completed guided applications in this period.` : 'Application count is temporarily unavailable.'}</p><p className="v-muted mt-2">Only summaries the learner explicitly shared with this parent appear below. They are fixed copies and may predate the selected activity period. Project documents, drafts and personal notes remain private.</p>{projectsError && <p className="v-notice mt-3" role="status">{projectsError}</p>}{projects.length ? projects.map(project => <article className="v-list-row block" key={project.id}><h3 className="text-sm font-medium">{project.title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm">{project.summary}</p><p className="v-muted mt-2">Shared {new Date(project.sharedAt).toLocaleDateString()} · saved project copy</p></article>) : !projectsError && <p className="v-muted mt-3">No project summary has been explicitly shared with this parent.</p>}</section>
   <section className="v-card"><h2 className="text-lg font-medium">Assigned work and teacher updates</h2><p className="v-muted mt-2">Returned-work titles and upcoming due dates only. Answers, grades and private feedback are excluded.</p><ParentClassworkDigest ctx={ctx} childId={report.id} days={days} /></section>
   <section className="v-card"><h2 className="text-lg font-medium">Goals and transitions</h2><ParentStageInsight ctx={ctx} childId={report.id} days={days} /><p className="v-muted mt-3">The learner chooses which goal summaries to share. These fixed copies may predate the selected activity period; private notes stay with the learner.</p>{goalsError && <p className="v-notice mt-3" role="status">{goalsError}</p>}{goals.length ? goals.map(goal => <article className="v-list-row block" key={goal.id}><h3 className="text-sm font-medium">{goal.title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm">{goal.summary}</p><p className="v-muted mt-2">Shared {new Date(goal.sharedAt).toLocaleDateString()} · saved goal copy</p></article>) : !goalsError && <p className="v-muted mt-3">No learner goal has been explicitly shared with this parent workspace. Ask the learner what they would like support with.</p>}</section>
  </> : <section className="v-card" role={requested ? 'alert' : undefined}><h2 className="text-lg font-medium">{requested ? 'This report is no longer shared' : 'Connect before viewing progress'}</h2><p className="v-muted mt-3">{requested ? 'The requested child is not available under your current permission. Choose an available child or review your connections.' : 'Reports appear only after the appropriate sharing permission is active.'}</p><Link className="v-button mt-5" to="/dashboard/connections">Review connections</Link></section>}
 </div>;
}

function ParentStageInsight({ ctx, childId, days }) {
 let insight;
 try { insight = getParentStageInsight(ctx, childId, days); }
 catch { return <p role="status" className="v-notice mt-4">The recent class update is unavailable. The shared report remains available.</p>; }
 if (!insight) return <p className="v-muted mt-3">No class transition was shared in this period.</p>;
 const label = value => /^\d+$/.test(value) ? `Class ${value}` : value;
 const message = insight.state === 'applied' ? `Moved from ${label(insight.from)} to ${label(insight.to)}.` : insight.state === 'postponed' ? `The move to ${label(insight.to)} was postponed. Current class: ${label(insight.from)}.` : `The move to ${label(insight.to)} was undone. Current class: ${label(insight.from)}.`;
 return <aside className="v-notice mt-4" aria-label="Recent class update"><h3 className="text-sm font-semibold">Recent class update</h3><p className="mt-1 text-sm">{message}</p><p className="v-muted mt-2">Shared through this active progress connection. The learner controls their own stage and work.</p></aside>;
}
