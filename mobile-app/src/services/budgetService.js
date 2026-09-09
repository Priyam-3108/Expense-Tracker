import api from './api';

export const budgetService = {
    // Get budgets for a month (defaults to current month), with computed spend
    getBudgets: (month) => api.get('/budgets', { params: month ? { month } : {} }),

    // Create a new budget (category: null for the overall budget)
    createBudget: (data) => api.post('/budgets', data),

    // Update a budget's amount
    updateBudget: (id, data) => api.put(`/budgets/${id}`, data),

    // Delete a budget
    deleteBudget: (id) => api.delete(`/budgets/${id}`),
};
