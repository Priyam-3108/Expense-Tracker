// client/src/components/form/CategoryChips.jsx
import { Check, Plus } from 'lucide-react'

export default function CategoryChips({ categories = [], value, onChange, onCreateClick }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((cat) => {
        const selected = cat._id === value
        const color = cat.color || '#6366f1'
        return (
          <button
            key={cat._id}
            type="button"
            onClick={() => onChange(cat._id)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full border-[1.5px] whitespace-nowrap text-sm font-medium min-h-[40px] transition-all duration-200"
            style={{
              borderColor: selected ? color : undefined,
              backgroundColor: selected ? color + '20' : undefined,
              color: selected ? color : undefined,
            }}
          >
            <span
              className={`w-2 h-2 rounded-full ${selected ? '' : 'opacity-80'}`}
              style={{ backgroundColor: color }}
            />
            <span className={selected ? '' : 'text-gray-700 dark:text-slate-300'}>{cat.name}</span>
            {selected && <Check size={14} />}
          </button>
        )
      })}

      {onCreateClick && (
        <button
          type="button"
          onClick={onCreateClick}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[1.5px] border-dashed border-gray-300 dark:border-white/[0.15] text-sm font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap min-h-[40px]"
        >
          <Plus size={14} />
          New
        </button>
      )}
    </div>
  )
}
