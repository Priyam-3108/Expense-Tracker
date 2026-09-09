# Privacy Mode — Phase 3C (Mobile) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A header eye toggle on the main mobile screens and a Profile switch that mask every monetary amount with `••••••`. State persists via `AsyncStorage` and seeds from `user.privacyModeDefault`. Charts blank their value labels but still draw. The Add-Expense amount input is never masked.

**Architecture:** `PrivacyContext` (AsyncStorage-backed) provided at the app root below `AuthProvider`. An `<Amount>` RN `<Text>` component. The amount-render sites (`BalanceCard`, `SummaryCard`, `TransactionItem`, `ProgressBar`, `DashboardScreen`, `AnalyticsScreen`, `DebtScreen`, `BudgetSettingsScreen`) swap their formatted `<Text>` for `<Amount>`. Chart wrappers gain a `hideValues` prop. Headers get an eye button. `ProfileScreen` gets a switch that calls `authService.updateProfile`.

**Tech Stack:** Expo ~54, RN 0.81, `@react-native-async-storage/async-storage` (already a dep), `@expo/vector-icons`. No test runner — manual device smoke.

**Spec:** `docs/superpowers/specs/2026-09-10-privacy-mode-design.md`

**Depends on:** Phase 3A merged for the synced default (degrades to `false` without it). 3B independent.

## Global Constraints

- Mask string: `••••••` (6 U+2022).
- `PrivacyContext` init: `AsyncStorage.getItem('privacyMode')` (`'1'`/`'0'`) → `user?.privacyModeDefault` → `false`. All storage access in try/catch.
- Header toggle updates state + AsyncStorage only. Profile switch updates both AND `authService.updateProfile({ privacyModeDefault })` + refresh the stored `user` (via `signIn(token, updatedUser)` or a dedicated setter — see Task 6).
- The Add Expense **amount hero input** stays visible always. "Remaining"/meta amount lines mask.
- Charts: pass `hideValues={isPrivate}` to `BarChart` / `LineChart` / `PieChart` wrappers; they suppress on-bar value labels / `yAxisLabel` / slice labels when true. Shapes still draw.
- No new npm dependency.
- After each task: Metro bundles the changed screen(s) with no red-box on an emulator.
- Commit after each task with the message in its final step.

## File Structure

**Created**
- `mobile-app/src/context/PrivacyContext.js` — provider + `usePrivacy()`
- `mobile-app/src/components/Amount.js` — masked-or-formatted `<Text>`

**Modified**
- `mobile-app/App.js` — mount `<PrivacyProvider>` below `AuthProvider`
- `mobile-app/src/components/BalanceCard.js`, `SummaryCard.js`, `TransactionItem.js`, `ProgressBar.js` — sweep
- `mobile-app/src/screens/DashboardScreen.js`, `AnalyticsScreen.js`, `DebtScreen.js`, `BudgetSettingsScreen.js` — sweep + header eye
- `mobile-app/src/components/charts/BarChart.js`, `LineChart.js`, `PieChart.js` — `hideValues` prop
- `mobile-app/src/screens/ProfileScreen.js` — default switch

---

## Task 1: `PrivacyContext`

**Files:**
- Create: `mobile-app/src/context/PrivacyContext.js`

**Interfaces:**
- Consumes: `AsyncStorage`; `AuthContext` from `./AuthContext` (for `user.privacyModeDefault`).
- Produces: `export const PrivacyProvider` and `export function usePrivacy()` → `{ isPrivate, setPrivate(bool), toggle() }`.

- [ ] **Step 1: Create the context**

```js
// mobile-app/src/context/PrivacyContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';

const PrivacyContext = createContext({ isPrivate: false, setPrivate: () => {}, toggle: () => {} });

const KEY = 'privacyMode';

export const PrivacyProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [isPrivate, setIsPrivate] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [adoptedDefault, setAdoptedDefault] = useState(false);

  // Hydrate from storage once.
  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(KEY);
        if (v === '1') { setIsPrivate(true); setAdoptedDefault(true); }
        else if (v === '0') { setIsPrivate(false); setAdoptedDefault(true); }
      } catch {
        /* ignore */
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Adopt the server default once, only if no stored per-device choice.
  useEffect(() => {
    if (!hydrated || adoptedDefault) return;
    if (user && typeof user.privacyModeDefault === 'boolean') {
      setIsPrivate(user.privacyModeDefault);
      setAdoptedDefault(true);
    }
  }, [hydrated, adoptedDefault, user]);

  const persist = useCallback(async (val) => {
    try { await AsyncStorage.setItem(KEY, val ? '1' : '0'); } catch { /* ignore */ }
  }, []);

  const setPrivate = useCallback((val) => {
    setIsPrivate(!!val);
    setAdoptedDefault(true);
    persist(!!val);
  }, [persist]);

  const toggle = useCallback(() => {
    setIsPrivate((prev) => {
      const next = !prev;
      persist(next);
      return next;
    });
    setAdoptedDefault(true);
  }, [persist]);

  return (
    <PrivacyContext.Provider value={{ isPrivate, setPrivate, toggle }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export function usePrivacy() {
  return useContext(PrivacyContext);
}
```

- [ ] **Step 2: Sanity check import graph**

Run: `cd mobile-app && node -e "require('@babel/core')" 2>/dev/null; echo 'skip node parse; rely on Metro'`
Then start Metro in Task 3. (Pure syntax is fine; the real check is the bundle.)

- [ ] **Step 3: Commit**

```bash
git add mobile-app/src/context/PrivacyContext.js
git commit -m "Add mobile PrivacyContext (AsyncStorage + user default seed)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `<Amount>` RN component

**Files:**
- Create: `mobile-app/src/components/Amount.js`

**Interfaces:**
- Consumes: `usePrivacy` from `../context/PrivacyContext`; RN `Text`.
- Produces: `export default function Amount({ value, sign, style, currency = 'INR' })` → `<Text>`. Visible → `sign + formatted`; private → `••••••`; bad value → `—`.

- [ ] **Step 1: Create the component**

```jsx
// mobile-app/src/components/Amount.js
import React from 'react';
import { Text } from 'react-native';
import { usePrivacy } from '../context/PrivacyContext';

const MASK = '••••••';

function format(value, currency) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${value}`;
  }
}

export default function Amount({ value, sign, style, currency = 'INR' }) {
  const { isPrivate } = usePrivacy();

  if (isPrivate) {
    return <Text style={style}>{MASK}</Text>;
  }
  const bad = value === null || value === undefined || Number.isNaN(Number(value));
  if (bad) {
    return <Text style={style}>—</Text>;
  }
  return <Text style={style}>{`${sign ?? ''}${format(value, currency)}`}</Text>;
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile-app/src/components/Amount.js
git commit -m "Add mobile <Amount> component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Mount `<PrivacyProvider>`

**Files:**
- Modify: `mobile-app/App.js`

**Interfaces:**
- Consumes: `PrivacyProvider` from `./src/context/PrivacyContext`.
- Produces: `<PrivacyProvider>` wraps `<RootNavigator />`, inside `<AuthProvider>` (so it reads `user`), inside `<SecurityProvider>` or wrapping it — put it directly around `RootNavigator`, inside `SecurityProvider`.

- [ ] **Step 1: Add the import**

```js
import { PrivacyProvider } from './src/context/PrivacyContext';
```

- [ ] **Step 2: Wrap the navigator**

```jsx
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SecurityProvider>
            <PrivacyProvider>
              <RootNavigator />
            </PrivacyProvider>
          </SecurityProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
```

- [ ] **Step 3: Metro bundle check**

Run: `cd mobile-app && npx expo start -c` → open on an emulator. App boots to the normal first screen, no red-box.

- [ ] **Step 4: Commit**

```bash
git add mobile-app/App.js
git commit -m "Mount PrivacyProvider in the mobile app root

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Chart wrappers gain `hideValues`

**Files:**
- Modify: `mobile-app/src/components/charts/BarChart.js`, `LineChart.js`, `PieChart.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: each wrapper accepts `hideValues` (default `false`). When `true`: `BarChart` sets `showValuesOnTopOfBars={false}` and `yAxisLabel=""`; `LineChart` sets `yAxisLabel=""` and (if it renders data-point labels) hides them; `PieChart` hides slice value labels (render `''` or set the label accessor to blank). Shapes still draw.

- [ ] **Step 1: `BarChart.js`**

Change the signature: `function BarChart({ data, labels, height = 220, width, hideValues = false })`.

In the `<RNBarChart .../>` props, replace `showValuesOnTopOfBars` with `showValuesOnTopOfBars={!hideValues}` and `yAxisLabel="₹"` with `yAxisLabel={hideValues ? '' : '₹'}`.

- [ ] **Step 2: `LineChart.js`**

Add `hideValues = false` to the signature. Set `yAxisLabel={hideValues ? '' : '₹'}`. If it passes `renderDotContent` or a similar value-label prop, guard it: `renderDotContent={hideValues ? undefined : existingRenderer}`.

- [ ] **Step 3: `PieChart.js`**

Add `hideValues = false`. `react-native-chart-kit`'s `PieChart` shows the `accessor` value next to each slice. When `hideValues`, either set `hidePointsAtIndex` is not applicable — instead pass a data array whose display value is blanked, OR set the `<PieChart>` `accessor` to a key that exists but render `absolute={false}` with `hasLegend`. Simplest reliable approach: when `hideValues`, wrap the chart in a `<View>` and overlay is overkill — instead map the incoming `data` so each item's numeric label field is preserved for sizing but pass `showText={false}` if the lib supports it. If the installed version has no clean switch, accept that pie slice values remain and note it in the report; the primary privacy surface (Bar/Line axes + on-bar values) is covered.

- [ ] **Step 4: Metro bundle check**

`npx expo start` → Analytics screen still renders its existing chart (no `hideValues` passed yet → defaults to visible, unchanged behaviour).

- [ ] **Step 5: Commit**

```bash
git add mobile-app/src/components/charts/BarChart.js mobile-app/src/components/charts/LineChart.js mobile-app/src/components/charts/PieChart.js
git commit -m "Add hideValues prop to mobile chart wrappers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Sweep the amount components

**Files:**
- Modify: `mobile-app/src/components/BalanceCard.js`, `SummaryCard.js`, `TransactionItem.js`, `ProgressBar.js`

**Interfaces:**
- Consumes: `Amount` from `../components/Amount` (or `./Amount` within `components/`).
- Produces: each formatted-amount `<Text>` replaced by `<Amount>`, preserving the existing text `style`.

- [ ] **Step 1: `TransactionItem.js`**

Import `Amount from './Amount'`. Replace:

```jsx
                <Text style={[styles.amount, { color: amountColor }]}>
                    {isIncome ? '+' : '-'}{formatAmount(Math.abs(item.amount))}
                </Text>
```

with:

```jsx
                <Amount
                    value={Math.abs(item.amount)}
                    sign={isIncome ? '+' : '-'}
                    style={[styles.amount, { color: amountColor }]}
                />
```

The local `formatAmount` helper can stay (unused) or be removed — remove it to keep the file clean.

- [ ] **Step 2: `BalanceCard.js`**

Import `Amount`. The balance renders as `<Text style={styles.currencySymbol}>₹</Text>` + a formatted number `<Text>`. Replace the number `<Text>` with `<Amount value={amount} currency="INR" style={styles.balanceValue} />` and **remove the separate `₹` symbol `<Text>`** (since `<Amount>` formats with the currency symbol). If the layout depends on the split symbol, instead keep the symbol and pass a currency-less format — simpler: drop the symbol node, let `<Amount>` render `₹1,234`. Verify the card still looks right.

- [ ] **Step 3: `SummaryCard.js`**

Import `Amount`. Replace `{formatAmount(amount)}` `<Text>` with `<Amount value={amount} style={<the same style>} />`. Remove the local `formatAmount` if now unused.

- [ ] **Step 4: `ProgressBar.js`**

Import `Amount`. This has four sites (`{formatAmount(amount)}`, `/ {formatAmount(budget)}`, `{formatAmount(remaining)} remaining`, `Over budget by {formatAmount(Math.abs(remaining))}`). Replace each amount with `<Amount value={...} style={<matching style>} />`, keeping the literal `/ ` and ` remaining` / `Over budget by ` text as sibling `<Text>` nodes. Remove the local `formatAmount` if unused.

- [ ] **Step 5: Metro bundle + visual check**

`npx expo start -c` → Dashboard: `BalanceCard`, `SummaryCard`, transaction rows render amounts normally (privacy OFF). No layout break.

- [ ] **Step 6: Commit**

```bash
git add mobile-app/src/components/BalanceCard.js mobile-app/src/components/SummaryCard.js mobile-app/src/components/TransactionItem.js mobile-app/src/components/ProgressBar.js
git commit -m "Route mobile amount components through <Amount>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Sweep the screens + add header eye toggles

**Files:**
- Modify: `mobile-app/src/screens/DashboardScreen.js`, `AnalyticsScreen.js`, `DebtScreen.js`, `BudgetSettingsScreen.js`

**Interfaces:**
- Consumes: `usePrivacy` from `../context/PrivacyContext`; `Amount`; `Ionicons`.
- Produces: each screen's inline amount renders route through `<Amount>` (or a privacy check for string-interpolated `₹...` messages); each main screen's header gets an `Ionicons` eye/eye-off button calling `usePrivacy().toggle()`; `AnalyticsScreen` passes `hideValues={isPrivate}` to its chart.

- [ ] **Step 1: `DashboardScreen.js`**

- Import `usePrivacy`. Read `const { isPrivate, toggle: togglePrivacy } = usePrivacy()`.
- Header: add an eye button next to the existing header controls:
  ```jsx
  <TouchableOpacity onPress={togglePrivacy} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
    <Ionicons name={isPrivate ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.text} />
  </TouchableOpacity>
  ```
  Place it in the same row as the screen title / other header icons (match the existing header layout in this file).
- The `ActionSheet` `subtitle` at line ~370 interpolates `₹${selectedExpense.amount}`. Replace with a privacy-aware string: `` `${cat} - ${isPrivate ? '••••••' : '₹' + selectedExpense.amount}` ``.
- Any other direct `₹`/`formatAmount` renders in JSX → `<Amount>`.

- [ ] **Step 2: `AnalyticsScreen.js`**

- Import `usePrivacy`; read `isPrivate`.
- Header eye button (same snippet).
- Pass `hideValues={isPrivate}` to the `<BarChart>` / `<PieChart>` / `<LineChart>` usages.
- The **insight message strings** (lines ~201, 228, 240, 266) interpolate `₹${...}`. When `isPrivate`, replace the amount portions with `••••`. Cleanest: after building each `message`, do `const safeMessage = isPrivate ? message.replace(/₹[\d,.\s]+/g, '₹••••') : message;` and render `safeMessage`. Apply wherever these messages are rendered (the `InsightCard` `message` prop).
- Any stat `<Text>` showing a total → `<Amount>`.

- [ ] **Step 3: `DebtScreen.js`**

- Import `usePrivacy`; read `isPrivate`.
- Header eye button.
- Module-level `fmt` / `fmtShort` helpers are used in JSX like `₹{fmtShort(debt.currentAmount)}` and `{fmt(total)}`. Replace each JSX amount render with `<Amount value={debt.currentAmount} style={<matching style>} />`. For the leading `₹` cases, drop the literal `₹` and let `<Amount>` (currency `INR`) render it, OR keep `fmtShort` for width and wrap: simplest is `<Amount value={...} />`. Keep `fmt`/`fmtShort` only if still used for non-display math; otherwise remove.

- [ ] **Step 4: `BudgetSettingsScreen.js`**

- Import `usePrivacy`; read `isPrivate`.
- The saved-confirmation `Alert.alert('Budget Saved', \`Monthly budget updated to ₹${monthlyBudget}\`)` — leave as-is (it's a transient alert echoing what the user just typed; not a persistent display). Optional: mask it too for consistency — `isPrivate ? '••••••' : '₹' + monthlyBudget`.
- The `<Text style={styles.label}>Monthly Overall Budget (₹)</Text>` is a label, not an amount — leave it.
- If this screen renders the current budget value anywhere as a display `<Text>` (from the `budget` record fetched in the earlier budget feature), route it through `<Amount>`.
- Header eye button if this screen has its own header; if it's a sub-screen with a back arrow only, skip the toggle here (Dashboard/Analytics/Debt cover it).

- [ ] **Step 5: Metro bundle + visual check**

`npx expo start -c`:
- Each screen with a header eye button shows it; tapping flips the icon.
- Privacy OFF: all amounts normal.
- Privacy ON: Dashboard cards + transactions, Analytics stats + insight strings + chart values, Debt amounts + totals all show `••••••` / `₹••••`; charts still draw shapes; axis `₹` label gone.

- [ ] **Step 6: Commit**

```bash
git add mobile-app/src/screens/DashboardScreen.js mobile-app/src/screens/AnalyticsScreen.js mobile-app/src/screens/DebtScreen.js mobile-app/src/screens/BudgetSettingsScreen.js
git commit -m "Sweep mobile screens for privacy mode + add header eye toggles

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Profile "Hide amounts by default" switch

**Files:**
- Modify: `mobile-app/src/screens/ProfileScreen.js`

**Interfaces:**
- Consumes: `usePrivacy`; `AuthContext` (`user`, `signIn`); `authService.updateProfile` from `../services/authService`.
- Produces: a toggle row (styled like the existing theme toggle in this screen) that reflects `user.privacyModeDefault`; on change: `setPrivate(next)` + `authService.updateProfile({ privacyModeDefault: next })` + persist the updated `user` (`await signIn(token, updatedUser)` where `token` comes from `AsyncStorage.getItem('token')`, or a lighter `setUser` if `AuthContext` exposes one — check). Revert on failure with an `Alert`.

- [ ] **Step 1: Read `AuthContext`'s surface**

Check whether `AuthContext` exposes a `setUser` / `updateUser`. If yes, use it to store the new `user`. If only `signIn(token, user)` exists, read the token from `AsyncStorage` and call `signIn(token, updatedUser)` (it re-persists `user` to AsyncStorage — acceptable). Record which in the report.

- [ ] **Step 2: Add imports + state**

```js
import { usePrivacy } from '../context/PrivacyContext';
import * as authService from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
```

In the component:

```js
  const { setPrivate } = usePrivacy();
  const [savingPrivacy, setSavingPrivacy] = React.useState(false);
  const privacyDefault = !!user?.privacyModeDefault;
```

- [ ] **Step 3: Handler**

```js
  const onTogglePrivacyDefault = async (next) => {
    setSavingPrivacy(true);
    setPrivate(next);
    try {
      const res = await authService.updateProfile({ privacyModeDefault: next });
      const updatedUser = res.data?.data?.user;
      if (updatedUser) {
        const token = await AsyncStorage.getItem('token');
        if (token) await signIn(token, updatedUser); // re-persists user
      }
    } catch (e) {
      setPrivate(!next);
      Alert.alert('Error', 'Could not save privacy preference.');
    } finally {
      setSavingPrivacy(false);
    }
  };
```

(`Alert` and `signIn` — ensure both are imported/destructured; `Alert` from `react-native`, `signIn` from `useContext(AuthContext)`.)

- [ ] **Step 4: Render the row**

Copy the existing theme-toggle row markup in `ProfileScreen.js` (the `styles.toggle` / `styles.toggleThumb` pattern) and bind it to `privacyDefault` / `onTogglePrivacyDefault`:

```jsx
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Hide amounts by default</Text>
            <Text style={[styles.settingHint, { color: colors.subText }]}>Mask all values across the app</Text>
          </View>
          <TouchableOpacity
            disabled={savingPrivacy}
            onPress={() => onTogglePrivacyDefault(!privacyDefault)}
            style={[styles.toggle, { backgroundColor: privacyDefault ? colors.primary : colors.border }]}
          >
            <View style={[styles.toggleThumb, {
              backgroundColor: '#ffffff',
              transform: [{ translateX: privacyDefault ? 20 : 2 }],
            }]} />
          </TouchableOpacity>
        </View>
```

Reuse `styles.settingRow` / `styles.settingLabel` / `styles.settingHint` if they exist; else add minimal ones mirroring the theme row.

- [ ] **Step 5: Emulator smoke**

Profile screen → toggle "Hide amounts by default" ON → other screens' amounts hide; kill and relaunch the app → still hidden (AsyncStorage + user default). Toggle OFF → persists. Kill the API and toggle → reverts with an alert.

- [ ] **Step 6: Commit**

```bash
git add mobile-app/src/screens/ProfileScreen.js
git commit -m "Add 'Hide amounts by default' switch to mobile Profile

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Full manual device sweep

**Files:** none (verification task)

- [ ] **Step 1: Clean bundle** — `npx expo start -c`, no red-box on any screen.

- [ ] **Step 2: Grep**

Run: `cd mobile-app && grep -rn "formatAmount\|Intl.NumberFormat" src/components/ src/screens/ | grep -v "components/Amount.js"`
Expected: only `charts/` internals (chart libs format their own axis) and any string-interpolation sites explicitly privacy-guarded in Task 6. No bare `formatAmount(...)` rendering a display `<Text>` in the swept components/screens.

Run: `cd mobile-app && grep -rn "usePrivacy\|PrivacyProvider\|<Amount" src/`
Expected: the context, `App.js`, `Amount.js`, and the swept components/screens only.

- [ ] **Step 3: Sweep on device**

Privacy toggled ON via a header eye:
- Dashboard: balance card, summary cards, transaction rows → `••••••`. Colours intact.
- Analytics: stat numbers, insight strings (`₹••••`), chart shapes drawn, axis `₹` gone.
- Debts: per-debt amounts + payable/receivable totals masked.
- Add Expense: the big amount hero input is **still visible/typeable**; any "remaining" meta line masked.
- Profile: the default switch state matches; toggling syncs (3A) and the header eye elsewhere reflects it.
Toggle OFF → all return.
Kill + relaunch → last state persists.
Dark + light.

- [ ] **Step 4: Record the sweep in the task report.** Fixes belong in the owning file's task.

---

## Self-Review

**1. Spec coverage**

| Spec item | Task |
|---|---|
| Mobile `PrivacyContext` — AsyncStorage → user default → false | Task 1 |
| `<Amount>` RN — masked/formatted, `—` for bad | Task 2 |
| Provider at root below AuthProvider | Task 3 |
| Chart wrappers `hideValues` (Bar/Line axes + on-bar values) | Task 4 |
| Sweep `BalanceCard`, `SummaryCard`, `TransactionItem`, `ProgressBar` | Task 5 |
| Sweep `DashboardScreen`, `AnalyticsScreen`, `DebtScreen`, `BudgetSettingsScreen` + header eye | Task 6 |
| Analytics insight-string masking (`₹••••`) | Task 6 Step 2 |
| Add Expense amount input NOT masked | Task 6 (not touched) + Task 8 verify |
| Profile default switch → `authService.updateProfile` + revert-on-fail | Task 7 |
| Persist across relaunch (AsyncStorage) | Task 1 + Task 8 verify |
| Manual device verification (no runner) | every smoke step + Task 8 |

**2. Placeholder scan:** No "TBD"/"handle edge cases". Task 4 Step 3 (`PieChart`) explicitly names the fallback if the lib has no clean switch and scopes what's still covered. Task 6 gives the exact regex for string-interpolated amounts. Task 7 Step 1 resolves the `AuthContext` setter question with a check + recorded outcome.

**3. Type consistency:**
- `usePrivacy()` → `{ isPrivate, setPrivate, toggle }` — Task 1 def; Tasks 2, 6, 7 consumers.
- `<Amount value sign style currency />` — Task 2 def; Tasks 5, 6 calls (`sign`/`currency` optional).
- `authService.updateProfile({ privacyModeDefault })` — Task 7 call matches Phase 3A body key; response `res.data.data.user` matches server shape.
- AsyncStorage key `'privacyMode'`, `'1'`/`'0'` — Task 1 read + write.
- `hideValues` prop (boolean) — Task 4 def on all three wrappers; Task 6 Step 2 passes `hideValues={isPrivate}`.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-10-privacy-mode-3c-mobile.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
**2. Inline Execution** — `superpowers:executing-plans`, batch with checkpoints.

**Which approach?**
