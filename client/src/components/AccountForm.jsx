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
