import test from 'node:test';
import assert from 'node:assert/strict';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { User } from '../src/config/models/User.js';
import { updateProfile } from '../src/controllers/authController.js';

function mockRes() {
  return {
    statusCode: 200, body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

// Node 16: top-level test hooks don't run — use top-level await for setup
// and a final test for teardown.
await connectTestDb();
await clearCollections();

const base = { name: 'Ada', email: 'ada@example.com', password: 'secret123' };

test('privacyModeDefault defaults to false', async () => {
  const u = await User.create({ ...base });
  assert.equal(u.privacyModeDefault, false);
});

test('privacyModeDefault can be set true', async () => {
  const u = await User.create({ ...base, email: 'a2@example.com', privacyModeDefault: true });
  assert.equal(u.privacyModeDefault, true);
});

test('toJSON includes privacyModeDefault', async () => {
  const u = await User.create({ ...base, email: 'a3@example.com' });
  const json = u.toJSON();
  assert.equal(json.privacyModeDefault, false);
  assert.equal(json.password, undefined); // sanity: still stripped
});

test('updateProfile sets privacyModeDefault when boolean', async () => {
  const u = await User.create({ name: 'Grace', email: 'grace@example.com', password: 'secret123' });
  const req = { user: { _id: u._id, email: u.email }, body: { privacyModeDefault: true } };
  const res = mockRes();
  await updateProfile(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.user.privacyModeDefault, true);
  const fresh = await User.findById(u._id);
  assert.equal(fresh.privacyModeDefault, true);
});

test('updateProfile ignores a non-boolean privacyModeDefault', async () => {
  const u = await User.create({ name: 'Kay', email: 'kay@example.com', password: 'secret123', privacyModeDefault: true });
  const req = { user: { _id: u._id, email: u.email }, body: { privacyModeDefault: 'yes' } };
  const res = mockRes();
  await updateProfile(req, res);
  const fresh = await User.findById(u._id);
  assert.equal(fresh.privacyModeDefault, true); // unchanged, not coerced
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
