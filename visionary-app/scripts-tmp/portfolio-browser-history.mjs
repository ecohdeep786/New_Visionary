import fs from 'node:fs';const p='scripts-tmp/portfolio-recovery-verify.mjs';let s=fs.readFileSync(p,'utf8');s=s.replace("assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);",`await dialog.getByRole('button',{name:'Close',exact:true}).click();
await page.getByText('Saved self-review history (2)',{exact:true}).click();
const history=page.locator('ol').filter({has:page.getByText('Next improvement')});
await history.locator('summary').first().click();await history.getByText('Retry reflection',{exact:true}).waitFor();
await history.locator('summary').nth(1).click();await history.getByText('Second tab saved reflection',{exact:true}).waitFor();
await history.screenshot({path:'docs/visionary/baseline/design-2026-09-27/portfolio-review-history-390.png'});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);`);fs.writeFileSync(p,s);
