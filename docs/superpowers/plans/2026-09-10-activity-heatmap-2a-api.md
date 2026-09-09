# Activity Heatmap — Phase 2A (API) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `GET /api/analytics/daily-activity?weeks=16` returning a sparse list of `{ date, expenseTotal, count }` for the trailing `weeks` (clamped 1–53, default 16), expense-only, sorted ascending.

**Architecture:** One new controller function `getDailyActivity` in `analyticsController.js` using a single Mongo aggregation on the existing `{user, date}` index. One route on `analyticsRoutes.js`. A `weeks` clamp helper. Tests extend the Phase 1A `node:test` suite.

**Tech Stack:** Node ESM, Express 4, Mongoose 8. `node:test` + `node:assert` (from Phase 1A).

**Spec:** `docs/superpowers/specs/2026-09-10-activity-heatmap-design.md`

**Depends on:** Phase 1A merged (for the `server/test/setup.mjs` helpers and the `"test"` npm script). If Phase 1A is not merged, Task 1 re-creates the minimal test scaffold — see its note.

## Global Constraints

- Route: `GET /api/analytics/daily-activity`, `authenticateToken`, registered in `server/src/routes/analyticsRoutes.js`.
- `weeks`: integer, **clamped to `[1, 53]`**, default `16`. Non-numeric input → `16`. Never returns 400 for a bad `weeks`.
- Window: `to` = today as `YYYY-MM-DD` in server local time; `from` = `to` minus `(weeks * 7 - 1)` days.
- `days`: only entries with `count > 0`; only `type: 'expense'` contributes; sorted ascending by `date`.
- Response shape exactly as the spec's "API surface / New" section (`success`, `data: { from, to, weeks, days: [{ date, expenseTotal, count }] }`).
- No schema change. No new index. No new npm dependency.
- After each task: `cd server && npm test` passes; `node --check` on modified files.
- Commit after each task with the message in its final step.

## File Structure

**Created**
- `server/src/utils/dateWindow.js` — `clampWeeks(raw)` and `trailingWindow(weeks, today = new Date())` → `{ from, to }` YYYY-MM-DD strings
- `server/test/dailyActivity.test.mjs`

**Modified**
- `server/src/controllers/analyticsController.js` — `getDailyActivity`
- `server/src/routes/analyticsRoutes.js` — route

---

## Task 1: `dateWindow` util + tests

**Files:**
- Create: `server/src/utils/dateWindow.js`
- Create: `server/test/dailyActivity.test.mjs` (util tests only in this task)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export function clampWeeks(raw)` → integer in `[1, 53]`; `clampWeeks(undefined) === 16`, `clampWeeks('abc') === 16`, `clampWeeks(0) === 1`, `clampWeeks(999) === 53`, `clampWeeks('20') === 20`, `clampWeeks(12.9) === 12`.
  - `export function trailingWindow(weeks, today = new Date())` → `{ from, to }` where `to` is `today` as `YYYY-MM-DD` (local), `from` is `to` minus `weeks*7 - 1` days as `YYYY-MM-DD`.

> **If Phase 1A is NOT merged:** also create `server/test/setup.mjs` (copy from the 1A plan Task 1 Step 2) and add `"test": "node --test test/"` to `server/package.json` scripts. Note this in the task report.

- [ ] **Step 1: Write the failing test**

```js
// server/test/dailyActivity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { clampWeeks, trailingWindow } from '../src/utils/dateWindow.js';

test('clampWeeks defaults to 16', () => {
  assert.equal(clampWeeks(undefined), 16);
  assert.equal(clampWeeks('abc'), 16);
  assert.equal(clampWeeks(null), 16);
});

test('clampWeeks bounds to [1, 53]', () => {
  assert.equal(clampWeeks(0), 1);
  assert.equal(clampWeeks(-5), 1);
  assert.equal(clampWeeks(999), 53);
  assert.equal(clampWeeks(53), 53);
});

test('clampWeeks parses numeric strings and floors floats', () => {
  assert.equal(clampWeeks('20'), 20);
  assert.equal(clampWeeks(12.9), 12);
});

test('trailingWindow computes an inclusive N-week window ending today', () => {
  const today = new Date('2026-09-10T12:00:00');
  const { from, to } = trailingWindow(16, today);
  assert.equal(to, '2026-09-10');
  // 16*7 - 1 = 111 days back → 2026-05-22
  assert.equal(from, '2026-05-22');
});

test('trailingWindow for 1 week is a 7-day window', () => {
  const today = new Date('2026-09-10T00:00:00');
  const { from, to } = trailingWindow(1, today);
  assert.equal(to, '2026-09-10');
  assert.equal(from, '2026-09-04');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && node --test test/dailyActivity.test.mjs`
Expected: FAIL — `../src/utils/dateWindow.js` does not exist (import error).

- [ ] **Step 3: Implement the util**

```js
// server/src/utils/dateWindow.js
export function clampWeeks(raw) {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return 16;
  return Math.min(53, Math.max(1, n));
}

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function trailingWindow(weeks, today = new Date()) {
  const to = toYMD(today);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - (weeks * 7 - 1));
  return { from: toYMD(start), to };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd server && node --test test/dailyActivity.test.mjs`
Expected: PASS, 5/5.

- [ ] **Step 5: Commit**

```bash
git add server/src/utils/dateWindow.js server/test/dailyActivity.test.mjs
git commit -m "Add dateWindow util (clampWeeks, trailingWindow) for daily-activity

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `getDailyActivity` controller + aggregation

**Files:**
- Modify: `server/src/controllers/analyticsController.js`
- Modify: `server/test/dailyActivity.test.mjs` (add controller tests)

**Interfaces:**
- Consumes: `Expense` from `../config/models/index.js`; `mongoose`; `clampWeeks`, `trailingWindow` from `../utils/dateWindow.js`.
- Produces: `export const getDailyActivity = async (req, res) => {...}`. Reads `req.query.weeks`. Response shape per the spec.

- [ ] **Step 1: Write the failing test**

Append to `server/test/dailyActivity.test.mjs`:

```js
import mongoose from 'mongoose';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { Expense } from '../src/config/models/Expense.js';
import { getDailyActivity } from '../src/controllers/analyticsController.js';

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

test('getDailyActivity returns sparse expense-only daily totals sorted ascending', async () => {
  const userId = new mongoose.Types.ObjectId();
  const cat = new mongoose.Types.ObjectId();
  const today = new Date();
  const ymd = (d) => d.toISOString().slice(0, 10);
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return ymd(d); };

  await Expense.create([
    { amount: 100, date: daysAgo(1), category: cat, user: userId, type: 'expense' },
    { amount: 50,  date: daysAgo(1), category: cat, user: userId, type: 'expense' },
    { amount: 200, date: daysAgo(3), category: cat, user: userId, type: 'expense' },
    { amount: 999, date: daysAgo(2), category: cat, user: userId, type: 'income' },   // excluded
    { amount: 5,   date: daysAgo(400), category: cat, user: userId, type: 'expense' }, // out of default window
  ]);

  const req = { user: { _id: userId }, query: {} };
  const res = mockRes();
  await getDailyActivity(req, res);

  assert.equal(res.statusCode, 200);
  const { days, weeks } = res.body.data;
  assert.equal(weeks, 16);
  assert.deepEqual(days.map((d) => d.date), [daysAgo(3), daysAgo(1)]);
  assert.equal(days[0].expenseTotal, 200);
  assert.equal(days[0].count, 1);
  assert.equal(days[1].expenseTotal, 150);
  assert.equal(days[1].count, 2);
});

test('getDailyActivity clamps weeks and never 400s', async () => {
  const userId = new mongoose.Types.ObjectId();
  let res = mockRes();
  await getDailyActivity({ user: { _id: userId }, query: { weeks: '999' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.weeks, 53);

  res = mockRes();
  await getDailyActivity({ user: { _id: userId }, query: { weeks: 'nope' } }, res);
  assert.equal(res.body.data.weeks, 16);

  res = mockRes();
  await getDailyActivity({ user: { _id: userId }, query: { weeks: '0' } }, res);
  assert.equal(res.body.data.weeks, 1);
});

test('getDailyActivity returns empty days for a user with no expenses', async () => {
  const res = mockRes();
  await getDailyActivity({ user: { _id: new mongoose.Types.ObjectId() }, query: {} }, res);
  assert.deepEqual(res.body.data.days, []);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && node --test test/dailyActivity.test.mjs`
Expected: FAIL — `getDailyActivity` is not exported.

- [ ] **Step 3: Implement the controller**

In `server/src/controllers/analyticsController.js`, ensure these imports exist near the top (add whichever are missing):

```js
import mongoose from 'mongoose';
import { Expense } from '../config/models/index.js';
import { clampWeeks, trailingWindow } from '../utils/dateWindow.js';
```

Append:

```js
// Daily expense activity for a trailing window of `weeks` (default 16, clamp 1..53).
// Sparse: only days with at least one expense. Expense-only.
export const getDailyActivity = async (req, res) => {
  try {
    const weeks = clampWeeks(req.query.weeks);
    const { from, to } = trailingWindow(weeks);

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
          _id: '$date',
          expenseTotal: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          expenseTotal: 1,
          count: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: { from, to, weeks, days: rows },
    });
  } catch (error) {
    console.error('Get daily activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compute daily activity',
      error: error.message,
    });
  }
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd server && node --test test/dailyActivity.test.mjs`
Expected: PASS — all util + controller tests green.

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/analyticsController.js server/test/dailyActivity.test.mjs
git commit -m "Add getDailyActivity analytics aggregation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Route wiring

**Files:**
- Modify: `server/src/routes/analyticsRoutes.js`
- Modify: `server/test/dailyActivity.test.mjs` (route-registration assertion)

**Interfaces:**
- Consumes: `getDailyActivity` from `../controllers/analyticsController.js`; `authenticateToken` from `../middleware/auth.js`.
- Produces: `GET /api/analytics/daily-activity` on the analytics router.

- [ ] **Step 1: Write the failing test**

Append to `server/test/dailyActivity.test.mjs`:

```js
import analyticsRoutes from '../src/routes/analyticsRoutes.js';

test('analyticsRoutes registers GET /daily-activity', () => {
  const layer = analyticsRoutes.stack.find(
    (l) => l.route && l.route.path === '/daily-activity' && l.route.methods.get
  );
  assert.ok(layer, 'expected GET /daily-activity on the analytics router');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && node --test test/dailyActivity.test.mjs`
Expected: FAIL — the route is not registered.

- [ ] **Step 3: Register the route**

In `server/src/routes/analyticsRoutes.js`:

Add `getDailyActivity` to the `analyticsController` import:

```js
import { getShareToken, revokeShareToken, getSharedProfile, getSharedCategories, getDailyActivity } from '../controllers/analyticsController.js';
```

(If Phase 1A already added `getPaymentModeBreakdown` to this import, keep it and append `, getDailyActivity`.)

Add the route in the protected section:

```js
router.get('/daily-activity', authenticateToken, getDailyActivity);
```

- [ ] **Step 4: Run the test + full suite**

Run: `cd server && node --test test/dailyActivity.test.mjs`
Expected: PASS.

Run: `cd server && npm test`
Expected: all test files pass (Phase 1A's payment-mode tests + these).

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/analyticsRoutes.js server/test/dailyActivity.test.mjs
git commit -m "Wire GET /api/analytics/daily-activity

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Live smoke + shape check

**Files:**
- Create: `server/scripts/smoke-daily-activity.mjs`

**Interfaces:**
- Consumes: a running dev server + a JWT.
- Produces: a runnable manual smoke.

- [ ] **Step 1: Write the smoke script**

```js
// server/scripts/smoke-daily-activity.mjs
// Usage: BASE=http://localhost:5000 TOKEN=<jwt> node scripts/smoke-daily-activity.mjs
const BASE = process.env.BASE || 'http://localhost:5000';
const TOKEN = process.env.TOKEN;
if (!TOKEN) { console.error('Set TOKEN'); process.exit(1); }
const h = { Authorization: `Bearer ${TOKEN}` };

async function get(path) {
  const r = await fetch(`${BASE}/api${path}`, { headers: h });
  return { status: r.status, data: await r.json() };
}

let r = await get('/analytics/daily-activity');
console.assert(r.status === 200, 'default 200', r.status);
console.assert(r.data.data.weeks === 16, 'default weeks 16', r.data.data.weeks);
console.assert(Array.isArray(r.data.data.days), 'days is array');
console.assert(
  r.data.data.days.every((d, i, a) => i === 0 || a[i - 1].date <= d.date),
  'days sorted ascending'
);
console.assert(
  r.data.data.days.every((d) => d.count > 0),
  'no zero-count days'
);
console.log('16w days:', r.data.data.days.length, 'window:', r.data.data.from, '→', r.data.data.to);

r = await get('/analytics/daily-activity?weeks=999');
console.assert(r.data.data.weeks === 53, 'clamp to 53', r.data.data.weeks);

r = await get('/analytics/daily-activity?weeks=bogus');
console.assert(r.data.data.weeks === 16, 'bogus → 16', r.data.data.weeks);

console.log('\nSMOKE OK');
```

- [ ] **Step 2: Run the automated suite**

Run: `cd server && npm test`
Expected: green.

- [ ] **Step 3: Run the smoke (manual)**

Start `cd server && npm run dev`, get a JWT, then:

Run: `cd server && BASE=http://localhost:5000 TOKEN=... node scripts/smoke-daily-activity.mjs`
Expected: `SMOKE OK`, printed `days` count and window; no assertion failures.

- [ ] **Step 4: Commit**

```bash
git add server/scripts/smoke-daily-activity.mjs
git commit -m "Add manual smoke for daily-activity endpoint

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage**

| Spec item | Task |
|---|---|
| `weeks` default 16, clamp [1,53], non-numeric → 16, never 400 | Task 1 (`clampWeeks`) + Task 2 tests |
| Window: `to` = today, `from` = today − (weeks·7 − 1) | Task 1 (`trailingWindow`) |
| Aggregation: expense-only, group by date, sum + count, sort asc | Task 2 |
| Sparse (`count > 0` only) | Task 2 (`$group` naturally omits empty; test asserts) |
| Response shape `{ from, to, weeks, days:[{date,expenseTotal,count}] }` | Task 2 |
| Route `GET /api/analytics/daily-activity` + auth | Task 3 |
| No schema change, reuse `{user,date}` index | (aggregation only) |
| No shared endpoint | (not added) |
| Live smoke + shape check | Task 4 |

**2. Placeholder scan:** No "TBD"/"handle edge cases". Task 1 has the exact clamp cases as assertions. Task 3 Step 3 handles the "Phase 1A may have edited this import already" case explicitly.

**3. Type consistency:**
- `clampWeeks` / `trailingWindow` names + signatures identical across Tasks 1, 2, and the controller.
- Response keys `from`, `to`, `weeks`, `days` and item keys `date`, `expenseTotal`, `count` identical between spec, Task 2 impl, Task 2 + Task 4 assertions.
- `getDailyActivity` — same name Task 2 (export), Task 3 (import + route + test), Task 4 (HTTP path).

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-10-activity-heatmap-2a-api.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
**2. Inline Execution** — `superpowers:executing-plans`, batch with checkpoints.

**Which approach?**
