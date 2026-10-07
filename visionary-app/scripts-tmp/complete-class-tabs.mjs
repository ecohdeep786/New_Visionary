import fs from 'node:fs';
import {parse} from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';
import {classTabCopy} from '../src/lib/classTabCopy.js';
const traverse=traverseModule.default||traverseModule,generate=generateModule.default||generateModule;
for(const name of ['StreamTab','PeopleTab']){
 const path=`src/components/dashboard/teacher/tabs/${name}.jsx`;let src=fs.readFileSync(path,'utf8').replaceAll('\r\n','\n');
 src=src.replace('useState, useEffect, useCallback','useState');
 src=src.replace('accent })','accent, locale = "en" })');
 src=src.replace('  const { user } = useAuth();',`  const copy = classTabCopy(locale);\n  const { user } = useAuth();`);
 if(name==='StreamTab'){
  src=src.replace('  const [announcements, setAnnouncements] = useState([]);\n  const [loading, setLoading] = useState(true);','');
  const start=src.indexOf('  const load = useCallback('),end=src.indexOf('  const post =',start);
  src=src.slice(0,start)+`  const {records, loading, unavailable, reload: load} = useClassRecords(classId, ['Announcement']);\n  const announcements = [...(records?.[0] || [])].sort((a,b) => new Date(b.createdAt || 0).getTime()-new Date(a.createdAt || 0).getTime());\n`+src.slice(end);
  src=src.replace('value={text} onChange','disabled={busy} value={text} onChange');
  src=src.replace('disabled={Boolean(text)}','disabled={busy || Boolean(text)}');
  src=src.replace('setText(`Welcome to ${classroom?.name || "our class"}! You’ll find assignments in Classwork and class updates here. I’m looking forward to learning together.`)',`setText(copy('Welcome to {name}! You’ll find assignments in Classwork and class updates here. I’m looking forward to learning together.', {name: classroom?.name || copy('our class')}))`);
  src=src.replace('toLocaleString([],','toLocaleString(locale,');
  src=src.replace('{error && <p role="alert" className="text-sm text-[#b3261e]">{error} <button onClick={load} className="underline">Retry</button></p>}',`{error && <p role="alert" className="text-sm text-[#b3261e]">{copy(error)}</p>}\n    {unavailable && <p role="alert" className="text-sm text-[#b3261e]">{copy('Class updates couldn’t be loaded. Please try again.')} <button onClick={load} className="min-h-11 underline">{copy('Retry')}</button></p>}`);
  src=src.replace(': announcements.length === 0 ?',': unavailable ? null : announcements.length === 0 ?');
  src=src.replaceAll('h-10 items-center','h-11 items-center');
 }else{
  src=src.replace('  const [enrollments, setEnrollments] = useState([]);\n  const [loading, setLoading] = useState(true);','');
  const start=src.indexOf('  const load = useCallback('),end=src.indexOf('  const invite =',start);
  src=src.slice(0,start)+`  const {records, loading, unavailable, reload: load} = useClassRecords(classId, ['Enrollment']);\n  const enrollments = records?.[0] || [];\n`+src.slice(end);
  src=src.replace('if (existing.length)',`if (existing.some(row => row.status === 'active' || row.status === 'invited'))`);
  src=src.replace('value === user?.email','value === user?.email?.toLowerCase()');
  src=src.replace('value={email}','disabled={busy}\n              value={email}');
  src=src.replace(`Add an in-app invitation by email, or share class code <span className="font-mono font-medium text-[#121317]">{classroom?.join_code || "from the class header"}</span>. Email delivery is not connected yet.`,`{copy('Add an in-app invitation by email, or share class code {code}. Email delivery is not connected yet.', {code: classroom?.join_code || copy('from the class header')})}`);
  src=src.replace('{error}</p>}','{copy(error)}</p>}').replace('{notice}</p>}','{copy(notice)}</p>}');
  src=src.replace('{enrollments.filter((e) => e.status === "active").length} connected · {enrollments.filter((e) => e.status === "invited").length} invited',`{copy('{connected} connected · {invited} invited', {connected: enrollments.filter(e=>e.status==='active').length, invited: enrollments.filter(e=>e.status==='invited').length})}`);
  src=src.replace('className="flex justify-center py-10"','role="status" aria-label={copy("Loading class records…")} className="flex justify-center py-10"');
  src=src.replace(') : enrollments.length === 0 ?',`) : unavailable ? <p role="alert" className="p-6 text-sm text-[#b3261e]">{copy('We couldn’t load your class members. Please try again.')} <button onClick={load} className="min-h-11 underline">{copy('Retry')}</button></p> : enrollments.length === 0 ?`);
  src=src.replace('{e.status === "active" ? "Connected" : "Invited"}',`{copy(({active:'Connected',invited:'Invited',removed:'Removed',declined:'Declined',expired:'Expired'})[e.status] || 'Unavailable')}`);
 }
 src=`import { classTabCopy } from '@/lib/classTabCopy';\nimport { useClassRecords } from '@/hooks/useClassRecords';\n`+src;
 const ast=parse(src,{sourceType:'module',plugins:['jsx']});
 const translated=value=>classTabCopy('hi')(value)!==value;
 traverse(ast,{
  JSXText(path){const value=path.node.value.trim();if(value&&translated(value))path.replaceWith(t.jsxExpressionContainer(t.callExpression(t.identifier('copy'),[t.stringLiteral(value)])));},
  JSXAttribute(path){if(['placeholder','aria-label'].includes(path.node.name.name)&&t.isStringLiteral(path.node.value)&&translated(path.node.value.value))path.node.value=t.jsxExpressionContainer(t.callExpression(t.identifier('copy'),[t.stringLiteral(path.node.value.value)]));},
  StringLiteral(path){if(!translated(path.node.value)||path.parentPath.isCallExpression()&&path.parent.callee.name==='copy')return;const parent=path.parentPath;if(parent.isConditionalExpression()||parent.isLogicalExpression())path.replaceWith(t.callExpression(t.identifier('copy'),[t.stringLiteral(path.node.value)]));}
 });
 src=generate(ast,{comments:true}).code+'\n';fs.writeFileSync(path,src);
}
const path='src/pages/dashboard/ClassDetail.jsx';let src=fs.readFileSync(path,'utf8').replaceAll('\r\n','\n');for(const name of ['StreamTab','PeopleTab','InsightsTab'])src=src.replace(`<${name} classId={classId}`,`<${name} locale={locale} classId={classId}`);fs.writeFileSync(path,src);

