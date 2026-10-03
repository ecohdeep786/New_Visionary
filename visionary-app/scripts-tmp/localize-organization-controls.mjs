import fs from 'node:fs';
import {parse} from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as types from '@babel/types';
const traverse=traverseModule.default,generate=generateModule.default;
for(const name of ['OrganizationBilling','OrganizationAccessHome']){
 const path=`src/pages/dashboard/${name}.jsx`;
 let source=fs.readFileSync(path,'utf8').replace('({ctx})','({ctx,locale=\'en\'})');
 source="import {organizationCopy} from '@/lib/organizationCopy';\n"+source;
 source=source.replace(" const "," const t=(key,params)=>organizationCopy(locale,key,params);\n const ");
 const ast=parse(source,{sourceType:'module',plugins:['jsx']});
 traverse(ast,{JSXText(path){const key=path.node.value.trim();if(key&&/[A-Za-z]/.test(key)){path.replaceWith(types.jsxExpressionContainer(types.callExpression(types.identifier('t'),[types.stringLiteral(key)])));}},JSXAttribute(path){if(path.node.name.name==='aria-label'&&types.isStringLiteral(path.node.value))path.node.value=types.jsxExpressionContainer(types.callExpression(types.identifier('t'),[path.node.value]));}});
 source=generate(ast).code;
 source=source.replace('<div className="v-page">','<div className="v-page" lang={locale}>');
 if(name==='OrganizationBilling'){
  source=source.replace('{row.seats} seats · {row.status}',"{t('{count} seats · {status}',{count:row.seats,status:t(row.status)})}");
  source=source.replace('{notice}</p>','{failed?notice:t(notice)}</p>');
  source=source.replace('role={failed ? \'alert\' : \'status\'}','lang={failed?\'en\':locale} role={failed ? \'alert\' : \'status\'}');
  source=source.replace('{error}<button','<span lang="en">{error}</span><button');
  source=source.replace('new Date(row.at).toLocaleString()','new Date(row.at).toLocaleString(locale)');
  source=source.replace('<textarea className="v-field mt-2"','<textarea aria-label={t(\'Purpose\')} className="v-field mt-2"');
  // The label wrapper must stay localizable without changing the request status enum.
  source=source.replace('{row.seats}{t("seats ·")}{row.status}',"{t('{count} seats · {status}',{count:row.seats,status:t(row.status)})}");
 }else{
  source=source.replace('{policy.label}','{t(policy.label)}').replace('{label}</Link>','{t(label)}</Link>');
 }
 fs.writeFileSync(path,source+'\n');
}
let path='src/components/dashboard/DashboardLayout.jsx',source=fs.readFileSync(path,'utf8');
source="import {organizationCopy} from '@/lib/organizationCopy';\n"+source;
source=source.replace('<h1 className="v-title">Permission required</h1>','<h1 className="v-title">{organizationCopy(locale,\'Permission required\')}</h1>');
source=source.replace('Your {policy.label.toLowerCase()} permission does not include this section. Ask the organization owner to review access.',"{organizationCopy(locale,'Your {role} permission does not include this section. Ask the organization owner to review access.',{role:organizationCopy(locale,policy.label)})}");
source=source.replace('>Return to workspace</NavLink>',">{organizationCopy(locale,'Return to workspace')}</NavLink>");
source=source.replace('<OrganizationAccessHome ctx={ctx}/>','<OrganizationAccessHome key={ctx.personId+\':\'+ctx.workspaceId} ctx={ctx} locale={locale}/>').replace('<OrganizationBilling ctx={ctx}/>','<OrganizationBilling key={ctx.personId+\':\'+ctx.workspaceId} ctx={ctx} locale={locale}/>');
source=source.replace('!permitted?<div className="v-page">','!permitted?<div className="v-page" lang={locale}>');
fs.writeFileSync(path,source);
path='src/pages/dashboard/WorkspaceTools.jsx';source=fs.readFileSync(path,'utf8').replace('<OrganizationAudit ctx={ctx} />',"<OrganizationAudit key={ctx.personId+':'+ctx.workspaceId} ctx={ctx} locale={data.preferences.interfaceLocale||'en'} />");fs.writeFileSync(path,source);
