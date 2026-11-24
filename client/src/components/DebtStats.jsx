import { useAuth } from '../context/AuthContext';
import Amount from './Amount';

export default function DebtStats({ debts }) {
    const { currency } = useAuth();
    const borrowed = debts.filter(d => d.type === 'borrowed');
    const lent = debts.filter(d => d.type === 'lent');

    const totalPayable = borrowed.reduce((sum, d) => sum + d.currentAmount, 0);
    const totalReceivable = lent.reduce((sum, d) => sum + d.currentAmount, 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="glass-card p-5">
                <p className="text-sm text-gray-600 dark:text-[#a1a1a6]">You owe</p>
                <p className="mt-2 text-xl md:text-2xl leading-none font-mono font-medium tabular-nums text-gray-900 dark:text-[#ededed]">
                    <Amount value={totalPayable} currency={currency} />
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-[#85858b]">{borrowed.filter(d => d.status !== 'paid').length} active debts</p>
            </div>

            <div className="glass-card p-5">
                <p className="text-sm text-gray-600 dark:text-[#a1a1a6]">Owed to you</p>
                <p className="mt-2 text-xl md:text-2xl leading-none font-mono font-medium tabular-nums text-gray-900 dark:text-[#ededed]">
                    <Amount value={totalReceivable} currency={currency} />
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-[#85858b]">{lent.filter(d => d.status !== 'paid').length} active loans</p>
            </div>
        </div>
    );
}
