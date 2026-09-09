# Feature 4 — Accounts + Transfers — Design

Date: 2026-09-10
Status: Approved for planning
Roadmap: [2026-09-09-expense-manager-parity-roadmap.md](2026-09-09-expense-manager-parity-roadmap.md)
Branch: `enhancement/expense-manager-parity`

## Goal

Money lives in **accounts** (cash, bank, card, savings). Every expense/income
belongs to an account. **Transfers** move money between accounts without being
income or expense. Each account shows a **computed balance**; you can
**reconcile** it to a real statement. Reference: Expense Manager's
multi-account model + v2.11 account transfers, balance adjustments, per-account
history.

This is the structural feature. It adds two models, a field on `Expense`, a
migration, balance math, and a new sync path. Build it **last**, after
Features 1–3 are merged.

## Non-goals

- No cross-currency transfers (v1: same-currency only; the account carries a
  `currency` for display but transfers assume it matches).
- No per-account budgets or per-account analytics dashboards (an `account`
  *filter* on existing views is in scope; new per-account chart pages are not).
- No credit-card statement/billing cycle logic.
- No stored/denormalised balance in v1 — computed on read (see below).
- No shared-analytics exposure of accounts.

## Decisions (resolved from the roadmap's "spec must resolve")

### Balance: computed vs stored

**Computed on read.** `GET /api/accounts` runs one aggregation per request:
`balance = openingBalance + Σincome − Σexpense + ΣtransfersIn − ΣtransfersOut`.
Two aggregations (one over `expenses` grouped by `account` + `type`, one over
`transfers` grouped by `fromAccount`/`toAccount`), merged in JS.
`ponytail:` computed-on-read; add a cached `balance` field with recompute-on-write
only if a real dataset shows this is slow.

### Reconcile: special expense vs dedicated entity

**Dedicated `Adjustment` is overkill; use a special expense/income row.**
Reconcile takes a `targetBalance`; the server computes `delta = target − current`
and creates ONE `Expense` on that account with:
- `type: 'income'` if `delta > 0`, `type: 'expense'` if `delta < 0`
- `amount: Math.abs(delta)`
- `category`: the user's auto-seeded **"Adjustment"** category (seeded on
  registration + by the migration, `isDefault: true`)
- `description: 'Balance adjustment'`, `notes: 'Reconciled to <target>'`
- a flag `isAdjustment: true` (new boolean on `Expense`, default `false`) so
  the UI can style/hide these and analytics can optionally exclude them.

`delta === 0` → no row created, 200 with `{ adjusted: false }`.

### Transfers crossing currencies

Rejected in v1. `POST /api/transfers` 400s if `fromAccount.currency !==
toAccount.currency`.

### Default account

Name: **"Cash"**, `type: 'cash'`, `openingBalance: 0`, `isDefault: true`.
Seeded on registration (alongside default categories) and by the migration for
every existing user. Exactly one `isDefault: true` account per user. It cannot
be deleted; it can be renamed.

### Archiving an account with transactions

**Block hard-delete; allow archive.** `archived: true` hides it from pickers
and the default list view but keeps its history and balance visible under a
"Show archived" toggle. Its transactions are untouched. You cannot archive the
`isDefault` account. You cannot archive an account that is the `from`/`to` of a
future-dated transfer (edge case — v1 just checks none exist and 400s with a
message).

### Where transfers appear

**Their own "Transfers" tab/section**, not mixed into the main Expenses list.
The per-account **statement** endpoint DOES merge expenses + transfers for that
one account, date-sorted.

### Offline (mobile)

- Adding an expense offline: `account` is part of the local payload; if none
  chosen, the client fills the cached default account id. Syncs via the
  existing expense sync (extended to accept `account`).
- Adding a transfer offline: a **new `local_transfers` SQLite table** + a new
  `POST /api/transfers/sync` endpoint mirroring the expense sync
  (`client_uuid` dedupe).
- Offline balance: shown as "last known" (from the last successful
  `GET /api/accounts` cached in AsyncStorage) with a "may be out of date"
  hint. No local recompute in v1.
- If the default account changes server-side while offline, queued offline
  expenses that used the *old* cached default still carry that id — acceptable;
  they're valid account ids.

## Data model

### New: `Account` (`server/src/config/models/Account.js`)

```
user            ObjectId ref User, required, indexed
name            String, required, trim, maxlength 40
type            String, enum ['cash','bank','card','savings','other'], default 'cash'
openingBalance  Number, default 0
currency        String, enum (same 8 as User.currency), default = user's currency at creation
isDefault       Boolean, default false
archived        Boolean, default false
timestamps
```

Index: `{ user: 1, archived: 1 }`. Partial unique index on
`{ user: 1, isDefault: 1 }` where `isDefault: true` (one default per user).

### New: `Transfer` (`server/src/config/models/Transfer.js`)

```
user         ObjectId ref User, required, indexed
fromAccount  ObjectId ref Account, required
toAccount    ObjectId ref Account, required
amount       Number, required, min 0.01
date         String YYYY-MM-DD, required
note         String, trim, maxlength 300
client_uuid  String, unique sparse index (offline sync key)
timestamps
```

Validation: `fromAccount !== toAccount` (schema `validate` + controller check).
Index: `{ user: 1, date: -1 }`.

### Changed: `Expense`

```
account       ObjectId ref Account, default null   // null tolerated for legacy; migration backfills
isAdjustment  Boolean, default false
```

Index: `{ user: 1, account: 1 }`.

### Changed: registration seed

Add an **"Adjustment"** default category (`isDefault: true`, icon `⚖️`, color
`#64748B`) and a **"Cash"** default account (`isDefault: true`).

## Migration

`server/scripts/migrate-accounts.mjs` (idempotent, documented-reversible):

1. For each `User` without any `Account`: create the default "Cash" account
   (`isDefault: true`, `openingBalance: 0`).
2. For each `User` without an "Adjustment" category: create it (`isDefault: true`).
3. For each `Expense` with `account == null`: set `account` = that user's
   default account id.
4. Log counts. Safe to re-run (each step guards on existence).

Reverse (documented, not scripted): `Account.deleteMany({})`,
`Transfer.deleteMany({})`, `Expense.updateMany({}, { $unset: { account: '', isAdjustment: '' } })`,
`Category.deleteMany({ name: 'Adjustment', isDefault: true })`.

## API surface

### New routes (`server/src/routes/accounts.js`, `transfers.js`; mount in `app.js`)

| Method + path | Purpose |
|---|---|
| `GET /api/accounts?includeArchived=false` | list accounts **with computed `balance`** |
| `POST /api/accounts` | create (`name`, `type`, `openingBalance`, `currency?`) |
| `PUT /api/accounts/:id` | rename / change type / openingBalance / archive |
| `DELETE /api/accounts/:id` | delete — **403 if it has any expense or transfer, or is default**; else remove |
| `POST /api/accounts/:id/reconcile` | body `{ targetBalance }` → creates the adjustment expense; returns `{ adjusted, delta, expense? }` |
| `GET /api/accounts/:id/statement?from&to` | merged date-sorted list `[{ kind: 'expense'|'income'|'transfer-in'|'transfer-out', date, amount, ...ref }]` |
| `GET /api/transfers?from&to` | list transfers |
| `POST /api/transfers` | create (`fromAccount`, `toAccount`, `amount`, `date`, `note?`) — 400 on same account or currency mismatch |
| `PUT /api/transfers/:id` | edit `date`/`note` only (not amounts/accounts in v1) |
| `DELETE /api/transfers/:id` | remove |
| `POST /api/transfers/sync` | offline batch, mirrors `POST /api/expenses/sync` |

All auth via `authenticateToken`. Zod schemas in `validation.js`
(`accountSchema`, `transferSchema`).

### Changed

- `POST /api/expenses`, `PUT /api/expenses/:id`, `POST /api/expenses/bulk` —
  accept optional `account` (ObjectId string). Persisted on all create paths
  (single, recurring, bulk) and update. Zod: `account: z.string().optional()`.
  Controller verifies the account belongs to the user (like the category check).
  When omitted on create, default to the user's default account id.
- `POST /api/expenses/sync` — `syncExpenses` spreads `...data`, so `account`
  flows through; add an explicit assert + verify the account-ownership check is
  skipped or applied leniently for sync (sync trusts the client's own account
  ids; still scope by `user`).
- `getExpenses`, `getDetailedAnalytics` — accept optional `account` query param,
  add `filter.account = new mongoose.Types.ObjectId(account)` when present and
  not `'all'`.
- Registration seed — see above.

### `GET /api/accounts` response

```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "_id": "...", "name": "Cash", "type": "cash",
        "openingBalance": 0, "currency": "INR",
        "isDefault": true, "archived": false,
        "balance": 4230.5
      }
    ],
    "totalBalance": 4230.5
  }
}
```

`totalBalance` = sum of non-archived account balances.

## Web components

| File | Responsibility |
|---|---|
| `client/src/services/accountService.js`, `transferService.js` (new) | HTTP wrappers |
| `client/src/context/AccountContext.jsx` (new) | `accounts`, `defaultAccountId`, `totalBalance`, `loadAccounts`, CRUD, `reconcile` |
| `client/src/pages/Accounts.jsx` (new) | list with `<Amount>` balances, add/edit/archive, "Show archived" toggle, per-account statement drawer/page, reconcile action |
| `client/src/components/AccountForm.jsx` (new) | form-kit modal (name, type chips, opening balance via `AmountHero`, currency) |
| `client/src/components/TransferForm.jsx` (new) | from/to account pickers, amount, date, note; from ≠ to guard |
| `client/src/components/AccountPicker.jsx` (new) | chip/select of non-archived accounts, used in the Expense form and filters |
| `client/src/pages/Expenses.jsx` (modify) | `formData.account`, `<AccountPicker>` in the add/edit modal, account column/badge, a "Transfers" tab that lists transfers + a "New transfer" button |
| `client/src/pages/Analytics.jsx` / `AnalyticsDashboard.jsx` (modify) | optional account filter passed to the analytics query |
| `client/src/components/Layout.jsx` (modify) | nav entry "Accounts" (`Wallet`/`Landmark` icon, distinct from Debts/Budgets) |
| `client/src/App.jsx` (modify) | `<AccountProvider>` + `/app/accounts` route |
| `client/src/pages/Dashboard.jsx` (modify) | total-balance stat + per-account mini-cards |

## Mobile components

| File | Responsibility |
|---|---|
| `mobile-app/src/services/accountService.js`, `transferService.js` (new) | HTTP wrappers |
| `mobile-app/src/context/AccountContext.js` (new) | same contract; caches last `GET /api/accounts` to AsyncStorage for offline display |
| `mobile-app/src/screens/AccountsScreen.js` (new) | list + balances (+ "last known" hint offline), add/edit/archive, statement, reconcile |
| `mobile-app/src/screens/TransferScreen.js` (new) | transfer flow |
| account picker in `AddExpenseScreen.js` (modify) | chip row of accounts; defaults to cached default id |
| `mobile-app/src/services/db.js` (modify) | `CREATE TABLE local_transfers (...)` mirroring `local_expenses` |
| `mobile-app/src/services/offlineService.js` (modify) | `saveTransferLocally`, `getPendingTransfers`, `markTransferSynced/Failed`; `account` already flows in the expense payload |
| `mobile-app/src/services/syncEngine.js` (modify) | after expense sync, run transfer sync against `POST /api/transfers/sync` |
| navigation (modify) | add `Accounts` + `Transfer` routes |

## Error handling

- Delete an account with history or the default → 403 `{ message }`; UI offers "Archive instead".
- Transfer with `fromAccount === toAccount` → 400.
- Transfer across currencies → 400 `{ message: 'Transfer accounts must use the same currency' }`.
- Reconcile with `targetBalance` equal to current → 200 `{ adjusted: false }`.
- Expense create/update with an `account` not owned by the user → 400 `Invalid account` (mirrors the category check). Sync path scopes by `user` and does not hard-fail a batch on one bad account — that item returns `FAILED`.
- Offline account list unavailable (never fetched) → mobile shows accounts with balance `—` and a "connect to load balances" note.
- Migration re-run → no-ops, logs "0 created".

## Testing

- **API (4A):** `node:test`. Cover: `Account`/`Transfer` schema rules
  (same-account transfer rejected, currency mismatch rejected, one default per
  user); default seed on registration; `computeAccountBalances` math across
  income/expense/transfer-in/-out/openingBalance; `GET /api/accounts` shape +
  `totalBalance`; expense create/update/bulk persist `account`; default-account
  fallback when `account` omitted; reconcile creates the right adjustment row
  and no row on zero delta; statement merges + sorts; `account` filter on
  `getExpenses`; `transfers/sync` dedupe by `client_uuid`; migration idempotency
  (run twice, second run creates nothing).
- **Web (4B):** `npx vite build`. Manual: create accounts; balances update as
  expenses/transfers are added; account picker on the expense form defaults
  correctly and pre-fills on edit; transfer form guards; Transfers tab lists;
  reconcile flow; archive hides from pickers, "Show archived" reveals;
  statement view; Dashboard total + per-account cards; account filter on
  Analytics; delete blocked with the archive offer.
- **Mobile (4C):** manual device: account picker on Add Expense (online +
  offline with cached default); create a transfer online; create expense +
  transfer offline → both queue → go online → both sync (check server);
  `AccountsScreen` balances online + "last known" offline; reconcile; navigation.

## Rollout / dependency notes

- Build order strictly 4A → 4B → 4C, each merged before the next starts.
- 4A's migration runs once against the target DB after 4A merges (document the
  command in the 4A plan's final task; it is a manual op, not auto-run on boot).
- Re-read all three 4x plans against the then-current code before executing —
  Features 1–3 will have added `paymentMode`, `privacyModeDefault`, and touched
  the same files (`Expense.js`, `authController.js` register seed,
  `expenseController.js`, `Expenses.jsx`, `App.jsx`, `Layout.jsx`,
  `AddExpenseScreen.js`, `syncEngine.js`, `db.js`). Line numbers WILL differ.
