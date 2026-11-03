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
