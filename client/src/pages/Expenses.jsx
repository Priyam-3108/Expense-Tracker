import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
import Amount from '../components/Amount'
import { usePrivacy } from '../context/PrivacyContext'
import Modal from '../components/Modal'
import AmountHero from '../components/form/AmountHero'
import SegmentedToggle from '../components/form/SegmentedToggle'
import SectionLabel from '../components/form/SectionLabel'
import FieldCard from '../components/form/FieldCard'
import CategoryChips from '../components/form/CategoryChips'
import StickyFormFooter from '../components/form/StickyFormFooter'
import { formatCurrency, formatDate, formatDateForInput, parseDateLocal, getTodayDate } from '../utils/helpers'
import {
    Plus,
    Search,
    X,
    Download,
    Upload,
    SlidersHorizontal,
    List,
    LayoutGrid,
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FileText,
    Receipt,
    Layers,
    ArrowDownCircle,
    ArrowUpCircle,
    Repeat,
    Edit,
    Trash2
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
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
  const { isPrivate } = usePrivacy()
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
  const [openRow, setOpenRow] = useState(null) // mobile: which ledger row shows its actions
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [calendarExpenses, setCalendarExpenses] = useState([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null) // For calendar date selection

  const location = useLocation()
  const navigate = useNavigate()

  // Seed dateRange from heatmap click on mount
  useEffect(() => {
    const d = location.state?.date
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      setDateRange({ startDate: d, endDate: d })
      setPage(1)
      navigate(location.pathname, { replace: true, state: null })
    }
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      cell: info => <span className="font-mono tabular-nums text-xs text-gray-500 dark:text-[#85858b]">{formatDate(info.getValue(), 'MMM dd, yyyy')}</span>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.original.category || categories?.find(c => c._id === row.original.category)
        return (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: category?.color || '#a3a3a3' }} />
            <span>{category?.name || 'Uncategorized'}</span>
          </div>
        )
      }
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="inline-flex items-center flex-wrap gap-1">
          <span className="text-gray-600 dark:text-[#a1a1a6]">{row.original.description || '-'}</span>
        </span>
      )
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = row.original.amount
        const isIncome = row.original.type === 'income'
        return (
          <span className={`tabular-nums ${isIncome ? 'text-green-600 dark:text-[#4cc38a]' : 'text-gray-900 dark:text-[#ededed]'}`}>
            <Amount value={amount} currency={currency} sign={isIncome ? '+' : '−'} />
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-medium text-gray-900 dark:text-[#ededed]">Expenses</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#a1a1a6]">
            Every entry in your ledger, spending and income
          </p>
        </div>
        <div className="flex items-center gap-2 lg:flex-wrap">
          {/* View Toggle */}
          <div className="flex-1 sm:flex-none inline-flex gap-1 rounded-[10px] border border-gray-200 dark:border-white/[0.06] bg-gray-100 dark:bg-white/[0.04] p-1">
            <button
              onClick={() => { setViewMode('list') }}
              className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 h-8 text-sm rounded-md transition-colors ${viewMode === 'list'
                ? 'bg-white dark:bg-[#2a2a2c] text-gray-900 dark:text-[#ededed] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'text-gray-600 dark:text-[#a1a1a6] hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <List size={16} strokeWidth={1.5} />
              List
            </button>
            <button
              onClick={() => { setViewMode('calendar') }}
              className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 h-8 text-sm rounded-md transition-colors ${viewMode === 'calendar'
                ? 'bg-white dark:bg-[#2a2a2c] text-gray-900 dark:text-[#ededed] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'text-gray-600 dark:text-[#a1a1a6] hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <CalendarIcon size={16} strokeWidth={1.5} />
              Calendar
            </button>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-white/[0.08]"></div>

          {/* Action Buttons */}
          <button
            onClick={() => {
              resetBulkForm()
              setShowBulkForm(true)
            }}
            className="glass-btn !px-0 w-10 sm:w-auto sm:!px-5"
            aria-label="Bulk add"
          >
            <Layers size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">Bulk add</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="glass-btn !px-0 w-10 sm:w-auto sm:!px-5"
            aria-label="Import"
          >
            <Upload size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="glass-btn !px-0 w-10 sm:w-auto sm:!px-5"
            aria-label="Export"
          >
            <Download size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="btn-primary btn-md !hidden md:!inline-flex"
          >
            <Plus size={16} strokeWidth={1.5} />
            Add expense
          </button>
        </div>
      </div>

      {/* Summary: net leads, closed with the double rule */}
      <div className="glass-card grid grid-cols-2 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] mb-4">
        <div className="col-span-2 md:col-span-1 p-4 md:p-5 border-b md:border-b-0 md:border-r border-gray-200 dark:border-white/[0.07]">
          <p className="text-sm text-gray-600 dark:text-[#a1a1a6]">Net for selected dates</p>
          <p className={`mt-3 pb-2 text-[26px] md:text-[28px] leading-none font-medium tabular-nums ${netAmount < 0 ? 'text-red-600 dark:text-[#e5484d]' : 'text-gray-900 dark:text-[#ededed]'}`}>
            <Amount value={Math.abs(netAmount)} currency={currency} sign={netAmount < 0 ? '−' : netAmount > 0 ? '+' : undefined} className="double-rule" />
          </p>
        </div>
        <div className="p-4 md:p-5 border-r border-gray-200 dark:border-white/[0.07]">
          <p className="text-sm text-gray-600 dark:text-[#a1a1a6]">Income</p>
          <p className="mt-2 md:mt-3 text-base md:text-lg md:text-xl leading-none font-medium tabular-nums text-gray-900 dark:text-[#ededed]">
            <Amount value={totalIncomeAmount} currency={currency} />
          </p>
        </div>
        <div className="p-4 md:p-5">
          <p className="text-sm text-gray-600 dark:text-[#a1a1a6]">Expenses</p>
          <p className="mt-2 md:mt-3 text-base md:text-lg md:text-xl leading-none font-medium tabular-nums text-gray-900 dark:text-[#ededed]">
            <Amount value={totalExpenseAmount} currency={currency} />
          </p>
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
          <div className="md:hidden space-y-3 pb-24">
            {/* Mobile search bar */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-[#85858b]" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                className="w-full h-11 pl-10 pr-4 glass-input text-base"
              />
            </div>

            {/* Ledger, grouped by day */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 dark:border-white/[0.08] border-t-brass" />
              </div>
            ) : expenses.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No expenses found"
                description="Add an expense or income and it shows up here."
              />
            ) : (
              <div className="glass-card overflow-hidden">
                {expenses.reduce((groups, e) => {
                  const day = String(e.date).slice(0, 10)
                  const last = groups[groups.length - 1]
                  if (last && last.day === day) last.items.push(e)
                  else groups.push({ day, items: [e] })
                  return groups
                }, []).map(({ day, items }) => {
                  const net = items.reduce((s, e) => s + (e.type === 'income' ? e.amount : -e.amount), 0)
                  return (
                    <section key={day} className="border-b last:border-b-0 border-gray-200 dark:border-white/[0.07]">
                      <h3 className="flex items-center justify-between h-9 px-4 text-xs bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
                        <span className="text-gray-600 dark:text-[#a1a1a6]">{format(parseDateLocal(day), 'EEE, MMM d')}</span>
                        <Amount value={Math.abs(net)} currency={currency} sign={net < 0 ? '−' : '+'} className="font-mono tabular-nums text-gray-500 dark:text-[#85858b]" />
                      </h3>
                      <ul className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {items.map((expense) => (
                          <MobileExpenseCard
                            key={expense._id}
                            expense={expense}
                            currency={currency}
                            open={openRow === expense._id}
                            onToggle={() => setOpenRow(openRow === expense._id ? null : expense._id)}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                      </ul>
                    </section>
                  )
                })}
              </div>
            )}

            {/* Mobile pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm tabular-nums text-gray-500 dark:text-[#85858b]">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={pagination.currentPage <= 1}
                    className="btn-secondary btn-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="btn-secondary btn-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      {/* Mobile: primary action floats above the bottom nav */}
      <button
        type="button"
        onClick={() => {
          resetForm()
          setShowForm(true)
        }}
        aria-label="Add expense"
        className="md:hidden fixed right-4 z-30 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.5rem)] h-14 w-14 rounded-2xl inline-flex items-center justify-center bg-[#171717] text-white dark:bg-[#ededed] dark:text-[#171717] shadow-[0_8px_24px_rgba(0,0,0,0.18)] active:scale-[0.97] transition-transform focus-ring"
      >
        <Plus size={22} strokeWidth={1.75} />
      </button>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <>
          {/* Filters for Calendar View */}
          <div className="glass-card p-4 mb-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-[#85858b]" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 glass-input text-base md:text-sm"
                  />
                </div>

                <div className="flex gap-1 p-1 rounded-[10px] border border-gray-200 dark:border-white/[0.06] bg-gray-100 dark:bg-white/[0.04]">
                  {[
                    { label: 'All', value: 'all' },
                    { label: 'Expenses', value: 'expense' },
                    { label: 'Income', value: 'income' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFilterType(option.value)}
                      className={`flex-1 md:flex-none px-4 h-9 rounded-md text-sm transition-colors ${filterType === option.value
                        ? 'bg-white dark:bg-[#2a2a2c] text-gray-900 dark:text-[#ededed] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                        : 'text-gray-600 dark:text-[#a1a1a6] hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center gap-2 rounded-lg h-11 px-4 text-sm text-gray-600 dark:text-[#a1a1a6] hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <X size={16} />
                    Clear
                  </button>
                )}
              </div>

              {/* Date range Picker */}
              <div className="w-full md:w-auto">
                <DateRangePicker
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onChange={(startDate, endDate) => setDateRange((r) => ({ ...r, startDate, endDate }))}
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-3 sm:p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
              <button
                onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
                className="hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors text-gray-600 dark:text-[#a1a1a6] h-10 w-10 flex items-center justify-center border border-gray-200 dark:border-white/[0.08]"
                title="Previous month"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>

              {/* Mobile: just Month Year + Today */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center">
                <h2 className="text-base sm:text-xl font-medium text-gray-900 dark:text-[#ededed]">
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
                  className="px-2.5 h-7 text-xs sm:text-sm text-gray-600 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-md transition-colors border border-gray-200 dark:border-white/[0.08]"
                >
                  Today
                </button>
              </div>

              <button
                onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
                className="hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors text-gray-600 dark:text-[#a1a1a6] h-10 w-10 flex items-center justify-center border border-gray-200 dark:border-white/[0.08]"
                title="Next month"
                aria-label="Next month"
              >
                <ChevronRight size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1 sm:gap-1">
              {/* Day headers */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="p-1 sm:p-2 text-center text-xs font-medium text-gray-500 dark:text-[#85858b]">
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
                    className={`h-12 sm:h-auto sm:min-h-[100px] sm:p-2 flex flex-col items-center sm:items-stretch justify-start pt-1 sm:pt-2 sm:border border-gray-200 dark:border-white/[0.05] rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04] ${!isCurrentMonth ? 'opacity-35' : 'sm:bg-white sm:dark:bg-white/[0.02]'
                      } ${isToday ? 'sm:ring-1 sm:ring-brass' : ''}`}
                  >
                    <div className={`w-7 h-7 sm:w-auto sm:h-auto flex items-center justify-center sm:justify-start rounded-full text-sm tabular-nums sm:mb-1 ${isToday ? 'bg-gray-900 text-white dark:bg-[#ededed] dark:text-[#171717] sm:bg-transparent sm:text-brass-700 sm:dark:bg-transparent sm:dark:text-brass font-medium' : isCurrentMonth ? 'text-gray-900 dark:text-[#ededed]' : 'text-gray-400 dark:text-[#85858b]'}`}>
                      {format(day, 'd')}
                    </div>

                    {/* Mobile: coloured dots only */}
                    {dayExpenses.length > 0 && (
                      <div className="mt-1 flex gap-1 sm:hidden" aria-label={`${dayExpenses.length} entries`}>
                        {expenseCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-brass" />}
                        {incomeCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-[#4cc38a]" />}
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
                            title={`${category?.name || 'Uncategorized'}: ${isPrivate ? '••••••' : formatCurrency(expense.amount, currency)}`}
                          >
                            <Amount value={expense.amount} currency={currency} sign={isIncome ? '+' : '-'} />
                          </div>
                        )
                      })}
                      {dayExpenses.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-[#a1a1a6] font-medium">
                          +{dayExpenses.length - 3} more
                        </div>
                      )}
                    </div>

                    {/* Desktop total */}
                    {dayExpenses.length > 0 && (
                      <div className={`hidden sm:block text-xs font-medium mt-1 ${totalAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                        <Amount value={Math.abs(totalAmount)} currency={currency} sign={totalAmount >= 0 ? '+' : ''} />
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
        title={null}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-[600px] max-h-[85vh]">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <AmountHero
              value={formData.amount}
              onChange={(v) => setFormData({ ...formData, amount: v })}
              variant={formData.type}
              currencySymbol={currencySymbols[currency] || '$'}
              label={`Amount (${currencySymbols[currency] || '$'})`}
            >
              <div className="flex items-center gap-2">
                <DatePicker
                  value={formData.date}
                  onChange={(date) => setFormData({ ...formData, date })}
                  placeholder="Select date"
                  ariaLabel="Transaction date"
                />
              </div>
            </AmountHero>

            <SegmentedToggle
              value={formData.type}
              onChange={(t) => setFormData({ ...formData, type: t })}
              options={[
                { value: 'expense', label: 'Expense', icon: <ArrowDownCircle size={18} />, activeColor: 'text-rose-600 dark:text-rose-400' },
                { value: 'income', label: 'Income', icon: <ArrowUpCircle size={18} />, activeColor: 'text-emerald-600 dark:text-emerald-400' },
              ]}
            />

            <div>
              <SectionLabel>Category *</SectionLabel>
              <CategoryChips
                categories={categories}
                value={formData.category}
                onChange={(id) => setFormData({ ...formData, category: id })}
              />
            </div>

            <div>
              <SectionLabel>Notes (optional)</SectionLabel>
              <FieldCard className="p-4">
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
                  placeholder="e.g. Grocery run, monthly salary…"
                />
              </FieldCard>
            </div>

            <div>
              <FieldCard className="p-4">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Repeat size={18} className="text-gray-600 dark:text-[#a1a1a6]" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Recurring {formData.type}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isRecurring: e.target.checked,
                        recurringEndDate: e.target.checked ? formData.recurringEndDate : '',
                      })
                    }
                    className="w-5 h-5 text-brass-600 border-gray-300 dark:border-white/[0.15] rounded focus:ring-brass-500"
                  />
                </label>

                {formData.isRecurring && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <SectionLabel>Frequency *</SectionLabel>
                      <div className="flex flex-wrap gap-2">
                        {['weekly', 'monthly', 'yearly'].map((p) => {
                          const active = formData.recurringPeriod === p
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setFormData({ ...formData, recurringPeriod: p })}
                              className={`px-3.5 py-2 rounded-lg text-sm capitalize min-h-[40px] border transition-colors
                                ${active
                                  ? 'bg-gray-900 border-gray-900 text-white dark:bg-[#ededed] dark:border-[#ededed] dark:text-[#171717]'
                                  : 'bg-transparent border-gray-300 dark:border-white/[0.15] text-gray-700 dark:text-[#a1a1a6]'
                                }`}
                            >
                              {p}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="relative" style={{ zIndex: 1000 }}>
                      <SectionLabel>End Date *</SectionLabel>
                      <DatePicker
                        value={formData.recurringEndDate}
                        onChange={(date) => setFormData({ ...formData, recurringEndDate: date })}
                        placeholder="Select end date"
                      />
                      <p className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-1">
                        Recurring entries will be created from the start date through this end date.
                      </p>
                    </div>
                  </div>
                )}
              </FieldCard>
            </div>
          </div>

          <StickyFormFooter
            variant={formData.type}
            loading={formLoading}
            label={editingExpense ? 'Update' : 'Add'}
            loadingLabel={editingExpense ? 'Updating…' : 'Adding…'}
            onCancel={() => { setShowForm(false); resetForm() }}
          />
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
            <p className="text-sm text-gray-500 dark:text-[#a1a1a6] mb-4">
              Update details for each selected expense below.
            </p>

            <BulkEditList
              expenses={selectedExpenses}
              categories={categories}
              currency={currency}
              onExpensesChange={setEditableExpenses}
            />
          </div>

          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] flex-shrink-0 mt-auto">
            <button
              type="submit"
              disabled={bulkLoading}
              className="btn-primary btn-md flex-1"
            >
              {bulkLoading ? 'Updating...' : 'Save all'}
            </button>
            <button
              type="button"
              onClick={() => setShowBulkEdit(false)}
              disabled={bulkLoading}
              className="btn-secondary btn-md flex-1"
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
        title="Delete entries"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col h-full">
          <div className="p-6 space-y-4 flex-1">
            <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 rounded-xl">
              <Trash2 size={24} />
              <div>
                <p className="font-medium">Are you sure?</p>
                <p className="text-sm opacity-90">This action cannot be undone.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] mt-auto flex-shrink-0">
            <button
              type="button"
              onClick={confirmBulkDelete}
              className="btn-danger btn-md flex-1"
            >
              Delete {selectedExpenses.length} Items
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDelete(false)}
              className="btn-secondary btn-md flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk add Form Modal */}
      <Modal
        isOpen={showBulkForm}
        onClose={() => { setShowBulkForm(false); resetBulkForm() }}
        title="Bulk add Expenses"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleBulkSubmit} className="flex flex-col flex-1 h-[600px] max-h-[85vh]">
          {/* Content Area - Scrollable */}
          <div className="flex flex-col p-6 overflow-y-auto flex-1">
            {/* Date Selection - Fixed at top */}
            <div className="mb-4 flex-shrink-0 relative z-20">
              <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a6] mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a6]">
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
                  <div key={index} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 items-start p-3 border border-gray-200 dark:border-white/[0.08] rounded-lg flex-shrink-0">
                    <div className="col-span-12 sm:col-span-4 w-full">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={expense.amount}
                        onChange={(e) => updateBulkRow(index, 'amount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#232325] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[44px]"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#232325] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[44px]"
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
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] flex-shrink-0 mt-auto">
            <button
              type="submit"
              disabled={bulkLoading}
              className="btn-primary btn-md flex-1"
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
              className="btn-secondary btn-md flex-1"
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
