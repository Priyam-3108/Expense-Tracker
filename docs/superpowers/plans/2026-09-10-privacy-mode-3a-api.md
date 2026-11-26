# Privacy Mode — Phase 3A (API) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `privacyModeDefault` (boolean, default `false`) to `User`, let `PUT /api/auth/profile` set it, and confirm it rides along in every user payload.

**Architecture:** One schema field. Two lines in `updateProfile`. No new route, no migration. Tests extend the Phase 1A `node:test` suite.

**Tech Stack:** Node ESM, Express 4, Mongoose 8. `node:test` + `node:assert`.

**Spec:** `docs/superpowers/specs/2026-09-10-privacy-mode-design.md`

**Depends on:** Phase 1A merged (for `server/test/setup.mjs` + the `"test"` script). If not merged, Task 1 re-creates the minimal scaffold.

## Global Constraints

- Field: `privacyModeDefault: { type: Boolean, default: false }` on `User`.
- `PUT /api/auth/profile` accepts optional `privacyModeDefault`; set it **only when `typeof === 'boolean'`** (a stray string/number must be ignored, not coerced).
- The field must appear in the payloads from `login`, `register`, `getProfile`, `updateProfile` (all already call `user.toJSON()` — verify, don't re-implement).
- No new route. No migration script. No Zod change required.
- No new npm dependency.
- After each task: `cd server && npm test` passes; `node --check` on modified files.
- Commit after each task with the message in its final step.

## File Structure

**Modified**
- `server/src/config/models/User.js` — add the field
- `server/src/controllers/authController.js` — `updateProfile` reads + conditionally sets `privacyModeDefault`

**Created**
- `server/test/privacyMode.test.mjs`

---

## Task 1: Schema field + default test

**Files:**
- Modify: `server/src/config/models/User.js`
- Create: `server/test/privacyMode.test.mjs`

**Interfaces:**
- Consumes: `connectTestDb`, `clearCollections`, `disconnectTestDb` from `server/test/setup.mjs`; `User` from `server/src/config/models/User.js`.
- Produces: `User` documents have `privacyModeDefault` (boolean, default `false`).

> **If Phase 1A is NOT merged:** create `server/test/setup.mjs` (from the 1A plan Task 1 Step 2) and add `"test": "node --test test/"` to `server/package.json`. Note it in the report.

- [ ] **Step 1: Write the failing test**

```js
// server/test/privacyMode.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { connectTestDb, clearCollections, disconnectTestDb } from './setup.mjs';
import { User } from '../src/config/models/User.js';

test.before(connectTestDb);
test.afterEach(clearCollections);
test.after(disconnectTestDb);

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && node --test test/privacyMode.test.mjs`
Expected: FAIL — `privacyModeDefault` is `undefined` (path doesn't exist), so the default and toJSON assertions fail.

- [ ] **Step 3: Add the field**

In `server/src/config/models/User.js`, inside the schema object, after the `currency` field and before `categoryOrder`:

```js
  privacyModeDefault: {
    type: Boolean,
    default: false
  },
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd server && node --test test/privacyMode.test.mjs`
Expected: PASS, 3/3.

- [ ] **Step 5: Commit**

```bash
git add server/src/config/models/User.js server/test/privacyMode.test.mjs
git commit -m "Add privacyModeDefault field to User schema

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `updateProfile` sets `privacyModeDefault`

**Files:**
- Modify: `server/src/controllers/authController.js`
- Modify: `server/test/privacyMode.test.mjs`

**Interfaces:**
- Consumes: nothing new.
- Produces: `updateProfile` reads `privacyModeDefault` from `req.body` and adds it to `updates` **only when it is a boolean**.

- [ ] **Step 1: Write the failing test**

Append to `server/test/privacyMode.test.mjs`:

```js
import { updateProfile } from '../src/controllers/authController.js';

function mockRes() {
  return {
    statusCode: 200, body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && node --test test/privacyMode.test.mjs`
Expected: FAIL — "sets ... when boolean" fails because `updateProfile` never reads the field.

- [ ] **Step 3: Update the controller**

In `server/src/controllers/authController.js`, `updateProfile`:

Change the destructure:

```js
    const { name, email, currency, privacyModeDefault } = req.body;
```

After `if (currency) updates.currency = currency;` add:

```js
    if (typeof privacyModeDefault === 'boolean') updates.privacyModeDefault = privacyModeDefault;
```

- [ ] **Step 4: Run the test + full suite**

Run: `cd server && node --test test/privacyMode.test.mjs`
Expected: PASS.

Run: `cd server && npm test`
Expected: all test files pass (Phase 1A + Phase 2A + these).

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/authController.js server/test/privacyMode.test.mjs
git commit -m "Let PUT /api/auth/profile set privacyModeDefault (boolean only)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Payload smoke + regression check

**Files:**
- Create: `server/scripts/smoke-privacy-default.mjs`

**Interfaces:**
- Consumes: a running dev server + a JWT.
- Produces: a runnable manual smoke.

- [ ] **Step 1: Write the smoke script**

```js
// server/scripts/smoke-privacy-default.mjs
// Usage: BASE=http://localhost:5000 TOKEN=<jwt> node scripts/smoke-privacy-default.mjs
const BASE = process.env.BASE || 'http://localhost:5000';
const TOKEN = process.env.TOKEN;
if (!TOKEN) { console.error('Set TOKEN'); process.exit(1); }
const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` };

async function j(method, path, body) {
  const r = await fetch(`${BASE}/api${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json() };
}

let r = await j('GET', '/auth/profile');
console.assert(r.status === 200, 'profile 200', r.status);
console.assert('privacyModeDefault' in r.data.data.user, 'field present in profile', Object.keys(r.data.data.user));
const before = r.data.data.user.privacyModeDefault;
console.log('privacyModeDefault before:', before);

r = await j('PUT', '/auth/profile', { privacyModeDefault: !before });
console.assert(r.data.data.user.privacyModeDefault === !before, 'toggled', r.data.data.user.privacyModeDefault);

r = await j('PUT', '/auth/profile', { privacyModeDefault: 'garbage' });
console.assert(r.data.data.user.privacyModeDefault === !before, 'garbage ignored', r.data.data.user.privacyModeDefault);

// restore
await j('PUT', '/auth/profile', { privacyModeDefault: before });

console.log('\nSMOKE OK');
```

- [ ] **Step 2: Automated suite**

Run: `cd server && npm test`
Expected: green.

- [ ] **Step 3: Run the smoke (manual)**

Start `cd server && npm run dev`, get a JWT, then:

Run: `cd server && BASE=http://localhost:5000 TOKEN=... node scripts/smoke-privacy-default.mjs`
Expected: `SMOKE OK`, no assertion failures; `privacyModeDefault` present in the profile payload.

- [ ] **Step 4: Regression check (manual)**

In the app: log in, update the profile name/currency as normal — still works. Log out and back in — the `user` object in the client now carries `privacyModeDefault` (check the login network response).

- [ ] **Step 5: Commit**

```bash
git add server/scripts/smoke-privacy-default.mjs
git commit -m "Add manual smoke for privacyModeDefault

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage**

| Spec item | Task |
|---|---|
| `privacyModeDefault` boolean, default `false` on `User` | Task 1 |
| In `toJSON` / user payloads | Task 1 (test) + Task 3 (smoke: `login` re-check) |
| `PUT /api/auth/profile` sets it, boolean-only | Task 2 |
| Non-boolean ignored, not coerced | Task 2 (test + `typeof === 'boolean'` guard) |
| No new route, no migration, no Zod change | (nothing added) |
| Payload smoke + profile regression | Task 3 |

**2. Placeholder scan:** No "TBD"/"handle edge cases". Every code change is two literal lines or one schema block. Task 1 handles the "1A not merged" branch explicitly.

**3. Type consistency:**
- `privacyModeDefault` — same key in the schema (Task 1), the controller destructure + guard (Task 2), every test, and the smoke script.
- `updateProfile` `(req, res)` double uses `res.status().json()` consistently.
- Response path `res.body.data.user.privacyModeDefault` matches `authController`'s existing `data: { user: user.toJSON() }` shape.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-10-privacy-mode-3a-api.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
**2. Inline Execution** — `superpowers:executing-plans`, batch with checkpoints.

**Which approach?**
