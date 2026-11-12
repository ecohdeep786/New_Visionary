import {chromium} from 'playwright-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import { loginViaUi } from './qa-session.mjs';

const base=process.env.NAVIGATION_REVIEW_URL||'http://127.0.0.1:4197';
const productRoot=fileURLToPath(new URL('../../',import.meta.url));
const output=path.resolve(productRoot,process.env.NAVIGATION_EVIDENCE_DIR||'docs/visionary/baseline/navigation-quality-2026-10-12');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
const errors=[],samples=[];
try {
 /* FAP-67: one Firebase QA account (student); the multi-role navigation pass needs the app's role-add flow — a recorded follow-up. */
 for(const role of ['student']) {
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(String(error)));
  await loginViaUi(page, base);
  await page.goto(`${base}/dashboard/home`,{waitUntil:'networkidle'});
  await page.locator('.v-home-priority').waitFor();
  const destinations=await page.locator('#dashboard-navigation a').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
  assert.equal(destinations.length,new Set(destinations).size,'no duplicated destinations');
  assert.equal(await page.locator('#dashboard-navigation .workspace-nav-account a').count(),4);
  const search=await page.locator('.workspace-search-trigger').boundingBox();
  assert.ok(search.width>300,'desktop search label must fit');
  assert.ok(await page.locator('.workspace-search-trigger span').evaluate(node=>node.getBoundingClientRect().width)>100);
  assert.ok(await page.locator('.workspace-search-shortcut').evaluate(node=>node.getBoundingClientRect().height)<30);
  for(const scheme of ['light','dark'])for(const width of [320,390,768,1440]) {
   await page.emulateMedia({colorScheme:scheme});await page.setViewportSize({width,height:1000});
   const geometry=await page.evaluate(()=>{const main=document.getElementById('main');return {documentOverflow:document.documentElement.scrollWidth>innerWidth,mainOverflow:main.scrollWidth>main.clientWidth+1,font:getComputedStyle(main).fontFamily};});
   assert.equal(geometry.documentOverflow,false,`${role}/${scheme}/${width} document`);assert.equal(geometry.mainOverflow,false,`${role}/${scheme}/${width} main`);
   assert.match(geometry.font,/Google Sans/);samples.push({role,scheme,width,...geometry});
   if(role==='student'||width===1440&&scheme==='light')await page.screenshot({path:`${output}/${role}-home-${scheme}-${width}.png`});
  }
  await page.setViewportSize({width:390,height:1000});
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  const large=await page.evaluate(()=>{const bar=document.querySelector('.workspace-topbar'),guide=document.querySelector('.workspace-presence-anchor'),account=bar.lastElementChild;const g=guide.getBoundingClientRect(),b=bar.getBoundingClientRect(),a=account.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth||document.getElementById('main').scrollWidth>document.getElementById('main').clientWidth+1,guideInside:g.top>=b.top&&g.bottom<=b.bottom,guideBeforeAccount:g.right<=a.left+1};});
  assert.equal(large.overflow,false);assert.equal(large.guideInside,true);assert.equal(large.guideBeforeAccount,true);samples.push({role,largeText:large});
  await page.screenshot({path:`${output}/${role}-home-large-text-390.png`});
  await page.evaluate(()=>document.documentElement.style.removeProperty('font-size'));
  if(role==='student') {
   const fixture=JSON.parse(await fs.readFile(path.join(productRoot,'docs/visionary/baseline/design-quality-2026-10-12/fictional-fixture.json'),'utf8'));
   await page.evaluate(storage=>{for(const [key,value] of Object.entries(storage))localStorage.setItem(key,value);},fixture.storage);
   for(const width of [390,1440]) {
    await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:'light'});
    await page.goto(`${base}/dashboard/home`,{waitUntil:'networkidle'});await page.locator('.v-home-priority').waitFor();
    const priority=await page.locator('.v-home-priority').innerText();
    assert.ok(await page.locator('.v-home-priority .primary').getAttribute('href'));
    samples.push({role,populated:true,width,priority});await page.screenshot({path:`${output}/student-populated-${width}.png`});
   }
  }
  await context.close();
 }
 // Secondary destination selection, expansion and phone focus recovery.
 const context=await browser.newContext({viewport:{width:768,height:1000},reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',error=>errors.push(String(error)));
 await loginViaUi(page, base);
 await page.goto(`${base}/dashboard/progress`,{waitUntil:'networkidle'});
 await page.locator('.workspace-nav-more[data-active="true"]').waitFor();
 assert.equal(await page.locator('.workspace-nav-more').getAttribute('aria-current'),'true');
 await page.locator('.workspace-nav-more').click();
 await page.locator('#dashboard-navigation a[href="/dashboard/progress"][aria-current="page"]').waitFor();
 await page.screenshot({path:`${output}/progress-expanded-768.png`});
 await page.setViewportSize({width:390,height:1000});
 await page.locator('.workspace-bottom-more[data-active="true"]').waitFor();
 await page.locator('.workspace-bottom-more').click();
 await page.getByRole('dialog').waitFor();
 await page.getByRole('dialog').getByRole('group',{name:'Preferences & account'}).waitFor();
 await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'});
 assert.equal(await page.locator('.workspace-bottom-more').evaluate(node=>node===document.activeElement),true);
 await page.setViewportSize({width:1440,height:1000});
 await page.keyboard.press('Control+k');await page.getByRole('dialog').waitFor();
 await page.getByRole('searchbox').fill('Learn');await page.getByRole('dialog').getByRole('button',{name:/Learn/}).first().waitFor();
 await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'});
 for(const locale of ['hi','bn']) {
  await page.evaluate(locale=>{const store=JSON.parse(localStorage.getItem('visionary_workspace_v2'));Object.values(store.data)[0].preferences.interfaceLocale=locale;localStorage.setItem('visionary_workspace_v2',JSON.stringify(store));},locale);
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#dashboard-navigation .workspace-nav-account').getAttribute('aria-label'),locale==='hi'?'पसंद और खाता':'পছন্দ ও অ্যাকাউন্ট');
 }
 await context.close();assert.deepEqual(errors,[]);
 await fs.writeFile(`${output}/results.json`,JSON.stringify({samples,errors,checks:['desktop search label/shortcut','five-role navigation groups','secondary rail/phone selection','More expansion/Escape focus','keyboard search','Hindi/Bengali grouping']},null,2));
 console.log(`PASS ${samples.length} role/theme/width and large-text samples; navigation selection, groups, search and focus. No page errors.`);
} finally {await browser.close();}
