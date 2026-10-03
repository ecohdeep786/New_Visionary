import fs from 'node:fs';import {parse} from '@babel/parser';import traverseModule from '@babel/traverse';import generateModule from '@babel/generator';import * as types from '@babel/types';
const path='src/pages/dashboard/ClassDetail.jsx';let source=fs.readFileSync(path,'utf8').replaceAll('\r\n','\n');
source="import {teacherCopy} from '@/lib/teacherCopy';\nimport {useWorkspace} from '@/hooks/useWorkspace';\n"+source;
source=source.replace('useState, useEffect','useState, useEffect, useRef');
source=source.replace('export default function ClassDetail() {', "export default function ClassDetail(){const scope=useWorkspace();const {classId}=useParams();return <ClassDetailContent key={scope.ctx?.personId+':'+scope.ctx?.workspaceId+':'+classId} scope={scope}/>;}\nfunction ClassDetailContent({scope}) {");
source=source.replace('  const { classId } = useParams();', "  const { classId } = useParams();const {data:workspaceData,ctx,revision}=scope;const locale=workspaceData?.preferences.interfaceLocale||'en';const copy=teacherCopy(locale);const [retry,setRetry]=useState(0);const mounted=useRef(true);const firstRead=useRef(true);useEffect(()=>()=>{mounted.current=false;},[]);");
const start=source.indexOf('  useEffect(() => {\n    (async () => {');const end=source.indexOf('  const copyCode',start);
source=source.slice(0,start)+`  useEffect(()=>{
    let current=true;if(firstRead.current){setLoading(true);firstRead.current=false;}setError('');
    (async()=>{try{const c=await base44.entities.Classroom.get(classId);if(!current)return;const ownsClass=c&&(c.teacher_email===user?.email||c.teacher_id===user?.id||c.created_by_id===user?.id||c.created_by===user?.email);setClassroom(ownsClass?c:null);setCopied(false);}catch{if(current){setClassroom(null);setError('We couldn’t load this class. Return to your classes and try again.');}}finally{if(current)setLoading(false);}})();
    return()=>{current=false;};
  },[classId,user?.email,user?.id,ctx?.workspaceId,revision,retry]);

`+source.slice(end);
source=source.replace('try { await navigator.clipboard.writeText(classroom.join_code); setCopied(true); }', "try {const latest=await base44.entities.Classroom.get(classId);if(!mounted.current)return;if(!latest||!(latest.teacher_email===user?.email||latest.teacher_id===user?.id||latest.created_by_id===user?.id||latest.created_by===user?.email))throw Error('Class unavailable');await navigator.clipboard.writeText(latest.join_code);if(mounted.current)setCopied(true); }");
source=source.replace('if (user?.identity === "student")',"if (ctx?.role === 'student'||ctx?.role==='professional')");
source=source.replace('<div className="flex items-center justify-center min-h-[400px]">', '<div className="flex items-center justify-center min-h-[400px]" role="status" aria-label={copy(\'Loading classes…\')}>');
source=source.replace('<p className="text-sm text-[#5f6368]">{error || "This class isn’t available in your teaching workspace."}</p>',"<h1 className=\"v-title\">{copy('Class unavailable')}</h1><p className=\"text-sm text-[#5f6368]\" role=\"alert\">{copy(error || \"This class isn’t available in your teaching workspace.\")}</p><button className=\"v-button\" onClick={()=>setRetry(value=>value+1)}>{copy('Retry')}</button>");
source=source.replace('Room {classroom.room}',"{copy('Room {room}',{room:classroom.room})}");
source=source.replace('aria-label={copied ? "Class code copied" : "Copy class code"}', 'aria-label={copy(copied ? "Class code copied" : "Copy class code")}');
source=source.replace('{error}</p>','{copy(error)}</p>').replace('{t.label}','{copy(t.label)}');
const ast=parse(source,{sourceType:'module',plugins:['jsx']});traverseModule.default(ast,{JSXText(path){const key=path.node.value.trim();if(key&&/[A-Za-z]/.test(key))path.replaceWith(types.jsxExpressionContainer(types.callExpression(types.identifier('copy'),[types.stringLiteral(key)])));},JSXAttribute(path){if(path.node.name.name==='aria-label'&&types.isStringLiteral(path.node.value))path.node.value=types.jsxExpressionContainer(types.callExpression(types.identifier('copy'),[path.node.value]));}});
source=generateModule.default(ast).code.replace('<div className="flex flex-col gap-8 p-6 lg:p-10 max-w-[1200px] mx-auto w-full">','<div className="flex flex-col gap-8 p-6 lg:p-10 max-w-[1200px] mx-auto w-full" lang={locale}>');fs.writeFileSync(path,source+'\n');
