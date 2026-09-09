# Accounts + Transfers — Phase 4A (API) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce `Account` and `Transfer` models, an `account` (+ `isAdjustment`) field on `Expense`, a default-account seed on registration, an idempotent migration, computed account balances, full CRUD + reconcile + statement + transfer-sync endpoints, and an `account` filter on expense/analytics queries.

**Architecture:** Two new Mongoose models mirroring the existing `Debt`/`Category` style. A `computeAccountBalances(userId)` helper doing two aggregations merged in JS. Controllers + routers following the existing `expenses.js` pattern. Zod schemas alongside the existing ones. Reconcile is a special `Expense` row (`isAdjustment: true`) against the seeded "Adjustment" category. Migration is a standalone script. Tests extend the `node:test` suite.

**Tech Stack:** Node ESM, Express 4, Mongoose 8, Zod 4. `node:test` + `node:assert`.

**Spec:** `docs/superpowers/specs/2026-09-10-accounts-transfers-design.md`

**Depends on:** Features 1–3 API phases merged (this plan touches `Expense.js`, `authController.js` register, `expenseController.js`, `validation.js`, `analyticsController.js` — all also touched by F1/F3). **Re-read against current code before executing; line references below are as of 2026-09-10.**

## Global Constraints

- `Account`: `type` enum `['cash','bank','card','savings','other']` default `'cash'`; `openingBalance` Number default 0; `currency` enum = the 8 in `User.currency`; `isDefault`/`archived` booleans default false. Partial unique index `{ user:1, isDefault:1 }` where `isDefault:true`.
- `Transfer`: `fromAccount` ≠ `toAccount` (schema + controller); `amount` min 0.01; `client_uuid` unique sparse.
- `Expense`: `account` `ref: 'Account'` default `null`; `isAdjustment` Boolean default false. Index `{ user:1, account:1 }`.
- Balance formula: `openingBalance + Σincome − Σexpense + ΣtransfersIn − ΣtransfersOut`. Computed on read.
- Reconcile: `delta = target − current`; `delta > 0` → income adjustment, `< 0` → expense adjustment, `=== 0` → no row, `{ adjusted:false }`.
- Cross-currency transfers → 400. Same-account transfer → 400.
- Delete account with any expense/transfer or `isDefault` → 403. Archive instead.
- Omitted `account` on expense create → default account id.
- Registration seeds "Cash" default account + "Adjustment" default category.
- Migration idempotent + documented-reversible.
- No new npm dependency.
- After each task: `cd server && npm test` passes; `node --check` on modified files.
- Commit after each task with the message in its final step.

## File Structure

**Created**
- `server/src/config/models/Account.js`
- `server/src/config/models/Transfer.js`
- `server/src/controllers/accountController.js`
- `server/src/controllers/transferController.js`
- `server/src/routes/accounts.js`
- `server/src/routes/transfers.js`
- `server/src/utils/accountBalances.js` — `computeAccountBalances(userId)`
- `server/src/utils/seedDefaults.js` — `seedDefaultAccountAndAdjustmentCategory(userId, currency)` (extracted so registration + migration share it)
- `server/scripts/migrate-accounts.mjs`
- `server/test/account.model.test.mjs`, `transfer.model.test.mjs`, `accountBalances.test.mjs`, `accountApi.test.mjs`, `transferApi.test.mjs`, `expenseAccount.test.mjs`, `migrateAccounts.test.mjs`

**Modified**
- `server/src/config/models/Expense.js` — `account`, `isAdjustment`
- `server/src/config/models/index.js` — export `Account`, `Transfer`
- `server/src/middleware/validation.js` — `accountSchema`, `transferSchema`, `account` on `expenseSchema`
- `server/src/controllers/authController.js` — register calls `seedDefaults`
- `server/src/controllers/expenseController.js` — `account` in create/update/bulk + `account` filter in `getExpenses`, `getDetailedAnalytics`
- `server/src/controllers/syncController.js` — assert `account` pass-through
- `server/src/app.js` — mount `accounts` + `transfers` routers

---

## Task 1: `Account` model + tests

**Files:**
- Create: `server/src/config/models/Account.js`
- Modify: `server/src/config/models/index.js`
- Create: `server/test/account.model.test.mjs`

**Interfaces:**
- Produces: `export const Account` with the fields + indexes from Global Constraints. `index.js` adds `export { Account } from './Account.js'`.

- [ ] **Step 1: Write the failing test**

```js
// server/test/account.model.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Account } from '../src/config/models/Account.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

const u = () => new mongoose.Types.ObjectId();

test('Account applies defaults', async () => {
  const a = await Account.create({ user: u(), name: 'Wallet' });
  assert.equal(a.type, 'cash');
  assert.equal(a.openingBalance, 0);
  assert.equal(a.isDefault, false);
  assert.equal(a.archived, false);
});

test('Account rejects an invalid type', async () => {
  const a = new Account({ user: u(), name: 'X', type: 'crypto' });
  await assert.rejects(() => a.validate(), /type/);
});

test('only one default account per user (partial unique index)', async () => {
  await Account.syncIndexes();
  const user = u();
  await Account.create({ user, name: 'A', isDefault: true });
  await assert.rejects(
    () => Account.create({ user, name: 'B', isDefault: true }),
    /duplicate key|E11000/
  );
  // a non-default second account is fine
  await Account.create({ user, name: 'C', isDefault: false });
});
```

- [ ] **Step 2: Run — expect FAIL** (`Account.js` missing)

Run: `cd server && node --test test/account.model.test.mjs`

- [ ] **Step 3: Implement the model**

```js
// server/src/config/models/Account.js
import mongoose from 'mongoose';

const CURRENCIES = ['USD', 'EUR', 'INR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD'];

const accountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: [true, 'Account name is required'], trim: true, maxlength: [40, 'Name cannot exceed 40 characters'] },
  type: { type: String, enum: ['cash', 'bank', 'card', 'savings', 'other'], default: 'cash' },
  openingBalance: { type: Number, default: 0 },
  currency: { type: String, enum: CURRENCIES, default: 'USD' },
  isDefault: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
}, { timestamps: true });

accountSchema.index({ user: 1, archived: 1 });
accountSchema.index(
  { user: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

accountSchema.set('toJSON', { virtuals: true });
accountSchema.set('toObject', { virtuals: true });

export const Account = mongoose.model('Account', accountSchema);
```

Add to `server/src/config/models/index.js`:

```js
export { Account } from './Account.js';
```

- [ ] **Step 4: Run — expect PASS**

Run: `cd server && node --test test/account.model.test.mjs`

- [ ] **Step 5: Commit**

```bash
git add server/src/config/models/Account.js server/src/config/models/index.js server/test/account.model.test.mjs
git commit -m "Add Account model (types, currency, default/archived, one-default index)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `Transfer` model + tests

**Files:**
- Create: `server/src/config/models/Transfer.js`
- Modify: `server/src/config/models/index.js`
- Create: `server/test/transfer.model.test.mjs`

**Interfaces:**
- Produces: `export const Transfer`. `fromAccount !== toAccount` enforced by a schema `validate`. `client_uuid` unique sparse.

- [ ] **Step 1: Write the failing test**

```js
// server/test/transfer.model.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Transfer } from '../src/config/models/Transfer.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

const id = () => new mongoose.Types.ObjectId();

test('Transfer requires distinct from/to accounts', async () => {
  const acc = id();
  const t = new Transfer({ user: id(), fromAccount: acc, toAccount: acc, amount: 10, date: '2026-09-10' });
  await assert.rejects(() => t.validate(), /same account|distinct|different/i);
});

test('Transfer enforces min amount', async () => {
  const t = new Transfer({ user: id(), fromAccount: id(), toAccount: id(), amount: 0, date: '2026-09-10' });
  await assert.rejects(() => t.validate(), /amount/i);
});

test('Transfer accepts a valid doc', async () => {
  const t = await Transfer.create({ user: id(), fromAccount: id(), toAccount: id(), amount: 500, date: '2026-09-10', note: 'rent' });
  assert.equal(t.amount, 500);
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement the model**

```js
// server/src/config/models/Transfer.js
import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  toAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  amount: { type: Number, required: [true, 'Amount is required'], min: [0.01, 'Amount must be greater than 0'] },
  date: { type: String, required: [true, 'Date is required'], match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'] },
  note: { type: String, trim: true, maxlength: [300, 'Note cannot exceed 300 characters'] },
  client_uuid: { type: String, unique: true, sparse: true, index: true },
}, { timestamps: true });

transferSchema.pre('validate', function (next) {
  if (this.fromAccount && this.toAccount && String(this.fromAccount) === String(this.toAccount)) {
    this.invalidate('toAccount', 'Cannot transfer to the same account');
  }
  next();
});

transferSchema.index({ user: 1, date: -1 });
transferSchema.set('toJSON', { virtuals: true });
transferSchema.set('toObject', { virtuals: true });

export const Transfer = mongoose.model('Transfer', transferSchema);
```

Add to `index.js`: `export { Transfer } from './Transfer.js';`

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add server/src/config/models/Transfer.js server/src/config/models/index.js server/test/transfer.model.test.mjs
git commit -m "Add Transfer model (distinct-account validation, sync uuid)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: `account` + `isAdjustment` on `Expense`; Zod

**Files:**
- Modify: `server/src/config/models/Expense.js`
- Modify: `server/src/middleware/validation.js`
- Create: `server/test/expenseAccount.test.mjs` (schema + zod portion)

**Interfaces:**
- Produces: `Expense` gains `account` (ref, default null) + `isAdjustment` (Boolean default false) + index `{user:1,account:1}`. `expenseSchema` gains `account: z.string().optional()`. `accountSchema` + `transferSchema` added to `validation.js`.

- [ ] **Step 1: Write the failing test**

```js
// server/test/expenseAccount.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { expenseSchema, accountSchema, transferSchema } from '../src/middleware/validation.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

const id = () => new mongoose.Types.ObjectId();

test('Expense.account defaults to null, isAdjustment to false', async () => {
  const e = await Expense.create({ amount: 5, date: '2026-09-10', category: id(), user: id() });
  assert.equal(e.account, null);
  assert.equal(e.isAdjustment, false);
});

test('expenseSchema accepts optional account', () => {
  const parsed = expenseSchema.parse({ amount: 1, category: 'c', account: 'a1' });
  assert.equal(parsed.account, 'a1');
  const parsed2 = expenseSchema.parse({ amount: 1, category: 'c' });
  assert.equal(parsed2.account, undefined);
});

test('accountSchema validates name + type', () => {
  assert.equal(accountSchema.parse({ name: 'Bank', type: 'bank' }).type, 'bank');
  assert.throws(() => accountSchema.parse({ name: 'X', type: 'nope' }));
  assert.throws(() => accountSchema.parse({ type: 'bank' })); // name required
});

test('transferSchema validates', () => {
  const ok = transferSchema.parse({ fromAccount: 'a', toAccount: 'b', amount: 10, date: '2026-09-10' });
  assert.equal(ok.amount, 10);
  assert.throws(() => transferSchema.parse({ fromAccount: 'a', toAccount: 'b', amount: 0, date: '2026-09-10' }));
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Update `Expense.js`**

Add after the `notes` field (and after `paymentMode` if F1 added it):

```js
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null
  },
  isAdjustment: {
    type: Boolean,
    default: false
  },
```

Add near the other indexes:

```js
expenseSchema.index({ user: 1, account: 1 });
```

- [ ] **Step 4: Update `validation.js`**

Add to `expenseSchema` (after `category`):

```js
  account: z.string().optional(),
```

Append:

```js
export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(40, 'Name cannot exceed 40 characters'),
  type: z.enum(['cash', 'bank', 'card', 'savings', 'other']).optional(),
  openingBalance: z.number().optional(),
  currency: z.enum(['USD', 'EUR', 'INR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD']).optional(),
  archived: z.boolean().optional(),
});

export const transferSchema = z.object({
  fromAccount: z.string().min(1, 'From account is required'),
  toAccount: z.string().min(1, 'To account is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  note: z.string().max(300).optional(),
});
```

- [ ] **Step 5: Run — expect PASS**

Run: `cd server && node --test test/expenseAccount.test.mjs`

- [ ] **Step 6: Commit**

```bash
git add server/src/config/models/Expense.js server/src/middleware/validation.js server/test/expenseAccount.test.mjs
git commit -m "Add account + isAdjustment to Expense; account/transfer Zod schemas

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: `seedDefaults` util + registration seed

**Files:**
- Create: `server/src/utils/seedDefaults.js`
- Modify: `server/src/controllers/authController.js` — `register`
- Create: `server/test/seedDefaults.test.mjs`

**Interfaces:**
- Produces: `export async function seedDefaultAccountAndAdjustmentCategory(userId, currency = 'USD')` — creates a `Cash` default account (if none) and an `Adjustment` default category (if none); returns `{ account, category }`. Idempotent.

- [ ] **Step 1: Write the failing test**

```js
// server/test/seedDefaults.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Account } from '../src/config/models/Account.js';
import { Category } from '../src/config/models/Category.js';
import { seedDefaultAccountAndAdjustmentCategory } from '../src/utils/seedDefaults.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

test('seeds a default account and an Adjustment category', async () => {
  const userId = new mongoose.Types.ObjectId();
  await seedDefaultAccountAndAdjustmentCategory(userId, 'INR');
  const acc = await Account.findOne({ user: userId, isDefault: true });
  assert.equal(acc.name, 'Cash');
  assert.equal(acc.currency, 'INR');
  const cat = await Category.findOne({ user: userId, name: 'Adjustment' });
  assert.equal(cat.isDefault, true);
});

test('is idempotent', async () => {
  const userId = new mongoose.Types.ObjectId();
  await seedDefaultAccountAndAdjustmentCategory(userId, 'USD');
  await seedDefaultAccountAndAdjustmentCategory(userId, 'USD');
  assert.equal(await Account.countDocuments({ user: userId }), 1);
  assert.equal(await Category.countDocuments({ user: userId, name: 'Adjustment' }), 1);
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement the util**

```js
// server/src/utils/seedDefaults.js
import { Account } from '../config/models/Account.js';
import { Category } from '../config/models/Category.js';

export async function seedDefaultAccountAndAdjustmentCategory(userId, currency = 'USD') {
  let account = await Account.findOne({ user: userId, isDefault: true });
  if (!account) {
    account = await Account.create({
      user: userId,
      name: 'Cash',
      type: 'cash',
      openingBalance: 0,
      currency,
      isDefault: true,
    });
  }

  let category = await Category.findOne({ user: userId, name: 'Adjustment' });
  if (!category) {
    category = await Category.create({
      user: userId,
      name: 'Adjustment',
      color: '#64748B',
      icon: '⚖️',
      isDefault: true,
    });
  }

  return { account, category };
}
```

- [ ] **Step 4: Wire into `register`**

In `server/src/controllers/authController.js`, add the import:

```js
import { seedDefaultAccountAndAdjustmentCategory } from '../utils/seedDefaults.js';
```

After the `for (const categoryData of defaultCategories)` loop (which seeds the 10 spending categories), add:

```js
    await seedDefaultAccountAndAdjustmentCategory(user._id, user.currency);
```

- [ ] **Step 5: Run — expect PASS**

Run: `cd server && node --test test/seedDefaults.test.mjs`

- [ ] **Step 6: Commit**

```bash
git add server/src/utils/seedDefaults.js server/src/controllers/authController.js server/test/seedDefaults.test.mjs
git commit -m "Seed default Cash account + Adjustment category on registration

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: `computeAccountBalances` util

**Files:**
- Create: `server/src/utils/accountBalances.js`
- Create: `server/test/accountBalances.test.mjs`

**Interfaces:**
- Produces: `export async function computeAccountBalances(userId)` → `Map<accountIdString, number>` of `openingBalance + Σincome − Σexpense + ΣtransfersIn − ΣtransfersOut` for every account the user owns (archived included).

- [ ] **Step 1: Write the failing test**

```js
// server/test/accountBalances.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Account } from '../src/config/models/Account.js';
import { Expense } from '../src/config/models/Expense.js';
import { Transfer } from '../src/config/models/Transfer.js';
import { computeAccountBalances } from '../src/utils/accountBalances.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

test('balance = opening + income - expense + transfersIn - transfersOut', async () => {
  const user = new mongoose.Types.ObjectId();
  const cat = new mongoose.Types.ObjectId();
  const a = await Account.create({ user, name: 'A', openingBalance: 1000 });
  const b = await Account.create({ user, name: 'B', openingBalance: 0 });

  await Expense.create([
    { amount: 300, date: '2026-09-01', category: cat, user, type: 'expense', account: a._id },
    { amount: 500, date: '2026-09-02', category: cat, user, type: 'income',  account: a._id },
    { amount: 50,  date: '2026-09-03', category: cat, user, type: 'expense', account: b._id },
  ]);
  await Transfer.create([
    { user, fromAccount: a._id, toAccount: b._id, amount: 200, date: '2026-09-04' },
  ]);

  const balances = await computeAccountBalances(user);
  // A: 1000 + 500 - 300 - 200 = 1000
  assert.equal(balances.get(String(a._id)), 1000);
  // B: 0 - 50 + 200 = 150
  assert.equal(balances.get(String(b._id)), 150);
});

test('account with no activity returns its opening balance', async () => {
  const user = new mongoose.Types.ObjectId();
  const a = await Account.create({ user, name: 'Solo', openingBalance: 42 });
  const balances = await computeAccountBalances(user);
  assert.equal(balances.get(String(a._id)), 42);
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

```js
// server/src/utils/accountBalances.js
import mongoose from 'mongoose';
import { Account } from '../config/models/Account.js';
import { Expense } from '../config/models/Expense.js';
import { Transfer } from '../config/models/Transfer.js';

export async function computeAccountBalances(userId) {
  const uid = new mongoose.Types.ObjectId(userId);

  const accounts = await Account.find({ user: uid }).select('_id openingBalance').lean();
  const balances = new Map(accounts.map((a) => [String(a._id), a.openingBalance || 0]));

  const expenseAgg = await Expense.aggregate([
    { $match: { user: uid, account: { $ne: null } } },
    { $group: { _id: { account: '$account', type: '$type' }, total: { $sum: '$amount' } } },
  ]);
  for (const row of expenseAgg) {
    const key = String(row._id.account);
    if (!balances.has(key)) continue;
    const sign = row._id.type === 'income' ? 1 : -1;
    balances.set(key, balances.get(key) + sign * row.total);
  }

  const transferAgg = await Transfer.aggregate([
    { $match: { user: uid } },
    {
      $facet: {
        out: [{ $group: { _id: '$fromAccount', total: { $sum: '$amount' } } }],
        in: [{ $group: { _id: '$toAccount', total: { $sum: '$amount' } } }],
      },
    },
  ]);
  const { out = [], in: inn = [] } = transferAgg[0] || {};
  for (const row of out) {
    const key = String(row._id);
    if (balances.has(key)) balances.set(key, balances.get(key) - row.total);
  }
  for (const row of inn) {
    const key = String(row._id);
    if (balances.has(key)) balances.set(key, balances.get(key) + row.total);
  }

  return balances;
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add server/src/utils/accountBalances.js server/test/accountBalances.test.mjs
git commit -m "Add computeAccountBalances util

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Account CRUD controller + routes

**Files:**
- Create: `server/src/controllers/accountController.js`
- Create: `server/src/routes/accounts.js`
- Modify: `server/src/app.js`
- Create: `server/test/accountApi.test.mjs`

**Interfaces:**
- Produces: `listAccounts`, `createAccount`, `updateAccount`, `deleteAccount` (reconcile + statement are Tasks 8–9). `GET /api/accounts` returns `{ accounts: [...withBalance], totalBalance }`. Router mounted at `/api/accounts` with `authenticateToken`.

- [ ] **Step 1: Write the failing test**

```js
// server/test/accountApi.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Account } from '../src/config/models/Account.js';
import { Expense } from '../src/config/models/Expense.js';
import { listAccounts, createAccount, updateAccount, deleteAccount } from '../src/controllers/accountController.js';
import accountRoutes from '../src/routes/accounts.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

function mockRes() {
  return { statusCode: 200, body: null, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} };
}
const user = () => new mongoose.Types.ObjectId();

test('createAccount then listAccounts returns computed balance', async () => {
  const u = user();
  let res = mockRes();
  await createAccount({ user: { _id: u }, body: { name: 'Bank', type: 'bank', openingBalance: 500 } }, res);
  assert.equal(res.statusCode, 201);
  const accId = res.body.data.account._id;

  await Expense.create({ amount: 100, date: '2026-09-10', category: user(), user: u, type: 'expense', account: accId });

  res = mockRes();
  await listAccounts({ user: { _id: u }, query: {} }, res);
  const acc = res.body.data.accounts.find((a) => String(a._id) === String(accId));
  assert.equal(acc.balance, 400);
  assert.equal(res.body.data.totalBalance, 400);
});

test('deleteAccount 403 when it has expenses', async () => {
  const u = user();
  const acc = await Account.create({ user: u, name: 'Has txns' });
  await Expense.create({ amount: 1, date: '2026-09-10', category: user(), user: u, account: acc._id });
  const res = mockRes();
  await deleteAccount({ user: { _id: u }, params: { id: String(acc._id) } }, res);
  assert.equal(res.statusCode, 403);
});

test('deleteAccount 403 for the default account', async () => {
  const u = user();
  const acc = await Account.create({ user: u, name: 'Cash', isDefault: true });
  const res = mockRes();
  await deleteAccount({ user: { _id: u }, params: { id: String(acc._id) } }, res);
  assert.equal(res.statusCode, 403);
});

test('updateAccount can archive a non-default empty account', async () => {
  const u = user();
  const acc = await Account.create({ user: u, name: 'Old' });
  const res = mockRes();
  await updateAccount({ user: { _id: u }, params: { id: String(acc._id) }, body: { archived: true } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.account.archived, true);
});

test('listAccounts hides archived unless includeArchived=true', async () => {
  const u = user();
  await Account.create({ user: u, name: 'Live' });
  await Account.create({ user: u, name: 'Gone', archived: true });
  let res = mockRes();
  await listAccounts({ user: { _id: u }, query: {} }, res);
  assert.equal(res.body.data.accounts.length, 1);
  res = mockRes();
  await listAccounts({ user: { _id: u }, query: { includeArchived: 'true' } }, res);
  assert.equal(res.body.data.accounts.length, 2);
});

test('accountRoutes registers the CRUD verbs', () => {
  const paths = accountRoutes.stack.filter((l) => l.route).map((l) => `${Object.keys(l.route.methods)[0].toUpperCase()} ${l.route.path}`);
  assert.ok(paths.includes('GET /'));
  assert.ok(paths.includes('POST /'));
  assert.ok(paths.includes('PUT /:id'));
  assert.ok(paths.includes('DELETE /:id'));
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement the controller**

```js
// server/src/controllers/accountController.js
import { Account, Expense, Transfer } from '../config/models/index.js';
import { computeAccountBalances } from '../utils/accountBalances.js';

export const listAccounts = async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const filter = { user: req.user._id };
    if (!includeArchived) filter.archived = false;

    const [accounts, balances] = await Promise.all([
      Account.find(filter).sort({ isDefault: -1, createdAt: 1 }).lean(),
      computeAccountBalances(req.user._id),
    ]);

    const withBalance = accounts.map((a) => ({ ...a, balance: balances.get(String(a._id)) ?? (a.openingBalance || 0) }));
    const totalBalance = withBalance
      .filter((a) => !a.archived)
      .reduce((s, a) => s + a.balance, 0);

    res.json({ success: true, data: { accounts: withBalance, totalBalance } });
  } catch (error) {
    console.error('List accounts error:', error);
    res.status(500).json({ success: false, message: 'Failed to list accounts', error: error.message });
  }
};

export const createAccount = async (req, res) => {
  try {
    const { name, type, openingBalance, currency } = req.body;
    const account = await Account.create({
      user: req.user._id,
      name,
      type: type || 'cash',
      openingBalance: typeof openingBalance === 'number' ? openingBalance : 0,
      currency: currency || req.user.currency || 'USD',
    });
    res.status(201).json({ success: true, message: 'Account created', data: { account } });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ success: false, message: 'Failed to create account', error: error.message });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const { name, type, openingBalance, currency, archived } = req.body;
    if (name !== undefined) account.name = name;
    if (type !== undefined) account.type = type;
    if (openingBalance !== undefined) account.openingBalance = openingBalance;
    if (currency !== undefined) account.currency = currency;

    if (archived === true) {
      if (account.isDefault) {
        return res.status(400).json({ success: false, message: 'The default account cannot be archived' });
      }
      account.archived = true;
    } else if (archived === false) {
      account.archived = false;
    }

    await account.save();
    res.json({ success: true, message: 'Account updated', data: { account } });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ success: false, message: 'Failed to update account', error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    if (account.isDefault) {
      return res.status(403).json({ success: false, message: 'The default account cannot be deleted' });
    }
    const [expCount, tfCount] = await Promise.all([
      Expense.countDocuments({ user: req.user._id, account: account._id }),
      Transfer.countDocuments({ user: req.user._id, $or: [{ fromAccount: account._id }, { toAccount: account._id }] }),
    ]);
    if (expCount > 0 || tfCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'This account has transactions. Archive it instead of deleting.',
      });
    }
    await account.deleteOne();
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account', error: error.message });
  }
};
```

- [ ] **Step 4: Implement the router**

```js
// server/src/routes/accounts.js
import express from 'express';
import { listAccounts, createAccount, updateAccount, deleteAccount } from '../controllers/accountController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, accountSchema } from '../middleware/validation.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', listAccounts);
router.post('/', validate(accountSchema), createAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;
```

- [ ] **Step 5: Mount in `app.js`**

Add the import next to the other route imports and `app.use('/api/accounts', accountRoutes)` next to the others.

- [ ] **Step 6: Run — expect PASS**

Run: `cd server && node --test test/accountApi.test.mjs`

- [ ] **Step 7: Commit**

```bash
git add server/src/controllers/accountController.js server/src/routes/accounts.js server/src/app.js server/test/accountApi.test.mjs
git commit -m "Add account CRUD (list-with-balance, create, archive, guarded delete)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: `account` on expense create/update/bulk + filters

**Files:**
- Modify: `server/src/controllers/expenseController.js`
- Create: `server/test/expenseAccountPersist.test.mjs`

**Interfaces:**
- Produces: `createExpense` reads `account` from body; if absent, resolves the user's default account id; verifies ownership; writes it on single + recurring occurrences. `bulkCreateExpenses` writes per-row `account` (falling back to default). `updateExpense` sets `account` when present. `getExpenses` + `getDetailedAnalytics` add `filter.account` when `account` query param is a valid id and not `'all'`.

- [ ] **Step 1: Write the failing test**

```js
// server/test/expenseAccountPersist.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { Category } from '../src/config/models/Category.js';
import { Account } from '../src/config/models/Account.js';
import { createExpense, getExpenses } from '../src/controllers/expenseController.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

function mockRes() { return { statusCode: 200, body: null, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} }; }

async function seed(u) {
  const cat = await Category.create({ name: 'Food', user: u });
  const def = await Account.create({ user: u, name: 'Cash', isDefault: true });
  const bank = await Account.create({ user: u, name: 'Bank' });
  return { cat, def, bank };
}

test('createExpense persists an explicit account', async () => {
  const u = new mongoose.Types.ObjectId();
  const { cat, bank } = await seed(u);
  const res = mockRes();
  await createExpense({ user: { _id: u }, body: { amount: 10, date: '2026-09-10', category: String(cat._id), account: String(bank._id) } }, res);
  const saved = await Expense.findOne({ user: u });
  assert.equal(String(saved.account), String(bank._id));
});

test('createExpense falls back to the default account when account omitted', async () => {
  const u = new mongoose.Types.ObjectId();
  const { cat, def } = await seed(u);
  const res = mockRes();
  await createExpense({ user: { _id: u }, body: { amount: 10, date: '2026-09-10', category: String(cat._id) } }, res);
  const saved = await Expense.findOne({ user: u });
  assert.equal(String(saved.account), String(def._id));
});

test('createExpense rejects an account not owned by the user', async () => {
  const u = new mongoose.Types.ObjectId();
  const { cat } = await seed(u);
  const foreign = await Account.create({ user: new mongoose.Types.ObjectId(), name: 'Someone else' });
  const res = mockRes();
  await createExpense({ user: { _id: u }, body: { amount: 10, date: '2026-09-10', category: String(cat._id), account: String(foreign._id) } }, res);
  assert.equal(res.statusCode, 400);
});

test('getExpenses filters by account', async () => {
  const u = new mongoose.Types.ObjectId();
  const { cat, def, bank } = await seed(u);
  await Expense.create([
    { amount: 1, date: '2026-09-10', category: cat._id, user: u, account: def._id },
    { amount: 2, date: '2026-09-10', category: cat._id, user: u, account: bank._id },
  ]);
  const res = mockRes();
  await getExpenses({ user: { _id: u }, query: { account: String(bank._id) } }, res);
  const list = res.body.data.expenses;
  assert.equal(list.length, 1);
  assert.equal(list[0].amount, 2);
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Update `createExpense`**

Add the import near the top:

```js
import { Account } from '../config/models/index.js';
```

In `createExpense`, add `account` to the destructure. After the category-ownership check, add:

```js
    let accountId = account || null;
    if (accountId) {
      const owned = await Account.findOne({ _id: accountId, user: req.user._id });
      if (!owned) {
        return res.status(400).json({ success: false, message: 'Invalid account' });
      }
    } else {
      const def = await Account.findOne({ user: req.user._id, isDefault: true });
      accountId = def ? def._id : null;
    }
```

Add `account: accountId,` to the recurring `occurrences.push({...})` object and to the single `new Expense({...})` object.

- [ ] **Step 4: Update `bulkCreateExpenses`**

Resolve the default once at the top of the handler:

```js
    const defaultAccount = await Account.findOne({ user: req.user._id, isDefault: true });
```

In the `validExpenses.push({...})`, add:

```js
      account: expense.account || (defaultAccount ? defaultAccount._id : null),
```

- [ ] **Step 5: Update `updateExpense`**

Add `account` to the destructure. After the category-check block, add:

```js
    if (account !== undefined) {
      if (account) {
        const owned = await Account.findOne({ _id: account, user: req.user._id });
        if (!owned) return res.status(400).json({ success: false, message: 'Invalid account' });
      }
      updates.account = account || null;
    }
```

- [ ] **Step 6: Update `getExpenses` + `getDetailedAnalytics` filters**

In each, where `category` is read from `req.query` and applied to `filter`, add alongside:

```js
    if (req.query.account && req.query.account !== 'all') {
      try {
        filter.account = new mongoose.Types.ObjectId(req.query.account);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid account identifier' });
      }
    }
```

- [ ] **Step 7: Run — expect PASS**

Run: `cd server && node --test test/expenseAccountPersist.test.mjs`

- [ ] **Step 8: Commit**

```bash
git add server/src/controllers/expenseController.js server/test/expenseAccountPersist.test.mjs
git commit -m "Persist expense.account (single/recurring/bulk/update) + account filter

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Transfer CRUD + sync

**Files:**
- Create: `server/src/controllers/transferController.js`
- Create: `server/src/routes/transfers.js`
- Modify: `server/src/app.js`
- Create: `server/test/transferApi.test.mjs`

**Interfaces:**
- Produces: `listTransfers`, `createTransfer` (400 on same-account or currency mismatch), `updateTransfer` (date/note only), `deleteTransfer`, `syncTransfers` (mirrors `syncExpenses`). Router at `/api/transfers`.

- [ ] **Step 1: Write the failing test**

```js
// server/test/transferApi.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Account } from '../src/config/models/Account.js';
import { Transfer } from '../src/config/models/Transfer.js';
import { createTransfer, listTransfers, syncTransfers } from '../src/controllers/transferController.js';
import transferRoutes from '../src/routes/transfers.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

function mockRes() { return { statusCode: 200, body: null, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} }; }

async function twoAccounts(u, curA = 'INR', curB = 'INR') {
  const a = await Account.create({ user: u, name: 'A', currency: curA });
  const b = await Account.create({ user: u, name: 'B', currency: curB });
  return { a, b };
}

test('createTransfer succeeds for same-currency distinct accounts', async () => {
  const u = new mongoose.Types.ObjectId();
  const { a, b } = await twoAccounts(u);
  const res = mockRes();
  await createTransfer({ user: { _id: u }, body: { fromAccount: String(a._id), toAccount: String(b._id), amount: 250, date: '2026-09-10' } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(await Transfer.countDocuments({ user: u }), 1);
});

test('createTransfer 400 on same account', async () => {
  const u = new mongoose.Types.ObjectId();
  const { a } = await twoAccounts(u);
  const res = mockRes();
  await createTransfer({ user: { _id: u }, body: { fromAccount: String(a._id), toAccount: String(a._id), amount: 10, date: '2026-09-10' } }, res);
  assert.equal(res.statusCode, 400);
});

test('createTransfer 400 on currency mismatch', async () => {
  const u = new mongoose.Types.ObjectId();
  const { a, b } = await twoAccounts(u, 'INR', 'USD');
  const res = mockRes();
  await createTransfer({ user: { _id: u }, body: { fromAccount: String(a._id), toAccount: String(b._id), amount: 10, date: '2026-09-10' } }, res);
  assert.equal(res.statusCode, 400);
});

test('syncTransfers dedupes by client_uuid', async () => {
  const u = new mongoose.Types.ObjectId();
  const { a, b } = await twoAccounts(u);
  const body = { transfers: [{ client_uuid: 't-1', fromAccount: String(a._id), toAccount: String(b._id), amount: 30, date: '2026-09-10' }] };
  let res = mockRes();
  await syncTransfers({ user: { _id: u }, body }, res);
  res = mockRes();
  await syncTransfers({ user: { _id: u }, body }, res);
  assert.equal(await Transfer.countDocuments({ user: u, client_uuid: 't-1' }), 1);
});

test('transferRoutes registers verbs', () => {
  const has = (m, p) => transferRoutes.stack.some((l) => l.route && l.route.path === p && l.route.methods[m]);
  assert.ok(has('get', '/'));
  assert.ok(has('post', '/'));
  assert.ok(has('post', '/sync'));
  assert.ok(has('delete', '/:id'));
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement the controller**

```js
// server/src/controllers/transferController.js
import { Account, Transfer } from '../config/models/index.js';

async function validatePair(userId, fromId, toId) {
  if (String(fromId) === String(toId)) return { error: 'Cannot transfer to the same account' };
  const [from, to] = await Promise.all([
    Account.findOne({ _id: fromId, user: userId }),
    Account.findOne({ _id: toId, user: userId }),
  ]);
  if (!from || !to) return { error: 'Invalid account' };
  if (from.currency !== to.currency) return { error: 'Transfer accounts must use the same currency' };
  return { from, to };
}

export const listTransfers = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    const { from, to } = req.query;
    if (from && to) filter.date = { $gte: from, $lte: to };
    const transfers = await Transfer.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .populate('fromAccount toAccount', 'name type currency')
      .lean();
    res.json({ success: true, data: { transfers } });
  } catch (error) {
    console.error('List transfers error:', error);
    res.status(500).json({ success: false, message: 'Failed to list transfers', error: error.message });
  }
};

export const createTransfer = async (req, res) => {
  try {
    const { fromAccount, toAccount, amount, date, note } = req.body;
    const v = await validatePair(req.user._id, fromAccount, toAccount);
    if (v.error) return res.status(400).json({ success: false, message: v.error });

    const transfer = await Transfer.create({
      user: req.user._id, fromAccount, toAccount, amount: parseFloat(amount), date, note: note ? note.trim() : undefined,
    });
    await transfer.populate('fromAccount toAccount', 'name type currency');
    res.status(201).json({ success: true, message: 'Transfer created', data: { transfer } });
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ success: false, message: 'Failed to create transfer', error: error.message });
  }
};

export const updateTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findOne({ _id: req.params.id, user: req.user._id });
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    const { date, note } = req.body;
    if (date !== undefined) transfer.date = date;
    if (note !== undefined) transfer.note = note ? note.trim() : undefined;
    await transfer.save();
    res.json({ success: true, message: 'Transfer updated', data: { transfer } });
  } catch (error) {
    console.error('Update transfer error:', error);
    res.status(500).json({ success: false, message: 'Failed to update transfer', error: error.message });
  }
};

export const deleteTransfer = async (req, res) => {
  try {
    const t = await Transfer.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!t) return res.status(404).json({ success: false, message: 'Transfer not found' });
    res.json({ success: true, message: 'Transfer deleted' });
  } catch (error) {
    console.error('Delete transfer error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete transfer', error: error.message });
  }
};

export const syncTransfers = async (req, res) => {
  try {
    const { transfers } = req.body;
    if (!Array.isArray(transfers)) {
      return res.status(400).json({ success: false, message: 'Expected an array of transfers.' });
    }
    const results = await Promise.all(transfers.map(async (data) => {
      try {
        const { client_uuid } = data;
        if (!client_uuid) return { client_uuid: null, status: 'FAILED', error: 'Missing client_uuid' };
        const existing = await Transfer.findOne({ client_uuid, user: req.user._id });
        if (existing) return { client_uuid, server_id: existing._id, status: 'SYNCED', action: 'EXISTING' };

        const v = await validatePair(req.user._id, data.fromAccount, data.toAccount);
        if (v.error) return { client_uuid, status: 'FAILED', error: v.error };

        const created = await Transfer.create({
          user: req.user._id,
          fromAccount: data.fromAccount,
          toAccount: data.toAccount,
          amount: parseFloat(data.amount),
          date: data.date,
          note: data.note,
          client_uuid,
        });
        return { client_uuid, server_id: created._id, status: 'SYNCED', action: 'CREATED' };
      } catch (err) {
        return { client_uuid: data.client_uuid, status: 'FAILED', error: err.message };
      }
    }));
    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Sync transfers error:', error);
    res.status(500).json({ success: false, message: 'Server error during transfer sync' });
  }
};
```

- [ ] **Step 4: Router + mount**

```js
// server/src/routes/transfers.js
import express from 'express';
import { listTransfers, createTransfer, updateTransfer, deleteTransfer, syncTransfers } from '../controllers/transferController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, transferSchema } from '../middleware/validation.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', listTransfers);
router.post('/sync', syncTransfers);
router.post('/', validate(transferSchema), createTransfer);
router.put('/:id', updateTransfer);
router.delete('/:id', deleteTransfer);

export default router;
```

Mount `app.use('/api/transfers', transferRoutes)` in `app.js`.

- [ ] **Step 5: Run — expect PASS**

Run: `cd server && node --test test/transferApi.test.mjs`

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/transferController.js server/src/routes/transfers.js server/src/app.js server/test/transferApi.test.mjs
git commit -m "Add transfer CRUD + offline sync (same-currency, distinct-account guards)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Reconcile + statement endpoints

**Files:**
- Modify: `server/src/controllers/accountController.js` — `reconcileAccount`, `accountStatement`
- Modify: `server/src/routes/accounts.js`
- Create: `server/test/accountReconcileStatement.test.mjs`

**Interfaces:**
- Produces:
  - `POST /api/accounts/:id/reconcile` body `{ targetBalance }` → computes `current` via `computeAccountBalances`, `delta = target − current`; `delta === 0` → `{ adjusted: false }`; else creates an `Expense` (`isAdjustment: true`, `type` per sign, `amount: |delta|`, `category`: the user's Adjustment category, `account`: this account) → `{ adjusted: true, delta, expense }`.
  - `GET /api/accounts/:id/statement?from&to` → `{ entries: [{ kind, date, amount, description?, note?, counterparty? }] }` merging this account's expenses/income and transfers touching it, sorted by `date` asc then `createdAt`.

- [ ] **Step 1: Write the failing test**

```js
// server/test/accountReconcileStatement.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Account } from '../src/config/models/Account.js';
import { Category } from '../src/config/models/Category.js';
import { Expense } from '../src/config/models/Expense.js';
import { Transfer } from '../src/config/models/Transfer.js';
import { reconcileAccount, accountStatement } from '../src/controllers/accountController.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

function mockRes() { return { statusCode: 200, body: null, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} }; }

test('reconcile creates an income adjustment when target is higher', async () => {
  const u = new mongoose.Types.ObjectId();
  await Category.create({ user: u, name: 'Adjustment', isDefault: true });
  const acc = await Account.create({ user: u, name: 'Cash', openingBalance: 100 });
  const res = mockRes();
  await reconcileAccount({ user: { _id: u }, params: { id: String(acc._id) }, body: { targetBalance: 250 } }, res);
  assert.equal(res.body.data.adjusted, true);
  assert.equal(res.body.data.delta, 150);
  const adj = await Expense.findOne({ user: u, isAdjustment: true });
  assert.equal(adj.type, 'income');
  assert.equal(adj.amount, 150);
  assert.equal(String(adj.account), String(acc._id));
});

test('reconcile with equal target creates no row', async () => {
  const u = new mongoose.Types.ObjectId();
  await Category.create({ user: u, name: 'Adjustment', isDefault: true });
  const acc = await Account.create({ user: u, name: 'Cash', openingBalance: 100 });
  const res = mockRes();
  await reconcileAccount({ user: { _id: u }, params: { id: String(acc._id) }, body: { targetBalance: 100 } }, res);
  assert.equal(res.body.data.adjusted, false);
  assert.equal(await Expense.countDocuments({ user: u }), 0);
});

test('statement merges expenses and transfers for the account, sorted by date', async () => {
  const u = new mongoose.Types.ObjectId();
  const cat = await Category.create({ user: u, name: 'Food' });
  const a = await Account.create({ user: u, name: 'A' });
  const b = await Account.create({ user: u, name: 'B' });
  await Expense.create({ user: u, amount: 40, date: '2026-09-02', category: cat._id, account: a._id, type: 'expense' });
  await Transfer.create({ user: u, fromAccount: a._id, toAccount: b._id, amount: 100, date: '2026-09-01' });
  await Transfer.create({ user: u, fromAccount: b._id, toAccount: a._id, amount: 30, date: '2026-09-03' });

  const res = mockRes();
  await accountStatement({ user: { _id: u }, params: { id: String(a._id) }, query: {} }, res);
  const entries = res.body.data.entries;
  assert.deepEqual(entries.map((e) => e.date), ['2026-09-01', '2026-09-02', '2026-09-03']);
  assert.deepEqual(entries.map((e) => e.kind), ['transfer-out', 'expense', 'transfer-in']);
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

Append to `server/src/controllers/accountController.js` (add `Category` to the model import):

```js
import { Account, Expense, Transfer, Category } from '../config/models/index.js';
// ... existing exports ...

export const reconcileAccount = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const { targetBalance } = req.body;
    if (typeof targetBalance !== 'number' || Number.isNaN(targetBalance)) {
      return res.status(400).json({ success: false, message: 'targetBalance must be a number' });
    }

    const balances = await computeAccountBalances(req.user._id);
    const current = balances.get(String(account._id)) ?? (account.openingBalance || 0);
    const delta = Math.round((targetBalance - current) * 100) / 100;

    if (delta === 0) {
      return res.json({ success: true, data: { adjusted: false, delta: 0 } });
    }

    let adjCat = await Category.findOne({ user: req.user._id, name: 'Adjustment' });
    if (!adjCat) {
      adjCat = await Category.create({ user: req.user._id, name: 'Adjustment', color: '#64748B', icon: '⚖️', isDefault: true });
    }

    const expense = await Expense.create({
      user: req.user._id,
      account: account._id,
      category: adjCat._id,
      amount: Math.abs(delta),
      type: delta > 0 ? 'income' : 'expense',
      date: new Date().toISOString().slice(0, 10),
      description: 'Balance adjustment',
      notes: `Reconciled to ${targetBalance}`,
      isAdjustment: true,
    });

    res.json({ success: true, data: { adjusted: true, delta, expense } });
  } catch (error) {
    console.error('Reconcile account error:', error);
    res.status(500).json({ success: false, message: 'Failed to reconcile account', error: error.message });
  }
};

export const accountStatement = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const { from, to } = req.query;
    const dateRange = from && to ? { $gte: from, $lte: to } : undefined;

    const expFilter = { user: req.user._id, account: account._id };
    if (dateRange) expFilter.date = dateRange;
    const tfFilter = { user: req.user._id, $or: [{ fromAccount: account._id }, { toAccount: account._id }] };
    if (dateRange) tfFilter.date = dateRange;

    const [expenses, transfers] = await Promise.all([
      Expense.find(expFilter).populate('category', 'name icon color').lean(),
      Transfer.find(tfFilter).populate('fromAccount toAccount', 'name').lean(),
    ]);

    const entries = [
      ...expenses.map((e) => ({
        kind: e.type === 'income' ? 'income' : 'expense',
        date: e.date,
        amount: e.amount,
        description: e.description || e.category?.name || '',
        _id: e._id,
        createdAt: e.createdAt,
      })),
      ...transfers.map((t) => {
        const outgoing = String(t.fromAccount._id) === String(account._id);
        return {
          kind: outgoing ? 'transfer-out' : 'transfer-in',
          date: t.date,
          amount: t.amount,
          counterparty: outgoing ? t.toAccount?.name : t.fromAccount?.name,
          note: t.note || '',
          _id: t._id,
          createdAt: t.createdAt,
        };
      }),
    ].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : new Date(a.createdAt) - new Date(b.createdAt)));

    res.json({ success: true, data: { entries } });
  } catch (error) {
    console.error('Account statement error:', error);
    res.status(500).json({ success: false, message: 'Failed to build statement', error: error.message });
  }
};
```

- [ ] **Step 4: Routes**

In `server/src/routes/accounts.js` add:

```js
import { listAccounts, createAccount, updateAccount, deleteAccount, reconcileAccount, accountStatement } from '../controllers/accountController.js';
// ...
router.post('/:id/reconcile', reconcileAccount);
router.get('/:id/statement', accountStatement);
```

- [ ] **Step 5: Run — expect PASS**

Run: `cd server && node --test test/accountReconcileStatement.test.mjs`

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/accountController.js server/src/routes/accounts.js server/test/accountReconcileStatement.test.mjs
git commit -m "Add account reconcile (adjustment expense) + statement endpoints

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: Sync pass-through assertion for `account`

**Files:**
- Modify: `server/src/controllers/syncController.js` (only if it has an explicit field list)
- Create: `server/test/syncAccount.test.mjs`

**Interfaces:**
- Produces: `syncExpenses` persists `account` from the synced payload (it spreads `...data` — assert).

- [ ] **Step 1: Write the failing test**

```js
// server/test/syncAccount.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { Account } from '../src/config/models/Account.js';
import { syncExpenses } from '../src/controllers/syncController.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

function mockRes() { return { statusCode: 200, body: null, status(c){this.statusCode=c;return this;}, json(b){this.body=b;return this;} }; }

test('syncExpenses persists account from the payload', async () => {
  const u = new mongoose.Types.ObjectId();
  const acc = await Account.create({ user: u, name: 'Cash' });
  const req = { user: { _id: u }, body: { expenses: [
    { client_uuid: 'sa-1', amount: 9, date: '2026-09-10', category: String(new mongoose.Types.ObjectId()), type: 'expense', account: String(acc._id) },
  ] } };
  const res = mockRes();
  await syncExpenses(req, res);
  const saved = await Expense.findOne({ client_uuid: 'sa-1' });
  assert.equal(String(saved.account), String(acc._id));
});
```

- [ ] **Step 2: Run — expect PASS (or FAIL if syncController has a field whitelist)**

Run: `cd server && node --test test/syncAccount.test.mjs`
If FAIL: `syncController.js` builds the doc from named fields — add `account: data.account`. As of 2026-09-10 it spreads `...data`, so this should PASS with no code change.

- [ ] **Step 3: Commit (only if a change was made)**

```bash
git add server/src/controllers/syncController.js server/test/syncAccount.test.mjs
git commit -m "Assert account passes through expense sync

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

If no code change: `git add server/test/syncAccount.test.mjs` and commit just the test.

---

## Task 11: Migration script + idempotency test

**Files:**
- Create: `server/scripts/migrate-accounts.mjs`
- Create: `server/test/migrateAccounts.test.mjs`

**Interfaces:**
- Produces: a runnable migration that (1) seeds a default account per user without one, (2) seeds an Adjustment category per user without one, (3) backfills `account` on `null`-account expenses with that user's default account id. Idempotent. Exports `runMigration()` for the test.

- [ ] **Step 1: Write the failing test**

```js
// server/test/migrateAccounts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { User } from '../src/config/models/User.js';
import { Account } from '../src/config/models/Account.js';
import { Category } from '../src/config/models/Category.js';
import { Expense } from '../src/config/models/Expense.js';
import { runMigration } from '../scripts/migrate-accounts.mjs';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

test('migration seeds defaults and backfills expense.account, idempotently', async () => {
  const user = await User.create({ name: 'Legacy', email: 'legacy@example.com', password: 'secret123', currency: 'INR' });
  const cat = await Category.create({ user: user._id, name: 'Food' });
  await Expense.create({ user: user._id, amount: 10, date: '2026-09-01', category: cat._id }); // account: null

  await runMigration();

  const def = await Account.findOne({ user: user._id, isDefault: true });
  assert.ok(def, 'default account created');
  assert.equal(def.currency, 'INR');
  assert.ok(await Category.findOne({ user: user._id, name: 'Adjustment' }));
  const exp = await Expense.findOne({ user: user._id });
  assert.equal(String(exp.account), String(def._id));

  // run again — nothing new
  await runMigration();
  assert.equal(await Account.countDocuments({ user: user._id }), 1);
  assert.equal(await Category.countDocuments({ user: user._id, name: 'Adjustment' }), 1);
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

```js
// server/scripts/migrate-accounts.mjs
// Idempotent. Seeds a default account + Adjustment category per user and
// backfills Expense.account for legacy rows.
//
// Run:   cd server && node scripts/migrate-accounts.mjs
// Env:   MONGO_URI (falls back to the app's configured connection if imported)
//
// Reverse (manual, not scripted):
//   Account.deleteMany({}); Transfer.deleteMany({});
//   Expense.updateMany({}, { $unset: { account: '', isAdjustment: '' } });
//   Category.deleteMany({ name: 'Adjustment', isDefault: true });

import mongoose from 'mongoose';
import { User } from '../src/config/models/User.js';
import { Account } from '../src/config/models/Account.js';
import { Expense } from '../src/config/models/Expense.js';
import { seedDefaultAccountAndAdjustmentCategory } from '../src/utils/seedDefaults.js';

export async function runMigration() {
  const users = await User.find({}).select('_id currency').lean();
  let seeded = 0;
  let backfilled = 0;

  for (const user of users) {
    const { account } = await seedDefaultAccountAndAdjustmentCategory(user._id, user.currency || 'USD');
    seeded += 1;

    const r = await Expense.updateMany(
      { user: user._id, $or: [{ account: null }, { account: { $exists: false } }] },
      { $set: { account: account._id } }
    );
    backfilled += r.modifiedCount || 0;
  }

  return { users: users.length, seeded, backfilled };
}

// Direct-run guard
if (import.meta.url === `file://${process.argv[1]}`) {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense_tracker';
  await mongoose.connect(uri);
  const summary = await runMigration();
  console.log('Migration complete:', summary);
  await mongoose.disconnect();
  process.exit(0);
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `cd server && node --test test/migrateAccounts.test.mjs`

- [ ] **Step 5: Full suite**

Run: `cd server && npm test`
Expected: every test file passes (F1 + F2 + F3 + all F4A files).

- [ ] **Step 6: Commit**

```bash
git add server/scripts/migrate-accounts.mjs server/test/migrateAccounts.test.mjs
git commit -m "Add idempotent accounts migration script

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 12: Live smoke + regression sweep + run the migration

**Files:**
- Create: `server/scripts/smoke-accounts.mjs`

- [ ] **Step 1: Write the smoke script**

```js
// server/scripts/smoke-accounts.mjs
// Usage: BASE=http://localhost:5000 TOKEN=<jwt> CATEGORY=<catId> node scripts/smoke-accounts.mjs
const BASE = process.env.BASE || 'http://localhost:5000';
const TOKEN = process.env.TOKEN;
const CATEGORY = process.env.CATEGORY;
if (!TOKEN || !CATEGORY) { console.error('Set TOKEN and CATEGORY'); process.exit(1); }
const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` };
const j = async (m, p, b) => {
  const r = await fetch(`${BASE}/api${p}`, { method: m, headers: h, body: b ? JSON.stringify(b) : undefined });
  return { status: r.status, data: await r.json() };
};
const today = new Date().toISOString().slice(0, 10);

let r = await j('GET', '/accounts');
console.assert(r.status === 200 && Array.isArray(r.data.data.accounts), 'list accounts', r.status);
let def = r.data.data.accounts.find((a) => a.isDefault);
console.assert(def, 'default account exists (migration/seed ran)');

r = await j('POST', '/accounts', { name: 'Smoke Bank', type: 'bank', openingBalance: 1000, currency: def.currency });
console.assert(r.status === 201, 'create account', r.status);
const bank = r.data.data.account._id;

r = await j('POST', '/expenses', { amount: 200, date: today, category: CATEGORY, account: bank });
console.assert(r.status === 201 && r.data.data.expense.account === bank, 'expense on account', r.data.data.expense.account);

r = await j('POST', '/transfers', { fromAccount: bank, toAccount: def._id, amount: 300, date: today });
console.assert(r.status === 201, 'transfer', r.status, r.data);

r = await j('GET', '/accounts');
const bankBal = r.data.data.accounts.find((a) => String(a._id) === String(bank)).balance;
console.assert(bankBal === 500, 'bank balance 1000 - 200 - 300 = 500', bankBal);

r = await j('POST', `/accounts/${bank}/reconcile`, { targetBalance: 500 });
console.assert(r.data.data.adjusted === false, 'reconcile no-op on equal', r.data.data);

r = await j('POST', `/accounts/${bank}/reconcile`, { targetBalance: 600 });
console.assert(r.data.data.adjusted === true && r.data.data.delta === 100, 'reconcile +100', r.data.data);

r = await j('GET', `/accounts/${bank}/statement`);
console.assert(Array.isArray(r.data.data.entries), 'statement entries', r.data.data);
console.log('statement kinds:', r.data.data.entries.map((e) => e.kind).join(', '));

r = await j('DELETE', `/accounts/${bank}`);
console.assert(r.status === 403, 'delete blocked (has txns)', r.status);

console.log('\nSMOKE OK');
```

- [ ] **Step 2: Automated suite** — `cd server && npm test` → green.

- [ ] **Step 3: Run the smoke (manual)** — start `npm run dev`, get a JWT + a category id (any of the user's), then `BASE=... TOKEN=... CATEGORY=... node scripts/smoke-accounts.mjs` → `SMOKE OK`.

- [ ] **Step 4: Regression sweep (manual)**
- Register a brand-new user via the app → they get 10 categories + "Adjustment" + a "Cash" default account.
- Existing endpoints (`GET /api/expenses`, analytics, debts) behave unchanged.
- Create an expense with no `account` in the body → it gets the default account id.

- [ ] **Step 5: Run the migration against the target DB (manual, one-time)**

This is a real operation. Back up first. Then:

Run: `cd server && MONGO_URI="<target connection string>" node scripts/migrate-accounts.mjs`
Expected: prints `Migration complete: { users: N, seeded: N, backfilled: M }`. Re-run once → `backfilled: 0`.

- [ ] **Step 6: Commit**

```bash
git add server/scripts/smoke-accounts.mjs
git commit -m "Add accounts live smoke script

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage**

| Spec item | Task |
|---|---|
| `Account` model (types, currency, one-default index, archived) | Task 1 |
| `Transfer` model (distinct accounts, min amount, sync uuid) | Task 2 |
| `Expense.account` + `isAdjustment` + index; Zod `account`, `accountSchema`, `transferSchema` | Task 3 |
| Registration seeds Cash account + Adjustment category (idempotent util) | Task 4 |
| `computeAccountBalances` formula | Task 5 |
| `GET /api/accounts` with `balance` + `totalBalance`; CRUD; guarded delete; archive rules | Task 6 |
| `account` on expense create/recurring/bulk/update + default fallback + ownership check | Task 7 |
| `account` filter on `getExpenses` + `getDetailedAnalytics` | Task 7 Step 6 |
| Transfer CRUD; same-account + currency-mismatch 400; `transfers/sync` dedupe | Task 8 |
| Reconcile (adjustment expense, sign, zero-delta no-op) | Task 9 |
| Per-account statement (merged, sorted) | Task 9 |
| Expense sync carries `account` | Task 10 |
| Idempotent migration (seed + backfill) | Task 11 |
| Live smoke + regression + run migration | Task 12 |

**2. Placeholder scan:** No "TBD"/"handle edge cases". Every controller is written out. Task 10 and the `syncController` note give the exact conditional. The migration's reverse is documented in the script header. The one real-world op (running the migration) is Task 12 Step 5 with explicit "back up first".

**3. Type consistency:**
- `Account` fields (`name`, `type`, `openingBalance`, `currency`, `isDefault`, `archived`) identical across the model (Task 1), Zod (Task 3), controller (Task 6), seed util (Task 4), balances util (Task 5).
- `Transfer` fields (`fromAccount`, `toAccount`, `amount`, `date`, `note`, `client_uuid`) identical across model (Task 2), Zod (Task 3), controller (Task 8), balances (Task 5), statement (Task 9).
- `computeAccountBalances(userId)` → `Map<string, number>` — Task 5 def; Task 6 (`listAccounts`) and Task 9 (`reconcileAccount`) consume with `.get(String(id))`.
- `seedDefaultAccountAndAdjustmentCategory(userId, currency)` → `{ account, category }` — Task 4 def; Task 4 (register) and Task 11 (migration) callers.
- Reconcile response `{ adjusted, delta, expense? }` — Task 9 impl + tests + Task 12 smoke.
- Statement entry `{ kind, date, amount, description?|note?, counterparty?, _id, createdAt }`, `kind ∈ {expense, income, transfer-in, transfer-out}` — Task 9 impl + test.
- `GET /api/accounts` → `{ data: { accounts: [{ ...account, balance }], totalBalance } }` — spec + Task 6 impl + tests + Task 12 smoke.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-10-accounts-transfers-4a-api.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
**2. Inline Execution** — `superpowers:executing-plans`, batch with checkpoints.

**Which approach?**
