import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { Category } from '../src/config/models/Category.js';
import { updateExpense } from '../src/controllers/expenseController.js';

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

test('updateExpense changes paymentMode', async () => {
  const userId = new mongoose.Types.ObjectId();
  const cat = await Category.create({ name: 'Food', user: userId });
  const exp = await Expense.create({ amount: 20, date: '2026-09-10', category: cat._id, user: userId, paymentMode: 'cash' });

  const req = { user: { _id: userId }, params: { id: String(exp._id) }, body: { paymentMode: 'upi' } };
  const res = mockRes();
  await updateExpense(req, res);

  assert.equal(res.statusCode, 200);
  const fresh = await Expense.findById(exp._id);
  assert.equal(fresh.paymentMode, 'upi');
});

test('updateExpense leaves paymentMode untouched when not in body', async () => {
  const userId = new mongoose.Types.ObjectId();
  const cat = await Category.create({ name: 'Food', user: userId });
  const exp = await Expense.create({ amount: 20, date: '2026-09-10', category: cat._id, user: userId, paymentMode: 'wallet' });

  const req = { user: { _id: userId }, params: { id: String(exp._id) }, body: { amount: 25 } };
  const res = mockRes();
  await updateExpense(req, res);

  const fresh = await Expense.findById(exp._id);
  assert.equal(fresh.paymentMode, 'wallet');
  assert.equal(fresh.amount, 25);
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
