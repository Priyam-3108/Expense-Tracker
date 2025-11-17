import { useState, useEffect, useMemo } from 'react'
import { useExpense } from '../context/ExpenseContext'
import { useAuth } from '../context/AuthContext'
import CategorySelector from '../components/CategorySelector'
import DatePicker from '../components/DatePicker'
import DateRangePicker from '../components/DateRangePicker'
import { formatCurrency, formatDate, formatDateForInput } from '../utils/helpers'
import {
  Plus, Edit, Trash2, Search, X,
  ArrowUpCircle, ArrowDownCircle, Layers,
  Calendar as CalendarIcon, List, Repeat
} from 'lucide-react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
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
    type: 'expense',
    isRecurring: false,
    recurringPeriod: 'monthly',
    recurringEndDate: ''
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
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
  
  // View state
  const [viewMode, setViewMode] = useState('list') // 'list' or 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null) // For calendar date selection

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
        type: editingExpense.type || 'expense',
        isRecurring: editingExpense.isRecurring || false,
        recurringPeriod: editingExpense.recurringPeriod || 'monthly',
        recurringEndDate: editingExpense.recurringEndDate
          ? formatDateForInput(new Date(editingExpense.recurringEndDate))
          : ''
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
      isRecurring: false,
      recurringPeriod: 'monthly',
      recurringEndDate: ''
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

    if (formData.isRecurring) {
      if (!formData.recurringEndDate) {
        toast.error('Please select an end date for recurring expenses')
        return
      }

      const start = new Date(formData.date)
      const end = new Date(formData.recurringEndDate)

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        toast.error('Invalid start or end date')
        return
      }

      if (end < start) {
        toast.error('Recurring end date must be after the start date')
        return
      }
    }

    setFormLoading(true)
    try {
      const expenseData = {
        description: formData.description ? formData.description.trim() : '',
        amount: parseFloat(formData.amount),
        date: formData.date,
        category: formData.category,
        type: formData.type,
        isRecurring: formData.isRecurring,
        recurringPeriod: formData.isRecurring ? formData.recurringPeriod : undefined,
        recurringEndDate: formData.isRecurring ? formData.recurringEndDate : undefined
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
        
        // Date range filter
        let matchesDateRange = true
        if (dateRange.startDate || dateRange.endDate) {
          const expenseDate = new Date(expense.date)
          if (dateRange.startDate && expenseDate < new Date(dateRange.startDate)) {
            matchesDateRange = false
          }
          if (dateRange.endDate) {
            const endDate = new Date(dateRange.endDate)
            endDate.setHours(23, 59, 59, 999)
            if (expenseDate > endDate) {
              matchesDateRange = false
            }
          }
        }
        
        return matchesSearch && matchesType && matchesDateRange
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [expenses, searchTerm, filterType, dateRange])

  const clearFilters = () => {
    setSearchTerm('')
    setFilterType('all')
    setDateRange({ startDate: '', endDate: '' })
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

  const hasActiveFilters = searchTerm || filterType !== 'all' || dateRange.startDate || dateRange.endDate
  const hasExpenses = filteredExpenses.length > 0

  // Calendar helpers
  const getExpensesForDate = (date) => {
    return filteredExpenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return isSameDay(expenseDate, date)
    })
  }

  const handleDateClick = (date) => {
    setSelectedDate(date)
    setFormData({
      ...formData,
      date: formatDateForInput(date)
    })
    setShowForm(true)
  }

  const handleExpenseClick = (expense, e) => {
    e.stopPropagation()
    handleEdit(expense)
  }

  // Calendar month view
  const monthStart = startOfMonth(calendarDate)
  const monthEnd = endOfMonth(calendarDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

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

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition ${
              viewMode === 'list'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <List size={16} />
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition ${
              viewMode === 'calendar'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CalendarIcon size={16} />
            Calendar
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

      {/* Filters - Only show in list view */}
      {viewMode === 'list' && (
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
      )}

      {/* Expenses list - Only show in list view */}
      {viewMode === 'list' && (
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
                      {expense.isRecurring && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
                          <Repeat size={12} />
                          Recurring
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
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <>
          {/* Filters for Calendar View */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-4">
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
              
              {/* Date Range Picker */}
              <div className="w-full md:w-auto">
                <DateRangePicker
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onStartDateChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                  onEndDateChange={(date) => setDateRange({ ...dateRange, endDate: date })}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Previous month"
            >
              <ArrowDownCircle size={20} className="rotate-90 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">
                {format(calendarDate, 'MMMM yyyy')}
              </h2>
              <div className="w-48">
                <DatePicker
                  value={formatDateForInput(calendarDate)}
                  onChange={(date) => {
                    if (date) {
                      setCalendarDate(new Date(date))
                    }
                  }}
                  placeholder="Go to date"
                />
              </div>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                Today
              </button>
            </div>
            <button
              onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Next month"
            >
              <ArrowDownCircle size={20} className="-rotate-90 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, idx) => {
              const dayExpenses = getExpensesForDate(day)
              const isCurrentMonth = isSameMonth(day, calendarDate)
              const isToday = isSameDay(day, new Date())
              const totalAmount = dayExpenses.reduce((sum, exp) => {
                return exp.type === 'expense' ? sum + exp.amount : sum - exp.amount
              }, 0)

              return (
                <div
                  key={idx}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-[100px] p-2 border border-gray-200 rounded-lg cursor-pointer transition hover:bg-gray-50 hover:border-blue-300 ${
                    !isCurrentMonth ? 'bg-gray-50 opacity-50' : 'bg-white'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayExpenses.slice(0, 3).map((expense) => {
                      const category = expense.category || categories?.find(c => c._id === expense.category)
                      const isIncome = expense.type === 'income'
                      return (
                        <div
                          key={expense._id}
                          onClick={(e) => handleExpenseClick(expense, e)}
                          className={`text-xs p-1 rounded truncate font-medium ${
                            isIncome 
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          }`}
                          title={`${category?.name || 'Uncategorized'}: ${formatCurrency(expense.amount, currency)}`}
                        >
                          <span>{isIncome ? '+' : '-'}</span>
                          {formatCurrency(expense.amount, currency)}
                        </div>
                      )
                    })}
                    {dayExpenses.length > 3 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{dayExpenses.length - 3} more
                      </div>
                    )}
                  </div>
                  {dayExpenses.length > 0 && (
                    <div className={`text-xs font-semibold mt-1 ${
                      totalAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {totalAmount >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalAmount), currency)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        </>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] rounded-lg bg-white shadow-xl overflow-hidden flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              {/* Header - Fixed */}
              <div className="flex items-center justify-between border-b border-gray-200 p-6 flex-shrink-0">
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

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[400px]">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <DatePicker
                      value={formData.date}
                      onChange={(date) => setFormData({ ...formData, date })}
                      placeholder="Select date"
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

                {/* Recurring Expense */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isRecurring: e.target.checked,
                          recurringEndDate: e.target.checked ? formData.recurringEndDate : ''
                        })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <Repeat size={16} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Recurring {formData.type}</span>
                    </div>
                  </label>
                  {formData.isRecurring && (
                    <div className="mt-3 ml-6 space-y-3 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frequency *
                        </label>
                        <select
                          value={formData.recurringPeriod}
                          onChange={(e) => setFormData({ ...formData, recurringPeriod: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date *
                        </label>
                        <DatePicker
                          value={formData.recurringEndDate}
                          onChange={(date) => setFormData({ ...formData, recurringEndDate: date })}
                          placeholder="Select end date"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Recurring entries will be created from the start date through this end date.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions - Fixed */}
              <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-lg bg-white shadow-xl overflow-visible flex flex-col max-h-[90vh]">
            <form onSubmit={handleBulkSubmit} className="flex flex-col h-full">
              {/* Header - Fixed */}
              <div className="flex items-center justify-between border-b border-gray-200 p-6 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">Bulk Add Expenses</h3>
                <button
                  type="button"
                  onClick={() => { setShowBulkForm(false); resetBulkForm() }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content Area - Scrollable */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex flex-col p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                  {/* Date Selection - Fixed at top */}
                  <div className="mb-4 flex-shrink-0 relative z-[60]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date for all expenses *
                    </label>
                    <DatePicker
                      value={bulkDate}
                      onChange={(date) => setBulkDate(date)}
                      placeholder="Select date"
                    />
                  </div>

                  {/* Expense Rows Section */}
                  <div className="flex flex-col">
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

                    <div 
                      className="space-y-3 overflow-y-auto pr-2 bulk-expenses-scroll"
                      style={{ 
                        maxHeight: '400px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 #f1f5f9'
                      }}
                    >
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
              </div>

              {/* Form Actions - Fixed */}
              <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
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
