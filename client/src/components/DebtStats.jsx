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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Payable</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                            {formatCurrency(totalPayable, currency)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{borrowed.filter(d => d.status !== 'paid').length} active debts</p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <ArrowTrendingDownIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Receivable</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                            {formatCurrency(totalReceivable, currency)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{lent.filter(d => d.status !== 'paid').length} active loans</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <ArrowTrendingUpIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                </div>
            </div>
        </div>
    );
}
