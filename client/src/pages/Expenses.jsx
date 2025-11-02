import { useState, useEffect } from 'react'
import { useExpense } from '../context/ExpenseContext'
import { useAuth } from '../context/AuthContext'
import CategorySelector from '../components/CategorySelector'
import { formatCurrency, formatDate, formatDateForInput } from '../utils/helpers'
import { 
  Plus, Edit, Trash2, Search, Filter, X, Calendar,
  ArrowUpCircle, ArrowDownCircle, Tag as TagIcon, FileText,
  Repeat, DollarSign
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
    loadExpenses, 
    addExpense, 
    updateExpense, 
    deleteExpense 
  } = useExpense()

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: formatDateForInput(new Date()),
    category: '',
    type: 'expense',
    tags: [],
    notes: '',
    isRecurring: false,
    recurringPeriod: 'monthly'
  })
  const [tagInput, setTagInput] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Load expenses on mount
  useEffect(() => {
    loadExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        type: editingExpense.type || 'expense',
        tags: editingExpense.tags || [],
        notes: editingExpense.notes || '',
        isRecurring: editingExpense.isRecurring || false,
        recurringPeriod: editingExpense.recurringPeriod || 'monthly'
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
      type: 'expense',
      tags: [],
      notes: '',
      isRecurring: false,
      recurringPeriod: 'monthly'
    })
    setTagInput('')
    setEditingExpense(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.description.trim()) {
      toast.error('Please enter a description')
      return
    }

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
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        date: formData.date,
        category: formData.category,
        type: formData.type,
        tags: formData.tags.filter(tag => tag.trim()),
        notes: formData.notes.trim(),
        isRecurring: formData.isRecurring,
        recurringPeriod: formData.isRecurring ? formData.recurringPeriod : undefined
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
        const result = await deleteExpense(expense._id)
        if (result.success) {
          toast.success('Expense deleted successfully')
        }
      } catch (error) {
        console.error('Error deleting expense:', error)
      }
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = filterType === 'all' || expense.type === filterType

    const matchesCategory = filterCategory === 'all' || 
      expense.category?._id === filterCategory ||
      expense.category === filterCategory

    const expenseDate = new Date(expense.date)
    const matchesStartDate = !startDate || expenseDate >= new Date(startDate)
    const matchesEndDate = !endDate || expenseDate <= new Date(endDate + 'T23:59:59')

    return matchesSearch && matchesType && matchesCategory && matchesStartDate && matchesEndDate
  })

  // Group expenses by date
  const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
    const date = formatDate(expense.date, 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(expense)
    return groups
  }, {})

  const groupedExpensesArray = Object.entries(groupedExpenses)
    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
    .map(([date, expenses]) => ({
      date,
      expenses,
      total: expenses.reduce((sum, exp) => {
        return exp.type === 'expense' ? sum + exp.amount : sum - exp.amount
      }, 0)
    }))

  const clearFilters = () => {
    setSearchTerm('')
    setFilterType('all')
    setFilterCategory('all')
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = searchTerm || filterType !== 'all' || filterCategory !== 'all' || startDate || endDate

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Manage your expenses and income</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {[filterType !== 'all', filterCategory !== 'all', startDate, endDate].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900"
                    title="Clear filters"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => { setShowForm(false); resetForm() }}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingExpense ? 'Edit Expense' : 'Add New Expense'}
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
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'expense' })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-colors ${
                        formData.type === 'expense'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <ArrowDownCircle size={20} />
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'income' })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-colors ${
                        formData.type === 'income'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <ArrowUpCircle size={20} />
                      Income
                    </button>
                  </div>
                </div>

                {/* Description and Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Groceries, Salary..."
                      maxLength={100}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold text-lg">
                        {currencySymbols[currency] || '$'}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Date and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
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

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a tag and press Enter"
                      maxLength={20}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          <TagIcon size={14} />
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recurring Expense */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <Repeat size={16} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Recurring expense</span>
                    </div>
                  </label>
                  {formData.isRecurring && (
                    <div className="mt-2 ml-6">
                      <select
                        value={formData.recurringPeriod}
                        onChange={(e) => setFormData({ ...formData, recurringPeriod: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText size={14} className="inline mr-1" />
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.notes.length}/500</p>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {editingExpense ? 'Updating...' : 'Adding...'}
                      </div>
                    ) : (
                      editingExpense ? 'Update Expense' : 'Add Expense'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm() }}
                    disabled={formLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-gray-400 mb-4">
              <span className="text-6xl font-bold">{currencySymbols[currency] || '$'}</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? 'No expenses match your filters' : 'No expenses yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters 
                ? 'Try adjusting your filters or clear them to see all expenses'
                : 'Start tracking your expenses and income by adding your first entry'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => { resetForm(); setShowForm(true) }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus size={16} />
                Add Your First Expense
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {groupedExpensesArray.map(({ date, expenses, total }) => (
              <div key={date} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatDate(date, 'EEEE, MMMM dd, yyyy')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      total >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(Math.abs(total), currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {total >= 0 ? 'Net Income' : 'Net Expense'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {expenses.map((expense) => {
                    const category = expense.category || categories?.find(c => c._id === expense.category)
                    return (
                      <div
                        key={expense._id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {/* Category Icon */}
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                            style={{ backgroundColor: (category?.color || '#3B82F6') + '20' }}
                          >
                            {category?.icon || '💰'}
                          </div>

                          {/* Expense Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 truncate">
                                {expense.description}
                              </h4>
                              {expense.type === 'income' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Income
                                </span>
                              )}
                              {expense.isRecurring && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  <Repeat size={12} />
                                  Recurring
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-sm text-gray-600">{category?.name || 'Uncategorized'}</p>
                              {expense.tags && expense.tags.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <TagIcon size={12} className="text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    {expense.tags.join(', ')}
                                  </span>
                                </div>
                              )}
                              {expense.notes && (
                                <div className="flex items-center gap-1">
                                  <FileText size={12} className="text-gray-400" />
                                  <span className="text-xs text-gray-500 truncate max-w-xs">
                                    {expense.notes}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right mr-4">
                            <p className={`text-lg font-semibold ${
                              expense.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {expense.type === 'income' ? '+' : '-'}
                              {formatCurrency(expense.amount, currency)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(expense.date, 'hh:mm a')}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit expense"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(expense)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete expense"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Expenses
