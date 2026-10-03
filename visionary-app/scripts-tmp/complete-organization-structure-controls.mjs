import fs from 'node:fs';import{parse}from'@babel/parser';import tr from'@babel/traverse';import gen from'@babel/generator';import*as t from'@babel/types';import{organizationAuthorCopy}from'../src/lib/organizationAuthorCopy.js';const traverse=tr.default||tr,generate=gen.default||gen;
for(const p of ['src/components/dashboard/CurriculumTemplateEditor.jsx','src/components/dashboard/CurriculumPracticeEditor.jsx']){
let s=fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');s=`import {useWorkspace} from '@/hooks/useWorkspace';\nimport {organizationAuthorCopy} from '@/lib/organizationAuthorCopy';\n`+s;
const hook=`const {data}=useWorkspace();const interfaceLocale=data?.preferences.interfaceLocale||'en';const copy=organizationAuthorCopy(interfaceLocale);`;
s=s.replaceAll("locale='en'}){", "locale='en'}){\n "+hook);
s=s.replace('questions=[],onChange}){','questions=[],onChange}){\n '+hook).replace('questions=[]}){','questions=[]}){\n '+hook);
s=s.replaceAll('{label}<', '{copy(label)}<').replaceAll('aria-label={label}', 'aria-label={copy(label)}');
s=s.replace('Chapter {index+1}',`{copy('Chapter {number}',{number:index+1})}`).replace('Objective {position+1}',`{copy('Objective {number}',{number:position+1})}`);
s=s.replace('aria-label={`Objective ${position+1} in chapter ${index+1}`}','aria-label={copy("Objective {number} in chapter {chapter}",{number:position+1,chapter:index+1})}');
s=s.replace('Practice question {index+1}',`{copy('Practice question {number}',{number:index+1})}`).replace('Answer option {position+1}',`{copy('Answer option {number}',{number:position+1})}`);
s=s.replace('aria-label={`Answer option ${position+1}`}','aria-label={copy("Answer option {number}",{number:position+1})}');
s=s.replace("Option {position+1}: {option||'Complete the option text'}",`{copy('Option {number}: {text}',{number:position+1,text:option||copy('Complete the option text')})}`);
s=s.replace('>{error.message}</p>', ' lang="en">{error.message}</p>').replace('>{error}</p>', '>{copy(error)}</p>');
const ast=parse(s,{sourceType:'module',plugins:['jsx']});const known=value=>organizationAuthorCopy('hi')(value)!==value;
traverse(ast,{JSXText(p){const value=p.node.value.trim();if(value&&known(value))p.replaceWith(t.jsxExpressionContainer(t.callExpression(t.identifier('copy'),[t.stringLiteral(value)])));},JSXAttribute(p){if(['placeholder','aria-label'].includes(p.node.name.name)&&t.isStringLiteral(p.node.value)&&known(p.node.value.value))p.node.value=t.jsxExpressionContainer(t.callExpression(t.identifier('copy'),[t.stringLiteral(p.node.value.value)]));},StringLiteral(p){if(!known(p.node.value)||p.parentPath.isCallExpression()&&p.parent.callee.name==='copy')return;if(p.parentPath.isConditionalExpression()&&(p.key==='consequent'||p.key==='alternate')||p.parentPath.isLogicalExpression()&&p.key==='right'&&p.findParent(parent=>parent.isJSXExpressionContainer()))p.replaceWith(t.callExpression(t.identifier('copy'),[t.stringLiteral(p.node.value)]));}});
fs.writeFileSync(p,generate(ast).code+'\n');
}
