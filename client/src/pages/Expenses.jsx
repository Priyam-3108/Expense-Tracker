import { useState, useEffect, useMemo } from 'react'
import { useExpense } from '../context/ExpenseContext'
import { useAuth } from '../context/AuthContext'
import CategorySelector from '../components/CategorySelector'
import { formatCurrency, formatDate, formatDateForInput } from '../utils/helpers'
import {
  Plus, Edit, Trash2, Search, X,
  ArrowUpCircle, ArrowDownCircle, Layers
} from 'lucide-react'
import toast from 'react-hot-toast'

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

const Expenses = () => {
  const { user, currency } = useAuth()
  const {
    expenses,
    categories,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    loadExpenses
  } = useExpense()

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: formatDateForInput(new Date()),
    category: '',
    type: 'expense'
  })
  const [formLoading, setFormLoading] = useState(false)

  // Bulk form state
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [bulkDate, setBulkDate] = useState(formatDateForInput(new Date()))
  const [bulkExpenses, setBulkExpenses] = useState([
    { amount: '', category: '', description: '' }
  ])
  const [bulkLoading, setBulkLoading] = useState(false)

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  const summary = useMemo(() => {
    let totalExpenseAmount = 0
    let totalIncomeAmount = 0

    expenses.forEach((expense) => {
      if (expense.type === 'income') {
        totalIncomeAmount += expense.amount || 0
      } else {
        totalExpenseAmount += expense.amount || 0
      }
    })

    return {
      totalExpenseAmount,
      totalIncomeAmount,
      netAmount: totalIncomeAmount - totalExpenseAmount
    }
  }, [expenses])

  const { totalExpenseAmount, totalIncomeAmount, netAmount } = summary

  // Reset form when editing changes
  useEffect(() => {
    if (editingExpense) {
      const expenseDate = editingExpense.date 
        ? (typeof editingExpense.date === 'string' 
          ? editingExpense.date.split('T')[0] 
          : formatDateForInput(new Date(editingExpense.date)))
        : formatDateForInput(new Date())

      setFormData({
        description: editingExpense.description || '',
        amount: editingExpense.amount?.toString() || '',
        date: expenseDate,
        category: editingExpense.category?._id || editingExpense.category || '',
        type: editingExpense.type || 'expense'
      })
      setShowForm(true)
    } else {
      resetForm()
    }
  }, [editingExpense])

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      date: formatDateForInput(new Date()),
      category: '',
      type: 'expense'
    })
    setEditingExpense(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!formData.category) {
      toast.error('Please select a category')
      return
    }

    if (!formData.date) {
      toast.error('Please select a date')
      return
    }

    setFormLoading(true)
    try {
      const expenseData = {
        description: formData.description ? formData.description.trim() : '',
        amount: parseFloat(formData.amount),
        date: formData.date,
        category: formData.category,
        type: formData.type
      }

      if (editingExpense) {
        const result = await updateExpense(editingExpense._id, expenseData)
        if (result.success) {
          setShowForm(false)
          resetForm()
        }
      } else {
        const result = await addExpense(expenseData)
        if (result.success) {
          setShowForm(false)
          resetForm()
        }
      }
    } catch (error) {
      console.error('Error saving expense:', error)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
  }

  const handleDelete = async (expense) => {
    if (window.confirm(`Are you sure you want to delete "${expense.description}"? This action cannot be undone.`)) {
      try {
        await deleteExpense(expense._id)
      } catch (error) {
        console.error('Error deleting expense:', error)
      }
    }
  }

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(expense => {
        const matchesSearch = !searchTerm || 
          expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = filterType === 'all' || expense.type === filterType
        return matchesSearch && matchesType
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [expenses, searchTerm, filterType])

  const clearFilters = () => {
    setSearchTerm('')
    setFilterType('all')
  }

  const resetBulkForm = () => {
    setBulkDate(formatDateForInput(new Date()))
    setBulkExpenses([{ amount: '', category: '', description: '' }])
  }

  const addBulkRow = () => {
    setBulkExpenses([...bulkExpenses, { amount: '', category: '', description: '' }])
  }

  const removeBulkRow = (index) => {
    if (bulkExpenses.length > 1) {
      setBulkExpenses(bulkExpenses.filter((_, i) => i !== index))
    }
  }

  const updateBulkRow = (index, field, value) => {
    const updated = [...bulkExpenses]
    updated[index] = { ...updated[index], [field]: value }
    setBulkExpenses(updated)
  }

  const handleBulkSubmit = async (e) => {
    e.preventDefault()

    // Validate all rows
    const validExpenses = bulkExpenses.filter(
      row => row.amount && parseFloat(row.amount) > 0 && row.category
    )

    if (validExpenses.length === 0) {
      toast.error('Please add at least one valid expense')
      return
    }

    setBulkLoading(true)
    try {
      const { expenseService } = await import('../services/expenseService')
      const response = await expenseService.bulkCreateExpenses({
        date: bulkDate,
        expenses: validExpenses.map(expense => ({
          description: expense.description?.trim() || '',
          amount: parseFloat(expense.amount),
          category: expense.category
        }))
      })

      if (response.data?.success) {
        // Reload expenses
        await loadExpenses()
        
        setShowBulkForm(false)
        resetBulkForm()
        toast.success(response.data.message || `${validExpenses.length} expense(s) added successfully`)
      } else {
        throw new Error(response.data?.message || 'Failed to add expenses')
      }
    } catch (error) {
      console.error('Error adding bulk expenses:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add expenses'
      toast.error(errorMessage)
    } finally {
      setBulkLoading(false)
    }
  }

  const hasActiveFilters = searchTerm || filterType !== 'all'
  const hasExpenses = filteredExpenses.length > 0

  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-2 text-gray-600">
            Track your expenses and income
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              resetBulkForm()
              setShowBulkForm(true)
            }}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Layers size={16} className="mr-2" />
            Bulk Add
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Expenses</p>
              <p className="mt-1 text-2xl font-semibold text-blue-900">
                {formatCurrency(totalExpenseAmount, currency)}
              </p>
            </div>
            <ArrowDownCircle size={24} className="text-blue-600" />
          </div>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">Total Income</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-900">
                {formatCurrency(totalIncomeAmount, currency)}
              </p>
            </div>
            <ArrowUpCircle size={24} className="text-emerald-600" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Balance</p>
              <p
                className={`mt-1 text-2xl font-semibold ${
                  netAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(Math.abs(netAmount), currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-10 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex gap-2">
            {[
              { label: 'All', value: 'all' },
              { label: 'Expenses', value: 'expense' },
              { label: 'Income', value: 'income' }
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilterType(option.value)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  filterType === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </div>
      {/* Expenses list */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500" />
          </div>
        ) : !hasExpenses ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {hasActiveFilters ? 'No expenses found' : 'No expenses yet'}
              </h3>
              <p className="text-sm text-gray-500">
                {hasActiveFilters
                  ? 'Try adjusting your filters.'
                  : 'Add your first expense or income entry to get started.'}
              </p>
            </div>
            {!hasActiveFilters && (
              <button
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                Add Expense
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => {
              const category = expense.category || categories?.find(c => c._id === expense.category)
              const isIncome = expense.type === 'income'
              return (
                <div
                  key={expense._id}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                    style={{
                      backgroundColor: `${(category?.color || '#3B82F6')}20`,
                      color: category?.color || '#2563EB'
                    }}
                  >
                    {category?.icon || '💰'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">
                        {category?.name || 'Uncategorized'}
                      </h4>
                      {isIncome && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                          Income
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {expense.description || 'No description'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(expense.date, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg font-semibold ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(expense.amount, currency)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingExpense ? 'Edit Expense' : 'Add Expense'}
                </h3>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg transition ${
                      formData.type === 'expense'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <ArrowDownCircle size={18} />
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg transition ${
                      formData.type === 'income'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <ArrowUpCircle size={18} />
                    Income
                  </button>
                </div>
              </div>

              {/* Date and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <CategorySelector
                    value={formData.category}
                    onChange={(categoryId) => setFormData({ ...formData, category: categoryId })}
                    placeholder="Select category"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Groceries, Salary..."
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    {currencySymbols[currency] || '$'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      {editingExpense ? 'Updating...' : 'Adding...'}
                    </span>
                  ) : (
                    editingExpense ? 'Update' : 'Add'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  disabled={formLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Form Modal */}
      {showBulkForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-lg bg-white shadow-xl overflow-hidden flex flex-col">
            <form onSubmit={handleBulkSubmit} className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900">Bulk Add Expenses</h3>
                <button
                  type="button"
                  onClick={() => { setShowBulkForm(false); resetBulkForm() }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden p-6">
                {/* Date Selection - Fixed at top */}
                <div className="mb-4 flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date for all expenses *
                  </label>
                  <input
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Expense Rows - Scrollable */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700">
                      Expenses
                    </label>
                    <button
                      type="button"
                      onClick={addBulkRow}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Row
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {bulkExpenses.map((expense, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 border border-gray-200 rounded-lg flex-shrink-0">
                        <div className="col-span-4">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={expense.amount}
                            onChange={(e) => updateBulkRow(index, 'amount', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Amount"
                          />
                        </div>
                        <div className="col-span-5 relative">
                          <CategorySelector
                            value={expense.category}
                            onChange={(categoryId) => updateBulkRow(index, 'category', categoryId)}
                            placeholder="Category"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={expense.description}
                            onChange={(e) => updateBulkRow(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Description"
                          />
                        </div>
                        <div className="col-span-1">
                          {bulkExpenses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBulkRow(index)}
                              className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Remove row"
                            >
                              <X size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  type="submit"
                  disabled={bulkLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Adding...
                    </span>
                  ) : (
                    `Add ${bulkExpenses.filter(e => e.amount && e.category).length} Expense(s)`
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowBulkForm(false); resetBulkForm() }}
                  disabled={bulkLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Expenses
