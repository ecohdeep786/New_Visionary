import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.DESIGN_REVIEW_URL||'http://127.0.0.1:4197';
const output='docs/visionary/baseline/internal-design-2026-10-12';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server'],timeout:90000});
const results=[],errors=[];
try {
 for(const role of ['student','teacher','parent','professional','organization']) {
  const context=await browser.newContext({viewport:{width:390,height:900},colorScheme:'dark',reducedMotion:'reduce'});
  await context.addInitScript(role=>{
   const user={id:'design-'+role,email:role+'@example.test',full_name:'Alex',identity:role,roles:[role],age_band:'adult',onboarding_complete:true};
   const id=user.id+':'+role,now=Date.now();
   const data={conversations:[],sessions:[],artifacts:[],resources:[],notifications:[],audit:[],preferences:{locale:'en',interfaceLocale:'en',voice:false,memory:true},subscription:{plan:'Free',state:'active',invoices:[],usage:0,usageDay:new Date(now).toISOString().slice(0,10)},legacyImported:false};
   if(!localStorage.getItem('visionary_workspace_v2')) {
    localStorage.setItem('visionary_users',JSON.stringify([user]));
    localStorage.setItem('visionary_sessions',JSON.stringify([{token:user.id,userId:user.id,email:user.email,expiresAt:now+86400000}]));
    localStorage.setItem('visionary_session_token',user.id);
    localStorage.setItem('visionary_workspace_v2',JSON.stringify({version:2,people:[{id:user.id,email:user.email,name:user.full_name,ageBand:'adult',roles:[role]}],workspaces:[{id,personId:user.id,role,name:'Personal'}],active:{[user.id]:id},relationships:[],data:{[id]:data}}));
   }
   window.__designVoice={spoken:0,started:0,stopped:0};
   window.SpeechRecognition=class {
    start(){window.__designVoice.started++;window.__designRecognition=this;}
    abort(){window.__designVoice.stopped++;}
    stop(){window.__designVoice.stopped++;}
   };
   if(window.speechSynthesis) window.speechSynthesis.speak=()=>window.__designVoice.spoken++;
  },role);
  const page=await context.newPage();page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(90000);
  page.on('pageerror',error=>errors.push(role+': '+error));
  const sections={student:['home','ask'],teacher:['home','prepare'],parent:['home','reports'],professional:['home','career'],organization:['home','people']}[role];
  for(const width of [390,1440]) {
   await page.setViewportSize({width,height:900});
   for(const section of sections) {
    console.log('Review role',role,width,section);
    await page.goto(`${base}/dashboard/${section}`,{waitUntil:'networkidle'});
    await page.locator('#main h1').first().waitFor();
    const geometry=await page.evaluate(()=>({document:document.documentElement.scrollWidth>innerWidth,main:document.querySelector('#main').scrollWidth>document.querySelector('#main').clientWidth+1}));
    assert.deepEqual(geometry,{document:false,main:false},`${role} ${section} ${width}`);
    results.push({role,section,width,...geometry});
    await page.screenshot({path:`${output}/${role}-${section}-dark-${width}.png`});
   }
  }
  await page.setViewportSize({width:390,height:900});await page.goto(`${base}/dashboard/home`,{waitUntil:'networkidle'});
  if(role==='student') {
   console.log('Checking keyboard and voice');
   await page.keyboard.press('Tab');assert.equal(await page.locator('.workspace-skip-link').evaluate(e=>e===document.activeElement),true);
   await page.keyboard.press('Enter');assert.equal(await page.locator('#main').evaluate(e=>e===document.activeElement),true);
   const more=page.getByRole('button',{name:'More navigation',exact:true});await more.click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
   await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='More navigation');
   assert.equal(await more.evaluate(e=>e===document.activeElement),true);
   await page.keyboard.press('Control+k');const search=page.getByRole('searchbox',{name:'Search pages and topics'});await search.fill('');
   await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowUp');
   assert.equal(await search.evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Escape');
   await page.evaluate(()=>window.dispatchEvent(new Event('offline')));
   // Dispatch does not change navigator.onLine; emulate its browser-reported value.
   await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{get:()=>false,configurable:true});window.dispatchEvent(new Event('offline'));});
   await page.getByText('You’re offline. Saved records on this device are still available. External links need a connection.').waitFor();
   await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{get:()=>true,configurable:true});window.dispatchEvent(new Event('online'));});
   await page.getByRole('button',{name:/Open Visionary voice panel/}).click();
   console.log('Voice panel opened');
   await page.getByRole('heading',{name:'Your voice presence'}).waitFor();
   assert.equal(await page.evaluate(()=>window.__designVoice.spoken),0,'panel opening is silent');
   assert.equal(await page.locator('.workspace-voice-preview-orb').evaluate(e=>{const style=getComputedStyle(e);return style.animationName==='none'||style.animationPlayState==='paused';}),true,'idle reduced-motion preview stays still');
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.getByRole('button',{name:'Start listening',exact:true}).click();
   await page.locator('.workspace-voice-preview.is-listening').waitFor();
   await page.emulateMedia({reducedMotion:'reduce'});
   assert.equal(await page.locator('.workspace-voice-preview-orb').evaluate(e=>{const style=getComputedStyle(e);return style.animationName==='none'||style.animationPlayState==='paused';}),true,'live reduced-motion preference is respected');
   await page.evaluate(()=>{const result=Object.assign([{transcript:'Explain cube volume'}],{isFinal:true});window.__designRecognition.onresult({resultIndex:0,results:[result]});});
   await page.getByRole('textbox',{name:'Review spoken question'}).waitFor();
   assert.equal(await page.getByRole('textbox',{name:'Review spoken question'}).inputValue(),'Explain cube volume');
   assert.ok(await page.evaluate(()=>window.__designVoice.stopped)>0,'final words stop capture');
   await page.getByRole('button',{name:'Close voice panel'}).click();
   console.log('Voice review checked; checking languages');
   await page.goto(`${base}/dashboard/settings`,{waitUntil:'networkidle'});
   const language=page.getByRole('combobox',{name:/^(Interface language|इंटरफ़ेस की भाषा|ইন্টারফেসের ভাষা)$/});
   for(const locale of ['hi','bn']) {
    await language.selectOption(locale);
    await page.waitForFunction(locale=>document.querySelector('.workspace-shell')?.lang===locale,locale);
    await page.getByRole('button',{name:locale==='hi'?'और पृष्ठ':'আরও পৃষ্ঠা',exact:true}).click();
    await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
   }
   await language.selectOption('en');
   await page.goto(`${base}/dashboard/home`,{waitUntil:'networkidle'});
  }
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  await page.waitForFunction(()=>document.querySelectorAll('.workspace-bottom-nav > a').length<=2);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${role} large text document`);
  assert.equal(await page.evaluate(()=>document.querySelector('#main').scrollWidth>document.querySelector('#main').clientWidth+1),false,`${role} large text`);
  await page.screenshot({path:`${output}/${role}-home-large-text.png`});
  await context.close();
 }
 assert.deepEqual(errors,[]);await fs.writeFile(`${output}/review-results.json`,JSON.stringify({results,errors},null,2));
  console.log('PASS 20 five-role dark route/width samples, five large-text Homes with adaptive destinations, keyboard skip/search/focus, localized Hindi/Bengali shell, offline status, live reduced motion, synthetic silent-open voice/review-stop. Native audio and AT remain manual.');
}catch(error){console.error('Review failed',error);throw error;}finally{await browser.close();}
