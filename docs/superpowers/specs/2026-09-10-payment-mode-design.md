# Feature 1 — Payment Mode — Design

Date: 2026-09-10
Status: Approved for planning
Roadmap: [2026-09-09-expense-manager-parity-roadmap.md](2026-09-09-expense-manager-parity-roadmap.md)
Branch: `enhancement/expense-manager-parity`

## Goal

Record *how* a transaction was paid (UPI, cash, card, …) on every expense, and
surface a "spending by payment method" breakdown in analytics on web and
mobile. Reference: Expense Manager's Payment Mode Analytics.

## Non-goals

- Payment mode on income transactions is allowed but not emphasised (same field, no special UI).
- No per-payment-mode budgets.
- No 6-month trend chart in v1 (single-period donut/bar only).
- No migration of historical data (absent field reads as `other`).

## Decisions (resolved from the roadmap's "spec must resolve")

### Enum values + labels

| value | label (UI) | web icon (`lucide-react`) | mobile icon (`Ionicons`) |
|---|---|---|---|
| `upi` | UPI | `Smartphone` | `phone-portrait-outline` |
| `cash` | Cash | `Banknote` | `cash-outline` |
| `card` | Card | `CreditCard` | `card-outline` |
| `netbanking` | Net Banking | `Landmark` | `business-outline` |
| `wallet` | Wallet | `Wallet` | `wallet-outline` |
| `other` | Other | `MoreHorizontal` | `ellipsis-horizontal` |

Order in pickers: `upi, cash, card, netbanking, wallet, other`.

### DB default

`default: 'other'`, field **not** `required`. Old documents without the field
deserialize with `paymentMode === undefined`; all read/aggregation code
treats `undefined` as `other` (aggregation `$ifNull`).

### Shared/public analytics

The public shared-analytics endpoints do **not** expose payment-mode data in
v1. Only the authenticated `GET /api/analytics/payment-modes` returns it.

### Web picker component

New `client/src/components/form/PaymentModeChips.jsx` — a horizontal chip row
in the same visual family as `CategoryChips` (icon + label, selected state
tinted). Not `SegmentedToggle` (that is 2-option only). Six chips fit one row
on desktop; horizontal-scroll on narrow.

### Web chart type

Horizontal bar chart (not donut) in `AnalyticsDashboard` — six categories with
long labels read better as bars, and it matches the existing category
breakdown styling there. Recharts `<BarChart layout="vertical">`.

### Mobile offline analytics

The payment-mode chart on `AnalyticsScreen` is **online-only** (fetched from
the API), consistent with how `AnalyticsScreen` already behaves. When offline
the chart section is hidden or shows "Connect to see analytics". Adding
`paymentMode` to a transaction still works fully offline (it is part of the
local payload and sync).

## Data model

`server/src/config/models/Expense.js` — add one field:

```js
paymentMode: {
  type: String,
  enum: ['upi', 'cash', 'card', 'netbanking', 'wallet', 'other'],
  default: 'other'
}
```

No new index (payment-mode aggregation runs on an already-filtered
`{user, date, type}` set which uses the existing `{user, date}` index).

## API surface

### Changed

- `POST /api/expenses` and `PUT /api/expenses/:id` — accept optional
  `paymentMode` in body (Zod: `z.enum([...]).optional()`); persisted on
  single, recurring-series, and bulk creates.
- `POST /api/expenses/sync` — `syncExpenses` spreads `...data`, so
  `paymentMode` flows through with no change; add an explicit test/assert.

### New

`GET /api/analytics/payment-modes?from=YYYY-MM-DD&to=YYYY-MM-DD`

- Auth required (`authenticateToken`), registered in `analyticsRoutes.js`.
- `from`/`to` optional; default to current calendar month (same default logic
  as `getDetailedAnalytics`).
- Response:

```json
{
  "success": true,
  "data": {
    "from": "2026-09-01",
    "to": "2026-09-30",
    "breakdown": [
      { "paymentMode": "upi", "total": 12500.5, "count": 14 },
      { "paymentMode": "cash", "total": 3000, "count": 5 },
      { "paymentMode": "other", "total": 800, "count": 2 }
    ],
    "totalSpent": 16300.5
  }
}
```

- Only `type: 'expense'` rows are counted.
- `breakdown` sorted by `total` desc. Modes with zero spend are omitted.
- Aggregation: `$match {user, date range, type:'expense'}` →
  `$group { _id: { $ifNull: ['$paymentMode', 'other'] }, total: {$sum:'$amount'}, count: {$sum:1} }`
  → `$sort { total: -1 }`.

## Web components

| File | Responsibility |
|---|---|
| `client/src/constants/paymentModes.js` (new) | `PAYMENT_MODES` array `[{ value, label, Icon }]`; `PAYMENT_MODE_LABELS` map; `getPaymentMode(value)` fallback-to-`other` helper |
| `client/src/components/form/PaymentModeChips.jsx` (new) | `{ value, onChange }` controlled chip row |
| `client/src/pages/Expenses.jsx` (modify) | add `paymentMode` to `formData`, render `<PaymentModeChips>` in the add/edit `Modal` below the category chips, pre-fill on edit, include in `handleSubmit` payload |
| `client/src/components/MobileExpenseCard.jsx` (modify) | small payment-mode icon+label badge |
| expense list row renderer in `Expenses.jsx` (modify) | same badge in the table/list row |
| `client/src/services/analyticsService.js` (modify) | `getPaymentModeBreakdown({ from, to })` |
| `client/src/components/AnalyticsDashboard.jsx` (modify) | new "Spending by payment method" bar-chart card |

`formData.paymentMode` default `'other'`. No validation change (has a default).

## Mobile components

| File | Responsibility |
|---|---|
| `mobile-app/src/constants/paymentModes.js` (new) | mirror of the web constant, Ionicons names |
| `mobile-app/src/screens/AddExpenseScreen.js` (modify) | `paymentMode` state, chip row (reuse the existing category-chip visual in that file), include in the payload passed to `offlineService.saveExpenseLocally` |
| `mobile-app/src/services/offlineService.js` (modify) | no code change needed — it spreads `expenseData`; add a comment + the plan asserts `paymentMode` is present |
| `mobile-app/src/services/syncEngine.js` (modify) | no code change needed — spreads `...data`; plan asserts pass-through |
| `mobile-app/src/components/TransactionItem.js` (modify) | payment-mode badge |
| `mobile-app/src/screens/AnalyticsScreen.js` (modify) | payment-mode bar chart, online-only, using `mobile-app/src/components/charts/BarChart.js` |
| mobile analytics service call | add `getPaymentModeBreakdown` to the appropriate mobile service (see plan 1C for exact file) |

## Error handling

- Invalid `paymentMode` in a request body → Zod 400 `{ field: 'paymentMode', message: 'Invalid enum value...' }` (standard `validate()` middleware behaviour).
- `GET /api/analytics/payment-modes` with an invalid date → existing `validateDateRange` middleware returns 400 (reuse it on the route).
- No expenses in range → `breakdown: [], totalSpent: 0`.
- Web/mobile pickers cannot produce an invalid value (fixed chip set).

## Testing

- **API:** `server/` has no test runner. Plan 1A adds a minimal one
  (`node:test` built-in, `npm test` script) OR, if the reviewer prefers zero
  new deps, uses a `scripts/smoke-payment-mode.mjs` that hits a live dev
  server. Decision deferred to 1A's first task; default is `node:test` since
  it ships with Node and needs no dependency. Tests cover: schema default,
  Zod accept/reject, create persists it, update persists it, aggregation
  groups `undefined` as `other`, aggregation sorts by total.
- **Web:** `npx vite build` passes. Manual: add expense with each mode →
  persists; edit → pre-fills and changes; badge shows on list + card; chart
  renders with real data and empty state.
- **Mobile:** manual device/emulator: add online, add offline then sync
  (verify `paymentMode` survives), edit, badge on list, chart online-only.

## Rollout / dependency notes

- 1A merges first; 1B and 1C both depend on the `/api/analytics/payment-modes`
  endpoint and the accepted `paymentMode` body field.
- 1B and 1C are independent of each other and may be done in either order.
- No feature flag — the field is additive and defaulted.
