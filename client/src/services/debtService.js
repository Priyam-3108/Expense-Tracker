import api from './api';

const getDebts = async () => {
    return await api.get('/debts');
};

const createDebt = async (debtData) => {
    return await api.post('/debts', debtData);
};

const updateDebt = async (id, debtData) => {
    return await api.put(`/debts/${id}`, debtData);
};

const deleteDebt = async (id) => {
    return await api.delete(`/debts/${id}`);
};

const addRepayment = async (id, repaymentData) => {
    return await api.post(`/debts/${id}/repay`, repaymentData);
};

export const debtService = {
    getDebts,
    createDebt,
    updateDebt,
    deleteDebt,
    addRepayment
};
