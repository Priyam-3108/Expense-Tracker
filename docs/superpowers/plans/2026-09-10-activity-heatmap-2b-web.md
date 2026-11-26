# Activity Heatmap — Phase 2B (Web) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a GitHub-style 16-week spending heatmap on the web Dashboard: `weeks × 7` grid, 5-bucket quantile colour scale, per-cell tooltip (date, total, count), click a cell to jump to that day's expenses, horizontal-scroll on narrow screens, light + dark palettes, graceful empty/error states.

**Architecture:** A `useDailyActivity` hook fetches `GET /api/analytics/daily-activity`, builds a dense `weeks × 7` matrix, and computes quantile buckets. A pure `ActivityHeatmap` presentational component renders the grid + tooltip + legend from that matrix. `Dashboard.jsx` mounts the hook + component inside a `glass-card` and wires the click handler to `navigate`.

**Tech Stack:** React 18, Vite 4, Tailwind 3, `date-fns` (already a dep), `react-router-dom` (already a dep). No test runner — verification is `npx vite build` + manual checklist.

**Spec:** `docs/superpowers/specs/2026-09-10-activity-heatmap-design.md`

**Depends on:** Phase 2A merged (`GET /api/analytics/daily-activity` live).

## Global Constraints

- Grid: columns = weeks (oldest left, current partial week rightmost); rows = weekday, **Monday top** (ISO). 7 rows always.
- Intensity = daily **expense total**. 5 buckets: 0 = no expenses; 1–4 = quantile split (p25/p50/p75) of the **non-zero** daily totals in the window. Fewer than 4 distinct non-zero values → linear split between min and max non-zero.
- Palette — light: bucket 0 `#F1F5F9`, 1 `#E0E7FF`, 2 `#A5B4FC`, 3 `#818CF8`, 4 `#6366F1`. Dark: 0 `rgba(255,255,255,0.04)`, 1 `rgba(129,140,248,0.25)`, 2 `rgba(129,140,248,0.45)`, 3 `rgba(129,140,248,0.7)`, 4 `#818CF8`.
- Cell: 12px square, 3px gap, 2px radius.
- Grid scrolls inside its own `overflow-x-auto` container; the page body never scrolls sideways. Weekday labels column stays fixed (outside the scroll area).
- Cell click: `navigate('/app/expenses', { state: { date } })`. This plan ALSO wires `Expenses.jsx` to read `location.state.date` and seed its `dateRange` (Task 5). If the reviewer judges that read too invasive, fall back to `navigate('/app/expenses')` with no filter and drop Task 5's `Expenses.jsx` edit — the heatmap still ships.
- Fetch failure → the card shows "Couldn't load activity"; the rest of the Dashboard is unaffected.
- Dark mode via the `dark:` utility pattern + a theme check for the inline cell colours (`useTheme()` from `../context/ThemeContext`).
- No new npm dependency.
- After each task: `cd client && npx vite build` succeeds.
- Commit after each task with the message in its final step.

## File Structure

**Created**
- `client/src/hooks/useDailyActivity.js` — fetch + dense-matrix build + bucketing
- `client/src/components/ActivityHeatmap.jsx` — presentational grid

**Modified**
- `client/src/services/analyticsService.js` — `getDailyActivity(weeks)`
- `client/src/pages/Dashboard.jsx` — mount the heatmap card
- `client/src/pages/Expenses.jsx` — (Task 5, optional) read `location.state.date` to seed the filter

---

## Task 1: `analyticsService.getDailyActivity`

**Files:**
- Modify: `client/src/services/analyticsService.js`

**Interfaces:**
- Consumes: `api` from `./api`.
- Produces: `analyticsService.getDailyActivity(weeks = 16)` → `api.get('/analytics/daily-activity?weeks=<n>')`.

- [ ] **Step 1: Add the method**

Inside the `analyticsService` object:

```js
    // GitHub-style daily activity for the trailing `weeks`
    getDailyActivity: (weeks = 16) => {
        return api.get(`/analytics/daily-activity?weeks=${weeks}`)
    },
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/src/services/analyticsService.js
git commit -m "Add analyticsService.getDailyActivity

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `useDailyActivity` hook

**Files:**
- Create: `client/src/hooks/useDailyActivity.js`

**Interfaces:**
- Consumes: `analyticsService.getDailyActivity` from `../services/analyticsService`; `date-fns` (`startOfWeek`, `addDays`, `format`, `parseISO`, `subDays`, `isSameMonth`).
- Produces: `export function useDailyActivity(weeks = 16)` returning:
  - `grid`: `Array<Array<Cell>>` — outer length = number of week-columns, inner length = 7 (Mon..Sun). `Cell = { date: 'YYYY-MM-DD' | null, expenseTotal: number, count: number, bucket: 0..4, inWindow: boolean }`. Cells before `from` or after today are `{ date: null, ...zeros, bucket: 0, inWindow: false }`.
  - `weekdayLabels`: `['Mon','','Wed','','Fri','','']` (label rows 0,2,4 only).
  - `monthLabels`: `Array<{ colIndex: number, label: string }>` — the month name at the column where a new month starts.
  - `loading`: boolean, `error`: boolean.
  - `maxTotal`: number (for the legend), `thresholds`: `[t1,t2,t3]` bucket cut points.

- [ ] **Step 1: Create the hook**

```js
// client/src/hooks/useDailyActivity.js
import { useEffect, useMemo, useState } from 'react'
import { startOfWeek, addDays, format, parseISO, differenceInCalendarDays } from 'date-fns'
import { analyticsService } from '../services/analyticsService'

const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

function computeThresholds(nonZero) {
  const sorted = [...nonZero].sort((a, b) => a - b)
  const distinct = [...new Set(sorted)]
  if (sorted.length === 0) return [0, 0, 0]
  if (distinct.length < 4) {
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const step = (max - min) / 4 || 1
    return [min + step, min + step * 2, min + step * 3]
  }
  const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))]
  return [q(0.25), q(0.5), q(0.75)]
}

function bucketFor(total, [t1, t2, t3]) {
  if (total <= 0) return 0
  if (total <= t1) return 1
  if (total <= t2) return 2
  if (total <= t3) return 3
  return 4
}

export function useDailyActivity(weeks = 16) {
  const [raw, setRaw] = useState(null) // { from, to, days: [...] } | null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    analyticsService
      .getDailyActivity(weeks)
      .then((res) => {
        if (cancelled) return
        setRaw(res.data?.data || { from: null, to: null, days: [] })
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [weeks])

  const derived = useMemo(() => {
    if (!raw || !raw.to) {
      return { grid: [], weekdayLabels: WEEKDAY_LABELS, monthLabels: [], maxTotal: 0, thresholds: [0, 0, 0] }
    }
    const byDate = new Map(raw.days.map((d) => [d.date, d]))
    const today = parseISO(raw.to)
    const from = parseISO(raw.from)

    // Grid starts on the Monday of `from`'s week.
    const gridStart = startOfWeek(from, { weekStartsOn: 1 })
    const totalDays = differenceInCalendarDays(today, gridStart) + 1
    const numCols = Math.ceil(totalDays / 7)

    const nonZero = raw.days.map((d) => d.expenseTotal).filter((v) => v > 0)
    const thresholds = computeThresholds(nonZero)
    const maxTotal = nonZero.length ? Math.max(...nonZero) : 0

    const grid = []
    const monthLabels = []
    let lastMonth = -1
    for (let col = 0; col < numCols; col++) {
      const week = []
      for (let row = 0; row < 7; row++) {
        const cellDate = addDays(gridStart, col * 7 + row)
        const ymd = format(cellDate, 'yyyy-MM-dd')
        const inWindow = cellDate >= from && cellDate <= today
        if (!inWindow) {
          week.push({ date: null, expenseTotal: 0, count: 0, bucket: 0, inWindow: false })
          continue
        }
        const hit = byDate.get(ymd)
        const expenseTotal = hit ? hit.expenseTotal : 0
        const count = hit ? hit.count : 0
        week.push({
          date: ymd,
          expenseTotal,
          count,
          bucket: bucketFor(expenseTotal, thresholds),
          inWindow: true,
        })
        if (row === 0) {
          const m = cellDate.getMonth()
          if (m !== lastMonth) {
            monthLabels.push({ colIndex: col, label: format(cellDate, 'MMM') })
            lastMonth = m
          }
        }
      }
      grid.push(week)
    }
    return { grid, weekdayLabels: WEEKDAY_LABELS, monthLabels, maxTotal, thresholds }
  }, [raw])

  return { ...derived, loading, error }
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds (nothing imports it yet).

- [ ] **Step 3: Commit**

```bash
git add client/src/hooks/useDailyActivity.js
git commit -m "Add useDailyActivity hook (fetch + dense grid + quantile buckets)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: `ActivityHeatmap` component

**Files:**
- Create: `client/src/components/ActivityHeatmap.jsx`

**Interfaces:**
- Consumes: `useTheme` from `../context/ThemeContext`; `formatCurrency` from `../utils/helpers`; `date-fns` `format`, `parseISO`.
- Produces: `export default function ActivityHeatmap({ grid, weekdayLabels, monthLabels, loading, error, currency, onCellClick })`. Renders: month labels row, a fixed weekday-labels column + a horizontally scrollable grid of 12px cells, a hover tooltip, and a small legend ("Less ▢▢▢▢▢ More"). Empty state when `grid` is all-bucket-0.

- [ ] **Step 1: Create the component**

```jsx
// client/src/components/ActivityHeatmap.jsx
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useTheme } from '../context/ThemeContext'
import { formatCurrency } from '../utils/helpers'

const LIGHT = ['#F1F5F9', '#E0E7FF', '#A5B4FC', '#818CF8', '#6366F1']
const DARK = ['rgba(255,255,255,0.04)', 'rgba(129,140,248,0.25)', 'rgba(129,140,248,0.45)', 'rgba(129,140,248,0.7)', '#818CF8']

const CELL = 12
const GAP = 3

export default function ActivityHeatmap({
  grid = [],
  weekdayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''],
  monthLabels = [],
  loading = false,
  error = false,
  currency = 'USD',
  onCellClick,
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const palette = isDark ? DARK : LIGHT
  const [hover, setHover] = useState(null) // { x, y, cell }

  if (loading) {
    return <div className="h-28 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.05]" />
  }
  if (error) {
    return <p className="text-sm text-gray-500 dark:text-slate-500 py-6 text-center">Couldn't load activity.</p>
  }

  const hasAny = grid.some((week) => week.some((c) => c.count > 0))
  const numCols = grid.length
  const colStride = CELL + GAP

  return (
    <div className="relative">
      {/* Month labels */}
      <div className="flex pl-8 mb-1 overflow-hidden" style={{ height: 14 }}>
        <div className="relative" style={{ width: numCols * colStride }}>
          {monthLabels.map(({ colIndex, label }) => (
            <span
              key={colIndex}
              className="absolute text-[10px] text-gray-400 dark:text-slate-500"
              style={{ left: colIndex * colStride }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Fixed weekday labels */}
        <div className="flex flex-col justify-between pr-1" style={{ height: 7 * colStride - GAP }}>
          {weekdayLabels.map((l, i) => (
            <span key={i} className="text-[10px] leading-none text-gray-400 dark:text-slate-500" style={{ height: CELL }}>
              {l}
            </span>
          ))}
        </div>

        {/* Scrollable grid */}
        <div className="overflow-x-auto pb-1 [scrollbar-width:thin]">
          <div className="flex" style={{ gap: GAP }}>
            {grid.map((week, col) => (
              <div key={col} className="flex flex-col" style={{ gap: GAP }}>
                {week.map((cell, row) => (
                  <button
                    key={row}
                    type="button"
                    disabled={!cell.inWindow}
                    onClick={() => cell.date && cell.count > 0 && onCellClick?.(cell.date)}
                    onMouseEnter={(e) => cell.inWindow && setHover({
                      x: e.currentTarget.offsetLeft,
                      y: e.currentTarget.offsetTop,
                      cell,
                    })}
                    onMouseLeave={() => setHover(null)}
                    className="rounded-[2px] transition-transform hover:scale-110 disabled:cursor-default"
                    style={{
                      width: CELL,
                      height: CELL,
                      backgroundColor: cell.inWindow ? palette[cell.bucket] : 'transparent',
                      cursor: cell.count > 0 ? 'pointer' : 'default',
                    }}
                    aria-label={cell.date ? `${cell.date}: ${cell.count} transactions` : undefined}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 pl-8 text-[10px] text-gray-400 dark:text-slate-500">
        <span>Less</span>
        {palette.map((c, i) => (
          <span key={i} className="rounded-[2px]" style={{ width: CELL, height: CELL, backgroundColor: c }} />
        ))}
        <span>More</span>
      </div>

      {!hasAny && (
        <p className="text-xs text-gray-400 dark:text-slate-600 mt-2 pl-8">No activity in this window yet.</p>
      )}

      {/* Tooltip */}
      {hover && hover.cell.date && (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-gray-900 text-white text-[11px] px-2 py-1 whitespace-nowrap"
          style={{ left: hover.x + 28, top: hover.y - 4 }}
        >
          <div className="font-medium">{format(parseISO(hover.cell.date), 'EEE, MMM d, yyyy')}</div>
          <div>{hover.cell.count} txn · {formatCurrency(hover.cell.expenseTotal, currency)}</div>
        </div>
      )}
    </div>
  )
}
```

> **Note on `useTheme` shape:** `client/src/context/ThemeContext.jsx` returns `{ theme, setTheme }` where `theme` can be `'light'`, `'dark'`, or `'system'`. The `'system'` case must be resolved. Replace the `isDark` line in the component with:
> ```jsx
>   const { theme } = useTheme()
>   const isDark =
>     theme === 'dark' ||
>     (theme === 'system' && typeof window !== 'undefined' &&
>       window.matchMedia('(prefers-color-scheme: dark)').matches)
> ```
> Do not change anything else in the component.

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ActivityHeatmap.jsx
git commit -m "Add ActivityHeatmap presentational component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Mount the heatmap on the Dashboard

**Files:**
- Modify: `client/src/pages/Dashboard.jsx`

**Interfaces:**
- Consumes: `useDailyActivity` from `../hooks/useDailyActivity`; `ActivityHeatmap` from `../components/ActivityHeatmap`; `useNavigate` (already imported); `currency` (already in scope from `useAuth`).
- Produces: a `glass-card` section titled "Activity" containing `<ActivityHeatmap>`, placed above "Recent Activity". Cell click → `navigate('/app/expenses', { state: { date } })`.

- [ ] **Step 1: Add imports**

Near the top of `Dashboard.jsx`:

```jsx
import { useDailyActivity } from '../hooks/useDailyActivity'
import ActivityHeatmap from '../components/ActivityHeatmap'
```

- [ ] **Step 2: Call the hook**

Inside the `Dashboard` component body, with the other hooks:

```jsx
  const activity = useDailyActivity(16)
```

- [ ] **Step 3: Render the card**

Immediately before the `{/* Recent Activity */}` `<div className="glass-card p-5 md:p-6">` block, insert:

```jsx
          {/* Activity Heatmap */}
          <div className="glass-card p-5 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                Activity
              </h2>
              <span className="text-xs text-gray-400 dark:text-slate-600">Last 16 weeks</span>
            </div>
            <ActivityHeatmap
              grid={activity.grid}
              weekdayLabels={activity.weekdayLabels}
              monthLabels={activity.monthLabels}
              loading={activity.loading}
              error={activity.error}
              currency={currency}
              onCellClick={(date) => navigate('/app/expenses', { state: { date } })}
            />
          </div>
```

(`Calendar` is already imported in `Dashboard.jsx`.)

- [ ] **Step 4: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds.

- [ ] **Step 5: Manual check**

`cd client && npm run dev` → log in → Dashboard:
- The "Activity" card renders a grid. Days with expenses are shaded (darker = more spent).
- Hover a shaded cell → tooltip shows "Wed, Sep 10, 2026 / 3 txn · ₹450".
- Click a shaded cell → routes to `/app/expenses` (filter applied only if Task 5 is done; otherwise just the list).
- A brand-new account (no expenses) → grid renders all-neutral with "No activity in this window yet."
- Narrow the window to phone width → the grid scrolls horizontally inside its box; the page body does not scroll sideways; weekday labels stay put.
- Toggle dark mode → the cell palette switches to the dark stops; text stays legible.
- Kill the dev API, reload → the card shows "Couldn't load activity." and the rest of the Dashboard works.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Dashboard.jsx
git commit -m "Add Activity heatmap card to the Dashboard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: (Optional) seed the Expenses filter from a heatmap click

**Files:**
- Modify: `client/src/pages/Expenses.jsx`

**Interfaces:**
- Consumes: `useLocation` from `react-router-dom`.
- Produces: on mount, if `location.state?.date` is a `YYYY-MM-DD` string, `Expenses.jsx` seeds `dateRange` to `{ startDate: date, endDate: date }` so the list shows just that day.

> **Skip this task** if the reviewer judged (per Global Constraints) that touching `Expenses.jsx` for this is out of scope. In that case the heatmap click just navigates to the unfiltered list, which is acceptable. Record the decision in the task report.

- [ ] **Step 1: Add the import**

In `client/src/pages/Expenses.jsx`, add to the `react-router-dom` import (or add one if none exists):

```jsx
import { useLocation } from 'react-router-dom'
```

- [ ] **Step 2: Read the state on mount**

Near the top of the `Expenses` component, after the other hooks:

```jsx
  const location = useLocation()

  useEffect(() => {
    const d = location.state?.date
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      setDateRange({ startDate: d, endDate: d })
      setPage(1)
    }
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
```

(`setDateRange` and `setPage` already exist in `Expenses.jsx`.)

- [ ] **Step 3: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds.

- [ ] **Step 4: Manual check**

Dashboard → click a shaded heatmap cell → the Expenses page opens showing only that day's rows; the date-range filter reads that single date.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Expenses.jsx
git commit -m "Seed Expenses date filter from a heatmap cell click

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Full build + manual regression checklist

**Files:** none (verification task)

- [ ] **Step 1: Build**

Run: `cd client && npx vite build`
Expected: succeeds, only pre-existing warnings.

- [ ] **Step 2: Grep for leftovers**

Run: `cd client && grep -rn "useDailyActivity\|ActivityHeatmap\|daily-activity" src/`
Expected: only `analyticsService.js`, `hooks/useDailyActivity.js`, `components/ActivityHeatmap.jsx`, `pages/Dashboard.jsx`, and (if Task 5 done) `pages/Expenses.jsx`.

- [ ] **Step 3: Manual sweep**

`npm run dev`, Dashboard:
- Real data: shading correlates with spend; the heaviest days are darkest.
- 4+ distinct non-zero totals → quantile buckets; fewer → linear fallback still produces a readable gradient (test by creating 2–3 expense days on a fresh account).
- Tooltip position stays on-screen near the right edge of the grid.
- Click-through (filtered if Task 5, unfiltered otherwise).
- Empty account state.
- API-down state.
- Light + dark.
- Resize from desktop → phone: no horizontal page scroll at any width.

- [ ] **Step 4: Record the sweep in the task report.** Fixes belong in their owning task's file.

---

## Self-Review

**1. Spec coverage**

| Spec item | Task |
|---|---|
| `getDailyActivity(weeks)` service | Task 1 |
| Fetch + dense `weeks × 7` matrix, Monday-top | Task 2 |
| 5-bucket quantile scale, linear fallback < 4 distinct | Task 2 (`computeThresholds`, `bucketFor`) |
| `ActivityHeatmap` grid + tooltip + legend + empty state | Task 3 |
| Light + dark palettes (exact stops) | Task 3 (`LIGHT`/`DARK`) |
| 12px cells, 3px gap, 2px radius | Task 3 (`CELL`/`GAP`) |
| Horizontal-scroll grid, fixed weekday labels, no body overflow | Task 3 (scroll container + fixed label column) |
| Mounted on Dashboard in a `glass-card`, above Recent Activity | Task 4 |
| Cell click → navigate to that day's expenses | Task 4 (`onCellClick` → `navigate`) + Task 5 (filter seed) |
| Fetch failure → card message, Dashboard unaffected | Task 3 (`error` branch) + Task 2 (`error` state) |
| `npx vite build` verification (no runner) | every build step + Task 6 |

**2. Placeholder scan:** No "TBD"/"handle edge cases". Task 3 flags the one uncertain external contract (`useTheme` shape) with a verify-and-adjust note bounded to one line. Task 5 is explicitly optional with a recorded-decision fallback.

**3. Type consistency:**
- `Cell` shape `{ date, expenseTotal, count, bucket, inWindow }` — defined in Task 2's `Produces`, produced by Task 2's `grid`, consumed by Task 3's render.
- `useDailyActivity(weeks)` return keys `grid, weekdayLabels, monthLabels, loading, error, maxTotal, thresholds` — Task 2 def, Task 4 use (`activity.grid` etc.).
- `ActivityHeatmap` props `{ grid, weekdayLabels, monthLabels, loading, error, currency, onCellClick }` — Task 3 def, Task 4 call.
- API `res.data.data` keys `{ from, to, weeks, days: [{ date, expenseTotal, count }] }` — matches Phase 2A spec; Task 2 reads `.from`, `.to`, `.days[].date/.expenseTotal/.count`.
- `onCellClick(date)` — `date` is always a `YYYY-MM-DD` string (Task 3 only calls it with `cell.date`); Task 4/5 treat it as such.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-10-activity-heatmap-2b-web.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
**2. Inline Execution** — `superpowers:executing-plans`, batch with checkpoints.

**Which approach?**
