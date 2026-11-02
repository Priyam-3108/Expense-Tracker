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
- [x] Task 1: `getDailyActivity` in mobile `expenseService`
- [x] Task 2: `heatmapGrid` util (dense grid + quantile buckets, plain-`Date`)
- [x] Task 3: `ActivityHeatmap` RN component (`Pressable` cells, theme-derived palette)
- [x] Task 4: Place on `DashboardScreen` (3 placement/style/alert rulings — see notes)
- [x] Task 5: Manual smoke (grep gate + cross-file babel parse run by agents;
  live device sweep deferred to human partner — no emulator in this environment)
- [x] **2C merged** (committed directly to `enhancement/expense-manager-parity`,
  commits `53193b3`..`e59eabd`)

> **2C notes (2026-10-31):**
> - Executed via `superpowers:subagent-driven-development` — 5 tasks, all
>   approved clean on first per-task review pass except Task 3 (1 fix round).
> - **date-fns confirmed NOT a mobile dependency** — Task 2's plain-`Date`
>   fallback (the plan's own default "works regardless" implementation) used
>   as written, no decision needed.
> - **Mid-task fix (Task 3):** the newly-created `ActivityHeatmap.js` rendered
>   its month-label row as a sibling OUTSIDE the grid's `ScrollView` (the
>   plan's own required code, not an implementer deviation) — so it didn't
>   scroll in sync with the grid, the same bug class already found and fixed on
>   web in Phase 2B. Fixed immediately via the same restructuring pattern 2B
>   used (month-label row moved inside the scroll container), rather than
>   deferring to final review, since the fix was already well-understood.
> - **3 controller rulings for Task 4**, all found during reconciliation before
>   dispatch: the plan assumed a plain `ScrollView` (`DashboardScreen.js`
>   actually uses `FlatList` + `ListHeaderComponent={renderHeader}` — card
>   placed inside `renderHeader()`); assumed a pre-existing `styles.card`/
>   `cardTitle` (none existed — added new `activityCard`/`activityCardTitle`
>   styles instead); assumed `SearchScreen` accepts a date param (it doesn't —
>   a cell tap shows a second, independent `CustomAlert` instance instead of
>   navigating). All three independently verified correctly implemented.
> - Final whole-phase review (Opus) found 1 Important + 4 Minor:
>   - **Important, re-introduced bug:** the card's "Activity · last 16 weeks"
>     caption overstates the window — the grid renders 17 columns ~86% of the
>     time (verified: 343/400 consecutive "today" dates). This is the exact
>     same bug Phase 2B's final review already fixed on web ("Last 16 weeks" →
>     "Last ~16 weeks"); the mobile Task 4 brief predated that fix. Fixed to
>     match web's wording exactly.
>   - Minor: heatmap fetch had no `else` branch for a malformed-but-200
>     response, leaving stale data on screen indefinitely — fixed.
>   - Minor: heatmap block used its own `NetInfo.fetch().isConnected` check
>     instead of reusing `isOfflineMode` (a more accurate "server reachable"
>     signal the same function already computes) — fixed, also removed the
>     now-unused `NetInfo` import.
>   - Minor: legend's hardcoded `marginLeft: 18` didn't match the weekday
>     column's actual (unset) width — fixed with a shared `LABEL_COL` constant.
>   - Minor (ruling, no code change): the spec's "render the empty grid online,
>     hide only when offline" parenthetical conflicts with the plan's explicit,
>     consistently-reviewed hide-when-empty behavior. Accepted the plan's
>     behavior as the resolution — simpler, avoids a confusing empty grid for a
>     brand-new user on a small screen, and it was already in every per-task
>     review's scope.
>   - Fixed in one consolidated commit (`e59eabd`), scoped re-review confirmed
>     all 4 code-change findings ADDRESSED, no new breakage.
> - **No emulator/device available in this environment** for any task — same
>   limitation as every mobile phase in this program. Substituted babel/AST
>   parse of every touched file. The live device sweep (online render/shading/
>   scroll, tap-to-alert, offline hide, empty-account hide, dark/light,
>   rotation/small-screen) was **not run** — handed to the human partner.
> - **Feature 2 (Activity Heatmap) is now complete across API + Web + Mobile.**

---

## Feature 3 — Privacy Mode

Spec: `specs/2026-09-10-privacy-mode-design.md`

### 3A · API — `plans/2026-09-10-privacy-mode-3a-api.md`
- [x] Task 1: Add `privacyModeDefault: Boolean` (default `false`) to `User`
- [x] Task 2: `PUT /api/auth/profile` sets `privacyModeDefault` (boolean-only,
  not coerced — a non-boolean is silently ignored)
- [x] Task 3: Manual smoke + regression check (live run against the real dev
  server — SMOKE OK; profile update + login round-trip confirmed)
- [x] **3A merged** (committed directly to `enhancement/expense-manager-parity`,
  commits `aca6e12`..`1e81389`)

> **3A notes (2026-10-31):**
> - Executed via `superpowers:subagent-driven-development` — 3 tasks, TDD
>   throughout, all approved clean on first per-task review pass. This is the
>   smallest phase in the program so far: 8 lines of production code (4 schema,
>   2 controller, 2 import/destructure) plus tests.
> - No route 2 ("`/auth/me`") exists separately in this codebase — the spec's
>   "login + /auth/me" language maps onto this app's actual `login`/`register`/
>   `getProfile`/`updateProfile` endpoints, all of which already call
>   `user.toJSON()`. No change was needed to any of them beyond `updateProfile`'s
>   write path — `privacyModeDefault` rides along automatically once added to
>   the schema, exactly as the spec predicted and the plan assumed. Verified by
>   the final reviewer reading all four controller functions directly, not by
>   trusting the claim.
> - Task 3's live smoke script was actually run against the real dev server
>   (not just written): registered a scratch user, hit `GET`/`PUT
>   /api/auth/profile`, confirmed the field's presence, the toggle, and the
>   non-boolean-ignored behavior; also ran the Step 4 regression check (profile
>   name/currency update still works, login response carries the field).
>   Scratch user cleaned up afterward; verified via `ps aux` that no server
>   process was leaked.
> - Final whole-phase review (Opus) found **zero findings** — no fix wave
>   needed. Reviewer specifically probed the mass-assignment question (can
>   `privacyModeDefault` be set through any path other than `updateProfile`'s
>   guard?) and confirmed negative on three independent layers: `register`
>   constructs `User` from an explicit field list (no `req.body` spread), Zod's
>   `registerSchema` strips unknown keys before `register` even runs, and the
>   only other `User`-write path in the server (`categoryController.js`) is a
>   hardcoded single-field literal unrelated to this feature.
> - Non-blocking note carried forward: Task 2's "ignores non-boolean" test
>   starts from `privacyModeDefault: true` rather than `false` as its control
>   value — still correctly satisfies the requirement, just a slightly weaker
>   test than it could be. Not worth a fix.

### 3B · Web — `plans/2026-09-10-privacy-mode-3b-web.md`
- [x] Task 1: `PrivacyContext` (`isPrivate`, `toggle`, localStorage + user default seed)
- [x] Task 2: `<Amount>` component (mask vs formatted currency)
- [x] Task 3: Provider mounted in `App.jsx`
- [x] Task 4: Header eye/eye-off toggle
- [x] Task 5: Settings/Profile row (persists `privacyModeDefault` via API — 2
  controller rulings, see notes)
- [x] Task 6: Sweep `Dashboard` amount renders → `<Amount>`
- [x] Task 7: Sweep `Expenses` + `MobileExpenseCard` → `<Amount>` (1 title=
  attribute carve-out, see notes)
- [x] Task 8: Sweep `AnalyticsDashboard` (numbers + chart axis/tooltip
  suppression — 5 controller rulings, see notes)
- [x] Task 9: Sweep `DebtList`/`DebtStats`/`RepaymentModal` (Budgets confirmed
  absent on this branch, skipped)
- [x] Task 10: Build + grep gates (found + fixed a real gap, see notes)
- [x] **3B merged** (committed directly to `enhancement/expense-manager-parity`,
  commits `a26e466`..`dbb8c08`)

> **3B notes (2026-11-02):**
> - Executed via `superpowers:subagent-driven-development` — 10 tasks, all
>   approved clean on first per-task review pass. The largest and most
>   complex phase in this program so far (10 tasks, ~11 files swept).
> - **Reconciliation delegated to an Explore subagent given the breadth**,
>   then independently spot-checked by the controller — found 6 real drift
>   issues against the 2026-09-10 plan, resolved before dispatch:
>   - Task 5: `AuthContext.updateProfile` never actually rejects (always
>     resolves `{success, error?}`, already toasts internally on both paths)
>     — the plan's try/catch handler would never catch a failure. Rewrote the
>     handler to branch on `result.success`, dropped the plan's own toast
>     calls (would have double-toasted).
>   - Task 5: the currency `<select>` sits inside an unrelated form — moved
>     the switch to a sibling after that form closes, not inside it.
>   - Task 7: `Expenses.jsx`'s calendar day-cell `title={...}` attribute is a
>     native string, not JSX — `<Amount>` (a React component) can't go there.
>     Carved out as the one site using an inline `isPrivate`-guarded ternary
>     instead; amended the grep gate's expected output accordingly.
>   - Task 8 (`AnalyticsDashboard.jsx`, highest-risk task): two `YAxis`
>     tickFormatters post-process with `.replace(/[^\d.-]/g, '')` to strip the
>     currency symbol for compact axis labels — the guard had to preserve
>     that, not just blank-or-format. One Tooltip formatter returns an array
>     `[value, label]` for a 3-series chart — the guard had to wrap only the
>     value expression, not replace the whole function (which would have
>     broken 2 of 3 series' labels). Phase 1B's "Spending by payment method"
>     chart (added after this plan was written) needed only its Tooltip
>     guarded — its axes are non-currency and were left untouched. All five
>     rulings independently verified character-for-character correct.
> - **Task 10's own grep gate caught a real, unplanned gap**: `ActivityHeatmap.jsx`
>   (created in Phase 2B, never in this plan's file list) had an unguarded
>   `formatCurrency` in its hover-tooltip amount render — would have leaked
>   real amounts under privacy mode. Fixed directly (3 lines), reviewed before
>   committing, confirmed correct.
> - **Final whole-phase review (Opus) found one more gap of the same shape**:
>   `Categories.jsx` (also never in this plan's file list) hand-formats
>   currency via a local `currencySymbols` map + `.toFixed(2)` instead of
>   `formatCurrency` — invisible to both of this phase's grep gates. Routed
>   through `<Amount>`. Also fixed a Minor mask-presentation inconsistency in
>   `Expenses.jsx`'s calendar view. A follow-up `currencySymbols[` sanity grep
>   across the whole codebase found no further leaks (5 hits, all decorative
>   glyphs or input-field affixes) — independently spot-checked by the scoped
>   re-reviewer.
> - **Lesson carried forward for F4 (Accounts+Transfers)**: this plan's own
>   grep-based "exhaustive" site list was derived the same way
>   (`grep -rn "formatCurrency("`), which is why it missed two files that
>   format currency by hand. Any future money-masking or money-formatting
>   sweep should grep more broadly than one helper function name.
> - No browser was available in this environment for any task — manual visual
>   checks were not run and are handed to the human partner, same precedent as
>   every prior web phase.

### 3C · Mobile — `plans/2026-09-10-privacy-mode-3c-mobile.md`
- [x] Task 1: `PrivacyContext` (AsyncStorage + user default seed)
- [x] Task 2: `<Amount>` RN component
- [x] Task 3: Provider in the app root
- [x] Task 4: Chart wrappers gain `hideValues` (Bar/Line/Pie)
- [x] Task 5: Sweep `BalanceCard`/`SummaryCard`/`TransactionItem`/`ProgressBar` (1
  controller ruling — removed a pre-existing dual-mask conflict, see notes)
- [x] Task 6: Sweep `DashboardScreen`/`AnalyticsScreen`/`DebtScreen`/
  `BudgetSettingsScreen` + header eye toggles (1 fix round — reactive masking +
  regex bug, see notes)
- [x] Task 7: "Hide amounts by default" Profile switch (1 implementer-caught
  response-shape correction, see notes)
- [x] Task 8: Grep gates + manual sweep (found + fixed a real gap, see notes)
- [x] **3C merged** (committed directly to `enhancement/expense-manager-parity`,
  commits `9a7522b`..`165d7fd`)

> **3C notes (2026-11-02):**
> - Executed via `superpowers:subagent-driven-development` — 8 tasks, all approved on
>   first or second review pass. This phase's own plan file lists 8 tasks (not 9 —
>   the final task is the manual-smoke/grep-gate verification step, same shape as 1C's
>   and 2C's final tasks).
> - **Reconciliation delegated to an Explore subagent given the breadth (13 files)**,
>   then independently spot-checked by the controller on the two highest-stakes
>   items — found 10 real drift issues against the 2026-09-10 plan, resolved before
>   dispatch:
>   - Task 5: `BalanceCard.js` already had its OWN local, independent privacy
>     toggle (`isBalanceVisible` state + its own eye-icon button) predating this
>     phase — blindly adding `<Amount>` would have created two competing mask
>     mechanisms. Ruling: removed the local mechanism entirely, consolidated onto
>     the global `PrivacyContext`.
>   - Task 6 (`DashboardScreen.js`/`AnalyticsScreen.js`, highest-risk task): the
>     plan's cited line numbers and site counts were stale (e.g. a `₹${...}`
>     interpolation was at line 406, not ~370; Analytics had 5 message-construction
>     sites, not 4). Controller delegated a second, narrower Explore pass to extract
>     exact verbatim current code before dispatching, rather than trusting the
>     plan's snippets directly — same discipline Phase 1B/2B used for drifted plans.
>   - Task 7 (`ProfileScreen.js`): the plan invented styles
>     (`settingRow`/`settingLabel`/`settingHint`) that don't exist in this file —
>     reused the existing `menuItem`/`toggle`/`toggleThumb` pattern already used by
>     the Theme toggle instead.
> - **A controller ruling about `authService.updateProfile`'s response shape was
>   itself wrong, and the Task 7 implementer caught it.** The controller's dispatch
>   instructed `res.data?.data?.user`; the implementer independently traced the
>   actual call chain (`authService.updateProfile` already does `return
>   response.data`, unwrapping the axios envelope once before the caller ever sees
>   it) and used `res.data?.user` instead, with a Node-script simulation to prove
>   it. The task reviewer and, independently, the final whole-phase reviewer both
>   re-verified this by reading the server controller and `authService.js`
>   directly — the implementer's correction was right. Had it shipped as
>   originally instructed, the Profile privacy-default switch would have silently
>   failed to sync `AuthContext`/AsyncStorage on every successful save. A genuine
>   example of a subagent correctly overriding a controller instruction with
>   verified evidence.
> - **Task 6's own fix loop (round 1/5)**: the first-pass `AnalyticsScreen.js`
>   insight-message masking was applied at message-CONSTRUCTION time (frozen into
>   state), not reactive to the privacy toggle — turning privacy ON didn't re-mask
>   already-loaded insight strings until the next refetch, a real leak on the exact
>   screen the task instruments. Fixed by moving the mask to the render site. Same
>   round also fixed a regex bug (`\s` in the character class ate the trailing
>   space after every masked amount).
> - **Task 8's own grep gate (run directly by the controller, not delegated)
>   caught a real, unplanned gap**: `AddDebtScreen.js` (never in this plan's
>   13-file scope) had 3 genuinely unmasked debt-amount displays (an `Alert`, a
>   "Remaining:" meta line, an "Original/Paid" info line) — found by running a
>   broader-than-planned `grep -rln "₹"` sweep, the same lesson Phase 3B's notes
>   explicitly carried forward. Fixed directly, reviewed before committing.
> - **Final whole-phase review (Opus) found one more real, mergeable issue**: 3
>   nested `<Amount>` calls had been given their parent `<Text>`'s FULL style
>   object, including layout props (`flex: 1`, `marginTop`) that RN mishandles on
>   an inline nested child. Fixed in a consolidated fix wave alongside 2 bundled
>   Minor triage items (DebtScreen's new eye icon landing mid-header instead of
>   grouped with the add button; a trivial icon-color consistency fix on
>   Analytics) and one free cleanup (DebtScreen's dead `fmt` helper, 0 callers).
>   Reviewer explicitly triaged 4 other Minor findings as ship-as-is (a dead
>   `ProgressBar.js` file nobody calls; a missing haptic tap; a cosmetic
>   `BudgetSettingsScreen` header margin; `BalanceCard`'s rupee glyph rendering
>   larger as the direct, intended consequence of the Task 5 ruling) and
>   re-affirmed Task 1's hydration-race ruling from the per-task review.
> - **Lesson reconfirmed from Phase 3B, now proven twice**: grep gates scoped to
>   specific helper names (`formatAmount`/`Intl.NumberFormat`) missed a real gap
>   (`AddDebtScreen.js`) both times a phase ran a broader `₹`-literal sweep as a
>   second pass. Recommend this broader-net second pass become a standing step for
>   F4's money-related work, not just a one-off lesson.
> - **No emulator/device available in this environment** for any task — every
>   verification was static (babel/AST parse checks, grep, direct code reading),
>   consistent with every prior mobile phase in this program. The plan's Task 8
>   manual on-device sweep was **not run** — handed to the human partner. The final
>   reviewer specifically flagged that no layout change in this phase has been
>   seen on a real screen, and recommended the human partner's first device pass
>   prioritize `BalanceCard`, the `DebtScreen` header, and `AddDebtScreen`'s repay
>   mode.
> - **Feature 3 (Privacy Mode) is now complete across API + Web + Mobile.**

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
