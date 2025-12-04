import { format, parseISO } from 'date-fns'

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

// Parse date string without timezone shift
export const parseDateLocal = (date) => {
  if (!date) return null

  if (typeof date === 'string') {
    // Extract just the date part (YYYY-MM-DD) to avoid timezone issues
    const datePart = date.split('T')[0]
    const [year, month, day] = datePart.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  return date
}

// Format date
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return ''

  try {
    const dateObj = parseDateLocal(date)
    return format(dateObj, formatStr)
  } catch (error) {
    console.error('Date formatting error:', error)
    return ''
  }
}

// Format date for input fields
export const formatDateForInput = (date) => {
  if (!date) return ''

  try {
    // For strings, just extract the date part directly
    if (typeof date === 'string') {
      return date.split('T')[0]
    }
    return format(date, 'yyyy-MM-dd')
  } catch (error) {
    console.error('Date formatting error:', error)
    return ''
  }
}

// Get today's date as YYYY-MM-DD (local date)
export const getTodayDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Get month name
export const getMonthName = (monthIndex) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[monthIndex]
}

// Get short month name
export const getShortMonthName = (monthIndex) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  return months[monthIndex]
}

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

// Generate random color
export const generateRandomColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Validate password strength
export const validatePassword = (password) => {
  const minLength = 6
  return password.length >= minLength
}

// Debounce function
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Group expenses by date
export const groupExpensesByDate = (expenses) => {
  const groups = {}

  expenses.forEach(expense => {
    const date = formatDate(expense.date, 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(expense)
  })

  return Object.entries(groups)
    .map(([date, expenses]) => ({
      date,
      expenses,
      total: expenses.reduce((sum, exp) => sum + exp.amount, 0)
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

// Calculate total expenses
export const calculateTotalExpenses = (expenses) => {
  return expenses.reduce((total, expense) => {
    return expense.type === 'expense' ? total + expense.amount : total - expense.amount
  }, 0)
}

// Filter expenses by date range
export const filterExpensesByDateRange = (expenses, startDate, endDate) => {
  if (!startDate || !endDate) return expenses

  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    const start = new Date(startDate)
    const end = new Date(endDate)

    return expenseDate >= start && expenseDate <= end
  })
}

// Get current month range
export const getCurrentMonthRange = () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    startDate: formatDateForInput(startOfMonth),
    endDate: formatDateForInput(endOfMonth)
  }
}

// Get last 30 days range
export const getLast30DaysRange = () => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - (29 * 24 * 60 * 60 * 1000))

  return {
    startDate: formatDateForInput(thirtyDaysAgo),
    endDate: formatDateForInput(now)
  }
}
