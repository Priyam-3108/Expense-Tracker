# Activity Heatmap — Phase 2C (Mobile) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the activity heatmap on the mobile Dashboard: a `View`-based `weeks × 7` grid of `Pressable` cells, 5-bucket quantile colours, `useTheme` palette, tap-a-cell behaviour, online-only (hidden when offline), empty state.

**Architecture:** A `getDailyActivity` method on the mobile `expenseService`. A shared grid+bucketing helper `mobile-app/src/utils/heatmapGrid.js` (pure, mirrors the web hook's math). An `ActivityHeatmap.js` RN component. `DashboardScreen.js` fetches on focus (guarded by `NetInfo`), stores the grid, and renders the card; nothing renders when offline or empty.

**Tech Stack:** Expo ~54, RN 0.81, `@react-native-community/netinfo` (already a dep), `date-fns` (verify it's a mobile dep — see Task 2 note). No test runner — manual device smoke.

**Spec:** `docs/superpowers/specs/2026-09-10-activity-heatmap-design.md`

**Depends on:** Phase 2A merged. (2B independent.)

## Global Constraints

- Grid: columns = weeks (oldest left, current partial week rightmost), 7 rows, **Monday top**.
- Intensity = daily expense total; 5 buckets: 0 = none; 1–4 = quantile (p25/p50/p75) of non-zero daily totals; linear fallback when < 4 distinct non-zero values.
- Palette via `useTheme()` `colors`: bucket 0 = `colors.border` (or a very faint fill), 4 = `colors.primary`; 1–3 interpolate. Exact approach in Task 3.
- Cell: 12px square, 3px gap, 2px radius.
- Online-only: fetch guarded by `NetInfo.fetch().isConnected`. Offline or fetch-fail → the card is NOT rendered. No local SQLite computation.
- Tap target: navigate to a date-filtered transactions view **if one exists in the current navigation**; otherwise a tap shows a short toast/alert with the date + total and does not navigate. Task 4 resolves this against the actual navigator.
- No new npm dependency (if `date-fns` is not already a mobile dep, Task 2 implements the small date math by hand instead — do NOT add the package).
- After each task: Metro bundles the changed screen with no red-box on an emulator.
- Commit after each task with the message in its final step.

## File Structure

**Created**
- `mobile-app/src/utils/heatmapGrid.js` — `buildHeatmapGrid(days, from, to)` → `{ grid, monthLabels, thresholds, maxTotal }`
- `mobile-app/src/components/ActivityHeatmap.js` — RN grid component

**Modified**
- `mobile-app/src/services/expenseService.js` — `getDailyActivity(weeks)`
- `mobile-app/src/screens/DashboardScreen.js` — fetch + render the card

---

## Task 1: `getDailyActivity` in the mobile expense service

**Files:**
- Modify: `mobile-app/src/services/expenseService.js`

**Interfaces:**
- Consumes: `api` from `./api`.
- Produces: `expenseService.getDailyActivity(weeks = 16)` → `api.get('/analytics/daily-activity', { params: { weeks } })`.

- [ ] **Step 1: Add the method**

Inside the `expenseService` object:

```js
    getDailyActivity: (weeks = 16) => {
        return api.get('/analytics/daily-activity', { params: { weeks } });
    },
```

- [ ] **Step 2: Commit**

```bash
git add mobile-app/src/services/expenseService.js
git commit -m "Add getDailyActivity to mobile expense service

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `heatmapGrid` util

**Files:**
- Create: `mobile-app/src/utils/heatmapGrid.js`

**Interfaces:**
- Consumes: `date-fns` IF it is already listed in `mobile-app/package.json` dependencies. Otherwise: no imports — implement the date arithmetic with plain `Date`.
- Produces: `export function buildHeatmapGrid(days, from, to)` where `days` is `[{ date, expenseTotal, count }]` (sparse, ascending), `from`/`to` are `YYYY-MM-DD` strings. Returns:
  - `grid`: `Array<Array<Cell>>`, outer = week columns, inner = 7 (Mon..Sun). `Cell = { date: string | null, expenseTotal, count, bucket: 0..4, inWindow: boolean }`.
  - `monthLabels`: `[{ colIndex, label }]`.
  - `thresholds`: `[t1, t2, t3]`.
  - `maxTotal`: number.

- [ ] **Step 1: Check whether `date-fns` is a mobile dependency**

Run: `cd mobile-app && node -e "console.log(!!require('./package.json').dependencies['date-fns'])"`
- If it prints `true`, use `date-fns` in Step 2.
- If `false`, use the plain-`Date` version in Step 2 and note it in the report.

- [ ] **Step 2: Create the util (plain-`Date` version — works regardless)**

```js
// mobile-app/src/utils/heatmapGrid.js
// Pure helper: build a dense weeks x 7 (Mon-top) grid + quantile buckets
// from the sparse daily-activity API response.

const MS_DAY = 86400000;

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYMD(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Monday of the week containing `d`
function mondayOf(d) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (copy.getDay() + 6) % 7; // 0 = Monday
  copy.setDate(copy.getDate() - dow);
  return copy;
}

function computeThresholds(nonZero) {
  const sorted = [...nonZero].sort((a, b) => a - b);
  const distinct = [...new Set(sorted)];
  if (sorted.length === 0) return [0, 0, 0];
  if (distinct.length < 4) {
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const step = (max - min) / 4 || 1;
    return [min + step, min + step * 2, min + step * 3];
  }
  const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))];
  return [q(0.25), q(0.5), q(0.75)];
}

function bucketFor(total, [t1, t2, t3]) {
  if (total <= 0) return 0;
  if (total <= t1) return 1;
  if (total <= t2) return 2;
  if (total <= t3) return 3;
  return 4;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function buildHeatmapGrid(days, from, to) {
  if (!from || !to) return { grid: [], monthLabels: [], thresholds: [0, 0, 0], maxTotal: 0 };

  const byDate = new Map((days || []).map((d) => [d.date, d]));
  const fromD = parseYMD(from);
  const toD = parseYMD(to);
  const gridStart = mondayOf(fromD);
  const totalDays = Math.round((toD - gridStart) / MS_DAY) + 1;
  const numCols = Math.ceil(totalDays / 7);

  const nonZero = (days || []).map((d) => d.expenseTotal).filter((v) => v > 0);
  const thresholds = computeThresholds(nonZero);
  const maxTotal = nonZero.length ? Math.max(...nonZero) : 0;

  const grid = [];
  const monthLabels = [];
  let lastMonth = -1;

  for (let col = 0; col < numCols; col++) {
    const week = [];
    for (let row = 0; row < 7; row++) {
      const cellDate = new Date(gridStart.getTime() + (col * 7 + row) * MS_DAY);
      const key = ymd(cellDate);
      const inWindow = cellDate >= fromD && cellDate <= toD;
      if (!inWindow) {
        week.push({ date: null, expenseTotal: 0, count: 0, bucket: 0, inWindow: false });
        continue;
      }
      const hit = byDate.get(key);
      const expenseTotal = hit ? hit.expenseTotal : 0;
      const count = hit ? hit.count : 0;
      week.push({
        date: key,
        expenseTotal,
        count,
        bucket: bucketFor(expenseTotal, thresholds),
        inWindow: true,
      });
      if (row === 0) {
        const m = cellDate.getMonth();
        if (m !== lastMonth) {
          monthLabels.push({ colIndex: col, label: MONTHS[m] });
          lastMonth = m;
        }
      }
    }
    grid.push(week);
  }

  return { grid, monthLabels, thresholds, maxTotal };
}
```

- [ ] **Step 3: Sanity check**

Run:
```bash
cd mobile-app && node -e "
const { buildHeatmapGrid } = require('./src/utils/heatmapGrid.js');
const g = buildHeatmapGrid(
  [{date:'2026-09-08',expenseTotal:100,count:1},{date:'2026-09-10',expenseTotal:500,count:2}],
  '2026-08-13','2026-09-10'
);
console.log('cols', g.grid.length, 'rows', g.grid[0].length, 'months', g.monthLabels.length);
const flat = g.grid.flat();
console.log('sep8 bucket', flat.find(c=>c.date==='2026-09-10').bucket);
"
```
(If `require` of an ESM file fails, convert the check to `import()` or skip and rely on the emulator render in Task 4.)
Expected: `cols 5 rows 7 months 2` (Aug + Sep), and the `2026-09-10` cell has a bucket 1–4.

- [ ] **Step 4: Commit**

```bash
git add mobile-app/src/utils/heatmapGrid.js
git commit -m "Add heatmapGrid util (dense grid + quantile buckets, mobile)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: `ActivityHeatmap` RN component

**Files:**
- Create: `mobile-app/src/components/ActivityHeatmap.js`

**Interfaces:**
- Consumes: `useTheme` from `../context/ThemeContext`; RN `View`, `Text`, `Pressable`, `ScrollView`, `StyleSheet`.
- Produces: `export default function ActivityHeatmap({ grid, monthLabels, onCellPress })`. Renders a horizontally scrollable grid of 12px cells with a fixed weekday label column and a month-label row, plus a small "Less → More" legend.

- [ ] **Step 1: Create the component**

```jsx
// mobile-app/src/components/ActivityHeatmap.js
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const CELL = 12;
const GAP = 3;
const WEEKDAYS = ['M', '', 'W', '', 'F', '', ''];

// Blend two hex colours (#rrggbb) by t in [0,1]
function blend(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const p = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${p.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export default function ActivityHeatmap({ grid = [], monthLabels = [], onCellPress }) {
  const { colors } = useTheme();
  // bucket palette: 0 = faint, 4 = primary
  const base = typeof colors.primary === 'string' && colors.primary.startsWith('#') ? colors.primary : '#6366F1';
  const empty = typeof colors.border === 'string' && colors.border.startsWith('#') ? colors.border : '#E2E8F0';
  const palette = [empty, blend(empty, base, 0.4), blend(empty, base, 0.65), blend(empty, base, 0.85), base];

  const colStride = CELL + GAP;
  const numCols = grid.length;

  return (
    <View>
      {/* Month labels */}
      <View style={{ flexDirection: 'row', marginLeft: 18, height: 12, marginBottom: 2 }}>
        <View style={{ width: numCols * colStride }}>
          {monthLabels.map(({ colIndex, label }) => (
            <Text
              key={colIndex}
              style={[styles.monthLabel, { color: colors.subText, position: 'absolute', left: colIndex * colStride }]}
            >
              {label}
            </Text>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {/* Fixed weekday labels */}
        <View style={{ justifyContent: 'space-between', height: 7 * colStride - GAP, marginRight: 4 }}>
          {WEEKDAYS.map((d, i) => (
            <Text key={i} style={[styles.weekdayLabel, { color: colors.subText, height: CELL }]}>{d}</Text>
          ))}
        </View>

        {/* Scrollable grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: GAP }}>
            {grid.map((week, col) => (
              <View key={col} style={{ gap: GAP }}>
                {week.map((cell, row) => (
                  <Pressable
                    key={row}
                    onPress={() => cell.date && cell.count > 0 && onCellPress && onCellPress(cell)}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 2,
                      backgroundColor: cell.inWindow ? palette[cell.bucket] : 'transparent',
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6, marginLeft: 18 }}>
        <Text style={[styles.legendText, { color: colors.subText }]}>Less</Text>
        {palette.map((c, i) => (
          <View key={i} style={{ width: CELL, height: CELL, borderRadius: 2, backgroundColor: c }} />
        ))}
        <Text style={[styles.legendText, { color: colors.subText }]}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monthLabel: { fontSize: 10 },
  weekdayLabel: { fontSize: 9 },
  legendText: { fontSize: 10 },
});
```

> **Note on `colors.primary` / `colors.border` format:** the `blend` helper needs `#rrggbb`. The component guards with `.startsWith('#')` and falls back to defaults. If the theme's `colors.primary` is an `rgb()` string, the fallback `#6366F1` is used — acceptable. Do not add a colour library.

- [ ] **Step 2: Metro bundle check**

`cd mobile-app && npx expo start` → the app compiles (component not mounted yet — this just checks it parses).

- [ ] **Step 3: Commit**

```bash
git add mobile-app/src/components/ActivityHeatmap.js
git commit -m "Add ActivityHeatmap RN component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Fetch + render on `DashboardScreen` (online-only)

**Files:**
- Modify: `mobile-app/src/screens/DashboardScreen.js`

**Interfaces:**
- Consumes: `expenseService.getDailyActivity`; `buildHeatmapGrid` from `../utils/heatmapGrid`; `ActivityHeatmap` from `../components/ActivityHeatmap`; `NetInfo` (add import); `useTheme` `colors` (in scope).
- Produces: state `heatmap` (`{ grid, monthLabels } | null`); fetched inside the existing focus-effect data load, guarded by `NetInfo.isConnected`; a card rendered in the scroll view only when `heatmap?.grid?.length` and at least one cell has `count > 0`.

- [ ] **Step 1: Add imports**

```js
import NetInfo from '@react-native-community/netinfo';
import { buildHeatmapGrid } from '../utils/heatmapGrid';
import ActivityHeatmap from '../components/ActivityHeatmap';
```

- [ ] **Step 2: Add state**

With the other `useState`s:

```js
  const [heatmap, setHeatmap] = useState(null);
```

- [ ] **Step 3: Fetch inside `fetchData`**

In `fetchData`, after the main expenses/stats block, add:

```js
      // Activity heatmap — online only
      try {
        const net = await NetInfo.fetch();
        if (net.isConnected) {
          const res = await expenseService.getDailyActivity(16);
          const d = res.data?.data;
          if (d) {
            setHeatmap(buildHeatmapGrid(d.days, d.from, d.to));
          }
        } else {
          setHeatmap(null);
        }
      } catch (e) {
        setHeatmap(null);
      }
```

- [ ] **Step 4: Resolve the tap target**

Inspect the navigator for this screen. Options, in order of preference:
1. If there is a transactions/search screen that accepts a date param (e.g. `SearchScreen` with a `date` route param), navigate there: `navigation.navigate('Search', { date: cell.date })`.
2. If not, show a lightweight alert: use the existing `CustomAlert` state already in `DashboardScreen` — set `alertConfig` to `{ type: 'default', title: cell.date, message: `${cell.count} transactions`, buttons: [{ text: 'OK', style: 'primary' }] }` and `setShowDeleteAlert`/equivalent to open it. (Reuse whatever alert mechanism the screen already has; do not add a new one.)

Pick option 1 if a clean target exists, else option 2. Record which in the task report.

- [ ] **Step 5: Render the card**

In the scroll view, after the summary cards and before/after the transactions list (place it where it reads well — directly under `BalanceCard`/`SummaryCard`), add:

```jsx
        {heatmap?.grid?.length > 0 && heatmap.grid.some((w) => w.some((c) => c.count > 0)) && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Activity · last 16 weeks</Text>
            <ActivityHeatmap
              grid={heatmap.grid}
              monthLabels={heatmap.monthLabels}
              onCellPress={(cell) => {
                // per Task 4 Step 4 resolution
              }}
            />
          </View>
        )}
```

Reuse the existing `styles.card` / `styles.cardTitle` from this screen's `StyleSheet` if present; otherwise copy the wrapper style used by the nearest existing card (`BalanceCard` usage or a local `styles.section`). Do not invent new spacing values — match a sibling.

- [ ] **Step 6: Emulator smoke**

`cd mobile-app && npx expo start -c` → Dashboard:
- Online, with expense history: the "Activity" card renders a shaded grid; heavier-spend days are darker; the grid scrolls horizontally.
- Tap a shaded cell → the resolved behaviour (navigate or alert) fires. Tap an empty cell → nothing.
- Airplane mode → pull-to-refresh → the card disappears; the rest of the Dashboard still loads.
- Fresh account (no expenses) → the card is not rendered (the `.some(count > 0)` guard).
- Dark mode → cell palette derives from `colors.primary`; legend + labels use `colors.subText`.

- [ ] **Step 7: Commit**

```bash
git add mobile-app/src/screens/DashboardScreen.js
git commit -m "Add online-only Activity heatmap card to the mobile Dashboard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Full manual device sweep

**Files:** none (verification task)

- [ ] **Step 1: Clean bundle** — `npx expo start -c`, no red-box on Dashboard, Add Expense, Analytics, Transactions.

- [ ] **Step 2: Grep** — `cd mobile-app && grep -rn "getDailyActivity\|buildHeatmapGrid\|ActivityHeatmap\|daily-activity" src/`
Expected: `expenseService.js`, `utils/heatmapGrid.js`, `components/ActivityHeatmap.js`, `screens/DashboardScreen.js` only.

- [ ] **Step 3: Sweep**
- Online render, correct shading, horizontal scroll.
- Tap behaviour (navigate or alert per Task 4).
- Offline → card hidden, no crash, rest of Dashboard fine.
- Empty account → card hidden.
- Dark + light.
- Rotate device / small screen → grid scrolls, no layout break.

- [ ] **Step 4: Record the sweep in the task report.** Fixes belong in their owning task's file.

---

## Self-Review

**1. Spec coverage**

| Spec item | Task |
|---|---|
| `getDailyActivity(weeks)` mobile service | Task 1 |
| Dense `weeks × 7` Monday-top grid + quantile buckets (linear fallback) | Task 2 (`buildHeatmapGrid`, `computeThresholds`, `bucketFor`) |
| RN `View`/`Pressable` grid, 12px cells, 3px gap, 2px radius | Task 3 |
| `useTheme` palette (0 = faint, 4 = primary) | Task 3 (`blend`, `palette`) |
| Online-only; hidden offline / on failure / when empty | Task 4 Steps 3 + 5 (`NetInfo` guard + `.some(count>0)` guard) |
| Tap target resolved against the real navigator | Task 4 Step 4 |
| Manual device verification (no runner) | every smoke step + Task 5 |
| No local SQLite computation | (not implemented — fetch-only) |
| No new dependency | Task 2 (plain-`Date`), Task 3 (guarded `blend`) |

**2. Placeholder scan:** No "TBD"/"handle edge cases". Task 2 handles the `date-fns`-maybe-absent case by shipping the plain-`Date` version outright. Task 3 guards the colour format. Task 4 Step 4 gives a concrete two-option decision with a recorded outcome, and Step 5 says "match a sibling style" rather than inventing values.

**3. Type consistency:**
- `Cell` `{ date, expenseTotal, count, bucket, inWindow }` — Task 2 `Produces`, Task 2 output, Task 3 render, Task 4 `onCellPress` argument.
- `buildHeatmapGrid(days, from, to)` → `{ grid, monthLabels, thresholds, maxTotal }` — Task 2 def, Task 4 use (`heatmap.grid`, `heatmap.monthLabels`).
- `ActivityHeatmap` props `{ grid, monthLabels, onCellPress }` — Task 3 def, Task 4 call.
- API `res.data.data` `{ from, to, weeks, days: [{ date, expenseTotal, count }] }` — Phase 2A contract; Task 4 reads `.days`, `.from`, `.to`.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-10-activity-heatmap-2c-mobile.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
**2. Inline Execution** — `superpowers:executing-plans`, batch with checkpoints.

**Which approach?**
