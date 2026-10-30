import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const base = process.env.DESIGN_REVIEW_URL || 'http://127.0.0.1:4197';
const productRoot=fileURLToPath(new URL('../../',import.meta.url));
const evidence = path.resolve(productRoot,process.env.DESIGN_EVIDENCE_DIR || 'docs/visionary/baseline/design-quality-2026-10-12');
await fs.mkdir(evidence, {recursive:true});
const browser = await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
const context = await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});
await context.addInitScript(() => {
 if(localStorage.getItem('visionary_workspace_v2'))return;
 const user={id:'design-quality',email:'quality@example.test',full_name:'Alex',identity:'student',roles:['student'],age_band:'adult',onboarding_complete:true};
 const now=Date.now(),id=user.id+':student';
 const data={conversations:[],sessions:[],artifacts:[],resources:[],notifications:[],audit:[],preferences:{locale:'en',interfaceLocale:'en',voice:false,memory:true},subscription:{plan:'Free',state:'active',invoices:[],usage:0,usageDay:new Date(now).toISOString().slice(0,10)},legacyImported:false};
 localStorage.setItem('visionary_users',JSON.stringify([user]));
 localStorage.setItem('visionary_sessions',JSON.stringify([{token:user.id,userId:user.id,email:user.email,expiresAt:now+86400000}]));
 localStorage.setItem('visionary_session_token',user.id);
 localStorage.setItem('visionary_workspace_v2',JSON.stringify({version:2,people:[{id:user.id,email:user.email,name:user.full_name,ageBand:'adult',roles:['student']}],workspaces:[{id,personId:user.id,role:'student',name:'Personal'}],active:{[user.id]:id},relationships:[],data:{[id]:data}}));
});
const page=await context.newPage(),errors=[],samples=[],audits=[];
page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(90000);
page.on('pageerror',error=>errors.push(String(error)));
const ctx={personId:'design-quality',workspaceId:'design-quality:student',role:'student',locale:'en'};
/* Rendered accessibility audit (FAP-30): informative-text contrast with alpha
 * blending, and 44px hit-area on interactive controls. Backgrounds composite
 * through the ancestor chain (rgba layers over the first opaque ancestor), so
 * translucent badges/washes are measured over what is actually painted. */
const renderedAudit=()=>{
 const parse=(c)=>{const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(',').map((s)=>parseFloat(s));return{r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1};};
  const over=(fg,bg)=>({r:fg.r*fg.a+bg.r*(1-fg.a),g:fg.g*fg.a+bg.g*(1-fg.a),b:fg.b*fg.a+bg.b*(1-fg.a),a:fg.a+bg.a*(1-fg.a)});
  const lum=(c)=>{const f=(v)=>{v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4);};return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b);};
  const ratioOf=(a,b)=>{const l1=lum(a),l2=lum(b);const[hi,lo]=l1>l2?[l1,l2]:[l2,l1];return(hi+0.05)/(lo+0.05);};
  const bgChain=(el)=>{
   const layers=[];let node=el;
   while(node&&node!==document.documentElement){
    const c=parse(getComputedStyle(node).backgroundColor);
    if(c&&c.a>0)layers.push(c);
    if(c&&c.a>=1)break;
    node=node.parentElement;
   }
   if(!layers.length||layers[layers.length-1].a<1){const b=parse(getComputedStyle(document.body).backgroundColor);if(b)layers.push(b);}
   let bg={r:255,g:255,b:255,a:1};
   for(let i=layers.length-1;i>=0;i--)bg=over(layers[i],bg);
   return bg;
  };
  const texts=[...document.querySelectorAll('#main p,#main li,#main label,#main span,#main a,#main button,#main h1,#main h2,#main h3,#main td,#main th,#main dt,#main dd')]
   .filter((el)=>el.offsetParent!==null&&!el.closest('[aria-hidden="true"],.sr-only')&&(el.textContent||'').trim().length>1&&![...el.childNodes].some((n)=>n.nodeType===1));
  const seen=new Map();
  for(const el of texts){
   const cs=getComputedStyle(el);
   let fg=parse(cs.color);const bg=bgChain(el);
   if(!fg||!bg)continue;
   if(fg.a<1)fg=over(fg,bg);
   const fs=parseFloat(cs.fontSize),fw=parseInt(cs.fontWeight,10)||400;
   const large=fs>=24||(fs>=18.66&&fw>=700);
   const key=`${cs.color}|${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}|${fs}|${fw}`;
   if(!seen.has(key))seen.set(key,{color:cs.color,bg:`rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`,fs,fw,large,required:large?3:4.5,ratio:Math.round(ratioOf(fg,bg)*100)/100,sample:(el.textContent||'').trim().slice(0,40)});
  }
  const controls=[...document.querySelectorAll('#main a[href],#main button')]
   .filter((el)=>el.offsetParent!==null)
   .map((el)=>{const r=el.getBoundingClientRect();return{text:(el.textContent||'').trim().slice(0,40),w:Math.round(r.width),h:Math.round(r.height)};})
   .filter((c)=>c.w>0);
  return{
   textSamples:[...seen.values()].sort((a,b)=>a.ratio-b.ratio),
   controls:controls.filter((c)=>Math.min(c.w,c.h)>=44).length,
   smallControls:controls.filter((c)=>Math.min(c.w,c.h)<44),
  };
};
try {
 await page.goto(`${base}/dashboard/progress`,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Your evidence starts with an activity'}).waitFor();
 assert.equal(await page.locator('.v-progress-overview').count(),0,'empty history must not invent achievement');
 // Development setup uses the real local services; a compiled run imports an isolated snapshot.
 if(process.env.DESIGN_FIXTURE_PATH) {
  const fixture=JSON.parse(await fs.readFile(process.env.DESIGN_FIXTURE_PATH,'utf8'));
  await page.evaluate(fixture=>{for(const [key,value] of Object.entries(fixture.storage))localStorage.setItem(key,value);},fixture);
 } else {
  const fixture=await page.evaluate(async ctx=>{
   const p=await import('/src/services/learningPipelineService.ts');
   const c=await import('/src/services/contentRepository.ts');
   const syllabus=await p.selectLearningSyllabus(ctx,c.SAMPLE_SELECTION);
   const repo=c.getContentRepository(ctx),topics=await repo.getTopics(syllabus.chapters[1].id),concepts=await repo.getConcepts(topics[0].id);
   let unit=await p.startLearningUnit(ctx,concepts[0].id);
   await p.requestUnitTeaching(ctx,unit.id,'explanation');
   unit=await p.beginComprehension(ctx,unit.id);
   await p.answerLearningQuestion(ctx,unit.id,unit.question.answerIndex);
   unit=await p.nextLearningQuestion(ctx,unit.id,true);
   await p.answerLearningQuestion(ctx,unit.id,unit.question.answerIndex);
   return {unitId:unit.id,storage:Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)]))};
  },ctx);
  await fs.writeFile(`${evidence}/fictional-fixture.json`,JSON.stringify(fixture,null,2));
 }
 const fixture=JSON.parse(await fs.readFile(process.env.DESIGN_FIXTURE_PATH||`${evidence}/fictional-fixture.json`,'utf8'));
 await page.goto(`${base}/dashboard/learn?unit=${fixture.unitId}`,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Practice step recorded'}).waitFor();
 await page.screenshot({path:`${evidence}/practice-recorded-390.png`});
 assert.equal(await page.getByRole('button',{name:'Apply this in Build',exact:true}).count(),1);
 await page.getByRole('button',{name:'Apply this in Build',exact:true}).click();
 await page.getByRole('heading',{name:'Put the idea to work',exact:true}).waitFor();
 await page.getByRole('link',{name:'Open your project',exact:true}).waitFor();
 await page.goto(`${base}/dashboard/progress`,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Your work in this period'}).waitFor();
 assert.match(await page.locator('.v-progress-overview').innerText(),/2 correct/);
 for(const scheme of ['light','dark'])for(const width of [320,390,768,1440]) {
  await page.emulateMedia({colorScheme:scheme});await page.setViewportSize({width,height:900});
  const geometry=await page.evaluate(()=>({document:document.documentElement.scrollWidth>innerWidth,main:document.querySelector('#main').scrollWidth>document.querySelector('#main').clientWidth+1,font:getComputedStyle(document.querySelector('.workspace-shell')).fontFamily}));
  assert.equal(geometry.document||geometry.main,false,`${scheme}/${width} overflow`);
  assert.equal(geometry.font.split(',')[0].replaceAll('"','').trim(),'Google Sans');
  const audit=await page.evaluate(renderedAudit);
  const low=audit.textSamples.filter((s)=>s.ratio<s.required);
  assert.deepEqual(low,[],`${scheme}/${width} informative text below WCAG contrast: ${JSON.stringify(low)}`);
  assert.deepEqual(audit.smallControls,[],`${scheme}/${width} sub-44px interactive controls: ${JSON.stringify(audit.smallControls)}`);
  audits.push({scheme,width,worst:audit.textSamples.slice(0,4),textSamples:audit.textSamples.length,controls44:audit.controls,smallControls:audit.smallControls});
  samples.push({scheme,width,...geometry,contrastSamples:audit.textSamples.length,contrastWorst:audit.textSamples[0]?.ratio??null,controls44:audit.controls});
  await page.screenshot({path:`${evidence}/progress-${scheme}-${width}.png`});
 }
 await page.setViewportSize({width:390,height:900});
 await page.getByLabel('Find an objective',{exact:true}).fill('no matching title');
 await page.getByRole('heading',{name:'No matching objectives'}).waitFor();
 assert.match(await page.locator('.v-progress-overview').innerText(),/2 correct/,'search cannot rewrite period totals');
 await page.getByLabel('Find an objective',{exact:true}).fill('');
 const backup=await page.evaluate(()=>({workspace:localStorage.getItem('visionary_workspace_v2'),mentor:localStorage.getItem('visionary_mentor_v1')}));
 await page.evaluate(()=>{
  const store=JSON.parse(localStorage.getItem('visionary_workspace_v2'));
  store.data['design-quality:student'].sessions=[{id:'fictional-earlier',journeyId:'cube',stage:'checking',locale:'en',position:0,answers:{},canvas:{size:3,rotation:25},notes:'',updatedAt:new Date().toISOString(),interrupted:false,evidence:[{id:'fictional-check',objectiveId:'cube',kind:'check',correct:1,total:1,at:new Date().toISOString(),delayed:false}]}];
  localStorage.setItem('visionary_workspace_v2',JSON.stringify(store));localStorage.setItem('visionary_mentor_v1','Fictional unreadable evidence');
 });
 await page.reload({waitUntil:'networkidle'});
 await page.getByText('Some sources are unavailable. This summary includes only the records that could be read.').waitFor();
 assert.match(await page.locator('.v-progress-overview').innerText(),/1 correct/);
 await page.evaluate(backup=>{localStorage.setItem('visionary_workspace_v2',backup.workspace);localStorage.setItem('visionary_mentor_v1',backup.mentor);},backup);
 await page.reload({waitUntil:'networkidle'});
 await page.getByLabel('Evidence period',{exact:true}).selectOption('all');
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 await page.screenshot({path:`${evidence}/progress-large-text.png`});
 assert.equal(await page.evaluate(()=>document.querySelector('#main').scrollWidth>document.querySelector('#main').clientWidth+1),false);
 await page.goto(`${base}/dashboard/settings`,{waitUntil:'networkidle'});
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 await page.getByRole('combobox',{name:'Interface language',exact:true}).selectOption('hi');
 await page.waitForFunction(()=>document.querySelector('.workspace-shell').lang==='hi');
 await page.getByRole('button',{name:'और पृष्ठ',exact:true}).click();
 await page.getByRole('dialog').waitFor();
 const type=await page.evaluate(()=>{
  const dialog=document.querySelector('[role="dialog"]'),title=document.querySelector('#main h1');
  const probe=document.createElement('span');probe.className='text-[17px]';probe.textContent='Type';document.querySelector('#main').append(probe);
  const out={dialog:getComputedStyle(dialog).fontFamily,dialogLeading:getComputedStyle(dialog).lineHeight,titleLeading:getComputedStyle(title).lineHeight,titleSize:getComputedStyle(title).fontSize,legacy:getComputedStyle(probe).fontSize};probe.remove();return out;
 });
 assert.equal(type.dialog.split(',')[0].replaceAll('"','').trim(),'Google Sans');assert.equal(type.legacy,'34px');
 assert.ok(parseFloat(type.titleLeading)/parseFloat(type.titleSize)>=1.49,'Indic heading leading');
 await page.evaluate(()=>document.documentElement.style.setProperty('--font-product','Georgia, serif'));
 assert.match(await page.locator('[role="dialog"]').evaluate(e=>getComputedStyle(e).fontFamily),/Georgia/,'shared font token updates portals');
 assert.match(await page.locator('#main h1').evaluate(e=>getComputedStyle(e).fontFamily),/Georgia/,'shared font token updates product headings');
 await page.evaluate(()=>document.documentElement.style.removeProperty('--font-product'));
 await page.screenshot({path:`${evidence}/hindi-navigation-large-text.png`});
 await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);
 await fs.writeFile(`${evidence}/review-results.json`,JSON.stringify({samples,audits,type,errors},null,2));
 console.log('PASS empty/populated evidence, real local sample check/practice -> project, eight theme/viewport samples with alpha-blended WCAG contrast (>=4.5:1 informative / >=3:1 large) and 44px hit-area assertions, filtered totals, 200% text, shared brand font and Hindi portal typography.');
}catch(error){console.error(error);await page.screenshot({path:`${evidence}/failure.png`}).catch(()=>{});throw error;}finally{await browser.close();}
