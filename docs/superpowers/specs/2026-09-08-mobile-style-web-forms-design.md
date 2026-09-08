# Mobile-style forms for the web client — Design

Date: 2026-09-08
Status: Approved for planning

## Goal

Bring the mobile app's visual language for its Add/Edit forms into the web client's
three form surfaces:

- Add/Edit **Expense** (currently in `client/src/pages/Expenses.jsx`, inside `Modal`)
- Add/Edit **Debt** (currently `client/src/components/DebtForm.jsx`, hand-rolled Dialog)
- Add/Edit **Category** (currently inline `glass-card` block in `client/src/pages/Categories.jsx`)

The redesign applies on **all screen sizes** — one design everywhere, no dual
mobile/desktop layouts.

## Reference (mobile screens)

- `mobile-app/src/screens/AddExpenseScreen.js`
- `mobile-app/src/screens/AddDebtScreen.js`
- `mobile-app/src/screens/AddEditCategoryScreen.js`

Shared mobile visual elements to port:

| Element | Mobile behavior |
|---|---|
| Amount entry | Full-width **gradient hero card**; large (~52px) number input; date chip / meta line inside the card |
| Type toggle | Segmented pill, two options, colored active background (pink/red vs green) |
| Category (expense) | Horizontal **scrolling chips** with color dot + checkmark when selected |
| Section labels | Tiny uppercase, letter-spaced, muted |
| Field groups | Each wrapped in a rounded, bordered card with subtle shadow |
| Date fields | Row: icon circle + label/value + chevron, taps open the date picker |
| Submit | **Fixed bottom bar**, full-width **gradient** button (pink/red for expense/borrowed, green for income/lent) |
| Recurring (expense) | Toggle row with icon circle + subtitle; when on, frequency shown as pills |

Gradients are kept (confirmed): pink/red for expense & borrowed, green for income & lent.

## Approach

**Shared presentational kit + rewrite each form's body.**

New directory: `client/src/components/form/`

| Component | Purpose | Key props |
|---|---|---|
| `AmountHero` | Gradient card, big number input, optional meta/date-chip slot | `value`, `onChange`, `variant`, `currencySymbol`, `label`, `error`, `disabled`, `children` (meta slot) |
| `SegmentedToggle` | Two-option animated pill | `value`, `onChange`, `options: [{value,label,icon,activeColor}]` |
| `SectionLabel` | Uppercase tracked muted label | `children` |
| `FieldCard` | Rounded bordered card wrapper | `children`, `className`, `as` |
| `IconRow` | Icon-circle + label/value + chevron trigger | `icon`, `iconColor`, `label`, `value`, `onClick` |
| `StickyFormFooter` | Fixed-bottom full-width gradient submit bar | `variant`, `loading`, `label`, `loadingLabel`, `onCancel?` |
| `CategoryChips` | Horizontal-scroll color-dot chips + checkmark | `categories`, `value`, `onChange`, `onCreateClick?` |

A `GRADIENTS` map lives in the kit (single source of truth):

```
expense / borrowed : from-[#c71852] to-[#ea2261]
income  / lent     : from-[#059669] to-[#10b981]
neutral / primary  : from-[#4434d4] to-[#6366f1]   // category form submit, generic
```

Tailwind arbitrary-value gradient utilities — no new dependencies.

### Rejected alternatives

- **Restyle in place, no kit** — hero card / sticky footer / section labels copy-pasted 3×, guaranteed drift.
- **Config-driven `<MobileForm schema>` renderer** — three forms don't justify a form engine (YAGNI).

## Architecture & data flow

```
Expenses.jsx  ─┐
DebtForm.jsx  ─┼─► compose ─► form/{AmountHero, SegmentedToggle, SectionLabel,
Categories.jsx ┘              FieldCard, IconRow, StickyFormFooter, CategoryChips}
                             (all presentational: value in, callbacks out)
```

- No new state management, no new context. Every primitive is controlled.
- Each form's existing state shape, `handleSubmit`, validation, and service calls are **unchanged**. Only the JSX presentation layer is rewritten.

### Container consolidation

All three forms use the existing `client/src/components/Modal.jsx`:

- `Modal` already renders as a bottom sheet on mobile and a centered panel on desktop, with a flex column: header (flex-shrink-0) / scroll body (flex-1 overflow-y-auto) / — footer slot goes here.
- `DebtForm`'s hand-rolled `Dialog`/`Transition` is removed; `DebtForm` renders its body inside `Modal`.
- The inline Category form block in `Categories.jsx` moves into a `Modal` (state `showForm` already exists; the page just stops rendering the inline `glass-card` and renders `<Modal>` instead).
- `StickyFormFooter` sits as the last child of the form's flex column with `flex-shrink-0`, matching the structure the Expense form already uses for its actions row.

The Expense form modal today sets `h-[600px] max-h-full` on the `<form>`; keep that pattern so the sticky footer has a bounded column to anchor to.

## Error handling

- Validation stays in each form's `handleSubmit` (unchanged).
- `AmountHero` takes an `error` prop → red ring + message below (mirrors mobile `inputError`).
- `StickyFormFooter` takes `loading` → spinner + disabled button (same as current behavior).
- `AmountHero` takes `disabled` for the Debt edit case (amount not editable after creation) — shows the existing "cannot be changed" note as `children`.

## Per-form composition

### Expense form (`Expenses.jsx`)

- `AmountHero variant={type}` — big amount input; date chip rendered in the meta slot, opens existing `DatePicker`.
- `SegmentedToggle` — Expense / Income (icons `ArrowDownCircle` / `ArrowUpCircle`).
- `SectionLabel "Category"` + `CategoryChips` (replaces `CategorySelector` **in this form only**).
- `SectionLabel "Notes (optional)"` + `FieldCard` wrapping the description input.
- Recurring: toggle row (`FieldCard` + checkbox styled as switch) + subtitle; when on, `SectionLabel "Frequency"` + pill buttons (weekly/monthly/yearly — web's existing option set) + `IconRow` for end date opening `DatePicker`.
- `StickyFormFooter variant={type}` — "Add" / "Update", loading → "Adding…" / "Updating…".

### Debt form (`DebtForm.jsx`)

- Move into `Modal` (remove local Dialog).
- `AmountHero variant={type}` (`borrowed` → pink, `lent` → green); `disabled` + note when `editDebt`.
- `SegmentedToggle` — "I Borrowed" / "I Lent" — hidden when editing (matches mobile).
- `SectionLabel "Person Name"` + `FieldCard` input.
- `IconRow` × 2 for Date and Due Date (optional), each opening `DatePicker`.
- `SectionLabel "Notes (optional)"` + `FieldCard` textarea.
- `StickyFormFooter variant={type}` — "Save Record" / "Update Record".

### Category form (`Categories.jsx`)

- Move into `Modal` (remove inline `glass-card` block).
- No amount → no `AmountHero`. Optional: a small preview chip showing the chosen icon on the chosen color at the top.
- `SectionLabel "Category Name"` + `FieldCard` input.
- `SectionLabel "Icon"` + existing emoji grid (kept; spacing tuned to match).
- `SectionLabel "Color"` + existing swatch grid (kept).
- `StickyFormFooter variant="neutral"` — "Add Category" / "Update Category".

## Testing

- `client/` has no test runner configured. Deliverable instead:
  - `client/src/components/form/Showcase.jsx` — a dev-only page (route `/dev/form-kit`, gated so it is trivial to remove) rendering every primitive in light and dark, expense/income/borrowed/lent variants, loading and error states.
  - `npx vite build` must pass.
- Manual verification checklist (run before claiming done):
  - Each form: open (add), submit a valid record, confirm it persists.
  - Each form: open in edit mode, change a field, save, confirm update.
  - Expense: recurring on → frequency + end date visible and submitted.
  - Debt edit: amount field disabled with note.
  - Validation: submit empty required field → error shown, no submit.
  - Desktop (centered modal) and mobile-emulated (bottom sheet, coarse pointer): sticky footer visible, body scrolls under it, category chips scroll horizontally.
  - Both themes.

## Scope boundaries

**In scope**

- Presentation rewrite of Add/Edit Expense, Add/Edit Debt, Add/Edit Category.
- Moving Debt form and Category form into `Modal`.
- New `client/src/components/form/` kit + dev showcase page.

**Out of scope**

- List pages, Dashboard, Analytics.
- Debt "repay / record payment" flow (web has no repay UI today; not adding it).
- Haptics (no web equivalent).
- Offline/sync behavior.
- `CategorySelector` — keeps working at all its other call sites (`BudgetForm.jsx`,
  `BulkEditList.jsx`, `AnalyticsDashboard.jsx`); only the expense Add/Edit form
  swaps to `CategoryChips`.

## Files touched (anticipated)

- New: `client/src/components/form/AmountHero.jsx`, `SegmentedToggle.jsx`,
  `SectionLabel.jsx`, `FieldCard.jsx`, `IconRow.jsx`, `StickyFormFooter.jsx`,
  `CategoryChips.jsx`, `gradients.js`, `Showcase.jsx`
- Edit: `client/src/pages/Expenses.jsx` (form body only)
- Edit: `client/src/components/DebtForm.jsx` (container + body)
- Edit: `client/src/pages/Debts.jsx` (prop wiring if `DebtForm` signature changes)
- Edit: `client/src/pages/Categories.jsx` (inline form → `Modal`)
- Edit: `client/src/App.jsx` (dev showcase route)
