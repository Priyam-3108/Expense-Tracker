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
