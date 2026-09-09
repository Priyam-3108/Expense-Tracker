import test from 'node:test';
import assert from 'node:assert/strict';
import { expenseSchema } from '../src/middleware/validation.js';

const base = { amount: 100, category: 'abc123' };

test('expenseSchema accepts a valid paymentMode', () => {
  const parsed = expenseSchema.parse({ ...base, paymentMode: 'card' });
  assert.equal(parsed.paymentMode, 'card');
});

test('expenseSchema allows paymentMode to be omitted', () => {
  const parsed = expenseSchema.parse({ ...base });
  assert.equal(parsed.paymentMode, undefined);
});

test('expenseSchema rejects an invalid paymentMode', () => {
  assert.throws(() => expenseSchema.parse({ ...base, paymentMode: 'crypto' }));
});
