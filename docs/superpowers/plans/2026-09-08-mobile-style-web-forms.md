# Mobile-style Web Client Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the web client's Add/Edit Expense, Debt, and Category forms the mobile app's visual language (gradient amount hero, segmented type toggle, uppercase section labels, field cards, category chips, sticky gradient submit bar), using one design on all screen sizes.

**Architecture:** Build a small set of presentational components under `client/src/components/form/`. Each is controlled (value in, callbacks out) and holds no business logic. Rewrite only the JSX bodies of the three forms to compose these primitives; their existing state, validation, `handleSubmit`, and service calls are untouched. Consolidate all three forms into the existing `Modal` component (which already renders bottom-sheet on mobile / centered on desktop).

**Tech Stack:** React 18, Vite 4, Tailwind CSS 3, `@headlessui/react` (Dialog/Transition via `Modal`), `lucide-react` icons. No new dependencies. No test runner is configured in `client/` — verification is `npx vite build`, `npm run lint`, a dev-only showcase page, and a manual checklist.

**Spec:** `docs/superpowers/specs/2026-09-08-mobile-style-web-forms-design.md`

## Global Constraints

- No new npm dependencies. Use React, Tailwind, `lucide-react`, `@headlessui/react` only.
- One design for all screen sizes — no `isMobile` branching inside the new form primitives.
- Do not change any form's state shape, validation logic, `handleSubmit`, or context/service calls. Presentation layer only.
- Gradient values, verbatim:
  - expense / borrowed: `bg-gradient-to-br from-[#c71852] to-[#ea2261]`
  - income / lent: `bg-gradient-to-br from-[#059669] to-[#10b981]`
  - neutral / primary: `bg-gradient-to-br from-[#4434d4] to-[#6366f1]`
  - Submit bar gradients use `bg-gradient-to-r` (left-to-right) with the same color stops.
- Dark mode must work: every new component uses the existing `dark:` utility pattern seen in sibling components (e.g. `text-gray-900 dark:text-white`, `border-gray-200 dark:border-white/[0.08]`).
- Touch targets: interactive elements keep `min-h-[44px]` where the existing code does.
- Recurring frequency options in the Expense form stay as the web set: `weekly`, `monthly`, `yearly` (NOT the mobile set that adds `daily`).
- After each task: `cd client && npm run lint` must pass with zero warnings, and `npx vite build` must succeed.
- Commit after each task with the message shown in the task's final step.

---

## File Structure

**New — `client/src/components/form/`**

| File | Responsibility |
|---|---|
| `gradients.js` | Exports `GRADIENTS` (bg-br classes) and `GRADIENTS_R` (bg-r classes) keyed by `expense\|income\|borrowed\|lent\|neutral`. Single source of truth for gradient classes. |
| `SectionLabel.jsx` | Tiny uppercase, letter-spaced, muted label. `children`, optional `className`. |
| `FieldCard.jsx` | Rounded bordered card wrapper with subtle shadow. `children`, optional `className`, optional `as` (default `'div'`). |
| `SegmentedToggle.jsx` | Two-option pill toggle with colored active background. `value`, `onChange(value)`, `options: [{ value, label, icon, activeColor }]`. |
| `AmountHero.jsx` | Gradient card containing a large numeric input and an optional meta slot. `value`, `onChange(stringValue)`, `variant`, `currencySymbol`, `label`, `error`, `disabled`, `children` (meta slot below the input). |
| `CategoryChips.jsx` | Horizontal-scroll row of category chips (color dot + name + checkmark when selected). `categories`, `value`, `onChange(categoryId)`, optional `onCreateClick`. |
| `StickyFormFooter.jsx` | Footer pinned to the bottom of a flex-column form: full-width gradient submit button, optional secondary Cancel. `variant`, `loading`, `label`, `loadingLabel`, optional `onCancel`. |
| `Showcase.jsx` | Dev-only page rendering every primitive in both themes and all variants/states. |

**Modified**

| File | Change |
|---|---|
| `client/src/pages/Expenses.jsx` | Replace the JSX inside the Add/Edit `<Modal>` `<form>` (roughly lines 1063–1237) with composed primitives. No logic changes. |
| `client/src/components/DebtForm.jsx` | Replace the hand-rolled `Dialog`/`Transition` wrapper with `Modal`; rewrite the body with primitives. Keep `formData`, `useEffect`, `handleSubmit`. |
| `client/src/pages/Categories.jsx` | Move the inline `{showForm && (<div className="glass-card p-6">…</div>)}` block into a `<Modal>`; rewrite the body with primitives. Keep all handlers. |
| `client/src/App.jsx` | Add a dev-only route `"/dev/form-kit"` → `Showcase` (guarded by `import.meta.env.DEV`). |

---

## Task 1: Gradient tokens + SectionLabel + FieldCard

**Files:**
- Create: `client/src/components/form/gradients.js`
- Create: `client/src/components/form/SectionLabel.jsx`
- Create: `client/src/components/form/FieldCard.jsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `gradients.js`: `export const GRADIENTS = { expense, income, borrowed, lent, neutral }` and `export const GRADIENTS_R = { …same keys… }`, each value a Tailwind class string.
  - `SectionLabel.jsx`: `export default function SectionLabel({ children, className })` → renders a `<p>`.
  - `FieldCard.jsx`: `export default function FieldCard({ children, className, as: As = 'div', ...rest })` → renders `<As className="{card classes} {className}" {...rest}>`.

- [ ] **Step 1: Create `gradients.js`**

```js
// client/src/components/form/gradients.js
// Single source of truth for form gradient classes.
// Keys map form "variant" -> Tailwind gradient utility classes.

export const GRADIENTS = {
  expense:  'bg-gradient-to-br from-[#c71852] to-[#ea2261]',
  borrowed: 'bg-gradient-to-br from-[#c71852] to-[#ea2261]',
  income:   'bg-gradient-to-br from-[#059669] to-[#10b981]',
  lent:     'bg-gradient-to-br from-[#059669] to-[#10b981]',
  neutral:  'bg-gradient-to-br from-[#4434d4] to-[#6366f1]',
}

// Left-to-right variant, used for the submit bar button.
export const GRADIENTS_R = {
  expense:  'bg-gradient-to-r from-[#c71852] to-[#ea2261]',
  borrowed: 'bg-gradient-to-r from-[#c71852] to-[#ea2261]',
  income:   'bg-gradient-to-r from-[#059669] to-[#10b981]',
  lent:     'bg-gradient-to-r from-[#059669] to-[#10b981]',
  neutral:  'bg-gradient-to-r from-[#4434d4] to-[#6366f1]',
}

export const gradientBr = (variant) => GRADIENTS[variant] || GRADIENTS.neutral
export const gradientR  = (variant) => GRADIENTS_R[variant] || GRADIENTS_R.neutral
```

- [ ] **Step 2: Create `SectionLabel.jsx`**

```jsx
// client/src/components/form/SectionLabel.jsx

export default function SectionLabel({ children, className = '' }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-slate-400 mb-2 ${className}`}>
      {children}
    </p>
  )
}
```

- [ ] **Step 3: Create `FieldCard.jsx`**

```jsx
// client/src/components/form/FieldCard.jsx

export default function FieldCard({ children, className = '', as: As = 'div', ...rest }) {
  return (
    <As
      className={`rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </As>
  )
}
```

- [ ] **Step 4: Verify build and lint**

Run: `cd client && npm run lint && npx vite build`
Expected: lint passes with zero warnings; build succeeds. (Nothing imports these yet — this only checks syntax.)

- [ ] **Step 5: Commit**

```bash
git add client/src/components/form/gradients.js client/src/components/form/SectionLabel.jsx client/src/components/form/FieldCard.jsx
git commit -m "Add form kit primitives: gradients, SectionLabel, FieldCard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: SegmentedToggle

**Files:**
- Create: `client/src/components/form/SegmentedToggle.jsx`
- Modify: `client/src/components/form/Showcase.jsx` (created in Task 7; skip the showcase edit if running out of order — it is not required for this task's deliverable)

**Interfaces:**
- Consumes: nothing.
- Produces: `SegmentedToggle.jsx`: `export default function SegmentedToggle({ value, onChange, options })` where `options` is `[{ value: string, label: string, icon?: ReactNode, activeColor?: string }]`. `activeColor` is a Tailwind text color class applied to the active option (e.g. `'text-rose-600 dark:text-rose-400'`); the active option also gets a tinted background derived from the same palette. Calls `onChange(option.value)` on click.

- [ ] **Step 1: Create `SegmentedToggle.jsx`**

```jsx
// client/src/components/form/SegmentedToggle.jsx

export default function SegmentedToggle({ value, onChange, options = [] }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-gray-100 dark:bg-white/[0.04]">
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-all duration-200
              ${active
                ? `bg-white dark:bg-white/[0.08] shadow-sm ${opt.activeColor || 'text-gray-900 dark:text-white'}`
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white'
              }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify build and lint**

Run: `cd client && npm run lint && npx vite build`
Expected: passes.

- [ ] **Step 3: Manual visual check (optional, if Showcase exists)**

If `Showcase.jsx` already exists, add a `SegmentedToggle` example with two options and confirm at `/dev/form-kit` that the active option shows the tinted background and color. Otherwise defer to Task 7.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/form/SegmentedToggle.jsx
git commit -m "Add form kit primitive: SegmentedToggle

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: AmountHero

**Files:**
- Create: `client/src/components/form/AmountHero.jsx`

**Interfaces:**
- Consumes: `gradientBr` from `./gradients`.
- Produces: `AmountHero.jsx`: `export default function AmountHero({ value, onChange, variant = 'neutral', currencySymbol = '$', label, error, disabled = false, children })`.
  - Renders a gradient card (`gradientBr(variant)`).
  - `label` is the small text above the input (e.g. `"Amount (₹)"`).
  - The input is `type="text"` with `inputMode="decimal"`; on change it strips anything that is not a digit or `.` and calls `onChange(sanitizedString)`.
  - `error` (string) renders below the input in a light-on-dark error style.
  - `disabled` makes the input read-only and dims it.
  - `children` renders below the input (meta slot: a date chip, a "remaining" line, an edit-lock note).

- [ ] **Step 1: Create `AmountHero.jsx`**

```jsx
// client/src/components/form/AmountHero.jsx
import { gradientBr } from './gradients'

export default function AmountHero({
  value,
  onChange,
  variant = 'neutral',
  currencySymbol = '$',
  label,
  error,
  disabled = false,
  children,
}) {
  const handleChange = (e) => {
    const cleaned = e.target.value.replace(/[^0-9.]/g, '')
    // collapse multiple dots
    const parts = cleaned.split('.')
    const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned
    onChange(normalized)
  }

  return (
    <div className={`rounded-3xl overflow-hidden shadow-lg ${gradientBr(variant)}`}>
      <div className="px-6 py-8 flex flex-col items-center">
        {label && (
          <span className="text-sm font-light text-white/70 mb-1">{label}</span>
        )}
        <div className="flex items-center justify-center gap-1 text-white">
          <span className="text-3xl font-extralight text-white/60">{currencySymbol}</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            readOnly={disabled}
            placeholder="0"
            className={`bg-transparent border-0 outline-none text-center text-5xl font-extralight tracking-tight text-white placeholder-white/30 w-[8ch] tabular-nums ${disabled ? 'opacity-60' : ''}`}
          />
        </div>
        {error && (
          <p className="mt-3 text-sm font-medium text-white bg-black/20 rounded-lg px-3 py-1">
            {error}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build and lint**

Run: `cd client && npm run lint && npx vite build`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/form/AmountHero.jsx
git commit -m "Add form kit primitive: AmountHero

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: CategoryChips

**Files:**
- Create: `client/src/components/form/CategoryChips.jsx`

**Interfaces:**
- Consumes: `Check`, `Plus` from `lucide-react`.
- Produces: `CategoryChips.jsx`: `export default function CategoryChips({ categories = [], value, onChange, onCreateClick })`.
  - Renders a horizontally scrolling flex row (`overflow-x-auto`, no visible scrollbar).
  - Each chip: color dot (`category.color`), `category.name`, and a `Check` icon when `category._id === value`.
  - Selected chip: border and text in `category.color`, background `category.color + '20'`.
  - Clicking a chip calls `onChange(category._id)`.
  - If `onCreateClick` is provided, a trailing "New" chip with a `Plus` icon calls it.
  - Category id field is `_id` (matches `CategorySelector.jsx`).

- [ ] **Step 1: Create `CategoryChips.jsx`**

```jsx
// client/src/components/form/CategoryChips.jsx
import { Check, Plus } from 'lucide-react'

export default function CategoryChips({ categories = [], value, onChange, onCreateClick }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((cat) => {
        const selected = cat._id === value
        const color = cat.color || '#6366f1'
        return (
          <button
            key={cat._id}
            type="button"
            onClick={() => onChange(cat._id)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full border-[1.5px] whitespace-nowrap text-sm font-medium min-h-[40px] transition-all duration-200"
            style={{
              borderColor: selected ? color : undefined,
              backgroundColor: selected ? color + '20' : undefined,
              color: selected ? color : undefined,
            }}
          >
            <span
              className={`w-2 h-2 rounded-full ${selected ? '' : 'opacity-80'}`}
              style={{ backgroundColor: color }}
            />
            <span className={selected ? '' : 'text-gray-700 dark:text-slate-300'}>{cat.name}</span>
            {selected && <Check size={14} />}
          </button>
        )
      })}

      {onCreateClick && (
        <button
          type="button"
          onClick={onCreateClick}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[1.5px] border-dashed border-gray-300 dark:border-white/[0.15] text-sm font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap min-h-[40px]"
        >
          <Plus size={14} />
          New
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build and lint**

Run: `cd client && npm run lint && npx vite build`
Expected: passes. Note: the non-selected chip has no explicit border color, so it falls back to the browser default — acceptable; the selected state is the emphasis. If lint or design review objects, add `border-gray-200 dark:border-white/[0.08]` to the base `className` and only override via `style` when selected.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/form/CategoryChips.jsx
git commit -m "Add form kit primitive: CategoryChips

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: StickyFormFooter

**Files:**
- Create: `client/src/components/form/StickyFormFooter.jsx`

**Interfaces:**
- Consumes: `gradientR` from `./gradients`.
- Produces: `StickyFormFooter.jsx`: `export default function StickyFormFooter({ variant = 'neutral', loading = false, label, loadingLabel, onCancel })`.
  - Renders a `flex-shrink-0` container with a top border and panel background, intended as the last child of a `flex flex-col` form whose middle child is the scroll area.
  - Primary button: `type="submit"`, full-width, `gradientR(variant)`, white text; shows a spinner + `loadingLabel` when `loading`, else `label`; `disabled={loading}`.
  - If `onCancel` is given, a secondary ghost "Cancel" button sits to its left (`type="button"`).

- [ ] **Step 1: Create `StickyFormFooter.jsx`**

```jsx
// client/src/components/form/StickyFormFooter.jsx
import { gradientR } from './gradients'

export default function StickyFormFooter({
  variant = 'neutral',
  loading = false,
  label,
  loadingLabel,
  onCancel,
}) {
  return (
    <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#151828]">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn-secondary btn-md flex-shrink-0"
        >
          Cancel
        </button>
      )}
      <button
        type="submit"
        disabled={loading}
        className={`flex-1 min-h-[48px] rounded-2xl text-white text-base font-semibold flex items-center justify-center gap-2 shadow-md transition-opacity ${gradientR(variant)} ${loading ? 'opacity-70' : ''}`}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {loadingLabel || 'Saving…'}
          </>
        ) : (
          label
        )}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify build and lint**

Run: `cd client && npm run lint && npx vite build`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/form/StickyFormFooter.jsx
git commit -m "Add form kit primitive: StickyFormFooter

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Showcase dev page + route

**Files:**
- Create: `client/src/components/form/Showcase.jsx`
- Modify: `client/src/App.jsx` (imports near line 8–25; route list near line 72–80)

**Interfaces:**
- Consumes: every primitive from `./` (`SectionLabel`, `FieldCard`, `SegmentedToggle`, `AmountHero`, `CategoryChips`, `StickyFormFooter`).
- Produces: `Showcase.jsx` default export (a page component). New route `"/dev/form-kit"` rendered only when `import.meta.env.DEV`.

- [ ] **Step 1: Create `Showcase.jsx`**

```jsx
// client/src/components/form/Showcase.jsx
// Dev-only. Renders every form primitive in all variants/states.
import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import SectionLabel from './SectionLabel'
import FieldCard from './FieldCard'
import SegmentedToggle from './SegmentedToggle'
import AmountHero from './AmountHero'
import CategoryChips from './CategoryChips'
import StickyFormFooter from './StickyFormFooter'

const demoCategories = [
  { _id: '1', name: 'Food', color: '#ea2261' },
  { _id: '2', name: 'Transport', color: '#059669' },
  { _id: '3', name: 'Rent', color: '#6366f1' },
  { _id: '4', name: 'Shopping', color: '#f59e0b' },
]

export default function Showcase() {
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [cat, setCat] = useState('1')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0e17] p-6 space-y-8">
      <h1 className="text-lg font-bold text-gray-900 dark:text-white">Form Kit Showcase</h1>

      <section className="space-y-3 max-w-md">
        <SectionLabel>Amount hero — expense</SectionLabel>
        <AmountHero value={amount} onChange={setAmount} variant="expense" currencySymbol="₹" label="Amount (₹)" />
        <SectionLabel>Amount hero — income + meta slot</SectionLabel>
        <AmountHero value={amount} onChange={setAmount} variant="income" currencySymbol="₹" label="Amount (₹)">
          <span className="text-xs text-white/80">Remaining: ₹1,200</span>
        </AmountHero>
        <SectionLabel>Amount hero — error + disabled</SectionLabel>
        <AmountHero value="500" onChange={() => {}} variant="borrowed" currencySymbol="₹" label="Debt Amount" error="Amount cannot be changed after creation" disabled />
      </section>

      <section className="space-y-3 max-w-md">
        <SectionLabel>Segmented toggle</SectionLabel>
        <SegmentedToggle
          value={type}
          onChange={setType}
          options={[
            { value: 'expense', label: 'Expense', icon: <ArrowDownCircle size={18} />, activeColor: 'text-rose-600 dark:text-rose-400' },
            { value: 'income', label: 'Income', icon: <ArrowUpCircle size={18} />, activeColor: 'text-emerald-600 dark:text-emerald-400' },
          ]}
        />
      </section>

      <section className="space-y-3 max-w-md">
        <SectionLabel>Category chips</SectionLabel>
        <CategoryChips categories={demoCategories} value={cat} onChange={setCat} onCreateClick={() => {}} />
      </section>

      <section className="space-y-3 max-w-md">
        <SectionLabel>Field card</SectionLabel>
        <FieldCard className="p-4">
          <input className="w-full bg-transparent outline-none text-gray-900 dark:text-white" placeholder="A field inside a card" />
        </FieldCard>
      </section>

      <section className="max-w-md border border-gray-200 dark:border-white/[0.08] rounded-2xl overflow-hidden flex flex-col h-[200px]">
        <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-500">Scroll body…</div>
        <StickyFormFooter variant={type} loading={false} label="Save" loadingLabel="Saving…" onCancel={() => {}} />
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Wire the route in `App.jsx`**

Add near the other page imports (around line 25):

```jsx
const Showcase = import.meta.env.DEV ? (await import('./components/form/Showcase')).default : null
```

If top-level `await` is not available in this file (it is a plain module, not ESM top-level-await context), use a static import guarded at render instead:

```jsx
import FormKitShowcase from './components/form/Showcase'
```

Then inside the `<Routes>` block (after the protected routes, around line 80), add:

```jsx
{import.meta.env.DEV && (
  <Route path="/dev/form-kit" element={<FormKitShowcase />} />
)}
```

Use the static-import form — it is simpler and Vite tree-shakes the route out of production builds because `import.meta.env.DEV` is statically `false` there. Remove the `await import` note; do not use it.

- [ ] **Step 3: Verify build, lint, and the page**

Run: `cd client && npm run lint && npx vite build`
Expected: passes; production build contains no `/dev/form-kit` route.

Run: `cd client && npm run dev`, open `http://localhost:5173/dev/form-kit`.
Expected: all sections render. Toggle light/dark (the app's theme switch, or OS setting) and confirm every primitive is legible in both. Confirm category chips scroll horizontally when the row overflows.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/form/Showcase.jsx client/src/App.jsx
git commit -m "Add dev-only form kit showcase page at /dev/form-kit

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Rewrite the Expense Add/Edit form body

**Files:**
- Modify: `client/src/pages/Expenses.jsx`
  - Imports block (around lines 1–36): add form-kit imports.
  - The `<Modal>` for Add/Edit (starts around line 1056) — replace the `<form>` contents (roughly lines 1063–1237). Keep `handleSubmit`, `formData`, `setFormData`, `editingExpense`, `resetForm`, `formLoading`, `categories`, `currency`, `currencySymbols` exactly as they are.

**Interfaces:**
- Consumes: `AmountHero`, `SegmentedToggle`, `SectionLabel`, `FieldCard`, `CategoryChips`, `StickyFormFooter` from `../components/form/*`; existing `DatePicker`.
- Produces: no new exported interface. The form still calls the same `handleSubmit` and mutates the same `formData` keys: `description`, `amount` (string), `date` (string), `category` (id string), `type` (`'expense'|'income'`), `isRecurring` (bool), `recurringPeriod` (`'weekly'|'monthly'|'yearly'`), `recurringEndDate` (string).

- [ ] **Step 1: Add imports to `Expenses.jsx`**

After the existing `import Modal from '../components/Modal'` line (line 12), add:

```jsx
import AmountHero from '../components/form/AmountHero'
import SegmentedToggle from '../components/form/SegmentedToggle'
import SectionLabel from '../components/form/SectionLabel'
import FieldCard from '../components/form/FieldCard'
import CategoryChips from '../components/form/CategoryChips'
import StickyFormFooter from '../components/form/StickyFormFooter'
```

- [ ] **Step 2: Replace the Modal's form body**

Replace the entire `<Modal …> … </Modal>` block for Add/Edit (the one titled `editingExpense ? 'Edit Expense' : 'Add Expense'`) with:

```jsx
<Modal
  isOpen={showForm}
  onClose={() => { setShowForm(false); resetForm() }}
  title={null}
  maxWidth="max-w-lg"
>
  <form onSubmit={handleSubmit} className="flex flex-col h-[600px] max-h-[85vh]">
    {/* Scrollable content */}
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      <AmountHero
        value={formData.amount}
        onChange={(v) => setFormData({ ...formData, amount: v })}
        variant={formData.type}
        currencySymbol={currencySymbols[currency] || '$'}
        label={`Amount (${currencySymbols[currency] || '$'})`}
      >
        <div className="flex items-center gap-2">
          <DatePicker
            value={formData.date}
            onChange={(date) => setFormData({ ...formData, date })}
            placeholder="Select date"
          />
        </div>
      </AmountHero>

      <SegmentedToggle
        value={formData.type}
        onChange={(t) => setFormData({ ...formData, type: t })}
        options={[
          { value: 'expense', label: 'Expense', icon: <ArrowDownCircle size={18} />, activeColor: 'text-rose-600 dark:text-rose-400' },
          { value: 'income', label: 'Income', icon: <ArrowUpCircle size={18} />, activeColor: 'text-emerald-600 dark:text-emerald-400' },
        ]}
      />

      <div>
        <SectionLabel>Category *</SectionLabel>
        <CategoryChips
          categories={categories}
          value={formData.category}
          onChange={(id) => setFormData({ ...formData, category: id })}
        />
      </div>

      <div>
        <SectionLabel>Notes (optional)</SectionLabel>
        <FieldCard className="p-4">
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
            placeholder="e.g. Grocery run, monthly salary…"
          />
        </FieldCard>
      </div>

      <div>
        <FieldCard className="p-4">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="flex items-center gap-2">
              <Repeat size={18} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Recurring {formData.type}</span>
            </span>
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isRecurring: e.target.checked,
                  recurringEndDate: e.target.checked ? formData.recurringEndDate : '',
                })
              }
              className="w-5 h-5 text-indigo-600 border-gray-300 dark:border-white/[0.15] rounded focus:ring-indigo-500"
            />
          </label>

          {formData.isRecurring && (
            <div className="mt-4 space-y-3">
              <div>
                <SectionLabel>Frequency *</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {['weekly', 'monthly', 'yearly'].map((p) => {
                    const active = formData.recurringPeriod === p
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, recurringPeriod: p })}
                        className={`px-3.5 py-2 rounded-full text-sm font-medium capitalize min-h-[40px] border transition-all duration-200
                          ${active
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-transparent border-gray-300 dark:border-white/[0.15] text-gray-700 dark:text-slate-300'
                          }`}
                      >
                        {p}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="relative" style={{ zIndex: 1000 }}>
                <SectionLabel>End Date *</SectionLabel>
                <DatePicker
                  value={formData.recurringEndDate}
                  onChange={(date) => setFormData({ ...formData, recurringEndDate: date })}
                  placeholder="Select end date"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Recurring entries will be created from the start date through this end date.
                </p>
              </div>
            </div>
          )}
        </FieldCard>
      </div>
    </div>

    <StickyFormFooter
      variant={formData.type}
      loading={formLoading}
      label={editingExpense ? 'Update' : 'Add'}
      loadingLabel={editingExpense ? 'Updating…' : 'Adding…'}
      onCancel={() => { setShowForm(false); resetForm() }}
    />
  </form>
</Modal>
```

- [ ] **Step 3: Verify build and lint**

Run: `cd client && npm run lint && npx vite build`
Expected: passes. If `ArrowDownCircle` / `ArrowUpCircle` / `Repeat` are reported unused elsewhere, they are still imported at the top of `Expenses.jsx` (confirmed lines 28–30) — no import change needed.

- [ ] **Step 4: Manual verification**

Run: `cd client && npm run dev`. Log in, go to Expenses.
- Click "Add Expense": modal opens as a bottom sheet on a narrow window / centered on wide.
- Enter an amount → hero shows it large; toggle Expense/Income → hero gradient and toggle color change.
- Pick a category chip → it highlights with the category color + checkmark.
- Toggle Recurring → frequency pills + end-date picker appear; pick `weekly`.
- Submit → expense is created and appears in the list. Check the Network tab or the list to confirm the payload is unchanged (type, category id, isRecurring, recurringPeriod, recurringEndDate).
- Edit an existing expense → fields prefill; change the amount; Update → row updates.
- Clear the amount and submit → existing validation toast fires ("amount must be greater than 0"), no submit.
- Repeat the category check with a coarse-pointer / mobile-emulated viewport: chips scroll horizontally, sticky footer stays visible while the body scrolls.
- Light and dark themes.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Expenses.jsx
git commit -m "Redesign Expense add/edit form with mobile-style form kit

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Rewrite the Debt form and move it into Modal

**Files:**
- Modify: `client/src/components/DebtForm.jsx` (full body; replace the `Dialog`/`Transition` wrapper with `Modal`).
- Modify: `client/src/pages/Debts.jsx` only if the `DebtForm` props change — they do **not** (`isOpen`, `onClose`, `type`, `editDebt` all kept), so `Debts.jsx` needs no edit. Confirm by reading its `<DebtForm …>` usage (around line 85).

**Interfaces:**
- Consumes: `Modal` from `./Modal`; `AmountHero`, `SegmentedToggle`, `SectionLabel`, `FieldCard`, `StickyFormFooter` from `./form/*`; existing `DatePicker` from `./DatePicker`; `useDebt`, `useAuth`; `ArrowDownCircle`, `ArrowUpCircle` from `lucide-react`.
- Produces: same component signature: `export default function DebtForm({ isOpen, onClose, editDebt = null, type = 'borrowed' })`. Same `formData` keys: `personName`, `amount` (string), `date` (string), `dueDate` (string), `notes` (string), `type` (`'borrowed'|'lent'`). Same `handleSubmit`.

- [ ] **Step 1: Replace `DebtForm.jsx` in full**

```jsx
import { useState, useEffect } from 'react';
import { useDebt } from '../context/DebtContext';
import { useAuth } from '../context/AuthContext';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import Modal from './Modal';
import DatePicker from './DatePicker';
import AmountHero from './form/AmountHero';
import SegmentedToggle from './form/SegmentedToggle';
import SectionLabel from './form/SectionLabel';
import FieldCard from './form/FieldCard';
import StickyFormFooter from './form/StickyFormFooter';

const currencySymbols = {
  USD: '$', EUR: '€', INR: '₹', GBP: '£', JPY: '¥', CNY: '¥', CAD: 'C$', AUD: 'A$',
};

export default function DebtForm({ isOpen, onClose, editDebt = null, type = 'borrowed' }) {
  const { addDebt, updateDebt } = useDebt();
  const { currency } = useAuth();
  const currencySymbol = currencySymbols[currency] || '$';

  const [formData, setFormData] = useState({
    personName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    type,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editDebt) {
      setFormData({
        personName: editDebt.personName,
        amount: editDebt.amount,
        date: editDebt.date,
        dueDate: editDebt.dueDate || '',
        notes: editDebt.notes || '',
        type: editDebt.type,
      });
    } else {
      setFormData((prev) => ({ ...prev, type }));
    }
  }, [editDebt, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = editDebt
      ? await updateDebt(editDebt._id, formData)
      : await addDebt(formData);

    setLoading(false);

    if (result.success) {
      onClose();
      if (!editDebt) {
        setFormData({
          personName: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          dueDate: '',
          notes: '',
          type,
        });
      }
    }
  };

  const variant = formData.type; // 'borrowed' | 'lent'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={null} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col h-[600px] max-h-[85vh]">
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <AmountHero
            value={formData.amount != null ? String(formData.amount) : ''}
            onChange={(v) => setFormData({ ...formData, amount: v })}
            variant={variant}
            currencySymbol={currencySymbol}
            label={`Debt Amount (${currencySymbol})`}
            disabled={!!editDebt}
          >
            {editDebt && (
              <span className="text-xs text-white/80">Amount cannot be changed after creation</span>
            )}
          </AmountHero>

          {!editDebt && (
            <SegmentedToggle
              value={formData.type}
              onChange={(t) => setFormData({ ...formData, type: t })}
              options={[
                { value: 'borrowed', label: 'I Borrowed', icon: <ArrowDownCircle size={18} />, activeColor: 'text-rose-600 dark:text-rose-400' },
                { value: 'lent', label: 'I Lent', icon: <ArrowUpCircle size={18} />, activeColor: 'text-emerald-600 dark:text-emerald-400' },
              ]}
            />
          )}

          <div>
            <SectionLabel>Person Name</SectionLabel>
            <FieldCard className="p-4">
              <input
                type="text"
                required
                value={formData.personName}
                onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                className="w-full bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
                placeholder="e.g. Rahul, Mom, John…"
              />
            </FieldCard>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <SectionLabel>Date</SectionLabel>
              <DatePicker
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                placeholder="Select date"
              />
            </div>
            <div>
              <SectionLabel>Due Date (optional)</SectionLabel>
              <DatePicker
                value={formData.dueDate}
                onChange={(date) => setFormData({ ...formData, dueDate: date })}
                placeholder="Select due date"
              />
            </div>
          </div>

          <div>
            <SectionLabel>Notes (optional)</SectionLabel>
            <FieldCard className="p-4">
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-transparent border-0 outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
                placeholder="e.g. For rent, borrowed for trip…"
              />
            </FieldCard>
          </div>
        </div>

        <StickyFormFooter
          variant={variant}
          loading={loading}
          label={editDebt ? 'Update Record' : 'Save Record'}
          loadingLabel="Saving…"
          onCancel={onClose}
        />
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Confirm `Debts.jsx` needs no change**

Read `client/src/pages/Debts.jsx` around line 85. The usage is:

```jsx
<DebtForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} type={selectedType} />
```

All three props are still supported. No edit needed. (If a future edit-debt entry point passes `editDebt`, it also still works.)

- [ ] **Step 3: Verify build and lint**

Run: `cd client && npm run lint && npx vite build`
Expected: passes. `@heroicons/react` imports are gone from this file — confirm nothing else in `DebtForm.jsx` referenced them (the rewrite drops all of `XMarkIcon`, `UserIcon`, `CurrencyDollarIcon`, `CalendarIcon`, `DocumentTextIcon`).

- [ ] **Step 4: Manual verification**

Run: `cd client && npm run dev`. Go to Debts.
- "Add Record" on the Borrowed tab → modal opens; hero is pink; toggle set to "I Borrowed".
- Switch tab to Lent, "Add Record" → hero is green; toggle set to "I Lent".
- Enter person name + amount, pick a date, Save → record appears under the right tab.
- Toggle "I Borrowed" / "I Lent" inside the form → hero + footer gradient switch.
- Edit an existing record (if the Debt list exposes edit) → amount field is disabled with the note; personName/date/notes editable; Update persists.
- Submit with an empty person name → the `required` attribute blocks submit (browser validation bubble).
- Bottom sheet on narrow viewport; sticky footer visible while body scrolls. Light + dark.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/DebtForm.jsx
git commit -m "Redesign Debt form with mobile-style form kit, move into Modal

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Move the Category form into Modal and restyle

**Files:**
- Modify: `client/src/pages/Categories.jsx`
  - Add `import Modal from '../components/Modal'` and form-kit imports near the top (after line 6).
  - Replace the inline `{showForm && (<div className="glass-card p-6"> … </div>)}` block (starts around line 259, ends at the closing `)}` around line 350) with a `<Modal>`.
  - Keep `showForm`, `editingCategory`, `formData`, `setFormData`, `handleSubmit`, `handleCancel`, `handleAddNew`, `formLoading`, `iconOptions`, `colorOptions` unchanged.

**Interfaces:**
- Consumes: `Modal`, `SectionLabel`, `FieldCard`, `StickyFormFooter` from their paths.
- Produces: no new interface. `formData` keys stay `name`, `color` (hex string), `icon` (emoji string). `handleSubmit(e)` unchanged.

- [ ] **Step 1: Add imports to `Categories.jsx`**

After `import { useAuth } from '../context/AuthContext'` (line 6):

```jsx
import Modal from '../components/Modal'
import SectionLabel from '../components/form/SectionLabel'
import FieldCard from '../components/form/FieldCard'
import StickyFormFooter from '../components/form/StickyFormFooter'
```

- [ ] **Step 2: Replace the inline form block with a Modal**

Replace the whole `{showForm && ( … )}` block (the `glass-card p-6` form) with:

```jsx
<Modal
  isOpen={showForm}
  onClose={handleCancel}
  title={editingCategory ? 'Edit Category' : 'Add New Category'}
  maxWidth="max-w-md"
>
  <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Preview */}
      <div className="flex justify-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ backgroundColor: (formData.color || '#6366f1') + '20' }}
        >
          {formData.icon}
        </div>
      </div>

      <div>
        <SectionLabel>Category Name</SectionLabel>
        <FieldCard className="p-4">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
            placeholder="Enter category name"
            maxLength={30}
          />
        </FieldCard>
      </div>

      <div>
        <SectionLabel>Icon</SectionLabel>
        <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
          {iconOptions.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setFormData({ ...formData, icon })}
              className={`flex items-center justify-center text-xl rounded-xl border-2 min-h-[44px] transition-all duration-200 ${
                formData.icon === icon
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                  : 'border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.15]'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Color</SectionLabel>
        <div className="grid grid-cols-8 gap-2">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                formData.color === color
                  ? 'border-gray-800 dark:border-white scale-110 shadow-md shadow-current/20'
                  : 'border-gray-200 dark:border-white/[0.08] hover:border-gray-400 dark:hover:border-white/[0.20]'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>
    </div>

    <StickyFormFooter
      variant="neutral"
      loading={formLoading}
      label={editingCategory ? 'Update Category' : 'Add Category'}
      loadingLabel={editingCategory ? 'Updating…' : 'Adding…'}
      onCancel={handleCancel}
    />
  </form>
</Modal>
```

- [ ] **Step 3: Verify build and lint**

Run: `cd client && npm run lint && npx vite build`
Expected: passes.

- [ ] **Step 4: Manual verification**

Run: `cd client && npm run dev`. Go to Categories.
- "Add Category" → modal opens (bottom sheet on mobile, centered on desktop).
- Type a name, pick an icon and a color → the preview tile updates.
- Add → new category appears in the list below and in the Expense form's chips.
- Edit a category → name/icon/color prefill; change one; Update → list reflects it.
- Cancel → modal closes, no change.
- Light + dark; narrow + wide viewport.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Categories.jsx
git commit -m "Move Category form into Modal, restyle with form kit

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: Final pass — self-review, full manual sweep, spec sync

**Files:**
- Modify: `docs/superpowers/specs/2026-09-08-mobile-style-web-forms-design.md` (only if reality diverged — e.g. the `IconRow` primitive was dropped in favor of wrapping `DatePicker` in `FieldCard`; record that).

- [ ] **Step 1: Grep for leftovers**

Run:
```bash
cd client && grep -rn "CategorySelector" src/pages/Expenses.jsx
```
Expected: no matches (the Expense form no longer uses it). `CategorySelector` should still be imported/used in `BudgetForm.jsx`, `BulkEditList.jsx`, `AnalyticsDashboard.jsx` — confirm those are untouched:
```bash
cd client && grep -rln "CategorySelector" src/
```
Expected: `BudgetForm.jsx`, `BulkEditList.jsx`, `AnalyticsDashboard.jsx`, `CategorySelector.jsx` — and NOT `Expenses.jsx`.

- [ ] **Step 2: Full build + lint**

Run: `cd client && npm run lint && npx vite build`
Expected: both clean.

- [ ] **Step 3: Cross-form manual sweep**

With `npm run dev`, in one session verify all three forms once more, back to back, in dark mode on a mobile-emulated viewport (DevTools device toolbar, e.g. iPhone 12) AND with "Desktop site" style wide viewport:
- Expense add + edit + recurring + validation.
- Debt add (both tabs) + edit + toggle.
- Category add + edit + preview.
- In every case: sticky footer pinned, body scrolls under it, gradients correct per variant, no horizontal page scroll, category chips scroll horizontally.

- [ ] **Step 4: Update the spec if needed**

If any primitive was renamed, dropped, or added versus the spec's "Approach" table, edit the spec to match what was built. If nothing diverged, skip.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Sync spec with implemented form kit; final verification pass

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage**

| Spec item | Task |
|---|---|
| `AmountHero` primitive | Task 3 |
| `SegmentedToggle` primitive | Task 2 |
| `SectionLabel` primitive | Task 1 |
| `FieldCard` primitive | Task 1 |
| `IconRow` primitive | **Dropped** — web `DatePicker` renders its own trigger; wrapping it in `FieldCard` (or leaving it bare in a labeled block) covers the need without reimplementing a picker-opening row. Recorded in Task 10 Step 4. |
| `StickyFormFooter` primitive | Task 5 |
| `CategoryChips` primitive | Task 4 |
| `GRADIENTS` map, no new deps | Task 1 (`gradients.js`) |
| All three forms use `Modal` | Task 7 (Expense, already in Modal), Task 8 (Debt → Modal), Task 9 (Category → Modal) |
| Expense form composition | Task 7 |
| Debt form composition + repay out of scope | Task 8 (no repay UI added) |
| Category form composition, icon/color grids kept | Task 9 |
| `CategorySelector` unchanged elsewhere; only expense form swaps to chips | Task 7 (swap), Task 10 Step 1 (verify) |
| Recurring frequency = weekly/monthly/yearly (web set) | Task 7 Step 2 (hard-coded `['weekly','monthly','yearly']`), Global Constraints |
| Dev showcase page + route, prod-stripped | Task 6 |
| Error prop on `AmountHero`; `loading` on footer | Task 3, Task 5 |
| Dark mode on every primitive | Global Constraints + each primitive's classes + Task 6 visual check |
| Verification = build + lint + showcase + manual checklist (no test runner) | every task's verify step + Task 10 |

**2. Placeholder scan:** No "TBD"/"TODO"/"handle edge cases"/"similar to Task N". Every code step has full code. The one intentional removal (`IconRow`) is explained, not deferred.

**3. Type consistency:**
- `variant` values are consistently `'expense' | 'income' | 'borrowed' | 'lent' | 'neutral'` across `gradients.js`, `AmountHero`, `StickyFormFooter`, and all three forms.
- `AmountHero`'s `onChange` always receives a sanitized **string**; forms store it in `formData.amount` (which the existing `handleSubmit`s already `parseFloat` — unchanged).
- `CategoryChips` uses `cat._id` (matches `CategorySelector.jsx` and `formData.category`).
- `SegmentedToggle` `options[].activeColor` is a class string in every call site.
- `StickyFormFooter` props (`variant`, `loading`, `label`, `loadingLabel`, `onCancel`) are identical in all three usages.
- Recurring period button values (`'weekly'|'monthly'|'yearly'`) match the existing `formData.recurringPeriod` domain and the old `<select>` options.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-08-mobile-style-web-forms.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
