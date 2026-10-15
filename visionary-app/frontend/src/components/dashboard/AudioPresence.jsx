import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Mic, MicOff, X } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import GuideMark from './GuideMark';
import { GUIDE_WINGS } from './guideIdentity';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useCanAnimate } from '@/hooks/useMotionPreferences';
import { newConversation, updateConversation, updatePreferences } from '@/services/workspaceService';
import { sendMentorTurn } from '@/services/mentorCompanionService';
import { cancelSpeech, getSessionAudioOverride, getVoiceCapabilities, getVoiceMode, startListening, stopListening, speak, subscribeVoiceMode, setSessionAudioOverride } from '@/services/voiceService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

  // Two color presentations for one shared Guide, not separate models or memories.
// The single shell instance sits by the desktop rail and in the mobile app bar. Tapping
// it announces availability without navigating. Audio behavior remains governed by
// browser support, permission and the workspace preference; animation is not proof
// that a microphone, model or cloud service is active.
const STATUS_TEXT = {
  off: 'Microphone idle. Text is always available.',
  listening: 'Listening.',
  speaking: 'Speaking.',
  denied: 'Microphone access is blocked in the browser. Audio is unavailable until it is allowed.',
  unsupported: 'This browser does not support audio interaction. Text works everywhere.',
};

export default function AudioPresence() {
  const { ctx, data } = useWorkspace();
  const location = useLocation();
  const [mode, setMode] = useState(getVoiceMode());
  const [caption, setCaption] = useState('');
  const [notice, setNotice] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [audioOverride, setAudioOverride] = useState(getSessionAudioOverride());
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const conversationRef = useRef(null);
  const busyRef = useRef(false);
  const voiceRevision = useRef(0);
  const turnAbort = useRef(null);
  const analyserRevision = useRef(0);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const frameRef = useRef(0);
  const levelRef = useRef(0);
  const canAnimate = useCanAnimate();
  ctxRef.current = ctx;
  const effective = data ? (audioOverride ?? data.preferences?.voice !== false) : false;
  const animation = data?.preferences?.agiAnimation === 'girl' ? 'girl' : 'boy';
  const available = Boolean(ctx && data);
  const presentation = animation;
  const presentationRef = useRef('boy');
  presentationRef.current = presentation;
  useEffect(() => subscribeVoiceMode(setMode), []);

  useEffect(() => () => {
    endVoiceSession();
    setSessionAudioOverride(null);
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioCtxRef.current?.close().catch(() => {});
  }, []);

  async function sendTurn(transcript) {
    const request = ctxRef.current;
    if (!request || busyRef.current || !transcript.trim()) return;
    stopListening(); detachAnalyser();
    const revision = voiceRevision.current;
    const controller = new AbortController(); turnAbort.current = controller;
    busyRef.current = true;
    setProcessing(true); setNotice('');
    try {
      if (!conversationRef.current) conversationRef.current = newConversation(request).id;
      const response = await sendMentorTurn({ ...request, signal: controller.signal }, conversationRef.current, transcript, 'voice');
      if (controller.signal.aborted || revision !== voiceRevision.current) return;
      if (response.text) {
        setCaption('');
        setNotice(speak(response.text, request.locale)
          ? 'Reply saved in Ask. Stop the voice session at any time.'
          : 'The reply is saved in Ask. Spoken output is unavailable; you can read it by text.');
      }
    } catch (error) {
      // Recoverable, never silent: the spoken words stay as a draft in the conversation
      // and the failure is announced; the transcript is not lost.
      if (controller.signal.aborted || revision !== voiceRevision.current) return;
      let saved = false;
      try { if (conversationRef.current) { updateConversation(request, conversationRef.current, { draft: transcript }); saved = true; } } catch { /* Current words remain in the review field. */ }
      setNotice(`${error.message || 'The spoken request could not be sent.'} ${saved ? 'Your words are saved in Ask.' : 'Keep or copy your words from the review field.'}`);
    } finally {
      if (revision === voiceRevision.current) { busyRef.current = false; setProcessing(false); turnAbort.current = null; }
    }
  }

  // Opening a control is quiet. Speech is reserved for an explicitly submitted
  // voice question, so browsing the interface never surprises a quiet room.
  function summon() {
    const request = ctxRef.current;
    if (!request) return;
    setNotice('');
  }

  function queueSend(transcript) {
    // One question at a time: once recognized, release capture so a new phrase
    // cannot replace the words the person is reviewing or editing.
    stopListening(); detachAnalyser();
    setCaption(transcript);
  }

  function startVoiceSession(request) {
    try {
      if (!request) return;
      startListening({ lang: request.locale, onInterim: text => setCaption(text), onFinal: queueSend, onError: message => { detachAnalyser(); setNotice(message); } });
      attachAnalyser();
    } catch (error) {
      detachAnalyser();
      setNotice(error.message || 'Microphone unavailable. You can keep using text.');
    }
  }

  function toggleAudio() {
    const next = !effective;
    setSessionAudioOverride(next);
    setAudioOverride(next);
    if (!next) { endVoiceSession(); setProcessing(false); }
  }
  function beginListening() {
    if (!effective) { setSessionAudioOverride(true); setAudioOverride(true); }
    startVoiceSession(ctxRef.current);
  }

  function choosePresentation(next) {
    if (!ctxRef.current || next === presentationRef.current) return;
    try { updatePreferences(ctxRef.current, { agiAnimation: next }); setNotice('Appearance saved.'); }
    catch (error) { setNotice(error.message || 'The visual preference could not be saved.'); }
  }

  async function attachAnalyser() {
    const revision = ++analyserRevision.current;
    let stream;
    try {
      if (!navigator.mediaDevices?.getUserMedia || getVoiceMode() !== 'listening') return;
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (revision !== analyserRevision.current || getVoiceMode() !== 'listening') { stream.getTracks().forEach(track => track.stop()); return; }
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      streamRef.current = stream; audioCtxRef.current = audioContext; analyserRef.current = analyser;
    } catch { stream?.getTracks().forEach(track => track.stop()); if (revision === analyserRevision.current) analyserRef.current = null; }
  }
  function detachAnalyser() {
    analyserRevision.current++;
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current = null; audioCtxRef.current = null; analyserRef.current = null;
    levelRef.current = 0;
  }

  function endVoiceSession() {
    voiceRevision.current++; turnAbort.current?.abort(); turnAbort.current = null;
    busyRef.current = false; stopListening(); cancelSpeech(); detachAnalyser();
  }

  // Audio preference enables replies; microphone capture always needs an explicit start.
  // A route, language or workspace change terminates the current session and late work.
  useEffect(() => {
    endVoiceSession(); setProcessing(false); setCaption(''); setNotice('');
    return endVoiceSession;
  }, [ctx?.personId, ctx?.workspaceId, ctx?.locale, location.key]);
  useEffect(() => { if (!effective) { endVoiceSession(); setProcessing(false); } }, [effective]);
  useEffect(() => { conversationRef.current = null; }, [ctx?.personId, ctx?.workspaceId]);
  useEffect(() => {
    const stopHidden = () => { if (document.hidden) { endVoiceSession(); setProcessing(false); } };
    const stopPage = () => endVoiceSession();
    document.addEventListener('visibilitychange', stopHidden); window.addEventListener('pagehide', stopPage);
    return () => { document.removeEventListener('visibilitychange', stopHidden); window.removeEventListener('pagehide', stopPage); };
  }, []);

  // React to session-level audio changes from the Ask quick control.
  useEffect(() => {
    const refresh = () => { setAudioOverride(getSessionAudioOverride()); setMode(getVoiceMode()); };
    window.addEventListener('visionary:audio-change', refresh);
    return () => window.removeEventListener('visionary:audio-change', refresh);
  }, []);

  // Only a live voice session moves. Idle, hidden and reduced-motion states use
  // one still frame; live preference changes are handled by useCanAnimate.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    let running = true;
    // Reuse meter buffers throughout the session instead of allocating per frame.
    const waveform = new Uint8Array(512);
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * ratio; canvas.height = canvas.offsetHeight * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(draw);
    };
    const draw = time => {
      if (!running) return;
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      context.clearRect(0, 0, W, H);
      const listening = mode === 'listening' || mode === 'speaking';
      let level = 0;
      if (canAnimate && listening) {
        if (mode === 'listening' && analyserRef.current) {
          analyserRef.current.getByteTimeDomainData(waveform);
          let sum = 0;
          for (const sample of waveform) sum += ((sample - 128) / 128) ** 2;
          level = Math.min(1, Math.sqrt(sum / waveform.length) * 4);
        } else if (mode === 'speaking') level = .25 + .15 * Math.sin(time / 260);
      }
      levelRef.current = canAnimate && listening ? Math.max(levelRef.current * .88, level) : 0;
      const scale = Math.min(W, H) / 64 * (.86 + levelRef.current * .12);
      context.save();
      context.translate(W / 2 - 32 * scale, H / 2 - 32 * scale);
      context.scale(scale, scale);
      context.fillStyle = animation === 'girl' ? '#6654bd' : '#3473bd';
      context.globalAlpha = effective ? 1 : .55;
      context.fill(new Path2D(GUIDE_WINGS[0]));
      context.globalAlpha *= .68;
      context.fill(new Path2D(GUIDE_WINGS[1]));
      context.globalAlpha = effective ? 1 : .55;
      context.beginPath(); context.arc(32, 14, 4, 0, Math.PI * 2); context.fill();
      context.restore();
      if (canAnimate && listening) frameRef.current = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => { running = false; cancelAnimationFrame(frameRef.current); window.removeEventListener('resize', resize); };
  }, [mode, effective, animation, available, canAnimate]);

  if (!ctx || !data) return null;
  const capabilities = getVoiceCapabilities();
  const status = !effective
    ? 'Audio interaction is off. The animation is only an availability indicator; the microphone is not active.'
    : capabilities.recognition || capabilities.synthesis ? STATUS_TEXT[mode] : STATUS_TEXT.unsupported;
  const shortStatus = !effective ? 'Audio off' : mode === 'listening' ? 'Listening' : mode === 'speaking' ? 'Speaking' : mode === 'denied' ? 'Microphone blocked' : capabilities.recognition ? 'Ready for voice' : 'Text available';
  return <Popover open={panelOpen} onOpenChange={open => { setPanelOpen(open); if (!open) { endVoiceSession(); setProcessing(false); } }}><PopoverTrigger asChild><button
    type="button"
    className={`v-audio-orb-button ${animation === 'girl' ? 'v-audio-girl' : 'v-audio-boy'}`}
    data-audio-state={!effective ? 'off' : mode}
    onClick={summon}
    aria-label={`Open Visionary voice panel. ${animation === 'girl' ? 'Indigo' : 'Blue'}. ${shortStatus}.`}
    title={`Visionary Guide · ${shortStatus}`}
  >
    <span className="v-audio-glyph"><canvas ref={canvasRef} aria-hidden="true" /></span><span className="v-audio-name" aria-hidden="true">Guide</span>

    {!panelOpen && <span role="status" className="sr-only">{status}</span>}
  </button></PopoverTrigger><PopoverContent side="top" align="start" sideOffset={16} collisionPadding={12} className="workspace-voice-panel" style={{maxHeight:'min(90dvh, var(--radix-popover-content-available-height))',overflowY:'auto'}} aria-labelledby="visionary-voice-title">
    <div className="workspace-voice-panel-head"><div><p className="workspace-voice-eyebrow">Visionary Guide</p><h2 id="visionary-voice-title">Talk with Guide</h2></div><PopoverPrimitive.Close className="workspace-voice-close" aria-label="Close voice panel"><X size={18} aria-hidden="true" /></PopoverPrimitive.Close></div>
    <span className={`workspace-voice-state state-${!effective ? 'off' : mode}`}><span aria-hidden="true" />{shortStatus}</span>

    <div className="guide-voice-emblem"><GuideMark size={76} className={animation === 'girl' ? 'guide-mark-indigo' : ''} /></div><p className="workspace-voice-intro">Speak, review, then send.</p>
    <div className="workspace-voice-actions"><button type="button" className="v-button primary" onClick={mode === 'listening' || mode === 'speaking' || processing ? () => { endVoiceSession(); setProcessing(false); } : beginListening} disabled={!capabilities.recognition}>{mode === 'listening' || mode === 'speaking' || processing ? <MicOff size={17} aria-hidden="true" /> : <Mic size={17} aria-hidden="true" />}{!capabilities.recognition ? 'Voice input unavailable' : mode === 'listening' || mode === 'speaking' || processing ? 'Stop voice session' : mode === 'denied' ? 'Retry microphone' : 'Start listening'}</button><button className="v-button" disabled={!capabilities.recognition && !capabilities.synthesis} onClick={toggleAudio}>{effective ? 'Turn audio off' : 'Turn audio on'}</button><Link className="v-button" to="/dashboard/ask" state={{initialQuestion:caption}} onClick={() => { endVoiceSession(); setSessionAudioOverride(false); setAudioOverride(false); setProcessing(false); setPanelOpen(false); }}><MessageCircle size={17} aria-hidden="true" />Use text instead</Link></div>
    <p className="workspace-voice-now" role="status">{processing ? 'Preparing your reply. Stop the session to cancel.' : mode === 'listening' ? 'Listening. Your question will appear below for review.' : caption ? 'Question ready to review. Edit it or send when ready.' : status}</p>
    {notice && <p className="v-notice" role="status">{notice}</p>}
    {caption && <section className="mt-3"><label className="text-sm">Review spoken question<textarea aria-label="Review spoken question" className="v-field mt-2" value={caption} maxLength={6000} disabled={processing} onChange={event => { stopListening(); detachAnalyser(); setCaption(event.target.value); }} /></label><p className="v-muted mt-2">Review or edit your words before sending. Speech is not sent automatically.</p><button className="v-button mt-3" disabled={processing || !caption.trim()} onClick={() => sendTurn(caption)}>{processing ? 'Preparing reply…' : 'Send spoken question'}</button></section>}
    <details className="guide-voice-details"><summary>Voice & appearance</summary><p className="v-muted">Your browser’s speech service turns microphone audio into text. Nothing is sent to Guide until you choose Send. Both styles use the same Guide.</p><div className="workspace-voice-choices" role="group" aria-label="Visual presence"><button type="button" aria-pressed={animation === 'boy'} onClick={() => choosePresentation('boy')}><GuideMark size={22} />Blue</button><button type="button" aria-pressed={animation === 'girl'} onClick={() => choosePresentation('girl')}><GuideMark size={22} className="guide-mark-indigo" />Indigo</button></div>
    <p className="workspace-voice-footnote">Local preview · Teaching AI is not connected.</p></details>
  </PopoverContent></Popover>;
}
