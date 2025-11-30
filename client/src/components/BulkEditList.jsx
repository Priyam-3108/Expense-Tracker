import { useState, useEffect } from 'react'
import { ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react'
import DatePicker from './DatePicker'
import CategorySelector from './CategorySelector'
import { formatCurrency, formatDateForInput } from '../utils/helpers'

const BulkEditList = ({ expenses, categories, currency, onExpensesChange }) => {
    const [editableExpenses, setEditableExpenses] = useState([])

    // Initialize editable expenses from props
    useEffect(() => {
        if (expenses && expenses.length > 0) {
            setEditableExpenses(
                expenses.map(exp => ({
                    _id: exp._id,
                    type: exp.type,
                    date: exp.date ? (typeof exp.date === 'string' ? exp.date.split('T')[0] : formatDateForInput(exp.date)) : '',
                    category: exp.category?._id || exp.category || '',
                    description: exp.description || '',
                    amount: exp.amount || ''
                }))
            )
        }
    }, [expenses])

    // Notify parent of changes
    useEffect(() => {
        onExpensesChange(editableExpenses)
    }, [editableExpenses, onExpensesChange])

    const updateExpense = (index, field, value) => {
        const updated = [...editableExpenses]
        updated[index] = { ...updated[index], [field]: value }
        setEditableExpenses(updated)
    }

    const toggleType = (index) => {
        const currentType = editableExpenses[index].type
        updateExpense(index, 'type', currentType === 'expense' ? 'income' : 'expense')
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-1 text-center">Type</div>
                <div className="col-span-3">Date</div>
                <div className="col-span-3">Category</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Amount</div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {editableExpenses.map((expense, index) => (
                    <div
                        key={expense._id}
                        className="grid grid-cols-12 gap-3 items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                    >
                        {/* Type Toggle */}
                        <div className="col-span-1 flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={() => toggleType(index)}
                                className={`transition-transform hover:scale-110 ${expense.type === 'income'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                    }`}
                                title={`Switch to ${expense.type === 'expense' ? 'Income' : 'Expense'}`}
                            >
                                {expense.type === 'income' ? (
                                    <ArrowUpCircle size={24} />
                                ) : (
                                    <ArrowDownCircle size={24} />
                                )}
                            </button>
                        </div>

                        {/* Date */}
                        <div className="col-span-3">
                            <DatePicker
                                value={expense.date}
                                onChange={(date) => updateExpense(index, 'date', date)}
                                placeholder="Select date"
                                className="text-sm"
                            />
                        </div>

                        {/* Category */}
                        <div className="col-span-3">
                            <CategorySelector
                                value={expense.category}
                                onChange={(categoryId) => updateExpense(index, 'category', categoryId)}
                                placeholder="Category"
                                small
                            />
                        </div>

                        {/* Description */}
                        <div className="col-span-3">
                            <input
                                type="text"
                                value={expense.description}
                                onChange={(e) => updateExpense(index, 'description', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Description"
                            />
                        </div>

                        {/* Amount */}
                        <div className="col-span-2">
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs">
                                    {currency === 'USD' ? '$' : currency}
                                </span>
                                <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    value={expense.amount}
                                    onChange={(e) => updateExpense(index, 'amount', e.target.value)}
                                    className="w-full pl-9 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default BulkEditList
