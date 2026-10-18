import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowUpRight, BookOpen, Boxes, MessageCircle, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getSavedWorkspaceSearch } from '@/services/workspaceSearchService';
import { matchWorkspaceSearch } from '@/lib/workspaceSearch';
import { workspaceSearchCopy } from '@/lib/workspaceSearchCopy';
import { workspaceText } from '@/lib/workspaceStrings';

const groups = ['activity','project','conversation','topic','pages'];
const icons = {activity:BookOpen,project:Boxes,conversation:MessageCircle,topic:BookOpen,pages:FileText};

export default function WorkspaceSearch({open,onOpenChange,ctx,locale,pages,student,allowed,refresh,trigger}) {
  const [query,setQuery] = useState('');
  const [error,setError] = useState('');
  const input = useRef(null);
  const navigating = useRef(false);
  const navigate = useNavigate();
  const t = workspaceSearchCopy(locale);
  let saved = {items:[],unavailable:[]}, readError = '';
  if(open && ctx) try { saved = getSavedWorkspaceSearch(ctx); } catch(failure) { readError = failure.message; }
  const topics = ctx?.role === 'student' && !student.error ? student.topics.map(topic => ({id:topic.id,kind:'topic',label:topic.name,detail:topic.subject,to:'/dashboard/learn/'+encodeURIComponent(topic.id)})) : [];
  const pageItems = pages.map(page => ({...page,kind:'pages'}));
  const candidates = [...saved.items,...topics,...pageItems].filter(item => allowed(item.to));
  const results = query.trim() ? matchWorkspaceSearch(candidates,query) : matchWorkspaceSearch([...saved.items.slice(0,6),...pageItems.slice(0,8)].filter(item => allowed(item.to)), '');
  function clear() {setQuery('');setError('');input.current?.focus();}
  function retry() {setError('');refresh();if(ctx.role === 'student')student.refresh();}
  function openItem(item) {
    try {
      if(!allowed(item.to,true)) throw Error(t('unavailable'));
      if(['activity','project','conversation'].includes(item.kind) && !getSavedWorkspaceSearch(ctx).items.some(row => row.kind === item.kind && row.id === item.id)) throw Error(t('unavailable'));
      navigating.current=true;setError('');onOpenChange(false);navigate(item.to);
    } catch(failure) {setError(failure.message);refresh();}
  }
  return <Dialog open={open} onOpenChange={value=>{onOpenChange(value);if(!value){setQuery('');setError('');}}}>
    <DialogContent lang={locale} className="v-workspace-search" onOpenAutoFocus={event=>{navigating.current=false;event.preventDefault();input.current?.focus();}} onCloseAutoFocus={event=>{event.preventDefault();if(navigating.current)document.getElementById('main')?.focus({preventScroll:true});else trigger.current?.focus();}}>
      <DialogHeader><DialogTitle>{workspaceText(locale,'searchTitle')}</DialogTitle><DialogDescription>{t('scope')}</DialogDescription></DialogHeader>
      <div className="v-search-field"><Search size={20} aria-hidden="true"/><input ref={input} type="search" value={query} onChange={event=>{setQuery(event.target.value);setError('');}} aria-label={t('input')} placeholder={t('input')} autoComplete="off"/>{query&&<button type="button" aria-label={t('clear')} onClick={clear}><X size={18} aria-hidden="true"/></button>}</div>
      {(readError||saved.unavailable.length>0||ctx?.role==='student'&&student.error)&&<div className="v-notice" role="status"><p lang={readError?'en':locale}>{readError||t(saved.unavailable.length?'partial':'topicsUnavailable')}</p><button className="v-action-link" onClick={retry}>{t('retry')}</button></div>}
      {error&&<p className="v-notice v-error" role="alert">{error}</p>}
      <div className="v-search-results">
        {ctx?.role==='student'&&student.loading&&<p className="v-muted" role="status">{t('loading')}</p>}
        {results.length ? groups.map(kind=>{const rows=results.filter(item=>item.kind===kind),Icon=icons[kind];return rows.length>0&&<section key={kind} aria-label={t(kind)}><h2>{t(kind)}</h2><ul>{rows.map(item=><li key={item.to}><button onClick={()=>openItem(item)} className="v-search-result"><span className="v-search-result-icon" aria-hidden="true"><Icon size={20}/></span><span className="v-search-result-copy"><span lang={item.locale}>{item.label}</span>{item.detail&&<span className="v-muted" lang={item.locale}>{item.detail}</span>}</span><ArrowUpRight size={17} aria-hidden="true"/></button></li>)}</ul></section>;}) : <div className="v-search-empty"><Search size={28} aria-hidden="true"/><h2>{t('empty')}</h2><p className="v-muted">{t('try')}</p><button className="v-action-link" onClick={clear}>{t('clear')}</button></div>}
      </div>
      <footer><span role="status" aria-live="polite" aria-atomic="true">{t('count')}: {results.length}</span><span className="hidden sm:inline">{t('hint')}</span></footer>
    </DialogContent>
  </Dialog>;
}
