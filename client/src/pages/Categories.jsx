import { useState, useEffect } from 'react'
import { useExpense } from '../context/ExpenseContext'
import { Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const currencySymbols = {
  USD: '$',
  EUR: '€',
  INR: '₹',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  CAD: 'C$',
  AUD: 'A$'
}

const Categories = () => {
  const { categories, addCategory, updateCategory, deleteCategory, getCategoryStats, loadCategories, loading, categoriesLoading } = useExpense()
  const { user, currency } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    icon: '💰'
  })
  const [categoryStats, setCategoryStats] = useState([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  // Categories are already loaded by ExpenseContext, no need to load again


  const iconOptions = [
    '💰', '🍽️', '🏠', '✈️', '💳', '🛍️', '🚗', '🏥', '🎬', '📚', '⚡',
    '🍕', '☕', '🎮', '🏋️', '💄', '👕', '📱', '💻', '🎵', '🎨', '🌱'
  ]

  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
    '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
    '#F43F5E', '#A855F7', '#14B8A6', '#22C55E', '#EAB308'
  ]

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        color: editingCategory.color,
        icon: editingCategory.icon
      })
    } else {
      setFormData({
        name: '',
        color: '#3B82F6',
        icon: '💰'
      })
    }
  }, [editingCategory])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    setFormLoading(true)
    try {
      if (editingCategory) {
        // Prevent editing default categories
        if (editingCategory.isDefault) {
          toast.error('Cannot edit default categories')
          setFormLoading(false)
          return
        }
        const result = await updateCategory(editingCategory._id, formData)
        if (result.success) {
          toast.success('Category updated successfully')
          setEditingCategory(null)
          setShowForm(false)
          setFormData({ name: '', color: '#3B82F6', icon: '💰' })
        }
      } else {
        const result = await addCategory(formData)
        if (result.success) {
          toast.success('Category created successfully')
          setShowForm(false)
          setFormData({ name: '', color: '#3B82F6', icon: '💰' })
        }
      }
    } catch (error) {
      console.error('Error saving category:', error)
      const errorMessage = error.response?.data?.message || 'Failed to save category'
      toast.error(errorMessage)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (category) => {
    // Prevent editing default categories
    if (category.isDefault) {
      toast.error('Default categories cannot be edited')
      return
    }
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCategory(null)
    setFormData({ name: '', color: '#3B82F6', icon: '💰' })
  }

  const handleAddNew = () => {
    setEditingCategory(null)
    setFormData({ name: '', color: '#3B82F6', icon: '💰' })
    setShowForm(true)
  }

  const handleDelete = async (category) => {
    // Prevent deleting default categories
    if (category.isDefault) {
      toast.error('Default categories cannot be deleted')
      return
    }
    
    const hasExpenses = category.expenseCount > 0
    const confirmMessage = hasExpenses 
      ? `Are you sure you want to delete "${category.name}"? This category has ${category.expenseCount} associated expense${category.expenseCount !== 1 ? 's' : ''}. You'll need to reassign or delete those expenses first.`
      : `Are you sure you want to delete "${category.name}"? This action cannot be undone.`
    
    if (window.confirm(confirmMessage)) {
      try {
        const result = await deleteCategory(category._id)
        if (result.success) {
          toast.success('Category deleted successfully')
        }
      } catch (error) {
        console.error('Error deleting category:', error)
        const errorMessage = error.response?.data?.message || 'Failed to delete category'
        toast.error(errorMessage)
      }
    }
  }


  const userCategories = categories?.filter(cat => !cat.isDefault) || []
  const defaultUserCategories = categories?.filter(cat => cat.isDefault) || []

  // Load category statistics
  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true)
      try {
        const stats = await getCategoryStats()
        setCategoryStats(stats)
      } catch (error) {
        console.error('Error loading category stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    if (categories && categories.length > 0) {
      loadStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories?.length]) // Only reload when categories count changes, not on every categories array reference change

  // Show loading state while categories are being loaded
  if (categoriesLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-600">Manage your expense categories</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus size={16} />
            Add Category
          </button>
        </div>
      </div>
      
      {/* Add/Edit Category Form */}
      {showForm && (
      <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter category name"
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <div className="grid grid-cols-12 gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`p-2 text-lg rounded border-2 ${
                      formData.icon === icon
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="grid grid-cols-8 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color
                        ? 'border-gray-800'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingCategory ? 'Updating...' : 'Adding...'}
                  </div>
                ) : (
                  editingCategory ? 'Update Category' : 'Add Category'
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={formLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* All Categories */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Categories</h3>
          <p className="text-sm text-gray-600">
            {defaultUserCategories.length} default categories • {userCategories.length} custom categories
          </p>
        </div>
        <div className="p-6">
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <Plus size={24} />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories available</h3>
              <p className="text-gray-600 mb-4">Create your first custom category to get started</p>
              <button
                onClick={handleAddNew}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus size={16} />
                Add Category
              </button>
            </div>
          ) : (
            <>
              {/* Default Categories Section */}
              {defaultUserCategories.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Default Categories
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {defaultUserCategories.map((category) => (
                      <div
                        key={category._id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                            style={{ backgroundColor: category.color + '20' }}
                          >
                            {category.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{category.name}</h4>
                            <p className="text-sm text-gray-500">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                Default
                              </span>
                              {category.expenseCount > 0 && (
                                <span className="text-blue-600">
                                  {category.expenseCount} expense{category.expenseCount !== 1 ? 's' : ''}
                                </span>
                              )}
                              {category.expenseCount === 0 && (
                                <span className="text-gray-400">No expenses</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">
                            Read-only
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* User Categories Section */}
              {userCategories.length > 0 && (
                <div className={defaultUserCategories.length > 0 ? 'mt-6 pt-6 border-t border-gray-200' : ''}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Your Custom Categories
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userCategories.map((category) => (
                      <div
                        key={category._id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                            style={{ backgroundColor: category.color + '20' }}
                          >
                            {category.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{category.name}</h4>
                            <p className="text-sm text-gray-500">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                                Custom
                              </span>
                              {category.expenseCount > 0 && (
                                <span className="text-blue-600">
                                  {category.expenseCount} expense{category.expenseCount !== 1 ? 's' : ''}
                                </span>
                              )}
                              {category.expenseCount === 0 && (
                                <span className="text-gray-400">No expenses</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit category"
                            aria-label="Edit category"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className={`p-2 rounded transition-colors ${
                              category.expenseCount > 0 
                                ? 'text-orange-400 hover:text-orange-600 hover:bg-orange-50' 
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={
                              category.expenseCount > 0 
                                ? `Delete category (has ${category.expenseCount} expense${category.expenseCount !== 1 ? 's' : ''})`
                                : 'Delete category'
                            }
                            aria-label="Delete category"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show message if no categories at all */}
              {defaultUserCategories.length === 0 && userCategories.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Plus size={24} />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No categories available</h3>
                  <p className="text-gray-600 mb-4">Categories should be created automatically. If you see this message, please refresh the page.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Category Statistics */}
      {categoryStats.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Category Statistics</h3>
            <p className="text-sm text-gray-600">Expense breakdown by category</p>
          </div>
          <div className="p-6">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {categoryStats.map((stat, index) => (
                  <div key={stat._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: stat.categoryColor + '20' }}
                      >
                        {categories?.find(cat => cat._id === stat._id)?.icon || '💰'}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{stat.categoryName}</h4>
                        <p className="text-sm text-gray-500">{stat.count} expense(s)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                      {currencySymbols[currency] || '$'} {stat.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {((stat.totalAmount / categoryStats.reduce((sum, s) => sum + s.totalAmount, 0)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </div>
        </div>
      )}

    </div>
  )
}

export default Categories
