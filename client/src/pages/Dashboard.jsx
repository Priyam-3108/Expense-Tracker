import { useAuth } from '../context/AuthContext'
import { useExpense } from '../context/ExpenseContext'
import { formatCurrency } from '../utils/helpers'
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Calendar, PieChart, Activity } from 'lucide-react'

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

const Dashboard = () => {
  const { user, currency } = useAuth()
  const { stats, loading } = useExpense()

  const totalExpenses = stats?.totalStats?.expenses || 0
  const totalIncome = stats?.totalStats?.income || 0
  const netAmount = stats?.totalStats?.net || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name}! Here's your financial overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Total Expenses */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '...' : formatCurrency(totalExpenses, currency)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '...' : formatCurrency(totalIncome, currency)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Net Amount */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Amount</p>
              <p className={`text-3xl font-bold mt-2 ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {loading ? '...' : formatCurrency(netAmount, currency)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-blue-600 font-bold text-4xl">{currencySymbols[currency] || '$'}</span>
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '...' : (stats?.totalStats?.expenses || 0) + (stats?.totalStats?.income || 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Quick Actions
            </h2>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                Add Expense
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-success-600 hover:bg-success-700 transition-colors">
                Add Income
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors">
                Manage Categories
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Activity
            </h2>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg mb-2">No recent transactions</p>
              <p className="text-sm text-gray-400">Start by adding your first expense or income</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Sections for Laptop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Monthly Overview
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalExpenses, currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">vs Last Month</p>
                <p className="text-sm text-green-600">+12.5%</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Daily</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalExpenses / 30, currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Spending</p>
                <p className="text-sm text-blue-600">On track</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Tips</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">Track your daily expenses to better understand your spending patterns.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-success-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">Set up categories to organize your transactions effectively.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">Review your analytics regularly to make informed financial decisions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
