import { useState, useEffect } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { useExpense } from '../context/ExpenseContext'

const CategorySelector = ({
  value,
  onChange,
  placeholder = "Select a category",
  showCreateButton = false,
  onCreateClick = null,
  className = "",
  categories: propCategories,
  disabled = false
}) => {
  const { categories: contextCategories } = useExpense()
  const categories = propCategories || contextCategories
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const selectedCategory = categories?.find(cat => cat._id === value)

  const filteredCategories = categories?.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleSelect = (category) => {
    onChange(category._id)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleCreateClick = () => {
    setIsOpen(false)
    setSearchTerm('')
    if (onCreateClick) {
      onCreateClick()
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.category-selector')) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative category-selector ${className}`}>
      {/* Selected Category Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {selectedCategory ? (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
              style={{ backgroundColor: selectedCategory.color + '20' }}
            >
              {selectedCategory.icon}
            </div>
            <span className="text-gray-900 dark:text-white">{selectedCategory.name}</span>
          </div>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
        )}
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full z-[9999] mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search categories..."
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              autoFocus
            />
          </div>

          {/* Categories List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No categories found' : 'No categories available'}
              </div>
            ) : (
              filteredCategories.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => handleSelect(category)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 focus:bg-gray-50 dark:focus:bg-gray-600 focus:outline-none"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Create New Category Button */}
          {showCreateButton && onCreateClick && (
            <div className="border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={handleCreateClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:outline-none"
              >
                <Plus size={16} />
                Create new category
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CategorySelector
