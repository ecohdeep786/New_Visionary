import { guideCopy } from '@/lib/guideCopy';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowUp, BookOpen, History, Plus, Sparkles, Square, ArrowUpRight, AudioLines, VolumeX } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { newConversation, startJourney, updateConversation, removeConversation, roleActions, roleNames } from '@/services/workspaceService';
import { prepareLearningConversation, getLearningForConversation } from '@/services/learningPipelineService';
import { sendMentorTurn } from '@/services/mentorCompanionService';
import MentorGreeting from '@/components/dashboard/MentorGreeting';
import { subscribeVoiceMode, speak, resolveAudioEnabled, setSessionAudioOverride } from '@/services/voiceService';
import { listJourneys } from '@/services/journeys';
import { openGuideLocation, selectGuideConversation, saveAskContext, suggestedJourneys, defaultAskContext } from '@/services/guideEntryService';
import GuideEntry from '@/components/dashboard/GuideEntry';
import GuideActivity from '@/components/dashboard/GuideActivity';
import ParentReportAsk from './ParentReportAsk';
import ClassworkStudy from './ClassworkStudy';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
const WorkspaceTools = lazy(() => import('./WorkspaceTools'));
const Children = lazy(() => import('./Children'));
const Cohorts = lazy(() => import('./Cohorts'));
const Learners = lazy(() => import('./Learners'));
const TeacherClasses = lazy(() => import('./role/TeacherHome'));
const RoleWorkspace = lazy(() => import('./RoleWorkspace'));
const ArtifactStudio = lazy(() => import('./ArtifactStudio'));
const LearningWorkspace = lazy(() => import('./LearningWorkspace'));
export default function Guide() {
  const [params] = useSearchParams();
  return params.has('assignment') ? <ClassworkStudy assignmentId={params.get('assignment')} mode="ask" /> : params.has('child') ? <ParentReportAsk key={`${params.get('child') || ''}:${params.get('period') || '7'}`} /> : <GuideConversation />;
}
function GuideConversation() {
  const {
    ctx,
    data,
    error: loadError
  } = useWorkspace();
  const locale = data?.preferences.interfaceLocale || 'en';
  const copy = guideCopy(locale);
  const [, setLearningRetry] = useState(0);
  const location = useLocation();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState(() => data?.activeConversationId || null);
  const [input, setInput] = useState(location.state?.initialQuestion || (params.get('topic') ? `Help me understand ${params.get('topic')}.` : ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [pane, setPane] = useState('conversation');
  const [focus, setFocus] = useState(false);
  const abort = useRef(null);
  const field = useRef(null);
  const [renderedScope, setRenderedScope] = useState(ctx ? `${ctx.personId}:${ctx.workspaceId}` : '');
  useEffect(() => () => abort.current?.abort(), []);
  const [dictating, setDictating] = useState(false);
  const ownsListening = useRef(false);
  const inputSnapshot = useRef(input);
  inputSnapshot.current = input;
  const [audioOn, setAudioOn] = useState(() => resolveAudioEnabled(undefined));
  useEffect(() => {
    setAudioOn(resolveAudioEnabled(data?.preferences?.voice));
  }, [data?.preferences?.voice]);
  function toggleSessionAudio() {
    try {
      const next = !audioOn;
      setSessionAudioOverride(next);
      setAudioOn(next);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => subscribeVoiceMode(next => {
    if (next !== 'listening') setDictating(false);
  }), []);
  useEffect(() => () => {
    if (ownsListening.current) stopListening();
  }, []);
  const historyTrigger = useRef(null);
  const historyTitle = useRef(null);
  const deleteTrigger = useRef(null);
  const conversationTab = useRef(null);
  const activityTab = useRef(null);
  function switchTab(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'conversation' : event.key === 'End' ? hasActivity ? 'activity' : 'conversation' : pane === 'conversation' && hasActivity ? 'activity' : 'conversation';
    setPane(next);
    (next === 'activity' ? activityTab : conversationTab).current?.focus();
  }
  const [canvasPath, setCanvasPath] = useState(() => data?.conversations.find(c => c.id === data.activeConversationId)?.canvasPath || '');
  const queryOpened = useRef('');
  useEffect(() => {
    if (!ctx || !data) return;
    const key = ctx.personId + ctx.workspaceId + location.key;
    if (queryOpened.current === key) return;
    queryOpened.current = key;
    try {
      const next = params.get('learning') ? selectGuideConversation(ctx, prepareLearningConversation(ctx, params.get('learning'))) : openGuideLocation(ctx, {
        journeyId: params.get('journey'),
        sessionId: params.get('session'),
        practice: params.get('stage') === 'practicing',
        initialQuestion: location.state?.initialQuestion,
        topic: params.get('topic')
      });
      abort.current?.abort();
      setSelected(next.selected);
      // A project can suggest a doubt without replacing an existing saved draft.
      setInput(next.input || location.state?.initialQuestion || '');
      setCanvasPath(next.canvasPath);
      setPane(next.pane);
      setFocus(false);
      setError('');
      setRenderedScope(`${ctx.personId}:${ctx.workspaceId}`);
    } catch (e) {
      abort.current?.abort();
      setSelected(null);
      setInput('');
      setCanvasPath('');
      setRenderedScope(`${ctx.personId}:${ctx.workspaceId}`);
      setError(e.message);
    }
  }, [ctx?.personId, ctx?.workspaceId, data, location.key]);
  const conversation = data?.conversations.find(c => c.id === selected);
  const session = data?.sessions.find(s => s.id === conversation?.sessionId);
  useEffect(() => {
    if (pane === 'activity' && window.matchMedia('(max-width: 1199px)').matches && document.activeElement?.closest('#guide-conversation-panel')) activityTab.current?.focus();
  }, [pane]);
  function ensureConversation() {
    if (conversation) return conversation;
    const c = newConversation(ctx);
    setSelected(c.id);
    return c;
  }
  async function send(e) {
    e?.preventDefault();
    if (!input.trim() || busy || !ctx) return;
    setError('');
    setBusy(true);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const c = ensureConversation();
      updateConversation(ctx, c.id, {
        draft: input
      });
      const response = await sendMentorTurn({
        ...ctx,
        locale: session?.locale || ctx.locale,
        signal: controller.signal
      }, c.id, input);
      setInput('');
      if (data?.preferences?.voice !== false && resolveAudioEnabled(data?.preferences?.voice) && response.text) speak(response.text, session?.locale || ctx.locale);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function openActivity(journeyId) {
    try {
      const c = ensureConversation();
      startJourney(ctx, c.id, journeyId);
      setCanvasPath('');
      setPane('activity');
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }
  function openCanvas(path) {
    try {
      const c = ensureConversation();
      updateConversation(ctx, c.id, {
        canvasPath: path
      });
      setCanvasPath(path);
      setPane('activity');
      setFocus(false);
    } catch (e) {
      setError(e.message);
    }
  }
  function chooseConversation(c) {
    try {
      const next = selectGuideConversation(ctx, c?.id || null);
      abort.current?.abort();
      setSelected(next.selected);
      setInput(next.input);
      setCanvasPath(next.canvasPath);
      setHistory(false);
      setPane(next.pane);
      setFocus(false);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }
  function askAboutActivity() {
    const text = session.locale === 'hi' ? 'इस गतिविधि को समझने में मेरी मदद करें।' : session.locale === 'bn' ? 'এই কার্যকলাপটি বুঝতে আমাকে সাহায্য করুন।' : `Help me understand ${getJourneyTitle(session.journeyId)}.`;
    setPane('conversation');
    setFocus(false);
    setInput(text);
    try {
      updateConversation(ctx, conversation.id, {
        draft: text
      });
    } catch (e) {
      setError(e.message);
    }
    requestAnimationFrame(() => field.current?.focus());
  }
  if (loadError) return <div role="alert" className="v-page"><h1 className="v-title">{copy("Your workspace needs attention")}</h1><p lang="en">{loadError}</p><button className="v-button" onClick={() => window.location.reload()}>{copy("Retry")}</button></div>;
  if (!ctx || !data) return <div className="v-page" role="status">{copy("Preparing your workspace\u2026")}</div>;
  if (renderedScope !== `${ctx.personId}:${ctx.workspaceId}`) return <div className="v-page" role="status" aria-busy="true">{copy("Opening this workspace\u2026")}</div>;
  const recent = data.conversations[0];
  const suggestions = suggestedJourneys(ctx);
  let learning = null,
    learningFailure = '';
  try {
    learning = selected ? getLearningForConversation(ctx, selected) : null;
  } catch (error) {
    learningFailure = error.message;
  }
  const hasActivity = !learningFailure && Boolean(session || canvasPath || learning);
  const fresh = !conversation?.messages.length;
  const composer = <form onSubmit={send} className="guide-composer"><label className="guide-entry-label" htmlFor="guide-input">{copy("Message Visionary Guide")}</label><textarea id="guide-input" lang={session?.locale || ctx.locale} aria-describedby="guide-input-help" ref={field} disabled={busy} value={input} maxLength={6000} onChange={e => {
      setInput(e.target.value);
      try {
        const c = ensureConversation();
        updateConversation(ctx, c.id, {
          draft: e.target.value
        });
      } catch (error) {
        setError(error.message);
      }
    }} onBlur={() => {
      if (conversation) try {
        updateConversation(ctx, conversation.id, {
          draft: input
        });
      } catch (e) {
        setError(e.message);
      }
    }} placeholder={copy("Ask in your own words\u2026")} /><div className="mt-3 flex items-center justify-between gap-3"><span id="guide-input-help" className="text-xs text-[#5f6368]"><span lang={session?.locale || ctx.locale}>{(session?.locale || ctx.locale) === 'hi' ? 'हिन्दी' : (session?.locale || ctx.locale) === 'bn' ? 'বাংলা' : 'English'}</span>{copy(' · Private to this workspace')}</span>{busy ? <button type="button" className="v-button" onClick={() => abort.current?.abort()}><Square aria-hidden="true" size={16} />{copy("Stop")}</button> : <button className="v-button primary !px-3" disabled={!input.trim() || !!learningFailure} aria-label={copy("Send message")}><ArrowUp aria-hidden="true" size={20} /></button>}</div></form>;
  return <><div lang={locale}>{learningFailure && <div role="alert" className="v-notice v-error"><p>{copy('Linked learning records are unavailable. Your conversation and draft remain saved.')}</p><p lang="en">{learningFailure}</p><button className="v-button mt-3" onClick={() => setLearningRetry(value => value + 1)}>{copy('Retry')}</button></div>}<div className="guide-mobile-tabs" role="tablist" aria-label={copy("Workspace view")} onKeyDown={switchTab}><button ref={conversationTab} id="guide-conversation-tab" aria-controls="guide-conversation-panel" tabIndex={pane === 'conversation' || !hasActivity ? 0 : -1} className="v-button" role="tab" aria-selected={pane === 'conversation' || !hasActivity} onClick={() => setPane('conversation')}>{copy("Conversation")}</button><button ref={activityTab} id="guide-activity-tab" aria-controls="guide-activity-panel" tabIndex={pane === 'activity' && hasActivity ? 0 : -1} className="v-button" role="tab" aria-selected={pane === 'activity' && hasActivity} disabled={!hasActivity} onClick={() => setPane('activity')}>{copy("Activity")}{hasActivity ? copy(" \xB7 Saved") : ''}</button></div><div className={`guide-shell ${hasActivity ? 'has-activity' : ''} ${focus ? 'focus-activity' : ''}`}>
  <section id="guide-conversation-panel" role="tabpanel" aria-label={copy("Guide conversation")} className={`guide-conversation ${pane !== 'conversation' && hasActivity ? 'hidden-pane' : ''}`}>
   <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-xs text-[#5f6368]">{copy(roleNames[ctx.role])} · {copy('Workspace view')}</p><h1 className="flex items-center gap-2 text-lg font-medium"><Sparkles aria-hidden="true" className="text-[#4285F4]" size={20} />Visionary Guide</h1></div><div className="flex gap-2"><button ref={historyTrigger} className="v-button !px-3" aria-label={copy("Conversation history")} onClick={() => setHistory(true)}><History aria-hidden="true" size={18} /></button><button className="v-button !px-3" aria-label={copy("New conversation")} onClick={() => chooseConversation(null)}><Plus aria-hidden="true" size={18} /></button><button type="button" className={`v-button !px-3 ${audioOn ? 'primary' : ''}`} aria-pressed={audioOn} aria-label={audioOn ? copy("Audio interaction for this session: on. Turn off for this session") : copy("Audio interaction for this session: off. Turn on for this session")} title={audioOn ? copy("Audio on for this session") : copy("Audio off for this session")} onClick={toggleSessionAudio}>{audioOn ? <AudioLines aria-hidden="true" size={18} /> : <VolumeX aria-hidden="true" size={18} />}</button></div></header>
   {learning && <Link className="v-button" to={`/dashboard/learn?unit=${encodeURIComponent(learning.id)}`}>{copy('Return to {title} · Your position is saved', {
              title: learning.title
            })}</Link>}
   {fresh && <><h2 className="guide-entry-title">{copy("What would you like help with?")}</h2>{composer}</>}
   <div className="guide-messages" aria-busy={busy}>
    {fresh ? <div className="flex flex-col gap-4 py-2"><MentorGreeting /><GuideEntry compact role={ctx.role} value={conversation?.ask || defaultAskContext} onChange={value => {
                try {
                  saveAskContext(ctx, ensureConversation().id, value);
                  setError('');
                } catch (e) {
                  setError(e.message);
                }
              }} />
     <div><p className="v-muted mb-3">{ctx.role === 'student' ? copy("Or try an authored example") : copy("Or open a relevant task")}</p><div className="flex flex-wrap gap-2">{suggestions.map(j => <button className="v-button" key={j.id} onClick={() => openActivity(j.id)}><BookOpen size={16} /><span lang={ctx.locale}>{j.title}</span></button>)}{ctx.role !== 'student' && roleActions[ctx.role].slice(0, 3 - suggestions.length).map(a => <Link className="v-button" key={a.path} to={a.path}>{copy(a.label)}<ArrowUpRight size={16} /></Link>)}</div></div>
     {!selected && recent && <button className="mt-8 flex items-center gap-3 rounded-xl border border-[#dadce0] p-4 text-left text-sm" onClick={() => chooseConversation(recent)}><History size={18} /><span className="min-w-0"><span className="block text-xs text-[#5f6368]">{copy("Continue where you left off")}</span><span className="mt-1 block truncate">{recent.title}</span></span></button>}
    </div> : conversation.messages.map(message => <div key={message.id} className={`guide-message ${message.role === 'user' ? 'user' : ''}`}>{message.role === 'guide' && <p className="mb-2 flex items-center gap-2 text-xs font-medium text-[#4285F4]"><Sparkles size={14} />Visionary Guide · {message.status === 'not_connected' ? copy("Teaching service not connected") : message.status === 'blocked' ? copy("Safety response") : message.status === 'ready' ? copy("Connected teaching response") : message.status === 'mentor' ? copy("From your saved records") : message.status === 'model' ? copy("Connected mentor response") : copy("Authored demo response")}</p>}{message.blocks.map((block, i) => block.type === 'text' ? <p key={i} lang={block.locale} className="whitespace-pre-wrap">{block.text}</p> : block.type === 'activity' ? <button key={i} lang={block.locale} className="v-button mr-2 mt-3" onClick={() => openActivity(block.journeyId)}><BookOpen size={16} />{block.label}</button> : message.status === 'model' ? <Link lang={block.locale} className="v-button mt-3" key={i} to={block.path}>{block.label}<ArrowUpRight size={16} /></Link> : <button lang={block.locale} className="v-button mt-3" key={i} onClick={() => openCanvas(block.path)}>{block.label}<ArrowUpRight size={16} /></button>)}</div>)}
   </div>
   {!!conversation?.messages.length && <GuideEntry compact role={ctx.role} value={conversation.ask || defaultAskContext} onChange={value => {
            try {
              saveAskContext(ctx, conversation.id, value);
              setError('');
            } catch (e) {
              setError(e.message);
            }
          }} />}
   <p role="status" className={busy ? 'v-muted' : 'sr-only'}>{busy ? copy("Checking the teaching connection\u2026") : conversation?.messages.at(-1)?.role === 'guide' ? copy("Response available above. Review its source label.") : ''}</p>{error && <div role="alert" className="v-notice v-error"><span lang="en">{error}</span><p>{copy("Your saved work is kept. You can retry your question or return Home.")}</p><Link className="underline" to="/dashboard/home">{copy("Return Home")}</Link></div>}
   {!fresh && composer}
   <p className="text-center text-[11px] leading-5 text-[#5f6368]">{copy("Local preview. The teaching service is not connected unless a response is labelled connected. No cloud sync or real student records.")}<Link to="/dashboard/support" className="underline">{copy("About this preview")}</Link></p>
  </section>
  {hasActivity && <aside id="guide-activity-panel" role="tabpanel" aria-label={copy("Activity canvas")} className={`guide-canvas ${pane !== 'activity' ? 'hidden-pane' : ''}`}><h1 className={focus ? 'sr-only' : 'sr-only min-[1200px]:hidden'}>{copy("Visionary Guide activity")}</h1>{canvasPath ? <><div className="flex flex-wrap justify-between gap-2"><button className="v-button" onClick={() => setFocus(v => !v)}>{focus ? copy("Show conversation") : copy("Focus activity")}</button><Link className="v-button" to={canvasPath}>{copy("Open full page")}<ArrowUpRight size={16} /></Link></div><Suspense fallback={<p role="status">{copy("Opening activity\u2026")}</p>}><ContextActivity path={canvasPath} /></Suspense></> : learning ? <Suspense fallback={<p role="status">{copy("Restoring learning activity\u2026")}</p>}><LearningWorkspace key={learning.id} unitIdOverride={learning.id} /></Suspense> : <GuideActivity key={session.id} ctx={ctx} session={session} onFocus={() => setFocus(v => !v)} onAsk={askAboutActivity} />}</aside>}
 </div><Dialog open={history} onOpenChange={setHistory}><DialogContent lang={locale} onCloseAutoFocus={event => {
          event.preventDefault();
          const target = pane === 'activity' && hasActivity && window.matchMedia('(max-width: 1199px)').matches ? activityTab.current : historyTrigger.current;
          target?.focus();
        }} className="max-h-[80dvh] overflow-y-auto"><DialogTitle ref={historyTitle} tabIndex={-1}>{copy("Your conversations")}</DialogTitle><DialogDescription>{copy("Only conversations in this workspace appear here.")}</DialogDescription>{error && <p role="alert" className="v-notice v-error"><span lang="en">{error}</span> {copy("Choose the conversation again to retry.")}</p>}{data.conversations.length ? data.conversations.map(c => <div className="v-list-row" key={c.id}><button className="v-button min-w-0 flex-1 text-left text-sm" onClick={() => chooseConversation(c)}>{c.title}</button><button className="v-button text-xs text-[#b3261e] underline" aria-label={copy("Delete conversation: {title}", {
              title: c.title
            })} onClick={event => {
              deleteTrigger.current = event.currentTarget;
              setDeleting(c.id);
            }}>{copy("Delete")}</button></div>) : <p className="v-muted">{copy("Your first conversation will appear here.")}</p>}</DialogContent></Dialog><Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}><DialogContent lang={locale} onCloseAutoFocus={event => {
          event.preventDefault();
          (deleteTrigger.current?.isConnected ? deleteTrigger.current : historyTitle.current)?.focus();
        }}><DialogTitle>{copy("Delete this conversation?")}</DialogTitle>{error && <p role="alert" className="v-notice v-error" lang="en">{error}</p>}<DialogDescription>{copy("This removes its local messages and linked lesson session. Projects you saved in Build remain available.")}</DialogDescription><button className="v-button" onClick={() => setDeleting(null)}>{copy("Keep conversation")}</button><button className="v-button" onClick={() => {
            try {
              removeConversation(ctx, deleting);
              if (selected === deleting) {
                setSelected(null);
                setCanvasPath('');
                setInput('');
              }
              setDeleting(null);
              setError('');
            } catch (e) {
              setError(e.message);
            }
          }}>{copy("Delete conversation")}</button></DialogContent></Dialog></div></>;
}
function getJourneyTitle(id) {
  return listJourneys().find(j => j.id === id)?.title || 'this idea';
}
function ContextActivity({
  path
}) {
  const area = path.split('/').pop();
  if (area === 'child') return <Children />;
  if (area === 'cohorts') return <Cohorts />;
  if (area === 'learners') return <Learners />;
  if (area === 'classes') return <TeacherClasses />;
  if (area === 'build') return <ArtifactStudio />;
  if (['people', 'analytics', 'learners'].includes(area)) return <RoleWorkspace area={area === 'learners' ? 'insights' : area} />;
  return <WorkspaceTools area={area === 'child' ? 'privacy' : area} />;
}
