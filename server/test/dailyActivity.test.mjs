import test from 'node:test';
import assert from 'node:assert/strict';
import { clampWeeks, trailingWindow } from '../src/utils/dateWindow.js';

test('clampWeeks defaults to 16', () => {
  assert.equal(clampWeeks(undefined), 16);
  assert.equal(clampWeeks('abc'), 16);
  assert.equal(clampWeeks(null), 16);
});

test('clampWeeks bounds to [1, 53]', () => {
  assert.equal(clampWeeks(0), 1);
  assert.equal(clampWeeks(-5), 1);
  assert.equal(clampWeeks(999), 53);
  assert.equal(clampWeeks(53), 53);
});

test('clampWeeks parses numeric strings and floors floats', () => {
  assert.equal(clampWeeks('20'), 20);
  assert.equal(clampWeeks(12.9), 12);
});

test('trailingWindow computes an inclusive N-week window ending today', () => {
  const today = new Date('2026-09-10T12:00:00');
  const { from, to } = trailingWindow(16, today);
  assert.equal(to, '2026-09-10');
  // 16*7 - 1 = 111 days back → 2026-05-22
  assert.equal(from, '2026-05-22');
});

test('trailingWindow for 1 week is a 7-day window', () => {
  const today = new Date('2026-09-10T00:00:00');
  const { from, to } = trailingWindow(1, today);
  assert.equal(to, '2026-09-10');
  assert.equal(from, '2026-09-04');
});
