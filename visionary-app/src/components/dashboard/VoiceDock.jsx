import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { newConversation, selectConversation } from '@/services/workspaceService';
import { sendTeachingTurn } from '@/services/learningPipelineService';
import { emitInteractionEvent } from '@/services/mentorStateService';
import { getVoiceCapabilities, getVoiceMode, startListening, stopListening, speak, subscribeVoiceMode } from '@/services/voiceService';

const statusText = {
  off: 'Voice ready. Tap to speak.',
  listening: 'Listening… tap when you finish speaking.',
  speaking: 'Speaking…',
  denied: 'Microphone access is blocked. Allow it in your browser settings, then tap again.',
  unsupported: 'Voice input is not available in this browser. Text and every workspace tool remain available.',
};

// The always-ready mentor dock: voice mode is on by default (founder setting) and the
// microphone starts on the first tap, which browsers require. A spoken turn takes the
// same teaching seam as a typed one; replies are read aloud when synthesis is available.
export default function VoiceDock() {
  const { ctx, data } = useWorkspace();
  const [mode, setMode] = useState(getVoiceMode());
  const [heard, setHeard] = useState('');
  const [interim, setInterim] = useState('');
  const [reply, setReply] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const conversationRef = useRef(null);
  const ctxRef = useRef(null);
  const busyRef = useRef(false);
  ctxRef.current = ctx;
  useEffect(() => subscribeVoiceMode(setMode), []);
  useEffect(() => () => { stopListening(); }, []);
  if (!ctx || !data || data.preferences.voice === false) return null;
  if (!getVoiceCapabilities().recognition && !getVoiceCapabilities().synthesis) return null;
  if (!getVoiceCapabilities().recognition) return null;

  async function sendTurn(transcript) {
    const request = ctxRef.current;
    if (!request || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setInterim('');
    try {
      if (!conversationRef.current) conversationRef.current = newConversation(request).id;
      const response = await sendTeachingTurn({ ...request }, conversationRef.current, transcript, 'voice');
      setReply({ text: response.text, status: response.status });
      speak(response.text, request.locale);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally { busyRef.current = false; setBusy(false); }
  }

  function toggle() {
    setError('');
    if (mode === 'listening') { stopListening(); return; }
    setHeard(''); setInterim(''); setReply(null);
    try {
      startListening({
        lang: ctx.locale,
        onFinal: transcript => { setHeard(transcript); sendTurn(transcript); },
        onInterim: setInterim,
      });
      emitInteractionEvent(ctx, { app: 'ASK', action: 'start', inputType: 'voice', language: ctx.locale, sessionId: conversationRef.current });
    } catch (e) { setError(e.message); }
  }

  const label = mode === 'listening' ? 'Stop listening' : mode === 'speaking' ? 'Speaking — tap to interrupt' : 'Start voice conversation';
  const cardVisible = Boolean(heard || interim || reply || error || mode === 'denied' || mode === 'unsupported');
  return <div className="v-voice-dock" role="region" aria-label="Voice mentor">
    {(heard || interim || reply || error || mode === 'denied' || mode === 'unsupported') && <div className="v-voice-card">
      <p className="v-voice-card-title"><Mic size={14} aria-hidden="true" /> Voice mentor</p>
      {heard && <p className="v-voice-heard">“{heard}”</p>}
      {interim && !busy && <p className="v-voice-interim" aria-hidden="true">{interim}…</p>}
      {reply && <p className="v-voice-reply" lang={ctx.locale}>{reply.text}</p>}
      {reply && <p className="v-voice-status">{reply.status === 'not_connected' ? 'Teaching service not connected — this reply is a prepared placeholder.' : reply.status === 'blocked' ? 'Safety response.' : 'Connected teaching response.'}</p>}
      {error && <p role="alert" className="v-voice-status">{error}</p>}
      {mode === 'denied' && <p className="v-voice-status">{statusText.denied}</p>}
      {mode === 'unsupported' && <p className="v-voice-status">{statusText.unsupported}</p>}
      {conversationRef.current && <div className="v-voice-card-actions">
        <button className="v-button" onClick={() => { selectConversation(ctx, conversationRef.current); }}>Open this thread in Ask</button>
        <Link className="v-button" to="/dashboard/ask" onClick={() => selectConversation(ctx, conversationRef.current)}>Open Ask</Link>
      </div>}
      <p className="v-voice-honest">Voice preview: your browser transcribes speech and reads replies aloud. Teaching answers are not connected yet.</p>
    </div>}
    <div className="flex items-center gap-2">
      {!cardVisible && <p role="status" className="v-voice-state">{busy ? 'Thinking…' : mode === 'speaking' ? statusText.speaking : statusText[mode]}</p>}
      <button type="button" className={`v-voice-orb ${mode}`} aria-pressed={mode === 'listening'} aria-label={label} onClick={toggle} disabled={busy}>
        {mode === 'denied' || mode === 'unsupported' ? <MicOff size={22} aria-hidden="true" /> : mode === 'speaking' ? <Volume2 size={22} aria-hidden="true" /> : <Mic size={22} aria-hidden="true" />}
      </button>
    </div>
  </div>;
}
