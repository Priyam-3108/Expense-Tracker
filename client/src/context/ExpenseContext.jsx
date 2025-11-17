import { createContext, useContext, useState, useEffect, useCallback } from 'react'
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

  const loadExpenses = useCallback(async (filters = {}) => {
    try {
      setLoading(true)
      const response = await expenseService.getExpenses(filters)
      if (response && response.data && response.data.success && response.data.data && Array.isArray(response.data.data.expenses)) {
        setExpenses(response.data.data.expenses)
        return response.data.data
      } else if (response && response.data && Array.isArray(response.data.expenses)) {
        setExpenses(response.data.expenses)
        return response.data
      } else {
        const errorMsg = response?.data?.message || 'Invalid response format from server'
        toast.error(errorMsg)
        console.error('Invalid expenses response:', response)
        setExpenses([])
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load expenses. Please try again.'
      toast.error(errorMessage)
      console.error('Error loading expenses:', error)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true)
      const response = await categoryService.getCategories()
      // Backend returns: { success: true, data: { categories: [...] } }
      // Axios wraps it: response.data = { success: true, data: { categories: [...] } }
      if (response && response.data && response.data.success && response.data.data && Array.isArray(response.data.data.categories)) {
        setCategories(response.data.data.categories)
      } else {
        // Try alternative structure in case response is flattened
        if (response && response.data && Array.isArray(response.data.categories)) {
          setCategories(response.data.categories)
        } else {
          const errorMsg = response?.data?.message || 'Invalid response format from server'
          toast.error(errorMsg)
          console.error('Invalid categories response:', response)
          setCategories([])
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load categories. Please try again.'
      toast.error(errorMessage)
      console.error('Error loading categories:', error)
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  const loadStats = useCallback(async (dateRange = {}) => {
    try {
      const response = await expenseService.getStats(dateRange)
      if (response && response.data && response.data.success && response.data.data) {
        setStats(response.data.data)
      } else if (response && response.data) {
        setStats(response.data)
      } else {
        const errorMsg = response?.data?.message || 'Invalid response format from server'
        toast.error(errorMsg)
        console.error('Invalid stats response:', response)
        setStats(null)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load statistics. Please try again.'
      toast.error(errorMessage)
      console.error('Error loading stats:', error)
      setStats(null)
    }
  }, [])

  const loadTrends = useCallback(async (year = new Date().getFullYear()) => {
    try {
      const response = await expenseService.getTrends(year)
      if (response && response.data && response.data.success && response.data.data) {
        setTrends(response.data.data)
      } else if (response && response.data) {
        setTrends(response.data)
      } else {
        const errorMsg = response?.data?.message || 'Invalid response format from server'
        toast.error(errorMsg)
        console.error('Invalid trends response:', response)
        setTrends(null)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load trends. Please try again.'
      toast.error(errorMessage)
      console.error('Error loading trends:', error)
      setTrends(null)
    }
  }, [])

  const addExpense = useCallback(async (expenseData) => {
    try {
      const response = await expenseService.createExpense(expenseData)
      const createdExpenses = response.data?.data?.expenses
      const newExpense = response.data?.data?.expense || response.data?.expense

      if (Array.isArray(createdExpenses) && createdExpenses.length > 0) {
        await loadExpenses()
        await loadStats()
        await loadTrends()
        toast.success('Recurring expenses created successfully')
        return { success: true, expenses: createdExpenses }
      }

      if (!newExpense) {
        const errorMsg = response?.data?.message || 'Failed to create expense'
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }
      await loadExpenses()
      await loadStats()
      await loadTrends()
      toast.success('Expense added successfully')
      return { success: true, expense: newExpense }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to add expense. Please try again.'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [loadExpenses, loadStats, loadTrends])

  const updateExpense = useCallback(async (id, updates) => {
    try {
      const response = await expenseService.updateExpense(id, updates)
      const updatedExpense = response.data?.data?.expense || response.data?.expense
      if (!updatedExpense) {
        const errorMsg = response?.data?.message || 'Failed to update expense'
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }
      await loadExpenses()
      await loadStats()
      await loadTrends()
      toast.success('Expense updated successfully')
      return { success: true, expense: updatedExpense }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update expense. Please try again.'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [loadExpenses, loadStats, loadTrends])

  const deleteExpense = useCallback(async (id) => {
    try {
      await expenseService.deleteExpense(id)
      await loadExpenses()
      await loadStats()
      await loadTrends()
      toast.success('Expense deleted successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete expense'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [loadExpenses, loadStats, loadTrends])

  const addCategory = useCallback(async (categoryData) => {
    try {
      const response = await categoryService.createCategory(categoryData)
      // Backend returns: { success: true, data: { category: {...} } }
      const newCategory = response.data?.data?.category || response.data?.category
      if (!newCategory) {
        const errorMsg = response?.data?.message || 'Failed to create category'
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }
      // Reload categories to get updated expense counts
      await loadCategories()
      return { success: true, category: newCategory }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to add category. Please try again.'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [loadCategories])


  const updateCategory = useCallback(async (id, updates) => {
    try {
      const response = await categoryService.updateCategory(id, updates)
      // Backend returns: { success: true, data: { category: {...} } }
      const updatedCategory = response.data?.data?.category || response.data?.category
      if (!updatedCategory) {
        const errorMsg = response?.data?.message || 'Failed to update category'
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }
      // Reload categories to get updated expense counts
      await loadCategories()
      return { success: true, category: updatedCategory }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update category. Please try again.'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [loadCategories])

  const deleteCategory = useCallback(async (id) => {
    try {
      const response = await categoryService.deleteCategory(id)
      // Check if deletion was successful
      if (response?.data?.success === false) {
        const errorMsg = response?.data?.message || 'Failed to delete category'
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }
      // Reload categories to get updated expense counts
      await loadCategories()
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete category. Please try again.'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [loadCategories])

  const getCategoryById = (id) => {
    if (!id || !Array.isArray(categories)) {
      return null
    }
    return categories.find(category => category._id === id) || null
  }

  const getCategoryStats = async (dateRange = {}) => {
    try {
      const response = await categoryService.getCategoryStats(dateRange)
      // Backend returns: { success: true, data: { stats: [...] } }
      if (response && response.data && response.data.success && response.data.data && Array.isArray(response.data.data.stats)) {
        return response.data.data.stats
      } else if (response && response.data && Array.isArray(response.data.stats)) {
        // Try alternative structure
        return response.data.stats
      } else {
        const errorMsg = response?.data?.message || 'Invalid response format from server'
        toast.error(errorMsg)
        console.error('Invalid category stats response:', response)
        return []
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load category statistics. Please try again.'
      toast.error(errorMessage)
      console.error('Error loading category stats:', error)
      return []
    }
  }

  // Load categories when user changes
  useEffect(() => {
    if (user) {
      loadCategories().catch(error => {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load categories'
        toast.error(errorMessage)
        console.error('Error in loadCategories useEffect:', error)
        setError(error.message)
      })
    }
  }, [user, loadCategories])

  // Load initial data
  useEffect(() => {
    if (user) {
      Promise.all([
        loadExpenses(),
        loadStats(),
        loadTrends()
      ]).catch(error => {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load initial data'
        toast.error(errorMessage)
        console.error('Error in initial data useEffect:', error)
        setError(error.message)
      })
    }
  }, [user, loadExpenses, loadStats, loadTrends])

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
