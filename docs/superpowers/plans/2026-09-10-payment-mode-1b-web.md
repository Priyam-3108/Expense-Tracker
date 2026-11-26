# Payment Mode — Phase 1B (Web) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let web users pick a payment mode when adding/editing an expense, show a payment-mode badge on expense rows and cards, and render a "Spending by payment method" bar chart in Analytics.

**Architecture:** One constants module shared by the picker, the badge, and the chart. A new `PaymentModeChips` form-kit component in the family of `CategoryChips`. `formData.paymentMode` threaded through the existing Expense add/edit `Modal` in `Expenses.jsx` (no validation change — it has a default). One `analyticsService` method + one self-contained chart card in `AnalyticsDashboard` that fetches its own data from `GET /api/analytics/payment-modes` keyed to the dashboard's `dateRange`.

**Tech Stack:** React 18, Vite 4, Tailwind 3, Recharts 2 (already a dep), `lucide-react`. No test runner in `client/` — verification is `npx vite build` + a manual checklist.

**Spec:** `docs/superpowers/specs/2026-09-10-payment-mode-design.md`

**Depends on:** Phase 1A merged (`paymentMode` accepted by `POST/PUT /api/expenses`, `GET /api/analytics/payment-modes` live).

## Global Constraints

- `PAYMENT_MODES` order: `upi, cash, card, netbanking, wallet, other`. Labels: `UPI`, `Cash`, `Card`, `Net Banking`, `Wallet`, `Other`. Icons: `Smartphone`, `Banknote`, `CreditCard`, `Landmark`, `Wallet`, `MoreHorizontal` (all from `lucide-react`).
- `formData.paymentMode` default `'other'`. Not a required field — no new `handleSubmit` validation.
- Do NOT touch the Bulk Edit modal or `BulkEditList` in this phase.
- `PaymentModeChips` is presentation-only: controlled `{ value, onChange(value) }`, no business logic.
- Dark mode: follow the `dark:` utility pattern used in `CategoryChips.jsx` and `MobileExpenseCard.jsx`.
- The chart card fetches independently; a fetch failure hides the card (no crash), it does not block the rest of Analytics.
- No new npm dependency.
- After each task: `cd client && npx vite build` succeeds (pre-existing chunk-size / dynamic-import / "use client" warnings are expected — ignore).
- Commit after each task with the message in its final step.

## File Structure

**Created**
- `client/src/constants/paymentModes.js` — `PAYMENT_MODES` (`[{ value, label, Icon }]`), `PAYMENT_MODE_MAP` (`{ value: {label, Icon} }`), `getPaymentMode(value)` → entry, defaulting to the `other` entry
- `client/src/components/form/PaymentModeChips.jsx` — controlled chip row
- `client/src/components/PaymentModeBadge.jsx` — tiny icon+label pill used on rows and cards

**Modified**
- `client/src/pages/Expenses.jsx` — `formData.paymentMode` in the three `formData` blocks (init, edit-prefill, `resetForm`), render `<PaymentModeChips>` in the add/edit `Modal`, add to the `expenseData` payload in `handleSubmit`; render `<PaymentModeBadge>` in the mobile-card path (via `MobileExpenseCard`) and the desktop list row
- `client/src/components/MobileExpenseCard.jsx` — render `<PaymentModeBadge>` under the category name
- `client/src/services/analyticsService.js` — `getPaymentModeBreakdown({ from, to })`
- `client/src/components/AnalyticsDashboard.jsx` — new "Spending by payment method" card

---

## Task 1: `paymentModes` constants module

**Files:**
- Create: `client/src/constants/paymentModes.js`

**Interfaces:**
- Consumes: `lucide-react`.
- Produces:
  - `export const PAYMENT_MODES` — array of `{ value: string, label: string, Icon: LucideComponent }` in the fixed order.
  - `export const PAYMENT_MODE_MAP` — `{ [value]: { label, Icon } }`.
  - `export function getPaymentMode(value)` — returns the matching entry, or the `other` entry when `value` is missing/unknown.

- [ ] **Step 1: Create the module**

```jsx
// client/src/constants/paymentModes.js
import { Smartphone, Banknote, CreditCard, Landmark, Wallet, MoreHorizontal } from 'lucide-react'

export const PAYMENT_MODES = [
  { value: 'upi', label: 'UPI', Icon: Smartphone },
  { value: 'cash', label: 'Cash', Icon: Banknote },
  { value: 'card', label: 'Card', Icon: CreditCard },
  { value: 'netbanking', label: 'Net Banking', Icon: Landmark },
  { value: 'wallet', label: 'Wallet', Icon: Wallet },
  { value: 'other', label: 'Other', Icon: MoreHorizontal },
]

export const PAYMENT_MODE_MAP = PAYMENT_MODES.reduce((m, e) => {
  m[e.value] = { label: e.label, Icon: e.Icon }
  return m
}, {})

export function getPaymentMode(value) {
  return PAYMENT_MODES.find((e) => e.value === value) || PAYMENT_MODE_MAP.other && PAYMENT_MODES[PAYMENT_MODES.length - 1]
}
```

Wait — simplify `getPaymentMode` to avoid the confusing expression:

```jsx
export function getPaymentMode(value) {
  return PAYMENT_MODES.find((e) => e.value === value)
    || PAYMENT_MODES.find((e) => e.value === 'other')
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds (nothing imports it yet — syntax check only).

- [ ] **Step 3: Commit**

```bash
git add client/src/constants/paymentModes.js
git commit -m "Add payment-mode constants module (web)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `PaymentModeChips` form-kit component

**Files:**
- Create: `client/src/components/form/PaymentModeChips.jsx`

**Interfaces:**
- Consumes: `PAYMENT_MODES` from `../../constants/paymentModes`.
- Produces: `export default function PaymentModeChips({ value, onChange })` — renders one horizontally-scrolling row of chips; each chip is `icon + label`; the selected chip is tinted indigo; clicking calls `onChange(mode.value)`.

- [ ] **Step 1: Create the component**

```jsx
// client/src/components/form/PaymentModeChips.jsx
import { PAYMENT_MODES } from '../../constants/paymentModes'

export default function PaymentModeChips({ value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {PAYMENT_MODES.map(({ value: mode, label, Icon }) => {
        const selected = mode === value
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border-[1.5px] whitespace-nowrap text-sm font-medium min-h-[40px] transition-all duration-200
              ${selected
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-400'
                : 'border-gray-300 dark:border-white/[0.15] text-gray-700 dark:text-slate-300'
              }`}
          >
            <Icon size={15} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/form/PaymentModeChips.jsx
git commit -m "Add PaymentModeChips form-kit component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Wire `paymentMode` into the Expense add/edit form

**Files:**
- Modify: `client/src/pages/Expenses.jsx`

**Interfaces:**
- Consumes: `PaymentModeChips` from `../components/form/PaymentModeChips`.
- Produces: `formData.paymentMode` (string, default `'other'`) present in the initial state, the edit-prefill `setFormData`, and `resetForm`; sent in the `expenseData` object in `handleSubmit`; `<PaymentModeChips>` rendered in the add/edit `Modal` between the Category block and the Notes block.

- [ ] **Step 1: Add the import**

After `import StickyFormFooter from '../components/form/StickyFormFooter'` (currently line 18):

```jsx
import PaymentModeChips from '../components/form/PaymentModeChips'
```

- [ ] **Step 2: Add `paymentMode` to the initial `formData`**

In the `useState` initializer (currently lines 112–121), add `paymentMode: 'other',` after `category: '',`:

```jsx
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: todayDate,
    category: '',
    paymentMode: 'other',
    type: 'expense',
    isRecurring: false,
    recurringPeriod: 'monthly',
    recurringEndDate: ''
  })
```

- [ ] **Step 3: Add `paymentMode` to the edit-prefill `setFormData`**

In the `useEffect` that runs when `editingExpense` changes (the `setFormData({ ... })` around line 239), add after `category: editingExpense.category?._id || editingExpense.category || '',`:

```jsx
        paymentMode: editingExpense.paymentMode || 'other',
```

- [ ] **Step 4: Add `paymentMode` to `resetForm`**

In `resetForm` (around line 255), add `paymentMode: 'other',` after `category: '',`:

```jsx
  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      date: getTodayDate(),
      category: '',
      paymentMode: 'other',
      type: 'expense',
      isRecurring: false,
      recurringPeriod: 'monthly',
      recurringEndDate: ''
    })
    setEditingExpense(null)
  }
```

- [ ] **Step 5: Add `paymentMode` to the submit payload**

In `handleSubmit`, in the `expenseData` object (around line 311), add after `category: formData.category,`:

```jsx
        paymentMode: formData.paymentMode,
```

- [ ] **Step 6: Render the picker in the add/edit Modal**

In the add/edit `<Modal>` scrollable content, immediately after the closing `</div>` of the Category block (the block that contains `<CategoryChips>`), insert:

```jsx
            <div>
              <SectionLabel>Payment method</SectionLabel>
              <PaymentModeChips
                value={formData.paymentMode}
                onChange={(mode) => setFormData({ ...formData, paymentMode: mode })}
              />
            </div>
```

(It sits between the Category `<div>` and the Notes `<div>`, inside `<div className="flex-1 overflow-y-auto p-5 space-y-5">`.)

- [ ] **Step 7: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds.

- [ ] **Step 8: Manual check**

`cd client && npm run dev`. Log in → Expenses → Add Expense:
- The "Payment method" chip row shows six chips, `Other` selected by default.
- Pick `UPI`, fill amount + category + date, submit → the expense is created. (Confirm in the Network tab that the POST body includes `"paymentMode":"upi"`.)
- Edit that expense → the form pre-selects `UPI`. Change to `Cash`, save → PUT body includes `"paymentMode":"cash"`.
- Add an expense without touching the chips → body has `"paymentMode":"other"`.

- [ ] **Step 9: Commit**

```bash
git add client/src/pages/Expenses.jsx
git commit -m "Add payment-method picker to the Expense add/edit form

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: `expenseService` payload pass-through check

**Files:**
- Read-only: `client/src/services/expenseService.js`, `client/src/context/ExpenseContext.jsx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing (verification-only task; folded here because it gates Task 5's assumption that the field reaches the API).

- [ ] **Step 1: Confirm the payload is forwarded verbatim**

Read `client/src/services/expenseService.js` — `createExpense(expenseData)` does `api.post('/expenses', expenseData)` and `updateExpense(id, updates)` does `api.put('/expenses/${id}', updates)`. Both forward the object as-is. Read `client/src/context/ExpenseContext.jsx` `addExpense` / `updateExpense` — confirm they pass the argument straight to `expenseService` without whitelisting fields.
Expected: no code change needed. If either layer rebuilds the object from named fields, add `paymentMode` to that list and commit; otherwise this task is a no-op.

- [ ] **Step 2: (Only if a change was needed) Commit**

```bash
git add client/src/context/ExpenseContext.jsx client/src/services/expenseService.js
git commit -m "Forward paymentMode through the expense service layer

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

If no change was needed, skip the commit and note "no-op" in the task report.

---

## Task 5: `PaymentModeBadge` + badges on rows and cards

**Files:**
- Create: `client/src/components/PaymentModeBadge.jsx`
- Modify: `client/src/components/MobileExpenseCard.jsx`
- Modify: `client/src/pages/Expenses.jsx` (desktop list-row rendering)

**Interfaces:**
- Consumes: `getPaymentMode` from `../constants/paymentModes`.
- Produces: `export default function PaymentModeBadge({ value, className })` — a small pill: `<Icon size={12} /> label`, muted styling, hidden entirely when `value` resolves to `other` AND `hideOther` prop is set (default: always show).

- [ ] **Step 1: Create the badge**

```jsx
// client/src/components/PaymentModeBadge.jsx
import { getPaymentMode } from '../constants/paymentModes'

export default function PaymentModeBadge({ value, hideOther = false, className = '' }) {
  const mode = getPaymentMode(value)
  if (!mode) return null
  if (hideOther && mode.value === 'other') return null
  const { label, Icon } = mode
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md
        bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-slate-300 ${className}`}
    >
      <Icon size={12} />
      {label}
    </span>
  )
}
```

- [ ] **Step 2: Add the badge to `MobileExpenseCard`**

In `client/src/components/MobileExpenseCard.jsx`, add the import:

```jsx
import PaymentModeBadge from './PaymentModeBadge'
```

In the "Middle content" block, after the category-name `<p>` and before the date `<p>`:

```jsx
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">
              {category?.name || 'Uncategorized'}
            </p>
            <div className="mt-1">
              <PaymentModeBadge value={expense.paymentMode} hideOther />
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">
              {formatDate(expense.date, 'MMM dd, yyyy')}
            </p>
```

(`hideOther` keeps the card clean for the common default.)

- [ ] **Step 3: Add the badge to the desktop list row**

In `client/src/pages/Expenses.jsx`, find where the desktop `DataTable` columns are defined (search for `accessorKey` / the column that renders category name or description). Add `<PaymentModeBadge value={row.original.paymentMode} hideOther className="ml-2" />` next to the description or category cell. Import `PaymentModeBadge` at the top of `Expenses.jsx`:

```jsx
import PaymentModeBadge from '../components/PaymentModeBadge'
```

Exact placement: in the column whose `cell` renders the primary text of the row (description/category). Append the badge inside that cell's returned JSX, wrapped so it wraps on narrow columns:

```jsx
<span className="inline-flex items-center flex-wrap gap-1">
  {/* existing primary text */}
  <PaymentModeBadge value={row.original.paymentMode} hideOther />
</span>
```

If the DataTable column structure makes this awkward, instead add a dedicated narrow column titled "Method" that renders `<PaymentModeBadge value={row.original.paymentMode} />` (always show). Pick whichever fits the existing column definitions with the smaller diff; the reviewer decides if unclear.

- [ ] **Step 4: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds.

- [ ] **Step 5: Manual check**

`npm run dev` → Expenses:
- Mobile viewport: each card shows the payment badge under the category (except `other`, which is hidden).
- Desktop viewport: the list row shows the method (badge or column per Step 3).
- An `other` expense: no badge on the card; on desktop shows "Other" if you used the dedicated column, nothing if you used the inline `hideOther` approach.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/PaymentModeBadge.jsx client/src/components/MobileExpenseCard.jsx client/src/pages/Expenses.jsx
git commit -m "Show payment-method badge on expense rows and cards

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: `analyticsService.getPaymentModeBreakdown`

**Files:**
- Modify: `client/src/services/analyticsService.js`

**Interfaces:**
- Consumes: `api` from `./api`.
- Produces: `analyticsService.getPaymentModeBreakdown({ from, to })` → `api.get('/analytics/payment-modes?from=...&to=...')`. Empty/undefined `from`/`to` are omitted from the query string.

- [ ] **Step 1: Add the method**

In `client/src/services/analyticsService.js`, inside the `analyticsService` object, add:

```js
    // Spending grouped by payment method for a date range
    getPaymentModeBreakdown: ({ from, to } = {}) => {
        const params = new URLSearchParams()
        if (from) params.append('from', from)
        if (to) params.append('to', to)
        const qs = params.toString()
        return api.get(`/analytics/payment-modes${qs ? `?${qs}` : ''}`)
    },
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/src/services/analyticsService.js
git commit -m "Add analyticsService.getPaymentModeBreakdown

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: "Spending by payment method" chart card

**Files:**
- Modify: `client/src/components/AnalyticsDashboard.jsx`

**Interfaces:**
- Consumes: `analyticsService.getPaymentModeBreakdown` from `../services/analyticsService`; `PAYMENT_MODE_MAP` from `../constants/paymentModes`; Recharts (`BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`, `Cell` — already imported in this file); `formatCurrency` (already imported); the component's existing `dateRange`, `currency`, `isSharedView` props.
- Produces: a new `glass-card` section rendering a horizontal bar chart of `total` per payment mode. Not rendered when `isSharedView` is true (the shared endpoint doesn't provide this data).

- [ ] **Step 1: Add the fetch + state inside the component**

Near the top of the `AnalyticsDashboard` function body, with the other hooks, add:

```jsx
    const [paymentModeData, setPaymentModeData] = useState([])
    const [paymentModeError, setPaymentModeError] = useState(false)

    useEffect(() => {
        if (isSharedView) return
        let cancelled = false
        const from = dateRange?.startDate
        const to = dateRange?.endDate
        analyticsService
            .getPaymentModeBreakdown({ from, to })
            .then((res) => {
                if (cancelled) return
                const rows = res.data?.data?.breakdown || []
                setPaymentModeData(
                    rows.map((r) => ({
                        ...r,
                        label: (PAYMENT_MODE_MAP[r.paymentMode] || PAYMENT_MODE_MAP.other).label,
                    }))
                )
                setPaymentModeError(false)
            })
            .catch(() => {
                if (!cancelled) setPaymentModeError(true)
            })
        return () => { cancelled = true }
    }, [isSharedView, dateRange?.startDate, dateRange?.endDate])
```

Add the imports at the top of the file:

```jsx
import { analyticsService } from '../services/analyticsService'
import { PAYMENT_MODE_MAP } from '../constants/paymentModes'
```

(`useEffect` — add it to the existing `import { useState, useMemo } from 'react'` → `import { useState, useMemo, useEffect } from 'react'`.)

- [ ] **Step 2: Render the card**

Place a new section after the "Category Breakdown" `glass-card` block (the one with the `<PieChart>`), before "Monthly Comparison". Use the same card shell classes:

```jsx
            {!isSharedView && (
                <div className="glass-card p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
                            Spending by payment method
                        </h3>
                        <BarChart3 size={18} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    {paymentModeError ? (
                        <p className="text-sm text-gray-500 dark:text-slate-500 py-8 text-center">
                            Couldn't load payment-method data.
                        </p>
                    ) : paymentModeData.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-slate-500 py-8 text-center">
                            No spending in this range.
                        </p>
                    ) : (
                        <div style={{ width: '100%', height: Math.max(160, paymentModeData.length * 44) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={paymentModeData}
                                    layout="vertical"
                                    margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="label"
                                        width={90}
                                        tick={{ fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        formatter={(v) => formatCurrency(v, currency)}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                                        {paymentModeData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}
```

(`COLORS` and `BarChart3` are already in scope in this file.)

- [ ] **Step 3: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds.

- [ ] **Step 4: Manual check**

`npm run dev` → Analytics:
- With expenses spread across payment modes in the current month, the "Spending by payment method" card shows a horizontal bar per mode, longest bar on top, tooltip shows formatted currency.
- Change the date range → the chart refetches and updates.
- A range with no expenses → "No spending in this range."
- Open the shared analytics view (`/analytics/shared/:token`) → the card is NOT present.
- Kill the dev API mid-view → the card shows "Couldn't load payment-method data." and the rest of Analytics still works.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/AnalyticsDashboard.jsx
git commit -m "Add 'Spending by payment method' chart to Analytics

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Full build + manual regression checklist

**Files:** none (verification task)

- [ ] **Step 1: Build**

Run: `cd client && npx vite build`
Expected: succeeds, only pre-existing warnings.

- [ ] **Step 2: Grep for leftover raw usage**

Run: `cd client && grep -rn "paymentMode" src/ | grep -v "constants/paymentModes\|PaymentModeChips\|PaymentModeBadge\|analyticsService"`
Expected: only the intended sites — `Expenses.jsx` (formData + payload + badge), `MobileExpenseCard.jsx` (badge), `AnalyticsDashboard.jsx` (chart). No stray references.

- [ ] **Step 3: Manual regression sweep**

`npm run dev`, in one session:
- Add expense (each of the 6 modes) → persists; badge correct on list + card.
- Add expense with default (`Other`) → persists; no badge on card (hidden), method column/blank on desktop.
- Edit an expense's mode → persists and re-displays.
- Recurring expense with a mode → all generated occurrences carry it (spot-check two rows).
- Analytics chart: renders, refetches on date change, empty state, shared-view absence, API-down state.
- Light + dark theme on the form, the card, and the chart.
- Bulk Edit modal still opens and works (untouched, but confirm no regression).

- [ ] **Step 4: Commit (checklist notes only, if any doc updates)**

No code change expected. If the manual sweep surfaced a fix, it belongs in the task whose file it touches — do not bundle fixes here. Record the sweep result in the task report.

---

## Self-Review

**1. Spec coverage**

| Spec item | Task |
|---|---|
| `paymentModes.js` constant (values, labels, icons) | Task 1 |
| `PaymentModeChips` (chip row, `CategoryChips` family, not `SegmentedToggle`) | Task 2 |
| `formData.paymentMode` default `other`, init/edit/reset | Task 3 |
| Picker rendered below category chips in the add/edit Modal | Task 3 Step 6 |
| No `handleSubmit` validation change | Task 3 (only payload add) |
| Payload includes `paymentMode` | Task 3 Step 5 + Task 4 (pass-through) |
| Badge on `MobileExpenseCard` | Task 5 Step 2 |
| Badge on desktop list row | Task 5 Step 3 |
| `analyticsService.getPaymentModeBreakdown` | Task 6 |
| Horizontal bar chart in `AnalyticsDashboard` (not donut) | Task 7 |
| Chart keyed to dashboard `dateRange`, self-fetching | Task 7 Step 1 |
| Chart absent in shared view | Task 7 (`!isSharedView` guard) |
| Chart failure hides card, doesn't block Analytics | Task 7 (`paymentModeError` branch) |
| Bulk Edit untouched | Global Constraints + Task 8 Step 3 |
| `npx vite build` verification (no runner) | every task's build step + Task 8 |

**2. Placeholder scan:** No "TBD"/"handle edge cases". Task 5 Step 3 gives two concrete placements and a decision rule (smaller diff wins; reviewer decides if unclear) rather than a vague instruction. Task 1 Step 1 corrects its own draft inline — final code is unambiguous.

**3. Type consistency:**
- `PAYMENT_MODES` shape `{ value, label, Icon }` consistent across Tasks 1, 2, 5, 7.
- `PAYMENT_MODE_MAP[value]` → `{ label, Icon }` consistent (Task 1 def, Task 7 use).
- `getPaymentMode(value)` returns an entry-or-`other` — Task 1 def, Task 5 use.
- API response `res.data.data.breakdown` items `{ paymentMode, total, count }` — matches spec + Task 1A's implementation; Task 7 maps `.paymentMode` → `.label`.
- `getPaymentModeBreakdown({ from, to })` — same signature Task 6 (def) and Task 7 (call).
- `formData.paymentMode` string — Task 3 init/edit/reset/payload all use the same key.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-10-payment-mode-1b-web.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
**2. Inline Execution** — `superpowers:executing-plans`, batch with checkpoints.

**Which approach?**
