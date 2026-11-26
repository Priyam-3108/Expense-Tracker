# Feature 2 — Activity Heatmap — Design

Date: 2026-09-10
Status: Approved for planning
Roadmap: [2026-09-09-expense-manager-parity-roadmap.md](2026-09-09-expense-manager-parity-roadmap.md)
Branch: `enhancement/expense-manager-parity`

## Goal

A GitHub-style calendar grid of daily spending activity on the Dashboard (web
and mobile). Reference: Expense Manager's home-screen 16-week activity
heatmap.

## Non-goals

- No "streak" counter in v1 (grid only).
- No income visualisation in the grid — intensity is **expense total per day**.
- Not on the Analytics page — Dashboard only.
- No per-cell drill-down modal; a click/tap navigates to the filtered
  expense list for that day (web) / a filtered transactions view (mobile).

## Decisions (resolved from the roadmap's "spec must resolve")

### Data window

Default **16 weeks** (112 days) ending today. Query param `weeks`, integer,
**clamped to `[1, 53]`** server-side, default `16`. 53 weeks covers a full
year for a future "year view" without another endpoint.

### Sparse vs dense response

**Sparse.** The API returns only days that have at least one expense. The
client is responsible for building the dense grid (fill missing days with
zero). This keeps the payload small (a heavy month is ~31 rows).

### Intensity metric + colour scale

Intensity = **expense total for the day** (sum of `type: 'expense'` amounts).
5 buckets:

- bucket 0: no expenses that day — neutral cell
- buckets 1–4: quantile split of the **non-zero** daily totals in the
  returned window (client computes the 25/50/75 percentiles of the non-zero
  set; a day at/above p75 is bucket 4, etc.). Quantile (not fixed rupee
  thresholds) so the grid is legible regardless of the user's spend scale.

If there are fewer than 4 distinct non-zero values, fall back to linear
bucketing between min and max non-zero.

### Colour palette

Follow the project's existing indigo accent. Light mode: `#EEF2FF` (bucket 0
is `#F1F5F9`) → `#6366F1`. Dark mode: `rgba(255,255,255,0.04)` (bucket 0) →
`#818CF8`. Exact 5-stop arrays live in the web/mobile plans. Cells are
`~12px` squares with `~3px` gap, `2px` radius.

### Click / tap target

- **Web:** clicking a cell navigates to `/app/expenses` with the date
  pre-applied as the filter range (`startDate === endDate === cell.date`).
  Implementation: `navigate('/app/expenses', { state: { date } })` and
  `Expenses.jsx` reads `location.state.date` on mount to seed `dateRange`.
  (If wiring that state read is out of scope for 2B, fall back to
  `navigate('/app/expenses')` with no filter — the plan picks one.)
- **Mobile:** tapping a cell navigates to the transactions list. If a
  date-filtered transactions view does not already exist, tap just navigates
  to the Dashboard's own list scrolled to that date is NOT attempted — it
  navigates to `SearchScreen` (which has date handling) or does nothing;
  2C's plan resolves this against the then-current navigation. Minimum: a
  tap shows a small tooltip/toast with the date + total (no navigation) if
  no clean target exists.

### Mobile offline behaviour

The heatmap is **server-fetched, online-only**. When offline (or the fetch
fails), the Dashboard simply does not render the heatmap card. No local
SQLite computation in v1.

### Web narrow-screen behaviour

The grid scrolls horizontally inside its own `overflow-x-auto` container;
the page body never scrolls sideways. Weekday labels (Mon/Wed/Fri) on the
left stay fixed.

## API surface

### New

`GET /api/analytics/daily-activity?weeks=16`

- Auth required (`authenticateToken`), registered in `analyticsRoutes.js`.
- `weeks` optional, integer, clamped `[1, 53]`, default `16`. Non-numeric →
  default.
- Window: `to = today (YYYY-MM-DD, server local)`, `from = today - (weeks*7 - 1) days`.
- Response:

```json
{
  "success": true,
  "data": {
    "from": "2026-05-19",
    "to": "2026-09-10",
    "weeks": 16,
    "days": [
      { "date": "2026-05-20", "expenseTotal": 450.0, "count": 3 },
      { "date": "2026-05-22", "expenseTotal": 1200.0, "count": 1 }
    ]
  }
}
```

- `days` sorted ascending by `date`. Only days with `count > 0`. Only
  `type: 'expense'` contributes to `expenseTotal` and `count`.
- Aggregation: `$match {user, date in [from,to], type:'expense'}` →
  `$group { _id: '$date', expenseTotal: {$sum:'$amount'}, count: {$sum:1} }`
  → `$sort { _id: 1 }` → `$project` to rename `_id` → `date`.
- Reuses the existing `{user, date}` index. No schema change.

### Not changed

Shared/public analytics endpoints do not expose daily-activity.

## Web components

| File | Responsibility |
|---|---|
| `client/src/services/analyticsService.js` (modify) | `getDailyActivity(weeks = 16)` |
| `client/src/hooks/useDailyActivity.js` (new) | fetch + build a dense `weeks × 7` matrix of `{ date, expenseTotal, count, bucket }`; compute quantile buckets; expose `{ grid, loading, error, weekdayLabels, monthLabels }` |
| `client/src/components/ActivityHeatmap.jsx` (new) | pure presentational: takes `grid`, `weekdayLabels`, `monthLabels`, `onCellClick(date)`; renders the SVG/div grid, tooltip, legend; light+dark palettes |
| `client/src/pages/Dashboard.jsx` (modify) | render `<ActivityHeatmap>` in a `glass-card`, wire `onCellClick` to navigate |

Grid orientation: columns = weeks (oldest left), rows = weekday (Sun top or
Mon top — Mon top, ISO). The last (rightmost) column is the current partial
week.

## Mobile components

| File | Responsibility |
|---|---|
| `mobile-app/src/services/expenseService.js` (modify) | `getDailyActivity(weeks = 16)` → `api.get('/analytics/daily-activity', { params: { weeks } })` |
| `mobile-app/src/components/ActivityHeatmap.js` (new) | RN version: `View`-based grid of `Pressable` cells, same dense-matrix input, `useTheme` palette, `onCellPress(day)` |
| `mobile-app/src/screens/DashboardScreen.js` (modify) | fetch on focus (online-only), render the heatmap card above/below the summary, hide when offline or empty |

## Error handling

- `weeks` non-numeric or out of range → clamped/defaulted silently (no 400).
- No expenses in the window → `days: []`; client renders an all-bucket-0
  grid with an "No activity yet" caption (web) or hides the card (mobile,
  per the online-only rule — actually: render the empty grid online, hide
  only when offline).
- Web fetch failure → the heatmap card shows a one-line "Couldn't load
  activity" and the rest of the Dashboard is unaffected.
- Mobile fetch failure or offline → card not rendered.

## Testing

- **API (2A):** extend the `node:test` suite from Phase 1A. Cover: default
  window is 16 weeks; `weeks` clamps at 1 and 53; non-numeric → 16;
  `days` only includes `count > 0`; income excluded; sorted ascending;
  `from`/`to` correct for a fixed "today".
- **Web (2B):** `npx vite build` passes. Manual: heatmap renders with real
  data; hovering a cell shows date + total + count; clicking navigates;
  empty state; narrow-screen horizontal scroll with fixed weekday labels;
  light + dark.
- **Mobile (2C):** manual device: heatmap renders online; tapping a cell
  behaves per the resolved target; hidden offline; dark mode palette.

## Rollout / dependency notes

- 2A merges first. 2B and 2C both depend only on `GET /api/analytics/daily-activity`.
- 2B and 2C are independent of each other.
- Independent of Feature 1 — can be built before or after, in any interleaving with F1's phases, as long as each feature's internal API→Web→Mobile order holds.
