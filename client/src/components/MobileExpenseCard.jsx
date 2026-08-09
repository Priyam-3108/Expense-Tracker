import { Edit, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/helpers'

/**
 * Mobile-optimised card view for a single expense row.
 * Replaces the DataTable on screens < md.
 * All props are purely display/callback — business logic stays in Expenses.jsx.
 */
const MobileExpenseCard = ({ expense, currency, onEdit, onDelete }) => {
  const category = expense.category
  const isIncome = expense.type === 'income'

  return (
    <div className="glass-card overflow-hidden active:scale-[0.99] transition-all duration-200">
      {/* Colour accent strip */}
      <div
        className="h-0.5 w-full"
        style={{ backgroundColor: category?.color || (isIncome ? '#34d399' : '#fb7185') }}
      />

      <div className="p-4">
        {/* Top row: icon + details + amount */}
        <div className="flex items-start gap-3">
          {/* Category icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{
              backgroundColor: `${category?.color || (isIncome ? '#34d399' : '#fb7185')}15`,
            }}
          >
            {category?.icon || (isIncome ? '$' : '-')}
          </div>

          {/* Middle content */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {expense.description || category?.name || 'No description'}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">
              {category?.name || 'Uncategorized'}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">
              {formatDate(expense.date, 'MMM dd, yyyy')}
            </p>
          </div>

          {/* Amount */}
          <div className="text-right shrink-0">
            <span
              className={`text-base font-bold ${
                isIncome
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isIncome ? '+' : '-'}
              {formatCurrency(expense.amount, currency)}
            </span>
            <span
              className={`block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                isIncome
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
              }`}
            >
              {isIncome ? 'Income' : 'Expense'}
            </span>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.05]">
          <button
            onClick={() => onEdit(expense)}
            aria-label="Edit expense"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl transition-all duration-200 min-h-[44px]"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={() => onDelete(expense)}
            aria-label="Delete expense"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl transition-all duration-200 min-h-[44px]"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileExpenseCard
