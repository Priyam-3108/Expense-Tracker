import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useBudget } from '../context/BudgetContext';
import BudgetList from '../components/BudgetList';
import BudgetForm from '../components/BudgetForm';

export default function Budgets() {
    const { budgets, loading } = useBudget();
    const [isFormOpen, setIsFormOpen] = useState(false);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Set monthly spending limits and track your progress</p>
                </div>
                <button onClick={() => setIsFormOpen(true)} className="btn-primary btn-md inline-flex items-center">
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add Budget
                </button>
            </div>

            <BudgetList budgets={budgets || []} />

            <BudgetForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
        </div>
    );
}
