# Accounts + Transfers — Phase 4B (Web) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web UI for accounts and transfers: an Accounts page (list with computed balances, add/edit/archive, per-account statement, reconcile), an account picker on the expense form, a Transfers tab with a transfer form, an account filter on Analytics, a Dashboard total-balance + per-account cards, and a nav entry.

**Architecture:** `accountService` + `transferService` HTTP wrappers. `AccountContext` holds `accounts`, `defaultAccountId`, `totalBalance` and CRUD/reconcile actions. New pages/components use the existing `form/` kit and `<Amount>` (from Feature 3; if 3B is not merged, `<Amount>` degrades to plain `formatCurrency` — the plan notes a fallback). `Expenses.jsx` gains `formData.account` + an `<AccountPicker>` + a "Transfers" tab.

**Tech Stack:** React 18, Vite 4, Tailwind 3, `react-router-dom`, `lucide-react`, Recharts. No test runner — `npx vite build` + manual checklist.

**Spec:** `docs/superpowers/specs/2026-09-10-accounts-transfers-design.md`

**Depends on:** Phase 4A merged. **Re-read against current code before executing** — F1/F2/F3 web phases touched `Expenses.jsx`, `App.jsx`, `Layout.jsx`, `AnalyticsDashboard.jsx`, `Dashboard.jsx`.

## Global Constraints

- Balances render via `<Amount>` (Feature 3). If `client/src/components/Amount.jsx` does not exist yet (3B not merged), create a thin shim: `export default ({ value, currency }) => <span>{formatCurrency(value, currency)}</span>` and note it — 3B will replace it. Do NOT block on 3B.
- Account `type` values/labels: `cash`→Cash, `bank`→Bank, `card`→Card, `savings`→Savings, `other`→Other. Icons (`lucide-react`): `Banknote`, `Landmark`, `CreditCard`, `PiggyBank`, `Wallet`.
- Account picker shows only non-archived accounts. Default selection = `defaultAccountId` on a fresh add; the record's `account` on edit.
- Transfer form: `from` and `to` are separate pickers; submit disabled while `from === to` or either empty or amount ≤ 0; server also 400s on currency mismatch → show that message.
- Nav entry label "Accounts", icon `Landmark` (Debts uses `Wallet`, Budgets uses `PiggyBank` — keep distinct).
- Delete account → on 403 show the server message + an "Archive instead" button that calls the archive action.
- No new npm dependency.
- After each task: `cd client && npx vite build` succeeds.
- Commit after each task with the message in its final step.

## File Structure

**Created**
- `client/src/services/accountService.js`, `client/src/services/transferService.js`
- `client/src/constants/accountTypes.js`
- `client/src/context/AccountContext.jsx`
- `client/src/components/AccountPicker.jsx`
- `client/src/components/AccountForm.jsx`
- `client/src/components/TransferForm.jsx`
- `client/src/components/AccountStatement.jsx`
- `client/src/pages/Accounts.jsx`

**Modified**
- `client/src/App.jsx` — `<AccountProvider>` + `/app/accounts` route
- `client/src/components/Layout.jsx` — nav entry
- `client/src/pages/Expenses.jsx` — `formData.account`, `<AccountPicker>`, account badge, "Transfers" tab
- `client/src/pages/Dashboard.jsx` — total balance + per-account cards
- `client/src/pages/Analytics.jsx` + `client/src/components/AnalyticsDashboard.jsx` — optional account filter

---

## Task 1: Services + constants

**Files:**
- Create: `client/src/services/accountService.js`, `client/src/services/transferService.js`, `client/src/constants/accountTypes.js`

**Interfaces:**
- Produces:
  - `accountService`: `list(includeArchived?)`, `create(body)`, `update(id, body)`, `remove(id)`, `reconcile(id, targetBalance)`, `statement(id, { from, to })`.
  - `transferService`: `list({ from, to })`, `create(body)`, `update(id, body)`, `remove(id)`.
  - `accountTypes.js`: `ACCOUNT_TYPES` `[{ value, label, Icon }]`, `getAccountType(value)`.

- [ ] **Step 1: `accountService.js`**

```js
// client/src/services/accountService.js
import api from './api'

export const accountService = {
  list: (includeArchived = false) =>
    api.get(`/accounts${includeArchived ? '?includeArchived=true' : ''}`),
  create: (body) => api.post('/accounts', body),
  update: (id, body) => api.put(`/accounts/${id}`, body),
  remove: (id) => api.delete(`/accounts/${id}`),
  reconcile: (id, targetBalance) => api.post(`/accounts/${id}/reconcile`, { targetBalance }),
  statement: (id, { from, to } = {}) => {
    const p = new URLSearchParams()
    if (from) p.append('from', from)
    if (to) p.append('to', to)
    const qs = p.toString()
    return api.get(`/accounts/${id}/statement${qs ? `?${qs}` : ''}`)
  },
}
```

- [ ] **Step 2: `transferService.js`**

```js
// client/src/services/transferService.js
import api from './api'

export const transferService = {
  list: ({ from, to } = {}) => {
    const p = new URLSearchParams()
    if (from) p.append('from', from)
    if (to) p.append('to', to)
    const qs = p.toString()
    return api.get(`/transfers${qs ? `?${qs}` : ''}`)
  },
  create: (body) => api.post('/transfers', body),
  update: (id, body) => api.put(`/transfers/${id}`, body),
  remove: (id) => api.delete(`/transfers/${id}`),
}
```

- [ ] **Step 3: `accountTypes.js`**

```jsx
// client/src/constants/accountTypes.js
import { Banknote, Landmark, CreditCard, PiggyBank, Wallet } from 'lucide-react'

export const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', Icon: Banknote },
  { value: 'bank', label: 'Bank', Icon: Landmark },
  { value: 'card', label: 'Card', Icon: CreditCard },
  { value: 'savings', label: 'Savings', Icon: PiggyBank },
  { value: 'other', label: 'Other', Icon: Wallet },
]

export function getAccountType(value) {
  return ACCOUNT_TYPES.find((t) => t.value === value) || ACCOUNT_TYPES.find((t) => t.value === 'other')
}
```

- [ ] **Step 4: Build**

Run: `cd client && npx vite build` — expect success.

- [ ] **Step 5: Commit**

```bash
git add client/src/services/accountService.js client/src/services/transferService.js client/src/constants/accountTypes.js
git commit -m "Add account + transfer services and accountTypes constant (web)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `AccountContext`

**Files:**
- Create: `client/src/context/AccountContext.jsx`

**Interfaces:**
- Consumes: `accountService`; `useAuth` (to gate loading on `user`).
- Produces: `AccountProvider`, `useAccounts()` → `{ accounts, archivedAccounts, defaultAccountId, totalBalance, loading, loadAccounts, createAccount, updateAccount, deleteAccount, reconcile }`. `accounts` excludes archived; `archivedAccounts` is loaded lazily when `loadAccounts(true)` is called.

- [ ] **Step 1: Create the context**

```jsx
// client/src/context/AccountContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { accountService } from '../services/accountService'
import { useAuth } from './AuthContext'

const AccountContext = createContext(null)

export function AccountProvider({ children }) {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadAccounts = useCallback(async (includeArchived = false) => {
    setLoading(true)
    try {
      const res = await accountService.list(includeArchived)
      const list = res.data?.data?.accounts || []
      setAccounts(list)
      setTotalBalance(res.data?.data?.totalBalance ?? 0)
      return list
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) loadAccounts(false)
  }, [user, loadAccounts])

  const createAccount = useCallback(async (body) => {
    const res = await accountService.create(body)
    await loadAccounts(false)
    return res.data?.data?.account
  }, [loadAccounts])

  const updateAccount = useCallback(async (id, body) => {
    const res = await accountService.update(id, body)
    await loadAccounts(false)
    return res.data?.data?.account
  }, [loadAccounts])

  const deleteAccount = useCallback(async (id) => {
    await accountService.remove(id)
    await loadAccounts(false)
  }, [loadAccounts])

  const reconcile = useCallback(async (id, targetBalance) => {
    const res = await accountService.reconcile(id, targetBalance)
    await loadAccounts(false)
    return res.data?.data
  }, [loadAccounts])

  const visible = accounts.filter((a) => !a.archived)
  const archivedAccounts = accounts.filter((a) => a.archived)
  const defaultAccountId = visible.find((a) => a.isDefault)?._id || visible[0]?._id || null

  return (
    <AccountContext.Provider
      value={{
        accounts: visible,
        archivedAccounts,
        defaultAccountId,
        totalBalance,
        loading,
        loadAccounts,
        createAccount,
        updateAccount,
        deleteAccount,
        reconcile,
      }}
    >
      {children}
    </AccountContext.Provider>
  )
}

export function useAccounts() {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('useAccounts must be used within AccountProvider')
  return ctx
}
```

- [ ] **Step 2: Build** — `cd client && npx vite build` — success.

- [ ] **Step 3: Commit**

```bash
git add client/src/context/AccountContext.jsx
git commit -m "Add AccountContext (list, CRUD, reconcile, default resolution)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Mount provider + route + nav

**Files:**
- Modify: `client/src/App.jsx`, `client/src/components/Layout.jsx`

**Interfaces:**
- Produces: `<AccountProvider>` wraps the routed app (inside `<AuthProvider>`); `/app/accounts` route → `Accounts` page (lazy or direct import — match how sibling pages are imported); nav item "Accounts".

- [ ] **Step 1: `App.jsx`**

Add `import { AccountProvider } from './context/AccountContext'` and `import Accounts from './pages/Accounts'` (mirror the other page imports).

Wrap the provider tree (place `<AccountProvider>` alongside `<ExpenseProvider>`/`<DebtProvider>`):

```jsx
        <PrivacyProvider>{/* if present from F3, else omit */}
          <ExpenseProvider>
            <DebtProvider>
              <AccountProvider>
                <AppRoutes />
              </AccountProvider>
            </DebtProvider>
          </ExpenseProvider>
        </PrivacyProvider>
```

Add the route inside the `/app` `<Route>` group, next to `expenses`/`debts`:

```jsx
        <Route path="accounts" element={<Accounts />} />
```

- [ ] **Step 2: `Layout.jsx` nav**

Add `Landmark` to the `lucide-react` import. In the `navItems` array, after the Debts entry:

```jsx
    { name: 'Accounts', href: '/app/accounts', icon: Landmark },
```

- [ ] **Step 3: Build + check**

Run: `cd client && npx vite build` — success.
`npm run dev` → "Accounts" appears in the sidebar; clicking it routes to `/app/accounts` (blank page until Task 6 — acceptable, or a minimal placeholder).

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx client/src/components/Layout.jsx
git commit -m "Mount AccountProvider, add /app/accounts route + nav entry

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: `AccountPicker` + `AccountForm`

**Files:**
- Create: `client/src/components/AccountPicker.jsx`, `client/src/components/AccountForm.jsx`

**Interfaces:**
- `AccountPicker`: `{ value, onChange, accounts, allowAll }` — a chip row; each chip = type icon + name; selected chip tinted indigo; when `allowAll`, a leading "All" chip with `value === ''`.
- `AccountForm`: `{ isOpen, onClose, editAccount }` — form-kit `Modal` with name input, `type` chips (from `ACCOUNT_TYPES`), opening-balance via a plain number field (not `AmountHero` — opening balance can be negative; use a `<FieldCard>` + `<input type="number">`), currency `<select>` (reuse the 8-currency list). Calls `useAccounts().createAccount` / `updateAccount`.

- [ ] **Step 1: `AccountPicker.jsx`**

```jsx
// client/src/components/AccountPicker.jsx
import { getAccountType } from '../constants/accountTypes'

export default function AccountPicker({ value, onChange, accounts = [], allowAll = false }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {allowAll && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={`px-3.5 py-2 rounded-full border-[1.5px] text-sm font-medium min-h-[40px] whitespace-nowrap ${
            value === ''
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-400'
              : 'border-gray-300 dark:border-white/[0.15] text-gray-700 dark:text-slate-300'
          }`}
        >
          All
        </button>
      )}
      {accounts.map((a) => {
        const selected = a._id === value
        const { Icon } = getAccountType(a.type)
        return (
          <button
            key={a._id}
            type="button"
            onClick={() => onChange(a._id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border-[1.5px] text-sm font-medium min-h-[40px] whitespace-nowrap ${
              selected
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-400'
                : 'border-gray-300 dark:border-white/[0.15] text-gray-700 dark:text-slate-300'
            }`}
          >
            <Icon size={15} />
            {a.name}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: `AccountForm.jsx`**

```jsx
// client/src/components/AccountForm.jsx
import { useState, useEffect } from 'react'
import Modal from './Modal'
import SectionLabel from './form/SectionLabel'
import FieldCard from './form/FieldCard'
import StickyFormFooter from './form/StickyFormFooter'
import { ACCOUNT_TYPES } from '../constants/accountTypes'
import { useAccounts } from '../context/AccountContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const CURRENCIES = ['USD', 'EUR', 'INR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD']

export default function AccountForm({ isOpen, onClose, editAccount = null }) {
  const { createAccount, updateAccount } = useAccounts()
  const { currency: userCurrency } = useAuth()
  const [form, setForm] = useState({ name: '', type: 'cash', openingBalance: '0', currency: userCurrency || 'USD' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editAccount) {
      setForm({
        name: editAccount.name || '',
        type: editAccount.type || 'cash',
        openingBalance: String(editAccount.openingBalance ?? 0),
        currency: editAccount.currency || userCurrency || 'USD',
      })
    } else {
      setForm({ name: '', type: 'cash', openingBalance: '0', currency: userCurrency || 'USD' })
    }
  }, [editAccount, userCurrency, isOpen])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Account name is required')
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        type: form.type,
        openingBalance: Number(form.openingBalance) || 0,
        currency: form.currency,
      }
      if (editAccount) await updateAccount(editAccount._id, body)
      else await createAccount(body)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save account')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editAccount ? 'Edit Account' : 'Add Account'} maxWidth="max-w-md">
      <form onSubmit={submit} className="flex flex-col max-h-[80vh]">
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <SectionLabel>Name</SectionLabel>
            <FieldCard className="p-4">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
                placeholder="e.g. HDFC Savings"
                maxLength={40}
              />
            </FieldCard>
          </div>

          <div>
            <SectionLabel>Type</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_TYPES.map(({ value, label, Icon }) => {
                const active = form.type === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, type: value })}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-full border-[1.5px] text-sm font-medium min-h-[40px] ${
                      active
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
          </div>

          <div>
            <SectionLabel>Opening balance</SectionLabel>
            <FieldCard className="p-4">
              <input
                type="number"
                step="0.01"
                value={form.openingBalance}
                onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                className="w-full bg-transparent border-0 outline-none text-gray-900 dark:text-white"
                placeholder="0"
              />
            </FieldCard>
          </div>

          <div>
            <SectionLabel>Currency</SectionLabel>
            <FieldCard className="p-4">
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-transparent border-0 outline-none text-gray-900 dark:text-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FieldCard>
          </div>
        </div>

        <StickyFormFooter
          variant="neutral"
          loading={saving}
          label={editAccount ? 'Update Account' : 'Add Account'}
          loadingLabel={editAccount ? 'Updating…' : 'Adding…'}
          onCancel={onClose}
        />
      </form>
    </Modal>
  )
}
```

- [ ] **Step 3: Build** — success.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/AccountPicker.jsx client/src/components/AccountForm.jsx
git commit -m "Add AccountPicker chip row and AccountForm modal

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: `TransferForm` + `AccountStatement`

**Files:**
- Create: `client/src/components/TransferForm.jsx`, `client/src/components/AccountStatement.jsx`

**Interfaces:**
- `TransferForm`: `{ isOpen, onClose, onCreated }` — form-kit `Modal`; two `AccountPicker`s (From / To) from `useAccounts().accounts`; amount `<input>`; date via `DatePicker`; note; submit disabled while `from === to || !from || !to || amount <= 0`; on 400 currency-mismatch show the server message; calls `transferService.create` then `onCreated()`.
- `AccountStatement`: `{ accountId, currency }` — fetches `accountService.statement(accountId)`, renders the merged entry list with `<Amount>` and a kind badge; loading + empty states.

- [ ] **Step 1: `TransferForm.jsx`**

```jsx
// client/src/components/TransferForm.jsx
import { useState, useEffect } from 'react'
import Modal from './Modal'
import SectionLabel from './form/SectionLabel'
import FieldCard from './form/FieldCard'
import StickyFormFooter from './form/StickyFormFooter'
import DatePicker from './DatePicker'
import AccountPicker from './AccountPicker'
import { useAccounts } from '../context/AccountContext'
import { transferService } from '../services/transferService'
import { getTodayDate } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function TransferForm({ isOpen, onClose, onCreated }) {
  const { accounts, defaultAccountId } = useAccounts()
  const [form, setForm] = useState({ fromAccount: '', toAccount: '', amount: '', date: getTodayDate(), note: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm({
        fromAccount: defaultAccountId || '',
        toAccount: '',
        amount: '',
        date: getTodayDate(),
        note: '',
      })
    }
  }, [isOpen, defaultAccountId])

  const invalid =
    !form.fromAccount ||
    !form.toAccount ||
    form.fromAccount === form.toAccount ||
    !(parseFloat(form.amount) > 0)

  const submit = async (e) => {
    e.preventDefault()
    if (invalid) return
    setSaving(true)
    try {
      await transferService.create({
        fromAccount: form.fromAccount,
        toAccount: form.toAccount,
        amount: parseFloat(form.amount),
        date: form.date,
        note: form.note.trim() || undefined,
      })
      onCreated?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create transfer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Transfer" maxWidth="max-w-md">
      <form onSubmit={submit} className="flex flex-col max-h-[80vh]">
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <SectionLabel>From</SectionLabel>
            <AccountPicker value={form.fromAccount} onChange={(v) => setForm({ ...form, fromAccount: v })} accounts={accounts} />
          </div>
          <div>
            <SectionLabel>To</SectionLabel>
            <AccountPicker value={form.toAccount} onChange={(v) => setForm({ ...form, toAccount: v })} accounts={accounts} />
          </div>
          {form.fromAccount && form.toAccount && form.fromAccount === form.toAccount && (
            <p className="text-xs text-rose-600 dark:text-rose-400">Choose two different accounts.</p>
          )}
          <div>
            <SectionLabel>Amount</SectionLabel>
            <FieldCard className="p-4">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-transparent border-0 outline-none text-gray-900 dark:text-white"
                placeholder="0"
              />
            </FieldCard>
          </div>
          <div className="relative" style={{ zIndex: 1000 }}>
            <SectionLabel>Date</SectionLabel>
            <DatePicker value={form.date} onChange={(d) => setForm({ ...form, date: d })} placeholder="Select date" />
          </div>
          <div>
            <SectionLabel>Note (optional)</SectionLabel>
            <FieldCard className="p-4">
              <input
                type="text"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
                placeholder="e.g. moved rent money"
                maxLength={300}
              />
            </FieldCard>
          </div>
        </div>

        <StickyFormFooter
          variant="neutral"
          loading={saving}
          label="Create Transfer"
          loadingLabel="Creating…"
          onCancel={onClose}
        />
      </form>
    </Modal>
  )
}
```

(If `<StickyFormFooter>` cannot disable its submit from a prop, gate submission in `submit` — the `invalid` guard already returns early; also add `disabled={invalid || saving}` if the footer forwards it. Match the footer's actual API from Feature "mobile-style forms".)

- [ ] **Step 2: `AccountStatement.jsx`**

```jsx
// client/src/components/AccountStatement.jsx
import { useEffect, useState } from 'react'
import { accountService } from '../services/accountService'
import Amount from './Amount'
import { format, parseISO } from 'date-fns'

const KIND_META = {
  expense: { label: 'Expense', cls: 'text-rose-600 dark:text-rose-400', sign: '-' },
  income: { label: 'Income', cls: 'text-emerald-600 dark:text-emerald-400', sign: '+' },
  'transfer-out': { label: 'Transfer out', cls: 'text-amber-600 dark:text-amber-400', sign: '-' },
  'transfer-in': { label: 'Transfer in', cls: 'text-indigo-600 dark:text-indigo-400', sign: '+' },
}

export default function AccountStatement({ accountId, currency }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    accountService
      .statement(accountId)
      .then((res) => { if (!cancelled) setEntries(res.data?.data?.entries || []) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [accountId])

  if (loading) return <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.05]" />
  if (error) return <p className="text-sm text-gray-500 dark:text-slate-500 py-4">Couldn't load statement.</p>
  if (entries.length === 0) return <p className="text-sm text-gray-400 dark:text-slate-600 py-4">No activity in this account.</p>

  return (
    <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
      {entries.map((e) => {
        const m = KIND_META[e.kind] || KIND_META.expense
        return (
          <div key={e._id} className="flex items-center justify-between py-2.5">
            <div className="min-w-0">
              <p className="text-sm text-gray-900 dark:text-white truncate">
                {e.description || e.counterparty || m.label}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-600">
                {format(parseISO(e.date), 'MMM d, yyyy')} · {m.label}
                {e.note ? ` · ${e.note}` : ''}
              </p>
            </div>
            <Amount value={e.amount} currency={currency} sign={m.sign} className={`text-sm font-semibold ${m.cls}`} />
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Build** — success.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/TransferForm.jsx client/src/components/AccountStatement.jsx
git commit -m "Add TransferForm and AccountStatement components

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: `Accounts` page

**Files:**
- Create: `client/src/pages/Accounts.jsx`

**Interfaces:**
- Consumes: `useAccounts`, `useAuth` (`currency`), `AccountForm`, `AccountStatement`, `Amount`, `accountService` (for reconcile prompt), `getAccountType`.
- Produces: the page — header + "Add Account" button; a list of account cards (name, type icon, `<Amount>` balance, default badge); per-card actions: Edit, Statement (expands `AccountStatement`), Reconcile (prompt for target → `reconcile`), Archive/Unarchive, Delete (with 403 → archive-offer); a "Show archived" toggle.

- [ ] **Step 1: Create the page**

```jsx
// client/src/pages/Accounts.jsx
import { useState } from 'react'
import { Plus, Pencil, FileText, Scale, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { useAccounts } from '../context/AccountContext'
import { useAuth } from '../context/AuthContext'
import { getAccountType } from '../constants/accountTypes'
import AccountForm from '../components/AccountForm'
import AccountStatement from '../components/AccountStatement'
import Amount from '../components/Amount'
import toast from 'react-hot-toast'

export default function Accounts() {
  const { accounts, archivedAccounts, totalBalance, loading, loadAccounts, updateAccount, deleteAccount, reconcile } = useAccounts()
  const { currency } = useAuth()
  const [formOpen, setFormOpen] = useState(false)
  const [editAccount, setEditAccount] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [openStatement, setOpenStatement] = useState(null) // accountId

  const toggleArchived = async () => {
    const next = !showArchived
    setShowArchived(next)
    await loadAccounts(next)
  }

  const onReconcile = async (acc) => {
    const raw = window.prompt(`Actual balance of "${acc.name}"?`, String(acc.balance ?? 0))
    if (raw === null) return
    const target = Number(raw)
    if (Number.isNaN(target)) return toast.error('Enter a number')
    try {
      const r = await reconcile(acc._id, target)
      toast.success(r.adjusted ? `Adjusted by ${r.delta}` : 'Already balanced')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Reconcile failed')
    }
  }

  const onArchiveToggle = async (acc) => {
    try {
      await updateAccount(acc._id, { archived: !acc.archived })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not change archive state')
    }
  }

  const onDelete = async (acc) => {
    if (!window.confirm(`Delete "${acc.name}"? This cannot be undone.`)) return
    try {
      await deleteAccount(acc._id)
      toast.success('Account deleted')
    } catch (e) {
      const msg = e.response?.data?.message || 'Delete failed'
      if (e.response?.status === 403) {
        if (window.confirm(`${msg}\n\nArchive it instead?`)) {
          await onArchiveToggle({ ...acc, archived: false })
        }
      } else {
        toast.error(msg)
      }
    }
  }

  const list = showArchived ? [...accounts, ...archivedAccounts] : accounts

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts</h1>
          <p className="text-sm text-gray-600 dark:text-slate-500">
            Total balance: <Amount value={totalBalance} currency={currency} className="font-semibold" />
          </p>
        </div>
        <button onClick={() => { setEditAccount(null); setFormOpen(true) }} className="btn-primary btn-md">
          <Plus size={16} /> Add Account
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
        <input type="checkbox" checked={showArchived} onChange={toggleArchived} className="rounded" />
        Show archived
      </label>

      {loading && list.length === 0 ? (
        <div className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.05]" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((acc) => {
            const { Icon } = getAccountType(acc.type)
            return (
              <div key={acc._id} className={`glass-card p-4 ${acc.archived ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {acc.name}
                        {acc.isDefault && <span className="ml-2 text-[10px] uppercase tracking-wide text-indigo-500">default</span>}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-600 capitalize">{acc.type} · {acc.currency}</p>
                    </div>
                  </div>
                  <Amount value={acc.balance} currency={acc.currency || currency} className="text-lg font-bold text-gray-900 dark:text-white" />
                </div>

                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.05]">
                  <button onClick={() => { setEditAccount(acc); setFormOpen(true) }} className="text-xs inline-flex items-center gap-1 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={() => setOpenStatement(openStatement === acc._id ? null : acc._id)} className="text-xs inline-flex items-center gap-1 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
                    <FileText size={13} /> Statement
                  </button>
                  <button onClick={() => onReconcile(acc)} className="text-xs inline-flex items-center gap-1 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
                    <Scale size={13} /> Reconcile
                  </button>
                  {!acc.isDefault && (
                    <button onClick={() => onArchiveToggle(acc)} className="text-xs inline-flex items-center gap-1 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
                      {acc.archived ? <><ArchiveRestore size={13} /> Unarchive</> : <><Archive size={13} /> Archive</>}
                    </button>
                  )}
                  {!acc.isDefault && (
                    <button onClick={() => onDelete(acc)} className="text-xs inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700">
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>

                {openStatement === acc._id && (
                  <div className="mt-3">
                    <AccountStatement accountId={acc._id} currency={acc.currency || currency} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <AccountForm isOpen={formOpen} onClose={() => setFormOpen(false)} editAccount={editAccount} />
    </div>
  )
}
```

- [ ] **Step 2: Build + check**

Run: `cd client && npx vite build` — success.
`npm run dev` → `/app/accounts`:
- The default "Cash" account shows with its balance. Add a "Bank" account → appears.
- Add an expense against Bank (Task 7 wires the picker; for now use the API or Task 7 order) → Bank balance drops.
- Statement expands; Reconcile prompts and adjusts; Archive hides on reload with "Show archived" off; Delete on an account with history → 403 → "Archive instead?" prompt.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Accounts.jsx
git commit -m "Add Accounts page (balances, statement, reconcile, archive, delete)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Expense form account picker + account badge + Transfers tab

**Files:**
- Modify: `client/src/pages/Expenses.jsx`

**Interfaces:**
- Consumes: `useAccounts`, `AccountPicker`, `TransferForm`, `transferService`, `getAccountType`.
- Produces:
  - `formData.account` in init/edit-prefill/`resetForm`; `<AccountPicker>` in the add/edit `Modal` (after the payment-mode / category block); `account` in the `expenseData` payload.
  - A small account badge on list rows / `MobileExpenseCard` (name only, from `expense.account` populated or looked up in `accounts`).
  - A "Transfers" view: either a new tab alongside the list/calendar view toggle, or a separate section. It lists transfers (`transferService.list`) and has a "New transfer" button opening `<TransferForm>`; on create, refetch the list and `loadAccounts()`.

- [ ] **Step 1: Imports + context**

```jsx
import { useAccounts } from '../context/AccountContext'
import AccountPicker from '../components/AccountPicker'
import TransferForm from '../components/TransferForm'
import { transferService } from '../services/transferService'
```

In the component: `const { accounts, defaultAccountId, loadAccounts } = useAccounts()`.

- [ ] **Step 2: `formData.account`**

Add `account: defaultAccountId || ''` to the initial `formData` (note: `defaultAccountId` may be null on first render — that's fine, the server fills the default; but prefer seeding it once it's available via a `useEffect` that sets `formData.account` when `!formData.account && defaultAccountId`). Add `account: editingExpense.account?._id || editingExpense.account || ''` to the edit-prefill. Add `account: defaultAccountId || ''` to `resetForm`.

- [ ] **Step 3: Payload**

In `handleSubmit`'s `expenseData`, add `account: formData.account || undefined`.

- [ ] **Step 4: Render the picker**

In the add/edit `Modal` scrollable content, after the Category (and payment-mode, if F1 merged) block:

```jsx
            <div>
              <SectionLabel>Account</SectionLabel>
              <AccountPicker
                value={formData.account}
                onChange={(id) => setFormData({ ...formData, account: id })}
                accounts={accounts}
              />
            </div>
```

- [ ] **Step 5: Account badge on rows**

In `MobileExpenseCard` (import it there or pass the resolved account name as a prop) OR in the desktop DataTable column: show the account name. Simplest: in `Expenses.jsx` where each row/card is rendered, look up `accounts.find(a => a._id === (expense.account?._id || expense.account))?.name` and render a tiny muted badge. If `expense.account` comes back populated from the API (it may not — 4A didn't add `.populate('account')`), fall back to the `accounts` lookup. Add `.populate('account', 'name')` consideration is a 4A change — out of scope here; use the client lookup.

- [ ] **Step 6: Transfers view**

Add state: `const [showTransfers, setShowTransfers] = useState(false)`, `const [transfers, setTransfers] = useState([])`, `const [transferFormOpen, setTransferFormOpen] = useState(false)`.

Add a toggle in the view-mode control area (next to list/calendar): a "Transfers" button that sets `showTransfers`. When `showTransfers`, render a panel instead of the expense list:

```jsx
{showTransfers ? (
  <div className="glass-card p-4 md:p-6 space-y-3">
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Transfers</h2>
      <button onClick={() => setTransferFormOpen(true)} className="btn-primary btn-sm">New transfer</button>
    </div>
    {transfers.length === 0 ? (
      <p className="text-sm text-gray-400 dark:text-slate-600 py-4">No transfers yet.</p>
    ) : (
      <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {transfers.map((t) => (
          <div key={t._id} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-gray-900 dark:text-white">
              {t.fromAccount?.name} → {t.toAccount?.name}
              {t.note ? <span className="text-gray-400 dark:text-slate-600"> · {t.note}</span> : null}
            </span>
            <span className="text-gray-500 dark:text-slate-400">
              {t.date} · <Amount value={t.amount} currency={currency} />
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
) : (
  /* existing expense list / calendar view */
)}
```

Load transfers when the panel opens:

```jsx
useEffect(() => {
  if (showTransfers) {
    transferService.list().then((res) => setTransfers(res.data?.data?.transfers || [])).catch(() => setTransfers([]))
  }
}, [showTransfers])
```

Render the form:

```jsx
<TransferForm
  isOpen={transferFormOpen}
  onClose={() => setTransferFormOpen(false)}
  onCreated={() => {
    transferService.list().then((res) => setTransfers(res.data?.data?.transfers || []))
    loadAccounts()
  }}
/>
```

Import `Amount` in `Expenses.jsx` if not already there.

- [ ] **Step 7: Build + check**

Run: `cd client && npx vite build` — success.
`npm run dev` → Expenses:
- Add Expense → the "Account" picker shows accounts, default pre-selected; submit → row shows the account badge.
- Edit → pre-selects the record's account.
- "Transfers" toggle → panel; "New transfer" → form; create a valid transfer → appears in the list and account balances update on the Accounts page.
- Transfer form: pick the same account for From and To → inline warning + submit blocked. Currency-mismatch pair → server message toast.

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/Expenses.jsx
git commit -m "Add account picker to expense form + Transfers tab

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Dashboard total balance + per-account cards

**Files:**
- Modify: `client/src/pages/Dashboard.jsx`

**Interfaces:**
- Consumes: `useAccounts`, `Amount`, `getAccountType`, `useNavigate`.
- Produces: a "Balances" card: the `totalBalance` prominently + a compact list of per-account name/balance rows; clicking a row navigates to `/app/accounts`.

- [ ] **Step 1: Imports + context**

```jsx
import { useAccounts } from '../context/AccountContext'
import Amount from '../components/Amount'
import { getAccountType } from '../constants/accountTypes'
```

In the component: `const { accounts, totalBalance } = useAccounts()`.

- [ ] **Step 2: Render the card**

Place near the top of the dashboard grid (e.g. right after the primary stat cards, before "Activity"):

```jsx
        <div className="glass-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Balances</h2>
            <button onClick={() => navigate('/app/accounts')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Manage
            </button>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            <Amount value={totalBalance} currency={currency} />
          </p>
          <div className="space-y-1.5">
            {accounts.map((a) => {
              const { Icon } = getAccountType(a.type)
              return (
                <button
                  key={a._id}
                  onClick={() => navigate('/app/accounts')}
                  className="w-full flex items-center justify-between py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.04] rounded-lg px-2"
                >
                  <span className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                    <Icon size={14} /> {a.name}
                  </span>
                  <Amount value={a.balance} currency={a.currency || currency} className="text-gray-900 dark:text-white" />
                </button>
              )
            })}
          </div>
        </div>
```

- [ ] **Step 3: Build + check** — Dashboard shows the total + per-account rows; "Manage" and rows route to Accounts.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Dashboard.jsx
git commit -m "Add Balances card (total + per-account) to the Dashboard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Account filter on Analytics

**Files:**
- Modify: `client/src/pages/Analytics.jsx`, `client/src/components/AnalyticsDashboard.jsx`

**Interfaces:**
- Produces: `Analytics.jsx` holds an `accountFilter` state (`''` = all), passes it into the analytics data load (`account: accountFilter || undefined`); `AnalyticsDashboard` renders an `<AccountPicker allowAll>` in its Filters card that reads/writes it.

- [ ] **Step 1: `Analytics.jsx`**

Add `const [accountFilter, setAccountFilter] = useState('')`. Add `accountFilter` to the `filtersChanged` comparison and `lastFiltersRef`. Pass `account: accountFilter || undefined` into the `loadExpenses(...)` / detailed-analytics call. Pass `accountFilter` + `setAccountFilter` down to `<AnalyticsDashboard>`.

- [ ] **Step 2: `AnalyticsDashboard.jsx`**

Add `accountFilter`, `setAccountFilter` to the prop list. Import `AccountPicker` and `useAccounts`. In the Filters `glass-card`, add:

```jsx
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Account</label>
                  <AccountPicker
                    value={accountFilter}
                    onChange={setAccountFilter}
                    accounts={useAccounts().accounts}
                    allowAll
                  />
                </div>
```

(If calling `useAccounts()` inline is awkward, destructure at the top of the component.)

- [ ] **Step 3: Build + check** — Analytics Filters card has an Account chip row; selecting one refetches and scopes all charts/stats to that account; "All" clears it.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Analytics.jsx client/src/components/AnalyticsDashboard.jsx
git commit -m "Add account filter to Analytics

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: Full build + manual regression checklist

**Files:** none (verification task)

- [ ] **Step 1: Build** — `cd client && npx vite build` — succeeds, only pre-existing warnings.

- [ ] **Step 2: Grep** — `cd client && grep -rn "accountService\|transferService\|useAccounts\|AccountPicker\|TransferForm" src/`
Expected: only the files this plan created/modified.

- [ ] **Step 3: End-to-end sweep** (`npm run dev`)
- Fresh login → Accounts page shows the seeded "Cash" default (balance from opening + any income/expense).
- Add "Bank" (opening 1000). Add an expense of 200 on Bank → Bank balance 800, Dashboard total drops 200.
- New transfer Bank→Cash 300 → Bank 500, Cash +300; both reflected on Accounts + Dashboard.
- Reconcile Bank to 600 → an "income" adjustment of 100 appears in Bank's statement; balance now 600.
- Analytics with account filter = Bank → only Bank's expenses in the charts.
- Archive Cash → blocked (it's default). Archive Bank → hidden from pickers; "Show archived" reveals it; unarchive restores.
- Delete an empty new account → succeeds. Delete Bank (has txns) → 403 → "Archive instead?" prompt.
- Expense edit pre-selects the account; changing it moves the expense's contribution between account balances.
- Light + dark on every new surface.

- [ ] **Step 4: Record the sweep in the task report.** Fixes belong in the owning file's task.

---

## Self-Review

**1. Spec coverage**

| Spec item | Task |
|---|---|
| `accountService` / `transferService` | Task 1 |
| `AccountContext` (accounts, default, totalBalance, CRUD, reconcile) | Task 2 |
| Provider + `/app/accounts` route + nav "Accounts" (`Landmark`) | Task 3 |
| `AccountPicker` (non-archived, `allowAll`) | Task 4 |
| `AccountForm` (name, type chips, opening balance, currency) | Task 4 |
| `TransferForm` (from/to pickers, guards, currency-mismatch message) | Task 5 |
| `AccountStatement` (merged entries, kind badges) | Task 5 |
| Accounts page: balances, statement, reconcile, archive, guarded delete + archive-offer | Task 6 |
| Expense form account picker (default pre-select, edit pre-fill) + payload | Task 7 |
| Account badge on rows | Task 7 Step 5 |
| Transfers tab + list + new-transfer | Task 7 Step 6 |
| Dashboard total balance + per-account cards | Task 8 |
| Analytics account filter | Task 9 |
| `<Amount>` for all balances (F3 dependency, shim fallback) | Global Constraints + all render tasks |
| `npx vite build` verification (no runner) | every build step + Task 10 |

**2. Placeholder scan:** No "TBD". Task 7 Step 5 gives a concrete client-lookup approach and explicitly scopes out a 4A `.populate` change. The `<Amount>` shim fallback (Global Constraints) removes the hard dependency on 3B. `TransferForm` notes the footer-disabled-prop uncertainty with a fallback (the early-return guard).

**3. Type consistency:**
- `accountService.list/create/update/remove/reconcile/statement` — Task 1 def; Task 2 (`AccountContext`) + Task 5 (`AccountStatement`) + Task 6 (`Accounts` reconcile prompt) consumers.
- `useAccounts()` → `{ accounts, archivedAccounts, defaultAccountId, totalBalance, loading, loadAccounts, createAccount, updateAccount, deleteAccount, reconcile }` — Task 2 def; Tasks 4, 5, 6, 7, 8, 9 consumers use exactly these.
- `Account` shape from the API `{ _id, name, type, openingBalance, currency, isDefault, archived, balance }` — spec + 4A `listAccounts`; consumed in Tasks 4/6/8 (`.balance`, `.type`, `.isDefault`, `.archived`).
- Transfer shape `{ _id, fromAccount:{name}, toAccount:{name}, amount, date, note }` (populated) — 4A `listTransfers`; Task 7 renders `.fromAccount?.name` etc.
- Statement entry `{ _id, kind, date, amount, description?, counterparty?, note? }` — 4A `accountStatement`; Task 5 `KIND_META[e.kind]`, `e.description || e.counterparty`.
- `reconcile(id, target)` → `{ adjusted, delta, expense? }` — 4A + Task 2 + Task 6 (`r.adjusted`, `r.delta`).
- `<AccountPicker value onChange accounts allowAll />` — Task 4 def; Tasks 5, 7, 9 calls.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-10-accounts-transfers-4b-web.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
**2. Inline Execution** — `superpowers:executing-plans`, batch with checkpoints.

**Which approach?**
