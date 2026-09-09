# Privacy Mode — Phase 3B (Web) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A header toggle and a Settings switch that mask every monetary amount across the web app with `••••••`. Charts blank their axis numbers and tooltip values but still draw. The Settings switch persists the default server-side.

**Architecture:** A `PrivacyContext` holds `isPrivate` (init: `localStorage` → `user.privacyModeDefault` → `false`; persisted to `localStorage`). An `<Amount>` component is the single render path for currency outside SVG. The 7–9 amount-render files swap `formatCurrency(...)` for `<Amount>`; chart files read `usePrivacy()` and blank their formatters. `Layout.jsx` gets an eye toggle; `Profile.jsx` gets a switch that also calls `updateProfile({ privacyModeDefault })`.

**Tech Stack:** React 18, Vite 4, Tailwind 3, `lucide-react`. No test runner — `npx vite build` + manual checklist + a grep gate.

**Spec:** `docs/superpowers/specs/2026-09-10-privacy-mode-design.md`

**Depends on:** Phase 3A merged for the *synced default* (degrades to `false` without it — can be built first).

## Global Constraints

- Mask string: exactly `••••••` (6 U+2022), rendered with `tracking-widest`, inheriting the surrounding text colour/size.
- `<Amount value={n} currency={c} sign={'+'|'-'|undefined} className />`: visible → `formatCurrency(n, c)` prefixed by `sign` if given; private → `••••••`; `n` null/undefined/NaN → `—` (visible) or `••••••` (private).
- `PrivacyContext` init order: `localStorage.getItem('privacyMode')` (`'1'`/`'0'`) → `user?.privacyModeDefault` → `false`. Every `localStorage` access in try/catch.
- Header toggle updates `isPrivate` + `localStorage` only. Settings switch updates both AND calls `updateProfile({ privacyModeDefault })` (optimistic; revert + toast on failure).
- Charts: when `isPrivate`, axis tick `formatter` returns `''` and amount tooltips render `••••`. Bars/lines/pie still draw. Do NOT put `<Amount>` inside `<svg>`.
- **Grep gate (Task 10):** after the sweep, `grep -rn "formatCurrency(" client/src` returns only `components/Amount.jsx` and (allowed) chart tick/tooltip formatter internals that are privacy-guarded. No bare `formatCurrency` call renders directly into JSX in pages/components.
- Budgets files (`pages/Budgets.jsx`, `components/BudgetList.jsx`) are swept **only if present on this branch**; otherwise skip and note.
- No new npm dependency.
- After each task: `cd client && npx vite build` succeeds.
- Commit after each task with the message in its final step.

## File Structure

**Created**
- `client/src/context/PrivacyContext.jsx` — provider + `usePrivacy()`
- `client/src/components/Amount.jsx` — the masked-or-formatted currency span

**Modified**
- `client/src/App.jsx` — mount `<PrivacyProvider>`
- `client/src/components/Layout.jsx` — header eye toggle
- `client/src/pages/Profile.jsx` — "Hide amounts by default" switch
- `client/src/pages/Dashboard.jsx` — sweep
- `client/src/pages/Expenses.jsx` — sweep
- `client/src/components/MobileExpenseCard.jsx` — sweep
- `client/src/components/AnalyticsDashboard.jsx` — sweep (numbers + chart guards)
- `client/src/components/DebtList.jsx`, `DebtStats.jsx`, `RepaymentModal.jsx` — sweep
- `client/src/pages/Budgets.jsx`, `client/src/components/BudgetList.jsx` — sweep *(if present)*

---

## Task 1: `PrivacyContext`

**Files:**
- Create: `client/src/context/PrivacyContext.jsx`

**Interfaces:**
- Consumes: `useAuth` from `./AuthContext` (for `user.privacyModeDefault`).
- Produces:
  - `export function PrivacyProvider({ children })`
  - `export function usePrivacy()` → `{ isPrivate: boolean, setPrivate(bool): void, toggle(): void }`
  - `isPrivate` initial value: stored `'privacyMode'` (`'1'` → true, `'0'` → false) if present, else `!!user?.privacyModeDefault`, else `false`. When `user` arrives after mount and there is no stored value, adopt `user.privacyModeDefault` once.
  - `setPrivate` / `toggle` write `'1'`/`'0'` to `localStorage`.

- [ ] **Step 1: Create the context**

```jsx
// client/src/context/PrivacyContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

const PrivacyContext = createContext({ isPrivate: false, setPrivate: () => {}, toggle: () => {} })

function readStored() {
  try {
    const v = localStorage.getItem('privacyMode')
    if (v === '1') return true
    if (v === '0') return false
  } catch {
    /* ignore */
  }
  return null
}

function writeStored(val) {
  try {
    localStorage.setItem('privacyMode', val ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function PrivacyProvider({ children }) {
  const { user } = useAuth()
  const [isPrivate, setIsPrivate] = useState(() => {
    const stored = readStored()
    if (stored !== null) return stored
    return false
  })
  const [adoptedDefault, setAdoptedDefault] = useState(readStored() !== null)

  // Adopt the server default once, if the user has no per-device choice yet.
  useEffect(() => {
    if (adoptedDefault) return
    if (user && typeof user.privacyModeDefault === 'boolean') {
      setIsPrivate(user.privacyModeDefault)
      setAdoptedDefault(true)
    }
  }, [user, adoptedDefault])

  const setPrivate = useCallback((val) => {
    setIsPrivate(!!val)
    writeStored(!!val)
    setAdoptedDefault(true)
  }, [])

  const toggle = useCallback(() => {
    setIsPrivate((prev) => {
      const next = !prev
      writeStored(next)
      return next
    })
    setAdoptedDefault(true)
  }, [])

  return (
    <PrivacyContext.Provider value={{ isPrivate, setPrivate, toggle }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  return useContext(PrivacyContext)
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/src/context/PrivacyContext.jsx
git commit -m "Add PrivacyContext (localStorage + user default seed)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `<Amount>` component

**Files:**
- Create: `client/src/components/Amount.jsx`

**Interfaces:**
- Consumes: `usePrivacy` from `../context/PrivacyContext`; `formatCurrency` from `../utils/helpers`.
- Produces: `export default function Amount({ value, currency = 'USD', sign, className = '' })` → a `<span>`.

- [ ] **Step 1: Create the component**

```jsx
// client/src/components/Amount.jsx
import { usePrivacy } from '../context/PrivacyContext'
import { formatCurrency } from '../utils/helpers'

const MASK = '••••••'

export default function Amount({ value, currency = 'USD', sign, className = '' }) {
  const { isPrivate } = usePrivacy()

  if (isPrivate) {
    return <span className={`tracking-widest ${className}`}>{MASK}</span>
  }

  const bad = value === null || value === undefined || Number.isNaN(Number(value))
  if (bad) {
    return <span className={className}>—</span>
  }

  const text = `${sign ?? ''}${formatCurrency(Number(value), currency)}`
  return <span className={className}>{text}</span>
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/Amount.jsx
git commit -m "Add <Amount> component (masked-or-formatted currency)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Mount the provider

**Files:**
- Modify: `client/src/App.jsx`

**Interfaces:**
- Consumes: `PrivacyProvider` from `./context/PrivacyContext`.
- Produces: `<PrivacyProvider>` wraps the routed pages, inside `<AuthProvider>` (so it can read `user`).

- [ ] **Step 1: Add the import**

```jsx
import { PrivacyProvider } from './context/PrivacyContext'
```

- [ ] **Step 2: Wrap the tree**

In the `App` component's JSX, place `<PrivacyProvider>` inside `<AuthProvider>` (and it can be inside or outside `ThemeProvider` — put it just inside `ThemeProvider`, wrapping the context providers):

```jsx
function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <PrivacyProvider>
          <ExpenseProvider>
            <DebtProvider>
              <AppRoutes />
            </DebtProvider>
          </ExpenseProvider>
        </PrivacyProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx
git commit -m "Mount PrivacyProvider in the app tree

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Header eye/eye-off toggle

**Files:**
- Modify: `client/src/components/Layout.jsx`

**Interfaces:**
- Consumes: `usePrivacy` from `../context/PrivacyContext`; `Eye`, `EyeOff` from `lucide-react`.
- Produces: an icon button in the header right-side cluster (next to `<ThemeToggle />`) that calls `usePrivacy().toggle()`; shows `EyeOff` when `isPrivate`, `Eye` otherwise.

- [ ] **Step 1: Add imports**

In `client/src/components/Layout.jsx`, add to the `lucide-react` import: `Eye, EyeOff`. Add:

```jsx
import { usePrivacy } from '../context/PrivacyContext'
```

- [ ] **Step 2: Read the context**

In the `Layout` component body:

```jsx
  const { isPrivate, toggle: togglePrivacy } = usePrivacy()
```

- [ ] **Step 3: Render the button**

In the header right-side `<div className="flex items-center space-x-2 sm:space-x-3">`, immediately before `<ThemeToggle />`:

```jsx
                <button
                  onClick={togglePrivacy}
                  aria-label={isPrivate ? 'Show amounts' : 'Hide amounts'}
                  title={isPrivate ? 'Show amounts' : 'Hide amounts'}
                  className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-white transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  {isPrivate ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
```

- [ ] **Step 4: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds.

- [ ] **Step 5: Manual check**

`npm run dev` → any `/app/*` page → the eye icon sits left of the theme control. Click it → icon flips to eye-off. Reload the page → it stays off (localStorage). No amounts change yet (sweep is later tasks) — that's expected.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/Layout.jsx
git commit -m "Add privacy-mode toggle to the app header

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: "Hide amounts by default" switch in Profile

**Files:**
- Modify: `client/src/pages/Profile.jsx`

**Interfaces:**
- Consumes: `usePrivacy`; `useAuth` (`updateProfile`, `user`); `toast` from `react-hot-toast` (already used in Profile).
- Produces: a labelled toggle that reflects `user.privacyModeDefault`, and on change: optimistically `setPrivate(next)` + `updateProfile({ privacyModeDefault: next })`; on failure, revert and `toast.error`.

- [ ] **Step 1: Add imports + state**

```jsx
import { usePrivacy } from '../context/PrivacyContext'
```

In the component:

```jsx
  const { setPrivate } = usePrivacy()
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const privacyDefault = !!user?.privacyModeDefault
```

- [ ] **Step 2: Add the handler**

```jsx
  const handlePrivacyDefaultChange = async (next) => {
    setSavingPrivacy(true)
    setPrivate(next) // immediate effect this session
    try {
      await updateProfile({ privacyModeDefault: next })
      toast.success(next ? 'Amounts hidden by default' : 'Amounts shown by default')
    } catch {
      setPrivate(!next) // revert session
      toast.error('Could not save privacy preference')
    } finally {
      setSavingPrivacy(false)
    }
  }
```

- [ ] **Step 3: Render the switch**

In the profile settings section (near the currency `<select>`, inside the same card), add:

```jsx
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Hide amounts by default</p>
                  <p className="text-xs text-gray-500 dark:text-slate-500">
                    Masks all monetary values across the app until you reveal them.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={privacyDefault}
                  disabled={savingPrivacy}
                  onClick={() => handlePrivacyDefaultChange(!privacyDefault)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    privacyDefault ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-white/[0.15]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacyDefault ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
```

- [ ] **Step 4: Verify build**

Run: `cd client && npx vite build`
Expected: succeeds.

- [ ] **Step 5: Manual check**

Profile page → toggle "Hide amounts by default" ON → toast confirms; the header eye flips to eye-off immediately. Log out, log back in → the switch is still ON and amounts start hidden (from `user.privacyModeDefault`, requires Phase 3A). Toggle OFF → persists. Simulate a failed save (kill the API) → the switch reverts and shows an error toast.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Profile.jsx
git commit -m "Add 'Hide amounts by default' switch to Profile

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Sweep `Dashboard.jsx`

**Files:**
- Modify: `client/src/pages/Dashboard.jsx`

**Interfaces:**
- Consumes: `Amount` from `../components/Amount`.
- Produces: every `formatCurrency(...)` that renders into JSX replaced by `<Amount value={...} currency={currency} sign={...} />`.

- [ ] **Step 1: Find every site**

Run: `cd client && grep -n "formatCurrency(" src/pages/Dashboard.jsx`
For each line, note whether it's `+`/`-` prefixed (recent transactions use `isIncome ? '+' : '-'`).

- [ ] **Step 2: Add the import**

```jsx
import Amount from '../components/Amount'
```

- [ ] **Step 3: Replace each render**

For a plain stat card total like `{formatCurrency(totalExpenses, currency)}`:

```jsx
<Amount value={totalExpenses} currency={currency} />
```

For a signed transaction amount like `{isIncome ? '+' : '-'}{formatCurrency(transaction.amount, currency)}`:

```jsx
<Amount value={transaction.amount} currency={currency} sign={isIncome ? '+' : '-'} />
```

Apply to all sites found in Step 1. Keep any wrapping `<span className="...">` — pass its classes to `<Amount className="...">` or leave the wrapper and put `<Amount>` inside it (either is fine; prefer moving the class to `<Amount>` when the span wrapped only the amount).

- [ ] **Step 4: Verify build + grep**

Run: `cd client && npx vite build`
Expected: succeeds.

Run: `cd client && grep -n "formatCurrency(" src/pages/Dashboard.jsx`
Expected: no matches (the `import` line for `formatCurrency` can stay if still referenced elsewhere; if not, remove it — the build will not error either way, but a lint-clean file removes the unused import).

- [ ] **Step 5: Manual check**

Dashboard with privacy OFF → amounts normal. Toggle ON (header eye) → every stat card + recent-transaction amount shows `••••••`. Toggle OFF → back to numbers.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Dashboard.jsx
git commit -m "Route Dashboard amounts through <Amount> for privacy mode

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Sweep `Expenses.jsx` + `MobileExpenseCard.jsx`

**Files:**
- Modify: `client/src/pages/Expenses.jsx`
- Modify: `client/src/components/MobileExpenseCard.jsx`

**Interfaces:**
- Consumes: `Amount`.
- Produces: summary totals, list-row amounts, calendar day totals, and the mobile card amount all rendered via `<Amount>`.

- [ ] **Step 1: Find every site**

Run: `cd client && grep -n "formatCurrency(" src/pages/Expenses.jsx src/components/MobileExpenseCard.jsx`

- [ ] **Step 2: Sweep `Expenses.jsx`**

Add `import Amount from '../components/Amount'`. Replace each `formatCurrency(...)` in JSX with `<Amount value={...} currency={currency} sign={...} />`. The desktop DataTable "amount" column `cell` renderer: return `<Amount value={row.original.amount} currency={currency} sign={row.original.type === 'income' ? '+' : '-'} />`. Calendar day totals: `<Amount value={dayTotal} currency={currency} />`.

- [ ] **Step 3: Sweep `MobileExpenseCard.jsx`**

Add `import Amount from './Amount'`. Replace:

```jsx
              {isIncome ? '+' : '-'}
              {formatCurrency(expense.amount, currency)}
```

with:

```jsx
              <Amount value={expense.amount} currency={currency} sign={isIncome ? '+' : '-'} />
```

Keep the surrounding coloured `<span>` (the income/expense colour classes) wrapping `<Amount>`.

- [ ] **Step 4: Verify build + grep**

Run: `cd client && npx vite build`
Run: `cd client && grep -n "formatCurrency(" src/pages/Expenses.jsx src/components/MobileExpenseCard.jsx`
Expected: no matches.

- [ ] **Step 5: Manual check**

Expenses page, privacy OFF → normal. Toggle ON → summary totals, every list row (desktop + mobile card), and calendar day totals show `••••••`. Colours (green/red) still apply to the masked span.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Expenses.jsx client/src/components/MobileExpenseCard.jsx
git commit -m "Route Expenses + MobileExpenseCard amounts through <Amount>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Sweep `AnalyticsDashboard.jsx` (numbers + chart guards)

**Files:**
- Modify: `client/src/components/AnalyticsDashboard.jsx`

**Interfaces:**
- Consumes: `Amount`; `usePrivacy`.
- Produces: text amounts via `<Amount>`; chart axis `tickFormatter`s return `''` when private; amount tooltips render `••••` when private; shapes still draw.

- [ ] **Step 1: Add imports + read context**

```jsx
import Amount from './Amount'
import { usePrivacy } from '../context/PrivacyContext'
```

In the component body:

```jsx
    const { isPrivate } = usePrivacy()
```

- [ ] **Step 2: Swap text amounts**

`grep -n "formatCurrency(" src/components/AnalyticsDashboard.jsx`. For each site that renders into JSX **outside** a Recharts `<...Chart>` subtree (stat cards, "Top Spending Categories" list, "Insights"), replace with `<Amount value={...} currency={currency} />`.

- [ ] **Step 3: Guard chart axes**

For each `<YAxis .../>` / `<XAxis .../>` that shows currency, add/modify:

```jsx
tickFormatter={(v) => (isPrivate ? '' : formatCurrency(v, currency))}
```

(If it currently has no `tickFormatter`, add one; if it has one, wrap its body in the `isPrivate ? '' : ...` conditional.)

- [ ] **Step 4: Guard chart tooltips**

For each `<Tooltip formatter={...} />` that formats currency, wrap:

```jsx
formatter={(v) => (isPrivate ? '••••' : formatCurrency(v, currency))}
```

For the custom pie/label renderers that print amounts, apply the same `isPrivate ? '••••' : ...` guard.

- [ ] **Step 5: Verify build + grep**

Run: `cd client && npx vite build`
Run: `cd client && grep -n "formatCurrency(" src/components/AnalyticsDashboard.jsx`
Expected: matches ONLY inside `tickFormatter` / `formatter` callbacks that are `isPrivate`-guarded. No bare `{formatCurrency(...)}` in JSX.

- [ ] **Step 6: Manual check**

Analytics, privacy OFF → normal. Toggle ON:
- Stat cards, top-categories list, insights → `••••••`.
- Charts still render bars/lines/pie in the same shape.
- Y-axis (and any currency X-axis) tick labels → blank.
- Hovering a bar/slice → tooltip shows `••••` instead of the amount.
Toggle OFF → everything back.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/AnalyticsDashboard.jsx
git commit -m "Privacy-guard Analytics numbers, chart axes, and tooltips

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Sweep `DebtList.jsx`, `DebtStats.jsx`, `RepaymentModal.jsx` (+ Budgets if present)

**Files:**
- Modify: `client/src/components/DebtList.jsx`, `client/src/components/DebtStats.jsx`, `client/src/components/RepaymentModal.jsx`
- Modify *(only if present on this branch)*: `client/src/pages/Budgets.jsx`, `client/src/components/BudgetList.jsx`

**Interfaces:**
- Consumes: `Amount`.
- Produces: all debt/budget amounts rendered via `<Amount>`.

- [ ] **Step 1: Confirm which files exist**

Run: `cd client && ls src/pages/Budgets.jsx src/components/BudgetList.jsx 2>/dev/null; grep -n "formatCurrency(" src/components/DebtList.jsx src/components/DebtStats.jsx src/components/RepaymentModal.jsx`

- [ ] **Step 2: Sweep the debt files**

In each: `import Amount from './Amount'`. Replace each `formatCurrency(...)` JSX render with `<Amount value={...} currency={currency} sign={...} />`. Debt amounts are typically unsigned; `DebtStats` payable/receivable totals are unsigned; `RepaymentModal` "remaining" and input echoes are unsigned.

- [ ] **Step 3: Sweep Budgets (if present)**

Same swap in `Budgets.jsx` / `BudgetList.jsx`. If absent, record "Budgets not on this branch — skipped" in the task report.

- [ ] **Step 4: Verify build + grep**

Run: `cd client && npx vite build`
Run: `cd client && grep -n "formatCurrency(" src/components/DebtList.jsx src/components/DebtStats.jsx src/components/RepaymentModal.jsx`
Expected: no matches.

- [ ] **Step 5: Manual check**

Debts page → toggle privacy → per-debt amounts and payable/receivable totals mask. Open a repayment modal → its amounts mask (the number input you type into is a `<input>`, not an `<Amount>` — it stays visible; only display echoes mask). Budgets page (if present) → amounts mask.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/DebtList.jsx client/src/components/DebtStats.jsx client/src/components/RepaymentModal.jsx
# add Budgets files too if they were swept
git commit -m "Route Debt (and Budget) amounts through <Amount>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: Grep gate + full manual regression

**Files:** none (verification task)

- [ ] **Step 1: Build**

Run: `cd client && npx vite build`
Expected: succeeds, only pre-existing warnings.

- [ ] **Step 2: The grep gate**

Run: `cd client && grep -rn "formatCurrency(" src/ | grep -v "utils/helpers.js\|components/Amount.jsx"`
Expected output: ONLY lines inside privacy-guarded chart `tickFormatter` / `formatter` callbacks in `AnalyticsDashboard.jsx` (and any other chart file swept). Every one of those lines must contain `isPrivate ?`. If any bare `{formatCurrency(...)}` remains in a page/component JSX return, that's a gate failure — fix it in that file's owning task.

- [ ] **Step 3: `Intl.NumberFormat` check**

Run: `cd client && grep -rn "Intl.NumberFormat" src/ | grep -v "utils/helpers.js"`
Expected: no direct currency-formatting `Intl.NumberFormat` in pages/components (they should all route through `formatCurrency` → `<Amount>`). If found, wrap it too.

- [ ] **Step 4: Full manual sweep**

`npm run dev`, privacy toggled ON, visit every page:
- Dashboard: all stat cards + recent transactions masked.
- Expenses: summary, list (desktop + mobile), calendar totals masked. The Add/Edit form's `AmountHero` input — you are typing into it, so it is NOT an `<Amount>` and stays visible (correct).
- Analytics: numbers masked, chart shapes intact, axis numbers blank, tooltips `••••`.
- Debts: amounts + totals masked; repayment modal display amounts masked, the `<input>` visible.
- Budgets (if present): masked.
- Profile: the "Hide amounts by default" switch reflects state; toggling it syncs (3A) and flips the header eye.
Toggle OFF everywhere → all numbers return.
Reload the page mid-session → privacy state persists (localStorage).
Dark + light mode: masked spans keep the surrounding colour.

- [ ] **Step 5: Record the sweep in the task report.** Any fix belongs in its owning file's task.

---

## Self-Review

**1. Spec coverage**

| Spec item | Task |
|---|---|
| `PrivacyContext` — localStorage → user default → false | Task 1 |
| `<Amount>` — masked/formatted, `—` for bad value | Task 2 |
| Provider mounted inside AuthProvider | Task 3 |
| Header eye/eye-off toggle | Task 4 |
| Settings switch → `updateProfile({ privacyModeDefault })` + optimistic revert | Task 5 |
| Sweep Dashboard | Task 6 |
| Sweep Expenses + MobileExpenseCard | Task 7 |
| Sweep Analytics numbers + chart axis/tooltip guards | Task 8 |
| Sweep Debts (+ Budgets if present) | Task 9 |
| Mask string exactly `••••••`, `tracking-widest` | Task 2 (`MASK`) |
| Charts still draw shapes; axis blank; tooltip `••••` | Task 8 Steps 3–4 |
| Grep gate proves no bare `formatCurrency` renders | Task 10 Step 2 |
| `npx vite build` verification (no runner) | every build step + Task 10 |

**2. Placeholder scan:** No "TBD"/"handle edge cases". Each sweep task starts with a `grep` to enumerate exact sites, then a literal replacement pattern. Task 9 handles the Budgets-maybe-absent case with a check + recorded skip.

**3. Type consistency:**
- `usePrivacy()` → `{ isPrivate, setPrivate, toggle }` — Task 1 def; Task 2/4/5/8 consumers use exactly these names.
- `<Amount value currency sign className />` — Task 2 def; Tasks 6–9 all call with this prop set (`sign` optional).
- `updateProfile({ privacyModeDefault })` — Task 5 call matches Phase 3A's accepted body key.
- `localStorage` key `'privacyMode'`, values `'1'`/`'0'` — Task 1 read + write use the same.
- `user.privacyModeDefault` (boolean) — Task 1 seed + Task 5 switch state read the same field from `useAuth().user`.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-10-privacy-mode-3b-web.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
**2. Inline Execution** — `superpowers:executing-plans`, batch with checkpoints.

**Which approach?**
