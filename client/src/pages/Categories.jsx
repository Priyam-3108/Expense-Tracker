import { useState, useEffect } from 'react'
import { useExpense } from '../context/ExpenseContext'
import { Plus, Edit, Trash2, GripVertical, Tag } from 'lucide-react'
import EmptyState from '../components/EmptyState'
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
  const { categories, addCategory, updateCategory, deleteCategory, getCategoryStats, reorderCategories, loading, categoriesLoading } = useExpense()
  const { user, currency } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)
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
    '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#A855F7',
    '#14B8A6', '#22C55E', '#EAB308', '#F43F5E', '#0EA5E9'
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  // Drag and Drop Handlers
  const handleDragStart = (e, category) => {
    setDraggedItem(category)
    e.dataTransfer.effectAllowed = 'move'
    // Make the drag image transparent or custom if needed, but default is usually fine
    // e.dataTransfer.setDragImage(e.target, 0, 0)
  }

  const handleDragOver = (e, category) => {
    e.preventDefault()
    if (draggedItem === category) return
    setDragOverItem(category)
  }

  const handleDragLeave = (e) => {
    // Optional: clear dragOverItem if leaving the list, but tricky with grid
  }

  const handleDrop = async (e, targetCategory) => {
    e.preventDefault()

    if (!draggedItem || draggedItem._id === targetCategory._id) {
      setDragOverItem(null)
      return
    }

    const newCategories = [...categories]
    const draggedIndex = newCategories.findIndex(c => c._id === draggedItem._id)
    const targetIndex = newCategories.findIndex(c => c._id === targetCategory._id)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Remove dragged item
    newCategories.splice(draggedIndex, 1)
    // Insert at new position
    newCategories.splice(targetIndex, 0, draggedItem)

    setDragOverItem(null)
    setDraggedItem(null)

    // Call context to update state and backend
    const result = await reorderCategories(newCategories.map(c => c._id))
    if (result.success) {
      toast.success('Category order updated')
    }
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-600 dark:text-slate-500">Manage your expense categories</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 hover:scale-[1.02] transition-all duration-200 min-h-[44px] shadow-[0_0_15px_rgba(99,102,241,0.15)]"
          >
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Category Form */}
      {showForm && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 dark:border-white/[0.07] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 text-sm transition-all duration-200"
                placeholder="Enter category name"
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Icon
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`flex items-center justify-center text-xl rounded-xl border-2 min-h-[44px] transition-all duration-200 ${
                      formData.icon === icon
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                        : 'border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.15]'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <div className="grid grid-cols-8 sm:grid-cols-8 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                      formData.color === color
                        ? 'border-gray-800 dark:border-white scale-110 shadow-md shadow-current/20'
                        : 'border-gray-200 dark:border-white/[0.08] hover:border-gray-400 dark:hover:border-white/[0.20]'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={formLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] shadow-[0_0_15px_rgba(99,102,241,0.15)]"
              >
                {formLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingCategory ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  editingCategory ? 'Update Category' : 'Add Category'
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={formLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-white/[0.05] border border-gray-300 dark:border-white/[0.08] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.10] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* All Categories */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-white/[0.05]">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">All Categories</h3>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">
            Drag and drop to reorder · {categories.length} total
          </p>
        </div>
        <div className="p-3 sm:p-6">
          {categories.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No categories available"
              description="Create your first custom category to get started."
              actionLabel="Add Category"
              onAction={handleAddNew}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((category) => (
                <div
                  key={category._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, category)}
                  onDragOver={(e) => handleDragOver(e, category)}
                  onDrop={(e) => handleDrop(e, category)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-200 cursor-move ${dragOverItem?._id === category._id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.02] shadow-md'
                    : draggedItem?._id === category._id
                      ? 'opacity-50 border-dashed border-gray-400 dark:border-slate-500'
                      : 'border-gray-200 dark:border-white/[0.07] hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                      <GripVertical size={20} />
                    </div>
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">{category.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        {category.isDefault ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300">
                            Default
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                            Custom
                          </span>
                        )}
                        {category.expenseCount > 0 && (
                          <span className="text-blue-600 dark:text-blue-400 text-xs">
                            {category.expenseCount} exp.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    {!category.isDefault && (
                      <>
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all duration-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Edit category"
                          aria-label={`Edit ${category.name}`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className={`p-2 rounded-xl transition-all duration-200 min-h-[40px] min-w-[40px] flex items-center justify-center ${category.expenseCount > 0
                            ? 'text-orange-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10'
                            }`}
                          title="Delete category"
                          aria-label={`Delete ${category.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    {category.isDefault && (
                      <span className="text-xs text-gray-400 italic px-2">
                        Read-only
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Statistics */}
      {categoryStats.length > 0 && (
      <div className="glass-card overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-white/[0.05]">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Category Statistics</h3>
            <p className="text-xs text-gray-500 dark:text-slate-500">Expense breakdown by category</p>
          </div>
          <div className="p-3 sm:p-6">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {categoryStats.map((stat, index) => (
                <div key={stat._id} className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 dark:border-white/[0.07] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all duration-200">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: stat.categoryColor + '20' }}
                      >
                        {categories?.find(cat => cat._id === stat._id)?.icon || '💰'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">{stat.categoryName}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{stat.count} expense(s)</p>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {currencySymbols[currency] || '$'} {stat.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
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
