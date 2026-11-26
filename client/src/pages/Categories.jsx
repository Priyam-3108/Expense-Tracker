import { useState, useEffect } from 'react'
import { useExpense } from '../context/ExpenseContext'
import { Plus, Edit, Trash2, GripVertical, Tag } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import SectionLabel from '../components/form/SectionLabel'
import FieldCard from '../components/form/FieldCard'
import StickyFormFooter from '../components/form/StickyFormFooter'
import Amount from '../components/Amount'
import CategoryIcon, { CategoryTile } from '../components/CategoryIcon'

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brass-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-medium text-gray-900 dark:text-[#ededed]">Categories</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#a1a1a6]">How your entries are grouped in lists, charts and exports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddNew}
            className="btn-primary btn-md"
          >
            <Plus size={16} strokeWidth={1.5} />
            <span>Add category</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Category Form */}
      <Modal
        isOpen={showForm}
        onClose={handleCancel}
        title={editingCategory ? 'Edit category' : 'New category'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Preview */}
            <div className="flex justify-center">
              <div className="flex items-center gap-3 h-12 px-4 rounded-xl border border-gray-200 dark:border-white/[0.08]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: formData.color }} />
                <CategoryIcon icon={formData.icon} size={18} className="text-gray-600 dark:text-[#a1a1a6]" />
                <span className="text-sm text-gray-900 dark:text-[#ededed]">{formData.name || 'Category name'}</span>
              </div>
            </div>

            <div>
              <SectionLabel>Category name</SectionLabel>
              <FieldCard className="p-4">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
                  placeholder="Groceries"
                  maxLength={30}
                />
              </FieldCard>
            </div>

            <div>
              <SectionLabel>Icon</SectionLabel>
              <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    aria-label={`Icon ${icon}`}
                    aria-pressed={formData.icon === icon}
                    className={`flex items-center justify-center rounded-lg border min-h-[44px] transition-colors ${
                      formData.icon === icon
                        ? 'border-gray-900 dark:border-[#ededed] bg-gray-100 dark:bg-[#232325] text-gray-900 dark:text-[#ededed]'
                        : 'border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-[#a1a1a6] hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <CategoryIcon icon={icon} size={18} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Color</SectionLabel>
              <div className="grid grid-cols-8 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-full border-2 transition-colors ${
                      formData.color === color
                        ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-[#ededed] ring-offset-white dark:ring-offset-[#19191b] border-transparent'
                        : 'border-gray-200 dark:border-white/[0.08] hover:border-gray-400 dark:hover:border-white/[0.20]'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <StickyFormFooter
            loading={formLoading}
            label={editingCategory ? 'Save changes' : 'Add category'}
            loadingLabel={editingCategory ? 'Updating…' : 'Adding…'}
            onCancel={handleCancel}
          />
        </form>
      </Modal>

      {/* All categories */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-white/[0.05]">
          <h2 className="text-base font-medium text-gray-900 dark:text-[#ededed]">All categories</h2>
          <p className="text-xs text-gray-500 dark:text-[#85858b] mt-1">
            {categories.length} categories · drag to reorder
          </p>
        </div>
        <div className="p-3 sm:p-6">
          {categories.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No categories yet"
              description="Add a category to start grouping your entries."
              actionLabel="Add category"
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
                  className={`flex items-center justify-between h-16 pl-2 pr-3 border rounded-xl transition-colors cursor-move ${dragOverItem?._id === category._id
                    ? 'border-brass bg-brass-50 dark:bg-brass-500/10'
                    : draggedItem?._id === category._id
                      ? 'opacity-50 border-dashed border-gray-400 dark:border-white/[0.2]'
                      : 'border-gray-200 dark:border-white/[0.07] hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                    }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-gray-300 dark:text-[#5a5a5f] cursor-grab active:cursor-grabbing">
                      <GripVertical size={16} strokeWidth={1.5} />
                    </div>
                    <CategoryTile icon={category.icon} />
                    <div className="flex-1 min-w-0">
                      <h3 className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-[#ededed]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                        <span className="truncate">{category.name}</span>
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-[#85858b]">
                        {category.isDefault ? 'Default' : 'Custom'}
                        {category.expenseCount > 0 && <> · <span className="tabular-nums">{category.expenseCount}</span> {category.expenseCount === 1 ? 'entry' : 'entries'}</>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    {!category.isDefault && (
                      <>
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-gray-400 dark:text-[#85858b] hover:text-gray-900 dark:hover:text-[#ededed] hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Edit category"
                          aria-label={`Edit ${category.name}`}
                        >
                          <Edit size={16} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-400 dark:text-[#85858b] hover:text-red-600 dark:hover:text-[#e5484d] hover:bg-red-50 dark:hover:bg-[#e5484d]/10"
                          title="Delete category"
                          aria-label={`Delete ${category.name}`}
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category statistics */}
      {categoryStats.length > 0 && (
      <div className="glass-card overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-white/[0.05]">
            <h2 className="text-base font-medium text-gray-900 dark:text-[#ededed]">Where the money went</h2>
            <p className="text-xs text-gray-500 dark:text-[#85858b] mt-1">Share of all expenses, by category</p>
          </div>
          <div className="px-4 sm:px-6 py-2">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brass"></div>
              </div>
            ) : (
              <ol className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {(() => {
                  const total = categoryStats.reduce((sum, s) => sum + s.totalAmount, 0) || 1
                  const top = Math.max(...categoryStats.map(s => s.totalAmount)) || 1
                  return categoryStats.map((stat, index) => (
                    <li key={stat._id} className="py-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3">
                      <CategoryTile size="sm" icon={categories?.find(cat => cat._id === stat._id)?.icon} />
                      <div className="min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-sm text-gray-900 dark:text-[#ededed] truncate">{stat.categoryName}</span>
                          <span className="font-mono text-xs text-gray-500 dark:text-[#85858b] tabular-nums">{((stat.totalAmount / total) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="mt-2 h-1 rounded-full bg-gray-100 dark:bg-white/[0.06]">
                          <div
                            className={`h-1 rounded-full ${index === 0 ? 'bg-brass' : 'bg-gray-400 dark:bg-[#5a5a5f]'}`}
                            style={{ width: `${(stat.totalAmount / top) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-32 text-right">
                        <div className="text-sm text-gray-900 dark:text-[#ededed] tabular-nums">
                          <Amount value={stat.totalAmount} currency={currency} />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-[#85858b] tabular-nums">{stat.count} {stat.count === 1 ? 'entry' : 'entries'}</div>
                      </div>
                    </li>
                  ))
                })()}
              </ol>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default Categories
