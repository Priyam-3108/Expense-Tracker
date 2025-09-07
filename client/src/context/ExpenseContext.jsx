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
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load categories when user changes
  useEffect(() => {
    if (user) {
      loadCategories().catch(error => {
        console.error('Error in loadCategories useEffect:', error)
        setError(error.message)
      })
    }
  }, [user])

  // Load initial data
  useEffect(() => {
    if (user) {
      Promise.all([
        loadExpenses(),
        loadStats(),
        loadTrends()
      ]).catch(error => {
        console.error('Error in initial data useEffect:', error)
        setError(error.message)
      })
    }
  }, [user])

  const loadExpenses = async (filters = {}) => {
    try {
      setLoading(true)
      const response = await expenseService.getExpenses(filters)
      if (response && response.data && Array.isArray(response.data.expenses)) {
        setExpenses(response.data.expenses)
        return response.data
      } else {
        console.error('Invalid expenses response:', response)
        setExpenses([])
      }
    } catch (error) {
      console.error('Error loading expenses:', error)
      toast.error('Failed to load expenses')
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true)
      const response = await categoryService.getCategories()
      if (response && response.data && Array.isArray(response.data.categories)) {
        setCategories(response.data.categories)
      } else {
        console.error('Invalid categories response:', response)
        setCategories([])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }

  const loadStats = async (dateRange = {}) => {
    try {
      const response = await expenseService.getStats(dateRange)
      if (response && response.data) {
        setStats(response.data)
      } else {
        console.error('Invalid stats response:', response)
        setStats(null)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      setStats(null)
    }
  }

  const loadTrends = async (year = new Date().getFullYear()) => {
    try {
      const response = await expenseService.getTrends(year)
      if (response && response.data) {
        setTrends(response.data)
      } else {
        console.error('Invalid trends response:', response)
        setTrends(null)
      }
    } catch (error) {
      console.error('Error loading trends:', error)
      setTrends(null)
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
      return { success: true, category: newCategory }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add category'
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
      return { success: true, category: updatedCategory }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update category'
      return { success: false, error: message }
    }
  }

  const deleteCategory = async (id) => {
    try {
      await categoryService.deleteCategory(id)
      setCategories(prev => prev.filter(category => category._id !== id))
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete category'
      return { success: false, error: message }
    }
  }

  const getCategoryById = (id) => {
    if (!id || !Array.isArray(categories)) {
      return null
    }
    return categories.find(category => category._id === id) || null
  }

  const getCategoryStats = async (dateRange = {}) => {
    try {
      const response = await categoryService.getCategoryStats(dateRange)
      if (response && response.data && Array.isArray(response.data.stats)) {
        return response.data.stats
      } else {
        console.error('Invalid category stats response:', response)
        return []
      }
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
    categoriesLoading,
    error,
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

  // If there's an error, show it instead of crashing
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  )
}
