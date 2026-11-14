/**
 * Preview repository for workspace records. Authentication has exactly one
 * source: the connected Firebase adapter. Profiles arrive from the server
 * session (firebaseAuth) and credentials never exist in this module or in
 * browser storage. Browser storage keeps only the per-device preview data
 * below until the server owns learning records.
 */

import { previewPolicy } from './previewPermissions.js';
import { firebaseAuth } from './firebase/authAdapter.js';
import {connectionStatus} from '../lib/connectionAvailability.js';
import {curriculumPublicationRevision,deliveredCurriculumRevision} from '../lib/curriculumPublication.js';
import {classworkReviewRevision} from '../lib/classworkRubric.js';
import {classworkActivityRevision} from '../lib/classworkSource.js';

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    throw new Error('Your changes could not be saved on this device. Check available browser storage and try again.', { cause: err });
  }
};

/* ── Identity: the server session is the only profile authority ── */

let previewProfile = null;

/** Preview/test seam: stands in for the connected server session so node tests
 * and preview fixtures can sign in without a transport. A real server profile
 * always wins while one exists, and production code never imports this. */
export const previewSignIn = (profile) => {
  if (import.meta.env && !import.meta.env.DEV) throw new Error('Preview identity is unavailable.');
  previewProfile = profile;
};

const currentProfile = () => firebaseAuth.currentProfile() ?? previewProfile;

const previewMe = async () => {
  const profile = currentProfile();
  if (!profile) throw new Error('Not signed in');
  return profile;
};

/* ── Preview entity store ── */

/* Personal account separation in the preview; production needs database rules. */
const personalEntities = new Set(['Subject', 'Topic', 'Exam', 'StudyLog', 'Question', 'Bookmark', 'Project', 'PracticeSession']);
const entityKey = (name) => `visionary_entity_${name}`;
const readEntities = (name) => {
  try {const raw=localStorage.getItem(entityKey(name));if(!raw)return [];const rows=JSON.parse(raw);if(!Array.isArray(rows)||rows.some(row=>!row||typeof row!=='object'||Array.isArray(row)))throw Error();return rows;}
  catch {throw new Error(`${name} records could not be read. Saved records have not been replaced. Retry after reviewing the local data.`);}
};
const entityUser = () => {
  const user=currentProfile();if(!user)return null;
  const db=readJson('visionary_workspace_v2',null);
  const workspace=db?.workspaces?.find(w=>w.id===db.active?.[user.id]&&w.personId===user.id);
  return {...user,identity:workspace?.role||user.identity,workspace_id:workspace?.id,organization_id:workspace?.organizationId};
};
const notifyChange = () => window.dispatchEvent(new CustomEvent('visionary:workspace-change'));
const assertCommandContext = (options) => {
  const expected=options.expectedContext;
  if(!expected)return;
  const current=entityUser();
  if(!current||current.id!==expected.personId||current.workspace_id!==expected.workspaceId||current.identity!==expected.role)throw new Error('Your workspace changed. Reopen classwork in your active workspace. Your edits remain here.');
};
const assertReviewedResource = (options) => {
  const expected=options.expectedResource;
  if(!expected)return;
  const db=readJson('visionary_workspace_v2',null);
  const resources=db?.data?.[expected.workspaceId]?.resources;
  const resource=Array.isArray(resources)?resources.find(row=>row.id===expected.id):null;
  if(!resource||JSON.stringify(resource)!==expected.revision)throw new Error('This lesson changed before assignment. Reopen it and review the saved version.');
};
const assertDeliveredCurriculum = (options) => {
  const expected=options.expectedDelivery;
  if(!expected)return;
  const db=readJson('visionary_workspace_v2',null);
  const owner=db?.people?.find(person=>person.email===expected.organizationEmail);
  const space=db?.workspaces?.find(row=>row.personId===owner?.id&&row.role==='organization'&&!row.organizationId);
  const resources=space?db?.data?.[space.id]?.resources:null;
  const resource=Array.isArray(resources)?resources.find(row=>row.id===expected.resourceId):null;
  const deliveries=resource?.contentReview?.deliveries;
  const delivery=Array.isArray(deliveries)?deliveries.find(row=>row.id===expected.deliveryId):null;
  if(entityUser()?.organization_id!==expected.organizationEmail||!delivery||deliveredCurriculumRevision(delivery)!==expected.revision)throw new Error('The reviewed source changed. Review this delivery again before publishing.');
};
const assertSubmissionSource = (record, options) => {
  if(options.expectedAssignmentRevision===undefined)return;
  const assignment=readEntities('Assignment').find(row=>row.id===record.assignment_id&&row.class_id===record.class_id);
  if(!assignment||classworkActivityRevision(assignment)!==options.expectedAssignmentRevision)throw new Error('The assigned content changed. Your response remains here. Export it, then reopen the latest activity before submitting.');
};
const visibleRecords = (name, ownerEmail) => {
  const currentUser = entityUser();
  if (name === 'User') return currentUser?[{id:currentUser.id,email:currentUser.email}]:[];
  if (!currentUser) return [];
  if (!personalEntities.has(name)) {
    const policy=previewPolicy(currentUser,readEntities);
    return readEntities(name).filter(r=>policy.canRead(name,r)).map(r=>policy.projectRead(name,r));
  }
  const owner = ownerEmail || currentUser.email;
  if (owner !== currentUser.email) {
    const shared = ['Subject', 'Topic', 'StudyLog'].includes(name) && currentUser.identity === 'parent' &&
      readEntities('FamilyLink').some((link) => link.parent_email === currentUser.email && link.child_email === owner && connectionStatus(link) === 'active');
    if (!shared) return [];
  }
  return readEntities(name).filter((record) => (record.owner_email || record.student_email) === owner&&
    (owner!==currentUser.email||!currentUser.workspace_id||record.workspace_id===currentUser.workspace_id||!record.workspace_id&&!currentUser.organization_id&&currentUser.identity===(currentProfile().education_stage==='professional'?'professional':currentProfile().identity)));
};
const sortedRecords = (records, sort, limit) => {
  const result = [...records];
  if (sort) {
    const field = sort.replace(/^-/, '');
    const direction = sort.startsWith('-') ? -1 : 1;
    result.sort((a, b) => {
      const left = a[field] ?? (field === 'created_date' ? a.createdAt : '') ?? '';
      const right = b[field] ?? (field === 'created_date' ? b.createdAt : '') ?? '';
      return (typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true })) * direction;
    });
  }
  return Number.isFinite(limit) ? result.slice(0, Math.max(0, limit)) : result;
};
const prepareRecord = (name, record) => {
  const currentUser = entityUser();
  if (!currentUser) throw new Error('Please sign in to save changes.');
  if (name === 'User') throw new Error('Use account settings to change your profile.');
  if(!personalEntities.has(name))previewPolicy(currentUser,readEntities).assertWrite(name,record,'create',record);
  return { ...record, id: crypto.randomUUID(), createdAt: Date.now(), created_date: new Date().toISOString(),
    ...(personalEntities.has(name) ? { owner_email: currentUser.email,workspace_id:currentUser.workspace_id } : {}) };
};
const entityStore = new Proxy({}, {
  get: (_target, name) => ({
    async findByJoinCode(code) {
      if(name!=='Classroom'||!['student','professional'].includes(entityUser()?.identity))throw new Error('Use a learner workspace to join a class.');
      const normalized=String(code||'').trim().toUpperCase();if(!normalized)return null;
      const c=readEntities('Classroom').find(c=>c.join_code===normalized);
      return c&&previewPolicy(entityUser(),readEntities).canJoinClass(c.id)?{id:c.id,name:c.name,teacher_name:c.teacher_name,join_code:c.join_code}:null;
    },
    async list(sort, limit) { return sortedRecords(visibleRecords(name), sort, limit); },
    async filter(filters = {}, sort, limit) {
      return sortedRecords(visibleRecords(name, filters.owner_email).filter((record) =>
        Object.entries(filters).every(([key, value]) => record[key] === value)), sort, limit);
    },
    async get(id) { return visibleRecords(name).find((record) => record.id === id) || null; },
    async create(record, options = {}) {
      if(['Submission','Assignment','Classroom'].includes(name))assertCommandContext(options);
      const created = prepareRecord(name, record);
      if(name==='Assignment')assertReviewedResource(options);
      if(name==='Submission')assertSubmissionSource(created,options);
      const rows=readEntities(name);
      if(name==='Submission'){
        const existing=rows.find(row=>row.assignment_id===created.assignment_id&&row.class_id===created.class_id&&row.student_email===created.student_email);
        if(existing){if(existing.text===created.text&&JSON.stringify(existing.responses||[])===JSON.stringify(created.responses||[])&&existing.status!=='revision_requested')return existing;throw new Error('A response is already saved for this assignment. Reopen it before submitting a different copy.');}
      }
      writeJson(entityKey(name), [...rows, created]);
      notifyChange();
      return created;
    },
    async bulkCreate(newRecords) {
      const created = newRecords.map((record) => prepareRecord(name, record));
      const rows=readEntities(name);
      if(name==='Submission'){
        const keys=new Set(rows.map(row=>JSON.stringify([row.class_id,row.assignment_id,row.student_email])));
        for(const row of created){const key=JSON.stringify([row.class_id,row.assignment_id,row.student_email]);if(keys.has(key))throw new Error('A response is already saved for this assignment. No bulk submissions were added.');keys.add(key);}
      }
      writeJson(entityKey(name), [...rows, ...created]);
      notifyChange();
      return created;
    },
    async update(id, updates, options = {}) {
      if(['Submission','Assignment','Classroom'].includes(name))assertCommandContext(options);
      if (name === 'User' || !currentProfile() || !visibleRecords(name).some((record) => record.id === id)) throw new Error('This record is not available in your workspace.');
      if(name==='Assignment'&&options.expectedAssignmentStateRevision!==undefined){const current=readEntities(name).find(row=>row.id===id);if(JSON.stringify([current.status||'published',current.state_history||[]])!==options.expectedAssignmentStateRevision)throw new Error('The assignment state changed. Reload classwork before trying again.');}
      if(name==='Submission')assertSubmissionSource(readEntities(name).find(record=>record.id===id),options);
      if(name==='Submission'&&options.expectedReviewRevision!==undefined&&options.expectedReviewRevision!==classworkReviewRevision(readEntities(name).find(record=>record.id===id)))throw new Error('This review changed while saving. Export your edits, then load the latest review.');
      if(name==='Classroom')assertDeliveredCurriculum(options);
      if(name==='Classroom'&&Object.hasOwn(updates,'curriculum_publications')&&options.expectedCurriculumRevision!==curriculumPublicationRevision(readEntities(name).find(record=>record.id===id)?.curriculum_publications))throw new Error('The published curriculum changed. Review the latest copies before publishing.');
      if(!personalEntities.has(name))previewPolicy(entityUser(),readEntities).assertWrite(name,readEntities(name).find(r=>r.id===id),'update',updates);
      const { id: ignoredId, owner_email: ignoredOwner, workspace_id: ignoredWorkspace, ...fields } = updates;
      const updated = readEntities(name).map((record) => record.id === id ? { ...record, ...fields } : record);
      writeJson(entityKey(name), updated);
      notifyChange();
      return updated.find((record) => record.id === id);
    },
    async delete(id) {
      if (name === 'User' || !currentProfile() || !visibleRecords(name).some((record) => record.id === id)) throw new Error('This record is not available in your workspace.');
      if(!personalEntities.has(name))previewPolicy(entityUser(),readEntities).assertWrite(name,readEntities(name).find(r=>r.id===id),'delete');
      writeJson(entityKey(name), readEntities(name).filter((record) => record.id !== id));
      notifyChange();
    },
  }),
});

export const appClient = {
  auth: import.meta.env?.PROD ? firebaseAuth : {
    ...firebaseAuth,
    /* Preview seam: while a test/preview profile stands in for the server
     * session, me() answers from it; the connected adapter stays authoritative
     * for every production call. */
    currentProfile,
    me: (options) => (previewProfile && !firebaseAuth.currentProfile() ? previewMe() : firebaseAuth.me(options)),
  },
  ...(import.meta.env?.PROD ? {} : { entities: entityStore }),
  integrations: {
    Core: {
      async InvokeLLM() {
        throw new Error('AI responses are not available yet. Your workspace and saved questions are still available.');
      },
    },
  },
};
