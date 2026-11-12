import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fixture from '../data-02/postgres-fixture.cjs';
const { req, backend, stagingDatabase } = fixture;
const { Firestore } = req('firebase-admin/firestore');
const { MigrationRunner } = req('./dist/src/data/migration-runner.js');
const { canonicalMigrations } = req('./dist/src/data/migration-registry.js');
const { WorkspaceProvisioner } = req('./dist/src/workspaces/workspace-provisioner.js');
const { PostgresProvisionStore } = req('./dist/src/workspaces/provision-store.js');
const { FirestoreProvisionLinks } = req('./dist/src/workspaces/firestore-provision-links.js');
const { provisionIdentity, hash } = req('./dist/src/workspaces/provision-types.js');
const { PersonalWorkspaceController } = req('./dist/src/workspaces/personal-workspace.controller.js');
const { PersonalWorkspaceService } = req('./dist/src/workspaces/personal-workspace.service.js');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { ConfigService } = req('@nestjs/config');
// This pinned Nest version prioritizes process.env over internal values.
// Keep HTTP fixtures independent of Prisma loading the ignored product .env.
const fixtureConfig = values => { const config = new ConfigService(); config.get = (key, fallback) => values[key] ?? fallback; return config; };
const { Module, UnauthorizedException, HttpException } = req('@nestjs/common');
const { NestFactory } = req('@nestjs/core');
if (!/^127[.]0[.]0[.]1:[0-9]{1,5}$/.test(process.env.FIRESTORE_EMULATOR_HOST || '')) throw Error('Explicit loopback Firestore emulator required; live fallback prohibited.');
const db = new Firestore({ projectId: 'demo-visionary-kan38' });
const prefix = 'kan38-' + randomUUID().replaceAll('-', '');
let env, store, links, provisioner, target, targetKey;
const link = root => root.collection('developmentWorkspaceLinks').doc(targetKey);
const identity = (uid,input) => provisionIdentity(uid,input,target);
const owned = [];
const command = (id='same', source='manual') => ({ commandId: id, payload: { source } });
async function account(suffix) {
  const uid = prefix + '-' + suffix, root = db.collection('visionary_accounts').doc(uid);
  await root.set({ uid, identity: {uid}, storageVersion: 2, profile: { name: 'Synthetic unchanged' }, onboarding: { status: 'complete' } });
  await root.collection('billing').doc('test').set({ uid, revision: 8, basePlan: 'start' });
  owned.push(root); return uid;
}
before(async () => {
  env = await stagingDatabase(); await new MigrationRunner(env.store(), canonicalMigrations(backend)).applyAll(); await env.grantRuntime();
  const url = new URL(env.config.runtimeUrl);
  target = { environment:'local',environmentId:'test-local',firebaseProject:'demo-visionary-kan38',firebaseDatabase:'(default)',firestoreMode:'emulator',sqlProject:'local',region:'local',instance:'loopback-'+(url.port||'5432'),database:url.pathname.slice(1),schema:env.schema };
  targetKey = identity('fixture-target',command()).targetKey;
  store = new PostgresProvisionStore(env.runtime, {role:env.runtimeRole,schema:env.schema}); links = new FirestoreProvisionLinks(db); provisioner = new WorkspaceProvisioner(store, links, target);
});
after(async () => {
  for (const root of owned) await db.recursiveDelete(root);
  await db.terminate(); if (env) await env.close();
});
test('real SQL + Firestore commit preserves original account/profile/billing and replays after new clients', async () => {
  const uid = await account('durable'), root = owned.at(-1);
  const before = [(await root.get()).data(), (await root.collection('billing').doc('test').get()).data()];
  const first = await provisioner.provision(uid, command());
  assert.equal(first.replay, false);
  const freshSql = fixture.req('@prisma/client').PrismaClient;
  const sql = new freshSql({ datasources: { db: { url: env.config.runtimeUrl } } });
  const freshDb = new Firestore({ projectId: 'demo-visionary-kan38' });
  try {
    const replay = await new WorkspaceProvisioner(new PostgresProvisionStore(sql, {role:env.runtimeRole,schema:env.schema}), new FirestoreProvisionLinks(freshDb), target).provision(uid, command());
    assert.equal(replay.personalWorkspaceId, first.personalWorkspaceId); assert.equal(replay.replay, true);
  } finally { await sql.$disconnect(); await freshDb.terminate(); }
  assert.deepEqual([(await root.get()).data(), (await root.collection('billing').doc('test').get()).data()], before);
  const savedLink = (await link(root).get()).data();
  assert.equal(savedLink.personalWorkspaceId, first.personalWorkspaceId); assert.equal(savedLink.status, 'provisioned');
  assert.equal((await root.collection('domainLinks').doc('connections').get()).exists,false);
  assert.equal(await env.db.workspace.count({ where: { uid, isPersonal: true } }), 1);
  assert.equal(await env.db.workspaceMembership.count({ where: { uid, role: 'OWNER' } }), 1);
  assert.equal(await env.db.outboxEvent.count({ where: { uid } }), 1);
  assert.equal(await env.db.auditEvent.count({ where: { uid } }), 1);
});
test('concurrent changed command payload has one committed winner; cross-user common keys stay independent', async () => {
  const uid = await account('race');
  const outcomes = await Promise.allSettled(['manual', 'onboarding'].map(source => provisioner.provision(uid, command('race', source))));
  assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1); assert.equal(outcomes.filter(r => r.status === 'rejected').length, 1);
  assert.equal(await env.db.commandResult.count({ where: { uid } }), 1);
  const a = await account('a'), b = await account('b');
  const [ra, rb] = await Promise.all([provisioner.provision(a, command()), provisioner.provision(b, command())]);
  assert.notEqual(ra.personalWorkspaceId, rb.personalWorkspaceId);
  assert.equal(await env.db.commandResult.count({ where: { uid: { in: [a,b] } } }), 2);
});
test('actual SQL transaction rejects a changed concurrent receipt and serializes first-ever identical provisioning', async () => {
  const uid = await account('sql-race');
  const outcomes = await Promise.allSettled(['manual', 'onboarding'].map(source => store.commit(identity(uid, command('same', source)))));
  assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(await env.db.workspace.count({ where: { uid } }), 1);
  const other = await account('sql-identical');
  const results = await Promise.all(Array.from({length:4}, () => store.commit(identity(other, command()))));
  assert.equal(new Set(results.map(r => r.personalWorkspaceId)).size, 1);
  assert.equal(await env.db.commandResult.count({ where: { uid: other } }), 1);
});
test('failure after SQL commit leaves Firestore pending and a fresh invocation repairs without duplicate writes', async () => {
  const uid = await account('ack'), root = owned.at(-1);
  const interrupted = new WorkspaceProvisioner(store, { begin: i => links.begin(i), complete: async () => { throw Error('synthetic completion outage'); } }, target);
  await assert.rejects(interrupted.provision(uid, command()), /completion outage/);
  assert.equal((await link(root).get()).data().status, 'pending');
  assert.equal(await env.db.workspace.count({ where: { uid } }), 1);
  const fixed = await provisioner.provision(uid, command());
  assert.equal(fixed.replay, true); assert.equal(fixed.recovered, true);
  assert.equal((await link(root).get()).data().status, 'provisioned');
  assert.equal(await env.db.outboxEvent.count({ where: { uid } }), 1);
});
test('real mid-transaction privilege failure rolls back domain and receipt; retry resolves durable pending', async () => {
  const uid = await account('sql-outage');
  await env.admin.$executeRawUnsafe('REVOKE INSERT ON TABLE "' + env.schema + '"."outbox_events" FROM "' + env.runtimeRole + '"');
  try { await assert.rejects(provisioner.provision(uid, command())); }
  finally { await env.grantRuntime(); }
  assert.equal(await env.db.workspace.count({ where: { uid } }), 0); assert.equal(await env.db.commandResult.count({ where: { uid } }), 0);
  const fixed = await provisioner.provision(uid, command()); assert.equal(fixed.recovered, true);
});
test('wrong UID, foreign references, invalid fields and missing account fail before SQL; default payload is stable', async () => {
  const uid = await account('denials');
  for (const invalid of ['', '__internal__', 'bad/uid']) await assert.rejects(provisioner.provision(invalid, command()));
  for (const input of [{...command(), uid:'foreign'}, {commandId:'x',payload:{workspaceId:'foreign'}}, {commandId:'x',payload:{source:'bad'}}, {commandId:''}, {commandId:'x',payload:[]}]) await assert.rejects(provisioner.provision(uid,input));
  await assert.rejects(provisioner.provision(prefix+'-missing', command()));
  assert.equal(await env.db.workspace.count({ where: { uid } }), 0);
  assert.deepEqual(identity(uid,{commandId:'default'}),identity(uid,{payload:{source:'manual'},commandId:'default'}));
});
test('tombstone, foreign/newer Firestore state and privileged SQL adapter cannot provision or revive ownership', async () => {
  const uid = await account('tombstone'); const result = await provisioner.provision(uid, command());
  await env.db.deletionTombstone.create({ data:{uid,resourceType:'workspace',resourceId:result.personalWorkspaceId,reason:'synthetic deletion'} });
  await assert.rejects(provisioner.provision(uid, command()));
  const foreign = await account('foreign-link'), root = owned.at(-1);
  await link(root).set({uid:'foreign',schemaVersion:1,domain:'personal-workspace',status:'provisioned'});
  await assert.rejects(provisioner.provision(foreign,command()));
  await link(root).set({uid:foreign,schemaVersion:2,domain:'personal-workspace',status:'pending'});
  await assert.rejects(provisioner.provision(foreign,command()));
  await assert.rejects(new PostgresProvisionStore(env.db, {role:env.runtimeRole,schema:env.schema}).commit(identity(foreign,command())),/UNAVAILABLE/);
  assert.equal(await env.db.workspace.count({where:{uid:foreign}}),0);
});
test('same live-style Firestore UID remains isolated across SQL targets and never publishes a local production link', async () => {
  const uid = await account('target-isolation'), root = owned.at(-1), second = await stagingDatabase();
  try {
    await new MigrationRunner(second.store(), canonicalMigrations(backend)).applyAll(); await second.grantRuntime();
    const otherTarget = { ...target, schema: second.schema };
    const first = await provisioner.provision(uid, command());
    const other = new WorkspaceProvisioner(new PostgresProvisionStore(second.runtime, {role:second.runtimeRole,schema:second.schema}), new FirestoreProvisionLinks(db), otherTarget);
    const result = await other.provision(uid, command()); assert.notEqual(result.personalWorkspaceId,first.personalWorkspaceId);
    assert.equal((await root.collection('developmentWorkspaceLinks').get()).size,2);
    assert.equal((await root.collection('domainLinks').doc('connections').get()).exists,false);
    assert.equal((await provisioner.provision(uid,command())).personalWorkspaceId,first.personalWorkspaceId);
    await assert.rejects(store.commit(provisionIdentity(uid,command('wrong-target'),otherTarget)),/UNAVAILABLE/);
  } finally { await second.close(); }
});
test('NOINHERIT metadata table and sequence delegation is refused before any domain mutation', async () => {
  const uid = await account('delegate'), delegate = 'kan38_delegate_' + randomUUID().replaceAll('-','');
  const q = name => '"' + name + '"', table = q(env.schema) + '."_visionary_migrations"';
  const [sequence] = await env.admin.$queryRawUnsafe('SELECT sequencename FROM pg_sequences WHERE schemaname=$1 AND sequencename LIKE $2',env.schema,'_visionary_migrations%');
  assert.ok(sequence); const seq = q(env.schema)+'.'+q(sequence.sequencename);
  await env.admin.$executeRawUnsafe('CREATE ROLE '+q(delegate)+' NOLOGIN');
  try {
    await env.admin.$executeRawUnsafe('ALTER ROLE '+q(env.runtimeRole)+' NOINHERIT');
    await env.admin.$executeRawUnsafe('GRANT '+q(delegate)+' TO '+q(env.runtimeRole));
    await env.admin.$executeRawUnsafe('GRANT TRIGGER ON TABLE '+table+' TO '+q(delegate));
    await assert.rejects(store.commit(identity(uid,command())),/UNAVAILABLE/);
    await env.admin.$executeRawUnsafe('REVOKE TRIGGER ON TABLE '+table+' FROM '+q(delegate));
    await env.admin.$executeRawUnsafe('GRANT USAGE ON SEQUENCE '+seq+' TO '+q(delegate));
    await assert.rejects(store.commit(identity(uid,command())),/UNAVAILABLE/);
    assert.equal(await env.db.workspace.count({where:{uid}}),0);
  } finally {
    await env.admin.$executeRawUnsafe('REVOKE TRIGGER ON TABLE '+table+' FROM '+q(delegate));
    await env.admin.$executeRawUnsafe('REVOKE USAGE ON SEQUENCE '+seq+' FROM '+q(delegate));
    await env.admin.$executeRawUnsafe('REVOKE '+q(delegate)+' FROM '+q(env.runtimeRole));
    await env.admin.$executeRawUnsafe('ALTER ROLE '+q(env.runtimeRole)+' INHERIT');
    await env.admin.$executeRawUnsafe('DROP ROLE '+q(delegate));
  }
});
test('inconsistent account identity, storage migration and malformed provisioned state cannot create or publish a workspace', async () => {
  const uid = await account('account-guards'), root = owned.at(-1);
  await root.update({ identity:{uid:'foreign'} }); await assert.rejects(provisioner.provision(uid,command()),/WRONG_OWNER/);
  await root.update({ identity:{uid},storageMigration:{status:'copying'} }); await assert.rejects(provisioner.provision(uid,command()),/UNAVAILABLE/);
  assert.equal(await env.db.workspace.count({where:{uid}}),0);
  await root.update({storageMigration:{status:'complete'}});
  const interrupted = new WorkspaceProvisioner(store, {begin:i=>links.begin(i),complete:async(i,id)=>{
    await root.update({storageMigration:{status:'copying'}}); return links.complete(i,id);
  }}, target);
  await assert.rejects(interrupted.provision(uid,command()),/UNAVAILABLE/);
  assert.equal((await link(root).get()).data().status,'pending');
  await root.update({storageMigration:{status:'complete'}}); assert.equal((await provisioner.provision(uid,command())).replay,true);
  const other = await account('malformed-state'), otherRoot = owned.at(-1);
  await link(otherRoot).set({uid:other,schemaVersion:1,domain:'personal-workspace',targetKey,target,status:'provisioned',personalWorkspaceId:0});
  await assert.rejects(provisioner.provision(other,command()),/CONFLICT/);
  assert.equal(await env.db.workspace.count({where:{uid:other}}),0);
});
test('actual HTTP controller requires session + CSRF + account binding before real provisioning; default service stays disabled', async () => {
  const uid = await account('http'), csrf = 'c'.repeat(64);
  const config = fixtureConfig({ AUTH_PUBLIC_ORIGIN:'http://localhost:5173', FIREBASE_PROJECT_ID:'demo-visionary-kan38', FIREBASE_PROJECT_KIND:'emulator', DATA_WORKSPACE_ENVIRONMENT_ID:'test-local', DATA_WORKSPACE_PROVISIONING_ENABLED:'true',
    DATA_WORKSPACE_RUNTIME_URL:env.config.runtimeUrl+'&pool_timeout=5&connect_timeout=5', DATA_WORKSPACE_RUNTIME_ROLE:env.runtimeRole, DATA_WORKSPACE_SCHEMA:env.schema });
  let admitted = 0, throttled = false;
  const auth = { rateLimit:async(scope,subject,limit)=>{assert.equal(scope,'personal-workspace-provision');assert.equal(subject,uid);assert.equal(limit,10);admitted++;if(throttled)throw new HttpException('Rate limited',429);}, getDatabase:()=>db, authenticate:async(cookie,device)=>{if(cookie!=='synthetic-http-session'||device!=='a'.repeat(64))throw new UnauthorizedException(); return {uid};} };
  const service = new PersonalWorkspaceService(auth,config);
  class HttpFixture {} Module({controllers:[PersonalWorkspaceController],providers:[{provide:ConfigService,useValue:config},{provide:FirebaseProductService,useValue:auth},{provide:PersonalWorkspaceService,useValue:service}]})(HttpFixture);
  const app = await NestFactory.create(HttpFixture,{logger:false}); app.use(req('cookie-parser')()); await app.listen(0,'127.0.0.1');
  const url = (await app.getUrl())+'/account/workspace/provision';
  const headers = {'content-type':'application/json',origin:'http://localhost:5173','x-csrf-token':csrf,'x-visionary-account':uid,cookie:'visionary-session=synthetic-http-session; visionary-device='+'a'.repeat(64)+'; visionary-csrf='+csrf};
  const post = extra => fetch(url,{method:'POST',headers:{...headers,...extra},body:JSON.stringify(command())});
  try {
    assert.equal((await post({'x-csrf-token':'bad'})).status,403);
    assert.equal((await post({cookie:'visionary-csrf='+csrf})).status,401);
    assert.equal((await post({'x-visionary-account':'other'})).status,409);
    assert.equal(await env.db.workspace.count({where:{uid}}),0);
    assert.equal(admitted,0);
    throttled=true; assert.equal((await post({})).status,429);
    assert.equal(await env.db.workspace.count({where:{uid}}),0);
    assert.equal((await link(owned.at(-1)).get()).exists,false);
    throttled=false;
    const response = await post({}); assert.equal(response.status,201); assert.ok((await response.json()).personalWorkspaceId);
    const disabledConfig = fixtureConfig({});
    const disabled = new PersonalWorkspaceService(auth,disabledConfig); await assert.rejects(disabled.provision(uid,command()),/not enabled/); await disabled.onModuleDestroy();
  } finally { await app.close(); await service.onModuleDestroy(); }
});
