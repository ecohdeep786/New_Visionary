import { organizationAuthorCopy } from '@/lib/organizationAuthorCopy';
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/hooks/useWorkspace';
import { organizationAccess } from '@/services/workspaceService';
import OrganizationContent from './OrganizationContent';
export default function OrganizationCurriculum() {
  const scope = useWorkspace();
  const locale = scope.data?.preferences.interfaceLocale || 'en';
  const copy = organizationAuthorCopy(locale);
  const [seed, setSeed] = useState(null);
  const [legacy, setLegacy] = useState([]),
    [failure, setFailure] = useState(''),
    [retry, setRetry] = useState(0),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!scope.ctx) return;
    let active = true;
    setLoading(true);
    setFailure('');
    (async () => {
      const policy = organizationAccess(scope.ctx);
      if (!policy.permissions.includes('academic')) throw Error('Your organization permission does not allow curriculum review.');
      const rows = await base44.entities.OrganizationCurriculum.filter({
        organization_email: policy.organizationEmail
      });
      if (active) {
        setLegacy(rows);
        setLoading(false);
      }
    })().catch(error => {
      if (active) {
        setLegacy([]);
        setFailure(error.message);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [scope.ctx?.personId, scope.ctx?.workspaceId, scope.revision, retry]);
  if (scope.error) return <div className="v-page" role="alert" lang="en">{scope.error}</div>;
  if (!scope.ctx || !scope.data) return <div className="v-page" role="status">{copy("Reading curriculum templates\u2026")}</div>;
  const policy = organizationAccess(scope.ctx);
  if (!policy.permissions.includes('academic')) return <div className="v-page" role="alert">{copy("Your organization permission does not allow curriculum review.")}</div>;
  return <><OrganizationContent key={scope.ctx.personId + ':' + scope.ctx.workspaceId} ctx={scope.ctx} data={scope.data} kind="curriculum" seed={seed} /><section lang={locale} className="v-page"><details className="v-card"><summary className="cursor-pointer font-medium">{copy("Earlier subject drafts \xB7 unreviewed")}</summary><p className="v-muted mt-3">{copy("These original scope notes are retained. They have no recorded source/version review and cannot be distributed as approved curriculum. Copy reviewed objectives into a new sourced template above to enter the versioned workflow.")}</p>{loading && legacy.length === 0 ? <p role="status" className="v-muted mt-3">{copy("Reading earlier subject drafts\u2026")}</p> : failure ? <p role="alert" lang="en" className="v-notice v-error mt-3">{failure}<button className="v-button mt-3" lang={locale} onClick={() => setRetry(value => value + 1)}>{copy("Retry earlier drafts")}</button></p> : legacy.length ? legacy.map(row => <article key={row.id} className="mt-3 rounded-xl border p-3"><h2 className="text-sm font-medium">{row.subject} · {row.group} · {row.status || copy("draft")}</h2><p className="v-muted mt-2 whitespace-pre-wrap">{row.objectives || copy("No objective notes recorded.")}</p><button className="v-button mt-3" onClick={() => setSeed({
            nonce: crypto.randomUUID(),
            title: [row.subject, row.group].filter(Boolean).join(' · '),
            body: ['Learner group: ' + (row.group || 'Review required'), 'Subject: ' + (row.subject || 'Review required'), 'Earlier objective notes:', row.objectives || 'Add learning objectives before submission.', 'Review source sections and prerequisite sequence before approval.'].join('\n\n')
          })}>{copy("Prepare sourced template")}<span className="sr-only">: {row.subject} {row.group}</span></button></article>) : <p className="v-muted mt-3">{copy("No earlier subject drafts on this device.")}</p>}</details></section></>;
}
