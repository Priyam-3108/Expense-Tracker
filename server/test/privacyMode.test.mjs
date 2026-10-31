import test from 'node:test';
import assert from 'node:assert/strict';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { User } from '../src/config/models/User.js';

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

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
