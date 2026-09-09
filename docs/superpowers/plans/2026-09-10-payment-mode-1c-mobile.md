# Payment Mode — Phase 1C (Mobile) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let mobile users pick a payment mode when adding/editing an expense (works fully offline), carry it through the local queue and sync, show a badge on transaction rows, and add an online-only "by payment method" bar chart to the Analytics screen.

**Architecture:** A `paymentModes` constant mirroring the web one (Ionicons names). One extra `useState` + one chip `ScrollView` in `AddExpenseScreen`, copying the existing Category-chip pattern in that file. `paymentMode` added to the `payload` object passed to `offlineService.saveExpenseLocally` — no change needed to `offlineService` or `syncEngine` (both spread the payload), but the plan asserts pass-through. A small `Ionicons`+text row on `TransactionItem`. A new online-only fetch + `BarChart` section on `AnalyticsScreen` using the existing `mobile-app/src/components/charts/BarChart.js`.

**Tech Stack:** Expo ~54, React Native 0.81, `@expo/vector-icons` (Ionicons), `expo-sqlite` local queue, `react-native-chart-kit` (via the wrapper). No test runner — verification is manual device/emulator smoke.

**Spec:** `docs/superpowers/specs/2026-09-10-payment-mode-design.md`

**Depends on:** Phase 1A merged. (1B is independent — either order.)

## Global Constraints

- Enum values + order: `upi, cash, card, netbanking, wallet, other`. Labels: `UPI`, `Cash`, `Card`, `Net Banking`, `Wallet`, `Other`. Ionicons: `phone-portrait-outline`, `cash-outline`, `card-outline`, `business-outline`, `wallet-outline`, `ellipsis-horizontal`.
- Default `other`. Not required — no new validation in `handleSubmit`.
- Adding/editing a payment mode must work OFFLINE (it is part of the local payload + sync). Only the Analytics chart is online-only.
- Match the existing visual style in `AddExpenseScreen` (reuse `s.chip`, `s.chipText`, `s.chipsScroll`, `s.sectionLabel`).
- Dark mode / theming via the existing `useTheme()` `colors`.
- No new npm dependency.
- After each task: `cd mobile-app && npx expo-doctor` is optional; the real gate is the app builds and the screen renders on an emulator/device (`npx expo start`). At minimum run `node --check` equivalent by letting Metro bundle the screen without a red-box.
- Commit after each task with the message in its final step.

## File Structure

**Created**
- `mobile-app/src/constants/paymentModes.js` — `PAYMENT_MODES` (`[{ value, label, icon }]` where `icon` is an Ionicons name string), `getPaymentMode(value)`

**Modified**
- `mobile-app/src/screens/AddExpenseScreen.js` — `paymentMode` state, edit-prefill, `resetForm`, chip `ScrollView`, `payload`
- `mobile-app/src/components/TransactionItem.js` — payment-mode row under the category name
- `mobile-app/src/services/expenseService.js` — `getPaymentModeBreakdown(params)`
- `mobile-app/src/screens/AnalyticsScreen.js` — online-only payment-mode bar chart section

**Asserted-only (no code change expected)**
- `mobile-app/src/services/offlineService.js` — spreads `expenseData`; `paymentMode` flows through
- `mobile-app/src/services/syncEngine.js` — spreads `...data`; `paymentMode` flows through

---

## Task 1: `paymentModes` constant (mobile)

**Files:**
- Create: `mobile-app/src/constants/paymentModes.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export const PAYMENT_MODES` — `[{ value: string, label: string, icon: string }]` (Ionicons name in `icon`), fixed order.
  - `export function getPaymentMode(value)` — the matching entry or the `other` entry.

- [ ] **Step 1: Create the module**

```js
// mobile-app/src/constants/paymentModes.js
export const PAYMENT_MODES = [
  { value: 'upi', label: 'UPI', icon: 'phone-portrait-outline' },
  { value: 'cash', label: 'Cash', icon: 'cash-outline' },
  { value: 'card', label: 'Card', icon: 'card-outline' },
  { value: 'netbanking', label: 'Net Banking', icon: 'business-outline' },
  { value: 'wallet', label: 'Wallet', icon: 'wallet-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export function getPaymentMode(value) {
  return (
    PAYMENT_MODES.find((m) => m.value === value) ||
    PAYMENT_MODES.find((m) => m.value === 'other')
  );
}
```

- [ ] **Step 2: Sanity check the module loads**

Run: `cd mobile-app && node -e "import('./src/constants/paymentModes.js').then(m => console.log(m.PAYMENT_MODES.length, m.getPaymentMode('xyz').value))"`
Expected: prints `6 other`.

- [ ] **Step 3: Commit**

```bash
git add mobile-app/src/constants/paymentModes.js
git commit -m "Add payment-mode constant (mobile)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Payment-mode chip row in `AddExpenseScreen`

**Files:**
- Modify: `mobile-app/src/screens/AddExpenseScreen.js`

**Interfaces:**
- Consumes: `PAYMENT_MODES` from `../constants/paymentModes`; `Ionicons` (already imported); `hapticFeedback` (already imported).
- Produces: `paymentMode` state (string, default `'other'`); pre-filled from `route.params.expense.paymentMode` on edit; reset by `resetForm`; included in `payload` in `handleSubmit`; a chip `ScrollView` rendered between the Category chips and the Notes input.

- [ ] **Step 1: Add the import**

Near the top with the other imports:

```js
import { PAYMENT_MODES } from '../constants/paymentModes';
```

- [ ] **Step 2: Add the state**

After `const [category, setCategory] = useState('');` (line ~23):

```js
    const [paymentMode, setPaymentMode] = useState('other');
```

- [ ] **Step 3: Pre-fill on edit**

In the `useEffect` that reads `route.params?.expense`, after `setCategory(exp.category?._id || exp.category || '');`:

```js
            setPaymentMode(exp.paymentMode || 'other');
```

- [ ] **Step 4: Reset in `resetForm`**

In `resetForm` (line ~59), after `setCategory('');`:

```js
        setPaymentMode('other');
```

- [ ] **Step 5: Include in the payload**

In `handleSubmit`, in the `payload` object, add `paymentMode` to the always-present fields:

```js
            const payload = {
                ...(isEditing && editId && { _id: editId, id: editId }),
                description, amount: parseFloat(amount), type, category, paymentMode,
                date: fmt(date), isRecurring,
                ...(isRecurring && { recurringPeriod, recurringEndDate: fmt(recurringEndDate) }),
            };
```

- [ ] **Step 6: Render the chip row**

Immediately after the Category `<ScrollView>` closing tag (`</ScrollView>` following the `{/* ── Category Chips ── */}` block, around line 404) and before `{/* ── Description ── */}`:

```jsx
                {/* ── Payment Method ── */}
                <Text style={s.sectionLabel}>Payment Method</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsScroll} style={{ marginBottom: 16 }}>
                    {PAYMENT_MODES.map(pm => {
                        const isSelected = paymentMode === pm.value;
                        return (
                            <TouchableOpacity
                                key={pm.value}
                                style={[s.chip, {
                                    backgroundColor: isSelected ? colors.primary + '20' : colors.card,
                                    borderColor: isSelected ? colors.primary : colors.border,
                                }]}
                                onPress={() => { hapticFeedback.light(); setPaymentMode(pm.value); }}
                            >
                                <Ionicons
                                    name={pm.icon}
                                    size={13}
                                    color={isSelected ? colors.primary : colors.subText}
                                />
                                <Text style={[s.chipText, { color: isSelected ? colors.primary : colors.text, marginLeft: 4 }]}>
                                    {pm.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
```

(The `s.chip` style already sets `flexDirection: 'row'` and border radius — confirm by reading the `chip:` entry in the `StyleSheet.create` block; if it lacks `flexDirection: 'row'` or `alignItems: 'center'`, add them to that style rule.)

- [ ] **Step 7: Emulator smoke**

`cd mobile-app && npx expo start` → open on an emulator/device → Add Expense screen:
- "Payment Method" row shows six chips, `Other` selected by default.
- Tap `UPI` → it highlights.
- Fill amount + category, Save → success alert. (The record is queued locally.)
- Re-open the app / go online → sync fires (`syncEngine.syncNow()` is already called). Verify on the web app or via API that the created expense has `paymentMode: 'upi'`.
- Airplane mode: add another expense with `Cash` → saves offline (pending). Disable airplane mode → syncs → `paymentMode: 'cash'` on the server.
- Edit an existing expense → the chip pre-selects its stored mode.

- [ ] **Step 8: Commit**

```bash
git add mobile-app/src/screens/AddExpenseScreen.js
git commit -m "Add payment-method chip row to AddExpenseScreen

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Assert `offlineService` + `syncEngine` pass `paymentMode` through

**Files:**
- Read-only: `mobile-app/src/services/offlineService.js`, `mobile-app/src/services/syncEngine.js`
- Modify only if an explicit field list exists.

**Interfaces:**
- Consumes: nothing.
- Produces: nothing (verification task; separated so a reviewer can confirm the offline path independently of the UI).

- [ ] **Step 1: Confirm `offlineService.saveExpenseLocally`**

Read `mobile-app/src/services/offlineService.js`. As of 2026-09-10 it does `const payload = { ...expenseData, client_uuid: uuid }` then stores `JSON.stringify(payload)`. `paymentMode` is inside `expenseData`, so it is persisted verbatim.
Expected: no change. If instead it constructs `payload` from named fields, add `paymentMode: expenseData.paymentMode` and commit.

- [ ] **Step 2: Confirm `syncEngine.syncNow`**

Read `mobile-app/src/services/syncEngine.js`. As of 2026-09-10 it does `const data = { ...p.payload }` then `return { ...data, client_uuid: p.uuid }`. `paymentMode` flows through.
Expected: no change. If it maps named fields, add `paymentMode: data.paymentMode`.

- [ ] **Step 3: End-to-end offline assertion (manual)**

With the app on an emulator in airplane mode:
1. Add an expense with `paymentMode = card`. It shows as pending.
2. Inspect the local DB row if tooling allows, or just trust the payload code path.
3. Go online. Watch the sync logs (`Syncing N expenses...`).
4. On the server (web app or `GET /api/expenses`), the synced expense has `paymentMode: 'card'`.

- [ ] **Step 4: Commit (only if a change was made)**

```bash
git add mobile-app/src/services/offlineService.js mobile-app/src/services/syncEngine.js
git commit -m "Forward paymentMode through offline queue and sync

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

If no change was needed, record "no-op — both layers spread the payload" in the task report and skip the commit.

---

## Task 4: Payment-mode badge on `TransactionItem`

**Files:**
- Modify: `mobile-app/src/components/TransactionItem.js`

**Interfaces:**
- Consumes: `getPaymentMode` from `../constants/paymentModes`; `Ionicons` (already imported); `useTheme` `colors` (already in scope).
- Produces: a small icon + label row under the category name, shown only when the resolved mode is not `other`.

- [ ] **Step 1: Add the import**

```js
import { getPaymentMode } from '../constants/paymentModes';
```

- [ ] **Step 2: Compute the mode**

In the component body, near `const catName = ...`:

```js
    const pm = getPaymentMode(item.paymentMode);
    const showPm = pm && pm.value !== 'other';
```

- [ ] **Step 3: Render the row**

In the `{/* Content */}` `<View style={styles.content}>`, after the `meta` `<Text>`:

```jsx
                {showPm && (
                    <View style={styles.pmRow}>
                        <Ionicons name={pm.icon} size={11} color={colors.subText} />
                        <Text style={[styles.pmText, { color: colors.subText }]}>{pm.label}</Text>
                    </View>
                )}
```

Add to the `StyleSheet.create` block:

```js
    pmRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 2,
    },
    pmText: {
        fontSize: 11,
        fontWeight: '400',
    },
```

- [ ] **Step 4: Emulator smoke**

Open the transactions list:
- A `upi`/`cash`/`card`… expense shows the small method row under the category name.
- An `other` expense shows no method row.
- Dark mode: the row text/icon use `colors.subText` and stay legible.

- [ ] **Step 5: Commit**

```bash
git add mobile-app/src/components/TransactionItem.js
git commit -m "Show payment-method on TransactionItem rows

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: `getPaymentModeBreakdown` in the mobile expense service

**Files:**
- Modify: `mobile-app/src/services/expenseService.js`

**Interfaces:**
- Consumes: `api` from `./api`.
- Produces: `expenseService.getPaymentModeBreakdown({ from, to })` → `api.get('/analytics/payment-modes', { params })`.

- [ ] **Step 1: Add the method**

In `mobile-app/src/services/expenseService.js`, inside the `expenseService` object (e.g. after `getDetailedAnalytics`):

```js
    getPaymentModeBreakdown: (params = {}) => {
        return api.get('/analytics/payment-modes', { params });
    },
```

- [ ] **Step 2: Sanity check**

Run: `cd mobile-app && node -e "require('esm'); import('./src/services/expenseService.js').then(m => console.log(typeof m.expenseService.getPaymentModeBreakdown))"`
(If `esm`/import fails in the RN project's Node context, skip this and rely on the Metro bundle in Task 6.)
Expected: `function`.

- [ ] **Step 3: Commit**

```bash
git add mobile-app/src/services/expenseService.js
git commit -m "Add getPaymentModeBreakdown to mobile expense service

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Online-only payment-mode chart on `AnalyticsScreen`

**Files:**
- Modify: `mobile-app/src/screens/AnalyticsScreen.js`

**Interfaces:**
- Consumes: `expenseService.getPaymentModeBreakdown` from `../services/expenseService`; `BarChart` from `../components/charts/BarChart` (already imported); `PAYMENT_MODES` from `../constants/paymentModes` (for labels); `NetInfo` (add import) OR reuse the existing "no data" guard pattern.
- Produces: a new card in the Analytics scroll view that fetches the payment-mode breakdown for the current date range and renders a `BarChart` of totals; hidden entirely when offline or when the fetch fails or returns nothing.

- [ ] **Step 1: Add imports + state**

At the top:

```js
import NetInfo from '@react-native-community/netinfo';
import { PAYMENT_MODES } from '../constants/paymentModes';
```

In the component, with the other `useState`s:

```js
    const [pmData, setPmData] = useState({ labels: [], values: [] });
```

- [ ] **Step 2: Fetch in `fetchAnalytics`**

Inside `fetchAnalytics`, after the existing `expenseService.getDetailedAnalytics(...)` block resolves (and `startDateStr` / `endDateStr` are in scope), add:

```js
            // Payment-mode breakdown — online only
            try {
                const net = await NetInfo.fetch();
                if (net.isConnected) {
                    const pmRes = await expenseService.getPaymentModeBreakdown({
                        from: startDateStr,
                        to: endDateStr,
                    });
                    const rows = pmRes.data?.data?.breakdown || [];
                    const labelFor = (v) =>
                        (PAYMENT_MODES.find((m) => m.value === v) || { label: 'Other' }).label;
                    setPmData({
                        labels: rows.map((r) => labelFor(r.paymentMode)),
                        values: rows.map((r) => r.total),
                    });
                } else {
                    setPmData({ labels: [], values: [] });
                }
            } catch (e) {
                setPmData({ labels: [], values: [] });
            }
```

- [ ] **Step 3: Render the card**

In the JSX scroll view, after the existing main chart card (near the "Insights" section, around line 655), add:

```jsx
                {pmData.values.length > 0 && (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>By Payment Method</Text>
                        <BarChart
                            data={pmData.values}
                            labels={pmData.labels}
                            width={Dimensions.get('window').width - 48}
                        />
                    </View>
                )}
```

Reuse whatever card/`cardTitle` style names already exist in this file's `StyleSheet` (check the existing chart card markup and copy its wrapper). Add `import { Dimensions } from 'react-native'` if not already imported (it is imported in `AnalyticsScreen`? — verify; `Dimensions` is used elsewhere in mobile so likely add it to the RN import line).

- [ ] **Step 4: Emulator smoke**

Analytics screen, online:
- With expenses across modes in the selected range, the "By Payment Method" card shows bars per mode with ₹ values on top.
- Change the range → the card refetches.
- A range with no expenses → the card is not rendered.
- Airplane mode + pull-to-refresh → the card disappears (no crash), the rest of Analytics still loads from cache/last data.
- Dark mode: bars + labels legible (the wrapper `BarChart` already themes via `useTheme`).

- [ ] **Step 5: Commit**

```bash
git add mobile-app/src/screens/AnalyticsScreen.js
git commit -m "Add online-only payment-method chart to AnalyticsScreen

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Full manual device sweep

**Files:** none (verification task)

- [ ] **Step 1: Metro bundle clean**

`cd mobile-app && npx expo start -c` → open on emulator. No red-box on: Add Expense, Transactions list, Analytics.

- [ ] **Step 2: Grep for stray references**

Run: `cd mobile-app && grep -rn "paymentMode" src/ | grep -v "constants/paymentModes"`
Expected: `AddExpenseScreen.js` (state/prefill/reset/payload/chips), `TransactionItem.js` (badge), `expenseService.js` (breakdown call), `AnalyticsScreen.js` (chart). Nothing else.

- [ ] **Step 3: Cross-flow sweep**

- Add online with each mode → server row has it (check web app).
- Add offline (airplane) with a mode → pending → go online → syncs with the mode.
- Edit a synced expense's mode online → updates.
- Recurring: create a monthly recurring expense with `card` from mobile → after sync, every generated occurrence on the server has `paymentMode: 'card'` (Phase 1A guarantees this server-side; confirm the mobile payload carried it).
- Transactions list shows the badge (non-`other` only), dark + light.
- Analytics chart online-only, refetch on range change, hidden offline.

- [ ] **Step 4: Record the sweep result in the task report.** No code change here; any fix belongs in its owning task's file.

---

## Self-Review

**1. Spec coverage**

| Spec item | Task |
|---|---|
| Mobile `paymentModes` constant (Ionicons names) | Task 1 |
| Chip row in `AddExpenseScreen`, matches category-chip visual | Task 2 Step 6 |
| `paymentMode` state, edit-prefill, reset | Task 2 Steps 2–4 |
| `paymentMode` in the local `payload` | Task 2 Step 5 |
| Works offline (payload + sync) | Task 2 (payload) + Task 3 (assert pass-through) |
| `offlineService` / `syncEngine` unchanged (spread) | Task 3 |
| Badge on `TransactionItem` | Task 4 |
| `getPaymentModeBreakdown` mobile service call | Task 5 |
| Online-only chart on `AnalyticsScreen` | Task 6 (`NetInfo.isConnected` guard) |
| Chart hidden offline / on failure / when empty | Task 6 Steps 2–3 |
| Manual device verification (no runner) | every task's smoke step + Task 7 |

**2. Placeholder scan:** No "TBD"/"handle edge cases". Task 6 Step 3 names the concrete reuse ("copy the existing chart card wrapper") with a verify instruction rather than inventing style names. Task 2 Step 6 flags the one style-rule dependency (`s.chip` needing `flexDirection: 'row'`) with a check.

**3. Type consistency:**
- `PAYMENT_MODES` item shape `{ value, label, icon }` (icon = Ionicons name string) consistent across Tasks 1, 2, 4, 6.
- `getPaymentMode(value)` → entry-or-`other`: Task 1 def, Task 4 use.
- `payload.paymentMode` string: Task 2 (write), Task 3 (assert), Phase 1A server side (read).
- `getPaymentModeBreakdown({ from, to })`: Task 5 def, Task 6 call. Response `res.data.data.breakdown` items `{ paymentMode, total, count }` — matches spec + Phase 1A.
- `pmData` shape `{ labels: string[], values: number[] }`: Task 6 Steps 1–3 all use the same.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-10-payment-mode-1c-mobile.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
**2. Inline Execution** — `superpowers:executing-plans`, batch with checkpoints.

**Which approach?**
