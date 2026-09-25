import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { newConversation } from '@/services/workspaceService';
import { sendTeachingTurn } from '@/services/learningPipelineService';
import { emitInteractionEvent } from '@/services/mentorStateService';
import { getVoiceCapabilities, getVoiceMode, resolveAudioEnabled, startListening, stopListening, speak, subscribeVoiceMode } from '@/services/voiceService';

// The AGI is a Visionary-blue orb that lives below the workspace navigation, always
// visibly ON: a light disc with flowing blue and violet aurora light, the way Gemini or
// Hey Google make their assistant's on-state unmistakable. Tapping it does NOT navigate
// anywhere — this is not a chatbot: the AGI turns toward the user and announces
// "I am your Intelligence — for you, always available", spoken aloud when audio is on
// and shown as a caption either way. Listening still activates automatically when the
// browser permits the microphone, and the aurora's brightness and motion stay honest
// per state (calm ready, bright listening with real microphone level, cadence speaking,
// dimmed audio-off).
const STATUS_TEXT = {
  off: 'Audio interaction is on for this workspace, but the microphone is not active right now.',
  listening: 'Listening.',
  speaking: 'Speaking.',
  denied: 'Microphone access is blocked in the browser. Audio is unavailable until it is allowed.',
  unsupported: 'This browser does not support audio interaction. Text works everywhere.',
};
const SEND_SILENCE_MS = 1500;
// The summon line, in the user's own language. Spoken when audio is on, always shown.
const GREETINGS = {
 en: 'I am your Intelligence — for you, always available.',
 hi: 'मैं आपकी बुद्धिमत्ता हूँ — हर समय, आपके लिए उपलब्ध।',
 bn: 'আমি আপনার বুদ্ধিমত্তা — সবসময়, আপনার জন্য উপলব্ধ।',
};

export default function AudioPresence() {
  const { ctx, data } = useWorkspace();
  const [mode, setMode] = useState(getVoiceMode());
  const [caption, setCaption] = useState('');
  const [notice, setNotice] = useState('');
  const bornAt = useRef(0);
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
  const levelRef = useRef(0);
  const reducedMotion = useRef(false);
  ctxRef.current = ctx;
  const effective = data ? resolveAudioEnabled(data.preferences?.voice) : false;
  if (ctx && !bornAt.current) bornAt.current = performance.now();
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
    } catch { /* spoken turns fail soft: the orb keeps breathing, the text path remains */ }
    finally {
      busyRef.current = false;
      if (pendingRef.current) { const next = pendingRef.current; pendingRef.current = ''; sendTurn(next); }
    }
  }

  // Tapping the orb does not open any page: the AGI turns toward the user and
  // introduces itself, spoken when audio is on and visible either way.
  function summon() {
    const request = ctxRef.current;
    if (!request) return;
    const line = GREETINGS[request.locale] || GREETINGS.en;
    setNotice(line);
    try { emitInteractionEvent(request, { app: 'ASK', action: 'start', inputType: 'system', language: request.locale }); } catch { /* telemetry is best-effort */ }
    const clear = () => setNotice(current => (current === line ? '' : current));
    if (effective && getVoiceCapabilities().synthesis) speak(line, request.locale);
    // The line stays visible for a fixed moment even when speech ends instantly.
    setTimeout(clear, 4500);
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
    levelRef.current = 0;
  }

  // Activation: automatic — no button. If the microphone is already permitted, listening
  // starts immediately; a first visit starts on the first interaction (browsers require
  // a gesture before they will ask); a blocked microphone keeps the orb in its calm state.
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
      } catch { /* unsupported or blocked: the orb stays calm and honest */ }
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

  // The orb: swirling Siri-style energy around a glowing core. Always animating —
  // brightness and speed carry the state honestly (calm ready, bright listening,
  // cadence speaking, dimmed off). Reduced-motion users get a still orb plus the
  // screen-reader status.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    let running = true;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * ratio; canvas.height = canvas.offsetHeight * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    const draw = time => {
      if (!running) return;
      const W = canvas.offsetWidth; const H = canvas.offsetHeight;
      const cx = W / 2; const cy = H / 2; const R = Math.min(W, H) / 2 - 0.5;
      context.clearRect(0, 0, W, H);
      const listening = (mode === 'listening' || mode === 'speaking') && !reducedMotion.current;
      const ready = !listening && !reducedMotion.current; // available; the orb always breathes
      let level = 0;
      if (listening) {
        if (mode === 'listening' && analyserRef.current) {
          const data = new Uint8Array(analyserRef.current.fftSize);
          analyserRef.current.getByteTimeDomainData(data);
          let sum = 0;
          for (let index = 0; index < data.length; index++) { const value = (data[index] - 128) / 128; sum += value * value; }
          level = Math.min(1, Math.sqrt(sum / data.length) * 4);
        }
        const floor = mode === 'speaking' ? 0.5 : 0.3;
        levelRef.current = Math.max(levelRef.current * 0.88, level, floor);
      } else levelRef.current = ready ? 0.16 : 0.06;
      const dim = effective ? 1 : 0.55;
      const speed = mode === 'speaking' ? 1.6 : listening ? 2 : effective ? 1 : 0.5;

      // The scene: a deep Visionary navy field so the light can glow.
      const age = time - bornAt.current;
      const bloom = Math.max(0, 1 - age / 900);
      context.globalCompositeOperation = 'source-over';
      const field = context.createLinearGradient(0, 0, 0, H);
      field.addColorStop(0, `rgba(8, 30, 74, ${dim})`);
      field.addColorStop(0.6, `rgba(12, 44, 102, ${dim})`);
      field.addColorStop(1, `rgba(18, 60, 132, ${dim})`);
      context.fillStyle = field;
      context.fillRect(0, 0, W, H);

      context.save();
      context.beginPath();
      if (context.roundRect) context.roundRect(0, 0, W, H, Math.min(W, H) * 0.3); else context.rect(0, 0, W, H);
      context.clip();

      // The living light: one organic form with three depths. Every radius and offset
      // breathes on its own slow rhythm — this is what makes it feel alive, not animated.
      context.globalCompositeOperation = 'lighter';
      const flicker = f => Math.sin(time * f + Math.sin(time * f * 0.37) * 1.3);
      const life = levelRef.current;
      const bodyScaleY = 1.62 + life * 0.4 + bloom * 0.18;
      const sway = flicker(0.0009) * R * 0.06;
      const breathe = 1 + flicker(0.0013) * 0.06 + life * 0.28 + bloom * 0.2;

      context.translate(cx, cy);
      context.scale(1, bodyScaleY);
      // Outer aura — the light that reaches into the room.
      let layer = context.createRadialGradient(sway * 0.6, -R * 0.05, 0, sway * 0.6, -R * 0.05, R * (0.72 * breathe));
      layer.addColorStop(0, `rgba(66, 133, 244, ${0.42 * dim})`);
      layer.addColorStop(1, 'rgba(66, 133, 244, 0)');
      context.fillStyle = layer;
      context.beginPath(); context.arc(sway * 0.6, -R * 0.05, R * 0.72 * breathe, 0, Math.PI * 2); context.fill();
      // Body — the flame's blue.
      layer = context.createRadialGradient(sway, 0, 0, sway, 0, R * (0.48 * breathe));
      layer.addColorStop(0, `rgba(108, 158, 255, ${0.8 * dim})`);
      layer.addColorStop(1, 'rgba(23, 78, 166, 0)');
      context.fillStyle = layer;
      context.beginPath(); context.arc(sway, 0, R * 0.48 * breathe, 0, Math.PI * 2); context.fill();
      // Inner light — where blue turns bright.
      layer = context.createRadialGradient(sway * 0.8, -R * 0.04, 0, sway * 0.8, -R * 0.04, R * (0.3 * breathe));
      layer.addColorStop(0, `rgba(206, 226, 255, ${0.9 * dim})`);
      layer.addColorStop(1, 'rgba(108, 158, 255, 0)');
      context.fillStyle = layer;
      context.beginPath(); context.arc(sway * 0.8, -R * 0.04, R * 0.3 * breathe, 0, Math.PI * 2); context.fill();
      context.restore();

      // The flame tip — a soft tongue of light reaching upward with its own flicker.
      const tipX = cx + flicker(0.0016) * R * 0.07;
      const tip = context.createRadialGradient(tipX, cy - R * 0.34, 0, tipX, cy - R * 0.34, R * 0.26);
      tip.addColorStop(0, `rgba(168, 199, 250, ${0.5 * dim})`);
      tip.addColorStop(1, 'rgba(168, 199, 250, 0)');
      context.fillStyle = tip;
      context.save();
      context.translate(tipX, cy - R * 0.34);
      context.scale(0.62, 1.5);
      context.beginPath(); context.arc(0, 0, R * 0.26, 0, Math.PI * 2); context.fill();
      context.restore();

      // The warm heart — the lamp's gold, our signature that this is a mentor's light.
      const heartY = cy - R * 0.02 + flicker(0.0011) * R * 0.03;
      const heart = context.createRadialGradient(cx + flicker(0.0007) * R * 0.04, heartY, 0, cx + flicker(0.0007) * R * 0.04, heartY, R * (0.24 * breathe));
      heart.addColorStop(0, `rgba(255, 255, 255, ${0.98 * dim})`);
      heart.addColorStop(0.45, `rgba(255, 233, 184, ${0.85 * dim})`);
      heart.addColorStop(1, 'rgba(255, 233, 184, 0)');
      context.fillStyle = heart;
      context.beginPath(); context.arc(cx + flicker(0.0007) * R * 0.04, heartY, R * 0.2 * breathe, 0, Math.PI * 2); context.fill();

      // The lamp base: a quiet pool of light under the flame.
      const pool = context.createRadialGradient(cx, cy + R * 0.62, 0, cx, cy + R * 0.62, R * 0.75);
      pool.addColorStop(0, `rgba(138, 180, 248, ${0.28 * dim})`);
      pool.addColorStop(1, 'rgba(138, 180, 248, 0)');
      context.fillStyle = pool;
      context.beginPath(); context.ellipse(cx, cy + R * 0.62, R * 0.75, R * 0.3, 0, 0, Math.PI * 2); context.fill();
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;

            frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => { running = false; cancelAnimationFrame(frameRef.current); window.removeEventListener('resize', resize); };
  }, [mode, effective]);

  if (!ctx || !data) return null;
  if (!getVoiceCapabilities().recognition && !getVoiceCapabilities().synthesis) return null;
  const status = !effective
    ? 'Audio interaction is off. The orb is only an availability indicator; the microphone is not active.'
    : STATUS_TEXT[mode];
  return <button
    type="button"
    className="v-audio-orb-button"
    onClick={summon}
    aria-label="Visionary AGI — always available"
    title="Visionary AGI"
  >
    <canvas ref={canvasRef} aria-hidden="true" />
    {(notice || (caption && mode === 'listening')) && <span className="v-audio-caption" aria-hidden="true">{notice || caption}</span>}
    <span role="status" className="sr-only">{status}</span>
  </button>;
}
