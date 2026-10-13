import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import * as pipeline from '../src/services/learningPipelineService.ts';
import * as mentor from '../src/services/mentorStateService.ts';
import { configureSpeechRuntime, startListening, stopListening, speak, cancelSpeech, getVoiceMode, getVoiceCapabilities, resolveAudioEnabled, setSessionAudioOverride, getSessionAudioOverride } from '../src/services/voiceService.ts';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const ctx = (person = 'adult', role = 'student') => ({ personId: `demo-${person}`, workspaceId: `demo-${person}:${role}`, role, locale: 'en' });

class MockRecognition {
 constructor() { MockRecognition.created.push(this); this.continuous = false; this.interimResults = false; this.lang = ''; this.started = false; this.onresult = null; this.onerror = null; this.onend = null; }
 start() { this.started = true; }
 stop() { this.started = false; this.onend?.(); }
 abort() { this.started = false; }
 say(text, isFinal = true) { this.onresult?.({ results: [{ 0: { transcript: text }, isFinal }] }); }
}
MockRecognition.created = [];
class MockSynthesis {
 constructor() { this.utterances = []; this.voices = [{ lang: 'hi-IN', name: 'Hindi voice' }, { lang: 'en-IN', name: 'English voice' }]; }
 speak(utterance) { this.utterances.push(utterance); }
 cancel() {}
 getVoices() { return this.voices; }
 finish() { this.utterances.at(-1)?.onend?.(); }
}

beforeEach(() => {
 memory.clear();
 configureSpeechRuntime(null);
 stopListening(); cancelSpeech();
 MockRecognition.created = [];
 workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-23T12:00:00Z') });
 workspace.seedDemo('adult');
});

test('browsers without speech support refuse honestly and every text path stays usable', async () => {
 configureSpeechRuntime({});
 assert.deepEqual(getVoiceCapabilities(), { recognition: false, synthesis: false });
 assert.throws(() => startListening(), /does not support voice input/);
 assert.equal(getVoiceMode(), 'unsupported');
 const request = ctx();
 const conversationId = workspace.newConversation(request).id;
 const response = await pipeline.sendTeachingTurn(request, conversationId, 'Still here by text');
 assert.equal(response.status, 'not_connected');
 assert.equal(getVoiceMode(), 'unsupported');
});

test('a spoken turn follows the same teaching seam with voice input events and no transcript in events', async () => {
 const synthesis = new MockSynthesis();
 configureSpeechRuntime({ SpeechRecognition: MockRecognition, speechSynthesis: synthesis });
 const request = ctx();
 let finalTranscript = '';
 startListening({ lang: 'en', onFinal: transcript => { finalTranscript = transcript; } });
 const recognition = MockRecognition.created.at(-1);
 assert.equal(getVoiceMode(), 'listening');
 assert.equal(recognition.continuous, true);
 recognition.say('Explain fractions step by step');
 recognition.say('step by step', false);
 assert.equal(finalTranscript, 'Explain fractions step by step');
 const conversationId = workspace.newConversation(request).id;
 const response = await pipeline.sendTeachingTurn(request, conversationId, 'Explain fractions step by step', 'voice');
 assert.equal(response.status, 'not_connected');
 const events = mentor.getInteractionEvents(request).filter(event => event.app === 'ASK');
 assert.equal(events.filter(event => event.input_type === 'voice').length >= 2, true);
 assert.equal(JSON.stringify(events).includes('Explain fractions'), false);
 assert.equal(workspace.snapshot(request).conversations.find(c => c.id === conversationId).messages.at(-1).role, 'guide');
});

test('the mentor speaks replies aloud, pauses the microphone, and resumes listening', () => {
 const synthesis = new MockSynthesis();
 configureSpeechRuntime({ SpeechRecognition: MockRecognition, speechSynthesis: synthesis });
 startListening({ lang: 'hi' });
 const recognition = MockRecognition.created.at(-1);
 assert.equal(recognition.lang, 'hi-IN');
 const done = [];
 const spoken = speak('नमस्ते', 'hi', () => done.push(true));
 assert.equal(spoken, true);
 assert.equal(getVoiceMode(), 'speaking');
 assert.equal(synthesis.utterances[0].lang, 'hi-IN');
 assert.equal(synthesis.utterances[0].voice.name, 'Hindi voice');
 assert.equal(recognition.started, false);
 synthesis.finish();
 assert.equal(getVoiceMode(), 'listening');
 assert.equal(recognition.started, true);
 assert.deepEqual(done, [true]);
 stopListening();
 assert.equal(getVoiceMode(), 'off');
});

test('speaking constructs a real utterance through the browser constructor', () => {
 class MockUtterance {
  constructor(text) { this.text = text; MockUtterance.created.push(this); }
 }
 MockUtterance.created = [];
 const synthesis = new MockSynthesis();
 configureSpeechRuntime({ SpeechSynthesisUtterance: MockUtterance, speechSynthesis: synthesis });
 assert.equal(speak('Hello there', 'en'), true);
 assert.equal(synthesis.utterances[0] instanceof MockUtterance, true);
 assert.equal(synthesis.utterances[0].lang, 'en-IN');
 assert.equal(typeof synthesis.utterances[0].onend, 'function');
});

test('denied microphone access keeps an honest state, never restarts, and can be retried after permission', () => {
 const synthesis = new MockSynthesis();
 configureSpeechRuntime({ SpeechRecognition: MockRecognition, speechSynthesis: synthesis });
 startListening({});
 const recognition = MockRecognition.created.at(-1);
 recognition.onerror?.({ error: 'not-allowed' });
 assert.equal(getVoiceMode(), 'denied');
 recognition.onend?.();
 assert.equal(getVoiceMode(), 'denied');
 assert.equal(recognition.started, false);
 // After the user grants permission, the next attempt works with a fresh recognition;
 // a still-denied microphone would re-deny through onerror instead of blocking.
 startListening({});
 assert.equal(getVoiceMode(), 'listening');
 assert.equal(MockRecognition.created.length, 2);
});

test('voice preference defaults on, is user-controlled, and legacy workspaces normalize to on', () => {
 const request = ctx();
 assert.equal(workspace.snapshot(request).preferences.voice, true);
 workspace.updatePreferences(request, { voice: false });
 assert.equal(workspace.snapshot(request).preferences.voice, false);
 const db = JSON.parse(memory.get('visionary_workspace_v2'));
 delete db.data[request.workspaceId].preferences.voice;
 memory.set('visionary_workspace_v2', JSON.stringify(db));
 assert.equal(workspace.snapshot(request).preferences.voice, true);
});

test('the Ask session control overrides the saved audio setting for the current session only', () => {
 assert.equal(getSessionAudioOverride(), null);
 // No override: audio follows the saved preference, and legacy "on" is the default.
 assert.equal(resolveAudioEnabled(true), true);
 assert.equal(resolveAudioEnabled(undefined), true);
 assert.equal(resolveAudioEnabled(false), false);
 // Session off wins even when the preference is on.
 setSessionAudioOverride(false);
 assert.equal(resolveAudioEnabled(true), false);
 // Session on wins even when the preference is off.
 setSessionAudioOverride(true);
 assert.equal(resolveAudioEnabled(false), true);
 // Clearing the override returns control to the saved preference.
 setSessionAudioOverride(null);
 assert.equal(getSessionAudioOverride(), null);
 assert.equal(resolveAudioEnabled(false), false);
});

test('a crisis spoken aloud gets the same safety hard-stop as typed text', async () => {
 const recognition = new MockRecognition(); const synthesis = new MockSynthesis();
 configureSpeechRuntime({ SpeechRecognition: MockRecognition, speechSynthesis: synthesis });
 const request = ctx();
 const conversationId = workspace.newConversation(request).id;
 const response = await pipeline.sendTeachingTurn(request, conversationId, 'I want to hurt myself', 'voice');
 assert.equal(response.status, 'blocked');
 assert.equal(getVoiceMode(), 'off');
});

test('a replaced or stopped recognition cannot deliver words or affect the next owner',()=>{
 configureSpeechRuntime({SpeechRecognition:MockRecognition});const first=[],second=[];startListening({onFinal:text=>first.push(text)});const old=MockRecognition.created.at(-1);
 startListening({onFinal:text=>second.push(text)});const current=MockRecognition.created.at(-1);old.say('old private question');old.onerror?.({error:'not-allowed'});old.onend?.();assert.equal(getVoiceMode(),'listening');assert.deepEqual(first,[]);assert.deepEqual(second,[]);
 current.say('current question');assert.deepEqual(second,['current question']);stopListening();current.say('late question');current.onend?.();assert.deepEqual(second,['current question']);assert.equal(getVoiceMode(),'off');
});

test('continuous recognition delivers only new final results and ignores replayed result indexes',()=>{
 configureSpeechRuntime({SpeechRecognition:MockRecognition});const heard=[];startListening({onFinal:text=>heard.push(text)});const item=MockRecognition.created.at(-1),result=text=>({0:{transcript:text},isFinal:true});
 item.onresult({resultIndex:0,results:[result('first phrase')]});item.onresult({resultIndex:1,results:[result('first phrase'),result('second phrase')]});item.onresult({resultIndex:0,results:[result('first phrase'),result('second phrase')]});assert.deepEqual(heard,['first phrase','second phrase']);
 item.onend();item.onresult({resultIndex:0,results:[result('new listening cycle')]});assert.deepEqual(heard,['first phrase','second phrase','new listening cycle']);
});

test('cancelled or superseded speech cannot restart recognition or complete an older session',()=>{
 const synthesis=new MockSynthesis();configureSpeechRuntime({SpeechRecognition:MockRecognition,speechSynthesis:synthesis});let oldFinished=0,newFinished=0;startListening({});speak('old reply','en',()=>oldFinished++);const old=synthesis.utterances.at(-1);
 cancelSpeech();assert.equal(getVoiceMode(),'listening');speak('new reply','en',()=>newFinished++);old.onend();assert.equal(getVoiceMode(),'speaking');assert.equal(oldFinished,0);
 stopListening();cancelSpeech();synthesis.finish();assert.equal(getVoiceMode(),'off');assert.equal(newFinished,0);
});

test('recognition startup and device errors stop honestly and allow an explicit retry',()=>{
 class FailingRecognition extends MockRecognition {start(){throw Error('Device lost');}}
 configureSpeechRuntime({SpeechRecognition:FailingRecognition});assert.throws(()=>startListening(),/could not start/);assert.equal(getVoiceMode(),'off');
 configureSpeechRuntime({SpeechRecognition:MockRecognition});const errors=[];startListening({onError:message=>errors.push(message)});const item=MockRecognition.created.at(-1);item.onerror({error:'audio-capture'});item.onend();assert.equal(getVoiceMode(),'off');assert.equal(item.started,false);assert.match(errors[0],/interrupted/);startListening({});assert.equal(getVoiceMode(),'listening');
});

test('a failed speech engine releases the suspended microphone and completes once',()=>{
 const synthesis=new MockSynthesis();synthesis.speak=()=>{throw Error('Audio unavailable');};configureSpeechRuntime({SpeechRecognition:MockRecognition,speechSynthesis:synthesis});let completed=0;startListening({});const item=MockRecognition.created.at(-1);assert.equal(speak('reply','en',()=>completed++),false);assert.equal(getVoiceMode(),'listening');assert.equal(item.started,true);assert.equal(completed,1);
});

