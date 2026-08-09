import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useExpense } from '../context/ExpenseContext'
import { useDebt } from '../context/DebtContext'
import { expenseService } from '../services/expenseService'
import { formatCurrency } from '../utils/helpers'
import { format } from 'date-fns'
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calendar,
  PieChart,
  Activity,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Plus,
  ArrowRight,
  Receipt
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import {
  BanknotesIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
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
  const { user, currency } = useAuth()
  const { stats, trends, loading, loadStats, loadTrends } = useExpense()
  const { debts, loadDebts } = useDebt()
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const navigate = useNavigate()

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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="px-4 py-3 rounded-xl text-sm border border-white/[0.10]"
          style={{
            background: 'rgba(30, 41, 59, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          }}
        >
          <p className="font-semibold text-white mb-1.5">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="flex items-center gap-2 py-0.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-400">{entry.name}:</span>
              <span className="font-medium text-white">
                {formatCurrency(entry.value, currency)}
              </span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ============ HEADER ============ */}
      <div className="glass-card p-5 md:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-500 mb-1">
              {getGreeting()},
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1 text-sm">
              Here's your financial overview for {format(new Date(), 'MMMM yyyy')}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-500 dark:text-indigo-400 animate-pulse-glow" />
            <span className="text-xs font-medium text-gray-500 dark:text-slate-500">
              {format(new Date(), 'EEEE, MMM d')}
            </span>
          </div>
        </div>
      </div>

      {/* ============ STATS CARDS ============ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 stagger-enter">
        {/* Total Expenses */}
        <div className="glass-card p-5 md:p-6 group cursor-default border-l-2 border-l-rose-500/50 hover:border-l-rose-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Expenses</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1 md:mt-2">
                {loading ? (
                  <span className="inline-block w-24 h-8 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                ) : formatCurrency(totalExpenses, currency)}
              </p>
            </div>
            <div className="p-2.5 md:p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 group-hover:shadow-glow-rose transition-all duration-300">
              <TrendingDown className="h-6 w-6 md:h-7 md:w-7 text-rose-500 dark:text-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.3)]" />
            </div>
          </div>
        </div>

        {/* Total Income */}
        <div className="glass-card p-5 md:p-6 group cursor-default border-l-2 border-l-emerald-500/50 hover:border-l-emerald-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Income</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1 md:mt-2">
                {loading ? (
                  <span className="inline-block w-24 h-8 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                ) : formatCurrency(totalIncome, currency)}
              </p>
            </div>
            <div className="p-2.5 md:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 group-hover:shadow-glow-emerald transition-all duration-300">
              <TrendingUp className="h-6 w-6 md:h-7 md:w-7 text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" />
            </div>
          </div>
        </div>

        {/* Net Amount */}
        <div className="glass-card p-5 md:p-6 group cursor-default border-l-2 border-l-indigo-500/50 hover:border-l-indigo-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Net Balance</p>
              <p className={`text-2xl md:text-3xl font-bold mt-1 md:mt-2 ${
                netAmount >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {loading ? (
                  <span className="inline-block w-24 h-8 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                ) : formatCurrency(netAmount, currency)}
              </p>
            </div>
            <div className="p-2.5 md:p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 group-hover:shadow-glow-indigo transition-all duration-300">
              <Wallet className="h-6 w-6 md:h-7 md:w-7 text-indigo-500 dark:text-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.3)]" />
            </div>
          </div>
        </div>

        {/* Debt: Outstanding Payable */}
        {totalPayable > 0 && (
          <div className="glass-card p-5 md:p-6 group cursor-default border-l-2 border-l-amber-500/50 hover:border-l-amber-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Outstanding Payable</p>
                <p className="text-2xl md:text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1 md:mt-2">
                  {formatCurrency(totalPayable, currency)}
                </p>
              </div>
              <div className="p-2.5 md:p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.12)] transition-all duration-300">
                <ArrowDownTrayIcon className="h-6 w-6 md:h-7 md:w-7 text-amber-500 dark:text-amber-400" />
              </div>
            </div>
          </div>
        )}

        {/* Debt: Outstanding Receivable */}
        {totalReceivable > 0 && (
          <div className="glass-card p-5 md:p-6 group cursor-default border-l-2 border-l-teal-500/50 hover:border-l-teal-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Outstanding Receivable</p>
                <p className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 md:mt-2">
                  {formatCurrency(totalReceivable, currency)}
                </p>
              </div>
              <div className="p-2.5 md:p-3 rounded-xl bg-teal-50 dark:bg-teal-500/10 group-hover:shadow-glow-emerald transition-all duration-300">
                <ArrowUpTrayIcon className="h-6 w-6 md:h-7 md:w-7 text-teal-500 dark:text-teal-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============ MAIN CONTENT GRID ============ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Financial Overview Chart */}
        <div className="xl:col-span-2">
          <div className="glass-card p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 md:mb-6">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                Financial Overview
              </h2>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="pl-3 pr-8 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.10] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 appearance-none bg-no-repeat bg-right cursor-pointer"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%2394a3b8\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                {availableYears.map(year => (
                  <option key={year} value={year} className="bg-slate-800 text-white">{year}</option>
                ))}
              </select>
            </div>
            <div className="h-[220px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="glassGradientIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="glassGradientExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148, 163, 184, 0.06)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Income"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#glassGradientIncome)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: '#34d399',
                      stroke: 'rgba(52,211,153,0.3)',
                      strokeWidth: 6
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Expense"
                    stroke="#fb7185"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#glassGradientExpense)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: '#fb7185',
                      stroke: 'rgba(251,113,133,0.3)',
                      strokeWidth: 6
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="xl:col-span-1 space-y-6 md:space-y-8">
          {/* Quick Actions */}
          <div className="glass-card p-5 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 md:mb-5 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
              <button
                onClick={() => navigate('/app/expenses', { state: { action: 'add_expense' } })}
                className="group w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl text-white transition-all duration-200 min-h-[44px] hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.2)',
                }}
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                Add Expense
              </button>
              <button
                onClick={() => navigate('/app/expenses', { state: { action: 'add_income' } })}
                className="group w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl text-white transition-all duration-200 min-h-[44px] hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 0 20px rgba(52,211,153,0.15)',
                }}
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                Add Income
              </button>
              <button
                onClick={() => navigate('/app/categories')}
                className="group w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl text-white transition-all duration-200 min-h-[44px] hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  boxShadow: '0 0 20px rgba(139,92,246,0.15)',
                }}
              >
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                Categories
              </button>
              <button
                onClick={() => navigate('/app/debts')}
                className="group w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl text-white transition-all duration-200 min-h-[44px] hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  boxShadow: '0 0 20px rgba(245,158,11,0.15)',
                }}
              >
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                Debts
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-card p-5 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                Recent Activity
              </h2>
              <button
                onClick={() => navigate('/app/expenses')}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors duration-200 flex items-center gap-1"
              >
                View All
                <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="space-y-2">
              {loadingRecent ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                      <div className="w-10 h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 rounded w-24" style={{ background: 'rgba(255,255,255,0.06)' }} />
                        <div className="h-2 rounded w-16" style={{ background: 'rgba(255,255,255,0.04)' }} />
                      </div>
                      <div className="h-4 rounded w-16" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    </div>
                  ))}
                </div>
              ) : recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.04] rounded-xl transition-all duration-200 cursor-pointer group border border-transparent hover:border-gray-100 dark:hover:border-white/[0.06]"
                    onClick={() => navigate('/app/expenses')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                        transaction.type === 'income'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {transaction.category?.icon ? (
                          <span className="text-lg">{transaction.category.icon}</span>
                        ) : (
                          transaction.type === 'income'
                            ? <TrendingUp className="h-5 w-5" />
                            : <CreditCard className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[140px] md:max-w-[120px]">
                          {transaction.description || transaction.category?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-500">
                          {format(new Date(transaction.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold text-sm ${
                      transaction.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Receipt}
                  title="No transactions yet"
                  description="Add your first expense or income to get started."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
