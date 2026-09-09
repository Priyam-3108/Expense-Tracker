import { useState } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Wallet } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import BudgetForm from './BudgetForm';
import EmptyState from './EmptyState';

const barColor = (percentUsed) => {
    if (percentUsed >= 100) return 'bg-rose-500';
    if (percentUsed >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
};

const textColor = (percentUsed) => {
    if (percentUsed >= 100) return 'text-rose-600 dark:text-rose-400';
    if (percentUsed >= 80) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
};

export default function BudgetList({ budgets }) {
    const { deleteBudget } = useBudget();
    const { currency } = useAuth();
    const [editingBudget, setEditingBudget] = useState(null);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this budget?')) {
            await deleteBudget(id);
        }
    };

    if (!budgets.length) {
        return (
            <EmptyState
                icon={Wallet}
                title="No budgets set"
                description="Set a monthly spending limit, overall or per category, to track how close you are to it."
            />
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map((budget) => {
                    const percent = Math.min(budget.percentUsed, 100);
                    const label = budget.category ? budget.category.name : 'Overall Budget';
                    const icon = budget.category ? budget.category.icon : '💰';
                    return (
                        <div key={budget._id} className="glass-card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-lg">{icon}</span>
                                    <span className="font-medium text-gray-900 dark:text-white truncate">{label}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => setEditingBudget(budget)}
                                        aria-label="Edit budget"
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(budget._id)}
                                        aria-label="Delete budget"
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-end justify-between mb-2">
                                <span className={`text-xl font-bold ${textColor(budget.percentUsed)}`}>
                                    {formatCurrency(budget.spent, currency)}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-slate-400">
                                    of {formatCurrency(budget.amount, currency)}
                                </span>
                            </div>

                            <div className="h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${barColor(budget.percentUsed)}`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>

                            <p className={`mt-2 text-xs ${textColor(budget.percentUsed)}`}>
                                {budget.percentUsed >= 100
                                    ? `Over budget by ${formatCurrency(Math.abs(budget.remaining), currency)}`
                                    : `${formatCurrency(budget.remaining, currency)} remaining (${budget.percentUsed}%)`}
                            </p>
                        </div>
                    );
                })}
            </div>

            {editingBudget && (
                <BudgetForm
                    isOpen={!!editingBudget}
                    onClose={() => setEditingBudget(null)}
                    editBudget={editingBudget}
                />
            )}
        </>
    );
}
