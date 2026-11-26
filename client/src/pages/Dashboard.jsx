import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useExpense } from '../context/ExpenseContext'
import { useDebt } from '../context/DebtContext'
import { useDailyActivity } from '../hooks/useDailyActivity'
import ActivityHeatmap from '../components/ActivityHeatmap'
import { expenseService } from '../services/expenseService'
import Amount from '../components/Amount'
import { format } from 'date-fns'
import { Plus, ArrowUpRight, Receipt } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { useTheme } from '../context/ThemeContext'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const Dashboard = () => {
  const { currency } = useAuth()
  const { stats, trends, loading, loadStats, loadTrends } = useExpense()
  const { debts, loadDebts } = useDebt()
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const navigate = useNavigate()
  const activity = useDailyActivity(52)
  const { theme } = useTheme()
  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    loadStats()
    loadTrends(selectedYear)
    loadDebts()
    fetchRecentTransactions()
  }, [loadStats, loadTrends, loadDebts, selectedYear])

  const fetchRecentTransactions = async () => {
    try {
      const response = await expenseService.getExpenses({ limit: 5, page: 1, sortBy: 'date', sortOrder: 'desc' })
      if (response.data?.success) {
        setRecentTransactions(response.data.data.expenses)
      }
    } catch (error) {
      console.error('Failed to fetch recent transactions:', error)
    } finally {
      setLoadingRecent(false)
    }
  }

  const totalExpenses = stats?.totalStats?.expenses || 0
  const totalIncome = stats?.totalStats?.income || 0
  const netAmount = stats?.totalStats?.net || 0

  const totalPayable = debts.filter(d => d.type === 'borrowed').reduce((sum, d) => sum + d.currentAmount, 0)
  const totalReceivable = debts.filter(d => d.type === 'lent').reduce((sum, d) => sum + d.currentAmount, 0)

  // Prepare chart data
  const chartData = trends?.trends?.map(item => ({
    name: item.month,
    Income: item.income,
    Expense: item.expenses,
    Net: item.net
  })) || []

  // Generate available years (from 2020 to current year)
  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i)

  const chartColors = isDark
    ? { expense: '#8b7ffe', income: '#85858b', grid: 'rgba(237,237,237,0.06)', tick: '#85858b' }
    : { expense: '#533afd', income: '#a3a3a3', grid: 'rgba(23,23,23,0.06)', tick: '#737373' }

  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="glass-dropdown px-3 py-2 text-xs">
        <p className="font-medium text-gray-900 dark:text-[#ededed] mb-1">{label}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="flex items-center justify-between gap-6 py-0.5">
            <span className="flex items-center gap-2 text-gray-500 dark:text-[#a1a1a6]">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <Amount value={entry.value} currency={currency} className="font-mono tabular-nums text-gray-900 dark:text-[#ededed]" />
          </p>
        ))}
      </div>
    )
  }

  const statCards = [
    { label: 'Expenses', value: totalExpenses },
    { label: 'Income', value: totalIncome },
    { label: 'Net', value: netAmount, tone: netAmount >= 0 ? 'pos' : 'neg' },
    totalPayable > 0 && { label: 'You owe', value: totalPayable },
    totalReceivable > 0 && { label: 'Owed to you', value: totalReceivable },
  ].filter(Boolean)

  const toneClass = {
    pos: 'text-green-600 dark:text-[#4cc38a]',
    neg: 'text-red-600 dark:text-[#e5484d]',
  }

  const sectionTitle = 'text-base font-medium text-gray-900 dark:text-[#ededed]'
  const meta = 'text-xs text-gray-500 dark:text-[#85858b]'
  const textLink = 'inline-flex items-center gap-1 text-sm text-[#533afd] dark:text-[#8b7ffe] hover:text-[#4434d4] dark:hover:text-[#a59bff] transition-colors'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-[28px] leading-tight font-medium text-gray-900 dark:text-[#ededed]">Overview</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-[#a1a1a6]">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
        {statCards.map(({ label, value, tone }) => (
          <div key={label} className="glass-card p-5">
            <p className="text-sm text-gray-600 dark:text-[#a1a1a6]">{label}</p>
            <p className={`mt-2 text-xl md:text-2xl leading-none font-mono font-medium tabular-nums truncate ${tone ? toneClass[tone] : 'text-gray-900 dark:text-[#ededed]'}`}>
              {loading
                ? <span className="inline-block w-24 h-7 rounded-md bg-gray-100 dark:bg-white/[0.06]" />
                : <Amount value={value} currency={currency} />}
            </p>
            <p className={`mt-2 ${meta}`}>All time</p>
          </div>
        ))}
      </div>

      {/* Chart + side column */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-5">
                <h2 className={sectionTitle}>Income and expenses</h2>
                <div className={`hidden sm:flex items-center gap-4 ${meta}`}>
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors.expense }} />Expenses</span>
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors.income }} />Income</span>
                </div>
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="Year"
                className="h-9 pl-3 pr-8 rounded-lg text-sm font-mono tabular-nums text-gray-700 dark:text-[#ededed] bg-white dark:bg-[#232325] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-[#2a2a2c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#533afd]/50 transition-colors appearance-none bg-no-repeat cursor-pointer"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%2385858b\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1.25em 1.25em'
                }}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="h-[240px] md:h-[320px] xl:h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.expense} stopOpacity={0.16} />
                      <stop offset="100%" stopColor={chartColors.expense} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={chartColors.grid} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartColors.tick, fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tick={{ fill: chartColors.tick, fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: chartColors.grid }} />
                  <Area
                    type="monotone"
                    dataKey="Income"
                    stroke={chartColors.income}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="none"
                    dot={false}
                    activeDot={{ r: 3, fill: chartColors.income, strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Expense"
                    name="Expenses"
                    stroke={chartColors.expense}
                    strokeWidth={2}
                    fill="url(#expenseFill)"
                    dot={false}
                    activeDot={{ r: 4, fill: chartColors.expense, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className={sectionTitle}>Activity</h2>
              <span className={meta}>Last 12 months</span>
            </div>
            <ActivityHeatmap
              grid={activity.grid}
              weekdayLabels={activity.weekdayLabels}
              monthLabels={activity.monthLabels}
              loading={activity.loading}
              error={activity.error}
              currency={currency}
              onCellClick={(date) => navigate('/app/expenses', { state: { date } })}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Recent */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className={sectionTitle}>Recent</h2>
              <button onClick={() => navigate('/app/expenses')} className={textLink}>
                View all
                <ArrowUpRight size={16} strokeWidth={1.5} />
              </button>
            </div>

            {loadingRecent ? (
              <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 flex items-center gap-3 px-2">
                    <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-white/[0.08]" />
                    <div className="flex-1 h-3 rounded bg-gray-100 dark:bg-white/[0.06]" />
                    <div className="w-16 h-3 rounded bg-gray-100 dark:bg-white/[0.06]" />
                  </div>
                ))}
              </div>
            ) : recentTransactions.length > 0 ? (
              <div className="-mx-2">
                {recentTransactions.map((transaction) => (
                  <button
                    key={transaction._id}
                    onClick={() => navigate('/app/expenses')}
                    className="w-full h-12 flex items-center gap-3 px-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <span
                      className="w-2 h-2 shrink-0 rounded-full"
                      style={{ backgroundColor: transaction.category?.color || '#a3a3a3' }}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-gray-900 dark:text-[#ededed] truncate">
                        {transaction.description || transaction.category?.name}
                      </span>
                      <span className={`block ${meta}`}>{format(new Date(transaction.date), 'MMM d')}</span>
                    </span>
                    <Amount
                      value={transaction.amount}
                      currency={currency}
                      sign={transaction.type === 'income' ? '+' : '−'}
                      className={`text-sm font-mono tabular-nums ${transaction.type === 'income' ? toneClass.pos : 'text-gray-900 dark:text-[#ededed]'}`}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Receipt}
                title="No transactions yet"
                description="Add an expense or income and it shows up here."
              />
            )}
          </div>

          {/* Quick actions */}
          <div className="glass-card p-5">
            <h2 className={`${sectionTitle} mb-4`}>Quick actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/app/expenses', { state: { action: 'add_expense' } })}
                className="btn-primary w-full min-h-[44px]"
              >
                <Plus size={16} strokeWidth={1.5} />
                Add expense
              </button>
              <button
                onClick={() => navigate('/app/expenses', { state: { action: 'add_income' } })}
                className="btn-secondary w-full min-h-[44px]"
              >
                <Plus size={16} strokeWidth={1.5} />
                Add income
              </button>
              <button onClick={() => navigate('/app/categories')} className="btn-secondary w-full min-h-[44px]">
                Categories
              </button>
              <button onClick={() => navigate('/app/debts')} className="btn-secondary w-full min-h-[44px]">
                Debts
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Dashboard
