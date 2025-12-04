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
  Wallet
} from 'lucide-react'
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
  const navigate = useNavigate()

  useEffect(() => {
    loadStats()
    loadTrends()
    loadDebts()
    fetchRecentTransactions()
  }, [loadStats, loadTrends, loadDebts])

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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded shadow border border-gray-100 text-sm">
          <p className="font-semibold text-gray-800 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value, currency)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome back, {user?.name}! Here's your financial overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Total Expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {loading ? '...' : formatCurrency(totalExpenses, currency)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {loading ? '...' : formatCurrency(totalIncome, currency)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Net Amount */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Amount</p>
              <p className={`text-3xl font-bold mt-2 ${netAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {loading ? '...' : formatCurrency(netAmount, currency)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Debt Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Outstanding Payable</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                {formatCurrency(totalPayable, currency)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <ArrowDownTrayIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Outstanding Receivable</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {formatCurrency(totalReceivable, currency)}
              </p>
            </div>
            <div className="p-3 bg-teal-100 rounded-lg">
              <ArrowUpTrayIcon className="h-8 w-8 text-teal-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Financial Overview Chart */}
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Financial Overview
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Income"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Expense"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="xl:col-span-1 space-y-8">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Quick Actions
            </h2>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/app/expenses', { state: { action: 'add_expense' } })}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Add Expense
              </button>
              <button
                onClick={() => navigate('/app/expenses', { state: { action: 'add_income' } })}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-success-600 hover:bg-success-700 transition-colors"
              >
                Add Income
              </button>
              <button
                onClick={() => navigate('/app/categories')}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                Manage Categories
              </button>
              <button
                onClick={() => navigate('/app/debts')}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                Manage Debts
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Recent Activity
              </h2>
              <button
                onClick={() => navigate('/app/expenses')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </button>
            </div>

            <div className="space-y-4">
              {loadingRecent ? (
                <div className="text-center py-4 text-gray-500">Loading...</div>
              ) : recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                    onClick={() => navigate('/app/expenses')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {transaction.category?.icon ? (
                          <span className="text-lg">{transaction.category.icon}</span>
                        ) : (
                          transaction.type === 'income' ? <TrendingUp className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                          {transaction.description || transaction.category?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(transaction.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold text-sm ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent transactions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
