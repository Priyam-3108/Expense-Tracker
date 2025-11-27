import { useState, useEffect, useMemo, useRef } from 'react'
import { useExpense } from '../context/ExpenseContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DateRangePicker from '../components/DateRangePicker'
import CategorySelector from '../components/CategorySelector'
import { formatCurrency, formatDate, formatDateForInput, calculatePercentage, getCurrentMonthRange, getLast30DaysRange } from '../utils/helpers'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, Filter, X,
  ArrowUpCircle, ArrowDownCircle, PieChart as PieChartIcon, BarChart3, Activity
} from 'lucide-react'
import { subDays, startOfYear, endOfYear, format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns'
import toast from 'react-hot-toast'

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#A855F7', '#F43F5E', '#0EA5E9', '#22C55E'
]

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

const Analytics = () => {
  const { user, currency } = useAuth()
  const {
    expenses,
    categories,
    stats,
    trends,
    loading,
    loadExpenses,
    loadStats,
    loadTrends,
    getCategoryStats
  } = useExpense()
  const { theme } = useTheme()

  // Determine if dark mode is active
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Filter state
  const [dateRange, setDateRange] = useState({
    startDate: formatDateForInput(startOfMonth(new Date())),
    endDate: formatDateForInput(endOfMonth(new Date()))
  })
  const [selectedCategory, setSelectedCategory] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'expense', 'income'
  const [categoryStats, setCategoryStats] = useState([])
  const [loadingStats, setLoadingStats] = useState(false)

  // Ref to prevent concurrent API calls
  const isLoadingRef = useRef(false)
  const lastFiltersRef = useRef({ startDate: '', endDate: '', category: '', type: '' })

  // Load data when filters change
  useEffect(() => {
    if (!user) return

    // Create a stable reference for dateRange values
    const startDate = dateRange.startDate || ''
    const endDate = dateRange.endDate || ''
    const category = selectedCategory || ''
    const type = filterType || 'all'

    // Check if filters actually changed
    const currentFilters = { startDate, endDate, category, type }
    const filtersChanged =
      lastFiltersRef.current.startDate !== startDate ||
      lastFiltersRef.current.endDate !== endDate ||
      lastFiltersRef.current.category !== category ||
      lastFiltersRef.current.type !== type

    // Prevent concurrent calls and unnecessary calls
    if (isLoadingRef.current || !filtersChanged) {
      return
    }

    const loadData = async () => {
      isLoadingRef.current = true
      lastFiltersRef.current = currentFilters
      setLoadingStats(true)

      try {
        await Promise.all([
          loadExpenses({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            category: category || undefined,
            type: type !== 'all' ? type : undefined
          }),
          loadStats({ startDate, endDate }),
          loadTrends(startDate ? new Date(startDate).getFullYear() : new Date().getFullYear())
        ])

        // Load category stats
        const stats = await getCategoryStats({ startDate, endDate })
        setCategoryStats(stats || [])
      } catch (error) {
        console.error('Error loading analytics data:', error)
        toast.error('Failed to load analytics data')
      } finally {
        setLoadingStats(false)
        isLoadingRef.current = false
      }
    }

    loadData()
  }, [user, dateRange.startDate, dateRange.endDate, selectedCategory, filterType])

  // Quick filter presets
  const applyQuickFilter = (preset) => {
    const now = new Date()
    let start, end

    switch (preset) {
      case 'today':
        start = formatDateForInput(now)
        end = formatDateForInput(now)
        break
      case 'week':
        start = formatDateForInput(startOfWeek(now))
        end = formatDateForInput(endOfWeek(now))
        break
      case 'month':
        const monthRange = getCurrentMonthRange()
        start = monthRange.startDate
        end = monthRange.endDate
        break
      case '30days':
        const daysRange = getLast30DaysRange()
        start = daysRange.startDate
        end = daysRange.endDate
        break
      case 'year':
        start = formatDateForInput(startOfYear(now))
        end = formatDateForInput(endOfYear(now))
        break
      default:
        return
    }

    setDateRange({ startDate: start, endDate: end })
  }

  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesCategory = !selectedCategory || expense.category?._id === selectedCategory || expense.category === selectedCategory
      const matchesType = filterType === 'all' || expense.type === filterType
      return matchesCategory && matchesType
    })
  }, [expenses, selectedCategory, filterType])

  // Calculate summary statistics
  const summary = useMemo(() => {
    let totalExpenses = 0
    let totalIncome = 0
    let transactionCount = 0
    let expenseCount = 0
    let incomeCount = 0

    filteredExpenses.forEach(expense => {
      if (expense.type === 'income') {
        totalIncome += expense.amount || 0
        incomeCount++
      } else {
        totalExpenses += expense.amount || 0
        expenseCount++
      }
      transactionCount++
    })

    const netAmount = totalIncome - totalExpenses
    const daysDiff = dateRange.startDate && dateRange.endDate
      ? Math.max(1, Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24)) + 1)
      : 1
    const avgDailyExpense = totalExpenses / daysDiff
    const avgDailyIncome = totalIncome / daysDiff

    return {
      totalExpenses,
      totalIncome,
      netAmount,
      transactionCount,
      expenseCount,
      incomeCount,
      avgDailyExpense,
      avgDailyIncome,
      daysDiff
    }
  }, [filteredExpenses, dateRange])

  // Prepare data for trend chart (daily)
  const trendData = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return []

    const start = parseISO(dateRange.startDate)
    const end = parseISO(dateRange.endDate)
    const days = eachDayOfInterval({ start, end })

    const dataMap = {}
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd')
      dataMap[key] = { date: format(day, 'MMM dd'), expenses: 0, income: 0, net: 0 }
    })

    filteredExpenses.forEach(expense => {
      const key = format(parseISO(expense.date), 'yyyy-MM-dd')
      if (dataMap[key]) {
        if (expense.type === 'income') {
          dataMap[key].income += expense.amount || 0
        } else {
          dataMap[key].expenses += expense.amount || 0
        }
        dataMap[key].net = dataMap[key].income - dataMap[key].expenses
      }
    })

    return Object.values(dataMap)
  }, [filteredExpenses, dateRange])

  // Prepare data for monthly comparison
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: parseISO(dateRange.startDate || new Date().toISOString()),
      end: parseISO(dateRange.endDate || new Date().toISOString())
    })

    return months.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const monthKey = format(month, 'MMM yyyy')

      let expenses = 0
      let income = 0

      filteredExpenses.forEach(expense => {
        const expenseDate = parseISO(expense.date)
        if (expenseDate >= monthStart && expenseDate <= monthEnd) {
          if (expense.type === 'income') {
            income += expense.amount || 0
          } else {
            expenses += expense.amount || 0
          }
        }
      })

      return {
        month: monthKey,
        expenses,
        income,
        net: income - expenses
      }
    })
  }, [filteredExpenses, dateRange])

  // Prepare data for category pie chart
  const categoryChartData = useMemo(() => {
    if (!categoryStats || categoryStats.length === 0) {
      // Fallback: calculate from expenses
      const categoryMap = {}
      filteredExpenses.forEach(expense => {
        if (expense.type === 'expense') {
          const categoryId = expense.category?._id || expense.category
          const category = categories?.find(c => c._id === categoryId)
          const categoryName = category?.name || 'Uncategorized'

          if (!categoryMap[categoryName]) {
            categoryMap[categoryName] = {
              name: categoryName,
              value: 0,
              color: category?.color || '#3B82F6',
              icon: category?.icon || '💰'
            }
          }
          categoryMap[categoryName].value += expense.amount || 0
        }
      })

      return Object.values(categoryMap).sort((a, b) => b.value - a.value)
    }

    // Map from backend stats structure
    return categoryStats
      .filter(stat => stat.totalAmount > 0)
      .map((stat, index) => ({
        name: stat.categoryName || 'Uncategorized',
        value: stat.totalAmount,
        color: stat.categoryColor || COLORS[index % COLORS.length],
        count: stat.count || 0
      }))
      .sort((a, b) => b.value - a.value)
  }, [categoryStats, filteredExpenses, categories])

  // Top categories
  const topCategories = useMemo(() => {
    return categoryChartData.slice(0, 5)
  }, [categoryChartData])

  const clearFilters = () => {
    setDateRange({
      startDate: formatDateForInput(startOfMonth(new Date())),
      endDate: formatDateForInput(endOfMonth(new Date()))
    })
    setSelectedCategory('')
    setFilterType('all')
  }

  const hasActiveFilters = selectedCategory || filterType !== 'all' ||
    dateRange.startDate !== formatDateForInput(startOfMonth(new Date())) ||
    dateRange.endDate !== formatDateForInput(endOfMonth(new Date()))

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">View your expense analytics and insights</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        {/* Filter Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <Filter size={20} className="text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Filters</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Customize your analytics view</p>
            </div>
          </div>
        </div>

        {/* Filter Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
                Date Range
              </label>
              <div className="relative">
                <DateRangePicker
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onStartDateChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                  onEndDateChange={(date) => setDateRange({ ...dateRange, endDate: date })}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <PieChartIcon size={16} className="text-gray-500 dark:text-gray-400" />
                Category
              </label>
              <div className="relative flex gap-2">
                <div className="flex-1">
                  <CategorySelector
                    value={selectedCategory}
                    onChange={(categoryId) => setSelectedCategory(categoryId)}
                    placeholder="All Categories"
                  />
                </div>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="p-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 flex items-center justify-center"
                    title="Clear category filter"
                  >
                    <X size={16} className="text-gray-600 dark:text-gray-300" />
                  </button>
                )}
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <BarChart3 size={16} className="text-gray-500 dark:text-gray-400" />
                Type
              </label>
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Expenses', value: 'expense' },
                  { label: 'Income', value: 'income' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilterType(option.value)}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${filterType === option.value
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Activity size={16} className="text-gray-500 dark:text-gray-400" />
                Quick Filters
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: 'Today', value: 'today' },
                  { label: 'Week', value: 'week' },
                  { label: 'Month', value: 'month' },
                  { label: '30 Days', value: '30days' },
                  { label: 'Year', value: 'year' }
                ].map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => applyQuickFilter(preset.value)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm transition-all duration-200"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm transition-all duration-200"
              >
                <X size={16} />
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Expenses</p>
              <p className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(summary.totalExpenses, currency)}
              </p>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                {summary.expenseCount} transaction{summary.expenseCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-3 bg-blue-200 dark:bg-blue-800/40 rounded-lg">
              <ArrowDownCircle size={24} className="text-blue-700 dark:text-blue-300" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg border border-emerald-200 dark:border-emerald-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Income</p>
              <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {formatCurrency(summary.totalIncome, currency)}
              </p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                {summary.incomeCount} transaction{summary.incomeCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-3 bg-emerald-200 dark:bg-emerald-800/40 rounded-lg">
              <ArrowUpCircle size={24} className="text-emerald-700 dark:text-emerald-300" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br rounded-lg border p-6 shadow-sm ${summary.netAmount >= 0
          ? 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800'
          : 'from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 border-rose-200 dark:border-rose-800'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${summary.netAmount >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                }`}>
                Net Balance
              </p>
              <p className={`mt-2 text-2xl font-bold ${summary.netAmount >= 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-rose-900 dark:text-rose-100'
                }`}>
                {formatCurrency(Math.abs(summary.netAmount), currency)}
              </p>
              <div className="mt-1 flex items-center gap-1">
                {summary.netAmount >= 0 ? (
                  <TrendingUp size={12} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown size={12} className="text-rose-600 dark:text-rose-400" />
                )}
                <p className={`text-xs ${summary.netAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                  {summary.netAmount >= 0 ? 'Positive' : 'Negative'}
                </p>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${summary.netAmount >= 0 ? 'bg-emerald-200 dark:bg-emerald-800/40' : 'bg-rose-200 dark:bg-rose-800/40'
              }`}>
              <span className="p-2 font-large text-gray-600 dark:text-gray-300">{currencySymbols[currency]}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Daily Spending</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.avgDailyExpense, currency)}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Over {summary.daysDiff} day{summary.daysDiff !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Activity size={24} className="text-gray-600 dark:text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trends Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Spending Trends</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Daily expenses and income over time</p>
            </div>
            <Activity size={20} className="text-gray-400 dark:text-gray-500" />
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#6B7280"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value, currency).replace(/[^\d.-]/g, '')}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1F2937' : '#fff',
                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    padding: '8px',
                    color: isDark ? '#F3F4F6' : '#374151'
                  }}
                  itemStyle={{ color: isDark ? '#F3F4F6' : '#374151' }}
                  formatter={(value, name) => [
                    formatCurrency(value, currency),
                    name === 'expenses' ? 'Expenses' : name === 'income' ? 'Income' : 'Net'
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#EF4444"
                  fillOpacity={1}
                  fill="url(#colorExpenses)"
                  name="Expenses"
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name="Income"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">
              <p>No data available for the selected period</p>
            </div>
          )}
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Breakdown</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expense distribution by category</p>
            </div>
            <PieChartIcon size={20} className="text-gray-400 dark:text-gray-500" />
          </div>
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1F2937' : '#fff',
                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    padding: '8px',
                    color: isDark ? '#F3F4F6' : '#374151'
                  }}
                  itemStyle={{ color: isDark ? '#F3F4F6' : '#374151' }}
                  formatter={(value) => formatCurrency(value, currency)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">
              <p>No category data available</p>
            </div>
          )}
        </div>

        {/* Monthly Comparison Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Comparison</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expenses and income by month</p>
            </div>
            <BarChart3 size={20} className="text-gray-400 dark:text-gray-500" />
          </div>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300} className="bg-transparent">
              <BarChart data={monthlyData} style={{ backgroundColor: 'transparent' }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#D1D5DB'} fill="transparent" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke={isDark ? '#9CA3AF' : '#4B5563'} 
                  tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#4B5563' }}
                />
                <YAxis
                  stroke={isDark ? '#9CA3AF' : '#4B5563'}
                  tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#4B5563' }}
                  tickFormatter={(value) => formatCurrency(value, currency).replace(/[^\d.-]/g, '')}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                    borderRadius: '8px',
                    padding: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#F3F4F6' : '#1F2937'
                  }}
                  itemStyle={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                  formatter={(value) => formatCurrency(value, currency)}
                  cursor={{ fill: isDark ? '#374151' : '#F3F4F6', opacity: 0.4 }}
                />
                <Legend wrapperStyle={{ color: isDark ? '#F3F4F6' : '#374151', paddingTop: '10px' }} />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
                <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">
              <p>No monthly data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Categories & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Spending Categories</h3>
          {topCategories.length > 0 ? (
            <div className="space-y-4">
              {topCategories.map((category, index) => {
                const percentage = calculatePercentage(category.value, summary.totalExpenses)
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          {categories?.find(c => c.name === category.name)?.icon || '💰'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{category.count || 0} transaction{category.count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(category.value, currency)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{percentage}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: category.color
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <p>No category data available</p>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Insights</h3>
          <div className="space-y-4">
            {summary.totalExpenses > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/40">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-200 dark:bg-blue-800/40 rounded-lg">
                    <TrendingUp size={18} className="text-blue-700 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Total Transactions</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      You have {summary.transactionCount} transaction{summary.transactionCount !== 1 ? 's' : ''} in the selected period
                    </p>
                  </div>
                </div>
              </div>
            )}

            {summary.avgDailyExpense > 0 && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/40">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-200 dark:bg-emerald-800/40 rounded-lg">
                    <Calendar size={18} className="text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-900 dark:text-emerald-100">Average Daily Spending</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                      You spend an average of {formatCurrency(summary.avgDailyExpense, currency)} per day
                    </p>
                  </div>
                </div>
              </div>
            )}

            {topCategories.length > 0 && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800/40">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-200 dark:bg-purple-800/40 rounded-lg">
                    <PieChartIcon size={18} className="text-purple-700 dark:text-purple-300" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-900 dark:text-purple-100">Top Category</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      {topCategories[0]?.name} is your highest spending category at {formatCurrency(topCategories[0]?.value || 0, currency)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {summary.netAmount < 0 && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-100 dark:border-rose-800/40">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-200 dark:bg-rose-800/40 rounded-lg">
                    <TrendingDown size={18} className="text-rose-700 dark:text-rose-300" />
                  </div>
                  <div>
                    <p className="font-medium text-rose-900 dark:text-rose-100">Spending Alert</p>
                    <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">
                      Your expenses exceed income by {formatCurrency(Math.abs(summary.netAmount), currency)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {summary.netAmount >= 0 && summary.totalIncome > 0 && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/40">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-200 dark:bg-emerald-800/40 rounded-lg">
                    <TrendingUp size={18} className="text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-900 dark:text-emerald-100">Positive Balance</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                      Great! You have a positive net balance of {formatCurrency(summary.netAmount, currency)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {filteredExpenses.length === 0 && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <p>No data available for the selected filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
