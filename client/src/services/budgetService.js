import api from './api';

const getBudgets = async (month) => {
    return await api.get('/budgets', { params: month ? { month } : {} });
};

const createBudget = async (budgetData) => {
    return await api.post('/budgets', budgetData);
};

const updateBudget = async (id, budgetData) => {
    return await api.put(`/budgets/${id}`, budgetData);
};

const deleteBudget = async (id) => {
    return await api.delete(`/budgets/${id}`);
};

export const budgetService = {
    getBudgets,
    createBudget,
    updateBudget,
    deleteBudget
};
