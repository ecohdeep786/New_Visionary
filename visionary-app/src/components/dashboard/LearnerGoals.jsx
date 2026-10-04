import {useState} from 'react';
import {Dialog,DialogContent,DialogDescription,DialogTitle} from '@/components/ui/dialog';
import {saveLearnerGoal,shareParentGoalSummary,stopParentGoalSummary,visibleRelationships,snapshot,resourceRevision,workspaceIdentity} from '@/services/workspaceService';
import {getResourceEditorDraft,saveResourceEditorDraft,clearResourceEditorDraft} from '@/services/resourceEditorDraft';
import {assertParentSummaryHistory} from '@/services/parentSummaryIntegrity';
import {learnerGoalCopy} from '@/lib/learnerGoalCopy';
import {learningDate} from '@/lib/learningCopy';
import {downloadText} from '@/lib/downloadText';
const goalVersion=goal=>JSON.stringify([goal.updatedAt,goal.title,goal.body,goal.status]);
const editorKey=id=>id||'new:learner-goal';
const shareKey=id=>'new:learner-goal-share:'+id;
function readableGoal(goal){if(!goal||typeof goal.id!=='string'||typeof goal.title!=='string'||typeof goal.body!=='string')throw Error('Saved learning goals could not be read. Original records were kept.');}
export default function LearnerGoals(props){return props.ctx.role==='student'?<GoalWorkspace key={props.ctx.personId+':'+props.ctx.workspaceId} {...props}/>:null;}
function GoalWorkspace({ctx,locale='en'}){
 const t=learnerGoalCopy(locale);
 const [draft,setDraft]=useState(null),[base,setBase]=useState(''),[backupError,setBackupError]=useState(''),[backupBlocked,setBackupBlocked]=useState(false),[recovered,setRecovered]=useState(false);
 const [selectedId,setSelectedId]=useState(''),[recipient,setRecipient]=useState(''),[summary,setSummary]=useState(''),[summaryBase,setSummaryBase]=useState(''),[summaryBackupError,setSummaryBackupError]=useState(''),[summaryBlocked,setSummaryBlocked]=useState(false),[summaryRecovered,setSummaryRecovered]=useState(false);
 const [notice,setNotice]=useState(''),[failed,setFailed]=useState(false);const [,setRetry]=useState(0);
 let goals=[],connections=[],readError='',connectionError='',work=false;
 try{work=Boolean(workspaceIdentity(ctx).workspace.organizationId);const rows=snapshot(ctx).resources;if(!Array.isArray(rows))throw Error('Saved goals are unavailable.');goals=rows.filter(row=>row?.kind==='goal'&&row.status!=='archived');goals.forEach(readableGoal);}catch(error){readError=error.message;goals=[];}
 try{connections=visibleRelationships(ctx).filter(row=>row.type==='guardian'&&row.to===ctx.personId);}catch(error){connectionError=error.message;}
 const parents=connections.filter(row=>row.status==='active'&&row.scope.includes('progress-summary'));
 const parent=parents.find(row=>row.from===recipient),selected=goals.find(goal=>goal.id===selectedId);
 const historyError=goal=>{try{assertParentSummaryHistory(goal.parentSummaries);return '';}catch(error){return error.message;}};
 const conflict=draft?.id&&(!goals.find(goal=>goal.id===draft.id)||base!==resourceRevision(goals.find(goal=>goal.id===draft.id)));
 const sharingError=connectionError||readError||(work?'Parent summaries are available from your personal learner workspace. Work projects and goals remain here.':selected&&historyError(selected));
 const sharingConflict=selected&&summaryBase!==goalVersion(selected);
 function failure(error){setNotice(error.message);setFailed(true);}
 function openEditor(goal){
  setNotice('');setFailed(false);setBackupError('');setBackupBlocked(false);setRecovered(false);
  const fresh=goal?{id:goal.id,title:goal.title,body:goal.body}:{title:'',body:''};const revision=goal?resourceRevision(goal):'new';
  setDraft(fresh);setBase(revision);
  try{const saved=getResourceEditorDraft(ctx,editorKey(goal?.id));if(saved){if(saved.draft.id!==fresh.id||saved.draft.title.length>160||saved.draft.body.length>6000||typeof saved.baseRevision!=='string')throw Error('Goal edits could not be recovered. The original backup is retained.');setDraft(saved.draft);setBase(saved.baseRevision);setRecovered(true);}}
  catch(error){setBackupError(error.message);setBackupBlocked(true);}
 }
 function edit(next){setDraft(next);setNotice('');if(backupBlocked)return;try{saveResourceEditorDraft(ctx,editorKey(next.id),next,base);setBackupError('');}catch(error){setBackupError(error.message);}}
 function save(){try{const saved=saveLearnerGoal(ctx,draft,draft.id?base:undefined);let retained=backupBlocked;
   if(!backupBlocked)try{clearResourceEditorDraft(ctx,editorKey(draft.id));}catch{retained=true;}
   setDraft(null);setNotice(retained?'The goal was saved; its unreadable editor backup was retained.':'Learning goal saved privately on this device.');setFailed(false);setRetry(n=>n+1);return saved;
  }catch(error){failure(error);}}
 function loadSaved(){try{const fresh=draft.id?snapshot(ctx).resources.find(goal=>goal.id===draft.id):null;if(draft.id)readableGoal(fresh);clearResourceEditorDraft(ctx,editorKey(draft.id));setDraft(fresh?{id:fresh.id,title:fresh.title,body:fresh.body}:{title:'',body:''});setBase(fresh?resourceRevision(fresh):'new');setBackupBlocked(false);setBackupError('');setRecovered(false);setNotice('');setRetry(n=>n+1);}catch(error){failure(error);}}
 function exportEdits(value,name){try{downloadText(name,JSON.stringify(value,null,2),'application/json');}catch(error){failure(error);}}
 function openSharing(goal){setSelectedId(goal.id);setRecipient('');setSummary('');setSummaryBase(goalVersion(goal));setNotice('');setFailed(false);setSummaryBackupError('');setSummaryBlocked(false);setSummaryRecovered(false);
  try{const saved=getResourceEditorDraft(ctx,shareKey(goal.id));if(saved){if(typeof saved.draft.recipient!=='string'||saved.draft.body.length>500||typeof saved.baseRevision!=='string')throw Error('Summary edits could not be recovered. The original backup is retained.');setRecipient(saved.draft.recipient);setSummary(saved.draft.body);setSummaryBase(saved.baseRevision);setSummaryRecovered(true);}}
  catch(error){setSummaryBackupError(error.message);setSummaryBlocked(true);}}
 function editSummary(nextRecipient,nextSummary){setRecipient(nextRecipient);setSummary(nextSummary);setNotice('');if(summaryBlocked)return;try{saveResourceEditorDraft(ctx,shareKey(selectedId),{title:selected.title,body:nextSummary,recipient:nextRecipient},summaryBase);setSummaryBackupError('');}catch(error){setSummaryBackupError(error.message);}}
 function resetSummary(){try{const current=snapshot(ctx).resources.find(goal=>goal.id===selectedId);readableGoal(current);assertParentSummaryHistory(current.parentSummaries);clearResourceEditorDraft(ctx,shareKey(selectedId));setRecipient('');setSummary('');setSummaryBase(goalVersion(current));setSummaryBlocked(false);setSummaryBackupError('');setSummaryRecovered(false);setNotice('');setRetry(n=>n+1);}catch(error){failure(error);}}
 function share(){try{shareParentGoalSummary(ctx,selectedId,recipient,summary,summaryBase);if(!summaryBlocked)try{clearResourceEditorDraft(ctx,shareKey(selectedId));}catch{/* A successful share remains saved if editor cleanup fails. */}setSelectedId('');setNotice('Goal summary shared. Later edits remain private until you share again.');setFailed(false);setRetry(n=>n+1);}catch(error){failure(error);}}
 function stop(parentId){try{stopParentGoalSummary(ctx,selectedId,parentId);setNotice('Goal summary sharing stopped. Your goal and private notes remain saved.');setFailed(false);setRetry(n=>n+1);}catch(error){failure(error);}}
 const alert=notice?<p role={failed?'alert':'status'} lang={failed?'en':locale} className={'v-notice mt-4'+(failed?' v-error':'')}>{failed?notice:t(notice)}</p>:null;
 return <section className="v-card" aria-labelledby="learning-goals-title" lang={locale}>
  <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="learning-goals-title" className="text-lg font-medium">{t('My learning goals')}</h2><p className="v-muted mt-2">{t('Save what you want to work toward. Private notes stay in your learner workspace.')}</p></div><button className="v-button primary" disabled={Boolean(readError)} onClick={()=>openEditor()}>{t('Add a goal')}</button></div>
  {readError?<div className="v-notice v-error mt-4" role="alert"><p>{t('Goal records are unavailable. Original records and current edits are retained.')}</p><button className="v-button mt-3" onClick={()=>setRetry(n=>n+1)}>{t('Retry goals')}</button></div>:goals.length?goals.map(goal=><div className="v-list-row" key={goal.id}><div className="min-w-0"><h3 className="text-sm font-medium">{goal.title}</h3><p className="v-muted">{t(goal.body?'Private notes saved':'No private notes')} · {t(historyError(goal)?'Summary history unavailable':goal.parentSummaries?.length?'A parent summary was approved':'Not shared with a parent')}</p></div><div className="flex flex-wrap gap-2"><button className="v-button" onClick={()=>openEditor(goal)}>{t('Edit')}<span className="sr-only">: {goal.title}</span></button><button className="v-button disabled:opacity-50" disabled={work} onClick={()=>openSharing(goal)}>{t('Parent sharing')}<span className="sr-only">: {goal.title}</span></button></div></div>):<p className="v-muted mt-4">{t('No goal saved yet. Start with one concrete outcome you can revisit.')}</p>}
  {work&&<p className="v-notice mt-4">{t('Parent summaries are available from your personal learner workspace. Work projects and goals remain here.')}</p>}
  {!draft&&!selectedId&&alert}
  <Dialog open={!!draft} onOpenChange={open=>{if(!open)setDraft(null);}}><DialogContent lang={locale} className="max-h-[85dvh] overflow-y-auto bg-white"><DialogTitle>{t(draft?.id?'Edit learning goal':'Add a learning goal')}</DialogTitle><DialogDescription>{t('The goal and notes are private. Sharing a short parent summary is a separate action after saving.')}</DialogDescription>{draft&&<>
   {recovered&&<p className="v-notice" role="status">{t('Unsaved goal edits recovered. Save to keep them.')}</p>}
   {backupError&&<p className="v-notice v-error" role="alert" lang="en">{backupError}</p>}
   {conflict&&<p className="v-notice" role="status">{t('A newer goal is saved. Your edits remain here. Export them before loading the saved goal.')}</p>}
   <label className="block text-sm">{t('Goal title')}<input aria-label={t('Goal title')} className="v-field mt-2" maxLength={160} value={draft.title} onChange={event=>edit({...draft,title:event.target.value})} placeholder={t('For example, explain how my bridge model works')}/></label>
   <label className="block text-sm">{t('Private notes')}<textarea aria-label={t('Private notes')} className="v-field mt-2 min-h-32" maxLength={6000} value={draft.body} onChange={event=>edit({...draft,body:event.target.value})} placeholder={t('What will you try next?')}/></label>
   <div className="flex flex-wrap gap-3"><button className="v-button primary" disabled={!draft.title.trim()||Boolean(conflict)||Boolean(readError)} onClick={save}>{t('Save goal')}</button><button className="v-button" onClick={()=>exportEdits(draft,'learning-goal-edits.json')}>{t('Export goal edits')}</button><button className="v-button" onClick={loadSaved}>{t('Load saved goal and discard edits')}</button></div>{alert}
  </>}</DialogContent></Dialog>
  <Dialog open={!!selectedId} onOpenChange={open=>{if(!open)setSelectedId('');}}><DialogContent lang={locale} className="max-h-[85dvh] overflow-y-auto bg-white"><DialogTitle>{t('Share a learning goal with a parent')}</DialogTitle><DialogDescription>{t('Select one parent and approve the exact short summary. Your private notes, projects and conversations are excluded. Active progress permission is required.')}</DialogDescription>
   {sharingError||!selected?<div className="v-notice v-error" role="alert"><p>{t('Saved summaries are unavailable. Original records and current edits are retained.')}</p><button className="v-button mt-3" onClick={()=>setRetry(n=>n+1)}>{t('Retry sharing')}</button></div>:<>
    <p className="text-sm font-medium">{selected.title}</p>
    {summaryRecovered&&<p className="v-notice" role="status">{t('Unsaved summary recovered. Review the exact preview before sharing.')}</p>}
    {summaryBackupError&&<p className="v-notice v-error" role="alert" lang="en">{summaryBackupError}</p>}
    {sharingConflict&&<p className="v-notice" role="status">{t('A newer goal is saved. Your edits remain here. Export them before loading the saved goal.')}</p>}
    <label className="block text-sm">{t('Parent with active permission')}<select aria-label={t('Parent with active permission')} className="v-field mt-2" value={recipient} onChange={event=>editSummary(event.target.value,selected.parentSummaries?.find(row=>row.recipient===event.target.value)?.summary||'')}><option value="">{t('Choose a parent')}</option>{recipient&&!parent&&<option value={recipient}>{t('Previous parent connection')}</option>}{parents.map(row=><option key={row.id} value={row.from}>{row.name}</option>)}</select></label>
    {parent&&<><label className="block text-sm">{t('Summary to share')}<textarea aria-label={t('Summary to share')} className="v-field mt-2 min-h-28" maxLength={500} value={summary} onChange={event=>editSummary(recipient,event.target.value)} placeholder={t('What do you want this parent to support?')}/></label><p className="v-muted">{t('{count}/500 characters',{count:summary.length})}</p><section className="v-card bg-white" aria-label={t('Exact goal preview')}><h3 className="text-sm font-medium">{t('What {name} will see',{name:parent.name})}</h3><p className="mt-3 text-sm font-medium">{selected.title}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{summary.trim()||t('Your summary appears here.')}</p></section><button className="v-button primary" disabled={!summary.trim()||Boolean(sharingConflict)} onClick={share}>{t('Confirm goal sharing')}</button></>}
    {!parents.length&&<p className="v-notice">{t('No parent currently has active progress-sharing permission. A parent can request it in Connections, and you can accept it there.')}</p>}
    {selected.parentSummaries?.length>0&&<section className="border-t pt-4"><h3 className="text-sm font-medium">{t('Previously approved summaries')}</h3>{selected.parentSummaries.map(item=><div className="v-list-row" key={item.recipient}><div><p className="text-sm font-medium">{connections.find(row=>row.from===item.recipient)?.name||t('Previous parent connection')}</p><p className="v-muted">{t(parents.some(row=>row.id===item.relationshipId)?'Currently accessible':'Current access inactive')} · {t('Shared')} {learningDate(item.sharedAt,locale)}</p></div><button className="v-button" onClick={()=>stop(item.recipient)}>{t('Stop sharing')}</button></div>)}</section>}
   </>}
   <div className="flex flex-wrap gap-3"><button className="v-button" onClick={()=>exportEdits({recipient,summary},'learning-goal-summary-edits.json')}>{t('Export summary edits')}</button><button className="v-button" disabled={Boolean(sharingError)||!selected} onClick={resetSummary}>{t('Load saved goal and discard edits')}</button></div>{alert}
  </DialogContent></Dialog>
 </section>;
}
