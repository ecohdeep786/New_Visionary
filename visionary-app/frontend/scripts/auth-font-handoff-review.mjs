import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

// Fictional API fixtures; no live login, credentials or production account writes.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'), output=path.join(root,'artifacts/tmp/auth-font-handoff');
await fs.mkdir(output,{recursive:true});
const browser=await puppeteer.launch({headless:true}), results=[];
try {
  for(const scene of ['login','register','onboarding','dashboard','recovery']) {
    const context=await browser.createBrowserContext(), page=await context.newPage(), errors=[], resources=[]; let reads=0;
    page.on('pageerror',error=>errors.push(error.message)); await page.setViewport({width:1280,height:900});
    await page.setRequestInterception(true);
    page.on('request',request=>{
      const url=new URL(request.url()); resources.push(url.href);
      if(url.pathname==='/api/auth/me') {
        reads++; const status=['login','register'].includes(scene)?401:scene==='recovery'?503:scene==='dashboard'&&reads===1?503:200;
        const profile={id:`font-${scene}`,email:`${scene}@fixture.invalid`,full_name:'Fixture Adult',identity:'professional',education_stage:'professional',age_band:'adult',onboarding_complete:scene==='dashboard',getting_started_complete:true,auth_source:'firebase'};
        return request.respond({status,contentType:'application/json',body:JSON.stringify(status===200?profile:{message:'Account service unavailable'})});
      }
      if(url.origin!=='http://localhost:5173')return request.abort();return request.continue();
    });
    const target={login:'/login',register:'/register',onboarding:'/onboarding',dashboard:'/dashboard/home',recovery:'/dashboard/home'}[scene];
    await page.goto(`http://localhost:5173${target}`,{waitUntil:'networkidle0'});
    const selector=scene==='dashboard'?'#main h1':scene==='recovery'?'[role="alert"]':'h1';
    await page.waitForSelector(selector); await page.evaluate(()=>document.fonts.ready);
    const family=await page.$eval(selector,element=>getComputedStyle(element).fontFamily);
    assert.equal(family.split(',')[0].replaceAll('"','').trim(),'Google Sans',scene);
    assert.ok(resources.some(url=>new URL(url).pathname==='/fonts/GoogleSans-Regular.ttf'));
    assert.equal(resources.some(url=>/fonts\.(googleapis|gstatic)\.com/.test(url)),false);
    const session=await page.createCDPSession(); await session.send('DOM.enable'); await session.send('CSS.enable');
    const {root:documentNode}=await session.send('DOM.getDocument'), {nodeId}=await session.send('DOM.querySelector',{nodeId:documentNode.nodeId,selector});
    const {fonts}=await session.send('CSS.getPlatformFontsForNode',{nodeId});
    console.log(JSON.stringify({scene,fonts}));
    assert.ok(fonts.some(font=>/^Google Sans(?: Medium| Bold)?$/.test(font.familyName)&&font.isCustomFont&&font.glyphCount>0),`${scene}: actual local glyphs`);
    if(scene==='dashboard') {
      assert.equal(reads,2,'transient read retries once');
      assert.doesNotMatch(await page.$eval('body',element=>element.innerText),/Your account profile is saved online/);
      await page.screenshot({path:path.join(output,'dashboard-clean.png'),fullPage:true});
      console.log('dashboard: checking foreground activity');
      await page.bringToFront();
      assert.equal(await page.evaluate(()=>document.visibilityState),'visible');
      const before=reads; await page.evaluate(()=>{
        window.__activityEvidence=[];
        window.addEventListener('keydown',event=>window.__activityEvidence.push({trusted:event.isTrusted,hidden:document.hidden}),{capture:true});
        document.addEventListener('keydown',event=>event.stopPropagation());
        const original=Date.now;Date.now=()=>original()+5*60*1000+100;
        window.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab'}));
      });
      await new Promise(resolve=>setTimeout(resolve,200));
      assert.equal(reads,before,'clock advancement and synthetic input do not keep a session alive');
      const nextRead=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/me',{timeout:5000});
      await page.keyboard.press('Tab');
      try {await nextRead;} catch(failure){console.log(JSON.stringify({activity:await page.evaluate(()=>window.__activityEvidence),before,reads}));throw failure;}
      assert.equal(reads,before+1,'trusted active use revalidates at the five-minute boundary');
      await page.waitForFunction(()=>document.querySelector('#main h1'));
      assert.deepEqual(errors,[]);
    }
    if(scene==='recovery')assert.equal(reads,2,'a sustained outage stops after two reads');
    if(scene==='login')await page.screenshot({path:path.join(output,'login-local-font.png'),fullPage:true});
    assert.deepEqual(errors,[]); results.push({scene,fontFamily:family,actualFont:fonts.filter(font=>font.isCustomFont).map(font=>font.familyName),passed:true});
    await context.close();
  }
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2)); console.log(JSON.stringify(results));
} finally {await browser.close();}
