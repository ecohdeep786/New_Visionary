import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { newConversation } from '@/services/workspaceService';
import { sendTeachingTurn } from '@/services/learningPipelineService';
import { emitInteractionEvent } from '@/services/mentorStateService';
import { getVoiceCapabilities, getVoiceMode, resolveAudioEnabled, startListening, stopListening, speak, subscribeVoiceMode } from '@/services/voiceService';

// The AGI's presence below the workspace navigation, always visibly ON, in one of two
// named designs the user picks in Personalization: "Vision Boy" — the soft sky sphere
// with drifting clouds; "Vision Girl" — four glowing white bars on a luminous blue
// field. Tapping it does NOT navigate anywhere — this is not a chatbot: the AGI turns
// toward the user and announces "I am your Intelligence — for you, always available",
// spoken aloud when audio is on and shown as a caption either way. Listening still
// activates automatically when the browser permits the microphone, and both designs
// stay honest per state (calm ready, bright listening, cadence speaking, dimmed off).
const STATUS_TEXT = {
  off: 'Audio interaction is on for this workspace, but the microphone is not active right now.',
  listening: 'Listening.',
  speaking: 'Speaking.',
  denied: 'Microphone access is blocked in the browser. Audio is unavailable until it is allowed.',
  unsupported: 'This browser does not support audio interaction. Text works everywhere.',
};
const SEND_SILENCE_MS = 1500;
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
  const barsRef = useRef([0.3, 0.3, 0.3, 0.3]);
  const reducedMotion = useRef(false);
  const bornAt = useRef(0);
  ctxRef.current = ctx;
  if (ctx && !bornAt.current) bornAt.current = performance.now();
  const effective = data ? resolveAudioEnabled(data.preferences?.voice) : false;
  const animation = data?.preferences?.agiAnimation === 'girl' ? 'girl' : 'boy';
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
    } catch { /* spoken turns fail soft: the animation keeps breathing, the text path remains */ }
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
    levelRef.current = 0; barsRef.current = [0.3, 0.3, 0.3, 0.3];
  }

  // Activation: automatic — no button. If the microphone is already permitted, listening
  // starts immediately; a first visit starts on the first interaction (browsers require
  // a gesture before they will ask); a blocked microphone keeps the animation calm and honest.
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
      } catch { /* unsupported or blocked: the animation stays calm and honest */ }
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

  // The chosen animation, always running. Brightness and motion carry the honest state:
  // calm ready, bright listening (swelling with the real microphone level), cadence
  // speaking, dimmed audio-off. Reduced-motion users get a still frame plus the status.
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
      const cx = W / 2; const cy = H / 2; const R = Math.min(W, H) / 2 - 1;
      context.clearRect(0, 0, W, H);
      const listening = mode === 'listening' || mode === 'speaking';
      const ready = !listening;
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
      const age = time - bornAt.current;
      const bloom = Math.max(0, 1 - age / 900);

      const motion = reducedMotion.current ? 0.25 : 1;
      if (animation === 'girl') {
        // "Vision Girl" - four glowing blue bars rippling like a voice equalizer, no
        // panel behind them: the bars and their glow are the whole element.
        if (listening && analyserRef.current) {
          const freq = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(freq);
          const groups = [[2, 10], [10, 26], [26, 58], [58, 120]];
          for (let bar = 0; bar < 4; bar++) {
            const [from, to] = groups[bar];
            let sum = 0;
            for (let index = from; index < to; index++) sum += freq[index];
            const value = Math.min(1, sum / (to - from) / 200);
            barsRef.current[bar] = Math.max(barsRef.current[bar] * 0.8, value, 0.2);
          }
        } else {
          for (let bar = 0; bar < 4; bar++) {
            const ripple = ready ? 0.18 * Math.sin(time / 480 * motion + bar * 1.05) : 0.05;
            barsRef.current[bar] = Math.max(barsRef.current[bar] * 0.85, 0.34 + ripple, 0.2);
          }
        }
        // The resting composition from the reference: bar three is the tallest.
        const rest = [0.52, 0.66, 0.92, 0.68];
        const barWidths = [0.155, 0.17, 0.185, 0.165];
        const gaps = [0.035, 0.03, 0.035];
        let totalWidth = 0;
        for (let bar = 0; bar < 4; bar++) totalWidth += W * barWidths[bar];
        totalWidth += (W * gaps[0] + W * gaps[1] + W * gaps[2]);
        let cursor = cx - totalWidth / 2;
        for (let bar = 0; bar < 4; bar++) {
          const width = W * barWidths[bar];
          const height = H * 0.72 * rest[bar] * (0.78 + barsRef.current[bar] * 0.55);
          const x = cursor; const y = cy - height / 2;
          const barGradient = context.createLinearGradient(0, y, 0, y + height);
          barGradient.addColorStop(0, `rgba(138, 180, 248, ${0.98 * dim})`);
          barGradient.addColorStop(1, `rgba(59, 120, 246, ${0.92 * dim})`);
          context.fillStyle = barGradient;
          context.shadowColor = 'rgba(66, 133, 244, 0.7)';
          context.shadowBlur = 8;
          context.beginPath();
          if (context.roundRect) context.roundRect(x, y, width, height, width / 2); else context.rect(x, y, width, height);
          context.fill();
          context.shadowBlur = 0;
          cursor += width + W * (gaps[bar] ?? gaps[2]);
        }
      } else {
        // "Vision Boy" - the soft sky sphere exactly like the reference: bright cloud
        // light across the top half, deep blue toward the bottom, always drifting.
        const sky = context.createLinearGradient(0, cy - R, 0, cy + R);
        sky.addColorStop(0, `rgba(233, 244, 255, ${dim})`);
        sky.addColorStop(0.45, `rgba(147, 193, 252, ${dim})`);
        sky.addColorStop(0.78, `rgba(66, 133, 244, ${dim})`);
        sky.addColorStop(1, `rgba(37, 99, 235, ${dim})`);
        context.fillStyle = sky;
        context.beginPath(); context.arc(cx, cy, R, 0, Math.PI * 2); context.fill();
        context.save();
        context.beginPath(); context.arc(cx, cy, R - 0.5, 0, Math.PI * 2); context.clip();
        // Cloud light: a wide bright sky band across the top plus luminous masses
        // traveling across the upper half, wrapping around.
        context.globalCompositeOperation = 'lighter';
        const topBand = context.createLinearGradient(0, cy - R, 0, cy - R * 0.1);
        topBand.addColorStop(0, `rgba(255, 255, 255, ${(0.5 + levelRef.current * 0.2) * dim})`);
        topBand.addColorStop(1, 'rgba(255, 255, 255, 0)');
        context.fillStyle = topBand;
        context.fillRect(0, cy - R, W, R * 0.9);
        for (let cloud = 0; cloud < 4; cloud++) {
          const travel = ((time * 0.000018 * (60 + cloud * 24) * motion + cloud * 0.37) % 1.3) - 0.15;
          const cloudX = -R * 0.2 + travel * (W + R * 0.4);
          const cloudY = cy - R * (0.42 - cloud * 0.16) + Math.sin(time / 1900 + cloud * 1.7) * R * 0.07 * motion;
          const cloudR = R * (0.46 - cloud * 0.07) * (1 + levelRef.current * 0.3 + bloom * 0.15);
          const cloudGlow = context.createRadialGradient(cloudX, cloudY, 0, cloudX, cloudY, cloudR);
          cloudGlow.addColorStop(0, `rgba(255, 255, 255, ${(0.5 - cloud * 0.12) * dim})`);
          cloudGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
          context.fillStyle = cloudGlow;
          context.beginPath(); context.arc(cloudX, cloudY, cloudR, 0, Math.PI * 2); context.fill();
        }
        // The listening glow at the heart of the sphere.
        const heart = context.createRadialGradient(cx, cy + R * 0.05, 0, cx, cy + R * 0.05, R * (0.34 + levelRef.current * 0.5 + bloom * 0.2));
        heart.addColorStop(0, `rgba(255, 255, 255, ${(0.45 + levelRef.current * 0.5) * dim})`);
        heart.addColorStop(1, 'rgba(147, 197, 253, 0)');
        context.fillStyle = heart;
        context.beginPath(); context.arc(cx, cy + R * 0.05, R * (0.34 + levelRef.current * 0.5 + bloom * 0.2), 0, Math.PI * 2); context.fill();
        context.globalCompositeOperation = 'source-over';
        context.restore();
      }

      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => { running = false; cancelAnimationFrame(frameRef.current); window.removeEventListener('resize', resize); };
  }, [mode, effective, animation]);

  if (!ctx || !data) return null;
  if (!getVoiceCapabilities().recognition && !getVoiceCapabilities().synthesis) return null;
  const status = !effective
    ? 'Audio interaction is off. The animation is only an availability indicator; the microphone is not active.'
    : STATUS_TEXT[mode];
  return <button
    type="button"
    className={`v-audio-orb-button ${animation === 'girl' ? 'v-audio-girl' : 'v-audio-boy'}`}
    onClick={summon}
    aria-label="Visionary AGI — always available"
    title="Visionary AGI"
  >
    <canvas ref={canvasRef} aria-hidden="true" />
    {(notice || (caption && mode === 'listening')) && <span className="v-audio-caption" aria-hidden="true">{notice || caption}</span>}
    <span role="status" className="sr-only">{status}</span>
  </button>;
}
