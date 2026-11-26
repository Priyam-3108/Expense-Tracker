import { Pencil, Trash2, Banknote, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Amount from './Amount';
import EmptyState from './EmptyState';

const dueInfo = (debt, today) => {
    if (!debt.dueDate || debt.status === 'paid') return null;
    const days = Math.round((new Date(debt.dueDate) - new Date(today)) / 86400000);
    if (days < 0) return { text: `Overdue by ${-days}d`, cls: 'text-red-600 dark:text-[#e5484d]' };
    if (days === 0) return { text: 'Due today', cls: 'text-brass-700 dark:text-brass' };
    if (days <= 7) return { text: `Due in ${days}d`, cls: 'text-brass-700 dark:text-brass' };
    return { text: `Due ${debt.dueDate}`, cls: '' };
};

const iconBtn = 'p-2.5 rounded-lg text-gray-400 dark:text-[#85858b] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brass/50';

export default function DebtList({ debts, today, onRecord, onEdit, onDelete, onAdd, filtered }) {
    const { currency } = useAuth();

    if (!debts.length) {
        return (
            <EmptyState
                icon={Wallet}
                title={filtered ? 'No records match' : 'No records yet'}
                description={filtered ? 'Try clearing a filter or the search.' : 'Track money you lend or borrow — it will show up here.'}
                actionLabel={filtered ? undefined : 'I lent money'}
                onAction={filtered ? undefined : onAdd}
            />
        );
    }

    return (
        <ul className="divide-y divide-gray-200 dark:divide-white/[0.06]">
            {debts.map((d) => {
                const lent = d.type === 'lent';
                const paid = d.status === 'paid';
                const due = dueInfo(d, today);
                const pct = d.amount > 0 ? Math.min(100, ((d.amount - d.currentAmount) / d.amount) * 100) : 0;
                return (
                    <li key={d._id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                                className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-medium bg-gray-100 text-gray-700 dark:bg-[#232325] dark:text-[#a1a1a6]`}
                                aria-hidden="true"
                            >
                                {d.personName.trim().charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-[#ededed] truncate">{d.personName}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-[#85858b]">
                                    <span>{lent ? 'Lent' : 'Borrowed'} <span className="font-mono">{d.date}</span></span>
                                    {due && <span className={due.cls}>· {due.text}</span>}
                                    {paid && <span>· Settled</span>}
                                </div>
                                {d.notes && <p className="mt-1 text-xs text-gray-500 dark:text-[#85858b] truncate">{d.notes}</p>}
                            </div>
                        </div>

                        <div className="sm:w-48 sm:text-right">
                            <p className={`text-base font-medium tabular-nums ${paid ? 'text-gray-400 dark:text-[#85858b]' : 'text-gray-900 dark:text-[#ededed]'}`}>
                                <Amount value={paid ? d.amount : d.currentAmount} currency={currency} />
                            </p>
                            {!paid && d.currentAmount !== d.amount && (
                                <>
                                    <div
                                        className="mt-2 h-1 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden"
                                        role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Repaid"
                                    >
                                        <div className="h-full rounded-full bg-brass" style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-[#85858b]">
                                        <Amount value={d.amount - d.currentAmount} currency={currency} /> of <Amount value={d.amount} currency={currency} /> {lent ? 'received' : 'paid'}
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-1 sm:justify-end">
                            {!paid && (
                                <button onClick={() => onRecord(d)} className="btn-secondary min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 px-3 text-sm mr-1 flex-1 sm:flex-none justify-center">
                                    <Banknote size={16} strokeWidth={1.5} aria-hidden="true" />
                                    {lent ? 'Received' : 'Paid'}
                                </button>
                            )}
                            <button onClick={() => onEdit(d)} className={iconBtn} aria-label={`Edit ${d.personName}`}><Pencil size={18} strokeWidth={1.5} /></button>
                            <button onClick={() => onDelete(d._id)} className={`${iconBtn} hover:text-red-600 dark:hover:text-[#e5484d]`} aria-label={`Delete ${d.personName}`}><Trash2 size={18} strokeWidth={1.5} /></button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
