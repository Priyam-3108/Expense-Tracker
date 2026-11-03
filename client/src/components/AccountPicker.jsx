// client/src/components/AccountPicker.jsx
import { getAccountType } from '../constants/accountTypes'

export default function AccountPicker({ value, onChange, accounts = [], allowAll = false }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {allowAll && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={`px-3.5 py-2 rounded-full border-[1.5px] text-sm font-medium min-h-[40px] whitespace-nowrap ${
            value === ''
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-400'
              : 'border-gray-300 dark:border-white/[0.15] text-gray-700 dark:text-slate-300'
          }`}
        >
          All
        </button>
      )}
      {accounts.map((a) => {
        const selected = a._id === value
        const { Icon } = getAccountType(a.type)
        return (
          <button
            key={a._id}
            type="button"
            onClick={() => onChange(a._id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border-[1.5px] text-sm font-medium min-h-[40px] whitespace-nowrap ${
              selected
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-400'
                : 'border-gray-300 dark:border-white/[0.15] text-gray-700 dark:text-slate-300'
            }`}
          >
            <Icon size={15} />
            {a.name}
          </button>
        )
      })}
    </div>
  )
}
