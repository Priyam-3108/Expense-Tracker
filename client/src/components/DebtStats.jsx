import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';

export default function DebtStats({ debts }) {
    const { currency } = useAuth();
    const borrowed = debts.filter(d => d.type === 'borrowed');
    const lent = debts.filter(d => d.type === 'lent');

    const totalPayable = borrowed.reduce((sum, d) => sum + d.currentAmount, 0);
    const totalReceivable = lent.reduce((sum, d) => sum + d.currentAmount, 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="glass-card p-6 border-l-2 border-l-rose-500/50">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Payable</p>
                        <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                            {formatCurrency(totalPayable, currency)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{borrowed.filter(d => d.status !== 'paid').length} active debts</p>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
                        <ArrowTrendingDownIcon className="w-6 h-6 text-rose-500 dark:text-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.3)]" />
                    </div>
                </div>
            </div>

            <div className="glass-card p-6 border-l-2 border-l-emerald-500/50">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Receivable</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {formatCurrency(totalReceivable, currency)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{lent.filter(d => d.status !== 'paid').length} active loans</p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                        <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
