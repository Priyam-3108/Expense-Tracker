# Payment Mode — Phase 1A (API) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional `paymentMode` field to expenses (enum, default `other`), persist it through every create/update/sync path, and expose `GET /api/analytics/payment-modes` returning a spend-by-method breakdown.

**Architecture:** One schema field on `Expense`. One Zod enum on `expenseSchema`. Thread `paymentMode` through `createExpense` (single + recurring + bulk), `updateExpense`, and confirm `syncExpenses` pass-through. One new aggregation controller + route on the analytics router, reusing the existing `validateDateRange` middleware and the current-month default logic.

**Tech Stack:** Node ESM, Express 4, Mongoose 8, Zod 4. Tests via Node's built-in `node:test` + `node:assert` (no new dependency), run against an in-process mongoose connection to a test DB.

**Spec:** `docs/superpowers/specs/2026-09-10-payment-mode-design.md`

## Global Constraints

- Enum values, exact order: `['upi', 'cash', 'card', 'netbanking', 'wallet', 'other']`.
- Schema field: `default: 'other'`, NOT `required`.
- Absent/`undefined` `paymentMode` must be treated as `'other'` in aggregation (`$ifNull`).
- Only `type: 'expense'` rows count in the breakdown.
- `breakdown` array sorted by `total` descending; zero-spend modes omitted.
- New route: `GET /api/analytics/payment-modes`, auth via `authenticateToken`, `validateDateRange` middleware, default range = current calendar month.
- No new npm dependency for the feature itself. `node:test` is built in.
- No migration of historical data.
- After each task: `npm test` in `server/` passes (once the runner exists), and `node --check` on every modified file.
- Commit after each task with the message in its final step.

---

## File Structure

**Modified**
- `server/src/config/models/Expense.js` — add `paymentMode` field
- `server/src/middleware/validation.js` — add `paymentMode` to `expenseSchema`
- `server/src/controllers/expenseController.js` — thread `paymentMode` through `createExpense`, `bulkCreateExpenses`, `updateExpense`
- `server/src/controllers/analyticsController.js` — new `getPaymentModeBreakdown`
- `server/src/routes/analyticsRoutes.js` — new route
- `server/package.json` — add `"test": "node --test"` script

**Created**
- `server/src/constants/paymentModes.js` — single source of the enum array (imported by model, validation, controller)
- `server/test/setup.mjs` — shared test DB connect/disconnect helpers
- `server/test/paymentMode.model.test.mjs`
- `server/test/paymentMode.validation.test.mjs`
- `server/test/paymentMode.analytics.test.mjs`

---

## Task 1: Enum constant + test runner scaffold

**Files:**
- Create: `server/src/constants/paymentModes.js`
- Create: `server/test/setup.mjs`
- Modify: `server/package.json` (scripts block)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `server/src/constants/paymentModes.js`: `export const PAYMENT_MODES = ['upi','cash','card','netbanking','wallet','other']` and `export const DEFAULT_PAYMENT_MODE = 'other'`.
  - `server/test/setup.mjs`: `export async function connectTestDb()` (connects mongoose to `process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/expense_tracker_test'`), `export async function disconnectTestDb()` (drops the DB and disconnects), `export async function clearCollections()` (deletes all docs from every collection).

- [ ] **Step 1: Create the enum constant**

```js
// server/src/constants/paymentModes.js
export const PAYMENT_MODES = ['upi', 'cash', 'card', 'netbanking', 'wallet', 'other'];
export const DEFAULT_PAYMENT_MODE = 'other';
```

- [ ] **Step 2: Create the test setup helper**

```js
// server/test/setup.mjs
import mongoose from 'mongoose';

const TEST_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/expense_tracker_test';

export async function connectTestDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_URI);
  }
}

export async function clearCollections() {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((c) => c.deleteMany({}))
  );
}

export async function disconnectTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}
```

- [ ] **Step 3: Add the test script**

In `server/package.json`, add to `"scripts"`:

```json
"test": "node --test test/"
```

(Keep `dev` and `start` as they are.)

- [ ] **Step 4: Verify the runner starts**

Run: `cd server && node --test test/`
Expected: exits 0 with "tests 0" (no test files match yet, or only `setup.mjs` which has no tests). If it errors on `setup.mjs` being treated as a test file, that's fine — it has no `test()` calls so it contributes 0 tests. If `node --test` complains there are no tests, that is still exit 0.

- [ ] **Step 5: Commit**

```bash
git add server/src/constants/paymentModes.js server/test/setup.mjs server/package.json
git commit -m "Add payment-mode enum constant and node:test scaffold

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `paymentMode` on the Expense schema

**Files:**
- Modify: `server/src/config/models/Expense.js`
- Create: `server/test/paymentMode.model.test.mjs`

**Interfaces:**
- Consumes: `PAYMENT_MODES`, `DEFAULT_PAYMENT_MODE` from `server/src/constants/paymentModes.js`; `connectTestDb`, `clearCollections`, `disconnectTestDb` from `server/test/setup.mjs`.
- Produces: `Expense` documents now have a `paymentMode` string path with `enum: PAYMENT_MODES`, `default: 'other'`.

- [ ] **Step 1: Write the failing test**

```js
// server/test/paymentMode.model.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

const base = {
  amount: 100,
  date: '2026-09-10',
  category: new mongoose.Types.ObjectId(),
  user: new mongoose.Types.ObjectId(),
};

test('paymentMode defaults to "other" when omitted', async () => {
  const e = await Expense.create({ ...base });
  assert.equal(e.paymentMode, 'other');
});

test('paymentMode accepts a valid enum value', async () => {
  const e = await Expense.create({ ...base, paymentMode: 'upi' });
  assert.equal(e.paymentMode, 'upi');
});

test('paymentMode rejects an invalid value on validation', async () => {
  const e = new Expense({ ...base, paymentMode: 'crypto' });
  await assert.rejects(() => e.validate(), /paymentMode/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && node --test test/paymentMode.model.test.mjs`
Expected: FAIL — `paymentMode defaults to "other"` fails because the path does not exist (value is `undefined`), and the invalid-value test does not reject.

- [ ] **Step 3: Add the schema field**

In `server/src/config/models/Expense.js`, add the import at the top:

```js
import { PAYMENT_MODES, DEFAULT_PAYMENT_MODE } from '../../constants/paymentModes.js';
```

Then inside the `expenseSchema` object, after the `notes` field and before `isRecurring`, add:

```js
  paymentMode: {
    type: String,
    enum: PAYMENT_MODES,
    default: DEFAULT_PAYMENT_MODE
  },
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd server && node --test test/paymentMode.model.test.mjs`
Expected: PASS, 3/3.

- [ ] **Step 5: Commit**

```bash
git add server/src/config/models/Expense.js server/test/paymentMode.model.test.mjs
git commit -m "Add paymentMode field to Expense schema (enum, default other)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: `paymentMode` in the Zod validator

**Files:**
- Modify: `server/src/middleware/validation.js`
- Create: `server/test/paymentMode.validation.test.mjs`

**Interfaces:**
- Consumes: `PAYMENT_MODES` from `server/src/constants/paymentModes.js`; `expenseSchema` from `server/src/middleware/validation.js`.
- Produces: `expenseSchema` now has `paymentMode: z.enum(PAYMENT_MODES).optional()`.

- [ ] **Step 1: Write the failing test**

```js
// server/test/paymentMode.validation.test.mjs
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && node --test test/paymentMode.validation.test.mjs`
Expected: FAIL — the "accepts a valid paymentMode" test fails because Zod strips unknown keys (parsed value is `undefined`), and the "rejects an invalid" test fails because no such rule exists.

- [ ] **Step 3: Add the Zod rule**

In `server/src/middleware/validation.js`, add the import at the top:

```js
import { PAYMENT_MODES } from '../constants/paymentModes.js';
```

Then inside `expenseSchema`, after the `notes` line and before `isRecurring`, add:

```js
  paymentMode: z.enum(PAYMENT_MODES).optional(),
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd server && node --test test/paymentMode.validation.test.mjs`
Expected: PASS, 3/3.

- [ ] **Step 5: Commit**

```bash
git add server/src/middleware/validation.js server/test/paymentMode.validation.test.mjs
git commit -m "Accept optional paymentMode in expense Zod schema

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Persist `paymentMode` in `createExpense` (single + recurring + bulk)

**Files:**
- Modify: `server/src/controllers/expenseController.js` — `createExpense`, `bulkCreateExpenses`
- Create: `server/test/paymentMode.create.test.mjs`

**Interfaces:**
- Consumes: `DEFAULT_PAYMENT_MODE` from `server/src/constants/paymentModes.js`.
- Produces: `createExpense` reads `paymentMode` from `req.body` and writes it on the single doc, on every occurrence in a recurring series, and `bulkCreateExpenses` writes it per-row.

- [ ] **Step 1: Write the failing test**

```js
// server/test/paymentMode.create.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { Category } from '../src/config/models/Category.js';
import { createExpense, bulkCreateExpenses } from '../src/controllers/expenseController.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && node --test test/paymentMode.create.test.mjs`
Expected: FAIL — `paymentMode` is not read from the body, so the single-expense and recurring assertions get `other` (default) instead of the requested value; bulk gets `other` for the `cash` row.

- [ ] **Step 3: Thread `paymentMode` through `createExpense`**

In `server/src/controllers/expenseController.js`, add the import near the other model/constant imports at the top of the file:

```js
import { DEFAULT_PAYMENT_MODE } from '../constants/paymentModes.js';
```

In `createExpense`, add `paymentMode` to the destructure:

```js
    const {
      description,
      amount,
      date,
      category,
      type = 'expense',
      tags,
      notes,
      paymentMode = DEFAULT_PAYMENT_MODE,
      isRecurring,
      recurringPeriod,
      recurringEndDate
    } = req.body;
```

In the recurring `occurrences.push({ ... })` object, add `paymentMode,` (after `notes: ...`):

```js
        occurrences.push({
          description: cleanedDescription,
          amount: parseFloat(amount),
          date: currentDateStr,
          category,
          type,
          tags: tags || [],
          notes: notes ? notes.trim() : '',
          paymentMode,
          isRecurring: true,
          recurringPeriod: period,
          recurringEndDate: endDateStr,
          recurringGroupId: groupId,
          user: req.user._id
        });
```

In the single-expense `new Expense({ ... })`, add `paymentMode,` (after `notes: ...`):

```js
    const expense = new Expense({
      description: cleanedDescription,
      amount: parseFloat(amount),
      date: baseDate,
      category,
      type,
      tags: tags || [],
      notes: notes ? notes.trim() : '',
      paymentMode,
      isRecurring: false,
      user: req.user._id
    });
```

- [ ] **Step 4: Thread `paymentMode` through `bulkCreateExpenses`**

In `bulkCreateExpenses`, in the `validExpenses.push({ ... })` object, add:

```js
      validExpenses.push({
        description: expense.description ? expense.description.trim() : '',
        amount: parseFloat(expense.amount),
        date: expenseDate,
        category: expense.category,
        type: expense.type || 'expense',
        paymentMode: expense.paymentMode || DEFAULT_PAYMENT_MODE,
        user: req.user._id
      });
```

(Invalid bulk `paymentMode` values are not pre-validated here; Mongoose enum validation on `insertMany` will reject the batch — acceptable, bulk already surfaces errors. The web/mobile clients only send valid values.)

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd server && node --test test/paymentMode.create.test.mjs`
Expected: PASS, 4/4.

- [ ] **Step 6: Run the whole suite**

Run: `cd server && npm test`
Expected: all payment-mode tests pass, no regressions (there were no prior tests).

- [ ] **Step 7: Commit**

```bash
git add server/src/controllers/expenseController.js server/test/paymentMode.create.test.mjs
git commit -m "Persist paymentMode on single, recurring, and bulk expense creates

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Persist `paymentMode` in `updateExpense`

**Files:**
- Modify: `server/src/controllers/expenseController.js` — `updateExpense`
- Create: `server/test/paymentMode.update.test.mjs`

**Interfaces:**
- Consumes: nothing new.
- Produces: `updateExpense` sets `updates.paymentMode` when `paymentMode !== undefined` in the body.

- [ ] **Step 1: Write the failing test**

```js
// server/test/paymentMode.update.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { Category } from '../src/config/models/Category.js';
import { updateExpense } from '../src/controllers/expenseController.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && node --test test/paymentMode.update.test.mjs`
Expected: FAIL — first test: `paymentMode` stays `cash` because the controller never reads it.

- [ ] **Step 3: Add `paymentMode` to `updateExpense`**

In `updateExpense`, add `paymentMode` to the destructure:

```js
    const {
      description,
      amount,
      date,
      category,
      type,
      tags,
      notes,
      paymentMode,
      isRecurring,
      recurringPeriod,
      recurringEndDate
    } = req.body;
```

In the block that builds `updates`, after `if (notes !== undefined) updates.notes = ...` add:

```js
    if (paymentMode !== undefined) updates.paymentMode = paymentMode;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd server && node --test test/paymentMode.update.test.mjs`
Expected: PASS, 2/2.

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/expenseController.js server/test/paymentMode.update.test.mjs
git commit -m "Persist paymentMode on expense update

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: `getPaymentModeBreakdown` controller + aggregation

**Files:**
- Modify: `server/src/controllers/analyticsController.js`
- Create: `server/test/paymentMode.analytics.test.mjs`

**Interfaces:**
- Consumes: `Expense` from `../config/models/index.js`; standard Express `(req, res)`.
- Produces: `export const getPaymentModeBreakdown = async (req, res) => {...}` in `analyticsController.js`. Response shape exactly as the spec's "API surface / New" section. Reads `req.query.from` and `req.query.to`; defaults to current calendar month when either is missing.

- [ ] **Step 1: Write the failing test**

```js
// server/test/paymentMode.analytics.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { getPaymentModeBreakdown } from '../src/controllers/analyticsController.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

function mockRes() {
  return {
    statusCode: 200, body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

async function seed(userId) {
  const cat = new mongoose.Types.ObjectId();
  await Expense.create([
    { amount: 100, date: '2026-09-05', category: cat, user: userId, type: 'expense', paymentMode: 'upi' },
    { amount: 50,  date: '2026-09-06', category: cat, user: userId, type: 'expense', paymentMode: 'upi' },
    { amount: 200, date: '2026-09-07', category: cat, user: userId, type: 'expense', paymentMode: 'cash' },
    { amount: 999, date: '2026-09-08', category: cat, user: userId, type: 'income',  paymentMode: 'upi' },  // excluded (income)
    { amount: 30,  date: '2026-08-31', category: cat, user: userId, type: 'expense', paymentMode: 'card' }, // excluded (out of range)
  ]);
  // one legacy row with no paymentMode field at all
  await Expense.collection.insertOne({
    amount: 40, date: '2026-09-09', category: cat, user: userId, type: 'expense',
    createdAt: new Date(), updatedAt: new Date(),
  });
}

test('breakdown groups by paymentMode, expense-only, in range, sorted by total', async () => {
  const userId = new mongoose.Types.ObjectId();
  await seed(userId);
  const req = { user: { _id: userId }, query: { from: '2026-09-01', to: '2026-09-30' } };
  const res = mockRes();
  await getPaymentModeBreakdown(req, res);

  assert.equal(res.statusCode, 200);
  const { breakdown, totalSpent, from, to } = res.body.data;
  assert.equal(from, '2026-09-01');
  assert.equal(to, '2026-09-30');
  // cash 200, upi 150, other 40  → sorted desc
  assert.deepEqual(breakdown.map((b) => b.paymentMode), ['cash', 'upi', 'other']);
  assert.equal(breakdown[0].total, 200);
  assert.equal(breakdown[1].total, 150);
  assert.equal(breakdown[1].count, 2);
  assert.equal(breakdown[2].paymentMode, 'other'); // legacy row with missing field
  assert.equal(totalSpent, 390);
});

test('breakdown returns empty result for a range with no expenses', async () => {
  const userId = new mongoose.Types.ObjectId();
  const req = { user: { _id: userId }, query: { from: '2020-01-01', to: '2020-01-31' } };
  const res = mockRes();
  await getPaymentModeBreakdown(req, res);
  assert.deepEqual(res.body.data.breakdown, []);
  assert.equal(res.body.data.totalSpent, 0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && node --test test/paymentMode.analytics.test.mjs`
Expected: FAIL — `getPaymentModeBreakdown` is not exported (`TypeError: ... is not a function`).

- [ ] **Step 3: Implement the controller**

In `server/src/controllers/analyticsController.js`, add at the top with the other imports:

```js
import mongoose from 'mongoose';
import { Expense } from '../config/models/index.js';
```

(If `crypto` / `User` are already imported, keep them; just add these two.)

Append this export:

```js
// Spending grouped by payment method for a date range (expense-only).
export const getPaymentModeBreakdown = async (req, res) => {
  try {
    let { from, to } = req.query;

    if (!from || !to) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      from = `${year}-${month}-01`;
      to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    }

    const rows = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          type: 'expense',
          date: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$paymentMode', 'other'] },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const breakdown = rows.map((r) => ({
      paymentMode: r._id,
      total: r.total,
      count: r.count,
    }));
    const totalSpent = breakdown.reduce((s, b) => s + b.total, 0);

    res.json({
      success: true,
      data: { from, to, breakdown, totalSpent },
    });
  } catch (error) {
    console.error('Get payment-mode breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compute payment-mode breakdown',
      error: error.message,
    });
  }
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd server && node --test test/paymentMode.analytics.test.mjs`
Expected: PASS, 2/2.

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/analyticsController.js server/test/paymentMode.analytics.test.mjs
git commit -m "Add getPaymentModeBreakdown analytics aggregation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Route + sync pass-through assertion

**Files:**
- Modify: `server/src/routes/analyticsRoutes.js`
- Create: `server/test/paymentMode.route.test.mjs` (route wiring + sync pass-through, using supertest-free in-process Express app)

**Interfaces:**
- Consumes: `getPaymentModeBreakdown` from `../controllers/analyticsController.js`; `authenticateToken` from `../middleware/auth.js`; `validateDateRange` from `../middleware/validation.js`; `syncExpenses` from `../controllers/syncController.js`.
- Produces: `GET /api/analytics/payment-modes` wired with `authenticateToken` + `validateDateRange`.

- [ ] **Step 1: Write the failing test**

```js
// server/test/paymentMode.route.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { syncExpenses } from '../src/controllers/syncController.js';
import analyticsRoutes from '../src/routes/analyticsRoutes.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && node --test test/paymentMode.route.test.mjs`
Expected: FAIL — the route-registration test fails (no `/payment-modes` route). The sync test should already PASS because `syncController` spreads `...data` — if it fails, the sync controller has an explicit field list and needs `paymentMode` added (see Step 4).

- [ ] **Step 3: Register the route**

In `server/src/routes/analyticsRoutes.js`:

Add to the imports:

```js
import { getShareToken, revokeShareToken, getSharedProfile, getSharedCategories, getPaymentModeBreakdown } from '../controllers/analyticsController.js';
import { validateDateRange } from '../middleware/validation.js';
```

Add the route in the "Management routes (Protected)" section:

```js
router.get('/payment-modes', authenticateToken, validateDateRange, getPaymentModeBreakdown);
```

- [ ] **Step 4: If the sync test failed, fix `syncController`**

Open `server/src/controllers/syncController.js`. If the `Expense.create({...})` call uses `...data` spread, no change is needed. If it lists fields explicitly, add `paymentMode: data.paymentMode` to that object. (As of 2026-09-10 it spreads `const { client_uuid, ...data }` then `Expense.create({ ...data, client_uuid, user: req.user._id })` — no change expected.)

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd server && node --test test/paymentMode.route.test.mjs`
Expected: PASS, 2/2.

- [ ] **Step 6: Run the full suite**

Run: `cd server && npm test`
Expected: all payment-mode test files pass, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add server/src/routes/analyticsRoutes.js server/test/paymentMode.route.test.mjs
git commit -m "Wire GET /api/analytics/payment-modes and assert sync pass-through

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Live smoke + regression check

**Files:**
- Create: `server/scripts/smoke-payment-mode.mjs` (a runnable manual smoke; not part of `npm test`)

**Interfaces:**
- Consumes: a running dev server (`npm run dev`) with a real Mongo and a test user JWT.
- Produces: a script that exercises the real HTTP surface end to end.

- [ ] **Step 1: Write the smoke script**

```js
// server/scripts/smoke-payment-mode.mjs
// Usage: BASE=http://localhost:5000 TOKEN=<jwt> CATEGORY=<categoryId> node scripts/smoke-payment-mode.mjs
const BASE = process.env.BASE || 'http://localhost:5000';
const TOKEN = process.env.TOKEN;
const CATEGORY = process.env.CATEGORY;
if (!TOKEN || !CATEGORY) {
  console.error('Set TOKEN and CATEGORY env vars (a valid JWT and one of that user\'s category ids).');
  process.exit(1);
}
const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` };

async function j(method, path, body) {
  const r = await fetch(`${BASE}/api${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json();
  return { status: r.status, data };
}

const today = new Date().toISOString().slice(0, 10);

// 1. create with a paymentMode
let r = await j('POST', '/expenses', { amount: 123, date: today, category: CATEGORY, paymentMode: 'upi' });
console.assert(r.status === 201, 'create 201', r.status, r.data);
const id = r.data.data.expense._id;
console.assert(r.data.data.expense.paymentMode === 'upi', 'created paymentMode upi', r.data.data.expense.paymentMode);

// 2. create without → other
r = await j('POST', '/expenses', { amount: 45, date: today, category: CATEGORY });
console.assert(r.data.data.expense.paymentMode === 'other', 'default other', r.data.data.expense.paymentMode);

// 3. update it (PUT /:id runs full-body validation — send the whole expense)
r = await j('PUT', `/expenses/${id}`, { amount: 123, date: today, category: CATEGORY, paymentMode: 'cash' });
console.assert(r.data.data.expense.paymentMode === 'cash', 'updated to cash', r.data.data.expense.paymentMode);

// 4. reject invalid
r = await j('POST', '/expenses', { amount: 1, date: today, category: CATEGORY, paymentMode: 'crypto' });
console.assert(r.status === 400, 'invalid rejected 400', r.status);

// 5. breakdown endpoint
const first = today.slice(0, 8) + '01';
r = await j('GET', `/analytics/payment-modes?from=${first}&to=${today}`);
console.assert(r.status === 200, 'breakdown 200', r.status);
console.assert(Array.isArray(r.data.data.breakdown), 'breakdown is array');
console.log('breakdown:', JSON.stringify(r.data.data, null, 2));

console.log('\nSMOKE OK');
```

> **Note (post-review):** `PUT /api/expenses/:id` runs `validate(expenseSchema)` on the
> full body — `amount` and `category` are required, not optional. Any client (smoke
> script, web form in 1B, mobile form in 1C) editing an expense must send the WHOLE
> expense, not just the changed field. Step 3 above sends a full body for this reason.

- [ ] **Step 2: Run the automated suite once more**

Run: `cd server && npm test`
Expected: green.

- [ ] **Step 3: Run the smoke against a dev server (manual)**

Start the server (`cd server && npm run dev`), obtain a JWT (register/login via the app or `curl /api/auth/login`), pick a category id, then:

Run: `cd server && BASE=http://localhost:5000 TOKEN=... CATEGORY=... node scripts/smoke-payment-mode.mjs`
Expected: prints `SMOKE OK` with no `console.assert` failures; the printed `breakdown` includes the `upi`/`other`/`cash` rows from steps 1–3.

- [ ] **Step 4: Regression check on existing endpoints (manual)**

With the dev server running, in the app: create a normal expense (no payment mode UI yet), edit it, list expenses, open analytics. All must behave exactly as before — `paymentMode` is additive and defaulted.

- [ ] **Step 5: Commit**

```bash
git add server/scripts/smoke-payment-mode.mjs
git commit -m "Add manual smoke script for payment-mode API

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage**

| Spec item | Task |
|---|---|
| Enum values + order | Task 1 (`PAYMENT_MODES`) |
| Schema field, default `other`, not required | Task 2 |
| Zod `.optional()` enum | Task 3 |
| Persist on single create | Task 4 |
| Persist on recurring series | Task 4 |
| Persist on bulk create | Task 4 |
| Persist on update | Task 5 |
| Aggregation: `$ifNull` → `other`, expense-only, date range, sort desc, omit zero | Task 6 |
| Response shape (`from,to,breakdown,totalSpent`) | Task 6 |
| Current-month default range | Task 6 |
| Route `GET /api/analytics/payment-modes` + auth + `validateDateRange` | Task 7 |
| Sync pass-through | Task 7 (assert; Step 4 fixes if needed) |
| No new dependency (node:test) | Task 1 |
| No historical migration | (nothing to do — absent field handled by `$ifNull` and schema default) |
| Live smoke + regression | Task 8 |

**2. Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N". Every code step has literal code. The one conditional (Task 7 Step 4) names the exact file, the exact current behaviour, and the exact change if the assumption is wrong.

**3. Type consistency:**
- `PAYMENT_MODES` / `DEFAULT_PAYMENT_MODE` names identical across Tasks 1, 2, 3, 4.
- Response keys `from`, `to`, `breakdown`, `totalSpent` and item keys `paymentMode`, `total`, `count` identical between the spec, Task 6 implementation, and Task 6 + Task 8 assertions.
- `getPaymentModeBreakdown` — same name in Task 6 (export), Task 7 (import + route), Task 8 (HTTP path).
- Controller `(req, res)` doubles use `res.status().json()` consistently across Tasks 4–7.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-10-payment-mode-1a-api.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

**Which approach?**
