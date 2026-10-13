import {assertOrganizationContentRecord} from './organizationContentIntegrity.ts';
import {onboardingLearningContext} from '../lib/onboardingLearningContext.js';
import {assertPortfolioReviewHistory} from './portfolioReviewIntegrity.ts';
import {assertParentSummaryHistory} from './parentSummaryIntegrity.ts';
import type { Artifact, Conversation, Database, Evidence, GuideBlock, Locale, MasteryStage, Message, OrganizationSettings, Person, Plan, RequestContext, Resource, Role, Session, Stage, Workspace, WorkspaceData } from '../domain/workspace.ts';
import { getJourney, matchJourney } from './journeys.ts';
import { eligibleJourneys } from './journeyEligibility.ts';
import {legacyRelationships,saveLegacyRelationship,legacyProgressSummary} from './legacyConnections.ts';
import {organizationPolicy,organizationProfiles} from './organizationPolicy.js';
import type {CurriculumTemplate} from '../domain/curriculumTemplate.ts';
import {assertCurriculumTemplate,curriculumObjectiveSnapshot} from './curriculumTemplate.ts';
import {connectionStatus} from '../lib/connectionAvailability.js';
import {assignmentAcceptsResponses} from '../lib/assignmentAvailability.js';
import {assertLessonObjective} from './lessonObjective.ts';

const KEY = 'visionary_workspace_v2';
export function reportDays(days:number):7|30{if(days!==7&&days!==30)throw new Error('Choose a supported report period.');return days;}
export const roleNames: Record<Role, string> = {student:'Learner',teacher:'Teacher',parent:'Parent',professional:'Professional',organization:'Organization admin'};
export const plans: Plan[] = [{id:'Free',price:0,profiles:1,provisional:false},{id:'Premium',price:299,profiles:1,provisional:false},{id:'Family',price:499,profiles:6,provisional:true}];
export const scenarioPersonas = [
 ['minor-cbse','Aarav · CBSE learner','student','minor'],['bengali','Maya · West Bengal learner','student','minor'],['exam','Riya · Exam preparation','student','adult'],['college','Kabir · Higher education','student','adult'],['adult','Asha · Independent learner','student','adult'],['teacher','Dev · Independent teacher','teacher','adult'],['school-teacher','Nila · Organization teacher','teacher','adult'],['parent','Anika · Parent of two','parent','adult'],['professional','Sam · Job-seeking professional','professional','adult'],['employee','Ira · Employer-sponsored','professional','adult'],['school-admin','School administrator','organization','adult'],['company-admin','Company learning administrator','organization','adult'],
] as const;
let clock = () => new Date();
let latency = 180;
let fault: 'none' | 'offline' | 'error' = 'none';
export function configureMock(options: { now?: () => Date; latency?: number; fault?: typeof fault }) { if(options.now) clock=options.now; if(options.latency!==undefined) latency=options.latency; if(options.fault) fault=options.fault; }
export function workspaceNow() { return clock(); }
const now = () => clock().toISOString();
const id = () => crypto.randomUUID();
function emptyData(): WorkspaceData { return {conversations:[],sessions:[],artifacts:[],resources:[],notifications:[],audit:[],preferences:{locale:'en',interfaceLocale:'en',notificationLocale:'en',bilingual:false,lowBandwidth:false,notifications:'weekly',memory:true,voice:true,agiAnimation:'girl'},subscription:{plan:'Free',state:'active',invoices:[],usage:0,usageDay:now().slice(0,10)},legacyImported:false}; }
function read(): Database { const raw=localStorage.getItem(KEY); if(!raw) return {version:2,people:[],workspaces:[],active:{},data:{},relationships:[]}; try { const result=JSON.parse(raw); if(result.version!==2) throw new Error(); return result; } catch { throw new Error('Workspace data could not be read. Your previous records have not been deleted.'); } }
function write(db: Database) { try { localStorage.setItem(KEY,JSON.stringify(db)); } catch { throw new Error('Your changes could not be saved on this device. Free browser storage and try again.'); } if(typeof window!=='undefined') window.dispatchEvent(new CustomEvent('visionary:v2-change')); }
function record(data: WorkspaceData, action: string, target: string, actor?:string) { data.audit.unshift({id:id(),action,target,at:now(),...(actor?{actor}:{})}); }
function allRelationships(db:Database){return [...db.relationships,...legacyRelationships(db)];}
function access(db: Database, ctx: RequestContext) { const workspace=db.workspaces.find(w=>w.id===ctx.workspaceId && w.personId===ctx.personId && w.role===ctx.role); if(!workspace) throw new Error('You do not have access to this workspace.');if(workspace.organizationId){const person=db.people.find(p=>p.id===ctx.personId);if(!readOrganizationInviteRows().some(m=>m.email===person?.email&&m.organization_email===workspace.organizationId&&m.role===workspace.role&&inviteStatus(m)==='active'))throw new Error('This organization connection is no longer active. Your personal workspace remains available.');} return db.data[workspace.id]!; }
async function wait(ctx?: RequestContext) { if(ctx?.signal?.aborted) throw new DOMException('Cancelled','AbortError'); await new Promise<void>((resolve,reject)=>{ const abort=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'));}; const timer=setTimeout(()=>{ctx?.signal?.removeEventListener('abort',abort);resolve();},latency);ctx?.signal?.addEventListener('abort',abort,{once:true}); }); if(fault==='offline') throw new Error('Offline demo: saved work is still available. Change the demo condition to retry.'); if(fault==='error') throw new Error('The demo service could not complete this request. Your saved work is unchanged.'); }

function addWorkspace(db: Database, person: Person, role: Role): Workspace { const existing=db.workspaces.find(w=>w.personId===person.id&&w.role===role&&!w.organizationId); if(existing)return existing; const workspace={id:`${person.id}:${role}`,personId:person.id,role,name:role==='organization'?'My organization':roleNames[role],lastPath:'/dashboard/home'};db.workspaces.push(workspace);db.data[workspace.id]=emptyData();const previous=db.workspaces.find(w=>w.personId===person.id&&w.id!==workspace.id);if(previous)db.data[workspace.id]!.subscription={...structuredClone(db.data[previous.id]!.subscription),usage:0,usageDay:now().slice(0,10)};return workspace; }
export function bootstrapPerson(user: {id:string;email:string;full_name?:string;identity?:string;education_stage?:string;preferred_language?:string;medium?:string;age_band?:Person['ageBand'];board?:string;grade_level?:string;subjects?:string[];target_exam?:string;institution_name?:string;institution_type?:string;degree_program?:string;semester?:string;preferences?:{learning_language?:string}}) {
 const db=read();let person=db.people.find(p=>p.id===user.id);const rawRole=user.education_stage==='professional'?'professional':user.identity;const role:Role=rawRole && rawRole in roleNames?rawRole as Role:'student';
 const learningContext=onboardingLearningContext(user);
 if(!person){person={id:user.id,email:user.email,name:user.full_name||user.email.split('@')[0]||'Learner',ageBand:user.age_band||'unknown',roles:[role],learningContext};db.people.push(person);const workspace=addWorkspace(db,person,role);db.active[person.id]=workspace.id;const data=db.data[workspace.id]!;const lang=user.preferences?.learning_language||user.preferred_language||user.medium;data.preferences.locale=lang==='Hindi'?'hi':lang==='Bengali'?'bn':'en';
 // Import only owned records. Original stores are intentionally untouched.
 for(const name of ['Project','Question']) {let rows:Record<string,unknown>[]=[];try{rows=JSON.parse(localStorage.getItem(`visionary_entity_${name}`)||'[]');}catch{continue;}for(const row of rows.filter(r=>(r.owner_email||r.student_email)===user.email)){if(name==='Project')data.artifacts.push({id:`legacy-${String(row.id)}`,title:String(row.title||'Saved project'),body:String(row.notes||''),milestones:[false,false,false],visibility:'private',sharedWith:[],versions:[],status:'in-progress',updatedAt:now()});else data.conversations.push({id:`legacy-${String(row.id)}`,title:String(row.question||'Saved question').slice(0,70),messages:[],draft:String(row.question||''),updatedAt:now(),useForPersonalization:false});}}data.legacyImported=true;write(db);
 }
 const memberships=readOrganizationInviteRows();
 const accepted=memberships.filter(m=>m.email===person.email&&inviteStatus(m)==='active'&&person.roles.includes(m.role));let changed=false;
 // Onboarding seeds the stage once. A later sign-in still carries the original
 // onboarding fields, but must not roll back a teacher/learner transition.
 if(learningContext&&!person.learningContext){person.learningContext=learningContext;changed=true;}
 for(const m of accepted){const workspaceId=`${person.id}:${m.role}:org:${m.organization_email}`;if(!db.workspaces.some(w=>w.id===workspaceId)){db.workspaces.push({id:workspaceId,personId:person.id,role:m.role,name:`${m.organization_name||'Connected organization'} · ${roleNames[m.role]}`,organizationId:m.organization_email,lastPath:'/dashboard/home'});db.data[workspaceId]=emptyData();const personal=db.data[`${person.id}:${m.role}`];if(personal){db.data[workspaceId]!.preferences=structuredClone(personal.preferences);db.data[workspaceId]!.subscription={...structuredClone(personal.subscription),usage:0,usageDay:now().slice(0,10)};}changed=true;}}
 const available=db.workspaces.filter(w=>w.personId===person.id&&(!w.organizationId||accepted.some(m=>m.organization_email===w.organizationId&&m.role===w.role)));
 if(!available.some(w=>w.id===db.active[person.id])){db.active[person.id]=available[0]!.id;changed=true;}
 if(changed)write(db);
 return {person,workspaces:available,active:db.active[person.id]};
}
export function addRole(personId:string,role:Role) {if(typeof role!=='string'||!Object.prototype.hasOwnProperty.call(roleNames,role))throw new Error('Choose an available workspace role.');const db=read();const person=db.people.find(p=>p.id===personId);if(!person)throw new Error('Sign in first.');if(person.ageBand!=='adult'&&role!=='student')throw new Error('An adult age confirmation is required before adding this role.');const existing=db.workspaces.find(w=>w.personId===personId&&w.role===role&&!w.organizationId);if(existing&&person.roles.includes(role))return structuredClone(existing);if(!person.roles.includes(role))person.roles.push(role);const workspace=addWorkspace(db,person,role);write(db);return workspace;}
export function setAgeBand(personId:string,ageBand:Person['ageBand']){const db=read();const person=db.people.find(p=>p.id===personId);if(!person)throw new Error('Account not found.');person.ageBand=ageBand;write(db);}
export function selectWorkspace(personId:string,workspaceId:string) {const db=read();const workspace=db.workspaces.find(w=>w.id===workspaceId&&w.personId===personId);if(!workspace)throw new Error('Workspace not available.');access(db,{personId,workspaceId,role:workspace.role,locale:'en'});db.active[personId]=workspaceId;write(db);}
/** Minimal stage facts for an authorized teacher view of one learner (Gate 5 rules
 * apply in the caller). Returns only age band and the stage mapping — nothing private. */
export function stageProfileByEmail(email: string): { ageBand: Person['ageBand'] | 'unknown'; classLevel?: string; stage?: string } | null {
 const db = read(); const person = db.people.find(p => p.email === email);
 if (!person) return null;
 return { ageBand: person.ageBand, classLevel: person.learningContext?.classLevel, stage: person.learningContext?.stage };
}

/** Part W: the learner's active stage mapping, written only through services. */
type StageProfileInput = { board?: string; classLevel?: string; subjects?: string[]; stage?: string; institution?:string; exam?: string };
function applyStageProfile(db: Database, ctx: RequestContext, profile: StageProfileInput, options?: { replace?: boolean }): void {
 const person = db.people.find(p => p.id === ctx.personId); if (!person) throw new Error('Sign in first.');
 const clean = {
  board: profile.board === undefined ? undefined : String(profile.board).trim().slice(0, 100) || undefined,
  classLevel: profile.classLevel === undefined ? undefined : String(profile.classLevel).trim().slice(0, 100) || undefined,
  subjects: profile.subjects === undefined ? undefined : profile.subjects.map(s => String(s).trim().slice(0, 100)).filter(Boolean),
  stage: profile.stage === undefined ? undefined : String(profile.stage).trim().slice(0, 40) || undefined,
  institution:profile.institution===undefined?undefined:String(profile.institution).trim().slice(0,100)||undefined,
  exam: profile.exam === undefined ? undefined : String(profile.exam).trim().slice(0, 60) || undefined,
 };
 const current = person.learningContext || { subjects: [] };
 // Replace mode (Part W restore) writes the exact mapping: absent fields are removed.
 person.learningContext = options?.replace
  ? { board: clean.board, classLevel: clean.classLevel, subjects: clean.subjects || [], stage: clean.stage, exam: clean.exam,institution:clean.institution }
  : { board: clean.board ?? current.board, classLevel: clean.classLevel ?? current.classLevel, subjects: clean.subjects && clean.subjects.length ? clean.subjects : current.subjects || [], stage: clean.stage ?? current.stage, exam: clean.exam ?? current.exam,institution:clean.institution??current.institution };
 const data = access(db, ctx); record(data, 'Stage profile updated', ctx.workspaceId);
}
export function updateStageProfile(ctx: RequestContext, profile: StageProfileInput, options?: { replace?: boolean }): void {
 const db = read(); applyStageProfile(db, ctx, profile, options); write(db);
}
/** One local workspace write for a teacher's prevalidated class promotion. */
export function updateStageProfilesBatch(changes: Array<{ ctx: RequestContext; profile: StageProfileInput }>): void {
 const db = read();
 for (const change of changes) applyStageProfile(db, change.ctx, change.profile, { replace: true });
 write(db);
}

export function saveLastPath(ctx:RequestContext,path:string){if(!path.startsWith('/dashboard/'))return;const db=read();access(db,ctx);const workspace=db.workspaces.find(w=>w.id===ctx.workspaceId)!;if(workspace.lastPath===path)return;workspace.lastPath=path;write(db);}
export function snapshot(ctx:RequestContext):WorkspaceData {const db=read();const data=structuredClone(access(db,ctx));data.subscription=effectiveSubscription(db,ctx);// Workspaces saved before the voice seam default to the founder setting: voice on.
if(ctx.role==='organization'){const policy=organizationAccess(ctx);data.resources=policy.permissions.includes('academic')?structuredClone(resourceData(db,ctx).resources):[];}
data.preferences.voice??=true;data.preferences.agiAnimation = data.preferences.agiAnimation==='boy'?'boy':'girl';return data;}
export function workspaceIdentity(ctx:RequestContext){const db=read();access(db,ctx);return {person:structuredClone(db.people.find(p=>p.id===ctx.personId)!),workspace:structuredClone(db.workspaces.find(w=>w.id===ctx.workspaceId)!)};}
function effectiveSubscription(db:Database,ctx:RequestContext){
 const own=access(db,ctx);const sub=structuredClone(own.subscription);const day=now().slice(0,10);
 sub.usage=db.workspaces.filter(w=>w.personId===ctx.personId).reduce((n,w)=>n+(db.data[w.id]?.subscription.usageDay===day?db.data[w.id]!.subscription.usage:0),0);sub.usageDay=day;
 if(sub.state==='cancelled'&&sub.renewsAt&&new Date(sub.renewsAt)<=clock()){sub.plan='Free';sub.state='active';delete sub.renewsAt;}
 if(sub.plan==='Free'&&db.familyInvitations?.some(i=>i.member===ctx.personId&&i.status==='active'&&hasFamilyPlan(db,i.owner)))sub.plan='Family';
 return sub;
}
function hasFamilyPlan(db:Database,personId:string){return db.workspaces.some(w=>{if(w.personId!==personId)return false;const sub=db.data[w.id]?.subscription;return sub?.plan==='Family'&&!(sub.state==='cancelled'&&sub.renewsAt&&new Date(sub.renewsAt)<=clock());});}
export function familyInvitations(ctx:RequestContext){const db=read();access(db,ctx);return (db.familyInvitations||[]).filter(i=>i.owner===ctx.personId||i.member===ctx.personId).map(i=>({...i,name:db.people.find(p=>p.id===(i.owner===ctx.personId?i.member:i.owner))?.name||'Family member',expired:i.status==='pending'&&connectionStatus(i,clock().getTime())==='expired',unavailable:i.status==='pending'&&(i.expiresAt==null||connectionStatus(i,clock().getTime())==='unavailable')}));}
export function inviteFamily(ctx:RequestContext,email:string){
 const db=read();const data=access(db,ctx);if(!hasFamilyPlan(db,ctx.personId))throw new Error('An owned Family plan is required to invite members.');
 if(db.people.find(p=>p.id===ctx.personId)?.ageBand!=='adult')throw new Error('An adult account is required to manage billing.');
 const member=db.people.find(p=>p.email.toLowerCase()===email.trim().toLowerCase());if(!member||member.id===ctx.personId)throw new Error('Choose another local demo account.');
 const invitations=db.familyInvitations||=[];const current=invitations.filter(i=>i.owner===ctx.personId&&(i.status==='active'||i.status==='pending'&&new Date(i.expiresAt)>clock()));
 if(current.some(i=>i.member===member.id))throw new Error('This account already has an invitation or membership.');if(current.length>=5)throw new Error('This demo Family plan supports five invited members plus its owner.');
 invitations.push({id:id(),owner:ctx.personId,member:member.id,status:'pending',expiresAt:new Date(clock().getTime()+7*86400000).toISOString()});record(data,'Family billing invitation created',member.id);write(db);
}
export function changeFamilyInvitation(ctx:RequestContext,invitationId:string,status:'active'|'declined'|'revoked'){
 const db=read();const data=access(db,ctx);const i=db.familyInvitations?.find(i=>i.id===invitationId&&(i.owner===ctx.personId||i.member===ctx.personId));if(!i)throw new Error('Invitation not found.');
 if(status!=='revoked'&&(i.member!==ctx.personId||i.status!=='pending'))throw new Error('Only the invited member can answer a pending request.');
 if(status==='active'&&(i.expiresAt==null||connectionStatus(i,clock().getTime())!=='pending'||!hasFamilyPlan(db,i.owner)))throw new Error('This invitation expiry cannot be verified, has expired, or its Family plan is unavailable.');
 if(status==='active'&&db.familyInvitations?.some(other=>other.id!==i.id&&other.member===ctx.personId&&other.status==='active'))throw new Error('Leave your existing billing family before joining another.');
 i.status=status;record(data,`Family billing ${status}`,i.id);write(db);
}
export async function getWorkspace(ctx:RequestContext){await wait(ctx);return snapshot(ctx);}
export function updatePreferences(ctx:RequestContext,patch:Partial<WorkspaceData['preferences']>){const db=read();const data=access(db,ctx);data.preferences={...data.preferences,...patch};record(data,'Preferences updated',ctx.workspaceId);write(db);}
export function newConversation(ctx:RequestContext,title='A new discovery') {const db=read();const data=access(db,ctx);const conversation:Conversation={id:id(),title,messages:[],draft:'',updatedAt:now(),useForPersonalization:false};data.conversations.unshift(conversation);data.activeConversationId=conversation.id;write(db);return conversation;}
export function appendTeachingTurn(ctx:RequestContext,conversationId:string,input:string,response:string,locale:Locale,status:'ready'|'not_connected'|'blocked') {
 if(ctx.signal?.aborted)throw new DOMException('Cancelled','AbortError');
 const db=read();const c=access(db,ctx).conversations.find(c=>c.id===conversationId);if(!c)throw new Error('Conversation not found.');
 c.messages.push({id:id(),role:'user',blocks:[{type:'text',text:input}],at:now()},{id:id(),role:'guide',blocks:[{type:'text',text:response,locale}],at:now(),status});
 c.draft='';c.updatedAt=now();if(c.messages.length===2)c.title=input.slice(0,64);write(db);
}
/** Mentor-companion turns append authored action/text blocks straight from saved records. */
export function appendGuideBlocks(ctx:RequestContext,conversationId:string,input:string,blocks:GuideBlock[],status:Message['status']) {
 if(ctx.signal?.aborted)throw new DOMException('Cancelled','AbortError');
 const db=read();const c=access(db,ctx).conversations.find(c=>c.id===conversationId);if(!c)throw new Error('Conversation not found.');
 c.messages.push({id:id(),role:'user',blocks:[{type:'text',text:input}],at:now()},{id:id(),role:'guide',blocks:structuredClone(blocks),at:now(),status});
 c.draft='';c.updatedAt=now();if(c.messages.length===2)c.title=input.slice(0,64);write(db);
}
export function updateConversation(ctx:RequestContext,conversationId:string,patch:Partial<Pick<Conversation,'title'|'draft'|'useForPersonalization'|'canvasPath'|'ask'>>) {const db=read();const c=access(db,ctx).conversations.find(c=>c.id===conversationId);if(!c)throw new Error('Conversation not found.');Object.assign(c,patch);write(db);}
export function removeConversation(ctx:RequestContext,conversationId:string){const db=read();const data=access(db,ctx);if(data.activeConversationId===conversationId)delete data.activeConversationId;data.conversations=data.conversations.filter(c=>c.id!==conversationId);data.sessions=data.sessions.filter(s=>s.conversationId!==conversationId);write(db);}
export const roleActions: Record<Role,{label:string;path:string}[]>={student:[{label:'Explore a learning journey',path:'/dashboard/learn'},{label:'Review my progress',path:'/dashboard/progress'}],professional:[{label:'Plan my next career step',path:'/dashboard/career'},{label:'Open my portfolio',path:'/dashboard/build'}],teacher:[{label:'Prepare a lesson',path:'/dashboard/prepare'},{label:'Review classwork',path:'/dashboard/classes'},{label:'Explore learner evidence',path:'/dashboard/learners'}],parent:[{label:'Understand my child’s week',path:'/dashboard/reports'},{label:'Manage family connections',path:'/dashboard/child'}],organization:[{label:'Continue organization setup',path:'/dashboard/cohorts'},{label:'Manage people',path:'/dashboard/people'},{label:'Review organization insights',path:'/dashboard/analytics'}]};
export async function sendMessage(ctx:RequestContext,conversationId:string,text:string){
 if(!text.trim())return;await wait(ctx);const db=read();const data=access(db,ctx);const conversation=data.conversations.find(c=>c.id===conversationId);if(!conversation)throw new Error('Conversation not found.');
 const entitlement=effectiveSubscription(db,ctx);const day=now().slice(0,10);if(data.subscription.usageDay!==day){data.subscription.usageDay=day;data.subscription.usage=0;}if(entitlement.plan==='Free'&&entitlement.usage>=10)throw new Error('You’ve used the 10 guided turns in this daily demo. Saved lessons, practice and assignments remain available.');
 const active=data.sessions.find(s=>s.id===conversation.sessionId);const journeyId=matchJourney(text)||active?.journeyId;const selectedAction=roleActions[ctx.role].find(a=>text.toLowerCase().includes(a.label.toLowerCase()));let blocks:GuideBlock[];
 const eligible=eligibleJourneys(ctx.role,db.people.find(p=>p.id===ctx.personId)!.ageBand,ctx.locale);
 if(selectedAction)blocks=[{type:'text',locale:'en',text:'Let’s work through this together. Open the workspace to review and make changes—you remain in control.'},{type:'action',locale:'en',...selectedAction}];
 else if(journeyId&&eligible.some(j=>j.id===journeyId)){const journey=getJourney(journeyId,ctx.locale);blocks=[...(!matchJourney(text)?[{type:'text' as const,locale:'en' as const,text:'Here is the prepared explanation for your active activity. This demo cannot interpret an arbitrary question.'}]:[]),{type:'text',locale:ctx.locale,text:journey.explanation},{type:'activity',locale:ctx.locale,journeyId,label:journey.title}];if(active)active.interrupted=true;}
 else blocks=[{type:'text',locale:'en',text:'This is a curated demonstration, not a live intelligence service. Your question will stay in this conversation. You can use the available prepared activities or open your workspace tools.'},...eligible.map(j=>({type:'activity' as const,locale:ctx.locale,journeyId:j.id,label:j.title}))];
 conversation.messages.push({id:id(),role:'user',blocks:[{type:'text',text:text.trim()}],at:now()},{id:id(),role:'guide',blocks,at:now()});conversation.draft='';conversation.title=conversation.messages.length===2?text.slice(0,64):conversation.title;conversation.updatedAt=now();data.subscription.usage++;write(db);
}
export function startJourney(ctx:RequestContext,conversationId:string,journeyId:string){getJourney(journeyId);const db=read();const data=access(db,ctx);const conversation=data.conversations.find(c=>c.id===conversationId);if(!conversation)throw new Error('Conversation not found.');let session=data.sessions.find(s=>s.conversationId===conversationId&&s.journeyId===journeyId);if(!session){session={id:id(),journeyId,conversationId,stage:'diagnosing',position:0,locale:ctx.locale,representation:data.preferences.lowBandwidth?'text':'interactive',answers:{},canvas:{size:3,rotation:25},notes:'',evidence:[],updatedAt:now(),interrupted:false};data.sessions.push(session);}session.interrupted=false;conversation.sessionId=session.id;delete conversation.canvasPath;if(!conversation.messages.length){conversation.title=getJourney(journeyId,ctx.locale).title;conversation.messages.push({id:id(),role:'guide',at:now(),blocks:[{type:'text',locale:ctx.locale,text:ctx.locale==='hi'?'हम इस विचार को चरण-दर-चरण समझेंगे। गतिविधि शुरू करें और जब चाहें यहाँ प्रश्न पूछें।':ctx.locale==='bn'?'আমরা ধাপে ধাপে বিষয়টি বুঝব। কার্যকলাপ শুরু করুন এবং প্রয়োজনে এখানে প্রশ্ন করুন।':'Let’s explore this idea step by step. Start in the activity, and ask here whenever you want to revisit the explanation.'}]});}write(db);return session;}
export function updateSession(ctx:RequestContext,sessionId:string,patch:Partial<Pick<Session,'stage'|'position'|'locale'|'representation'|'canvas'|'notes'|'confidence'|'interrupted'>>) {const db=read();const s=access(db,ctx).sessions.find(s=>s.id===sessionId);if(!s)throw new Error('Session not found.');Object.assign(s,patch,{updatedAt:now()});write(db);}
export function answerQuestion(ctx:RequestContext,sessionId:string,answer:string){
 const db=read();const data=access(db,ctx);const s=data.sessions.find(s=>s.id===sessionId);if(!s)throw new Error('Session not found.');
 if(!['checking','practicing'].includes(s.stage))throw new Error('Open a check or practice question first.');
 const j=getJourney(s.journeyId,s.locale);const q=j.questions[s.position];if(!q)throw new Error('Question not found.');
 if(!/^[0-9]+$/.test(answer)||!q.options[Number(answer)])throw new Error('Choose one of the available answers.');
 const round=s.reviewRound||0;const answerKey=`${s.stage}:${s.position}:${round}`;s.answers[answerKey]=answer;
 const correct=Number(answer)===q.answer;
 const first=s.evidence.find(e=>e.kind==='check'||e.kind==='practice');
 const delayed=Boolean(round&&first&&clock().getTime()-new Date(first.at).getTime()>=86400000);
 const kind=s.stage==='practicing'?(delayed?'retrieval':'practice'):'check';
 const key=`${s.id}:${kind}:${s.position}:${round}`;
 if(!s.evidence.some(e=>e.id===key))s.evidence.push({id:key,objectiveId:s.journeyId,kind,correct:correct?1:0,total:1,at:now(),delayed});
 s.updatedAt=now();write(db);return {correct,explanation:q.explanation};
}
export function beginReview(ctx:RequestContext,sessionId:string){
 const db=read();const s=access(db,ctx).sessions.find(s=>s.id===sessionId);if(!s)throw new Error('Session not found.');
 s.reviewRound=(s.reviewRound||0)+1;s.reviewStartedAt=now();s.stage='practicing';s.position=0;s.updatedAt=now();write(db);
}
export function mastery(evidence:Evidence[],started=false,at=new Date()):MasteryStage {if(!evidence.length)return started?'Exploring':'Not started';const ordered=[...evidence].sort((a,b)=>b.at.localeCompare(a.at));const recent=ordered[0]!;if(at.getTime()-new Date(recent.at).getTime()>7*86400000)return 'Needs review';const passed=evidence.filter(e=>e.total>0&&e.correct/e.total>=0.7);if(recent.correct/recent.total<0.7)return 'Needs review';const kinds=new Set(passed.map(e=>e.kind));if(kinds.has('application')&&passed.some(e=>e.delayed&&e.kind==='retrieval')&&kinds.size>=3)return 'Mastered';if(kinds.has('check')&&kinds.has('practice'))return 'Secure';return 'Practicing';}
export function artifactRevision(artifact:Artifact){return JSON.stringify([artifact.updatedAt,artifact.title,artifact.body,artifact.milestones,artifact.status,artifact.projectBrief,artifact.rubric]);}
export function saveArtifact(ctx:RequestContext,patch:Partial<Artifact>&{title:string;body:string},expectedRevision?:string){const db=read();const data=access(db,ctx);let a=data.artifacts.find(a=>a.id===patch.id);if(expectedRevision!==undefined&&(!a||artifactRevision(a)!==expectedRevision)){const conflict=new Error('This project changed since you opened it. Your edits remain in the editor. Load the latest saved version or save a separate copy.');conflict.name='ArtifactConflictError';throw conflict;}if(!patch.title.trim())throw new Error('Give your project a title.');if(!a){a={id:id(),title:patch.title,body:'',journeyId:patch.journeyId,conceptId:patch.conceptId,learningSessionId:patch.learningSessionId,projectBrief:patch.projectBrief,rubric:patch.rubric,milestones:[false,false,false],visibility:'private',sharedWith:[],versions:[],status:'draft',updatedAt:now()};data.artifacts.unshift(a);}if(a.body!==patch.body&&a.body)a.versions.unshift({body:a.body,at:a.updatedAt});a.title=patch.title;a.body=patch.body;a.projectBrief=patch.projectBrief||a.projectBrief;a.rubric=patch.rubric||a.rubric;a.milestones=patch.milestones||a.milestones;a.status=patch.status||a.status;a.updatedAt=now();record(data,'Artifact saved',a.id);write(db);return a;}
export const portfolioReviewCriteria=[
 {id:'purpose',label:'Purpose and audience',prompt:'Who is this for, and what decision or task does it support?'},
 {id:'evidence',label:'Evidence and method',prompt:'What in the artifact supports your conclusion, and how did you check it?'},
 {id:'limits',label:'Limits and next step',prompt:'What remains uncertain, and what would you improve next?'},
] as const;
/** Local content-change detector, never an authorization or evidence credential. */
export function portfolioProjectVersion(artifact:Pick<Artifact,'title'|'body'|'status'|'milestones'|'rubric'>){
 const source=JSON.stringify([artifact.title,artifact.body,artifact.status,artifact.milestones,artifact.rubric?.responses||{}]);
 let hash=2166136261;for(let index=0;index<source.length;index++)hash=Math.imul(hash^source.charCodeAt(index),16777619);
 return `${source.length}:${(hash>>>0).toString(16)}`;
}
export const portfolioReviewRevision=(artifact:Pick<Artifact,'portfolioReviews'>)=>JSON.stringify(artifact.portfolioReviews||[]);
export function savePortfolioSelfReview(ctx:RequestContext,artifactId:string,expectedVersion:string,criteria:{id:string;rating:'needs-work'|'explained'|'supported';note:string}[],reflection:string,expectedReviewRevision?:string){
 if(ctx.role!=='professional')throw new Error('Open your professional workspace to review a portfolio project.');
 const db=read();const data=access(db,ctx);const person=db.people.find(p=>p.id===ctx.personId);
 if(person?.ageBand!=='adult')throw new Error('Portfolio review is available to adult professional profiles.');
 const artifact=data.artifacts.find(item=>item.id===artifactId);
 if(!artifact)throw new Error('This portfolio project is not in your workspace.');
 assertPortfolioReviewHistory(artifact);
 if(artifact.status!=='completed'||!artifact.body.trim())throw new Error('Complete the project and add your work before self-review.');
 if(portfolioProjectVersion(artifact)!==expectedVersion||(expectedReviewRevision!==undefined&&portfolioReviewRevision(artifact)!==expectedReviewRevision)){const error=new Error('This project or self-review changed. Your review edits remain available. Export them or load the latest saved review before continuing.');error.name='PortfolioReviewConflictError';throw error;}
 if(!Array.isArray(criteria)||criteria.length!==portfolioReviewCriteria.length||new Set(criteria.map(item=>item?.id)).size!==criteria.length||criteria.some(item=>!item||!portfolioReviewCriteria.some(rule=>rule.id===item.id)||!['needs-work','explained','supported'].includes(item.rating)||typeof item.note!=='string'||!item.note.trim()||item.note.trim().length>500))throw new Error('Review each criterion with a rating and a note of up to 500 characters.');
 if(typeof reflection!=='string'||!reflection.trim()||reflection.trim().length>1000)throw new Error('Add a reflection of up to 1000 characters.');
 artifact.portfolioReviews=[{projectVersion:expectedVersion,criteria:criteria.map(item=>({id:item.id,rating:item.rating,note:item.note.trim()})),reflection:reflection.trim(),reviewedAt:now()},...(artifact.portfolioReviews||[])].slice(0,10);
 record(data,'Portfolio self-review saved',artifactId);write(db);return artifact;
}
function canShare(db:Database,from:string,to:string){return allRelationships(db).some(r=>connectionStatus(r,clock().getTime())==='active'&&r.scope.includes('shared-resources')&&((r.from===from&&r.to===to)||(r.to===from&&r.from===to)));}
export function shareArtifact(ctx:RequestContext,artifactId:string,recipient:string,expectedVersion?:string){const db=read();const data=access(db,ctx);const person=db.people.find(p=>p.id===ctx.personId)!;if(person.ageBand!=='adult')throw new Error('Sharing requires an approved adult or guardian workflow. This demo does not verify guardians.');if(!canShare(db,ctx.personId,recipient))throw new Error('Choose an accepted connection with shared-resource permission.');const a=data.artifacts.find(a=>a.id===artifactId);if(!a)throw new Error('Project not found.');if(expectedVersion&&JSON.stringify([a.updatedAt,a.title,a.body])!==expectedVersion)throw new Error('This project changed. Reopen the saved version before sharing.');if(!a.body.trim())throw new Error('Add project content before sharing.');a.visibility='shared';if(!a.sharedWith.includes(recipient))a.sharedWith.push(recipient);a.shares=(a.shares||[]).filter(share=>share.recipient!==recipient);a.shares.push({recipient,title:a.title,body:a.body,version:a.updatedAt,sharedAt:now()});record(data,'Artifact shared',artifactId);write(db);return a;}
export function sharedArtifacts(ctx:RequestContext){const db=read();access(db,ctx);return db.workspaces.filter(w=>w.personId!==ctx.personId&&canShare(db,w.personId,ctx.personId)).flatMap(w=>(db.data[w.id]?.artifacts||[]).filter(a=>a.visibility==='shared'&&a.sharedWith.includes(ctx.personId)).map(a=>{const share=a.shares?.find(item=>item.recipient===ctx.personId);return {id:a.id,title:share?.title||a.title,body:share?.body||a.body,updatedAt:share?.sharedAt||a.updatedAt,sharedVersion:share?.version,from:db.people.find(p=>p.id===w.personId)?.name||'Connection'};}));}
export function stopSharingArtifact(ctx:RequestContext,artifactId:string){const db=read();const data=access(db,ctx);const a=data.artifacts.find(a=>a.id===artifactId);if(!a)throw new Error('Project not found.');a.visibility='private';a.sharedWith=[];a.shares=[];record(data,'Artifact sharing stopped',a.id);write(db);}
function activeGuardian(db:Database,parentId:string,learnerId:string){return allRelationships(db).find(r=>r.type==='guardian'&&r.from===parentId&&r.to===learnerId&&connectionStatus(r,clock().getTime())==='active'&&r.scope.includes('progress-summary'));}
/** A learner shares only a short, fixed project summary with one active parent. */
function requirePersonalParentShare(db:Database,ctx:RequestContext){
 if(db.workspaces.find(workspace=>workspace.id===ctx.workspaceId)?.organizationId)throw Error('Parent summaries are available from your personal learner workspace. Work projects and goals remain here.');
}
export function shareParentProjectSummary(ctx:RequestContext,artifactId:string,parentId:string,summary:string,expectedVersion:string){
 if(ctx.role!=='student')throw new Error('Open the learner workspace to share a project summary.');
 const db=read();const data=access(db,ctx);
 requirePersonalParentShare(db,ctx);
 const relationship=activeGuardian(db,parentId,ctx.personId);
 if(!relationship)throw new Error('Progress sharing with this parent is no longer active.');
 const artifact=data.artifacts.find(a=>a.id===artifactId);
 if(!artifact)throw new Error('Project not found.');
 if(artifact.status!=='completed')throw new Error('Complete the project before sharing a summary.');
 if(JSON.stringify([artifact.updatedAt,artifact.title,artifact.body,artifact.status])!==expectedVersion)throw new Error('This project changed. Review the saved version before sharing.');
 assertParentSummaryHistory(artifact.parentSummaries);
 const clean=summary.trim();if(!clean||clean.length>500)throw new Error('Write a project summary of up to 500 characters.');
 artifact.parentSummaries=(artifact.parentSummaries||[]).filter(share=>share.recipient!==parentId);
 artifact.parentSummaries.push({recipient:parentId,relationshipId:relationship.id,title:artifact.title,summary:clean,version:artifact.updatedAt,sharedAt:now()});
 record(data,'Parent project summary shared',artifactId);write(db);return artifact;
}
export function stopParentProjectSummary(ctx:RequestContext,artifactId:string,parentId:string){
 if(ctx.role!=='student')throw new Error('Open the learner workspace to stop sharing.');
 const db=read();const data=access(db,ctx);const artifact=data.artifacts.find(a=>a.id===artifactId);
 if(!artifact)throw new Error('Project not found.');
 assertParentSummaryHistory(artifact.parentSummaries);
 artifact.parentSummaries=(artifact.parentSummaries||[]).filter(share=>share.recipient!==parentId);
 record(data,'Parent project summary stopped',artifactId);write(db);return artifact;
}
export function familyProjectSummaries(ctx:RequestContext,childId:string){
 if(ctx.role!=='parent')throw new Error('Parent workspace required.');
 const db=read();access(db,ctx);
 const relationship=activeGuardian(db,ctx.personId,childId);
 if(!relationship)throw new Error('This child’s project summaries are no longer shared.');
 const learnerWorkspace=db.workspaces.find(w=>w.personId===childId&&w.role==='student'&&!w.organizationId);
 return (learnerWorkspace?db.data[learnerWorkspace.id]?.artifacts||[]:[]).flatMap(artifact=>{assertParentSummaryHistory(artifact.parentSummaries);return (artifact.parentSummaries||[]).filter(share=>share.recipient===ctx.personId&&share.relationshipId===relationship.id).map(share=>({id:artifact.id,title:share.title,summary:share.summary,version:share.version,sharedAt:share.sharedAt}));}).sort((a,b)=>b.sharedAt.localeCompare(a.sharedAt));
}
export function saveLearnerGoal(ctx:RequestContext,input:{id?:string;title:string;body:string},expectedRevision?:string){
 if(ctx.role!=='student')throw new Error('Open the learner workspace to save a learning goal.');
 const db=read();const data=access(db,ctx);
 if(input.id&&!data.resources.some(resource=>resource.id===input.id&&resource.kind==='goal'))throw new Error('This learning goal is not in your workspace.');
 if(!input.title.trim()||input.title.trim().length>160)throw new Error('Give your goal a title of up to 160 characters.');
 if(input.body.length>6000)throw new Error('Keep private goal notes within 6000 characters.');
 return saveResource(ctx,{id:input.id,title:input.title.trim(),body:input.body,kind:'goal',status:'draft',audience:'Personal'},expectedRevision);
}
export function shareParentGoalSummary(ctx:RequestContext,goalId:string,parentId:string,summary:string,expectedVersion:string){
 if(ctx.role!=='student')throw new Error('Open the learner workspace to share a learning goal.');
 const db=read();const data=access(db,ctx);requirePersonalParentShare(db,ctx);const relationship=activeGuardian(db,parentId,ctx.personId);
 if(!relationship)throw new Error('Progress sharing with this parent is no longer active.');
 const goal=data.resources.find(resource=>resource.id===goalId&&resource.kind==='goal');
 if(!goal||goal.status==='archived')throw new Error('This learning goal is unavailable.');
 if(JSON.stringify([goal.updatedAt,goal.title,goal.body,goal.status])!==expectedVersion)throw new Error('This goal changed. Review the saved version before sharing.');
 assertParentSummaryHistory(goal.parentSummaries);
 const clean=summary.trim();if(!clean||clean.length>500)throw new Error('Write a goal summary of up to 500 characters.');
 goal.parentSummaries=(goal.parentSummaries||[]).filter(share=>share.recipient!==parentId);
 goal.parentSummaries.push({recipient:parentId,relationshipId:relationship.id,title:goal.title,summary:clean,version:goal.updatedAt,sharedAt:now()});
 record(data,'Parent learning goal shared',goalId);write(db);return goal;
}
export function stopParentGoalSummary(ctx:RequestContext,goalId:string,parentId:string){
 if(ctx.role!=='student')throw new Error('Open the learner workspace to stop sharing.');
 const db=read();const data=access(db,ctx);const goal=data.resources.find(resource=>resource.id===goalId&&resource.kind==='goal');
 if(!goal)throw new Error('Learning goal not found.');
 assertParentSummaryHistory(goal.parentSummaries);
 goal.parentSummaries=(goal.parentSummaries||[]).filter(share=>share.recipient!==parentId);
 record(data,'Parent learning goal stopped',goalId);write(db);return goal;
}
export function familyGoalSummaries(ctx:RequestContext,childId:string){
 if(ctx.role!=='parent')throw new Error('Parent workspace required.');
 const db=read();access(db,ctx);const relationship=activeGuardian(db,ctx.personId,childId);
 if(!relationship)throw new Error('This child’s goal summaries are no longer shared.');
 const learnerWorkspace=db.workspaces.find(w=>w.personId===childId&&w.role==='student'&&!w.organizationId);
 return (learnerWorkspace?db.data[learnerWorkspace.id]?.resources||[]:[]).filter(goal=>goal.kind==='goal'&&goal.status!=='archived').flatMap(goal=>{assertParentSummaryHistory(goal.parentSummaries);return (goal.parentSummaries||[]).filter(share=>share.recipient===ctx.personId&&share.relationshipId===relationship.id).map(share=>({id:goal.id,title:share.title,summary:share.summary,version:share.version,sharedAt:share.sharedAt}));}).sort((a,b)=>b.sharedAt.localeCompare(a.sharedAt));
}
export function resourceRevision(resource:Resource){return JSON.stringify([resource.updatedAt,resource.title,resource.body,resource.status,resource.audience,resource.checks,resource.members,resource.classIds,resource.objectiveSnapshot]);}
export function saveResource(ctx:RequestContext,patch:Partial<Resource>&{title:string;body:string;kind:Resource['kind']},expectedRevision?:string){
 const db=read();const data=resourceData(db,ctx);
 const current=data.resources.find(row=>row.id===patch.id);if(expectedRevision!==undefined&&(!current||resourceRevision(current)!==expectedRevision)){const error=new Error('This resource changed since you opened it. Your edits remain in the editor. Review the latest version or export your edits before continuing.');error.name='ResourceConflictError';throw error;}
 if(Object.hasOwn(patch,'curriculumTemplate'))throw new Error('Use the curriculum review workflow to change structured curriculum.');
 if(patch.contentReview||data.resources.find(row=>row.id===patch.id)?.contentReview)throw new Error('Use the content review workflow to change this versioned resource.');
 if(Object.hasOwn(patch,'sourceSnapshot')&&JSON.stringify(patch.sourceSnapshot)!==JSON.stringify(data.resources.find(row=>row.id===patch.id)?.sourceSnapshot))throw new Error('The delivered source snapshot cannot be replaced in this editor.');
 if(!patch.title.trim())throw new Error('A title is required.');
 if(patch.objectiveSnapshot!==undefined&&patch.objectiveSnapshot!==null){if(patch.kind!=='lesson'||ctx.role!=='teacher')throw new Error('Attach objectives in your teacher lesson workspace.');assertLessonObjective(patch.objectiveSnapshot);}
 if(patch.kind==='lesson'&&patch.status==='reviewed'&&!patch.body.trim())throw new Error('Add the lesson outline before marking it reviewed.');
 if(patch.checks!==undefined&&(
  patch.kind!=='lesson'||!Array.isArray(patch.checks)||patch.checks.length>10||
  patch.checks.some(check=>!check||typeof check.id!=='string'||!check.id.trim()||typeof check.prompt!=='string'||!check.prompt.trim()||check.prompt.length>500)||
  new Set(patch.checks.map(check=>check.id)).size!==patch.checks.length
 ))throw new Error('Add up to ten distinct, complete questions before saving the lesson.');
 let resource=data.resources.find(r=>r.id===patch.id);
 if(!resource){resource={id:id(),title:patch.title,body:patch.body,kind:patch.kind,status:'draft',audience:'Personal',updatedAt:now()};data.resources.unshift(resource);}
 Object.assign(resource,patch,{id:resource.id,updatedAt:now(),...(ctx.role==='organization'?{audience:'Organization'}:{}),...(patch.checks?{checks:patch.checks.map(check=>({id:check.id,prompt:check.prompt.trim()}))}:{})});
 record(data,`${resource.kind} saved`,resource.id);write(db);return resource;
}
function resourceData(db:Database,ctx:RequestContext){const own=access(db,ctx);if(ctx.role!=='organization')return own;const policy=requireOrganizationPermission(ctx,'academic');const owner=db.people.find(person=>person.email===policy.organizationEmail);const space=db.workspaces.find(workspace=>workspace.personId===owner?.id&&workspace.role==='organization'&&!workspace.organizationId);if(!space||!db.data[space.id])throw new Error('The organization resource workspace is unavailable.');const data=db.data[space.id]!;if(!Array.isArray(data.resources))throw Error('Saved organization resources could not be read. Original records were kept.');return data;}
export function archiveResource(ctx:RequestContext,resourceId:string){const db=read();const data=resourceData(db,ctx);const resource=data.resources.find(r=>r.id===resourceId);if(!resource)throw new Error('Item not found.');if(resource.contentReview)throw new Error('Use the content review workflow to archive or restore this resource.');resource.status=resource.status==='archived'?'draft':'archived';record(data,resource.status,resourceId);write(db);}

/** Versioned organization review is local editorial approval, not published curriculum. */
export function saveOrganizationContent(ctx:RequestContext,input:{id?:string;title:string;body:string;source:string;language:Locale;kind?:'lesson'|'curriculum';curriculumTemplate?:CurriculumTemplate},expectedRevision?:number){
 const db=read();const data=resourceData(db,ctx);requireOrganizationPermission(ctx,'academic');
 if(typeof input.title!=='string'||!input.title.trim()||input.title.length>200||typeof input.body!=='string'||input.body.length>50000||typeof input.source!=='string'||input.source.length>2000||!['en','hi','bn'].includes(input.language))throw new Error('Add a title within 200 characters, content within 50,000 characters, a source within 2,000 characters, and a supported language.');
 let item=data.resources.find(row=>row.id===input.id);if(item)assertOrganizationContentRecord(item);
 const kind=input.kind||item?.kind||'lesson';if(!['lesson','curriculum'].includes(kind))throw new Error('Choose a content resource or curriculum template.');if(item&&item.kind!==kind)throw new Error('A reviewed resource cannot change its category. Create a separate sourced template.');
 if(input.curriculumTemplate!==undefined){if(kind!=='curriculum')throw Error('Structured objectives belong to a curriculum template.');assertCurriculumTemplate(input.curriculumTemplate);}
 if(item?.curriculumTemplate&&input.curriculumTemplate===undefined)throw Error('Retain the structured curriculum when saving this revision.');
 if(input.id&&(!item?.contentReview||item.contentReview.revision!==expectedRevision))throw new Error('This content version changed. Reopen the latest saved version; your edits remain here.');
 if(item&&!['draft','changes'].includes(item.status))throw new Error('Create a new draft revision before editing submitted, approved or archived content.');
 if(!item){item={id:id(),kind:kind as 'lesson'|'curriculum',title:input.title.trim(),body:input.body,status:'draft',audience:'Organization',updatedAt:now(),contentReview:{revision:1,source:input.source.trim(),language:input.language,author:ctx.personId,history:[],versions:[]}};data.resources.unshift(item);}
 else{const review=item.contentReview!;review.versions.unshift({revision:review.revision,title:item.title,body:item.body,source:review.source,language:review.language,...(item.curriculumTemplate?{curriculumTemplate:structuredClone(item.curriculumTemplate)}:{})});review.revision++;review.source=input.source.trim();review.language=input.language;review.author=ctx.personId;item.title=input.title.trim();item.body=input.body;item.status='draft';}
 if(input.curriculumTemplate!==undefined)item.curriculumTemplate=structuredClone(input.curriculumTemplate);
 item.updatedAt=now();item.contentReview!.history.push({action:'draft-saved',actor:ctx.personId,at:item.updatedAt,revision:item.contentReview!.revision,note:''});record(data,'Content draft saved',item.id,ctx.personId);write(db);return item;
}
export function changeOrganizationContent(ctx:RequestContext,resourceId:string,expectedRevision:number,action:'submit'|'request-changes'|'approve'|'archive'|'restore'|'revise',note='',checks?:{source:boolean;accuracy:boolean;language:boolean}){
 const db=read();const data=resourceData(db,ctx);requireOrganizationPermission(ctx,'academic');const item=data.resources.find(row=>row.id===resourceId);const review=item?.contentReview;if(item)assertOrganizationContentRecord(item);
 if(!item||!review||review.revision!==expectedRevision)throw new Error('This content version is unavailable or changed. Reopen the latest saved version.');
 if(typeof note!=='string'||note.length>2000)throw new Error('Keep review notes within 2,000 characters.');
 const transitions={submit:{from:['draft','changes'],to:'submitted'},'request-changes':{from:['submitted'],to:'changes'},approve:{from:['submitted'],to:'approved'},archive:{from:['draft','changes','approved'],to:'archived'},restore:{from:['archived'],to:'draft'},revise:{from:['approved'],to:'draft'}};
 const transition=transitions[action];if(!transition||!transition.from.includes(item.status))throw new Error('This review action is unavailable in the current content state.');
 if(['submit','approve'].includes(action)&&item.curriculumTemplate)assertCurriculumTemplate(item.curriculumTemplate,true);
 if(action==='submit'&&(!item.body.trim()||!review.source.trim()))throw new Error('Add content and an exact source/version before submitting for review.');
 if(['approve','request-changes'].includes(action)&&review.author===ctx.personId)throw new Error('A different academic administrator must review this authored revision.');
 if(action==='request-changes'&&!note.trim())throw new Error('Explain the required changes for the author.');
 if(action==='approve'&&(!checks?.source||!checks.accuracy||!checks.language||!note.trim()))throw new Error('Review source, accuracy and language and record your review note before approval.');
 item.status=transition.to;item.updatedAt=now();review.history.push({action,actor:ctx.personId,at:item.updatedAt,revision:review.revision,note:note.trim(),...(action==='approve'?{checks:{source:true,accuracy:true,language:true}}:{})});record(data,`Content ${action}`,item.id,ctx.personId);write(db);return item;
}
export function deliverOrganizationContent(ctx:RequestContext,resourceId:string,expectedRevision:number,teacherEmail:string){
 const db=read();const data=resourceData(db,ctx);const policy=requireOrganizationPermission(ctx,'academic');const item=data.resources.find(row=>row.id===resourceId);const review=item?.contentReview;if(item)assertOrganizationContentRecord(item);
 if(!item||!review||item.status!=='approved'||review.revision!==expectedRevision)throw new Error('Choose the latest approved content revision before sharing.');
 const membership=readOrganizationInviteRows().find(row=>row.organization_email===policy.organizationEmail&&row.email===teacherEmail&&row.role==='teacher'&&inviteStatus(row)==='active');
 if(!membership)throw new Error('Choose an active accepted teacher in this organization.');
 if(item.curriculumTemplate)assertCurriculumTemplate(item.curriculumTemplate,true);
 const deliveries=review.deliveries??=[];const existing=deliveries.find(row=>row.membershipId===membership.id&&row.revision===review.revision);if(existing)return existing;
 if(!organizationSettingsValue(data).teacherDeliveryEnabled)throw new Error('New teacher deliveries are paused by the organization owner. Existing delivered copies remain available.');
 const delivery={id:id(),resourceId:item.id,membershipId:membership.id,teacherEmail,title:item.title,body:item.body,source:review.source,language:review.language,revision:review.revision,sharedAt:now(),sharedBy:ctx.personId,...(item.curriculumTemplate?{curriculumTemplate:structuredClone(item.curriculumTemplate)}:{})};deliveries.push(delivery);record(data,'Approved content delivered',item.id,ctx.personId);write(db);return delivery;
}
/** Accepted teachers receive explicit fixed deliveries only, never the organization's full library. */
export function teacherOrganizationContent(ctx:RequestContext){
 const db=read();access(db,ctx);if(ctx.role!=='teacher')throw new Error('Open the teacher workspace to review delivered content.');
 const space=db.workspaces.find(row=>row.id===ctx.workspaceId)!;if(!space.organizationId)return [];
 const teacher=db.people.find(row=>row.id===ctx.personId)!;const membership=readOrganizationInviteRows().find(row=>row.organization_email===space.organizationId&&row.email===teacher.email&&row.role==='teacher'&&inviteStatus(row)==='active');
 if(!membership)throw new Error('This organization teaching membership is no longer active.');
 const owner=db.people.find(row=>row.email===space.organizationId);const ownerSpace=db.workspaces.find(row=>row.personId===owner?.id&&row.role==='organization'&&!row.organizationId);
 const resources=ownerSpace?db.data[ownerSpace.id]?.resources||[]:[];
 return resources.flatMap(item=>(item.contentReview?.deliveries||[]).filter(row=>row.teacherEmail===teacher.email&&row.membershipId===membership.id).map(row=>{if(row.curriculumTemplate)assertCurriculumTemplate(row.curriculumTemplate,true);return {...row,organizationEmail:space.organizationId!,importedResourceId:db.data[ctx.workspaceId]?.resources.find(resource=>resource.sourceSnapshot?.deliveryId===row.id)?.id};})).sort((a,b)=>b.sharedAt.localeCompare(a.sharedAt));
}
export function importOrganizationContent(ctx:RequestContext,deliveryId:string,objectiveId?:string){
 const delivery=teacherOrganizationContent(ctx).find(row=>row.id===deliveryId);if(!delivery)throw new Error('This delivered content is unavailable in your active teacher workspace.');
 const objective=delivery.curriculumTemplate?curriculumObjectiveSnapshot(delivery.curriculumTemplate,objectiveId||'',delivery.language):undefined;
 if(objectiveId&&!objective)throw Error('This delivery has no structured curriculum objective.');
 const db=read();const data=access(db,ctx);const existing=data.resources.find(row=>row.sourceSnapshot?.deliveryId===delivery.id&&row.sourceSnapshot?.curriculumObjectiveId===objectiveId);if(existing)return existing;
 const resource:Resource={id:id(),title:objective?delivery.title+' · '+objective.title:delivery.title,body:delivery.body,kind:'lesson',status:'draft',audience:'Personal',updatedAt:now(),sourceSnapshot:{deliveryId:delivery.id,resourceId:delivery.resourceId,organizationEmail:delivery.organizationEmail,revision:delivery.revision,source:delivery.source,language:delivery.language,sharedAt:delivery.sharedAt,...(objectiveId?{curriculumObjectiveId:objectiveId}:{})},...(objective?{objectiveSnapshot:objective}:{})};
 data.resources.unshift(resource);record(data,'Delivered content copied to teacher draft',resource.id,ctx.personId);write(db);return resource;
}
export function markNotification(ctx:RequestContext,notificationId:string){const db=read();const data=access(db,ctx);const n=data.notifications.find(n=>n.id===notificationId);if(!n)throw new Error('This update is no longer available in this workspace.');if(n.read)return;n.read=true;write(db);}
export function changeSubscription(ctx:RequestContext,plan:Plan['id'],outcome:'active'|'pending'|'failed'|'cancelled'){
 const db=read();const data=access(db,ctx);const selected=plans.find(p=>p.id===plan);if(!selected)throw new Error('Unknown plan.');
 const resume=outcome==='active'&&data.subscription.state==='cancelled'&&data.subscription.plan===plan&&new Date(data.subscription.renewsAt||0)>clock();
 if(outcome==='cancelled'&&data.subscription.plan==='Free')throw new Error('There is no paid renewal to cancel.');
 if(outcome==='active'&&!resume){data.subscription.plan=plan;data.subscription.renewsAt=plan==='Free'?undefined:new Date(clock().getTime()+30*86400000).toISOString();if(plan!=='Free')data.subscription.invoices.unshift({id:id(),plan,amount:selected.price,at:now()});}
 data.subscription.state=outcome;
 for(const w of db.workspaces.filter(w=>w.personId===ctx.personId)){const target=db.data[w.id]!;target.subscription={...structuredClone(data.subscription),usage:target.subscription.usage,usageDay:target.subscription.usageDay};}
 record(data,`Demo subscription ${outcome}`,plan);write(db);
}
export function visibleRelationships(ctx:RequestContext){const db=read();access(db,ctx);return allRelationships(db).filter(r=>r.from===ctx.personId||r.to===ctx.personId).map(r=>({...r,status:connectionStatus(r,clock().getTime()),name:db.people.find(p=>p.id===(r.from===ctx.personId?r.to:r.from))?.name||'Connection'}));}
type OrganizationInviteEvent = {action:'requested'|'accepted'|'declined'|'cancelled'|'revoked'|'permission-changed';actor:string;actorEmail:string;at:string;status:string;capability?:string;previousCapability?:string;readBy?:string[]};
type OrganizationInviteRow = {id:string;organization_email:string;organization_name?:string;email:string;role:Role;status:string;capability?:string;expiresAt?:string;accepted_at?:string;createdAt?:string;history?:OrganizationInviteEvent[];historyComplete?:boolean};
const ORGANIZATION_INVITES_KEY='visionary_entity_OrganizationInvite';
const organizationInviteRoles:Role[]=['student','teacher','professional','parent','organization'];
function readOrganizationInviteRows():OrganizationInviteRow[]{
 try{const rows=JSON.parse(localStorage.getItem(ORGANIZATION_INVITES_KEY)||'[]');if(!Array.isArray(rows))throw Error();return rows;}
 catch{throw new Error('Organization invitations could not be read on this device. Your saved records have not been changed.');}
}
function inviteStatus(row:OrganizationInviteRow){return connectionStatus(row,clock().getTime());}
function saveOrganizationInviteRows(rows:OrganizationInviteRow[]){
 try{localStorage.setItem(ORGANIZATION_INVITES_KEY,JSON.stringify(rows));}
 catch{throw new Error('The organization change could not be saved on this device. Try again.');}
 if(typeof window!=='undefined'){window.dispatchEvent(new CustomEvent('visionary:workspace-change'));window.dispatchEvent(new CustomEvent('visionary:v2-change'));}
}
function organizationActor(ctx:RequestContext){const db=read();access(db,ctx);const person=db.people.find(p=>p.id===ctx.personId);if(!person)throw new Error('Account unavailable.');return {person,workspace:db.workspaces.find(w=>w.id===ctx.workspaceId)!};}
export function organizationAccess(ctx:RequestContext){const {person,workspace}=organizationActor(ctx);return organizationPolicy({email:person.email,identity:workspace.role,organization_id:workspace.organizationId},workspace.organizationId&&workspace.role==='organization'?readOrganizationInviteRows():[],clock().getTime());}
export function requireOrganizationPermission(ctx:RequestContext,permission:string){const policy=organizationAccess(ctx);if(!policy.permissions.includes(permission))throw new Error('Your organization permission does not allow this action.');return policy;}
function organizationSettingsValue(data:WorkspaceData):OrganizationSettings{
 const value=data.organizationSettings;
 if(!value)return {revision:0,kind:'school',contentLanguage:'en',teacherDeliveryEnabled:true};
 if(!Number.isInteger(value.revision)||value.revision<1||!['school','coaching','company','ngo'].includes(value.kind)||!['en','hi','bn'].includes(value.contentLanguage)||typeof value.teacherDeliveryEnabled!=='boolean')throw new Error('Organization settings could not be read. Their original records were retained.');
 return structuredClone(value);
}
export function getOrganizationSettings(ctx:RequestContext){const db=read();const data=resourceData(db,ctx);return organizationSettingsValue(data);}
export function saveOrganizationSettings(ctx:RequestContext,input:Pick<OrganizationSettings,'kind'|'contentLanguage'|'teacherDeliveryEnabled'>,expectedRevision:number){
 requireOrganizationPermission(ctx,'permissions');const db=read();const data=resourceData(db,ctx);const previous=organizationSettingsValue(data);
 if(previous.revision!==expectedRevision)throw new Error('Organization settings changed. Your edits remain here. Review the latest settings before saving.');
 if(!['school','coaching','company','ngo'].includes(input.kind)||!['en','hi','bn'].includes(input.contentLanguage)||typeof input.teacherDeliveryEnabled!=='boolean')throw new Error('Choose supported organization settings.');
 if(previous.kind===input.kind&&previous.contentLanguage===input.contentLanguage&&previous.teacherDeliveryEnabled===input.teacherDeliveryEnabled)return previous;
 const value={revision:previous.revision+1,kind:input.kind,contentLanguage:input.contentLanguage,teacherDeliveryEnabled:input.teacherDeliveryEnabled,updatedAt:now(),updatedBy:ctx.personId};
 data.organizationSettings=value;
 record(data,'Organization settings saved',JSON.stringify({revision:value.revision,before:{kind:previous.kind,contentLanguage:previous.contentLanguage,teacherDeliveryEnabled:previous.teacherDeliveryEnabled},after:{kind:value.kind,contentLanguage:value.contentLanguage,teacherDeliveryEnabled:value.teacherDeliveryEnabled}}),ctx.personId);
 write(db);return value;
}
export function changeOrganizationCapability(ctx:RequestContext,inviteId:string,capability:string){
 requireOrganizationPermission(ctx,'permissions');const {person}=organizationActor(ctx);const rows=readOrganizationInviteRows();const invite=rows.find(row=>row.id===inviteId&&row.organization_email===person.email&&row.role==='organization');
 if(!invite||!['active','pending'].includes(inviteStatus(invite)))throw new Error('This administrative membership is unavailable.');
 if(capability==='owner'||!Object.hasOwn(organizationProfiles,capability))throw new Error('Choose an available administrative permission.');
 if(invite.capability===capability)return;
 const previousCapability=invite.capability;invite.capability=capability;invite.history=[...(invite.history||[]),{action:'permission-changed',actor:ctx.personId,actorEmail:person.email,at:now(),status:invite.status,capability,previousCapability}];saveOrganizationInviteRows(rows);
}
/** Local invitation source of truth. The recipient sees only their own requests. */
export function organizationInvites(ctx:RequestContext){
 const {person,workspace}=organizationActor(ctx);
 const policy=organizationAccess(ctx);
 return readOrganizationInviteRows().filter(row=>row.email===person.email||workspace.role==='organization'&&policy.permissions.includes('members')&&row.organization_email===policy.organizationEmail).map(row=>({...row,status:inviteStatus(row),history:Array.isArray(row.history)?row.history:[]}));
}
/** Combines authorized local sources without inventing missing historical actors. */
export function organizationAudit(ctx:RequestContext,days:7|30=30){
 reportDays(days);if(ctx.role!=='organization')throw new Error('Open an organization workspace to review its audit.');const policy=requireOrganizationPermission(ctx,'audit');
 const data=snapshot(ctx);const cutoff=clock().getTime()-days*86400000;
 const sharedAudit=resourceData(read(),ctx).audit;
 const workspaceAudit=[...sharedAudit,...data.audit].filter((row,index,rows)=>rows.findIndex(other=>other.id===row.id)===index);
 const entries:{id:string;source:'workspace'|'membership'|'classwork'|'transition';action:string;target:string;actor:string|null;at:string;outcome:string}[]=workspaceAudit.map(row=>({id:`workspace:${row.id}`,source:'workspace',action:row.action,target:row.target,actor:row.actor||null,at:row.at,outcome:'Saved locally'}));
 const unavailableSources:string[]=[];let importedWithoutHistory=0;
 try{for(const invite of organizationInvites(ctx).filter(row=>row.organization_email===policy.organizationEmail)){
  if(!invite.historyComplete)importedWithoutHistory++;
  invite.history.forEach((event,index)=>entries.push({id:`membership:${invite.id}:${index}`,source:'membership',action:event.action,target:`${invite.email} · ${invite.role}`,actor:event.actorEmail||null,at:event.at,outcome:event.capability?`${event.status} · ${event.previousCapability||'unassigned'} → ${event.capability}`:event.status}));
 }}catch{unavailableSources.push('Membership history');}
 let classworkWithoutHistory=0;
 try{
  const rows=(name:string):Record<string,unknown>[]=>{const parsed=JSON.parse(localStorage.getItem(`visionary_entity_${name}`)||'[]');if(!Array.isArray(parsed)||parsed.some(row=>!row||typeof row!=='object'||Array.isArray(row)))throw Error();return parsed;};
  const classes=rows('Classroom').filter(row=>row.organization_email===policy.organizationEmail);const assignments=rows('Assignment').filter(row=>classes.some(classroom=>classroom.id===row.class_id));
  for(const assignment of assignments){
   if(!Array.isArray(assignment.state_history)){classworkWithoutHistory++;continue;}
   for(const [index,event] of assignment.state_history.entries()){
    if(!event||typeof event!=='object'||typeof event.at!=='string'||typeof event.from!=='string'||typeof event.to!=='string')throw Error();
    entries.push({id:`classwork:${assignment.id}:${index}`,source:'classwork',action:'Assignment state changed',target:`Class ${assignment.class_id} · Activity ${assignment.id}`,actor:typeof event.actor==='string'?event.actor:null,at:event.at,outcome:`${event.from} → ${event.to}`});
   }
  }
 }catch{unavailableSources.push('Classwork state history');}
 try{
  const store=JSON.parse(localStorage.getItem('visionary_stage_transitions_v1')||'{"version":1,"transitions":[]}');if(store.version!==1||!Array.isArray(store.transitions))throw Error();
  const groups=new Map<string,{classId:string;level:string;actor:string;at:string;states:Record<string,number>}>();
  for(const row of store.transitions){
   // No ownership inference from an event ID, learner identity or current class membership.
   if(row?.trigger!=='teacher-promotion'||row.classScope?.organizationEmail!==policy.organizationEmail)continue;
   if(typeof row.classScope.classId!=='string'||typeof row.eventId!=='string'||typeof row.actor!=='string'||typeof row.notifiedAt!=='string'||!Number.isFinite(Date.parse(row.notifiedAt))||typeof row.to?.classLevel!=='string'||!['notified','applied','postponed','undone','awaiting-confirm','suggested','superseded'].includes(row.state))throw Error();
   const key=JSON.stringify([row.classScope.classId,row.eventId,row.actor,row.to.classLevel]);const group=groups.get(key)||{classId:row.classScope.classId,level:row.to.classLevel,actor:row.actor,at:row.notifiedAt,states:{} as Record<string,number>};
   group.states[row.state]=(group.states[row.state]||0)+1;if(row.notifiedAt<group.at)group.at=row.notifiedAt;groups.set(key,group);
  }
  for(const [key,group] of groups)entries.push({id:'transition:'+key,source:'transition',action:'Teacher promotion recorded',target:`Class ${group.classId} → level ${group.level}`,actor:group.actor,at:group.at,outcome:'Current notice states: '+Object.entries(group.states).map(([state,count])=>`${state}: ${count}`).join(', ')});
 }catch{unavailableSources.push('Scoped promotion history');}
 return {entries:entries.filter(row=>Number.isFinite(new Date(row.at).getTime())&&new Date(row.at).getTime()>=cutoff).sort((a,b)=>b.at.localeCompare(a.at)||a.id.localeCompare(b.id)),unavailableSources,importedWithoutHistory,classworkWithoutHistory,period:`Last ${days} days`};
}
export function organizationUpdates(ctx:RequestContext){
 if(ctx.role!=='organization')throw new Error('Open an organization workspace to review membership updates.');
 const invites=organizationInvites(ctx);
 const policy=organizationAccess(ctx);const path=policy.permissions.includes('members')?'people':'connections';
 return {importedWithoutHistory:invites.filter(invite=>!invite.historyComplete).length,items:invites.flatMap(invite=>invite.history.map((event,index)=>({id:`${invite.id}:${index}`,inviteId:invite.id,eventIndex:index,action:event.action,actor:event.actorEmail||null,target:invite.email,role:invite.role,at:event.at,read:event.readBy?.includes(ctx.workspaceId)||false,currentStatus:invite.status,path:`/dashboard/${path}#organization-invite-${encodeURIComponent(invite.id)}`}))).sort((a,b)=>b.at.localeCompare(a.at)||a.id.localeCompare(b.id))};
}
/** Read acknowledgement is stored with its source event, without altering membership. */
export function markOrganizationUpdate(ctx:RequestContext,inviteId:string,eventIndex:number){
 const {person,workspace}=organizationActor(ctx);
 if(workspace.role!=='organization')throw new Error('Open your organization workspace to mark this update read.');
 const policy=organizationAccess(ctx);
 const rows=readOrganizationInviteRows();const invite=rows.find(row=>row.id===inviteId&&(policy.permissions.includes('members')&&row.organization_email===policy.organizationEmail||row.email===person.email));
 const event=Number.isInteger(eventIndex)&&eventIndex>=0?invite?.history?.[eventIndex]:undefined;
 if(!event)throw new Error('This membership update is unavailable.');
 if(event.readBy?.includes(ctx.workspaceId))return;
 event.readBy=[...(event.readBy||[]),ctx.workspaceId];saveOrganizationInviteRows(rows);
}
export function requestOrganizationInvite(ctx:RequestContext,targetEmail:string,role:Role,organizationName?:string,capability?:string){
 const {person,workspace}=organizationActor(ctx);
 if(workspace.role!=='organization')throw new Error('Open your organization admin workspace to invite someone.');
 const policy=requireOrganizationPermission(ctx,'invite');
 if(role==='organization'){requireOrganizationPermission(ctx,'permissions');if(!capability||capability==='owner'||!Object.hasOwn(organizationProfiles,capability))throw new Error('Choose an available administrative permission.');}
 if(!organizationInviteRoles.includes(role))throw new Error('Choose an available member role.');
 const email=targetEmail.trim().toLowerCase();
 if(email.length>254||!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email)||email===person.email.toLowerCase())throw new Error('Enter another person’s valid account email.');
 const rows=readOrganizationInviteRows();
 if(rows.some(row=>row.organization_email===policy.organizationEmail&&row.email.toLowerCase()===email&&['draft','pending','active'].includes(inviteStatus(row))))throw new Error('This person already has an open organization request. Close it before inviting again.');
 const at=now();const row:OrganizationInviteRow={id:id(),organization_email:policy.organizationEmail!,organization_name:organizationName?.trim().slice(0,120)||person.name,email,role,...(role==='organization'?{capability}:{}),status:'pending',createdAt:at,expiresAt:new Date(clock().getTime()+7*86400000).toISOString(),historyComplete:true,history:[{action:'requested',actor:ctx.personId,actorEmail:person.email,at,status:'pending',...(role==='organization'?{capability}:{})}]};
 rows.push(row);saveOrganizationInviteRows(rows);return row;
}
export function changeOrganizationInvite(ctx:RequestContext,inviteId:string,status:'active'|'declined'|'cancelled'|'revoked'){
 const {person,workspace}=organizationActor(ctx);const rows=readOrganizationInviteRows();const row=rows.find(item=>item.id===inviteId);
 if(!row)throw new Error('Organization invitation unavailable.');
 const policy=organizationAccess(ctx);
 const organizer=workspace.role==='organization'&&policy.permissions.includes('invite')&&row.organization_email===policy.organizationEmail&&(row.role!=='organization'||policy.permissions.includes('permissions'));
 const member=row.email===person.email&&workspace.role===row.role&&(!workspace.organizationId||workspace.organizationId===row.organization_email);
 if(row.email===person.email&&workspace.role!==row.role&&!organizer)throw new Error('Open the invited workspace role to answer this organization request.');
 if(!organizer&&!member)throw new Error('This organization invitation is outside your workspace.');
 const current=inviteStatus(row);
 if(status==='active'||status==='declined'){
  if(!member)throw new Error('Only the invited member can answer this request in the invited role.');
  if(current==='unavailable'&&status==='active')throw new Error('This invitation has an unreadable expiry. Close it and request a new invitation.');
  if(current==='expired')throw new Error('This invitation expired. Request a new invitation.');
  if(current!=='pending'&&!(status==='declined'&&current==='unavailable'&&row.status==='pending'))throw new Error('This invitation is no longer pending.');
 }else if(status==='cancelled'){
  if(!organizer||(current!=='pending'&&!(current==='unavailable'&&row.status==='pending')))throw new Error('Only the organization can cancel a pending invitation.');
 }else if(current!=='active'&&!(current==='unavailable'&&row.status==='active'))throw new Error('Only an active membership can be disconnected.');
 const at=now();row.status=status;if(status==='active'){row.accepted_at=at;delete row.expiresAt;}
 row.history=[...(Array.isArray(row.history)?row.history:[]),{action:status==='active'?'accepted':status,status,actor:ctx.personId,actorEmail:person.email,at}];
 saveOrganizationInviteRows(rows);return row;
}
function recordGuardianNotification(db:Database,relationship:Database['relationships'][number],event:'requested'|'accepted'|'declined'|'cancelled'|'revoked'){
 if(relationship.type!=='guardian')return;
 const workspace=db.workspaces.find(w=>w.personId===relationship.from&&w.role==='parent'&&!w.organizationId);
 const target=workspace&&db.data[workspace.id];if(!target)return;
 target.notifications.unshift({id:id(),text:'Progress-sharing permission changed.',read:false,path:'/dashboard/child',kind:'guardian',childId:relationship.to,event,at:now()});
}
export function requestRelationship(ctx:RequestContext,email:string,type:'guardian'|'teacher'|'organization'){
 const db=read();access(db,ctx);
 if(type==='guardian'&&ctx.role!=='parent')throw new Error('Open a parent workspace to request progress sharing.');
 const person=db.people.find(p=>p.email.toLowerCase()===email.trim().toLowerCase());
 if(!person||person.id===ctx.personId)throw new Error('Choose another account available in this local demo.');
 if(type==='guardian'&&!person.roles.includes('student'))throw new Error('Choose a learner account for progress sharing.');
 if(allRelationships(db).some(r=>r.from===ctx.personId&&r.to===person.id&&r.type===type&&['active','pending'].includes(connectionStatus(r,clock().getTime()))))throw new Error('This connection already exists.');
 const relationship={id:id(),from:ctx.personId,to:person.id,type,status:'pending' as const,scope:type==='guardian'?['progress-summary']:['shared-resources'],expiresAt:new Date(clock().getTime()+7*86400000).toISOString()};db.relationships.push(relationship);recordGuardianNotification(db,relationship,'requested');write(db);
}
export function renewGuardianRelationship(ctx:RequestContext,relationshipId:string){
 if(ctx.role!=='parent')throw new Error('Open your parent workspace to renew progress sharing.');
 const db=read();access(db,ctx);
 const relationship=allRelationships(db).find(r=>r.id===relationshipId&&r.type==='guardian'&&r.from===ctx.personId);
 if(!relationship)throw new Error('This progress connection is unavailable.');
 const expired=connectionStatus(relationship,clock().getTime())==='expired';
 if(!['declined','revoked'].includes(relationship.status)&&!expired)throw new Error('This progress connection is still open.');
 const learner=db.people.find(person=>person.id===relationship.to);
 if(!learner)throw new Error('This learner account is no longer available.');
 requestRelationship(ctx,learner.email,'guardian');
}
export function changeRelationship(ctx:RequestContext,relationshipId:string,status:'active'|'declined'|'revoked'){
 const db=read();const data=access(db,ctx);const r=allRelationships(db).find(r=>r.id===relationshipId&&(r.from===ctx.personId||r.to===ctx.personId));
 if(!r)throw new Error('Connection not found.');
 if(status!=='revoked'&&r.to!==ctx.personId)throw new Error('Only the recipient can answer a request.');
 if(status!=='revoked'&&r.status!=='pending')throw new Error('This request is no longer pending.');
 if(status==='active'&&connectionStatus(r,clock().getTime())==='unavailable')throw new Error('This invitation has an unreadable expiry. Close it and request a new invitation.');
 if(connectionStatus(r,clock().getTime())==='expired'&&status==='active')throw new Error('This invitation expired. Request a new invitation.');
 if(status==='active'&&r.type==='guardian'&&ctx.role!=='student')throw new Error('Open the learner workspace to answer this request.');
 if(status==='active'&&r.id.startsWith('legacy:OrganizationInvite:')){
  const row=readOrganizationInviteRows().find(item=>`legacy:OrganizationInvite:${item.id}`===r.id);
  if(row?.role!==ctx.role)throw new Error('Open the invited workspace role to accept this organization request.');
 }
 if(status==='revoked'&&!['active','pending'].includes(r.status))throw new Error('This connection is already closed.');
 if(r.id.startsWith('legacy:OrganizationInvite:')){changeOrganizationInvite(ctx,r.id.slice('legacy:OrganizationInvite:'.length),status==='revoked'&&r.status==='pending'?'cancelled':status);return;}
 if(r.id.startsWith('legacy:')){saveLegacyRelationship(r.id,status);return;}
 const event=status==='active'?'accepted':status==='declined'?'declined':r.status==='pending'?'cancelled':'revoked';
 r.status=status;if(status==='active')delete r.expiresAt;
 recordGuardianNotification(db,r,event);
 record(data,`Connection ${status}`,r.id);write(db);
}
export function familyReports(ctx:RequestContext,days:7|30=7){
 reportDays(days);if(ctx.role!=='parent')throw new Error('Parent workspace required.');
 const db=read();access(db,ctx);const cutoff=clock().getTime()-days*86400000;
 const seen=new Set<string>();
 return allRelationships(db).filter(r=>r.type==='guardian'&&r.from===ctx.personId&&connectionStatus(r,clock().getTime())==='active'&&r.scope.includes('progress-summary')).filter(r=>{if(seen.has(r.to))return false;seen.add(r.to);return true;}).flatMap(r=>{
  const child=db.people.find(p=>p.id===r.to);if(!child)return [];
  const sessions=db.workspaces.filter(w=>w.personId===child.id&&w.role==='student').flatMap(w=>db.data[w.id]?.sessions||[]);
  const recent=sessions.filter(s=>new Date(s.updatedAt).getTime()>=cutoff);
  return [{...legacyProgressSummary(child.email,cutoff),id:child.id,name:child.name,period:`Last ${days} days`,scope:r.scope,completed:recent.filter(s=>s.stage==='completed').length,objectives:recent.map(s=>({title:getJourney(s.journeyId,ctx.locale).title,stage:mastery(s.evidence.filter(e=>new Date(e.at).getTime()>=cutoff),true,clock())})),summary:recent.length?'Ask which explanation helped most. Offer time for a short review together.':'No guided-learning activity was shared in this period. Ask what they would like to explore next.'}];
 });
}
/** Summary-only classwork events for one child with active progress sharing. */
export function familyClassworkDigest(ctx:RequestContext,childId:string,days:7|30=7){
 reportDays(days);
 const child=familyReports(ctx).find(row=>row.id===childId);
 if(!child)throw new Error('This child’s classwork summary is no longer shared.');
 const db=read();const person=db.people.find(row=>row.id===childId);
 if(!person)throw new Error('This child is no longer available.');
 const rows=(name:string):Record<string,unknown>[]=>{
  try{const parsed=JSON.parse(localStorage.getItem(`visionary_entity_${name}`)||'[]');if(!Array.isArray(parsed))throw Error();return parsed;}
  catch{throw new Error('Classwork updates could not be read on this device. Try again.');}
 };
 const submissions=rows('Submission');const assignments=rows('Assignment');const enrollments=rows('Enrollment');
 const cutoff=clock().getTime()-days*86400000;
 const returned=submissions.filter(row=>row.student_email===person.email&&row.status==='graded'&&new Date(String(row.graded_date||0)).getTime()>=cutoff).map(row=>{
  const assignment=assignments.find(item=>item.id===row.assignment_id&&item.class_id===row.class_id);
  return {id:String(row.id),title:typeof assignment?.title==='string'?assignment.title:'Class activity',date:String(row.graded_date).slice(0,10)};
 }).sort((a,b)=>b.date.localeCompare(a.date));
 const classrooms=rows('Classroom');
 const memberships=readOrganizationInviteRows();
 const enrolledIds=new Set(enrollments.filter(row=>{
  if(row.student_email!==person.email||row.status!=='active')return false;
  const classroom=classrooms.find(item=>item.id===row.class_id);
  if(!classroom)return false;
  if(classroom.organization_email===undefined||classroom.organization_email==='')return true;
  if(typeof classroom.organization_email!=='string')throw Error('Classwork updates could not be read on this device. Try again.');
  return memberships.some(member=>member.email===person.email&&member.organization_email===classroom.organization_email&&['student','professional'].includes(member.role)&&person.roles.includes(member.role as Role)&&inviteStatus(member)==='active');
 }).map(row=>row.class_id));
 const today=clock().toISOString().slice(0,10);const through=new Date(clock().getTime()+7*86400000).toISOString().slice(0,10);
 const upcoming=assignments.filter(row=>enrolledIds.has(row.class_id)&&assignmentAcceptsResponses(row,clock().getTime())&&typeof row.due_date==='string'&&row.due_date>=today&&row.due_date<=through&&
   !submissions.some(item=>item.assignment_id===row.id&&item.student_email===person.email)).map(row=>({id:String(row.id),title:typeof row.title==='string'?row.title:'Class activity',dueDate:String(row.due_date)})).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
 return {period:`Last ${days} days`,returned,upcoming};
}
const demoStages:Record<string,string>={exam:'competitive',college:'higher_ed',professional:'professional',employee:'professional'};
export function seedDemo(personaId:string){const persona=scenarioPersonas.find(p=>p[0]===personaId);if(!persona)throw new Error('Unknown demo scenario.');const db=read();for(const p of scenarioPersonas){const personId=`demo-${p[0]}`;let person=db.people.find(x=>x.id===personId);if(!person){person={id:personId,email:`${p[0]}@visionary.test`,name:p[1].split(' · ')[0]!,ageBand:p[3],roles:[p[2]]};db.people.push(person);const ws=addWorkspace(db,person,p[2]);db.active[personId]=ws.id;const data=db.data[ws.id]!;data.preferences.locale=p[0]==='bengali'?'bn':'en';data.notifications.push({id:`welcome-${personId}`,text:'Your demo workspace is ready. Start with one useful next step.',read:false,path:'/dashboard/home'});}if(!person.learningContext&&demoStages[p[0]])person.learningContext={stage:demoStages[p[0]],subjects:[]};}
 const parent='demo-parent';for(const child of ['demo-minor-cbse','demo-bengali'])if(!db.relationships.some(r=>r.id===`${parent}:${child}`))db.relationships.push({id:`${parent}:${child}`,from:parent,to:child,type:'guardian',scope:['progress-summary'],status:'active'});
 const person=db.people.find(p=>p.id===`demo-${personaId}`)!;if(person.ageBand==='adult')for(const role of Object.keys(roleNames) as Role[]){if(!person.roles.includes(role))person.roles.push(role);addWorkspace(db,person,role);}write(db);return person;
}
export function exportWorkspace(ctx:RequestContext){return JSON.stringify(snapshot(ctx),null,2);}
export function selectConversation(ctx:RequestContext,conversationId:string|null){const db=read();const data=access(db,ctx);if(conversationId&&!data.conversations.some(c=>c.id===conversationId))throw new Error('Conversation not found.');data.activeConversationId=conversationId||undefined;write(db);}
export function setDemoUsage(ctx:RequestContext,usage:number){const db=read();const data=access(db,ctx);data.subscription.usage=Math.max(0,usage);data.subscription.usageDay=now().slice(0,10);write(db);}
