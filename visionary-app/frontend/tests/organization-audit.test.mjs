import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';

const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const ctx = (person, role) => ({ personId: `demo-${person}`, workspaceId: `demo-${person}:${role}`, role, locale: 'en' });
beforeEach(() => { storage.clear(); workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-30T12:00:00Z') }); workspace.seedDemo('school-admin'); });

test('audit combines only owned organization sources and keeps actors, periods and private text honest', () => {
 const org = ctx('school-admin', 'organization');
 const invite = workspace.requestOrganizationInvite(org, 'employee@visionary.test', 'professional');
 workspace.changeOrganizationInvite(ctx('employee', 'professional'), invite.id, 'active');
 workspace.saveResource(org, { title: 'Reviewed resource', body: 'PRIVATE_RESOURCE_BODY', kind: 'lesson' });
 workspace.requestOrganizationInvite(ctx('company-admin', 'organization'), 'teacher@visionary.test', 'teacher');
 const result = workspace.organizationAudit(org);
 assert.equal(result.entries.length, 3);
 assert.deepEqual(result.entries.filter(row => row.source === 'membership').map(row => row.actor).sort(), ['employee@visionary.test', 'school-admin@visionary.test']);
 assert.equal(result.entries.find(row => row.source === 'workspace').actor, null);
 assert.equal(JSON.stringify(result).includes('PRIVATE_RESOURCE_BODY'), false);
 assert.equal(JSON.stringify(result).includes('teacher@visionary.test'), false);
 assert.throws(() => workspace.organizationAudit(ctx('employee', 'professional')), /organization workspace/);
 assert.throws(() => workspace.organizationAudit(org, 14), /supported report period/);
 workspace.configureMock({ now: () => new Date('2026-10-15T12:00:00Z') });
 assert.equal(workspace.organizationAudit(org, 7).entries.length, 0);
 assert.equal(workspace.organizationAudit(org, 30).entries.length, 3);
});

test('unreadable membership history retains available workspace audit and exposes no invented imported events', () => {
 const org = ctx('school-admin', 'organization');
 workspace.saveResource(org, { title: 'Draft', body: 'text', kind: 'lesson' });
 localStorage.setItem('visionary_entity_OrganizationInvite', JSON.stringify([{ id: 'older', organization_email: 'school-admin@visionary.test', email: 'employee@visionary.test', role: 'professional', status: 'active' }]));
 assert.equal(workspace.organizationAudit(org).importedWithoutHistory, 1);
 assert.equal(workspace.organizationAudit(org).entries.length, 1);
 localStorage.setItem('visionary_entity_OrganizationInvite', '{broken');
 const partial = workspace.organizationAudit(org);
 assert.deepEqual(partial.unavailableSources, ['Membership history']);
 assert.equal(partial.entries.length, 1);
});
test('class state audit scopes by organization and excludes private documents and missing historical actors',()=>{
 const org=ctx('school-admin','organization');
 storage.set('visionary_entity_Classroom',JSON.stringify([{id:'owned',organization_email:'school-admin@visionary.test'},{id:'foreign',organization_email:'company-admin@visionary.test'},{id:'personal'}]));
 storage.set('visionary_entity_Assignment',JSON.stringify([{id:'activity',class_id:'owned',title:'PRIVATE_TITLE',description:'PRIVATE_INSTRUCTIONS',state_history:[{from:'new',to:'draft',actor:'teacher@visionary.test',at:'2026-09-30T10:00:00Z'},{from:'draft',to:'published',at:'2026-09-30T11:00:00Z'}]},{id:'older',class_id:'owned'},{id:'foreign-activity',class_id:'foreign',state_history:[{from:'draft',to:'published',actor:'FOREIGN_ACTOR',at:'2026-09-30T10:00:00Z'}]}]));
 const result=workspace.organizationAudit(org);assert.equal(result.entries.length,2);assert.equal(result.classworkWithoutHistory,1);assert.ok(result.entries.every(row=>row.source==='classwork'));assert.equal(result.entries[0].actor,null);assert.equal(result.entries[1].actor,'teacher@visionary.test');assert.equal(result.entries[0].target,'Class owned · Activity activity');assert.equal(JSON.stringify(result).includes('PRIVATE_'),false);assert.equal(JSON.stringify(result).includes('FOREIGN_ACTOR'),false);
 workspace.configureMock({now:()=>new Date('2026-10-15T12:00:00Z')});assert.equal(workspace.organizationAudit(org,7).entries.length,0);assert.equal(workspace.organizationAudit(org,30).entries.length,2);
});
test('unreadable classwork source reports partial history while preserving available sources and original bytes',()=>{
 const org=ctx('school-admin','organization');workspace.saveResource(org,{title:'Owned',body:'private',kind:'lesson'});storage.set('visionary_entity_Classroom','{broken-original');const before=new Map(storage);const result=workspace.organizationAudit(org);assert.deepEqual(result.unavailableSources,['Classwork state history']);assert.equal(result.entries[0].source,'workspace');assert.deepEqual(storage,before);
});
