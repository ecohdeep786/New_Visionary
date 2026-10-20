const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), {createRequire} = require('node:module');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
req('reflect-metadata');
const {Module, UnauthorizedException} = req('@nestjs/common'), {ConfigService} = req('@nestjs/config'), {NestFactory} = req('@nestjs/core');
const {AccountController} = req('./dist/src/auth/firebase-product/account.controller.js');
const {FirebaseProductService} = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const {BillingService} = req('./dist/src/billing/billing.service.js');
const {accountCoverage, coveragePublicationPath} = req('./dist/src/launch-coverage/coverage.repository.js');
const {coverageSelection, coverageSliceId, coverageCategories} = req('./dist/src/launch-coverage/coverage.policy.js');
const {billingMemory} = require('./fixtures/billing-memory.cjs');
const selection = (overrides={}) => ({category:'independent-adult', interfaceLocale:'en', modality:'text', device:'desktop-browser', connectivity:'online', sourceId:'synthetic-qualified-fixture', sourceVersion:'1', sourceLanguage:'en', inputLanguage:'en', outputLanguage:'en', script:'Latn', expectedProfileVersion:1, expectedCatalogRevision:'fixture-1', ...overrides});
function fixture() {
 const f=billingMemory(); f.db.doc = name => {const parts=name.split('/'); const id=parts.pop(); return f.db.collection(parts.join('/')).doc(id);};
 f.rows.set('visionary_accounts/owner', {uid:'owner',version:1,email:'private-not-returned@example.test',onboarding:{status:'complete'},profile:{identity:'student',age_band:'adult',education_stage:'professional'}});
 f.rows.set('visionary_accounts/other', {uid:'other',version:8,onboarding:{status:'complete'},profile:{identity:'professional',age_band:'adult',education_stage:'professional'}});
 const publication = {version:1,revision:'fixture-1',status:'published',publishedAt:new Date(Date.now()-1000).toISOString(),expiresAt:new Date(Date.now()+3600000).toISOString(),approvedBy:'fixture-reviewer',reviewedCommit:'a'.repeat(40),evidenceId:'synthetic-test-only',categoryCounts:Object.fromEntries(coverageCategories.map(id=>[id,id==='independent-adult'?1:0]))};
 f.rows.set(coveragePublicationPath,publication);
 const tuple=coverageSelection(selection()).tuple;
 const slicePath=`visionary_coverage_releases/fixture-1/slices/${coverageSliceId('student',tuple)}`;
 f.rows.set(slicePath,{version:1,revision:'fixture-1',role:'student',status:'qualified',expiresAt:publication.expiresAt,approvedBy:'fixture-reviewer',reviewedCommit:'a'.repeat(40),selection:tuple,evidence:{sourceRights:'fixture-only',providerCapability:'fixture-only',languageAndScript:'fixture-only',privacyAndCommercial:'fixture-only',deliveryAndRecovery:'fixture-only'}});
 return {...f,slicePath};
}
test('coverage schema rejects client identity/authority claims and ambiguous source tuples',()=>{
 for(const value of [null,[],selection({uid:'other'}),selection({role:'teacher'}),selection({workspaceId:'other'}),selection({verifiedRelationship:true}),selection({sourceVersion:''}),selection({sourceId:{}}),selection({script:' '}),selection({modality:'voice'}),selection({speechLanguage:'hi'}),selection({category:'primary'}),selection({expectedCatalogRevision:undefined}),selection({expectedProfileVersion:-1})]) assert.throws(()=>coverageSelection(value),e=>e.getStatus()===400);
 assert.notEqual(coverageSliceId('student',coverageSelection(selection()).tuple),coverageSliceId('professional',coverageSelection(selection()).tuple));
});
test('exact qualified synthetic source returns only qualification, with no execution authorization or user record mutation',async()=>{
 const f=fixture(),before=JSON.stringify([...f.rows]);
 const result=await accountCoverage(f.db,'owner',selection());
 assert.equal(result.status,'source-qualified');assert.equal(result.runtimeAuthorization,false);assert.equal(result.reason,'source-qualified-access-check-required');assert.equal(result.categories.length,9);
 assert.equal(JSON.stringify([...f.rows]),before);assert.doesNotMatch(JSON.stringify(result),/private-not-returned|fixture-reviewer|reviewedCommit|sourceRights/);
});
test('changed source/version/language/script/device has no fallback and revoked/expired/malformed policy cannot qualify',async()=>{
 for(const changes of [{sourceId:'different'},{sourceVersion:'2'},{inputLanguage:'hi'},{outputLanguage:'bn'},{script:'Deva'},{device:'mobile-browser'}]) {const f=fixture();assert.equal((await accountCoverage(f.db,'owner',selection(changes))).reason,'exact-source-not-qualified');}
 for(const change of [slice=>{slice.status='revoked';},slice=>{slice.expiresAt=new Date(0).toISOString();},slice=>{delete slice.evidence.sourceRights;},slice=>{slice.role='professional';},slice=>{slice.selection.outputLanguage='hi';}]) {const f=fixture();change(f.rows.get(f.slicePath));assert.equal((await accountCoverage(f.db,'owner',selection())).status,'unavailable');}
 const f=fixture();f.rows.get(coveragePublicationPath).expiresAt=new Date(0).toISOString();await assert.rejects(accountCoverage(f.db,'owner'),e=>e.getStatus()===503);
});
test('all exposed categories remain explicit when no release is published; outage is distinct and private errors are redacted',async()=>{
 const f=fixture();f.rows.delete(coveragePublicationPath);const result=await accountCoverage(f.db,'owner');assert.equal(result.reason,'coverage-not-published');assert.equal(result.catalogRevision,null);assert.deepEqual(result.categories.map(row=>row.id),coverageCategories);assert.ok(result.categories.every(row=>row.qualifiedSlices===0));
 f.db.runTransaction=async()=>{throw Error('PRIVATE_DATABASE_CREDENTIAL');};await assert.rejects(accountCoverage(f.db,'owner'),e=>e.getStatus()===503&&!e.message.includes('PRIVATE'));
});
test('stale profile/catalog, mismatched owner, minors, linked roles, offline and unmapped vocational contexts fail closed',async()=>{
 for(const changes of [{expectedProfileVersion:0},{expectedCatalogRevision:'old'}]) {const f=fixture();await assert.rejects(accountCoverage(f.db,'owner',selection(changes)),e=>e.getStatus()===409);}
 const f=fixture();f.rows.get('visionary_accounts/owner').uid='other';await assert.rejects(accountCoverage(f.db,'owner'),e=>e.getStatus()===409);
 for(const [changes,reason] of [[{age_band:'minor'},'verified-guardian-admission-required'],[{identity:'teacher'},'verified-linked-role-required'],[{identity:'parent'},'verified-linked-role-required'],[{identity:'organization'},'verified-linked-role-required']]) {const f=fixture();Object.assign(f.rows.get('visionary_accounts/owner').profile,changes);assert.equal((await accountCoverage(f.db,'owner',selection())).reason,reason);}
 for(const [changes,reason] of [[{device:'native-client'},'native-client-not-released'],[{connectivity:'offline'},'online-authority-required'],[{connectivity:'reconnecting'},'online-authority-required'],[{category:'vocational'},'vocational-mapping-required'],[{category:'employer-sponsored'},'verified-linked-role-required']]) {const f=fixture();assert.equal((await accountCoverage(f.db,'owner',selection(changes))).reason,reason);}
});
test('coverage HTTP checks actual cookie authority, expected UID and CSRF, then reads owning-store policy without writes',async()=>{
 const f=fixture();const auth={getDatabase:()=>f.db,authenticate:async cookie=>{if(!['owner','other'].includes(cookie))throw new UnauthorizedException();return{uid:cookie};}};
 class FixtureModule{} Module({controllers:[AccountController],providers:[{provide:FirebaseProductService,useValue:auth},{provide:BillingService,useValue:{}},{provide:ConfigService,useValue:new ConfigService({AUTH_PUBLIC_ORIGIN:'http://localhost:5173'})}]})(FixtureModule);
 const app=await NestFactory.create(FixtureModule,{logger:false});app.use(req('cookie-parser')());app.setGlobalPrefix('api');await app.listen(0,'127.0.0.1');
 try{const url=(await app.getUrl())+'/api/account/coverage',token='a'.repeat(64);const headers={Cookie:`visionary-session=owner; visionary-device=device; visionary-csrf=${token}`,Origin:'http://localhost:5173','X-CSRF-Token':token,'X-Visionary-Account':'owner','Content-Type':'application/json'};
 const post=(body,h=headers)=>fetch(url+'/check',{method:'POST',headers:h,body:JSON.stringify(body)});
 assert.equal((await fetch(url)).status,401);assert.equal((await fetch(url,{headers:{...headers,'X-Visionary-Account':'other'}})).status,409);
 assert.equal((await post(selection(),{...headers,Origin:'https://attacker.test'})).status,403);assert.equal((await post(selection({uid:'other'}))).status,400);
 const before=JSON.stringify([...f.rows]);const snapshot=await(await fetch(url,{headers})).json();assert.equal(snapshot.uid,'owner');assert.equal(snapshot.status,'unavailable');assert.equal(snapshot.reason,'exact-source-check-required');
 const qualified=await(await post(selection())).json();assert.equal(qualified.status,'source-qualified');assert.equal(qualified.runtimeAuthorization,false);
 const other=await(await fetch(url,{headers:{...headers,Cookie:'visionary-session=other; visionary-device=device','X-Visionary-Account':'other'}})).json();assert.equal(other.uid,'other');assert.equal(other.profileVersion,8);assert.doesNotMatch(JSON.stringify(other),/private-not-returned/);
 assert.equal(JSON.stringify([...f.rows]),before);
 f.rows.get('visionary_accounts/owner').version=2;assert.equal((await post(selection())).status,409);
 }finally{await app.close();}
});
