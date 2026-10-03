import fs from 'node:fs';
let source=fs.readFileSync('scripts-tmp/org-settings-verify.mjs','utf8').replaceAll('\r\n','\n');
source="import {organizationCopy} from '../src/lib/organizationCopy.js';\nconst locale=process.env.VISIONARY_TEST_LOCALE||'en';const t=key=>organizationCopy(locale,key);\n"+source;
source=source.replace('context.addInitScript(()=>','context.addInitScript(locale=>').replace("interfaceLocale:'en'","interfaceLocale:locale").replace('});\nconst page=', '},locale);\nconst page=');
source=source.replaceAll(/getByLabel\('([^']+)'/g,"getByLabel(t('$1')").replaceAll(/getByRole\('([^']+)',\{name:'([^']+)'/g,"getByRole('$1',{name:t('$2')");
source=source.replace('getByText(/Unsaved organization settings recovered/)',"getByText(t('Unsaved organization settings recovered. Review their effects before saving.'),{exact:true})");
source=source.replace("getByText('Organization settings saved on this device.',{exact:true})","getByText(t('Organization settings saved on this device.'),{exact:true})");
source=source.replace('getByText(/Only the organization owner can change them/)',"getByText(t('Your administrative role can read these settings. Only the organization owner can change them.'),{exact:true})");
// New organization workspaces use the saved interface preference, separate from content language.
source=source.replace("db.active['delivery-admin']='delivery-admin:organization:org:owner@delivery.test';", "db.active['delivery-admin']='delivery-admin:organization:org:owner@delivery.test';db.data[db.active['delivery-admin']].preferences.interfaceLocale='"+"'+locale+'"+"';");
// Inject locale through page.evaluate's argument rather than a closure in the browser.
source=source.replace("page.evaluate(()=>{const db=JSON.parse", "page.evaluate(locale=>{const db=JSON.parse");
source=source.replace("preferences.interfaceLocale=''+locale+'';", 'preferences.interfaceLocale=locale;');
source=source.replace("localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));});await page.goto(base+'/dashboard/settings'", "localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));},locale);await page.goto(base+'/dashboard/settings'");
source=source.replace("path:'docs/visionary/baseline/design-2026-09-27/organization-settings-review-390.png'", "path:`scripts-tmp/organization-settings-review-${locale}.png`");
source=source.replaceAll('setDefaultTimeout(90000)','setDefaultTimeout(20000)');
source=source.replace('}finally{await browser.close();}',"}catch(error){console.log(await page.locator('body').innerText());console.log(errors);throw error;}finally{await browser.close();}");
fs.writeFileSync('scripts-tmp/organization-settings-language-verify.mjs',source);
