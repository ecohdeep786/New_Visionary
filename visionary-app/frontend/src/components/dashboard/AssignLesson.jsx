import { teacherCopy } from '@/lib/teacherCopy';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { assignReviewedLesson, teacherClasses } from '@/services/classroomService';
import { snapshot, resourceRevision } from '@/services/workspaceService';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
export default function AssignLesson({
  ctx,
  resource,
  locale = 'en'
}) {
  const copy = teacherCopy(locale);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState('');
  const [assignedClassId, setAssignedClassId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [points, setPoints] = useState(10);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  let saved;
  let readError = '';
  try {
    saved = snapshot(ctx).resources.find(item => item.id === resource.id);
  } catch (error) {
    readError = error.message;
  }
  const needsSave = !saved || saved.status !== 'reviewed' || resourceRevision(saved) !== resourceRevision(resource);
  const {
    data: classes = [],
    isPending,
    error,
    refetch
  } = useQuery({
    queryKey: ['workspace', 'assign-classes', ctx.personId, ctx.workspaceId],
    enabled: open,
    queryFn: () => teacherClasses(ctx),
    retry: false
  });
  async function assign() {
    setBusy(true);
    try {
      if (needsSave) throw Error('Save and review the latest lesson changes before assigning.');
      const assigned = await assignReviewedLesson(ctx, {
        resourceId: resource.id,
        classId,
        dueDate,
        points,
        expectedVersion: saved.updatedAt,
        expectedRevision: resourceRevision(saved)
      });
      setAssignedClassId(assigned.class_id);
      setNotice('Assigned. A reviewed copy is now available to this class. Later lesson edits do not change this copy.');
      setFailed(false);
      setOpen(false);
    } catch (e) {
      setNotice(e.message);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return <>{readError && <p className="v-notice v-error" role="alert" lang="en">{readError}</p>}<button type="button" className="v-button" disabled={needsSave} onClick={() => {
      setNotice('');
      setFailed(false);
      setClassId('');
      setOpen(true);
    }}>{copy(needsSave ? 'Save changes before assigning' : 'Assign reviewed lesson')}</button>{notice && <p className={`v-notice ${failed ? 'v-error' : ''}`} role={failed ? 'alert' : 'status'} lang={failed ? 'en' : locale}>{failed ? notice : copy(notice)}</p>}{notice && !failed && assignedClassId && <Link className="v-button mt-3" to={`/dashboard/class/${encodeURIComponent(assignedClassId)}?section=classwork`}>{copy("Classwork")}</Link>}<Dialog open={open} onOpenChange={value => {
      if (!busy) setOpen(value);
    }}><DialogContent lang={locale}><DialogTitle>{copy('Assign {title}', {
            title: resource.title
          })}</DialogTitle><DialogDescription>{copy("Share a copy of this reviewed lesson with an enrolled class. No private preparation notes outside this lesson are shared.")}</DialogDescription>{isPending ? <p role="status">{copy("Loading classes\u2026")}</p> : error ? <div role="alert"><p>{copy('Could not load your classes.')}</p><p lang="en">{error.message}</p><button className="v-button" onClick={() => refetch()}>{copy('Retry')}</button></div> : classes.length ? <><label className="text-sm">{copy("Class")}<select aria-label={copy("Class")} className="v-field mt-2" value={classId} onChange={e => setClassId(e.target.value)}><option value="">{copy("Choose a class")}</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="text-sm">{copy("Due date (optional)")}<input className="v-field mt-2" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></label><label className="text-sm">{copy("Points")}<input className="v-field mt-2" type="number" min="1" max="10000" value={points} onChange={e => setPoints(Number(e.target.value))} /></label><button className="v-button primary" disabled={busy || !classId} onClick={assign}>{copy(busy ? 'Assigning…' : 'Confirm assignment')}</button></> : <Link className="v-button" to="/dashboard/classes?create=1">{copy("Create your first class")}</Link>}{notice && <p role={failed ? 'alert' : 'status'} lang={failed ? 'en' : locale}>{failed ? notice : copy(notice)}</p>}</DialogContent></Dialog></>;
}
