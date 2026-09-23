import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { newConversation } from '@/services/workspaceService';
import { sendTeachingTurn } from '@/services/learningPipelineService';
import { emitInteractionEvent } from '@/services/mentorStateService';
import { getVoiceCapabilities, getVoiceMode, resolveAudioEnabled, startListening, stopListening, speak, subscribeVoiceMode } from '@/services/voiceService';

// The AGI's presence is a thin audio-reactive line at the top of the interface —
// no assistant icon, avatar, or activation button. It activates automatically when the
// product opens: listening begins as soon as the browser permits the microphone, and on
// a first visit on the first interaction. While listening the line reacts to the real
// microphone level; while the AGI speaks it carries the reply's cadence; when audio is
// off it stays a quiet static availability indicator that never suggests listening.
const STATUS_TEXT = {
  off: 'Audio interaction is on for this workspace, but the microphone is not active right now.',
  listening: 'Listening.',
  speaking: 'Speaking.',
  denied: 'Microphone access is blocked in the browser. Audio is unavailable until it is allowed.',
  unsupported: 'This browser does not support audio interaction. Text works everywhere.',
};
const SEND_SILENCE_MS = 1500;

export default function AudioPresence() {
  const { ctx, data } = useWorkspace();
  const [mode, setMode] = useState(getVoiceMode());
  const [caption, setCaption] = useState('');
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const conversationRef = useRef(null);
  const busyRef = useRef(false);
  const pendingRef = useRef('');
  const sendTimer = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const frameRef = useRef(0);
  const levelsRef = useRef([]);
  const reducedMotion = useRef(false);
  ctxRef.current = ctx;
  useEffect(() => subscribeVoiceMode(setMode), []);

  useEffect(() => { reducedMotion.current = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false; }, []);

  useEffect(() => () => {
    stopListening();
    if (sendTimer.current) clearTimeout(sendTimer.current);
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioCtxRef.current?.close().catch(() => {});
  }, []);

  async function sendTurn(transcript) {
    const request = ctxRef.current;
    if (!request || busyRef.current) { pendingRef.current = transcript; return; }
    busyRef.current = true;
    try {
      if (!conversationRef.current) conversationRef.current = newConversation(request).id;
      const response = await sendTeachingTurn({ ...request }, conversationRef.current, transcript, 'voice');
      if (response.text) speak(response.text, request.locale);
    } catch { /* spoken turns fail soft: the line stays, the text path remains available */ }
    finally {
      busyRef.current = false;
      if (pendingRef.current) { const next = pendingRef.current; pendingRef.current = ''; sendTurn(next); }
    }
  }

  function queueSend(transcript) {
    setCaption(transcript);
    if (sendTimer.current) clearTimeout(sendTimer.current);
    sendTimer.current = setTimeout(() => { if (transcript.trim().length >= 3) sendTurn(transcript); }, SEND_SILENCE_MS);
  }

  async function attachAnalyser() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      streamRef.current = stream; audioCtxRef.current = audioContext; analyserRef.current = analyser;
    } catch { analyserRef.current = null; }
  }
  function detachAnalyser() {
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current = null; audioCtxRef.current = null; analyserRef.current = null;
    levelsRef.current = [];
  }

  // Activation: automatic — no button. If the microphone is already permitted, listening
  // starts immediately; a first visit starts on the first interaction (browsers require
  // a gesture before they will ask); a blocked microphone stays honestly static.
  useEffect(() => {
    if (!ctx) return;
    const capabilities = getVoiceCapabilities();
    if (!capabilities.recognition) return;
    if (!resolveAudioEnabled(data?.preferences?.voice)) return;
    let cancelled = false;
    const begin = () => {
      if (cancelled || getVoiceMode() === 'listening' || getVoiceMode() === 'speaking') return;
      try {
        startListening({
          lang: ctx.locale,
          onInterim: text => setCaption(text),
          onFinal: queueSend,
        });
        attachAnalyser();
        emitInteractionEvent(ctx, { app: 'ASK', action: 'start', inputType: 'voice', language: ctx.locale, sessionId: conversationRef.current });
      } catch { /* unsupported or blocked: the line stays a quiet availability indicator */ }
    };
    let cleanupGesture = () => {};
    navigator.permissions?.query({ name: 'microphone' }).then(state => {
      if (cancelled) return;
      if (state.state === 'granted') begin();
      else if (state.state === 'prompt') {
        const onGesture = () => { window.removeEventListener('pointerdown', onGesture); window.removeEventListener('keydown', onGesture); cleanupGesture = () => {}; begin(); };
        window.addEventListener('pointerdown', onGesture, { once: true });
        window.addEventListener('keydown', onGesture, { once: true });
        cleanupGesture = () => { window.removeEventListener('pointerdown', onGesture); window.removeEventListener('keydown', onGesture); };
      }
      state.onchange = () => { if (state.state === 'granted') begin(); };
    }).catch(() => { if (!cancelled) begin(); });
    return () => { cancelled = true; cleanupGesture(); stopListening(); detachAnalyser(); };
  }, [ctx?.personId, ctx?.workspaceId, resolveAudioEnabled(data?.preferences?.voice)]);

  // React to session-level audio changes from the Ask quick control.
  useEffect(() => {
    const refresh = () => setMode(getVoiceMode());
    window.addEventListener('visionary:audio-change', refresh);
    return () => window.removeEventListener('visionary:audio-change', refresh);
  }, []);

  // The line itself: real amplitude while listening, cadence while speaking, static otherwise.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    let running = true;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * ratio; canvas.height = canvas.offsetHeight * ratio;
    };
    resize();
    window.addEventListener('resize', resize);
    const draw = time => {
      if (!running) return;
      const width = canvas.width; const height = canvas.height;
      const mid = height / 2;
      context.clearRect(0, 0, width, height);
      const gradient = context.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(66, 133, 244, 0.25)');
      gradient.addColorStop(0.5, 'rgba(66, 133, 244, 0.75)');
      gradient.addColorStop(1, 'rgba(66, 133, 244, 0.25)');
      context.strokeStyle = gradient;
      context.lineWidth = Math.max(1.5, height * 0.28);
      context.lineJoin = 'round'; context.lineCap = 'round';
      if ((mode === 'listening' || mode === 'speaking') && !reducedMotion.current) {
        let level = 0;
        if (mode === 'listening' && analyserRef.current) {
          const data = new Uint8Array(analyserRef.current.fftSize);
          analyserRef.current.getByteTimeDomainData(data);
          let sum = 0;
          for (let index = 0; index < data.length; index++) { const value = (data[index] - 128) / 128; sum += value * value; }
          level = Math.min(1, Math.sqrt(sum / data.length) * 4);
        }
        const levels = levelsRef.current;
        levels.push(mode === 'listening' ? level : 0.35 + 0.25 * Math.abs(Math.sin(time / 260)));
        if (levels.length > 64) levels.shift();
        context.beginPath();
        const points = Math.max(levels.length, 2);
        for (let index = 0; index < levels.length; index++) {
          const x = (index / (points - 1)) * width;
          const y = mid + Math.sin(index * 0.9 + time / 190) * levels[index] * mid * 0.85;
          if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.stroke();
      } else {
        context.beginPath();
        context.moveTo(0, mid); context.lineTo(width, mid);
        context.stroke();
      }
      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => { running = false; cancelAnimationFrame(frameRef.current); window.removeEventListener('resize', resize); };
  }, [mode]);

  if (!ctx || !data) return null;
  if (!getVoiceCapabilities().recognition && !getVoiceCapabilities().synthesis) return null;
  const effective = resolveAudioEnabled(data.preferences.voice);
  const status = !effective
    ? 'Audio interaction is off. The top line is only an availability indicator; the microphone is not active.'
    : STATUS_TEXT[mode];
  return <div className="v-audio-line">
    <canvas ref={canvasRef} className="v-audio-canvas" aria-hidden="true" />
    {caption && mode === 'listening' && <p className="v-audio-caption" aria-hidden="true">{caption}</p>}
    <p role="status" className="sr-only">{status}</p>
  </div>;
}
