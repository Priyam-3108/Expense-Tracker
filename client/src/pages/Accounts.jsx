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
