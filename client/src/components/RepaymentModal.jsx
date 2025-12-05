import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, BanknotesIcon, CalendarIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useDebt } from '../context/DebtContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import DatePicker from './DatePicker';

export default function RepaymentModal({ isOpen, onClose, debt }) {
    const { addRepayment } = useDebt();
    const { currency } = useAuth();
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const currencySymbols = {
        USD: '$',
        EUR: '€',
        INR: '₹',
        GBP: '£',
        JPY: '¥',
        CNY: '¥',
        CAD: 'C$',
        AUD: 'A$'
    };

    const currencySymbol = currencySymbols[currency] || '$';

    if (!debt) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await addRepayment(debt._id, {
            amount,
            date,
            note
        });

        setLoading(false);

        if (result.success) {
            onClose();
            setAmount('');
            setNote('');
        }
    };

    const percentagePaid = debt.amount > 0 ? ((debt.amount - debt.currentAmount) / debt.amount) * 100 : 0;

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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-5">
                                    <div className="flex items-center justify-between">
                                        <Dialog.Title className="text-xl font-semibold text-white flex items-center gap-2">
                                            <BanknotesIcon className="h-6 w-6" />
                                            Record Repayment
                                        </Dialog.Title>
                                        <button
                                            onClick={onClose}
                                            className="rounded-lg p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                                        >
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                    <p className="mt-1 text-sm text-white/90">
                                        Record a payment for {debt.personName}
                                    </p>
                                </div>

                                {/* Debt Summary */}
                                <div className="px-6 py-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Amount</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                                {formatCurrency(debt.amount, currency)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Remaining</p>
                                            <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                                                {formatCurrency(debt.currentAmount, currency)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Payment Progress</span>
                                            <span className="text-xs font-semibold text-green-600 dark:text-green-400">{percentagePaid.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                            <div
                                                className="bg-gradient-to-r from-green-500 to-teal-500 h-2.5 rounded-full transition-all duration-500"
                                                style={{ width: `${percentagePaid}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                                    {/* Payment Amount */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                            <BanknotesIcon className="h-4 w-4 inline mr-1.5" />
                                            Payment Amount
                                        </label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                                <span className="text-gray-500 dark:text-gray-400 font-medium">{currencySymbol}</span>
                                            </div>
                                            <input
                                                type="number"
                                                required
                                                max={debt.currentAmount}
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="block w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all sm:text-sm"
                                                placeholder="0"
                                            />
                                        </div>
                                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                            Maximum: {formatCurrency(debt.currentAmount, currency)}
                                        </p>
                                    </div>

                                    {/* Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                            <CalendarIcon className="h-4 w-4 inline mr-1.5" />
                                            Payment Date
                                        </label>
                                        <DatePicker
                                            value={date}
                                            onChange={(newDate) => setDate(newDate)}
                                            placeholder="Select payment date"
                                        />
                                    </div>

                                    {/* Note */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                            <DocumentTextIcon className="h-4 w-4 inline mr-1.5" />
                                            Note
                                            <span className="text-xs font-normal text-gray-500 ml-1">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            className="block w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all sm:text-sm"
                                            placeholder="e.g., Cash payment, Bank transfer..."
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
                                            className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <CheckCircleIcon className="h-4 w-4" />
                                                    Confirm Payment
                                                </span>
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
