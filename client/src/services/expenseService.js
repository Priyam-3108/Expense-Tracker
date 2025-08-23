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

  // Update expense
  updateExpense: (id, updates) => {
    return api.put(`/expenses/${id}`, updates)
  },

  // Delete expense
  deleteExpense: (id) => {
    return api.delete(`/expenses/${id}`)
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
}
