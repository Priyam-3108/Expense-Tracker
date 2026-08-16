import api from './api';

export const debtService = {
    // Get all debts for the current user
    getDebts: () => api.get('/debts'),

    // Create a new debt record
    createDebt: (data) => api.post('/debts', data),

    // Update a debt's metadata (name, dates, notes)
    updateDebt: (id, data) => api.put(`/debts/${id}`, data),

    // Delete a debt record
    deleteDebt: (id) => api.delete(`/debts/${id}`),

    // Record a repayment against a debt
    addRepayment: (id, data) => api.post(`/debts/${id}/repay`, data),
};
