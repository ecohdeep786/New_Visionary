import {useEffect,useMemo,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {ArrowRight,BookOpen,Search} from 'lucide-react';
import {useWorkspace} from '@/hooks/useWorkspace';
import {workspaceIdentity} from '@/services/workspaceService';
import {loadBookCatalogue} from '@/services/bookCatalogueService';
import {SAMPLE_LIBRARY_SELECTION,PROFESSIONAL_SAMPLE_SELECTION} from '@/services/contentRepository';
import {learningProfileSelection,filterCatalogueBooks} from '@/lib/learningCatalogue';
import {learningCatalogueCopy} from '@/lib/learningCatalogueCopy';
import WorkspaceIntro from '@/components/dashboard/WorkspaceIntro';
import WorkspaceEmptyState from '@/components/dashboard/WorkspaceEmptyState';
import WorkspaceSkeleton from '@/components/dashboard/WorkspaceSkeleton';

const catalogueViews=new Map();
export default function BookCatalogue(){
 const {ctx,data,error:scopeError}=useWorkspace();
 const [params,setParams]=useSearchParams();
 const locale=data?.preferences.interfaceLocale || 'en',t=learningCatalogueCopy(locale);
 const [view,setView]=useState({loading:true,groups:[],failures:[],error:'',progressError:''}),[retry,setRetry]=useState(0);
 const profile=ctx?learningProfileSelection(workspaceIdentity(ctx).person.learningContext):{board:'',classLevel:'',subject:''};
 const board=params.get('catalogueBoard')??profile.board,level=params.get('catalogueLevel')??profile.classLevel,subject=params.get('catalogueSubject')||'';
 const viewKey=JSON.stringify([ctx?.personId,ctx?.workspaceId,board,level,subject]);
 const [query,setQuery]=useState(()=>catalogueViews.get(viewKey)?.query||''),[status,setStatus]=useState(()=>catalogueViews.get(viewKey)?.status||'all'),[sort,setSort]=useState(()=>catalogueViews.get(viewKey)?.sort||'catalog');
 useEffect(()=>{catalogueViews.set(viewKey,{query,status,sort});if(catalogueViews.size>80)catalogueViews.delete(catalogueViews.keys().next().value);},[viewKey,query,status,sort]);
 useEffect(()=>{
  if(!ctx)return;
  let live=true;const controller=new AbortController();
  setView({loading:true,groups:[],failures:[],error:'',progressError:''});
  loadBookCatalogue({...ctx,signal:controller.signal},{board,classLevel:level,subject}).then(result=>{if(live)setView({...result,loading:false,error:''});}).catch(error=>{if(live)setView({loading:false,groups:[],failures:[],error:error.message,progressError:''});});
  return()=>{live=false;controller.abort();};
 },[ctx?.personId,ctx?.workspaceId,ctx?.locale,board,level,subject,retry]);
 const groups=useMemo(()=>filterCatalogueBooks(view.groups,query,status,sort),[view.groups,query,status,sort]);
 const count=view.groups.reduce((sum,group)=>sum+group.books.length,0);
 function sample(){const value=ctx.role==='professional'?PROFESSIONAL_SAMPLE_SELECTION:SAMPLE_LIBRARY_SELECTION;setParams({catalogueSubject:value.subject,catalogueBoard:value.board,catalogueLevel:value.classLevel});}
 if(scopeError||!ctx)return <div className="v-page" role={scopeError?'alert':'status'}>{scopeError||t('Opening your books…')}</div>;
 return <div className="v-page v-book-catalogue" lang={locale} data-testid="book-catalogue">
  <WorkspaceIntro title={t('Your books')} eyebrow={t(ctx.role==='professional'?'Capability catalog':'Learning catalog')} description={t('Choose a book, then a chapter. Your saved work stays connected.')} instruction icon={BookOpen}/>
  <div className="v-catalogue-context"><p className="v-muted">{[board,level].filter(Boolean).join(' · ')||t('Your current learning context')}</p>{subject&&<button className="v-button" onClick={()=>setParams({})}>{t('My catalog')}</button>}<Link className="v-action-link" to="/dashboard/learn?setup=1">{t('Add a subject or course')}</Link></div>
  {view.loading?<WorkspaceSkeleton label={t('Opening your books…')}/>:<>
   {(view.error||view.failures.length>0)&&<div className="v-notice v-error" role="alert"><p>{view.error||t('Some books could not be loaded. Available books are shown below.')}</p>{view.failures.map(row=><p key={row.subject}>{row.subject}: <span lang="en">{row.message}</span></p>)}<button className="v-button mt-3" onClick={()=>setRetry(value=>value+1)}>{t('Retry books')}</button></div>}
   {view.progressError&&<p className="v-notice" role="status">{t('Saved progress is unavailable. Your records have not been replaced.')} <span lang="en">{view.progressError}</span></p>}
   {count>0&&<form className="v-catalogue-filters" role="search" onSubmit={event=>event.preventDefault()}>
    <label className="v-catalogue-search"><span>{t('Find a book')}</span><span><Search size={18} aria-hidden="true"/><input className="v-field" type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder={t('Title or subject')} data-testid="book-search"/></span></label>
    <label>{t('Progress')}<select aria-label={t('Progress')} className="v-field" value={status} onChange={event=>setStatus(event.target.value)}><option value="all">{t('All books')}</option><option value="started">{t('In progress')}</option><option value="completed">{t('Completed')}</option></select></label>
    <label>{t('Sort books')}<select aria-label={t('Sort books')} className="v-field" value={sort} onChange={event=>setSort(event.target.value)}><option value="catalog">{t('Catalog order')}</option><option value="title">{t('Title A–Z')}</option></select></label>
   </form>}
   {groups.map(group=><section className="v-book-course" key={group.id} aria-labelledby={`course-${group.id}`}>
    <header><h2 id={`course-${group.id}`}>{group.subject}</h2><p className="v-muted">{[group.board,group.classLevel].filter(Boolean).join(' · ')}</p><p className="v-book-source">{t(group.status==='sample'?'Authored sample · Not official curriculum':group.status==='provisional'?'Outline only · Teaching content is not available yet':'Reviewed source')}{group.provenance&&group.status==='official'?` · ${group.provenance.provider} · ${group.provenance.version}`:''}</p></header>
    <div className="v-book-grid">{group.books.map(book=><Link key={book.id} className="v-book-card" data-testid="book-card" to={'/dashboard/learn?'+new URLSearchParams({catalogueSubject:group.subject,catalogueBoard:group.board,catalogueLevel:group.classLevel,book:book.id})}>
     <span className="v-book-cover" aria-hidden="true"><BookOpen size={36} strokeWidth={1.5}/></span><strong lang={group.contentLocale||undefined}>{book.title}</strong><span className="v-muted">{group.subject} · {book.chapterIds.length} {t(book.chapterIds.length===1?'chapter':'chapters')}</span>
     {!view.progressError&&<span className="v-book-progress">{group.status==='provisional'?t('Content pending'):book.progress.completed===book.progress.total&&book.progress.total>0?t('Completed'):book.started?t('In progress'):t('Not started')}{group.status!=='provisional'&&<span> · {book.progress.completed}/{book.progress.total} {t('chapters completed')}</span>}</span>}
     <span className="v-book-open">{t('Open book')}<ArrowRight size={18} aria-hidden="true"/></span>
    </Link>)}</div>
   </section>)}
   {!groups.length&&!view.error&&<WorkspaceEmptyState illustration="study" title={t(count?'No matching books':'Your books will appear here')} description={t(count?'Try another title or clear your filters.':'Books follow your subject and course context. Try the authored sample to explore the flow.')}>
    {count?<button className="v-button primary" onClick={()=>{setQuery('');setStatus('all');}}>{t('Clear filters')}</button>:<button className="v-button primary" onClick={sample}>{t('Try authored books')}</button>}
   </WorkspaceEmptyState>}
   {count>0&&<p className="v-muted" role="status" aria-live="polite">{groups.reduce((sum,group)=>sum+group.books.length,0)} / {count} {t('books shown')}</p>}
  </>}
  <div className="v-catalogue-footer">{count>0&&<button className="v-action-link" onClick={sample}>{t('Try authored books')}</button>}<Link className="v-action-link" to="/dashboard/learn?legacy=1">{t('Previous saved topics')}</Link></div>
 </div>;
}
