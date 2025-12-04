import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { debtService } from '../services/debtService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const DebtContext = createContext();

export const useDebt = () => {
    const context = useContext(DebtContext);
    if (!context) {
        throw new Error('useDebt must be used within a DebtProvider');
    }
    return context;
};

export const DebtProvider = ({ children }) => {
    const { user } = useAuth();
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadDebts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await debtService.getDebts();
            if (response && response.data && response.data.success) {
                setDebts(response.data.data.debts || []);
            } else {
                setDebts([]);
            }
        } catch (error) {
            console.error('Error loading debts:', error);
            setDebts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const addDebt = useCallback(async (debtData) => {
        try {
            const response = await debtService.createDebt(debtData);
            if (response && response.data && response.data.success) {
                await loadDebts();
                toast.success('Debt added successfully');
                return { success: true };
            }
            return { success: false, error: response?.data?.message || 'Failed to add debt' };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to add debt';
            toast.error(message);
            return { success: false, error: message };
        }
    }, [loadDebts]);

    const updateDebt = useCallback(async (id, updates) => {
        try {
            const response = await debtService.updateDebt(id, updates);
            if (response && response.data && response.data.success) {
                await loadDebts();
                toast.success('Debt updated successfully');
                return { success: true };
            }
            return { success: false, error: response?.data?.message || 'Failed to update debt' };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to update debt';
            toast.error(message);
            return { success: false, error: message };
        }
    }, [loadDebts]);

    const deleteDebt = useCallback(async (id) => {
        try {
            await debtService.deleteDebt(id);
            await loadDebts();
            toast.success('Debt deleted successfully');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to delete debt';
            toast.error(message);
            return { success: false, error: message };
        }
    }, [loadDebts]);

    const addRepayment = useCallback(async (id, repaymentData) => {
        try {
            const response = await debtService.addRepayment(id, repaymentData);
            if (response && response.data && response.data.success) {
                await loadDebts();
                toast.success('Repayment recorded successfully');
                return { success: true };
            }
            return { success: false, error: response?.data?.message || 'Failed to record repayment' };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to record repayment';
            toast.error(message);
            return { success: false, error: message };
        }
    }, [loadDebts]);

    useEffect(() => {
        if (user) {
            loadDebts();
        }
    }, [user, loadDebts]);

    const value = {
        debts,
        loading,
        error,
        loadDebts,
        addDebt,
        updateDebt,
        deleteDebt,
        addRepayment
    };

    return (
        <DebtContext.Provider value={value}>
            {children}
        </DebtContext.Provider>
    );
};
