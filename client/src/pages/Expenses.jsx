import { useState, useEffect, useMemo, useRef } from 'react'
import { useExpense } from '../context/ExpenseContext'
import { useAuth } from '../context/AuthContext'
import CategorySelector from '../components/CategorySelector'
import DatePicker from '../components/DatePicker'
import DateRangePicker from '../components/DateRangePicker'
import DataTable from '../components/DataTable'
import BulkEditList from '../components/BulkEditList'
import ExportModal from '../components/ExportModal'
import ImportModal from '../components/ImportModal'
import { formatCurrency, formatDate, formatDateForInput, parseDateLocal, getTodayDate } from '../utils/helpers'
import {
  Plus, Edit, Trash2, Search, X,
  ArrowUpCircle, ArrowDownCircle, Layers,
  Calendar as CalendarIcon, List, Repeat, Download, Upload
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

function IndeterminateCheckbox({
  indeterminate,
  className = '',
  ...rest
}) {
  const ref = useRef(null)

  useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate
    }
  }, [ref, indeterminate])

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + ' cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500'}
      {...rest}
    />
  )
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
    bulkDeleteExpenses,
    bulkUpdateList,
    loadExpenses
  } = useExpense()

  // Load expenses on mount to ensure data is fresh
  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  // Export state
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // Import state
  const [showImportModal, setShowImportModal] = useState(false)

  // Get today's date
  const todayDate = useMemo(() => getTodayDate(), [])

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: todayDate,
    category: '',
    type: 'expense',
    isRecurring: false,
    recurringPeriod: 'monthly',
    recurringEndDate: ''
  })
  const [formLoading, setFormLoading] = useState(false)

  // Bulk form state
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [bulkDate, setBulkDate] = useState(todayDate)
  const [bulkExpenses, setBulkExpenses] = useState([
    { amount: '', category: '', description: '' }
  ])
  const [bulkLoading, setBulkLoading] = useState(false)

  // Bulk Edit state
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [selectedExpenses, setSelectedExpenses] = useState([])
  const [editableExpenses, setEditableExpenses] = useState([])
  const [showBulkDelete, setShowBulkDelete] = useState(false)

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
      // Parse the date correctly without timezone shift
      let expenseDate = formatDateForInput(new Date())
      if (editingExpense.date) {
        if (typeof editingExpense.date === 'string') {
          // If it's an ISO string, extract just the date part (YYYY-MM-DD)
          expenseDate = editingExpense.date.split('T')[0]
        } else {
          expenseDate = formatDateForInput(editingExpense.date)
        }
      }

      // Parse recurring end date correctly
      let recurringEndDate = ''
      if (editingExpense.recurringEndDate) {
        if (typeof editingExpense.recurringEndDate === 'string') {
          recurringEndDate = editingExpense.recurringEndDate.split('T')[0]
        } else {
          recurringEndDate = formatDateForInput(editingExpense.recurringEndDate)
        }
      }

      setFormData({
        description: editingExpense.description || '',
        amount: editingExpense.amount?.toString() || '',
        date: expenseDate,
        category: editingExpense.category?._id || editingExpense.category || '',
        type: editingExpense.type || 'expense',
        isRecurring: editingExpense.isRecurring || false,
        recurringPeriod: editingExpense.recurringPeriod || 'monthly',
        recurringEndDate: recurringEndDate
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
      date: getTodayDate(),
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
      // Send date as simple YYYY-MM-DD string
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
    setBulkDate(todayDate)
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
      const expenseDate = parseDateLocal(expense.date)
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

  const handleBulkDelete = (selectedRows) => {
    setSelectedExpenses(selectedRows)
    setShowBulkDelete(true)
  }

  const confirmBulkDelete = async () => {
    try {
      const ids = selectedExpenses.map(row => row._id)
      const result = await bulkDeleteExpenses(ids)
      if (result.success) {
        toast.success('Expenses deleted successfully')
        setShowBulkDelete(false)
        loadExpenses()
      }
    } catch (error) {
      console.error('Error deleting expenses:', error)
      toast.error('Failed to delete expenses')
    }
  }

  const handleBulkEditClick = (selectedRows) => {
    setSelectedExpenses(selectedRows)
    setEditableExpenses(selectedRows)
    setShowBulkEdit(true)
  }

  const handleBulkUpdateSubmit = async (e) => {
    e.preventDefault()

    if (editableExpenses.length === 0) {
      toast.error('No expenses to update')
      return
    }

    setBulkLoading(true)
    try {
      const result = await bulkUpdateList(editableExpenses)
      if (result.success) {
        setShowBulkEdit(false)
      }
    } catch (error) {
      console.error('Error updating expenses:', error)
    } finally {
      setBulkLoading(false)
    }
  }

  const handleExport = async (format, dateRange) => {
    setExportLoading(true)
    try {
      const { expenseService } = await import('../services/expenseService')
      const response = await expenseService.exportExpenses(format, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        search: searchTerm,
        category: filterType === 'all' ? undefined : filterType, // Assuming filterType can be category ID too, but logic in filteredExpenses suggests filterType is 'all' | 'expense' | 'income'. If category filter exists, it should be passed.
        // Wait, filterType in Expenses.jsx is only 'all', 'expense', 'income'. 
        // But getExpenses supports category. 
        // Let's check if there is a category filter state.
        // Looking at the code, there is no category filter state in Expenses.jsx, only type filter.
        // So we only pass type.
        type: filterType
      })

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url

      const extension = format === 'excel' ? 'xlsx' : format
      const filename = `expenses-${new Date().toISOString().split('T')[0]}.${extension}`

      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()

      setShowExportModal(false)
      toast.success('Export successful')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export expenses')
    } finally {
      setExportLoading(false)
    }
  }

  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <IndeterminateCheckbox
          {...{
            checked: table.getIsAllRowsSelected(),
            indeterminate: table.getIsSomeRowsSelected(),
            onChange: table.getToggleAllRowsSelectedHandler(),
          }}
        />
      ),
      cell: ({ row }) => (
        <IndeterminateCheckbox
          {...{
            checked: row.getIsSelected(),
            disabled: !row.getCanSelect(),
            indeterminate: row.getIsSomeSelected(),
            onChange: row.getToggleSelectedHandler(),
          }}
        />
      ),
      size: 40,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: info => formatDate(info.getValue(), 'MMM dd, yyyy'),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.original.category || categories?.find(c => c._id === row.original.category)
        return (
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded text-xs"
              style={{
                backgroundColor: `${(category?.color || '#3B82F6')}20`,
                color: category?.color || '#2563EB'
              }}
            >
              {category?.icon || '💰'}
            </div>
            <span>{category?.name || 'Uncategorized'}</span>
          </div>
        )
      }
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: info => <span className="text-gray-600 dark:text-gray-300">{info.getValue() || '-'}</span>
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = row.original.amount
        const isIncome = row.original.type === 'income'
        return (
          <span className={`font-medium ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isIncome ? '+' : '-'}{formatCurrency(amount, currency)}
          </span>
        )
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row.original)}
            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            className="p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ], [categories, currency])

  // Calendar month view
  const monthStart = startOfMonth(calendarDate)
  const monthEnd = endOfMonth(calendarDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track your expenses and income
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="inline-flex gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-1 shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
                }`}
            >
              <List size={16} />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'calendar'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
                }`}
            >
              <CalendarIcon size={16} />
              Calendar
            </button>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* Action Buttons */}
          <button
            onClick={() => {
              resetBulkForm()
              setShowBulkForm(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all shadow-sm hover:shadow"
          >
            <Layers size={18} />
            Bulk Add
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all shadow-sm hover:shadow"
          >
            <Upload size={18} />
            Import
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all shadow-sm hover:shadow"
          >
            <Download size={18} />
            Export
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus size={18} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-4 mb-4">
        <div className="rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Expenses</p>
              <p className="mt-1 text-2xl font-semibold text-blue-900 dark:text-blue-100">
                {formatCurrency(totalExpenseAmount, currency)}
              </p>
            </div>
            <ArrowDownCircle size={24} className="text-blue-600" />
          </div>
        </div>

        <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Income</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
                {formatCurrency(totalIncomeAmount, currency)}
              </p>
            </div>
            <ArrowUpCircle size={24} className="text-emerald-600" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Balance</p>
              <p
                className={`mt-1 text-2xl font-semibold ${netAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
              >
                {formatCurrency(Math.abs(netAmount), currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses list - Only show in list view */}
      {viewMode === 'list' && (
        <DataTable
          data={filteredExpenses}
          columns={columns}
          onBulkDelete={handleBulkDelete}
          onBulkEdit={handleBulkEditClick}
          isLoading={loading}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          totalResults={filteredExpenses.length}
        />
      )}
      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <>
          {/* Filters for Calendar View */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm mb-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-10 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${filterType === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
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

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-600 dark:text-gray-400"
                title="Previous month"
              >
                <ArrowDownCircle size={20} className="rotate-90" />
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
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
                  className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                >
                  Today
                </button>
              </div>
              <button
                onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-600 dark:text-gray-400"
                title="Next month"
              >
                <ArrowDownCircle size={20} className="-rotate-90" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, idx) => {
                const dayExpenses = getExpensesForDate(day)
                const isCurrentMonth = isSameMonth(day, calendarDate)
                const isToday = isSameDay(day, new Date())
                const totalAmount = dayExpenses.reduce((sum, exp) => {
                  return exp.type === 'income' ? sum + exp.amount : sum - exp.amount
                }, 0)

                return (
                  <div
                    key={idx}
                    onClick={() => handleDateClick(day)}
                    className={`min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500 ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/50 opacity-50' : 'bg-white dark:bg-gray-800'
                      } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
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
                            className={`text-xs p-1 rounded truncate font-medium ${isIncome
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/50'
                              }`}
                            title={`${category?.name || 'Uncategorized'}: ${formatCurrency(expense.amount, currency)}`}
                          >
                            <span>{isIncome ? '+' : '-'}</span>
                            {formatCurrency(expense.amount, currency)}
                          </div>
                        )
                      })}
                      {dayExpenses.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          +{dayExpenses.length - 3} more
                        </div>
                      )}
                    </div>
                    {dayExpenses.length > 0 && (
                      <div className={`text-xs font-semibold mt-1 ${totalAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
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
        <div className="fixed inset-0 z-50 flex items-baseline justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] rounded-lg bg-white dark:bg-gray-800 shadow-xl overflow-hidden flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingExpense ? 'Edit Expense' : 'Add Expense'}
                </h3>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[400px]">
                {/* Type Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'expense' })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg transition ${formData.type === 'expense'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                    >
                      <ArrowDownCircle size={18} />
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'income' })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg transition ${formData.type === 'income'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date *
                    </label>
                    <DatePicker
                      value={formData.date}
                      onChange={(date) => setFormData({ ...formData, date })}
                      placeholder="Select date"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="e.g., Groceries, Salary..."
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                      {currencySymbols[currency] || '$'}
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                      <Repeat size={16} className="text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recurring {formData.type}</span>
                    </div>
                  </label>
                  {formData.isRecurring && (
                    <div className="mt-3 ml-6 space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg" style={{ overflow: 'visible' }}>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Frequency *
                        </label>
                        <select
                          value={formData.recurringPeriod}
                          onChange={(e) => setFormData({ ...formData, recurringPeriod: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>

                      <div className="relative" style={{ zIndex: 1000 }}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          End Date *
                        </label>
                        <DatePicker
                          value={formData.recurringEndDate}
                          onChange={(date) => setFormData({ ...formData, recurringEndDate: date })}
                          placeholder="Select end date"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Recurring entries will be created from the start date through this end date.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white dark:bg-gray-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <form onSubmit={handleBulkUpdateSubmit} className="flex flex-col" style={{ height: '35rem' }}>
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bulk Edit ({selectedExpenses.length} items)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBulkEdit(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Update details for each selected expense below.
                </p>

                <BulkEditList
                  expenses={selectedExpenses}
                  categories={categories}
                  currency={currency}
                  onExpensesChange={setEditableExpenses}
                />
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
                <button
                  type="submit"
                  disabled={bulkLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {bulkLoading ? 'Updating...' : 'Update All'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkEdit(false)}
                  disabled={bulkLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Expenses
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkDelete(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                <Trash2 size={24} />
                <div>
                  <p className="font-medium">Are you sure?</p>
                  <p className="text-sm opacity-90">This action cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={confirmBulkDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete {selectedExpenses.length} Items
              </button>
              <button
                type="button"
                onClick={() => setShowBulkDelete(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Form Modal */}
      {showBulkForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-lg bg-white dark:bg-gray-800 shadow-xl flex flex-col max-h-[90vh] relative">
            <form onSubmit={handleBulkSubmit} className="flex flex-col h-full">
              {/* Header - Fixed */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk Add Expenses</h3>
                <button
                  type="button"
                  onClick={() => { setShowBulkForm(false); resetBulkForm() }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content Area - Scrollable */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex flex-col p-6 overflow-y-auto flex-1">
                  {/* Date Selection - Fixed at top */}
                  <div className="mb-4 flex-shrink-0 relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Expenses
                      </label>
                      <button
                        type="button"
                        onClick={addBulkRow}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      >
                        + Add Row
                      </button>
                    </div>

                    <div
                      className="space-y-3 overflow-y-auto pr-2"
                      style={{
                        maxHeight: '400px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 #f1f5f9'
                      }}
                    >
                      {bulkExpenses.map((expense, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex-shrink-0">
                          <div className="col-span-4">
                            <input
                              type="number"
                              step="1"
                              min="1"
                              value={expense.amount}
                              onChange={(e) => updateBulkRow(index, 'amount', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              placeholder="Description"
                            />
                          </div>
                          <div className="col-span-1">
                            {bulkExpenses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBulkRow(index)}
                                className="w-full p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
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
              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        loading={exportLoading}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={() => {
          loadExpenses()
          // Optionally refresh categories if new ones were added
        }}
      />
    </div>
  )
}

export default Expenses
