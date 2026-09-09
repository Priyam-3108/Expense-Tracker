// server/test/paymentMode.route.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { syncExpenses } from '../src/controllers/syncController.js';
import analyticsRoutes from '../src/routes/analyticsRoutes.js';

// Node 16: top-level test hooks don't run — top-level await for setup, final test for teardown.
await connectTestDb();
await clearCollections();

function mockRes() {
  return {
    statusCode: 200, body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

test('analyticsRoutes registers GET /payment-modes', () => {
  const layer = analyticsRoutes.stack.find(
    (l) => l.route && l.route.path === '/payment-modes' && l.route.methods.get
  );
  assert.ok(layer, 'expected a GET /payment-modes route on the analytics router');
});

test('syncExpenses persists paymentMode from the synced payload', async () => {
  const userId = new mongoose.Types.ObjectId();
  const cat = new mongoose.Types.ObjectId();
  const req = {
    user: { _id: userId },
    body: {
      expenses: [
        { client_uuid: 'uuid-1', amount: 12, date: '2026-09-10', category: String(cat), type: 'expense', paymentMode: 'upi' },
      ],
    },
  };
  const res = mockRes();
  await syncExpenses(req, res);
  const saved = await Expense.findOne({ client_uuid: 'uuid-1' });
  assert.ok(saved, 'expense should be created by sync');
  assert.equal(saved.paymentMode, 'upi');
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
