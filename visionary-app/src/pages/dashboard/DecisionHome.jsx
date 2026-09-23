import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { getHome } from '@/services/homeService';
import RoleMentorPanel from '@/components/dashboard/RoleMentorPanel';

export default function DecisionHome() {
  const {ctx,revision,error:workspaceError} = useWorkspace();
  // Permission changes must not retain a previously authorized child summary while refetching.
  const query = useQuery({queryKey:['home',ctx?.personId,ctx?.workspaceId,ctx?.locale,revision],queryFn:({signal})=>getHome({...ctx,signal}),enabled:!!ctx,retry:false,gcTime:0});
  if (workspaceError || query.error) return <div className="v-page"><h1 className="v-title">Your next step is unavailable</h1><p className="v-notice v-error" role="alert">{workspaceError || query.error.message}</p><div className="v-home-actions"><button className="v-button" onClick={()=>query.refetch()}>Retry</button><Link className="v-button" to="/dashboard/ask">Open saved conversations</Link></div></div>;
  if (!query.data) return <div className="v-page" role="status" aria-busy="true">Preparing your next step…</div>;
  const {name,workspace,boundary,priority,modules,setupNote,observations,memoryEnabled} = query.data;
  return <div className="v-page v-home">
    <header className="v-home-header"><p className="v-home-eyebrow">{workspace}</p><h1 className="v-title">Welcome back, {name}.</h1><p className="v-home-boundary">{boundary}</p></header>
    {query.isFetching && <p className="v-muted" role="status">Updating your next step…</p>}
    <section className="v-home-priority" aria-labelledby="next-step-title"><p className="v-home-priority-label">Next for you</p><h2 id="next-step-title" lang={priority.titleLocale||'en'}>{priority.title}</h2><p className="v-muted">{priority.detail}</p><div className="v-home-actions"><Link className="v-button primary" to={priority.action.path}>{priority.action.label}<ArrowRight size={18} aria-hidden="true"/></Link><Link className="v-home-secondary" to={priority.alternative.path}>{priority.alternative.label}</Link></div><details className="v-home-reason"><summary>Why this?</summary><p>{priority.reason}</p><p>{priority.source}{priority.updatedAt && <> · <time dateTime={priority.updatedAt}>{new Date(priority.updatedAt).toLocaleDateString()}</time></>}</p></details></section>
    <div className="v-home-modules">{modules.map(module=><section className="v-home-module" key={module.id} aria-labelledby={`home-${module.id}`}><h2 id={`home-${module.id}`}>{module.title}</h2>{module.rows.map(row=><div className="v-home-row" key={row.id}><div><p className="v-home-row-title">{row.title}</p><p className="v-muted">{row.detail}</p></div><Link className="v-button" to={row.action.path}>{row.action.label}<span className="sr-only">: {row.title}</span></Link></div>)}</section>)}</div>
    {ctx.role==='student'&&<section className="v-home-module" aria-labelledby="home-memory"><h2 id="home-memory">Things I remember about you</h2><p className="v-muted">Only from your saved activity this week. These are observations, not an AI assessment.</p>{observations?.length?<ul className="mt-3 space-y-2">{observations.map(item=><li key={item.id} className="text-sm">{item.text}</li>)}</ul>:<p className="v-muted mt-3">{memoryEnabled?'No weekly observations yet. Start a learning unit or practice step to build your own history.':'Learning memory is off for this workspace. You can change it in Personalization.'}</p>}<Link className="v-button mt-4" to="/dashboard/privacy">View or clear memory</Link></section>}
    <RoleMentorPanel ctx={ctx}/>
    <section className="v-home-module" aria-labelledby="home-guide"><div className="v-home-row"><div><h2 id="home-guide">Need help along the way?</h2><p className="v-muted">Ask a question or continue a saved conversation.</p></div><Link className="v-button" to="/dashboard/ask"><Sparkles size={18} aria-hidden="true"/>Ask Visionary Guide</Link></div></section>
    {setupNote && <p className="v-home-empty">{setupNote}</p>}
    <p className="v-muted">Local preview · Saved on this device. No live model or cloud sync.</p>
  </div>;
}
