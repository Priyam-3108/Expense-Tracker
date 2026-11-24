import { useExpense } from '../context/ExpenseContext'

const CategoryBadge = ({ 
  categoryId, 
  showIcon = true, 
  showName = true,
  size = 'md',
  className = ""
}) => {
  const { getCategoryById } = useExpense()
  const category = getCategoryById(categoryId)

  if (!category) {
    return (
      <span className={`inline-flex items-center text-xs text-gray-500 dark:text-[#85858b] ${className}`}>
        Unknown category
      </span>
    )
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <span className={`inline-flex items-center gap-2 text-gray-700 dark:text-[#a1a1a6] ${sizeClasses[size]} ${className}`}>
      {showIcon && (
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
      )}
      {showName && (
        <span>{category.name}</span>
      )}
    </span>
  )
}

export default CategoryBadge
