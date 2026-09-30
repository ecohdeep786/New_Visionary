import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { saveLearnerGoal, shareParentGoalSummary, stopParentGoalSummary, visibleRelationships } from '@/services/workspaceService';

export default function LearnerGoals({ ctx, resources }) {
 const [draft, setDraft] = useState(null);
 const [selectedId, setSelectedId] = useState('');
 const [recipient, setRecipient] = useState('');
 const [summary, setSummary] = useState('');
 const [notice, setNotice] = useState('');
 const goals = resources.filter(resource => resource.kind === 'goal' && resource.status !== 'archived');
 const selected = goals.find(goal => goal.id === selectedId);
 const connections = visibleRelationships(ctx).filter(row => row.type === 'guardian' && row.to === ctx.personId);
 const parents = connections.filter(row => row.status === 'active' && row.scope.includes('progress-summary'));
 const parent = parents.find(row => row.from === recipient);
 function save() {
  try { saveLearnerGoal(ctx, draft); setDraft(null); setNotice('Learning goal saved privately on this device.'); }
  catch (error) { setNotice(error.message); }
 }
 function share() {
  try { shareParentGoalSummary(ctx, selected.id, recipient, summary, JSON.stringify([selected.updatedAt, selected.title, selected.body, selected.status])); setSelectedId(''); setNotice(`Goal summary shared with ${parent?.name || 'parent'}. Later edits remain private until you share again.`); }
  catch (error) { setNotice(error.message); }
 }
 function stop(parentId) {
  try { stopParentGoalSummary(ctx, selected.id, parentId); setNotice('Goal summary sharing stopped. Your goal and private notes remain saved.'); }
  catch (error) { setNotice(error.message); }
 }
 return <section className="v-card" aria-labelledby="learning-goals-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="learning-goals-title" className="text-lg font-medium">My learning goals</h2><p className="v-muted mt-2">Save what you want to work toward. Private notes stay in your learner workspace.</p></div><button className="v-button primary" onClick={() => { setNotice(''); setDraft({ title: '', body: '' }); }}>Add a goal</button></div>
  {goals.length ? goals.map(goal => <div className="v-list-row" key={goal.id}><div className="min-w-0"><h3 className="text-sm font-medium">{goal.title}</h3><p className="v-muted">{goal.body ? 'Private notes saved' : 'No private notes'} · {(goal.parentSummaries || []).length ? 'A parent summary was approved' : 'Not shared with a parent'}</p></div><div className="flex flex-wrap gap-2"><button className="v-button" onClick={() => { setNotice(''); setDraft({ id: goal.id, title: goal.title, body: goal.body }); }}>Edit</button><button className="v-button" onClick={() => { setNotice(''); setSelectedId(goal.id); setRecipient(''); setSummary(''); }}>Parent sharing</button></div></div>) : <p className="v-muted mt-4">No goal saved yet. Start with one concrete outcome you can revisit.</p>}
  {notice && <p role="status" className="v-notice mt-4">{notice}</p>}
  <Dialog open={!!draft} onOpenChange={open => { if (!open) setDraft(null); }}><DialogContent className="max-h-[85dvh] overflow-y-auto bg-white"><DialogTitle>{draft?.id ? 'Edit learning goal' : 'Add a learning goal'}</DialogTitle><DialogDescription>The goal and notes are private. Sharing a short parent summary is a separate action after saving.</DialogDescription>{draft && <><label className="block text-sm">Goal title<input className="v-field mt-2" maxLength={160} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="For example, explain how my bridge model works" /></label><label className="block text-sm">Private notes<textarea className="v-field mt-2 min-h-32" maxLength={6000} value={draft.body} onChange={event => setDraft({ ...draft, body: event.target.value })} placeholder="What will you try next?" /></label><button className="v-button primary" disabled={!draft.title.trim()} onClick={save}>Save goal</button></>}</DialogContent></Dialog>
  <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelectedId(''); }}><DialogContent className="max-h-[85dvh] overflow-y-auto bg-white"><DialogTitle>Share a learning goal with a parent</DialogTitle><DialogDescription>Select one parent and approve the exact short summary. Your private notes, projects and conversations are excluded. Active progress permission is required.</DialogDescription>{selected && <><p className="text-sm font-medium">{selected.title}</p><label className="block text-sm">Parent with active permission<select className="v-field mt-2" value={recipient} onChange={event => { setRecipient(event.target.value); setSummary((selected.parentSummaries || []).find(share => share.recipient === event.target.value)?.summary || ''); setNotice(''); }}><option value="">Choose a parent</option>{parents.map(row => <option key={row.id} value={row.from}>{row.name}</option>)}</select></label>{parent && <><label className="block text-sm">Summary to share<textarea className="v-field mt-2 min-h-28" maxLength={500} value={summary} onChange={event => setSummary(event.target.value)} placeholder="What do you want this parent to support?" /></label><p className="v-muted">{summary.length}/500 characters</p><section className="v-card bg-white" aria-label="Exact goal preview"><h3 className="text-sm font-medium">What {parent.name} will see</h3><p className="mt-3 text-sm font-medium">{selected.title}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{summary.trim() || 'Your summary appears here.'}</p></section><button className="v-button primary" disabled={!summary.trim()} onClick={share}>Confirm goal sharing</button></>}{!parents.length && <p className="v-notice">No parent currently has active progress-sharing permission. A parent can request it in Connections, and you can accept it there.</p>}{(selected.parentSummaries || []).length > 0 && <section className="border-t pt-4"><h3 className="text-sm font-medium">Previously approved summaries</h3>{selected.parentSummaries.map(item => <div className="v-list-row" key={item.recipient}><div><p className="text-sm font-medium">{connections.find(row => row.from === item.recipient)?.name || 'Previous parent connection'}</p><p className="v-muted">{parents.some(row => row.id === item.relationshipId) ? 'Currently accessible' : 'Current access inactive'} · Shared {new Date(item.sharedAt).toLocaleDateString()}</p></div><button className="v-button" onClick={() => stop(item.recipient)}>Stop sharing</button></div>)}</section>}</>}{notice && <p role="status" className="v-notice">{notice}</p>}</DialogContent></Dialog>
 </section>;
}
