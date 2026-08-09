import { Inbox } from 'lucide-react'

const EmptyState = ({ icon, title, description, actionLabel, onAction, className = '' }) => {
  const IconComponent = icon || Inbox

  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center glass-card">
        <IconComponent className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">{description}</p>
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
