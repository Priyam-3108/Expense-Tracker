# Feature 3 — Privacy Mode — Design

Date: 2026-09-10
Status: Approved for planning
Roadmap: [2026-09-09-expense-manager-parity-roadmap.md](2026-09-09-expense-manager-parity-roadmap.md)
Branch: `enhancement/expense-manager-parity`

## Goal

One toggle that masks every monetary amount across the app, for using it in
public. Reference: Expense Manager's Privacy Mode. Purely a client display
concern; the server change is a one-field default so the preference follows
the user across devices.

## Non-goals

- No receipt-image masking (the app has no receipt images yet — stub the hook).
- No per-screen or per-widget privacy — it's global.
- No auto-privacy on app background (mobile) in v1 — deferred.
- No blur of non-numeric content (category names, dates, descriptions stay visible).

## Decisions (resolved from the roadmap's "spec must resolve")

### Persistence

**Server default + per-device session state.** A `privacyModeDefault` boolean
on `User` (default `false`), settable via `PUT /api/auth/profile`, returned in
every user payload (`login`, `register`, `getProfile`). On the client:

- `PrivacyContext.isPrivate` is initialised from `localStorage`
  (`'privacyMode'`) if present, else from `user.privacyModeDefault`, else
  `false`.
- Toggling in the header updates `isPrivate` + `localStorage` only (fast,
  per-device).
- A "Hide amounts by default" switch in Settings/Profile calls
  `updateProfile({ privacyModeDefault })` AND sets the local state, so the
  choice syncs and takes effect immediately.

### Mask style

**Dots.** A masked amount renders as `••••••` (6 dots, `tracking-widest`),
same colour weight as the text it replaces. Not blur (blur is guessable from
digit widths and looks broken in tables). The dot string is fixed-width-ish
so table columns don't jump.

### Charts under privacy

When `isPrivate`:
- Numeric **axis tick labels** are suppressed (rendered as empty string).
- **Tooltips** that show amounts render `••••` instead of the value.
- Bars/lines/pie slices still draw (shape conveys distribution, not magnitude).
- The `<Amount>` component is not used inside SVG; charts get a
  `usePrivacy()` read and conditionally blank their formatters.

### Toggle affordances

- **Web:** an eye / eye-off icon button in the app header (in `Layout.jsx`,
  next to the theme/profile controls). Plus the Settings switch (default).
  No keyboard shortcut in v1.
- **Mobile:** an eye / eye-off icon in each main screen's header
  (`DashboardScreen`, `AnalyticsScreen`, `DebtScreen`). Plus a Profile
  switch for the default.

### Exhaustive amount-render sites (web)

Derived by `grep -rn "formatCurrency(" client/src`. The 3B plan replaces each
with `<Amount>` (or, inside charts, a privacy-aware formatter):

- `client/src/pages/Dashboard.jsx` — stat cards, recent-transaction amounts
- `client/src/pages/Expenses.jsx` — summary totals, list rows, calendar day totals
- `client/src/components/MobileExpenseCard.jsx` — card amount
- `client/src/components/AnalyticsDashboard.jsx` — stat cards, chart axes/tooltips, "top categories", insights
- `client/src/components/DebtList.jsx` — per-debt amounts
- `client/src/components/DebtStats.jsx` — payable/receivable totals
- `client/src/components/RepaymentModal.jsx` — remaining / repayment amounts
- `client/src/pages/Budgets.jsx` + `client/src/components/BudgetList.jsx` — budget amounts *(only if the Budgets feature is merged to this branch; otherwise skip and note)*

### Exhaustive amount-render sites (mobile)

Derived by `grep -rn "Intl.NumberFormat\|formatAmount\|formatCurrency\|₹" mobile-app/src`:

- `mobile-app/src/components/BalanceCard.js`
- `mobile-app/src/components/SummaryCard.js`
- `mobile-app/src/components/TransactionItem.js`
- `mobile-app/src/components/InsightCard.js` (where it shows amounts)
- `mobile-app/src/screens/DashboardScreen.js`
- `mobile-app/src/screens/AnalyticsScreen.js` (+ the `charts/` components)
- `mobile-app/src/screens/DebtScreen.js`
- `mobile-app/src/screens/BudgetSettingsScreen.js`
- `mobile-app/src/screens/AddExpenseScreen.js` — the hero amount input is
  NOT masked (you're actively typing it); the "remaining" style meta lines
  are.

## API surface

### Changed

- `User` schema: `privacyModeDefault: { type: Boolean, default: false }`.
- `PUT /api/auth/profile`: accept optional `privacyModeDefault` (boolean) in
  the body; `if (typeof privacyModeDefault === 'boolean') updates.privacyModeDefault = privacyModeDefault`.
- `user.toJSON()` already returns all non-sensitive fields, so
  `privacyModeDefault` flows into every user payload automatically once it's
  on the schema. Verify (`login`, `register`, `getProfile`, `updateProfile`
  all call `user.toJSON()`).
- No Zod change strictly required (`updateProfile` reads `req.body` directly,
  not via a schema). If a profile Zod schema is later added, include the field.

### Not changed

No new route. No migration (absent field reads as `false` via the schema
default on the next save; existing users get `false` implicitly on read
because Mongoose applies defaults on hydration).

## Web components

| File | Responsibility |
|---|---|
| `client/src/context/PrivacyContext.jsx` (new) | `{ isPrivate, setPrivate(bool), toggle }`; init from `localStorage` → `user.privacyModeDefault` → `false`; persist to `localStorage` on change; `usePrivacy()` hook |
| `client/src/components/Amount.jsx` (new) | `{ value, currency, className, sign }` → `formatCurrency` when visible, `••••••` when private; used everywhere a bare amount renders outside SVG |
| `client/src/App.jsx` (modify) | mount `<PrivacyProvider>` inside `<AuthProvider>` (needs `user`), outside the pages |
| `client/src/components/Layout.jsx` (modify) | header eye/eye-off toggle button |
| `client/src/pages/Profile.jsx` (modify) | "Hide amounts by default" switch → `updateProfile({ privacyModeDefault })` + `setPrivate` |
| the 7–9 render-site files (modify) | swap `formatCurrency(...)` for `<Amount value={...} currency={currency} />`; charts get a `usePrivacy()` read + blanking formatters |

## Mobile components

| File | Responsibility |
|---|---|
| `mobile-app/src/context/PrivacyContext.js` (new) | same contract, persisted to `AsyncStorage` (`'privacyMode'`); init from storage → `user.privacyModeDefault` → `false` |
| `mobile-app/src/components/Amount.js` (new) | RN `<Text>`-based; `••••••` when private else the formatted amount; accepts `style`, `sign`, `currency` |
| app root (modify) | wrap with `<PrivacyProvider>` (below `AuthProvider`) |
| main screen headers (modify) | eye/eye-off icon toggling `usePrivacy().toggle()` |
| `mobile-app/src/screens/ProfileScreen.js` (modify) | default switch → `authService.updateProfile` + `setPrivate` |
| the render-site files (modify) | swap amount `<Text>` for `<Amount>`; charts blank their value formatters when private |

## Error handling

- `updateProfile({ privacyModeDefault })` failure → the Settings switch
  reverts its optimistic state and shows a toast; the local session toggle
  still works.
- `localStorage` / `AsyncStorage` read throwing → treat as "no stored
  value", fall back to the user default. Wrap reads in try/catch.
- `<Amount>` with `value` `undefined`/`null`/`NaN` → renders `—` (visible) or
  `••••••` (private), never `$NaN`.

## Testing

- **API (3A):** extend the `node:test` suite. Cover: schema default `false`;
  `updateProfile` sets `privacyModeDefault: true`; `updateProfile` ignores a
  non-boolean; `getProfile` returns the field.
- **Web (3B):** `npx vite build` passes. Manual: toggle in header hides all
  amounts everywhere listed; Settings switch persists across logout/login;
  charts blank axis numbers + tooltip values but still draw; `<Amount>` with
  a bad value renders `—`/`••••••`; dark mode. **Grep gate:** after the
  sweep, `grep -rn "formatCurrency(" client/src` returns only the `Amount.jsx`
  definition and any legitimate non-display use (there should be none in
  pages/components).
- **Mobile (3C):** manual device: header toggle on each screen; kill +
  relaunch app → privacy state persists (from `AsyncStorage`); Profile
  default switch; charts; amount inputs on Add Expense are NOT masked.

## Rollout / dependency notes

- 3A merges first. 3B and 3C both read `user.privacyModeDefault` but degrade
  gracefully to `false` if 3A is not yet merged (so they *can* be built
  first, they just won't sync the default).
- Do this feature AFTER Features 1 & 2 so the `<Amount>` sweep also covers the
  payment-mode badge context and any heatmap tooltip amounts in one pass
  (per the roadmap ordering).
- 3B and 3C are independent of each other.
