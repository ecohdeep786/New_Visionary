import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

console.log('Launching isolated Edge review');
const browser = await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server'],timeout:90000});
const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
await context.addInitScript(() => {
  if(localStorage.getItem('visionary_workspace_v2')) return;
  const user={id:'design-review',email:'design@example.test',full_name:'Alex',identity:'student',roles:['student'],age_band:'adult',onboarding_complete:true};
  const now=Date.now();
  const data={conversations:[],sessions:[],artifacts:[],resources:[],notifications:[],audit:[],preferences:{locale:'en',interfaceLocale:'en',voice:false,memory:true},subscription:{plan:'Free',state:'active',invoices:[],usage:0,usageDay:new Date(now).toISOString().slice(0,10)},legacyImported:false};
  localStorage.setItem('visionary_users',JSON.stringify([user]));
  localStorage.setItem('visionary_sessions',JSON.stringify([{token:user.id,userId:user.id,email:user.email,expiresAt:now+86400000}]));
  localStorage.setItem('visionary_session_token',user.id);
  localStorage.setItem('visionary_workspace_v2',JSON.stringify({version:2,people:[{id:user.id,email:user.email,name:user.full_name,ageBand:'adult',roles:['student']}],workspaces:[{id:'design-review:student',personId:user.id,role:'student',name:'Personal'}],active:{'design-review':'design-review:student'},relationships:[],data:{'design-review:student':data}}));
});
const page=await context.newPage();
page.setDefaultTimeout(60000);
page.setDefaultNavigationTimeout(90000);
const errors=[];page.on('pageerror',error=>errors.push(String(error)));
const output='docs/visionary/baseline/internal-design-2026-10-11';
const samples=[];
const base=process.env.DESIGN_REVIEW_URL||'http://127.0.0.1:4197';
await fs.mkdir(output,{recursive:true});
try {
  for(const scheme of ['light','dark']) {
    await page.emulateMedia({colorScheme:scheme});
    for(const width of [320,390,768,1440]) {
      await page.setViewportSize({width,height:900});
      for(const route of ['home','learn','build','progress','settings','notifications']) {
        console.log('Review',scheme,width,route);
        await page.goto(`${base}/dashboard/${route}`,{waitUntil:'networkidle'});
        await page.locator('.workspace-shell #main').waitFor();
        const overflow=await page.evaluate(()=>({document:document.documentElement.scrollWidth>innerWidth,main:document.querySelector('#main').scrollWidth>document.querySelector('#main').clientWidth+1}));
        assert.deepEqual(overflow,{document:false,main:false},`${scheme} ${width} ${route} overflow`);
        samples.push({scheme,width,route,...overflow});
        await fs.writeFile(`${output}/review-results.json`,JSON.stringify({samples,errors},null,2));
        if(route==='home'||(route==='settings'&&width===390)) await page.screenshot({path:`${output}/${route}-${scheme}-${width}.png`});
      }
    }
  }
  await page.setViewportSize({width:390,height:900});
  await page.goto(`${base}/dashboard/home`,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  await page.screenshot({path:`${output}/home-dark-390-large-text.png`});
  assert.equal(await page.evaluate(()=>document.querySelector('#main').scrollWidth>document.querySelector('#main').clientWidth+1),false,'large text main overflow');
  await page.evaluate(()=>document.documentElement.style.fontSize='');
  await page.getByRole('button',{name:'More navigation',exact:true}).click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.keyboard.press('Control+k');
  await page.getByRole('heading',{name:'Search your workspace'}).waitFor();
  await page.getByRole('searchbox',{name:'Search pages and topics'}).fill('no-such-page');
  await page.getByText('No results. Try a page name or topic.').last().waitFor();
  await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);
  console.log('PASS 48 route/theme/viewport checks; large text Home; mobile sheet Escape; keyboard search empty state; no browser errors. Device AT and actual zoom remain manual.');
} catch(error) {console.log('FAILED URL',page.url(),await page.locator('body').innerText(),errors);throw error;} finally {await browser.close();}
