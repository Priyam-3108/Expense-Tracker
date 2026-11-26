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
            <SectionLabel>Person name</SectionLabel>
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
              <SectionLabel>Due date (optional)</SectionLabel>
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
          label={editDebt ? 'Save changes' : 'Save'}
          loadingLabel="Saving…"
          onCancel={onClose}
        />
      </form>
    </Modal>
  );
}
