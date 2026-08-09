import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Plus, X } from 'lucide-react'
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, ready: false, width: 0 })
  const wrapperRef = useRef(null)
  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)

  const selectedCategory = categories?.find(cat => cat._id === value)

  const filteredCategories = categories?.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideWrapper = wrapperRef.current && !wrapperRef.current.contains(event.target)
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target)

      // Don't close if they are clicking a portal element we care about
      if (isOutsideWrapper && isOutsideDropdown) {
        setIsOpen(false)
        setSearchTerm('')
        setDropdownPosition({ top: 0, left: 0, ready: false, width: 0 })
      }
    }

    if (isOpen) {
      const handleScroll = (event) => {
        // Ignore scroll if it's inside the dropdown
        if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
          return
        }
        setIsOpen(false)
      }

      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('resize', () => setIsOpen(false))
      window.addEventListener('scroll', handleScroll, true)

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('resize', () => setIsOpen(false))
        window.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [isOpen])

  const handleToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isOpen && buttonRef.current && !disabled) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = 320 // max height of dropdown

      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      const shouldPositionAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

      let top = shouldPositionAbove
        ? rect.top - dropdownHeight - 8
        : rect.bottom + 8

      if (top < 8) top = 8
      if (top + dropdownHeight > viewportHeight - 8) {
        top = viewportHeight - dropdownHeight - 8
      }

      setDropdownPosition({
        top: top,
        left: rect.left,
        width: rect.width,
        ready: true
      })

      setTimeout(() => {
        setIsOpen(true)
      }, 0)
    } else {
      setIsOpen(false)
      setSearchTerm('')
      setDropdownPosition({ top: 0, left: 0, ready: false, width: 0 })
    }
  }

  const handleSelect = (category) => {
    onChange(category._id)
    setIsOpen(false)
    setSearchTerm('')
    setDropdownPosition({ top: 0, left: 0, ready: false, width: 0 })
  }

  const handleCreateClick = () => {
    setIsOpen(false)
    setSearchTerm('')
    setDropdownPosition({ top: 0, left: 0, ready: false, width: 0 })
    if (onCreateClick) {
      onCreateClick()
    }
  }

  const dropdownContent = (
    <div
      className="w-full flex flex-col h-full md:h-auto bg-white dark:bg-transparent"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Mobile drag handle */}
      <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/[0.15] rounded-full" />
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/[0.06] md:hidden flex-shrink-0">
        <h3 className="font-medium text-gray-900 dark:text-white">Select Category</h3>
        <button
          onClick={() => {
            setIsOpen(false)
            setSearchTerm('')
          }}
          className="text-gray-500 dark:text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center p-2 mb-[-8px] mt-[-8px] hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 md:p-2 border-b border-gray-200 dark:border-white/[0.06] flex-shrink-0">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search categories..."
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 min-h-[44px] transition-all duration-200"
          autoFocus={window.innerWidth >= 768} // Only autofocus on desktop to prevent mobile keyboard pushing sheet
        />
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto min-h-0 md:max-h-60 custom-scrollbar overscroll-contain">
        {filteredCategories.length === 0 ? (
          <div className="px-4 py-6 md:px-3 md:py-2 text-sm text-gray-500 dark:text-slate-500 text-center">
            {searchTerm ? 'No categories found' : 'No categories available'}
          </div>
        ) : (
          filteredCategories.map((category) => (
            <button
              key={category._id}
              type="button"
              onClick={() => handleSelect(category)}
              className="w-full flex items-center gap-3 px-4 py-3 md:px-3 md:py-2 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] focus:bg-gray-50 dark:focus:bg-white/[0.04] focus:outline-none transition-all duration-200 min-h-[44px]"
            >
              <div
                className="w-8 h-8 md:w-6 md:h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ backgroundColor: category.color + '20' }}
              >
                {category.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base md:text-sm font-medium text-gray-900 dark:text-white truncate">
                  {category.name}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Create New Category Button */}
      {showCreateButton && onCreateClick && (
        <div className="border-t border-gray-200 dark:border-white/[0.06] flex-shrink-0 p-2 md:p-0">
          <button
            type="button"
            onClick={handleCreateClick}
            className="w-full flex items-center justify-center md:justify-start gap-2 px-4 py-3 md:px-3 md:py-2 text-sm font-medium md:font-normal text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 focus:bg-indigo-50 dark:focus:bg-indigo-500/10 focus:outline-none min-h-[44px] rounded-xl md:rounded-none transition-all duration-200"
          >
            <Plus size={18} className="md:w-4 md:h-4" />
            Create new category
          </button>
        </div>
      )}
    </div>
  )

  const portalContent = typeof window !== 'undefined' ? (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-[9998] md:hidden transition-opacity glass-modal-backdrop"
        style={{ opacity: isOpen ? 1 : 0 }}
        onClick={() => {
          setIsOpen(false)
          setSearchTerm('')
        }}
      />

      {/* Dropdown Container */}
      <div
        ref={dropdownRef}
        className={`
          fixed z-[9999] overflow-hidden
          bg-white dark:bg-slate-900/90 dark:backdrop-blur-xl dark:border dark:border-white/[0.08]
          ${/* Mobile: Bottom sheet */ ''}
          bottom-0 left-0 right-0 rounded-t-2xl transition-transform duration-300 ease-out origin-bottom shadow-xl dark:shadow-[0_-8px_40px_rgba(0,0,0,0.4)]
          ${isOpen ? 'translate-y-0 h-[65vh] max-h-[85vh]' : 'translate-y-full'}
          
          ${/* Desktop: Absolute popover */ ''}
          md:bottom-auto md:left-auto md:right-auto md:rounded-xl md:border md:border-gray-300 md:dark:border-white/[0.08] md:transition-none md:translate-y-0 md:h-auto md:shadow-xl md:dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)]
        `}
        style={window.innerWidth >= 768 ? {
          top: dropdownPosition.ready ? `${dropdownPosition.top}px` : '-9999px',
          left: dropdownPosition.ready ? `${dropdownPosition.left}px` : '-9999px',
          width: dropdownPosition.ready ? `${dropdownPosition.width}px` : 'auto',
          visibility: dropdownPosition.ready && isOpen ? 'visible' : 'hidden',
          opacity: dropdownPosition.ready && isOpen ? 1 : 0
        } : {
          height: '65vh' // Mobile explicitly height
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {dropdownContent}
      </div>
    </>
  ) : null

  return (
    <div ref={wrapperRef} className={`relative category-selector w-full ${className}`}>
      {/* Selected Category Display */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 min-h-[44px] transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-white/[0.15]'}`}
      >
        {selectedCategory ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: selectedCategory.color + '20' }}
            >
              {selectedCategory.icon}
            </div>
            <span className="text-gray-900 dark:text-white truncate">{selectedCategory.name}</span>
          </div>
        ) : (
          <span className="text-gray-500 dark:text-slate-500 truncate">{placeholder}</span>
        )}
        <ChevronDown
          size={16}
          className={`text-gray-400 dark:text-slate-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && createPortal(portalContent, document.body)}
    </div>
  )
}

export default CategorySelector

