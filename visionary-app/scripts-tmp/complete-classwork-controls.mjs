import fs from 'node:fs';import{parse}from'@babel/parser';import tr from'@babel/traverse';import gen from'@babel/generator';import*as t from'@babel/types';import{classTabCopy}from'../src/lib/classTabCopy.js';const traverse=tr.default||tr,generate=gen.default||gen;
for(const path of ['src/components/dashboard/teacher/tabs/ClassworkTab.jsx','src/components/dashboard/ClassPromotion.jsx']){
let s=fs.readFileSync(path,'utf8').replaceAll('\r\n','\n');s=s.replace('accent })','accent, locale = "en" })');s=s.replace('  const { user', '  const copy = classTabCopy(locale);\n  const { user');s=`import {classTabCopy} from '@/lib/classTabCopy';\n`+s;
if(path.includes('ClassworkTab')){
 s=s.replace('{a.points || 100} points{a.due_date ? ` · Due ${a.due_date}` : ""}',`{copy('{points} points{due}', {points: a.points ?? copy('Unavailable'), due: a.due_date ? copy(' · Due {date}', {date:a.due_date}) : ''})}`);
 s=s.replace('{subs.length > 0 ? `Review (${subs.length}${ungraded ? ` · ${ungraded} new` : ""})` : "Review"}',`{subs.length > 0 ? copy('Review ({count}{newCount})', {count:subs.length,newCount:ungraded ? copy(' · {count} new', {count:ungraded}) : ''}) : copy('Review')}`);
 s=s.replace('aria-label={`Remove ${t}`}','aria-label={copy("Remove {topic}", {topic:t})}');
 s=s.replace('aria-label={`Actions for ${a.title}`}','aria-label={copy("Actions for {title}", {title:a.title})}');
 s=s.replace('`Scheduled · ${new Date(a.publish_at).toLocaleString()} · hidden until publication`',`copy('Scheduled · {date} · hidden until publication', {date: Number.isFinite(new Date(a.publish_at).getTime()) ? new Date(a.publish_at).toLocaleString(locale) : copy('Unavailable')})`);
 s=s.replace("{({draft:","{copy(({draft:").replace("||'State unavailable'}</p>","||'State unavailable')}</p>");
 s=s.replace('{error}</p>}', '{copy(error)}</p>}').replace('{loadError} <button', '{copy(loadError)} <button');
 s=s.replace('window.addEventListener("visionary:workspace-change", load);','window.addEventListener("visionary:workspace-change", load);\n    window.addEventListener("storage", load);');
 s=s.replace('window.removeEventListener("visionary:workspace-change", load);','window.removeEventListener("visionary:workspace-change", load);window.removeEventListener("storage", load);');
 s=s.replace('a.topics && a.topics.length > 0','Array.isArray(a.topics) && a.topics.length > 0');
 s=s.replace('a.topics.map((t)',"a.topics.filter(topic=>typeof topic==='string').map((t)");
 s=s.replace('className="flex-1 h-11', 'className="min-w-0 flex-1 h-11');
 s=s.replace('grid grid-cols-2 gap-4','grid grid-cols-1 gap-4 sm:grid-cols-2');
}else{
 s=s.replace("{result.promoted.length} learner{result.promoted.length === 1 ? '' : 's'} moved to class {result.nextClassLevel}.",`{copy('{count} learners moved to class {level}.', {count:result.promoted.length,level:result.nextClassLevel})}`);
 s=s.replace('{alreadyCount} already in class {result.nextClassLevel}.',`{copy('{count} already in class {level}.', {count:alreadyCount,level:result.nextClassLevel})}`);
 s=s.replace('{reviewCount} need individual review or learner confirmation; their stage was not changed.',`{copy('{count} need individual review or learner confirmation; their stage was not changed.', {count:reviewCount})}`);
 s=s.replace('role="alert" className=', 'role="alert" lang="en" className=');
}
s=s.replaceAll('h-10 ', 'h-11 ').replaceAll('h-9 px-4','h-11 px-4');
const ast=parse(s,{sourceType:'module',plugins:['jsx']});const known=value=>classTabCopy('hi')(value)!==value;
traverse(ast,{JSXText(p){const value=p.node.value.trim();if(value&&known(value))p.replaceWith(t.jsxExpressionContainer(t.callExpression(t.identifier('copy'),[t.stringLiteral(value)])));},JSXAttribute(p){if(['placeholder','aria-label'].includes(p.node.name.name)&&t.isStringLiteral(p.node.value)&&known(p.node.value.value))p.node.value=t.jsxExpressionContainer(t.callExpression(t.identifier('copy'),[t.stringLiteral(p.node.value.value)]));},StringLiteral(p){if(!known(p.node.value)||p.parentPath.isCallExpression()&&p.parent.callee.name==='copy')return;if(p.parentPath.isConditionalExpression()&&(p.key==='consequent'||p.key==='alternate'))p.replaceWith(t.callExpression(t.identifier('copy'),[t.stringLiteral(p.node.value)]));}});
fs.writeFileSync(path,generate(ast).code+'\n');
}
const p='src/pages/dashboard/ClassDetail.jsx';let s=fs.readFileSync(p,'utf8');for(const name of ['ClassworkTab','ClassPromotion'])s=s.replace(`<${name} classId={classId}`,`<${name} locale={locale} classId={classId}`);fs.writeFileSync(p,s);
