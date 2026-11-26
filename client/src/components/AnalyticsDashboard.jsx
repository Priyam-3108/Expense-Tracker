import { useState, useMemo, useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import { usePrivacy } from '../context/PrivacyContext'
import Amount from './Amount'
import DateRangePicker from './DateRangePicker'
import CategorySelector from './CategorySelector'
import { formatCurrency, formatDateForInput, calculatePercentage, getCurrentMonthRange, getLast30DaysRange } from '../utils/helpers'
import { analyticsService } from '../services/analyticsService'
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import {
    TrendingUp, TrendingDown, Calendar, X,
    ArrowUpCircle, ArrowDownCircle, PieChart as PieChartIcon, Share2, SearchX
} from 'lucide-react'
import EmptyState from './EmptyState'
import { startOfYear, endOfYear, format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachMonthOfInterval } from 'date-fns'

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

const AnalyticsDashboard = ({
    expenses = [],
    categories = [],
    loading = false,
    currency = 'USD',
    dateRange,
    setDateRange,
    selectedCategory,
    setSelectedCategory,
    filterType,
    setFilterType,
    onShare,
    isSharedView = false,
    shareEnabled = false
}) => {
    const { theme } = useTheme()
    const { isPrivate } = usePrivacy()
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const chart = isDark
        ? { expense: '#d4954a', income: '#85858b', grid: 'rgba(237,237,237,0.06)', tick: '#85858b', cursor: 'rgba(237,237,237,0.04)' }
        : { expense: '#a8611c', income: '#a3a3a3', grid: 'rgba(23,23,23,0.06)', tick: '#737373', cursor: 'rgba(23,23,23,0.03)' }
    const tick = { fontSize: 12, fill: chart.tick, fontFamily: 'IBM Plex Mono, monospace' }
    const tooltipStyle = {
        backgroundColor: isDark ? '#19191b' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(237,237,237,0.08)' : 'rgba(23,23,23,0.08)'}`,
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        color: isDark ? '#ededed' : '#171717',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
    }
    const tooltipItem = { color: isDark ? '#ededed' : '#171717' }

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
        // Handle invalid dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return []

        const days = eachDayOfInterval({ start, end })

        const dataMap = {}
        days.forEach(day => {
            const key = format(day, 'yyyy-MM-dd')
            dataMap[key] = { date: format(day, 'MMM dd'), expenses: 0, income: 0, net: 0 }
        })

        filteredExpenses.forEach(expense => {
            if (!expense.date) return
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
        if (!dateRange.startDate || !dateRange.endDate) return []

        const start = parseISO(dateRange.startDate)
        const end = parseISO(dateRange.endDate)
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return []

        const months = eachMonthOfInterval({ start, end })

        return months.map(month => {
            const monthStart = startOfMonth(month)
            const monthEnd = endOfMonth(month)
            const monthKey = format(month, 'MMM yyyy')

            let expenses = 0
            let income = 0

            filteredExpenses.forEach(expense => {
                if (!expense.date) return
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
                        icon: category?.icon || '💰',
                        count: 0
                    }
                }
                categoryMap[categoryName].value += expense.amount || 0
                categoryMap[categoryName].count += 1
            }
        })

        return Object.values(categoryMap).sort((a, b) => b.value - a.value)
    }, [filteredExpenses, categories])

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

    // Chart visibility state
    const [visibleSeries, setVisibleSeries] = useState({
        expenses: true,
        income: true
    })

    const handleLegendClick = (e) => {
        const { value } = e
        const key = value.toLowerCase()
        setVisibleSeries(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    // Full-page spinner only for the first load; later refetches keep the page (and the date picker) mounted
    const loadedOnce = useRef(false)
    if (!loading) loadedOnce.current = true
    if (loading && !loadedOnce.current) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 dark:border-white/[0.08] border-t-brass mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-[#85858b]">Loading analytics</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
            {/* Header */}
            <div className="flex flex-row items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-[28px] leading-tight font-medium text-gray-900 dark:text-[#ededed]">
                        {isSharedView ? 'Shared analytics' : 'Analytics'}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-[#a1a1a6]">
                        {isSharedView ? 'A read-only view of this ledger' : 'Where the money went, by date, category and type'}
                    </p>
                </div>
                {!isSharedView && onShare && (
                    <button
                        onClick={onShare}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-sm font-medium min-h-[40px] flex-shrink-0 ${
                            shareEnabled
                                ? 'btn-secondary'
                                : 'btn-primary'
                        }`}
                    >
                        <Share2 size={16} strokeWidth={1.5} />
                        <span className="hidden sm:inline">{shareEnabled ? 'Sharing on' : 'Share analytics'}</span>
                        <span className="sm:hidden">{shareEnabled ? 'Shared' : 'Share'}</span>
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="glass-card overflow-hidden">
                {/* Filter Content */}
                <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Date range */}
                        <div className="space-y-2">
                            <label className="block text-sm text-gray-600 dark:text-[#a1a1a6]">
                                Date range
                            </label>
                            <div className="relative">
                                <DateRangePicker
                                    startDate={dateRange.startDate}
                                    endDate={dateRange.endDate}
                                    onChange={(startDate, endDate) => setDateRange((r) => ({ ...r, startDate, endDate }))}
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="space-y-2">
                            <label className="block text-sm text-gray-600 dark:text-[#a1a1a6]">
                                Category
                            </label>
                            <div className="relative flex gap-2">
                                <div className="flex-1">
                                    <CategorySelector
                                        value={selectedCategory}
                                        onChange={(categoryId) => setSelectedCategory(categoryId)}
                                        placeholder="All categories"
                                        categories={categories} // Pass categories explicitly
                                        disabled={isSharedView && categories.length === 0}
                                    />
                                </div>
                                {selectedCategory && (
                                    <button
                                        onClick={() => setSelectedCategory('')}
                                        className="p-2.5 bg-gray-100 dark:bg-[#232325] border border-gray-300 dark:border-white/[0.08] rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex items-center justify-center"
                                        title="Clear category filter"
                                    >
                                        <X size={16} className="text-gray-600 dark:text-[#a1a1a6]" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Type Filter */}
                        <div className="space-y-2">
                            <label className="block text-sm text-gray-600 dark:text-[#a1a1a6]">
                                Type
                            </label>
                            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/[0.04] rounded-[10px] border border-gray-200 dark:border-white/[0.06]">
                                {[
                                    { label: 'All', value: 'all' },
                                    { label: 'Expenses', value: 'expense' },
                                    { label: 'Income', value: 'income' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFilterType(option.value)}
                                        className={`flex-1 rounded-md px-3 h-8 text-sm transition-colors ${filterType === option.value
                                            ? 'bg-white dark:bg-[#2a2a2c] text-gray-900 dark:text-[#ededed] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                                            : 'text-gray-600 dark:text-[#a1a1a6] hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Filters */}
                        <div className="space-y-2">
                            <label className="block text-sm text-gray-600 dark:text-[#a1a1a6]">
                                Quick range
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { label: 'Today', value: 'today' },
                                    { label: 'Week', value: 'week' },
                                    { label: 'Month', value: 'month' },
                                    { label: '30 days', value: '30days' },
                                    { label: 'Year', value: 'year' }
                                ].map(preset => (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        onClick={() => applyQuickFilter(preset.value)}
                                        className="px-3 h-8 text-sm text-gray-700 dark:text-[#a1a1a6] bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.08] transition-colors"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Clear filters Button */}
                    {hasActiveFilters && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/[0.05] flex justify-end">
                            <button
                                onClick={clearFilters}
                                className="btn-ghost btn-sm"
                            >
                                <X size={16} strokeWidth={1.5} />
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-5">
                  <p className="text-sm text-gray-600 dark:text-[#a1a1a6]">Expenses</p>
                  <p className={"mt-2 text-xl md:text-2xl leading-none font-medium tabular-nums text-gray-900 dark:text-[#ededed]"}>
                    <Amount value={summary.totalExpenses} currency={currency} />
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-[#85858b]">{summary.expenseCount} transaction{summary.expenseCount !== 1 ? 's' : ''}</p>
                </div>

                <div className="glass-card p-5">
                  <p className="text-sm text-gray-600 dark:text-[#a1a1a6]">Income</p>
                  <p className={"mt-2 text-xl md:text-2xl leading-none font-medium tabular-nums text-gray-900 dark:text-[#ededed]"}>
                    <Amount value={summary.totalIncome} currency={currency} />
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-[#85858b]">{summary.incomeCount} transaction{summary.incomeCount !== 1 ? 's' : ''}</p>
                </div>

                <div className="glass-card p-5">
                  <p className="text-sm text-gray-600 dark:text-[#a1a1a6]">Net</p>
                  <p className={`mt-2 text-xl md:text-2xl leading-none font-medium tabular-nums ${summary.netAmount >= 0 ? 'text-green-600 dark:text-[#4cc38a]' : 'text-red-600 dark:text-[#e5484d]'}`}>
                    <Amount value={Math.abs(summary.netAmount)} currency={currency} sign={summary.netAmount < 0 ? '−' : undefined} />
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-[#85858b]">Income minus expenses</p>
                </div>

                <div className="glass-card p-5">
                  <p className="text-sm text-gray-600 dark:text-[#a1a1a6]">Average per day</p>
                  <p className={"mt-2 text-xl md:text-2xl leading-none font-medium tabular-nums text-gray-900 dark:text-[#ededed]"}>
                    <Amount value={summary.avgDailyExpense} currency={currency} />
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-[#85858b]">Over {summary.daysDiff} day{summary.daysDiff !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spending Trends Line Chart */}
                <div className="glass-card p-4 sm:p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div>
                            <h3 className="text-base font-medium text-gray-900 dark:text-[#ededed]">Spending over time</h3>
                            <p className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-1">Daily totals in this range</p>
                        </div>
                    </div>
                    {trendData.length > 0 ? (
                        <div className="h-[240px] sm:h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={chart.expense} stopOpacity={0.16} />
                                        <stop offset="100%" stopColor={chart.expense} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke={chart.grid} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ ...tick, fontSize: 11 }}
                                    interval="preserveStartEnd"
                                    minTickGap={32}
                                    dy={8}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={tick}
                                    tickFormatter={(value) => (isPrivate ? '' : value >= 1000 ? `${value / 1000}k` : value)}
                                />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    itemStyle={tooltipItem}
                                    formatter={(value, name) => [
                                        isPrivate ? '••••' : formatCurrency(value, currency),
                                        name === 'expenses' ? 'Expenses' : name === 'income' ? 'Income' : 'Net'
                                    ]}
                                />
                                <Legend
                                    onClick={handleLegendClick}
                                    wrapperStyle={{ fontSize: 12, cursor: 'pointer' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expenses"
                                    stroke={chart.expense}
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorExpenses)"
                                    name="Expenses"
                                    hide={!visibleSeries.expenses}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    stroke={chart.income}
                                    strokeWidth={1.5}
                                    strokeDasharray="4 4"
                                    fill="none"
                                    name="Income"
                                    hide={!visibleSeries.income}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[200px] sm:h-[300px] text-gray-400 dark:text-[#85858b]">
                            <p>No data available for the selected period</p>
                        </div>
                    )}
                </div>

                {/* Category Breakdown Pie Chart */}
                <div className="glass-card p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div>
                            <h3 className="text-base font-medium text-gray-900 dark:text-[#ededed]">By category</h3>
                            <p className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-1">Share of expenses in this range</p>
                        </div>
                    </div>
                    {categoryChartData.length > 0 ? (
                        <ShareBar data={categoryChartData} currency={currency} isPrivate={isPrivate} />
                    ) : (
                        <div className="flex items-center justify-center h-[200px] sm:h-[300px] text-gray-400 dark:text-[#85858b]">
                            <p>No category data available</p>
                        </div>
                    )}
                </div>

                {/* Monthly Comparison Bar Chart */}
                <div className="glass-card p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div>
                            <h3 className="text-base font-medium text-gray-900 dark:text-[#ededed]">By month</h3>
                            <p className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-1">Expenses and income, month by month</p>
                        </div>
                    </div>
                    {monthlyData.length > 0 ? (
                        <div className="h-[200px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" className="bg-transparent">
                            <BarChart data={monthlyData} style={{ backgroundColor: 'transparent' }}>
                                <CartesianGrid stroke={chart.grid} vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={tick}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={tick}
                                    tickFormatter={(value) => (isPrivate ? '' : value >= 1000 ? `${value / 1000}k` : value)}
                                />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    itemStyle={tooltipItem}
                                    formatter={(value) => (isPrivate ? '••••' : formatCurrency(value, currency))}
                                    cursor={{ fill: chart.cursor }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: 12, paddingTop: '8px', cursor: 'pointer' }}
                                    onClick={handleLegendClick}
                                />
                                <Bar
                                    dataKey="expenses"
                                    fill={chart.expense}
                                    name="Expenses"
                                    radius={[4, 4, 0, 0]}
                                    hide={!visibleSeries.expenses}
                                />
                                <Bar
                                    dataKey="income"
                                    fill={chart.income}
                                    name="Income"
                                    radius={[4, 4, 0, 0]}
                                    hide={!visibleSeries.income}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[200px] sm:h-[300px] text-gray-400 dark:text-[#85858b]">
                            <p>No monthly data available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Categories & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Top Categories */}
                <div className="glass-card p-4 sm:p-6">
                    <h3 className="text-base font-medium text-gray-900 dark:text-[#ededed] mb-3 sm:mb-4">Top categories</h3>
                    {topCategories.length > 0 ? (
                        <div className="space-y-4">
                            {topCategories.map((category, index) => {
                                const percentage = calculatePercentage(category.value, summary.totalExpenses)
                                return (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="w-2 h-2 rounded-full shrink-0"
                                                    style={{ backgroundColor: category.color || '#a3a3a3' }}
                                                />
                                                <div>
                                                    <p className="text-sm text-gray-900 dark:text-[#ededed]">{category.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-[#a1a1a6]">{category.count || 0} {category.count === 1 ? 'entry' : 'entries'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="tabular-nums text-gray-900 dark:text-[#ededed]"><Amount value={category.value} currency={currency} /></p>
                                                <p className="font-mono text-xs text-gray-500 dark:text-[#85858b] tabular-nums">{percentage}%</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-white/[0.06] rounded-full h-1">
                                            <div
                                                className={`h-1 rounded-full ${index === 0 ? 'bg-brass' : 'bg-gray-400 dark:bg-[#5a5a5f]'}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 dark:text-[#85858b]">
                            <p>No category data available</p>
                        </div>
                    )}
                </div>

                {/* Insights */}
                <div className="glass-card p-4 sm:p-6">
                    <h3 className="text-base font-medium text-gray-900 dark:text-[#ededed] mb-3 sm:mb-4">Insights</h3>
                    <div className="space-y-2.5 sm:space-y-3">
                        {summary.totalExpenses > 0 && (
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-white/[0.06]">
                                <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-white/[0.06] rounded-md flex-shrink-0">
                                    <TrendingUp size={16} className="text-gray-500 dark:text-[#a1a1a6]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-[#ededed]">Transactions</p>
                                    <p className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-0.5 leading-snug">
                                        {summary.transactionCount} transaction{summary.transactionCount !== 1 ? 's' : ''} in this period
                                    </p>
                                </div>
                            </div>
                        )}

                        {summary.avgDailyExpense > 0 && (
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-white/[0.06]">
                                <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-white/[0.06] rounded-md flex-shrink-0">
                                    <Calendar size={16} className="text-gray-500 dark:text-[#a1a1a6]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-[#ededed]">Average per day</p>
                                    <p className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-0.5 leading-snug">
                                        <Amount value={summary.avgDailyExpense} currency={currency} /> per day
                                    </p>
                                </div>
                            </div>
                        )}

                        {topCategories.length > 0 && (
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-white/[0.06]">
                                <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-white/[0.06] rounded-md flex-shrink-0">
                                    <PieChartIcon size={16} className="text-gray-500 dark:text-[#a1a1a6]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-[#ededed]">Top category</p>
                                    <p className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-0.5 leading-snug">
                                        <span className="font-medium">{topCategories[0]?.name}</span> — <Amount value={topCategories[0]?.value || 0} currency={currency} />
                                    </p>
                                </div>
                            </div>
                        )}

                        {summary.netAmount < 0 && (
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-white/[0.06]">
                                <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-white/[0.06] rounded-md flex-shrink-0">
                                    <TrendingDown size={16} className="text-gray-500 dark:text-[#a1a1a6]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-[#ededed]">Spending above income</p>
                                    <p className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-0.5 leading-snug">
                                        Expenses exceed income by <Amount value={Math.abs(summary.netAmount)} currency={currency} />
                                    </p>
                                </div>
                            </div>
                        )}

                        {summary.netAmount >= 0 && summary.totalIncome > 0 && (
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-white/[0.06]">
                                <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-white/[0.06] rounded-md flex-shrink-0">
                                    <TrendingUp size={16} className="text-gray-500 dark:text-[#a1a1a6]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-[#ededed]">Positive balance</p>
                                    <p className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-0.5 leading-snug">
                                        Net balance of <Amount value={summary.netAmount} currency={currency} />
                                    </p>
                                </div>
                            </div>
                        )}

                        {filteredExpenses.length === 0 && (
                            <EmptyState
                                icon={SearchX}
                                title="No data for these filters"
                                description="Try adjusting your date range or category selection."
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// One stacked bar for the share of each category, with its legend below
const ShareBar = ({ data, currency, isPrivate }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1
    const sorted = [...data].sort((a, b) => b.value - a.value)
    return (
        <div className="pt-2">
            <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Share of expenses by category">
                {sorted.map((d) => (
                    <span key={d.name} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(d.value / total) * 100}%`, backgroundColor: d.color || '#a3a3a3' }} />
                ))}
            </div>
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                {sorted.map((d) => (
                    <li key={d.name} className="h-9 flex items-center gap-2 text-sm border-b border-gray-100 dark:border-white/[0.05]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color || '#a3a3a3' }} />
                        <span className="flex-1 min-w-0 truncate text-gray-700 dark:text-[#a1a1a6]">{d.name}</span>
                        <span className="tabular-nums text-gray-900 dark:text-[#ededed]">{isPrivate ? '••••' : formatCurrency(d.value, currency)}</span>
                        <span className="w-12 text-right font-mono text-xs tabular-nums text-gray-500 dark:text-[#85858b]">{((d.value / total) * 100).toFixed(0)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default AnalyticsDashboard
