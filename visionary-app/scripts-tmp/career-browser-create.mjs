import fs from 'node:fs';
let source=fs.readFileSync('scripts-tmp/professional-share-verify.mjs','utf8');source=source.slice(0,source.indexOf('const page=await context.newPage();'));
source+=`const page=await context.newPage();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try {
await page.goto(base+'/dashboard/career',{waitUntil:'networkidle'});
const title=page.getByLabel('Capability or role target'),body=page.getByLabel('What would useful progress look like?');
await title.fill('First target');await body.fill('Private unsaved direction');
await page.reload({waitUntil:'networkidle'});
await page.getByText('Unsaved career edits recovered on this device. Save direction to keep them.').waitFor();assert.equal(await title.inputValue(),'First target');
await page.getByRole('button',{name:'Save direction',exact:true}).click();await page.getByText(/Career target saved on this device/).waitFor();
await body.fill('My unfinished edits');
const second=await context.newPage();await second.goto(base+'/dashboard/career',{waitUntil:'networkidle'});
await second.getByLabel('Capability or role target').fill('Other tab target');await second.getByRole('button',{name:'Save direction',exact:true}).click();
await page.getByRole('heading',{name:'A newer direction is saved'}).waitFor();assert.equal(await body.inputValue(),'My unfinished edits');assert.equal(await page.getByRole('button',{name:'Save direction',exact:true}).isDisabled(),true);
const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export current edits'}).click();assert.equal((await download).suggestedFilename(),'career-direction-edits.json');
await page.screenshot({path:'docs/visionary/baseline/design-2026-09-27/career-conflict-390.png'});
await page.getByRole('button',{name:'Load saved direction and discard edits'}).click();assert.equal(await title.inputValue(),'Other tab target');
await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='visionary_workspace_v2')throw Error('Fictional storage failure');return original.call(this,key,value);};window.restoreCareerStorage=()=>Storage.prototype.setItem=original;});
await title.fill('Retry target');await page.getByRole('button',{name:'Save direction',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await title.inputValue(),'Retry target');
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_workspace_v2')).data['share-pro:professional'].resources[0].title),'Other tab target');
await page.evaluate(()=>window.restoreCareerStorage());await page.getByRole('button',{name:'Save direction',exact:true}).click();await page.reload({waitUntil:'networkidle'});assert.equal(await title.inputValue(),'Retry target');
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.deepEqual(errors,[]);console.log('PASS career refresh, separate tabs, conflict retention, export, reload, failed save and retry at 390px');
} finally {await browser.close();}
`;
fs.writeFileSync('scripts-tmp/career-recovery-verify.mjs',source);

