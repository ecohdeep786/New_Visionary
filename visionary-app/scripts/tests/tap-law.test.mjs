import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import run, { carveTags, computeHitUnion, isInteractiveTag, tagEndIndex, hitInsetPx } from '../../frontend/scripts/qa-taps.mjs';

/* ── Hit-union accounting (dot rows / pseudo-inflated targets) ──────────── */

test('a dot pill reaching the 44px union through after-insets is compliant', () => {
  const tag = '<button type="button" className={"relative h-2 rounded-full after:absolute after:-inset-y-[18px] after:-inset-x-[18px]" />';
  assert.deepEqual(computeHitUnion(tag), { h: 44, w: 44, compliant: true });
});

test('the orbit bead keeps its 48px union with plain numeric insets', () => {
  const tag = "<button type=\"button\" className=\"absolute left-1/2 h-4 w-4 items-center justify-center rounded-full after:absolute after:-inset-y-4 after:-inset-x-4\" style={{ boxShadow: 'none' }}>";
  assert.deepEqual(computeHitUnion(tag), { h: 48, w: 48, compliant: true });
});

test('undersized pseudo insets keep the control illegal (32px union)', () => {
  const tag = '<button className="h-2 w-2 after:absolute after:-inset-y-3 after:-inset-x-3" />';
  assert.equal(computeHitUnion(tag).compliant, false);
});

test('a small control with no pseudo never passes (raw 32px box)', () => {
  const tag = '<button type="button" aria-label="Carry" className="absolute flex h-8 w-8 items-center justify-center">';
  assert.deepEqual(computeHitUnion(tag), { h: 32, w: 32, compliant: false });
});

test('width tokens dominate the union; the missing-width floor is the 8px dot pill', () => {
  assert.deepEqual(computeHitUnion('<button className="h-2 after:absolute after:-inset-x-[18px] after:-inset-y-[18px]" />'), { h: 44, w: 44, compliant: true });
  assert.deepEqual(computeHitUnion('<button className="h-2" />'), { h: 8, w: 8, compliant: false });
});

test('px and rem arbitrary tokens resolve on both axis maths', () => {
  assert.equal(hitInsetPx('<span className="after:absolute after:-inset-y-[0.75rem]" />', 'y'), 12);
  assert.equal(hitInsetPx('<span className="after:absolute after:-inset-y-4" />', 'y'), 16);
  assert.equal(hitInsetPx('<span className="after:absolute" />', 'y'), 0);
  assert.deepEqual(computeHitUnion('<button className="h-[2rem] w-[2.75rem]" />'), { h: 32, w: 44, compliant: false });
  assert.deepEqual(computeHitUnion('<button className="h-[1.5rem] w-[3rem] after:absolute after:-inset-y-[0.75rem] after:-inset-x-[0.75rem]" />'), { h: 48, w: 72, compliant: true });
});

/* ── Tag carving (JSX braces, template text, strings, interpolations) ───── */

test('a multi-line tag with a ternary class closes at its self-closing bracket', () => {
  const text = [
    '      <button',
    '        key={i}',
    '        type="button"',
    '        aria-label={`Go to slide ${i + 1}`}',
    '        aria-pressed={i === active}',
    '        onClick={() => onSelect(i)}',
    '        className={`relative h-2 after:absolute after:-inset-y-[18px] ${i === active ? "w-12" : "w-2"}`}',
    '        style={{ backgroundColor: color.ink }}',
    '      >',
    '        <span className="h-2 w-2" />',
    '      </button>',
  ].join('\n');
  const end = tagEndIndex(text, text.indexOf('<button'));
  assert.notEqual(end, -1);
  assert.equal(text.slice(end + 1).trim().startsWith('<span'), true);
});

test('a string containing quotes and a template-close-backtick does not capture the tag', () => {
  const tag = '<button aria-label={"select" + `the > path`} className="h-11 w-11">';
  const end = tagEndIndex(tag, 0);
  assert.equal(tag.slice(end), '>');
});

test('nested templates inside an interpolation keep their own segment', () => {
  const tag = '<button className={`a${b ? `x > y` : "z"} c`} data-x="1">';
  const end = tagEndIndex(tag, 0);
  assert.equal(tag.slice(end), '>');
});

test('template text with angle/brace noise does not terminate the tag', () => {
  const tag = '<button className={">>(){"} aria-label="ok">';
  const end = tagEndIndex(tag, 0);
  assert.equal(tag.slice(end), '>');
});

test('carveTags enumerates each control tag once in document order', () => {
  const text = '<div><button className="h-2 w-2"><Link to="/x" className="h-8 w-8" /><a href="/y" className="h-7">go</a></button></div>';
  const tags = carveTags(text);
  const starts = tags.map((t) => t.tag.split(/\s/)[0]);
  assert.deepEqual(starts, ['<div>', '<button', '<Link', '<a']);
});

/* ── Interactivity precision ─────────────────────────────────────────────── */

test('buttons, links and role surfaces are interactive; div onClick is deliberately out of reach', () => {
  assert.equal(isInteractiveTag('<button type="button" onClick={go} className="h-2 w-2">'), true);
  assert.equal(isInteractiveTag('<Link to="/about" aria-label="Learn" className="h-8 w-8">'), true);
  assert.equal(isInteractiveTag('<a href="/docs" className="h-4 w-4">'), true);
  assert.equal(isInteractiveTag('<button type="button" role="switch" aria-checked={on}>'), true);
  assert.equal(isInteractiveTag('<div onClick={go} className="h-2 w-2">'), false);
  assert.equal(isInteractiveTag('<a data-name="plain">non-anchor navigation</a>'), false);
  assert.equal(isInteractiveTag('<input type="text" className="h-8" />'), false);
  assert.equal(isInteractiveTag('<input type="submit" className="h-8" />'), true);
});

/* ── Receipt run over the real tree (law currently holds) ───────────────── */

test('the full scan is green and writes a machine-readable receipt', () => {
  const outReceipt = path.join(os.tmpdir(), `qa-taps-receipt-${process.pid}.json`);
  const code = run({ out: { log() {}, error() {} }, outReceipt });
  assert.equal(code, 0);
  const receipt = JSON.parse(fs.readFileSync(outReceipt, 'utf8'));
  assert.equal(receipt.metrics.violations, 0);
  assert.equal(receipt.metrics.labelViolations, 0);
  assert.ok(receipt.metrics.interactive > 200);
  assert.ok(receipt.metrics.scannedFiles > 80);
  assert.ok(Array.isArray(receipt.failures) && receipt.failures.length === 0);
  fs.rmSync(outReceipt, { force: true });
});
