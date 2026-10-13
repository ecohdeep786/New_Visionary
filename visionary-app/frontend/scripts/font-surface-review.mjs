import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const base=process.env.FONT_REVIEW_URL||'http://127.0.0.1:4197';
const productRoot=fileURLToPath(new URL('../../',import.meta.url));
const output=path.resolve(productRoot,process.env.FONT_EVIDENCE_DIR||'docs/visionary/baseline/font-surfaces-2026-10-12');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});
await context.addInitScript(()=>{
 if(localStorage.getItem('visionary_workspace_v2'))return;
 const user={id:'font-review',email:'fonts@example.test',full_name:'Alex',identity:'student',roles:['student'],age_band:'adult',onboarding_complete:true};
 const now=Date.now(),id=user.id+':student';
 const data={conversations:[],sessions:[],artifacts:[],resources:[],notifications:[],audit:[],preferences:{locale:'en',interfaceLocale:'en',voice:false,memory:true},subscription:{plan:'Free',state:'active',invoices:[],usage:0,usageDay:new Date(now).toISOString().slice(0,10)},legacyImported:false};
 localStorage.setItem('visionary_users',JSON.stringify([user]));localStorage.setItem('visionary_sessions',JSON.stringify([{token:user.id,userId:user.id,email:user.email,expiresAt:now+86400000}]));localStorage.setItem('visionary_session_token',user.id);
 localStorage.setItem('visionary_workspace_v2',JSON.stringify({version:2,people:[{id:user.id,email:user.email,name:user.full_name,ageBand:'adult',roles:['student']}],workspaces:[{id,personId:user.id,role:'student',name:'Personal'}],active:{[user.id]:id},relationships:[],data:{[id]:data}}));
});
const page=await context.newPage(),errors=[],samples=[];
page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(90000);
page.on('pageerror',error=>errors.push(String(error)));
const family=value=>value.split(',')[0].replaceAll('"','').replaceAll("'",'').trim();
const font=locator=>locator.evaluate(element=>getComputedStyle(element).fontFamily);
async function spa(path){await page.evaluate(path=>{history.pushState({...history.state,idx:(history.state?.idx||0)+1},'',path);window.dispatchEvent(new PopStateEvent('popstate'));},path);}
try {
 await page.goto(`${base}/student`,{waitUntil:'networkidle'});
 await page.locator('main h1').first().waitFor();
 assert.equal(family(await font(page.locator('main h1').first())),'Google Sans Flex');
 for(const width of [390,1440]) {
  await page.setViewportSize({width,height:900});
  await spa('/dashboard/subscription');await page.locator('.workspace-shell #main h1').first().waitFor();
  for(const selector of ['body','.workspace-shell','#main h1','#main button']) {
   const value=await font(page.locator(selector).first());assert.equal(family(value),'Google Sans',selector);samples.push({surface:'product',width,selector,font:value});
  }
  await page.getByRole('button',{name:'Open account menu',exact:true}).click();await page.getByRole('menu').waitFor();
  assert.equal(family(await font(page.getByRole('menu'))),'Google Sans');await page.keyboard.press('Escape');
  const tooltip=await page.evaluate(()=>{const node=document.createElement('div');node.role='tooltip';node.textContent='Isolated font probe';document.body.append(node);const result=getComputedStyle(node).fontFamily;node.remove();return result;});
  assert.equal(family(tooltip),'Google Sans','body portals inherit the product font');
  await page.evaluate(()=>document.documentElement.style.setProperty('--font-public','Georgia, serif'));
  assert.equal(family(await font(page.locator('#main h1').first())),'Google Sans','public token cannot change product');
  await page.evaluate(()=>document.documentElement.style.setProperty('--font-product','Courier New, monospace'));
  assert.equal(family(await font(page.locator('#main h1').first())),'Courier New');
  await page.getByRole('button',{name:'Open account menu',exact:true}).click();await page.getByRole('menu').waitFor();
  assert.equal(family(await font(page.getByRole('menu'))),'Courier New','product token updates portal');await page.keyboard.press('Escape');
  await page.evaluate(()=>{document.documentElement.style.removeProperty('--font-public');document.documentElement.style.removeProperty('--font-product');});
  await page.screenshot({path:`${output}/subscription-${width}.png`});
  await spa('/student');await page.locator('.workspace-shell').waitFor({state:'detached'});await page.locator('main h1').first().waitFor();
  const publicFont=await font(page.locator('main h1').first());assert.equal(family(publicFont),'Google Sans Flex','SPA exit must restore public font');
  assert.equal(family(await font(page.locator('body'))),'Google Sans Flex');samples.push({surface:'public-after-product',width,font:publicFont});
 }
 // A new internal loading/error surface can opt in without requiring a full shell.
 const recovery=await page.evaluate(()=>{const node=document.createElement('main');node.dataset.fontSurface='product';node.textContent='Isolated recovery probe';document.body.append(node);const value={main:getComputedStyle(node).fontFamily,body:getComputedStyle(document.body).fontFamily};node.remove();return value;});
 assert.equal(family(recovery.main),'Google Sans');assert.equal(family(recovery.body),'Google Sans');assert.equal(family(await font(page.locator('body'))),'Google Sans Flex');
 for(const [path,expected] of [['/dashboard/missing-font-check','Google Sans'],['/missing-public-font-check','Google Sans Flex']]) {
  await spa(path);await page.getByRole('heading',{name:'404',exact:true}).waitFor();
  assert.equal(family(await font(page.locator('body'))),expected,'404 must follow its route surface');
 }
 await page.evaluate(()=>{const users=JSON.parse(localStorage.getItem('visionary_users'));users[0].onboarding_complete=false;localStorage.setItem('visionary_users',JSON.stringify(users));});
 await page.goto(`${base}/onboarding`,{waitUntil:'networkidle'});await page.locator('[data-font-surface="product"] h1').first().waitFor();
 assert.equal(family(await font(page.locator('h1').first())),'Google Sans','onboarding is product UI');
 const guest=await browser.newContext({viewport:{width:390,height:900}}),signIn=await guest.newPage();
 for(const path of ['/login','/register']) {
  await signIn.goto(`${base}${path}`,{waitUntil:'networkidle'});await signIn.getByRole('heading',{level:1}).first().waitFor();
  assert.equal(family(await font(signIn.locator('body'))),'Google Sans',path);
 }
 await guest.close();
 const loadedFonts=await page.evaluate(async()=>{await document.fonts.ready;return [...document.fonts].filter(face=>face.family.includes('Google')).map(face=>({family:face.family,weight:face.weight,status:face.status}));});
 assert.deepEqual(errors,[]);await fs.writeFile(`${output}/results.json`,JSON.stringify({samples,recovery,loadedFonts,errors},null,2));
 console.log('PASS Google Sans product/body/controls/menus/tooltips, Google Sans Flex public, independent tokens, SPA restoration and internal fallback markers at 390/1440.');
}catch(error){console.error(error);throw error;}finally{await browser.close();}
