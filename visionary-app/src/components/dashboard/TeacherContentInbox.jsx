import { teacherCopy } from '@/lib/teacherCopy';
import { CurriculumTemplatePreview } from './CurriculumTemplateEditor';
import { useState } from 'react';
import { teacherOrganizationContent, importOrganizationContent } from '@/services/workspaceService';
export default function TeacherContentInbox({
  ctx,
  onOpen,
  locale = 'en'
}) {
  const labels = teacherCopy(locale);
  const [notice, setNotice] = useState('');
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  let rows = [],
    error;
  try {
    rows = teacherOrganizationContent(ctx);
  } catch (cause) {
    error = cause.message;
  }
  function copy(row, objectiveId) {
    try {
      const resource = importOrganizationContent(ctx, row.id, objectiveId);
      onOpen(resource);
      setNotice('Your own draft is ready. Check the objective, source, language and questions before marking it reviewed.');
      setFailed(false);
    } catch (cause) {
      setNotice(cause.message);
      setFailed(true);
    }
  }
  return <section lang={locale} className="v-card" data-refresh={retry}><h2 className="text-lg font-medium">{labels("Organization preparation inbox")}</h2><p className="v-muted mt-2">{labels("Explicit approved copies for your active Work membership. Personal preparation stays separate. A copy creates no learner evidence or assignment.")}</p>{error ? <p className="v-notice v-error mt-4" role="alert"><span lang="en">{error}</span><button className="v-button ml-3" onClick={() => setRetry(value => value + 1)}>{labels("Retry")}</button></p> : rows.length ? rows.map(row => <article className="mt-5 border-t pt-4" key={row.id}><h3 className="text-sm font-medium">{row.title} · {labels('Source revision {revision}', {
          revision: row.revision
        })}</h3><p className="v-muted mt-2 break-words">{row.source} · {row.language}</p><details className="mt-3 text-sm"><summary className="cursor-pointer">{labels("Preview delivered content")}</summary><p className="mt-3 whitespace-pre-wrap">{row.body}</p>{row.curriculumTemplate && <CurriculumTemplatePreview value={row.curriculumTemplate} locale={row.language} />}</details>{row.curriculumTemplate ? <div className="mt-4 space-y-3"><p className="v-muted">{labels("Choose one reviewed objective. Each preparation copy keeps this delivery revision; no learner curriculum is published.")}</p>{row.curriculumTemplate.chapters?.flatMap(chapter => chapter.objectives || []).map(objective => <button key={objective.id} className="v-button" onClick={() => copy(row, objective.id)}>{labels('Prepare objective: {title}', {
            title: objective.title
          })}</button>)}</div> : <button className="v-button mt-4" onClick={() => copy(row)}>{labels(row.importedResourceId ? 'Open my preparation copy' : 'Copy to my preparation drafts')}</button>}</article>) : <p className="v-muted mt-4">{labels("No delivered content in this workspace. In Work, an academic administrator can share an approved revision with you.")}</p>}{notice && <p className={`v-notice mt-3 ${failed ? 'v-error' : ''}`} lang={failed ? 'en' : locale} role={failed ? 'alert' : 'status'}>{failed ? notice : labels(notice)}</p>}</section>;
}
