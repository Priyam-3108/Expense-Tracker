import { useAuth } from '../context/AuthContext';
import Amount from './Amount';

const Card = ({ label, value, meta, tone, onClick, active, currency }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={!!active}
        className={`glass-card p-4 sm:p-5 text-left transition-colors hover:border-gray-300 dark:hover:border-white/[0.14] focus:outline-none focus-visible:ring-2 focus-visible:ring-brass/50 ${active ? 'ring-1 ring-brass/50' : ''}`}
    >
        <p className="text-sm text-gray-600 dark:text-[#a1a1a6]">{label}</p>
        <p className={`mt-2 text-xl md:text-2xl leading-none font-medium tabular-nums truncate ${tone}`}>
            <Amount value={value} currency={currency} />
        </p>
        <p className="mt-2 text-xs text-gray-500 dark:text-[#85858b]">{meta}</p>
    </button>
);

// s = summary computed in Debts.jsx; clicking a card applies the matching filter.
export default function DebtStats({ s, view, onPick }) {
    const { currency } = useAuth();
    const base = 'text-gray-900 dark:text-[#ededed]';
    const plural = (n) => `${n} record${n === 1 ? '' : 's'}`;
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card currency={currency} label="Owed to you" value={s.receivable} tone={base}
                meta={`${s.lentActive} pending`} active={view.type === 'lent' && !view.quick} onClick={() => onPick({ type: 'lent', quick: '' })} />
            <Card currency={currency} label="You owe" value={s.payable} tone={base}
                meta={`${s.borrowedActive} pending`} active={view.type === 'borrowed' && !view.quick} onClick={() => onPick({ type: 'borrowed', quick: '' })} />
            <Card currency={currency} label="Overdue" value={s.overdueAmount} tone={s.overdueCount ? 'text-red-600 dark:text-[#e5484d]' : base}
                meta={plural(s.overdueCount)} active={view.quick === 'overdue'} onClick={() => onPick({ type: 'all', quick: 'overdue' })} />
            <Card currency={currency} label="Due in 7 days" value={s.weekAmount} tone={base}
                meta={plural(s.weekCount)} active={view.quick === 'week'} onClick={() => onPick({ type: 'all', quick: 'week' })} />
        </div>
    );
}
