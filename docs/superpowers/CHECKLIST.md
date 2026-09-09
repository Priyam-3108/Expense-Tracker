# Expense Manager Parity — Master Checklist

Branch: `enhancement/expense-manager-parity`
Roadmap: [specs/2026-09-09-expense-manager-parity-roadmap.md](specs/2026-09-09-expense-manager-parity-roadmap.md)

This is the single source of truth for progress. Every phase = one spec + one
implementation plan + execution (subagent-driven) + review + merge. Check a box
only when that phase is merged to the enhancement branch and its build/tests pass.

Legend: `[ ]` not started · `[~]` in progress · `[x]` merged

---

## Documents index

| Doc | Path | Status |
|---|---|---|
| Roadmap | `specs/2026-09-09-expense-manager-parity-roadmap.md` | written |
| This checklist | `CHECKLIST.md` | written |
| F1 spec — Payment Mode | `specs/2026-09-10-payment-mode-design.md` | written |
| F1 plan 1A — API | `plans/2026-09-10-payment-mode-1a-api.md` | written |
| F1 plan 1B — Web | `plans/2026-09-10-payment-mode-1b-web.md` | written |
| F1 plan 1C — Mobile | `plans/2026-09-10-payment-mode-1c-mobile.md` | written |
| F2 spec — Activity Heatmap | `specs/2026-09-10-activity-heatmap-design.md` | written |
| F2 plan 2A — API | `plans/2026-09-10-activity-heatmap-2a-api.md` | written |
| F2 plan 2B — Web | `plans/2026-09-10-activity-heatmap-2b-web.md` | written |
| F2 plan 2C — Mobile | `plans/2026-09-10-activity-heatmap-2c-mobile.md` | written |
| F3 spec — Privacy Mode | `specs/2026-09-10-privacy-mode-design.md` | written |
| F3 plan 3A — API | `plans/2026-09-10-privacy-mode-3a-api.md` | written |
| F3 plan 3B — Web | `plans/2026-09-10-privacy-mode-3b-web.md` | written |
| F3 plan 3C — Mobile | `plans/2026-09-10-privacy-mode-3c-mobile.md` | written |
| F4 spec — Accounts + Transfers | `specs/2026-09-10-accounts-transfers-design.md` | written |
| F4 plan 4A — API | `plans/2026-09-10-accounts-transfers-4a-api.md` | written |
| F4 plan 4B — Web | `plans/2026-09-10-accounts-transfers-4b-web.md` | written |
| F4 plan 4C — Mobile | `plans/2026-09-10-accounts-transfers-4c-mobile.md` | written |

> **Note on later-phase plans:** F2–F4 plans reference the codebase as it stands
> on 2026-09-10. Earlier merged phases (especially F4 after F1's `paymentMode`
> and any schema work) may shift line numbers and add fields. Re-read the
> relevant plan and reconcile against the then-current code before executing it.

---

## Feature 1 — Payment Mode

Spec: `specs/2026-09-10-payment-mode-design.md`

### 1A · API — `plans/2026-09-10-payment-mode-1a-api.md`
- [x] Task 1: Add `paymentMode` to `Expense` schema (enum, default `other`)
- [x] Task 2: Add `paymentMode` to `expenseSchema` Zod validator
- [x] Task 3: Persist `paymentMode` in `createExpense` (single + recurring + bulk)
- [x] Task 4: Persist `paymentMode` in `updateExpense`
- [x] Task 5: `getPaymentModeBreakdown` controller + aggregation
- [x] Task 6: `GET /api/analytics/payment-modes` route (auth)
- [x] Task 7: Verify `syncExpenses` passes `paymentMode` through
- [x] Task 8: Manual smoke + regression check on existing expense endpoints
- [x] **1A merged** (committed directly to `enhancement/expense-manager-parity`,
  commits `63c9fdc`..`c47f023`)

> **1A notes (2026-09-10):**
> - Server had no test runner. Added `node:test` (built-in, zero deps) + `npm test`.
>   `server/test/*.test.mjs` — 6 files, all green.
> - **Node 16 on the build machine:** top-level `node:test` hooks don't run (need
>   Node 18+). DB test files use top-level `await connectTestDb()` + a final
>   `zz cleanup` test instead. Also added `server/test/run-serial.mjs` — Node 16's
>   `node --test <dir>` runs files concurrently on one mongoose connection and the
>   per-file teardown raced; the runner runs each file sequentially. `npm test`
>   points at it.
> - Task 8 live smoke (`server/scripts/smoke-payment-mode.mjs` steps 3–4) is
>   **deferred to a manual pass** — needs a running dev server + a user JWT +
>   category id. The automated suite is the merge gate and is green.
> - **Known follow-up (not blocking 1A):** `bulkUpdateExpenses` /
>   `bulkUpdateList` allowlists omit `paymentMode`, so bulk-edit silently no-ops it.
>   The F1 spec's API surface only names `POST /expenses`, `PUT /:id`, sync — bulk
>   update was out of scope. Add in 1B if wanted (2 lines/site + `runValidators`).
> - **For 1B/1C:** `PUT /api/expenses/:id` validates the FULL body (`amount` +
>   `category` required) — the edit form must send the whole expense, not just the
>   changed field.

### 1B · Web — `plans/2026-09-10-payment-mode-1b-web.md`
- [ ] Task 1: `PAYMENT_MODES` constant module (values, labels, icons)
- [ ] Task 2: `PaymentModeChips` form-kit component
- [ ] Task 3: Wire `paymentMode` into the Expense add/edit form
- [ ] Task 4: `paymentMode` in `expenseService` create/update payloads (pass-through check)
- [ ] Task 5: Payment-mode badge on expense list rows + `MobileExpenseCard`
- [ ] Task 6: `analyticsService.getPaymentModeBreakdown()`
- [ ] Task 7: "Spending by payment method" chart in `AnalyticsDashboard`
- [ ] Task 8: Build + manual checklist
- [ ] **1B merged**

### 1C · Mobile — `plans/2026-09-10-payment-mode-1c-mobile.md`
- [ ] Task 1: `PAYMENT_MODES` constant (mobile copy)
- [ ] Task 2: Payment-mode chip row in `AddExpenseScreen`
- [ ] Task 3: `paymentMode` in `offlineService.saveExpenseLocally` payload
- [ ] Task 4: `paymentMode` in `syncEngine` sync payload
- [ ] Task 5: Payment-mode badge on `TransactionItem`
- [ ] Task 6: `paymentMode` chart in `AnalyticsScreen` (online-only)
- [ ] Task 7: Manual device/emulator smoke (add online, add offline+sync, edit)
- [ ] **1C merged**

---

## Feature 2 — Activity Heatmap

Spec: `specs/2026-09-10-activity-heatmap-design.md`

### 2A · API — `plans/2026-09-10-activity-heatmap-2a-api.md`
- [ ] Task 1: `getDailyActivity` controller (reuse `dailyPattern` aggregation, param `weeks`)
- [ ] Task 2: `GET /api/analytics/daily-activity` route (auth)
- [ ] Task 3: `weeks` param clamp (1–53) + default 16
- [ ] Task 4: Manual smoke + shape check
- [ ] **2A merged**

### 2B · Web — `plans/2026-09-10-activity-heatmap-2b-web.md`
- [ ] Task 1: `analyticsService.getDailyActivity()`
- [ ] Task 2: `useDailyActivity` hook (fetch + gap-fill to a dense 7×N grid)
- [ ] Task 3: `ActivityHeatmap` component (grid, 5-step scale, tooltip, dark palette)
- [ ] Task 4: Place on `Dashboard`, cell click → filtered Expenses for that day
- [ ] Task 5: Empty state + narrow-screen horizontal scroll
- [ ] Task 6: Build + manual checklist
- [ ] **2B merged**

### 2C · Mobile — `plans/2026-09-10-activity-heatmap-2c-mobile.md`
- [ ] Task 1: `healthService`-style `analyticsService` call (or extend existing) for daily activity
- [ ] Task 2: `ActivityHeatmap` RN component (same data contract, `Pressable` cells)
- [ ] Task 3: Place on `DashboardScreen`; hidden when offline with no cached data
- [ ] Task 4: Cell tap → navigate to filtered transactions
- [ ] Task 5: Manual smoke (online, offline, tap-through, dark mode)
- [ ] **2C merged**

---

## Feature 3 — Privacy Mode

Spec: `specs/2026-09-10-privacy-mode-design.md`

### 3A · API — `plans/2026-09-10-privacy-mode-3a-api.md`
- [ ] Task 1: Add `privacyModeDefault: Boolean` (default `false`) to `User`
- [ ] Task 2: Accept `privacyModeDefault` in the profile-update endpoint + Zod
- [ ] Task 3: Include `privacyModeDefault` in the `/auth/me` + login user payloads
- [ ] Task 4: Manual smoke (toggle default, re-login, verify persisted)
- [ ] **3A merged**

### 3B · Web — `plans/2026-09-10-privacy-mode-3b-web.md`
- [ ] Task 1: `PrivacyContext` (`isPrivate`, `toggle`, localStorage + user default seed)
- [ ] Task 2: `<Amount>` component (mask vs formatted currency)
- [ ] Task 3: Provider mounted in `App.jsx`
- [ ] Task 4: Header eye/eye-off toggle
- [ ] Task 5: Settings/Profile row (persists `privacyModeDefault` via API)
- [ ] Task 6: Sweep `Dashboard` amount renders → `<Amount>`
- [ ] Task 7: Sweep `Expenses` (list, cards, summary) → `<Amount>`
- [ ] Task 8: Sweep `AnalyticsDashboard` (numbers + chart axis/tooltip suppression)
- [ ] Task 9: Sweep `Debts` + `Budgets` → `<Amount>`
- [ ] Task 10: Build + manual checklist (grep proves no raw renders remain)
- [ ] **3B merged**

### 3C · Mobile — `plans/2026-09-10-privacy-mode-3c-mobile.md`
- [ ] Task 1: `PrivacyContext` (AsyncStorage + user default seed)
- [ ] Task 2: `<Amount>` RN component
- [ ] Task 3: Provider in the app root
- [ ] Task 4: Header toggle (icon) on main screens
- [ ] Task 5: Sweep `DashboardScreen` + `BalanceCard`/`SummaryCard`
- [ ] Task 6: Sweep transactions list + `TransactionItem`
- [ ] Task 7: Sweep `AnalyticsScreen` + charts
- [ ] Task 8: Sweep `DebtScreen` + `BudgetSettingsScreen`
- [ ] Task 9: Manual smoke (toggle, kill+relaunch persists, dark mode)
- [ ] **3C merged**

---

## Feature 4 — Accounts + Transfers

Spec: `specs/2026-09-10-accounts-transfers-design.md`

### 4A · API — `plans/2026-09-10-accounts-transfers-4a-api.md`
- [ ] Task 1: `Account` model
- [ ] Task 2: `Transfer` model
- [ ] Task 3: `account` field on `Expense` (optional ref) + Zod
- [ ] Task 4: Seed default account on registration
- [ ] Task 5: Migration script — default account per existing user, backfill `account` on expenses
- [ ] Task 6: Account CRUD controller + routes
- [ ] Task 7: Balance computation helper (`computeAccountBalances`)
- [ ] Task 8: Transfer CRUD controller + routes
- [ ] Task 9: Reconcile endpoint (compensating `Adjustment`-category expense)
- [ ] Task 10: Per-account statement endpoint (merged expenses + transfers)
- [ ] Task 11: `account` filter on expense list + analytics
- [ ] Task 12: `syncExpenses` accepts `account`; new `POST /api/transfers/sync`
- [ ] Task 13: Manual smoke + regression sweep
- [ ] **4A merged**

### 4B · Web — `plans/2026-09-10-accounts-transfers-4b-web.md`
- [ ] Task 1: `accountService` + `transferService`
- [ ] Task 2: `AccountContext`
- [ ] Task 3: `Accounts` page (list + computed balances)
- [ ] Task 4: Account add/edit/archive modal (form-kit)
- [ ] Task 5: Nav entry + route
- [ ] Task 6: Account picker in the Expense add/edit form
- [ ] Task 7: `TransferForm` (new) + Transfers tab/section
- [ ] Task 8: Account filter in Expenses + Analytics
- [ ] Task 9: Reconcile UI on an account
- [ ] Task 10: Dashboard total-balance + per-account cards
- [ ] Task 11: Per-account statement view
- [ ] Task 12: Build + manual checklist
- [ ] **4B merged**

### 4C · Mobile — `plans/2026-09-10-accounts-transfers-4c-mobile.md`
- [ ] Task 1: `accountService` + `transferService` (mobile)
- [ ] Task 2: `AccountContext`
- [ ] Task 3: Account picker in `AddExpenseScreen`
- [ ] Task 4: `local_transfers` SQLite table + `offlineService` transfer methods
- [ ] Task 5: `syncEngine` transfer sync path
- [ ] Task 6: `AccountsScreen` (list + balances)
- [ ] Task 7: Transfer flow screen
- [ ] Task 8: Reconcile flow
- [ ] Task 9: `account` in local expense payload + sync
- [ ] Task 10: Manual smoke (online, offline expense+transfer queue, sync, reconcile)
- [ ] **4C merged**

---

## Execution protocol (per phase)

1. Re-read the phase's plan; reconcile against current code (line numbers, new fields from earlier phases).
2. `superpowers:subagent-driven-development` — worktree, ledger, task-by-task with review.
3. Phase's verification gate must pass (`server`: node smoke / test runner if added; `client`: `npx vite build`; `mobile`: manual device smoke).
4. Merge to `enhancement/expense-manager-parity`. Tick the phase's boxes here.
5. Do not start the next phase of the same feature until this one is merged.
