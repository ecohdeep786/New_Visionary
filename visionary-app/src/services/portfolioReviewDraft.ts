import type { RequestContext } from '../domain/workspace.ts';
import { snapshot, workspaceIdentity, portfolioReviewCriteria } from './workspaceService.ts';
import { getResourceEditorDraft, saveResourceEditorDraft, clearResourceEditorDraft } from './resourceEditorDraft.ts';

export interface ReviewDraft {
 title:string; body:string; projectVersion:string; reviewRevision:string;
 ratings:Record<string,{id:string;rating:string;note:string}>;
}
function key(ctx:RequestContext,artifactId:string){
 const identity=workspaceIdentity(ctx);
 if(ctx.role!=='professional'||identity.person.ageBand!=='adult')throw Error('Open an adult professional workspace to recover portfolio review edits.');
 if(!snapshot(ctx).artifacts.some(artifact=>artifact.id===artifactId))throw Error('This portfolio project is unavailable in your workspace.');
 return `new:portfolio-review:${artifactId}`;
}
function validate(value:unknown):asserts value is ReviewDraft{
 const draft=value as ReviewDraft;
 if(!draft||typeof draft.title!=='string'||typeof draft.body!=='string'||draft.body.length>1000||
 typeof draft.projectVersion!=='string'||typeof draft.reviewRevision!=='string'||!draft.ratings||
 typeof draft.ratings!=='object'||Array.isArray(draft.ratings)||Object.keys(draft.ratings).length!==portfolioReviewCriteria.length||
 portfolioReviewCriteria.some(rule=>{const row=draft.ratings[rule.id];return !row||row.id!==rule.id||!['','needs-work','explained','supported'].includes(row.rating)||typeof row.note!=='string'||row.note.length>500;}))throw Error('Portfolio review recovery is incomplete. The original backup is retained.');
}
export function getPortfolioReviewDraft(ctx:RequestContext,artifactId:string){
 const saved=getResourceEditorDraft(ctx,key(ctx,artifactId));if(!saved)return null;
 validate(saved.draft);return saved.draft;
}
export function savePortfolioReviewDraft(ctx:RequestContext,artifactId:string,draft:ReviewDraft){
 const storageKey=key(ctx,artifactId);validate(draft);
 const previous=getResourceEditorDraft(ctx,storageKey);if(previous)validate(previous.draft);
 saveResourceEditorDraft(ctx,storageKey,{...draft},draft.reviewRevision);
}
export function clearPortfolioReviewDraft(ctx:RequestContext,artifactId:string){clearResourceEditorDraft(ctx,key(ctx,artifactId));}
