import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { getHome } from '@/services/homeService';

export default function DecisionHome() {
  const {ctx,revision,error:workspaceError} = useWorkspace();
  // Permission changes must not retain a previously authorized child summary while refetching.
  const query = useQuery({queryKey:['home',ctx?.personId,ctx?.workspaceId,ctx?.locale,revision],queryFn:({signal})=>getHome({...ctx,signal}),enabled:!!ctx,retry:false,gcTime:0});
  if (workspaceError || query.error) return <div className="v-page"><h1 className="v-title">Your next step is unavailable</h1><p className="v-notice v-error" role="alert">{workspaceError || query.error.message}</p><div className="v-home-actions"><button className="v-button" onClick={()=>query.refetch()}>Retry</button><Link className="v-button" to="/dashboard/ask">Open saved conversations</Link></div></div>;
  if (!query.data) return <div className="v-page" role="status" aria-busy="true">Preparing your next step…</div>;
  const {name,workspace,boundary,priority,modules,setupNote} = query.data;
  return <div className="v-page v-home">
    <header className="v-home-header"><p className="v-home-eyebrow">{workspace}</p><h1 className="v-title">Welcome back, {name}.</h1><p className="v-muted">One useful next step. Everything else is here when you need it.</p><p className="v-home-boundary">{boundary}</p></header>
    {query.isFetching && <p className="v-muted" role="status">Updating your next step…</p>}
    <section className="v-home-priority" aria-labelledby="next-step-title"><h2 id="next-step-title" lang={priority.titleLocale||'en'}>{priority.title}</h2><p className="v-muted">{priority.detail}</p><div className="v-home-actions"><Link className="v-button primary" to={priority.action.path}>{priority.action.label}<ArrowRight size={18} aria-hidden="true"/></Link><Link className="v-button" to={priority.alternative.path}>{priority.alternative.label}</Link></div><details className="v-home-reason"><summary>Why this?</summary><p>{priority.reason}</p><p>{priority.source}{priority.updatedAt && <> · <time dateTime={priority.updatedAt}>{new Date(priority.updatedAt).toLocaleDateString()}</time></>}</p></details></section>
    <div className="v-home-modules">{modules.map(module=><section className="v-home-module" key={module.id} aria-labelledby={`home-${module.id}`}><h2 id={`home-${module.id}`}>{module.title}</h2>{module.rows.map(row=><div className="v-home-row" key={row.id}><div><p className="v-home-row-title">{row.title}</p><p className="v-muted">{row.detail}</p></div><Link className="v-button" to={row.action.path}>{row.action.label}<span className="sr-only">: {row.title}</span></Link></div>)}</section>)}<section className="v-home-module" aria-labelledby="home-guide"><div className="v-home-row"><div><h2 id="home-guide">A question along the way?</h2><p className="v-muted">Choose what you need help with, or return to a saved conversation.</p></div><Link className="v-button" to="/dashboard/ask"><Sparkles size={18} aria-hidden="true"/>Ask Visionary</Link></div></section></div>
    {setupNote && <p className="v-home-empty">{setupNote}</p>}
    <p className="v-muted">Local preview · Saved on this device. No live model or cloud sync.</p>
  </div>;
}
