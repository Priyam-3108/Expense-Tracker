import { useState, useEffect } from 'react'
import { useExpense } from '../context/ExpenseContext'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const Categories = () => {
  const { categories, addCategory, updateCategory, deleteCategory, createDefaultCategories, getCategoryStats, loading, categoriesLoading } = useExpense()
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    icon: '💰'
  })
  const [showDefaultCategories, setShowDefaultCategories] = useState(true)
  const [categoryStats, setCategoryStats] = useState([])
  const [statsLoading, setStatsLoading] = useState(false)

  // Default categories that will be created for new users
  const defaultCategories = [
    { name: 'Meal', color: '#EF4444', icon: '🍽️' },
    { name: 'House Rent', color: '#10B981', icon: '🏠' },
    { name: 'Travel', color: '#3B82F6', icon: '✈️' },
    { name: 'Loan', color: '#F59E0B', icon: '💳' },
    { name: 'Shopping', color: '#8B5CF6', icon: '🛍️' },
    { name: 'Transportation', color: '#06B6D4', icon: '🚗' },
    { name: 'Healthcare', color: '#EC4899', icon: '🏥' },
    { name: 'Entertainment', color: '#F97316', icon: '🎬' },
    { name: 'Education', color: '#84CC16', icon: '📚' },
    { name: 'Utilities', color: '#6366F1', icon: '⚡' }
  ]

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

    try {
      if (editingCategory) {
        await updateCategory(editingCategory._id, formData)
        setEditingCategory(null)
      } else {
        await addCategory(formData)
      }
      
      setShowForm(false)
      setFormData({ name: '', color: '#3B82F6', icon: '💰' })
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleDelete = async (category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await deleteCategory(category._id)
      } catch (error) {
        console.error('Error deleting category:', error)
      }
    }
  }

  const handleCreateDefaultCategories = async () => {
    try {
      await createDefaultCategories()
    } catch (error) {
      console.error('Error creating default categories:', error)
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
  }, [categories, getCategoryStats])

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
            onClick={() => setShowDefaultCategories(!showDefaultCategories)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showDefaultCategories ? <EyeOff size={16} /> : <Eye size={16} />}
            {showDefaultCategories ? 'Hide' : 'Show'} Defaults
          </button>
          <button
            onClick={handleCreateDefaultCategories}
            className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Create Defaults
          </button>
          <button
            onClick={() => setShowForm(true)}
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingCategory(null)
                  setFormData({ name: '', color: '#3B82F6', icon: '💰' })
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Default Categories */}
      {showDefaultCategories && defaultUserCategories.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Default Categories</h3>
            <p className="text-sm text-gray-600">Pre-defined categories for common expenses</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultUserCategories.map((category) => (
                <div
                  key={category._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-500">Default category</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Edit category"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Categories */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Categories</h3>
          <p className="text-sm text-gray-600">Custom categories you've created</p>
        </div>
        <div className="p-6">
          {userCategories.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <Plus size={24} />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No custom categories yet</h3>
              <p className="text-gray-600 mb-4">Create your first custom category to get started</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus size={16} />
                Add Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userCategories.map((category) => (
                <div
                  key={category._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-500">Custom category</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Edit category"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                        ${stat.totalAmount.toFixed(2)}
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
