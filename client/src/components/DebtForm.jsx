import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserIcon, CurrencyDollarIcon, CalendarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useDebt } from '../context/DebtContext';
import { Fragment } from 'react';
import { useAuth } from '../context/AuthContext'
import DatePicker from './DatePicker'


export default function DebtForm({ isOpen, onClose, editDebt = null, type = 'borrowed' }) {
    const { addDebt, updateDebt } = useDebt();
    const { currency } = useAuth();
    const currencySymbols = {
        USD: '$',
        EUR: '€',
        INR: '₹',
        GBP: '£',
        JPY: '¥',
        CNY: '¥',
        CAD: 'C$',
        AUD: 'A$'
    }
    const [formData, setFormData] = useState({
        personName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: '',
        type: type
    });
    const [loading, setLoading] = useState(false);

    const currencySymbol = currencySymbols[currency] || '$';

    useEffect(() => {
        if (editDebt) {
            setFormData({
                personName: editDebt.personName,
                amount: editDebt.amount,
                date: editDebt.date,
                dueDate: editDebt.dueDate || '',
                notes: editDebt.notes || '',
                type: editDebt.type
            });
        } else {
            setFormData(prev => ({ ...prev, type }));
        }
    }, [editDebt, type]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = editDebt
            ? await updateDebt(editDebt._id, formData)
            : await addDebt(formData);

        setLoading(false);

        if (result.success) {
            onClose();
            if (!editDebt) {
                setFormData({
                    personName: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    dueDate: '',
                    notes: '',
                    type: type
                });
            }
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                                {/* Header */}
                                <div className={`px-6 py-5 ${type === 'borrowed' ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-teal-500'}`}>
                                    <div className="flex items-center justify-between">
                                        <Dialog.Title className="text-xl font-semibold text-white flex items-center gap-2">
                                            <CurrencyDollarIcon className="h-6 w-6" />
                                            {editDebt ? 'Edit Debt Record' : `Add ${type === 'borrowed' ? 'Borrowed' : 'Lent'} Money`}
                                        </Dialog.Title>
                                        <button
                                            onClick={onClose}
                                            className="rounded-lg p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                                        >
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                    <p className="mt-1 text-sm text-white/90">
                                        {type === 'borrowed' ? 'Track money you owe to others' : 'Track money others owe to you'}
                                    </p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                                    {/* Person Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                            <UserIcon className="h-4 w-4 inline mr-1.5" />
                                            Person Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.personName}
                                            onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                                            className="block w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all sm:text-sm"
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                            <CurrencyDollarIcon className="h-4 w-4 inline mr-1.5" />
                                            Amount
                                        </label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                <span className="text-gray-500 dark:text-gray-400 font-medium">{currencySymbol}</span>
                                            </div>
                                            <input
                                                type="number"
                                                required
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                className="block w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                                placeholder="0"
                                                disabled={!!editDebt}
                                            />
                                        </div>
                                        {editDebt && (
                                            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                Amount cannot be changed after creation
                                            </p>
                                        )}
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                                <CalendarIcon className="h-4 w-4 inline mr-1.5" />
                                                Date
                                            </label>
                                            <DatePicker
                                                value={formData.date}
                                                onChange={(date) => setFormData({ ...formData, date })}
                                                placeholder="Select date"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                                Due Date
                                                <span className="text-xs font-normal text-gray-500 ml-1">(Optional)</span>
                                            </label>
                                            <DatePicker
                                                value={formData.dueDate}
                                                onChange={(date) => setFormData({ ...formData, dueDate: date })}
                                                placeholder="Select due date"
                                            />
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                            <DocumentTextIcon className="h-4 w-4 inline mr-1.5" />
                                            Notes
                                            <span className="text-xs font-normal text-gray-500 ml-1">(Optional)</span>
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="block w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all sm:text-sm resize-none"
                                            placeholder="Add any additional details..."
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${type === 'borrowed'
                                                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 focus:ring-red-500'
                                                : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 focus:ring-green-500'
                                                }`}
                                        >
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </span>
                                            ) : (
                                                editDebt ? 'Update Record' : 'Save Record'
                                            )}
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
