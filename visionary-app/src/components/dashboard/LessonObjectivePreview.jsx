import {useState} from 'react';
import LearningRepresentation from './LearningRepresentation';
import {assertLessonObjective} from '@/services/lessonObjective';
import {useWorkspace} from '@/hooks/useWorkspace';
import {objectivePreviewCopy} from '@/lib/learningSurfaceCopy';

export default function LessonObjectivePreview({objective,value,onChange,preferText=false}) {
 const {data:workspace}=useWorkspace();
 const locale=workspace?.preferences.interfaceLocale||'en',labels=objectivePreviewCopy(locale);
 const [previewView,setPreviewView]=useState({});
 if(!objective)return null;
 try{assertLessonObjective(objective);}catch(failure){return <p role="alert" className="v-notice v-error">{failure.message}</p>;}
 return <section className="mt-5 min-w-0" aria-label={labels.attached} lang={locale}><h2 className="text-lg font-medium">{labels.title}: <span lang={objective.locale}>{objective.title}</span></h2><p className="v-muted mt-2 break-words">{objective.status==='sample'?labels.authored:objective.status==='reviewed'?labels.reviewed:labels.sourced} · {objective.selection.subject} · {labels.languages[objective.locale]} · {objective.provenance.provider} · {labels.version} {objective.provenance.version}</p><details className="mt-3 text-sm"><summary className="cursor-pointer">{labels.source}</summary><p className="mt-2 break-all">{objective.conceptId} · {objective.provenance.sourceId}</p><p className="v-muted mt-2">{objective.selection.board} · {labels.level} {objective.selection.classLevel}. {labels.retained}</p></details>{!!objective.prerequisites?.length&&<section className="mt-4"><h3 className="text-sm font-medium">{labels.prerequisites}</h3><ul className="mt-2 list-disc pl-5 text-sm" lang={objective.locale}>{objective.prerequisites.map(item=><li key={item.id}>{item.title}</li>)}</ul><p className="v-muted mt-2">{labels.guidance}</p></section>}<p lang={objective.locale} className="mt-4 whitespace-pre-wrap leading-8 break-words">{objective.explanation}</p><LearningRepresentation contentLocale={objective.locale} descriptors={objective.representations} value={value||previewView} preferText={preferText} temporary={!onChange} onChange={onChange||((patch)=>setPreviewView(current=>({...current,...patch})))}/>{!objective.representations.length&&<p className="v-muted mt-3">{labels.noVisual}</p>}{!!objective.criteria?.length&&<section className="mt-5"><h3 className="font-medium">{labels.criteria}</h3><ul className="mt-3 space-y-3 text-sm break-words" lang={objective.locale}>{objective.criteria.map(item=><li key={item.id}>{item.label}: {item.prompt}</li>)}</ul></section>}</section>;
}
