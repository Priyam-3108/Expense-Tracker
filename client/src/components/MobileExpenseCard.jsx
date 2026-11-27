import { Edit, Trash2 } from 'lucide-react'
import Amount from './Amount'
import { CategoryTile } from './CategoryIcon'

/**
 * One ledger row for screens < md. Tapping it reveals Edit and Delete in place,
 * so the list stays a calm column of entries instead of a stack of buttons.
 */
const MobileExpenseCard = ({ expense, currency, open, onToggle, onEdit, onDelete }) => {
  const category = expense.category
  const isIncome = expense.type === 'income'
  const title = expense.description || category?.name || 'No description'

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`w-full flex items-center gap-3 px-4 min-h-[60px] py-2 text-left transition-colors active:bg-gray-50 dark:active:bg-white/[0.04] ${open ? 'bg-gray-50 dark:bg-white/[0.03]' : ''}`}
      >
        <CategoryTile size="sm" icon={category?.icon} />
        <span className="flex-1 min-w-0">
          <span className="block text-sm text-gray-900 dark:text-[#ededed] truncate">{title}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#85858b] truncate">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: category?.color || '#a3a3a3' }} />
            {category?.name || 'Uncategorized'}
          </span>
        </span>
        <Amount
          value={expense.amount}
          currency={currency}
          sign={isIncome ? '+' : '−'}
          className={`shrink-0 text-sm font-medium tabular-nums ${isIncome ? 'text-green-600 dark:text-[#4cc38a]' : 'text-gray-900 dark:text-[#ededed]'}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-3 pt-1 bg-gray-50 dark:bg-white/[0.03] animate-fade-in">
          {expense.notes && (
            <p className="pl-11 mb-3 text-xs leading-5 text-gray-500 dark:text-[#a1a1a6]">{expense.notes}</p>
          )}
          <div className="pl-11 flex gap-2">
            <button type="button" onClick={() => onEdit(expense)} className="btn-secondary btn-sm flex-1">
              <Edit size={16} strokeWidth={1.5} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(expense)}
              className="btn-sm flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/[0.1] text-red-600 dark:text-[#e5484d] hover:bg-red-50 dark:hover:bg-[#e5484d]/10 transition-colors"
            >
              <Trash2 size={16} strokeWidth={1.5} />
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

export default MobileExpenseCard
