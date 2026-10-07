import fs from 'node:fs';import{parse}from'@babel/parser';import tr from'@babel/traverse';import gen from'@babel/generator';import*as t from'@babel/types';import{organizationAuthorCopy}from'../src/lib/organizationAuthorCopy.js';const traverse=tr.default||tr,generate=gen.default||gen;
for(const p of ['src/pages/dashboard/OrganizationContent.jsx','src/pages/dashboard/OrganizationCurriculum.jsx','src/components/dashboard/OrganizationContentDelivery.jsx']){
let s=fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');s=`import {organizationAuthorCopy} from '@/lib/organizationAuthorCopy';\n`+s;
if(p.endsWith('OrganizationContent.jsx')){
 s=s.replace(' const newDraftKey=', ` const locale=data.preferences.interfaceLocale||'en';const copy=organizationAuthorCopy(locale);\n const newDraftKey=`);
 s=s.replace('<div className="v-page">', '<div lang={locale} className="v-page">');
 s=s.replace('<DialogContent className=', '<DialogContent lang={locale} className=');
 s=s.replace('<option key={value}>{value}</option>','<option key={value} value={value}>{copy(value)}</option>');
 s=s.replace('`Revision ${row.contentReview.revision} · ${row.status}`', `copy('Revision {revision} · {state}', {revision:row.contentReview.revision,state:copy(row.status)})`);
 s=s.replace('`Revision ${latest.contentReview.revision} · ${state}`',`copy('Revision {revision} · {state}', {revision:latest.contentReview.revision,state:copy(state)})`);
 s=s.replace(' · Organization audience', ` · {copy('Organization audience')}`);
 s=s.replace("labels[action]+'. Saved on this device.'", `copy('{action}. Saved on this device.',{action:copy(labels[action])})`);
 s=s.replace("cleanupFailed?' The old editor backup could not be removed; it may appear again.':''", "cleanupFailed?copy(' The old editor backup could not be removed; it may appear again.'):''");
 s=s.replace('setNotice(message+', 'setNotice(copy(message)+');
 s=s.replace('{notice}</p>', '{copy(notice)}</p>');
 s=s.replace("role={failure?'alert':'status'}", "lang={copy(notice)===notice?'en':locale} role={failure?'alert':'status'}");
 s=s.replace('{label}</label>', '{copy(label)}</label>');
 s=s.replace('{labels[event.action]||event.action} · Revision {event.revision}', `{copy(labels[event.action]||event.action)} · {copy('Revision {revision}',{revision:event.revision})}`);
 s=s.replace('Revision {version.revision}: {version.title}', `{copy('Revision {revision}: {title}', {revision:version.revision,title:version.title})}`);
 s=s.replace('new Date(event.at).toLocaleString()', `Number.isFinite(new Date(event.at).getTime())?new Date(event.at).toLocaleString(locale):copy('Unavailable')`);
 s=s.replace('{unsaved&&<button', `{draft.id&&latest&&<button className="v-button" onClick={()=>discard(true)}>{copy('Discard edits and load latest saved version')}</button>}{unsaved&&<button`);
}else if(p.endsWith('OrganizationCurriculum.jsx')){
 s=s.replace(' const scope=useWorkspace();', ` const scope=useWorkspace();const locale=scope.data?.preferences.interfaceLocale||'en';const copy=organizationAuthorCopy(locale);`);
 s=s.replace('scope.ctx?.workspaceId,retry]', 'scope.ctx?.workspaceId,scope.revision,retry]');
 s=s.replace('setFailure(error.message);setLoading(false);','setLegacy([]);setFailure(error.message);setLoading(false);');
 s=s.replace('{scope.error}', '{scope.error}').replace('role="alert">{scope.error}', 'role="alert" lang="en">{scope.error}');
 s=s.replace('role="alert" className="v-notice v-error mt-3">{failure}', 'role="alert" lang="en" className="v-notice v-error mt-3">{failure}');
 s=s.replace('<section className="v-page">', '<section lang={locale} className="v-page">');
 s=s.replace('onClick={()=>setRetry', 'lang={locale} onClick={()=>setRetry');
}else{
 s=`import {useWorkspace} from '@/hooks/useWorkspace';\nimport {connectionStatus} from '@/lib/connectionAvailability';\n`+s;
 s=s.replace(" const [recipient",` const {data}=useWorkspace();const locale=data?.preferences.interfaceLocale||'en';const copy=organizationAuthorCopy(locale);\n const [recipient`);
 s=s.replace("row.status==='active'", "connectionStatus(row)==='active'");
 s=s.replace('<section className="v-card">', '<section lang={locale} className="v-card">');
 s=s.replace('>{error}</p>', ' lang="en">{error} <button type="button" lang={locale} className="v-button mt-3" onClick={()=>setRetry(value=>value+1)}>{copy("Retry")}</button></p>');
 s=s.replace("const [recipient,setRecipient]", "const [,setRetry]=useState(0);const [recipient,setRecipient]");
 s=s.replace('{notice}</p>', '{copy(notice)}</p>');
 s=s.replace("role={failed?'alert':'status'}", "lang={copy(notice)===notice?'en':locale} role={failed?'alert':'status'}");
 s=s.replace('{resource.title} · Revision {resource.contentReview.revision}', `{resource.title} · {copy('Revision {revision}', {revision:resource.contentReview.revision})}`);
 s=s.replace('{resource.contentReview.deliveries.length} saved delivery copies across revisions. Revoked memberships cannot open their inbox copies.', `{copy('{count} saved delivery copies across revisions. Revoked memberships cannot open their inbox copies.', {count:resource.contentReview.deliveries.length})}`);
 s=s.replace('disabled={!recipient||paused}', 'disabled={!recipient||paused||!teachers.some(row=>row.email===recipient)}');
}
const ast=parse(s,{sourceType:'module',plugins:['jsx']});const known=value=>organizationAuthorCopy('hi')(value)!==value;
traverse(ast,{JSXText(p){const value=p.node.value.trim();if(value&&known(value))p.replaceWith(t.jsxExpressionContainer(t.callExpression(t.identifier('copy'),[t.stringLiteral(value)])));},JSXAttribute(p){if(['placeholder','aria-label'].includes(p.node.name.name)&&t.isStringLiteral(p.node.value)&&known(p.node.value.value))p.node.value=t.jsxExpressionContainer(t.callExpression(t.identifier('copy'),[t.stringLiteral(p.node.value.value)]));},StringLiteral(p){if(!known(p.node.value)||p.parentPath.isCallExpression()&&p.parent.callee.name==='copy')return;if(p.parentPath.isConditionalExpression()&&(p.key==='consequent'||p.key==='alternate')||p.parentPath.isLogicalExpression()&&p.key==='right'&&p.findParent(parent=>parent.isJSXExpressionContainer()))p.replaceWith(t.callExpression(t.identifier('copy'),[t.stringLiteral(p.node.value)]));}});
fs.writeFileSync(p,generate(ast).code+'\n');
}
