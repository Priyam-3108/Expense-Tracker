import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useExpense } from '../context/ExpenseContext'
import { useDebt } from '../context/DebtContext'
import { useDailyActivity } from '../hooks/useDailyActivity'
import { usePeriodStats } from '../hooks/usePeriodStats'
import { useExcludeSavings } from '../hooks/useExcludeSavings'
import Switch from '../components/Switch'
import { PERIODS, periodTitle, comparisonLabel } from '../utils/periods'
import ActivityHeatmap from '../components/ActivityHeatmap'
import { expenseService } from '../services/expenseService'
import Amount from '../components/Amount'
import { formatCurrency, formatDate, parseDateLocal } from '../utils/helpers'
import { usePrivacy } from '../context/PrivacyContext'
import { format } from 'date-fns'
import { Plus, ArrowUpRight, Receipt } from 'lucide-react'
import AddFab from '../components/AddFab'
import { CategoryTile } from '../components/CategoryIcon'
import EmptyState from '../components/EmptyState'
import { useTheme } from '../context/ThemeContext'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const Dashboard = () => {
  const { currency } = useAuth()
  const { trends, loadTrends, getCategoryById, categories } = useExpense()
  const { debts, loadDebts } = useDebt()
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [recentOk, setRecentOk] = useState(false)
  const [period, setPeriod] = useState(() => {
    const stored = localStorage.getItem('dashPeriod')
    return PERIODS.some(p => p.value === stored) ? stored : 'month'
  })
  const { current: rawCurrent, previous: rawPrevious, loading } = usePeriodStats(period)
  const [excludeSavings, setExcludeSavings] = useExcludeSavings()
  const hasSavings = categories.some(c => c.isSavings)
  const skipSavings = excludeSavings && hasSavings
  // Savings and investments are expenses on paper; with the toggle on they leave spending (and so raise net)
  const withoutSavings = (s) => s && skipSavings
    ? { ...s, expenses: s.expenses - (s.savings || 0), net: s.net + (s.savings || 0), categories: s.categories.filter(c => !c.isSavings) }
    : s
  const current = withoutSavings(rawCurrent)
  const previous = withoutSavings(rawPrevious)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const navigate = useNavigate()
  const activity = useDailyActivity(52)
  const { theme } = useTheme()
  const { isPrivate } = usePrivacy()
  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const narrow = window.matchMedia('(max-width: 639px)').matches

  useEffect(() => {
    loadTrends(selectedYear)
    loadDebts()
    fetchRecentTransactions()
  }, [loadTrends, loadDebts, selectedYear])

  const fetchRecentTransactions = async () => {
    try {
      const response = await expenseService.getExpenses({ limit: 5, page: 1, sortBy: 'date', sortOrder: 'desc' })
      if (response.data?.success) {
        setRecentTransactions(response.data.data.expenses)
        setRecentOk(true)
      }
    } catch (error) {
      console.error('Failed to fetch recent transactions:', error)
    } finally {
      setLoadingRecent(false)
    }
  }

  const changePeriod = (value) => {
    setPeriod(value)
    localStorage.setItem('dashPeriod', value)
  }

  const totalPayable = debts.filter(d => d.type === 'borrowed').reduce((sum, d) => sum + d.currentAmount, 0)
  const totalReceivable = debts.filter(d => d.type === 'lent').reduce((sum, d) => sum + d.currentAmount, 0)

  // Prepare chart data
  const currentYear = new Date().getFullYear()
  const nowMonth = new Date().getMonth()
  const viewingCurrent = selectedYear === currentYear
  const chartData = trends?.trends?.map((item, i) => {
    const future = viewingCurrent && i > nowMonth
    return {
      name: item.month,
      Income: future ? null : item.income,
      Expense: future ? null : item.expenses - (skipSavings ? item.savings || 0 : 0)
    }
  }) || []
  const totalExpense = chartData.reduce((s, d) => s + (d.Expense || 0), 0)
  const totalIncome = chartData.reduce((s, d) => s + (d.Income || 0), 0)
  const peakIdx = chartData.reduce((best, d, i) => ((d.Expense || 0) > (chartData[best]?.Expense || 0) ? i : best), 0)
  const money = (x) => formatCurrency(x, currency, { whole: true })
  const chartSummary = !totalExpense && !totalIncome
    ? `No entries in ${selectedYear}.`
    : isPrivate
      ? 'Amounts are hidden.'
      : `In ${selectedYear}, expenses totalled ${money(totalExpense)} and income ${money(totalIncome)}${totalExpense > 0 ? `; spending was highest in ${format(new Date(2000, peakIdx, 1), 'MMMM')} at ${money(chartData[peakIdx].Expense)}` : ''}.`

  // Generate available years (from 2020 to current year)
  const availableYears = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i)

  const chartColors = isDark
    ? { expense: '#d4954a', income: '#85858b', grid: 'rgba(237,237,237,0.06)', tick: '#85858b' }
    : { expense: '#a8611c', income: '#a3a3a3', grid: 'rgba(23,23,23,0.06)', tick: '#737373' }

  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="glass-dropdown px-3 py-2 text-xs">
        <p className="font-medium text-gray-900 dark:text-[#ededed] mb-1">{label}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="flex items-center justify-between gap-6 py-0.5">
            <span className="flex items-center gap-2 text-gray-500 dark:text-[#a1a1a6]">
              {entry.dataKey === 'Income'
                ? <span className="w-2.5 h-2.5 rounded-sm" style={{ border: `1.25px solid ${chartColors.income}` }} />
                : <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: chartColors.expense }} />}
              {entry.name}
            </span>
            <Amount whole value={entry.value} currency={currency} className="tabular-nums text-gray-900 dark:text-[#ededed]" />
          </p>
        ))}
      </div>
    )
  }

  // "$3,140 less than this point last month"; null when there is nothing to compare with
  const compare = (cur, prev, [more, less]) => {
    if (!previous || cur == null || prev == null) return null
    const diff = cur - prev
    if (Math.abs(diff) < 1) return `Same as ${comparisonLabel[period]}`
    return <><Amount whole value={Math.abs(diff)} currency={currency} /> {diff > 0 ? more : less} than {comparisonLabel[period]}</>
  }
  const netCaption = loading ? null : compare(current?.net, previous?.net, ['higher', 'lower'])
  const topCategories = (current?.categories || []).slice(0, 5)
  const topTotal = topCategories[0]?.total || 1
  const hasDebts = totalReceivable > 0 || totalPayable > 0

  const skeleton = (cls) => <span className={`inline-block rounded-md bg-gray-100 dark:bg-white/[0.06] ${cls}`} />
  const figure = (label, value, caption, busy = loading) => (
    <>
      <p className="text-sm text-gray-600 dark:text-[#a1a1a6]">{label}</p>
      <p className="mt-3 text-lg md:text-xl leading-none font-medium tabular-nums truncate text-gray-900 dark:text-[#ededed]">
        {busy ? skeleton('w-24 h-6') : <Amount whole value={value} currency={currency} />}
      </p>
      {caption && <p className={`mt-2 ${meta}`}>{caption}</p>}
    </>
  )

  const toneClass = {
    pos: 'text-green-600 dark:text-[#4cc38a]',
    neg: 'text-red-600 dark:text-[#e5484d]',
  }

  const sectionTitle = 'text-base font-medium text-gray-900 dark:text-[#ededed]'
  const meta = 'text-xs text-gray-500 dark:text-[#85858b]'
  const textLink = 'inline-flex items-center gap-1 text-sm text-gray-600 dark:text-[#a1a1a6] hover:text-gray-900 dark:hover:text-[#ededed] transition-colors'

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end justify-between gap-x-4 gap-y-3">
        <div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-medium text-gray-900 dark:text-[#ededed]">{periodTitle(period)}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#a1a1a6]">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {hasSavings && (
            <Switch checked={excludeSavings} onChange={setExcludeSavings} label="Exclude savings" className="h-9 self-start sm:self-auto" />
          )}
          <div role="group" aria-label="Period" className="inline-flex gap-1 p-1 rounded-[10px] border border-gray-200 dark:border-white/[0.06] bg-gray-100 dark:bg-white/[0.04]">
            {PERIODS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => changePeriod(value)}
                aria-pressed={period === value}
                className={`flex-1 sm:flex-none px-3 h-8 text-sm rounded-md transition-colors ${period === value
                  ? 'bg-white dark:bg-[#2a2a2c] text-gray-900 dark:text-[#ededed] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'text-gray-600 dark:text-[#a1a1a6] hover:text-gray-900 dark:hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => navigate('/app/expenses', { state: { action: 'add_expense' } })} className="btn-primary btn-md hidden md:inline-flex">
            <Plus size={16} strokeWidth={1.5} />
            Add expense
          </button>
          <button onClick={() => navigate('/app/expenses', { state: { action: 'add_income' } })} className="btn-secondary btn-md hidden md:inline-flex">
            <Plus size={16} strokeWidth={1.5} />
            Add income
          </button>
        </div>
        <AddFab onClick={() => navigate('/app/expenses', { state: { action: 'add_expense' } })} />
      </div>

      {!loadingRecent && recentOk && recentTransactions.length === 0 ? (
        <div className="glass-card p-8 md:p-10">
          <h2 className="text-lg font-medium text-gray-900 dark:text-[#ededed]">Your ledger is empty</h2>
          <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-[#a1a1a6]">Add an expense or income and this page fills in: totals for the month, a monthly chart and where the money goes</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => navigate('/app/expenses', { state: { action: 'add_expense' } })} className="btn-primary btn-md">Add expense</button>
            <button onClick={() => navigate('/app/expenses', { state: { action: 'add_income' } })} className="btn-secondary btn-md">Add income</button>
          </div>
        </div>
      ) : (
      <>
      {/* Statement: net leads, income and expenses are its parts, open debts sit apart */}
      <div className={`glass-card grid grid-cols-2 ${hasDebts ? 'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]' : 'lg:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))]'}`}>
        <div className="col-span-2 lg:col-span-1 p-5 md:p-6 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/[0.07]">
          <p className="text-sm text-gray-600 dark:text-[#a1a1a6]">Net</p>
          <p className={`mt-3 pb-2 text-[32px] md:text-[40px] leading-none font-medium tabular-nums truncate ${current?.net < 0 ? toneClass.neg : 'text-gray-900 dark:text-[#ededed]'}`}>
            {loading
              ? skeleton('w-40 h-9')
              : <Amount whole value={current?.net} currency={currency} sign={current?.net > 0 ? '+' : ''} className="double-rule" />}
          </p>
          <p className={`mt-4 ${meta}`}>{loading ? ' ' : (netCaption || (!previous && 'Income minus expenses'))}</p>
        </div>
        <div className="p-5 md:p-6 border-r border-gray-200 dark:border-white/[0.07]">
          {figure('Income', current?.income, !loading && compare(current?.income, previous?.income, ['more', 'less']))}
        </div>
        <div className={`p-5 md:p-6 border-gray-200 dark:border-white/[0.07] ${hasDebts ? 'lg:border-r' : ''}`}>
          {figure(skipSavings ? 'Spending' : 'Expenses', current?.expenses, !loading && compare(current?.expenses, previous?.expenses, ['more', 'less']))}
          {skipSavings && !loading && rawCurrent?.savings > 0 && (
            <p className={`mt-1 ${meta}`}><Amount whole value={rawCurrent.savings} currency={currency} /> to savings, left out</p>
          )}
        </div>
        {hasDebts && (
          <div className="col-span-2 lg:col-span-1 p-5 md:p-6 bg-gray-50 dark:bg-white/[0.02] border-t lg:border-t-0 border-gray-200 dark:border-white/[0.07] rounded-b-xl lg:rounded-bl-none lg:rounded-r-xl">
            <p className={`mb-3 ${meta}`}>Open debts</p>
            <div className="grid grid-cols-2 gap-4">
              <div>{figure('Owed to you', totalReceivable, undefined, false)}</div>
              <div>{figure('You owe', totalPayable, undefined, false)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Chart + side column */}
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-3 xl:items-start">
        <div className="contents xl:flex xl:flex-col xl:gap-6 xl:col-span-2">
          <div className="glass-card p-5 md:p-6 order-1 xl:order-none">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-5">
                <h2 className={sectionTitle}>Income and expenses</h2>
                <div className={`flex items-center gap-4 ${meta}`}>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: chartColors.expense }} />Expenses</span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ border: `1.25px solid ${chartColors.income}` }} />Income</span>
                </div>
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="Year"
                className="h-9 pl-3 pr-8 rounded-lg text-sm tabular-nums text-gray-700 dark:text-[#ededed] bg-white dark:bg-[#232325] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-[#2a2a2c] focus:outline-none focus-visible:ring-2 focus-visible:ring-brass/50 transition-colors appearance-none bg-no-repeat cursor-pointer"
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
            <div className="h-[240px] md:h-[320px] xl:h-[360px] w-full" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={narrow ? 1 : 4} barCategoryGap={narrow ? '10%' : '28%'}>
                  <CartesianGrid vertical={false} stroke={chartColors.grid} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={({ x, y, payload }) => (
                      <text
                        x={x}
                        y={y}
                        dy={16}
                        textAnchor="middle"
                        fontSize={12}
                        fontFamily="IBM Plex Mono, monospace"
                        fill={viewingCurrent && payload.value === chartData[nowMonth]?.name ? (isDark ? '#ededed' : '#171717') : chartColors.tick}
                      >
                        {payload.value}
                      </text>
                    )}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tick={{ fill: chartColors.tick, fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}
                    tickFormatter={(value) => (isPrivate ? '' : `${value / 1000}k`)}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: chartColors.grid }} />
                  <Bar dataKey="Expense" name="Expenses" fill={chartColors.expense} radius={[3, 3, 0, 0]} maxBarSize={18}>
                    {chartData.map((d, i) => (
                      <Cell key={d.name + i} fillOpacity={viewingCurrent && i === nowMonth ? 1 : 0.55} />
                    ))}
                  </Bar>
                  <Bar dataKey="Income" name="Income" fill="transparent" stroke={chartColors.income} strokeWidth={1.25} radius={[3, 3, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="sr-only">{chartSummary}</p>
          </div>

          {/* Activity */}
          <div className="glass-card p-5 order-4 xl:order-none">
            <div className="flex items-center justify-between mb-4">
              <h2 className={sectionTitle}>Activity</h2>
              <>
                <span className={`${meta} hidden sm:inline`}>Last 12 months</span>
                <span className={`${meta} sm:hidden`}>Last 12 months · scroll for earlier</span>
              </>
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

        <div className="contents xl:flex xl:flex-col xl:gap-6">
          {/* Top categories */}
          <div className="glass-card p-5 order-3 xl:order-none">
            <div className="flex items-center justify-between mb-3">
              <h2 className={sectionTitle}>Top categories</h2>
              <button onClick={() => navigate('/app/analytics')} className={textLink}>
                Analytics
                <ArrowUpRight size={16} strokeWidth={1.5} />
              </button>
            </div>

            {loading ? (
              <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
                    <div className="flex-1 h-3 rounded bg-gray-100 dark:bg-white/[0.06]" />
                    <div className="w-16 h-3 rounded bg-gray-100 dark:bg-white/[0.06]" />
                  </div>
                ))}
              </div>
            ) : topCategories.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {topCategories.map((row, i) => (
                  <div key={row._id} className="py-3 flex items-center gap-3">
                    <CategoryTile size="sm" icon={getCategoryById(row._id)?.icon} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm text-gray-900 dark:text-[#ededed] truncate">{row.categoryName}</span>
                        <Amount whole value={row.total} currency={currency} className="text-sm tabular-nums text-gray-900 dark:text-[#ededed]" />
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-1 rounded-full bg-gray-100 dark:bg-white/[0.06]">
                          <div
                            className={`h-full rounded-full ${i === 0 ? 'bg-brass' : 'bg-gray-400 dark:bg-[#5a5a5f]'}`}
                            style={{ width: `${(row.total / topTotal) * 100}%` }}
                          />
                        </div>
                        <span className={`font-mono tabular-nums text-right ${meta}`}>
                          {current?.expenses > 0 ? Math.round((row.total / current.expenses) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-[#85858b]">No spending in this period</p>
            )}
          </div>

          {/* Recent */}
          <div className="glass-card p-5 order-2 xl:order-none">
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
                  <div key={i} className="min-h-[56px] py-2 flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
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
                    className="w-full min-h-[56px] py-2 flex items-center gap-3 px-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <CategoryTile
                      size="sm"
                      icon={transaction.category?.icon ?? getCategoryById(transaction.category?._id ?? transaction.category)?.icon}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-gray-900 dark:text-[#ededed] truncate">
                        {transaction.description || transaction.category?.name}
                      </span>
                      <span className={`block font-mono ${meta}`}>{formatDate(transaction.date, parseDateLocal(transaction.date).getFullYear() === currentYear ? 'MMM d' : 'MMM d, yyyy')}</span>
                    </span>
                    <Amount
                      value={transaction.amount}
                      currency={currency}
                      sign={transaction.type === 'income' ? '+' : '−'}
                      className={`text-sm tabular-nums ${transaction.type === 'income' ? toneClass.pos : 'text-gray-900 dark:text-[#ededed]'}`}
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
        </div>
      </div>
      </>
      )}

    </div>
  )
}

export default Dashboard
