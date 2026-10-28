import test from 'node:test';
import assert from 'node:assert/strict';

import {
  artifactViolations,
  extractTag,
  findSub44pxControls,
  hexLawViolations,
  iconControlSizeViolations,
  linkInkUses,
  linkInkViolations,
  uppercaseVoiceViolations,
} from '../../frontend/scripts/qa-continuity.mjs';

const CRLF = '\r\n';

test('extractTag walks CRLF files, plain JSX expressions and template literals', () => {
  const text = [
    '<button',
    '  type="button"',
    '  aria-label={`Previous ${label}`}',
    '  onClick={() => step(-1)}',
    '  className={`flex h-9 w-9 ${active === 0 ? "a" : "b"}`}',
    '>',
    'go',
    '</button>',
  ].join(CRLF);
  const tag = extractTag(text, 0);
  assert.ok(tag.startsWith('<button'));
  assert.ok(tag.endsWith('>'));
  assert.match(tag, /h-9 w-9/);
});

test('sub-44px interactive controls fail; exempt marks and h-11 pass', () => {
  const multiline = [
    '<button',
    '  type="button"',
    '  onClick={() => setPlaying((v) => !v)}',
    '  className="flex h-9 w-9 items-center justify-center"',
    '>',
    'x',
    '</button>',
  ].join(CRLF);
  const inline = '<button type="button" className="flex h-9 w-9 items-center">p</button>';
  const templated = '<button className={`flex h-9 w-9 items-center ${compact ? "a" : "b"}`}>q</button>';
  assert.equal(findSub44pxControls(multiline).length, 1);
  assert.equal(findSub44pxControls(inline + templated).length, 2);

  const clean = [
    '<button type="button" className="flex h-11 w-11 items-center justify-center">r</button>',
    '<button aria-hidden="true" className="h-9 w-9">hidden</button>',
    '<a href="#main" className="pointer-events-none h-10 w-10">deco</a>',
  ].join('\n');
  assert.equal(findSub44pxControls(clean).length, 0);
});

test('hex law: law values pass; legacy and unknown fail; allowed set passes', () => {
  assert.equal(hexLawViolations('bg-[#1d1d1f] text-[#0066cc] ring-[#0066cc] hover:bg-[#f5f5f7]').length, 0);

  const hits = hexLawViolations('color: #5f6368; border: 1px solid #9AA0A6; background: #123456');
  // #5f6368/#9aa0a6 are legacy (A3 table); #123456 is not a law value.
  assert.deepEqual(hits.map(h => h.kind).sort(), ['legacy-hex', 'legacy-hex', 'unknown-law-hex']);
  assert.deepEqual(hits.map(h => h.value).sort(), ['#123456', '#5f6368', '#9aa0a6']);

  const unknown = hexLawViolations('background: #123456');
  assert.deepEqual(unknown.map(v => v.kind), ['unknown-law-hex']);

  const allowed = hexLawViolations('background: #123456', new Set(['#123456']));
  assert.equal(allowed.length, 0);
});

test('uppercase-kicker law: class attributes and style objects fail; plain prose is clean', () => {
  assert.equal(uppercaseVoiceViolations('<h2 className="uppercase tracking-[0.24px] text-[12px]">hi</h2>').length, 1);
  assert.equal(uppercaseVoiceViolations('<span style={{ textTransform: "uppercase" }}>x</span>').length, 1);
  assert.equal(uppercaseVoiceViolations('.kicker { text-transform: uppercase; }', true).length, 1);
  assert.equal(uppercaseVoiceViolations('Use uppercase letters for clarity in prose.').length, 0);
});

test('invalid #rgba( artifacts are banned; valid rgba( passes', () => {
  assert.equal(artifactViolations('bg-[rgba(0,102,204,0.10)]').length, 0);
  assert.equal(artifactViolations('bg-[#rgba(0,102,204,0.10)]').length, 1);
});

test('icon-control law: only 2.75rem stays legal at the single definition point', () => {
  assert.equal(iconControlSizeViolations(':root { --icon-control-size: 2.75rem; }').length, 0);
  assert.deepEqual(
    iconControlSizeViolations(':root { --icon-control-size: 2.25rem; }'),
    [{ kind: 'icon-control-size-law', value: '2.25rem', expected: '2.75rem (44px)' }],
  );
  assert.deepEqual(
    iconControlSizeViolations('body { --icon-size: 2.75rem; }'),
    [{ kind: 'missing-icon-control-size' }],
  );
});

test('link-ink law: one blue system per page (base/hover/active/focus-visible roles)', () => {
  const legal = [
    '<a className="bg-[#0066cc] hover:bg-[#0071e3] active:bg-[#006edb] focus-visible:ring-2 focus-visible:ring-[#0066cc]">x</a>',
    '<a className="text-[#6e6e73] hover:text-[#0066cc] focus-visible:ring-[#0066cc]">y</a>', // grey links reassert the link ink on hover
    '<a className="focus-visible:ring-[#2997ff]">z</a>', // dark-stage accent ring
  ].join('\n');
  assert.equal(linkInkViolations(linkInkUses(legal)).length, 0);

  const commerceBase = [
    '<button className="bg-[#0071e3] hover:bg-[#0077ed] focus-visible:ring-[#0071e3]">a</button>',
    '<button className="bg-[#0066cc] hover:bg-[#0071e3] active:bg-[#006edb]">b</button>',
  ].join('\n');
  const dual = linkInkViolations(linkInkUses(commerceBase));
  assert.equal(dual.length, 2);
  assert.ok(dual.some(v => v.kind === 'dual-base-link-ink'));
  const dualBase = dual.find(v => v.kind === 'dual-base-link-ink');
  assert.deepEqual(dualBase.baseInks, ['#0066cc', '#0071e3']);
  assert.ok(dual.some(v => v.kind === 'illegal-link-ink-role' && v.value === '#0077ed'));

  const illegalRole = linkInkViolations(linkInkUses('<a className="text-[#006edb]">t</a>'));
  assert.equal(illegalRole.length, 1);
  assert.equal(illegalRole[0].kind, 'illegal-link-ink-role');

  const nonLinkBlues = linkInkUses('<p className="text-[#1d1d1f] bg-[#f5f5f7] border-[#d2d2d7]">p</p>').length;
  assert.equal(nonLinkBlues, 0);
});
