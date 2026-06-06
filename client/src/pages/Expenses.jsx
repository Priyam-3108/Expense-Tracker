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
import MobileExpenseCard from '../components/MobileExpenseCard'
import Modal from '../components/Modal'
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
    stats,
    loading,
    pagination,
    addExpense,
    updateExpense,
    deleteExpense,
    bulkDeleteExpenses,
    bulkUpdateList,
    loadExpenses,
    loadStats
  } = useExpense()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)


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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })

  // View state
  const [viewMode, setViewMode] = useState('list') // 'list' or 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [calendarExpenses, setCalendarExpenses] = useState([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null) // For calendar date selection

  // Load expenses on mount to ensure data is fresh
  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Load expenses and stats when page, limit or filters change
  useEffect(() => {
    loadExpenses({
      page,
      limit,
      search: debouncedSearchTerm,
      type: filterType,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    })

    // Also load stats for the current filter/date range
    loadStats({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    })
  }, [loadExpenses, loadStats, page, limit, filterType, dateRange, debouncedSearchTerm])

  // Load calendar expenses when calendar date changes
  useEffect(() => {
    if (viewMode === 'calendar') {
      const fetchCalendarData = async () => {
        setCalendarLoading(true)
        try {
          const { expenseService } = await import('../services/expenseService')
          const start = format(startOfMonth(calendarDate), 'yyyy-MM-dd')
          const end = format(endOfMonth(calendarDate), 'yyyy-MM-dd')
          const response = await expenseService.getExpenses({
            startDate: start,
            endDate: end,
            type: filterType,
            search: debouncedSearchTerm
          })
          if (response.data?.success) {
            setCalendarExpenses(response.data.data.expenses)
          }
        } catch (error) {
          console.error('Failed to fetch calendar expenses:', error)
        } finally {
          setCalendarLoading(false)
        }
      }
      fetchCalendarData()
    }
  }, [viewMode, calendarDate, filterType, debouncedSearchTerm, expenses])

  const summary = useMemo(() => {
    // Current filter or overall stats
    const expenseTotal = stats?.totalStats?.expenses || 0
    const incomeTotal = stats?.totalStats?.income || 0

    return {
      totalExpenseAmount: expenseTotal,
      totalIncomeAmount: incomeTotal,
      netAmount: incomeTotal - expenseTotal
    }
  }, [stats])

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

  // Filter expenses (now handled by server, but we might want local filtering for search-as-you-type)
  const filteredExpenses = useMemo(() => {
    return expenses
  }, [expenses])

  const clearFilters = () => {
    setSearchTerm('')
    setFilterType('all')
    setDateRange({ startDate: '', endDate: '' })
    setPage(1)
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
    return calendarExpenses.filter(expense => {
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
              {category?.icon || '•'}
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-500">
            Track your expenses and income
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="inline-flex gap-1 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <List size={16} />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${viewMode === 'calendar'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <CalendarIcon size={16} />
              Calendar
            </button>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-8 w-px bg-gray-300 dark:bg-white/[0.08]"></div>

          {/* Action Buttons */}
          <button
            onClick={() => {
              resetBulkForm()
              setShowBulkForm(true)
            }}
            className="glass-btn"
          >
            <Layers size={18} />
            Bulk Add
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="glass-btn"
          >
            <Upload size={18} />
            Import
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="glass-btn"
          >
            <Download size={18} />
            Export
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all duration-200 active:scale-95 hover:scale-[1.02]"
            style={{ boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}
          >
            <Plus size={18} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-4 mb-4">
        <div className="glass-card p-5 border-l-2 border-l-rose-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Expenses</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalExpenseAmount, currency)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10">
              <ArrowDownCircle size={22} className="text-rose-500 dark:text-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.3)]" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 border-l-2 border-l-emerald-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Income</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalIncomeAmount, currency)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
              <ArrowUpCircle size={22} className="text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 border-l-2 border-l-indigo-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Net Balance</p>
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

      {/* Expenses list - desktop table (hidden on mobile) */}
      {viewMode === 'list' && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <DataTable
              data={expenses}
              columns={columns}
              onBulkDelete={handleBulkDelete}
              onBulkEdit={handleBulkEditClick}
              isLoading={loading}
              searchValue={searchTerm}
              onSearchChange={(val) => {
                setSearchTerm(val)
                setPage(1)
              }}
              totalResults={pagination.totalItems}
              manualPagination={true}
              pageCount={pagination.totalPages}
              pageIndex={pagination.currentPage - 1}
              pageSize={pagination.limit}
              onPageChange={(idx) => setPage(idx + 1)}
              onPageSizeChange={(size) => {
                setLimit(size)
                setPage(1)
              }}
            />
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {/* Mobile search bar */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                className="w-full rounded-xl border border-gray-300 dark:border-white/[0.07] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white pl-10 pr-4 py-3 text-sm focus:border-indigo-500 dark:focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Cards */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="text-lg font-medium">No expenses found</p>
                <p className="text-sm mt-1">Tap the + button to add your first one</p>
              </div>
            ) : (
              expenses.map((expense) => (
                <MobileExpenseCard
                  key={expense._id}
                  expense={expense}
                  currency={currency}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}

            {/* Mobile pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-500 dark:text-slate-500">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={pagination.currentPage <= 1}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 dark:border-white/[0.08] disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all duration-200 min-h-[40px] text-gray-700 dark:text-slate-300"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 dark:border-white/[0.08] disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all duration-200 min-h-[40px] text-gray-700 dark:text-slate-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <>
          {/* Filters for Calendar View */}
          <div className="glass-card p-4 mb-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/[0.07] px-10 py-2.5 text-sm focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
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
                      className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${filterType === option.value
                        ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                        : 'border-gray-300 dark:border-white/[0.08] text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-white/[0.08] px-4 py-2.5 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-all duration-200"
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

          <div className="glass-card p-3 sm:p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
              <button
                onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-xl transition-all duration-200 text-gray-600 dark:text-slate-400 min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Previous month"
                aria-label="Previous month"
              >
                <ArrowDownCircle size={20} className="rotate-90" />
              </button>

              {/* Mobile: just Month Year + Today */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center">
                <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {format(calendarDate, 'MMM yyyy')}
                </h2>
                {/* Go-to date picker — desktop only */}
                <div className="hidden sm:block w-48">
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
                  className="px-2.5 py-1 text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all duration-200 border border-indigo-200 dark:border-indigo-500/20"
                >
                  Today
                </button>
              </div>

              <button
                onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-xl transition-all duration-200 text-gray-600 dark:text-slate-400 min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Next month"
                aria-label="Next month"
              >
                <ArrowDownCircle size={20} className="-rotate-90" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {/* Day headers */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="p-1 sm:p-2 text-center text-xs font-semibold text-gray-500 dark:text-slate-500">
                  <span className="sm:hidden">{day}</span>
                  <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
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
                const incomeCount = dayExpenses.filter(e => e.type === 'income').length
                const expenseCount = dayExpenses.filter(e => e.type === 'expense').length

                return (
                  <div
                    key={idx}
                    onClick={() => handleDateClick(day)}
                    className={`min-h-[52px] sm:min-h-[100px] p-1 sm:p-2 border border-gray-200 dark:border-white/[0.04] rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:border-indigo-300 dark:hover:border-indigo-500/30 ${!isCurrentMonth ? 'bg-gray-50 dark:bg-white/[0.01] opacity-40' : 'bg-white dark:bg-white/[0.02]'
                      } ${isToday ? 'ring-2 ring-indigo-500/50' : ''}`}
                  >
                    <div className={`text-xs sm:text-sm font-medium mb-1 ${isToday ? 'text-indigo-600 dark:text-indigo-400' : isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-600'}`}>
                      {format(day, 'd')}
                    </div>

                    {/* Mobile: coloured dots only */}
                    {dayExpenses.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 sm:hidden">
                        {incomeCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        )}
                        {expenseCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                        )}
                        {dayExpenses.length > 1 && (
                          <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: '8px', lineHeight: '8px', marginTop: '2px' }}>
                            ×{dayExpenses.length}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Desktop: full text chips */}
                    <div className="hidden sm:block space-y-1">
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

                    {/* Desktop total */}
                    {dayExpenses.length > 0 && (
                      <div className={`hidden sm:block text-xs font-semibold mt-1 ${totalAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
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
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); resetForm() }}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 h-[600px] max-h-full">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-xl transition-all duration-200 min-h-[44px] ${formData.type === 'expense'
                    ? 'border-rose-500/60 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 shadow-[0_0_12px_rgba(251,113,133,0.1)]'
                    : 'border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-slate-400 hover:border-gray-400 dark:hover:border-white/[0.15]'
                    }`}
                >
                  <ArrowDownCircle size={18} />
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-xl transition-all duration-200 min-h-[44px] ${formData.type === 'income'
                    ? 'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.1)]'
                    : 'border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-slate-400 hover:border-gray-400 dark:hover:border-white/[0.15]'
                    }`}
                >
                  <ArrowUpCircle size={18} />
                  Income
                </button>
              </div>
            </div>

            {/* Date and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative z-20">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Date *
                </label>
                <DatePicker
                  value={formData.date}
                  onChange={(date) => setFormData({ ...formData, date })}
                  placeholder="Select date"
                />
              </div>

              <div className="relative z-10">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <CategorySelector
                  categories={categories}
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.07] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 min-h-[44px] transition-all duration-200"
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-white/[0.07] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 min-h-[44px] transition-all duration-200"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Recurring Expense */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
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
                  className="w-5 h-5 text-indigo-600 border-gray-300 dark:border-white/[0.15] rounded focus:ring-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <Repeat size={18} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recurring {formData.type}</span>
                </div>
              </label>
              {formData.isRecurring && (
                <div className="mt-3 ml-6 space-y-3 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/[0.05]" style={{ overflow: 'visible' }}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Frequency *
                    </label>
                    <select
                      value={formData.recurringPeriod}
                      onChange={(e) => setFormData({ ...formData, recurringPeriod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.07] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white min-h-[44px] transition-all duration-200"
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
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] mt-auto flex-shrink-0">
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px] hover:scale-[1.02]"
              style={{ boxShadow: '0 0 15px rgba(99,102,241,0.2)' }}
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
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-white/[0.05] border border-gray-300 dark:border-white/[0.08] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.10] disabled:opacity-50 min-h-[44px] transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Edit Modal */}
      <Modal
        isOpen={showBulkEdit}
        onClose={() => setShowBulkEdit(false)}
        title={`Bulk Edit (${selectedExpenses.length} items)`}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleBulkUpdateSubmit} className="flex flex-col flex-1 h-[600px] max-h-full">
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

          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0 mt-auto">
            <button
              type="submit"
              disabled={bulkLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition min-h-[44px]"
            >
              {bulkLoading ? 'Updating...' : 'Update All'}
            </button>
            <button
              type="button"
              onClick={() => setShowBulkEdit(false)}
              disabled={bulkLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        title="Delete Expenses"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col h-full">
          <div className="p-6 space-y-4 flex-1">
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
              <Trash2 size={24} />
              <div>
                <p className="font-medium">Are you sure?</p>
                <p className="text-sm opacity-90">This action cannot be undone.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 mt-auto flex-shrink-0">
            <button
              type="button"
              onClick={confirmBulkDelete}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition min-h-[44px]"
            >
              Delete {selectedExpenses.length} Items
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDelete(false)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Add Form Modal */}
      <Modal
        isOpen={showBulkForm}
        onClose={() => { setShowBulkForm(false); resetBulkForm() }}
        title="Bulk Add Expenses"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleBulkSubmit} className="flex flex-col flex-1 h-[600px] max-h-[85vh]">
          {/* Content Area - Scrollable */}
          <div className="flex flex-col p-6 overflow-y-auto flex-1">
            {/* Date Selection - Fixed at top */}
            <div className="mb-4 flex-shrink-0 relative z-20">
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
            <div className="flex flex-col z-10">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Expenses
                </label>
                <button
                  type="button"
                  onClick={addBulkRow}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium min-h-[44px] flex items-center"
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
                  <div key={index} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex-shrink-0">
                    <div className="col-span-12 sm:col-span-4 w-full">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={expense.amount}
                        onChange={(e) => updateBulkRow(index, 'amount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[44px]"
                        placeholder="Amount"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-5 relative w-full">
                      <CategorySelector
                        categories={categories}
                        value={expense.category}
                        onChange={(categoryId) => updateBulkRow(index, 'category', categoryId)}
                        placeholder="Category"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-2 w-full">
                      <input
                        type="text"
                        value={expense.description}
                        onChange={(e) => updateBulkRow(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[44px]"
                        placeholder="Description"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-1 flex sm:block justify-end w-full sm:w-auto">
                      {bulkExpenses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBulkRow(index)}
                          className="w-full p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg min-h-[44px] flex items-center justify-center"
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

          {/* Form Actions - Fixed */}
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0 mt-auto">
            <button
              type="submit"
              disabled={bulkLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px]"
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
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
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
