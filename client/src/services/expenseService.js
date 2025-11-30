import api from './api'

export const expenseService = {
  // Get all expenses with optional filters
  getExpenses: (filters = {}) => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value)
      }
    })

    return api.get(`/expenses?${params.toString()}`)
  },

  // Get single expense
  getExpense: (id) => {
    return api.get(`/expenses/${id}`)
  },

  // Create new expense
  createExpense: (expenseData) => {
    return api.post('/expenses', expenseData)
  },

  // Bulk create expenses
  bulkCreateExpenses: (bulkData) => {
    return api.post('/expenses/bulk', bulkData)
  },

  // Update expense
  updateExpense: (id, updates) => {
    return api.put(`/expenses/${id}`, updates)
  },

  // Delete expense
  deleteExpense: (id) => {
    return api.delete(`/expenses/${id}`)
  },

  // Bulk delete expenses
  bulkDeleteExpenses: (ids) => {
    return api.post('/expenses/bulk-delete', { ids })
  },



  // Bulk update expenses with individual values
  bulkUpdateList: (expenses) => {
    return api.put('/expenses/bulk-list-update', { expenses })
  },

  // Get expense statistics
  getStats: (dateRange = {}) => {
    const params = new URLSearchParams()

    if (dateRange.startDate) {
      params.append('startDate', dateRange.startDate)
    }
    if (dateRange.endDate) {
      params.append('endDate', dateRange.endDate)
    }

    return api.get(`/expenses/stats?${params.toString()}`)
  },

  // Get expense trends
  getTrends: (year) => {
    const params = new URLSearchParams()
    if (year) {
      params.append('year', year)
    }

    return api.get(`/expenses/trends?${params.toString()}`)
  },

  // Get detailed analytics
  getDetailedAnalytics: (filters = {}) => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value)
      }
    })

    return api.get(`/expenses/analytics?${params.toString()}`)
  },
}
