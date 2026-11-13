import test from 'node:test';
import assert from 'node:assert/strict';

import run, {
  bounceViolations,
  cssMotionValues,
  easeClassViolations,
  jsMotionValues,
  motionValueVerdicts,
  stripLineComments,
  timingSignal,
} from '../../frontend/scripts/qa-motion.mjs';

const pass = { status: object => object.status === 'pass' };
void pass;

function kindsFor(value) {
  return motionValueVerdicts(value).map(v => v.kind);
}

/* ── Law 1: the curve ───────────────────────────────────────────────────── */

test('the law curve passes as a var, as a literal and inside a multi-property transition', () => {
  assert.equal(timingSignal(' var(--ease-out-apple)').status, 'pass');
  assert.equal(timingSignal('cubic-bezier(0.16, 1, 0.3, 1)').status, 'pass');
  assert.deepEqual(kindsFor('opacity var(--motion-duration-cinematic) var(--ease-out-apple), transform var(--motion-duration-cinematic) var(--ease-out-apple)'), []);
});

test('easing keywords fail even when glued to durations', () => {
  assert.deepEqual(kindsFor('border-color .3s ease'), ['banned-curve']);
  assert.deepEqual(kindsFor('transform 0.2s ease-in-out'), ['banned-curve']);
  assert.deepEqual(kindsFor('box-shadow 120ms ease, opacity 120ms ease'), ['banned-curve', 'banned-curve']);
  const [verdict] = motionValueVerdicts('transform 100ms ease');
  assert.equal(verdict.timing, 'ease');
});

test('a duration with no timing fails as missing-curve (the default `ease` sneaks in otherwise)', () => {
  assert.deepEqual(kindsFor('background var(--v-motion)'), ['non-law-curve-var']);
  assert.deepEqual(kindsFor('border-color .15s'), ['missing-curve']);
});

test('non-law curve vars and foreign beziers fail with precise kinds', () => {
  assert.deepEqual(kindsFor('opacity var(--easing-legacy)'), ['non-law-curve-var']);
  assert.deepEqual(kindsFor('transform .3s cubic-bezier(0.22, 1, 0.36, 1)'), ['banned-curve']);
});

test('the `ease` word inside var(--ease-out-apple) never reads as a keyword', () => {
  assert.deepEqual(kindsFor('background-color var(--motion-duration-fast) var(--ease-out-apple)'), []);
});

test('property-only and none segments never fail', () => {
  assert.deepEqual(motionValueVerdicts('none'), []);
  assert.deepEqual(motionValueVerdicts('background, border-color var(--motion-duration-base) var(--ease-out-apple)'), []);
});

test('linear is legal only while the animation self-runs (infinite)', () => {
  assert.equal(timingSignal('hero-fan-drift 70s linear infinite !important').status, 'pass');
  assert.equal(timingSignal('hero-fan-drift 70s linear 1').kind, 'linear-without-infinite');
  assert.deepEqual(kindsFor('transform .3s linear'), ['linear-without-infinite']);
});

/* ── Law 3: no bounce ───────────────────────────────────────────────────── */

test('bounce curves with overshoot y2 fail analytically', () => {
  assert.deepEqual(bounceViolations('cubic-bezier(0.22, 1.4, 0.36, 1)'), [{ kind: 'banned-bounce-curve', value: 'cubic-bezier(0.22,1.4,0.36,1)' }]);
  assert.deepEqual(bounceViolations('cubic-bezier(0, 0, 0.2, 1)'), []);
});

test('x1 outside [0,1] fails as an invalid curve', () => {
  const hits = bounceViolations('cubic-bezier(1.4, 0, 0.2, 1)');
  assert.deepEqual(hits, [{ kind: 'invalid-curve-x-bound', value: 'cubic-bezier(1.4,0,0.2,1)' }]);
});

/* ── Law 4: retired curves ──────────────────────────────────────────────── */

test('the scanner serves the real tree with the full law set', () => {
  process.env.QA_MOTION_QUIET = '1';
  const code = run({ out: { log: () => {}, error: (line) => { throw new Error(line); } }, outReceipt: null });
  delete process.env.QA_MOTION_QUIET;
  assert.equal(code, 0);
});

/* ── JS/JSX extraction ──────────────────────────────────────────────────── */

test('inline styles, curve constants, arbitrary animate classes and <style> templates are all scanned', () => {
  const text = [
    'const APPLE_EASE = "var(--ease-out-apple)";',
    '<span style={{ transition: "opacity 1.5s ease" }} />',
    '<span style={{ animation: `figIn 1.2s var(--ease-out-apple) both` }} />',
    '<span className="animate-[heroFadeUp_0.9s_cubic-bezier(0.22,1,0.36,1)]" />',
    '<style>{`animation: marquee-left 60s linear infinite !important;`}</style>',
  ].join('\n');
  const values = jsMotionValues(text);
  assert.equal(values.length, 5);
  assert.deepEqual(
    values.map(v => ({ value: v.value.slice(0, 44), kind: v.kind ?? 'declared' })),
    [
      { value: 'opacity 1.5s ease', kind: 'declared' },
      { value: 'figIn 1.2s var(--ease-out-apple) both', kind: 'declared' },
      { value: 'var(--ease-out-apple)', kind: 'constant' },
      { value: 'heroFadeUp 0.9s cubic-bezier(0.22,1,0.36,1)', kind: 'tailwind-arbitrary' },
      { value: 'marquee-left 60s linear infinite !important', kind: 'inline-css' },
    ],
  );
  /* Extraction indices stay aligned with the original text (comment
   * stripping is length-preserving), so file:line reporting is exact. */
  const lineOf = (needle) => {
    const v = values.find(entry => entry.value.includes(needle));
    assert.ok(v, `missing extraction for ${needle}`);
    return text.slice(0, v.index).split('\n').length;
  };
  assert.equal(lineOf('opacity 1.5s ease'), 2);
  assert.equal(lineOf('figIn 1.2s'), 3);
  assert.equal(text.slice(0, values[2].index).split('\n').length, 1);
  assert.equal(lineOf('heroFadeUp 0.9s'), 4);
  assert.equal(lineOf('marquee-left 60s'), 5);
  assert.deepEqual(motionValueVerdicts(values.find(v => v.value.includes('opacity 1.5s ease')).value).map(v => v.kind), ['banned-curve']);
  assert.deepEqual(motionValueVerdicts(values.find(v => v.value.includes('figIn 1.2s')).value), []);
  assert.deepEqual(motionValueVerdicts(values.find(v => v.value.includes('heroFadeUp 0.9s')).value).map(v => v.kind), ['banned-curve']);
  assert.deepEqual(motionValueVerdicts(values.find(v => v.value.includes('marquee-left 60s')).value), []);
});

test('prose mentions of curves and transitions never trip the scanner', () => {
  const text = [
    '// transition: opacity .3s "ease" — deliberately wrong in this comment',
    '/* cubic-bezier(0.9, 2.5, 0.1, 1) mention inside a comment */',
    'const doc = "the curve lives in src/styles/tokens.css";',
  ].join('\n');
  assert.deepEqual(jsMotionValues(text).filter(v => v.kind !== undefined && v.name !== undefined), []);
  const strayValues = jsMotionValues(text).length;
  assert.equal(strayValues, 0);
});

test('the reduced-motion conditional guard judges the fallback branch', () => {
  const text = 'style={{ transition: reduced ? "none" : "opacity 0.7s cubic-bezier(0.16,1,0.3,1)" }}';
  const values = jsMotionValues(text);
  assert.equal(values.length, 1);
  assert.equal(values[0].value, 'opacity 0.7s cubic-bezier(0.16,1,0.3,1)');
  assert.deepEqual(motionValueVerdicts(values[0].value), []);
  const banned = jsMotionValues('style={{ transition: reduced ? "none" : "opacity 0.7s ease" }}');
  assert.deepEqual(motionValueVerdicts(banned[0].value).map(v => v.kind), ['banned-curve']);
});

test('CSS extraction keeps declaration boundaries clean', () => {
  const sheet = [
    '.a { transition: border-color 120ms var(--ease-out-apple), box-shadow 120ms var(--ease-out-apple); }',
    '.b{animation:v-orb-in 0.7s var(--ease-out-apple) 1}',
    '.c { transition-property: opacity; }',
    '/* transition: opacity .3s ease (comment) */',
  ].join('\n');
  const values = cssMotionValues(sheet);
  assert.equal(values.length, 3);
  assert.deepEqual(motionValueVerdicts(values[0].value), []);
  assert.deepEqual(motionValueVerdicts(values[1].value), []);
  assert.equal(values[2].name, 'transition-property');
});

/* ── Law 7: ease utility classes ────────────────────────────────────────── */

test('ease-in/out/in-out/spring/google utility names fail; ease-linear and ease-apple are exempt', () => {
  const text = [
    'className="flex transition-transform duration-500 ease-out"',
    "className='grid transition-all duration-500 ease-in-out'",
    'className={`relative transition ease-spring`}',
    'className="transition-transform duration-500 ease-apple"',
    'className="w-[--sidebar-width] duration-200 ease-linear"',
  ].join('\n');
  const hits = easeClassViolations(text);
  assert.deepEqual(hits.map(h => h.ease), ['out', 'in-out', 'spring']);
});

test('line comments are blanked without shifting line positions', () => {
  const text = [
    '// transition: opacity .3s ease',
    'const x = 1;',
  ].join('\n');
  const stripped = stripLineComments(text);
  assert.equal(stripped.split('\n').length, 2);
  assert.equal(stripped.split('\n')[1], 'const x = 1;');
  assert.doesNotMatch(stripped, /transition/);
});
