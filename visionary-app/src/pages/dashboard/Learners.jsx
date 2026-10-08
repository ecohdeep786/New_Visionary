import WorkspaceEmptyState from '@/components/dashboard/WorkspaceEmptyState';
import { teacherCopy } from '@/lib/teacherCopy';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useWorkspace } from '@/hooks/useWorkspace';
import { teacherLearners } from '@/services/classroomService';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
export default function Learners() {
  const scope = useWorkspace();
  return <LearnerWorkspace key={scope.ctx?.personId + ':' + scope.ctx?.workspaceId} scope={scope} />;
}
function LearnerWorkspace({
  scope
}) {
  const {
    ctx,
    data: workspaceData,
    revision,
    error: workspaceError,
    refresh
  } = scope;
  const locale = workspaceData?.preferences.interfaceLocale || 'en';
  const copy = teacherCopy(locale);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const {
    data = [],
    isPending,
    error,
    refetch
  } = useQuery({
    queryKey: ['workspace', 'learners', ctx?.personId, ctx?.workspaceId, revision],
    enabled: !!ctx && !workspaceError,
    queryFn: () => teacherLearners(ctx),
    retry: false
  });
  const rows = data.filter(r => (r.name + ' ' + r.id).toLowerCase().includes(search.toLowerCase()));
  const learner = !error && !isPending ? data.find(r => r.id === selected) : null;
  if (workspaceError) return <div className="v-page" lang={locale}><h1 className="v-title">{copy('Learners')}</h1><p role="alert" lang="en">{workspaceError}</p><button className="v-button" onClick={refresh}>{copy('Retry')}</button></div>;
  return <div className="v-page" lang={locale}><header><h1 className="v-title">{copy("Learners")}</h1><p className="v-muted mt-2">{copy("Classwork evidence you can act on. Personal conversations and independent learning are not included.")}</p></header><label><span className="sr-only">{copy("Find a learner")}</span><input className="v-field max-w-md" placeholder={copy("Find a learner")} value={search} onChange={e => setSearch(e.target.value)} /></label>
 {isPending ? <p role="status">{copy("Loading your class roster\u2026")}</p> : error ? <p className="v-notice v-error" role="alert"><span lang="en">{error.message}</span><button className="v-button ml-3" onClick={() => refetch()}>{copy("Retry")}</button></p> : rows.length ? <section className="v-card">{rows.map(r => <button className="v-list-row w-full text-left" key={r.id} onClick={() => setSelected(r.id)}><div className="min-w-0"><h2 className="text-base font-medium break-words">{r.name}</h2><p className="v-muted">{r.classes.map(c => c.name).join(' · ')}{r.tier && <span className="ml-2 rounded-full bg-[#e8f0fd] px-2 py-0.5 text-[11px] font-medium text-[#0b57d2]">{copy(r.tierLabel)}</span>}</p></div><span className="v-evidence shrink-0">{copy(r.pending ? '{count} to review' : '{count} submissions', {
            count: r.pending || r.submitted
          })}</span></button>)}</section> : <section className="v-card"><WorkspaceEmptyState illustration={search ? "compass" : "handshake"} title={copy(search ? 'No matching learners' : 'Your class connections start here')} description={copy(search ? 'Try a name or email.' : 'Invite learners to a class. Their submitted work appears here once they connect.')}><Link className="v-button" to="/dashboard/classes">{copy("Open classes")}</Link></WorkspaceEmptyState></section>}
 <Dialog open={!!learner} onOpenChange={open => {
      if (!open) setSelected(null);
    }}><DialogContent lang={locale} className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl"><DialogTitle>{learner?.name}</DialogTitle><DialogDescription>{copy("Only submissions to your classes. A score is not a mastery judgment.")}</DialogDescription>{learner?.evidence.length ? learner.evidence.map(e => <article key={e.id} className="v-card"><h3 className="text-base font-medium">{e.title}</h3><p className="v-muted mt-2">{e.status === 'graded' ? copy('Returned · {grade}/{total}', {
              grade: e.grade,
              total: e.total
            }) : copy('Waiting for review')}</p><p className="mt-4 whitespace-pre-wrap text-sm">{e.response}</p>{e.feedback && <p className="v-notice mt-4">{e.feedback}</p>}<Link className="v-button mt-4" to={`/dashboard/class/${e.classId}`}>{copy("Review in class")}</Link></article>) : <p className="v-muted">{copy("No submitted classwork yet. This is not evidence of low ability.")}</p>}</DialogContent></Dialog></div>;
}
