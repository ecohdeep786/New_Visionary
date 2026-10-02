import {useState,useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {useWorkspace} from '@/hooks/useWorkspace';
import {getAssignedCurriculumOutline} from '@/services/assignedCurriculumOutline';
import {learningSurfaceCopy} from '@/lib/learningSurfaceCopy';

export default function AssignedCurriculumOutline({classId}) {
 const {ctx,data:workspace,revision,error:workspaceError}=useWorkspace();
 const locale=workspace?.preferences.interfaceLocale||'en',labels=learningSurfaceCopy(locale);
 const [query,setQuery]=useState('');
 const {data,error,isPending,isFetching,refetch}=useQuery({queryKey:['assigned-outline',ctx?.personId,ctx?.workspaceId,classId],enabled:!!ctx&&!workspaceError,queryFn:({signal})=>getAssignedCurriculumOutline({...ctx,signal},classId),retry:false,refetchInterval:30000});
 useEffect(()=>{if(ctx&&!workspaceError)refetch();},[revision,refetch,workspaceError,ctx?.workspaceId]);
 useEffect(()=>setQuery(''),[ctx?.personId,ctx?.workspaceId,classId]);
 if(error||workspaceError)return <section className="v-card" lang={locale}><h2 className="text-lg font-medium">{labels.unavailable}</h2><p role="alert" className="v-notice v-error mt-3">{workspaceError||error.message}</p><button className="v-button mt-3" onClick={()=>refetch()}>{labels.retry}</button></section>;
 if(isPending)return <section className="v-card" role="status" lang={locale}>{labels.loading}</section>;
 if(!data)return null;
 const needle=query.trim().toLocaleLowerCase(locale);
 const chapterTitle=chapter=>chapter.fallbackTitle?labels.fallbackChapter:chapter.title;
 const chapters=data.chapters.map(chapter=>({...chapter,objectives:chapter.objectives.filter(row=>[row.title,row.assignmentTitle,chapterTitle(chapter)].some(title=>title.toLocaleLowerCase(locale).includes(needle)))})).filter(chapter=>chapter.objectives.length);
 const unmapped=data.unmapped.filter(row=>row.title.toLocaleLowerCase(locale).includes(needle));
 return <section className="v-card min-w-0" lang={locale}><h2 className="text-lg font-medium">{labels.title}</h2><p className="v-muted mt-2">{labels.intro}</p>{isFetching&&<p className="v-muted mt-3" role="status">{labels.loading}</p>}<label className="mt-4 block text-sm">{labels.find}<input className="v-field mt-2" value={query} onChange={event=>setQuery(event.target.value)}/></label>{data.unavailableCount>0&&<p className="v-notice mt-3" role="status">{labels.unreadable(data.unavailableCount)}<button className="v-button mt-2" onClick={()=>refetch()}>{labels.retrySources}</button></p>}
 {chapters.map(chapter=><article className="mt-5 rounded-xl border p-4 min-w-0" key={chapter.id}><h3 className="text-base font-medium break-words" lang={chapter.fallbackTitle?locale:chapter.locale}>{chapterTitle(chapter)}</h3><p className="v-muted mt-2 break-words">{chapter.selection.subject} · {chapter.selection.classLevel} · {chapter.source.provider} · {labels.version} {chapter.source.version}</p>{chapter.sourceSection&&<p className="v-muted mt-2 break-words">{labels.sourceSection}: <span lang={chapter.locale}>{chapter.sourceSection}</span></p>}<p className="v-muted mt-2">{chapter.status==='reviewed'?labels.reviewed:chapter.status==='sample'?labels.authored:labels.sourced} · {chapter.locale}</p><ul className="mt-4 space-y-4">{chapter.objectives.map(row=><li className="border-t pt-3 min-w-0" key={row.assignmentId}><h4 className="font-medium break-words" lang={chapter.locale}>{row.title}</h4><p className="v-muted mt-2 break-words">{row.assignmentTitle} · {labels[row.state]||labels.savedStatus} · {labels.assignment}: {labels[row.assignmentState]||labels.unknownAssignment}</p>{!!row.prerequisites.length&&<p className="v-muted mt-2 break-words">{labels.prerequisite}: <span lang={chapter.locale}>{row.prerequisites.map(item=>item.title).join(' · ')}</span>. {labels.reviewTeacher}</p>}<div className="mt-3 flex flex-wrap gap-2">{[[labels.open,row.href],[labels.ask,row.askHref],[labels.practice,row.practiceHref]].map(([label,href])=><Link key={href} aria-label={`${label}: ${row.title}`} className={'v-button'+(href===row.href?' primary':'')} to={href}>{label}<span className="sr-only" lang={chapter.locale}>: {row.title}</span></Link>)}</div></li>)}</ul></article>)}
 {!!unmapped.length&&<section className="mt-5"><h3 className="font-medium">{labels.unmapped}</h3><p className="v-muted mt-2">{labels.unmappedIntro}</p>{unmapped.map(row=><Link className="v-button mt-3" key={row.id} to={row.href}>{row.title}</Link>)}</section>}{!chapters.length&&!unmapped.length&&<p className="v-muted mt-5" role="status">{query?labels.noMatch:data.assignedCount?labels.unreadableEmpty:labels.empty}</p>}{query&&<button className="v-button mt-3" onClick={()=>setQuery('')}>{labels.clear}</button>}
 </section>;
}
