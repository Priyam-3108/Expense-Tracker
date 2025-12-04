import { useState } from 'react';
import { PencilIcon, TrashIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { useDebt } from '../context/DebtContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import DebtForm from './DebtForm';
import RepaymentModal from './RepaymentModal';

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
        return (
            <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">No {type} records found.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Person
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Remaining
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {debts.map((debt) => (
                        <tr key={debt._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{debt.personName}</div>
                                {debt.notes && <div className="text-xs text-gray-500 dark:text-gray-400">{debt.notes}</div>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                    {formatCurrency(debt.amount, currency)}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(debt.currentAmount, currency)}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500 dark:text-gray-400">{debt.date}</div>
                                {debt.dueDate && (
                                    <div className={`text-xs ${new Date(debt.dueDate) < new Date() && debt.status !== 'paid' ? 'text-red-500' : 'text-gray-400'}`}>
                                        Due: {debt.dueDate}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${debt.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                        debt.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                    {debt.status.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                    {debt.status !== 'paid' && (
                                        <button
                                            onClick={() => setRepaymentDebt(debt)}
                                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                            title="Record Payment"
                                        >
                                            <BanknotesIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setEditingDebt(debt)}
                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                        title="Edit"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(debt._id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
