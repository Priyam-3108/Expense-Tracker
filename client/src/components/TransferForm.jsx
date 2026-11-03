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
