import type { Locale } from '../domain/workspace.ts';

// Voice seam for the Daily Mentor Engine: browser speech recognition in, browser speech
// synthesis out. No model lives here — a spoken turn takes the exact same teaching-seam
// path as a typed one, so nothing claims live intelligence that is not connected. The
// runtime is injectable so tests can drive recognition and synthesis deterministically.
export interface SpeechVoiceLike { lang: string; name: string }
export interface SpeechUtteranceLike { lang: string; text: string; onend: (() => void) | null; onerror: (() => void) | null; voice?: SpeechVoiceLike }
export interface SpeechSynthesisLike { speak(utterance: SpeechUtteranceLike): void; cancel(): void; getVoices(): SpeechVoiceLike[] }
export interface SpeechRecognitionLike {
 continuous: boolean; interimResults: boolean; lang: string; started: boolean;
 start(): void; stop(): void; abort(): void;
 onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
 onerror: ((event: { error: string }) => void) | null;
 onend: (() => void) | null;
}
interface SpeechRuntime { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike; speechSynthesis?: SpeechSynthesisLike; SpeechSynthesisUtterance?: new (text: string) => SpeechUtteranceLike }

let runtime: SpeechRuntime | null = null;
/** Tests inject a deterministic runtime; the app uses the browser's own speech engine. */
export function configureSpeechRuntime(next: SpeechRuntime | null) { runtime = next; }
function speech(): SpeechRuntime {
 if (runtime) return runtime;
 if (typeof window === 'undefined') return {};
 return window as unknown as SpeechRuntime;
}
export interface VoiceCapabilities { recognition: boolean; synthesis: boolean }
export function getVoiceCapabilities(): VoiceCapabilities {
 const source = speech();
 return { recognition: Boolean(source.SpeechRecognition || source.webkitSpeechRecognition), synthesis: Boolean(source.speechSynthesis) };
}
function speechLocale(locale: Locale | undefined) { return locale === 'hi' ? 'hi-IN' : locale === 'bn' ? 'bn-IN' : 'en-IN'; }

export type VoiceMode = 'off' | 'listening' | 'speaking' | 'denied' | 'unsupported';
let mode: VoiceMode = 'off';
const listeners = new Set<(next: VoiceMode) => void>();
function setMode(next: VoiceMode) { if (mode !== next) { mode = next; listeners.forEach(fn => fn(next)); } }
export function getVoiceMode() { return mode; }
export function subscribeVoiceMode(fn: (next: VoiceMode) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

let recognition: SpeechRecognitionLike | null = null;
let intent = false; // the user asked for continuous listening
let suspended = false; // recognition is paused because the mentor is speaking
let denied = false; // sticky permission refusal; survives the onend that browsers fire after it
let active: { lang: string; onFinal: (transcript: string) => void; onInterim: (text: string) => void } | null = null;

function openRecognition(lang: string) {
 const source = speech();
 const Ctor = source.SpeechRecognition || source.webkitSpeechRecognition;
 if (!Ctor) { setMode('unsupported'); return null; }
 const item = new Ctor();
 item.continuous = true; item.interimResults = true; item.lang = lang;
 item.onresult = event => {
  let interim = ''; let final = '';
  for (let index = 0; index < event.results.length; index++) {
   const result = event.results[index];
   const text = result[0]?.transcript || '';
   if (result.isFinal) final += text; else interim += text;
  }
  if (final.trim()) active?.onFinal(final.trim().slice(0, 6000)); else if (interim.trim()) active?.onInterim(interim.trim().slice(0, 6000));
 };
 item.onerror = event => {
  if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
   // Release the microphone immediately; the sticky denied flag survives the onend that follows.
   denied = true; intent = false;
   try { recognition?.abort(); } catch { /* aborting an unset recognition is harmless */ }
   setMode('denied');
  }
  // 'no-speech' and 'aborted' are ordinary silences; onend decides what happens next.
 };
 item.onend = () => {
  if (suspended || denied) return;
  if (!intent) { setMode('off'); return; }
  try { recognition?.start(); } catch { /* already started; the next onend retries */ }
 };
 return item;
}

export interface ListenOptions { lang?: Locale; onFinal?: (transcript: string) => void; onInterim?: (text: string) => void }
/** One owner at a time: a new listener replaces the previous session. A retry after a
 * permission grant must always be possible; a still-denied mic re-denies via onerror. */
export function startListening(options: ListenOptions = {}) {
 const capabilities = getVoiceCapabilities();
 if (!capabilities.recognition) { setMode('unsupported'); throw new Error('This browser does not support voice input. You can keep using text.'); }
 denied = false;
 const lang = speechLocale(options.lang);
 active = { lang, onFinal: options.onFinal || (() => {}), onInterim: options.onInterim || (() => {}) };
 cancelSpeech();
 recognition?.abort();
 intent = true;
 recognition = openRecognition(lang) ?? null;
 if (!recognition) throw new Error('This browser does not support voice input. You can keep using text.');
 try { recognition.start(); } catch { /* a previous start is still settling; onend restarts */ }
 setMode('listening');
}
export function stopListening() {
 intent = false; active = null;
 try { recognition?.stop(); } catch { /* stopping an unset recognition is harmless */ }
 if (mode !== 'speaking') setMode('off');
}
const VOICE_PRESENTATION_HINTS = {
  girl: /female|woman|zira|heera|kalpana|swara|veena|aditi|neerja|sarika|sweta/i,
  boy: /\bmale\b|ravi|madhur|prabhat|hemant|daniel|david|guy|mark|james/i,
} as const;
export type VoicePresentation = keyof typeof VOICE_PRESENTATION_HINTS;
function pickVoice(voices: SpeechVoiceLike[], utteranceLang: string, presentation?: VoicePresentation) {
  const langPool = voices.filter(v => v.lang.toLowerCase().startsWith(utteranceLang.slice(0, 2).toLowerCase()));
  const exact = langPool.find(v => v.lang.toLowerCase() === utteranceLang.toLowerCase()) || langPool[0];
  if (presentation) {
    const hints = VOICE_PRESENTATION_HINTS[presentation];
    const other = VOICE_PRESENTATION_HINTS[presentation === 'girl' ? 'boy' : 'girl'];
    return langPool.find(v => hints.test(v.name)) || langPool.find(v => !other.test(v.name)) || exact || undefined;
  }
  return exact || undefined;
}

/** Half-duplex: the microphone pauses while the mentor speaks, then resumes if still wanted. */
export function speak(text: string, locale: Locale | undefined, onEnd?: () => void, presentation?: VoicePresentation): boolean {
 const synthesis = speech().speechSynthesis;
 if (!synthesis || !text.trim()) { onEnd?.(); return false; }
 synthesis.cancel();
 const wasListening = intent;
 if (recognition) { suspended = true; try { recognition.stop(); } catch { /* already stopped */ } }
 const utterance: SpeechUtteranceLike = (() => {
  // Browsers reject plain objects here; construct the real utterance when it exists.
  const Ctor = speech().SpeechSynthesisUtterance;
  return Ctor ? new Ctor(text) : { text, lang: '', onend: null, onerror: null };
 })();
 utterance.lang = speechLocale(locale);
 const finish = () => {
  suspended = false;
  if (intent && wasListening) { try { recognition?.start(); } catch { /* onend retries */ } setMode('listening'); }
  else if (!intent) setMode('off');
  onEnd?.();
 };
 utterance.onend = finish; utterance.onerror = finish;
 const voice = pickVoice(synthesis.getVoices(), utterance.lang, presentation);
 if (voice) utterance.voice = voice;
 setMode('speaking');
 synthesis.speak(utterance);
 return true;
}
export function cancelSpeech() { speech().speechSynthesis?.cancel(); if (mode === 'speaking') setMode(intent ? 'listening' : 'off'); }

// Session audio override: null follows the saved Audio Interaction preference (Settings);
// true/false forces audio for the current session only (the quick Ask control) and
// resets when the product reloads.
let sessionAudioOverride: boolean | null = null;
export function setSessionAudioOverride(next: boolean | null) {
 sessionAudioOverride = next;
 if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('visionary:audio-change'));
}
export function getSessionAudioOverride() { return sessionAudioOverride; }
export function resolveAudioEnabled(savedPreference: unknown) {
 if (sessionAudioOverride !== null) return sessionAudioOverride;
 return savedPreference !== false; // workspaces saved before the audio seam default to on
}
