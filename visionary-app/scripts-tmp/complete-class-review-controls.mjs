import fs from 'node:fs';import{parse}from'@babel/parser';import tr from'@babel/traverse';import gen from'@babel/generator';import*as t from'@babel/types';import{classTabCopy}from'../src/lib/classTabCopy.js';const traverse=tr.default||tr,generate=gen.default||gen;
for(const path of ['src/components/dashboard/teacher/AssignmentGrader.jsx','src/components/dashboard/CommunityTab.jsx']){
let s=fs.readFileSync(path,'utf8').replaceAll('\r\n','\n');s=`import {classTabCopy} from '@/lib/classTabCopy';\n`+s;
if(path.includes('AssignmentGrader')){
 s=s.replace('const { ctx } = useWorkspace();',`const { ctx, data } = useWorkspace();\n  const locale = data?.preferences.interfaceLocale || 'en';\n  const copy = classTabCopy(locale);`);
 s=s.replace('  const [loading, setLoading]', '  const [loadFailed, setLoadFailed] = useState(false);\n  const [loading, setLoading]');
 s=s.replace("setError('');\n    (async", "setError('');setLoadFailed(false);\n    (async");
 s=s.replace('if (active) setError(failure.message || "Submissions could not be loaded. Close this dialog and try again.");', 'if (active) {setLoadFailed(true);setError(failure.message || "Submissions could not be loaded. Close this dialog and try again.");}');
 s=s.replace('<DialogContent className=', '<DialogContent lang={locale} className=');
 s=s.replace('<p>{error}</p>', '<p lang="en">{error}</p>');
 s=s.replace(') : submissions.length === 0 ?',`) : loadFailed ? <p role="alert" className="text-sm text-[#b3261e]">{copy('Submissions unavailable. Saved work has not been replaced.')} <button className="min-h-11 underline" onClick={()=>setReload(value=>value+1)}>{copy('Retry')}</button></p> : submissions.length === 0 ?`);
 s=s.replace('Attempt {s.attempt || 1}',`{copy('Attempt {number}', {number:s.attempt || 1})}`);
 s=s.replace('Attempt {entry.attempt}',`{copy('Attempt {number}', {number:entry.attempt})}`);
 s=s.replace('Previous attempts and feedback ({s.revision_history.length})',`{copy('Previous attempts and feedback ({count})', {count:s.revision_history.length})}`);
 s=s.replace('aria-label={`Criterion rating: ${item.label} for ${s.student_name||s.student_email}`}','aria-label={copy("Criterion rating: {criterion} for {name}",{criterion:item.label,name:s.student_name||s.student_email})}');
 s=s.replace('aria-label={`Criterion note: ${item.label} for ${s.student_name||s.student_email}`}','aria-label={copy("Criterion note: {criterion} for {name}",{criterion:item.label,name:s.student_name||s.student_email})}');
 s=s.replace('aria-label={"Grade for " + (s.student_name || s.student_email)}','aria-label={copy("Grade for {name}",{name:s.student_name||s.student_email})}');
 s=s.replace('aria-label={"Feedback for " + (s.student_name || s.student_email)}','aria-label={copy("Feedback for {name}",{name:s.student_name||s.student_email})}');
}else{
 s=s.replace('const { ctx } = useWorkspace();',`const { ctx, data } = useWorkspace();\n  const locale = data?.preferences.interfaceLocale || 'en';\n  const copy = classTabCopy(locale);`);
 s=s.replace("setPosts([]);\n      setLoadError", "setPosts([]);setRole(null);\n      setLoadError");
 s=s.replace("window.addEventListener('visionary:community-change', handler);", "window.addEventListener('visionary:community-change', handler);window.addEventListener('storage',handler);window.addEventListener('visionary:workspace-change',handler);");
 s=s.replace("window.removeEventListener('visionary:community-change', handler);", "{window.removeEventListener('visionary:community-change', handler);window.removeEventListener('storage',handler);window.removeEventListener('visionary:workspace-change',handler);}");
 s=s.replace('{loadError}</p>', '{loadError} <button onClick={refresh} className="min-h-11 underline">{copy("Retry")}</button></p>').replace('role="alert" className=', 'role="alert" lang="en" className=');
 s=s.replace('value={text}', 'disabled={busy || !!loadError || !role} value={text}');
 s=s.replace('disabled={!text.trim() || busy}', 'disabled={!text.trim() || busy || !!loadError || !role}');
 s=s.replace(') : posts.length === 0 ?', ') : loadError ? null : posts.length === 0 ?');
 s=s.replace('toLocaleString()', 'toLocaleString(locale)');
 for(const [old,key] of [['Remove post by','Remove post by {name}'],['Restore reported post by','Restore reported post by {name}'],['Report post by','Report post by {name}']])s=s.replace('aria-label={`'+old+' ${item.authorName}`}','aria-label={copy('+JSON.stringify(key)+',{name:item.authorName})}');
}
s=s.replaceAll('h-10 ', 'h-11 ');
const ast=parse(s,{sourceType:'module',plugins:['jsx']});const known=value=>classTabCopy('hi')(value)!==value;
traverse(ast,{JSXText(p){const value=p.node.value.trim();if(value&&known(value))p.replaceWith(t.jsxExpressionContainer(t.callExpression(t.identifier('copy'),[t.stringLiteral(value)])));},JSXAttribute(p){if(['placeholder','aria-label'].includes(p.node.name.name)&&t.isStringLiteral(p.node.value)&&known(p.node.value.value))p.node.value=t.jsxExpressionContainer(t.callExpression(t.identifier('copy'),[t.stringLiteral(p.node.value.value)]));},StringLiteral(p){if(!known(p.node.value)||p.parentPath.isCallExpression()&&p.parent.callee.name==='copy')return;if(p.parentPath.isConditionalExpression()&&(p.key==='consequent'||p.key==='alternate')||p.parentPath.isLogicalExpression()&&p.key==='right')p.replaceWith(t.callExpression(t.identifier('copy'),[t.stringLiteral(p.node.value)]));}});
fs.writeFileSync(path,generate(ast).code+'\n');
}
const p='src/components/dashboard/teacher/tabs/PeopleTab.jsx';let s=fs.readFileSync(p,'utf8').replace("if (existing.some(row => row.status === 'active' || row.status === 'invited'))",'if (existing.length)').replace('setError("This student is already connected or has a pending invitation.");',`setError(existing.some(row=>row.status==='active'||row.status==='invited') ? 'This student is already connected or has a pending invitation.' : 'An enrollment record already exists for this student. Share the class code to reconnect.');`).replace("removed: 'Removed',","removed: 'Removed',left:'Left',inactive:'Inactive',");fs.writeFileSync(p,s);
const cp='src/lib/classTabCopy.js';s=fs.readFileSync(cp,'utf8').replace('const entries = [',`const entries = [\n['Left','कक्षा छोड़ी','ক্লাস ছেড়েছে'],['Inactive','निष्क्रिय','নিষ্ক্রিয়'],['An enrollment record already exists for this student. Share the class code to reconnect.','विद्यार्थी का नामांकन रिकॉर्ड मौजूद है। फिर जुड़ने के लिए कक्षा कोड साझा करें।','শিক্ষার্থীর নথিভুক্তির রেকর্ড আছে। আবার সংযোগের জন্য ক্লাস কোড ভাগ করুন।'],`);fs.writeFileSync(cp,s);
