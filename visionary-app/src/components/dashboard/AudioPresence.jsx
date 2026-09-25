import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { newConversation } from '@/services/workspaceService';
import { sendTeachingTurn } from '@/services/learningPipelineService';
import { emitInteractionEvent } from '@/services/mentorStateService';
import { getVoiceCapabilities, getVoiceMode, resolveAudioEnabled, startListening, stopListening, speak, subscribeVoiceMode } from '@/services/voiceService';

// The AGI lives inside the workspace search bar as a small orb on the right, mirroring
// the search icon on the left — the same placement Google uses for its AI spark. The
// design is Visionary's own: a deep-blue sphere with swirling blue-family energy and a
// guiding orbit ring around a glowing core. Its listen animation is always running —
// calm when the microphone is not active, bright and fast while listening (swelling
// with the real microphone level), cadence-driven while speaking, dimmed only when
// audio is switched off. It activates automatically when the product opens: listening
// begins as soon as the browser permits the microphone, and on a first visit on the
// first interaction. No assistant icon, avatar, or activation button exists elsewhere.
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
  const levelRef = useRef(0);
  const reducedMotion = useRef(false);
  ctxRef.current = ctx;
  const effective = data ? resolveAudioEnabled(data.preferences?.voice) : false;
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

      // Sphere background — Visionary deep blue.
      const bg = context.createRadialGradient(cx - R * 0.2, cy - R * 0.25, R * 0.1, cx, cy, R);
      bg.addColorStop(0, `rgba(26, 58, 107, ${0.95 * dim})`);
      bg.addColorStop(0.6, `rgba(16, 33, 66, ${0.95 * dim})`);
      bg.addColorStop(1, `rgba(8, 18, 40, ${0.95 * dim})`);
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = bg;
      context.beginPath(); context.arc(cx, cy, R, 0, Math.PI * 2); context.fill();

      // Swirling blue-family energy.
      context.globalCompositeOperation = 'lighter';
      const ribbons = [
        { color: 'rgba(138, 180, 248, 0.7)', speed: 1.0, offset: 0.0, tilt: 0.5 },
        { color: 'rgba(66, 133, 244, 0.65)', speed: -0.8, offset: 2.1, tilt: -0.9 },
        { color: 'rgba(23, 78, 166, 0.6)', speed: 0.65, offset: 4.2, tilt: 2.2 },
      ];
      for (const ribbon of ribbons) {
        const angle = time / 1000 * ribbon.speed * speed + ribbon.offset;
        context.save();
        context.translate(cx, cy);
        context.rotate(angle);
        context.globalAlpha = dim;
        context.fillStyle = ribbon.color;
        context.shadowColor = ribbon.color;
        context.shadowBlur = 4;
        context.beginPath();
        context.ellipse(R * 0.18, 0, R * 0.62, R * 0.2, ribbon.tilt, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.ellipse(-R * 0.2, R * 0.1, R * 0.45, R * 0.16, ribbon.tilt + 1.2, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      // The guiding orbit: a thin light sweeping around the core — the mentor circling
      // the learner. This is Visionary's signature, distinct from any assistant clone.
      context.save();
      context.translate(cx, cy);
      context.rotate(-time / 1400 * speed);
      context.globalAlpha = dim;
      context.strokeStyle = 'rgba(168, 199, 250, 0.85)';
      context.lineWidth = 1;
      context.beginPath();
      context.ellipse(0, 0, R * 0.78, R * 0.34, 0.7, 0, Math.PI * 2);
      context.stroke();
      context.restore();

      // Glowing core; it brightens and swells with the real microphone level.
      const coreR = R * (0.3 + levelRef.current * 0.3);
      const core = context.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      core.addColorStop(0, `rgba(255, 255, 255, ${0.95 * dim})`);
      core.addColorStop(0.5, `rgba(219, 234, 254, ${0.55 * dim})`);
      core.addColorStop(1, 'rgba(219, 234, 254, 0)');
      context.fillStyle = core;
      context.beginPath(); context.arc(cx, cy, coreR, 0, Math.PI * 2); context.fill();
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
  return <>
    <canvas ref={canvasRef} className="v-audio-orb" aria-hidden="true" />
    {caption && mode === 'listening' && <p className="v-audio-caption" aria-hidden="true">{caption}</p>}
    <p role="status" className="sr-only">{status}</p>
  </>;
}
