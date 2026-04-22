import api from './api';

export const expenseService = {
    getExpenses: (filters = {}) => {
        return api.get('/expenses', { params: filters });
    },

    getExpense: (id) => {
        return api.get(`/expenses/${id}`);
    },
    createExpense: (expenseData) => {
        return api.post('/expenses', expenseData);
    },
    bulkCreateExpenses: (bulkData) => {
        return api.post('/expenses/bulk', bulkData);
    },
    updateExpense: (id, updates) => {
        return api.put(`/expenses/${id}`, updates);
    },
    deleteExpense: (id) => {
        return api.delete(`/expenses/${id}`);
    },
    bulkDeleteExpenses: (ids) => {
        return api.post('/expenses/bulk-delete', { ids });
    },
    bulkUpdateList: (expenses) => {
        return api.put('/expenses/bulk-list-update', { expenses });
    },
    getStats: (dateRange = {}) => {
        return api.get('/expenses/stats', { params: dateRange });
    },
    getTrends: (year) => {
        const params = {};
        if (year) params.year = year;
        return api.get('/expenses/trends', { params });
    },

    getDetailedAnalytics: (filters = {}) => {
        return api.get('/expenses/analytics', { params: filters });
    },
    exportExpenses: (format, filters = {}) => {
        const params = { format, ...filters };
        return api.get('/expenses/export', {
            params,
            responseType: 'blob' // This might need specific handling in RN to save file
        });
    },
};

export default expenseService;