// Loopback-only browser fixture. No .env, live Firebase, credentials or providers.
const path=require('node:path'),{createRequire}=require('node:module');
const req=createRequire(path.resolve(__dirname,'../upstream/backend/package.json'));req('reflect-metadata');
const {Module,UnauthorizedException}=req('@nestjs/common'),{ConfigService}=req('@nestjs/config'),{NestFactory}=req('@nestjs/core');
const {AccountController}=req('./dist/src/auth/firebase-product/account.controller.js'),{FirebaseProductService}=req('./dist/src/auth/firebase-product/firebase-product.service.js'),{BillingService}=req('./dist/src/billing/billing.service.js');
const {publicProfile}=req('./dist/src/auth/firebase-product/profile.js');
const {billingMemory}=require('./fixtures/billing-memory.cjs');
const memory=billingMemory();memory.db.doc=name=>{const parts=name.split('/'),id=parts.pop();return memory.db.collection(parts.join('/')).doc(id);};
const account={uid:'owner',email:'owner@fixture.invalid',full_name:'Coverage fixture',version:1,onboarding:{status:'complete',introduction:{status:'complete'}},profile:{full_name:'Coverage fixture',identity:'student',age_band:'adult',education_stage:'professional',preferred_language:'English'},preferences:{}};
memory.rows.set('visionary_accounts/owner',account);let outage=false,reads=0;
const base=memory.db.runTransaction.bind(memory.db);memory.db.runTransaction=action=>outage?Promise.reject(Error('Synthetic private outage detail')):base(action);
const auth={getDatabase:()=>memory.db,authenticate:async cookie=>{if(cookie!=='coverage-fixture')throw new UnauthorizedException();return{uid:'owner'};}};
class Fixture{}Module({controllers:[AccountController],providers:[{provide:FirebaseProductService,useValue:auth},{provide:BillingService,useValue:{}},{provide:ConfigService,useValue:new ConfigService({AUTH_PUBLIC_ORIGIN:'http://127.0.0.1:5178'})}]})(Fixture);
(async()=>{const app=await NestFactory.create(Fixture,{logger:false});app.use(req('express').json());app.use(req('cookie-parser')());
 app.use('/api/auth/me',(request,response)=>request.cookies['visionary-session']==='coverage-fixture'?response.json(publicProfile('owner',account)):response.status(401).json({message:'Sign in.'}));
 app.use('/__test/state',(request,response)=>{if(request.method==='POST'){outage=request.body.outage===true;if(request.body.role){account.profile.identity=request.body.role;account.profile.education_stage=request.body.role==='professional'?'professional':'higher_ed';account.version++;}}response.json({outage,reads,records:memory.rows.size});});
 app.use('/api/account/coverage',(_request,_response,next)=>{reads++;next();});
 app.setGlobalPrefix('api');await app.listen(3088,'127.0.0.1');console.log('KAN29 isolated browser server ready.');
})().catch(()=>{console.error('KAN29 browser fixture failed to start.');process.exitCode=1;});
