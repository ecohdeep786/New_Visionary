import {useEffect,useState} from 'react';
import {ArrowRight,BookOpen} from 'lucide-react';
import {getContentRepository} from '@/services/contentRepository';
import {learningCatalogueCopy} from '@/lib/learningCatalogueCopy';

export default function LearningSubjectShelf({ctx,selection,busy,onSelect,locale,professional}){
 const t=learningCatalogueCopy(locale),[view,setView]=useState({rows:[],loading:true,error:''}),[retry,setRetry]=useState(0);
 useEffect(()=>{let live=true;const controller=new AbortController();setView({rows:[],loading:true,error:''});
  getContentRepository({...ctx,signal:controller.signal}).getSubjects(selection.board,selection.classLevel).then(rows=>{if(live)setView({rows,loading:false,error:''});}).catch(error=>{if(live)setView({rows:[],loading:false,error:error.message});});
  return()=>{live=false;controller.abort();};
 },[ctx.personId,ctx.workspaceId,ctx.locale,selection.board,selection.classLevel,retry]);
 return <section className="v-subject-shelf" aria-labelledby="subject-shelf-title" aria-busy={view.loading}>
  <div className="v-catalogue-heading"><div><h2 id="subject-shelf-title">{t(professional?'Your capabilities':'Your subjects')}</h2><p className="v-muted">{[selection.board,selection.classLevel].filter(Boolean).join(' · ') || t('Your current learning context')}</p></div></div>
  {view.loading ? <p role="status" className="v-muted">{t('Opening your subjects…')}</p> : view.error ? <div className="v-notice v-error" role="alert"><p>{view.error}</p><button className="v-button mt-3" onClick={()=>setRetry(value=>value+1)}>{t('Retry subjects')}</button></div> : view.rows.length ? <div className="v-subject-grid">{view.rows.map(row=><button key={row.subject} className="v-subject-card" disabled={busy} aria-pressed={row.subject===selection.subject} onClick={()=>onSelect({...selection,subject:row.subject})}><span className="v-subject-symbol" aria-hidden="true"><BookOpen size={24}/></span><span><strong>{row.subject}</strong><span className="v-muted">{t(row.origin==='catalog'?'In your catalog':row.origin==='profile'?'From your profile':'Saved outline')}</span></span><ArrowRight size={18} aria-hidden="true"/></button>)}</div> : <p className="v-muted">{t('No subjects are listed for this context yet. Add a subject below or try an authored sample.')}</p>}
 </section>;
}
