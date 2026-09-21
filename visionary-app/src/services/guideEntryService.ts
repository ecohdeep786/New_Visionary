import type { AskContext, RequestContext, Role } from '../domain/workspace.ts';
import { getJourney } from './journeys.ts';
import { eligibleJourneys } from './journeyEligibility.ts';
import { newConversation, selectConversation, snapshot, startJourney, updateConversation, updateSession, workspaceIdentity } from './workspaceService.ts';

export const defaultAskContext: AskContext = {intent:'understand',source:'topic',material:''};
export function askIntents(role: Role) {
  const labels: Record<Role,string[]> = {
    student:['Understand','Solve with guidance','Check my attempt','Plan','Build'],
    professional:['Understand','Work through a problem','Review my attempt','Plan a next step','Build'],
    teacher:['Explain an idea','Guide a learner','Review teaching work','Plan a lesson','Build a resource'],
    parent:['Understand a report','Support this week','Review a question','Plan support','Build together'],
    organization:['Understand a report','Work through a problem','Review an outline','Plan next steps','Build a resource'],
  };
  return (['understand','solve','check','plan','build'] as const).map((id,index)=>({id,label:labels[role][index]!}));
}
export function saveAskContext(ctx: RequestContext, conversationId: string, value: AskContext) {
  if (!askIntents(ctx.role).some(i=>i.id===value.intent) || !['topic','material','outside'].includes(value.source) || value.material.length>6000) throw new Error('Choose a supported intent and keep pasted material under 6,000 characters.');
  updateConversation(ctx,conversationId,{ask:{...value}});
}
export function suggestedJourneys(ctx: RequestContext) {
  const {person}=workspaceIdentity(ctx);
  return eligibleJourneys(ctx.role,person.ageBand,ctx.locale);
}

/** Persist first: callers apply this complete UI snapshot only after a successful write. */
export function selectGuideConversation(ctx: RequestContext, conversationId: string|null) {
  const conversation=conversationId?snapshot(ctx).conversations.find(c=>c.id===conversationId):undefined;
  if(conversationId&&!conversation)throw new Error('Conversation not found.');
  selectConversation(ctx,conversationId);
  return {selected:conversationId,input:conversation?.draft||'',canvasPath:conversation?.canvasPath||'',pane:conversation?.sessionId||conversation?.canvasPath?'activity':'conversation'};
}
/** Validate before mutating, and target the exact session rather than the first matching topic. */
export function openGuideEntry(ctx: RequestContext, entry: {sessionId?:string|null;journeyId?:string|null;practice?:boolean}) {
  const data=snapshot(ctx);
  let previous=entry.sessionId ? data.sessions.find(s=>s.id===entry.sessionId) : [...data.sessions].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).find(s=>s.journeyId===entry.journeyId);
  if(entry.sessionId&&!previous)throw new Error('This activity is unavailable in this workspace. Your saved work has not changed.');
  const journeyId=previous?.journeyId||entry.journeyId;
  if(!journeyId)throw new Error('Choose an activity first.');
  getJourney(journeyId);
  const conversation=previous ? data.conversations.find(c=>c.id===previous.conversationId) : newConversation(ctx);
  if(!conversation)throw new Error('This activity’s conversation is unavailable. Your saved work has not changed.');
  const session=startJourney(ctx,conversation.id,journeyId);
  if(entry.practice&&!entry.sessionId)updateSession(ctx,session.id,{stage:'practicing',position:0});
  selectConversation(ctx,conversation.id);
  return {conversation,session};
}
