import fs from 'node:fs';import{parse}from'@babel/parser';import tr from'@babel/traverse';import gen from'@babel/generator';import*as t from'@babel/types';import{guideCopy}from'../src/lib/guideCopy.js';const traverse=tr.default||tr,generate=gen.default||gen;
for(const p of ['src/pages/dashboard/Guide.jsx','src/components/dashboard/GuideEntry.jsx']){
let s=fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');s=`import {guideCopy} from '@/lib/guideCopy';\n`+s;
if(p.endsWith('/Guide.jsx')){
 s=s.replace(' const {ctx,data,error:loadError}=useWorkspace();',` const {ctx,data,error:loadError}=useWorkspace();const locale=data?.preferences.interfaceLocale||'en';const copy=guideCopy(locale);const [,setLearningRetry]=useState(0);`);
 s=s.replace(' const learning=selected?getLearningForConversation(ctx,selected):null;const hasActivity=Boolean(session||canvasPath||learning);',` let learning=null,learningFailure='';try{learning=selected?getLearningForConversation(ctx,selected):null;}catch(error){learningFailure=error.message;}const hasActivity=!learningFailure&&Boolean(session||canvasPath||learning);`);
 s=s.replace('ref={field} value={input}', 'ref={field} disabled={busy} value={input}');
 s=s.replace('disabled={!input.trim()}','disabled={!input.trim()||!!learningFailure}');
 s=s.replace('Return to {learning.title} · Your position is saved', `{copy('Return to {title} · Your position is saved',{title:learning.title})}`);
 s=s.replace('<DialogContent ', '<DialogContent lang={locale} ');
 s=s.replace('aria-label={`Delete conversation: ${c.title}`}','aria-label={copy("Delete conversation: {title}",{title:c.title})}');
 s=s.replace('{roleNames[ctx.role]} workspace', `{copy(roleNames[ctx.role])} · {copy('Workspace view')}`);
 s=s.replace('{a.label}<ArrowUpRight', '{copy(a.label)}<ArrowUpRight');
 s=s.replace('{error}<p>', '<span lang="en">{error}</span><p>');
 s=s.replace('{error} Choose the conversation again to retry.', '<span lang="en">{error}</span> {copy("Choose the conversation again to retry.")}');
 s=s.replace('>{error}</p>', ' lang="en">{error}</p>').replace('<p>{loadError}</p>', '<p lang="en">{loadError}</p>');
 s=s.replace('return <><div className="guide-mobile-tabs"', `return <><div lang={locale}>{learningFailure&&<div role="alert" className="v-notice v-error"><p>{copy('Linked learning records are unavailable. Your conversation and draft remain saved.')}</p><p lang="en">{learningFailure}</p><button className="v-button mt-3" onClick={()=>setLearningRetry(value=>value+1)}>{copy('Retry')}</button></div>}<div className="guide-mobile-tabs"`);
 s=s.replace('</DialogContent></Dialog></>;', '</DialogContent></Dialog></div></>;');
}else{
 s=`import {useWorkspace} from '@/hooks/useWorkspace';\n`+s;
 s=s.replace('  const [value,setValue]',`  const {data}=useWorkspace();const locale=data?.preferences.interfaceLocale||'en';const copy=guideCopy(locale);\n  const [value,setValue]`);
 s=s.replace('{intent.label}', '{copy(intent.label)}').replace('{label}</button>', '{copy(label)}</button>');
 s=s.replace("{value.source==='material'?'Pasted material':value.source==='outside'?'Outside your current plan':'Topic or goal'} · {value.material.length} characters",`{copy('{source} · {count} characters',{source:copy(value.source==='material'?'Pasted material':value.source==='outside'?'Outside your current plan':'Topic or goal'),count:value.material.length})}`);
}
const ast=parse(s,{sourceType:'module',plugins:['jsx']});const known=value=>guideCopy('hi')(value)!==value;
traverse(ast,{JSXText(p){const value=p.node.value.trim();if(value&&known(value))p.replaceWith(t.jsxExpressionContainer(t.callExpression(t.identifier('copy'),[t.stringLiteral(value)])));},JSXAttribute(p){if(['placeholder','aria-label','title'].includes(p.node.name.name)&&t.isStringLiteral(p.node.value)&&known(p.node.value.value))p.node.value=t.jsxExpressionContainer(t.callExpression(t.identifier('copy'),[t.stringLiteral(p.node.value.value)]));},StringLiteral(p){if(!known(p.node.value)||p.parentPath.isCallExpression()&&p.parent.callee.name==='copy')return;if(p.parentPath.isConditionalExpression()&&(p.key==='consequent'||p.key==='alternate')||p.parentPath.isLogicalExpression()&&p.key==='right'&&p.findParent(parent=>parent.isJSXExpressionContainer()))p.replaceWith(t.callExpression(t.identifier('copy'),[t.stringLiteral(p.node.value)]));}});
fs.writeFileSync(p,generate(ast).code+'\n');
}
