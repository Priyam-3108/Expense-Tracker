import test from 'node:test';
import assert from 'node:assert/strict';
import { validate, accountSchema, transferUpdateSchema } from '../src/middleware/validation.js';

// Pure middleware logic, no DB needed — exercises the real Express
// middleware (not schema.safeParse directly) so a ZodError thrown inside
// the catch block (e.g. error.errors being undefined on Zod v4) would
// surface as a failed assertion here instead of silently falling through
// to a 500 elsewhere.

function mockRes() {
  return { statusCode: 200, body: null, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} };
}

test('validate middleware returns 400 with errors array on invalid account body', () => {
  const req = { body: { type: 'crypto' } }; // name missing, type not in enum
  const res = mockRes();
  let nextCalled = false;
  validate(accountSchema)(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 400);
  assert.ok(Array.isArray(res.body.errors));
  assert.ok(res.body.errors.length > 0);
  assert.equal(nextCalled, false);
});

test('validate middleware returns 400 with errors array on invalid transfer date', () => {
  const req = { body: { date: 'not-a-date' } };
  const res = mockRes();
  validate(transferUpdateSchema)(req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.ok(Array.isArray(res.body.errors));
  assert.ok(res.body.errors.length > 0);
});

test('validate middleware calls next() on valid body', () => {
  const req = { body: { name: 'Cash', type: 'cash' } };
  const res = mockRes();
  let nextCalled = false;
  validate(accountSchema)(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(res.body, null);
});
