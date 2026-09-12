// server/test/paymentMode.create.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { Category } from '../src/config/models/Category.js';
import { createExpense, bulkCreateExpenses } from '../src/controllers/expenseController.js';

// Node 16: top-level test hooks don't run — top-level await for setup, final test for teardown.
await connectTestDb();
await clearCollections();

// Minimal Express req/res doubles
function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

async function seedCategory(userId) {
  return Category.create({ name: 'Food', user: userId });
}

test('createExpense persists paymentMode on a single expense', async () => {
  const userId = new mongoose.Types.ObjectId();
  const cat = await seedCategory(userId);
  const req = { user: { _id: userId }, body: { amount: 50, date: '2026-09-10', category: String(cat._id), paymentMode: 'upi' } };
  const res = mockRes();
  await createExpense(req, res);
  assert.equal(res.statusCode, 201);
  const saved = await Expense.findOne({ user: userId });
  assert.equal(saved.paymentMode, 'upi');
});

test('createExpense defaults paymentMode to other when omitted', async () => {
  const userId = new mongoose.Types.ObjectId();
  const cat = await seedCategory(userId);
  const req = { user: { _id: userId }, body: { amount: 50, date: '2026-09-10', category: String(cat._id) } };
  const res = mockRes();
  await createExpense(req, res);
  const saved = await Expense.findOne({ user: userId });
  assert.equal(saved.paymentMode, 'other');
});

test('createExpense applies paymentMode to every occurrence in a recurring series', async () => {
  const userId = new mongoose.Types.ObjectId();
  const cat = await seedCategory(userId);
  const req = { user: { _id: userId }, body: {
    amount: 10, date: '2026-01-01', category: String(cat._id), paymentMode: 'card',
    isRecurring: true, recurringPeriod: 'monthly', recurringEndDate: '2026-03-01'
  } };
  const res = mockRes();
  await createExpense(req, res);
  const all = await Expense.find({ user: userId });
  assert.equal(all.length, 3);
  assert.ok(all.every((e) => e.paymentMode === 'card'));
});

test('bulkCreateExpenses persists per-row paymentMode', async () => {
  const userId = new mongoose.Types.ObjectId();
  const cat = await seedCategory(userId);
  const req = { user: { _id: userId }, body: {
    date: '2026-09-10',
    expenses: [
      { amount: 5, category: String(cat._id), paymentMode: 'cash' },
      { amount: 7, category: String(cat._id) },
    ],
  } };
  const res = mockRes();
  await bulkCreateExpenses(req, res);
  const rows = await Expense.find({ user: userId }).sort({ amount: 1 });
  assert.equal(rows[0].paymentMode, 'cash');
  assert.equal(rows[1].paymentMode, 'other');
});

test('bulkCreateExpenses reports invalid paymentMode as a per-row error without failing the batch', async () => {
  const userId = new mongoose.Types.ObjectId();
  const cat = await seedCategory(userId);
  const req = { user: { _id: userId }, body: {
    date: '2026-09-10',
    expenses: [
      { amount: 5, category: String(cat._id), paymentMode: 'bogus' },
      { amount: 7, category: String(cat._id), paymentMode: 'cash' },
    ],
  } };
  const res = mockRes();
  await bulkCreateExpenses(req, res);
  assert.equal(res.statusCode, 201);
  assert.ok(res.body.data.errors.some((e) => e.includes('Invalid payment mode')));
  const rows = await Expense.find({ user: userId });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].amount, 7);
  assert.equal(rows[0].paymentMode, 'cash');
});

test('zz cleanup', async () => {
  await clearCollections();
  await disconnectTestDb();
});
