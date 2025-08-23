import { createContext, useContext, useState, useEffect } from 'react'
import { expenseService } from '../services/expenseService'
import { categoryService } from '../services/categoryService'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const ExpenseContext = createContext()

export const useExpense = () => {
  const context = useContext(ExpenseContext)
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider')
  }
  return context
}

export const ExpenseProvider = ({ children }) => {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState(null)
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load categories when user changes
  useEffect(() => {
    if (user) {
      loadCategories()
    }
  }, [user])

  // Load initial data
  useEffect(() => {
    if (user) {
      loadExpenses()
      loadStats()
      loadTrends()
    }
  }, [user])

  const loadExpenses = async (filters = {}) => {
    try {
      setLoading(true)
      const response = await expenseService.getExpenses(filters)
      setExpenses(response.data.expenses)
      return response.data
    } catch (error) {
      console.error('Error loading expenses:', error)
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories()
      setCategories(response.data.categories)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const loadStats = async (dateRange = {}) => {
    try {
      const response = await expenseService.getStats(dateRange)
      setStats(response.data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadTrends = async (year = new Date().getFullYear()) => {
    try {
      const response = await expenseService.getTrends(year)
      setTrends(response.data)
    } catch (error) {
      console.error('Error loading trends:', error)
    }
  }

  const addExpense = async (expenseData) => {
    try {
      const response = await expenseService.createExpense(expenseData)
      const newExpense = response.data.expense
      setExpenses(prev => [newExpense, ...prev])
      await loadStats()
      await loadTrends()
      toast.success('Expense added successfully')
      return { success: true, expense: newExpense }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add expense'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const updateExpense = async (id, updates) => {
    try {
      const response = await expenseService.updateExpense(id, updates)
      const updatedExpense = response.data.expense
      setExpenses(prev => 
        prev.map(expense => 
          expense._id === id ? updatedExpense : expense
        )
      )
      await loadStats()
      await loadTrends()
      toast.success('Expense updated successfully')
      return { success: true, expense: updatedExpense }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update expense'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const deleteExpense = async (id) => {
    try {
      await expenseService.deleteExpense(id)
      setExpenses(prev => prev.filter(expense => expense._id !== id))
      await loadStats()
      await loadTrends()
      toast.success('Expense deleted successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete expense'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const addCategory = async (categoryData) => {
    try {
      const response = await categoryService.createCategory(categoryData)
      const newCategory = response.data.category
      setCategories(prev => [...prev, newCategory])
      toast.success('Category added successfully')
      return { success: true, category: newCategory }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add category'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const updateCategory = async (id, updates) => {
    try {
      const response = await categoryService.updateCategory(id, updates)
      const updatedCategory = response.data.category
      setCategories(prev => 
        prev.map(category => 
          category._id === id ? updatedCategory : category
        )
      )
      toast.success('Category updated successfully')
      return { success: true, category: updatedCategory }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update category'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const deleteCategory = async (id) => {
    try {
      await categoryService.deleteCategory(id)
      setCategories(prev => prev.filter(category => category._id !== id))
      toast.success('Category deleted successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete category'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const getCategoryById = (id) => {
    return categories.find(category => category._id === id)
  }

  const getCategoryStats = async (dateRange = {}) => {
    try {
      const response = await categoryService.getCategoryStats(dateRange)
      return response.data.stats
    } catch (error) {
      console.error('Error loading category stats:', error)
      return []
    }
  }

  const value = {
    expenses,
    categories,
    stats,
    trends,
    loading,
    loadExpenses,
    loadCategories,
    loadStats,
    loadTrends,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoryStats
  }

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  )
}
