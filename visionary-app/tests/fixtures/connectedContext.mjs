import {bootstrapPerson} from '../../src/services/workspaceService.ts';
/** Linked class fixtures must use their explicit Work workspace. */
export function connectedContext(ctx, required=true){
 const email=ctx.personId.replace('demo-','')+'@visionary.test';
 const person=bootstrapPerson({id:ctx.personId,email,identity:ctx.role});
 const work=person.workspaces.find(row=>row.role===ctx.role&&row.organizationId==='school-admin@visionary.test');
 if(!work&&!required)return ctx;
 if(!work)throw Error('Connected classroom fixture requires an active matching Work membership.');
 return {...ctx,workspaceId:work.id};
}
