import test from 'node:test';
import assert from 'node:assert/strict';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { User, Category, Expense } from '../src/config/models/index.js';
import { getExpenseStats, getExpenseTrends, getDetailedAnalytics } from '../src/controllers/expenseController.js';
import { updateCategory } from '../src/controllers/categoryController.js';

function mockRes() {
  return {
    statusCode: 200, body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

await connectTestDb();
await clearCollections();

const user = await User.create({ name: 'Ada', email: 'ada-savings@example.com', password: 'secret123' });
const food = await Category.create({ name: 'Food', user: user._id });
const sip = await Category.create({ name: 'SIP', user: user._id, isSavings: true });
const rent = await Category.create({ name: 'House Rent', user: user._id, isDefault: true });
const row = (category, amount, type = 'expense') => ({ user: user._id, category: category._id, amount, type, date: '2026-03-10' });
await Expense.create([row(food, 100), row(sip, 400), row(food, 1000, 'income')]);

test('stats report the savings part of expenses', async () => {
  const res = mockRes();
  await getExpenseStats({ user, query: { startDate: '2026-03-01', endDate: '2026-03-31' } }, res);
  assert.deepEqual(res.body.data.totalStats, { expenses: 500, savings: 400, income: 1000, net: 500 });
  const flags = Object.fromEntries(res.body.data.categorySummary.map((c) => [c.categoryName, c.isSavings]));
  assert.deepEqual(flags, { Food: false, SIP: true });
});

test('trends report savings per month', async () => {
  const res = mockRes();
  await getExpenseTrends({ user, query: { year: '2026' } }, res);
  const mar = res.body.data.trends[2];
  assert.equal(mar.expenses, 500);
  assert.equal(mar.savings, 400);
});

test('detailed analytics can leave savings out', async () => {
  const query = { startDate: '2026-03-01', endDate: '2026-03-31' };
  const all = mockRes();
  await getDetailedAnalytics({ user, query }, all);
  assert.equal(all.body.data.summary.totalExpenses, 500);
  assert.equal(all.body.data.summary.savingsTotal, 400);

  const without = mockRes();
  await getDetailedAnalytics({ user, query: { ...query, excludeSavings: 'true' } }, without);
  const { summary, categoryBreakdown } = without.body.data;
  assert.equal(summary.totalExpenses, 100);
  assert.equal(summary.totalIncome, 1000);
  assert.equal(summary.savingsTotal, 400);
  assert.deepEqual(categoryBreakdown.map((c) => c.category.name), ['Food']);
});

test('default category: savings flag can change, name cannot', async () => {
  const ok = mockRes();
  await updateCategory({ user, params: { id: rent._id }, body: { name: 'House Rent', color: rent.color, icon: rent.icon, isSavings: true } }, ok);
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.body.data.category.isSavings, true);

  const denied = mockRes();
  await updateCategory({ user, params: { id: rent._id }, body: { name: 'Rent' } }, denied);
  assert.equal(denied.statusCode, 403);
});

test('teardown', async () => {
  await disconnectTestDb();
});
