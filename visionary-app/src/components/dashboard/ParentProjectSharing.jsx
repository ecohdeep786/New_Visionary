import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { shareParentProjectSummary, stopParentProjectSummary, visibleRelationships } from '@/services/workspaceService';

export default function ParentProjectSharing({ ctx, artifact, open, onOpenChange, onChange }) {
 const [recipient, setRecipient] = useState('');
 const [summary, setSummary] = useState('');
 const [notice, setNotice] = useState('');
 useEffect(() => { if (!open) { setRecipient(''); setSummary(''); setNotice(''); } }, [open]);
 const parents = visibleRelationships(ctx).filter(row => row.type === 'guardian' && row.to === ctx.personId && row.status === 'active' && row.scope.includes('progress-summary'));
 const connections = visibleRelationships(ctx).filter(row => row.type === 'guardian' && row.to === ctx.personId);
 const existing = artifact.parentSummaries || [];
 const selected = parents.find(parent => parent.from === recipient);
 function share() {
  try { const saved = shareParentProjectSummary(ctx, artifact.id, recipient, summary, JSON.stringify([artifact.updatedAt, artifact.title, artifact.body, artifact.status])); onChange(saved, `Summary shared with ${selected?.name || 'parent'}. Later project edits stay private until you share again.`); onOpenChange(false); }
  catch (error) { setNotice(error.message); }
 }
 function stop(parentId) {
  try { const saved = stopParentProjectSummary(ctx, artifact.id, parentId); onChange(saved, 'Project summary sharing stopped. Your project remains saved.'); }
  catch (error) { setNotice(error.message); }
 }
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[85dvh] overflow-y-auto bg-white"><DialogTitle>Share a project summary with a parent</DialogTitle><DialogDescription>Choose the parent and write the exact summary they can see. Your document, rubric answers, drafts and other projects stay private. The parent also needs active progress-sharing permission.</DialogDescription>
  {artifact.status !== 'completed' ? <p className="v-notice">Mark this project completed and save it before sharing a summary.</p> : <>
   <label className="block text-sm">Parent with active permission<select className="v-field mt-2" value={recipient} onChange={event => { setRecipient(event.target.value); setSummary((artifact.parentSummaries || []).find(share => share.recipient === event.target.value)?.summary || ''); setNotice(''); }}><option value="">Choose a parent</option>{parents.map(parent => <option key={parent.id} value={parent.from}>{parent.name}</option>)}</select></label>
   {selected && <><label className="block text-sm">Summary to share<textarea className="v-field mt-2 min-h-28" maxLength={500} value={summary} onChange={event => setSummary(event.target.value)} placeholder="Describe what you built and what support would help." /></label><p className="v-muted">{summary.length}/500 characters</p><section className="v-card bg-white" aria-label="Exact parent preview"><p className="text-sm font-medium">What {selected.name} will see</p><h3 className="mt-3 text-sm font-medium">{artifact.title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm">{summary.trim() || 'Your summary appears here.'}</p><p className="v-muted mt-3">Saved project version: {new Date(artifact.updatedAt).toLocaleString()}</p></section><button className="v-button primary" disabled={!summary.trim()} onClick={share}>Confirm summary sharing</button></>}
   {!parents.length && <p className="v-notice">No parent currently has active progress-sharing permission. A parent can request it in Connections, and you can accept it there.</p>}
  </>}
  {existing.length > 0 && <section className="border-t pt-4"><h3 className="text-sm font-medium">Shared summaries</h3>{existing.map(share => <div className="v-list-row" key={share.recipient}><div className="min-w-0"><p className="text-sm font-medium">{connections.find(parent => parent.from === share.recipient)?.name || 'Previous parent connection'}</p><p className="v-muted">Shared {new Date(share.sharedAt).toLocaleDateString()} · Fixed copy{parents.some(parent => parent.id === share.relationshipId) ? '' : ' · Current access inactive'}</p></div><button className="v-button" onClick={() => stop(share.recipient)}>Stop sharing</button></div>)}</section>}
  {notice && <p className="v-notice" role="status">{notice}</p>}
 </DialogContent></Dialog>;
}
