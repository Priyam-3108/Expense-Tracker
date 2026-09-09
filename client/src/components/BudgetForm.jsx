import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CurrencyDollarIcon, TagIcon } from '@heroicons/react/24/outline';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import CategorySelector from './CategorySelector';

const currencySymbols = { USD: '$', EUR: '€', INR: '₹', GBP: '£', JPY: '¥', CNY: '¥', CAD: 'C$', AUD: 'A$' };

export default function BudgetForm({ isOpen, onClose, editBudget = null }) {
    const { addBudget, updateBudget } = useBudget();
    const { currency } = useAuth();
    const currencySymbol = currencySymbols[currency] || '$';

    const [overall, setOverall] = useState(editBudget ? !editBudget.category : true);
    const [category, setCategory] = useState(editBudget?.category?._id || editBudget?.category || '');
    const [amount, setAmount] = useState(editBudget?.amount ?? '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!overall && !category) return;

        setLoading(true);
        const result = editBudget
            ? await updateBudget(editBudget._id, { amount: Number(amount) })
            : await addBudget({ amount: Number(amount), category: overall ? null : category });
        setLoading(false);

        if (result.success) {
            onClose();
            setOverall(true);
            setCategory('');
            setAmount('');
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 glass-modal-backdrop" />
                </Transition.Child>

                <div className="fixed inset-0 flex flex-col justify-end md:justify-center md:items-center md:p-4">
                    <div className="w-full md:max-w-lg">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-full md:translate-y-4" enterTo="opacity-100 translate-y-0" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-full md:translate-y-4">
                            <Dialog.Panel className="glass-modal-panel w-full transform overflow-y-auto rounded-t-2xl md:rounded-xl transition-all" style={{ maxHeight: '95vh' }}>
                                <div className="px-6 py-5 rounded-t-2xl md:rounded-t-xl bg-[#533afd]">
                                    <div className="flex items-center justify-between">
                                        <Dialog.Title className="text-xl font-semibold text-white flex items-center gap-2">
                                            <CurrencyDollarIcon className="h-6 w-6" />
                                            {editBudget ? 'Edit Budget' : 'Set a Budget'}
                                        </Dialog.Title>
                                        <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <p className="mt-1 text-sm text-white/90">Set a monthly spending limit and track your progress</p>
                                </div>

                                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                                    {!editBudget && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                                <TagIcon className="h-4 w-4 inline mr-1.5" />
                                                Budget Type
                                            </label>
                                            <div className="flex gap-2 mb-3">
                                                <button type="button" onClick={() => setOverall(true)} className={`flex-1 btn-md ${overall ? 'btn-primary' : 'btn-secondary'}`}>
                                                    Overall
                                                </button>
                                                <button type="button" onClick={() => setOverall(false)} className={`flex-1 btn-md ${!overall ? 'btn-primary' : 'btn-secondary'}`}>
                                                    By Category
                                                </button>
                                            </div>
                                            {!overall && (
                                                <CategorySelector value={category} onChange={setCategory} placeholder="Select a category" />
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                            <CurrencyDollarIcon className="h-4 w-4 inline mr-1.5" />
                                            Monthly Amount
                                        </label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                <span className="text-gray-500 dark:text-gray-400 font-medium">{currencySymbol}</span>
                                            </div>
                                            <input
                                                type="number"
                                                required
                                                min="0.01"
                                                step="0.01"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="glass-input block w-full pl-10 pr-4 py-2.5"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-white/[0.06]">
                                        <button type="button" onClick={onClose} className="btn-secondary btn-md flex-1">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={loading || (!overall && !category && !editBudget)} className="flex-1 btn-primary btn-md">
                                            {loading ? 'Saving...' : editBudget ? 'Update Budget' : 'Save Budget'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
