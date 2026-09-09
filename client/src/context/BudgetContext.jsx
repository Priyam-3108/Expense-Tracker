import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { budgetService } from '../services/budgetService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const BudgetContext = createContext();

export const useBudget = () => {
    const context = useContext(BudgetContext);
    if (!context) {
        throw new Error('useBudget must be used within a BudgetProvider');
    }
    return context;
};

export const BudgetProvider = ({ children }) => {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadBudgets = useCallback(async (month) => {
        try {
            setLoading(true);
            const response = await budgetService.getBudgets(month);
            if (response?.data?.success) {
                setBudgets(response.data.data.budgets || []);
            } else {
                setBudgets([]);
            }
        } catch (error) {
            console.error('Error loading budgets:', error);
            setBudgets([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const addBudget = useCallback(async (budgetData) => {
        try {
            const response = await budgetService.createBudget(budgetData);
            if (response?.data?.success) {
                await loadBudgets();
                toast.success('Budget added successfully');
                return { success: true };
            }
            return { success: false, error: response?.data?.message || 'Failed to add budget' };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to add budget';
            toast.error(message);
            return { success: false, error: message };
        }
    }, [loadBudgets]);

    const updateBudget = useCallback(async (id, updates) => {
        try {
            const response = await budgetService.updateBudget(id, updates);
            if (response?.data?.success) {
                await loadBudgets();
                toast.success('Budget updated successfully');
                return { success: true };
            }
            return { success: false, error: response?.data?.message || 'Failed to update budget' };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to update budget';
            toast.error(message);
            return { success: false, error: message };
        }
    }, [loadBudgets]);

    const deleteBudget = useCallback(async (id) => {
        try {
            await budgetService.deleteBudget(id);
            await loadBudgets();
            toast.success('Budget deleted successfully');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to delete budget';
            toast.error(message);
            return { success: false, error: message };
        }
    }, [loadBudgets]);

    useEffect(() => {
        if (user) {
            loadBudgets();
        }
    }, [user, loadBudgets]);

    const value = {
        budgets,
        loading,
        loadBudgets,
        addBudget,
        updateBudget,
        deleteBudget
    };

    return (
        <BudgetContext.Provider value={value}>
            {children}
        </BudgetContext.Provider>
    );
};
