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
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ${className}`}>
        Unknown Category
      </span>
    )
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  }

  const iconSizes = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base'
  }

  return (
    <span 
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${className}`}
      style={{ 
        backgroundColor: category.color + '20',
        color: category.color 
      }}
    >
      {showIcon && (
        <span className={iconSizes[size]}>
          {category.icon}
        </span>
      )}
      {showName && (
        <span>{category.name}</span>
      )}
    </span>
  )
}

export default CategoryBadge
