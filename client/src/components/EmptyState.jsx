import { Inbox } from 'lucide-react'

const EmptyState = ({ icon, title, description, actionLabel, onAction, className = '' }) => {
  const IconComponent = icon || Inbox

  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center glass-card">
        <IconComponent className="h-7 w-7 text-gray-400 dark:text-[#a1a1a6]" />
      </div>
      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-[#a1a1a6] max-w-sm mx-auto mb-5 leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary btn-md">
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
