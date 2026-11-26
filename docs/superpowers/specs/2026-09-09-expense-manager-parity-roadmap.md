# Expense Manager Parity — Enhancement Roadmap

Date: 2026-09-09
Status: Roadmap approved. Individual feature specs + plans TBD (produced one feature at a time).
Branch: `enhancement/expense-manager-parity`

## Purpose

Bring four features from the reference app **Expense Manager**
(expensemanager.pro / `vsolutions.expenses`) into this project. Reference for
feature ideas only — not a visual or code clone. This document is the
**roadmap**: feature order, dependencies, per-phase sub-task checklists, and
the open questions each feature's detailed spec must resolve. Full design
specs and TDD implementation plans are written later, one feature at a time,
when that feature is picked up.

## The three apps (context)

| App | Path | Stack |
|---|---|---|
| API | `server/` | Node ESM, Express 4, Mongoose 8, Zod, JWT |
| Web client | `client/` | React 18, Vite 4, Tailwind 3, Recharts, `client/src/components/form/` kit |
| Mobile | `mobile-app/` | Expo ~54, RN 0.81, offline-first: `expo-sqlite` local queue + `syncEngine.js` + server `syncController.js` |

Current models: `User`, `Category`, `Expense`, `Debt`, `Budget`. `Expense`
has `user`, `amount` (Number), `date` (YYYY-MM-DD string), `category` (ref),
`type` (`expense|income`), `tags`, `notes`, `isRecurring` + recurring fields,
`client_uuid` (sync key). Indexes: `{user, date}`, `{user, category}`,
`{user, type}`.

## Feature order & dependency rationale

```
1. Payment Mode       — standalone. Smallest. No deps. Warm-up.
2. Activity Heatmap    — standalone. Read-only view over existing expense data.
3. Privacy Mode        — cross-cutting client display concern. Do AFTER 1 & 2 so
                         the <Amount> wrapper covers their new UI in one sweep.
4. Accounts + Transfers — structural. New models + `account` on every Expense +
                         Transfer concept + balance math + reconciliation +
                         migration + sync changes. Do LAST, on a clean slate.
```

Each feature runs in **three phases in this order: API → Web → Mobile.** Each
phase is its own spec + implementation plan + execution + review cycle. A
phase is not started until the previous phase for that feature is merged.

## Progress tracker

- [ ] **Feature 1 — Payment Mode**
  - [ ] 1A API — spec, plan, execute, merge
  - [ ] 1B Web — spec, plan, execute, merge
  - [ ] 1C Mobile — spec, plan, execute, merge
- [ ] **Feature 2 — Activity Heatmap**
  - [ ] 2A API
  - [ ] 2B Web
  - [ ] 2C Mobile
- [ ] **Feature 3 — Privacy Mode**
  - [ ] 3A API (minimal / optional)
  - [ ] 3B Web
  - [ ] 3C Mobile
- [ ] **Feature 4 — Accounts + Transfers**
  - [ ] 4A API
  - [ ] 4B Web
  - [ ] 4C Mobile

---

## Feature 1 — Payment Mode

**What:** a payment-method field on each transaction, plus a spend-by-method
breakdown in analytics. High value for the ₹/UPI market this app targets.

**Enum (proposed, lock in 1A spec):** `cash`, `upi`, `card`, `netbanking`,
`wallet`, `other`. Default `other`.

### 1A · API

- [ ] Add `paymentMode` to `Expense` schema: `enum` above, `default: 'other'`, not `required` (old rows read as `other`)
- [ ] Accept + validate `paymentMode` in the expense create Zod schema and the update schema
- [ ] `expenseController` create/update: persist `paymentMode` (it already spreads body fields — verify + add to any explicit field list)
- [ ] New aggregation in `analyticsController`: total + count grouped by `paymentMode` for a `type: 'expense'` set over `[from, to]`
- [ ] Route: `GET /api/analytics/payment-modes?from=YYYY-MM-DD&to=YYYY-MM-DD` (auth required), registered in `analyticsRoutes.js`
- [ ] Shared-analytics: decide whether the public shared view includes payment-mode data (default: no)
- [ ] No migration script — absent field is treated as `other` at read time
- [ ] Verify existing `expense` aggregations are unaffected (additive field)

**1A spec must resolve:** final enum values + labels; whether `other` or `null` is the default at the DB level; whether the shared/public analytics endpoint exposes this.

### 1B · Web

- [ ] Payment-mode picker in the Expense add/edit form — chip row using the existing `client/src/components/form/` kit (`SegmentedToggle` is 2-option only; likely a new small `ChipGroup` or reuse `CategoryChips` visual)
- [ ] `formData.paymentMode` wired into `handleSubmit` (no validation change — has a default)
- [ ] Payment-mode badge on expense list rows and `MobileExpenseCard`
- [ ] Donut / bar chart "Spending by payment method" in `AnalyticsDashboard.jsx` (Recharts, already a dep — follow `dataviz` skill palette rules)
- [ ] `analyticsService` (or equivalent) call for `GET /api/analytics/payment-modes`
- [ ] Optional: payment-mode filter in the Expenses filter bar
- [ ] Edit form pre-fills `paymentMode` from the record

**1B spec must resolve:** exact picker component (new vs reuse); chart type (donut vs horizontal bar); whether the filter is in scope for this phase or deferred.

### 1C · Mobile

- [ ] Payment-mode chip row in `AddExpenseScreen.js` (matches the existing category-chip pattern there)
- [ ] Include `paymentMode` in `offlineService.saveExpenseLocally` payload
- [ ] Include `paymentMode` in the sync payload; confirm `syncController.js` passes it through (`...data` spread) or extend its explicit mapping
- [ ] Payment-mode chart in `AnalyticsScreen.js`
- [ ] Badge on transaction rows in the transactions list
- [ ] Edit flow pre-fills `paymentMode`

**1C spec must resolve:** offline analytics — compute the breakdown from local SQLite when offline, or only show it online? (Recommend: online-only for the chart, matching how other analytics behave.)

---

## Feature 2 — Activity Heatmap

**What:** a GitHub-style calendar grid of daily spending activity on the
dashboard. Mostly a new *presentation* of data the app already stores.

### 2A · API

- [ ] Aggregation: per-day `{ date, expenseTotal, incomeTotal, count }` for a date window (default last ~16 weeks / 112 days, param `weeks`)
- [ ] Route: `GET /api/analytics/daily-activity?weeks=16` (auth required), in `analyticsRoutes.js`
- [ ] Reuses the existing `{user, date}` index — no schema change
- [ ] Return days with zero activity as absent (client fills gaps) or as explicit zero rows — decide in spec
- [ ] Shared/public analytics: include or not (default: not)

**2A spec must resolve:** window size + max cap on `weeks`; sparse vs dense response; whether `incomeTotal` is included or expense-only.

### 2B · Web

- [ ] `ActivityHeatmap` component — 7×N grid, 4–5 step color scale by intensity, per-cell tooltip (date + totals), light + dark palettes per `dataviz` conventions
- [ ] Place on `Dashboard.jsx`; clicking a cell navigates to the Expenses list filtered to that day
- [ ] `analyticsService.getDailyActivity()`
- [ ] Empty state when the user has no expenses yet
- [ ] Responsive: horizontal scroll on narrow screens, no page overflow

**2B spec must resolve:** color scale thresholds (fixed buckets vs quantile of the user's own range); what "intensity" maps to (expense total, or count, or net); click target behavior.

### 2C · Mobile

- [ ] `ActivityHeatmap` RN component, same data contract as web
- [ ] Place on `DashboardScreen.js`
- [ ] Data source: server endpoint when online; when offline either hide it or compute from local SQLite — decide in spec (recommend: server-only, gracefully hidden offline)
- [ ] Tap a cell → navigate to a filtered transactions view for that day

**2C spec must resolve:** offline behavior (hide vs local-compute); cell tap target on a small grid (min hit area).

---

## Feature 3 — Privacy Mode

**What:** one toggle that hides every monetary amount (and receipt images, if
those ever exist) app-wide, for using the app in public. Purely a client
display concern.

### 3A · API (minimal — may be a no-op)

- [ ] *Optional:* add `privacyModeDefault: Boolean` (default `false`) to `User`, exposed via the existing profile-update endpoint, so the preference syncs across devices
- [ ] If skipped, privacy state is per-device only (localStorage / AsyncStorage)

**3A spec must resolve:** persist the default server-side (cross-device) or keep it per-device only. Recommend server-side default + per-device session override.

### 3B · Web

- [ ] `PrivacyContext` — `{ isPrivate, toggle }`, initial value from `localStorage` (and user default if 3A done), persisted on change
- [ ] `<Amount value={n} />` component — renders a masked placeholder (`••••` or a blur span) when `isPrivate`, formatted currency otherwise; **all** currency rendering routes through it
- [ ] Sweep: replace raw amount renders with `<Amount>` across `Dashboard`, `Expenses` (list + cards + summary), `AnalyticsDashboard`, `Debts`, `Budgets`
- [ ] Toggle control: an eye / eye-off icon in the app header + a row in Settings/Profile
- [ ] Charts: decide — blur the whole chart, hide axis numbers, or leave charts alone (recommend: hide numeric axis labels + tooltips when private)
- [ ] Receipt images: none exist today — stub the hook, no work

**3B spec must resolve:** mask style (dots vs blur); chart behavior under privacy; whether the toggle is global-only or also has a keyboard shortcut; the exhaustive list of amount-render sites (grep-derived, in the spec).

### 3C · Mobile

- [ ] `PrivacyContext` equivalent, persisted to `AsyncStorage`
- [ ] `<Amount>` RN component
- [ ] Sweep the same screens: `DashboardScreen`, transactions list, `AnalyticsScreen`, `DebtScreen`, `BudgetSettingsScreen`
- [ ] Toggle: header icon; consider an app-backgrounded auto-privacy option (defer unless asked)
- [ ] Respect the server default from 3A on first load if implemented

**3C spec must resolve:** same as 3B, plus whether backgrounding the app auto-enables privacy (recommend: defer).

---

## Feature 4 — Accounts + Transfers

**What:** money lives in accounts (cash, bank, card, savings). Every
transaction belongs to an account. Transfers move money between accounts
without being income/expense. Reconcile an account to a real statement. This
is the structural one.

### 4A · API

- [ ] `Account` model: `{ user, name, type: enum['cash','bank','card','savings','other'], openingBalance: Number (default 0), currency, archived: Boolean, createdAt }`
- [ ] `account` field on `Expense`: `ref: 'Account'`, **not required** initially (old rows → seeded default account)
- [ ] Seed a **default account** per user (on registration, like default categories); a data migration seeds one for every existing user and assigns all their existing expenses to it
- [ ] `Transfer` model: `{ user, fromAccount, toAccount, amount, date (YYYY-MM-DD), note, client_uuid }` — a transfer is its own entity, not an Expense
- [ ] Balance computation: `openingBalance + Σincome − Σexpense + ΣtransfersIn − ΣtransfersOut`. Decide: computed on read (aggregation) vs stored-and-recomputed. Recommend computed-on-read first; add a cached field only if perf demands it (`ponytail:` note the ceiling)
- [ ] Account CRUD routes (`/api/accounts`), Transfer CRUD routes (`/api/transfers`)
- [ ] Balance-adjustment / reconcile endpoint: given a target balance, create a compensating adjustment record (as an `Expense` of a special category, or a dedicated `Adjustment` entity — decide in spec)
- [ ] Per-account statement endpoint: `GET /api/accounts/:id/statement?from&to` — merged, date-sorted list of expenses + transfers touching that account
- [ ] Existing analytics: still valid (account is additive); add optional `?account=` filter to expense/analytics queries
- [ ] Zod schemas for account + transfer create/update
- [ ] Migration script is idempotent and reversible-documented

**4A spec must resolve:** computed vs stored balance (and the cache-invalidation story if stored); reconcile as special-Expense vs dedicated entity; whether transfers can cross currencies (recommend: no, same-currency only, v1); default-account naming; what happens to an account's transactions when it's archived (block archive if non-empty? reassign? keep read-only?).

### 4B · Web

- [ ] `AccountContext` + `accountService`
- [ ] Accounts page: list with computed balances, add / edit / archive, nav entry (`PiggyBank`-style icon, distinct from Budgets)
- [ ] Account picker in the Expense add/edit form (defaults to the user's default account or last-used)
- [ ] Transfer form (new) — from / to / amount / date / note; from ≠ to validation
- [ ] Account filter in the Expenses filter bar and Analytics
- [ ] Reconcile UI on an account (enter real balance → confirm adjustment)
- [ ] Dashboard: total net balance across accounts + per-account cards
- [ ] Per-account statement view

**4B spec must resolve:** default account selection logic (default flag vs last-used); whether transfers appear in the main Expenses list (recommend: separate "Transfers" section/tab); reconcile UX copy.

### 4C · Mobile

- [ ] `AccountContext` + service
- [ ] Account picker in `AddExpenseScreen`
- [ ] Offline: `account` in the local expense payload + sync; **transfers need their own local SQLite queue + a new sync path**
- [ ] `syncEngine.js` + `syncController.js`: new sync type for transfers (mirror the expense sync pattern with `client_uuid` dedupe)
- [ ] `AccountsScreen`, transfer flow, reconcile flow
- [ ] Offline balance display: compute from local + last-known-server state, or show "syncing…" — decide in spec
- [ ] Migration: existing local (unsynced) expenses get the default account assigned on next sync

**4C spec must resolve:** offline transfer semantics (allowed offline? queued?); offline balance accuracy expectations; conflict handling if the default account changes server-side while offline.

---

## Ground rules for every feature's spec + plan

- **TDD** per the `superpowers:test-driven-development` skill. `server/` — add a
  test runner if none exists (check first; a plan task if needed). `client/`
  has no runner today — verification is `npx vite build` + manual checklist
  unless a runner is added. `mobile-app/` — same, check first.
- **`ponytail`** intensity applies: smallest change that works, reuse the
  existing `form/` kit and analytics patterns, no new deps without
  justification, mark deliberate shortcuts with `ponytail:` comments.
- Each phase = one spec (`docs/superpowers/specs/`) + one plan
  (`docs/superpowers/plans/`) + execution via
  `superpowers:subagent-driven-development` + review, then merge to
  `enhancement/expense-manager-parity`.
- No phase starts before its predecessor phase (same feature) is merged.
- Features are independent enough to reorder 2↔3 if needed, but 1 first and 4
  last are fixed.

## Not in scope (explicitly deferred)

- Multiple profiles (Personal/Business/Family)
- Savings goals (distinct from Budgets)
- Multi-currency conversion / live rates
- Receipt photo attachments + cloud sync
- PDF statement export (partial export infra already exists — separate effort)
- Bill reminders / recurring-due notifications
- Web Companion (local server browser access)
- Net-worth tracking, split transactions, tags/labels UI
