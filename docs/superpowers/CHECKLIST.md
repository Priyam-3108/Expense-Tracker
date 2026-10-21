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
- [x] Task 1: `PAYMENT_MODES` constant module (values, labels, icons)
- [x] Task 2: `PaymentModeChips` form-kit component
- [x] Task 3: Wire `paymentMode` into the Expense add/edit form
- [x] Task 4: `paymentMode` in `expenseService` create/update payloads (pass-through check) — confirmed no-op, both layers forward verbatim
- [x] Task 5: Payment-mode badge on expense list rows + `MobileExpenseCard`
- [x] Task 6: `analyticsService.getPaymentModeBreakdown()`
- [x] Task 7: "Spending by payment method" chart in `AnalyticsDashboard`
- [x] Task 8: Build + grep gates pass; manual browser checklist handed to human partner (no Playwright/chromium-cli in this environment, would violate zero-new-deps)
- [x] **1B merged** (committed directly to `enhancement/expense-manager-parity`,
  commits `031e6f8`..`04049f2`)

> **1B notes (2026-09-12):**
> - Executed via `superpowers:subagent-driven-development` — 8 tasks, 7 fresh
>   implementer+reviewer subagent pairs, all approved clean on first pass
>   (2 minor deferred findings in Task 5, both plan-mandated code).
> - Final whole-branch review (`/code-review high`) surfaced 3 real
>   pre-existing Phase 1A server bugs alongside 3 new 1B client issues.
>   Fixed all 6 in one consolidated commit (`04049f2`), re-reviewed clean:
>   - `GET /api/analytics/payment-modes` had a dead `validateDateRange`
>     middleware (checks `startDate`/`endDate`; controller reads `from`/`to`)
>     — added inline date validation in the controller instead of renaming
>     the spec-documented `from`/`to` contract.
>   - `POST /expenses/bulk` let an invalid `paymentMode` throw inside
>     `insertMany` and fail the whole batch with a 500 — added a per-row
>     check to the existing validation loop (errors[] pattern).
>   - CSV/Excel export were missing the `paymentMode` column — added to
>     both. PDF export left untouched (fixed-width layout, no spare room —
>     deferred, not a regression).
>   - Client: chart didn't clear stale data on a failed refetch, fixed;
>     `getPaymentMode`/`PAYMENT_MODE_MAP` had duplicate lookup logic,
>     consolidated; `PaymentModeBadge`'s dead-code guard removed.
> - **Deferred, not bugs:** `syncController.js`'s per-item try/catch
>   (partial-success inside 200) is intentional sync-contract behavior, left
>   as-is. Chart not respecting Analytics' category/type filters, and
>   `hideOther` merging legacy-undefined with explicit-`other`, both match
>   the spec's documented v1 scope/non-goals — not defects.
> - **Manual browser walkthrough not run by an agent** — no
>   Playwright/chromium-cli available and installing one would violate the
>   zero-new-deps constraint; handed the plan's Task 8 manual checklist to
>   the human partner to run themselves against the already-running dev
>   servers (localhost:5000 API + localhost:5173 client).

### 1C · Mobile — `plans/2026-09-10-payment-mode-1c-mobile.md`
- [x] Task 1: `PAYMENT_MODES` constant (mobile copy)
- [x] Task 2: Payment-mode chip row in `AddExpenseScreen`
- [x] Task 3: `paymentMode` in `offlineService.saveExpenseLocally` payload
- [x] Task 4: `paymentMode` in `syncEngine` sync payload
- [x] Task 5: Payment-mode badge on `TransactionItem`
- [x] Task 6: `paymentMode` chart in `AnalyticsScreen` (online-only)
- [x] Task 7: Manual device/emulator smoke (grep gate + cross-file babel parse run by
  agents; live device sweep deferred to human partner — no emulator in this
  environment)
- [x] **1C merged** (committed directly to `enhancement/expense-manager-parity`,
  commits `5f97c15`..`4e75063`)

> **1C notes (2026-10-22):**
> - Executed via `superpowers:subagent-driven-development` — 7 tasks, all approved
>   clean on first per-task review pass. Task 3 was a no-op (both `offlineService`
>   and `syncEngine` already spread the payload verbatim — confirmed, no commit).
> - Final whole-phase review (Opus) surfaced 2 Important + 1 Minor finding, fixed in
>   one consolidated commit (`4e75063`), scoped re-review confirmed all addressed:
>   - **Pre-existing bug, newly load-bearing:** mobile edit sync always minted a
>     fresh `client_uuid`, so `syncExpenses`'s client_uuid-only lookup never matched
>     an edited row and fell through to `Expense.create` with the edit's stale
>     `_id`, throwing a duplicate-key error on every edit sync (silent permanent
>     failure). Not introduced by this phase, but 1C's plan promised edit works —
>     surfaced to human partner via AskUserQuestion, who chose "fix now, same PR".
>     Fixed by routing `_id`/`id`-bearing payloads through `findOneAndUpdate`
>     scoped to `{_id, user}` with `runValidators: true`. New test added
>     (`server/test/paymentMode.route.test.mjs`): create → sync-edit with new
>     client_uuid → assert `action: 'UPDATED'`, persisted change, no duplicate doc.
>   - `AnalyticsScreen`'s payment-mode chart kept stale data when the main
>     analytics fetch failed (e.g. offline) because its own try/catch was never
>     reached — contradicted the spec's "hidden offline" requirement. Fixed by
>     resetting `pmData` in the outer catch too.
>   - Minor: redundant `marginLeft: 4` on the payment chip label, double-spacing
>     vs. the Category chips above (brief-mandated code, cosmetic) — removed.
> - **No emulator/device available in this environment** for any task, consistent
>   across all 7 tasks' verification steps. Substituted babel/AST parse of every
>   touched file (individually per task, then all 5 together at Task 7) — all
>   clean, no syntax errors. The plan's Task 7 Step 3 live cross-flow sweep (add
>   online/offline+sync, edit-mode-changes, recurring propagation, badge dark/light,
>   chart online-only/refetch/hidden-offline) was **not run** — handed to the human
>   partner, same precedent as Phase 1B's manual browser checklist.
> - `server npm test`: 6/6 files green (13 cases), independently re-run by the
>   scoped re-reviewer (not just the implementer).

---

## Feature 2 — Activity Heatmap

Spec: `specs/2026-09-10-activity-heatmap-design.md`

### 2A · API — `plans/2026-09-10-activity-heatmap-2a-api.md`
- [x] Task 1: `dateWindow` util (`clampWeeks`, `trailingWindow`)
- [x] Task 2: `getDailyActivity` controller + aggregation
- [x] Task 3: `GET /api/analytics/daily-activity` route (auth)
- [x] Task 4: Manual smoke + shape check (live run against real server+DB — SMOKE OK)
- [x] **2A merged** (committed directly to `enhancement/expense-manager-parity`,
  commits `b833300`..`703fad3`)

> **2A notes (2026-10-22):**
> - Executed via `superpowers:subagent-driven-development` — 4 tasks, TDD
>   throughout (write failing test → confirm fails → implement → confirm passes),
>   all approved clean on first per-task review pass.
> - DB-backed tests used the Node-16 workaround established in Phase 1A (top-level
>   `await connectTestDb()` + a final `'zz cleanup'` test, instead of the plan's
>   literal `test.before`/`afterEach`/`after` hooks, which silently don't run on
>   Node 16). Verified by reviewers to preserve real test isolation via per-test
>   unique ObjectId partitioning.
> - Task 4's live smoke script was actually run against a real dev server + real
>   MongoDB (not just written): registered a scratch user, created real expenses,
>   hit the endpoint, got `SMOKE OK` with a 111-day window matching the 16-week
>   default exactly; scratch data cleaned up afterward.
> - Final whole-phase review (Opus) found **zero findings** — no fix wave needed.
>   Reviewer independently re-verified the aggregation pipeline clause-by-clause,
>   probed 53+ adversarial `weeks` inputs (confirmed never 400/500), and ran a
>   cross-user data-isolation probe with same-date fixtures to confirm the `user`
>   filter can't leak another user's data (the shipped tests never used
>   same-date, cross-user fixtures, so this was a genuinely new check).
> - Non-finding carried forward for 2B/2C awareness: `to` is server-local "today"
>   per the spec's explicit choice — a client in a different timezone can be up to
>   a day ahead of the grid's last cell. Not a defect, just a heads-up for the web
>   and mobile phases.

### 2B · Web — `plans/2026-09-10-activity-heatmap-2b-web.md`
- [x] Task 1: `analyticsService.getDailyActivity()`
- [x] Task 2: `useDailyActivity` hook (fetch + gap-fill to a dense 7×N grid)
- [x] Task 3: `ActivityHeatmap` component (grid, 5-step scale, tooltip, dark palette)
- [x] Task 4: Place on `Dashboard`, cell click → filtered Expenses for that day
  (full-width row, placement ruling — see notes)
- [x] Task 5: Seed Expenses date filter from a heatmap cell click (executed, not
  skipped — plan marked it optional, reconciliation found no blocker)
- [x] Task 6: Build + grep gate (manual browser checklist handed to human partner)
- [x] **2B merged** (committed directly to `enhancement/expense-manager-parity`,
  commits `2fb0e53`..`6fa2ab3`)

> **2B notes (2026-10-22):**
> - Executed via `superpowers:subagent-driven-development` — 6 tasks, all
>   approved clean on first per-task review pass.
> - **Plan defect found and ruled before execution:** the plan's Task 4 said to
>   insert the heatmap card "immediately before Recent Activity," which lives in
>   a narrow `xl:col-span-1` sidebar column. A 16+ week horizontally-scrolling
>   grid in a 1/3-width column would always be scrolling and look broken.
>   Surfaced to human partner, who chose full-width instead: the card now sits
>   as its own full-width row above the `xl:grid-cols-3` two-column section
>   (Financial Overview chart + Quick Actions/Recent Activity sidebar).
>   Independently verified correct by the per-task and final reviewers.
> - **Task 5 executed despite being marked optional** — the plan said skip if
>   touching `Expenses.jsx` seemed out of scope; reconciliation found no
>   blocking drift, so it was built: clicking a heatmap cell now actually
>   filters the Expenses list to that day.
> - **Parked by ruling, not fixed:** Task 2's `bucketFor` boundary classifies a
>   day exactly AT a quantile threshold (p25/p50/p75) into the lower bucket,
>   while the spec's prose says "at/above p75 is bucket 4" (implies rounding
>   up). This is verbatim plan code, not an implementer deviation — surfaced to
>   the human partner, who chose to leave it as-is (self-consistent across all
>   3 thresholds; negligible real-world impact with continuous currency totals).
> - Final whole-phase review (Opus) found 4 Minor issues (no Critical/Important):
>   month-label alignment/scroll-sync, an overstated "16 weeks" caption, and a
>   stale-filter bug where clicking a heatmap cell then manually clearing the
>   filter then pressing Back would silently re-seed the old date filter. Human
>   partner chose to fix all 4 before merging; fixed in one consolidated commit
>   (`6fa2ab3`), scoped re-review confirmed all 4 ADDRESSED, no new breakage,
>   re-reviewer independently re-ran `npx vite build` (green).
> - **No browser available in this environment** for any task — manual visual
>   checks (tooltip content/position, click-through, light/dark, responsive
>   resize, API-down state) were not run and are handed to the human partner,
>   same precedent as every prior web/mobile phase.

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
