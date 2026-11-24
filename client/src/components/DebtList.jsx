import { useState } from 'react';
import { PencilIcon, TrashIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { Wallet } from 'lucide-react';
import { useDebt } from '../context/DebtContext';
import { useAuth } from '../context/AuthContext';
import Amount from './Amount';
import DebtForm from './DebtForm';
import RepaymentModal from './RepaymentModal';
import EmptyState from './EmptyState';

export default function DebtList({ debts, type }) {
    const { deleteDebt } = useDebt();
    const { currency } = useAuth();
    const [editingDebt, setEditingDebt] = useState(null);
    const [repaymentDebt, setRepaymentDebt] = useState(null);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            await deleteDebt(id);
        }
    };

    if (!debts.length) {
        const debtType = type === 'borrowed' ? 'money you borrowed' : 'money you lent';
        return (
            <EmptyState
                icon={Wallet}
                title={`No ${type} records`}
                description={`Keep track of ${debtType} — they will appear here.`}
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/[0.05]">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#a1a1a6]">
                            Person
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#a1a1a6]">
                            Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#a1a1a6]">
                            Remaining
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#a1a1a6]">
                            Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#a1a1a6]">
                            Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#a1a1a6]">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-white/[0.05]">
                    {debts.map((debt) => (
                        <tr key={debt._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{debt.personName}</div>
                                {debt.notes && <div className="text-xs text-gray-500 dark:text-[#a1a1a6]">{debt.notes}</div>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                    <Amount value={debt.amount} currency={currency} className="font-mono tabular-nums" />
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    <Amount value={debt.currentAmount} currency={currency} className="font-mono tabular-nums" />
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500 dark:text-[#a1a1a6]">{debt.date}</div>
                                {debt.dueDate && (
                                    <div className={`text-xs ${new Date(debt.dueDate) < new Date() && debt.status !== 'paid' ? 'text-red-500' : 'text-gray-400'}`}>
                                        Due: {debt.dueDate}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full 
                  ${debt.status === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' :
                                        debt.status === 'partially_paid' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' :
                                            'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'}`}>
                                    {debt.status.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                    {debt.status !== 'paid' && (
                                        <button
                                            onClick={() => setRepaymentDebt(debt)}
                                            className="text-gray-400 hover:text-gray-900 dark:text-[#85858b] dark:hover:text-[#ededed] transition-colors"
                                            title="Record Payment"
                                        >
                                            <BanknotesIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setEditingDebt(debt)}
                                        className="text-gray-400 hover:text-gray-900 dark:text-[#85858b] dark:hover:text-[#ededed] transition-colors"
                                        title="Edit"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(debt._id)}
                                        className="text-gray-400 hover:text-red-600 dark:text-[#85858b] dark:hover:text-[#e5484d] transition-colors"
                                        title="Delete"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editingDebt && (
                <DebtForm
                    isOpen={!!editingDebt}
                    onClose={() => setEditingDebt(null)}
                    editDebt={editingDebt}
                    type={type}
                />
            )}

            {repaymentDebt && (
                <RepaymentModal
                    isOpen={!!repaymentDebt}
                    onClose={() => setRepaymentDebt(null)}
                    debt={repaymentDebt}
                />
            )}
        </div>
    );
}
